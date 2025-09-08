// --- MODAL DE TORNEIO (BRACKET) ---
function abrirModalTorneio(nomeEvento, ano, participantes, fases, resultados, emAndamento) {
  // Remove modal antigo
  document.querySelectorAll('.modal-torneio').forEach(m => m.remove());
  const modal = document.createElement('div');
  modal.className = 'modal-torneio fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
  modal.innerHTML = `<div class='bg-gray-900 text-white p-6 rounded-lg max-w-5xl w-full relative'>
    <button id='fechar-modal-torneio' class='absolute top-2 right-2 text-2xl'>&times;</button>
    <h2 class='text-2xl font-bold mb-4 text-center'>${nomeEvento} (${ano})</h2>
    <div id='bracket-torneio'></div>
    <div class='flex gap-4 mt-6 justify-center'>
      <button id='simular-todas' class='bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded'>Simular Todas</button>
      <button id='fechar-modal-torneio2' class='bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded'>Fechar</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#fechar-modal-torneio').onclick = () => modal.remove();
  modal.querySelector('#fechar-modal-torneio2').onclick = () => modal.remove();
  renderBracketTorneio(nomeEvento, ano, participantes, fases, resultados, emAndamento);
}

function renderBracketTorneio(nomeEvento, ano, participantes, fases, resultados, emAndamento) {
  const bracket = document.getElementById('bracket-torneio');
  if (!bracket) return;
  // Renderiza as fases (quartas, semi, final)
  let html = `<div class='flex gap-8 justify-center overflow-x-auto'>`;
  const faseNomes = ['Quartas', 'Semifinal', 'Final'];
  for (let f = 0; f < fases.length; f++) {
    html += `<div><div class='font-bold mb-2 text-center'>${faseNomes[f] || 'Fase'}</div>`;
    for (let i = 0; i < fases[f].length; i += 2) {
      const t1 = fases[f][i];
      const t2 = fases[f][i+1];
      const res = resultados[f] && resultados[f][Math.floor(i/2)];
      html += `<div class='mb-6 flex flex-col items-center'>`;
      html += `<div class='flex flex-col gap-1'>`;
      html += `<div class='flex items-center gap-2'>
        <span class='font-semibold'>${t1 || '-'}</span>
        <span class='text-gray-400'>vs</span>
        <span class='font-semibold'>${t2 || '-'}</span>
      </div>`;
      if (res && res.placarMD3) {
        html += `<div class='mt-1 text-sm'>${res.placarMD3} <button class='ml-2 underline text-blue-300' onclick='mostrarStatsPartidaTorneio(${f},${Math.floor(i/2)})'>Match Stats</button></div>`;
      } else if (t1 && t2 && emAndamento) {
        html += `<button class='mt-2 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs' onclick='simularPartidaTorneio("${nomeEvento}",${ano},${f},${Math.floor(i/2)})'>Simular</button>`;
      }
      html += `</div></div>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  bracket.innerHTML = html;
}

// Estado temporário do torneio (em memória)
let torneioTemp = null;

// Inicia torneio e abre modal
function iniciarTorneio(nomeEvento) {
  const ano = (new Date()).getFullYear();
  const userTeam = localStorage.getItem('timeSelecionado') || 'Seu Time';
  // Garante os 10 principais times sempre presentes
  const TIMES_PRINCIPAIS = [
    'Vitality', 'Spirit', 'The MongolZ', 'MOUZ', 'FURIA',
    'Aurora', 'Natus Vincere', 'Falcons', 'Faze', 'Pain'
  ];
  let participantes = TIMES_PRINCIPAIS.slice();
  // Se o time do usuário não está, substitui o primeiro
  if (!participantes.includes(userTeam)) participantes[0] = userTeam;
  // Embaralha
  participantes = participantes.sort(() => Math.random() - 0.5);
  // Monta fases: quartas, semi, final
  let fases = [];
  fases[0] = participantes;
  fases[1] = [null,null,null,null,null];
  fases[2] = [null,null,null];
  fases[3] = [null,null];
  fases[4] = [null];
  let resultados = [[],[],[],[],[]];
  torneioTemp = { nomeEvento, ano, participantes, fases, resultados, emAndamento: true, colocacoes: [] };
  abrirModalTorneio(nomeEvento, ano, participantes, fases, resultados, true);
}

// Simula uma partida MD3 e avança o torneio
function simularPartidaTorneio(nomeEvento, ano, faseIdx, jogoIdx) {
  if (!torneioTemp) return;
  const t1 = torneioTemp.fases[faseIdx][jogoIdx*2];
  const t2 = torneioTemp.fases[faseIdx][jogoIdx*2+1];
  if (!t1 || !t2) return;
  // Simula MD3
  let v1 = 0, v2 = 0, mapas = [];
  for (let m = 1; m <= 3; m++) {
    let r1 = t1 === (localStorage.getItem('timeSelecionado')||'Seu Time') ? calcularRatingTime() : ratingTimeIA(t1, JSON.parse(localStorage.getItem('mercado')||'[]'));
    let r2 = t2 === (localStorage.getItem('timeSelecionado')||'Seu Time') ? calcularRatingTime() : ratingTimeIA(t2, JSON.parse(localStorage.getItem('mercado')||'[]'));
    r1 += Math.random()*5-2.5;
    r2 += Math.random()*5-2.5;
    let rounds1 = 0, rounds2 = 0;
    if (r1 === r2) { rounds1 = 13; rounds2 = 13; } else if (r1 > r2) { rounds1 = 13; rounds2 = Math.max(3, Math.min(11, Math.round(7 + Math.random()*4))); } else { rounds2 = 13; rounds1 = Math.max(3, Math.min(11, Math.round(7 + Math.random()*4))); }
    let overtime = false;
    if (rounds1 === 13 && rounds2 === 13) {
      overtime = true;
      let ot1 = 0, ot2 = 0;
      do { ot1 += Math.floor(Math.random()*4)+1; ot2 += Math.floor(Math.random()*4)+1; } while (Math.abs(ot1-ot2) < 4);
      if (ot1 > ot2) { rounds1 += ot1; rounds2 += ot2; } else { rounds2 += ot2; rounds1 += ot1; }
    }
    if (rounds1 > rounds2) v1++; else v2++;
    mapas.push({ mapa: m, placar: overtime ? `${rounds1}x${rounds2} (OT)` : `${rounds1}x${rounds2}`, stats: gerarStatsPartidaMD3Aprimorado(t1, t2, rounds1, rounds2) });
    if (v1 === 2 || v2 === 2) break;
  }
  let placarMD3 = `${v1}x${v2}`;
  torneioTemp.resultados[faseIdx][jogoIdx] = { t1, t2, placarMD3, mapas };
  // Avança para próxima fase
  const vencedor = v1 > v2 ? t1 : t2;
  if (torneioTemp.fases[faseIdx+1]) torneioTemp.fases[faseIdx+1][Math.floor(jogoIdx)] = vencedor;
  // Salva colocação dos eliminados
  if (!torneioTemp.colocacoes) torneioTemp.colocacoes = [];
  const perdedor = v1 > v2 ? t2 : t1;
  torneioTemp.colocacoes.push({ time: perdedor, fase: faseIdx });
  // Se acabou, salva histórico e premiação
  if (faseIdx === torneioTemp.fases.length-2) {
    torneioTemp.emAndamento = false;
    // Adiciona campeão e vice
    torneioTemp.colocacoes.push({ time: vencedor, fase: torneioTemp.fases.length-1 });
    // Premiação crescente
    const premios = [50000, 70000, 90000, 120000, 160000, 220000, 300000, 400000, 600000, 1000000];
    torneioTemp.colocacoes = torneioTemp.colocacoes.reverse(); // campeão primeiro
    torneioTemp.colocacoes.forEach((col, idx) => {
      col.premio = premios[idx] || 20000;
      // Se for o time do usuário, adiciona ao orçamento
      if (col.time === (localStorage.getItem('timeSelecionado')||'Seu Time')) {
        let orc = typeof getOrcamento === 'function' ? getOrcamento() : 0;
        if (orc) setOrcamento(orc + col.premio);
      }
    });
    let hist = JSON.parse(localStorage.getItem('historicoCampeonatos') || '[]');
    hist.push({ nome: nomeEvento, ano, campeao: vencedor, fases: torneioTemp.resultados, colocacoes: torneioTemp.colocacoes });
    localStorage.setItem('historicoCampeonatos', JSON.stringify(hist));
    alert('Premiação distribuída! Veja o resultado no histórico.');
  }
  abrirModalTorneio(nomeEvento, ano, torneioTemp.participantes, torneioTemp.fases, torneioTemp.resultados, torneioTemp.emAndamento);
}

// Simula todas as partidas restantes
function simularTodasPartidasTorneio() {
  if (!torneioTemp) return;
  for (let f = 0; f < torneioTemp.fases.length-1; f++) {
    for (let j = 0; j < torneioTemp.fases[f].length/2; j++) {
      if (!torneioTemp.resultados[f][j]) {
        simularPartidaTorneio(torneioTemp.nomeEvento, torneioTemp.ano, f, j);
      }
    }
  }
}

// Estatísticas aprimoradas para cada partida MD3
function gerarStatsPartidaMD3Aprimorado(t1, t2, rounds1, rounds2) {
  // Gera 5 jogadores por time
  function genPlayerStats(time) {
    return Array.from({length:5}).map((_,i) => {
      const kills = Math.floor(15 + Math.random()*15);
      const deaths = Math.floor(10 + Math.random()*10);
      const assists = Math.floor(3 + Math.random()*6);
      const adr = Math.round(60 + Math.random()*60);
      const rating = (0.8 + Math.random()*0.7).toFixed(2);
      return { nome: `${time} Player${i+1}`, kills, deaths, assists, adr, rating };
    });
  }
  const stats1 = genPlayerStats(t1);
  const stats2 = genPlayerStats(t2);
  // MVP é o maior rating
  const mvp1 = stats1.reduce((a,b)=>a.rating>b.rating?a:b);
  const mvp2 = stats2.reduce((a,b)=>a.rating>b.rating?a:b);
  return {
    mvp: mvp1.rating > mvp2.rating ? mvp1.nome : mvp2.nome,
    stats1,
    stats2,
    rounds: [rounds1, rounds2]
  };
}

// Mostra estatísticas da partida (aprimorado)
function mostrarStatsPartidaTorneio(faseIdx, jogoIdx) {
  if (!torneioTemp) return;
  const res = torneioTemp.resultados[faseIdx][jogoIdx];
  if (!res) return;
  // Função para buscar logo
  function getLogo(time) {
    const logos = {
      'Vitality': 'Vitality.webp',
      'Spirit': 'Spirit.webp',
      'The MongolZ': 'The MongolZ.webp',
      'MOUZ': 'mouz.webp',
      'FURIA': 'furia.webp',
      'Aurora': 'Aurora.webp',
      'Natus Vincere': 'natus vincere.webp',
      'Falcons': 'Falcons.webp',
      'Faze': 'Faze.webp',
      'Pain': 'Pain.webp',
    };
    if (logos[time]) return `<img src='assets/img/team-logos/${logos[time]}' alt='' class='inline w-6 h-6 align-middle mr-1' style='vertical-align:middle;'>`;
    return '';
  }
  // Função para buscar nicks reais
  function getNicks(time) {
    // Busca jogadores do time no mercado, ordenando por overall (ou rating) decrescente para garantir titulares
    const mercado = JSON.parse(localStorage.getItem('mercado')||'[]');
    let jogadores = mercado.filter(j => j.time === time);
    // Se houver menos de 5, tenta buscar também no elenco salvo (caso do time do usuário)
    if (jogadores.length < 5 && localStorage.getItem('elenco_'+time)) {
      try {
        const elenco = JSON.parse(localStorage.getItem('elenco_'+time));
        if (Array.isArray(elenco)) {
          // Evita duplicar nicks já presentes
          const nicksMercado = jogadores.map(j=>j.nick);
          elenco.forEach(j => {
            if (j.nick && !nicksMercado.includes(j.nick)) jogadores.push(j);
          });
        }
      } catch(e){}
    }
    // Ordena por overall/rating se existir
    jogadores.sort((a,b)=>(b.overall||b.rating||0)-(a.overall||a.rating||0));
    if (jogadores.length >= 5) return jogadores.slice(0,5).map(j=>j.nick);
    // fallback para PlayerX
    return Array.from({length:5}).map((_,i)=>`Player${i+1}`);
  }
  let html = `<h3 class='font-bold mb-2'>Estatísticas da Partida</h3>`;
  res.mapas.forEach((mapa, idx) => {
    html += `<div class='mb-4'><div class='font-bold text-base mb-1'>Mapa ${idx+1}: <span class='font-normal'>${mapa.placar}</span></div>`;
    html += `<div class='mb-1 text-xs'>MVP: <span class='font-semibold'>${mapa.stats.mvp}</span></div>`;
    // Bloco do time 1
    const nicks1 = getNicks(res.t1);
    html += `<div class='mb-2'><div class='font-bold text-yellow-400 mb-1'>${getLogo(res.t1)}${res.t1}</div>`;
    html += `<table class='text-xs bg-gray-800 text-white w-full mb-2 rounded'><thead><tr><th class='text-left px-2'>Nick</th><th>K-D</th><th>+/-</th><th>ADR</th><th>Rating</th></tr></thead><tbody>`;
    mapa.stats.stats1.forEach((p,i)=>{
      const kd = `${p.kills}-${p.deaths}`;
      const plusminus = p.kills - p.deaths;
      const nick = nicks1[i] || `Player${i+1}`;
      html += `<tr><td class='px-2'>${nick}</td><td>${kd}</td><td class='${plusminus>=0?'text-green-400':'text-red-400'}'>${plusminus>0?'+':''}${plusminus}</td><td>${p.adr}</td><td class='${p.rating>=1.15?'text-green-400':p.rating<=0.9?'text-red-400':''}'>${p.rating}</td></tr>`;
    });
    html += `</tbody></table></div>`;
    // Bloco do time 2
    const nicks2 = getNicks(res.t2);
    html += `<div class='mb-2'><div class='font-bold text-red-400 mb-1'>${getLogo(res.t2)}${res.t2}</div>`;
    html += `<table class='text-xs bg-gray-800 text-white w-full mb-2 rounded'><thead><tr><th class='text-left px-2'>Nick</th><th>K-D</th><th>+/-</th><th>ADR</th><th>Rating</th></tr></thead><tbody>`;
    mapa.stats.stats2.forEach((p,i)=>{
      const kd = `${p.kills}-${p.deaths}`;
      const plusminus = p.kills - p.deaths;
      const nick = nicks2[i] || `Player${i+1}`;
      html += `<tr><td class='px-2'>${nick}</td><td>${kd}</td><td class='${plusminus>=0?'text-green-400':'text-red-400'}'>${plusminus>0?'+':''}${plusminus}</td><td>${p.adr}</td><td class='${p.rating>=1.15?'text-green-400':p.rating<=0.9?'text-red-400':''}'>${p.rating}</td></tr>`;
    });
    html += `</tbody></table></div>`;
    html += `</div>`;
  });
  // Premiação se final
  if (!torneioTemp.emAndamento && torneioTemp.colocacoes) {
    html += `<h4 class='mt-4 font-bold'>Premiação:</h4><ul>`;
    torneioTemp.colocacoes.forEach((col, idx) => {
      html += `<li>${idx+1}º - ${col.time}: R$ ${col.premio.toLocaleString()}</li>`;
    });
    html += `</ul>`;
  }
  // Modal simples
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50';
  modal.innerHTML = `<div class='bg-white text-black p-6 rounded max-w-2xl w-full'><div>${html}</div><button class='mt-4 bg-blue-600 text-white px-4 py-2 rounded' id='fechar-modal-stats'>Fechar</button></div>`;
  document.body.appendChild(modal);
  modal.querySelector('#fechar-modal-stats').onclick = () => modal.remove();
}

if (typeof window !== 'undefined') {
  window.iniciarTorneio = iniciarTorneio;
  window.simularPartidaTorneio = simularPartidaTorneio;
  window.simularTodasPartidasTorneio = simularTodasPartidasTorneio;
  window.mostrarStatsPartidaTorneio = mostrarStatsPartidaTorneio;
}
// Salva inscrições do usuário (por ano)
function getInscricoesCampeonatos(ano) {
  const all = JSON.parse(localStorage.getItem('inscricoesCampeonatos') || '{}');
  return all[ano] || [];
}
function setInscricoesCampeonatos(ano, lista) {
  const all = JSON.parse(localStorage.getItem('inscricoesCampeonatos') || '{}');
  all[ano] = lista;
  localStorage.setItem('inscricoesCampeonatos', JSON.stringify(all));
}

// Função para inscrever time do usuário em um campeonato
function inscreverNoCampeonato(nomeEvento) {
  const ano = (new Date()).getFullYear();
  let inscricoes = getInscricoesCampeonatos(ano);
  if (!inscricoes.includes(nomeEvento)) {
    inscricoes.push(nomeEvento);
    setInscricoesCampeonatos(ano, inscricoes);
    alert('Time inscrito em ' + nomeEvento + '!');
    renderCalendarioEventos();
  } else {
    alert('Seu time já está inscrito neste campeonato.');
  }
}

// Função para simular/jogar campeonato (placeholder)

// --- SIMULAÇÃO REAL DE CAMPEONATO ---
function jogarCampeonato(nomeEvento) {
  // Inicia o bracket visual/manual
  iniciarTorneio(nomeEvento);
}

// Calcula rating médio de um time IA
function ratingTimeIA(nome, mercado) {
  const jogadores = mercado.filter(j => j.time === nome);
  if (!jogadores.length) return 70 + Math.random()*10;
  return jogadores.reduce((s,j)=>s+(j.rating||70),0)/jogadores.length;
}

if (typeof window !== 'undefined') {
  window.inscreverNoCampeonato = inscreverNoCampeonato;
  window.jogarCampeonato = jogarCampeonato;
}
// Lista de campeonatos fixos para o calendário (exemplo baseado na imagem fornecida)
// Cada evento tem: nome, tipo, mês (0-11), dias, cor, icone, etc.

const EVENTOS_FIXOS = [
  { nome: 'BLAST Bounty', tipo: 'BLAST', mes: 0, dias: '13th-25th', cor: 'bg-blue-900', icone: '⭐' },
  { nome: 'IEM Kraków St. 1', tipo: 'IEM', mes: 0, dias: '28th-30th', cor: 'bg-gray-700', icone: '⚪' },
  { nome: 'IEM Kraków', tipo: 'IEM', mes: 0, dias: '31st-8th', cor: 'bg-gray-700', icone: '⚪' },
  { nome: 'PGL Cluj-Napoca', tipo: 'PGL', mes: 1, dias: '9th-23rd', cor: 'bg-red-700', icone: '🏆' },
  { nome: 'EPL S23 Finals', tipo: 'EPL', mes: 2, dias: '12th-15th', cor: 'bg-yellow-700', icone: '❓' },
  { nome: 'BLAST Open S1', tipo: 'BLAST', mes: 2, dias: '16th-29th', cor: 'bg-blue-900', icone: '⭐' },
  { nome: 'Skyesports Event', tipo: 'Skyesports', mes: 2, dias: '30th-12th', cor: 'bg-gray-800', icone: '❓' },
  { nome: 'PGL Bucharest', tipo: 'PGL', mes: 3, dias: '3rd-12th', cor: 'bg-red-700', icone: '🏆' },
  { nome: 'IEM Brazil', tipo: 'IEM', mes: 3, dias: '13th-19th', cor: 'bg-gray-700', icone: '⚪' },
  { nome: 'FISSURE Playgrounds', tipo: 'FISSURE', mes: 3, dias: '20th-26th', cor: 'bg-green-700', icone: '⚠️' },
  { nome: 'BLAST Rivals', tipo: 'BLAST', mes: 3, dias: '27th-3rd', cor: 'bg-yellow-700', icone: '⭐' },
  { nome: 'PGL Astana', tipo: 'PGL', mes: 4, dias: '7th-18th', cor: 'bg-red-700', icone: '🏆' },
  { nome: 'IEM USA', tipo: 'IEM', mes: 4, dias: '11th-17th', cor: 'bg-gray-700', icone: '⚪' },
  { nome: 'CAC', tipo: 'CAC', mes: 4, dias: '18th-24th', cor: 'bg-gray-800', icone: '❓' },
  { nome: 'SL StarSeries', tipo: 'StarSeries', mes: 4, dias: '25th-31st', cor: 'bg-red-900', icone: '⭐' },
  { nome: 'IEM Cologne Major', tipo: 'IEM', mes: 5, dias: '2nd-21st', cor: 'bg-yellow-900', icone: '⚪' },
  { nome: 'FISSURE Playgrounds', tipo: 'FISSURE', mes: 6, dias: '13th-19th', cor: 'bg-green-700', icone: '⚠️' },
  { nome: 'BLAST Bounty', tipo: 'BLAST', mes: 6, dias: '20th-2nd', cor: 'bg-blue-900', icone: '⭐' },
  { nome: 'PGL August', tipo: 'PGL', mes: 7, dias: '6th-16th', cor: 'bg-red-700', icone: '🏆' },
  { nome: 'Esports World Cup', tipo: 'EWC', mes: 7, dias: '10th-23rd', cor: 'bg-pink-700', icone: '❓' },
  { nome: 'BLAST Open S2', tipo: 'BLAST', mes: 7, dias: '24th-6th', cor: 'bg-blue-900', icone: '⭐' },
  { nome: 'Skyesports Event', tipo: 'Skyesports', mes: 8, dias: '7th-10th', cor: 'bg-gray-800', icone: '❓' },
  { nome: 'FISSURE Playgrounds', tipo: 'FISSURE', mes: 8, dias: '7th-13th', cor: 'bg-green-700', icone: '⚠️' },
  { nome: 'SL StarSeries', tipo: 'StarSeries', mes: 8, dias: '11th-20th', cor: 'bg-red-900', icone: '⭐' },
  { nome: 'EPL S24', tipo: 'EPL', mes: 8, dias: '21st-11th', cor: 'bg-yellow-700', icone: '❓' },
  { nome: 'PGL October', tipo: 'PGL', mes: 9, dias: '1st-11th', cor: 'bg-red-700', icone: '🏆' },
  { nome: 'Forge of Legends', tipo: 'Forge', mes: 9, dias: '13th-18th', cor: 'bg-gray-800', icone: '❓' },
  { nome: 'PGL Belgrade', tipo: 'PGL', mes: 9, dias: '22nd-1st', cor: 'bg-red-700', icone: '🏆' },
  { nome: 'IEM China', tipo: 'IEM', mes: 10, dias: '2nd-8th', cor: 'bg-gray-700', icone: '⚪' },
  { nome: 'BLAST Rivals S2', tipo: 'BLAST', mes: 10, dias: '9th-15th', cor: 'bg-yellow-700', icone: '⭐' },
  { nome: 'Major #2', tipo: 'Major', mes: 10, dias: '25th-13th', cor: 'bg-yellow-900', icone: '🏆' }
];

function renderCalendarioEventos() {
  const meses = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const container = document.getElementById('lista-calendario');
  if (!container) return;
  container.innerHTML = '';
  for (let m = 0; m < 12; m++) {
    const eventosMes = EVENTOS_FIXOS.filter(ev => ev.mes === m);
    const mesDiv = document.createElement('div');
    mesDiv.className = 'mb-6';
    mesDiv.innerHTML = `<h3 class="font-bold text-lg mb-2">${meses[m]}</h3>`;
    if (eventosMes.length === 0) {
      mesDiv.innerHTML += `<div class='text-gray-400 text-sm'>No events yet</div>`;
    } else {
      const ano = (new Date()).getFullYear();
      const inscricoes = getInscricoesCampeonatos(ano);
      const dataJogo = getDataJogo ? getDataJogo() : new Date();
      eventosMes.forEach(ev => {
        const inscrito = inscricoes.includes(ev.nome);
        // Calcula data de início do evento (aproximação: dia 1 do mês + offset se possível)
        let diaInicio = 1;
        const match = ev.dias.match(/(\d+)[a-z]{2}/i);
        if (match) diaInicio = parseInt(match[1]);
        const dataEvento = new Date(ano, ev.mes, diaInicio);
        // Prazo limite: 3 semanas antes
        const limiteInscricao = new Date(dataEvento.getTime() - 21*24*60*60*1000);
        const podeInscrever = dataJogo < limiteInscricao;
        // Período de inscrição: de 3 semanas antes até o início do evento
        const agora = dataJogo;
        const inscricaoAbre = new Date(dataEvento.getTime() - 21*24*60*60*1000);
        const inscricaoFecha = new Date(dataEvento.getTime());
        let btnInscrever = '';
        if (!inscrito && agora >= inscricaoAbre && agora < inscricaoFecha) {
          btnInscrever = `<button onclick=\"inscreverNoCampeonato('${ev.nome}')\" class=\"ml-2 px-2 py-1 rounded bg-green-500 hover:bg-green-600 text-xs\">Inscrever</button>`;
        } else if (inscrito) {
          btnInscrever = `<button disabled style='opacity:0.5' class=\"ml-2 px-2 py-1 rounded bg-green-500 text-xs\">Inscrito</button>`;
        }
        mesDiv.innerHTML += `<div class=\"flex items-center gap-2 mb-1 p-2 rounded ${ev.cor} text-white\">
          <span>${ev.icone}</span>
          <span class=\"font-semibold\">${ev.nome}</span>
          <span class=\"text-xs ml-2\">${ev.dias}</span>
          <span class=\"ml-2 text-xs\">${ev.tipo}</span>
          ${btnInscrever}
          ${inscrito ? `<button onclick=\"jogarCampeonato('${ev.nome}')\" class=\"ml-2 px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-xs\">Jogar</button>` : ''}
        </div>`;
      });
    }
    container.appendChild(mesDiv);
  }
}

document.addEventListener('DOMContentLoaded', renderCalendarioEventos);
