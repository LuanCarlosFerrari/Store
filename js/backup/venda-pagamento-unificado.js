/**
 * Controlador Unificado de Vendas e Pagamentos
 * Interface integrada para registrar vendas com configuração de pagamento
 */

class VendaPagamentoUnificadoController {
    constructor(produtoController, clienteController, databaseController, pagamentoController, appController) {
        this.produtoController = produtoController;
        this.clienteController = clienteController;
        this.database = databaseController;
        this.pagamentoController = pagamentoController;
        this.appController = appController;
        this.vendas = [];
        this.loading = false;

        this.initEventListeners();
        this.carregarDados();
    }

    initEventListeners() {
        // Formulário principal
        const form = document.querySelector('#caixa form');
        if (form) {
            form.addEventListener('submit', (e) => this.processarVendaCompleta(e));
        }

        // Auto-calcular valor total
        this.configurarCalculoAutomatico();

        // Configurar tipo de venda
        this.configurarTipoVenda();

        // Configurar parcelas
        this.configurarParcelas();

        // Atualizar resumo em tempo real
        this.configurarResumoTempo();
    }

    configurarCalculoAutomatico() {
        const selectProduto = document.getElementById('selectProduto');
        const inputQuantidade = document.getElementById('inputQuantidade');
        const inputValor = document.getElementById('inputValorTotal');

        if (selectProduto && inputQuantidade && inputValor) {
            const calcularTotal = () => {
                const produtoId = selectProduto.value;
                const quantidade = parseInt(inputQuantidade.value) || 0;

                if (produtoId && quantidade > 0) {
                    const produto = this.produtoController.obterProduto(produtoId);
                    if (produto) {
                        const total = produto.preco * quantidade;
                        inputValor.value = total.toFixed(2);
                        this.atualizarResumo();
                    }
                }
            };

            selectProduto.addEventListener('change', calcularTotal);
            inputQuantidade.addEventListener('input', calcularTotal);
        }
    }

    configurarTipoVenda() {
        const tipoVenda = document.getElementById('tipoVendaUnificado');
        const divVencimento = document.getElementById('divVencimentoUnificado');
        const divParcelas = document.getElementById('divParcelasUnificado');

        if (tipoVenda) {
            tipoVenda.addEventListener('change', () => {
                const valor = tipoVenda.value;
                
                if (valor === 'a_vista') {
                    divVencimento.classList.add('hidden');
                    divParcelas.classList.add('hidden');
                } else if (valor === 'a_prazo') {
                    divVencimento.classList.remove('hidden');
                    divParcelas.classList.add('hidden');
                } else if (valor === 'parcelada') {
                    divVencimento.classList.remove('hidden');
                    divParcelas.classList.remove('hidden');
                }
                
                this.atualizarResumo();
            });
        }
    }

    configurarParcelas() {
        const numeroParcelas = document.getElementById('numeroParcelasUnificado');
        const valorTotal = document.getElementById('inputValorTotal');
        const valorParcela = document.getElementById('valorParcelaUnificado');

        if (numeroParcelas && valorTotal && valorParcela) {
            const calcularParcela = () => {
                const total = parseFloat(valorTotal.value) || 0;
                const parcelas = parseInt(numeroParcelas.value) || 1;
                
                if (total > 0 && parcelas > 0) {
                    const valorPorParcela = total / parcelas;
                    valorParcela.value = `R$ ${valorPorParcela.toFixed(2).replace('.', ',')}`;
                }
            };

            numeroParcelas.addEventListener('input', calcularParcela);
            valorTotal.addEventListener('input', calcularParcela);
        }
    }

    configurarResumoTempo() {
        // Atualizar resumo quando qualquer campo relevante mudar
        const campos = [
            'inputValorTotal',
            'tipoVendaUnificado',
            'metodoPagamentoUnificado',
            'numeroParcelasUnificado'
        ];

        campos.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.addEventListener('change', () => this.atualizarResumo());
                elemento.addEventListener('input', () => this.atualizarResumo());
            }
        });
    }

    atualizarResumo() {
        const valorTotal = parseFloat(document.getElementById('inputValorTotal')?.value) || 0;
        const tipoVenda = document.getElementById('tipoVendaUnificado')?.value || 'a_vista';
        const numeroParcelas = parseInt(document.getElementById('numeroParcelasUnificado')?.value) || 1;

        // Atualizar elementos do resumo
        const resumoValor = document.getElementById('resumoValorTotal');
        const resumoTipo = document.getElementById('resumoTipo');
        const resumoStatus = document.getElementById('resumoStatus');

        if (resumoValor) {
            resumoValor.textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
        }

        if (resumoTipo && resumoStatus) {
            let tipoTexto = '';
            let statusTexto = '';
            let statusClass = '';

            switch (tipoVenda) {
                case 'a_vista':
                    tipoTexto = 'À Vista';
                    statusTexto = 'Será pago imediatamente';
                    statusClass = 'text-green-600';
                    break;
                case 'a_prazo':
                    tipoTexto = 'À Prazo';
                    statusTexto = 'Ficará pendente até vencimento';
                    statusClass = 'text-yellow-600';
                    break;
                case 'parcelada':
                    tipoTexto = `Parcelada (${numeroParcelas}x)`;
                    statusTexto = `${numeroParcelas} parcelas a receber`;
                    statusClass = 'text-blue-600';
                    break;
            }

            resumoTipo.textContent = tipoTexto;
            resumoStatus.textContent = statusTexto;
            resumoStatus.className = `font-medium ${statusClass}`;
        }
    }

    async processarVendaCompleta(e) {
        e.preventDefault();
        if (this.loading) return;

        // Coletar dados do formulário
        const dadosVenda = this.coletarDadosVenda();
        const dadosPagamento = this.coletarDadosPagamento();

        if (!this.validarDados(dadosVenda, dadosPagamento)) {
            return;
        }

        this.showLoading(true);
        
        try {
            // Verificar estoque
            const produto = this.produtoController.obterProduto(dadosVenda.produtoId);
            if (!produto || produto.quantidade < dadosVenda.quantidade) {
                throw new Error(`Estoque insuficiente! Disponível: ${produto?.quantidade || 0} unidades`);
            }

            // Criar venda
            let novaVenda;
            if (this.database) {
                novaVenda = await this.database.criarVenda({
                    cliente_id: dadosVenda.clienteId,
                    produto_id: dadosVenda.produtoId,
                    quantidade: dadosVenda.quantidade,
                    valor_unitario: dadosVenda.valorUnitario,
                    valor_total: dadosVenda.valorTotal
                });

                // Criar pagamento
                if (this.pagamentoController) {
                    await this.pagamentoController.criarPagamento({
                        venda_id: novaVenda.id,
                        valor_total: dadosPagamento.valorTotal,
                        valor_pago: dadosPagamento.valorPago,
                        metodo_pagamento: dadosPagamento.metodoPagamento,
                        data_vencimento: dadosPagamento.dataVencimento,
                        numero_parcelas: dadosPagamento.numeroParcelas,
                        status: dadosPagamento.status,
                        observacoes: dadosPagamento.observacoes
                    });
                }

                // Atualizar estoque
                await this.produtoController.atualizarEstoque(
                    dadosVenda.produtoId, 
                    produto.quantidade - dadosVenda.quantidade
                );

            } else {
                // Fallback para dados locais
                novaVenda = {
                    id: Date.now().toString(),
                    data_venda: new Date().toISOString().split('T')[0],
                    cliente_id: dadosVenda.clienteId,
                    produto_id: dadosVenda.produtoId,
                    quantidade: dadosVenda.quantidade,
                    valor_total: dadosVenda.valorTotal,
                    clientes: this.clienteController.obterCliente(dadosVenda.clienteId),
                    produtos: produto
                };

                this.vendas.unshift(novaVenda);
                this.renderizarHistorico();
            }

            // Recarregar dados
            await this.carregarDados();
            await this.atualizarResumoFinanceiro();

            // Limpar formulário
            this.limparFormulario();

            // Mostrar mensagem de sucesso
            const tipoMensagem = dadosPagamento.status === 'pago' ? 'Venda e pagamento registrados' : 'Venda registrada';
            this.showMessage(`${tipoMensagem} com sucesso!`, 'success');

            // Atualizar dashboard
            if (this.appController) {
                await this.appController.atualizarDashboard();
            }

        } catch (error) {
            console.error('Erro ao processar venda:', error);
            this.showMessage('Erro ao processar venda: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    coletarDadosVenda() {
        const clienteId = document.getElementById('selectCliente').value;
        const produtoId = document.getElementById('selectProduto').value;
        const quantidade = parseInt(document.getElementById('inputQuantidade').value);
        const valorTotal = parseFloat(document.getElementById('inputValorTotal').value);

        return {
            clienteId,
            produtoId,
            quantidade,
            valorTotal,
            valorUnitario: valorTotal / quantidade
        };
    }

    coletarDadosPagamento() {
        const tipoVenda = document.getElementById('tipoVendaUnificado').value;
        const metodoPagamento = document.getElementById('metodoPagamentoUnificado').value;
        const observacoes = document.getElementById('observacoesUnificado').value;
        const valorTotal = parseFloat(document.getElementById('inputValorTotal').value);
        
        let dataVencimento = new Date();
        let numeroParcelas = 1;
        let valorPago = valorTotal;
        let status = 'pago';

        if (tipoVenda === 'a_prazo') {
            const diasVencimento = parseInt(document.getElementById('diasVencimentoUnificado').value) || 30;
            dataVencimento.setDate(dataVencimento.getDate() + diasVencimento);
            valorPago = 0;
            status = 'pendente';
        } else if (tipoVenda === 'parcelada') {
            numeroParcelas = parseInt(document.getElementById('numeroParcelasUnificado').value) || 1;
            const diasVencimento = parseInt(document.getElementById('diasVencimentoUnificado').value) || 30;
            dataVencimento.setDate(dataVencimento.getDate() + diasVencimento);
            valorPago = 0;
            status = 'pendente';
        }

        return {
            valorTotal,
            valorPago,
            metodoPagamento,
            dataVencimento: dataVencimento.toISOString().split('T')[0],
            numeroParcelas,
            status,
            observacoes
        };
    }

    validarDados(dadosVenda, dadosPagamento) {
        if (!dadosVenda.clienteId || !dadosVenda.produtoId || 
            dadosVenda.quantidade <= 0 || dadosVenda.valorTotal <= 0) {
            this.showMessage('Por favor, preencha todos os campos obrigatórios', 'error');
            return false;
        }

        if (!dadosPagamento.metodoPagamento) {
            this.showMessage('Por favor, selecione um método de pagamento', 'error');
            return false;
        }

        return true;
    }    async carregarDados() {
        console.log('VendaPagamentoUnificado: Carregando dados...');
        
        if (this.database && this.pagamentoController) {
            try {
                // Carregar vendas com informações de pagamento
                console.log('Chamando database.listarVendas()...');
                this.vendas = await this.database.listarVendas();
                console.log('Vendas carregadas:', this.vendas.length, this.vendas);
                this.renderizarHistorico();
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                // Mostrar erro na tabela
                const tbody = document.getElementById('corpoTabelaVendasUnificado');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="8" class="border px-2 py-4 text-red-500 text-center">Erro ao carregar vendas: ' + error.message + '</td></tr>';
                }
            }
        } else {
            console.error('Database ou pagamentoController não disponível');
            console.log('Database:', this.database);
            console.log('PagamentoController:', this.pagamentoController);
        }

        this.atualizarSelects();
        await this.atualizarResumoFinanceiro();
    }

    atualizarSelects() {
        this.atualizarSelectClientes();
        this.atualizarSelectProdutos();
    }

    atualizarSelectClientes() {
        const selectCliente = document.getElementById('selectCliente');
        if (!selectCliente) return;

        selectCliente.innerHTML = '<option value="">Selecione um cliente</option>';
        
        const clientes = this.clienteController.obterTodos();
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.nome;
            selectCliente.appendChild(option);
        });
    }

    atualizarSelectProdutos() {
        const selectProduto = document.getElementById('selectProduto');
        if (!selectProduto) return;

        selectProduto.innerHTML = '<option value="">Selecione um produto</option>';
        
        const produtos = this.produtoController.obterTodos();
        produtos.forEach(produto => {
            if (produto.quantidade > 0) {
                const option = document.createElement('option');
                option.value = produto.id;
                option.textContent = `${produto.nome} - Estoque: ${produto.quantidade} - R$ ${produto.preco.toFixed(2)}`;
                selectProduto.appendChild(option);
            }
        });
    }    renderizarHistorico() {
        const tbody = document.getElementById('corpoTabelaVendasUnificado');
        if (!tbody) return;

        console.log('Renderizando histórico com vendas:', this.vendas);

        if (this.vendas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="border px-2 py-4 text-gray-500 text-center">Nenhuma venda registrada</td></tr>';
            return;
        }

        tbody.innerHTML = this.vendas.map(venda => {
            console.log('Processando venda:', venda);
            
            const dataFormatada = new Date(venda.data_venda).toLocaleDateString('pt-BR');
            const clienteNome = venda.clientes?.nome || 'Cliente não encontrado';
            const produtoNome = venda.produtos?.nome || 'Produto não encontrado';
            
            // Informações de pagamento (se disponível)
            let metodoPagamento = 'Não definido';
            let statusPagamento = 'Sem pagamento';
            let corStatus = 'text-gray-500';
            
            // Verificar se há pagamentos associados
            if (venda.pagamentos && Array.isArray(venda.pagamentos) && venda.pagamentos.length > 0) {
                const pagamento = venda.pagamentos[0];
                console.log('Pagamento encontrado:', pagamento);
                
                metodoPagamento = this.getMetodoText(pagamento.metodo_pagamento);
                
                switch(pagamento.status) {
                    case 'pago':
                        statusPagamento = 'Pago';
                        corStatus = 'text-green-600';
                        break;
                    case 'pendente':
                        statusPagamento = 'Pendente';
                        corStatus = 'text-yellow-600';
                        break;
                    case 'parcial':
                        statusPagamento = 'Parcial';
                        corStatus = 'text-blue-600';
                        break;
                    case 'vencido':
                        statusPagamento = 'Vencido';
                        corStatus = 'text-red-600';
                        break;
                    default:
                        statusPagamento = pagamento.status || 'Indefinido';
                        corStatus = 'text-gray-600';
                }
            } else {
                console.log('Nenhum pagamento encontrado para venda:', venda.id);
            }

            return `
                <tr class="hover:bg-gray-50">
                    <td class="border px-2 py-1">${dataFormatada}</td>
                    <td class="border px-2 py-1">${clienteNome}</td>
                    <td class="border px-2 py-1">${produtoNome}</td>
                    <td class="border px-2 py-1">${venda.quantidade}</td>
                    <td class="border px-2 py-1">R$ ${venda.valor_total.toFixed(2).replace('.', ',')}</td>
                    <td class="border px-2 py-1">${metodoPagamento}</td>
                    <td class="border px-2 py-1 ${corStatus}">${statusPagamento}</td>
                    <td class="border px-2 py-1">
                        <button onclick="verDetalhesVenda('${venda.id}')" 
                                class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                            Ver
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async atualizarResumoFinanceiro() {
        try {
            // Calcular métricas do dia atual
            const hoje = new Date().toISOString().split('T')[0];
            
            let vendasHoje = 0;
            let recebidoHoje = 0;
            let aReceberTotal = 0;
            let emAtrasoTotal = 0;

            if (this.pagamentoController) {
                const pagamentos = await this.pagamentoController.listarPagamentos();
                
                pagamentos.forEach(pagamento => {
                    const dataVenda = pagamento.vendas?.data_venda;
                    
                    // Vendas de hoje
                    if (dataVenda === hoje) {
                        vendasHoje += pagamento.valor_total;
                        
                        // Recebido hoje (se status for pago)
                        if (pagamento.status === 'pago') {
                            recebidoHoje += pagamento.valor_pago;
                        }
                    }
                    
                    // Total a receber
                    if (pagamento.status !== 'pago') {
                        const valorRestante = pagamento.valor_total - pagamento.valor_pago;
                        
                        if (pagamento.status === 'vencido' || 
                            (new Date(pagamento.data_vencimento) < new Date() && pagamento.status === 'pendente')) {
                            emAtrasoTotal += valorRestante;
                        } else {
                            aReceberTotal += valorRestante;
                        }
                    }
                });
            }

            // Atualizar elementos da interface
            this.updateElementValue('vendasHoje', vendasHoje);
            this.updateElementValue('recebidoHoje', recebidoHoje);
            this.updateElementValue('aReceberTotal', aReceberTotal);
            this.updateElementValue('emAtrasoTotal', emAtrasoTotal);

        } catch (error) {
            console.error('Erro ao atualizar resumo financeiro:', error);
        }
    }

    updateElementValue(elementId, valor) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `R$ ${valor.toFixed(2).replace('.', ',')}`;
        }
    }

    getMetodoText(metodo) {
        const metodoMap = {
            'dinheiro': 'Dinheiro',
            'pix': 'PIX',
            'cartao_debito': 'Cartão Débito',
            'cartao_credito': 'Cartão Crédito',
            'transferencia': 'Transferência',
            'boleto': 'Boleto'
        };
        return metodoMap[metodo] || metodo;
    }

    limparFormulario() {
        const form = document.querySelector('#caixa form');
        if (form) {
            form.reset();
            
            // Resetar campos específicos
            document.getElementById('tipoVendaUnificado').value = 'a_vista';
            document.getElementById('divVencimentoUnificado').classList.add('hidden');
            document.getElementById('divParcelasUnificado').classList.add('hidden');
            
            this.atualizarResumo();
        }
    }

    showLoading(show) {
        // Implementar indicador de loading se necessário
        this.loading = show;
    }

    showMessage(message, type) {
        // Criar elemento de mensagem se não existir
        let messageEl = document.getElementById('message-venda-unificado');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'message-venda-unificado';
            messageEl.className = 'mt-4 p-3 rounded-md text-sm';

            const container = document.getElementById('caixa');
            if (container) {
                container.insertBefore(messageEl, container.firstChild);
            }
        }

        messageEl.textContent = message;
        messageEl.className = `mt-4 p-3 rounded-md text-sm ${type === 'success'
            ? 'bg-green-100 text-green-700 border border-green-300'
            : 'bg-red-100 text-red-700 border border-red-300'
            }`;
        messageEl.style.display = 'block';

        // Ocultar após 5 segundos
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
}

// Exportar para uso global
window.VendaPagamentoUnificadoController = VendaPagamentoUnificadoController;

// Funções globais para uso nos botões
window.atualizarHistoricoVendas = function() {
    if (window.vendaPagamentoUnificado) {        window.vendaPagamentoUnificado.carregarDados();
    }
};

window.verDetalhesVenda = function(vendaId) {
    // TODO: Implementar modal de detalhes da venda
    alert('Detalhes da venda serão implementados em breve');
};

// Função de debug para verificar dados de vendas
window.debugVendasData = async function() {
    console.log('=== DEBUG: DADOS DE VENDAS ===');
    
    if (window.app && window.app.databaseController) {
        try {
            const vendas = await window.app.databaseController.listarVendas();
            console.log('Total de vendas encontradas:', vendas.length);
            
            vendas.forEach((venda, index) => {
                console.log(`Venda ${index + 1}:`, {
                    id: venda.id,
                    data_venda: venda.data_venda,
                    cliente: venda.clientes?.nome,
                    produto: venda.produtos?.nome,
                    valor_total: venda.valor_total,
                    pagamentos: venda.pagamentos
                });
            });
            
            // Verificar também os pagamentos diretamente
            if (window.app.pagamentosController) {
                const pagamentos = await window.app.pagamentosController.listarPagamentos();
                console.log('Total de pagamentos encontrados:', pagamentos.length);
                pagamentos.forEach((pagamento, index) => {
                    console.log(`Pagamento ${index + 1}:`, {
                        id: pagamento.id,
                        venda_id: pagamento.venda_id,
                        metodo_pagamento: pagamento.metodo_pagamento,
                        status: pagamento.status,
                        valor_total: pagamento.valor_total
                    });
                });
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    }
      console.log('=== FIM DEBUG ===');
};

// Função para verificar se as tabelas de pagamentos existem
window.verificarTabelasPagamentos = async function() {
    if (window.app && window.app.databaseController) {
        return await window.app.databaseController.verificarTabelasPagamentos();
    }
    console.error('DatabaseController não disponível');
};
