// Classe para gerenciar vendas e caixa
class VendaController {
    constructor(produtoController, clienteController, databaseController, appController = null) {
        this.produtoController = produtoController;
        this.clienteController = clienteController;
        this.database = databaseController;
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
    }

    initEventListeners() {
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
    }

    async registrarVenda(e) {
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

        this.showLoading(true);
        try {
            const valorUnitario = valorTotal / quantidade;

            if (this.database) {
                console.log('VendaController: Salvando no banco de dados...');
                // Salvar no banco de dados
                const novaVenda = await this.database.criarVenda({
                    cliente_id: clienteId,
                    produto_id: produtoId,
                    quantidade: quantidade,
                    valor_unitario: valorUnitario,
                    valor_total: valorTotal
                });

                console.log('VendaController: Venda salva:', novaVenda);

                // Recarregar lista de vendas
                await this.carregarVendas();

                // Atualizar estoque
                await this.produtoController.atualizarEstoque(produtoId, produto.quantidade - quantidade);

                this.showMessage('Venda registrada com sucesso!', 'success');

                // Notificar o AppController para atualizar o dashboard
                if (this.appController && typeof this.appController.atualizarDashboard === 'function') {
                    await this.appController.atualizarDashboard();
                }
            } else {
                console.log('VendaController: Database não disponível, usando fallback...');
                // Fallback para dados locais
                const novaVenda = {
                    id: Date.now().toString(),
                    data_venda: new Date().toISOString().split('T')[0],
                    cliente_id: clienteId,
                    produto_id: produtoId,
                    quantidade: quantidade,
                    valor_total: valorTotal,
                    clientes: this.clienteController.obterCliente(clienteId),
                    produtos: produto
                };

                console.log('VendaController: Adicionando venda local:', novaVenda);
                this.vendas.unshift(novaVenda);
                this.renderizarHistorico();

                // Atualizar estoque
                await this.produtoController.atualizarEstoque(produtoId, produto.quantidade - quantidade);

                this.showMessage('Venda registrada com sucesso (modo local)!', 'success');

                // Notificar o AppController para atualizar o dashboard
                if (this.appController && typeof this.appController.atualizarDashboard === 'function') {
                    await this.appController.atualizarDashboard();
                }
            }

            form.reset();

        } catch (error) {
            console.error('Erro ao registrar venda:', error);
            this.showMessage('Erro ao registrar venda: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderizarHistorico() {
        const tbody = document.getElementById('corpoTabelaVendas');
        if (tbody) {
            if (this.vendas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="border px-2 py-4 text-gray-500 text-center">Nenhuma venda registrada</td></tr>';
                return;
            }

            tbody.innerHTML = this.vendas.map(venda => {
                const dataFormatada = new Date(venda.data_venda).toLocaleDateString('pt-BR');
                const clienteNome = venda.clientes?.nome || 'Cliente não encontrado';
                const produtoNome = venda.produtos?.nome || 'Produto não encontrado';

                return `
                    <tr>
                        <td class="border px-2 py-1">${dataFormatada}</td>
                        <td class="border px-2 py-1">${clienteNome}</td>
                        <td class="border px-2 py-1">${produtoNome}</td>
                        <td class="border px-2 py-1">${venda.quantidade}</td>
                        <td class="border px-2 py-1">R$ ${venda.valor_total.toFixed(2).replace('.', ',')}</td>
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
