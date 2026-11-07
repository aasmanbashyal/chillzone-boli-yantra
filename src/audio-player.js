export const initialPlayback = {
  status: 'idle', error: '', currentTime: 0, duration: 0, volume: 0.8, speed: 1,
};

// A playback request owns its event handlers. Replaced or stopped requests must
// never update the UI, even if their play() promise settles later.
export function createAudioPlayer({ createAudio = url => new Audio(url), onChange = () => {} } = {}) {
  let audio = null;
  let requestId = 0;
  let state = { ...initialPlayback };

  const update = patch => {
    state = { ...state, ...patch };
    onChange({ ...state });
  };

  const release = () => {
    if (!audio) return;
    audio.onended = audio.onerror = audio.ontimeupdate = audio.onloadedmetadata = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audio = null;
  };

  const stop = (notify = true) => {
    requestId += 1;
    release();
    const reset = { status: 'idle', error: '', currentTime: 0, duration: 0 };
    if (notify) update(reset);
    else state = { ...state, ...reset };
  };

  const play = async url => {
    stop(false);
    if (!url) {
      update({ status: 'error', error: 'This character does not have a clip yet.' });
      return;
    }
    const id = requestId;
    update({ status: 'loading', error: '', currentTime: 0, duration: 0 });
    try {
      const clip = createAudio(url);
      audio = clip;
      clip.volume = state.volume;
      clip.playbackRate = state.speed;
      const isCurrent = () => id === requestId && audio === clip;
      clip.onloadedmetadata = () => {
        if (isCurrent()) update({ duration: Number.isFinite(clip.duration) ? clip.duration : 0 });
      };
      clip.ontimeupdate = () => {
        if (isCurrent()) update({ currentTime: clip.currentTime });
      };
      clip.onended = () => {
        if (!isCurrent()) return;
        const currentTime = clip.currentTime;
        release();
        update({ status: 'ended', currentTime });
      };
      clip.onerror = () => {
        if (!isCurrent()) return;
        requestId += 1;
        release();
        update({ status: 'error', error: 'The clip could not be loaded. Check your connection and try again.' });
      };
      await clip.play();
      if (isCurrent()) { update({ status: 'playing' }); return true; }
      return false;
    } catch (error) {
      if (id !== requestId) return;
      release();
      update({ status: 'error', error: error.name === 'NotAllowedError'
        ? 'Playback was blocked by your browser. Press Speak text or Play character clip again to retry your chosen output.'
        : 'The clip could not be played. Please try again.' });
    }
  };

  return {
    play, stop,
    setVolume(value) {
      if (!Number.isFinite(value)) return;
      const volume = Math.max(0, Math.min(1, value));
      if (audio) audio.volume = volume;
      update({ volume });
    },
    setSpeed(value) {
      if (![0.75, 1, 1.25, 1.5].includes(value)) return;
      if (audio) audio.playbackRate = value;
      update({ speed: value });
    },
  };
}
