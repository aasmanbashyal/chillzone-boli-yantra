import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTtsEngine } from '../src/tts-engine.js';
import { samplesToWav, loadModelBytes, TTS_MODEL_BYTES } from '../src/tts-model.js';

function fixture() {
  const workers = [], progress = [], voices = [];
  const engine = createTtsEngine({ onProgress: value => progress.push(value), onVoices: value => voices.push(value),
    createWorker() {
      const worker = { messages: [], terminated: false,
        postMessage(value) { this.messages.push(value); }, terminate() { this.terminated = true; },
        emit(value) { this.onmessage({ data: { id: this.messages.at(-1).id, ...value } }); },
      };
      workers.push(worker); return worker;
    },
  });
  return { engine, workers, progress, voices };
}

test('TTS does not create a worker or download a model before speech is requested', async () => {
  const { engine, workers, progress, voices } = fixture();
  assert.equal(workers.length, 0);
  const speech = engine.synthesize('  Hello  ');
  const worker = workers[0];
  assert.equal(worker.messages[0].text, 'Hello');
  worker.emit({ type: 'progress', phase: 'downloading', percent: 20 });
  worker.emit({ type: 'voices', voices: [{ voiceId: 'freya' }] });
  worker.emit({ type: 'result', samples: new Float32Array([0, 0.5, -0.5]), sampleRateHz: 24000 });
  const blob = await speech;
  assert.equal(blob.type, 'audio/wav');
  assert.equal(progress[0].percent, 20);
  assert.equal(voices[0][0].voiceId, 'freya');
  engine.dispose();
});

test('cancel terminates WASM work and ignores late audio; a new request remains usable', async () => {
  const { engine, workers } = fixture();
  const abort = new AbortController();
  const first = engine.synthesize('First', { signal: abort.signal });
  const rejected = assert.rejects(first, { name: 'AbortError' });
  abort.abort();
  await rejected;
  assert.equal(workers[0].terminated, true);
  const second = engine.synthesize('Second');
  workers[0].emit({ type: 'result', samples: new Float32Array([0.1]), sampleRateHz: 24000 });
  workers[0].onerror();
  assert.equal(workers[1].terminated, false);
  workers[1].emit({ type: 'result', samples: new Float32Array([0.2]), sampleRateHz: 24000 });
  assert.equal((await second).size, 46);
  engine.dispose();
});

test('failed model loading surfaces an error and a retry can succeed', async () => {
  const { engine, workers } = fixture();
  const first = engine.synthesize('Hello');
  workers[0].emit({ type: 'error', error: 'Model download failed' });
  await assert.rejects(first, /Model download failed/);
  const retry = engine.synthesize('Hello');
  workers[0].emit({ type: 'result', samples: new Float32Array([0.3]), sampleRateHz: 24000 });
  assert.equal((await retry).type, 'audio/wav');
  engine.dispose();
});

test('blank, oversized, or already cancelled requests do not start an engine', async () => {
  const { engine, workers } = fixture();
  await assert.rejects(engine.synthesize('  '), /1 and 500/);
  await assert.rejects(engine.synthesize('x'.repeat(501)), /1 and 500/);
  const abort = new AbortController(); abort.abort();
  await assert.rejects(engine.synthesize('Hello', { signal: abort.signal }), { name: 'AbortError' });
  assert.equal(workers.length, 0);
});

test('PCM WAV preserves sample rate, clamps peaks, and sanitizes invalid samples', async () => {
  const bytes = await samplesToWav(new Float32Array([-2, 0, 2, NaN]), 24000).arrayBuffer();
  const view = new DataView(bytes);
  assert.equal(new TextDecoder().decode(new Uint8Array(bytes, 0, 4)), 'RIFF');
  assert.equal(view.getUint32(24, true), 24000);
  assert.equal(view.getUint32(40, true), 8);
  assert.equal(view.getInt16(44, true), -32768);
  assert.equal(view.getInt16(48, true), 32767);
  assert.equal(view.getInt16(50, true), 0);
  assert.throws(() => samplesToWav(new Float32Array(), 24000), /invalid audio/);
});

test('a complete cached model avoids a network request', async () => {
  const cachedBytes = new Uint8Array(TTS_MODEL_BYTES);
  const bytes = await loadModelBytes({
    cacheStorage: { open: async () => ({ match: async () => new Response(cachedBytes) }) },
    fetchImpl: () => { throw new Error('unexpected download'); },
  });
  assert.equal(bytes.length, TTS_MODEL_BYTES);
});

test('storage denial falls back to download and rejects truncated model bytes', async () => {
  let requested = false;
  await assert.rejects(loadModelBytes({
    cacheStorage: { open: async () => { throw new Error('storage denied'); } },
    fetchImpl: async () => { requested = true; return new Response(new Uint8Array([1, 2])); },
  }), /incomplete/);
  assert.equal(requested, true);
});

test('corrupt cached bytes are evicted before retrying the download', async () => {
  let deleted = false;
  await assert.rejects(loadModelBytes({
    cacheStorage: { open: async () => ({ match: async () => new Response('bad'), delete: async () => { deleted = true; } }) },
    fetchImpl: async () => new Response('', { status: 503 }),
  }), /download failed \(503\)/);
  assert.equal(deleted, true);
});
