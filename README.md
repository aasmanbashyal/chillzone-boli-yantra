# ChillZone Boli Yantra

A cinematic browser console for a movie prop, with working local text-to-speech
and prerecorded character clips. The interface keeps the original cyan/purple
console style and adapts to desktop, tablet, and phone screens.

## Run locally

Use Node.js 22.12 or newer. This repository uses npm and `package-lock.json`.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. For a production build:

```sh
npm run build
npm run preview
```

Deploy `dist/` on an HTTPS static host. Localhost also works for development.
No API key, Python server, GPU, or cloud speech service is required.

## Speech synthesis

1. Type up to 500 characters in **Speech script**.
2. Press **Speak text**. The first request downloads the speech model and WASM
   runtime. The UI shows loading progress and supports **Stop output** throughout.
3. Choose another bundled English voice after the model has loaded, or adjust
   playback speed and output level. Speaking the same unchanged line reuses its
   generated audio.

The engine is MediaPipe Audio Tasks **1.2.2**, running **LiteRT CPU/WebAssembly**
inside a dedicated worker. It uses the English **Phonon-31M INT8** model at pinned
revision `63a6170895a34600560f80dce4c70f7c90e32956`. The model is 87,205,888 bytes
and the WASM engine is approximately 22 MB. The model is cached through
CacheStorage when available; denied/full storage falls back to a download.
Loading and inference failures stay visible and can be retried. Stopping a
request terminates the worker so an old inference cannot play later.

The first request needs access to Hugging Face for model weights and jsDelivr
for the pinned WASM runtime. Text is processed on the device and is not sent to
either host. Browser storage/cache eviction can require another download.
Offline speech is not guaranteed; bundled character clips remain available
without the speech model. Memory and synthesis time depend on the browser and
device. Use current Chrome or Edge for the tested configuration.

Synthesis voices come from the model's `listVoices()` result and are separate
from the character archive. This does not clone the characters' voices. The old
decorative record, pitch, resonance, and generation controls have been replaced
with working speech, playback, speed, and volume controls. The transmission log
records local playback starts only; it does not send messages.

Model and runtime references:

- [MediaPipe TextToSpeech sample](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/text-to-speech.worker.ts)
- [Phonon model card and Apache-2.0 license](https://huggingface.co/litert-community/phonon-31m-en)
- [Pinned model file](https://huggingface.co/litert-community/phonon-31m-en/blob/63a6170895a34600560f80dce4c70f7c90e32956/phonon_int8.litertlm)

## Character clips

Only `public/audio/Prashant.wav` is included. Prashant is the default archive
selection. Other characters are labeled unavailable and disabled rather than
requesting nonexistent audio. Add a real clip to `public/audio/` and give the
corresponding entry in `src/characters.js` its URL to enable another character.
The asset test checks every advertised image and clip.

Audio starts only after an action. Replacing or stopping output releases the
previous audio, and stale promises/events cannot overwrite current playback.
Blocked autoplay reports a retryable error. Generated audio is retained for a
direct replay without another inference.

## Checks

```sh
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit tests cover audio cancellation/races, asset availability, worker lifecycle,
WAV encoding, model-cache reuse, and unavailable/corrupt storage. Browser tests
cover actual React controls, worker/audio errors and cancellation, keyboard
interaction, and layouts from 320 to 1440 pixels. Their audio and worker outputs
are mocked so CI does not download large models.

To run real browser inference and validate non-silent PCM output:

```sh
npm run test:tts
```

This separate smoke test downloads the pinned model/runtime and may take several
minutes on the first run. It runs real LiteRT inference rather than a mock.
