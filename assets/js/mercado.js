// --- TRANSFERÊNCIAS ENTRE TIMES DA IA E PROPOSTAS RECEBIDAS ---
let propostasRecebidas = JSON.parse(localStorage.getItem("propostasRecebidas") || "[]");
function salvarPropostasRecebidas() {
  localStorage.setItem("propostasRecebidas", JSON.stringify(propostasRecebidas));
}

// IA faz transferências e propostas a cada reload do mercado
function simularTransferenciasIA() {
  // 20% de chance de cada time IA tentar contratar um jogador livre
  const timesIA = TIMES_DISPONIVEIS.filter(t => t !== localStorage.getItem("timeSelecionado"));
  const livres = jogadoresMercado.filter(j => !j.time);
  timesIA.forEach(time => {
    if (Math.random() < 0.2 && livres.length) {
      const jogador = livres[Math.floor(Math.random() * livres.length)];
      // Contrata direto
      jogador.time = time;
      jogador.salario = jogador.salario || (8000 + Math.floor(Math.random()*8000));
    }
    // 10% de chance de tentar comprar jogador do usuário
    let elenco = JSON.parse(localStorage.getItem('elenco') || '[]');
    if (elenco.length && Math.random() < 0.1) {
      const jogador = elenco[Math.floor(Math.random() * elenco.length)];
      // IA faz proposta para o usuário
      propostasRecebidas.push({
        jogador: jogador.nome,
        de: time,
        para: localStorage.getItem("timeSelecionado"),
        valor: jogador.preco * (1.1 + Math.random()*0.3),
        salario: jogador.salario * (1.2 + Math.random()*0.2),
        status: "pendente",
        data: Date.now()
      });
      salvarPropostasRecebidas();
    }
  });
  salvarMercado();
}

// Exibir propostas recebidas
function renderPropostasRecebidas() {
  let container = document.getElementById("propostas-recebidas");
  if (!container) {
    container = document.createElement("div");
    container.id = "propostas-recebidas";
    container.className = "fixed top-0 left-0 m-4 bg-white border rounded shadow-lg p-4 w-80 z-50";
    document.body.appendChild(container);
  }
  container.innerHTML = `<h3 class='font-bold mb-2'>Propostas Recebidas</h3>`;
  if (!propostasRecebidas.length) {
    container.innerHTML += `<div class='text-gray-500 text-sm'>Nenhuma proposta recebida.</div>`;
    return;
  }
  propostasRecebidas.forEach((p, idx) => {
    container.innerHTML += `
      <div class='border-b py-2'>
        <div><b>${p.jogador}</b> (${p.de})</div>
        <div class='text-xs text-gray-600'>Oferta: $${Math.round(p.valor).toLocaleString()} | Salário: $${Math.round(p.salario).toLocaleString()}</div>
        <div class='text-xs'>Status: <span class='${p.status === 'aceita' ? 'text-green-600' : p.status === 'recusada' ? 'text-red-600' : 'text-yellow-600'}'>${p.status}</span></div>
        ${p.status === 'pendente' ? `<button class='bg-green-600 text-white px-2 py-1 rounded mt-1 mr-1' onclick='aceitarPropostaRecebida(${idx})'>Aceitar</button><button class='bg-red-600 text-white px-2 py-1 rounded mt-1' onclick='recusarPropostaRecebida(${idx})'>Recusar</button>` : ''}
      </div>
    `;
  });
  // Botão fechar
  if (!container.querySelector('.fechar-propostas')) {
    const btn = document.createElement('button');
    btn.textContent = 'Fechar';
    btn.className = 'fechar-propostas bg-gray-300 px-3 py-1 rounded mt-3 float-right';
    btn.onclick = () => container.remove();
    container.appendChild(btn);
  }
}

// Botão global para abrir propostas recebidas
if (!document.getElementById('btn-propostas-recebidas')) {
  const btn = document.createElement('button');
  btn.id = 'btn-propostas-recebidas';
  btn.textContent = 'Propostas Recebidas';
  btn.className = 'fixed bottom-4 left-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50';
  btn.onclick = renderPropostasRecebidas;
  document.body.appendChild(btn);
}

// Aceitar proposta recebida
window.aceitarPropostaRecebida = function(idx) {
  const proposta = propostasRecebidas[idx];
  if (!proposta || proposta.status !== 'pendente') return;
  // Remove jogador do elenco do usuário
  let elenco = JSON.parse(localStorage.getItem('elenco') || '[]');
  const idxJog = elenco.findIndex(j => j.nome === proposta.jogador);
  if (idxJog === -1) return;
  const jogador = elenco[idxJog];
  elenco.splice(idxJog, 1);
  localStorage.setItem('elenco', JSON.stringify(elenco));
  // Adiciona ao mercado com novo time
  jogador.time = proposta.de;
  jogador.salario = proposta.salario;
  jogadoresMercado.push(jogador);
  salvarMercado();
  // Atualiza orçamento do usuário
  setOrcamento(getOrcamento() + proposta.valor);
  atualizarOrcamentoDisplay && atualizarOrcamentoDisplay();
  proposta.status = 'aceita';
  salvarPropostasRecebidas();
  renderPropostasRecebidas();
  renderMercado();
  alert(`Você vendeu ${jogador.nome} para ${proposta.de} por $${Math.round(proposta.valor).toLocaleString()}!`);
};

// Recusar proposta recebida
window.recusarPropostaRecebida = function(idx) {
  const proposta = propostasRecebidas[idx];
  if (!proposta || proposta.status !== 'pendente') return;
  proposta.status = 'recusada';
  salvarPropostasRecebidas();
  renderPropostasRecebidas();
};
// Salva mercado no localStorage
function salvarMercado() {
  localStorage.setItem("mercado", JSON.stringify(jogadoresMercado));
}

// --- MERCADO ---




// --- SISTEMA DE PROPOSTAS ---
let propostasPendentes = JSON.parse(localStorage.getItem("propostasPendentes") || "[]");
function salvarPropostas() {
  localStorage.setItem("propostasPendentes", JSON.stringify(propostasPendentes));
}

// Modal de proposta
function abrirModalProposta(jogador) {
  if (document.getElementById("modal-proposta")) return;
  const overlay = document.createElement("div");
  overlay.id = "modal-proposta";
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.7)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = 10000;

  const modal = document.createElement("div");
  modal.style.background = "#fff";
  modal.style.padding = "32px";
  modal.style.borderRadius = "12px";
  modal.style.boxShadow = "0 2px 16px rgba(0,0,0,0.2)";
  modal.style.textAlign = "center";
  modal.innerHTML = `
    <h2 class="font-bold text-xl mb-4">Proposta para ${jogador.nome}</h2>
    <div class="mb-2">Time atual: <b>${jogador.time || 'Livre'}</b></div>
    <div class="mb-2">Valor de mercado: <b>$${jogador.preco.toLocaleString()}</b></div>
    <form id="form-proposta">
      <label class="block mb-1">Valor da proposta ($):</label>
      <input type="number" name="valor" min="0" required class="border rounded px-2 py-1 mb-2 w-full" value="${jogador.preco}">
      <label class="block mb-1">Salário oferecido ($):</label>
      <input type="number" name="salario" min="0" required class="border rounded px-2 py-1 mb-4 w-full" value="${jogador.salario || 10000}">
      <div class="flex gap-2 justify-center">
        <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded">Enviar proposta</button>
        <button type="button" id="btn-cancelar-proposta" class="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
      </div>
    </form>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById("btn-cancelar-proposta").onclick = () => {
    document.body.removeChild(overlay);
  };
  document.getElementById("form-proposta").onsubmit = function(e) {
    e.preventDefault();
    const valor = parseInt(this.valor.value);
    const salario = parseInt(this.salario.value);
    propostasPendentes.push({
      jogador: jogador.nome,
      de: localStorage.getItem("timeSelecionado"),
      para: jogador.time,
      valor,
      salario,
      status: "pendente",
      data: Date.now()
    });
    salvarPropostas();
    alert("Proposta enviada!");
    document.body.removeChild(overlay);
  };
}

// Renderiza lista do mercado (jogadores disponíveis para contratação)
function renderMercado() {
  simularTransferenciasIA();
  const mercado = document.querySelector("#mercado-lista");
  if (!mercado) return;

  mercado.innerHTML = "";
  jogadoresMercado.forEach((jogador, i) => {
    const div = document.createElement("div");
    div.className =
      "mercado-jogador bg-white border p-4 flex justify-between items-center";

    div.dataset.index = i;

    div.innerHTML = `
      <div class="w-3/4">
        <div class="flex items-center gap-2">
        <div class="bg-gray-700 rounded-md p-1">
          <img class="mb-11.5 h-12 dark:hidden" src="assets/img/${
            jogador.nome
          }.webp" alt="">
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
      <button class="proposta-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition" ${jogador.time === localStorage.getItem('timeSelecionado') ? 'disabled' : ''}>
        Propor transferência
      </button>
    `;
    mercado.appendChild(div);
  });

  // Adiciona o event listener DELEGADO ao container principal
  mercado.addEventListener("click", handlePropostaClick);
}

// Evento para abrir modal de proposta
function handlePropostaClick(e) {
  const btn = e.target.closest(".proposta-btn");
  if (!btn) return;
  const jogadorDiv = btn.closest(".mercado-jogador");
  if (!jogadorDiv) return;
  const index = parseInt(jogadorDiv.dataset.index, 10);
  const jogador = jogadoresMercado[index];
  if (!jogador) return;
  abrirModalProposta(jogador);
}

// --- SISTEMA DE AVANÇO DE TEMPO REFEITO ---
(function(){
  // Remove botão antigo se existir
  const btnAntigo = document.getElementById('btn-avancar-dia');
  if (btnAntigo) btnAntigo.remove();
  // Cria botão novo
  const btn = document.createElement('button');
  btn.id = 'btn-avancar-dia';
  btn.textContent = 'Avançar Dia';
  btn.className = 'fixed bottom-20 right-4 bg-indigo-600 text-white px-4 py-2 rounded shadow-lg z-50';
  btn.onclick = function() {
    // Processa propostas pendentes do usuário (responde só UMA por dia, para simular tempo)
    let respondeu = false;
    for (let i = 0; i < propostasPendentes.length; i++) {
      if (propostasPendentes[i].status === 'pendente') {
        window.responderPropostaIA(i);
        respondeu = true;
        break;
      }
    }
    // IA faz movimentações (contratações e propostas para o usuário)
    simularTransferenciasIA();
    // Atualiza mercado e propostas
    if (typeof renderMercado === 'function') renderMercado();
    if (typeof renderPropostasPendentes === 'function') renderPropostasPendentes();
    if (typeof renderPropostasRecebidas === 'function') renderPropostasRecebidas();
    alert('Um dia se passou no jogo! Mercado e propostas atualizados.' + (respondeu ? '' : '\nNenhuma proposta pendente para processar.'));
  };
  document.body.appendChild(btn);
})();