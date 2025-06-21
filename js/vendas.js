// Classe para gerenciar vendas e caixa
class VendaController {
    constructor(produtoController, clienteController, databaseController, pagamentoController = null, appController = null) {
        this.produtoController = produtoController;
        this.clienteController = clienteController;
        this.database = databaseController;
        this.pagamentoController = pagamentoController;
        this.appController = appController;
        this.vendas = [];
        this.loading = false;

        this.initEventListeners();
        this.carregarVendas();

        // Atualizar selects quando a aba for mostrada
        setTimeout(() => {
            this.atualizarSelects();
        }, 100);
    }

    async carregarVendas() {
        console.log('VendaController: Carregando vendas...');
        console.log('VendaController: Database disponível?', !!this.database);
        console.log('VendaController: Database objeto:', this.database);

        if (!this.database) {
            console.log('VendaController: Usando dados locais (fallback)');
            // Fallback para dados locais se database não estiver disponível
            this.vendas = [
                {
                    id: '1',
                    data_venda: '2025-01-20',
                    cliente_id: '1',
                    produto_id: '1',
                    quantidade: 3,
                    valor_total: 45.00,
                    clientes: { nome: 'Exemplo Cliente 1' },
                    produtos: { nome: 'Exemplo Produto 1' }
                }
            ];
            this.renderizarHistorico();

            // Notificar AppController para atualizar dashboard
            if (this.appController) {
                this.appController.atualizarDashboard();
            }
            return;
        }

        this.showLoading(true);
        try {
            console.log('VendaController: Buscando vendas no banco...');
            this.vendas = await this.database.listarVendas();
            console.log('VendaController: Vendas carregadas:', this.vendas.length);
            this.renderizarHistorico();

            // Notificar AppController para atualizar dashboard
            if (this.appController) {
                console.log('VendaController: Notificando AppController para atualizar dashboard');
                await this.appController.atualizarDashboard();
            }
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
            this.showMessage('Erro ao carregar vendas do servidor', 'error');
        } finally {
            this.showLoading(false);
        }
    } initEventListeners() {
        const form = document.querySelector('#caixa form');
        if (form) {
            form.addEventListener('submit', (e) => this.registrarVenda(e));
        }

        // Auto-calcular valor total quando produto e quantidade mudarem
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
                    }
                }
            };

            selectProduto.addEventListener('change', calcularTotal);
            inputQuantidade.addEventListener('input', calcularTotal);
        }

        // Event listeners para modal de pagamento
        const modalPagamento = document.getElementById('modalPagamento');
        const btnFecharModal = document.getElementById('fecharModalPagamento');
        const formPagamento = document.getElementById('formPagamento');

        if (btnFecharModal) {
            btnFecharModal.addEventListener('click', () => this.fecharModalPagamento());
        }

        if (formPagamento) {
            formPagamento.addEventListener('submit', (e) => this.processarPagamento(e));
        }

        // Atualizar campos de parcelas quando método ou tipo mudar
        const tipoVenda = document.getElementById('tipoVenda');
        const metodoPagamento = document.getElementById('metodoPagamento');
        const divParcelas = document.getElementById('divParcelas');

        if (tipoVenda && divParcelas) {
            tipoVenda.addEventListener('change', () => {
                divParcelas.style.display = tipoVenda.value === 'parcelada' ? 'block' : 'none';
            });
        }
    } async registrarVenda(e) {
        e.preventDefault();
        if (this.loading) return;

        console.log('VendaController: Registrando venda...');

        const form = e.target;
        const clienteId = document.getElementById('selectCliente').value;
        const produtoId = document.getElementById('selectProduto').value;
        const quantidade = parseInt(document.getElementById('inputQuantidade').value);
        const valorTotal = parseFloat(document.getElementById('inputValorTotal').value);

        console.log('VendaController: Dados da venda:', { clienteId, produtoId, quantidade, valorTotal });

        if (!clienteId || !produtoId || quantidade <= 0 || valorTotal <= 0) {
            this.showMessage('Por favor, preencha todos os campos corretamente', 'error');
            return;
        }

        // Verificar se há estoque suficiente
        const produto = this.produtoController.obterProduto(produtoId);
        if (!produto) {
            this.showMessage('Produto não encontrado!', 'error');
            return;
        }

        if (produto.quantidade < quantidade) {
            this.showMessage(`Estoque insuficiente! Disponível: ${produto.quantidade} unidades`, 'error');
            return;
        }

        // Armazenar dados da venda temporariamente para o modal de pagamento
        this.vendaTemporaria = {
            clienteId,
            produtoId,
            quantidade,
            valorTotal,
            valorUnitario: valorTotal / quantidade,
            produto,
            form
        };

        // Abrir modal de pagamento
        this.abrirModalPagamento();
    }

    abrirModalPagamento() {
        const modal = document.getElementById('modalPagamento');
        const valorTotalModal = document.getElementById('valorTotalModal');

        if (modal && valorTotalModal && this.vendaTemporaria) {
            valorTotalModal.textContent = `R$ ${this.vendaTemporaria.valorTotal.toFixed(2).replace('.', ',')}`;

            // Resetar formulário de pagamento
            const form = document.getElementById('formPagamento');
            if (form) {
                form.reset();
                document.getElementById('tipoVenda').value = 'a_vista';
                document.getElementById('divParcelas').style.display = 'none';
            }

            modal.classList.remove('hidden');
        }
    }

    fecharModalPagamento() {
        const modal = document.getElementById('modalPagamento');
        if (modal) {
            modal.classList.add('hidden');
            this.vendaTemporaria = null;
        }
    }

    async processarPagamento(e) {
        e.preventDefault();
        if (this.loading || !this.vendaTemporaria) return;

        this.showLoading(true);

        try {
            const tipoVenda = document.getElementById('tipoVenda').value;
            const metodoPagamento = document.getElementById('metodoPagamento').value;
            const observacoes = document.getElementById('observacoesPagamento').value;

            let dataVencimento = new Date();
            let numeroParcelas = 1;
            let valorPago = this.vendaTemporaria.valorTotal;
            let statusPagamento = 'pago';

            // Configurar baseado no tipo de venda
            if (tipoVenda === 'a_prazo') {
                const diasVencimento = parseInt(document.getElementById('diasVencimento').value) || 30;
                dataVencimento.setDate(dataVencimento.getDate() + diasVencimento);
                valorPago = 0;
                statusPagamento = 'pendente';
            } else if (tipoVenda === 'parcelada') {
                numeroParcelas = parseInt(document.getElementById('numeroParcelas').value) || 1;
                const diasVencimento = parseInt(document.getElementById('diasVencimento').value) || 30;
                dataVencimento.setDate(dataVencimento.getDate() + diasVencimento);
                valorPago = 0;
                statusPagamento = 'pendente';
            }

            // Criar venda primeiro
            let novaVenda;
            if (this.database) {
                console.log('VendaController: Salvando venda no banco de dados...');
                novaVenda = await this.database.criarVenda({
                    cliente_id: this.vendaTemporaria.clienteId,
                    produto_id: this.vendaTemporaria.produtoId,
                    quantidade: this.vendaTemporaria.quantidade,
                    valor_unitario: this.vendaTemporaria.valorUnitario,
                    valor_total: this.vendaTemporaria.valorTotal
                });

                // Criar pagamento
                if (this.pagamentoController) {
                    await this.pagamentoController.criarPagamento({
                        venda_id: novaVenda.id,
                        valor_total: this.vendaTemporaria.valorTotal,
                        valor_pago: valorPago,
                        metodo_pagamento: metodoPagamento,
                        data_vencimento: dataVencimento.toISOString().split('T')[0],
                        numero_parcelas: numeroParcelas,
                        status: statusPagamento,
                        observacoes: observacoes
                    });
                }

                // Atualizar estoque
                await this.produtoController.atualizarEstoque(
                    this.vendaTemporaria.produtoId,
                    this.vendaTemporaria.produto.quantidade - this.vendaTemporaria.quantidade
                );

            } else {
                console.log('VendaController: Database não disponível, usando fallback...');
                novaVenda = {
                    id: Date.now().toString(),
                    data_venda: new Date().toISOString().split('T')[0],
                    cliente_id: this.vendaTemporaria.clienteId,
                    produto_id: this.vendaTemporaria.produtoId,
                    quantidade: this.vendaTemporaria.quantidade,
                    valor_total: this.vendaTemporaria.valorTotal,
                    clientes: this.clienteController.obterCliente(this.vendaTemporaria.clienteId),
                    produtos: this.vendaTemporaria.produto
                };

                this.vendas.unshift(novaVenda);
                this.renderizarHistorico();

                // Atualizar estoque
                await this.produtoController.atualizarEstoque(
                    this.vendaTemporaria.produtoId,
                    this.vendaTemporaria.produto.quantidade - this.vendaTemporaria.quantidade
                );
            }

            // Recarregar vendas
            await this.carregarVendas();

            // Mostrar mensagem de sucesso
            const tipoMensagem = tipoVenda === 'a_vista' ? 'Venda registrada e paga' : 'Venda registrada';
            this.showMessage(`${tipoMensagem} com sucesso!`, 'success');

            // Notificar o AppController para atualizar o dashboard
            if (this.appController && typeof this.appController.atualizarDashboard === 'function') {
                await this.appController.atualizarDashboard();
            }

            // Fechar modal e resetar formulário
            this.fecharModalPagamento();
            this.vendaTemporaria.form.reset();

        } catch (error) {
            console.error('Erro ao processar pagamento:', error);
            this.showMessage('Erro ao processar pagamento: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderizarHistorico() {
        const tbody = document.getElementById('corpoTabelaVendas');
        if (tbody) {
            if (this.vendas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="border px-2 py-4 text-gray-500 text-center">Nenhuma venda registrada</td></tr>';
                return;
            }

            tbody.innerHTML = this.vendas.map(venda => {
                const dataFormatada = new Date(venda.data_venda).toLocaleDateString('pt-BR');
                const clienteNome = venda.clientes?.nome || 'Cliente não encontrado';
                const produtoNome = venda.produtos?.nome || 'Produto não encontrado';

                // Obter status do pagamento (se disponível)
                let statusPagamento = 'N/A';
                let corStatus = 'text-gray-500';

                if (venda.pagamentos && venda.pagamentos.length > 0) {
                    const pagamento = venda.pagamentos[0];
                    switch (pagamento.status) {
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
                    }
                }

                return `
                    <tr>
                        <td class="border px-2 py-1">${dataFormatada}</td>
                        <td class="border px-2 py-1">${clienteNome}</td>
                        <td class="border px-2 py-1">${produtoNome}</td>
                        <td class="border px-2 py-1">${venda.quantidade}</td>
                        <td class="border px-2 py-1">R$ ${venda.valor_total.toFixed(2).replace('.', ',')}</td>
                        <td class="border px-2 py-1 ${corStatus}">${statusPagamento}</td>
                    </tr>
                `;
            }).join('');
        }
    }

    obterVendasPorPeriodo(dataInicio, dataFim) {
        return this.vendas.filter(venda => {
            const dataVenda = new Date(venda.data_venda);
            return dataVenda >= dataInicio && dataVenda <= dataFim;
        });
    }

    calcularTotalVendas() {
        return this.vendas.reduce((total, venda) => total + venda.valor_total, 0);
    }

    showLoading(show) {
        const loadingEl = document.getElementById('loading-vendas');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }
    }

    showMessage(message, type) {
        // Criar elemento de mensagem se não existir
        let messageEl = document.getElementById('message-vendas');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'message-vendas';
            messageEl.className = 'mt-4 p-3 rounded-md text-sm';

            const form = document.querySelector('#caixa form');
            if (form) {
                form.parentNode.insertBefore(messageEl, form.nextSibling);
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

    async atualizarSelects() {
        console.log('VendaController: Atualizando selects...');
        this.atualizarSelectClientes();
        this.atualizarSelectProdutos();
    }

    atualizarSelectClientes() {
        console.log('VendaController: Atualizando select de clientes...');
        const selectCliente = document.getElementById('selectCliente');
        if (!selectCliente) {
            console.log('VendaController: Select de clientes não encontrado!');
            return;
        }

        // Limpar opções existentes (exceto a primeira)
        selectCliente.innerHTML = '<option value="">Selecione um cliente</option>';

        // Adicionar clientes
        const clientes = this.clienteController.obterTodos();
        console.log('VendaController: Clientes encontrados:', clientes.length);
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.nome;
            selectCliente.appendChild(option);
        });
    }

    atualizarSelectProdutos() {
        console.log('VendaController: Atualizando select de produtos...');
        const selectProduto = document.getElementById('selectProduto');
        if (!selectProduto) {
            console.log('VendaController: Select de produtos não encontrado!');
            return;
        }

        // Limpar opções existentes (exceto a primeira)
        selectProduto.innerHTML = '<option value="">Selecione um produto</option>';

        // Adicionar produtos que têm estoque
        const produtos = this.produtoController.obterTodos();
        console.log('VendaController: Produtos encontrados:', produtos.length);
        produtos.forEach(produto => {
            if (produto.quantidade > 0) {
                const option = document.createElement('option');
                option.value = produto.id;
                option.textContent = `${produto.nome} - Estoque: ${produto.quantidade} - R$ ${produto.preco.toFixed(2)}`;
                selectProduto.appendChild(option);
            }
        });
    }
}
