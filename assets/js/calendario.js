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
  const ano = (new Date()).getFullYear();
  // Participantes: time do usuário + times IA (pega times do mercado)
  const userTeam = localStorage.getItem('timeSelecionado') || 'Seu Time';
  let participantes = [userTeam];
  // Pega times únicos do mercado
  let mercado = JSON.parse(localStorage.getItem('mercado') || '[]');
  let timesIA = Array.from(new Set(mercado.map(j => j.time).filter(t => t && t !== userTeam)));
  // Limita para 8 ou 16 times (torneio eliminatório)
  while (timesIA.length < 7) timesIA.push('Bot_' + (timesIA.length+1));
  participantes = participantes.concat(timesIA.slice(0, 7)); // 8 times
  // Embaralha
  participantes = participantes.sort(() => Math.random() - 0.5);

  // Simula quartas, semi, final
  let fase = participantes;
  let fases = [fase.slice()];
  let resultados = [];
  while (fase.length > 1) {
    let prox = [];
    let faseRes = [];
    for (let i = 0; i < fase.length; i += 2) {
      const t1 = fase[i];
      const t2 = fase[i+1];
      // Simula força: rating médio do elenco
      let r1 = t1 === userTeam ? calcularRatingTime() : ratingTimeIA(t1, mercado);
      let r2 = t2 === userTeam ? calcularRatingTime() : ratingTimeIA(t2, mercado);
      // Randomização leve
      r1 += Math.random() * 5 - 2.5;
      r2 += Math.random() * 5 - 2.5;
      // Simulação realista de placar CS2 (MR13, overtime se empatar)
      let rounds1 = 0, rounds2 = 0;
      // Tempo normal: até 13
      if (r1 === r2) {
        // Empate, força overtime
        rounds1 = 13;
        rounds2 = 13;
      } else if (r1 > r2) {
        rounds1 = 13;
        // Adversário faz de 3 a 11
        rounds2 = Math.max(3, Math.min(11, Math.round(7 + Math.random()*4)));
      } else {
        rounds2 = 13;
        rounds1 = Math.max(3, Math.min(11, Math.round(7 + Math.random()*4)));
      }
      // Overtime
      let overtime = false;
      if (rounds1 === 13 && rounds2 === 13) {
        overtime = true;
        let ot1 = 0, ot2 = 0;
        // Overtime: ganha quem abrir 4 de diferença após 3x3, repete se empatar
        do {
          ot1 += Math.floor(Math.random()*4)+1;
          ot2 += Math.floor(Math.random()*4)+1;
        } while (Math.abs(ot1-ot2) < 4);
        if (ot1 > ot2) {
          rounds1 += ot1;
          rounds2 += ot2;
        } else {
          rounds2 += ot2;
          rounds1 += ot1;
        }
      }
      let vencedor;
      if (rounds1 > rounds2) vencedor = t1;
      else vencedor = t2;
      let placar = overtime ? `${rounds1}x${rounds2} (OT)` : `${rounds1}x${rounds2}`;
      prox.push(vencedor);
      faseRes.push({ t1, t2, vencedor, placar });
    }
    resultados.push(faseRes);
    fase = prox;
    fases.push(fase.slice());
  }
  const campeao = fase[0];

  // Salva histórico
  let hist = JSON.parse(localStorage.getItem('historicoCampeonatos') || '[]');
  hist.push({ nome: nomeEvento, ano, campeao, fases: resultados });
  localStorage.setItem('historicoCampeonatos', JSON.stringify(hist));

  // Mostra resultado ao usuário
  let msg = `Simulação de ${nomeEvento} (${ano})\n`;
  resultados.forEach((fase, idx) => {
    msg += `\n${['Quartas','Semifinal','Final'][idx] || 'Fase'}:`;
    fase.forEach(jogo => {
      msg += `\n${jogo.t1} ${jogo.placar} ${jogo.t2}  →  Vencedor: ${jogo.vencedor}`;
    });
  });
  msg += `\n\nCampeão: ${campeao}`;
  alert(msg);
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
