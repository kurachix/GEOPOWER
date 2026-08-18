# ⚡ GEOPOWER (1970 – 2020) — Cúpula Internacional de Energia & Resiliência

> **Jogo Educativo de Simulação Geopolítica, Física Aplicada e Geografia Econômica**  
> *Projeto Acadêmico de Física e Geografia — 50 Turnos de Decisões Estratégicas para o Futuro Energético Planetário.*

---

## 📜 Sumário
1. [Visão Geral do Jogo](#-visão-geral-do-jogo)
2. [Guia Passo a Passo: Como Jogar Cada Etapa](#-guia-passo-a-passo-como-jogar-cada-etapa)
   - [Etapa 1: Cinejornal 1970 & Seleção de Áudio](#etapa-1-cinejornal-1970--seleção-de-áudio)
   - [Etapa 2: Credenciamento dos Líderes das Nações](#etapa-2-credenciamento-dos-líderes-das-nações)
   - [Etapa 3: Manual do Líder & Regras do Jogo](#etapa-3-manual-do-líder--regras-do-jogo)
   - [Etapa 4: O Plenário da Cúpula & Painel CRT de Estatísticas](#etapa-4-o-plenário-da-cúpula--painel-crt-de-estatísticas)
   - [Etapa 5: Dilemas Geopolíticos & Escolha de Opções (A, B, C, D)](#etapa-5-dilemas-geopolíticos--escolha-de-opções-a-b-c-d)
   - [Etapa 6: Jornal Extraordinário (Gazeta Geopolítica)](#etapa-6-jornal-extraordinário-gazeta-geopolítica)
   - [Etapa 7: O Pódio de 2020 & Rolagem de Créditos de Cinema](#etapa-7-o-pódio-de-2020--rolagem-de-créditos-de-cinema)
3. [Conceitos Acadêmicos Aplicados](#-conceitos-acadêmicos-aplicados)
   - [Física Aplicada](#física-aplicada)
   - [Geografia Econômica & Geopolítica](#geografia-econômica--geopolítica)
4. [Arquitetura & Tecnologias Utilizadas](#-arquitetura--tecnologias-utilizadas)
5. [Créditos e Desenvolvedoras](#-créditos-e-desenvolvedoras)

---

## 🌐 Visão Geral do Jogo

O **GEOPOWER** é uma simulação interativa que transporta os jogadores para a **Cúpula Mundial de Energia de Genevra**, cobrindo 50 anos da história moderna (**1970 a 2020**). 

Cada jogador assume o comando de uma superpotência ou nação estratégica (**Brasil, Noruega, Islândia, Reino Unido ou EUA**). A cada turno (1 ano), os governantes devem responder a dilemas geopolíticos reais, gerenciar o balanço elétrico em Megawatts (MW), equilibrar o orçamento público ($M), manter a **Confiança do Governo (%)** e elevar o **PIB & Score de Resiliência**.

---

## 🕹️ Guia Passo a Passo: Como Jogar Cada Etapa

### Etapa 1: Cinejornal 1970 & Seleção de Áudio
- **O que ocorre**: Ao abrir o jogo, você assiste a um cinejornal vintage com estética CRT de projetor de 16mm.
- **Ações do Jogador**:
  - Clique na tela ou pressione **Espaço** / **Enter** para avançar entre as 4 cenas históricas de introdução.
  - Ative ou desative o áudio do projetor no botão `🔊 SOM` ou a locução no botão `🎙️ LOCUÇÃO`.
  - Ao final do cinejornal, clique em `⚡ ASSUMIR O COMANDO (INICIAR JOGO)`.

---

### Etapa 2: Credenciamento dos Líderes das Nações
- **O que ocorre**: Tela de configuração onde são definidos os participantes da Cúpula.
- **Ações do Jogador**:
  - **Quantidade de Jogadores**: Escolha jogar com **2, 3, 4 ou 5 Nações**.
  - **Seleção de Nações**: Escolha entre:
    - 🇧🇷 **Brasil**: Matriz limpa focada em Hidrelétricas e Biocombustíveis.
    - 🇳🇴 **Noruega**: Especialista em Águas Profundas e Parques Eólicos Offshore.
    - 🇮🇸 **Islândia**: Pioneira em Energia Geotérmica vulcânica.
    - 🇬🇧 **Reino Unido**: Transição de Térmicas a Gás e Eólica Marítima.
    - 🇺🇸 **EUA**: Matriz diversificada com Nuclear, Gás de Xisto e Carvão.
  - **Tipo de Jogador**: Defina se cada participante é um jogador **Humano** ou controlado pela **Automação**.
  - Clique em `🏛️ CONFIRMAR CREDENCIAMENTO & ENTRAR NA CÚPULA`.

---

### Etapa 3: Manual do Líder & Regras do Jogo
- **O que ocorre**: Um painel com as 5 regras de ouro da diplomacia energética surge na tela.
- **Regras Essenciais**:
  1. **50 Turnos (1970 – 2020)**: O jogo avança 1 ano por turno de forma direta e rápida.
  2. **Geração vs Demanda**: A geração total em MW deve cobrir a demanda. **Superávit** gera receita de tributos (+$15M) e crescimento no PIB; **Apagão** reduz o PIB e destrói a aprovação popular.
  3. **Confiança do Governo**: 
     - **Alta (≥ 75%)**: Bônus fiscal de +20% em impostos.
     - **Baixa (< 40%)**: Provoca **Greves Industriais**, aumentando em +$10M o custo de todas as obras.
     - **Crítica (0%)**: Declara **Impeachment** e derrota da nação!
  4. **Orçamento Único Independente**: Cada nação gerencia seu próprio capital ($M). Opções mais caras que o orçamento atual ficam bloqueadas.
  5. **Patentes & Mercado de Exportação**: Vender energia em superávit e registrar patentes gera receitas anuais passivas.

---

### Etapa 4: O Plenário da Cúpula & Painel CRT de Estatísticas
- **O que ocorre**: Tela principal do jogo (`gameStageScreen`).
- **Elementos Visuais**:
  - **Holofote de Teatro**: O assento da nação da rodada atual acende sob um holofote brilhante de iluminação.
  - **Dashboard CRT de Métricas Estratégicas em Destaque**:
    - 💰 **Orçamento / Capital**: Saldo atual em $M e receita anual estimada.
    - ⚡ **Geração vs Demanda**: MW gerados vs MW consumidos, com badge verde (Superávit) ou vermelho (Apagão).
    - 👑 **Confiança do Governo**: Nível de aprovação popular em % e status de greve/bônus.
    - 📈 **PIB & Estabilidade**: Produto Interno Bruto em $B, patentes ativas e estabilidade.
  - **Ticker Cinejornal Dispatch**: Notícias e **Ranking ao Vivo** em tempo real no rodapé.

---

### Etapa 5: Dilemas Geopolíticos & Escolha de Opções (A, B, C, D)
- **O que ocorre**: A cada ano, o líder da rodada é confrontado com um evento geopolítico histórico ou estratégico.
- **Como Jogar**:
  - Na coluna da direita, são apresentados **4 Cartões de Escolha** (`OPÇÃO A`, `OPÇÃO B`, `OPÇÃO C`, `OPÇÃO D`).
  - Cada opção exibe:
    - O custo em dinheiro ($M).
    - Os bônus em MW (Hidro, Térmica, Eólica, Geotérmica, Biomassa ou Nuclear).
    - Bônus ecológicos (redução de emissões) ou ganhos de patentes/capital.
  - Se a nação não possuir fundos suficientes, a opção é bloqueada com o carimbo `🚫 ORÇAMENTO INSUFFICIENTE`.
  - Escolha a opção mais vantajosa para o momento econômico e ambiental do seu país.

---

### Etapa 6: Jornal Extraordinário (Gazeta Geopolítica)
- **O que ocorre**: Em anos históricos marcantes (*1973 - Choque do Petróleo*, *1986 - Chernobyl*, *1992 - Eco-92*, *2003 - Grande Apagão*, *2008 - Crise Financeira*, *2015 - Acordo de Paris*) ou em rodadas aleatórias (~25%), um **Jornal Extraordinário surge no meio da tela**!
- **Como Interagir**:
  - O jornal exibe manchetes de época, fotografias em preto e branco transmitidas por telégrafo, artigos de análise e a consequência direta no turno.
  - Clique em `🗞️ CIENTE! CONTINUAR O COMANDO DA CÚPULA ➔` para fechar o jornal e tomar sua decisão no plenário.

---

### Etapa 7: O Pódio de 2020 & Rolagem de Créditos de Cinema
- **O que ocorre**: Ao concluir o turno 50 (ano 2020), o jogo encerra a rodada e calcula o **Score Final de Resiliência Planetary**:
  $$\text{Score} = (0.35 \times \text{Estabilidade}) + (0.30 \times \text{Confiança}) + (0.20 \times \frac{\text{PIB}}{10}) + (3 \times \text{Patentes}) + \text{Bônus de Superávit}$$
- **Telas Finais**:
  - **Pódio dos Campeões**: Exibe a nação vencedora coroada com louros dourados e a classificação geral.
  - **Créditos de Desenvolvimento**: Ao clicar no botão de créditos, o overlay exibe uma animação estilo cinema com rolagem vertical contínua apresentando a equipe de desenvolvimento:
    - **Ana Clara Pantaleao Tirola N°02**
    - **Ana Laura Pessotto Camargo N°03**
    - **Lorena Santos Leme N°23**
    - **Maria Clara De Núncio Oliveira N°25**
  - **Reiniciar o Jogo**: Botão interativo para fechar os créditos e retornar à tela inicial.

---

## 🔬 Conceitos Acadêmicos Aplicados

### Física Aplicada
1. **Termodinâmica & Eficiência de Carnot**:
   $$\eta = 1 - \frac{T_C}{T_H}$$
   Aplicado na modelagem de usinas térmicas a carvão, gás natural e ciclos combinados.
2. **Potência Hidráulica Efetiva**:
   $$P = \eta \cdot \rho \cdot g \cdot Q \cdot H$$
   Calcula a geração de energia hidroelétrica em função da vazão ($Q$) e queda d'água ($H$).
3. **Efeito Joule & Perdas de Transmissão**:
   $$P_{\text{perda}} = R \cdot I^2$$
   Simula a necessidade de modernizar subestações digitais e linhas de alta tensão.
4. **Fissão Nuclear & Equivalência Massa-Energia**:
   $$E = \Delta m \cdot c^2$$
   Representado nas decisões de reatores nucleares modulares (SMR) e contenção de radiação.
5. **Efeito Fotoelétrico Quântico**:
   $$E = h \cdot \nu$$
   Modelado na transição de paridade de rede fotovoltaica e células de perovskita.

### Geografia Econômica & Geopolítica
1. **Geopolítica do Petróleo & Cartéis**: Impactos da OPEP, estreitos estratégicos e choque de ofertas.
2. **Bacias Hidrográficas Binacionais**: Gestão de recursos hídricos compartilhados entre países vizinhos.
3. **Mercado de Emissões (EU ETS)**: Precificação de carbono equivalência ($CO_2e$) e licenças transfronteiriças.
4. **Fraturamento Hidráulico (Fracking)**: Geologia de rochas folhelho e exploração de gás de xisto.
5. **Climatologia & Eventos Extremos**: Ondas de calor, seca de represas e ionização do ar em linhas elétricas.

---

## 💻 Arquitetura & Tecnologias Utilizadas

- **HTML5 Semântico**: Estrutura acessível com tags semânticas (`<header>`, `<main>`, `<aside>`, `<footer>`), suporte a leitores de tela e IDs únicos.
- **CSS3 Vanilla & Design System**:
  - **CRT Scanlines & Flicker**: Efeito vintage de televisores e monitores de tubo dos anos 70.
  - **Glassmorphism & Gradients Tailored**: Cores tailandesas harmoniosas (dourado escuro, verde-oliva, ciano elétrico, carmesim).
  - **Keyframe Animations**: Animações de giro de jornal (`newspaperSpinIn`), holofotes de iluminação e rolagem de créditos de cinema (`rollUpMovieCredits`).
- **JavaScript ES6+ Vanilla**:
  - Motor de estado reativo sem dependências externas.
  - Gerenciador de eventos aleatórios e cronológicos (`getTurnQuestionData`).
  - Motor de cálculo de PIB, impostos, greves e Confiança do Governo.
  - Sistema de áudio retro e controle de síntese de voz (Web Speech API / efeitos de áudio).

---

