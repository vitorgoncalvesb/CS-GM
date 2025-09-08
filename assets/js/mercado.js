// --- TRANSFERÊNCIAS ENTRE TIMES DA IA E PROPOSTAS RECEBIDAS ---
let propostasRecebidas = JSON.parse(localStorage.getItem("propostasRecebidas") || "[]");
function salvarPropostasRecebidas() {
  localStorage.setItem("propostasRecebidas", JSON.stringify(propostasRecebidas));
}

// Função utilitária para adicionar dias a um timestamp
function addDias(date, dias) {
  return date + dias * 24 * 60 * 60 * 1000;
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
        data: Date.now(),
        expira: addDias(Date.now(), 3), // Proposta expira em 3 dias
        historico: [
          { acao: 'criada', valor: jogador.preco, salario: jogador.salario, data: Date.now(), autor: time }
        ]
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
    container.className = "fixed top-0 left-0 m-4 bg-white border rounded shadow-lg p-4 w-96 z-50";
    document.body.appendChild(container);
  }
  container.innerHTML = `<h3 class='font-bold mb-2'>Propostas Recebidas</h3>`;
  // Expira propostas automaticamente
  const agora = Date.now();
  propostasRecebidas.forEach((p) => {
    if (p.status === 'pendente' && p.expira && agora > p.expira) {
      p.status = 'expirada';
      p.historico = p.historico || [];
      p.historico.push({ acao: 'expirada', data: agora, autor: 'sistema' });
    }
  });
  salvarPropostasRecebidas();
  if (!propostasRecebidas.length) {
    container.innerHTML += `<div class='text-gray-500 text-sm'>Nenhuma proposta recebida.</div>`;
    return;
  }
  propostasRecebidas.forEach((p, idx) => {
    container.innerHTML += `
      <div class='border-b py-2'>
        <div><b>${p.jogador}</b> (${p.de})</div>
        <div class='text-xs text-gray-600'>Oferta: $${Math.round(p.valor).toLocaleString()} | Salário: $${Math.round(p.salario).toLocaleString()}</div>
        <div class='text-xs'>Status: <span class='${p.status === 'aceita' ? 'text-green-600' : p.status === 'recusada' ? 'text-red-600' : p.status === 'expirada' ? 'text-gray-500' : 'text-yellow-600'}'>${p.status}</span></div>
        <div class='text-xs text-gray-400'>Expira: ${p.expira ? new Date(p.expira).toLocaleDateString() : '-'}</div>
        ${p.status === 'pendente' ? `<button class='bg-green-600 text-white px-2 py-1 rounded mt-1 mr-1' onclick='aceitarPropostaRecebida(${idx})'>Aceitar</button><button class='bg-red-600 text-white px-2 py-1 rounded mt-1 mr-1' onclick='recusarPropostaRecebida(${idx})'>Recusar</button><button class='bg-yellow-500 text-white px-2 py-1 rounded mt-1' onclick='abrirModalNegociarProposta(${idx})'>Negociar</button>` : ''}
        <details class='mt-1'><summary class='text-xs text-blue-600 cursor-pointer'>Histórico</summary><div class='text-xs'>${(p.historico||[]).map(h=>`[${new Date(h.data).toLocaleDateString()}] ${h.acao} por ${h.autor}${h.valor?` ($${Math.round(h.valor).toLocaleString()})`:''}${h.salario?` (Salário: $${Math.round(h.salario).toLocaleString()})`:''}`).join('<br>')}</div></details>
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

// Modal de negociação de proposta
window.abrirModalNegociarProposta = function(idx) {
  const proposta = propostasRecebidas[idx];
  if (!proposta || proposta.status !== 'pendente') return;
  let modal = document.getElementById('modal-negociar-proposta');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'modal-negociar-proposta';
  modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40';
  modal.innerHTML = `
    <div class='bg-white rounded p-6 shadow-lg w-80'>
      <h3 class='font-bold mb-2'>Negociar Proposta</h3>
      <div class='mb-2'>Valor atual: <b>$${Math.round(proposta.valor).toLocaleString()}</b></div>
      <div class='mb-2'>Salário atual: <b>$${Math.round(proposta.salario).toLocaleString()}</b></div>
      <label class='block text-sm mb-1'>Novo valor:</label>
      <input id='novoValorProposta' type='number' class='border rounded px-2 py-1 w-full mb-2' value='${Math.round(proposta.valor)}'>
      <label class='block text-sm mb-1'>Novo salário:</label>
      <input id='novoSalarioProposta' type='number' class='border rounded px-2 py-1 w-full mb-4' value='${Math.round(proposta.salario)}'>
      <button class='bg-yellow-500 text-white px-4 py-2 rounded mr-2' onclick='enviarContraproposta(${idx})'>Enviar</button>
      <button class='bg-gray-300 px-4 py-2 rounded' onclick='document.getElementById("modal-negociar-proposta").remove()'>Cancelar</button>
    </div>
  `;
  document.body.appendChild(modal);
};

window.enviarContraproposta = function(idx) {
  const proposta = propostasRecebidas[idx];
  if (!proposta || proposta.status !== 'pendente') return;
  const novoValor = parseInt(document.getElementById('novoValorProposta').value, 10);
  const novoSalario = parseInt(document.getElementById('novoSalarioProposta').value, 10);
  if (isNaN(novoValor) || isNaN(novoSalario)) {
    alert('Preencha valores válidos.');
    return;
  }
  proposta.valor = novoValor;
  proposta.salario = novoSalario;
  proposta.historico = proposta.historico || [];
  proposta.historico.push({ acao: 'contraproposta', valor: novoValor, salario: novoSalario, data: Date.now(), autor: 'usuário' });
  // Renova prazo por mais 2 dias
  proposta.expira = addDias(Date.now(), 2);
  salvarPropostasRecebidas();
  document.getElementById('modal-negociar-proposta').remove();
  renderPropostasRecebidas();
  alert('Contraproposta enviada! O time interessado irá analisar.');
};

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

// Adiciona prazo e histórico ao enviar proposta
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
      data: Date.now(),
      expira: addDias(Date.now(), 3), // expira em 3 dias
      historico: [
        { acao: 'criada', valor, salario, data: Date.now(), autor: localStorage.getItem("timeSelecionado") }
      ]
    });
    salvarPropostas();
    alert("Proposta enviada!");
    document.body.removeChild(overlay);
  };
}

// Expira propostas pendentes automaticamente
function expirarPropostasPendentes() {
  const agora = Date.now();
  propostasPendentes.forEach((p) => {
    if (p.status === 'pendente' && p.expira && agora > p.expira) {
      p.status = 'expirada';
      p.historico = p.historico || [];
      p.historico.push({ acao: 'expirada', data: agora, autor: 'sistema' });
      adicionarNotificacaoInbox({
        titulo: `Proposta expirada: ${p.jogador}`,
        mensagem: `Sua proposta para ${p.jogador} expirou sem resposta do time adversário.`,
        data: agora
      });
    }
  });
  salvarPropostas();
}

// IA responde propostas do usuário (aceita, recusa, contraproposta)
window.responderPropostaIA = function(idx) {
  expirarPropostasPendentes();
  const proposta = propostasPendentes[idx];
  if (!proposta || proposta.status !== 'pendente') return;
  // Lógica simples: 40% aceita, 30% recusa, 30% contraproposta
  const r = Math.random();
  if (r < 0.4) {
    proposta.status = 'aceita';
    proposta.historico.push({ acao: 'aceita', data: Date.now(), autor: proposta.para });
    // Adiciona jogador ao elenco do usuário
    let elenco = JSON.parse(localStorage.getItem('elenco') || '[]');
    let jogador = jogadoresMercado.find(j => j.nome === proposta.jogador);
    if (jogador) {
      jogador.time = localStorage.getItem("timeSelecionado");
      jogador.salario = proposta.salario;
      elenco.push(jogador);
      // Remove do mercado
      jogadoresMercado = jogadoresMercado.filter(j => j.nome !== jogador.nome);
      salvarMercado();
      localStorage.setItem('elenco', JSON.stringify(elenco));
      setOrcamento(getOrcamento() - proposta.valor);
      atualizarOrcamentoDisplay && atualizarOrcamentoDisplay();
      adicionarNotificacaoInbox({
        titulo: `Proposta aceita: ${proposta.jogador}`,
        mensagem: `O time aceitou sua proposta e ${proposta.jogador} foi contratado!`,
        data: Date.now()
      });
    }
  } else if (r < 0.7) {
    proposta.status = 'recusada';
    proposta.historico.push({ acao: 'recusada', data: Date.now(), autor: proposta.para });
    adicionarNotificacaoInbox({
      titulo: `Proposta recusada: ${proposta.jogador}`,
      mensagem: `O time recusou sua proposta por ${proposta.jogador}.`,
      data: Date.now()
    });
  } else {
    // Contraproposta: aumenta valor e salário em 10-20%
    const novoValor = Math.round(proposta.valor * (1.1 + Math.random()*0.1));
    const novoSalario = Math.round(proposta.salario * (1.1 + Math.random()*0.1));
    proposta.valor = novoValor;
    proposta.salario = novoSalario;
    proposta.expira = addDias(Date.now(), 2);
    proposta.historico.push({ acao: 'contraproposta', valor: novoValor, salario: novoSalario, data: Date.now(), autor: proposta.para });
    adicionarNotificacaoInbox({
      titulo: `Contraproposta: ${proposta.jogador}`,
      mensagem: `O time fez uma contraproposta por ${proposta.jogador}: Valor $${novoValor.toLocaleString()}, Salário $${novoSalario.toLocaleString()}.`,
      data: Date.now()
    });
  }
  salvarPropostas();
};

// Adiciona notificação na Inbox (localStorage)
function adicionarNotificacaoInbox(notif) {
  let notificacoes = [];
  try {
    notificacoes = JSON.parse(localStorage.getItem('notificacoes') || '[]');
  } catch {}
  notificacoes.push(notif);
  localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
}

// Interface: visualizar histórico completo de propostas pendentes
window.renderPropostasPendentes = function() {
  let container = document.getElementById("propostas-pendentes");
  if (!container) {
    container = document.createElement("div");
    container.id = "propostas-pendentes";
    container.className = "fixed top-0 right-0 m-4 bg-white border rounded shadow-lg p-4 w-96 z-50";
    document.body.appendChild(container);
  }
  expirarPropostasPendentes();
  container.innerHTML = `<h3 class='font-bold mb-2'>Propostas Enviadas</h3>`;
  if (!propostasPendentes.length) {
    container.innerHTML += `<div class='text-gray-500 text-sm'>Nenhuma proposta enviada.</div>`;
    return;
  }
  propostasPendentes.forEach((p, idx) => {
    container.innerHTML += `
      <div class='border-b py-2'>
        <div><b>${p.jogador}</b> (${p.para || 'Livre'})</div>
        <div class='text-xs text-gray-600'>Oferta: $${Math.round(p.valor).toLocaleString()} | Salário: $${Math.round(p.salario).toLocaleString()}</div>
        <div class='text-xs'>Status: <span class='${p.status === 'aceita' ? 'text-green-600' : p.status === 'recusada' ? 'text-red-600' : p.status === 'expirada' ? 'text-gray-500' : 'text-yellow-600'}'>${p.status}</span></div>
        <div class='text-xs text-gray-400'>Expira: ${p.expira ? new Date(p.expira).toLocaleDateString() : '-'}</div>
        <details class='mt-1'><summary class='text-xs text-blue-600 cursor-pointer'>Histórico</summary><div class='text-xs'>${(p.historico||[]).map(h=>`[${new Date(h.data).toLocaleDateString()}] ${h.acao} por ${h.autor}${h.valor?` ($${Math.round(h.valor).toLocaleString()})`:''}${h.salario?` (Salário: $${Math.round(h.salario).toLocaleString()})`:''}`).join('<br>')}</div></details>
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
};

// Botão global para abrir propostas enviadas
if (!document.getElementById('btn-propostas-pendentes')) {
  const btn = document.createElement('button');
  btn.id = 'btn-propostas-pendentes';
  btn.textContent = 'Propostas Enviadas';
  btn.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50';
  btn.onclick = window.renderPropostasPendentes;
  document.body.appendChild(btn);
}

// --- SISTEMA DE AVANÇO DE TEMPO REFEITO ---
(function(){
  // Remove botão antigo se existir
  const btnAntigo = document.getElementById('btn-avancar-dia');
  if (btnAntigo) btnAntigo.remove();
  // Cria botão novo
  const btn = document.createElement('button');
  btn.id = 'btn-avancar-dia';
  btn.textContent = 'Avançar Semana';
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
    // Evolução semanal dos jogadores
    if (typeof window.evoluirJogadoresSemana === 'function') window.evoluirJogadoresSemana();
    // IA faz movimentações (contratações e propostas para o usuário)
    simularTransferenciasIA();
    // Atualiza mercado e propostas
    if (typeof renderMercado === 'function') renderMercado();
    if (typeof renderPropostasPendentes === 'function') renderPropostasPendentes();
    if (typeof renderPropostasRecebidas === 'function') renderPropostasRecebidas();
    alert('Uma semana se passou no jogo! Mercado, evolução e propostas atualizados.' + (respondeu ? '' : '\nNenhuma proposta pendente para processar.'));
  };
  document.body.appendChild(btn);
  renderInbox()
})();