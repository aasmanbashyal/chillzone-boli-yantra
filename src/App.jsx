import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import CharacterSelector from './components/CharacterSelector';
import VoiceCore from './components/VoiceCore';
import ChatLog from './components/ChatLog';

const App = () => {
    const [selectedCharacterId, setSelectedCharacterId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [recipient, setRecipient] = useState('Kamal');
    const [isRecording, setIsRecording] = useState(false);
    const [isActivated, setIsActivated] = useState(false);
    const [isEngaged, setIsEngaged] = useState(false);
    const [ttsReady, setTtsReady] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

    const characters = [
        { id: 1, name: 'Kamal', image: '/characters/Kamal.png' },
        { id: 2, name: 'Aasman', image: '/characters/Aasman.png' },
        { id: 3, name: 'Prashant', image: '/characters/Prashant.png' },
        { id: 4, name: 'Ujjwal', image: '/characters/Ujjwal.png' },
    ];

    const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

    // Initialize TTS model on mount - preload for faster first use
    useEffect(() => {
        const initTTS = async () => {
            try {
                console.log('Pre-initializing TTS model for faster first use...');
                // Use dynamic import for code splitting
                const { initializeTTS } = await import('./utils/tts');
                await initializeTTS();
                setTtsReady(true);
                console.log('TTS model pre-initialized and ready');
            } catch (error) {
                console.error('Failed to pre-initialize TTS:', error);
                // Don't set ready state if initialization fails
                // It will be initialized on-demand when needed
            }
        };
        // Initialize in background without blocking UI
        initTTS();
    }, []);

    const handleSendMessage = async (text) => {
        console.log('=== handleSendMessage called ===', { text, textLength: text?.length });
        
        if (!text || !text.trim()) {
            console.warn('Empty text, returning early');
            return;
        }

        console.log('Adding message to chat log...');
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        const newMessage = {
            text,
            sender: selectedCharacter?.name || 'Unknown',
            recipient,
            time,
        };

        console.log('Message object:', newMessage);
        setMessages(prev => {
            const updated = [...prev, newMessage];
            console.log('Messages updated, count:', updated.length);
            return updated;
        });

        // Generate audio for the message
        setIsGeneratingAudio(true);
        
        try {
            // Import TTS utilities (lazy load)
            const { generateAndPlayAudio, getVoiceForCharacter } = await import('./utils/tts');
            
            // Get voice ID based on selected character - each character has their own voice
            const characterName = selectedCharacter?.name || 'Kamal';
            const voiceId = getVoiceForCharacter(characterName);
            
            // Generate and play audio (non-blocking)
            await generateAndPlayAudio(text, voiceId);
        } catch (error) {
            console.error('TTS Error:', error);
            alert('Failed to generate audio: ' + (error?.message || 'Unknown error'));
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const handleEngage = () => {
        setIsEngaged(!isEngaged);
    };

    const handleRecord = () => {
        setIsRecording(!isRecording);
    };

    const handleActivate = () => {
        setIsActivated(!isActivated);
    };

    return (
        <div className="app-container">
            <Header />
            <div className="main-content">
                <CharacterSelector
                    characters={characters}
                    selectedId={selectedCharacterId}
                    onSelect={setSelectedCharacterId}
                />
                <VoiceCore
                    onEngage={handleEngage}
                    onRecord={handleRecord}
                    onActivate={handleActivate}
                    isRecording={isRecording}
                    isActivated={isActivated}
                    isEngaged={isEngaged}
                />
                <ChatLog
                    selectedCharacterName={selectedCharacter?.name}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    recipient={recipient}
                    onRecipientChange={setRecipient}
                />
            </div>
            <Footer ttsReady={ttsReady} isGeneratingAudio={isGeneratingAudio} />
        </div>
    );
};

export default App;

