// Classe para gerenciar clientes
class ClienteController {
    constructor(databaseController = null) {
        this.database = databaseController;
        this.clientes = [];
        this.loading = false;

        this.initEventListeners();

        // Aguardar um pouco antes de carregar para garantir que tudo está pronto
        setTimeout(() => {
            this.carregarClientes();
        }, 200);
    }

    async carregarClientes() {
        if (!this.database) {
            // Fallback para dados locais se database não estiver disponível
            this.clientes = [
                { id: '1', nome: 'Exemplo Cliente 1', telefone: '(11) 99999-9999' },
                { id: '2', nome: 'Exemplo Cliente 2', telefone: '(21) 98888-8888' }
            ];
            this.renderizarLista();
            return;
        }

        this.showLoading(true);
        try {
            this.clientes = await this.database.listarClientes();
            this.renderizarLista();
            this.atualizarSelectClientes();
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            this.showMessage('Erro ao carregar clientes do servidor', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    initEventListeners() {
        const form = document.querySelector('#clientes form');
        if (form) {
            form.addEventListener('submit', (e) => this.adicionarCliente(e));
        }
    }

    async adicionarCliente(e) {
        e.preventDefault();
        if (this.loading) return;

        const form = e.target;
        const nome = form.querySelector('input[placeholder="Nome do Cliente"]').value.trim();
        const telefone = form.querySelector('input[placeholder="Telefone"]').value.trim();

        if (!nome || !telefone) {
            this.showMessage('Por favor, preencha todos os campos', 'error');
            return;
        }

        this.showLoading(true);
        try {
            if (this.database) {
                // Salvar no banco de dados
                const novoCliente = await this.database.criarCliente({
                    nome,
                    telefone
                });
                this.clientes.push(novoCliente);
                this.showMessage('Cliente adicionado com sucesso!', 'success');
            } else {
                // Fallback para dados locais
                const novoCliente = {
                    id: Date.now().toString(),
                    nome,
                    telefone
                };
                this.clientes.push(novoCliente);
            }

            this.renderizarLista();
            this.atualizarSelectClientes();
            form.reset();

        } catch (error) {
            console.error('Erro ao adicionar cliente:', error);
            this.showMessage('Erro ao salvar cliente: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderizarLista() {
        const lista = document.querySelector('#clientes .bg-white:last-child ul');
        if (lista) {
            if (this.clientes.length === 0) {
                lista.innerHTML = '<li class="text-gray-500">Nenhum cliente cadastrado</li>';
                return;
            }

            lista.innerHTML = this.clientes.map(cliente =>
                `<li class="flex justify-between items-center py-2">
                    <span>${cliente.nome} - ${cliente.telefone}</span>
                    <button onclick="clienteController.removerCliente('${cliente.id}')" class="text-red-500 hover:text-red-700 px-2 py-1 text-sm">
                        Remover
                    </button>
                </li>`
            ).join('');
        }
    }

    atualizarSelectClientes() {
        const select = document.querySelector('#caixa select:first-of-type');
        if (select) {
            select.innerHTML = '<option value="">Selecione um cliente</option>' +
                this.clientes.map(cliente =>
                    `<option value="${cliente.id}">${cliente.nome}</option>`
                ).join('');
        }
    }

    async removerCliente(id) {
        if (!confirm('Tem certeza que deseja remover este cliente?')) return;

        this.showLoading(true);
        try {
            if (this.database) {
                await this.database.deletarCliente(id);
                this.showMessage('Cliente removido com sucesso!', 'success');
            }

            this.clientes = this.clientes.filter(cliente => cliente.id !== id);
            this.renderizarLista();
            this.atualizarSelectClientes();
        } catch (error) {
            console.error('Erro ao remover cliente:', error);
            this.showMessage('Erro ao remover cliente: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    obterCliente(id) {
        return this.clientes.find(cliente => cliente.id == id);
    }

    obterTodos() {
        return this.clientes;
    }

    showLoading(show) {
        const loadingEl = document.getElementById('loading-clientes');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }
    }

    showMessage(message, type) {
        // Criar elemento de mensagem se não existir
        let messageEl = document.getElementById('message-clientes');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'message-clientes';
            messageEl.className = 'mt-4 p-3 rounded-md text-sm';

            const form = document.querySelector('#clientes form');
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
