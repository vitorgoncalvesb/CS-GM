// Salva mercado no localStorage
function salvarMercado() {
  localStorage.setItem("mercado", JSON.stringify(jogadoresMercado));
}

// --- MERCADO ---



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