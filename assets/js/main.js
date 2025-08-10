// main.js

// Evento disparado quando DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  inicializarOrcamento();
  atualizarOrcamentoDisplay();

  // Destaca o link ativo do menu conforme a página atual
  const path = window.location.pathname;
  const links = document.querySelectorAll("nav a");

  links.forEach((link) => {
    if (link.href.includes(path.split("/").pop())) {
      link.classList.add("text-blue-600", "font-semibold");
    } else {
      link.classList.remove("text-blue-600", "font-semibold");
    }
  });

  // Renderiza elenco e mercado, se as páginas estiverem carregadas
  if (document.querySelector("#player-list")) {
    renderElenco();
  }

  if (document.querySelector("#mercado-lista")) {
    renderMercado();
  }

  renderHistoricoSimulacoes();
});

// Configuração do formulário para salvar configurações (alerta)
const configForm = document.querySelector("form");
if (configForm) {
  configForm.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Configurações salvas com sucesso!");
  });
}

// --- Função para resetar todos os dados (localStorage) ---
function resetarDados() {
  localStorage.clear();
  location.reload();
}

// --- PESOS DOS ATRIBUTOS ---
const PESOS_ATRIBUTOS = {
  Duelista: {
    mira: 0.25,
    clutch: 0.25,
    suporte: 0.1,
    hs: 0.2,
    movimentacao: 0.15,
    agressividade: 0.15,
  },
  Controlador: {
    mira: 0.2,
    clutch: 0.15,
    suporte: 0.3,
    hs: 0.1,
    movimentacao: 0.15,
    agressividade: 0.1,
  },
  Iniciador: {
    mira: 0.2,
    clutch: 0.2,
    suporte: 0.25,
    hs: 0.15,
    movimentacao: 0.1,
    agressividade: 0.1,
  },
  Sentinela: {
    mira: 0.25,
    clutch: 0.3,
    suporte: 0.2,
    hs: 0.1,
    movimentacao: 0.1,
    agressividade: 0.05,
  },
};

// LISTA DE JOGADORES DO MERCADO
let jogadoresMercado = JSON.parse(localStorage.getItem("mercado")) || [
  // Loud (BR)
  {
    nome: "aspas",
    funcao: "Duelista",
    idade: 23,
    mira: 97,
    clutch: 98,
    suporte: 65,
    hs: 93,
    movimentacao: 94,
    agressividade: 95,
    preco: 150000,
  },
  {
    nome: "Less",
    funcao: "Sentinela",
    idade: 20,
    mira: 92,
    clutch: 94,
    suporte: 85,
    hs: 89,
    movimentacao: 88,
    agressividade: 80,
    preco: 130000,
  },
  {
    nome: "cauanzin",
    funcao: "Iniciador",
    idade: 19,
    mira: 89,
    clutch: 90,
    suporte: 87,
    hs: 85,
    movimentacao: 93,
    agressividade: 86,
    preco: 125000,
  },

  // FURIA (BR)
  {
    nome: "qck",
    funcao: "Duelista",
    idade: 21,
    mira: 85,
    clutch: 88,
    suporte: 70,
    hs: 83,
    movimentacao: 91,
    agressividade: 89,
    preco: 110000,
  },
  {
    nome: "Khalil",
    funcao: "Controlador",
    idade: 27,
    mira: 87,
    clutch: 84,
    suporte: 92,
    hs: 78,
    movimentacao: 82,
    agressividade: 75,
    preco: 115000,
  },

  // EDG (China)
  {
    nome: "ZmjjKK",
    funcao: "Duelista",
    idade: 19,
    mira: 96,
    clutch: 97,
    suporte: 60,
    hs: 94,
    movimentacao: 95,
    agressividade: 97,
    preco: 180000,
  },

  // DRX (Coréia)
  {
    nome: "Zest",
    funcao: "Controlador",
    idade: 25,
    mira: 91,
    clutch: 89,
    suporte: 95,
    hs: 82,
    movimentacao: 85,
    agressividade: 70,
    preco: 140000,
  },

  // G2 (Europa)
  {
    nome: "leaf",
    funcao: "Duelista",
    idade: 20,
    mira: 94,
    clutch: 93,
    suporte: 75,
    hs: 90,
    movimentacao: 96,
    agressividade: 94,
    preco: 160000,
  },

  // Time fictício - Novos talentos
  {
    nome: "sh1n",
    funcao: "Sentinela",
    idade: 18,
    mira: 88,
    clutch: 85,
    suporte: 82,
    hs: 84,
    movimentacao: 83,
    agressividade: 70,
    preco: 90000,
  },
  {
    nome: "yurri",
    funcao: "Iniciador",
    idade: 17,
    mira: 86,
    clutch: 83,
    suporte: 88,
    hs: 80,
    movimentacao: 89,
    agressividade: 84,
    preco: 95000,
  },
];

// Garante que todos os jogadores tenham rating calculado
jogadoresMercado.forEach((jogador) => {
  if (typeof jogador.rating === "undefined") {
    jogador.rating = calcularRating(jogador);
  }
});
salvarMercado();

// --- SIMULAÇÃO DE PARTIDA ---

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

// Função para calcular rating médio do time
function calcularRatingTime() {
  const elenco = JSON.parse(localStorage.getItem("elenco")) || [];
  if (elenco.length === 0) return 0; // Retorna 0 se não houver elenco

  return (
    elenco.reduce((total, jogador) => {
      return total + (jogador.rating || calcularRating(jogador));
    }, 0) / elenco.length
  );
}

function gerarEstatisticasJogador(jogador, resultadoTime) {
  // Base para kills e deaths depende do rating e função
  const baseKills = 10 + (jogador.rating - 60) * 0.5;
  const baseDeaths = 10 - (jogador.rating - 60) * 0.2;
  const baseAssists = 3 + (jogador.suporte - 60) * 0.08;

  // Função influencia
  let killBonus = 0,
    deathBonus = 0,
    assistBonus = 0;
  switch (jogador.funcao) {
    case "Duelista":
      killBonus += 3;
      deathBonus += 1;
      break;
    case "Sentinela":
      deathBonus -= 2;
      assistBonus += 1;
      break;
    case "Controlador":
      assistBonus += 2;
      break;
    case "Iniciador":
      assistBonus += 2;
      break;
  }

  // Se o time venceu, melhora stats
  if (resultadoTime === "Vitória") {
    killBonus += 2;
    deathBonus -= 1;
  }

  // Randomização controlada
  const kills = Math.max(
    2,
    Math.round(baseKills + killBonus + Math.random() * 4 - 2)
  );
  const deaths = Math.max(
    1,
    Math.round(baseDeaths + deathBonus + Math.random() * 3 - 1)
  );
  const assists = Math.max(
    0,
    Math.round(baseAssists + assistBonus + Math.random() * 2)
  );

  // Calcula K/D limitado
  const kd = calcularKDlimitado(kills, deaths);

  return {
    nome: jogador.nome,
    funcao: jogador.funcao,
    kills,
    deaths,
    assists,
    kd: kd.toFixed(2),
    rating: jogador.rating,
  };
}

// Gera estatísticas sincronizadas com o placar
function gerarEstatisticasSincronizadas(
  titulares,
  roundsTime,
  roundsAdversario
) {
  // Estima kills totais do time: cada round vencido ~2 kills por jogador
  const totalRounds = roundsTime + roundsAdversario;
  const totalKillsTime =
    Math.round(roundsTime * 2.5 + roundsAdversario * 1.2) * titulares.length;
  const totalDeathsTime =
    Math.round(roundsAdversario * 2.2 + roundsTime * 1.1) * titulares.length;

  // Distribui kills/deaths proporcional ao rating e função
  let somaRating = titulares.reduce((s, j) => s + j.rating, 0);
  let killsDistribuidos = 0,
    deathsDistribuidos = 0;
  const stats = titulares.map((jogador) => {
    // Proporção de kills/deaths por rating
    const killShare = jogador.rating / somaRating;
    const deathShare = (100 - jogador.rating) / (titulares.length * 100);

    // Função influencia
    let killBonus = 0,
      deathBonus = 0,
      assistBonus = 0;
    switch (jogador.funcao) {
      case "Duelista":
        killBonus += 2;
        deathBonus += 1;
        break;
      case "Sentinela":
        deathBonus -= 1;
        assistBonus += 1;
        break;
      case "Controlador":
        assistBonus += 2;
        break;
      case "Iniciador":
        assistBonus += 2;
        break;
    }

    // Kills e deaths proporcionais + variação
    let kills = Math.round(
      (totalKillsTime * killShare) / titulares.length +
        killBonus +
        Math.random() * 3 -
        1.5
    );
    let deaths = Math.round(
      totalDeathsTime * deathShare + deathBonus + Math.random() * 2 - 1
    );
    let assists = Math.max(0, Math.round(3 + assistBonus + Math.random() * 3));

    kills = Math.max(2, kills);
    deaths = Math.max(1, deaths);

    killsDistribuidos += kills;
    deathsDistribuidos += deaths;

    return {
      nome: jogador.nome,
      funcao: jogador.funcao,
      kills,
      deaths,
      assists,
      kd: calcularKDlimitado(kills, deaths).toFixed(2),
      rating: jogador.rating,
    };
  });

  // Ajuste final para garantir que a soma dos kills não seja absurda
  // (opcional: pode balancear para que o total de kills seja próximo ao totalKillsTime)
  return stats;
}


