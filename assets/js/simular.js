// --- SIMULAÇÃO ---

// Botão para simular partida
const simularBtn = document.querySelector("#btn-simular");
if (simularBtn) {
  simularBtn.addEventListener("click", () => {
    const elenco = JSON.parse(localStorage.getItem("elenco")) || [];

    if (elenco.length < 5) {
      alert(
        "Você precisa ter pelo menos 5 jogadores no elenco para simular uma partida!"
      );
      return;
    }

    const resultadoSimulacao = simularPartida(elenco);

    if (resultadoSimulacao.resultado === "Erro") {
      alert(resultadoSimulacao.mensagem);
      return;
    }

    salvarSimulacao(resultadoSimulacao);
    renderSimulacao(resultadoSimulacao);
    renderHistoricoSimulacoes();
  });
}

// Função que limita o K/D por player
function calcularKDlimitado(kills, deaths) {
  // Garante que deaths seja no mínimo 1 para evitar divisão por zero
  deaths = Math.max(1, deaths);

  // Calcula o K/D bruto
  const kdBruto = kills / deaths;

  // Aplica os limites (0.20 a 4.75)
  return Math.max(0.7, Math.min(kdBruto, 1.95));
}

// Função para calcular rating médio do time
function calcularRatingTime() {
  const elenco = JSON.parse(localStorage.getItem("elenco")) || [];
  if (elenco.length === 0) return 0; // Retorna 0 se não houver elenco
  
  return elenco.reduce((total, jogador) => {
    return total + (jogador.rating || calcularRating(jogador));
  }, 0) / elenco.length;
}


// Função que simula uma partida
function simularPartida(elenco = JSON.parse(localStorage.getItem("elenco")) || []) {
  if (elenco.length < 5) {
    return {
      resultado: "Erro",
      mensagem: "Você precisa de pelo menos 5 jogadores para simular",
      roundsTime: 0,
      roundsAdversario: 0,
      estatisticas: []
    };
  }

  // Calcula força dos times
  const ratingTime = calcularRatingTime();
  const ratingAdv = 65 + Math.random() * 20; // Adversário entre 65-85

  // Define chance de vitória por round
  const roundWinChance = 0.4 + ((ratingTime - ratingAdv) * 0.01);

  // Simula rounds
  let roundsTime = 0;
  let roundsAdversario = 0;

  while (roundsTime < 13 && roundsAdversario < 13 && !(roundsTime === 12 && roundsAdversario === 12)) {
    Math.random() < roundWinChance ? roundsTime++ : roundsAdversario++;
  }

  // Overtime se empate em 12-12
  if (roundsTime === 12 && roundsAdversario === 12) {
    let otWins = 0;
    
    while (Math.abs(otWins) < 2) {
      Math.random() < roundWinChance ? otWins++ : otWins--;
    }
    
    otWins > 0 ? roundsTime += 1 : roundsAdversario += 1;
  }

  // Gera estatísticas individuais
  const estatisticas = elenco.map(jogador => {
  const kills = Math.floor(Math.random() * 20);
  const deaths = Math.floor(Math.random() * 15);
  const assists = Math.floor(Math.random() * 10);
  const kd = calcularKDlimitado(kills, deaths);

  return {
    nome: jogador.nome,
    funcao: jogador.funcao,
    kills,
    deaths,
    assists,
    kd: kd.toFixed(2), // mostra K/D com 2 casas decimais
    rating: jogador.rating
  };
});


  return {
    resultado: roundsTime > roundsAdversario ? "Vitória" : "Derrota",
    roundsTime,
    roundsAdversario,
    estatisticas
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

// Renderiza o histórico de simulações na lista do HTML
function renderHistoricoSimulacoes() {
  const lista = document.getElementById("lista-simulacoes");
  if (!lista) return;
  const historico = JSON.parse(localStorage.getItem("simulacoes")) || [];

  lista.innerHTML = "";

  // Exibe o histórico em ordem reversa (mais recente primeiro)
  historico
    .slice()
    .reverse()
    .forEach((sim, index) => {
      const item = document.createElement("li");
      item.className = "bg-gray-50 p-3 rounded border";
      item.innerHTML = `
      <p class="font-semibold">${sim.resultado} - Placar: ${sim.roundsTime} x ${sim.roundsAdversario}</p>
    `;
      lista.appendChild(item);
    });
}

const btnLimparHistorico = document.querySelector("#btn-resetar-historico");
if (btnLimparHistorico) {
  btnLimparHistorico.addEventListener("click", () => {
    if (
      confirm("Tem certeza que deseja limpar todo o histórico de simulações?")
    ) {
      localStorage.removeItem("simulacoes");
      renderHistoricoSimulacoes();
      // Também escondemos o resultado atual da simulação, se quiser:
      const container = document.getElementById("resultado-simulacao");
      if (container) container.classList.add("hidden");
    }
  });
}