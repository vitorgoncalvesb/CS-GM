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
  const pesos = PESOS_ATRIBUTOS[jogador.funcao] || PESOS_ATRIBUTOS.Duelista;

  return Math.round(
    (jogador.mira * pesos.mira +
      jogador.clutch * pesos.clutch +
      jogador.suporte * pesos.suporte +
      jogador.hs * pesos.hs +
      jogador.movimentacao * pesos.movimentacao +
      jogador.agressividade * pesos.agressividade)
  );
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

  list.innerHTML = "";

  if (jogadores.length === 0) {
    list.innerHTML = "<p>Nenhum jogador contratado ainda.</p>";
    return;
  }

  jogadores.forEach((jogador, index) => {
    const div = document.createElement("div");
    div.className =
      "bg-white border rounded p-4 flex justify-between items-center";
    div.innerHTML = `
      <div class="flex items-center gap-2">
        <img class="mb-11.5 h-12 dark:hidden" src="assets/img/${jogador.nome}.png" alt="">
        <strong>${jogador.nome}</strong> 
        <span title="Rating" class="text-blue-600 font-medium tooltip">${jogador.rating}</span>
        <div title="Função" class="tooltip">(${jogador.funcao})</div>- <div title="Idade" class="tooltip">${jogador.idade || "?"} anos </div> 
        <div class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded"">${jogador.stats || "Sem estatísticas"}</div>
      </div>
      <div class="flex flex-col items-end gap-2">
        <button data-index="${index}" class="liberar-btn bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Liberar</button>
      </div>
    `;
    list.appendChild(div);
  });

  // Evento para mostrar/esconder detalhes do jogador
  document.querySelectorAll(".toggle-details").forEach((btn) => {
    btn.addEventListener("click", () => {
      const detail = btn.closest("div").querySelector("div.text-sm");
      if (detail) detail.classList.toggle("hidden");
    });
  });

  // Evento para liberar jogador do elenco (devolver ao mercado)
  document.querySelectorAll(".liberar-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index);
      liberarJogador(idx);
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
          <img class="mb-11.5 h-12 dark:hidden" src="assets/img/${jogador.nome}.png" alt="">
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
