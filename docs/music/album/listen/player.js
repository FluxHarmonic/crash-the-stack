'use strict';
const audio = document.querySelector('#audio');
const play = document.querySelector('#play');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const status = document.querySelector('#status');
let tracks = [];
let selected = 0;
let request = 0;
let fallback = false;
const time = seconds => { const rounded = Math.round(seconds); return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`; };

function select(index) {
  request++;
  selected = index;
  fallback = !audio.canPlayType('audio/ogg; codecs="vorbis"');
  audio.removeAttribute('src');
  audio.load();
  document.querySelector('#now-title').textContent = tracks[index].title;
  document.querySelector('#track-number').textContent = `${String(index + 1).padStart(2, '0')} / ${tracks.length}`;
  document.querySelectorAll('.track').forEach((button, i) => {
    if (i === index) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
  previous.disabled = index === 0;
  next.disabled = index === tracks.length - 1;
  play.textContent = 'Play track';
  status.textContent = 'Ready to play.';
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({title: tracks[index].title, album: 'Crash The Stack — Original Soundtrack'});
  }
}
async function start() {
  if (!audio.getAttribute('src')) {
    audio.src = tracks[selected][fallback ? 'mp3' : 'ogg'];
    audio.load();
  }
  const current = request;
  try { await audio.play(); }
  catch (error) {
    if (current === request && error.name !== 'AbortError') {
      status.textContent = 'Playback could not start. Press Play to try again.';
    }
  }
}
function move(index) { select(index); start(); }
play.addEventListener('click', () => audio.paused ? start() : audio.pause());
previous.addEventListener('click', () => { if (selected > 0) move(selected - 1); });
next.addEventListener('click', () => { if (selected + 1 < tracks.length) move(selected + 1); });
audio.addEventListener('play', () => { play.textContent = 'Pause'; status.textContent = 'Playing the album in sequence.'; });
audio.addEventListener('pause', () => { play.textContent = 'Play track'; });
audio.addEventListener('ended', () => {
  if (selected + 1 < tracks.length) move(selected + 1);
  else { play.textContent = 'Play again'; status.textContent = 'End of the album. Thanks for listening.'; }
});
audio.addEventListener('error', () => {
  if (!tracks.length) return;
  if (!fallback) {
    fallback = true;
    request++;
    audio.src = tracks[selected].mp3;
    audio.load();
    start();
  } else status.textContent = 'This track could not load. Check your connection and select it again to retry.';
});
fetch('album.json').then(response => {
  if (!response.ok) throw new Error('Album unavailable');
  return response.json();
}).then(album => {
  tracks = album.tracks;
  if (!tracks.length) throw new Error('Empty album');
  document.querySelector('#album-info').textContent = `${tracks.length} TRACKS / ${time(album.duration_seconds)} / PREVIEW I`;
  tracks.forEach((track, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'track';
    button.setAttribute('aria-label', `Play ${track.title}, track ${index + 1}`);
    const number = document.createElement('span'); number.className = 'index'; number.textContent = String(index + 1).padStart(2, '0');
    const title = document.createElement('span'); title.textContent = track.title;
    const duration = document.createElement('time'); duration.textContent = time(track.duration_seconds);
    button.append(number, title, duration);
    button.addEventListener('click', () => move(index));
    item.append(button); document.querySelector('#tracks').append(item);
  });
  select(0); play.disabled = false; play.textContent = 'Play album';
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('previoustrack', () => { if (selected > 0) move(selected - 1); });
    navigator.mediaSession.setActionHandler('nexttrack', () => { if (selected + 1 < tracks.length) move(selected + 1); });
  }
}).catch(() => { status.textContent = 'The tracklist could not load. Please refresh to try again.'; document.querySelector('#album-info').textContent = 'ALBUM PREVIEW'; });
