import React from 'react';

const Footer = ({ ttsReady, isGeneratingAudio }) => {
    return (
        <div className="app-footer">
            <div className="status-group">
                <div className="status-item">System Integrity: <span>98%</span></div>
                <div className={`status-item ${ttsReady ? 'online' : ''}`}>
                    TTS Model: <span>{ttsReady ? 'Ready' : 'Loading...'}</span>
                </div>
                <div className={`status-item ${isGeneratingAudio ? 'online' : ''}`}>
                    Audio: <span>{isGeneratingAudio ? 'Generating...' : 'Ready'}</span>
                </div>
            </div>
            <div className="status-group">
                <div className="status-item online">
                    <span>● Connected</span>
                </div>
            </div>
        </div>
    );
};

export default Footer;
