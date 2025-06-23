// Classe para gerenciar produtos
class ProdutoController {
    constructor(databaseController = null) {
        this.database = databaseController;
        this.produtos = [];
        this.loading = false;

        this.initEventListeners();

        // Aguardar um pouco antes de carregar para garantir que tudo está pronto
        setTimeout(() => {
            this.carregarProdutos();
        }, 200);
    }

    async carregarProdutos() {
        if (!this.database) {
            // Fallback para dados locais se database não estiver disponível
            this.produtos = [
                { id: '1', nome: 'Exemplo Produto 1', quantidade: 10, preco: 15.00 },
                { id: '2', nome: 'Exemplo Produto 2', quantidade: 5, preco: 8.50 }
            ];
            this.renderizarLista();
            return;
        }

        this.showLoading(true);
        try {
            this.produtos = await this.database.listarProdutos();
            this.renderizarLista();
            this.atualizarSelectProdutos();
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            this.showMessage('Erro ao carregar produtos do servidor', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    initEventListeners() {
        const form = document.querySelector('#produtos form');
        if (form) {
            form.addEventListener('submit', (e) => this.adicionarProduto(e));
        }
    }

    async adicionarProduto(e) {
        e.preventDefault();
        if (this.loading) return;

        const form = e.target;
        const nome = form.querySelector('input[placeholder="Nome do Produto"]').value.trim();
        const quantidade = parseInt(form.querySelector('input[placeholder="Quantidade"]').value);
        const preco = parseFloat(form.querySelector('input[placeholder="Preço (R$)"]').value);

        if (!nome || quantidade <= 0 || preco <= 0) {
            this.showMessage('Por favor, preencha todos os campos corretamente', 'error');
            return;
        }

        this.showLoading(true);
        try {
            if (this.database) {
                // Salvar no banco de dados
                const novoProduto = await this.database.criarProduto({
                    nome,
                    quantidade,
                    preco
                });
                this.produtos.push(novoProduto);
                this.showMessage('Produto adicionado com sucesso!', 'success');
            } else {
                // Fallback para dados locais
                const novoProduto = {
                    id: Date.now().toString(),
                    nome,
                    quantidade,
                    preco
                };
                this.produtos.push(novoProduto);
            }

            this.renderizarLista();
            this.atualizarSelectProdutos();
            form.reset();

        } catch (error) {
            console.error('Erro ao adicionar produto:', error);
            this.showMessage('Erro ao salvar produto: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderizarLista() {
        const lista = document.querySelector('#produtos .bg-white:last-child ul');
        if (lista) {
            if (this.produtos.length === 0) {
                lista.innerHTML = '<li class="text-gray-500">Nenhum produto cadastrado</li>';
                return;
            }

            lista.innerHTML = this.produtos.map(produto =>
                `<li class="flex justify-between items-center py-2">
                    <span>${produto.nome} - ${produto.quantidade} unidades - R$ ${produto.preco.toFixed(2).replace('.', ',')}</span>
                    <button onclick="produtoController.removerProduto('${produto.id}')" class="text-red-500 hover:text-red-700 px-2 py-1 text-sm">
                        Remover
                    </button>
                </li>`
            ).join('');
        }
    }

    atualizarSelectProdutos() {
        const select = document.querySelector('#caixa select:nth-of-type(2)');
        if (select) {
            select.innerHTML = '<option value="">Selecione um produto</option>' +
                this.produtos.map(produto =>
                    `<option value="${produto.id}" data-preco="${produto.preco}">${produto.nome} - R$ ${produto.preco.toFixed(2).replace('.', ',')} (${produto.quantidade} unid.)</option>`
                ).join('');
        }
    }

    async removerProduto(id) {
        if (!confirm('Tem certeza que deseja remover este produto?')) return;

        this.showLoading(true);
        try {
            if (this.database) {
                await this.database.deletarProduto(id);
                this.showMessage('Produto removido com sucesso!', 'success');
            }

            this.produtos = this.produtos.filter(produto => produto.id !== id);
            this.renderizarLista();
            this.atualizarSelectProdutos();
        } catch (error) {
            console.error('Erro ao remover produto:', error);
            this.showMessage('Erro ao remover produto: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    obterProduto(id) {
        return this.produtos.find(produto => produto.id == id);
    }

    async atualizarEstoque(id, novaQuantidade) {
        try {
            const produto = this.obterProduto(id);
            if (!produto) return;

            if (this.database) {
                await this.database.atualizarProduto(id, {
                    ...produto,
                    quantidade: novaQuantidade
                });
            }

            produto.quantidade = novaQuantidade;
            this.renderizarLista();
            this.atualizarSelectProdutos();
        } catch (error) {
            console.error('Erro ao atualizar estoque:', error);
        }
    }

    obterTodos() {
        return this.produtos;
    }

    showLoading(show) {
        const loadingEl = document.getElementById('loading-produtos');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }
    }

    showMessage(message, type) {
        // Criar elemento de mensagem se não existir
        let messageEl = document.getElementById('message-produtos');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'message-produtos';
            messageEl.className = 'mt-4 p-3 rounded-md text-sm';

            const form = document.querySelector('#produtos form');
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
}
