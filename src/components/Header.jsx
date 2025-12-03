import React from 'react';

const Header = () => {
    return (
        <div className="app-header">
            <div className="header-title">
                <div className="header-indicator"></div>
                <h1 className="header-text">
                    ChillZone Boli Yantra: AI Neural Voice Synthesis Unit
                </h1>
            </div>
            <div className="window-controls">
                <div className="window-btn" title="Minimize"></div>
                <div className="window-btn" title="Maximize" onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()}></div>
                <div className="window-btn close" title="Close" onClick={() => window.location.reload()}></div>
            </div>
        </div>
    );
};

export default Header;
