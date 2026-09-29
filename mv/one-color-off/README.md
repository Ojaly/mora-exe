# ONE COLOR OFF — lyric MV (39.5s)

Kinetic-typography lyric video in the style of a Vocaloid lyric MV, cut from the **final chorus + final post-chorus** of `ONE_COLOR_OFF.mp3`.

- **Final video:** `ONE_COLOR_OFF_MV.mp4` (1920×1080 / 30fps / H.264 + AAC / 39.5s)
- **Source section:** 227.375s → 266.875s of the original track (half a bar of pre-roll, then 16 bars of vocals, then the song's own outro, fading out)

## Section choice

The section was picked by separating the vocals (UVR MDX-Net) and transcribing them with Whisper, then locating each part of the song on the beat grid (123.05 BPM, one lyric line per bar).

| Part | Start (original) |
|---|---|
| Verse 1 | 18.2s |
| Chorus 1 | 81.3s |
| Chorus 2 | 176.1s |
| Bridge | 207.6s |
| **Final chorus** | **228.35s** ← used here |
| Vocals end | 258.9s |

Why the final chorus: it has the highest energy in the song, it contains the hook "One color off", its lyric (君の横顔 / 証明写真と同じ色) is the emotional payoff, and the clip can end on the song's real ending instead of a hard cut.

## Structure (MV time)

| Time | Lyric | Image / effect |
|---|---|---|
| 0.00 | (pre-roll) | Letterbox slit opens on the crosswalk |
| 0.98 | One color off ×2 | Crosswalk → red/blue channels swapped (the red pedestrian light turns blue) |
| 4.88 | 街のどこかが / 合っていない | Blue tone, misaligned grid, one character out of place |
| 8.78 | 君の横顔 / それだけなぜか | Profile, vertical Mincho text |
| 12.68 | 証明写真と / 同じ色 | ID photo → a four-photo sheet (only the photos keep their true colour) |
| 16.59 | One color off ×2 | Vending machine; turns blue on the second pass, ¥120→¥150 |
| 20.49 | 明日の予定は / 変更なし | Schedule card + red "変更なし" stamp |
| 24.39 | 午前八時に / ベルが鳴って | 08:00 dot-matrix clock, ringing circles, shake |
| 28.30 | 誰も確認 / しないまま | Dog + a checkbox nobody ticks |
| 32.20 | (outro) | Title card → fade out |

The HUD is always on screen: 「青信号まで あと 10.xx」 never counts down past 10, and the current chord (C–E♭–A♭–G–C–E♭–F–G) is highlighted.

## Preview / re-render

`index.html` draws every frame on a canvas as a pure function of time `T`.

```bash
# In-browser preview (needs a local server because of the fonts and images)
cd mv/one-color-off && python3 -m http.server 8000   # → http://localhost:8000/

# Re-render the MP4
npm i --no-save playwright-core
FFMPEG=ffmpeg node mv/one-color-off/tools/render.mjs mv/one-color-off out.mp4
```

The encoded MP4 was re-compressed with `-crf 22 -maxrate 8M`, because the grain overlay drives the bitrate up.

## Fonts

Every font is licensed under the SIL Open Font License and subset down to the glyphs used: Zen Kaku Gothic New, Zen Old Mincho, Dela Gothic One, DotGothic16, Space Mono.
If you change the lyrics or labels, re-run the subset from the original fonts (Google Fonts).
