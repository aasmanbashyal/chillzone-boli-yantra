import { KokoroTTS } from "kokoro-js";

// Voice configurations - 4 different voice versions
export const VOICE_CONFIGS = {
    voice1: {
        id: "af_bella",
        name: "Voice 1 - Bella",
        description: "Female voice - High quality"
    },
    voice2: {
        id: "af_sarah",
        name: "Voice 2 - Sarah",
        description: "Female voice - Alternative style"
    },
    voice3: {
        id: "am_adam",
        name: "Voice 3 - Adam",
        description: "Male voice - Standard"
    },
    voice4: {
        id: "am_michael",
        name: "Voice 4 - Michael",
        description: "Male voice - Alternative style"
    }
};

// Character to voice mapping - each character gets their own unique male voice
export const CHARACTER_VOICE_MAP = {
    'Kamal': 'am_adam',      // Kamal uses Adam voice (American Male)
    'Aasman': 'bm_george',  // 
    'Prashant': 'am_liam',    // Prashant uses Liam voice (American Male)
    'Ujjwal': 'am_eric',      // Ujjwal uses Eric voice (American Male)
};

/**
 * Get the voice ID for a specific character
 * @param {string} characterName - The name of the character
 * @returns {string} - The voice ID to use
 */
export function getVoiceForCharacter(characterName) {
    return CHARACTER_VOICE_MAP[characterName] || 'am_adam'; // Default to Adam if character not found
}

let ttsModel = null;
let isInitializing = false;
let initPromise = null;
let audioQueue = [];
let isPlayingAudio = false;

// Model configuration - can be easily changed
const MODEL_CONFIG = {
    // Try q4 for faster inference (smaller model = lower latency)
    // Options: "q4" (fastest, lower quality), "q8" (balanced), "f16" (best quality, slowest)
    dtype: "q4",
    // Model ID - using the same Kokoro model but with smaller quantization
    model_id: "onnx-community/Kokoro-82M-v1.0-ONNX",
};

/**
 * Initialize the Kokoro TTS model with optimized settings for performance
 */
export async function initializeTTS() {
    // Return existing model if already initialized
    if (ttsModel) {
        return ttsModel;
    }

    // Return existing promise if initialization is in progress
    if (isInitializing && initPromise) {
        return initPromise;
    }

    // Start initialization
    isInitializing = true;
    initPromise = (async () => {
        try {
            console.log('Initializing TTS model with q4 quantization (faster, smaller)...');
            
            // Try WebGPU first for better performance, fallback to WASM
            let device = "wasm";
            try {
                if (navigator.gpu) {
                    device = "webgpu";
                    console.log("Using WebGPU for faster inference");
                }
            } catch (e) {
                console.log("Using WASM (WebGPU unavailable)");
            }
            
            // Initialize with q4 quantization for faster inference
            ttsModel = await KokoroTTS.from_pretrained(MODEL_CONFIG.model_id, {
                dtype: MODEL_CONFIG.dtype, // q4 = smaller, faster model
                device: device,
            });
            
            isInitializing = false;
            console.log(`TTS model initialized (${device}, ${MODEL_CONFIG.dtype})`);
            return ttsModel;
        } catch (error) {
            isInitializing = false;
            initPromise = null;
            console.error("TTS initialization failed:", error?.message || error);
            throw error;
        }
    })();

    return initPromise;
}

/**
 * Generate audio from text using the specified voice
 * @param {string} text - The text to convert to speech
 * @param {string} voiceId - The voice ID to use (default: af_bella)
 * @returns {Promise<Blob>} - Audio blob that can be played
 */
export async function generateAudio(text, voiceId = "af_bella") {
    const startTime = performance.now();
    try {
        // Ensure model is initialized (should already be initialized)
        if (!ttsModel) {
            await initializeTTS();
        }

        // Validate and sanitize text
        if (!text || typeof text !== 'string') {
            throw new Error('Invalid text input');
        }
        
        // Clean text - remove problematic characters that can cause issues
        // Normalize text for better TTS quality
        const cleanText = text.trim()
            .replace(/\.{3,}/g, '...') // Limit consecutive periods
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[^\w\s.,!?;:'"()-]/g, ''); // Remove special characters that might confuse the model
        
        if (!cleanText || cleanText.length === 0) {
            throw new Error('Text is empty after cleaning');
        }
        
        // For low latency with q4 model, limit text length for faster generation
        const maxLength = 100; // Optimized for q4 quantization speed
        const truncatedText = cleanText.length > maxLength ? cleanText.substring(0, maxLength) + '...' : cleanText;
        
        // Validate voice ID - include all voices used in character mapping and common Kokoro voices
        const validVoices = [
            // American Female voices
            'af_bella', 'af_sarah', 'af_heart', 'af_alloy', 'af_aoede', 'af_jessica', 
            'af_kore', 'af_nicole', 'af_nova', 'af_river', 'af_sky',
            // American Male voices
            'am_adam', 'am_michael', 'am_echo', 'am_eric', 'am_fenrir', 
            'am_liam', 'am_onyx', 'am_puck', 'am_santa',
            // British Female voices
            'bf_alice', 'bf_emma', 'bf_isabella', 'bf_lily',
            // British Male voices
            'bm_daniel', 'bm_fable', 'bm_george', 'bm_lewis'
        ];
        // Use the provided voice ID if valid, otherwise default to am_adam
        const safeVoiceId = validVoices.includes(voiceId) ? voiceId : 'am_adam';
        
        console.log('Generating audio:', { 
            textLength: truncatedText.length, 
            voiceId: safeVoiceId,
            originalVoiceId: voiceId 
        });
        
        // Generate audio with optimized settings
        // Note: Kokoro TTS should auto-detect language from text, but we ensure English text
        const audio = await ttsModel.generate(truncatedText, {
            voice: safeVoiceId,
            speed: 1.0,
            // Add any language hints if supported by the model
            // Most Kokoro models are English-focused, so English text should work correctly
        });
        
        // Validate audio before conversion
        if (!audio) {
            throw new Error('TTS model returned null/undefined audio');
        }
        
        const generationTime = performance.now() - startTime;
        console.log(`Audio generation took ${generationTime.toFixed(2)}ms`);
        
        return convertAudioToBlob(audio);
    } catch (error) {
        console.error("Failed to generate audio:", error);
        throw error;
    }
}

/**
 * Convert RawAudio object to Blob - optimized for performance and correctness
 */
function convertAudioToBlob(audio) {
    try {
        // Check if audio is valid
        if (!audio) {
            throw new Error('Audio object is null or undefined');
        }

        // Priority 1: Use toBlob() method if available (fastest and most reliable)
        if (typeof audio.toBlob === 'function') {
            try {
                const blob = audio.toBlob();
                if (blob && blob.size > 0) {
                    return blob;
                }
            } catch (toBlobError) {
                console.warn('toBlob() failed:', toBlobError);
            }
        }
        
        // Priority 2: Use toWav() if available
        if (typeof audio.toWav === 'function') {
            try {
                const wavBuffer = audio.toWav();
                if (wavBuffer && wavBuffer.byteLength > 0) {
                    return new Blob([wavBuffer], { type: 'audio/wav' });
                }
            } catch (toWavError) {
                console.warn('toWav() failed:', toWavError);
            }
        }
        
        // Priority 3: Manual conversion from RawAudio structure (fallback)
        if (audio.audio && audio.sampling_rate) {
            const audioData = audio.audio;
            const sampleRate = audio.sampling_rate || 24000; // Default to 24kHz if missing
            
            // Validate audio data
            if (!(audioData instanceof Float32Array) && !Array.isArray(audioData)) {
                throw new Error('Invalid audio data type: ' + typeof audioData);
            }
            
            if (audioData.length === 0) {
                throw new Error('Audio data is empty');
            }
            
            // Convert to Float32Array if needed
            const float32Data = audioData instanceof Float32Array 
                ? audioData 
                : new Float32Array(audioData);
            
            // Validate sample rate
            const validSampleRate = (sampleRate >= 8000 && sampleRate <= 48000) ? sampleRate : 24000;
            
            // Quick validation - check first few samples
            let hasValidData = false;
            for (let i = 0; i < Math.min(1000, float32Data.length); i++) {
                const val = float32Data[i];
                if (!isNaN(val) && isFinite(val) && val !== 0 && Math.abs(val) <= 1.0) {
                    hasValidData = true;
                    break;
                }
            }
            
            if (!hasValidData) {
                throw new Error('Audio data appears to be invalid (all zeros, NaN, or out of range)');
            }
            
            // Convert Float32Array to Int16Array for WAV format (optimized)
            const int16Data = new Int16Array(float32Data.length);
            for (let i = 0; i < float32Data.length; i++) {
                const val = float32Data[i];
                // Clamp to [-1, 1] range and convert to int16
                const clamped = Math.max(-1, Math.min(1, val));
                int16Data[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
            }
            
            // Create WAV file blob
            const wavBuffer = createWavBuffer(int16Data, validSampleRate);
            return new Blob([wavBuffer], { type: 'audio/wav' });
        }
        
        // Priority 4: Already a blob
        if (audio instanceof Blob) {
            return audio;
        }

        // If we get here, we don't know how to convert this audio format
        console.error('Audio object structure:', {
            type: typeof audio,
            constructor: audio?.constructor?.name,
            keys: audio ? Object.keys(audio) : null,
            hasAudio: !!audio?.audio,
            hasSamplingRate: !!audio?.sampling_rate,
            hasToBlob: typeof audio?.toBlob,
        });

        throw new Error('Unable to convert audio to blob format. Audio type: ' + typeof audio);
    } catch (error) {
        console.error('Error converting audio to blob:', error);
        throw error;
    }
}

/**
 * Create WAV file buffer from audio data
 * @param {Int16Array} samples - Audio samples
 * @param {number} sampleRate - Sample rate (default: 24000)
 * @returns {ArrayBuffer} - WAV file buffer
 */
function createWavBuffer(samples, sampleRate = 24000) {
    const length = samples.length;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (1 = PCM)
    view.setUint16(22, 1, true); // num channels
    view.setUint32(24, sampleRate, true); // sample rate
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Write samples
    let offset = 44;
    for (let i = 0; i < length; i++) {
        view.setInt16(offset, samples[i], true);
        offset += 2;
    }
    
    return buffer;
}

/**
 * Play generated audio with queue system to prevent overlapping playback
 * @param {Blob} audioBlob - The audio blob to play
 * @returns {Promise<void>}
 */
export async function playAudio(audioBlob) {
    return new Promise((resolve, reject) => {
        try {
            // Validate blob
            if (!audioBlob || !(audioBlob instanceof Blob)) {
                reject(new Error('Invalid audio blob'));
                return;
            }
            
            if (audioBlob.size === 0) {
                reject(new Error('Audio blob is empty'));
                return;
            }
            
            // Add to queue if audio is currently playing
            if (isPlayingAudio) {
                audioQueue.push({ audioBlob, resolve, reject });
                console.log('Audio queued, current queue length:', audioQueue.length);
                return;
            }
            
            // Play immediately
            playAudioImmediate(audioBlob, resolve, reject);
        } catch (error) {
            console.error('Error setting up audio playback:', error);
            reject(error);
        }
    });
}

/**
 * Play audio immediately and process queue - optimized for low latency
 */
function playAudioImmediate(audioBlob, resolve, reject) {
    try {
        isPlayingAudio = true;
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Optimize for low latency playback
        audio.volume = 1.0;
        audio.preload = 'auto';
        
        // Clean up URL when done
        const cleanup = () => {
            URL.revokeObjectURL(audioUrl);
            isPlayingAudio = false;
        };
        
        // Handle successful playback end
        audio.onended = () => {
            cleanup();
            resolve();
            
            // Play next item in queue
            if (audioQueue.length > 0) {
                const next = audioQueue.shift();
                playAudioImmediate(next.audioBlob, next.resolve, next.reject);
            }
        };
        
        // Handle errors
        audio.onerror = () => {
            cleanup();
            const errorMsg = audio.error?.message || 'Unknown audio playback error';
            reject(new Error(`Audio playback failed: ${errorMsg}`));
            
            // Try next item in queue even if this one failed
            if (audioQueue.length > 0) {
                const next = audioQueue.shift();
                playAudioImmediate(next.audioBlob, next.resolve, next.reject);
            }
        };
        
        // Start playback
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch((error) => {
                cleanup();
                reject(new Error(`Failed to play audio: ${error.message}`));
                
                // Try next item in queue
                if (audioQueue.length > 0) {
                    const next = audioQueue.shift();
                    playAudioImmediate(next.audioBlob, next.resolve, next.reject);
                }
            });
        }
    } catch (error) {
        isPlayingAudio = false;
        reject(error);
    }
}

/**
 * Generate and play audio in one call - optimized for low latency
 * @param {string} text - The text to convert to speech
 * @param {string} voiceId - The voice ID to use
 * @returns {Promise<void>}
 */
export async function generateAndPlayAudio(text, voiceId = "af_bella") {
    const totalStartTime = performance.now();
    
    try {
        // Model should already be initialized, but ensure it's ready
        if (!ttsModel) {
            await initializeTTS();
        }
        
        // Generate audio
        const audioBlob = await generateAudio(text, voiceId);
        
        // Quick validation
        if (!audioBlob || !(audioBlob instanceof Blob) || audioBlob.size < 100) {
            throw new Error('Invalid audio blob generated');
        }
        
        const generationTime = performance.now() - totalStartTime;
        console.log(`Audio generated in ${generationTime.toFixed(2)}ms`);
        
        // Play audio (non-blocking)
        await playAudio(audioBlob);
        
        const totalTime = performance.now() - totalStartTime;
        console.log(`Total TTS time: ${totalTime.toFixed(2)}ms`);
    } catch (error) {
        console.error('TTS Error:', error?.message || error);
        throw error;
    }
}

/**
 * Get list of available voices
 * @returns {Promise<Array>}
 */
export async function getAvailableVoices() {
    try {
        if (!ttsModel) {
            await initializeTTS();
        }
        
        if (typeof ttsModel.list_voices === 'function') {
            return await ttsModel.list_voices();
        }
        
        // Fallback: return our configured voices
        return Object.values(VOICE_CONFIGS).map(v => v.id);
    } catch (error) {
        console.error("Failed to get voices:", error);
        // Return default voices
        return Object.values(VOICE_CONFIGS).map(v => v.id);
    }
}

