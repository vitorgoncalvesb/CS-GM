const CALENDARIO_KEY = "calendario";
const TEMPORADA_KEY = "temporada";
const CLASSIFICACAO_KEY = "classificacao";

// Sistema de temporada melhorado
const TEMPORADA_CONFIG = {
  nome: "VCT Americas 2025",
  tipo: "Liga",
  rodadas: 18, // Cada time joga contra todos os outros 2 vezes
  times: [
    { nome: "Seu Time", rating: 75, regiao: "BR" },
    { nome: "LOUD", rating: 88, regiao: "BR" },
    { nome: "FURIA", rating: 82, regiao: "BR" },
    { nome: "MIBR", rating: 78, regiao: "BR" },
    { nome: "Leviatán", rating: 85, regiao: "LATAM" },
    { nome: "KRÜ", rating: 80, regiao: "LATAM" },
    { nome: "NRG", rating: 86, regiao: "NA" },
    { nome: "Sentinels", rating: 84, regiao: "NA" },
    { nome: "G2", rating: 83, regiao: "NA" },
    { nome: "Cloud9", rating: 81, regiao: "NA" }
  ],
  playoffs: {
    classificados: 6, // Top 6 vão para playoffs
    formato: "Eliminação Dupla"
  }
};

// Sistema de pontuação
const PONTUACAO = {
  vitoria: 3,
  derrota: 0,
  bonusRounds: 0.1 // Bonus por diferença de rounds
};

// Inicializa temporada
function inicializarTemporada() {
  const temporada = JSON.parse(localStorage.getItem(TEMPORADA_KEY));
  if (!temporada) {
    const novaTemporada = {
      ...TEMPORADA_CONFIG,
      rodadaAtual: 1,
      fase: "Liga Regular",
      iniciada: false
    };
    localStorage.setItem(TEMPORADA_KEY, JSON.stringify(novaTemporada));
    gerarCalendarioCompleto();
    inicializarClassificacao();
  }
}

// Gera calendário completo da temporada
function gerarCalendarioCompleto() {
  const times = TEMPORADA_CONFIG.times.filter(t => t.nome !== "Seu Time");
  let calendario = [];
  let rodada = 1;
  
  // Gera confrontos (cada time joga contra todos os outros 2 vezes)
  times.forEach(adversario => {
    // Primeiro turno
    calendario.push({
      rodada: rodada++,
      fase: "Liga Regular",
      turno: "1º Turno",
      adversario: adversario.nome,
      adversarioRating: adversario.rating,
      data: gerarDataPartida(rodada),
      resultado: null,
      simulado: false
    });
  });
  
  times.forEach(adversario => {
    // Segundo turno
    calendario.push({
      rodada: rodada++,
      fase: "Liga Regular",
      turno: "2º Turno", 
      adversario: adversario.nome,
      adversarioRating: adversario.rating,
      data: gerarDataPartida(rodada),
      resultado: null,
      simulado: false
    });
  });
  
  localStorage.setItem(CALENDARIO_KEY, JSON.stringify(calendario));
  return calendario;
}

// Gera data da partida baseada na rodada
function gerarDataPartida(rodada) {
  const dataBase = new Date(2025, 0, 15); // 15 de janeiro de 2025
  const diasPorRodada = 4; // Uma partida a cada 4 dias
  const dataPartida = new Date(dataBase.getTime() + (rodada - 1) * diasPorRodada * 24 * 60 * 60 * 1000);
  return dataPartida.toLocaleDateString('pt-BR');
}

// Inicializa classificação
function inicializarClassificacao() {
  const classificacao = {};
  TEMPORADA_CONFIG.times.forEach(time => {
    classificacao[time.nome] = {
      nome: time.nome,
      rating: time.nome === "Seu Time" ? calcularRatingTime() : time.rating,
      regiao: time.regiao,
      pontos: 0,
      vitorias: 0,
      derrotas: 0,
      roundsVencidos: 0,
      roundsPerdidos: 0,
      saldoRounds: 0,
      partidas: 0,
      aproveitamento: 0
    };
  });
  localStorage.setItem(CLASSIFICACAO_KEY, JSON.stringify(classificacao));
}

function getCalendario() {
  inicializarTemporada();
  return JSON.parse(localStorage.getItem(CALENDARIO_KEY)) || [];
}

function getClassificacao() {
  return JSON.parse(localStorage.getItem(CLASSIFICACAO_KEY)) || {};
}

function salvarResultadoPartida(rodada, resultado) {
  const calendario = getCalendario();
  const partida = calendario.find(p => p.rodada === rodada);
  if (!partida) return;
  
  partida.resultado = resultado;
  partida.simulado = true;
  
  // Atualiza classificação
  atualizarClassificacao(partida, resultado);
  
  // Simula outras partidas da rodada
  simularOutrasPartidas();
  
  localStorage.setItem(CALENDARIO_KEY, JSON.stringify(calendario));
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
