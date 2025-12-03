import React from 'react';

const CharacterSelector = ({ characters, selectedId, onSelect }) => {
    return (
        <div className="panel character-selector">
            <div className="panel-header">Voice Profile Selection</div>
            <div className="character-grid">
                {characters.map((char) => (
                    <div
                        key={char.id}
                        className={`character-card ${selectedId === char.id ? 'selected' : ''}`}
                        onClick={() => onSelect(char.id)}
                    >
                        <img src={char.image} alt={char.name} className="character-image" />
                        <div className="character-name">{char.name}</div>
                    </div>
                ))}
            </div>
            <div style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Global Search</div>
                <input type="text" placeholder="Search contacts..." style={{ width: '100%' }} />
            </div>
        </div>
    );
};

export default CharacterSelector;
