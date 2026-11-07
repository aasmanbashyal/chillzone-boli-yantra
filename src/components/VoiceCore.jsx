export default function VoiceCore({ script, onScript, voice, voices, onVoice, onSpeak, onStop, busy, playback, engineState, error, onVolume, onSpeed }) {
  const active = busy || playback.status === 'playing' || playback.status === 'loading';
  const phaseText = {
    idle: 'Synthesis ready', starting: 'Starting speech engine', downloading: 'Downloading voice model ' + engineState.percent + '%',
    initializing: 'Initializing speech engine', synthesizing: 'Generating speech', ready: 'Speech prepared', error: 'Synthesis needs attention',
  }[engineState.phase];
  const outputText = { idle: 'Output idle', loading: 'Loading audio', playing: 'Audio playing', ended: 'Playback complete', error: 'Playback needs attention' }[playback.status];
  return (
    <section className="panel voice-core" aria-labelledby="synthesis-heading">
      <div className="panel-header"><span className="eyebrow">Channel 02</span><h2 id="synthesis-heading">Neural voice synthesis</h2></div>
      <div className={'visualizer ' + (active ? 'is-active' : '')} aria-hidden="true">
        {Array.from({ length: 40 }, (_, index) => <i key={index} style={{ '--bar-height': (15 + ((index * 37) % 75)) + '%', '--bar-delay': (index * -0.07) + 's' }} />)}
        <span className="waveform-label">{active ? 'SIGNAL ACTIVE' : 'AWAITING SIGNAL'}</span>
      </div>
      <div className="speech-input"><label htmlFor="speech-script">Speech script <span>{script.length}/500</span></label>
        <textarea id="speech-script" maxLength="500" rows="4" value={script} onChange={event => onScript(event.target.value)} placeholder="Type a line to speak..." />
      </div>
      <div className="synthesis-controls"><div><label htmlFor="synthesis-voice">Synthesis voice · English</label><select id="synthesis-voice" value={voice} onChange={event => onVoice(event.target.value)}>{voices.map(item => <option key={item.voiceId} value={item.voiceId}>{item.displayName || item.voiceId}</option>)}</select></div>
        <div><label htmlFor="playback-speed">Playback speed</label><select id="playback-speed" value={playback.speed} onChange={event => onSpeed(Number(event.target.value))}><option value="0.75">0.75×</option><option value="1">1× Normal</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select></div></div>
      <div className="volume-control"><label htmlFor="volume">Output level <span>{Math.round(playback.volume * 100)}%</span></label><input id="volume" type="range" min="0" max="1" step="0.05" value={playback.volume} onChange={event => onVolume(Number(event.target.value))} /></div>
      <div className="engine-status" role="status" aria-live="polite">{busy ? phaseText : outputText}</div>
      {(error || playback.error) && <p className="playback-error" role="alert">{error || playback.error}</p>}
      <div className="speech-actions"><button className="engage-btn" type="button" disabled={busy || !script.trim()} onClick={onSpeak}><span aria-hidden="true">▶</span>{busy ? 'Generating...' : 'Speak text'}</button><button className="btn stop-btn" type="button" disabled={!active} onClick={onStop}>Stop output</button></div>
      <p className="panel-note download-note">First use downloads an 87 MB English voice model plus a 22 MB engine. Speech is generated on this device.</p>
    </section>
  );
}
