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
    const nationName = nation.name ? nation.name.toUpperCase() : 'NAÇÃO';
    const currentCap = nation.capital || 100;

    // 1. DÉCADA DE 1970 (1970 – 1979)
    if (year === 1970) {
      return {
        title: "1970: CONSERVAÇÃO DA ENERGIA MECÂNICA & TRABALHO INDUSTRIAL",
        desc: `As indústrias operam em capacidade máxima na abertura da Cúpula de Genebra. Pelo princípio de conservação, a energia mecânica total em sistemas conservativos é a soma da energia cinética com a potencial (Em = Ec + Ep). Defina a prioridade de arranque da matriz de ${nationName}.`,
        ticker: "1970 • Abertura da Cúpula de Genebra: Países debatem a conversão de energia potencial e cinética para geração de trabalho útil.",
        concept: "🔬 FÍSICA: Energia Mecânica (Em = Ec + Ep), Cinética (Ec = m·v²/2) e Gravitacional (Epg = m·g·h) | 🌍 GEOGRAFIA: Industrialização de Base & Demografia",
        options: [
          { text: "💧 Hidrelétricas de Alta Queda (Conversão de Epg = m·g·h em Ec nas turbinas | +40 MW | Custo: $35M)", cost: 35, effect: p => { p.capacity.hydro += 40; p.capital -= 35; } },
          { text: "⛏️ Termelétricas a Carvão Mineral (Ciclos a vapor com queima fóssil | +50 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.thermal += 50; p.capital -= 25; globalFootprint += 18; } },
          { text: "🔬 Pesquisa em Turbinas Hidráulicas e Geradores (+2 Patentes | Custo: $20M)", cost: 20, effect: p => { p.patents += 2; p.capital -= 20; } },
          { text: "💰 Emissão de Títulos Públicos de Infraestrutura (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 1971) {
      return {
        title: "1971: CALOR, TEMPERATURA & CAPACIDADE TÉRMICA",
        desc: `A termodinâmica industrial define que o calor é energia térmica em trânsito devido à diferença de temperatura. Para aquecer as caldeiras de ${nationName}, é consumida grande quantidade de calor sensível (Q = m·c·ΔT). Como sua nação otimizará seus ciclos térmicos?`,
        ticker: "1971 • Termodinâmica Industrial: Debates em Genebra sobre calor sensível, calor específico e capacidade térmica na geração de vapor.",
        concept: "🔬 FÍSICA: Energia Térmica, Calor Específico (Q = m·c·ΔT) e Capacidade Térmica (C = Q/ΔT) | 🌍 GEOGRAFIA: Disponibilidade de Recursos Térmicos e Combustíveis",
        options: [
          { text: "🛢️ Caldeiras a Petróleo com Trocadores de Calor de Alta Eficiência (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.thermal += 35; p.capital -= 30; globalFootprint += 12; } },
          { text: "🌿 Biomassa Florestal para Co-geração de Vapor e Eletricidade (+30 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.biofuels += 30; p.capital -= 25; } },
          { text: "⚡ Otimização do Isolamento Térmico de Condutos e Turbinas (+25 MW | Custo: $20M)", cost: 20, effect: p => { p.capacity.hydro += 25; p.capital -= 20; } },
          { text: "🛡️ Fundo Nacional de Eficiência e Contingência Térmica (Gratuito | +6% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 6); } }
        ]
      };
    }

    if (year === 1972) {
      return {
        title: "1972: CONFERÊNCIA DE ESTOCOLMO & MODOS DE PROPAGAÇÃO DO CALOR",
        desc: `A ONU realiza a histórica Conferência de Estocolmo sobre o Meio Ambiente. A propagação do calor ocorre por Condução (agitação molecular), Convecção (movimento de fluidos aquecidos) e Radiação (ondas eletromagnéticas). Como ${nationName} agirá contra a poluição?`,
        ticker: "1972 • Conferência de Estocolmo: Primeiro alerta ecológico global sobre emissões de usinas e dispersão térmica.",
        concept: "🔬 FÍSICA: Propagação Térmica (Condução, Convecção e Radiação) | 🌍 GEOGRAFIA: Conferência de Estocolmo & Impactos Ambientais Globais",
        options: [
          { text: "🌱 Fontes Renováveis Iniciais (Eólica e Geotermia Convectiva) (+30 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.wind += 30; p.capital -= 30; globalFootprint = Math.max(0, globalFootprint - 10); } },
          { text: "⛏️ Manter Foco em Centrais Térmicas a Carvão de Baixo Custo (+45 MW | Custo: $20M)", cost: 20, effect: p => { p.capacity.thermal += 45; p.capital -= 20; globalFootprint += 22; } },
          { text: "📜 Registrar Patentes de Isolamento Convectivo e Filtragem (+2 Patentes | Custo: $22M)", cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
          { text: "🏛️ Programa de Redução de Gastos e Austeridade Pública (Receita: +$30M | -3% PIB)", cost: 0, effect: p => { p.capital += 30; p.gdp *= 0.97; } }
        ]
      };
    }

    if (year === 1973) {
      return {
        title: "1973: PRIMEIRO CHOQUE DO PETRÓLEO & ENERGIA QUÍMICA",
        desc: `A OPEP decreta embargo e o preço do barril de petróleo dispara 300%. A energia química reside nas ligações covalentes dos hidrocarbonetos, liberada por combustão exotérmica (ΔH < 0). Como ${nationName} protegerá sua matriz?`,
        ticker: "1973 • CHOQUE DO PETRÓLEO: Embargo da OPEP paralisa transportes e força a busca por fontes alternativas.",
        concept: "🔬 FÍSICA/QUÍMICA: Energia Química em Ligações Covalentes, Reações Exotérmicas e Combustão | 🌍 GEOGRAFIA: Geopolítica do Petróleo & Cartel da OPEP",
        options: [
          { text: "🌿 Programa de Biocombustíveis a partir da Fotossíntese da Cana e Milho (+35 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.biofuels += 35; p.capital -= 28; } },
          { text: "⛏️ Reativação Emergencial de Minas de Carvão Mineral (+45 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.thermal += 45; p.capital -= 22; globalFootprint += 25; } },
          { text: "⚛️ Iniciar Projeto de Usina Nuclear de Fissão U-235 (+30 MW | Custo: $40M)", cost: 40, effect: p => { p.capacity.nuclear += 30; p.capital -= 40; } },
          { text: "🛡️ Racionamento Estratégico de Combustíveis nos Transportes (Gratuito | +8% Estabilidade)", cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 8); } }
        ]
      };
    }

    if (year === 1974) {
      return {
        title: "1974: A FISSÃO NUCLEAR DO URÂNIO-235 (E = Δm·c²)",
        desc: `A fissão do núcleo de Urânio-235 libera calor abundante pela equivalência massa-energia de Einstein (E = Δm·c²). O calor aquece o circuito primário de água a 320°C sob 157 atm para mover turbinas a vapor. Qual será o investimento de ${nationName}?`,
        ticker: "1974 • Corrida Nuclear: Nações investem em centrais termonucleares com reatores de água pressurizada.",
        concept: "🔬 FÍSICA: Fissão Nuclear do Urânio-235, E = Δm·c² e Circuitos Térmicos Pressurizados (157 atm) | 🌍 GEOGRAFIA: Geologia do Urânio & Soberania Energética",
        options: [
          { text: "⚛️ Usina Nuclear PWR com 3 Circuitos Independentes (+50 MW | Custo: $45M)", cost: 45, effect: p => { p.capacity.nuclear += 50; p.capital -= 45; } },
          { text: "💧 Usinas Hidrelétricas em Rios Planálticos Caudalosos (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.hydro += 35; p.capital -= 30; } },
          { text: "📜 Licenciamento Internacional de Reatores e Combustível (+3 Patentes | Custo: $32M)", cost: 32, effect: p => { p.patents += 3; p.capital -= 32; } },
          { text: "💰 Taxa Emergencial sobre Combustíveis Fósseis Importados (Receita: +$30M | -5% Confiança)", cost: 0, effect: p => { p.capital += 30; p.trust = Math.max(0, p.trust - 5); } }
        ]
      };
    }

    if (year === 1975) {
      return {
        title: "1975: O PROGRAMA PROÁLCOOL & ENERGIA DA BIOMASSA",
        desc: `O Brasil cria o Proálcool em 1975 para mitigar a crise fóssil. A biomassa vegetal converte energia solar em energia química por fotossíntese (glicose), sendo fermentada por microrganismos em etanol combustível. Como ${nationName} aplicará a biomassa?`,
        ticker: "1975 • Criação do Proálcool: Brasil lidera a produção de bioetanol a partir do bagaço e caldo da cana-de-açúcar.",
        concept: "🔬 FÍSICA/QUÍMICA: Fotossíntese, Conversão Bioquímica (Fermentação) & Ciclo Neutro de Carbono | 🌍 GEOGRAFIA: Programa Proálcool no Brasil & Agroenergia",
        options: [
          { text: "🌿 Destilarias de Etanol e Usinas Termelétricas a Bagaço (+35 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.biofuels += 35; p.capital -= 28; } },
          { text: "⚡ Ampliação de Linhas de Alta Tensão Inter-regionais (+30 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.hydro += 30; p.capital -= 25; } },
          { text: "🛢️ Refino de Petróleo para Gasolina e Óleo Diesel (+35 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.thermal += 35; p.capital -= 22; globalFootprint += 15; } },
          { text: "🛡️ Incentivo Fiscal para Mistura Obrigatória de Biocombustíveis (Gratuito | +6% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 6); } }
        ]
      };
    }

    if (year === 1976) {
      return {
        title: "1976: TRANSMISSÃO EM ALTA TENSÃO & EFEITO JOULE",
        desc: `O transporte de eletricidade por longas distâncias sofre perda de calor por Efeito Joule (P_perda = R·I²). Para minimizar a corrente (I), subestações elevatórias aumentam a tensão (V) nos cabos condutores. Como ${nationName} modernizará sua rede?`,
        ticker: "1976 • Engenharia Elétrica: Transformadores elevadores de alta tensão minimizam perdas térmicas por efeito Joule.",
        concept: "🔬 FÍSICA: Efeito Joule (P_perda = R·I²), Potência Elétrica (P = V·I) e Transformadores | 🌍 GEOGRAFIA: Redes Nacionais de Transmissão e Centros Consumidores",
        options: [
          { text: "⚡ Linhas de Transmissão de Alta Tensão e Subestações Elevatórias (+30 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.hydro += 30; p.capital -= 25; } },
          { text: "⛏️ Termelétricas a Carvão Locais Próximas às Cidades (+35 MW | Custo: $20M)", cost: 20, effect: p => { p.capacity.thermal += 35; p.capital -= 20; globalFootprint += 18; } },
          { text: "📜 Registro de Patentes de Condutores de Cobre de Baixa Resistividade (+2 Patentes | Custo: $22M)", cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
          { text: "💰 Venda de Ativos de Redes Secundárias (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 1977) {
      return {
        title: "1977: CHUVA ÁCIDA & O ENXOFRE NO CARVÃO MINERAL",
        desc: `A queima de carvão mineral rico em impurezas de enxofre libera dióxido de enxofre (SO2) e óxidos de nitrogênio (NOx), gerando chuvas ácidas que degradam solos e florestas. A opinião pública de ${nationName} exige providências imediatas.`,
        ticker: "1977 • Alerta Ecológico: Chuva ácida provocada por usinas a carvão danifica ecossistemas na Europa e América do Norte.",
        concept: "🔬 FÍSICA/QUÍMICA: Emissões de SO2/NOx, Reações Atmosféricas e Filtros Dessulfurizadores | 🌍 GEOGRAFIA: Precipitação Ácida Transfronteiriça & Bacias Carboníferas",
        options: [
          { text: "🌱 Instalação de Filtros Dessulfurizadores nas Termelétricas (+20 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.thermal += 20; p.capital -= 22; globalFootprint = Math.max(0, globalFootprint - 12); } },
          { text: "🌬️ Substituir Carvão Poluente por Energia Eólica Costeira (+28 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.wind += 28; p.capital -= 28; } },
          { text: "💧 Expansão de Usinas Hidroelétricas de Cabeceira (+30 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.hydro += 30; p.capital -= 30; } },
          { text: "🛡️ Legislação de Proteção Florestal e Controle de Emissões (Gratuito | +7% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 7); } }
        ]
      };
    }

    if (year === 1978) {
      return {
        title: "1978: GÁS NATURAL, GASODUTOS & METANO (CH4)",
        desc: `O gás natural é um combustível fóssil composto essencialmente por metano (CH4), etano e propano. Inodoro e altamente inflamável, recebe compostos odorantes para segurança e é transportado por gasodutos com poder calorífico de até 10.000 kcal/m³.`,
        ticker: "1978 • Gás Natural: Expansão de gasodutos conecta jazidas subterrâneas a termelétricas urbanas.",
        concept: "🔬 FÍSICA/QUÍMICA: Hidrocarbonetos Gasosos (CH4, C2H6, C3H8), Poder Calorífico (8.000-10.000 kcal/m³) | 🌍 GEOGRAFIA: Redes Transcontinentais de Gasodutos e Bacias Sedimentares",
        options: [
          { text: "🛢️ Termelétricas a Gás Natural de Alta Produtividade (+40 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.thermal += 40; p.capital -= 28; globalFootprint += 10; } },
          { text: "⚛️ Ampliação de Reator Nuclear de Água Pressurizada (+35 MW | Custo: $38M)", cost: 38, effect: p => { p.capacity.nuclear += 35; p.capital -= 38; } },
          { text: "🌿 Usinas de Gaseificação de Biomassa para Gás de Síntese (+25 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.biofuels += 25; p.capital -= 22; } },
          { text: "💰 Reajuste Tarifário na Distribuição de Gás Urbano (Receita: +$35M | -5% Confiança)", cost: 0, effect: p => { p.capital += 35; p.trust = Math.max(0, p.trust - 5); } }
        ]
      };
    }

    if (year === 1979) {
      return {
        title: "1979: SEGUNDO CHOQUE DO PETRÓLEO & THREE MILE ISLAND",
        desc: `A Revolução Iraniana gera o segundo choque do petróleo, enquanto a usina de Three Mile Island (EUA) sofre um acidente nuclear com vazamento de água radioativa controlada. O trabalho de forças dissipativas de atrito converte energia mecânica em calor (W = Fatrito·d). Como agir?`,
        ticker: "1979 • 2º Choque do Petróleo & Incidente em Three Mile Island: Países buscam diversificação urgente.",
        concept: "🔬 FÍSICA: Trabalho de Forças Dissipativas (W = Fatrito·d = μc·Fres·d) e Segurança Nuclear | 🌍 GEOGRAFIA: Crise de Suprimento no Golfo Pérsico & Geopolítica",
        options: [
          { text: "🌋 Perfuração Geotérmica e Usinas Hidrelétricas de Reserva (+35 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.geothermal += 35; p.capital -= 32; } },
          { text: "🛢️ Importação Emergencial de Fósseis para Térmicas (+30 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.thermal += 30; p.capital -= 25; globalFootprint += 14; } },
          { text: "⚡ Manutenção de Geradores e Mancais para Reduzir Perdas por Atrito (+20 MW | Custo: $18M)", cost: 18, effect: p => { p.capacity.hydro += 20; p.capital -= 18; } },
          { text: "🛡️ Plano de Contingência Social e Racionamento Preventivo (Gratuito | +8% Estabilidade)", cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 8); } }
        ]
      };
    }

    // 2. DÉCADA DE 1980 (1980 – 1989)
    if (year === 1980) {
      return {
        title: "1980: OS RANKS DO CARVÃO MINERAL (TURFA, LINHITO, HULHA, ANTRACITO)",
        desc: `O carvão mineral é uma rocha sedimentar formada na Era Paleozóica (Período Carbonífero). Seus estágios de maturação (rank) variam pelo teor de carbono: Turfa (55-60%), Linhito (67-78%), Hulha/Betuminoso (80-90%) e Antracito (96%). Qual estágio ${nationName} explorará?`,
        ticker: "1980 • Mineração Energética: Indústrias classificam carvões de alto poder calorífico (Hulha e Antracito).",
        concept: "🔬 FÍSICA/QUÍMICA: Ranks de Carbonificação, Teor de Carbono e Poder Calorífico (kcal/kg) | 🌍 GEOGRAFIA: Jazidas da Bacia Carbonífera do Sul do Brasil (99,97%) e Mundo",
        options: [
          { text: "⛏️ Usina Térmica a Carvão Betuminoso / Hulha de Alto Poder Calorífico (+45 MW | Custo: $26M)", cost: 26, effect: p => { p.capacity.thermal += 45; p.capital -= 26; globalFootprint += 20; } },
          { text: "⚡ Otimizar Eficiência de Turbinas Hidráulicas Existentes (+25 MW | Custo: $20M)", cost: 20, effect: p => { p.capacity.hydro += 25; p.capital -= 20; } },
          { text: "📜 P&D de Métodos de Lavagem e Desulfurização de Carvão (+2 Patentes | Custo: $22M)", cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
          { text: "💰 Empréstimo Estatal para Mineração de Carvão (Receita: +$35M | -4% Confiança)", cost: 0, effect: p => { p.capital += 35; p.trust = Math.max(0, p.trust - 4); } }
        ]
      };
    }

    if (year === 1981) {
      return {
        title: "1981: ENERGIA POTENCIAL ELÁSTICA (Epe = k·x²/2) & VOLANTES DE INÉRCIA",
        desc: `A energia potencial elástica é armazenada por deformação em corpos elásticos como molas (Epe = k·x²/2). Sistemas industriais começam a utilizar volantes de inércia para acumular energia cinética rotacional (Ec = 1/2·I·ω²) para estabilizar picos de consumo em ${nationName}.`,
        ticker: "1981 • Mecânica Aplicada: Armazenamento cinético por volantes de inércia e sistemas elásticos auxiliam malhas industriais.",
        concept: "🔬 FÍSICA: Energia Potencial Elástica (Epe = k·x²/2) e Energia Cinética Rotacional (Ec = 1/2·I·ω²) | 🌍 GEOGRAFIA: Armazenamento Mecânico de Energia em Polos Fabris",
        options: [
          { text: "⚙️ Baterias de Volante de Inércia para Estabilização da Rede (+30 MW | Custo: $26M)", cost: 26, effect: p => { p.capacity.hydro += 30; p.capital -= 26; } },
          { text: "🛢️ Geradores Térmicos a Óleo Combustível de Partida Rápida (+35 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.thermal += 35; p.capital -= 22; globalFootprint += 14; } },
          { text: "📜 Patentes de Molas de Aço-Liga e Rotores de Alta Inércia (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "🛡️ Otimização de Demanda nos Horários de Ponta (Gratuito | +6% Estabilidade)", cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 6); } }
        ]
      };
    }

    if (year === 1982) {
      return {
        title: "1982: A USINA BINACIONAL DE ITAIPU & RIOS DE PLANALTO",
        desc: `O Brasil e o Paraguai concluem a barragem de Itaipu no Rio Paraná. Rios de planalto proporcionam grandes desníveis (quedas d'água H) e alta vazão (Q), gerando potência colossal (P = η·ρ·g·Q·H). Como ${nationName} desenvolverá seu potencial hidráulico?`,
        ticker: "1982 • Itaipu Binacional: A maior geradora hidrelétrica do mundo no Rio Paraná inicia testes operacionais.",
        concept: "🔬 FÍSICA: Potência Hidráulica Efetiva (P = η·ρ·g·Q·H) e Transformação Epg -> Ec -> Elétrica | 🌍 GEOGRAFIA: Rios de Planalto, Bacia do Rio Paraná e Hidrodiplomacia",
        options: [
          { text: "💧 Megaprojeto Hidrelétrico Binacional em Rio de Planalto (+45 MW | Custo: $38M)", cost: 38, effect: p => { p.capacity.hydro += 45; p.capital -= 38; } },
          { text: "⛏️ Termelétricas Fósseis Modulares de Complementação (+35 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.thermal += 35; p.capital -= 22; globalFootprint += 14; } },
          { text: "📜 Patentes de Turbinas Francis de Alto Rendimento Hidráulico (+3 Patentes | Custo: $30M)", cost: 30, effect: p => { p.patents += 3; p.capital -= 30; } },
          { text: "🛡️ Acordo Diplomático Bilateral de Partilha de Energia (Gratuito | +8% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 8); } }
        ]
      };
    }

    if (year === 1983) {
      return {
        title: "1983: ENERGIA GEOTÉRMICA & LIMITES DE PLACAS TECTÔNICAS",
        desc: `A energia geotérmica aproveita o calor do interior da Terra em áreas vulcânicas e de borda de placas tectônicas (como na Islândia e Filipinas). No Brasil, o potencial é limitado por estar no centro estável da placa sul-americana. Qual estratégia ${nationName} adotará?`,
        ticker: "1983 • Geotermia: Países em zonas vulcânicas aproveitam vapor subterrâneo estável para mover turbinas.",
        concept: "🔬 FÍSICA: Termodinâmica de Fluidos Geotermais e Vaporização | 🌍 GEOGRAFIA: Tectônica de Placas, Zonas Vulcânicas vs Centro de Placas Estáveis",
        options: [
          { text: "🌋 Centrais Geotérmicas de Vapor Profundo de Carga Básica (+35 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.geothermal += 35; p.capital -= 32; } },
          { text: "🌿 Expansão de Caldeiras a Biomassa e Resíduos Agrícolas (+30 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.biofuels += 30; p.capital -= 25; } },
          { text: "📜 Pesquisa em Prospecção Geotérmica e Sondagem (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "💰 Linha de Financiamento para Obras Geológicas (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 1984) {
      return {
        title: "1984: HIDRELÉTRICA DE TUCURUÍ NO RIO TOCANTINS & IMPACTOS NA AMAZÔNIA",
        desc: `Entra em operação a Usina Hidrelétrica de Tucuruí (Rio Tocantins, PA), com capacidade para mais de 8.000 MW. Grandes reservatórios em rios de planície amazônica exigem extensas áreas alagadas, impactando comunidades indígenas e a biodiversidade local.`,
        ticker: "1984 • Usina de Tucuruí: Megaprojeto hidrelétrico no Rio Tocantins impulsiona a mineração e a indústria amazônica.",
        concept: "🔬 FÍSICA: Conservação de Energia Hidráulica e Vazão Volumétrica (Q = A·v) | 🌍 GEOGRAFIA: Bacia do Tocantins-Araguaia, Alagamento de Florestas e Populações Tradicionais",
        options: [
          { text: "💧 Expansão de Geradores Hidráulicos em Bacias Amazônicas (+45 MW | Custo: $36M)", cost: 36, effect: p => { p.capacity.hydro += 45; p.capital -= 36; } },
          { text: "🛢️ Plataformas Offshore de Óleo e Gás na Margem Continental (+40 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.thermal += 40; p.capital -= 32; globalFootprint += 16; } },
          { text: "📜 Patentes de Monitoramento de Assoreamento e Eclusas Fluviais (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "🛡️ Programa de Mitigação Socioambiental e Realocação Criteriosa (Gratuito | +7% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 7); } }
        ]
      };
    }

    if (year === 1985) {
      return {
        title: "1985: INAUGURAÇÃO DE ANGRA 1 NO BRASIL & REFRIGERAÇÃO COSTEIRA",
        desc: `A primeira usina nuclear do Brasil, Angra 1 (Angra dos Reis, RJ), entra em operação comercial. Utilizando reatores de água pressurizada e 3 circuitos independentes refrigerados por água do mar, fornece energia de base sem emissão de gases do efeito estufa.`,
        ticker: "1985 • Angra 1 em Operação: Brasil integra energia nuclear à matriz elétrica da Região Sudeste.",
        concept: "🔬 FÍSICA: Fissão Controlada de Urânio, Circuito Secundário a Vapor (1800 rpm) e Condensador Costeiro | 🌍 GEOGRAFIA: Programa Nuclear Brasileiro & Localização Litorânea em Angra dos Reis",
        options: [
          { text: "⚛️ Consolidação da Central Nuclear de Base em Área Costeira (+40 MW | Custo: $40M)", cost: 40, effect: p => { p.capacity.nuclear += 40; p.capital -= 40; } },
          { text: "🌿 Expansão do Plantio de Cana-de-Açúcar e Eucalipto para Bioenergia (+30 MW | Custo: $26M)", cost: 26, effect: p => { p.capacity.biofuels += 30; p.capital -= 26; } },
          { text: "📜 Certificação de Segurança e Gestão de Rejeitos Radioativos (+2 Patentes | Custo: $25M)", cost: 25, effect: p => { p.patents += 2; p.capital -= 25; } },
          { text: "💰 Concessão de Linhas de Transmissão para o Sudeste (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 1986) {
      return {
        title: "1986: O DESASTRE DE CHERNOBYL & SEGURANÇA NUCLEAR REDUNDANTE",
        desc: `A explosão do reator 4 na Usina de Chernobyl (Ucrânia) dispersa radiação por toda a Europa. O acidente expõe os riscos do descarte irregular de lixo atômico e exige sistemas de segurança redundantes e independentes em todas as centrais nucleares do planeta.`,
        ticker: "1986 • TRAGÉDIA EM CHERNOBYL: Acidente nuclear catastrófico paralisa obras e redefine padrões internacionais de segurança.",
        concept: "🔬 FÍSICA: Fissão Nuclear em Cadeia Descontrolada, Radiação Ionizante e Contenção Térmica | 🌍 GEOGRAFIA: Dispersão Atmosférica Transfronteiriça e Zonas de Exclusão",
        options: [
          { text: "⚛️ Modernização Completa de Segurança e Vasos de Contenção Nuclear (+30 MW | Custo: $42M)", cost: 42, effect: p => { p.capacity.nuclear += 30; p.capital -= 42; } },
          { text: "🌬️ Migração Apressada para Parques Eólicos e Pequenas Centrais Hidrelétricas (+32 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.wind += 32; p.capital -= 30; } },
          { text: "💧 Modernização de Turbinas em Usinas Hidroelétricas de Planalto (+30 MW | Custo: $26M)", cost: 26, effect: p => { p.capacity.hydro += 30; p.capital -= 26; } },
          { text: "📋 Protocolo de Auditoria e Inspeção Rigorosa nas Usinas (Custo: $15M | +10% Estabilidade)", cost: 15, effect: p => { p.capital -= 15; p.stability = Math.min(100, p.stability + 10); } }
        ]
      };
    }

    if (year === 1987) {
      return {
        title: "1987: HISTÓRIA DA ENERGIA EÓLICA & AEROGERADORES MODERNOS",
        desc: `No centenário da primeira turbina elétrica de James Blyth (1887), a moderna indústria eólica projeta aerogeradores com pás aerodinâmicas conectadas a rotores e naceles que multiplicam rotações (10 a 25 rpm) para gerar eletricidade limpa a partir do vento.`,
        ticker: "1987 • Tecnologia Eólica: Aerogeradores modernos provam viabilidade econômica como Mecanismo de Desenvolvimento Limpo.",
        concept: "🔬 FÍSICA: Energia Cinética do Vento (Ec = m·v²/2), Rotação Mecânica e Indução Eletromagnética no Gerador | 🌍 GEOGRAFIA: Mapeamento Global do Potencial Eólico e Parques Costeiros",
        options: [
          { text: "🌬️ Construção de Parque Eólico com Aerogeradores de Alta Eficiência (+35 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.wind += 35; p.capital -= 32; } },
          { text: "⛏️ Termelétricas a Carvão Mineral com Lavagem Física de Cinzas (+40 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.thermal += 40; p.capital -= 22; globalFootprint += 18; } },
          { text: "📜 Registro de Patentes de Pás Aerodinâmicas e Rotores Eólicos (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "🛡️ Isenção Tributária para Componentes de Energia Eólica (Gratuito | +6% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 6); } }
        ]
      };
    }

    if (year === 1988) {
      return {
        title: "1988: CRIAÇÃO DO IPCC & 1ª LEI DA TERMODINÂMICA (ΔU = Q - W)",
        desc: `A ONU cria o Painel Intergovernamental sobre Mudanças Climáticas (IPCC). Pela 1ª Lei da Termodinâmica, a variação da energia interna de um sistema é dada por ΔU = Q - W. O acúmulo de calor retido na atmosfera por gases estufa desequilibra o clima global.`,
        ticker: "1988 • Criação do IPCC: Cientistas unem dados atmosféricos para combater o aquecimento global.",
        concept: "🔬 FÍSICA: 1ª Lei da Termodinâmica (ΔU = Q - W) e Balanço Radiativo Planetário | 🌍 GEOGRAFIA: Criação do IPCC & Vulnerabilidade dos Biomas Terrestres",
        options: [
          { text: "🌱 Substituir Centrais Fósseis por Parques Eólicos e Solares (+35 MW | Custo: $35M)", cost: 35, effect: p => { p.capacity.wind += 35; p.capital -= 35; globalFootprint = Math.max(0, globalFootprint - 15); } },
          { text: "🌿 Reflorestamento e Biocombustíveis com Absorção Fotossintética de CO2 (+30 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.biofuels += 30; p.capital -= 28; } },
          { text: "📜 Sensores Meteorológicos e Patentes de Balanço Térmico (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "🛡️ Declaração Governamental de Metas Ecológicas da ONU (Gratuito | +7% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 7); } }
        ]
      };
    }

    if (year === 1989) {
      return {
        title: "1989: O DESASTRE DO EXXON VALDEZ & REFINO FRACIONADO DO PETRÓLEO",
        desc: `O vazamento de 40 milhões de litros de petróleo cru pelo navio Exxon Valdez devasta o ecossistema marinho do Alasca. O petróleo necessita de refino fracionado nas refinarias para gerar gasolina, diesel, querosene e GLP. Como ${nationName} enfrentará a regulação marítima?`,
        ticker: "1989 • Tragédia do Exxon Valdez: Vazamento de petróleo no Alasca gera revolta e leis marítimas rigorosas.",
        concept: "🔬 FÍSICA/QUÍMICA: Separação Fracionada por Pontos de Ebulição, Densidade de Hidrocarbonetos e Tensão Superficial | 🌍 GEOGRAFIA: Rotas de Petroleiros, Derramamentos Marítimos & Degradação Costeira",
        options: [
          { text: "🌱 Subsidiar Matriz Solar Fotovoltaica e Usinas de Biomassa (+35 MW | Custo: $34M)", cost: 34, effect: p => { p.capacity.biofuels += 35; p.capital -= 34; globalFootprint = Math.max(0, globalFootprint - 15); } },
          { text: "🛢️ Refinarias com Torres Fracionadas Modernas e Casco Duplo (+35 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.thermal += 35; p.capital -= 28; } },
          { text: "📜 Registro de Patentes de Contenção de Vazamentos Marítimos (+2 Patentes | Custo: $22M)", cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
          { text: "🛡️ Fundo Nacional de Emergência para Proteção Costeira (Gratuito | +8% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 8); } }
        ]
      };
    }

    // 3. DÉCADA DE 1990 (1990 – 1999)
    if (year === 1990) {
      return {
        title: "1990: A GUERRA DO GOLFO & COMBUSTÃO INCOMPLETA DE POÇOS",
        desc: `A Guerra do Golfo provoca o incêndio de mais de 600 poços de petróleo no Kuwait. A queima incompleta libera nuvens de fuligem e monóxido de carbono (CO), bloqueando a radiação solar e disparando a cotação mundial dos combustíveis fósseis.`,
        ticker: "1990 • GUERRA DO GOLFO: Incêndio de centenas de poços de petróleo cobre céus de fuligem tóxica e abala o mercado.",
        concept: "🔬 FÍSICA/QUÍMICA: Combustão Incompleta, Formação de Fuligem/Aerossóis e Absorção de Radiação Solar | 🌍 GEOGRAFIA: Geopolítica do Oriente Médio, Bacia do Golfo Pérsico & Vulnerabilidade Petrolífera",
        options: [
          { text: "🌿 Programa Emergencial de Biocombustíveis Nacionais (Etanol e Biodiesel) (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.biofuels += 35; p.capital -= 30; } },
          { text: "⚡ Expansão de Hidrelétricas com Reservatórios de Acumulação (+35 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.hydro += 35; p.capital -= 32; } },
          { text: "⛏️ Manter Termelétricas a Carvão de Estoque Estratégico (+40 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.thermal += 40; p.capital -= 22; globalFootprint += 20; } },
          { text: "🛡️ Racionamento Noturno de Combustíveis e Apoio Social (Gratuito | +8% Estabilidade)", cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 8); } }
        ]
      };
    }

    if (year === 1991) {
      return {
        title: "1991: ENERGIA QUÍMICA DOS ALIMENTOS & HIDRÓLISE DO ATP",
        desc: `Nos seres vivos, a energia química contida em carboidratos, gorduras e proteínas é degradada no catabolismo celular. A principal molécula de transferência é o ATP; sua hidrólise em ADP libera 7,3 kcal/mol, convertida em contração muscular e trabalho mecânico.`,
        ticker: "1991 • Bioquímica Energética: Estudos destacam a eficiência na conversão de ATP em trabalho muscular humano.",
        concept: "🔬 FÍSICA/BIOLOGIA: Catabolismo, Respiração Celular, Síntese e Hidrólise de ATP (7,3 kcal/mol) -> Trabalho Mecânico | 🌍 GEOGRAFIA: Segurança Alimentar & Força de Trabalho Industrial",
        options: [
          { text: "🌾 Agroindústria Sustentável e Cogeração por Resíduos Orgânicos (+32 MW | Custo: $26M)", cost: 26, effect: p => { p.capacity.biofuels += 32; p.capital -= 26; } },
          { text: "⚡ Linhas de Distribuição para Automação de Cidades e Indústrias (+28 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.hydro += 28; p.capital -= 22; } },
          { text: "📜 Patentes de Biotecnologia de Enzimas e Fermentação (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "🛡️ Programa Nacional de Alimentação e Saúde do Trabalhador (Gratuito | +7% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 7); } }
        ]
      };
    }

    if (year === 1992) {
      return {
        title: "1992: CÚPULA DA TERRA (ECO-92 NO RIO) & MATRIZ ELÉTRICA BRASILEIRA",
        desc: `Líderes de 170 países assinam a Agenda 21 no Rio de Janeiro. A matriz elétrica brasileira destaca-se no cenário mundial por ser amplamente renovável (>80% hidrelétrica), em forte contraste com a matriz mundial, onde carvão e petróleo somam mais de 80% das fontes.`,
        ticker: "1992 • Eco-92 no Rio: Líderes globais consagram o conceito de desenvolvimento sustentável e matrizes limpas.",
        concept: "🔬 FÍSICA: Balanço de Emissões de CO2 por MWh Gerado | 🌍 GEOGRAFIA: Conferência Rio-92, Agenda 21 e Comparação das Matrizes Brasileira e Mundial",
        options: [
          { text: "🌱 Programa Nacional de Fontes Renováveis (Eólica, Solar e Biomassa) (+40 MW | Custo: $38M)", cost: 38, effect: p => { p.capacity.wind += 40; p.capital -= 38; globalFootprint = Math.max(0, globalFootprint - 18); } },
          { text: "💧 Repotenciação de Grandes Usinas Hidrelétricas em Rios de Planalto (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.hydro += 35; p.capital -= 30; } },
          { text: "📜 Transferência Tecnológica e Registro de Patentes Verdes (+3 Patentes | Custo: $30M)", cost: 30, effect: p => { p.patents += 3; p.capital -= 30; } },
          { text: "💰 Emissão de Títulos Verdes Governamentais (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 1993) {
      return {
        title: "1993: ENERGIA SONORA & INTENSIDADE ACÚSTICA (I = P/A)",
        desc: `O som é uma onda mecânica longitudinal causada por vibrações em matéria (sólidos, líquidos ou gases) e não se propaga no vácuo. Sua intensidade sonora é a taxa de energia por área (I = P/A = ΔE / (A·Δt) em W/m²). Populações vizinhas a aerogeradores exigem isolamento acústico.`,
        ticker: "1993 • Acústica Aplicada: Engenheiros desenvolvem pás eólicas de baixo ruído para mitigar poluição sonora.",
        concept: "🔬 FÍSICA: Energia Sonora, Ondas Mecânicas, Propagação em Meios Materiais e Intensidade Sonora (I = P/A em W/m²) | 🌍 GEOGRAFIA: Poluição Sonora Urbana e Licenciamento Ambiental de Parques Eólicos",
        options: [
          { text: "🌬️ Aerogeradores com Pás Silenciosas e Barreiras Acústicas (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.wind += 35; p.capital -= 30; } },
          { text: "⛏️ Termelétricas com Enclausuramento Acústico de Turbinas a Vapor (+35 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.thermal += 35; p.capital -= 22; globalFootprint += 15; } },
          { text: "📜 Patentes de Amortecimento de Vibrações e Materiais Fonoabsorventes (+2 Patentes | Custo: $22M)", cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
          { text: "🛡️ Zoneamento Acústico e Consulta Pública Comunitária (Gratuito | +7% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 7); } }
        ]
      };
    }

    if (year === 1994) {
      return {
        title: "1994: ENERGIA LUMINOSA: INCANDESCÊNCIA vs LUMINESCÊNCIA",
        desc: `A energia luminosa compreende ondas eletromagnéticas no espectro visível. Divide-se em Incandescente (emissão por altas temperaturas, como no filamento da lâmpada e no Sol) e Luminescente (a baixas temperaturas: fluorescência instantânea e fosforescência retardada com estados metaestáveis).`,
        ticker: "1994 • Óptica e Iluminação: Lâmpadas fluorescentes de gás ionizado substituem lâmpadas incandescentes ineficientes.",
        concept: "🔬 FÍSICA: Espectro Visível, Incandescência Térmica vs Luminescência (Fluorescência e Fosforescência) | 🌍 GEOGRAFIA: Eficiência Energética na Iluminação Pública e Residencial",
        options: [
          { text: "💡 Substituição Massiva por Lâmpadas Fluorescentes Eficientes (+30 MW | Custo: $24M)", cost: 24, effect: p => { p.capacity.hydro += 30; p.capital -= 24; } },
          { text: "🌞 Pesquisa em Células Solares Fotovoltaicas de Silício (+25 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.wind += 25; p.capital -= 28; } },
          { text: "📜 Registro de Patentes de Materiais Fosforescentes e Luminescentes (+2 Patentes | Custo: $22M)", cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
          { text: "💰 Programa de Eficiência de Iluminação Comercial (Receita: +$30M | +5% Confiança)", cost: 0, effect: p => { p.capital += 30; p.trust = Math.min(100, p.trust + 5); } }
        ]
      };
    }

    if (year === 1995) {
      return {
        title: "1995: PROCESSOS TERMOQUÍMICOS DA BIOMASSA (PIRÓLISE E GASEIFICAÇÃO)",
        desc: `A biomassa pode ser convertida por processos termoquímicos: Pirólise (decomposição térmica em ausência de oxigênio gerando bio-óleo, biochar e gases), Gaseificação (produção de gás de síntese CO + H2) e Co-combustão (queima combinada de biomassa com carvão mineral em usinas).`,
        ticker: "1995 • Termoquímica Verde: Co-combustão de biomassa com carvão reduz emissões em usinas termelétricas.",
        concept: "🔬 FÍSICA/QUÍMICA: Pirólise, Gaseificação (Gás de Síntese CO+H2) e Co-combustão Termelétrica | 🌍 GEOGRAFIA: Aproveitamento de Resíduos Agroflorestais e Indústria Madeireira",
        options: [
          { text: "🌿 Usinas Termelétricas de Pirólise Rápida e Gás de Síntese (+35 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.biofuels += 35; p.capital -= 28; } },
          { text: "⛏️ Co-combustão de Bagaço de Cana e Madeira com Carvão Mineral (+40 MW | Custo: $24M)", cost: 24, effect: p => { p.capacity.thermal += 40; p.capital -= 24; globalFootprint += 8; } },
          { text: "📜 Patentes de Reatores de Pirólise e Bio-óleo Combustível (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "🛡️ Subsídios a Cooperativas Agrícolas de Resíduos Orgânicos (Gratuito | +6% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 6); } }
        ]
      };
    }

    if (year === 1996) {
      return {
        title: "1996: BIODIGESTÃO ANAERÓBICA & PRODUÇÃO DE BIOGÁS (METANO)",
        desc: `A conversão bioquímica por biodigestão anaeróbica decompõe matéria orgânica de dejetos suínos, bovinos e esgoto em ausência de oxigênio. Produz biogás rico em metano (CH4) e dióxido de carbono, gerando eletricidade e biofertilizantes em ${nationName}.`,
        ticker: "1996 • Biogás Rural: Biodigestores anaeróbicos transformam dejetos agropecuários em eletricidade e calor.",
        concept: "🔬 FÍSICA/BIOLOGIA: Digestão Anaeróbica por Microrganismos, Síntese de Metano (CH4) e Energia Bioquímica | 🌍 GEOGRAFIA: Saneamento Rural, Suinocultura e Avicultura Sustentável",
        options: [
          { text: "🌿 Centrais de Biogás e Biometano em Distritos Agropecuários (+35 MW | Custo: $26M)", cost: 26, effect: p => { p.capacity.biofuels += 35; p.capital -= 26; } },
          { text: "💧 Pequenas Centrais Hidrelétricas (PCHs) de Baixo Impacto Hídrico (+30 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.hydro += 30; p.capital -= 25; } },
          { text: "📜 Patentes de Biodigestores Herméticos e Purificação de Biometano (+2 Patentes | Custo: $22M)", cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
          { text: "🛡️ Programa de Crédito Rural para Saneamento e Bioenergia (Gratuito | +7% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 7); } }
        ]
      };
    }

    if (year === 1997) {
      return {
        title: "1997: PROTOCOLO DE QUIOTO & MECANISMO DE DESENVOLVIMENTO LIMPO (MDL)",
        desc: `O Protocolo de Quioto é assinado no Japão com metas vinculantes de redução de gases estufa. A ONU classifica a energia eólica e a biomassa como Mecanismo de Desenvolvimento Limpo (MDL), incentivando créditos de carbono para nações que descarbonizam suas matrizes.`,
        ticker: "1997 • PROTOCOLO DE QUIOTO: Nações industrializadas assumem compromisso legal de corte de emissões de CO2.",
        concept: "🔬 FÍSICA: Balanço Global de Carbono e Mitigação de Forçante Radiativa | 🌍 GEOGRAFIA: Protocolo de Quioto, Mecanismo de Desenvolvimento Limpo (MDL) e Créditos de Carbono",
        options: [
          { text: "🌱 Substituição Massiva de Térmicas a Carvão por Parques Eólicos (+40 MW | Custo: $38M)", cost: 38, effect: p => { p.capacity.wind += 40; p.capital -= 38; globalFootprint = Math.max(0, globalFootprint - 20); } },
          { text: "📜 Compra e Registro de Patentes de Créditos de Carbono Globais (+3 Patentes | Custo: $32M)", cost: 32, effect: p => { p.patents += 3; p.capital -= 32; } },
          { text: "🏭 Manter Produção Térmica Fóssil Existente (+45 MW | Custo: $18M)", cost: 18, effect: p => { p.capacity.thermal += 45; p.capital -= 18; globalFootprint += 25; } },
          { text: "🛡️ Acordo de Eficiência Energética com o Setor Industrial (Gratuito | +6% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 6); } }
        ]
      };
    }

    if (year === 1998) {
      return {
        title: "1998: ENERGIA SOLAR HELIOTÉRMICA & CONCENTRAÇÃO POR ESPELHOS",
        desc: `O sistema solar heliotérmico utiliza espelhos refletores (helióstatos) para concentrar a radiação solar em um ponto receptor com fluido térmico, aquecendo a água até a ebulição para que o vapor acione turbinas e geradores elétricos em regiões de alta insolação.`,
        ticker: "1998 • Solar Concentrada: Usinas heliotérmicas utilizam espelhos parabólicos para gerar vapor em áreas ensolaradas.",
        concept: "🔬 FÍSICA: Reflexão Óptica da Radiação Solar, Aquecimento Térmico e Ciclos de Vapor | 🌍 GEOGRAFIA: Áreas Semiáridas, Insolação Direta e Potencial do Nordeste Brasileiro",
        options: [
          { text: "🌞 Usina Solar Heliotérmica com Torre de Concentração e Turbina a Vapor (+35 MW | Custo: $34M)", cost: 34, effect: p => { p.capacity.wind += 35; p.capital -= 34; } },
          { text: "🛢️ Expansão de Térmicas a Gás Natural de Ciclo Simples (+35 MW | Custo: $24M)", cost: 24, effect: p => { p.capacity.thermal += 35; p.capital -= 24; globalFootprint += 12; } },
          { text: "📜 Registro de Patentes de Espelhos Helióstatos e Fluidos Térmicos (+2 Patentes | Custo: $25M)", cost: 25, effect: p => { p.patents += 2; p.capital -= 25; } },
          { text: "💰 Financiamento de Pesquisa em Regiões Semiáridas (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 1999) {
      return {
        title: "1999: ENERGIA DAS MARÉS E OCEANOS (MAREMOTRIZ)",
        desc: `A energia maremotriz aproveita o movimento de subida e descida das marés e das correntes oceânicas. Diques costeiros com comportas e turbinas submersas bidirecionais convertem a energia cinética e potencial das massas de água do mar em eletricidade limpa.`,
        ticker: "1999 • Energias Oceânicas: Centrais maremotrizes em estuários e baías aproveitam o ciclo lunar das marés.",
        concept: "🔬 FÍSICA: Energia Cinética e Potencial Gravitacional das Marés Oceânicas | 🌍 GEOGRAFIA: Zonas Costeiras de Alta Amplitude de Maré (Reino Unido, França, Brasil)",
        options: [
          { text: "🌊 Usina Maremotriz Costeira com Turbinas Submersas Bidirecionais (+30 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.wind += 30; p.capital -= 32; } },
          { text: "💧 Repotenciação de Usinas Hidroelétricas de Médio Porte (+30 MW | Custo: $24M)", cost: 24, effect: p => { p.capacity.hydro += 30; p.capital -= 24; } },
          { text: "📜 Patentes de Turbinas Hidráulicas Resistentes à Corrosão Marinha (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "🛡️ Acordo de Cooperação em Tecnologias Marinhas (Gratuito | +7% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 7); } }
        ]
      };
    }

    // 4. DÉCADA DE 2000 (2000 – 2009)
    if (year === 2000) {
      return {
        title: "2000: ENTRADA EM OPERAÇÃO DE ANGRA 2 NO RIO DE JANEIRO",
        desc: `A Usina Nuclear de Angra 2 (1.350 MW) inicia suas operações no litoral de Angra dos Reis (RJ). Atendendo a demanda de base da Região Sudeste com estabilidade contínua, complementa o sistema hidrelétrico sem oscilar com secas ou variações meteorológicas.`,
        ticker: "2000 • Angra 2: Nova unidade termonuclear entra no Sistema Interligado Nacional fortalecendo o Sudeste.",
        concept: "🔬 FÍSICA: Fissão Termonuclear de Alta Potência, Estabilidade de Frequência e 3 Circuitos Independentes | 🌍 GEOGRAFIA: Matriz Energética do Rio de Janeiro e Centralização no Sudeste",
        options: [
          { text: "⚛️ Conexão de Grande Reator Nuclear de Base à Malha Nacional (+45 MW | Custo: $42M)", cost: 42, effect: p => { p.capacity.nuclear += 45; p.capital -= 42; } },
          { text: "🌿 Co-geração a partir do Bagaço de Cana no Setor Sucroalcooleiro (+35 MW | Custo: $26M)", cost: 26, effect: p => { p.capacity.biofuels += 35; p.capital -= 26; } },
          { text: "📜 Patentes de Sistemas Digitais de Controle e Proteção Nuclear (+2 Patentes | Custo: $26M)", cost: 26, effect: p => { p.patents += 2; p.capital -= 26; } },
          { text: "💰 Emissão de Debêntures para Expansão Elétrica (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 2001) {
      return {
        title: "2001: A CRISE DO APAGÃO NO BRASIL & ENERGIA POTENCIAL GRAVITACIONAL",
        desc: `Secas severas esvaziam os reservatórios hidrelétricos, reduzindo drasticamente a energia potencial gravitacional (Epg = m·g·h) e forçando um racionamento elétrico nacional. O governo de ${nationName} precisa diversificar as fontes para não paralisar o PIB.`,
        ticker: "2001 • CRISE DO APAGÃO: Estiagem nas bacias hidrográficas impõe racionamento de 20% no consumo nacional.",
        concept: "🔬 FÍSICA: Energia Potencial Gravitacional (Epg = m·g·h) e Risco Hidrológico em Reservatórios | 🌍 GEOGRAFIA: Regimes Pluviométricos, Bacias do Sudeste/Centro-Oeste & Racionamento Elétrico",
        options: [
          { text: "🛢️ Contratação Emergencial de Usinas Termelétricas a Gás Natural (+40 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.thermal += 40; p.capital -= 28; globalFootprint += 16; } },
          { text: "🌿 Expansão Acelerada de Biomassa de Cana e Eucalipto (+35 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.biofuels += 35; p.capital -= 28; } },
          { text: "📜 Patentes de Gestão de Carga e Software de Despacho Hidrotérmico (+2 Patentes | Custo: $22M)", cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
          { text: "🛡️ Campanha de Redução de Consumo e Metas Residencias (Gratuito | +8% Estabilidade)", cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 8); } }
        ]
      };
    }

    if (year === 2002) {
      return {
        title: "2002: CÁLCULO DO CONSUMO ELÉTRICO RESIDENCIAL (E = P·Δt)",
        desc: `O consumo de eletricidade é calculado pelo produto da potência pelo tempo de uso (E = P·Δt, com medição em kWh: K = P·T/1000). Chuveiros elétricos de 5.000 W e condicionadores de ar respondem pelos picos de demanda nas residências de ${nationName}.`,
        ticker: "2002 • Eficiência Energética: Selos de conservação e medidores digitais reduzem o consumo em kWh nos lares.",
        concept: "🔬 FÍSICA: Consumo de Energia Elétrica (E = P·Δt), Potência em Watts e Medição em Quilowatts-hora (kWh) | 🌍 GEOGRAFIA: Demanda Residencial, Comercial e Industrial de Eletricidade",
        options: [
          { text: "💡 Programa de Eficiência de Chuveiros, Motores e Eletrodomésticos (+30 MW | Custo: $22M)", cost: 22, effect: p => { p.capacity.hydro += 30; p.capital -= 22; } },
          { text: "🌬️ Instalação de Turbinas Eólicas no Litoral Nordestino (+30 MW | Custo: $26M)", cost: 26, effect: p => { p.capacity.wind += 30; p.capital -= 26; } },
          { text: "📜 Patentes de Medidores Inteligentes e Inversores de Frequência (+2 Patentes | Custo: $22M)", cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
          { text: "💰 Programa de Tarifação por Faixa de Consumo Horário (Receita: +$35M | +5% Confiança)", cost: 0, effect: p => { p.capital += 35; p.trust = Math.min(100, p.trust + 5); } }
        ]
      };
    }

    if (year === 2003) {
      return {
        title: "2003: O GRANDE APAGÃO CONTINENTAL & TRANSFORMADORES DE DISTRIBUIÇÃO",
        desc: `Uma falha de chaveamento em subestações provoca um apagão em cascata que deixa 50 milhões de pessoas sem luz na América do Norte e Europa. A 4ª etapa do transporte elétrico depende de transformadores de distribuição em postes para entregar 127V/220V com segurança.`,
        ticker: "2003 • GRANDE APAGÃO: Efeito dominó desliga redes interconectadas e paralisa megalópoles mundiais.",
        concept: "🔬 FÍSICA: Transformadores (Vp/Vs = Np/Ns), Linhas de Alta Tensão e Estabilidade de Frequência | 🌍 GEOGRAFIA: Redes Elétricas Interconectadas, Vulnerabilidade das Megalópoles & Automação",
        options: [
          { text: "⚡ Modernização Digital de Subestações e Transformadores de Distribuição (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.hydro += 35; p.capital -= 30; } },
          { text: "⚛️ Reator Nuclear Modular Adicional para Segurança de Base (+35 MW | Custo: $38M)", cost: 38, effect: p => { p.capacity.nuclear += 35; p.capital -= 38; } },
          { text: "📜 Patentes de Relés Digitais e Chaveamento Automático de Carga (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "🛡️ Plano de Manutenção Preventiva e Inspeção da Malha (Custo: $12M | +10% Estabilidade)", cost: 12, effect: p => { p.capital -= 12; p.stability = Math.min(100, p.stability + 10); } }
        ]
      };
    }

    if (year === 2004) {
      return {
        title: "2004: ARMAZENAMENTO ELETROQUÍMICO: BATERIAS DE ÍONS DE LÍTIO",
        desc: `Baterias eletroquímicas (como de íons de lítio e ácido-chumbo) utilizam reações reversíveis de oxirredução para armazenar energia química e liberá-la como corrente elétrica contínua. Elas viabilizam a autonomia de eletrônicos e a integração de fontes renováveis intermitentes.`,
        ticker: "2004 • Eletroquímica: Baterias de íons de lítio avançam na indústria automobilística e em sistemas de backup.",
        concept: "🔬 FÍSICA/QUÍMICA: Eletroquímica, Reações de Oxirredução Reversíveis e Armazenamento Químico | 🌍 GEOGRAFIA: Mineração de Lítio, Eletrificação Veicular & Transição Energética",
        options: [
          { text: "🔋 Instalação de Bancos de Baterias de Lítio para Backup da Rede (+35 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.wind += 35; p.capital -= 32; } },
          { text: "🌿 Expansão de Usinas de Biodiesel a partir de Óleos Vegetais (+30 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.biofuels += 30; p.capital -= 25; } },
          { text: "📜 Patentes de Células de Lítio-Polímero e Eletrólitos Sólidos (+2 Patentes | Custo: $25M)", cost: 25, effect: p => { p.patents += 2; p.capital -= 25; } },
          { text: "💰 Incentivos Fiscais para Eletrificação e Armazenamento Local (Receita: +$30M | +5% Confiança)", cost: 0, effect: p => { p.capital += 30; p.trust = Math.min(100, p.trust + 5); } }
        ]
      };
    }

    if (year === 2005) {
      return {
        title: "2005: MERCADO DE CARBONO (EU ETS) & EQUIPARTIÇÃO DE ENERGIA EM GASES",
        desc: `A União Europeia inaugura o mercado de emissões (EU ETS), precificando a tonelada de CO2e. O teorema da equipartição e a equação de Clapeyron (PV = nRT) modelam a energia interna de gases ideais (U = 3/2·nRT = 3/2·PV) nas turbinas térmicas de ciclo combinado de ${nationName}.`,
        ticker: "2005 • Mercado de Carbono: Lançado o EU ETS, precificando emissões industriais na bolsa de valores.",
        concept: "🔬 FÍSICA: Energia Interna de Gases Ideais (U = 3/2·nRT = 3/2·PV) e Ciclos Térmicos Brayton-Rankine | 🌍 GEOGRAFIA: Mercado Europeu de Emissões (EU ETS) & Comércio de Licenças de CO2",
        options: [
          { text: "🌱 Migração Total de Térmicas Poluentes para Parques Eólicos e Solares (+45 MW | Custo: $40M)", cost: 40, effect: p => { p.capacity.wind += 45; p.capital -= 40; globalFootprint = Math.max(0, globalFootprint - 20); } },
          { text: "📜 Comercialização de Licenças de Carbono e Patentes de Alta Eficiência (+3 Patentes | Custo: $30M)", cost: 30, effect: p => { p.patents += 3; p.capital -= 30; } },
          { text: "🏭 Pagar Taxa de Poluição e Manter Centrais Térmicas a Carvão (+40 MW | Custo: $20M)", cost: 20, effect: p => { p.capacity.thermal += 40; p.capital -= 20; globalFootprint += 22; } },
          { text: "💰 Subvenções Fiscais a Indústrias Descarbonizadas (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 2006) {
      return {
        title: "2006: DESCOBERTA DO PRÉ-SAL & CAMPO DE TUPI NA BACIA DE SANTOS",
        desc: `A Petrobras descobre jazidas gigantes de petróleo e gás natural sob espessa camada de sal no Campo de Tupi (Bacia de Santos, RJ). A extração a mais de 5.000 metros de profundidade enfrenta altíssima pressão hidrostática (P = ρ·g·h) e gera mais de 85% do gás nacional em plataformas offshore.`,
        ticker: "2006 • Descoberta do Pré-Sal: Brasil descobre megacampos de petróleo e gás natural associado na Bacia de Santos.",
        concept: "🔬 FÍSICA: Pressão Hidrostática em Águas Profundas (P = ρ·g·h) e Gás Natural Associado | 🌍 GEOGRAFIA: Bacia de Santos (Campo de Tupi, RJ), Plataformas Continentais Offshore & Soberania",
        options: [
          { text: "🛢️ Plataformas Flutuantes Offshore de Petróleo e Gás Natural (+50 MW | Custo: $38M)", cost: 38, effect: p => { p.capacity.thermal += 50; p.capital -= 38; globalFootprint += 16; } },
          { text: "🌿 Cogeração a Partir da Cana e Biocombustíveis de Alta Escala (+35 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.biofuels += 35; p.capital -= 28; } },
          { text: "📜 Patentes de Perfuração Submarina em Águas Ultraprofundas (+3 Patentes | Custo: $30M)", cost: 30, effect: p => { p.patents += 3; p.capital -= 30; } },
          { text: "💰 Royalties do Petróleo e Gás Destinados ao Fundo Soberano (Receita: +$40M Capital)", cost: 0, effect: p => { p.capital += 40; } }
        ]
      };
    }

    if (year === 2007) {
      return {
        title: "2007: ENERGIA SOLAR FOTOVOLTAICA: SILÍCIO & EFEITO FOTOVOLTAICO",
        desc: `As células solares fotovoltaicas utilizam semicondutores de silício abundante para converter diretamente a radiação eletromagnética do Sol em eletricidade por meio do efeito fotovoltaico. O sistema gera corrente contínua (CC), que é convertida por um inversor solar em corrente alternada (CA).`,
        ticker: "2007 • Fotovoltaica: Inversores solares e células de silício tornam a microgeração residencial uma realidade viável.",
        concept: "🔬 FÍSICA: Efeito Fotovoltaico em Semicondutores de Silício, Corrente Contínua (CC) e Inversor Solar (CC -> CA) | 🌍 GEOGRAFIA: Radiação Solar no Cinturão Tropical Brasileiro e Geração Distribuída",
        options: [
          { text: "🌞 Instalação de Parques Solares Fotovoltaicos e Inversores de Rede (+40 MW | Custo: $34M)", cost: 34, effect: p => { p.capacity.wind += 40; p.capital -= 34; globalFootprint = Math.max(0, globalFootprint - 14); } },
          { text: "💧 Usinas Hidroelétricas a Fio d'Água com Menor Superfície Inundada (+35 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.hydro += 35; p.capital -= 28; } },
          { text: "📜 Registro de Patentes de Células de Silício Monocristalino (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "🛡️ Linha de Crédito para Instalação de Painéis Solares em Telhados (Gratuito | +7% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 7); } }
        ]
      };
    }

    if (year === 2008) {
      return {
        title: "2008: CRISE FINANCEIRA GLOBAL & MODULARIDADE ENERGÉTICA",
        desc: `A quebra de grandes bancos nos EUA desencadeia recessão mundial e paralisa linhas de crédito para megaprojetos de infraestrutura. Projetos de energia eólica e biomassa destacam-se por sua instalação rápida (menos de 6 meses) e rápida recuperação do capital investido.`,
        ticker: "2008 • CRISE FINANCEIRA GLOBAL: Escassez de crédito internacional favorece obras energéticas modulares e de rápido retorno.",
        concept: "🔬 FÍSICA: Escala de Eficiência e Tempo de Instalação de Turbinas Geradoras | 🌍 GEOGRAFIA: Globalização Financeira, Restrição de Crédito e Investimentos em Infraestrutura",
        options: [
          { text: "🌬️ Parques Eólicos Modulares de Rápida Montagem e Baixo Custo Operacional (+35 MW | Custo: $26M)", cost: 26, effect: p => { p.capacity.wind += 35; p.capital -= 26; } },
          { text: "⚡ Otimizar Eficiência de Linhas e Transformadores Existentes (+20 MW | Custo: $16M)", cost: 16, effect: p => { p.capacity.hydro += 20; p.capital -= 16; } },
          { text: "🏛️ Injeção de Liquidez Estatal na Economia Nacional (Receita: +$45M | -4% PIB)", cost: 0, effect: p => { p.capital += 45; p.gdp *= 0.96; } },
          { text: "🛡️ Pacote de Socorro e Garantias Financeiras às Concessionárias (Gratuito | +8% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 8); } }
        ]
      };
    }

    if (year === 2009) {
      return {
        title: "2009: OS VENTOS ALÍSIOS DO NORDESTE BRASILEIRO & RECORDE EÓLICO",
        desc: `O Nordeste brasileiro destaca-se mundialmente pela força e constância dos Ventos Alísios (que sopram de leste para oeste em direção ao Equador). No segundo semestre, quando os reservatórios hidrelétricos sofrem com estiagem, os ventos tornam-se mais intensos, compensando o desequilíbrio na geração.`,
        ticker: "2009 • Ventos do Nordeste: Parques eólicos na Bahia, RN e Ceará compensam a redução das chuvas nas hidrelétricas.",
        concept: "🔬 FÍSICA: Convecção Térmica Atmosférica, Força de Coriolis e Energia Cinética dos Ventos Alísios | 🌍 GEOGRAFIA: Sub-regiões do Nordeste (Litoral, Sertão, Agreste) & Complementaridade Hidro-Eólica",
        options: [
          { text: "🌬️ Megaparques Eólicos no Rio Grande do Norte, Bahia e Ceará (+45 MW | Custo: $36M)", cost: 36, effect: p => { p.capacity.wind += 45; p.capital -= 36; globalFootprint = Math.max(0, globalFootprint - 12); } },
          { text: "🌿 Expansão de Usinas a Bagaço de Cana e Casca de Coco Verde (+30 MW | Custo: $24M)", cost: 24, effect: p => { p.capacity.biofuels += 30; p.capital -= 24; } },
          { text: "📜 Patentes de Mapeamento Anemométrico e Controle de Rotação (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "💰 Leilão de Energia de Reserva para o Sistema Interligado (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    // 5. DÉCADA DE 2010 A 2020 (2010 – 2020)
    if (year === 2010) {
      return {
        title: "2010: PARQUES EÓLICOS ONSHORE vs OFFSHORE NO BRASIL E NO MUNDO",
        desc: `A capacidade eólica mundial atinge marcos históricos com liderança da China, EUA e Alemanha. A tecnologia divide-se em Onshore (em terra, com pás menores) e Offshore (no mar, com ventos constantes e sem barreiras físicas, porém exigindo materiais resistentes à corrosão salina).`,
        ticker: "2010 • Eólica Global: China lidera a produção mundial enquanto o Brasil atinge a 7ª posição em capacidade instalada.",
        concept: "🔬 FÍSICA: Rugosidade Superficial, Velocidade do Vento Marinho e Resistência dos Materiais à Corrosão | 🌍 GEOGRAFIA: Instalações Onshore no Litoral vs Parques Eólicos Offshore no Mar",
        options: [
          { text: "🌬️ Complexo Eólico Offshore com Turbinas de Grande Porte (+50 MW | Custo: $42M)", cost: 42, effect: p => { p.capacity.wind += 50; p.capital -= 42; } },
          { text: "💧 Repotenciação de Usinas no Complexo de Paulo Afonso (Rio São Francisco) (+35 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.hydro += 35; p.capital -= 28; } },
          { text: "📜 Patentes de Ligas Metálicas Anticorrosivas para Meio Marinho (+2 Patentes | Custo: $25M)", cost: 25, effect: p => { p.patents += 2; p.capital -= 25; } },
          { text: "🛡️ Medidas de Proteção para Evitar Colisão de Aves e Morcegos Migratórios (Gratuito | +7% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 7); } }
        ]
      };
    }

    if (year === 2011) {
      return {
        title: "2011: O ACIDENTE DE FUKUSHIMA DAIICHI & RESFRIAMENTO CONVECTIVO",
        desc: `Um terremoto seguido de tsunami no Japão inunda os geradores a diesel da Usina de Fukushima Daiichi, paralisando as bombas de resfriamento. Sem água para retirar o calor do núcleo do reator, o superaquecimento gera vapor e fusão parcial, forçando a evacuação de milhares de pessoas.`,
        ticker: "2011 • TRAGÉDIA EM FUKUSHIMA: Tsunami provoca colapso de reatores no Japão e revisão mundial da matriz nuclear.",
        concept: "🔬 FÍSICA: Transferência de Calor por Convecção Forçada, Vaporização sob Pressão e Reações Nucleares Residual | 🌍 GEOGRAFIA: Tectônica de Placas no Círculo de Fogo do Pacífico, Tsunamis & Gestão de Riscos",
        options: [
          { text: "🌞 Substituição Massiva de Nuclear por Parques Solares Fotovoltaicos (+45 MW | Custo: $40M)", cost: 40, effect: p => { p.capacity.wind += 45; p.capital -= 40; globalFootprint = Math.max(0, globalFootprint - 15); } },
          { text: "🛢️ Termelétricas a Gás Natural para Garantir a Segurança de Base (+40 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.thermal += 40; p.capital -= 28; globalFootprint += 14; } },
          { text: "⚛️ Reestruturação Extrema com Geradores Subterrâneos à Prova de Inundação (+30 MW | Custo: $35M)", cost: 35, effect: p => { p.capacity.nuclear += 30; p.capital -= 35; } },
          { text: "🛡️ Descomissionamento Gradual de Centrais Antigas e Auditoria Externa (Gratuito | +7% Estabilidade)", cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 7); } }
        ]
      };
    }

    if (year === 2012) {
      return {
        title: "2012: FRATURAMENTO HIDRÁULICO & GÁS DE XISTO (SHALE GAS)",
        desc: `A técnica de fraturamento hidráulico (fracking) em rochas sedimentares porosas de folhelho (shale) revoluciona a produção de gás natural e petróleo nos EUA. O aumento da oferta de metano barateia a energia, mas gera preocupações sobre contaminação de aquíferos subterrâneos.`,
        ticker: "2012 • Revolução do Gás de Xisto: O fracking barateia combustíveis fósseis nos EUA e altera a geopolítica mundial.",
        concept: "🔬 FÍSICA: Porosidade, Permeabilidade e Mecânica de Fraturamento em Rochas Folhelho | 🌍 GEOGRAFIA: Geologia Sedimentar, Aquíferos Subterrâneos & Recursos Não-Renováveis",
        options: [
          { text: "🛢️ Usinas Termelétricas a Gás de Xisto de Baixo Custo (+50 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.thermal += 50; p.capital -= 32; globalFootprint += 14; } },
          { text: "🌞 Expansão de Parques Solares Fotovoltaicos de Silício (+40 MW | Custo: $36M)", cost: 36, effect: p => { p.capacity.wind += 40; p.capital -= 36; globalFootprint = Math.max(0, globalFootprint - 10); } },
          { text: "📜 Patentes de Fluidos de Fraturamento com Menor Impacto Ambiental (+2 Patentes | Custo: $25M)", cost: 25, effect: p => { p.patents += 2; p.capital -= 25; } },
          { text: "🛡️ Isenção Fiscal para Indústrias Eletrointensivas Nacionais (Gratuito | +6% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 6); } }
        ]
      };
    }

    if (year === 2013) {
      return {
        title: "2013: BIOMASSA DE EUCALIPTO & COGERAÇÃO NO SETOR SUCROALCOOLEIRO",
        desc: `No Brasil, o cultivo planejado de eucalipto produz cerca de 25 toneladas de biomassa por hectare ao ano com ciclo de 15 anos. Junto ao bagaço e palha de cana-de-açúcar, alimenta caldeiras de cogeração que geram calor e eletricidade para o Sistema Interligado Nacional (SIN).`,
        ticker: "2013 • Bioenergia: A queima de bagaço e madeira de reflorestamento consolida a biomassa como a 3ª maior fonte elétrica do Brasil.",
        concept: "🔬 FÍSICA/QUÍMICA: Poder Calorífico da Biomassa Sólida, Torrefação e Cogeração Termoelétrica | 🌍 GEOGRAFIA: Silvicultura de Eucalipto, Agronegócio Canavieiro & Economia Circular",
        options: [
          { text: "🌿 Complexos de Cogeração Bioelétrica a Bagaço e Eucalipto (+40 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.biofuels += 40; p.capital -= 30; } },
          { text: "⚡ Linhas de Transmissão Integrando Usinas de Biomassa ao SIN (+30 MW | Custo: $24M)", cost: 24, effect: p => { p.capacity.hydro += 30; p.capital -= 24; } },
          { text: "📜 Patentes de Briquetagem, Pallets de Alta Densidade e Torrefação (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "💰 Incentivo Fiscal para Aproveitamento de Resíduos Florestais (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 2014) {
      return {
        title: "2014: PROJETO SMILE & ENERGIA SOLAR HELIOTÉRMICA NO SEMIÁRIDO",
        desc: `O Ministério de Minas e Energia desenvolve o projeto SMILE e pesquisas em Petrolina (PE) para implantar usinas solares híbridas com microturbinas no semiárido brasileiro. A tecnologia usa espelhos helióstatos para gerar vapor e calor industrial com alta eficiência.`,
        ticker: "2014 • Projeto SMILE: Plataformas de pesquisa testam cogeração heliotérmica na agroindústria do Nordeste.",
        concept: "🔬 FÍSICA: Foco Óptico, Termodinâmica de Fluidos Caloportadores e Microturbinas a Vapor | 🌍 GEOGRAFIA: Semiárido Nordestino, Bacia do São Francisco (Petrolina) & Agroindústria Irrigada",
        options: [
          { text: "🌞 Usinas Solares Híbridas com Cogeração Térmica Agroindustrial (+35 MW | Custo: $32M)", cost: 32, effect: p => { p.capacity.wind += 35; p.capital -= 32; } },
          { text: "💧 Otimização de Vazão nas Usinas de Xingó e Paulo Afonso (+30 MW | Custo: $24M)", cost: 24, effect: p => { p.capacity.hydro += 30; p.capital -= 24; } },
          { text: "📜 Patentes de Microturbinas Solares e Coletores Espelhados (+2 Patentes | Custo: $25M)", cost: 25, effect: p => { p.patents += 2; p.capital -= 25; } },
          { text: "🛡️ Acordo de Integração Energética para o Vale do São Francisco (Gratuito | +7% Confiança)", cost: 0, effect: p => { p.trust = Math.min(100, p.trust + 7); } }
        ]
      };
    }

    if (year === 2015) {
      return {
        title: "2015: HISTÓRICO ACORDO DE PARIS (COP 21) & DESCARBONIZAÇÃO",
        desc: `195 nações assinam o Acordo de Paris para limitar o aquecimento global a 1,5°C. O setor elétrico brasileiro destaca-se com baixas emissões (cerca de 59,9 kg de CO2/MWh, representando 23% da média europeia e 9% da chinesa), acelerando a transição global.`,
        ticker: "2015 • ACORDO DE PARIS: Tratado mundial histórico estabelece metas obrigatórias para conter a temperatura global em 1.5°C.",
        concept: "🔬 FÍSICA: Intensidade de Carbono por MWh Gerado (kg CO2/MWh) e Efeito Estufa | 🌍 GEOGRAFIA: Acordo de Paris (COP 21), Metas Nacionais (NDCs) & Matriz Elétrica Brasileira Limpa",
        options: [
          { text: "🌞 Megaprojeto Solar Fotovoltaico e Parques Eólicos Offshore (+55 MW | Custo: $45M)", cost: 45, effect: p => { p.capacity.wind += 55; p.capital -= 45; globalFootprint = Math.max(0, globalFootprint - 25); } },
          { text: "🌿 Expansão de Biocombustíveis Avançados e Política RenovaBio (+40 MW | Custo: $35M)", cost: 35, effect: p => { p.capacity.biofuels += 40; p.capital -= 35; } },
          { text: "⚛️ Reatores Nucleares Modulares de Pequena Escala (SMR) (+45 MW | Custo: $40M)", cost: 40, effect: p => { p.capacity.nuclear += 45; p.capital -= 40; } },
          { text: "📜 Fundo Multilateral de Inovação e Licenciamento Limpo (+3 Patentes | Custo: $30M)", cost: 30, effect: p => { p.patents += 3; p.capital -= 30; } }
        ]
      };
    }

    if (year === 2016) {
      return {
        title: "2016: PARIDADE DE REDE FOTOVOLTAICA & GERAÇÃO DISTRIBUÍDA",
        desc: `O preço do watt solar fotovoltaico despenca de US$ 76 (na década de 1970) para cerca de US$ 0,30. Gerar eletricidade a partir da luz solar em telhados de residências e comércios (geração distribuída) torna-se mais barato do que comprar da rede concessionária.`,
        ticker: "2016 • Paridade de Rede Solar: Custo da energia fotovoltaica cai 99% em quatro décadas e democratiza a microgeração.",
        concept: "🔬 FÍSICA: Rendimento Quântico de Semicondutores de Silício e Eficiência Energética de Inversores | 🌍 GEOGRAFIA: Geração Distribuída em Telhados (MG, RS, SP) e Compensação de Créditos pela ANEEL",
        options: [
          { text: "🌞 Megafazendas Solares e Financiamento Popular de Telhados Fotovoltaicos (+55 MW | Custo: $38M)", cost: 38, effect: p => { p.capacity.wind += 55; p.capital -= 38; globalFootprint = Math.max(0, globalFootprint - 22); } },
          { text: "🌿 Usina Bioelétrica de Cogeração com Bagaço e Resíduos Agrícolas (+40 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.biofuels += 40; p.capital -= 30; } },
          { text: "📜 Registrar Patentes de Células Fotovoltaicas de Alta Eficiência (+3 Patentes | Custo: $28M)", cost: 28, effect: p => { p.patents += 3; p.capital -= 28; } },
          { text: "💰 Linha de Crédito Verde para Consumidores Residenciais (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 2017) {
      return {
        title: "2017: HIDROGÊNIO VERDE POR ELETRÓLISE DA ÁGUA (2 H2O -> 2 H2 + O2)",
        desc: `O Hidrogênio Verde é produzido por meio da separação das moléculas de água em hidrogênio e oxigênio (2 H2O -> 2 H2 + O2) em eletrolisadores alimentados por fontes 100% renováveis (solar e eólica). É a solução promissora para descarbonizar indústrias de aço e transportes pesados.`,
        ticker: "2017 • Hidrogênio Verde: Estudos apontam o litoral brasileiro e potências solares como futuros exportadores de H2 verde.",
        concept: "🔬 FÍSICA/QUÍMICA: Eletrólise da Água (2 H2O -> 2 H2 + O2), Densidade de Energia do H2 e Vetor Energético Limpo | 🌍 GEOGRAFIA: Hubs Portuários de Hidrogênio Verde (Pecém/Ceará, Suape) e Descarbonização Industrial",
        options: [
          { text: "💧 Central de Eletrólise de Hidrogênio Verde Conectada a Parques Eólicos (+40 MW | Custo: $36M)", cost: 36, effect: p => { p.capacity.wind += 40; p.capital -= 36; globalFootprint = Math.max(0, globalFootprint - 18); } },
          { text: "🌿 Biocombustíveis de 2ª Geração e BTL (Biomass-to-liquids) (+35 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.biofuels += 35; p.capital -= 28; } },
          { text: "📜 Patentes de Membranas Eletrolíticas e Armazenamento Criogênico de H2 (+3 Patentes | Custo: $30M)", cost: 30, effect: p => { p.patents += 3; p.capital -= 30; } },
          { text: "💰 Acordo Comercial Internacional para Exportação de Vetores Limpos (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 2018) {
      return {
        title: "2018: REDES ELÉTRICAS INTELIGENTES (SMART GRIDS) & FLUXO ÓTIMO",
        desc: `Algoritmos de inteligência artificial e sensores inteligentes monitoram o Sistema Interligado Nacional em tempo real. A automação reduz perdas de transmissão, prevê a intermitência dos ventos e da radiação solar e equilibra o despacho de água nos reservatórios hidrelétricos.`,
        ticker: "2018 • Smart Grids: Redes inteligentes com automação digital otimizam o fluxo de eletricidade urbana.",
        concept: "🔬 FÍSICA: Teoria de Redes Elétricas, Fluxo de Potência Ótimo e Redução de Perdas Joule | 🌍 GEOGRAFIA: Cidades Inteligentes, TIC no Setor Elétrico & Automação de Malhas",
        options: [
          { text: "🤖 Implementação de Smart Grids e IA em Toda a Malha de Transmissão (+35 MW | Custo: $30M)", cost: 30, effect: p => { p.capacity.hydro += 35; p.capital -= 30; } },
          { text: "🔋 Bancos de Megabaterias para Armazenar Excedente Solar e Eólico (+35 MW | Custo: $35M)", cost: 35, effect: p => { p.capacity.wind += 35; p.capital -= 35; } },
          { text: "📜 Patentes Nacionais de Algoritmos de Despacho Hidrotérmico (+3 Patentes | Custo: $28M)", cost: 28, effect: p => { p.patents += 3; p.capital -= 28; } },
          { text: "💰 Incentivos Fiscais para Eficiência em Redes Urbanas e Prédios Inteligentes (Receita: +$35M Capital)", cost: 0, effect: p => { p.capital += 35; } }
        ]
      };
    }

    if (year === 2019) {
      return {
        title: "2019: MEGABATERIAS DE ARMAZENAMENTO & VOLANTES DE INÉRCIA ROTACIONAIS",
        desc: `Grandes sistemas de armazenamento combinam baterias de íons de lítio e volantes de inércia em alta rotação (Ec = 1/2·I·ω²). Eles absorvem picos de produção solar diurna e eólica noturna, injetando energia nos horários de ponta e substituindo geradores a diesel caros e poluentes.`,
        ticker: "2019 • Armazenamento em Escala: Megabaterias e volantes de inércia estabilizam a rede nos horários de pico.",
        concept: "🔬 FÍSICA: Energia Cinética Rotacional (Ec = 1/2·I·ω²), Eletroquímica de Íons de Lítio e Resposta em Frequência | 🌍 GEOGRAFIA: Descarbonização de Horários de Ponta e Segurança Energética Urbana",
        options: [
          { text: "🔋 Instalação de Complexos de Armazenamento Gigawatt com Baterias de Lítio (+40 MW | Custo: $35M)", cost: 35, effect: p => { p.capacity.wind += 40; p.capital -= 35; globalFootprint = Math.max(0, globalFootprint - 15); } },
          { text: "⚙️ Instalação de Volantes de Inércia Industriais de Alta Rotação (+35 MW | Custo: $28M)", cost: 28, effect: p => { p.capacity.hydro += 35; p.capital -= 28; } },
          { text: "📜 Patentes de Software de Gestão de Carga em Baterias de Grande Porte (+2 Patentes | Custo: $24M)", cost: 24, effect: p => { p.patents += 2; p.capital -= 24; } },
          { text: "🛡️ Plano Nacional de Resiliência para Horários de Pico (Gratuito | +8% Estabilidade)", cost: 0, effect: p => { p.stability = Math.min(100, p.stability + 8); } }
        ]
      };
    }

    if (year >= 2020) {
      return {
        title: "2020: A RODADA FINAL PELA RESILIÊNCIA PLANETÁRIA & MATRIZ BRASILEIRA vs MUNDIAL",
        desc: `Último ano da corrida energética de 50 anos! Enquanto o mundo ainda depende em mais de 80% de combustíveis fósseis, a matriz elétrica brasileira atinge cerca de 88% de fontes renováveis (hidro, eólica, solar, biomassa). Tome a decisão final para consagrar a resiliência de ${nationName}!`,
        ticker: "2020 • RODADA FINAL DA CÚPULA INTERNACIONAL: Apuração da nação campeã em sustentabilidade e resiliência!",
        concept: "🔬 FÍSICA: Síntese de Conservação de Energia, Eficiência Termodinâmica & Fusão Nuclear Futura | 🌍 GEOGRAFIA: Comparação Final das Matrizes Energéticas e Elétricas, Descarbonização & Futuro Planetário",
        options: [
          { text: "🏆 Pacote Integrado de Sustentabilidade Renovável (+12% Estabilidade | Custo: $20M)", cost: 20, effect: p => { p.stability = Math.min(100, p.stability + 12); p.capital -= 20; } },
          { text: "⚡ Expansão de Geração Limpa de Alta Potência (+50 MW | Custo: $25M)", cost: 25, effect: p => { p.capacity.hydro += 50; p.capital -= 25; } },
          { text: "📜 Registro Final de Patentes Verdes Internacionais (+3 Patentes | Custo: $22M)", cost: 22, effect: p => { p.patents += 3; p.capital -= 22; } },
          { text: "🛡️ Fundo Soberano de Reserva e Soberania Energética (Receita: +$40M | +6% Confiança)", cost: 0, effect: p => { p.capital += 40; p.trust = Math.min(100, p.trust + 6); } }
        ]
      };
    }

    // Fallback procedural para anos não previstos
    return {
      title: `${year}: DILEMA DE EXPANSÃO ENERGÉTICA`,
      desc: `A nação ${nationName} analisa seus planos de expansão e modernização da matriz energética no ano de ${year}.`,
      ticker: `${year} • Cúpula de Genebra debate investimentos estratégicos em infraestrutura de energia.`,
      concept: "🔬 FÍSICA: Conservação e Transformação de Energia | 🌍 GEOGRAFIA: Planejamento Territorial & Matriz Elétrica",
      options: [
        { text: `💧 Usina Hidroelétrica em Rio de Planalto (+35 MW | Custo: $28M)`, cost: 28, effect: p => { p.capacity.hydro += 35; p.capital -= 28; } },
        { text: `🌬️ Parque Solar e Eólico Renovável (+35 MW | Custo: $30M)`, cost: 30, effect: p => { p.capacity.wind += 35; p.capital -= 30; globalFootprint = Math.max(0, globalFootprint - 10); } },
        { text: `🔬 Laboratórios de P&D e Patentes (+2 Patentes | Custo: $22M)`, cost: 22, effect: p => { p.patents += 2; p.capital -= 22; } },
        { text: `💰 Emissão de Títulos de Reserva (Receita: +$35M Capital)`, cost: 0, effect: p => { p.capital += 35; } }
      ]
    };
  }

  window.initMainGame = function() {
    currentYear = 1970;
    currentTurnNumber = 1;
    activeLeaderIndex = 0;
    globalFootprint = 25;
    shownNewsYears.clear();

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
    const qData = getTurnQuestionData(currentYear, currentTurnNumber, player);

    updatePlenarySeats();

    // Trigger Breaking News Newspaper Modal on landmark historical years or random turns
    checkAndTriggerTurnNewspaper(currentYear, currentTurnNumber);

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

          let gameEnded = false;

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
              gameEnded = true;
            }
          });

          if (gameEnded) return;

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
      btnConfirmTurnText.innerHTML = currentTurnNumber >= 50 ? `🏆 FINALIZAR CÚPULA 2020` : `AVANÇAR PARA ${currentYear + 1} ⏭`;
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

  // Victory Resolution (Turn 50 / Year 2019)
  function triggerVictoryResolution() {
    try {
      // Stop any speech synthesis
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      // Score all players
      const scoredPlayers = (activeGamePlayers || []).map(p => {
        const gdpVal = p.gdp || 500;
        const trustVal = p.trust || 50;
        const patentsVal = p.patents || 0;
        const emissionsVal = p.cumulativeEmissions || 5;
        const score = (0.35 * (gdpVal / 1000)) + (0.30 * (trustVal / 100)) + (0.20 * (patentsVal / 10)) - (0.15 * (emissionsVal / 100));
        return { ...p, resilienceScore: (score * 100).toFixed(1) };
      }).sort((a, b) => parseFloat(b.resilienceScore) - parseFloat(a.resilienceScore));

      const winner = scoredPlayers[0] || { name: 'Líder', type: 'human', trust: 80, gdp: 500, resilienceScore: '85.0', nationId: 'norway', nation: { name: 'Noruega', flag: '🇳🇴', tagline: 'Pioneira Hidrelétrica' } };

      const avatarMap = { norway: '🧔🏻‍♂️', brazil: '👨🏽‍💼', iceland: '👨🏼‍💼', uk: '🤵🏼‍♂️', usa: '🏛️' };
      const avatar = avatarMap[winner.nationId] || '👨‍💼';
      const nationName = winner.nation ? winner.nation.name : 'Nação';
      const nationFlag = winner.nation ? winner.nation.flag : '🌐';
      const nationTagline = winner.nation ? winner.nation.tagline : '';

      const leaderboardRows = scoredPlayers.map((p, idx) => {
        const medals = ['🥇', '🥈', '🥉'];
        const badge = medals[idx] || `${idx + 1}º`;
        const pFlag = p.nation ? p.nation.flag : '🌐';
        const pNation = p.nation ? p.nation.name : '';
        return `<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:${idx===0?'rgba(212,175,55,0.12)':'#111'};border:1px solid ${idx===0?'#d4af37':'#2a2a2a'};border-radius:4px;margin-bottom:6px;">
          <span style="font-size:1.4rem;min-width:32px;text-align:center;">${badge}</span>
          <span style="font-size:1.3rem;">${pFlag}</span>
          <span style="flex:1;font-family:'Special Elite',monospace;color:#f4f0e6;">${p.name} (${pNation})</span>
          <span style="font-family:'Cinzel',serif;color:#d4af37;font-weight:bold;">${p.resilienceScore} pts</span>
        </div>`;
      }).join('');

      const confettiHTML = Array.from({length: 30}, (_, i) => {
        const shapes = ['🎉','✨','⚡','🍃','🌟','💰','🏆','📜'];
        const shape = shapes[i % shapes.length];
        const left = Math.random() * 95;
        const delay = Math.random() * 3;
        const dur = 3.2 + Math.random() * 2.8;
        return `<div style="position:absolute;top:-20px;left:${left}%;font-size:1.4rem;animation:confettiFall ${dur}s ${delay}s linear infinite;">${shape}</div>`;
      }).join('');

      const victoryHTML = `
        <div id="victoryScreenFull" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;background:rgba(0,0,0,0.96);display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;font-family:'Special Elite',monospace;color:#f4f0e6;animation:overlayFadeIn 0.5s ease-out;">
          
          <!-- Confetti -->
          <div style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:1;">${confettiHTML}</div>

          <!-- Main Card -->
          <div style="position:relative;z-index:10;width:95%;max-width:1050px;background:#0d0d0d;border:3px solid #d4af37;border-radius:8px;box-shadow:0 0 60px rgba(212,175,55,0.4);padding:28px 36px;display:flex;flex-direction:column;gap:20px;animation:cardPopSpin 0.65s cubic-bezier(0.175,0.885,0.32,1.275);">

            <!-- Header -->
            <header style="text-align:center;border-bottom:1px dashed #4a453b;padding-bottom:16px;">
              <span style="font-family:'Cinzel',serif;font-size:0.85rem;letter-spacing:3px;color:#d4af37;text-transform:uppercase;">RESULTADO FINAL • CÚPULA DE GENEBRA (1970 – 2019)</span>
              <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin:8px 0;">
                <span style="font-size:3rem;animation:bounceHero 1.5s infinite alternate;">🏆</span>
                <h1 style="font-family:'Cinzel',serif;font-size:2.2rem;color:#f4f0e6;letter-spacing:3px;">VITÓRIA HISTÓRICA!</h1>
              </div>
              <p style="font-size:1rem;color:#a8a298;max-width:750px;margin:0 auto;">Parabéns ${winner.name}! Sua diplomacia liderou a maior transição energética da história — de 1970 a 2019!</p>
            </header>

            <!-- Body grid -->
            <div style="display:grid;grid-template-columns:1fr 1.25fr;gap:24px;">

              <!-- Champion card -->
              <div style="background:#141414;border:2px solid #d4af37;border-radius:6px;padding:20px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;box-shadow:inset 0 0 20px rgba(212,175,55,0.15);">
                <div style="background:#d4af37;color:#000;font-family:'Cinzel',serif;font-size:0.72rem;letter-spacing:2px;padding:4px 12px;border-radius:2px;">👑 CAMPEÃO MUNDIAL</div>
                <div style="display:flex;gap:12px;margin:8px 0;">
                  <span style="font-size:2.8rem;">${nationFlag}</span>
                  <span style="font-size:2.8rem;">${avatar}</span>
                </div>
                <h2 style="font-family:'Cinzel',serif;font-size:1.5rem;letter-spacing:2px;color:#f4f0e6;">${(winner.name || 'LÍDER').toUpperCase()}</h2>
                <span style="font-size:0.78rem;color:#a8a298;letter-spacing:1px;">${nationName.toUpperCase()} • ${nationTagline}</span>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;width:100%;">
                  <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:4px;padding:8px;text-align:center;">
                    <div style="font-size:0.65rem;color:#a8a298;letter-spacing:1px;margin-bottom:4px;">RESILIÊNCIA</div>
                    <div style="font-family:'Cinzel',serif;font-size:1.1rem;color:#d4af37;font-weight:bold;">${winner.resilienceScore} pts</div>
                  </div>
                  <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:4px;padding:8px;text-align:center;">
                    <div style="font-size:0.65rem;color:#a8a298;letter-spacing:1px;margin-bottom:4px;">CONFIANÇA</div>
                    <div style="font-family:'Cinzel',serif;font-size:1.1rem;color:#d4af37;font-weight:bold;">${Math.round(winner.trust || 0)}%</div>
                  </div>
                  <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:4px;padding:8px;text-align:center;">
                    <div style="font-size:0.65rem;color:#a8a298;letter-spacing:1px;margin-bottom:4px;">PIB</div>
                    <div style="font-family:'Cinzel',serif;font-size:1.1rem;color:#d4af37;font-weight:bold;">$${((winner.gdp || 500)/1000).toFixed(2)}T</div>
                  </div>
                </div>
              </div>

              <!-- Leaderboard -->
              <div style="background:#0d0d0d;border:1px solid #2a2a2a;border-radius:6px;padding:20px;">
                <h3 style="font-family:'Cinzel',serif;font-size:0.85rem;letter-spacing:3px;color:#d4af37;text-transform:uppercase;margin-bottom:14px;text-align:center;border-bottom:1px solid #2a2a2a;padding-bottom:10px;">CLASSIFICAÇÃO GERAL DE RESILIÊNCIA</h3>
                ${leaderboardRows}
              </div>

            </div>

            <!-- Footer buttons -->
            <footer style="display:flex;justify-content:center;gap:16px;margin-top:8px;">
              <button id="victoryBtnCredits" style="display:inline-flex;align-items:center;gap:10px;padding:14px 28px;font-family:'Cinzel',serif;font-size:0.95rem;font-weight:700;letter-spacing:2px;cursor:pointer;border-radius:2px;background:#d4af37;color:#000;border:2px solid #d4af37;box-shadow:4px 4px 0 #000;transition:all 0.2s ease;">
                <span>🎬</span><span>CRÉDITOS DE DESENVOLVIMENTO</span>
              </button>
              <button id="victoryBtnRestart" style="display:inline-flex;align-items:center;gap:10px;padding:14px 28px;font-family:'Cinzel',serif;font-size:0.95rem;font-weight:700;letter-spacing:2px;cursor:pointer;border-radius:2px;background:#1a1a1a;color:#f4f0e6;border:1px solid #4a453b;transition:all 0.2s ease;">
                <span>🔄</span><span>REINICIAR CÚPULA ENERGÉTICA</span>
              </button>
            </footer>

          </div>
        </div>`;

      // Inject directly into body — bypasses all z-index/display conflicts
      const container = document.createElement('div');
      container.id = 'victoryInjected';
      container.innerHTML = victoryHTML;
      document.body.appendChild(container);

      // Wire up buttons AFTER injection (avoids inline onclick issues)
      const btnCredits = document.getElementById('victoryBtnCredits');
      if (btnCredits) {
        btnCredits.addEventListener('click', () => {
          // Remove previous credits screen if any
          const prev = document.getElementById('inlineCreditsScreen');
          if (prev) prev.remove();

          // Build a fully self-contained credits screen with its own keyframes
          const creditsEl = document.createElement('div');
          creditsEl.id = 'inlineCreditsScreen';
          creditsEl.innerHTML = `
            <style>
              @keyframes inlineRollUp {
                0%   { transform: translateY(100vh); }
                100% { transform: translateY(-160%); }
              }
            </style>
            <div style="
              position: fixed; top: 0; left: 0;
              width: 100vw; height: 100vh;
              background: #000;
              z-index: 999999;
              overflow: hidden;
            ">
              <!-- toolbar -->
              <div style="position:absolute;top:20px;right:28px;z-index:10;display:flex;gap:12px;">
                <button id="inlineCreditsClose" style="padding:10px 20px;font-family:'Cinzel',serif;font-size:0.85rem;letter-spacing:2px;background:#f4f0e6;color:#000;border:none;cursor:pointer;border-radius:4px;">✖ FECHAR CRÉDITOS</button>
              </div>

              <!-- scrolling content: NO translateX, full width, text-align center -->
              <div style="
                position: absolute;
                left: 0; width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 32px;
                padding: 60px 20px 140px;
                text-align: center;
                font-family: 'Special Elite', monospace;
                color: #f4f0e6;
                animation: inlineRollUp 28s linear forwards;
              ">
                <div style="font-family:'Cinzel',serif;font-size:3.5rem;font-weight:900;letter-spacing:8px;color:#f4f0e6;text-shadow:0 0 20px rgba(255,255,255,0.4);">GEOPOWER</div>
                <div style="font-family:'Cinzel',serif;font-size:1rem;letter-spacing:4px;color:#d4af37;">CÚPULA INTERNACIONAL DE ENERGIA (1970 – 2019)</div>
                <div style="color:#d4af37;font-size:1.2rem;letter-spacing:8px;">✦ ✦ ✦</div>

                <div style="width:100%;max-width:640px;">
                  <h2 style="font-family:'Cinzel',serif;font-size:0.9rem;letter-spacing:3px;color:#d4af37;text-transform:uppercase;border-bottom:1px dashed #4a453b;padding-bottom:8px;margin-bottom:20px;">EQUIPE DE DESENVOLVIMENTO</h2>
                  <div style="display:flex;flex-direction:column;gap:14px;">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px dotted #333;padding-bottom:8px;"><span style="font-size:1.1rem;">Ana Clara Pantaleao Tirola</span><span style="font-family:'Cinzel',serif;color:#d4af37;font-size:0.8rem;">Nº 02</span></div>
                    <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px dotted #333;padding-bottom:8px;"><span style="font-size:1.1rem;">Ana Laura Pessotto Camargo</span><span style="font-family:'Cinzel',serif;color:#d4af37;font-size:0.8rem;">Nº 03</span></div>
                    <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px dotted #333;padding-bottom:8px;"><span style="font-size:1.1rem;">Lorena Santos Leme</span><span style="font-family:'Cinzel',serif;color:#d4af37;font-size:0.8rem;">Nº 23</span></div>
                    <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px dotted #333;padding-bottom:8px;"><span style="font-size:1.1rem;">Maria Clara De Núncio Oliveira</span><span style="font-family:'Cinzel',serif;color:#d4af37;font-size:0.8rem;">Nº 25</span></div>
                  </div>
                </div>

                <div style="color:#d4af37;font-size:1.2rem;letter-spacing:8px;">✦ ✦ ✦</div>

                <div style="width:100%;max-width:640px;">
                  <h2 style="font-family:'Cinzel',serif;font-size:0.9rem;letter-spacing:3px;color:#d4af37;text-transform:uppercase;border-bottom:1px dashed #4a453b;padding-bottom:8px;margin-bottom:14px;">DISCIPLINA & PROJETO</h2>
                  <p style="color:#a8a298;line-height:1.9;">Projeto de Física Aplicada & Geopolítica Energética</p>
                  <p style="color:#a8a298;line-height:1.9;">Matriz Elétrica, Estabilidade Social e Desenvolvimento Sustentável</p>
                </div>

                <div style="color:#d4af37;font-size:1.2rem;letter-spacing:8px;">✦ ✦ ✦</div>

                <div style="width:100%;max-width:640px;">
                  <h2 style="font-family:'Cinzel',serif;font-size:0.9rem;letter-spacing:3px;color:#d4af37;text-transform:uppercase;border-bottom:1px dashed #4a453b;padding-bottom:8px;margin-bottom:14px;">TECNOLOGIAS & ESTÉTICA</h2>
                  <p style="color:#a8a298;line-height:1.9;">HTML5 • CSS3 • JavaScript Vanilla</p>
                  <p style="color:#a8a298;line-height:1.9;">1970s Rubber Hose Cartoon Aesthetic</p>
                  <p style="color:#a8a298;line-height:1.9;">Cinejornal Vintage & Síntese de Áudio Analógico</p>
                  <p style="color:#a8a298;line-height:1.9;">Web Speech API • Canvas Confetti</p>
                </div>

                <div style="color:#d4af37;font-size:1.2rem;letter-spacing:8px;">✦ ✦ ✦</div>

                <div style="margin-top:30px;">
                  <div style="font-family:'Cinzel',serif;font-size:2.5rem;font-weight:900;letter-spacing:6px;color:#f4f0e6;">FIM DA CÚPULA</div>
                  <div style="font-size:0.8rem;color:#555;letter-spacing:2px;margin-top:12px;">© 2026 GEOPOWER • TODOS OS DIREITOS RESERVADOS</div>
                </div>
              </div>
            </div>
          `;

          document.body.appendChild(creditsEl);

          // Wire close button
          const closeBtn = document.getElementById('inlineCreditsClose');
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              creditsEl.remove();
            });
          }
        });
      }

      const btnRestart = document.getElementById('victoryBtnRestart');
      if (btnRestart) {
        btnRestart.addEventListener('click', () => {
          // Remove injected screens
          ['victoryInjected', 'inlineCreditsScreen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
          });

          // Hide everything else and show setup screen
          ['retroNewspaperModal', 'gameTutorialModal', 'movieCreditsOverlay',
           'gameStageScreen', 'retroIntroScreen', 'endgameScreen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
          });

          const playerSetupScreen = document.getElementById('playerSetupScreen');
          if (playerSetupScreen) playerSetupScreen.classList.remove('hidden');

          try { renderPlayerSlots(); } catch (e) {}
        });
      }

    } catch (err) {
      console.error('Erro na vitória:', err);
      // Absolute last resort fallback
      document.body.innerHTML = `<div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px;font-family:monospace;color:#d4af37;font-size:2rem;z-index:99999;">
        <div>🏆 CÚPULA CONCLUÍDA!</div>
        <div style="font-size:1rem;color:#aaa;">Parabéns pela partida de 50 anos!</div>
        <button onclick="location.reload()" style="padding:12px 24px;background:#d4af37;color:#000;border:none;cursor:pointer;font-size:1rem;font-family:'Cinzel',serif;">REINICIAR JOGO</button>
      </div>`;
    }
  }

  // State Collapse / Impeachment Defeat Screen (Trust = 0%)
  function triggerImpeachmentDefeat(failedPlayer) {
    const retroNewspaperModal = document.getElementById('retroNewspaperModal');
    if (retroNewspaperModal) retroNewspaperModal.classList.add('hidden');
    const gameTutorialModal = document.getElementById('gameTutorialModal');
    if (gameTutorialModal) gameTutorialModal.classList.add('hidden');
    const gameStageScreen = document.getElementById('gameStageScreen');
    if (gameStageScreen) gameStageScreen.classList.add('hidden');
    const endgameScreen = document.getElementById('endgameScreen');
    if (endgameScreen) endgameScreen.classList.remove('hidden');
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

  // ==========================================================================
  // BREAKING NEWS NEWSPAPER ENGINE (Jornal Extraordinário Retro no Meio da Tela)
  // ==========================================================================
  const BREAKING_NEWS_DATABASE = [
    {
      years: [1973, 1974],
      category: "🚨 EMBARGO MUNDIAL DO PETRÓLEO",
      headline: "OPEC INTERROMPE EXPORTAÇÕES E PREÇO DO BARRIL QUADRUPLICA!",
      subheadline: "Países produtores fecham torneiras petrolíferas. Filas nos postos e racionamento atingem o Ocidente.",
      icon: "🛢️",
      caption: "Caminhões-tanque paralisados em refinarias da Europa e América do Norte.",
      paragraph: "A decisão surpresa do cartel de produtores causou pânico nas bolsas mundiais. A dependência excessiva de combustíveis fósseis revelou a vulnerabilidade das matrizes energéticas continentais. Líderes convocam sessões de emergência em Genevra para aprovar planos de autonomia energética.",
      impact: "⚠️ IMPACTO ECONÔMICO: Custo de usinas térmicas sobe +25% nesta rodada."
    },
    {
      years: [1977, 1978],
      category: "⚡ CHUVA ÁCIDA CONTINENTAL",
      headline: "EMISSÕES INDUSTRIAIS PROVOCAM CHUVAS TÓXICAS NA EUROPA!",
      subheadline: "Acidez pluviométrica danifica lavouras, ecossistemas e estruturas urbanas.",
      icon: "🌧️",
      caption: "Florestas da Europa Central sofrem desfolhamento por precipitação ácida.",
      paragraph: "Estudos de institutos meteorológicos comprovaram que cinzas e dióxido de enxofre oriundos de usinas a carvão estão atravessando fronteiras nacionais, devastando a agricultura e elevando o descontentamento popular.",
      impact: "🌿 IMPACTO AMBIENTAL: Confiança do Governo cai -4% em matrizes poluentes."
    },
    {
      years: [1979, 1980],
      category: "⚡ SECA HISTÓRICA E REVOLUÇÃO",
      headline: "RESERVATÓRIOS HIDRELÉTRICOS ATINGEM O NÍVEL CRÍTICO DA DÉCADA!",
      subheadline: "Estiagem prolongada reduz o fluxo das grandes bacias e força o acionamento de usinas de reserva.",
      icon: "💧",
      caption: "Nível das represas de cabeceira despenca 40% em relação à média histórica.",
      paragraph: "Com a redução severa nos índices pluviométricos, a capacidade de geração das hidrelétricas foi drasticamente afetada. Nações dependentes de recursos hídricos enfrentam risco iminente de apagão e retração na produção industrial.",
      impact: "⚡ IMPACTO NO TURNO: Demanda de emergência cresce +15 MW nas bacias."
    },
    {
      years: [1986, 1987],
      category: "☢️ SEGURANÇA INDUSTRIAL & NUCLEAR",
      headline: "ALERTA MUNDIAL APÓS O ACIDENTE EM CHERNOBYL!",
      subheadline: "Vazamento radioativo na Europa Oriental dispara exigências de inspeções severas no setor elétrico.",
      icon: "⚛️",
      caption: "Equipes de emergência realizam medição de radiação em perímetros industriais.",
      paragraph: "A tragédia de Chernobyl reacendeu o debate sobre os riscos da energia nuclear. Movimentos ambientais exigem o congelamento de novas obras de reatores e auditorias imediatas em todas as usinas ativas do planeta.",
      impact: "🛡️ IMPACTO POLÍTICO: Reatores nucleares exigem +$10M em manutenção preventiva."
    },
    {
      years: [1990, 1991, 1992],
      category: "🌱 CÚPULA DA TERRA & DIPLOMACIA",
      headline: "NAÇÕES ASSINAM TRATADO GLOBAL DE PRESERVAÇÃO AMBIENTAL!",
      subheadline: "Cúpula do Rio aprova a Agenda 21 e estabelece fundos internacionais de financiamento sustentável.",
      icon: "🌿",
      caption: "Líderes de 170 países assinam compromisso de desenvolvimento limpo em Genevra.",
      paragraph: "Pela primeira vez na história moderna, a comunidade internacional alinhou metas vinculantes de preservação e transição energética. Nações que investirem em patentes verdes e matrizes renováveis receberão créditos fiscais multilaterais.",
      impact: "💰 IMPACTO FINANCEIRO: Bônus de +$15M para países com patentes registradas!"
    },
    {
      years: [2003, 2004],
      category: "🔌 COLAPSO NA REDE DE TRANSMISSÃO",
      headline: "O GRANDE APAGÃO CONTINENTAL DEIXA 50 MILHÕES NO ESCURO!",
      subheadline: "Sobrecarga de linha em cascata paralisa metrópoles e evidencia urgência de automação.",
      icon: "⚡",
      caption: "Linhas de transmissão de alta tensão sobrecarregadas desarmam em efeito dominó.",
      paragraph: "Um erro de chaveamento em uma subestação central provocou o maior desligamento elétrico da história recente. O caos urbano reforçou a necessidade imperiosa de modernizar a infraestrutura com redes inteligentes de automação.",
      impact: "⚠️ IMPACTO NA REDE: Confiança do Governo cai -5% se houver déficit de energia!"
    },
    {
      years: [2008, 2009, 2010],
      category: "📈 CRISE FINANCEIRA GLOBAL",
      headline: "COLAPSO DE BANCOS MUNDIAIS TRAVA CRÉDITO PARA INFRAESTRUTURA!",
      subheadline: "Mercados globais de capital secam e megaprojetos de usinas têm financiamento suspenso.",
      icon: "🏛️",
      caption: "Bolsas de valores despencam e títulos de infraestrutura perdem valor de mercado.",
      paragraph: "A recessão econômica global paralisou os investimentos privados em energia. Governos são chamados a intervir diretamente com capital estatal para evitar a paralisação de obras estratégicas de geração elétrica.",
      impact: "📉 IMPACTO ECONÔMICO: PIB das nações sofre retração provisória de -3%."
    },
    {
      years: [2015, 2016, 2017],
      category: "🌞 REVOLUÇÃO SOLAR E PARIDADE DE REDE",
      headline: "ENERGIA FOTOVOLTAICA ALCANÇA O MENOR CUSTO HISTÓRICO!",
      subheadline: "Avanços em células de silício tornam a geração solar mais barata que usinas a carvão.",
      icon: "🌞",
      caption: "Painéis fotovoltaicos instalados em escala de giga-watts no deserto.",
      paragraph: "A paridade de rede fotovoltaica foi atingida antes do previsto por cientistas. A transição tecnológica atrai bilhões em capital privado para projetos de parques solares e armazenamento por baterias.",
      impact: "🌱 IMPACTO VERDE: Parques solares e eólicos ganham +10 MW de bônus de eficiência!"
    },
    {
      years: [2018, 2019, 2020],
      category: "🤖 INTELIGÊNCIA ARTIFICIAL E SMART GRIDS",
      headline: "ALGORITMOS DE IA ASSUMEM O CONTROLE DO FLUXO ELÉTRICO!",
      subheadline: "Sistemas preditivos reduzem o desperdício em linhas de alta tensão em até 20%.",
      icon: "🤖",
      caption: "Centro de operações cibernético monitorando a malha nacional em tempo real.",
      paragraph: "A integração de sensores inteligentes e redes neurais permite ajustar a distribuição de carga segundo a insolação e a força dos ventos. Nações pioneiras em tecnologia ganham imensa vantagem de resiliência.",
      impact: "🏆 IMPACTO FINAL: Bônus de +5 Pontos de Resiliência para nações com liderança tecnológica!"
    }
  ];

  const PROCEDURAL_NEWS_POOL = [
    {
      category: "🔬 ANÚNCIO CIENTÍFICO DE ÚLTIMA HORA",
      headline: "NOVO CONDUTOR SUPER-EFICIENTE REDUZ PERDAS POR EFEITO JOULE!",
      subheadline: "Laboratórios nacionais patenteiam ligas metálicas que diminuem a dissipação de calor.",
      icon: "🔬",
      caption: "Experimento de laboratório testando a resistência elétrica sob alta corrente.",
      paragraph: "Engenheiros apresentaram no Congresso de Física Aplicada uma nova tecnologia de cabos de transmissão. A inovação promete economizar milhões de megawatts desperdiçados em redes de distribuição urbanas.",
      impact: "⚡ IMPACTO TÉCNICO: Eficiência da malha ampliada em todas as nações!"
    },
    {
      category: "🌋 FENÔMENO CLIMÁTICO REGIONAL",
      headline: "ONDA DE CALOR EXTREMA DISPARA O CONSUMO DE ENERGIA!",
      subheadline: "Termômetros superam médias históricas e a demanda por refrigeração bate recordes.",
      icon: "🌡️",
      caption: "Centrais elétricas operando no limite de capacidade de transformação.",
      paragraph: "Com temperaturas batendo recordes nos hemisférios norte e sul, o consumo de eletricidade disparou. Concessionárias de energia apelam à população para adotar medidas de racionamento consciente durante horários de pico.",
      impact: "📈 IMPACTO AMBIENTAL: Demanda nacional aumenta temporariamente neste turno."
    },
    {
      category: "💰 MERCADO INTERNACIONAL DE CAPITAIS",
      headline: "FUNDO MULTILATERAL LIBERA $30M EM CRÉDITOS VERDES!",
      subheadline: "Linhas de financiamento com juros reduzidos impulsionam investimentos limpos.",
      icon: "💰",
      caption: "Documento de cooperação econômica assinado no Plenário da Cúpula Mundial.",
      paragraph: "O Banco de Desenvolvimento Internacional anunciou um fundo especial de subsídios para apoiar projetos de energia limpa e descarbonização em nações comprometidas com metas socioambientais.",
      impact: "💵 IMPACTO FISCAL: Oportunidade de investimento com incentivo estatal!"
    },
    {
      category: "🌾 IMPACTO AGRÍCOLA & BIOCOMBUSTÍVEIS",
      headline: "SAFRA RECORDE DE BIOMASSA IMPULSIONA GERAÇÃO BIOELÉTRICA!",
      subheadline: "Usinas de cogeração por resíduos agrícolas ampliam participação na matriz energética.",
      icon: "🌿",
      caption: "Colheita de biomassa destinada à fermentação e geração de vapor em turbinas.",
      paragraph: "A combinação de condições pluviais favoráveis e avanços na biotecnologia permitiu um aumento substancial na produção de combustíveis renováveis de segunda geração. O setor agrícola celebra a conquista.",
      impact: "🌱 IMPACTO ECOLÓGICO: Pegada global de carbono reduz em -5 pontos!"
    }
  ];

  let shownNewsYears = new Set();

  window.showNewspaperModal = function(newsData) {
    try { playClickSound(); } catch (e) {}
    
    const modal = document.getElementById('retroNewspaperModal');
    const issueNum = document.getElementById('newspaperIssueNum');
    const dateTag = document.getElementById('newspaperDateTag');
    const categoryBadge = document.getElementById('newspaperCategoryBadge');
    const headline = document.getElementById('newspaperHeadlineTitle');
    const subheadline = document.getElementById('newspaperSubheadline');
    const photoIcon = document.getElementById('newspaperPhotoIcon');
    const photoCaption = document.getElementById('newspaperPhotoCaption');
    const paragraphText = document.getElementById('newspaperParagraphText');
    const impactPill = document.getElementById('newspaperImpactPill');

    if (issueNum) issueNum.innerHTML = newsData.year || currentYear;
    if (dateTag) dateTag.innerHTML = `GENEVRA • 15 DE OUTUBRO DE ${newsData.year || currentYear}`;
    if (categoryBadge) categoryBadge.innerHTML = newsData.category || "🚨 EDIÇÃO EXTRAORDINÁRIA";
    if (headline) headline.innerHTML = newsData.headline;
    if (subheadline) subheadline.innerHTML = newsData.subheadline;
    if (photoIcon) photoIcon.innerHTML = newsData.icon || "📰";
    if (photoCaption) photoCaption.innerHTML = newsData.caption || "Fotografia oficial transmitida via rádio-telegrafia para Genevra.";
    if (paragraphText) paragraphText.innerHTML = newsData.paragraph;
    if (impactPill) impactPill.innerHTML = newsData.impact || "⚡ Notícia Relevante para a Diplomacia Energética Mundial";

    if (modal) {
      modal.classList.remove('hidden');
    }
  };

  window.closeNewspaperModal = function() {
    try { playClickSound(); } catch (e) {}
    const modal = document.getElementById('retroNewspaperModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  };

  function checkAndTriggerTurnNewspaper(year, turnNum) {
    if (shownNewsYears.has(year)) return false;

    // 1. Check historical matches
    const historicalMatch = BREAKING_NEWS_DATABASE.find(item => item.years.includes(year));
    if (historicalMatch) {
      shownNewsYears.add(year);
      window.showNewspaperModal({ ...historicalMatch, year });
      return true;
    }

    // 2. Random chance (25% probability on non-historical turns after turn 2)
    if (turnNum > 2 && Math.random() < 0.25) {
      shownNewsYears.add(year);
      const randNews = PROCEDURAL_NEWS_POOL[Math.floor(Math.random() * PROCEDURAL_NEWS_POOL.length)];
      window.showNewspaperModal({ ...randNews, year });
      return true;
    }

    return false;
  }

  // Restart Handlers for Victory/Defeat Screen & Credits
  window.restartGameSetup = function() {
    // Remove injected victory screen if present
    const victoryInjected = document.getElementById('victoryInjected');
    if (victoryInjected) victoryInjected.remove();

    const endgameScreen = document.getElementById('endgameScreen');
    const gameStageScreen = document.getElementById('gameStageScreen');
    const playerSetupScreen = document.getElementById('playerSetupScreen');
    const retroIntroScreen = document.getElementById('retroIntroScreen');

    if (movieCreditsOverlay) movieCreditsOverlay.classList.add('hidden');
    if (endgameScreen) endgameScreen.classList.add('hidden');
    if (gameStageScreen) gameStageScreen.classList.add('hidden');
    if (retroIntroScreen) retroIntroScreen.classList.add('hidden');
    if (playerSetupScreen) playerSetupScreen.classList.remove('hidden');

    try { renderPlayerSlots(); } catch (e) {}
  };

  // Movie Credits Handlers (Estilo Rolagem de Cinema)
  window.showMovieCredits = function() {
    try { playClickSound(); } catch (e) {}
    const overlay = document.getElementById('movieCreditsOverlay');
    const roll = document.getElementById('movieCreditsRoll');

    if (overlay) {
      overlay.classList.remove('hidden');
    }

    if (roll) {
      // Reset to start position, then force reflow, then apply animation fresh
      roll.style.animation = 'none';
      roll.style.transform = 'translateY(75vh)';
      void roll.offsetHeight; // force reflow
      roll.style.transform = '';
      roll.style.animation = 'rollUpMovieCredits 22s linear forwards';
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
