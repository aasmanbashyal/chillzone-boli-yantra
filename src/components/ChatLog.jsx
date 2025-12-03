import React, { useState } from 'react';

const ChatLog = ({ selectedCharacterName, messages, onSendMessage, recipient, onRecipientChange }) => {
    const [input, setInput] = useState('');

    const handleSend = () => {
        console.log('ChatLog handleSend called, input:', input);
        if (input.trim()) {
            console.log('Calling onSendMessage with:', input);
            onSendMessage(input);
            setInput('');
            console.log('Input cleared');
        } else {
            console.log('Input is empty, not sending');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="panel chat-log">
            <div className="panel-header">Audio Transmission Log</div>

            <div style={{ padding: '1rem 1rem 0' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Recipient:</div>
                <select
                    style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-primary)',
                        padding: '0.5rem',
                        outline: 'none'
                    }}
                    value={recipient}
                    onChange={(e) => onRecipientChange(e.target.value)}
                >
                    <option value="Kamal">Kamal</option>
                    <option value="Aasman">Aasman</option>
                    <option value="Prashant">Prashant</option>
                    <option value="Ujjwal">Ujjwal</option>
                </select>
            </div>

            <div className="chat-history">
                {messages.map((msg, index) => (
                    <div key={index} className="chat-message">
                        <div style={{ marginBottom: '0.3rem' }}>
                            <span className="chat-timestamp">{msg.sender} ({msg.time}):</span>
                        </div>
                        <div className="chat-action">
                            [Voice Message Sent] - {msg.text} - Sending audio to {msg.recipient}.
                        </div>
                    </div>
                ))}
            </div>

            <div className="chat-input-area">
                <input
                    type="text"
                    placeholder="Type message..."
                    style={{ flex: 1 }}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={false}
                />
                <button 
                    className="btn" 
                    style={{ padding: '0.5rem 1rem' }} 
                    onClick={handleSend}
                    disabled={false}
                >
                    ➤
                </button>
            </div>
        </div>
    );
};

export default ChatLog;
