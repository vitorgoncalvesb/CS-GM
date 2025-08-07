Próximos passos recomendados
1. Botão “Liberar jogador” no Elenco
Permitir remover jogadores do elenco.

Atualizar localStorage para refletir a remoção.

Devolver o jogador para o mercado (opcional).

2. Gerenciamento de orçamento (budget)
Definir um orçamento inicial para o time.

Deduzir o valor dos jogadores contratados.

Exibir orçamento atual nas páginas relevantes.

Bloquear contratações caso o budget não permita.

3. Simulação mais detalhada
Criar simulação com estatísticas (kills, assistências, mortes).

Guardar resultados no localStorage para histórico.

Mostrar tendências e impacto no elenco e estatísticas.

4. Sistema de temporadas
Permitir avançar para a próxima temporada.

Resetar algumas variáveis (ex: orçamento, mercado).

Salvar histórico de temporadas.

5. Estatísticas com gráficos
Usar uma biblioteca como Chart.js para mostrar gráficos de desempenho.

Estatísticas dos jogadores, do time e resultados das partidas.

6. Customização do time
Nome do time, logo (upload de imagem), cores.

Salvar essas configurações localmente.

7. Interface responsiva e aprimoramentos visuais
Ajustar CSS para ficar ótimo em mobile/tablet.

Melhorar feedbacks visuais (ex: loading, animações).


 FFFFFFFFFFFFUNFFFFFFFFFFFFFFFFFFFFFÇ

function renderMercado() {
  const mercado = document.querySelector("#mercado-lista");
  if (!mercado) return;

  mercado.innerHTML = "";

  jogadoresMercado.forEach((jogador, i) => {
    const div = document.createElement("div");
    div.className = "bg-white border p-4 flex justify-between items-center";
    div.innerHTML = `
      <div>
        <strong>${jogador.nome}</strong> - ${
      jogador.funcao
    } | Valor: $${jogador.preco.toLocaleString()}
      </div>
      <button class="contratar-btn bg-green-600 text-white px-3 py-1 rounded" data-index="${i}">
        Contratar
      </button>
    `;
    mercado.appendChild(div);
  });
}

div.innerHTML = `
      <div class="w-3/4">
        <div class="flex items-center gap-2">
          <strong>${jogador.nome}</strong> 
          <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">${jogador.funcao}</span>
          <span class="text-yellow-600 font-medium">${jogador.rating || calcularRating(jogador)}</span>
        </div>
        <div class="grid grid-cols-3 gap-1 mt-2 text-xs">
          <div>🔫 ${jogador.mira}</div>
          <div>💪 ${jogador.clutch}</div>
          <div>🛡️ ${jogador.suporte}</div>
          <div>🎯 ${jogador.hs}</div>
          <div>🏃 ${jogador.movimentacao}</div>
          <div>🔥 ${jogador.agressividade}</div>
        </div>
      </div>
      <button class="contratar-btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition">
        $${jogador.preco.toLocaleString()}
      </button>
    `;