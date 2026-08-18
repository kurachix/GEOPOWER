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
  // Speech Synthesis (Locução Natural com Vozes Neurais & Cadência por Frases)
  // ==========================================================================
  let availableVoices = [];

  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    availableVoices = window.speechSynthesis.getVoices();
  }

  loadVoices();
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function getBestPortugueseVoice() {
    if (!availableVoices || availableVoices.length === 0) {
      loadVoices();
    }

    const ptBrVoices = availableVoices.filter(v => 
      v.lang.replace('_', '-').toLowerCase().includes('pt-br') ||
      v.lang.toLowerCase().startsWith('pt')
    );

    if (ptBrVoices.length === 0) return null;

    // 1. Vozes Neurais/Naturais de alta fidelidade (Microsoft Online (Natural), Google, Neural, Premium)
    const naturalVoice = ptBrVoices.find(v => 
      /natural|google|neural|online|enhanced|premium/i.test(v.name)
    );
    if (naturalVoice) return naturalVoice;

    // 2. Vozes Masculinas ou Expressivas de Noticiário/Rádio (Antonio, Humberto, Ricardo, Daniel, Felipe)
    const radioVoice = ptBrVoices.find(v => 
      /antonio|humberto|ricardo|daniel|felipe|francisca|luciana/i.test(v.name)
    );
    if (radioVoice) return radioVoice;

    // 3. Qualquer voz com id PT-BR
    const brVoice = ptBrVoices.find(v => v.lang.replace('_', '-').toLowerCase() === 'pt-br');
    if (brVoice) return brVoice;

    return ptBrVoices[0];
  }

  function speakNarration(text) {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Cancela sínteses anteriores para evitar sobreposição
    window.speechSynthesis.cancel();

    // Limpa aspas decorativas e ajusta pontuação para leitura fluida
    const cleanedText = text.replace(/["'«»]/g, '').trim();

    // Divide a narração por frases com pontuação (. ! ?) para criar pausas dramáticas e entonação humana
    const sentences = cleanedText
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);

    const voice = getBestPortugueseVoice();
    let sentenceIndex = 0;

    function speakNextSentence() {
      if (!voiceEnabled || sentenceIndex >= sentences.length) return;

      const sentenceText = sentences[sentenceIndex];
      const utterance = new SpeechSynthesisUtterance(sentenceText);
      
      utterance.lang = 'pt-BR';
      utterance.rate = 0.98; // Ritmo natural de locução humana de rádio/noticiário
      utterance.pitch = 1.0;  // Afinação natural sem distorção robótica
      utterance.volume = 1.0;

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        sentenceIndex++;
        // Pequena pausa de respiração natural (180ms) entre frases
        setTimeout(() => {
          if (voiceEnabled) speakNextSentence();
        }, 180);
      };

      utterance.onerror = (err) => {
        console.warn("Erro na síntese de voz:", err);
      };

      window.speechSynthesis.speak(utterance);
    }

    speakNextSentence();
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

    // Always hide CTA overlay when navigating/rendering scenes
    ctaOverlay.classList.remove('active');

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
    } else if (!ctaOverlay.classList.contains('active')) {
      // On last scene (Cena 4), clicking Next shows the Start Game card
      ctaOverlay.classList.add('active');
    }
  });

  // Prev Scene Button
  btnPrev.addEventListener('click', () => {
    playClickSound();
    if (ctaOverlay.classList.contains('active')) {
      // If Start Game card is active, hide it to reveal Scene 4
      ctaOverlay.classList.remove('active');
    } else if (currentSceneIndex > 0) {
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

  const startPromptOverlay = document.getElementById('startPromptOverlay');
  const btnStartProjector = document.getElementById('btnStartProjector');

  // Start Experience Machine (Ligar Projetor, Som e Locução Simultaneamente)
  let isStarted = false;

  function startExperience() {
    if (isStarted) return;
    isStarted = true;

    if (startPromptOverlay) {
      startPromptOverlay.classList.remove('active');
    }

    // Inicializa sintetizador de áudio (ruído de vinil + zumbido do motor)
    initAudioEngine();

    // Dispara a cena 0 (locução + efeito de digitação) exatamente no mesmo instante
    showScene(0);
  }

  if (startPromptOverlay) {
    startPromptOverlay.addEventListener('click', startExperience);
  }

  if (btnStartProjector) {
    btnStartProjector.addEventListener('click', (e) => {
      e.stopPropagation();
      startExperience();
    });
  }

  // ==========================================================================
  // Player Setup Screen Module (Tela de Escolha dos Jogadores & Credenciamento)
  // ==========================================================================
  const retroIntroScreen = document.getElementById('retroIntroScreen');
  const playerSetupScreen = document.getElementById('playerSetupScreen');
  const playerSlotsContainer = document.getElementById('playerSlotsContainer');
  const countButtonsGroup = document.getElementById('countButtonsGroup');
  const btnBackToIntro = document.getElementById('btnBackToIntro');
  const btnConfirmSetup = document.getElementById('btnConfirmSetup');

  const NATIONS_DATA = {
    norway: {
      id: 'norway',
      name: 'Noruega',
      flag: '🇳🇴',
      tagline: 'Pioneira Hidrelétrica & Petróleo do Mar do Norte',
      matrix: [
        { label: '💧 HIDRELÉTRICA', pct: 75 },
        { label: '🛢️ PETRÓLEO / GÁS', pct: 20 },
        { label: '⛏️ CARVÃO TÉRMICO', pct: 5 }
      ],
      vulnerability: 'Alta exposição à volatilidade do mercado internacional de combustíveis e picos de demanda no inverno rigoroso.'
    },
    brazil: {
      id: 'brazil',
      name: 'Brasil',
      flag: '🇧🇷',
      tagline: 'Bacias Hidrográficas & Biocombustíveis',
      matrix: [
        { label: '💧 HIDRELÉTRICA', pct: 80 },
        { label: '🌿 BIOCOMBUSTÍVEIS', pct: 10 },
        { label: '⛏️ CARVÃO / TÉRMICA', pct: 10 }
      ],
      vulnerability: 'Vulnerabilidade severa a secas prolongadas (risco hidrológico) e altos custos de transmissão em malha extensa.'
    },
    iceland: {
      id: 'iceland',
      name: 'Islândia',
      flag: '🇮🇸',
      tagline: 'Energia Vulcânica Geotérmica & Hidro',
      matrix: [
        { label: '🌋 GEOTÉRMICA', pct: 65 },
        { label: '💧 HIDRELÉTRICA', pct: 30 },
        { label: '🛢️ PETRÓLEO IMPORTADO', pct: 5 }
      ],
      vulnerability: 'Rede elétrica isolada sem interconexões transfronteiriças e dependência total de combustíveis importados para transportes.'
    },
    uk: {
      id: 'uk',
      name: 'Reino Unido',
      flag: '🇬🇧',
      tagline: 'Tradição Carvoeira, Gás e Eólica Offshore',
      matrix: [
        { label: '⛏️ CARVÃO TÉRMICO', pct: 55 },
        { label: '🛢️ GÁS / PETRÓLEO', pct: 35 },
        { label: '🌬️ EÓLICA / HIDRO', pct: 5 },
        { label: '⚛️ NUCLEAR', pct: 5 }
      ],
      vulnerability: 'Esgotamento acelerado das jazidas nacionais de carvão e alta vulnerabilidade a choques e bloqueios de rotas marítimas.'
    },
    usa: {
      id: 'usa',
      name: 'Estados Unidos',
      flag: '🇺🇸',
      tagline: 'Potência Industrial, Carvão & Matriz Nuclear',
      matrix: [
        { label: '⛏️ CARVÃO TÉRMICO', pct: 45 },
        { label: '🛢️ PETRÓLEO / GÁS', pct: 30 },
        { label: '⚛️ NUCLEAR', pct: 15 },
        { label: '💧 HIDRELÉTRICA', pct: 10 }
      ],
      vulnerability: 'Voraz consumo per capita, elevadíssima pegada de carbono acumulada e risco extremo de embargos internacionais.'
    }
  };

  let selectedPlayerCount = 3;
  let playersState = [
    { id: 1, name: 'Líder 1', type: 'human', nationId: 'norway' },
    { id: 2, name: 'Líder 2', type: 'human', nationId: 'brazil' },
    { id: 3, name: 'Líder 3', type: 'bot', nationId: 'iceland' },
    { id: 4, name: 'Líder 4', type: 'bot', nationId: 'uk' },
    { id: 5, name: 'Líder 5', type: 'bot', nationId: 'usa' }
  ];

  const nationKeys = Object.keys(NATIONS_DATA);

  function renderPlayerSlots() {
    if (!playerSlotsContainer) return;
    playerSlotsContainer.innerHTML = '';

    // Collect currently used nation IDs by active players to avoid duplicate selection conflicts
    const activeNationIds = playersState.slice(0, selectedPlayerCount).map(p => p.nationId);

    for (let i = 0; i < selectedPlayerCount; i++) {
      const player = playersState[i];
      const nation = NATIONS_DATA[player.nationId] || NATIONS_DATA['norway'];

      const card = document.createElement('article');
      card.className = 'player-card';
      card.setAttribute('data-player-id', player.id);

      // Render Dropdown options
      let optionsHTML = '';
      nationKeys.forEach(key => {
        const nat = NATIONS_DATA[key];
        const isSelected = key === player.nationId;
        const isUsedByOther = activeNationIds.includes(key) && !isSelected;
        const disabledAttr = isUsedByOther ? 'disabled' : '';
        const usedTag = isUsedByOther ? ' (Já Escolhida)' : '';
        optionsHTML += `<option value="${key}" ${isSelected ? 'selected' : ''} ${disabledAttr}>${nat.flag} ${nat.name.toUpperCase()}${usedTag}</option>`;
      });

      // Render Matrix Stats Bars
      let matrixHTML = '';
      nation.matrix.forEach(item => {
        matrixHTML += `
          <div class="matrix-stat-item">
            <span class="stat-label">${item.label}</span>
            <div class="stat-bar"><div class="stat-bar-fill" style="width: ${item.pct}%;"></div></div>
            <span class="stat-value">${item.pct}%</span>
          </div>
        `;
      });

      card.innerHTML = `
        <header class="player-card-header">
          <div class="player-badge">CREDENCIAL Nº 0${player.id}</div>
          <div class="controller-toggle">
            <button class="btn-toggle-type ${player.type === 'human' ? 'active' : ''}" data-type="human" data-player="${player.id}">👤 HUMANO</button>
            <button class="btn-toggle-type ${player.type === 'bot' ? 'active' : ''}" data-type="bot" data-player="${player.id}">🤖 BOT (IA)</button>
          </div>
        </header>

        <div class="player-input-group">
          <label class="input-label">NOME DO LÍDER / DELEGADO:</label>
          <input type="text" class="player-name-input" data-player="${player.id}" value="${player.name}" maxlength="20" placeholder="Nome do Jogador">
        </div>

        <div class="nation-select-wrapper">
          <label class="input-label">NAÇÃO SELECIONADA:</label>
          <select class="nation-select-dropdown" data-player="${player.id}">
            ${optionsHTML}
          </select>
        </div>

        <div class="nation-details-card">
          <div class="nation-card-header">
            <span class="nation-flag-icon">${nation.flag}</span>
            <div class="nation-title-box">
              <h3 class="nation-name">${nation.name.toUpperCase()}</h3>
              <span class="nation-tagline">${nation.tagline}</span>
            </div>
          </div>

          <div class="matrix-stats-grid">
            ${matrixHTML}
          </div>

          <div class="vulnerability-box">
            <strong class="vulnerability-title">⚠️ VULNERABILIDADE GEOPOLÍTICA:</strong>
            <p class="vulnerability-text">${nation.vulnerability}</p>
          </div>
        </div>
      `;

      playerSlotsContainer.appendChild(card);
    }

    // Attach Event Handlers to newly rendered player cards
    attachPlayerCardListeners();
  }

  function attachPlayerCardListeners() {
    // Type Toggle Buttons (Humano / Bot)
    document.querySelectorAll('.btn-toggle-type').forEach(btn => {
      btn.addEventListener('click', (e) => {
        playClickSound();
        const pId = parseInt(e.target.getAttribute('data-player'));
        const newType = e.target.getAttribute('data-type');
        const player = playersState.find(p => p.id === pId);
        if (player) {
          player.type = newType;
          renderPlayerSlots();
        }
      });
    });

    // Player Name Inputs
    document.querySelectorAll('.player-name-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const pId = parseInt(e.target.getAttribute('data-player'));
        const player = playersState.find(p => p.id === pId);
        if (player) {
          player.name = e.target.value.trim() || `Líder ${pId}`;
        }
      });
    });

    // Nation Select Dropdowns
    document.querySelectorAll('.nation-select-dropdown').forEach(select => {
      select.addEventListener('change', (e) => {
        playClickSound();
        const pId = parseInt(e.target.getAttribute('data-player'));
        const newNationId = e.target.value;
        const player = playersState.find(p => p.id === pId);

        if (player) {
          // If another active player currently has this nation, swap nations
          const otherPlayerWithNation = playersState.slice(0, selectedPlayerCount).find(p => p.id !== pId && p.nationId === newNationId);
          if (otherPlayerWithNation) {
            otherPlayerWithNation.nationId = player.nationId;
          }
          player.nationId = newNationId;
          renderPlayerSlots();
        }
      });
    });
  }

  // Player Count Selector Handler
  if (countButtonsGroup) {
    countButtonsGroup.querySelectorAll('.btn-count').forEach(btn => {
      btn.addEventListener('click', (e) => {
        playClickSound();
        countButtonsGroup.querySelectorAll('.btn-count').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        selectedPlayerCount = parseInt(e.target.getAttribute('data-count'));
        renderPlayerSlots();
      });
    });
  }

  // Transition to Setup Screen from Intro CTA
  btnStartGame.addEventListener('click', () => {
    playClickSound();
    if (retroIntroScreen) retroIntroScreen.classList.add('hidden');
    if (playerSetupScreen) playerSetupScreen.classList.remove('hidden');
    renderPlayerSlots();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  });

  // Transition back to Intro Newsreel from Setup
  if (btnBackToIntro) {
    btnBackToIntro.addEventListener('click', () => {
      playClickSound();
      if (playerSetupScreen) playerSetupScreen.classList.add('hidden');
      if (retroIntroScreen) retroIntroScreen.classList.remove('hidden');
      showScene(currentSceneIndex);
    });
  }

  // Confirm Setup Action
  if (btnConfirmSetup) {
    btnConfirmSetup.addEventListener('click', () => {
      playClickSound();
      const activePlayers = playersState.slice(0, selectedPlayerCount);
      const summaryText = activePlayers.map(p => `- ${p.name} (${p.type.toUpperCase()}): ${NATIONS_DATA[p.nationId].flag} ${NATIONS_DATA[p.nationId].name}`).join('\n');
      alert(`⚡ CONFERÊNCIA INTERNACIONAL DE 1970 INICIADA!\n\nDelegados Credenciados:\n${summaryText}\n\nInicializando motor de simulação (Turno 1 / 50)...`);
    });
  }

  // Keyboard Shortcuts (Arrow keys, Spacebar, Enter, M, V)
  document.addEventListener('keydown', (e) => {
    if (!isStarted) {
      startExperience();
      return;
    }

    // Only apply Intro keyboard shortcuts if Intro screen is visible
    if (retroIntroScreen && !retroIntroScreen.classList.contains('hidden')) {
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
    }
  });

  // Fallback: Qualquer clique no corpo da página se ainda não iniciado
  document.body.addEventListener('click', () => {
    if (!isStarted) startExperience();
  });

  // Initial render of setup screen slots
  renderPlayerSlots();
});
