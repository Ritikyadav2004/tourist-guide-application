export const playNotificationSound = (type = 'success') => {
  const sounds = {
    success: '/sounds/mixkit-kids-cartoon-close-bells-2256.wav',
    error: '/sounds/error-remove.wav',
    processing: '/sounds/processing-back.wav',
  };

  const soundPath = sounds[type] || sounds.success;

  try {
    const audio = new Audio(soundPath);
    audio.volume = 0.5;
    audio.play().catch((err) => {
      console.warn(`Autoplay blocked or audio playback failed for sound type: ${type}`, err);
      // Synthesize audio fallback in case file playback is blocked or fails
      playSynthesizedFallback(type);
    });
  } catch (err) {
    console.error("Failed to initialize notification audio:", err);
    playSynthesizedFallback(type);
  }
};

const playSynthesizedFallback = (type) => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const now = audioContext.currentTime;

    if (type === 'success') {
      // High-pitched double beep (success/bells)
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.setValueAtTime(1046.5, now + 0.1); // high C
      
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
      gainNode.gain.exponentialRampToValueAtTime(0.15, now + 0.11);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      oscillator.start(now);
      oscillator.stop(now + 0.35);
    } else if (type === 'error') {
      // Low-pitched warning tone (error/buzz)
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(180, now);
      
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      oscillator.start(now);
      oscillator.stop(now + 0.28);
    } else if (type === 'processing') {
      // Smooth sliding frequency beep (processing/action)
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(440, now);
      oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.2);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.15, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      oscillator.start(now);
      oscillator.stop(now + 0.28);
    }
  } catch (err) {
    console.error("Synthesized audio fallback failed:", err);
  }
};
