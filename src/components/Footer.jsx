import React from 'react';

const Footer = () => {
    return (
        <div className="app-footer">
            <div className="status-group">
                <div className="status-item">System Integrity: <span>98%</span></div>
                <div className="status-item online">Neural Network: <span>Online</span></div>
                <div className="status-item online">Datalink: <span>Secure</span></div>
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
