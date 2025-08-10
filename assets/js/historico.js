// --- HISTÓRICO DE SIMULAÇÕES ---
// Renderiza o histórico de simulações na lista do HTML
function renderHistoricoSimulacoes() {
  const lista = document.getElementById("lista-simulacoes");
  if (!lista) return;
  const historico = JSON.parse(localStorage.getItem("simulacoes")) || [];

  lista.innerHTML = "";

  // Conta vitórias e derrotas
  let vitorias = 0,
    derrotas = 0;
  historico.forEach((sim) => {
    if (sim.resultado === "Vitória") vitorias++;
    if (sim.resultado === "Derrota") derrotas++;
  });

  // Adiciona resumo no topo
  const resumo = document.createElement("div");
  resumo.className = "mb-3 font-semibold";
  resumo.innerHTML = `Vitórias: <span class="text-green-600">${vitorias}</span> &nbsp; | &nbsp; Derrotas: <span class="text-red-600">${derrotas}</span>`;
  lista.appendChild(resumo);

  // Exibe o histórico em ordem reversa (mais recente primeiro)
  historico
    .slice()
    .reverse()
    .forEach((sim, index) => {
      const item = document.createElement("li");
      item.className = "bg-gray-50 p-3 rounded border";
      item.innerHTML = `
      <p class="font-semibold">${sim.resultado} - Placar: ${sim.roundsTime} x ${sim.roundsAdversario}</p>
    `;
      lista.appendChild(item);
    });
}

// Botão para limpar todo o histórico de simulações
const btnLimparHistorico = document.querySelector("#btn-resetar-historico");
if (btnLimparHistorico) {
  btnLimparHistorico.addEventListener("click", () => {
    if (
      confirm("Tem certeza que deseja limpar todo o histórico de simulações?")
    ) {
      localStorage.removeItem("simulacoes");
      renderHistoricoSimulacoes();
      // Também escondemos o resultado atual da simulação, se quiser:
      const container = document.getElementById("resultado-simulacao");
      if (container) container.classList.add("hidden");
    }
  });
}