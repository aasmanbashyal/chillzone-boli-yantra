import { useState } from 'react';

export default function CharacterSelector({ characters, selectedId, onSelect, onPlay, busy }) {
  const [query, setQuery] = useState('');
  const visible = characters.filter(character => character.name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className="panel character-selector" aria-labelledby="voices-heading">
      <div className="panel-header"><span className="eyebrow">Channel 01</span><h2 id="voices-heading">Character archive</h2></div>
      <div className="search-field"><label htmlFor="voice-search">Find a character</label>
        <input id="voice-search" type="search" placeholder="Search archive..." value={query} onChange={event => setQuery(event.target.value)} />
      </div>
      <div className="character-grid">{visible.map(character => (
        <button key={character.id} type="button" disabled={!character.audio}
          aria-pressed={selectedId === character.id}
          className={'character-card ' + (selectedId === character.id ? 'selected' : '')} onClick={() => onSelect(character.id)}>
          <img src={character.image} alt="" className="character-image" />
          <span className="character-caption"><span className="character-name">{character.name}</span><span className="clip-availability">{character.audio ? 'Clip ready' : 'No clip available'}</span></span>
          {selectedId === character.id && <span className="selected-mark" aria-hidden="true">✓</span>}
        </button>
      ))}</div>
      {!visible.length && <p className="panel-note" role="status">No characters match your search.</p>}
      <div className="archive-action"><button className="btn" type="button" onClick={onPlay} disabled={busy}>Play character clip</button><p className="panel-note">Original recordings. Generated speech uses the separate voice selected in the synthesis panel.</p></div>
    </section>
  );
}
