// A local stand-in for Cloudflare's /tokens/verify and R2's S3 endpoint, so
// scripts/r2-s3 and the publish path can be tested without a network or a
// token. It is TEST APPARATUS: it models what S3 specifies and what we expect of
// R2 (bucket-scoped tokens refused with 403, SigV4, payload-hash checks,
// NoSuchKey/NoSuchBucket). Green here is not green on R2: the real-R2 probe of
// tasks/r2-bucket-scoped-publish is what measures R2 itself.
//   node scripts/r2-s3-mock.cjs PORT TOKEN SCOPED_BUCKET[,BUCKET...] [MODE]
// PORT 0 picks a free port; the first line printed is "mock-r2 listening PORT".
// MODE: honest (default) | leaky (every bucket in scope) | nohash (payload hash
// not checked) | anysig (any signature accepted) | corruptget (GET returns the
// stored bytes with the last one flipped: a read-back that differs from what
// was put). The last four exist to sabotage-test the gates that use this mock.
// Verifies SigV4 with secret = sha256(TOKEN) and key id "tokid" + 27 hex of it.
// An in-scope bucket whose name starts with "missing-" does not exist: every
// request to it answers 404 NoSuchBucket (what S3 says for a missing bucket).
// Logs one line per request, plus "stored-type ID TYPE" / "stored-cc ID CC" per PUT.
const http = require('http'), crypto = require('crypto');
const [port, TOKEN, scopedArg, MODE = 'honest'] = process.argv.slice(2);
const SCOPED = new Set(scopedArg.split(','));
const sha = (d) => crypto.createHash('sha256').update(d).digest('hex');
const H = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
const SECRET = sha(TOKEN), KID = 'tokid' + SECRET.slice(0, 27);
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
const store = new Map([['r2-scope-probe-b/seed.txt', { body: Buffer.from('seed\n'), type: 'text/plain' }]]);
const xml = (code) => `<?xml version="1.0" encoding="UTF-8"?><Error><Code>${code}</Code><Message>${code}</Message></Error>`;
const srv = http.createServer((q, r) => {
  const chunks = []; q.on('data', (c) => chunks.push(c)); q.on('end', () => {
    const body = Buffer.concat(chunks);
    const send = (code, err, extra = {}, payload) => {
      r.writeHead(code, { 'content-type': 'application/xml', ...extra });
      r.end(q.method === 'HEAD' ? undefined : payload !== undefined ? payload : err ? xml(err) : '');
      console.log(`${q.method} ${q.url} -> ${code} ${err || ''}`);
    };
    if (q.url.endsWith('/tokens/verify')) {
      const ok = q.headers.authorization === 'Bearer ' + TOKEN;
      r.writeHead(ok ? 200 : 401, { 'content-type': 'application/json' });
      return r.end(JSON.stringify(ok ? { success: true, result: { id: KID, status: 'active' } } : { success: false, errors: [{ code: 1000 }] }));
    }
    const a = q.headers.authorization || '';
    const m = /Credential=([^/]+)\/(\d{8})\/([^/]+)\/([^/]+)\/aws4_request, SignedHeaders=([^,]+), Signature=([0-9a-f]+)/.exec(a);
    if (!m) return send(403, 'AccessDenied');
    const [, kid, day, region, svc, sh, sig] = m;
    const [path, qs = ''] = q.url.split('?');
    const cq = qs ? qs.split('&').map((p) => p.split('=')).map(([k, v = '']) => [enc(decodeURIComponent(k)), enc(decodeURIComponent(v))]).sort().map((p) => p.join('=')).join('&') : '';
    const ch = sh.split(';').map((n) => n + ':' + String(q.headers[n]).trim() + '\n').join('');
    const creq = [q.method, path.split('/').map((s) => enc(decodeURIComponent(s))).join('/'), cq, ch, sh, q.headers['x-amz-content-sha256']].join('\n');
    const sts = ['AWS4-HMAC-SHA256', q.headers['x-amz-date'], `${day}/${region}/${svc}/aws4_request`, sha(creq)].join('\n');
    const good = H(H(H(H(H('AWS4' + SECRET, day), region), svc), 'aws4_request'), sts).toString('hex');
    if (kid !== KID) return send(403, 'InvalidAccessKeyId');
    if (good !== sig && MODE !== 'anysig') return send(403, 'SignatureDoesNotMatch');
    const parts = decodeURIComponent(path).replace(/^\//, '').split('/');
    const bucket = parts.shift(), key = parts.join('/');
    if (!SCOPED.has(bucket) && MODE !== 'leaky') return send(403, 'AccessDenied');
    if (bucket.startsWith('missing-')) return send(404, 'NoSuchBucket');
    const id = bucket + '/' + key;
    if (!key) { // list
      if (q.method !== 'GET') return send(405, 'MethodNotAllowed');
      return send(200, null, {}, '<ListBucketResult></ListBucketResult>');
    }
    if (q.method === 'PUT') {
      const want = q.headers['x-amz-content-sha256'];
      if (MODE !== 'nohash' && want !== 'UNSIGNED-PAYLOAD' && want !== sha(body)) return send(400, 'XAmzContentSHA256Mismatch');
      store.set(id, { body, type: q.headers['content-type'] || 'application/octet-stream', cc: q.headers['cache-control'] });
      console.log('stored-type ' + id + ' ' + (q.headers['content-type'] || '')); console.log('stored-cc ' + id + ' ' + (q.headers['cache-control'] || '-')); return send(200, null, { etag: '"' + crypto.createHash('md5').update(body).digest('hex') + '"' });
    }
    if (q.method === 'DELETE') { store.delete(id); return send(204, null); }
    const o = store.get(id);
    if (!o) return send(404, 'NoSuchKey');
    const meta = { 'content-type': o.type, ...(o.cc ? { 'cache-control': o.cc } : {}) };
    if (q.method === 'HEAD') return send(200, null, { ...meta, 'content-length': o.body.length });
    if (q.method === 'GET') { const b = Buffer.from(o.body); if (MODE === 'corruptget' && b.length) b[b.length - 1] ^= 0xff;
      r.writeHead(200, { ...meta, 'content-length': b.length }); r.end(b); console.log(`GET ${q.url} -> 200`); return; }
    send(405, 'MethodNotAllowed');
  });
});
srv.listen(Number(port), '127.0.0.1', () => console.log('mock-r2 listening ' + srv.address().port + ' mode ' + MODE));
