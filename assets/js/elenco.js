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

  // Remove todos os jogadores com contrato expirado antes de renderizar
  let jogadoresAtivos = jogadores.filter((jogador) => {
    const contrato = jogador.contrato;
    if (contrato && contrato.fimEm && contrato.fimEm <= Date.now()) {
      adicionarNotificacaoInbox &&
        adicionarNotificacaoInbox({
          tipo: "contrato",
          mensagem: `Contrato de ${jogador.nome} expirou e ele foi liberado do elenco.`,
          data: new Date().toISOString(),
        });
      // Adiciona ao mercado
      let mercado = JSON.parse(localStorage.getItem("mercado")) || [];
      mercado.push(jogador);
      localStorage.setItem("mercado", JSON.stringify(mercado));
      return false; // Remove do elenco
    }
    return true;
  });
  if (jogadoresAtivos.length !== jogadores.length) {
    localStorage.setItem("elenco", JSON.stringify(jogadoresAtivos));
    setTimeout(renderElenco, 100);
    return;
  }

  jogadoresAtivos.forEach((jogador, index) => {
    const mediaKD = getMediaKD(jogador.nome);
    const isTitular = titulares.includes(jogador.nome);
    const contrato = jogador.contrato || {};
    let semanasRestantes = "-";
    if (contrato.fimEm && contrato.fimEm > Date.now()) {
      const msRestante = contrato.fimEm - Date.now();
      semanasRestantes = Math.ceil(msRestante / (7 * 24 * 60 * 60 * 1000));
    } else if (contrato.fimEm && contrato.fimEm <= Date.now()) {
      semanasRestantes = 0;
    }
    const salario = contrato.salario
      ? `R$ ${contrato.salario.toLocaleString()}`
      : "-";
    const rescisao = contrato.rescisao
      ? `R$ ${contrato.rescisao.toLocaleString()}`
      : "-";
    const status =
      contrato.fimEm && contrato.fimEm <= Date.now()
        ? '<span class="text-red-600">Expirado</span>'
        : '<span class="text-green-700">Ativo</span>';
    const div = document.createElement("div");
    div.className =
      "bg-white border rounded p-4 flex justify-between items-center";
    // Busca diferença de rating anual (última virada de ano)
    let diffHtml = "";
    let diffPotHtml = "";
    if (Array.isArray(jogador.evolucaoAnual) && jogador.evolucaoAnual.length) {
      // Pega o último registro de evolução anual
      const evo = jogador.evolucaoAnual[jogador.evolucaoAnual.length - 1];
      // Rating diff
      if (evo && typeof evo.diff === "number" && evo.diff !== 0) {
        const cor = evo.diff > 0 ? "text-green-600" : "text-red-600";
        const sinal = evo.diff > 0 ? "+" : "";
        diffHtml = ` <span class="${cor} text-xs">(${sinal}${evo.diff})</span>`;
      }
      // Potencial diff
      if (evo && typeof evo.diffPot === "number") {
        const corPot =
          evo.diffPot > 0
            ? "text-green-600"
            : evo.diffPot < 0
            ? "text-red-600"
            : "text-gray-400";
        const sinalPot = evo.diffPot > 0 ? "+" : "";
        diffPotHtml = ` <span class="${corPot} text-xs">(${sinalPot}${evo.diffPot})</span>`;
      }
    }
    div.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="rounded-lg p-1">
          <img class="mb-11.5 h-12 dark:hidden rounded-lg" src="assets/img/${
            jogador.nome
          }.webp" alt="">
        </div>
        <strong>${jogador.nome}</strong> 
  <span title="Rating" class="text-blue-600 font-medium tooltip">${
    jogador.rating
  }${diffHtml}</span>
  <span title="Potencial" class="text-green-700 font-medium ml-1">(Pot: ${
    Array.isArray(jogador.evolucaoAnual) &&
    jogador.evolucaoAnual.length &&
    typeof jogador.evolucaoAnual[jogador.evolucaoAnual.length - 1].potencial !==
      "undefined"
      ? jogador.evolucaoAnual[jogador.evolucaoAnual.length - 1].potencial
      : jogador.potencial || "?"
  }${diffPotHtml})</span>
        <div title="Função" class="tooltip">(${
          jogador.funcao
        })</div>- <div title="Idade" class="tooltip">${
      jogador.idade || "?"
    } anos </div>
        <div class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
          ${mediaKD ? `Média K/D: ${mediaKD}` : "Sem estatísticas"}
        </div>
        <button data-index="${index}" class="evolucao-btn ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">Evolução</button>
      </div>
      <div class="flex flex-col items-end gap-2 relative">
        <div class="text-xs text-gray-700 mb-1">
          <span class="font-semibold">Contrato:</span> ${status}<br>
          <span>Duração: <b>${semanasRestantes} sem.</b></span> | <span>Salário: <b>${salario}</b></span><br>
          <span>Rescisão: <b>${rescisao}</b></span>
        </div>
        <button data-index="${index}" class="dropdown-btn text-gray-700 hover:text-black text-2xl px-2 py-0.5 rounded-full focus:outline-none" title="Ações"><span style="font-size:1.5em;line-height:1;">⋮</span></button>
        <div class="dropdown-menu hidden absolute right-0 top-10 bg-white border rounded shadow-lg z-10 min-w-[150px] flex flex-col">
          <button data-index="${index}" class="renovar-btn text-left px-4 py-2 hover:bg-green-100">Renovar contrato</button>
          <button data-index="${index}" class="rescindir-btn text-left px-4 py-2 hover:bg-yellow-100">Rescindir contrato</button>
          <button data-index="${index}" class="liberar-btn text-left px-4 py-2 hover:bg-red-100">Liberar jogador</button>
          <button data-index="${index}" class="historico-contrato-btn text-left px-4 py-2 hover:bg-blue-100">Histórico</button>
        </div>
        <button data-index="${index}" class="mover-btn bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mt-1">
          ${isTitular ? "Colocar no banco" : "Colocar como titular"}
        </button>
      </div>
    `;
    // Botão de evolução: mostra histórico em modal
    list.querySelectorAll(".evolucao-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        // Remove qualquer modal de evolução já aberta
        document.querySelectorAll(".evo-modal").forEach((m) => m.remove());
        const idx = parseInt(btn.dataset.index);
        let jogadores = JSON.parse(localStorage.getItem("elenco")) || [];
        const jogador = jogadores[idx];
        if (!jogador || !Array.isArray(jogador.evolucao)) return;
        let html = `<h2>Evolução - ${jogador.nome}</h2><ul class='mt-2'>`;
        jogador.evolucao.slice(-30).forEach((evo) => {
          html += `<li class='mb-1'>
          <b>${new Date(evo.data).toLocaleDateString()}</b>: Rating: <b>${
            evo.rating
          }</b>
        </li>`;
        });
        html += "</ul>";
        // Modal simples
        const modal = document.createElement("div");
        modal.className = "evo-modal";
        modal.style =
          "position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0008;z-index:9999;display:flex;align-items:center;justify-content:center;";
        modal.innerHTML = `<div class='bg-white p-6 rounded shadow max-w-md'>${html}<br><button id='fechar-evo-modal' class='mt-4 bg-blue-600 text-white px-4 py-2 rounded'>Fechar</button></div>`;
        document.body.appendChild(modal);
        modal.querySelector("#fechar-evo-modal").onclick = () => modal.remove();
        // Fechar ao clicar fora do conteúdo da modal
        modal.addEventListener("mousedown", (e) => {
          if (e.target === modal) modal.remove();
        });
      });
    });
    if (isTitular) {
      titularesList.appendChild(div);
    } else {
      bancoList.appendChild(div);
    }
  });

  // Dropdown: abrir/fechar menu
  list.querySelectorAll(".dropdown-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Fecha outros dropdowns
      document
        .querySelectorAll(".dropdown-menu")
        .forEach((menu) => menu.classList.add("hidden"));
      const menu = btn.parentElement.querySelector(".dropdown-menu");
      if (menu) menu.classList.toggle("hidden");

      // Fecha dropdown ao clicar fora dele
      function handleClickOutside(event) {
        if (!menu.contains(event.target) && event.target !== btn) {
          menu.classList.add("hidden");
          document.removeEventListener("mousedown", handleClickOutside);
        }
      }
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    });
  });

  // Evento para liberar jogador do elenco
  list.querySelectorAll(".liberar-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      let jogadores = JSON.parse(localStorage.getItem("elenco")) || [];
      let titulares = JSON.parse(localStorage.getItem("titulares")) || [];
      const jogador = jogadores[idx];
      if (!jogador) return;
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

  // Evento para renovar contrato
  list.querySelectorAll(".renovar-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index);
      let jogadores = JSON.parse(localStorage.getItem("elenco")) || [];
      const jogador = jogadores[idx];
      if (!jogador || !jogador.contrato) return;

      // Modal simples para renovação
      const novaDuracao = parseInt(
        prompt(
          "Nova duração do contrato (semanas):",
          jogador.contrato.duracao || 12
        )
      );
      if (!novaDuracao || novaDuracao < 4) {
        alert("Duração mínima: 4 semanas.");
        return;
      }
      const novoSalario = parseInt(
        prompt("Novo salário semanal:", jogador.contrato.salario || 1000)
      );
      if (!novoSalario || novoSalario < 1000) {
        alert("Salário mínimo: 1000.");
        return;
      }
      const inicio = Date.now();
      const fimEm = inicio + novaDuracao * 7 * 24 * 60 * 60 * 1000;
      // Atualiza contrato e histórico
      jogador.contrato.inicio = inicio;
      jogador.contrato.fimEm = fimEm;
      jogador.contrato.duracao = novaDuracao;
      jogador.contrato.salario = novoSalario;
      jogador.contrato.rescisao = Math.round(jogador.preco * 1.5);
      jogador.contrato.historico = jogador.contrato.historico || [];
      jogador.contrato.historico.push({
        inicio,
        fim: fimEm,
        salario: novoSalario,
        rescisao: jogador.contrato.rescisao,
        tipo: "renovação",
      });
      localStorage.setItem("elenco", JSON.stringify(jogadores));
      adicionarNotificacaoInbox &&
        adicionarNotificacaoInbox({
          tipo: "contrato",
          mensagem: `Contrato de ${jogador.nome} foi renovado por ${novaDuracao} semanas.`,
          data: new Date().toISOString(),
        });
      renderElenco();
    });
  });

  // Evento para rescindir contrato
  list.querySelectorAll(".rescindir-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index);
      let jogadores = JSON.parse(localStorage.getItem("elenco")) || [];
      const jogador = jogadores[idx];
      if (!jogador) return;
      const multa =
        jogador.contrato && jogador.contrato.rescisao
          ? jogador.contrato.rescisao
          : 0;
      if (
        !window.confirm(
          `Rescindir contrato de ${
            jogador.nome
          }? Multa: R$ ${multa.toLocaleString()}`
        )
      )
        return;
      // Paga multa
      const orcamentoAtual = getOrcamento();
      setOrcamento(orcamentoAtual - multa);
      // Atualiza histórico
      jogador.contrato.historico = jogador.contrato.historico || [];
      jogador.contrato.historico.push({
        inicio: jogador.contrato.inicio,
        fim: Date.now(),
        salario: jogador.contrato.salario,
        rescisao: multa,
        tipo: "rescisão",
      });
      // Remove do elenco
      liberarJogador(idx);
      adicionarNotificacaoInbox &&
        adicionarNotificacaoInbox({
          tipo: "contrato",
          mensagem: `Contrato de ${
            jogador.nome
          } foi rescindido. Multa paga: R$ ${multa.toLocaleString()}`,
          data: new Date().toISOString(),
        });
    });
  });

  // Evento para histórico de contratos
  list.querySelectorAll(".historico-contrato-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index);
      let jogadores = JSON.parse(localStorage.getItem("elenco")) || [];
      const jogador = jogadores[idx];
      if (!jogador || !jogador.contrato || !jogador.contrato.historico) return;
      let html = `<h2>Histórico de Contratos - ${jogador.nome}</h2><ul class='mt-2'>`;
      jogador.contrato.historico.forEach((h) => {
        html += `<li class='mb-1'>
          <b>${h.tipo}</b> - Início: ${new Date(
          h.inicio
        ).toLocaleDateString()} | Fim: ${new Date(
          h.fim
        ).toLocaleDateString()}<br>
          Salário: R$ ${h.salario.toLocaleString()} | Rescisão: R$ ${h.rescisao.toLocaleString()}
        </li>`;
      });
      html += "</ul>";
      // Modal simples
      const modal = document.createElement("div");
      modal.style =
        "position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0008;z-index:9999;display:flex;align-items:center;justify-content:center;";
      modal.innerHTML = `<div class='bg-white p-6 rounded shadow max-w-md'>${html}<br><button id='fechar-hist-modal' class='mt-4 bg-blue-600 text-white px-4 py-2 rounded'>Fechar</button></div>`;
      document.body.appendChild(modal);
      document.getElementById("fechar-hist-modal").onclick = () =>
        modal.remove();
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
    alert(
      "Você já tem 7 jogadores no seu time. Não é possível contratar mais."
    );
    return false;
  }

  // Calcula rating e preço (padroniza aqui)
  jogador.rating = calcularRating(jogador);
  jogador.preco =
    jogador.preco || Math.round(jogador.rating ** 2 * 100 + 50000);

  // Cria contrato inicial se não existir
  if (!jogador.contrato) {
    const duracao = Math.floor(Math.random() * 13) + 12; // 12-24 semanas
    const salario = Math.round(jogador.rating * 1000 + 5000);
    const rescisao = Math.round(jogador.preco * 1.5);
    const inicio = Date.now();
    const fimEm = inicio + duracao * 7 * 24 * 60 * 60 * 1000; // semanas em ms
    jogador.contrato = {
      inicio,
      fimEm,
      duracao,
      salario,
      rescisao,
      historico: [
        {
          inicio,
          fim: fimEm,
          salario,
          rescisao,
          tipo: "contratação",
        },
      ],
    };
  }

  elenco.push(jogador);
  localStorage.setItem("elenco", JSON.stringify(elenco));
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
