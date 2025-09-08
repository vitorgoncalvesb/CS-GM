// main.js

// Evento disparado quando DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  if (!checarSelecaoTime()) return;

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
  renderCalendario();
  renderClassificacao();
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
  if (confirm("Tem certeza que deseja resetar todos os dados? Isso apagará apenas a carreira ativa, mas não suas carreiras salvas.")) {
    // Limpa apenas a carreira ativa, não as carreiras salvas
    localStorage.removeItem("carreiraAtiva");
    localStorage.removeItem("timeSelecionado");
    localStorage.removeItem("elenco");
    localStorage.removeItem("mercado");
    // Adicione aqui outras chaves específicas da carreira ativa, se necessário
    location.reload();
  }
}

// --- PESOS DOS ATRIBUTOS ---
const PESOS_ATRIBUTOS = {
  AWPer: {
    mira: 0.25,
    clutch: 0.25,
    suporte: 0.1,
    hs: 0.2,
    movimentacao: 0.15,
    agressividade: 0.15,
  },
  Rifler: {
    mira: 0.2,
    clutch: 0.15,
    suporte: 0.3,
    hs: 0.2,
    movimentacao: 0.15,
    agressividade: 0.2,
  },
  IGL: {
    mira: 0.2,
    clutch: 0.2,
    suporte: 0.25,
    hs: 0.15,
    movimentacao: 0.1,
    agressividade: 0.1,
  },
};

// LISTA DE JOGADORES DO MERCADO
let jogadoresMercado = JSON.parse(localStorage.getItem("mercado")) || [
  {
    nome: "aspas",
    funcao: "AWPer",
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
    nome: "Snax",
    funcao: "IGL",
    idade: 31,
    mira: 92,
    clutch: 90,
    suporte: 85,
    hs: 91,
    movimentacao: 88,
    agressividade: 89,
    preco: 140000,
  },
  {
    nome: "Cxzi",
    funcao: "Rifler",
    idade: 25,
    mira: 90,
    clutch: 87,
    suporte: 82,
    hs: 88,
    movimentacao: 90,
    agressividade: 91,
    preco: 125000,
  },
  {
    nome: "deem0",
    funcao: "Rifler",
    idade: 24,
    mira: 88,
    clutch: 85,
    suporte: 80,
    hs: 87,
    movimentacao: 89,
    agressividade: 90,
    preco: 110000,
  },
  {
    nome: "roman",
    funcao: "IGL",
    idade: 33,
    mira: 91,
    clutch: 86,
    suporte: 84,
    hs: 90,
    movimentacao: 88,
    agressividade: 85,
    preco: 105000,
  },
  {
    nome: "Liazz",
    funcao: "Rifler",
    idade: 24,
    mira: 89,
    clutch: 84,
    suporte: 82,
    hs: 88,
    movimentacao: 87,
    agressividade: 86,
    preco: 100000,
  },
  {
    nome: "dupreeh",
    funcao: "Rifler",
    idade: 30,
    mira: 91,
    clutch: 88,
    suporte: 85,
    hs: 89,
    movimentacao: 87,
    agressividade: 88,
    preco: 135000,
  },
  {
    nome: "maNkz",
    funcao: "Rifler",
    idade: 23,
    mira: 90,
    clutch: 86,
    suporte: 83,
    hs: 87,
    movimentacao: 88,
    agressividade: 89,
    preco: 120000,
  },
  {
    nome: "dexter",
    funcao: "IGL",
    idade: 27,
    mira: 88,
    clutch: 90,
    suporte: 92,
    hs: 85,
    movimentacao: 89,
    agressividade: 84,
    preco: 120000,
  }
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
    case "AWPer":
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
      case "AWPer":
        killBonus += 2;
        deathBonus += 1;
        break;
      case "Rifler":
        deathBonus -= 1;
        assistBonus += 1;
        break;
      case "IGL":
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

// --- TIMES DISPONÍVEIS ---
const TIMES_DISPONIVEIS = [
  "Vitality",
  "Spirit",
  "The MongolZ",
  "MOUZ",
  "FURIA",
  "Aurora",
  "Natus Vincere",
  "Falcons",
  "Faze",
  "Pain",
];

// --- JOGADORES POR TIME ---
const JOGADORES_POR_TIME = {
  "Vitality": [
    { nome: "ZywOo", funcao: "AWPer", idade: 24, mira: 99, clutch: 95, suporte: 85, hs: 97, movimentacao: 96, agressividade: 90, preco: 200000 },
    { nome: "apEX", funcao: "IGL", idade: 33, mira: 85, clutch: 88, suporte: 95, hs: 84, movimentacao: 86, agressividade: 85, preco: 120000 },
    { nome: "flameZ", funcao: "Rifler", idade: 22, mira: 93, clutch: 90, suporte: 82, hs: 92, movimentacao: 94, agressividade: 92, preco: 145000 },
    { nome: "mezii", funcao: "Rifler", idade: 27, mira: 90, clutch: 89, suporte: 88, hs: 88, movimentacao: 90, agressividade: 86, preco: 125000 },
    { nome: "ropz", funcao: "Rifler", idade: 25, mira: 95, clutch: 93, suporte: 84, hs: 94, movimentacao: 94, agressividade: 88, preco: 170000 }
  ],
  "Spirit": [
    { nome: "sh1ro", funcao: "AWPer", idade: 24, mira: 94, clutch: 93, suporte: 85, hs: 92, movimentacao: 92, agressividade: 80, preco: 150000 },
    { nome: "chopper", funcao: "IGL", idade: 28, mira: 86, clutch: 90, suporte: 94, hs: 84, movimentacao: 86, agressividade: 82, preco: 115000 },
    { nome: "donk", funcao: "Rifler", idade: 18, mira: 98, clutch: 92, suporte: 72, hs: 97, movimentacao: 96, agressividade: 97, preco: 180000 },
    { nome: "zont1x", funcao: "Rifler", idade: 21, mira: 89, clutch: 88, suporte: 87, hs: 86, movimentacao: 88, agressividade: 83, preco: 120000 },
    { nome: "zweih", funcao: "Rifler", idade: 19, mira: 86, clutch: 84, suporte: 85, hs: 83, movimentacao: 86, agressividade: 82, preco: 100000 }
  ],
  "The MongolZ": [
    { nome: "910", funcao: "AWPer", idade: 23, mira: 91, clutch: 90, suporte: 78, hs: 89, movimentacao: 91, agressividade: 88, preco: 130000 },
    { nome: "bLitz", funcao: "IGL", idade: 26, mira: 88, clutch: 88, suporte: 90, hs: 86, movimentacao: 88, agressividade: 85, preco: 120000 },
    { nome: "Techno4k", funcao: "Rifler", idade: 21, mira: 90, clutch: 87, suporte: 84, hs: 89, movimentacao: 90, agressividade: 90, preco: 120000 },
    { nome: "Senzu", funcao: "Rifler", idade: 20, mira: 87, clutch: 86, suporte: 86, hs: 85, movimentacao: 86, agressividade: 82, preco: 105000 },
    { nome: "mzinho", funcao: "Rifler", idade: 19, mira: 86, clutch: 84, suporte: 85, hs: 83, movimentacao: 86, agressividade: 83, preco: 100000 }
  ],
  "MOUZ": [
    { nome: "torzsi", funcao: "AWPer", idade: 23, mira: 92, clutch: 89, suporte: 82, hs: 90, movimentacao: 91, agressividade: 86, preco: 135000 },
    { nome: "xertioN", funcao: "Rifler", idade: 21, mira: 89, clutch: 88, suporte: 90, hs: 88, movimentacao: 90, agressividade: 87, preco: 125000 },
    { nome: "Spinx", funcao: "Rifler", idade: 25, mira: 93, clutch: 90, suporte: 84, hs: 92, movimentacao: 92, agressividade: 89, preco: 155000 },
    { nome: "Jimpphat", funcao: "Rifler", idade: 19, mira: 89, clutch: 87, suporte: 86, hs: 86, movimentacao: 88, agressividade: 84, preco: 115000 },
    { nome: "Brollan", funcao: "IGL", idade: 23, mira: 90, clutch: 88, suporte: 85, hs: 89, movimentacao: 90, agressividade: 86, preco: 130000 }
  ],
  "FURIA": [
    { nome: "FalleN", funcao: "IGL", idade: 34, mira: 90, clutch: 92, suporte: 94, hs: 85, movimentacao: 84, agressividade: 78, preco: 130000 },
    { nome: "yuurih", funcao: "Rifler", idade: 26, mira: 92, clutch: 89, suporte: 90, hs: 90, movimentacao: 90, agressividade: 86, preco: 145000 },
    { nome: "YEKINDAR", funcao: "Rifler", idade: 26, mira: 93, clutch: 88, suporte: 80, hs: 91, movimentacao: 92, agressividade: 93, preco: 150000 },
    { nome: "KSCERATO", funcao: "Rifler", idade: 26, mira: 93, clutch: 90, suporte: 88, hs: 90, movimentacao: 91, agressividade: 88, preco: 150000 },
    { nome: "molodoy", funcao: "AWPer", idade: 19, mira: 86, clutch: 84, suporte: 86, hs: 84, movimentacao: 86, agressividade: 82, preco: 100000 }
  ],
  "Aurora": [
    { nome: "woxic", funcao: "AWPer", idade: 27, mira: 92, clutch: 89, suporte: 82, hs: 90, movimentacao: 90, agressividade: 86, preco: 135000 },
    { nome: "MAJ3R", funcao: "IGL", idade: 34, mira: 85, clutch: 88, suporte: 92, hs: 83, movimentacao: 84, agressividade: 80, preco: 110000 },
    { nome: "XANTARES", funcao: "Rifler", idade: 30, mira: 96, clutch: 90, suporte: 80, hs: 95, movimentacao: 93, agressividade: 92, preco: 165000 },
    { nome: "Wicadia", funcao: "Rifler", idade: 19, mira: 90, clutch: 86, suporte: 84, hs: 88, movimentacao: 90, agressividade: 88, preco: 120000 },
    { nome: "jottAAA", funcao: "Rifler", idade: 21, mira: 87, clutch: 84, suporte: 85, hs: 85, movimentacao: 86, agressividade: 83, preco: 105000 }
  ],
  "Natus Vincere": [
    { nome: "w0nderful", funcao: "AWPer", idade: 21, mira: 92, clutch: 90, suporte: 82, hs: 90, movimentacao: 90, agressividade: 84, preco: 140000 },
    { nome: "Aleksib", funcao: "IGL", idade: 28, mira: 86, clutch: 90, suporte: 96, hs: 82, movimentacao: 84, agressividade: 78, preco: 120000 },
    { nome: "iM", funcao: "Rifler", idade: 26, mira: 92, clutch: 88, suporte: 82, hs: 91, movimentacao: 92, agressividade: 90, preco: 145000 },
    { nome: "b1t", funcao: "Rifler", idade: 22, mira: 92, clutch: 88, suporte: 86, hs: 92, movimentacao: 90, agressividade: 86, preco: 150000 },
    { nome: "makazze", funcao: "Rifler", idade: 18, mira: 87, clutch: 84, suporte: 85, hs: 85, movimentacao: 87, agressividade: 84, preco: 100000 }
  ],
  "Falcons": [
    { nome: "m0NESY", funcao: "AWPer", idade: 20, mira: 97, clutch: 92, suporte: 78, hs: 95, movimentacao: 95, agressividade: 92, preco: 185000 },
    { nome: "kyxsan", funcao: "IGL", idade: 26, mira: 87, clutch: 88, suporte: 92, hs: 84, movimentacao: 86, agressividade: 82, preco: 115000 },
    { nome: "NiKo", funcao: "Rifler", idade: 28, mira: 98, clutch: 92, suporte: 82, hs: 96, movimentacao: 95, agressividade: 92, preco: 190000 },
    { nome: "TeSeS", funcao: "Rifler", idade: 25, mira: 90, clutch: 88, suporte: 87, hs: 88, movimentacao: 89, agressividade: 85, preco: 135000 },
    { nome: "kyousuke", funcao: "Rifler", idade: 21, mira: 86, clutch: 84, suporte: 85, hs: 84, movimentacao: 86, agressividade: 83, preco: 100000 }
  ],
  "Faze": [
    { nome: "broky", funcao: "AWPer", idade: 25, mira: 94, clutch: 90, suporte: 82, hs: 92, movimentacao: 92, agressividade: 86, preco: 150000 },
    { nome: "karrigan", funcao: "IGL", idade: 35, mira: 84, clutch: 90, suporte: 96, hs: 82, movimentacao: 82, agressividade: 78, preco: 115000 },
    { nome: "frozen", funcao: "Rifler", idade: 23, mira: 94, clutch: 90, suporte: 82, hs: 93, movimentacao: 94, agressividade: 90, preco: 160000 },
    { nome: "rain", funcao: "Rifler", idade: 31, mira: 91, clutch: 89, suporte: 86, hs: 90, movimentacao: 90, agressividade: 86, preco: 140000 },
    { nome: "jcobbb", funcao: "Rifler", idade: 19, mira: 88, clutch: 85, suporte: 85, hs: 86, movimentacao: 88, agressividade: 86, preco: 110000 }
  ],
  "Pain": [
    { nome: "nqz", funcao: "AWPer", idade: 20, mira: 90, clutch: 88, suporte: 82, hs: 89, movimentacao: 90, agressividade: 86, preco: 125000 },
    { nome: "biguzera", funcao: "IGL", idade: 30, mira: 88, clutch: 88, suporte: 92, hs: 85, movimentacao: 86, agressividade: 82, preco: 120000 },
    { nome: "dgt", funcao: "Rifler", idade: 22, mira: 91, clutch: 88, suporte: 82, hs: 90, movimentacao: 91, agressividade: 90, preco: 135000 },
    { nome: "snow", funcao: "Rifler", idade: 21, mira: 87, clutch: 85, suporte: 86, hs: 85, movimentacao: 86, agressividade: 84, preco: 105000 },
    { nome: "dav1deuS", funcao: "Rifler", idade: 22, mira: 88, clutch: 86, suporte: 86, hs: 86, movimentacao: 87, agressividade: 84, preco: 110000 }
  ]
};


// --- SISTEMA DE MÚLTIPLAS CARREIRAS ---
function getCarreiras() {
  return JSON.parse(localStorage.getItem("carreiras") || "[]");
}
function setCarreiras(carreiras) {
  localStorage.setItem("carreiras", JSON.stringify(carreiras));
}
function salvarCarreiraAtual(nome) {
  // Salva o progresso atual sob o nome fornecido
  const save = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k === "carreiras") continue;
    try {
      save[k] = JSON.parse(localStorage.getItem(k));
    } catch {
      save[k] = localStorage.getItem(k);
    }
  }
  let carreiras = getCarreiras();
  const idx = carreiras.findIndex(c => c.nome === nome);
  if (idx >= 0) {
    carreiras[idx].save = save;
    carreiras[idx].lastPlayed = Date.now();
  } else {
    carreiras.push({ nome, save, lastPlayed: Date.now() });
  }
  setCarreiras(carreiras);
}
function carregarCarreira(nome) {
  const carreiras = getCarreiras();
  const carreira = carreiras.find(c => c.nome === nome);
  if (!carreira) return false;
  // Limpa localStorage (exceto carreiras)
  Object.keys(localStorage).forEach(k => { if (k !== "carreiras") localStorage.removeItem(k); });
  // Restaura save
  Object.keys(carreira.save).forEach(k => localStorage.setItem(k, JSON.stringify(carreira.save[k])));
  localStorage.setItem("carreiraAtiva", nome);
  location.reload();
  return true;
}
function getCarreiraAtiva() {
  return localStorage.getItem("carreiraAtiva") || "";
}

// --- MODAL INICIAL COM MÚLTIPLAS CARREIRAS ---
function mostrarModalInicial() {
  if (document.getElementById("modal-overlay-inicio")) return;
  const overlay = document.createElement("div");
  overlay.id = "modal-overlay-inicio";
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.85)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = 10000;

  const modal = document.createElement("div");
  modal.style.background = "#fff";
  modal.style.padding = "40px 32px";
  modal.style.borderRadius = "16px";
  modal.style.boxShadow = "0 4px 32px rgba(0,0,0,0.25)";
  modal.style.textAlign = "center";
  modal.style.minWidth = "340px";
  modal.innerHTML = `
    <h2 class="font-bold text-2xl mb-6">Bem-vindo ao Counter Strike GM</h2>
    <p class="mb-4 text-gray-700">Escolha uma opção para começar sua jornada:</p>
    <div class="flex flex-col gap-4 mb-4">
      <button id="btn-nova-carreira" class="bg-blue-600 text-white py-3 px-6 rounded font-semibold hover:bg-blue-700 transition">Nova Carreira</button>
      <button id="btn-carregar-carreira" class="bg-green-600 text-white py-3 px-6 rounded font-semibold hover:bg-green-700 transition">Carregar Carreira</button>
      <input type="file" id="input-carregar-save" accept=".json" class="hidden" />
    </div>
    <div class="mt-2 mb-2 flex flex-col gap-2">
      <button id="btn-salvar-carreira" class="bg-yellow-400 text-gray-800 py-2 px-4 rounded font-semibold hover:bg-yellow-500 transition">Salvar carreira ativa</button>
      <button id="btn-exportar-carreira" class="bg-gray-200 text-gray-700 py-2 px-4 rounded font-semibold hover:bg-gray-300 transition">Exportar Carreira Atual</button>
    </div>
    <div id="lista-carreiras" class="mt-6"></div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Nova carreira
  modal.querySelector("#btn-nova-carreira").onclick = () => {
    // Pergunta nome da carreira
    let nome = prompt("Digite um nome para sua nova carreira:");
    if (!nome) return;
    nome = nome.trim();
    if (!nome) return;
    let carreiras = getCarreiras();
    if (carreiras.some(c => c.nome === nome)) {
      alert("Já existe uma carreira com esse nome.");
      return;
    }
    // Limpa localStorage (exceto carreiras)
    Object.keys(localStorage).forEach(k => { if (k !== "carreiras") localStorage.removeItem(k); });
    localStorage.setItem("carreiraAtiva", nome);
    document.body.removeChild(overlay);
    mostrarModalSelecaoTime();
  };

  // Carregar carreira: mostra/oculta a lista de carreiras
  modal.querySelector("#btn-carregar-carreira").onclick = () => {
    const lista = modal.querySelector("#lista-carreiras");
    if (lista.style.display === "block") {
      lista.style.display = "none";
    } else {
      renderListaCarreiras(lista);
      lista.style.display = "block";
    }
  };

  // Salvar carreira ativa manualmente
  modal.querySelector("#btn-salvar-carreira").onclick = () => {
    const nome = getCarreiraAtiva();
    if (!nome) {
      alert("Nenhuma carreira ativa para salvar.");
      return;
    }
    salvarCarreiraAtual(nome);
    alert("Carreira salva com sucesso!");
    renderListaCarreiras(modal.querySelector("#lista-carreiras"));
  };

  // Importar save externo
  modal.querySelector("#input-carregar-save").onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const data = JSON.parse(evt.target.result);
        if (!data.nome || !data.save) throw "Save inválido";
        let carreiras = getCarreiras();
        if (carreiras.some(c => c.nome === data.nome)) {
          if (!confirm("Já existe uma carreira com esse nome. Sobrescrever?")) return;
          carreiras = carreiras.filter(c => c.nome !== data.nome);
        }
        carreiras.push({ nome: data.nome, save: data.save, lastPlayed: Date.now() });
        setCarreiras(carreiras);
        alert("Carreira importada com sucesso!");
        renderListaCarreiras(modal.querySelector("#lista-carreiras"));
      } catch {
        alert("Arquivo de save inválido.");
      }
    };
    reader.readAsText(file);
  };

  // Exportar carreira ativa
  modal.querySelector("#btn-exportar-carreira").onclick = () => {
    const nome = getCarreiraAtiva();
    if (!nome) {
      alert("Nenhuma carreira ativa para exportar.");
      return;
    }
    salvarCarreiraAtual(nome);
    const carreiras = getCarreiras();
    const carreira = carreiras.find(c => c.nome === nome);
    if (!carreira) {
      alert("Carreira não encontrada.");
      return;
    }
    const blob = new Blob([JSON.stringify({ nome: carreira.nome, save: carreira.save }, null, 2)], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cs-gm-save-${carreira.nome}.json`;
    a.click();
  };

  // Lista de carreiras salvas (inicialmente oculta)
  const listaCarreiras = modal.querySelector("#lista-carreiras");
  listaCarreiras.style.display = "none";
}

// Renderiza lista de carreiras salvas
function renderListaCarreiras(container) {
  let carreiras = getCarreiras();
  if (!carreiras.length) {
    container.innerHTML = "<div class='text-gray-500 text-sm'>Nenhuma carreira salva.</div>";
    return;
  }
  container.innerHTML = "<div class='font-semibold mb-2'>Carreiras salvas:</div>";
  carreiras
    .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
    .forEach(c => {
      const div = document.createElement("div");
      div.className = "flex items-center justify-between bg-gray-100 rounded px-3 py-2 mb-2";
      div.innerHTML = `
        <span>${c.nome}${c.nome === getCarreiraAtiva() ? " <span class='text-xs text-blue-600'>(ativa)</span>" : ""}</span>
        <div>
          <button class="bg-blue-500 text-white px-2 py-1 rounded text-xs mr-2 hover:bg-blue-600" title="Jogar" data-jogar="${c.nome}">Jogar</button>
          <button class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600" title="Excluir" data-excluir="${c.nome}">Excluir</button>
        </div>
      `;
      container.appendChild(div);
    });
  // Eventos dos botões
  container.querySelectorAll("[data-jogar]").forEach(btn => {
    btn.onclick = () => {
      // Salva a carreira ativa antes de trocar
      const ativa = getCarreiraAtiva();
      if (ativa) salvarCarreiraAtual(ativa);
      carregarCarreira(btn.getAttribute("data-jogar"));
    };
  });
  container.querySelectorAll("[data-excluir]").forEach(btn => {
    btn.onclick = () => {
      if (!confirm("Deseja realmente excluir esta carreira?")) return;
      let carreiras = getCarreiras().filter(c => c.nome !== btn.getAttribute("data-excluir"));
      setCarreiras(carreiras);
      // Se excluiu a ativa, limpa do localStorage
      if (btn.getAttribute("data-excluir") === getCarreiraAtiva()) {
        localStorage.removeItem("carreiraAtiva");
        localStorage.removeItem("timeSelecionado");
        localStorage.removeItem("elenco");
        localStorage.removeItem("mercado");
      }
      renderListaCarreiras(container);
    };
  });
}

// --- Ao criar time, salva carreira automaticamente ---
function mostrarModalSelecaoTime() {
  if (document.getElementById("modal-overlay-time")) return;
  const overlay = document.createElement("div");
  overlay.id = "modal-overlay-time";
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.8)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = 10001;

  const modal = document.createElement("div");
  modal.style.background = "#fff";
  modal.style.padding = "36px 28px";
  modal.style.borderRadius = "16px";
  modal.style.boxShadow = "0 4px 32px rgba(0,0,0,0.25)";
  modal.style.textAlign = "center";
  modal.style.minWidth = "340px";
  modal.innerHTML = `<h2 class="font-bold text-xl mb-4">Escolha seu time inicial</h2>
    <div id="lista-times" style="display: flex; flex-wrap: wrap; gap: 18px; justify-content: center; margin-top: 18px;"></div>
    <button id="btn-cancelar-time" class="mt-8 bg-gray-200 text-gray-700 py-2 px-4 rounded font-semibold hover:bg-gray-300 transition">Cancelar</button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Adiciona botões dos times com logo
  const lista = modal.querySelector("#lista-times");
  TIMES_DISPONIVEIS.forEach((time) => {
    const btn = document.createElement("button");
    btn.style.display = "flex";
    btn.style.flexDirection = "column";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.width = "120px";
    btn.style.height = "120px";
    btn.style.padding = "10px";
    btn.style.borderRadius = "10px";
    btn.style.border = "2px solid #e5e7eb";
    btn.style.background = "#f9fafb";
    btn.style.cursor = "pointer";
    btn.style.transition = "all 0.2s";
    btn.onmouseover = () => (btn.style.background = "#e0e7ff");
    btn.onmouseout = () => (btn.style.background = "#f9fafb");

    // Logo fictício (adicione imagens reais se quiser)
    const logo = document.createElement("div");
    logo.className = "w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center";
    const img = document.createElement("img");
    img.src = `assets/img/team-logos/${time}.webp`;
    img.alt = `${time} logo`;
    img.className = "w-8 h-8 border-gray-300 object-cover";
    logo.appendChild(img);

    // Nome do time
    const nome = document.createElement("span");
    nome.textContent = time;
    nome.style.fontWeight = "bold";
    nome.style.fontSize = "1rem";
    nome.style.marginBottom = "2px";
    nome.style.whiteSpace = "nowrap";

    btn.appendChild(logo);
    btn.appendChild(nome);

    btn.onclick = () => {
      localStorage.setItem("timeSelecionado", time);

      // Define elenco inicial do time escolhido com rating realista e consistente
      let elenco = (JOGADORES_POR_TIME[time] || []).map(j => {
        let rating = calcularRating(j);
        return { ...j, rating };
      });
      localStorage.setItem("elenco", JSON.stringify(elenco));

      // Remove jogadores do elenco inicial do mercado para evitar duplicidade
      let mercado = jogadoresMercado.filter(j =>
        !elenco.some(e => e.nome === j.nome)
      );
      localStorage.setItem("mercado", JSON.stringify(mercado));

      // Salva carreira automaticamente
      const nomeCarreira = getCarreiraAtiva();
      if (nomeCarreira) salvarCarreiraAtual(nomeCarreira);

      document.body.removeChild(overlay);
      location.reload();
    };
    lista.appendChild(btn);
  });

  // Cancelar
  modal.querySelector("#btn-cancelar-time").onclick = () => {
    document.body.removeChild(overlay);
    mostrarModalInicial();
  };
}

window.mostrarModalSelecaoTime = mostrarModalSelecaoTime;
window.mostrarModalInicial = mostrarModalInicial;

// --- CHECA SE PRECISA SELECIONAR TIME OU MOSTRAR MODAL INICIAL ---
function checarSelecaoTime() {
  const isIndex =
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "/" ||
    window.location.pathname === "\\";

  // Se veio de saves.html para criar nova carreira, força seleção de time
  if (window.location.search.includes("newcareer=1")) {
    setTimeout(() => {
      mostrarModalSelecaoTime();
      // Remove o parâmetro da URL para evitar repetição
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }, 100);
    return true;
  }

  // Se não há carreira ativa, redireciona para saves.html e impede execução
  if (!localStorage.getItem("carreiraAtiva") || !localStorage.getItem("timeSelecionado")) {
    if (!window.location.pathname.endsWith("saves.html")) {
      window.location.replace("saves.html");
      return false;
    }
  }

  // Na index.html, mostra modal inicial se não houver time selecionado
  if (isIndex) {
    if (!localStorage.getItem("timeSelecionado")) {
      setTimeout(() => mostrarModalInicial(), 100);
    }
    return true;
  }

  return true;
}

function exportarDados() {
  modal.querySelector("#btn-salvar-config-carreira").onclick = () => {
    const lista = modal.querySelector("#lista-carreiras");
    if (lista.style.display === "block") {
      lista.style.display = "none";
    } else {
      renderListaCarreiras(lista);
      lista.style.display = "block";
    }
  };

  // Salvar carreira ativa manualmente 
  modal.querySelector("#btn-salvar-config-carreira").onclick = () => {
    const nome = getCarreiraAtiva();
    if (!nome) {
      alert("Nenhuma carreira ativa para salvar.");
      return;
    }
    salvarCarreiraAtual(nome);
    alert("Carreira salva com sucesso!");
    renderListaCarreiras(modal.querySelector("#lista-carreiras"));
  };
}