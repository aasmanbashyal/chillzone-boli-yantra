import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import CharacterSelector from './components/CharacterSelector';
import VoiceCore from './components/VoiceCore';
import ChatLog from './components/ChatLog';

const App = () => {
  const [selectedCharId, setSelectedCharId] = useState('aasman');
  const [recipient, setRecipient] = useState('Kamal');
  const [messages, setMessages] = useState([
    { sender: 'YOU', time: '16:35', text: "Sending 'Older Version' audio", recipient: 'Kamal' },
    { sender: 'YOU', time: '14:35', text: "Sending 'Older Version' audio", recipient: 'Kamal' },
  ]);

  const characters = [
    { id: 'aasman', name: 'Aasman', image: '/characters/Aasman.png' },
    { id: 'kamal', name: 'Kamal', image: '/characters/Kamal.png' },
    { id: 'prashant', name: 'Prashant', image: '/characters/Prashant.png' },
    { id: 'ujjwal', name: 'Ujjwal', image: '/characters/Ujjwal.png' },
  ];

  const selectedCharacter = characters.find(c => c.id === selectedCharId);

  // Play audio when character changes or engage is clicked
  const playAudio = (charName) => {
    if (!charName) return;
    const audioPath = `/audio/${charName}.wav`;
    console.log(`Attempting to play: ${audioPath}`);
    const audio = new Audio(audioPath);

    audio.play()
      .then(() => console.log("Audio playing successfully"))
      .catch(err => {
        console.error("Audio playback failed:", err);
      });
  };

  const handleCharacterSelect = (id) => {
    setSelectedCharId(id);
    const char = characters.find(c => c.id === id);
    if (char) {
      setRecipient(char.name);
    }
  };

  useEffect(() => {
    if (selectedCharacter) {
      playAudio(selectedCharacter.name);
    }
  }, [selectedCharId]);

  const handleSendMessage = (text) => {
    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    const charName = selectedCharacter ? selectedCharacter.name : 'Unknown';

    const newMessage = {
      sender: charName,
      time: timeString,
      text: text,
      recipient: recipient,
      audioName: charName
    };

    setMessages([newMessage, ...messages]);
    playAudio(charName);
  };

  const [isEngaged, setIsEngaged] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  const handleEngage = () => {
    console.log("Engage Voice clicked");
    setIsEngaged(true);
    setTimeout(() => setIsEngaged(false), 200);
    if (selectedCharacter) {
      playAudio(selectedCharacter.name);
    }
  };

  const handleRecord = () => {
    console.log("Record clicked");
    setIsRecording(!isRecording);
  };

  const handleActivate = () => {
    console.log("Activate clicked");
    setIsActivated(!isActivated);
  };

  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <CharacterSelector
          characters={characters}
          selectedId={selectedCharId}
          onSelect={handleCharacterSelect}
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
      <Footer />
    </div>
  );
};

export default App;
