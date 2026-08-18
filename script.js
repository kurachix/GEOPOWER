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
      startCapital: 120, // $120M Fundo Soberano
      startGdp: 460, // $460B PIB
      startDemand: 100, // 100 MW
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
      startCapital: 110, // $110M
      startGdp: 490, // $490B PIB
      startDemand: 110, // 110 MW
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
      startCapital: 95, // $95M
      startGdp: 380, // $380B PIB
      startDemand: 85, // 85 MW
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
      startCapital: 135, // $135M
      startGdp: 620, // $620B PIB
      startDemand: 130, // 130 MW
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
      startCapital: 155, // $155M Superpotência
      startGdp: 820, // $820B PIB
      startDemand: 160, // 160 MW
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
    { id: 3, name: 'Líder 3', type: 'human', nationId: 'iceland' },
    { id: 4, name: 'Líder 4', type: 'human', nationId: 'uk' },
    { id: 5, name: 'Líder 5', type: 'human', nationId: 'usa' }
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
          <div class="player-badge">CREDENCIAL Nº 0${player.id} • LÍDER HUMANO</div>
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

  // Dynamic Random Event & 50-Turn Unique Dilemma Engine (1970 to 2020)
  function getTurnQuestionData(year, turnNum, nation) {
    const nationName = nation.name.toUpperCase();
    const currentCap = nation.capital || 100;

    // 1. DÉCADA DE 1970 (1970 – 1979)
    if (year === 1970) {
      return {
        title: "1970: A EXPLOSÃO DO CONSUMO INDUSTRIAL",
        desc: `As indústrias operam em capacidade máxima na abertura da Cúpula de Genebra. Defina a prioridade de arranque da matriz de ${nationName}.`,
        ticker: "1970 • Abertura da Cúpula de Genebra. Países aceleram investimentos em matrizes industriais de base.",
        concept: "🔬 FÍSICA: Termodinâmica de Matrizes (Ciclos Térmicos Rankine) | 🌍 GEOGRAFIA: Industrialização de Base & Demografia",
        options: [
          { text: "💧 Hidrelétricas de Alta Queda (Bernoulli: P = η·ρ·g·Q·H | +40 MW | Custo: $35M)", cost: 35, effect: p => { p.capacity.hydro += 40; p.capital -= 35; } },
          { text: "⛏️ Térmicas a Carvão (Rendimento Térmico η = W/Q_in | +50 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.thermal += 50; p.capital -= 25; globalFootprint += 18; } },
          { text: "🔬 Subsidiar P&D de Eficiência Energética (+2 Patentes | Custo: $20M)", cost: 20, effect: p => { p.patents += 2; p.capital -= 20; } },
          { text: "💰 Emissão de Títulos de Reserva Estatal (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 1971) {
      return {
        title: "1971: O ACORDO DE TEERÃ & COTAÇÃO FÓSSIL",
        desc: `Países exportadores renegociam preços do barril de petróleo. Como ${nationName} protegerá sua matriz de combustíveis?`,
        ticker: "1971 • Reunião em Teerã eleva preços globais dos combustíveis fósseis.",
        concept: "🔬 FÍSICA: Densidade de Energia Específica (MJ/kg) | 🌍 GEOGRAFIA: Cartelização da OPEP e Geopolítica dos Estreitos",
        options: [
          { text: "🛢️ Contrato Fóssil de Longo Prazo (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.thermal += 35; p.capital -= 30; globalFootprint += 12; } },
          { text: "🌿 Biocombustíveis & Fotossíntese Sintética (+30 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.biofuels += 30; p.capital -= 25; } },
          { text: "⚡ Reduzir Perda por Aquecimento em Subestações (+20 MW | Custo: $18M)", cost: 18, effect: p => { p.capacity.hydro += 20; p.capital -= 18; } },
          { text: "🛡️ Fundo Nacional de Contingência (Gratuito | +6% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 6); } }
        ]
      };
    }

    if (year === 1972) {
      return {
        title: "1972: CONFERÊNCIA DE ESTOCOLMO (PRIMEIRO ALERTA AMBIENTAL)",
        desc: `A ONU realiza a primeira conferência sobre o Meio Ambiente Humano. Pressão internacional surge contra a poluição descontrolada.`,
        ticker: "1972 • Conferência de Estocolmo! Surgem os primeiros tratados de controle de emissões.",
        concept: "🔬 FÍSICA: Física de Aerossóis & Efeito Albedo | 🌍 GEOGRAFIA: Biogeografia & Impactos Transfronteiriços",
        options: [
          { text: "🌱 Subsidiar Fontes Geotérmicas/Eólicas (+30 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.wind += 30; p.capital -= 30; globalFootprint = Math.max(0, globalFootprint - 10); } },
          { text: "⛏️ Manter Foco na Industrialização Fóssil (+45 MW | Custo: $20M)", cost: 20, effect: p => { p.capacity.thermal += 45; p.capital -= 20; globalFootprint += 22; } },
          { text: "📜 Adquirir Patentes de Filtragem Industrial (+2 Patentes | Custo: $22M)", cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
          { text: "🏛️ Programa de Redução de Gastos Públicos (Receita: +$30M | -3% PIB)", cost: 0, effect: p => { p.capital += 30; p.gdp *= 0.97; } }
        ]
      };
    }

    if (year === 1973) {
      return {
        title: "1973: PRIMEIRO CHOQUE GLOBAL DO PETRÓLEO",
        desc: `Embargos da OPEP disparam o preço do barril em 300%. Postos de combustíveis e termelétricas enfrentam desabastecimento agudo.`,
        ticker: "1973 • CHOQUE DO PETRÓLEO! Embargo internacional gera racionamento nos transportes e térmicas.",
        concept: "🔬 FÍSICA: Conservação de Energia & Balanço Térmico | 🌍 GEOGRAFIA: Geopolítica de Recursos & Estreito de Ormuz",
        options: [
          { text: "🌿 Programa de Biocombustíveis C4 (Cana/Milho) (+35 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.biofuels += 35; p.capital -= 28; } },
          { text: "⛏️ Reativação Emergencial de Minas de Carvão (+45 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.thermal += 45; p.capital -= 22; globalFootprint += 25; } },
          { text: "⚛️ Iniciar Reator Nuclear de Fissão U-235 (+30 MW | Custo: $40M)", cost: 40, effect: p => { p.capacity.nuclear += 30; p.capital -= 40; } },
          { text: "🛡️ Racionamento Noturno de iluminação Publica (Gratuito | +8% Estabilidade)", cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 8); } }
        ]
      };
    }

    if (year === 1974) {
      return {
        title: "1974: A CORRIDA NUCLEAR COMERCIAL",
        desc: `Com a alta do petróleo, a tecnologia nuclear surge como a grande promessa de independência energética massiva.`,
        ticker: "1974 • Potências investem pesadamente em reatores nucleares comerciais de alta capacidade.",
        concept: "🔬 FÍSICA: Fissão Nuclear & Equação de Einstein (E = Δm·c²) | 🌍 GEOGRAFIA: Geologia do Urânio & Soberania",
        options: [
          { text: "⚛️ Usina Nuclear de Fissão PWR (+50 MW | Custo: $45M)", cost: 45, effect: p => { p.capacity.nuclear += 50; p.capital -= 45; } },
          { text: "💧 Barragens de Reservatório Pluviométrico (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.hydro += 35; p.capital -= 30; } },
          { text: "📜 Licenciamento Internacional de Reatores (+3 Patentes | Custo: $32M)", cost: 32, effect: p => { p.patents += 3; p.capital -= 32; } },
          { text: "💰 Taxa Emergencial sobre Importações Fósseis (Receita: +$30M | -5% Confiança)", cost: 0, effect: p => { p.capital += 30; p.trust = Math.max(0, p.trust - 5); } }
        ]
      };
    }

    if (year === 1975) {
      return {
        title: "1975: EXPANSÃO DE MALHAS DE TRANSMISSÃO (HVDC)",
        desc: `Perdas por Efeito Joule na transmissão de eletricidade afetam as indústrias de ${nationName}. É preciso elevar a tensão para reduzir a corrente elétrica.`,
        ticker: "1975 • Avanços em transmissão HVDC reduzem perdas por aquecimento Joule (P = R·I²).",
        concept: "🔬 FÍSICA: Efeito Joule (P_perda = R·I²) & Transmissão HVDC | 🌍 GEOGRAFIA: Integração Regional de Redes",
        options: [
          { text: "⚡ Linhas HVDC de Ultra-Alta Tensão (+30 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.hydro += 30; p.capital -= 25; } },
          { text: "🌋 Geotermia Crustal em Rocha Vulcânica (+30 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.geothermal += 30; p.capital -= 28; } },
          { text: "🛢️ Queimar Reservas Estratégicas de Óleo (+35 MW | Custo: $20M)", cost: 20, effect: p => { p.capacity.thermal += 35; p.capital -= 20; globalFootprint += 15; } },
          { text: "🛡️ Otimização de Demanda Industrial (Gratuito | +5% Estabilidade)", cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 5); } }
        ]
      };
    }

    if (year === 1976) {
      return {
        title: "1976: SURTO INFLACIONÁRIO DE INSUMOS",
        desc: `Custo de turbinas, cobre e aço dispara no mercado mundial. Obras de infraestrutura de ${nationName} exigem mais caixa.`,
        ticker: "1976 • Inflação industrial eleva custos de usinas geradoras em todo o mundo.",
        options: [
          { text: "⚡ Obra Hidrelétrica Padronizada (+30 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.hydro += 30; p.capital -= 32; } },
          { text: "⛏️ Geradores a Carvão de Baixa Custo (+35 MW | Custo: $20M)", cost: 20, effect: p => { p.capacity.thermal += 35; p.capital -= 20; globalFootprint += 18; } },
          { text: "📜 Consórcio de Pesquisa de Materiais (+2 Patentes | Custo: $25M)", cost: 25, effect: p => { p.patents += 2; p.capital -= 25; } },
          { text: "💰 Venda de Ativos Estatais Não-Estratégicos (Receita: +$40M | -4% PIB)", cost: 0, effect: p => { p.capital += 40; p.gdp *= 0.96; } }
        ]
      };
    }

    if (year === 1977) {
      return {
        title: "1977: O FENÔMENO DA CHUVA ÁCIDA CONTINENTAL",
        desc: "Emissões térmicas geram chuvas ácidas que danificam lavouras e florestas. A opinião pública exige medidas sanitárias.",
        ticker: "1977 • Alerta ecológico! Chuvas ácidas causam prejuízos à agricultura europeia e americana.",
        options: [
          { text: "🌱 Filtros Dessulfurizadores nas Térmicas (+20 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.thermal += 20; p.capital -= 22; globalFootprint = Math.max(0, globalFootprint - 12); } },
          { text: "🌬️ Substituir Carvão por Energia Eólica Experimental (+25 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.wind += 25; p.capital -= 28; } },
          { text: "💧 Expandir Usinas Hidroelétricas de Cabeceira (+30 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.hydro += 30; p.capital -= 30; } },
          { text: "🛡️ Campanha de Proteção Florestal (Gratuito | +7% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 7); } }
        ]
      };
    }

    if (year === 1978) {
      return {
        title: "1978: TRANSIÇÃO PARA GÁS NATURAL",
        desc: "Gasodutos transcontinentais tornam o gás natural uma alternativa mais limpa ao carvão mineral.",
        ticker: "1978 • Expansão de gasodutos impulsiona térmicas a gás de ciclo simples.",
        options: [
          { text: "🛢️ Usinas Térmicas a Gás Natural (+40 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.thermal += 40; p.capital -= 28; globalFootprint += 10; } },
          { text: "⚛️ Ampliação de Módulos Nucleares (+35 MW | Custo: $38M)", cost: 38, effect: p => { p.capacity.nuclear += 35; p.capital -= 38; } },
          { text: "🌿 Expansão de Usinas de Biomassa (+25 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.biofuels += 25; p.capital -= 22; } },
          { text: "💰 Reajuste Tarifário Residencial (Receita: +$35M | -6% Confiança)", cost: 0, effect: p => { p.capital += 35; p.trust = Math.max(0, p.trust - 6); } }
        ]
      };
    }

    if (year === 1979) {
      return {
        title: "1979: SEGUNDO CHOQUE DO PETRÓLEO & SECA SEVERA",
        desc: "A Revolução no Oriente Médio paralisa exportações de óleo, coincidindo com uma seca histórica nas bacias hidrográficas.",
        ticker: "1979 • SEGUNDO CHOQUE DO PETRÓLEO! Secas severas reduzem geração de barragens mundiais.",
        options: [
          { text: "🌋 Investir em Geotérmica / Térmica Emergencial (+35 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.geothermal += 35; p.capital -= 32; } },
          { text: "🛢️ Importação Emergencial de Fósseis (+30 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.thermal += 30; p.capital -= 25; globalFootprint += 15; } },
          { text: "⚡ Manutenção Preventiva de Emergência (+20 MW | Custo: $18M)", cost: 18, effect: p => { p.capacity.hydro += 20; p.capital -= 18; } },
          { text: "🛡️ Plano de Contingência Social de Crise (Gratuito | +8% Estabilidade)", cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 8); } }
        ]
      };
    }

    // 2. DÉCADA DE 1980 (1980 – 1989)
    if (year === 1980) {
      return {
        title: "1980: JUROS ALTOS E RESTRIÇÃO DE CRÉDITO",
        desc: "A taxa de juros mundial atinge picos históricos. O custo de financiamento de megaprojetos duplica no mercado.",
        ticker: "1980 • Choque de Juros Globais! Financiamentos internacionais de infraestrutura desaceleram.",
        concept: "🔬 FÍSICA: Termodinâmica & Perdas de Carnot | 🌍 GEOGRAFIA: Geopolítica do Crédito & Dívidas Externas",
        options: [
          { text: "⚡ Otimizar Redes Existentes de Transmissão (+25 MW | Custo: $20M)", cost: 20, effect: p => { p.capacity.hydro += 25; p.capital -= 20; } },
          { text: "⛏️ Usina a Carvão de Baixa Complexidade (+35 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.thermal += 35; p.capital -= 22; globalFootprint += 16; } },
          { text: "📜 P&D de Microgeração Descentralizada (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "💰 Empréstimo Emergencial com Fundo Monetário (Receita: +$40M | -4% PIB)", cost: 0, effect: p => { p.capital += 40; p.gdp *= 0.96; } }
        ]
      };
    }

    if (year === 1982) {
      return {
        title: "1982: A CRISE DA DÍVIDA & HIDRODIPLOMACIA",
        desc: `Crises cambiais afetam o financiamento de grandes barragens binacionais. Como ${nationName} protegerá suas obras de grande porte?`,
        ticker: "1982 • Crise da Dívida! Projetos de mega-hidrelétricas exigem acordos bilaterais.",
        concept: "🔬 FÍSICA: Potência Hidráulica Efetiva (P = η·ρ·g·Q·H) | 🌍 GEOGRAFIA: Bacias Hidrográficas Binacionais & Fronteiras",
        options: [
          { text: "💧 Empreendimento Hidrelétrico Binacional (+40 MW | Custo: $35M)", cost: 35, effect: p => { p.capacity.hydro += 40; p.capital -= 35; } },
          { text: "🛢️ Térmicas Locais de Rápida Operação (+35 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.thermal += 35; p.capital -= 22; globalFootprint += 14; } },
          { text: "📜 Adquirir Patentes de Turbinas Francis de Alta Vazão (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "🛡️ Acordo Diplomático Bilateral de Energia (Gratuito | +7% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 7); } }
        ]
      };
    }

    if (year === 1984) {
      return {
        title: "1984: A REVOLUÇÃO DO PETRÓLEO EM ÁGUAS PROFUNDAS",
        desc: `Avanços na engenharia de plataformas offshore permitem perfurar sob altíssima pressão hidrostática no oceano.`,
        ticker: "1984 • Perfuração Offshore! Novas tecnologias exploram reservas no assoalho marinho.",
        concept: "🔬 FÍSICA: Pressão Hidrostática (P = ρ·g·h) & Resistência de Materiais | 🌍 GEOGRAFIA: Geologia da Margem Continental",
        options: [
          { text: "🛢️ Plataforma Offshore de Águas Profundas (+45 MW | Custo: $38M)", cost: 38, effect: p => { p.capacity.thermal += 45; p.capital -= 38; globalFootprint += 18; } },
          { text: "🌊 Energia Maremotriz & Das Ondas (+25 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.wind += 25; p.capital -= 28; } },
          { text: "📜 Licenciamento de Sondagem Submarina (+3 Patentes | Custo: $30M)", cost: 30, effect: p => { p.patents += 3; p.capital -= 30; } },
          { text: "💰 Concessão de Blocos Marítimos a Empresas (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 1986) {
      return {
        title: "1986: REVISÃO DE SEGURANÇA INDUSTRIAL E NUCLEAR",
        desc: "O acidente de Chernobyl paralisa o setor nuclear mundial e exige auditorias de segurança rigorosas em todas as usinas.",
        ticker: "1986 • Alerta Nuclear em Chernobyl! Auditoria de segurança paralisante é exigida no setor.",
        concept: "🔬 FÍSICA: Fissão de Urânio-235 (E=mc²) & Contenção de Radiação | 🌍 GEOGRAFIA: Dispersão Atmosférica Transfronteiriça",
        options: [
          { text: "⚛️ Modernização Completa dos Reatores Nucleares (+35 MW | Custo: $40M)", cost: 40, effect: p => { p.capacity.nuclear += 35; p.capital -= 40; } },
          { text: "🌬️ Migração Apressada para Parques Eólicos (+30 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.wind += 30; p.capital -= 32; } },
          { text: "💧 Expansão de PCHs (Pequenas Central Hidrelétricas) (+30 MW | Custo: $26M)", cost: 26, effect: p => { p.capacity.hydro += 30; p.capital -= 26; } },
          { text: "📋 Manutenção e Inspeção Padronizada (Custo: $15M | +10% Estabilidade)", cost: 15, effect: p => { p.capital -= 15; p.stability = Math.min(100, p.stability + 10); } }
        ]
      };
    }

    if (year === 1988) {
      return {
        title: "1988: CRIAÇÃO DO IPCC & PAINEL CLIMÁTICO DA ONU",
        desc: "A ONU e a WMO fundam o IPCC para monitorar as emissões de gases estufa e o aquecimento global.",
        ticker: "1988 • Fundação do IPCC! Cientistas unem dados atmosféricos para mapear o clima mundial.",
        concept: "🔬 FÍSICA: Forçante Radiativa (ΔF em W/m²) & Absorção Infravermelha | 🌍 GEOGRAFIA: Climatologia Global & Biomas",
        options: [
          { text: "🌱 Substituir Fósseis por Parque Eólico/Solar (+35 MW | Custo: $35M)", cost: 35, effect: p => { p.capacity.wind += 35; p.capital -= 35; globalFootprint = Math.max(0, globalFootprint - 15); } },
          { text: "🌿 Expansão de Reflorestamento e Biocombustíveis (+30 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.biofuels += 30; p.capital -= 28; } },
          { text: "📜 Investir em Sensores Atmosféricos (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "🛡️ Declaração de Compromisso Ecológico (Gratuito | +7% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 7); } }
        ]
      };
    }

    if (year === 1989) {
      return {
        title: "1989: DESASTRE AMBIENTAL & REGULAMENTAÇÃO MARÍTIMA",
        desc: "O vazamento do petroleiro Exxon Valdez mancha o oceano e desencadeia protestos globais por regras ambientais severas.",
        ticker: "1989 • Vazamento do Exxon Valdez! Governos aprovam leis severas de responsabilidade ambiental.",
        concept: "🔬 FÍSICA: Tensão Superficial e Dispersão de Fluidos | 🌍 GEOGRAFIA: Biogeografia Marinha e Preservação de Costas",
        options: [
          { text: "🌱 Subsidiar Matriz Solar / Biomassa (+35 MW | Custo: $34M)", cost: 34, effect: p => { p.capacity.biofuels += 35; p.capital -= 34; globalFootprint = Math.max(0, globalFootprint - 15); } },
          { text: "🛢️ Duplicação de Cascos de Petroleiros e Térmicas (+35 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.thermal += 35; p.capital -= 28; } },
          { text: "📜 Registro de Patentes de Contenção de Danos (+2 Patentes | Custo: $22M)", cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
          { text: "🛡️ Fundo Emergencial de Resposta a Desastres (Gratuito | +8% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 8); } }
        ]
      };
    }

    // 3. DÉCADA DE 1990 (1990 – 1999)
    if (year === 1990) {
      return {
        title: "1990: A GUERRA DO GOLFO & INCÊNDIO DOS POÇOS",
        desc: "Conflitos geopolíticos no Kuwait incendiam poços de petróleo, gerando fuligem atmosférica e disparada na cotação do barril.",
        ticker: "1990 • GUERRA DO GOLFO! Incêndio em poços de petróleo gera nuvem tóxica e choque de preços.",
        concept: "🔬 FÍSICA: Combustão Incompleta & Aerossóis Absorventes de Luz | 🌍 GEOGRAFIA: Geopolítica do Oriente Médio",
        options: [
          { text: "🌿 Programa Emergencial de Biocombustíveis Nacionais (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.biofuels += 35; p.capital -= 30; } },
          { text: "⚡ Expansão de Hidrelétricas de Reserva (+35 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.hydro += 35; p.capital -= 32; } },
          { text: "⛏️ Manter Térmicas a Carvão de Estoque (+40 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.thermal += 40; p.capital -= 22; globalFootprint += 20; } },
          { text: "🛡️ Racionamento Estratégico de Combustíveis (Gratuito | +8% Estabilidade)", cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 8); } }
        ]
      };
    }

    if (year === 1994) {
      return {
        title: "1994: A CONVENÇÃO-QUADRO DAS NAÇÕES UNIDAS (UNFCCC)",
        desc: "Entra em vigor o tratado da ONU para estabilizar as concentrações de gases de efeito estufa na atmosfera.",
        ticker: "1994 • UNFCCC em vigor! Tratado internacional estabelece base para diplomacia climática.",
        concept: "🔬 FÍSICA: Espectroscopia de Absorção Infravermelha do CO₂ | 🌍 GEOGRAFIA: Diplomacia Climatológica Norte-Sul",
        options: [
          { text: "🌱 Parque Eólico de Alta Capacidade (+40 MW | Custo: $38M)", cost: 38, effect: p => { p.capacity.wind += 40; p.capital -= 38; globalFootprint = Math.max(0, globalFootprint - 15); } },
          { text: "📜 Registrar Patentes de Filtros Industriais (+3 Patentes | Custo: $30M)", cost: 30, effect: p => { p.patents += 3; p.capital -= 30; } },
          { text: "🛢️ Expansão de Térmicas a Gás de Ciclo Combinado (+40 MW | Custo: $26M)", cost: 26, effect: p => { p.capacity.thermal += 40; p.capital -= 26; globalFootprint += 10; } },
          { text: "💰 Venda de Créditos Nacionais de Preservação (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 2001) {
      return {
        title: "2001: RACIONAMENTO & SECA DOS RESERVATÓRIOS",
        desc: `Falta de chuvas e escassez de planejamento provocam surto de racionamento elétrico. O governo de ${nationName} enfrenta crise de aprovação.`,
        ticker: "2001 • RACIONAMENTO ELÉTRICO! Secas severas e baixo nível dos reservatórios exigem corte de consumo.",
        concept: "🔬 FÍSICA: Energia Potencial Gravitacional (E_p = m·g·h) | 🌍 GEOGRAFIA: Regimes Pluviométricos & Bacias Hidrográficas",
        options: [
          { text: "🌋 Expansão de Geotérmica / Biomassa de Emergência (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.geothermal += 35; p.capital -= 30; } },
          { text: "🛢️ Contratação Apressada de Usinas Térmicas (+40 MW | Custo: $26M)", cost: 26, effect: p => { p.capacity.thermal += 40; p.capital -= 26; globalFootprint += 18; } },
          { text: "📜 Licenciar Tecnologia de Gestão de Carga (+2 Patentes | Custo: $22M)", cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
          { text: "🛡️ Campanha de Conscientização de Consumo (Gratuito | +8% Estabilidade)", cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 8); } }
        ]
      };
    }

    if (year === 2005) {
      return {
        title: "2005: MERCADO DE EMISSÕES DA UE (EU ETS)",
        desc: "Entra em operação o maior mercado de carbono do mundo. Poluir ganha preço financeiro direto por tonelada de CO₂e.",
        ticker: "2005 • Lançado o Mercado de Emissões da UE! Tonelada de CO2 ganha cotação em bolsa de valores.",
        concept: "🔬 FÍSICA: Valoração de Carbono Equivalente (CO₂e) | 🌍 GEOGRAFIA: Comércio Transfronteiriço de Licenças",
        options: [
          { text: "🌱 Migração Total para Parques Eólicos/Solares (+45 MW | Custo: $40M)", cost: 40, effect: p => { p.capacity.wind += 45; p.capital -= 40; globalFootprint = Math.max(0, globalFootprint - 20); } },
          { text: "📜 Comercialização Global de Licenças Verdes (+3 Patentes | Custo: $30M)", cost: 30, effect: p => { p.patents += 3; p.capital -= 30; } },
          { text: "🏭 Pagar Taxa de Poluição e Manter Térmicas (+40 MW | Custo: $20M)", cost: 20, effect: p => { p.capacity.thermal += 40; p.capital -= 20; globalFootprint += 22; } },
          { text: "💰 Subvenção Fiscais a Empresas de Baixa Emissão (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 2012) {
      return {
        title: "2012: REVOLUÇÃO DO GÁS DE XISTO (SHALE GAS)",
        desc: "Técnicas de fraturamento hidráulico (fracking) disparam a produção de gás natural e barateiam a energia fóssil.",
        ticker: "2012 • Boom do Gás de Xisto! Fraturamento hidráulico transforma o mercado global de combustíveis.",
        concept: "🔬 FÍSICA: Porosidade & Permeabilidade de Rochas Folhelho | 🌍 GEOGRAFIA: Geologia Sedimentar & Recursos Não-Renováveis",
        options: [
          { text: "🛢️ Usinas Térmicas a Gás de Xisto (+50 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.thermal += 50; p.capital -= 32; globalFootprint += 14; } },
          { text: "🌞 Expansão de Parques Solares Fotovoltaicos (+40 MW | Custo: $36M)", cost: 36, effect: p => { p.capacity.wind += 40; p.capital -= 36; globalFootprint = Math.max(0, globalFootprint - 10); } },
          { text: "📜 Patentes de Fraturamento Ecológico (+2 Patentes | Custo: $25M)", cost: 25, effect: p => { p.patents += 2; p.capital -= 25; } },
          { text: "🛡️ Isenção Fiscal para Indústrias Eletrointensivas (Gratuito | +6% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 6); } }
        ]
      };
    }

    if (year === 2016) {
      return {
        title: "2016: PARIDADE DE REDE DA ENERGIA SOLAR",
        desc: "O custo das células fotovoltaicas despenca. Gerar energia solar torna-se mais barato do que construir térmicas a carvão.",
        ticker: "2016 • Paridade de Rede Solar! Energia fotovoltaica atinge o menor custo histórico de instalação.",
        concept: "🔬 FÍSICA: Rendimento Quântico de Semicondutores p-n (E = h·ν) | 🌍 GEOGRAFIA: Insolação Solar & Cintura de Radiação",
        options: [
          { text: "🌞 Megafazenda Solar Fotovoltaica (+55 MW | Custo: $38M)", cost: 38, effect: p => { p.capacity.wind += 55; p.capital -= 38; globalFootprint = Math.max(0, globalFootprint - 22); } },
          { text: "🌿 Usina Bioelétrica de Co-geração (+40 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.biofuels += 40; p.capital -= 30; } },
          { text: "📜 Registrar Patentes de Células de Perovskita (+3 Patentes | Custo: $28M)", cost: 28, effect: p => { p.patents += 3; p.capital -= 28; } },
          { text: "💰 Linha de Crédito Verde a Cidadãos (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 2019) {
      return {
        title: "2019: INCÊNDIOS EXTREMOS & RESILIÊNCIA DA REDE",
        desc: "Ondas de calor e incêndios florestais ameaçam desarmar grandes linhas de transmissão. Redes exigem sensores inteligentes.",
        ticker: "2019 • Ondas de Calor Globais! Incêndios florestais ameaçam malhas elétricas continentais.",
        concept: "🔬 FÍSICA: Ionização do Ar & Dilatação Térmica de Cabos | 🌍 GEOGRAFIA: Eventos Climáticos Extremos & Vulnerabilidade",
        options: [
          { text: "🤖 Automatizar Linhas com Sensores Térmicos (+35 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.hydro += 35; p.capital -= 28; } },
          { text: "🔋 Baterias Gigawatt de Armazenamento (+35 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.wind += 35; p.capital -= 32; } },
          { text: "📜 Patentes de Isolamento Contra Incêndios (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "🛡️ Plano de Manejo Florestal de Emergência (Gratuito | +8% Estabilidade)", cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 8); } }
        ]
      };
    }

    if (year === 1986) {
      return {
        title: "1986: REVISÃO DE SEGURANÇA INDUSTRIAL E NUCLEAR",
        desc: "O acidente de Chernobyl paralisa o setor nuclear mundial e exige auditorias de segurança rigorosas em todas as usinas.",
        ticker: "1986 • Alerta Nuclear em Chernobyl! Auditoria de segurança paralisante é exigida no setor.",
        options: [
          { text: "⚛️ Modernização Completa dos Reatores Nucleares (+35 MW | Custo: $40M)", cost: 40, effect: p => { p.capacity.nuclear += 35; p.capital -= 40; } },
          { text: "🌬️ Migração Apressada para Parques Eólicos (+30 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.wind += 30; p.capital -= 32; } },
          { text: "💧 Expansão de PCHs (Pequenas Central Hidrelétricas) (+30 MW | Custo: $26M)", cost: 26, effect: p => { p.capacity.hydro += 30; p.capital -= 26; } },
          { text: "📋 Manutenção e Inspeção Padronizada (Custo: $15M | +10% Estabilidade)", cost: 15, effect: p => { p.capital -= 15; p.stability = Math.min(100, p.stability + 10); } }
        ]
      };
    }

    if (year === 1989) {
      return {
        title: "1989: DESASTRE AMBIENTAL & REGULAMENTAÇÃO MARÍTIMA",
        desc: "O vazamento do petroleiro Exxon Valdez mancha o oceano e desencadeia protestos globais por regras ambientais severas.",
        ticker: "1989 • Vazamento do Exxon Valdez! Governos aprovam leis severas de responsabilidade ambiental.",
        options: [
          { text: "🌱 Subsidiar Matriz Solar / Biomassa (+35 MW | Custo: $34M)", cost: 34, effect: p => { p.capacity.biofuels += 35; p.capital -= 34; globalFootprint = Math.max(0, globalFootprint - 15); } },
          { text: "🛢️ Duplicação de Cascos de Petroleiros e Térmicas (+35 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.thermal += 35; p.capital -= 28; } },
          { text: "📜 Registro de Patentes de Contenção de Danos (+2 Patentes | Custo: $22M)", cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
          { text: "🛡️ Fundo Emergencial de Resposta a Desastres (Gratuito | +8% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 8); } }
        ]
      };
    }

    // 3. DÉCADA DE 1990 (1990 – 1999)
    if (year === 1992) {
      return {
        title: "1992: CÚPULA DA TERRA (ECO-92 NO RIO DE JANEIRO)",
        desc: "Líderes mundiais assinam a Agenda 21 na Cúpula do Rio. O conceito de desenvolvimento sustentável vira pauta prioritária.",
        ticker: "1992 • Eco-92 no Rio! Líderes estabelecem a Agenda 21 para a sustentabilidade do planeta.",
        options: [
          { text: "🌱 Programa Nacional de Fontes Renováveis (+40 MW | Custo: $38M)", cost: 38, effect: p => { p.capacity.wind += 40; p.capital -= 38; globalFootprint = Math.max(0, globalFootprint - 18); } },
          { text: "💧 Repaginamento de Grandes Usinas Hidrelétricas (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.hydro += 35; p.capital -= 30; } },
          { text: "📜 Transferência Tecnológica de Patentes Limpas (+3 Patentes | Custo: $30M)", cost: 30, effect: p => { p.patents += 3; p.capital -= 30; } },
          { text: "💰 Subvenção Estatal via Títulos Verdes (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 1997) {
      return {
        title: "1997: PROTOCOLO DE QUIOTO & METAS DE CARBONO",
        desc: "O primeiro tratado internacional vinculante com metas de redução de emissões é assinado na Cúpula do Japão.",
        ticker: "1997 • PROTOCOLO DE QUIOTO! Nações ricas aceitam metas compulsórias de redução de CO2.",
        options: [
          { text: "🌱 Substituição Massiva de Carvão por Eólica (+40 MW | Custo: $38M)", cost: 38, effect: p => { p.capacity.wind += 40; p.capital -= 38; globalFootprint = Math.max(0, globalFootprint - 20); } },
          { text: "📜 Compra de Créditos de Carbono Globais (+3 Patentes | Custo: $32M)", cost: 32, effect: p => { p.patents += 3; p.capital -= 32; } },
          { text: "🏭 Manter Produção Térmica Existente (+45 MW | Custo: $18M)", cost: 18, effect: p => { p.capacity.thermal += 45; p.capital -= 18; globalFootprint += 25; } },
          { text: "🛡️ Acordo de Eficiência com a Indústria (Gratuito | +6% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 6); } }
        ]
      };
    }

    // 4. DÉCADA DE 2000 (2000 – 2009)
    if (year === 2003) {
      return {
        title: "2003: O GRANDE APAGÃO DA AMÉRICA DO NORTE & EUROPA",
        desc: "Efeito dominó por falha de chaveamento deixa 50 milhões de pessoas no escuro. A automação da malha vira emergência nacional.",
        ticker: "2003 • Grande Apagão Continental! Falha em malhas interconectadas paralisa grandes metrópoles.",
        options: [
          { text: "⚡ Modernização Digital de Subestações (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.hydro += 35; p.capital -= 30; } },
          { text: "⚛️ Adicionar Reator Nuclear Modular (+35 MW | Custo: $38M)", cost: 38, effect: p => { p.capacity.nuclear += 35; p.capital -= 38; } },
          { text: "📜 Patentes de Software de Gestão de Carga (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "🛡️ Manutenção de Emergência da Malha (Custo: $12M | +10% Estabilidade)", cost: 12, effect: p => { p.capital -= 12; p.stability = Math.min(100, p.stability + 10); } }
        ]
      };
    }

    if (year === 2008) {
      return {
        title: "2008: CRISE FINANCEIRA GLOBAL & ESCASSEZ DE CRÉDITO",
        desc: "O colapso dos grandes bancos norte-americanos paralisa o financiamento de obras energéticas em todo o planeta.",
        ticker: "2008 • CRISE FINANCEIRA GLOBAL! Falência de bancos paralisa obras de infraestrutura.",
        options: [
          { text: "⚡ Otimizar Eficiência de Redes Existentes (+20 MW | Custo: $15M)", cost: 15, effect: p => { p.capacity.hydro += 20; p.capital -= 15; } },
          { text: "🏛️ Injeção de Capital Estatal na Economia (Receita: +$45M | -4% PIB)", cost: 0, effect: p => { p.capital += 45; p.gdp *= 0.96; } },
          { text: "🌿 Projetos Renováveis Descentralizados (+25 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.wind += 25; p.capital -= 22; } },
          { text: "🛡️ Pacote de Socorro às Concessionárias (Gratuito | +8% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 8); } }
        ]
      };
    }

    // 5. DÉCADA DE 2010 A 2020 (2010 – 2020)
    if (year === 2011) {
      return {
        title: "2011: FUKUSHIMA & A PARALISAÇÃO NUCLEAR GLOBAL",
        desc: "O tsunami no Japão provoca colapso na usina de Fukushima. Países reavaliam ou desligam reatores nucleares.",
        ticker: "2011 • Tsunami em Fukushima! Desastre nuclear força o desligamento de reatores em vários países.",
        options: [
          { text: "🌞 Substituição Massiva por Parque Solar/Eólico (+45 MW | Custo: $40M)", cost: 40, effect: p => { p.capacity.wind += 45; p.capital -= 40; globalFootprint = Math.max(0, globalFootprint - 15); } },
          { text: "🛢️ Queimar Gás Natural em Térmicas Emergenciais (+40 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.thermal += 40; p.capital -= 28; globalFootprint += 14; } },
          { text: "⚛️ Reestruturação Extrema de Segurança Nuclear (+30 MW | Custo: $35M)", cost: 35, effect: p => { p.capacity.nuclear += 30; p.capital -= 35; } },
          { text: "🛡️ Descomissionamento Gradual e Auditoria (Gratuito | +7% Estabilidade)", cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 7); } }
        ]
      };
    }

    if (year === 2015) {
      return {
        title: "2015: HISTÓRICO ACORDO DE PARIS (COP 21)",
        desc: "195 nações assinam o acordo para limitar o aquecimento global a 1,5°C. A descarbonização torna-se lei internacional.",
        ticker: "2015 • ACORDO DE PARIS! Compromisso histórico para manter o aquecimento global abaixo de 1.5°C.",
        options: [
          { text: "🌞 Megaprojeto Solar & Eólico Offshore (+55 MW | Custo: $45M)", cost: 45, effect: p => { p.capacity.wind += 55; p.capital -= 45; globalFootprint = Math.max(0, globalFootprint - 25); } },
          { text: "🌿 Expansão de Biocombustíveis de 2ª Geração (+40 MW | Custo: $35M)", cost: 35, effect: p => { p.capacity.biofuels += 40; p.capital -= 35; } },
          { text: "⚛️ Reatores de Pequena Escala (SMR) (+45 MW | Custo: $40M)", cost: 40, effect: p => { p.capacity.nuclear += 45; p.capital -= 40; } },
          { text: "📜 Fundo de Inovação e Licenciamento (+3 Patentes | Custo: $30M)", cost: 30, effect: p => { p.patents += 3; p.capital -= 30; } }
        ]
      };
    }

    if (year === 2018) {
      return {
        title: "2018: REDES ELÉTRICAS INTELIGENTES & IA (SMART GRIDS)",
        desc: "Algoritmos de inteligência artificial otimizam a distribuição de carga em tempo real, evitando desperdícios industriais.",
        ticker: "2018 • Automação com Inteligência Artificial otimiza o fluxo de eletricidade nas malhas urbanas.",
        options: [
          { text: "🤖 Implementar IA em Toda a Malha Nacional (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.hydro += 35; p.capital -= 30; } },
          { text: "🔋 Megabaterias para Armazenar Eólica/Solar (+35 MW | Custo: $35M)", cost: 35, effect: p => { p.capacity.wind += 35; p.capital -= 35; } },
          { text: "📜 Patentes Nacionais de Algoritmos Elétricos (+3 Patentes | Custo: $28M)", cost: 28, effect: p => { p.patents += 3; p.capital -= 28; } },
          { text: "💰 Incentivos Fiscais para Consumo Eficiente (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 2020) {
      return {
        title: "2020: A RODADA FINAL PELA RESILIÊNCIA MUNDIAL",
        desc: `Último ano da corrida energética de 50 anos! Tome a decisão final para consolidar o Score de Resiliência de ${nationName}.`,
        ticker: "2020 • RODADA FINAL DA CÚPULA INTERNACIONAL! Apuração da Nação Campeã.",
        options: [
          { text: "🏆 Pacote Final de Sustentabilidade (+12% Estabilidade | Custo: $20M)", cost: 20, effect: p => { p.stability = Math.min(100, p.stability + 12); p.capital -= 20; } },
          { text: "⚡ Expansão de Geração Emergencial (+45 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.hydro += 45; p.capital -= 25; } },
          { text: "📜 Registro Final de Patentes Verdes (+3 Patentes | Custo: $22M)", cost: 22, effect: p => { p.patents += 3; p.capital -= 22; } },
          { text: "🛡️ Fundo Soberano de Reserva Final (Receita: +$40M | +5% Confiança)", cost: 0, effect: p => { p.capital += 40; p.trust = Math.min(100, p.trust + 5); } }
        ]
      };
    }

    // 6. PROCEDURAL RANDOM EVENT DILEMMAS (Intermediary Years)
    const cycle = turnNum % 5;
    if (cycle === 1) {
      return {
        title: `${year}: EXPANSÃO DE CAPACIDADE INDUSTRIAL`,
        desc: `A demanda por eletricidade na nação ${nationName} expande no ano de ${year}. Defina o plano estratégico de ampliação.`,
        ticker: `${year} • Cúpula de Genebra analisa projetos de infraestrutura elétrica nacional.`,
        options: [
          { text: `💧 Ampliar Usinas Hidroelétricas (+32 MW | Custo: $28M)`, cost: 28, effect: p => { p.capacity.hydro += 32; p.capital -= 28; } },
          { text: `⛏️ Adicionar Térmica a Carvão/Gás (+40 MW | Custo: $20M)`, cost: 20, effect: p => { p.capacity.thermal += 40; p.capital -= 20; globalFootprint += 12; } },
          { text: `🔬 Financiar Laboratórios Nacionais (+2 Patentes | Custo: $22M)`, cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
          { text: `💰 Emissão de Títulos de Infraestrutura (Receita: +$35M Capital)`, cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    } else if (cycle === 2) {
      return {
        title: `${year}: FLUTUAÇÃO DE PREÇOS NO MERCADO DE COMMODITIES`,
        desc: `As cotações mundiais de combustíveis oscilam em ${year}. Como ${nationName} protegerá suas reservas econômicas?`,
        ticker: `${year} • Mercados internacionais negociam contratos de combustíveis.`,
        options: [
          { text: `🛢️ Importação Garantida de Fósseis (+35 MW | Custo: $24M)`, cost: 24, effect: p => { p.capacity.thermal += 35; p.capital -= 24; globalFootprint += 10; } },
          { text: `🌬️ Subsidiar Parques Eólicos/Solares (+28 MW | Custo: $26M)`, cost: 26, effect: p => { p.capacity.wind += 28; p.capital -= 26; } },
          { text: `🌋 Expandir Usinas Geotérmicas (+30 MW | Custo: $28M)`, cost: 28, effect: p => { p.capacity.geothermal += 30; p.capital -= 28; } },
          { text: `🛡️ Contingenciamento Financeiro (Gratuito | +6% Estabilidade)`, cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 6); } }
        ]
      };
    } else if (cycle === 3) {
      return {
        title: `${year}: CALIBRAÇÃO DE ESTABILIDADE DA REDE ELÉTRICA`,
        desc: `A malha de distribuição de ${nationName} necessita de reparos e modernização no ano de ${year}.`,
        ticker: `${year} • Relatório internacional de estabilidade e eficiência em transmissão.`,
        options: [
          { text: `⚡ Subestações de Alta Tensão (+28 MW | Custo: $22M)`, cost: 22, effect: p => { p.capacity.hydro += 28; p.capital -= 22; } },
          { text: `🌿 Expansão de Biocombustíveis (+30 MW | Custo: $25M)`, cost: 25, effect: p => { p.capacity.biofuels += 30; p.capital -= 25; } },
          { text: `⚛️ Modernizar Reatores Nucleares (+32 MW | Custo: $32M)`, cost: 32, effect: p => { p.capacity.nuclear += 32; p.capital -= 32; } },
          { text: `💰 Imposto de Emergência sobre Lucros (Receita: +$30M | -4% Confiança)`, cost: 0, effect: p => { p.capital += 30; p.trust = Math.max(0, p.trust - 4); } }
        ]
      };
    } else if (cycle === 4) {
      return {
        title: `${year}: INOVAÇÃO TECNOLÓGICA & TRANSIÇÃO`,
        desc: `Novos avanços na física aplicada surgem em ${year}. Qual tecnologia trará maior resiliência a ${nationName}?`,
        ticker: `${year} • Pesquisa em automação e física aplicada em destaque.`,
        options: [
          { text: `⚛️ Tecnologia Nuclear Avançada (+35 MW | Custo: $35M)`, cost: 35, effect: p => { p.capacity.nuclear += 35; p.capital -= 35; } },
          { text: `🌬️ Parques Verdes de Segunda Geração (+30 MW | Custo: $28M)`, cost: 28, effect: p => { p.capacity.wind += 30; p.capital -= 28; globalFootprint = Math.max(0, globalFootprint - 6); } },
          { text: `📜 Registro de Patentes de Automação (+2 Patentes | Custo: $22M)`, cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
          { text: `🛡️ Programa de Capacitação Técnica (Gratuito | +6% Confiança)`, cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 6); } }
        ]
      };
    } else {
      return {
        title: `${year}: PLANEJAMENTO ECOLÓGICO REGIONAL`,
        desc: `Comunidades locais exigem redução de impactos socioambientais nas obras energéticas de ${nationName} em ${year}.`,
        ticker: `${year} • Movimentos sociais debatem impactos de usinas em territórios regionais.`,
        options: [
          { text: `🌱 Parques Solares e Eólicos Comunitários (+30 MW | Custo: $28M)`, cost: 28, effect: p => { p.capacity.wind += 30; p.capital -= 28; globalFootprint = Math.max(0, globalFootprint - 8); } },
          { text: `💧 Otimizar Turbinas em Barragens Existentes (+25 MW | Custo: $20M)`, cost: 20, effect: p => { p.capacity.hydro += 25; p.capital -= 20; } },
          { text: `⛏️ Gerador Térmico de Suporte (+35 MW | Custo: $22M)`, cost: 22, effect: p => { p.capacity.thermal += 35; p.capital -= 22; globalFootprint += 12; } },
          { text: `🛡️ Diálogo Diplomático e Consulta Popular (Gratuito | +7% Confiança)`, cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 7); } }
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
        capital: nat.startCapital || 100, // Capital/Orçamento inicial único da nação
        gdp: nat.startGdp || 500, // PIB inicial único da nação
        stability: 100, // 100%
        trust: 85, // 85% Initial Popular Approval (Confiança do Governo)
        baseDemand: nat.startDemand || 110, // Demanda base em MW única da nação
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
    
    // Display Game Tutorial & Briefing Overlay
    const gameTutorialModal = document.getElementById('gameTutorialModal');
    if (gameTutorialModal) {
      gameTutorialModal.classList.remove('hidden');
    } else {
      window.confirmTutorialAndStartStage();
    }
  };

  window.confirmTutorialAndStartStage = function() {
    try { playClickSound(); } catch (e) {}
    const gameTutorialModal = document.getElementById('gameTutorialModal');
    const playerSetupScreen = document.getElementById('playerSetupScreen');
    const gameStageScreen = document.getElementById('gameStageScreen');

    if (gameTutorialModal) gameTutorialModal.classList.add('hidden');
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
            ${isSurplus ? '⚡ +' + netMW + ' MW' : '⚠️ ' + netMW + ' MW'} | 💰 $${player.capital}M
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
    const netMW = totalGen - currentDemand;
    const isSurplus = netMW >= 0;

    // Update HUD
    if (hudYearBadge) hudYearBadge.innerHTML = `${currentYear} (TURNO ${currentTurnNumber}/50)`;
    if (hudPhaseBadge) hudPhaseBadge.innerHTML = `ANO ${currentYear} • DILEMA DE ENERGIA`;
    if (activeLeaderTag) activeLeaderTag.innerHTML = `LÍDER DA RODADA: ${player.nation.flag} ${player.name.toUpperCase()}`;

    // Footprint Bar Update
    const pctFootprint = Math.min(100, (globalFootprint / 1500) * 100);
    if (hudFootprintFill) hudFootprintFill.style.width = `${pctFootprint}%`;
    if (hudFootprintVal) hudFootprintVal.innerHTML = `${globalFootprint} / 1500 PTS`;

    // Active Stats Footer Bar with Government Trust Status
    let trustTierLabel = 'Aprovação Estável';
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

    // Render Executive Statistics CRT Dashboard (Dados Estatísticos em Destaque)
    const executiveStatsDashboard = document.getElementById('executiveStatsDashboard');
    if (executiveStatsDashboard) {
      const estimatedIncome = Math.round(20 + player.gdp * 0.03 + (isSurplus ? 15 : 0));
      executiveStatsDashboard.innerHTML = `
        <div class="stat-card-widget capital-widget">
          <div class="widget-header">
            <span class="widget-icon">💰</span>
            <span class="widget-title">ORÇAMENTO / CAPITAL</span>
          </div>
          <div class="widget-value">$${player.capital}M</div>
          <div class="widget-sub">Impostos Anuais Est.: +$${estimatedIncome}M</div>
        </div>

        <div class="stat-card-widget balance-widget ${isSurplus ? 'surplus' : 'deficit'}">
          <div class="widget-header">
            <span class="widget-icon">⚡</span>
            <span class="widget-title">GERAÇÃO vs DEMANDA</span>
          </div>
          <div class="widget-value">${totalGen} / ${currentDemand} MW</div>
          <div class="widget-sub">${isSurplus ? '🟢 SUPERÁVIT (+' + netMW + ' MW)' : '🔴 APAGÃO (' + netMW + ' MW)'}</div>
        </div>

        <div class="stat-card-widget trust-widget ${trustClass}">
          <div class="widget-header">
            <span class="widget-icon">👑</span>
            <span class="widget-title">CONFIANÇA DO GOVERNO</span>
          </div>
          <div class="widget-value">${Math.round(player.trust)}%</div>
          <div class="widget-sub">${trustTierLabel}</div>
        </div>

        <div class="stat-card-widget gdp-widget">
          <div class="widget-header">
            <span class="widget-icon">📈</span>
            <span class="widget-title">PIB & ESTABILIDADE</span>
          </div>
          <div class="widget-value">$${Math.round(player.gdp)}B</div>
          <div class="widget-sub">📜 Patentes: ${player.patents} | 🛡️ Est.: ${Math.round(player.stability)}%</div>
        </div>
      `;
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

    // Calculate Live Geopolitical Rankings for News Ticker
    const rankedPlayers = activeGamePlayers.map(p => {
      const pGen = Math.round(Object.values(p.capacity).reduce((a, b) => a + b, 0));
      const pDem = Math.round(p.baseDemand * Math.pow(1.022, currentTurnNumber - 1));
      const pNet = pGen - pDem;
      const score = (p.stability * 0.35) + (p.trust * 0.25) + ((p.gdp / 10) * 0.20) + (p.patents * 3) + (pNet >= 0 ? 10 : -15);
      return { flag: p.nation.flag, name: p.name, score: score.toFixed(1) };
    }).sort((a, b) => b.score - a.score);

    const rankingsStr = rankedPlayers.map((rp, idx) => `#${idx + 1} ${rp.flag} ${rp.name}: ${rp.score} pts`).join(' | ');

    if (newsTickerText) newsTickerText.innerHTML = `${qData.ticker} &nbsp;&nbsp;•&nbsp;&nbsp; 🏆 <strong>RANKING AO VIVO:</strong> ${rankingsStr}`;
    if (decisionBadge) decisionBadge.innerHTML = `TURNO ${currentTurnNumber} DE 50 • DILEMA GEOPOLÍTICO (${currentYear})`;
    if (decisionTitle) decisionTitle.innerHTML = qData.title;
    if (decisionDescription) {
      const conceptBadge = qData.concept ? `<div class="physics-geo-concept-pill" style="margin-top: 10px; font-size: 0.76rem; background: #18150d; border: 1px solid var(--accent-gold); color: var(--accent-gold); padding: 5px 10px; border-radius: 4px; font-family: var(--font-title); letter-spacing: 1px;">${qData.concept}</div>` : '';
      decisionDescription.innerHTML = `${qData.desc} ${conceptBadge}`;
    }

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

          // Competitive Market System (Exportação de Energia & Royalties de Patentes)
          const surplusNations = activeGamePlayers.filter(p => {
            const pGen = Math.round(Object.values(p.capacity).reduce((a, b) => a + b, 0));
            const pDem = Math.round(p.baseDemand * Math.pow(1.022, currentTurnNumber - 1));
            return pGen > pDem;
          });

          const deficitNations = activeGamePlayers.filter(p => {
            const pGen = Math.round(Object.values(p.capacity).reduce((a, b) => a + b, 0));
            const pDem = Math.round(p.baseDemand * Math.pow(1.022, currentTurnNumber - 1));
            return pGen < pDem;
          });

          // Energy Export Revenue & Penalty
          if (surplusNations.length > 0 && deficitNations.length > 0) {
            surplusNations.forEach(p => { p.capital += 15; }); // +$15M Bônus de Exportação
            deficitNations.forEach(p => { p.capital = Math.max(0, p.capital - 12); }); // -$12M Tarifa de Emergência
          }

          // Patent Royalties
          activeGamePlayers.forEach(p => {
            if (p.patents > 0) {
              p.capital += (p.patents * 4); // +$4M por patente ao ano
            }
          });

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
              const trustPenalty = Math.round(defRatio * 40); // Increased penalty for tighter competition
              p.trust = Math.max(0, p.trust - trustPenalty);
              p.stability = Math.max(10, p.stability - (defRatio * 30));
              p.gdp *= Math.max(0.80, 1 - (defRatio * 0.12));
            }

            if (p.trust <= 15) {
              p.capital = Math.max(0, p.capital - 30);
              p.gdp *= 0.90;
            }

            // Check for Impeachment State Collapse (Trust = 0%)
            if (p.trust <= 0 && p.type === 'human') {
              triggerImpeachmentDefeat(p);
              return;
            }
          });

          // Advance to next turn if game is still active
          const endgameScreen = document.getElementById('endgameScreen');
          if (endgameScreen && !endgameScreen.classList.contains('hidden')) return;

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

  // ==========================================================================
  // Victory & Defeat Podium System (Tela de Vitória / Derrota Animada)
  // ==========================================================================
  function spawnConfetti() {
    const container = document.getElementById('confettiContainer');
    if (!container) return;
    container.innerHTML = '';

    const shapes = ['🎉', '✨', '⚡', '🍃', '🌟', '💰', '🏆', '📜'];
    for (let i = 0; i < 40; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.innerHTML = shapes[Math.floor(Math.random() * shapes.length)];
      particle.style.left = `${Math.random() * 95}%`;
      particle.style.animationDelay = `${Math.random() * 3}s`;
      particle.style.animationDuration = `${3.2 + Math.random() * 2.8}s`;
      container.appendChild(particle);
    }
  }

  // Victory Resolution (Turn 50 / Year 2020)
  function triggerVictoryResolution() {
    const scoredPlayers = activeGamePlayers.map(p => {
      const score = (0.35 * (p.gdp / 1000)) + (0.30 * (p.trust / 100)) + (0.20 * (p.patents / 10)) - (0.15 * (p.cumulativeEmissions / 100));
      return { ...p, resilienceScore: (score * 100).toFixed(1) };
    }).sort((a, b) => b.resilienceScore - a.resilienceScore);

    const winner = scoredPlayers[0];
    const isHumanWinner = winner.type === 'human';

    const endgameScreen = document.getElementById('endgameScreen');
    const endgameCard = document.getElementById('endgameCard');
    const endgameBadge = document.getElementById('endgameBadge');
    const endgameIconHero = document.getElementById('endgameIconHero');
    const endgameTitle = document.getElementById('endgameTitle');
    const endgameSubtitle = document.getElementById('endgameSubtitle');

    const championCrownLabel = document.getElementById('championCrownLabel');
    const championFlag = document.getElementById('championFlag');
    const championAvatarIcon = document.getElementById('championAvatarIcon');
    const championName = document.getElementById('championName');
    const championNationTitle = document.getElementById('championNationTitle');

    const champResilienceVal = document.getElementById('champResilienceVal');
    const champTrustVal = document.getElementById('champTrustVal');
    const champGdpVal = document.getElementById('champGdpVal');

    const leaderboardList = document.getElementById('leaderboardList');

    if (!endgameScreen || !endgameCard) return;

    // Reset themes
    endgameCard.className = 'endgame-card';

    if (isHumanWinner) {
      // Human Victory Theme
      if (endgameBadge) endgameBadge.innerHTML = 'RESULTADO FINAL • CÚPULA DE GENEBRA (2020)';
      if (endgameIconHero) endgameIconHero.innerHTML = '🏆';
      if (endgameTitle) endgameTitle.innerHTML = 'VITÓRIA HISTÓRICA!';
      if (endgameSubtitle) endgameSubtitle.innerHTML = `Parabéns ${winner.name}! Sua diplomacia e estratégia lideraram a transição energética mundial com maestria!`;
      if (championCrownLabel) championCrownLabel.innerHTML = '👑 CAMPEÃO MUNDIAL';
      spawnConfetti();
    } else {
      // AI Winner Theme / Human Runner-Up
      if (endgameBadge) endgameBadge.innerHTML = 'RESULTADO FINAL • APURAÇÃO DA CÚPULA';
      if (endgameIconHero) endgameIconHero.innerHTML = '📜';
      if (endgameTitle) endgameTitle.innerHTML = 'CÚPULA CONCLUÍDA!';
      if (endgameSubtitle) endgameSubtitle.innerHTML = `A nação ${winner.nation.name} alcançou o maior índice de resiliência energética global ao fim dos 50 anos.`;
      if (championCrownLabel) championCrownLabel.innerHTML = '🥇 1º LUGAR NA CÚPULA';
    }

    // Populate Champion Card
    if (championFlag) championFlag.innerHTML = winner.nation.flag;
    let avatarIcon = '👨‍💼';
    if (winner.nationId === 'norway') avatarIcon = '🧔🏻‍♂️';
    if (winner.nationId === 'brazil') avatarIcon = '👨🏽‍💼';
    if (winner.nationId === 'iceland') avatarIcon = '👨🏼‍💼';
    if (winner.nationId === 'uk') avatarIcon = '🤵🏼‍♂️';
    if (winner.nationId === 'usa') avatarIcon = '🇺🇸🏼';
    if (championAvatarIcon) championAvatarIcon.innerHTML = avatarIcon;

    if (championName) championName.innerHTML = winner.name.toUpperCase();
    if (championNationTitle) championNationTitle.innerHTML = `${winner.nation.name.toUpperCase()} • ${winner.nation.tagline}`;
    if (champResilienceVal) champResilienceVal.innerHTML = `${winner.resilienceScore} PTS`;
    if (champTrustVal) champTrustVal.innerHTML = `${Math.round(winner.trust)}%`;
    if (champGdpVal) champGdpVal.innerHTML = `$${(winner.gdp / 1000).toFixed(2)}T`;

    // Populate Full Leaderboard List
    if (leaderboardList) {
      leaderboardList.innerHTML = '';
      scoredPlayers.forEach((p, idx) => {
        const item = document.createElement('div');
        item.className = `leader-rank-item ${idx === 0 ? 'is-winner' : ''}`;
        
        let posBadge = `${idx + 1}º`;
        if (idx === 0) posBadge = '🥇';
        if (idx === 1) posBadge = '🥈';
        if (idx === 2) posBadge = '🥉';

        item.innerHTML = `
          <span class="rank-position-badge">${posBadge}</span>
          <div class="rank-player-info">
            <span class="rank-player-flag">${p.nation.flag}</span>
            <span class="rank-player-name">${p.name} (${p.nation.name})</span>
          </div>
          <span class="rank-score-badge">${p.resilienceScore} pts</span>
        `;
        leaderboardList.appendChild(item);
      });
    }

    endgameScreen.classList.remove('hidden');
  }

  // State Collapse / Impeachment Defeat Screen (Trust = 0%)
  function triggerImpeachmentDefeat(failedPlayer) {
    const endgameScreen = document.getElementById('endgameScreen');
    const endgameCard = document.getElementById('endgameCard');
    const endgameBadge = document.getElementById('endgameBadge');
    const endgameIconHero = document.getElementById('endgameIconHero');
    const endgameTitle = document.getElementById('endgameTitle');
    const endgameSubtitle = document.getElementById('endgameSubtitle');

    const championCrownLabel = document.getElementById('championCrownLabel');
    const championFlag = document.getElementById('championFlag');
    const championAvatarIcon = document.getElementById('championAvatarIcon');
    const championName = document.getElementById('championName');
    const championNationTitle = document.getElementById('championNationTitle');

    const champResilienceVal = document.getElementById('champResilienceVal');
    const champTrustVal = document.getElementById('champTrustVal');
    const champGdpVal = document.getElementById('champGdpVal');

    if (!endgameScreen || !endgameCard) return;

    // Apply Defeat Theme (Red Crisis Styling + Newspaper Spin Animation)
    endgameCard.className = 'endgame-card theme-defeat';

    if (endgameBadge) endgameBadge.innerHTML = 'EXTRA! CRISE DE ESTADO & IMPEACHMENT';
    if (endgameIconHero) endgameIconHero.innerHTML = '🚨';
    if (endgameTitle) endgameTitle.innerHTML = 'GOVERNO DESTITUÍDO!';
    if (endgameSubtitle) endgameSubtitle.innerHTML = `A aprovação do governo de ${failedPlayer.name} em ${failedPlayer.nation.name} ruiu para 0%! Protestos populares forçaram a renúncia do gabinete.`;

    if (championCrownLabel) championCrownLabel.innerHTML = '🔴 REVOLTA POPULAR';
    if (championFlag) championFlag.innerHTML = failedPlayer.nation.flag;
    if (championAvatarIcon) championAvatarIcon.innerHTML = '⚠️';
    if (championName) championName.innerHTML = failedPlayer.name.toUpperCase();
    if (championNationTitle) championNationTitle.innerHTML = `${failedPlayer.nation.name.toUpperCase()} • IMPEACHMENT EM ${currentYear}`;

    if (champResilienceVal) champResilienceVal.innerHTML = `0.0 PTS`;
    if (champTrustVal) champTrustVal.innerHTML = `0% (COLAPSO)`;
    if (champGdpVal) champGdpVal.innerHTML = `$${Math.round(failedPlayer.gdp)}B`;

    endgameScreen.classList.remove('hidden');
  }

  // Restart Handlers for Victory/Defeat Screen & Credits
  window.restartGameSetup = function() {
    try { playClickSound(); } catch (e) {}
    const movieCreditsOverlay = document.getElementById('movieCreditsOverlay');
    const endgameScreen = document.getElementById('endgameScreen');
    const gameStageScreen = document.getElementById('gameStageScreen');
    const playerSetupScreen = document.getElementById('playerSetupScreen');

    if (movieCreditsOverlay) movieCreditsOverlay.classList.add('hidden');
    if (endgameScreen) endgameScreen.classList.add('hidden');
    if (gameStageScreen) gameStageScreen.classList.add('hidden');
    if (playerSetupScreen) playerSetupScreen.classList.remove('hidden');

    try { renderPlayerSlots(); } catch (e) {}
  };

  // Movie Credits Handlers (Estilo Rolagem de Cinema)
  window.showMovieCredits = function() {
    try { playClickSound(); } catch (e) {}
    const movieCreditsOverlay = document.getElementById('movieCreditsOverlay');
    const movieCreditsRoll = document.getElementById('movieCreditsRoll');

    if (movieCreditsOverlay) {
      movieCreditsOverlay.classList.remove('hidden');
    }

    if (movieCreditsRoll) {
      // Reset animation to trigger seamless roll down/up from beginning with ZERO delay
      movieCreditsRoll.style.animation = 'none';
      void movieCreditsRoll.offsetHeight; // trigger reflow
      movieCreditsRoll.style.animation = 'rollUpMovieCredits 22s linear forwards';
    }
  };

  window.hideMovieCredits = function() {
    try { playClickSound(); } catch (e) {}
    const movieCreditsOverlay = document.getElementById('movieCreditsOverlay');
    if (movieCreditsOverlay) {
      movieCreditsOverlay.classList.add('hidden');
    }
  };

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
