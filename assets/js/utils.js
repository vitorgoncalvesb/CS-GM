// --- CALCULAR RATING ---
// Função para calcular rating ponderado
function calcularRating(jogador) {
  // Normaliza cada atributo para 0-1
  function norm(val) {
    return Math.max(0, Math.min(1, (val - 60) / 40)); // Assume atributos entre 60 e 100
  }

  const pesos = PESOS_ATRIBUTOS[jogador.funcao] || PESOS_ATRIBUTOS.Duelista;

  // Rating base pelos atributos principais
  let ratingBase =
    norm(jogador.mira) * pesos.mira +
    norm(jogador.clutch) * pesos.clutch +
    norm(jogador.suporte) * pesos.suporte +
    norm(jogador.hs) * pesos.hs +
    norm(jogador.movimentacao) * pesos.movimentacao +
    norm(jogador.agressividade) * pesos.agressividade;

  // Se houver estatísticas recentes, bonifica o rating
  let bonus = 0;
  if (jogador.stats && jogador.stats.kd) {
    bonus += Math.max(
      0,
      Math.min(0.15, (parseFloat(jogador.stats.kd) - 1) * 0.1)
    );
  }
  if (jogador.stats && jogador.stats.kills) {
    bonus += Math.max(
      0,
      Math.min(0.1, (parseInt(jogador.stats.kills) - 10) * 0.01)
    );
  }

  // Rating final entre RATING_MIN e RATING_MAX
  let ratingFinal =
    RATING_MIN + (RATING_MAX - RATING_MIN) * (ratingBase + bonus);
  ratingFinal = Math.max(
    RATING_MIN,
    Math.min(RATING_MAX, Math.round(ratingFinal))
  );

  return ratingFinal;
}

const RATING_MIN = 40; // Jogador muito ruim
const RATING_MAX = 95; // Jogador excepcional
const RATING_IMPACT = 0.015; // Quanto cada ponto de rating afeta a performance

// Função que limita o K/D por player
function calcularKDlimitado(kills, deaths) {
  deaths = Math.max(1, deaths);
  const kdBruto = kills / deaths;
  // Novo limite mais realista
  return Math.max(0.4, Math.min(kdBruto, 3.5));
}