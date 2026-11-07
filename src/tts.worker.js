import { FilesetResolver, TextToSpeech } from '@mediapipe/tasks-audio';
import { loadModelBytes, TTS_WASM_URL } from './tts-model.js';

let task;
let loading;

self.onmessage = async ({ data }) => {
  const { id, text, voice } = data;
  const progress = value => self.postMessage({ type: 'progress', id, ...value });
  try {
    if (!task) {
      loading ??= (async () => {
        const bytes = await loadModelBytes({ onProgress: progress });
        progress({ phase: 'initializing', percent: 100 });
        const fileset = await FilesetResolver.forAudioTasks(TTS_WASM_URL, true);
        return TextToSpeech.createFromOptions(fileset, {
          baseOptions: { modelAssetBuffer: bytes, delegate: 'CPU' },
          defaultVoiceId: 'freya', cacheDirectory: ':nocache',
        });
      })();
      task = await loading;
    }
    self.postMessage({ type: 'voices', id, voices: await task.listVoices() });
    progress({ phase: 'synthesizing', percent: 100 });
    const result = await task.synthesize(text, { voiceId: voice || 'freya' });
    const samples = new Float32Array(result.samples);
    self.postMessage({ type: 'result', id, samples, sampleRateHz: result.sampleRateHz }, [samples.buffer]);
  } catch (error) {
    loading = null;
    self.postMessage({ type: 'error', id, error: error.message || 'Speech synthesis failed.' });
  }
};
