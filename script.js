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
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      playClickSound();
      if (currentSceneIndex < scenes.length - 1) {
        showScene(currentSceneIndex + 1);
      } else if (ctaOverlay && !ctaOverlay.classList.contains('active')) {
        // On last scene (Cena 4), clicking Next shows the Start Game card
        ctaOverlay.classList.add('active');
      }
    });
  }

  // Prev Scene Button
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      playClickSound();
      if (ctaOverlay && ctaOverlay.classList.contains('active')) {
        // If Start Game card is active, hide it to reveal Scene 4
        ctaOverlay.classList.remove('active');
      } else if (currentSceneIndex > 0) {
        showScene(currentSceneIndex - 1);
      }
    });
  }

  // Direct Scene Pill Navigation
  if (scenePills) {
    scenePills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        playClickSound();
        const targetIndex = parseInt(e.target.getAttribute('data-goto')) - 1;
        showScene(targetIndex);
      });
    });
  }

  // Sound Toggle Button
  if (btnSoundToggle) {
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
  }

  // Voice Toggle Button
  if (btnVoiceToggle) {
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
  }

  // Start Experience Machine (Ligar Projetor, Som e Locução Simultaneamente)
  let isStarted = false;

  window.startExperience = function() {
    if (isStarted) return;
    isStarted = true;

    try {
      const overlay = document.getElementById('startPromptOverlay');
      if (overlay) {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
      }
    } catch (e) {}

    try {
      initAudioEngine();
    } catch (e) {}

    try {
      showScene(0);
    } catch (e) {}
  };

  function startExperience() {
    window.startExperience();
  }

  if (startPromptOverlay) {
    startPromptOverlay.addEventListener('click', () => window.startExperience());
  }

  if (btnStartProjector) {
    btnStartProjector.addEventListener('click', (e) => {
      e.stopPropagation();
      window.startExperience();
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
  window.goToSetupScreen = function() {
    try { playClickSound(); } catch (e) {}
    const retroIntroScreen = document.getElementById('retroIntroScreen');
    const playerSetupScreen = document.getElementById('playerSetupScreen');
    if (retroIntroScreen) retroIntroScreen.classList.add('hidden');
    if (playerSetupScreen) playerSetupScreen.classList.remove('hidden');
    try { renderPlayerSlots(); } catch (e) {}
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
  };

  if (btnStartGame) {
    btnStartGame.addEventListener('click', () => window.goToSetupScreen());
  }

  // Transition back to Intro Newsreel from Setup
  if (btnBackToIntro) {
    btnBackToIntro.addEventListener('click', () => {
      playClickSound();
      if (playerSetupScreen) playerSetupScreen.classList.add('hidden');
      if (retroIntroScreen) retroIntroScreen.classList.remove('hidden');
      showScene(currentSceneIndex);
    });
  }

  // ==========================================================================
  // Single Screen Plenary Stage Engine (Motor Acelerado de 50 Turnos: 1970–2020)
  // ==========================================================================
  const gameStageScreen = document.getElementById('gameStageScreen');
  const hudYearBadge = document.getElementById('hudYearBadge');
  const hudPhaseBadge = document.getElementById('hudPhaseBadge');
  const hudFootprintFill = document.getElementById('hudFootprintFill');
  const hudFootprintVal = document.getElementById('hudFootprintVal');
  const councilSeatsGrid = document.getElementById('councilSeatsGrid');
  const decisionPanelBox = document.getElementById('decisionPanelBox');
  const decisionBadge = document.getElementById('decisionBadge');
  const activeLeaderTag = document.getElementById('activeLeaderTag');
  const decisionTitle = document.getElementById('decisionTitle');
  const decisionDescription = document.getElementById('decisionDescription');
  const actionOptionsContainer = document.getElementById('actionOptionsContainer');
  const activeNationStatsBar = document.getElementById('activeNationStatsBar');
  const btnConfirmTurn = document.getElementById('btnConfirmTurn');
  const btnConfirmTurnText = document.getElementById('btnConfirmTurnText');
  const newsTickerText = document.getElementById('newsTickerText');

  // Question Dataset Generator for 50 Annual Turn Dilemmas (1970 to 2020)
  function getTurnQuestionData(year, turnNum, nation) {
    // Key Historical Milestones
    if (year === 1970) {
      return {
        title: "1970: A EXPLOSÃO DO CONSUMO INDUSTRIAL",
        desc: "As indústrias mundiais operam a pleno vapor na abertura da Cúpula de Genebra. Qual a prioridade inicial de arranque da matriz de " + nation.name + "?",
        ticker: "1970 • Abertura Oficial da Cúpula Mundial de Energia em Genebra. Líderes buscam suficiência industrial.",
        options: [
          { text: "💧 Expandir Grandes Hidrelétricas (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.hydro += 35; p.capital -= 30; } },
          { text: "⛏️ Construir Térmicas a Carvão (+45 MW | Custo: $20M)", cost: 20, effect: p => { p.capacity.thermal += 45; p.capital -= 20; globalFootprint += 15; } },
          { text: "🔬 Subsidiar P&D de Eficiência Energética (+2 Patentes | Custo: $25M)", cost: 25, effect: p => { p.patents += 2; p.capital -= 25; } }
        ]
      };
    }

    if (year === 1973) {
      return {
        title: "1973: PRIMEIRO CHOQUE GLOBAL DO PETRÓLEO",
        desc: "Embargos internacionais elevam o barril de petróleo em 300%. Nações dependentes de combustíveis fósseis sofrem surto inflacionário.",
        ticker: "1973 • Crise do Petróleo! Embargos internacionais geram racionamento e disparada nos transportes.",
        options: [
          { text: "🌿 Programa de Biocombustíveis & Biomassa (+30 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.biofuels += 30; p.capital -= 25; } },
          { text: "⛏️ Extração Carvoeira de Emergência (+40 MW | Custo: $20M)", cost: 20, effect: p => { p.capacity.thermal += 40; p.capital -= 20; globalFootprint += 20; } },
          { text: "🛡️ Contingenciamento de Emergência & Apoio (Gratuito | +5% Estabilidade)", cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 5); } }
        ]
      };
    }

    if (year === 1979) {
      return {
        title: "1979: SECA SEVERA & RISCO HIDROLÓGICO",
        desc: "Uma seca prolongada atinge grandes bacias hidrográficas mundiais. A vazão das hidrelétricas sofre queda temporária.",
        ticker: "1979 • Alerta Hidrológico Mundial! Secas históricas reduzem capacidade geradora de barragens.",
        options: [
          { text: "🌋 Investir em Geotérmica / Térmica Emergencial (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.geothermal += 35; p.capital -= 30; } },
          { text: "🛢️ Importação Emergencial de Fósseis (+30 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.thermal += 30; p.capital -= 25; globalFootprint += 10; } },
          { text: "⚡ Otimizar Manutenção em Linhas HVDC (+15 MW | Custo: $15M)", cost: 15, effect: p => { p.capacity.hydro += 15; p.capital -= 15; } }
        ]
      };
    }

    if (year === 1986) {
      return {
        title: "1986: ALERTA INDUSTRIAL & PROTOCOLO DE SEGURANÇA",
        desc: "Acidentes em plantas industriais pesadas exigem inspeções rigorosas e modernização de infraestrutura.",
        ticker: "1986 • Revisão de Segurança Internacional! Inspeções rigorosas aplicadas a reatores e geradores.",
        options: [
          { text: "⚛️ Modernizar Reatores Nucleares / Instalações (+40 MW | Custo: $40M)", cost: 40, effect: p => { p.capacity.nuclear += 40; p.capital -= 40; } },
          { text: "🌬️ Migrar Investimentos para Matriz Eólica (+25 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.wind += 25; p.capital -= 30; } },
          { text: "📋 Manutenção Preventiva Padronizada (Custo: $15M | +10% Estabilidade)", cost: 15, effect: p => { p.capital -= 15; p.stability = Math.min(100, p.stability + 10); } }
        ]
      };
    }

    if (year === 1997) {
      return {
        title: "1997: PROTOCOLO DE QUIOTO E METAS DE CARBONO",
        desc: "O primeiro tratado internacional com metas de redução de emissões de carbono entra em vigor na Cúpula.",
        ticker: "1997 • Assinado o Protocolo de Quioto! Nações estabelecem metas de redução da pegada ecológica.",
        options: [
          { text: "🌱 Subsidiar Parques Eólicos/Solares (+35 MW | Custo: $35M)", cost: 35, effect: p => { p.capacity.wind += 35; p.capital -= 35; globalFootprint = Math.max(0, globalFootprint - 15); } },
          { text: "📜 Licenciar Patentes de Inovação Limpa (+3 Patentes | Custo: $30M)", cost: 30, effect: p => { p.patents += 3; p.capital -= 30; } },
          { text: "🏭 Manter Produção Fóssil Existente (+40 MW Térmica | Custo: $15M)", cost: 15, effect: p => { p.capacity.thermal += 40; p.capital -= 15; globalFootprint += 25; } }
        ]
      };
    }

    if (year === 2008) {
      return {
        title: "2008: CRISE FINANCEIRA E ESCASSEZ DE CRÉDITO",
        desc: "O choque financeiro global restringe o crédito internacional para grande infraestrutura. Aloque recursos com cautela.",
        ticker: "2008 • Crise de Crédito Global! Investimentos energéticos desaceleram em todo o mundo.",
        options: [
          { text: "⚡ Otimizar Eficiência da Redes Elétricas (+20 MW | Custo: $15M)", cost: 15, effect: p => { p.capacity.hydro += 20; p.capital -= 15; } },
          { text: "🏛️ Injeção de Capital Estatal na Economia (Receita: +$40M | -5% PIB)", cost: 0, effect: p => { p.capital += 40; p.gdp *= 0.95; } },
          { text: "🌿 Projetos Renováveis Descentralizados (+20 MW | Custo: $20M)", cost: 20, effect: p => { p.capacity.wind += 20; p.capital -= 20; } }
        ]
      };
    }

    if (year === 2015) {
      return {
        title: "2015: ACORDO DE PARIS E TRANSIÇÃO VERDE",
        desc: "Compromisso histórico para acelerar a descarbonização da economia mundial até 2050.",
        ticker: "2015 • Histórico Acordo de Paris! Países unem forças para acelerar a transição limpa.",
        options: [
          { text: "🌞 Megaprojeto Solar & Eólico Offshore (+50 MW | Custo: $45M)", cost: 45, effect: p => { p.capacity.wind += 50; p.capital -= 45; globalFootprint = Math.max(0, globalFootprint - 20); } },
          { text: "🌿 Expansão de Biocombustíveis Avançados (+40 MW | Custo: $35M)", cost: 35, effect: p => { p.capacity.biofuels += 40; p.capital -= 35; } },
          { text: "⚛️ Reatores de Próxima Geração (+45 MW | Custo: $40M)", cost: 40, effect: p => { p.capacity.nuclear += 45; p.capital -= 40; } }
        ]
      };
    }

    if (year === 2020) {
      return {
        title: "2020: A RODADA FINAL PELA RESILIÊNCIA",
        desc: "Último ano da corrida energética de 50 anos! Tome a decisão final para consolidar o score de resiliência de " + nation.name + ".",
        ticker: "2020 • Rodada Final da Cúpula Internacional! Apuração da Nação Vencedora.",
        options: [
          { text: "🏆 Pacote Final de Sustentabilidade (+10% Estabilidade | Custo: $20M)", cost: 20, effect: p => { p.stability = Math.min(100, p.stability + 10); p.capital -= 20; } },
          { text: "⚡ Expansão de Geração Emergencial (+40 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.hydro += 40; p.capital -= 25; } },
          { text: "📜 Registro Final de Patentes (+2 Patentes | Custo: $20M)", cost: 20, effect: p => { p.patents += 2; p.capital -= 20; } }
        ]
      };
    }

    // Dynamic Procedural Questions for Intermediate Years
    const cycle = turnNum % 4;
    if (cycle === 1) {
      return {
        title: `${year}: EXPANSÃO DE INFRAESTRUTURA`,
        desc: `A economia de ${nation.name} expande no ano de ${year}. Defina como ampliar a capacidade geradora. Orçamento atual: $${nation.capital || 100}M.`,
        ticker: `${year} • Cúpula de Genebra processa demandas de infraestrutura elétrica nacional.`,
        options: [
          { text: `💧 Expandir Usinas Hidroelétricas (+30 MW | Custo: $30M)`, cost: 30, effect: p => { p.capacity.hydro += 30; p.capital -= 30; } },
          { text: `⛏️ Adicionar Térmica a Carvão (+40 MW | Custo: $20M)`, cost: 20, effect: p => { p.capacity.thermal += 40; p.capital -= 20; globalFootprint += 12; } },
          { text: `💰 Emissão de Títulos Públicos / Reserva (Receita: +$35M Capital)`, cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    } else if (cycle === 2) {
      return {
        title: `${year}: MERCADO & COMÉRCIO DE RECURSOS`,
        desc: `Cotações mundiais flutuam em ${year}. Como ${nation.name} otimizará seus recursos econômicos?`,
        ticker: `${year} • Mercado de commodities elétricas em negociação internacional.`,
        options: [
          { text: `🛢️ Comprar Fósseis Importados (+35 MW | Custo: $25M)`, cost: 25, effect: p => { p.capacity.thermal += 35; p.capital -= 25; globalFootprint += 10; } },
          { text: `🌬️ Subsidiar Matriz Renováveis (+25 MW | Custo: $25M)`, cost: 25, effect: p => { p.capacity.wind += 25; p.capital -= 25; } },
          { text: `🛡️ Contingenciamento Financeiro (Gratuito | +5% Estabilidade)`, cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 5); } }
        ]
      };
    } else if (cycle === 3) {
      return {
        title: `${year}: GESTÃO DE ESTABILIDADE & REDE ELÉTRICA`,
        desc: `A rede elétrica de ${nation.name} requer calibração no ano de ${year} para manter a estabilidade social.`,
        ticker: `${year} • Relatório de estabilidade elétrica e eficiência em malhas de transmissão.`,
        options: [
          { text: `⚡ Linhas de Transmissão de Alta Tensão (+25 MW | Custo: $20M)`, cost: 20, effect: p => { p.capacity.hydro += 25; p.capital -= 20; } },
          { text: `🌋 Expandir Geotérmica / Biomassa (+30 MW | Custo: $25M)`, cost: 25, effect: p => { p.capacity.geothermal += 30; p.capital -= 25; } },
          { text: `💰 Arrecadação de Imposto Emergencial (Receita: +$30M | -4% Confiança)`, cost: 0, effect: p => { p.capital += 30; p.trust = Math.max(0, p.trust - 4); } }
        ]
      };
    } else {
      return {
        title: `${year}: INOVAÇÃO TECNOLÓGICA & TRANSIÇÃO`,
        desc: `Avanços científicos surgem em ${year}. Qual tecnologia trará maior resiliência a ${nation.name}?`,
        ticker: `${year} • Pesquisa em física aplicada e automação elétrica avançada.`,
        options: [
          { text: `⚛️ Investir em Tecnologia Nuclear (+35 MW | Custo: $35M)`, cost: 35, effect: p => { p.capacity.nuclear += 35; p.capital -= 35; } },
          { text: `🌿 Expansão de Fontes Verdes (+30 MW | Custo: $30M)`, cost: 30, effect: p => { p.capacity.wind += 30; p.capital -= 30; globalFootprint = Math.max(0, globalFootprint - 5); } },
          { text: `🔬 Manutenção Preventiva da Malha (Custo: $10M | +1 Patente)`, cost: 10, effect: p => { p.patents += 1; p.capital -= 10; } }
        ]
      };
    }
  }

  window.initMainGame = function() {
    currentYear = 1970;
    currentTurnNumber = 1;
    activeLeaderIndex = 0;
    globalFootprint = 25;

    // Initialize runtime state for each active player with Government Trust
    activeGamePlayers = playersState.slice(0, selectedPlayerCount).map(p => {
      const nat = NATIONS_DATA[p.nationId];
      let hydroCap = 0, thermalCap = 0, geoCap = 0, nucCap = 0, bioCap = 0, windCap = 0;

      nat.matrix.forEach(m => {
        if (m.label.includes('HIDRELÉTRICA')) hydroCap = m.pct * 1.5;
        if (m.label.includes('PETRÓLEO') || m.label.includes('CARVÃO')) thermalCap = m.pct * 1.4;
        if (m.label.includes('GEOTÉRMICA')) geoCap = m.pct * 1.5;
        if (m.label.includes('NUCLEAR')) nucCap = m.pct * 1.5;
        if (m.label.includes('BIOCOMBUSTÍVEIS')) bioCap = m.pct * 1.5;
        if (m.label.includes('EÓLICA')) windCap = m.pct * 1.5;
      });

      return {
        id: p.id,
        name: p.name,
        type: p.type,
        nationId: p.nationId,
        nation: nat,
        capital: 100, // $100 Million
        gdp: 500, // $500 Billion
        stability: 100, // 100%
        trust: 85, // 85% Initial Popular Approval (Confiança do Governo)
        baseDemand: 110, // 110 MW
        capacity: {
          hydro: hydroCap || 10,
          thermal: thermalCap || 10,
          geothermal: geoCap || 0,
          nuclear: nucCap || 0,
          biofuels: bioCap || 0,
          wind: windCap || 0
        },
        patents: 0,
        cumulativeEmissions: 5
      };
    });

    if (retroIntroScreen) retroIntroScreen.classList.add('hidden');
    if (playerSetupScreen) playerSetupScreen.classList.add('hidden');
    if (gameStageScreen) gameStageScreen.classList.remove('hidden');

    renderTurnQuestion();
  };

  function initMainGame() {
    window.initMainGame();
  }

  // Visual State Machine: Render Seats around table with Spotlight vs Penumbra & Trust Badge
  function updatePlenarySeats() {
    if (!councilSeatsGrid) return;
    councilSeatsGrid.innerHTML = '';

    activeGamePlayers.forEach((player, idx) => {
      const isActive = (idx === activeLeaderIndex);
      const seat = document.createElement('div');
      seat.className = `leader-seat ${isActive ? 'active' : 'dimmed'}`;
      seat.setAttribute('data-seat-index', idx);

      const totalGen = Math.round(Object.values(player.capacity).reduce((a, b) => a + b, 0));
      const demand = Math.round(player.baseDemand * Math.pow(1.02, currentTurnNumber - 1));
      const netMW = totalGen - demand;
      const isSurplus = netMW >= 0;

      let avatarIcon = '👨‍💼';
      if (player.nationId === 'norway') avatarIcon = '🧔🏻‍♂️';
      if (player.nationId === 'brazil') avatarIcon = '👨🏽‍💼';
      if (player.nationId === 'iceland') avatarIcon = '👨🏼‍💼';
      if (player.nationId === 'uk') avatarIcon = '🤵🏼‍♂️';
      if (player.nationId === 'usa') avatarIcon = '🇺🇸🏼';

      // Determine Government Trust Styling
      let trustClass = 'trust-medium';
      if (player.trust >= 75) trustClass = 'trust-high';
      else if (player.trust < 40 && player.trust > 15) trustClass = 'trust-low';
      else if (player.trust <= 15) trustClass = 'trust-critical';

      seat.innerHTML = `
        <div class="spotlight-beam"></div>
        <div class="leader-avatar-box">
          <span class="leader-avatar-icon">${avatarIcon}</span>
        </div>
        <div class="leader-nameplate">
          <div class="nameplate-title"><span class="nameplate-flag">${player.nation.flag}</span> ${player.name.toUpperCase()}</div>
          <div class="nameplate-balance ${isSurplus ? 'surplus' : 'deficit'}">
            ${isSurplus ? '⚡ +' + netMW + ' MW' : '⚠️ ' + netMW + ' MW'}
          </div>
          <div class="nameplate-trust ${trustClass}">
            👑 Confiança: ${Math.round(player.trust)}%
          </div>
        </div>
      `;

      seat.addEventListener('click', () => {
        playClickSound();
        activeLeaderIndex = idx;
        renderTurnQuestion();
      });

      councilSeatsGrid.appendChild(seat);
    });
  }

  // Render Fast Turn Question (1 Question per Turn for 50 Turns)
  function renderTurnQuestion() {
    // Determine active leader for current turn (rotates turns evenly)
    activeLeaderIndex = (currentTurnNumber - 1) % activeGamePlayers.length;
    const player = activeGamePlayers[activeLeaderIndex];

    updatePlenarySeats();

    // Calculate current demand and generation
    const totalGen = Math.round(Object.values(player.capacity).reduce((a, b) => a + b, 0));
    const currentDemand = Math.round(player.baseDemand * Math.pow(1.022, currentTurnNumber - 1));

    // Update HUD
    if (hudYearBadge) hudYearBadge.innerHTML = `${currentYear} (TURNO ${currentTurnNumber}/50)`;
    if (hudPhaseBadge) hudPhaseBadge.innerHTML = `ANO ${currentYear} • DILEMA DE ENERGIA`;
    if (activeLeaderTag) activeLeaderTag.innerHTML = `LÍDER DA RODADA: ${player.nation.flag} ${player.name.toUpperCase()}`;

    // Footprint Bar Update
    const pctFootprint = Math.min(100, (globalFootprint / 1500) * 100);
    if (hudFootprintFill) hudFootprintFill.style.width = `${pctFootprint}%`;
    if (hudFootprintVal) hudFootprintVal.innerHTML = `${globalFootprint} / 1500 PTS`;

    // Active Stats Footer Bar with Government Trust Status
    let trustTierLabel = 'Estável';
    let trustClass = 'trust-medium';
    if (player.trust >= 75) {
      trustTierLabel = 'Alta (+20% Impostos)';
      trustClass = 'trust-high';
    } else if (player.trust < 40 && player.trust > 15) {
      trustTierLabel = 'Baixa (Greves: Obras +35% Custo)';
      trustClass = 'trust-low';
    } else if (player.trust <= 15) {
      trustTierLabel = 'CRÍTICA (Risco de Impeachment!)';
      trustClass = 'trust-critical';
    }

    if (activeNationStatsBar) {
      activeNationStatsBar.innerHTML = `
        <span class="stat-pill">👑 Confiança: <strong class="${trustClass}">${Math.round(player.trust)}% (${trustTierLabel})</strong></span>
        <span class="stat-pill">💰 Capital: <strong>$${player.capital}M</strong></span>
        <span class="stat-pill">⚡ Ger.: <strong>${totalGen} MW</strong></span>
        <span class="stat-pill">📈 Demanda: <strong>${currentDemand} MW</strong></span>
        <span class="stat-pill">🏛️ PIB: <strong>$${Math.round(player.gdp)}B</strong></span>
      `;
    }

    // Fetch Question Data
    const qData = getTurnQuestionData(currentYear, currentTurnNumber, player);

    if (newsTickerText) newsTickerText.innerHTML = qData.ticker;
    if (decisionBadge) decisionBadge.innerHTML = `TURNO ${currentTurnNumber} DE 50 • DILEMA GEOPOLÍTICO (${currentYear})`;
    if (decisionTitle) decisionTitle.innerHTML = qData.title;
    if (decisionDescription) decisionDescription.innerHTML = qData.desc;

    // Render Choice Cards (Cards de Escolha Diplomáticos)
    if (actionOptionsContainer) {
      actionOptionsContainer.innerHTML = '';

      const optionBadges = ['OPÇÃO A', 'OPÇÃO B', 'OPÇÃO C', 'OPÇÃO D'];

      qData.options.forEach((opt, oIdx) => {
        const card = document.createElement('div');
        card.className = 'choice-card';

        const requiredCost = opt.cost || 0;
        const canAfford = player.capital >= requiredCost;

        let penaltyTag = '';
        if (!canAfford) {
          card.classList.add('disabled-unaffordable');
          penaltyTag = `<span class="confidential-stamp" style="font-size: 0.62rem; padding: 2px 6px; border-color: #f44336; color: #f44336; transform: none;">🚫 ORÇAMENTO INSUFICIENTE ($${requiredCost}M)</span>`;
        } else if (player.trust < 40 && requiredCost > 0) {
          penaltyTag = `<span class="confidential-stamp" style="font-size: 0.62rem; padding: 2px 6px; border-color: #ff9800; color: #ff9800; transform: none;">GREVES: +$10M</span>`;
        }

        const badgeText = optionBadges[oIdx] || `OPÇÃO ${oIdx + 1}`;

        card.innerHTML = `
          <div class="choice-card-left">
            <span class="choice-badge-num">${badgeText}</span>
            <span class="choice-text-content">${opt.text}</span>
          </div>
          ${penaltyTag}
        `;

        card.onclick = () => {
          if (!canAfford) {
            playClickSound();
            alert(`⚠️ Orçamento insuficiente!\n\nA nação ${player.nation.name} possui $${player.capital}M em caixa, mas esta opção requer $${requiredCost}M.\n\nEscolha uma alternativa mais econômica ou uma medida de arrecadação fiscal!`);
            return;
          }

          playClickSound();

          // Apply Option Effect to active player
          opt.effect(player);

          // Apply extra cost penalty if trust is low (< 40%)
          if (player.trust < 40 && requiredCost > 0) {
            player.capital -= 10;
          }

          // Resolve Turn Math & Annual Tax Collection for all nations
          activeGamePlayers.forEach(p => {
            const pGen = Math.round(Object.values(p.capacity).reduce((a, b) => a + b, 0));
            const pDem = Math.round(p.baseDemand * Math.pow(1.022, currentTurnNumber - 1));
            const pNet = pGen - pDem;

            // Base Annual Tax Revenue ($20M + 3% of GDP)
            let annualTaxIncome = 20 + Math.round(p.gdp * 0.03);

            if (pNet >= 0) {
              // Superávit: Arrecadação tributária completa + Bônus de apoio popular
              annualTaxIncome += 15;
              if (p.trust >= 75) annualTaxIncome = Math.round(annualTaxIncome * 1.20);
              p.capital += annualTaxIncome;
              p.gdp *= 1.02;
              p.trust = Math.min(100, p.trust + 3);
              p.stability = Math.min(100, p.stability + 1);
            } else {
              // Apagão: Retração industrial reduz arrecadação tributária em 50%
              annualTaxIncome = Math.round(annualTaxIncome * 0.5);
              p.capital += annualTaxIncome;
              const defRatio = Math.abs(pNet) / pDem;
              const trustPenalty = Math.round(defRatio * 35);
              p.trust = Math.max(0, p.trust - trustPenalty);
              p.stability = Math.max(10, p.stability - (defRatio * 25));
              p.gdp *= Math.max(0.85, 1 - (defRatio * 0.10));
            }

            if (p.trust <= 15) {
              p.capital = Math.max(0, p.capital - 25);
              p.gdp *= 0.93;
            }
          });

          // Advance to next turn
          currentTurnNumber++;
          currentYear++;

          if (currentTurnNumber <= 50) {
            renderTurnQuestion();
          } else {
            triggerVictoryResolution();
          }
        };

        actionOptionsContainer.appendChild(card);
      });
    }

    if (btnConfirmTurnText) {
      btnConfirmTurnText.innerHTML = `AVANÇAR PARA ${currentYear + 1} ⏭`;
    }
  }

  // Victory Resolution (Turn 50 / 2020) with Government Trust Weight (30%)
  function triggerVictoryResolution() {
    const scoredPlayers = activeGamePlayers.map(p => {
      const score = (0.35 * (p.gdp / 1000)) + (0.30 * (p.trust / 100)) + (0.20 * (p.patents / 10)) - (0.15 * (p.cumulativeEmissions / 100));
      return { ...p, resilienceScore: (score * 100).toFixed(1) };
    }).sort((a, b) => b.resilienceScore - a.resilienceScore);

    const winner = scoredPlayers[0];
    const rankingText = scoredPlayers.map((p, idx) => `${idx + 1}º - ${p.nation.flag} ${p.name} (${p.nation.name}): Score ${p.resilienceScore} pts (Confiança: ${Math.round(p.trust)}%)`).join('\n');

    alert(`🏆 CÚPULA DE 2020 CONCLUÍDA - VITÓRIA ENERGÉTICA!\n\nCampeão Global:\n${winner.nation.flag} ${winner.name} (${winner.nation.name})\n\nClassificação de Resiliência (50 Turnos):\n${rankingText}\n\nParabéns pela liderança na transição energética mundial!`);
  }

  // Confirm Setup Action -> Triggers Main Game Engine Entry
  if (btnConfirmSetup) {
    btnConfirmSetup.addEventListener('click', () => {
      playClickSound();
      initMainGame();
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
