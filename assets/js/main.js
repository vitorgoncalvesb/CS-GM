// main.js

const ORCAMENTO_INICIAL = 1200000; // Orçamento inicial: 1200k

// Inicializa o orçamento no localStorage se não existir
function inicializarOrcamento() {
  if (!localStorage.getItem("orcamento")) {
    localStorage.setItem("orcamento", ORCAMENTO_INICIAL);
  }
}

// Recupera o orçamento atual (número)
function getOrcamento() {
  return Number(localStorage.getItem("orcamento")) || 0;
}

// Atualiza o orçamento no localStorage
function setOrcamento(valor) {
  localStorage.setItem("orcamento", valor);
}

// Atualiza o display do orçamento na tela
function atualizarOrcamentoDisplay() {
  const display = document.querySelector("#orcamento-display");
  if (!display) return;

  const orcamento = getOrcamento();
  display.textContent = `Orçamento atual: $${orcamento.toLocaleString()}`;
}

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
// --- CALCULAR RATING ---
// Função para calcular rating ponderado
function calcularRating(jogador) {
  // Normaliza cada atributo para 0-1
  function norm(val) {
    return Math.max(0, Math.min(1, (val - 60) / 40)); // Assume atributos entre 60 e 100
  }

  const pesos = PESOS_ATRIBUTOS[jogador.funcao] || PESOS_ATRIBUTOS.Duelista;

  // Rating base pelos atributos principais
  let ratingBase =
    norm(jogador.mira) * pesos.mira +
    norm(jogador.clutch) * pesos.clutch +
    norm(jogador.suporte) * pesos.suporte +
    norm(jogador.hs) * pesos.hs +
    norm(jogador.movimentacao) * pesos.movimentacao +
    norm(jogador.agressividade) * pesos.agressividade;

  // Se houver estatísticas recentes, bonifica o rating
  let bonus = 0;
  if (jogador.stats && jogador.stats.kd) {
    bonus += Math.max(
      0,
      Math.min(0.15, (parseFloat(jogador.stats.kd) - 1) * 0.1)
    );
  }
  if (jogador.stats && jogador.stats.kills) {
    bonus += Math.max(
      0,
      Math.min(0.1, (parseInt(jogador.stats.kills) - 10) * 0.01)
    );
  }

  // Rating final entre RATING_MIN e RATING_MAX
  let ratingFinal =
    RATING_MIN + (RATING_MAX - RATING_MIN) * (ratingBase + bonus);
  ratingFinal = Math.max(
    RATING_MIN,
    Math.min(RATING_MAX, Math.round(ratingFinal))
  );

  return ratingFinal;
}

const RATING_MIN = 40; // Jogador muito ruim
const RATING_MAX = 95; // Jogador excepcional
const RATING_IMPACT = 0.015; // Quanto cada ponto de rating afeta a performance

// --- ELENCO ---

// Renderiza lista de jogadores contratados (elenco)
function renderElenco() {
  const list = document.querySelector("#player-list");
  if (!list) return;

  const jogadores = JSON.parse(localStorage.getItem("elenco")) || [];
  let titulares = JSON.parse(localStorage.getItem("titulares")) || [];

  // Remove titulares que não estão mais no elenco
  titulares = titulares.filter((nome) =>
    jogadores.some((j) => j.nome === nome)
  );

  // Se titulares não estiverem definidos, define os 5 primeiros
  if (titulares.length === 0 && jogadores.length > 0) {
    titulares = jogadores.slice(0, 5).map((j) => j.nome);
    localStorage.setItem("titulares", JSON.stringify(titulares));
  } else {
    localStorage.setItem("titulares", JSON.stringify(titulares));
  }

  list.innerHTML = `
    <h3 class="font-bold mb-2">Titulares</h3>
    <div id="titulares-list" class="flex flex-col gap-2 mb-4"></div>
    <h3 class="font-bold mb-2">Banco</h3>
    <div id="banco-list" class="flex flex-col gap-2"></div>
  `;

  const titularesList = list.querySelector("#titulares-list");
  const bancoList = list.querySelector("#banco-list");

  jogadores.forEach((jogador, index) => {
    const isTitular = titulares.includes(jogador.nome);
    const div = document.createElement("div");
    div.className =
      "bg-white border rounded p-4 flex justify-between items-center";
    div.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="bg-gray-700 rounded-lg p-1">
          <img class="mb-11.5 h-12 dark:hidden" src="assets/img/${
            jogador.nome
          }.png" alt="">
        </div>
        <strong>${jogador.nome}</strong> 
        <span title="Rating" class="text-blue-600 font-medium tooltip">${
          jogador.rating
        }</span>
        <div title="Função" class="tooltip">(${
          jogador.funcao
        })</div>- <div title="Idade" class="tooltip">${
      jogador.idade || "?"
    } anos </div> 
        <div class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">${
          jogador.stats || "Sem estatísticas"
        }</div>
      </div>
      <div class="flex flex-col items-end gap-2">
        <button data-index="${index}" class="liberar-btn bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Liberar</button>
        <button data-index="${index}" class="mover-btn bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
          ${isTitular ? "Colocar no banco" : "Colocar como titular"}
        </button>
      </div>
    `;
    if (isTitular) {
      titularesList.appendChild(div);
    } else {
      bancoList.appendChild(div);
    }
  });

  // Evento para liberar jogador do elenco
  list.querySelectorAll(".liberar-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index);
      // Remove do array de titulares se estiver
      let jogadores = JSON.parse(localStorage.getItem("elenco")) || [];
      let titulares = JSON.parse(localStorage.getItem("titulares")) || [];
      const jogador = jogadores[idx];
      if (!jogador) return;
      titulares = titulares.filter((n) => n !== jogador.nome);
      localStorage.setItem("titulares", JSON.stringify(titulares));
      liberarJogador(idx);
    });
  });

  // Evento para mover jogador entre titular e banco
  list.querySelectorAll(".mover-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index);
      const jogadores = JSON.parse(localStorage.getItem("elenco")) || [];
      let titulares = JSON.parse(localStorage.getItem("titulares")) || [];
      const jogador = jogadores[idx];
      if (!jogador) return;

      if (titulares.includes(jogador.nome)) {
        // Confirmação antes de mover para o banco
        if (
          !window.confirm(
            `Tem certeza que deseja colocar ${jogador.nome} no banco?`
          )
        ) {
          return;
        }
        // Remover dos titulares
        titulares = titulares.filter((n) => n !== jogador.nome);
        localStorage.setItem("titulares", JSON.stringify(titulares));
      } else {
        // Adicionar aos titulares (máx 5)
        if (titulares.length >= 5) {
          alert("Só é possível ter 5 titulares!");
          return;
        }
        titulares.push(jogador.nome);
        localStorage.setItem("titulares", JSON.stringify(titulares));
      }
      renderElenco();
    });
  });
}

// Adiciona jogador ao elenco no localStorage (agora retorna true/false)
function contratarJogador(jogador) {
  let elenco = JSON.parse(localStorage.getItem("elenco")) || [];

  // Limite de 7 jogadores
  if (elenco.length >= 7) {
    // Não contratar e retornar false
    alert(
      "Você já tem 7 jogadores no seu time. Não é possível contratar mais."
    );
    return false;
  }

  // Calcula rating e preço (padroniza aqui)
  jogador.rating = calcularRating(jogador);
  jogador.preco =
    jogador.preco || Math.round(jogador.rating ** 2 * 100 + 50000);

  // Adiciona ao elenco e salva
  elenco.push(jogador);
  localStorage.setItem("elenco", JSON.stringify(elenco));

  // Atualiza UI do elenco imediatamente
  renderElenco();

  return true;
}

// Remove jogador do elenco, adiciona ao mercado e reembolsa orçamento
function liberarJogador(index) {
  let elenco = JSON.parse(localStorage.getItem("elenco")) || [];
  let mercado = JSON.parse(localStorage.getItem("mercado")) || [];

  const jogador = elenco[index];
  if (!jogador) return;

  elenco.splice(index, 1);
  mercado.push(jogador);

  const orcamentoAtual = getOrcamento();
  setOrcamento(orcamentoAtual + jogador.preco);

  localStorage.setItem("elenco", JSON.stringify(elenco));
  localStorage.setItem("mercado", JSON.stringify(mercado));

  alert(
    `Você liberou ${jogador.nome} e ele voltou para o mercado. Orçamento reembolsado!`
  );
  renderElenco();
  atualizarOrcamentoDisplay();
}

// --- MERCADO ---

// Salva mercado no localStorage
function salvarMercado() {
  localStorage.setItem("mercado", JSON.stringify(jogadoresMercado));
}

// Renderiza lista do mercado (jogadores disponíveis para contratação)
function renderMercado() {
  const mercado = document.querySelector("#mercado-lista");
  if (!mercado) return;

  mercado.innerHTML = "";
  jogadoresMercado.forEach((jogador, i) => {
    const div = document.createElement("div");
    div.className =
      "mercado-jogador bg-white border p-4 flex justify-between items-center";

    div.dataset.index = i; // Adiciona o índice como data attribute ao div pai

    div.innerHTML = `
      <div class="w-3/4">
        <div class="flex items-center gap-2">
        <div class="bg-gray-700 rounded-md p-1">
          <img class="mb-11.5 h-12 dark:hidden" src="assets/img/${
            jogador.nome
          }.png" alt="">
        </div>  
          <strong>${jogador.nome}</strong> 
          <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">${
            jogador.funcao
          }</span>
          <span class="text-blue-600 font-medium">${jogador.rating}</span>
        </div>
        <div class="grid grid-cols-3 gap-3 mt-2 text-xs">
          <div title="Mira" class="tooltip">🔫 ${jogador.mira}</div>
          <div title="Clutch" class="tooltip">💪 ${jogador.clutch}</div>
          <div title="Suporte" class="tooltip">🛡️ ${jogador.suporte}</div>
          <div title="Headshot" class="tooltip">🎯 ${jogador.hs}</div>
          <div title="Movimentação" class="tooltip">🏃 ${
            jogador.movimentacao
          }</div>
          <div title="Agressividade" class="tooltip">🔥 ${
            jogador.agressividade
          }</div>
        </div>
      </div>
      <button class="contratar-btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition">
        $${jogador.preco.toLocaleString()}
      </button>
    `;
    mercado.appendChild(div);
  });

  // Adiciona o event listener DELEGADO ao container principal
  mercado.addEventListener("click", handleContratarClick);
}

// Evento para contratar jogador do mercado, descontando do orçamento
function handleContratarClick(e) {
  const btn = e.target.closest(".contratar-btn");
  if (!btn) return;

  const jogadorDiv = btn.closest(".mercado-jogador");
  if (!jogadorDiv) {
    console.error("Elemento do jogador não encontrado!");
    return;
  }

  const index = parseInt(jogadorDiv.dataset.index, 10);
  const jogador = jogadoresMercado[index];
  if (!jogador) {
    console.error(
      "Jogador não encontrado no array jogadoresMercado (index inválido)."
    );
    return;
  }

  const orcamentoAtual = getOrcamento();
  const precoJogador = Number(jogador.preco);

  if (precoJogador > orcamentoAtual) {
    alert("Orçamento insuficiente para contratar este jogador!");
    return;
  }

  // Primeiro tentamos contratar (verifica limite de 7 dentro da função)
  const contratado = contratarJogador(jogador);
  if (!contratado) {
    // contratarJogador já mostrou alerta apropriado; não prosseguimos
    return;
  }

  // Só agora atualizamos orçamento e removemos do mercado
  setOrcamento(orcamentoAtual - precoJogador);

  // Remover do array de mercado e salvar
  jogadoresMercado.splice(index, 1);
  salvarMercado();

  alert(
    `Você contratou ${
      jogador.nome
    } por $${precoJogador.toLocaleString()}! Orçamento restante: $${getOrcamento().toLocaleString()}`
  );

  // Atualiza UI do mercado e orçamento
  renderMercado();
  atualizarOrcamentoDisplay();
}

// --- Função para resetar todos os dados (localStorage) ---
function resetarDados() {
  localStorage.clear();
  location.reload();
}

// --- HISTÓRICO DE SIMULAÇÕES ---
function renderHistoricoSimulacoes() {
  // Implementação para renderizar histórico de simulações
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

// Função que limita o K/D por player
function calcularKDlimitado(kills, deaths) {
  deaths = Math.max(1, deaths);
  const kdBruto = kills / deaths;
  // Novo limite mais realista
  return Math.max(0.5, Math.min(kdBruto, 3.5));
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
