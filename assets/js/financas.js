const ORCAMENTO_INICIAL = 1200000; // Orçamento inicial: 1200k

// Inicializa o orçamento no localStorage se não existir
function inicializarOrcamento() {
  if (!localStorage.getItem("orcamento")) {
    localStorage.setItem("orcamento", ORCAMENTO_INICIAL);
  }
}

// Recupera o orçamento atual (número)
function getOrcamento() {
  return Number(localStorage.getItem("orcamento")) || 0;
}

// Atualiza o orçamento no localStorage
function setOrcamento(valor) {
  localStorage.setItem("orcamento", valor);
}

// Atualiza o display do orçamento na tela
function atualizarOrcamentoDisplay() {
  const display = document.querySelector("#orcamento-display");
  if (!display) return;

  const orcamento = getOrcamento();
  display.textContent = `Orçamento atual: $${orcamento.toLocaleString()}`;
}