import React, { useEffect, useRef } from 'react';

const VoiceCore = ({ onEngage, onRecord, onActivate, isRecording, isActivated, isEngaged }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationId;

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            // Draw grid lines
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
            ctx.lineWidth = 1;

            // Draw waveform
            ctx.beginPath();
            ctx.moveTo(0, height / 2);

            for (let i = 0; i < width; i++) {
                // Modulate amplitude based on recording state
                const baseAmp = isRecording ? 80 : 50;
                const speed = isRecording ? 0.1 : 0.05;
                const amplitude = baseAmp * Math.sin(i * speed + Date.now() * 0.005) * Math.sin(i * 0.01);
                ctx.lineTo(i, height / 2 + amplitude);
            }

            ctx.strokeStyle = isRecording ? '#ff4444' : '#00f0ff';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = isRecording ? '#ff4444' : '#00f0ff';
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Mirror reflection
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            for (let i = 0; i < width; i++) {
                const baseAmp = isRecording ? 80 : 50;
                const speed = isRecording ? 0.1 : 0.05;
                const amplitude = baseAmp * Math.sin(i * speed + Date.now() * 0.005) * Math.sin(i * 0.01);
                ctx.lineTo(i, height / 2 - amplitude * 0.2); // Faint reflection
            }
            ctx.strokeStyle = isRecording ? 'rgba(255, 68, 68, 0.2)' : 'rgba(0, 240, 255, 0.2)';
            ctx.stroke();

            animationId = requestAnimationFrame(draw);
        };

        // Set canvas size
        const resize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };

        window.addEventListener('resize', resize);
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, [isRecording]);

    return (
        <div className="panel voice-core">
            <div className="panel-header">Voice Modulation Core</div>

            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>Input Audio</div>
            <div className="visualizer-container" style={{ borderColor: isRecording ? '#ff4444' : 'var(--color-border)' }}>
                <canvas ref={canvasRef} className="waveform-canvas"></canvas>
            </div>

            <div className="controls-container">
                <div className="slider-group">
                    <div className="slider-control">
                        <div className="slider-label">
                            <span>Pitch Shift</span>
                            <span>0</span>
                        </div>
                        <input type="range" min="-100" max="100" defaultValue="0" />
                        <div className="slider-label" style={{ marginTop: '0.2rem', fontSize: '0.7rem', opacity: 0.6 }}>
                            <span>-Low</span>
                            <span>High</span>
                        </div>
                    </div>
                    <div className="slider-control">
                        <div className="slider-label">
                            <span>Resonance</span>
                        </div>
                        <input type="range" min="0" max="100" defaultValue="50" />
                        <div className="slider-label" style={{ marginTop: '0.2rem', fontSize: '0.7rem', opacity: 0.6 }}>
                            <span>Low</span>
                            <span>High</span>
                        </div>
                    </div>
                </div>

                <div className={`generation-panel ${isActivated ? 'active' : ''}`} style={{
                    borderColor: isActivated ? 'var(--color-primary)' : 'var(--color-secondary)',
                    boxShadow: isActivated ? '0 0 15px rgba(0, 240, 255, 0.2)' : 'none'
                }}>
                    <div style={{ flex: 1 }}>
                        <div className="slider-label">Older Version Generation</div>
                        <input type="range" style={{ width: '100%' }} />
                    </div>
                    <button
                        className={`btn ${isActivated ? 'active' : ''}`}
                        onClick={onActivate}
                        style={{
                            background: isActivated ? 'var(--color-primary)' : 'transparent',
                            color: isActivated ? 'var(--color-bg)' : 'var(--color-primary)'
                        }}
                    >
                        {isActivated ? 'ACTIVE' : 'ACTIVATE'}
                    </button>
                </div>

                <div className="engage-button-container">
                    <button
                        className="engage-btn"
                        onClick={onEngage}
                        style={{
                            transform: isEngaged ? 'scale(0.95)' : 'scale(1)',
                            boxShadow: isEngaged ? '0 0 50px var(--color-primary)' : undefined
                        }}
                    >
                        Engage<br />Voice
                    </button>
                    <button
                        className={`btn btn-secondary ${isRecording ? 'recording' : ''}`}
                        style={{
                            height: '50px',
                            borderRadius: '25px',
                            padding: '0 2rem',
                            background: isRecording ? '#ff4444' : 'transparent',
                            borderColor: isRecording ? '#ff4444' : 'var(--color-secondary)',
                            color: isRecording ? 'white' : 'var(--color-secondary)',
                            boxShadow: isRecording ? '0 0 20px rgba(255, 68, 68, 0.5)' : 'none'
                        }}
                        onClick={onRecord}
                    >
                        {isRecording ? 'RECORDING' : 'RECORD'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceCore;
