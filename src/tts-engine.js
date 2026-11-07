import { samplesToWav } from './tts-model.js';

export function createTtsEngine({
  onProgress = () => {}, onVoices = () => {},
  createWorker = () => new Worker(new URL('./tts.worker.js', import.meta.url), { type: 'module' }),
} = {}) {
  let worker;
  let pending;
  let nextId = 0;

  function cancel() {
    // Terminating also interrupts a synchronous WASM call or model download.
    worker?.terminate();
    worker = null;
    if (pending) {
      const request = pending;
      pending = null;
      request.cleanup();
      request.reject(new DOMException('Speech stopped.', 'AbortError'));
    }
  }

  function synthesize(text, { voice = 'freya', signal } = {}) {
    if (!text.trim() || text.length > 500) return Promise.reject(new Error('Enter between 1 and 500 characters.'));
    if (signal?.aborted) return Promise.reject(new DOMException('Speech stopped.', 'AbortError'));
    if (pending) cancel();
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      let timeout;
      const cleanup = () => { clearTimeout(timeout); signal?.removeEventListener('abort', cancel); };
      pending = { id, resolve, reject, cleanup };
      signal?.addEventListener('abort', cancel, { once: true });
      try {
        if (!worker) {
          worker = createWorker();
          const ownedWorker = worker;
          worker.onmessage = ({ data }) => {
            if (!pending || data.id !== pending.id) return;
            if (data.type === 'progress') onProgress(data);
            if (data.type === 'voices') onVoices(data.voices);
            if (data.type === 'result' || data.type === 'error') {
              const request = pending;
              pending = null;
              request.cleanup();
              try {
                if (data.type === 'error') throw new Error(data.error);
                request.resolve(samplesToWav(data.samples, data.sampleRateHz));
              } catch (error) { request.reject(error); }
            }
          };
          worker.onerror = () => {
            if (worker !== ownedWorker) return;
            const request = pending;
            pending = null;
            worker?.terminate();
            worker = null;
            request?.cleanup();
            request?.reject(new Error('The speech engine could not start. Check your connection and retry in a current browser.'));
          };
        }
        timeout = setTimeout(() => {
          const request = pending;
          pending = null;
          worker?.terminate(); worker = null;
          request?.cleanup();
          request?.reject(new Error('Speech generation timed out. Try a shorter line or check your connection.'));
        }, 300000);
        worker.postMessage({ type: 'synthesize', id, text: text.trim(), voice });
      } catch (error) {
        pending = null;
        cleanup();
        worker?.terminate(); worker = null;
        reject(error);
      }
    });
  }
  return { synthesize, cancel, dispose: cancel };
}
