// Classe principal para gerenciar a navegação e inicialização
class AppController {
    constructor() {
        this.authInitialized = false;
        this.dataSelecionada = null; // Data selecionada para filtro
        this.waitForAuth();
    }

    async waitForAuth() {
        // Aguardar o auth controller estar disponível
        let attempts = 0;
        const maxAttempts = 30; // Reduzido de 50 para 30

        const checkAuth = async () => {
            if (window.authController && window.authController.isInitialized && attempts < maxAttempts) {
                await this.initApp();
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkAuth, 100);
            } else {
                console.warn('Auth controller não carregado completamente, iniciando sem auth');
                this.initApp(); // Inicializar mesmo sem auth para desenvolvimento
            }
        };

        checkAuth();
    }

    async initApp() {
        if (this.authInitialized) return; // Evitar dupla inicialização

        // Verificar autenticação apenas uma vez na inicialização
        if (window.authController && window.authController.supabase) {
            // Usar verificação silenciosa para não interromper o fluxo
            const isAuthenticated = await window.authController.isAuthenticatedSilent();
            if (!isAuthenticated) {
                // Fazer uma verificação final antes de redirecionar
                const finalCheck = await window.authController.isAuthenticated();
                if (!finalCheck) {
                    window.location.href = 'login.html';
                    return;
                }
            }

            // Configurar auth para ser menos agressivo após a inicialização
            window.authController.configure({
                maxAuthChecks: 1, // Reduzir verificações automáticas
                authCheckInterval: 30000 // Aumentar intervalo para 30 segundos
            });

            // Exibir informações do usuário apenas uma vez
            await this.displayUserInfo();
        }

        this.initNavigation();
        await this.initControllers();
        this.authInitialized = true;

        // Configurar atualização periódica do dashboard (a cada 30 segundos)
        this.dashboardInterval = setInterval(async () => {
            if (document.getElementById('dashboard') && !document.getElementById('dashboard').classList.contains('hidden')) {
                await this.atualizarDashboard();
            }
        }, 30000);

        console.log('App: Inicialização completa');
    }

    async displayUserInfo() {
        if (window.authController) {
            const user = await window.authController.getCurrentUser();
            const userEmailEl = document.getElementById('userEmail');
            if (user && userEmailEl) {
                userEmailEl.textContent = `Logado como: ${user.email}`;
            }
        }
    }

    async initNavigation() {
        // Mostrar dashboard por padrão
        await this.mostrarAba('dashboard');

        // Configurar data de hoje no seletor
        this.configurarSeletorData();

        // Tentar atualizar dashboard após um pequeno delay para garantir que tudo está carregado
        setTimeout(async () => {
            await this.atualizarDashboard();
        }, 1000);
    }

    configurarSeletorData() {
        const inputData = document.getElementById('dataSelecionada');
        if (inputData) {
            // Definir data de hoje como padrão
            const hoje = new Date().toISOString().split('T')[0];
            inputData.value = hoje;
            inputData.max = hoje; // Não permitir datas futuras
        }
    } async initControllers() {
        // Inicializar database controller primeiro
        if (window.authController) {
            this.databaseController = new DatabaseController(window.authController);

            // Aguardar database estar pronto
            await this.waitForDatabase();
        }        // Inicializar controladores na ordem correta, passando database
        this.produtoController = new ProdutoController(this.databaseController);
        this.clienteController = new ClienteController(this.databaseController);
        this.pagamentoController = new PagamentoController(this.databaseController);
        this.pagamentosInterface = new PagamentosInterfaceController(this.pagamentoController, this);
        
        // Novo controlador unificado para vendas e pagamentos
        this.vendaPagamentoUnificado = new VendaPagamentoUnificadoController(
            this.produtoController,
            this.clienteController,
            this.databaseController,
            this.pagamentoController,
            this
        );

        // Controlador de vendas tradicional (mantido para compatibilidade)
        this.vendaController = new VendaController(
            this.produtoController,
            this.clienteController,
            this.databaseController,
            this.pagamentoController,
            this
        );

        // Tornar disponível globalmente
        window.pagamentosInterface = this.pagamentosInterface;
        window.vendaPagamentoUnificado = this.vendaPagamentoUnificado;

        // Atualizar selects iniciais
        setTimeout(() => {
            this.produtoController.atualizarSelectProdutos();
            this.clienteController.atualizarSelectClientes();
        }, 500); // Aumentado para 500ms para dar tempo ao database

        // Forçar atualização do dashboard após todos os controladores estarem prontos
        console.log('App: Todos os controladores inicializados, atualizando dashboard...');
        setTimeout(async () => {
            await this.atualizarDashboard();
        }, 1000);
    }

    async waitForDatabase() {
        if (!this.databaseController) return;

        let attempts = 0;
        const maxAttempts = 20;

        while (!this.databaseController.isReady && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!this.databaseController.isReady) {
            console.warn('Database não ficou pronto no tempo esperado');
        }
    }

    async mostrarAba(abaId) {
        // Ocultar todas as abas
        document.querySelectorAll('.aba').forEach(aba => {
            aba.classList.add('hidden');
        });

        // Mostrar a aba selecionada
        const abaAtiva = document.getElementById(abaId);
        if (abaAtiva) {
            abaAtiva.classList.remove('hidden');
        }

        // Atualizar estado dos links da sidebar
        document.querySelectorAll('aside a').forEach(link => {
            link.classList.remove('bg-gray-700');
        });

        const linkAtivo = document.getElementById(`nav-${abaId}`);
        if (linkAtivo) {
            linkAtivo.classList.add('bg-gray-700');
        }        // Carregar dados da aba Caixa (sistema unificado)
        if (abaId === 'caixa' && this.vendaPagamentoUnificado) {
            console.log('Carregando dados da aba Caixa...');
            await this.vendaPagamentoUnificado.carregarDados();
        }

        // Atualizar selects quando mostrar a aba de vendas (legacy)
        if (abaId === 'vendas' && this.vendaController) {
            this.vendaController.atualizarSelects();
        }

        // Carregar pagamentos quando mostrar a aba de pagamentos
        if (abaId === 'pagamentos' && this.pagamentosInterface) {
            this.pagamentosInterface.carregarPagamentos();
        }

        // Atualizar dashboard quando mostrá-lo
        if (abaId === 'dashboard') {
            await this.atualizarDashboard();
        }
    }    async atualizarDashboard() {
        console.log('App: Atualizando dashboard...');

        // Mostrar indicador de carregamento
        const loadingIndicator = document.getElementById('dashboard-loading');
        if (loadingIndicator) {
            loadingIndicator.classList.remove('hidden');
        }

        if (!this.produtoController || !this.clienteController) {
            console.log('App: Controladores não disponíveis ainda, tentando novamente em 2s...');
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
            setTimeout(() => this.atualizarDashboard(), 2000);
            return;
        }

        try {
            // Atualizar total de produtos
            const produtos = this.produtoController.obterTodos();
            const totalProdutos = produtos.reduce((total, produto) => total + produto.quantidade, 0);
            const totalProdutosEl = document.getElementById('total-produtos');
            if (totalProdutosEl) {
                totalProdutosEl.textContent = totalProdutos;
            }

            // Atualizar total de clientes
            const clientes = this.clienteController.obterTodos();
            const totalClientesEl = document.getElementById('total-clientes');
            if (totalClientesEl) {
                totalClientesEl.textContent = clientes.length;
            }

            // Carregar vendas e métricas de pagamento
            await this.atualizarMetricasVendasPagamentos();

            console.log('App: Dashboard atualizado com sucesso');

        } catch (error) {
            console.error('App: Erro ao atualizar dashboard:', error);
            // Tentar novamente em caso de erro
            setTimeout(() => this.atualizarDashboard(), 3000);
        } finally {
            // Ocultar indicador de carregamento
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
        }
    }

    async atualizarMetricasVendasPagamentos() {
        let vendas = [];
        let pagamentos = [];

        // Carregar dados
        if (this.databaseController && this.databaseController.isReady) {
            try {
                vendas = await this.databaseController.listarVendas();
                if (this.pagamentoController) {
                    pagamentos = await this.pagamentoController.listarPagamentos();
                }
            } catch (error) {
                console.error('Erro ao carregar dados do banco:', error);
                // Fallback para dados locais
                if (this.vendaPagamentoUnificado && this.vendaPagamentoUnificado.vendas) {
                    vendas = this.vendaPagamentoUnificado.vendas;
                }
            }
        } else {
            // Fallback: usar dados dos controladores
            if (this.vendaPagamentoUnificado && this.vendaPagamentoUnificado.vendas) {
                vendas = this.vendaPagamentoUnificado.vendas;
            }
        }

        // Calcular métricas do dia atual
        const hoje = new Date().toISOString().split('T')[0];
        const dataFiltro = this.dataSelecionada || hoje;
        
        // Métricas de vendas
        const vendasDia = vendas.filter(venda => {
            const dataVenda = new Date(venda.data_venda).toISOString().split('T')[0];
            return dataVenda === dataFiltro;
        });

        const totalVendasDia = vendasDia.reduce((total, venda) => total + venda.valor_total, 0);
        
        // Atualizar vendas do dia
        const vendasDiaEl = document.getElementById('vendas-dia');
        if (vendasDiaEl) {
            vendasDiaEl.textContent = this.formatarMoeda(totalVendasDia);
        }

        // Métricas de pagamentos
        let recebidoDia = 0;
        let pendenteTotal = 0;
        let atrasoTotal = 0;
        let parcialTotal = 0;
        let qtdAtraso = 0;
        let qtdParcial = 0;

        if (pagamentos.length > 0) {
            pagamentos.forEach(pagamento => {
                const dataVenda = pagamento.vendas?.data_venda;
                const valorRestante = pagamento.valor_total - pagamento.valor_pago;
                
                // Recebido no dia (vendas pagas do dia)
                if (dataVenda === dataFiltro && pagamento.status === 'pago') {
                    recebidoDia += pagamento.valor_pago;
                }
                
                // Totais gerais
                if (pagamento.status === 'pendente' || pagamento.status === 'parcial') {
                    if (new Date(pagamento.data_vencimento) < new Date() || pagamento.status === 'vencido') {
                        atrasoTotal += valorRestante;
                        if (pagamento.status === 'vencido' || new Date(pagamento.data_vencimento) < new Date()) {
                            qtdAtraso++;
                        }
                    } else {
                        pendenteTotal += valorRestante;
                    }
                }
                
                if (pagamento.status === 'parcial') {
                    parcialTotal += valorRestante;
                    qtdParcial++;
                }
            });
        }

        // Atualizar elementos do dashboard
        this.updateDashboardElement('recebido-dia', recebidoDia);
        this.updateDashboardElement('pendente-total', pendenteTotal);
        this.updateDashboardElement('atraso-total', atrasoTotal);
        this.updateDashboardElement('parcial-total', parcialTotal);

        // Atualizar quantidades
        const qtdAtrasoEl = document.getElementById('qtd-atraso');
        if (qtdAtrasoEl) {
            qtdAtrasoEl.textContent = `${qtdAtraso} pagamento${qtdAtraso !== 1 ? 's' : ''} vencido${qtdAtraso !== 1 ? 's' : ''}`;
        }

        const qtdParcialEl = document.getElementById('qtd-parcial');
        if (qtdParcialEl) {
            qtdParcialEl.textContent = `${qtdParcial} pagamento${qtdParcial !== 1 ? 's' : ''} parcial${qtdParcial !== 1 ? 'is' : ''}`;
        }

        // Atualizar data selecionada
        const dataDisplayEl = document.getElementById('data-selecionada-display');
        if (dataDisplayEl) {
            if (this.dataSelecionada) {
                const dataFormatada = new Date(this.dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR');
                dataDisplayEl.textContent = dataFormatada;
            } else {
                dataDisplayEl.textContent = 'Hoje';
            }
        }

        // Atualizar tabela de vendas recentes
        const vendasParaTabela = this.dataSelecionada ? vendasDia.slice(0, 10) : vendas.slice(0, 5);
        this.atualizarTabelaVendasDashboard(vendasParaTabela, pagamentos);
    }

    updateDashboardElement(elementId, valor) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = this.formatarMoeda(valor);
        }
    }

    atualizarTabelaVendasDashboard(vendas, pagamentos = []) {
        const tbody = document.getElementById('dashboard-vendas');
        if (!tbody) return;

        if (vendas.length === 0) {
            const mensagem = this.dataSelecionada ?
                'Nenhuma venda registrada para esta data' :
                'Nenhuma venda registrada';
            tbody.innerHTML = `<tr><td colspan="7" class="py-4 px-2 text-center text-gray-500">${mensagem}</td></tr>`;
            return;
        }

        tbody.innerHTML = vendas.map(venda => {
            const dataFormatada = new Date(venda.data_venda).toLocaleDateString('pt-BR');
            const clienteNome = venda.clientes?.nome || 'N/A';
            const produtoNome = venda.produtos?.nome || 'N/A';
            
            // Buscar informações de pagamento
            let metodoPagamento = 'N/A';
            let statusPagamento = 'N/A';
            let corStatus = 'text-gray-500';
            
            const pagamentoVenda = pagamentos.find(p => p.venda_id === venda.id);
            if (pagamentoVenda) {
                metodoPagamento = this.getMetodoTexto(pagamentoVenda.metodo_pagamento);
                
                switch(pagamentoVenda.status) {
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
                <tr class="hover:bg-gray-50">
                    <td class="border px-2 py-1">${dataFormatada}</td>
                    <td class="border px-2 py-1">${clienteNome}</td>
                    <td class="border px-2 py-1">${produtoNome}</td>
                    <td class="border px-2 py-1">${venda.quantidade}</td>
                    <td class="border px-2 py-1">${this.formatarMoeda(venda.valor_total)}</td>
                    <td class="border px-2 py-1">${metodoPagamento}</td>
                    <td class="border px-2 py-1 ${corStatus}">${statusPagamento}</td>
                </tr>
            `;
        }).join('');
    }

    getMetodoTexto(metodo) {
        const metodoMap = {
            'dinheiro': 'Dinheiro',
            'pix': 'PIX',
            'cartao_debito': 'Cartão Débito',
            'cartao_credito': 'Cartão Crédito',
            'transferencia': 'Transferência',
            'boleto': 'Boleto'
        };        return metodoMap[metodo] || metodo || 'N/A';
    }

    // Métodos auxiliares para formatação
    formatarMoeda(valor) {
        return `R$ ${valor.toFixed(2).replace('.', ',')}`;
    }

    formatarData(data) {
        if (data instanceof Date) {
            return data.toLocaleDateString('pt-BR');
        }
        return data;
    }

    // Métodos para filtro por data
    async definirDataSelecionada(data) {
        console.log('App: Definindo data selecionada:', data);
        this.dataSelecionada = data;

        // Atualizar o input de data no HTML
        const inputData = document.getElementById('dataSelecionada');
        if (inputData) {
            inputData.value = data || '';
        }

        // Atualizar dashboard com a nova data
        await this.atualizarDashboard();
    }

    async resetarFiltroData() {
        console.log('App: Resetando filtro de data');
        this.dataSelecionada = null;

        // Limpar o input de data no HTML
        const inputData = document.getElementById('dataSelecionada');
        if (inputData) {
            inputData.value = '';
        }

        // Atualizar dashboard sem filtro
        await this.atualizarDashboard();
    }

    // Método público para permitir que outros componentes solicitem atualização
    async forcarAtualizacaoDashboard() {
        console.log('App: Atualização forçada do dashboard solicitada');
        await this.atualizarDashboard();
    }

    // Método de debug para verificar estado do sistema
    debugStatus() {
        console.log('=== DEBUG STATUS ===');
        console.log('authController:', !!window.authController);
        console.log('databaseController:', !!this.databaseController);
        console.log('produtoController:', !!this.produtoController);
        console.log('clienteController:', !!this.clienteController);
        console.log('vendaController:', !!this.vendaController);
        console.log('vendaPagamentoUnificado:', !!this.vendaPagamentoUnificado);
        console.log('===================');
    }
}

// Função global para compatibilidade com o HTML existente
async function mostrarAba(abaId) {
    if (window.app) {
        await window.app.mostrarAba(abaId);
    }
}

// Função global para filtrar vendas por data
async function filtrarVendasPorData() {
    const inputData = document.getElementById('dataSelecionada');
    if (window.app && inputData) {
        const dataSelecionada = inputData.value || null;
        await window.app.definirDataSelecionada(dataSelecionada);
    }
}

// Função global para resetar filtro de data
async function resetarFiltroData() {
    if (window.app) {
        await window.app.resetarFiltroData();
    }
}

// Função global para debug
function debugSystem() {
    if (window.app) {
        window.app.debugStatus();
    } else {
        console.log('Sistema ainda não inicializado');
    }
}

// Função global para forçar atualização do dashboard
async function atualizarDashboard() {
    if (window.app) {
        await window.app.atualizarDashboard();
    } else {
        console.log('Sistema ainda não inicializado');
    }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
});
