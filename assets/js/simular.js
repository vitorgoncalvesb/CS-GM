// Função que simula uma partida
function simularPartida() {
  // Busca titulares no localStorage
  const elenco = JSON.parse(localStorage.getItem("elenco")) || [];
  const titularesNomes = JSON.parse(localStorage.getItem("titulares")) || [];
  // Filtra os objetos dos titulares
  const titulares = elenco.filter((j) => titularesNomes.includes(j.nome));

  if (titulares.length < 5) {
    return {
      resultado: "Erro",
      mensagem: "Você precisa de pelo menos 5 titulares para simular",
      roundsTime: 0,
      roundsAdversario: 0,
      estatisticas: [],
    };
  }

  // Calcula força dos times
  const ratingTime =
    titulares.reduce((total, jogador) => {
      return total + (jogador.rating || calcularRating(jogador));
    }, 0) / titulares.length;
  const ratingAdv = 65 + Math.random() * 20; // Adversário entre 65-85

  // Define chance de vitória por round
  const roundWinChance = 0.4 + (ratingTime - ratingAdv) * 0.01;

  // Simula rounds
  let roundsTime = 0;
  let roundsAdversario = 0;

  while (
    roundsTime < 13 &&
    roundsAdversario < 13 &&
    !(roundsTime === 12 && roundsAdversario === 12)
  ) {
    Math.random() < roundWinChance ? roundsTime++ : roundsAdversario++;
  }

  // Overtime se empate em 12-12
  if (roundsTime === 12 && roundsAdversario === 12) {
    let otWins = 0;
    while (Math.abs(otWins) < 2) {
      Math.random() < roundWinChance ? otWins++ : otWins--;
    }
    otWins > 0 ? (roundsTime += 1) : (roundsAdversario += 1);
  }

  // Gera estatísticas sincronizadas
  const estatisticas = gerarEstatisticasSincronizadas(
    titulares,
    roundsTime,
    roundsAdversario
  );

  return {
    resultado: roundsTime > roundsAdversario ? "Vitória" : "Derrota",
    roundsTime,
    roundsAdversario,
    estatisticas,
  };
}

// Salva a simulação no histórico (localStorage)
function salvarSimulacao(simulacao) {
  const historico = JSON.parse(localStorage.getItem("simulacoes")) || [];
  historico.push(simulacao);
  localStorage.setItem("simulacoes", JSON.stringify(historico));
}

// Renderiza o resultado da simulação na tela
function renderSimulacao(simulacao) {
  const container = document.getElementById("resultado-simulacao");
  const dados = document.getElementById("dados-simulacao");
  if (!container || !dados) return;

  container.classList.remove("hidden");

  dados.innerHTML = `
    <p class="mb-2"><strong>Resultado:</strong> ${simulacao.resultado}</p>
    <p class="mb-4">Placar: ${simulacao.roundsTime} x ${
    simulacao.roundsAdversario
  }</p>
    <ul class="list-disc list-inside space-y-1">
      ${simulacao.estatisticas
        .map(
          (j) =>
            `<li>${j.nome} (${j.funcao}) - ${j.kills}K / ${j.assists}A / ${j.deaths}D | K/D: ${j.kd}</li>`
        )
        .join("")}
    </ul>
  `;
}