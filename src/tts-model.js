export const TTS_MODEL_URL = 'https://huggingface.co/litert-community/phonon-31m-en/resolve/63a6170895a34600560f80dce4c70f7c90e32956/phonon_int8.litertlm';
export const TTS_MODEL_BYTES = 87205888;
export const TTS_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@1.2.2/wasm';

export async function loadModelBytes({ fetchImpl = fetch, cacheStorage = globalThis.caches, onProgress = () => {} } = {}) {
  let cache;
  try {
    cache = await cacheStorage?.open('chillzone-phonon-v1');
    const cached = await cache?.match(TTS_MODEL_URL);
    if (cached) {
      const bytes = new Uint8Array(await cached.arrayBuffer());
      if (bytes.length === TTS_MODEL_BYTES) {
        onProgress({ phase: 'initializing', percent: 100, cached: true });
        return bytes;
      }
      await cache.delete(TTS_MODEL_URL);
    }
  } catch { /* Private mode or full storage must not prevent synthesis. */ }
  onProgress({ phase: 'downloading', percent: 0 });
  const response = await fetchImpl(TTS_MODEL_URL);
  if (!response.ok) throw new Error('Speech model download failed (' + response.status + ').');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  let lastPercent = -1;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
    if (size > TTS_MODEL_BYTES) { await reader.cancel(); throw new Error('Unexpected speech model size.'); }
    const percent = Math.round(size / TTS_MODEL_BYTES * 100);
    if (percent !== lastPercent) { onProgress({ phase: 'downloading', percent }); lastPercent = percent; }
  }
  if (size !== TTS_MODEL_BYTES) throw new Error('Speech model download was incomplete. Please retry.');
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { await cache?.put(TTS_MODEL_URL, new Response(bytes)); } catch { /* Cache is optional. */ }
  return bytes;
}

export function samplesToWav(samples, sampleRate) {
  if (!(samples instanceof Float32Array) || !samples.length || !Number.isInteger(sampleRate) || sampleRate <= 0) {
    throw new Error('The speech engine returned invalid audio.');
  }
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset, value) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
  write(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); write(8, 'WAVE'); write(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, 'data'); view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const value = Number.isFinite(samples[i]) ? Math.max(-1, Math.min(1, samples[i])) : 0;
    view.setInt16(44 + i * 2, value * (value < 0 ? 32768 : 32767), true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}
