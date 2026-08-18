/**
 * GEOPOWER - 1970s Retro Newsreel Introduction Script
 * Handles scene timing, sound synthesis (vinyl/projector), speech synthesis narration, and interactivity.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const scenes = document.querySelectorAll('.newsreel-scene');
  const scenePills = document.querySelectorAll('.scene-pill');
  const progressBar = document.getElementById('progressBar');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnSoundToggle = document.getElementById('btnSoundToggle');
  const btnVoiceToggle = document.getElementById('btnVoiceToggle');
  const ctaOverlay = document.getElementById('ctaOverlay');
  const btnStartGame = document.getElementById('btnStartGame');

  // State Variables
  let currentSceneIndex = 0;
  let soundEnabled = true;
  let voiceEnabled = true;
  let typewriterTimeout = null;
  let currentDuration = 5500;
  
  // Web Audio Context for Vinyl Crackle & Projector Hum
  let audioCtx = null;
  let projectorNode = null;

  // Narration Texts
  const narrations = [
    `"O ano é 1970! O mundo marcha a passos largos rumo ao progresso industrial. Máquinas que nunca dormem, cidades iluminadas dia e noite e um apetite insaciável por energia!"`,
    `"Mas a locomotiva do desenvolvimento encontra seus limites! Secas severas esvaziam grandes represas, o petróleo torna-se uma arma de disputa geopolítica e as rotas marítimas mundiais entram em colapso!"`,
    `"Nenhuma nação é uma ilha! Isolados, todos enfrentam o colapso. Juntos, os líderes mundiais são convocados para a mais decisiva conferência internacional da história recente."`,
    `"Você assume o comando da política energética de sua pátria. Comércio, diplomacia, ciência e coragem. O destino de cinquenta anos de história está sob o seu controle. Que comece a corrida energética!"`
  ];

  // ==========================================================================
  // Web Audio API Synthesizer (Vinyl Crackle & Projector Motor Noise)
  // ==========================================================================
  function initAudioEngine() {
    if (audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();

      // 1. Vinyl Crackle Generator (Filtered Noise + Random Clicks)
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Occasional vinyl pops
        if (Math.random() < 0.001) {
          output[i] = (Math.random() * 2 - 1) * 0.8;
        } else {
          output[i] = (Math.random() * 2 - 1) * 0.015;
        }
      }

      const vinylNode = audioCtx.createBufferSource();
      vinylNode.buffer = noiseBuffer;
      vinylNode.loop = true;

      const vinylFilter = audioCtx.createBiquadFilter();
      vinylFilter.type = 'bandpass';
      vinylFilter.frequency.value = 1200;
      vinylFilter.Q.value = 1.5;

      const vinylGain = audioCtx.createGain();
      vinylGain.gain.value = soundEnabled ? 0.35 : 0;

      vinylNode.connect(vinylFilter);
      vinylFilter.connect(vinylGain);
      vinylGain.connect(audioCtx.destination);
      vinylNode.start();

      // 2. Projector Motor Hum Generator (Low Frequency Oscillator)
      const humOsc = audioCtx.createOscillator();
      humOsc.type = 'sawtooth';
      humOsc.frequency.value = 48; // 48Hz motor hum

      const humFilter = audioCtx.createBiquadFilter();
      humFilter.type = 'lowpass';
      humFilter.frequency.value = 180;

      const humGain = audioCtx.createGain();
      humGain.gain.value = soundEnabled ? 0.08 : 0;

      humOsc.connect(humFilter);
      humFilter.connect(humGain);
      humGain.connect(audioCtx.destination);
      humOsc.start();

      projectorNode = { vinylGain, humGain };
    } catch (e) {
      console.warn("Web Audio API Error or not supported:", e);
    }
  }

  function toggleAudio(enable) {
    soundEnabled = enable;
    if (!audioCtx) initAudioEngine();
    if (projectorNode) {
      projectorNode.vinylGain.gain.setTargetAtTime(soundEnabled ? 0.35 : 0, audioCtx.currentTime, 0.1);
      projectorNode.humGain.gain.setTargetAtTime(soundEnabled ? 0.08 : 0, audioCtx.currentTime, 0.1);
    }
  }

  // Play retro audio click sound effect on UI interaction
  function playClickSound() {
    if (!soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
  }

  // ==========================================================================
  // Speech Synthesis & Typewriter Effect
  // ==========================================================================
  function speakNarration(text) {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel(); // Stop ongoing speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05; // Slightly urgent newsreel pace
    utterance.pitch = 0.95; // Retro radio baritone pitch

    // Try selecting a Portuguese voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt') || v.lang.includes('BR'));
    if (ptVoice) utterance.voice = ptVoice;

    window.speechSynthesis.speak(utterance);
  }

  function startTypewriterEffect(elementId, fullText, durationMs) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (typewriterTimeout) clearTimeout(typewriterTimeout);

    element.innerHTML = '';
    let index = 0;
    const intervalMs = Math.max(20, Math.floor(durationMs / (fullText.length + 5)));

    function typeNextChar() {
      if (index < fullText.length) {
        element.innerHTML += fullText.charAt(index);
        index++;
        typewriterTimeout = setTimeout(typeNextChar, intervalMs);
      }
    }
    typeNextChar();
  }

  // ==========================================================================
  // Scene Controller Machine
  // ==========================================================================
  function showScene(index) {
    // Ensure index bounds
    if (index < 0) index = 0;
    if (index >= scenes.length) index = scenes.length - 1;

    currentSceneIndex = index;

    // Update active class on scene sections
    scenes.forEach((sc, i) => {
      if (i === currentSceneIndex) {
        sc.classList.add('active');
      } else {
        sc.classList.remove('active');
      }
    });

    // Update scene indicator pills
    scenePills.forEach((pill, i) => {
      if (i === currentSceneIndex) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Show CTA overlay if on scene 4 (last scene), otherwise hide
    if (currentSceneIndex === scenes.length - 1) {
      ctaOverlay.classList.add('active');
    } else {
      ctaOverlay.classList.remove('active');
    }

    // Get current scene duration for typewriter text animation
    const currentScene = scenes[currentSceneIndex];
    currentDuration = parseInt(currentScene.getAttribute('data-duration')) || 5500;

    // Trigger Typewriter & Voice Narration
    const narrationText = narrations[currentSceneIndex];
    const narrationElemId = `narration-${currentSceneIndex + 1}`;
    startTypewriterEffect(narrationElemId, narrationText, currentDuration - 500);
    speakNarration(narrationText);

    // Update progress bar percentage based on active scene index
    const pct = ((currentSceneIndex + 1) / scenes.length) * 100;
    progressBar.style.width = `${pct}%`;
  }

  // ==========================================================================
  // Event Listeners & Keyboard Controls
  // ==========================================================================

  // Next Scene Button
  btnNext.addEventListener('click', () => {
    playClickSound();
    if (currentSceneIndex < scenes.length - 1) {
      showScene(currentSceneIndex + 1);
    } else {
      ctaOverlay.classList.add('active');
    }
  });

  // Prev Scene Button
  btnPrev.addEventListener('click', () => {
    playClickSound();
    if (currentSceneIndex > 0) {
      showScene(currentSceneIndex - 1);
    }
  });

  // Direct Scene Pill Navigation
  scenePills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      playClickSound();
      const targetIndex = parseInt(e.target.getAttribute('data-goto')) - 1;
      showScene(targetIndex);
    });
  });

  // Sound Toggle Button
  btnSoundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    toggleAudio(soundEnabled);
    if (soundEnabled) {
      btnSoundToggle.classList.add('toggle-active');
      btnSoundToggle.innerHTML = '🔊 SOM';
    } else {
      btnSoundToggle.classList.remove('toggle-active');
      btnSoundToggle.innerHTML = '🔇 MUTE';
    }
  });

  // Voice Toggle Button
  btnVoiceToggle.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    if (!voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      btnVoiceToggle.classList.remove('toggle-active');
      btnVoiceToggle.innerHTML = '🎙️ VOZ: OFF';
    } else {
      btnVoiceToggle.classList.add('toggle-active');
      btnVoiceToggle.innerHTML = '🎙️ LOCUÇÃO';
      speakNarration(narrations[currentSceneIndex]);
    }
  });

  // Start Game Button Action
  btnStartGame.addEventListener('click', () => {
    playClickSound();
    alert('⚡ GEOPOWER: A corrida energética começou!\n\nVocê assumiu o comando da política energética de sua pátria. Preparando módulo principal do jogo...');
  });

  // Keyboard Shortcuts (Arrow keys, Spacebar, Enter, M, V)
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'Enter') {
      e.preventDefault();
      btnNext.click();
    } else if (e.code === 'ArrowLeft') {
      btnPrev.click();
    } else if (e.code === 'KeyM') {
      btnSoundToggle.click();
    } else if (e.code === 'KeyV') {
      btnVoiceToggle.click();
    }
  });

  // Start Audio Context on First User Click anywhere on body
  document.body.addEventListener('click', () => {
    initAudioEngine();
  }, { once: true });

  // Initialize Newsreel on Scene 0
  showScene(0);
});
