# GEOPOWER - Documentação e Especificação do Projeto

## Parte 1: Roteiro da Introdução (Estilo Noticiário / Cinema Retrô)

A introdução funciona como um cinejornal animado dos anos 1970, com estética monocromática em preto e branco, trilha sonora orquestral com estalidos de disco de vinil e narração empolgada e urgente.

---

### Cena 1: A Explosão do Consumo (1970)
* **Prompt de Imagem:** `1970s rubber hose vintage cartoon style, retro black and white newsreel aesthetic, bustling retro metropolis with giant smoking factories, glowing light bulbs, crowded cartoon cars, high-contrast ink drawing, vintage comic halftone dots, film grain, scratches, 4k resolution, cinematic composition --ar 16:9 --v 6.0`
* **Locução:** *"O ano é 1970! O mundo marcha a passos largos rumo ao progresso industrial. Máquinas que nunca dormem, cidades iluminadas dia e noite e um apetite insaciável por energia!"*

---

### Cena 2: O Sinal de Alerta (A Vulnerabilidade dos Recursos)
* **Prompt de Imagem:** `Vintage 1930s rubber hose cartoon style, black and white monochrome, oil derricks pumping slowly on a cracked dry landscape, an enormous cartoon thermometer overheating, smoke stacks casting shadows over a fragile earth globe, vintage newspaper comic style, vignette border, scratches and dust texture --ar 16:9 --v 6.0`
* **Locução:** *"Mas a locomotiva do desenvolvimento encontra seus limites! Secas severas esvaziam grandes represas, o petróleo torna-se uma arma de disputa geopolítica e as rotas marítimas mundiais entram em colapso!"*

---

### Cena 3: A Grande Cúpula Internacional
* **Prompt de Imagem:** `Classic retro black and white cartoon illustration, international world leaders with exaggerated expressions sitting around a circular negotiation table, blueprints of power plants and lightning bolt icons on the table, world map behind them, dramatic lighting, high contrast ink line art, 1970s political satire cartoon style --ar 16:9 --v 6.0`
* **Locução:** *"Nenhuma nação é uma ilha! Isolados, todos enfrentam o colapso. Juntos, os líderes mundiais são convocados para a mais decisiva conferência internacional da história recente."*

---

### Cena 4: A Convocação do Jogador (Chamada para Ação)
* **Prompt de Imagem:** `Dramatic black and white vintage cartoon style, a close-up of a giant control board with dials, levers, spark effects, flickering vintage meters, a cartoon leader hand reaching out to pull a master switch labeled "POWER", bold ink contours, cinematic angle, retro comic book splash page --ar 16:9 --v 6.0`
* **Locução:** *"Você assume o comando da política energética de sua pátria. Comércio, diplomacia, ciência e coragem. O destino de cinquenta anos de história está sob o seu controle. Que comece a corrida energética!"*

---

### Instruções de Integração no Código (HTML/CSS)
* Exiba os quadros sequencialmente utilizando transições de esmaecimento (*fade-in / fade-out*) a cada 4 a 6 segundos.
* Aplique uma sobreposição com filtro CSS de ruído de filme antigo:
```css
.retro-intro-screen {
  filter: grayscale(100%) contrast(125%) brightness(95%);
  background-image: url('assets/film-grain.png');
  animation: flicker 0.15s infinite;
}
```
