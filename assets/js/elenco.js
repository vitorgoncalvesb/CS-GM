// --- ELENCO ---

function getMediaKD(nomeJogador) {
  const historico = JSON.parse(localStorage.getItem("simulacoes")) || [];
  let somaKD = 0;
  let partidas = 0;

  historico.forEach((simulacao) => {
    simulacao.estatisticas.forEach((j) => {
      if (j.nome === nomeJogador && j.kd) {
        somaKD += parseFloat(j.kd);
        partidas++;
      }
    });
  });

  if (partidas === 0) return null;
  return (somaKD / partidas).toFixed(2);
}

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
    const mediaKD = getMediaKD(jogador.nome);
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
        <div class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
      ${mediaKD ? `Média K/D: ${mediaKD}` : "Sem estatísticas"}
    </div>
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
      let jogadores = JSON.parse(localStorage.getItem("elenco")) || [];
      let titulares = JSON.parse(localStorage.getItem("titulares")) || [];
      const jogador = jogadores[idx];
      if (!jogador) return;

      // Adiciona confirmação antes de liberar
      if (
        !window.confirm(
          `Tem certeza que deseja liberar ${jogador.nome} do elenco?`
        )
      ) {
        return;
      }

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