# After Dark II: restore the phrases

David liked the darker direction but heard some phrases as short or empty.
This pass develops complete calls and answers instead of removing isolated
notes. The accepted Black Glass / Grit, Cold Boot and Blind Spot are references
for character and space; they are not edited. All earlier sources and renders
remain available. The three new sources use the suffix `-dark-v2.cts` and titles
ending in “After Dark II”.

After delivery, David liked Glass Current's revision and said it felt much
more like a melodic theme. This is its current reference pass. The working
track names and soundtrack selection are listed in [SOUNDTRACK.md](SOUNDTRACK.md).
David also accepted Relay Ghost / After Dark II as good enough for now and
explicitly requested no further refinements. Preserve that version unchanged.

## Musical changes

**Glass Current:** The calm pluck recovers its A–C–A / F–E contour over D minor,
with related responses following the darker G minor and A minor voicings.
Two-bar phrases use shaped accents and longer endings. In the tense region,
the lead makes a two-bar call and the pluck answers over the next two bars,
instead of both repeatedly stabbing over one another. Phrase variants alter
the answers and resolutions. Melodic note count rises only slightly, from
291 to 303: continuity and handoffs are the main changes.

**Relay Ghost:** A recurring E–B–D / F#–E bell figure restores an identifiable
hook in a lower register. It has a full pluck response, adapted to the current
minor chord. Eight-bar variants change the contour and ending; the tense mix
holds the bell back beneath the existing bass and arpeggios. The melody grows
from 118 to 216 notes across both channels, still well below the original
timing-v2 version's 400. This restores some character without returning to a
continuous high bell line.

**Basement Circuit:** This is a smaller change. The calm pluck keeps every pitch
and onset but has more time to ring. Quiet paired bell responses replace
isolated end-of-phrase notes. The tense bell responds only near the end of each
eight-bar pattern, leaving the acid line in front. Melodic note count rises
from 709 to 719, including the unchanged acid line.

The pluck decay is now 180 ms in liquid and 160 ms in the other two, with a
65 ms release and a modestly more open cutoff. The bell's amplitude decay and
release become 850/240 ms, and liquid's lead becomes 180/65 ms. Attacks retain
their existing timing. The revised gates usually span five to eleven rows,
rather than the earlier three- or four-row fragments, with short endings where
the next phrase needs room. Longer gates are paired with actual envelope edits
so a longer written note is not just silent time after a short decay.

## Preserved structure and checks

Compared with each first After Dark source, every cell in channels 1–5 and 8
is identical. This preserves drums and ghosts, bass pitches/articulation,
dark chord voicings and the effects channel. Every fill-pattern cell is also
identical. The entire house tense acid channel, including slides and volume
accents, is identical. Patch edits are restricted to the melodic instruments;
bus processing and rhythmic instruments are unchanged.

Tempo, pattern lengths, order and tense-loop destinations are unchanged.
Every new melodic onset uses the eighth-note grid. Explicit note-offs were
rebuilt with the phrases so deleted notes cannot leave stale releases cutting
off their replacements. Source comparisons check the preserved channels and
fill; the normal audit checks every compiled trigger against the sample clock.

| Track | Compiled triggers | Maximum clock error | Intentional odd-row fill hits |
| --- | ---: | ---: | ---: |
| liquid-dark-v2 | 2,972 | 0 samples | 4 |
| electro-dark-v2 | 2,339 | 0 samples | 4 |
| acid-house-dark-v2 | 2,488, plus 116 legato slides | 0 samples | 4 |

All sources validate and round-trip byte-identically through the canonical
printer. Existing lifetime voice budgets are unchanged and remain within the
eight-voice limit per channel. These are content/preset changes only; no synth
engine or file-format change was needed.

Independent source comparisons also verify unchanged bus settings and all
non-melodic instrument definitions. A gate audit finds no overlapping or
unreleased rewritten melody notes. All three native OGGs decode cleanly at
44.1 kHz stereo and match their full WAV durations. No WAV has saturated PCM
samples. Measured levels remain close to the first After Dark mixes:

| Full WAV | Duration | Peak | RMS |
| --- | ---: | ---: | ---: |
| liquid-dark-v2 | 161.860476 s | -1.98 dBFS | -17.07 dBFS |
| electro-dark-v2 | 152.727279 s | -1.43 dBFS | -17.67 dBFS |
| acid-house-dark-v2 | 162.580612 s | -2.25 dBFS | -17.27 dBFS |

The existing one-sample duration rounding difference remains in the house WAV.
The artifact package includes source snapshots, exact render commands, timing
and preservation audit results, audio metrics and a SHA-256 manifest.

## Reproduce the full auditions

```sh
sigil docs/music/tools/render.sgl --motif "$MOTIF_BIN" \
  --tracks liquid-dark-v2 electro-dark-v2 acid-house-dark-v2 \
  --full-only --format both
sigil docs/music/tools/timing.sgl \
  --tracks liquid-dark-v2 electro-dark-v2 acid-house-dark-v2
```

The full files include their fills. WAVs go in the selected output directory,
with native Vorbis OGGs in its `ogg/` subfolder. No normalization is applied.
