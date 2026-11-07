import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import CharacterSelector from './components/CharacterSelector';
import VoiceCore from './components/VoiceCore';
import ChatLog from './components/ChatLog';
import { characters, defaultCharacter } from './characters';
import { createAudioPlayer, initialPlayback } from './audio-player';
import { createTtsEngine } from './tts-engine';

export default function App() {
  const [selectedId, setSelectedId] = useState(defaultCharacter.id);
  const [playback, setPlayback] = useState(initialPlayback);
  const [player] = useState(() => createAudioPlayer({ onChange: setPlayback }));
  const [engineState, setEngineState] = useState({ phase: 'idle', percent: 0 });
  const [voices, setVoices] = useState([{ voiceId: 'freya', displayName: 'Freya', locale: 'en-US' }]);
  const [engine] = useState(() => createTtsEngine({ onProgress: setEngineState, onVoices: setVoices }));
  const [voice, setVoice] = useState('freya');
  const [script, setScript] = useState('ChillZone transmission ready. The future is listening.');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const request = useRef({ id: 0, abort: null });
  const lastSpeech = useRef(null);
  const selected = characters.find(character => character.id === selectedId);

  useEffect(() => () => {
    request.current.id += 1;
    request.current.abort?.abort();
    engine.dispose();
    player.stop(false);
    if (lastSpeech.current) URL.revokeObjectURL(lastSpeech.current.url);
  }, [engine, player]);

  const log = (title, text) => setHistory(previous => [{
    id: crypto.randomUUID(), title, text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }, ...previous].slice(0, 30));

  const stop = () => {
    request.current.id += 1;
    request.current.abort?.abort();
    player.stop();
    setBusy(false);
    setError('');
    setEngineState(previous => ({ ...previous, phase: 'idle' }));
  };

  const selectCharacter = id => {
    const character = characters.find(item => item.id === id);
    if (!character?.audio) return;
    stop();
    setSelectedId(id);
  };

  const playClip = async () => {
    stop();
    const id = request.current.id;
    const played = await player.play(selected.audio);
    if (played && id === request.current.id) log('Character clip', selected.name + ' playback started.');
  };

  const speak = async () => {
    const text = script.trim();
    if (!text) return;
    stop();
    const id = request.current.id;
    try {
      let generated = lastSpeech.current;
      if (!generated || generated.text !== text || generated.voice !== voice) {
        setBusy(true);
        setEngineState({ phase: 'starting', percent: 0 });
        const abort = new AbortController();
        request.current.abort = abort;
        const blob = await engine.synthesize(text, { voice, signal: abort.signal });
        if (id !== request.current.id) return;
        if (lastSpeech.current) URL.revokeObjectURL(lastSpeech.current.url);
        generated = { text, voice, url: URL.createObjectURL(blob) };
        lastSpeech.current = generated;
      }
      setEngineState({ phase: 'ready', percent: 100 });
      setBusy(false);
      const played = await player.play(generated.url);
      if (played && id === request.current.id) log('Speech playback', text);
    } catch (failure) {
      if (id === request.current.id && failure.name !== 'AbortError') {
        setError(failure.message);
        setEngineState({ phase: 'error', percent: 0 });
      }
    } finally {
      if (id === request.current.id) setBusy(false);
    }
  };

  return (
    <div className="app-container">
      <Header />
      <main className="main-content" id="main-content">
        <CharacterSelector characters={characters} selectedId={selectedId} onSelect={selectCharacter} onPlay={playClip} busy={busy} />
        <VoiceCore script={script} onScript={setScript} voice={voice} voices={voices}
          onVoice={value => { stop(); setVoice(value); }} onSpeak={speak} onStop={stop}
          busy={busy} playback={playback} engineState={engineState} error={error}
          onVolume={value => player.setVolume(value)} onSpeed={value => player.setSpeed(value)} />
        <ChatLog history={history} onClear={() => setHistory([])} />
      </main>
      <Footer busy={busy} status={playback.status} />
    </div>
  );
}
