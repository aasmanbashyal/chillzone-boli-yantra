// Only list an audio URL when the clip is included in public/audio.
export const characters = [
  { id: 'aasman', name: 'Aasman', image: '/characters/Aasman.png', audio: null },
  { id: 'kamal', name: 'Kamal', image: '/characters/Kamal.png', audio: null },
  { id: 'prashant', name: 'Prashant', image: '/characters/Prashant.png', audio: '/audio/Prashant.wav' },
  { id: 'ujjwal', name: 'Ujjwal', image: '/characters/Ujjwal.png', audio: null },
];

export const defaultCharacter = characters.find(character => character.audio);
