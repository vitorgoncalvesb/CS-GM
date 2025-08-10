const CALENDARIO_KEY = "calendario";

const TORNEIOS_VALORANT = [
  {
    nome: "VCT Americas",
    tipo: "Liga",
    fases: ["Grupos", "Playoffs", "Final"],
    times: [
      "Seu Time", "LOUD", "FURIA", "Leviatán", "KRÜ", "NRG", "Sentinels", "G2", "Cloud9", "MIBR"
    ]
  },
  {
    nome: "VCT Masters",
    tipo: "Internacional",
    fases: ["Grupos", "Eliminatórias", "Final"],
    times: [
      "Seu Time", "Fnatic", "DRX", "EDG", "Paper Rex", "Team Liquid", "Leviatán", "LOUD"
    ]
  },
  {
    nome: "VCT Champions",
    tipo: "Mundial",
    fases: ["Grupos", "Quartas", "Semi", "Final"],
    times: [
      "Seu Time", "LOUD", "Fnatic", "DRX", "EDG", "Paper Rex", "Leviatán", "Sentinels"
    ]
  }
];

function getCalendario() {
  return (
    JSON.parse(localStorage.getItem(CALENDARIO_KEY)) ||
    gerarCalendarioTemporadaValorant()
  );
}

function salvarResultadoPartida(rodada, resultado) {
  const calendario = getCalendario();
  const partida = calendario.find((p) => p.rodada === rodada);
  if (partida) partida.resultado = resultado;
  localStorage.setItem(CALENDARIO_KEY, JSON.stringify(calendario));
}

// Estrutura dos torneios para o calendário
function gerarCalendarioTemporadaValorant() {
  let calendario = [];
  let rodada = 1;
  TORNEIOS_VALORANT.forEach(torneio => {
    torneio.fases.forEach(fase => {
      torneio.times.forEach(adversario => {
        if (adversario !== "Seu Time") {
          calendario.push({
            rodada: rodada++,
            torneio: torneio.nome,
            fase: fase,
            adversario: adversario,
            data: `2025-${String(rodada).padStart(2, "0")}-01`,
            resultado: null
          });
        }
      });
    });
  });
  localStorage.setItem("calendario", JSON.stringify(calendario));
  return calendario;
  renderCalendario();
  renderClassificacao();
  renderTabelaGrupos();
}

function renderCalendario() {
  const calendario = getCalendario();
  const lista = document.getElementById("lista-calendario");
  if (!lista) return;
  lista.innerHTML = "";

  calendario.forEach((partida) => {
    const li = document.createElement("li");
    li.className =
      "bg-gray-50 p-3 rounded border flex justify-between items-center";
    li.innerHTML = `
  <div>
    <span class="font-bold">${partida.data}</span> - 
    <span class="text-indigo-700 font-semibold">${partida.torneio}</span> 
    <span>${partida.fase}</span> vs <span class="text-blue-600">${partida.adversario}</span>
  </div>
  <div>
    ${
      partida.resultado
        ? `<span class="font-semibold ${partida.resultado.includes("Vitória") ? "text-green-600" : "text-red-600"}">
            ${partida.resultado.includes("Vitória") ? "🏆" : "❌"} ${partida.resultado}
          </span>`
        : `<button class="simular-partida-btn bg-indigo-600 text-white px-3 py-1 rounded" data-rodada="${partida.rodada}">Simular</button>`
    }
  </div>
`;
    lista.appendChild(li);
  });

  lista.querySelectorAll(".simular-partida-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Verifica titulares
      const titulares = JSON.parse(localStorage.getItem("titulares")) || [];
      if (titulares.length < 5) {
        alert(
          "Você precisa definir pelo menos 5 titulares para simular uma partida!"
        );
        return;
      }

      const rodada = parseInt(btn.dataset.rodada);
      const resultado = simularPartida();
      if (resultado.resultado === "Erro") {
        alert(
          resultado.mensagem ||
            "Não foi possível simular a partida. Verifique o elenco e os titulares."
        );
        return;
      }
      salvarResultadoPartida(
        rodada,
        resultado.resultado +
          ` (${resultado.roundsTime}x${resultado.roundsAdversario})`
      );
      renderCalendario();
      renderTabelaGrupos();
      renderHistoricoSimulacoes();
      renderClassificacao();
    });
  });
}

function calcularClassificacao() {
  const calendario = getCalendario();
  let vitorias = 0,
    derrotas = 0;
  calendario.forEach((p) => {
    if (p.resultado && p.resultado.includes("Vitória")) vitorias++;
    if (p.resultado && p.resultado.includes("Derrota")) derrotas++;
  });
  return { vitorias, derrotas };
}

function renderClassificacao() {
  const { vitorias, derrotas } = calcularClassificacao();
  const div = document.getElementById("classificacao");
  if (div) div.textContent = `Vitórias: ${vitorias} | Derrotas: ${derrotas}`;
}

function gerarClassificacaoGrupos() {
  const times = [
    "Seu Time",
    "LOUD",
    "FURIA",
    "DRX",
    "G2",
    "EDG",
    "Fnatic",
    "Leviatán",
    "Sentinels",
    "Paper Rex",
    "Team Liquid",
  ];
  // Inicializa classificação
  let tabela = {};
  times.forEach((time) => {
    tabela[time] = { vitorias: 0, derrotas: 0, partidas: 0 };
  });

  // Atualiza classificação com base no calendário
  const calendario = getCalendario();
  calendario.forEach((partida) => {
    if (partida.resultado) {
      // Seu time
      tabela["Seu Time"].partidas++;
      if (partida.resultado.includes("Vitória")) tabela["Seu Time"].vitorias++;
      else tabela["Seu Time"].derrotas++;

      // Simula resultado do adversário (aleatório para exemplo)
      tabela[partida.adversario].partidas++;
      if (Math.random() > 0.5) tabela[partida.adversario].vitorias++;
      else tabela[partida.adversario].derrotas++;
    }
  });

  return tabela;
}

function renderTabelaGrupos() {
  const tabela = gerarClassificacaoGrupos();
  const div = document.getElementById("tabela-grupos");
  if (!div) return;
  let html = `
    <table class="w-full text-sm border border-gray-300 rounded-lg overflow-hidden shadow">
      <thead>
        <tr class="bg-blue-100">
          <th class="py-2 px-3 text-left">Time</th>
          <th class="py-2 px-3 text-center">Vitórias</th>
          <th class="py-2 px-3 text-center">Derrotas</th>
          <th class="py-2 px-3 text-center">Partidas</th>
        </tr>
      </thead>
      <tbody>
  `;
  let i = 0;
  Object.entries(tabela).forEach(([time, stats]) => {
    html += `<tr class="${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${time === 'Seu Time' ? 'font-bold text-blue-700' : ''}">
      <td class="py-2 px-3 flex items-center gap-2">
        ${time === 'Seu Time' ? '🟦' : ''} ${time}
      </td>
      <td class="py-2 px-3 text-center text-green-600 font-semibold">${stats.vitorias} ${stats.vitorias > 0 ? '🏆' : ''}</td>
      <td class="py-2 px-3 text-center text-red-600 font-semibold">${stats.derrotas} ${stats.derrotas > 0 ? '❌' : ''}</td>
      <td class="py-2 px-3 text-center">${stats.partidas}</td>
    </tr>`;
    i++;
  });
  html += `</tbody></table>`;
  div.innerHTML = html;
}
