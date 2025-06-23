/**
 * Controlador da Interface de Pagamentos
 * Gerencia a visualização e interação da aba de pagamentos
 */

class PagamentosInterfaceController {
    constructor(pagamentoController, appController) {
        this.pagamentoController = pagamentoController;
        this.appController = appController;
        this.pagamentos = [];
        this.filtroAtivo = {};
        this.loading = false;

        this.initEventListeners();
    }

    initEventListeners() {
        // Event listeners para filtros
        const filtroStatus = document.getElementById('filtroStatusPagamento');
        const filtroMetodo = document.getElementById('filtroMetodoPagamento');
        const filtroDataInicio = document.getElementById('filtroDataInicio');

        if (filtroStatus) {
            filtroStatus.addEventListener('change', () => this.aplicarFiltros());
        }
        if (filtroMetodo) {
            filtroMetodo.addEventListener('change', () => this.aplicarFiltros());
        }
        if (filtroDataInicio) {
            filtroDataInicio.addEventListener('change', () => this.aplicarFiltros());
        }
    }

    async carregarPagamentos(filtros = {}) {
        if (!this.pagamentoController) {
            console.log('PagamentosInterface: Controller de pagamentos não disponível');
            return;
        }

        this.showLoading(true);
        try {
            this.pagamentos = await this.pagamentoController.listarPagamentos(filtros);
            this.renderizarPagamentos();
            this.atualizarResumoFinanceiro();
        } catch (error) {
            console.error('Erro ao carregar pagamentos:', error);
            this.showMessage('Erro ao carregar pagamentos', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    aplicarFiltros() {
        const status = document.getElementById('filtroStatusPagamento')?.value;
        const metodo = document.getElementById('filtroMetodoPagamento')?.value;
        const dataInicio = document.getElementById('filtroDataInicio')?.value;

        this.filtroAtivo = {};

        if (status) this.filtroAtivo.status = status;
        if (metodo) this.filtroAtivo.metodo_pagamento = metodo;
        if (dataInicio) this.filtroAtivo.data_inicio = dataInicio;

        this.carregarPagamentos(this.filtroAtivo);
    }

    renderizarPagamentos() {
        const tbody = document.getElementById('corpoTabelaPagamentos');
        if (!tbody) return;

        if (this.pagamentos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="border px-2 py-4 text-gray-500 text-center">Nenhum pagamento encontrado</td></tr>';
            return;
        }

        tbody.innerHTML = this.pagamentos.map(pagamento => {
            const dataVenda = new Date(pagamento.vendas?.data_venda || pagamento.created_at).toLocaleDateString('pt-BR');
            const dataVencimento = new Date(pagamento.data_vencimento).toLocaleDateString('pt-BR');
            const clienteNome = pagamento.vendas?.clientes?.nome || 'N/A';
            const produtoNome = pagamento.vendas?.produtos?.nome || 'N/A';

            const statusInfo = this.getStatusInfo(pagamento.status);
            const valorRestante = pagamento.valor_total - pagamento.valor_pago;

            return `
                <tr class="hover:bg-gray-50">
                    <td class="border px-2 py-1">${dataVenda}</td>
                    <td class="border px-2 py-1">${clienteNome}</td>
                    <td class="border px-2 py-1">${produtoNome}</td>
                    <td class="border px-2 py-1">R$ ${pagamento.valor_total.toFixed(2).replace('.', ',')}</td>
                    <td class="border px-2 py-1">R$ ${pagamento.valor_pago.toFixed(2).replace('.', ',')}</td>
                    <td class="border px-2 py-1">${dataVencimento}</td>
                    <td class="border px-2 py-1">
                        <span class="px-2 py-1 rounded text-xs ${statusInfo.classe}">
                            ${statusInfo.texto}
                        </span>
                    </td>
                    <td class="border px-2 py-1">${this.getMetodoText(pagamento.metodo_pagamento)}</td>
                    <td class="border px-2 py-1">
                        <div class="flex space-x-1">
                            ${valorRestante > 0 ? `
                                <button onclick="registrarPagamentoParcial('${pagamento.id}')" 
                                        class="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600">
                                    Pagar
                                </button>
                            ` : ''}
                            <button onclick="verDetalhes('${pagamento.id}')" 
                                    class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                                Detalhes
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getStatusInfo(status) {
        const statusMap = {
            'pendente': { texto: 'Pendente', classe: 'bg-yellow-100 text-yellow-800' },
            'pago': { texto: 'Pago', classe: 'bg-green-100 text-green-800' },
            'parcial': { texto: 'Parcial', classe: 'bg-blue-100 text-blue-800' },
            'vencido': { texto: 'Vencido', classe: 'bg-red-100 text-red-800' },
            'cancelado': { texto: 'Cancelado', classe: 'bg-gray-100 text-gray-800' }
        };
        return statusMap[status] || { texto: status, classe: 'bg-gray-100 text-gray-800' };
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

    atualizarResumoFinanceiro() {
        let totalReceber = 0;
        let totalRecebido = 0;
        let totalAtraso = 0;
        let totalParcial = 0;

        const hoje = new Date();

        this.pagamentos.forEach(pagamento => {
            totalRecebido += pagamento.valor_pago;
            const valorRestante = pagamento.valor_total - pagamento.valor_pago;

            if (pagamento.status === 'pago') {
                // Já contabilizado em totalRecebido
            } else if (pagamento.status === 'parcial') {
                totalParcial += valorRestante;
                totalReceber += valorRestante;
            } else if (pagamento.status === 'pendente') {
                const dataVencimento = new Date(pagamento.data_vencimento);
                if (dataVencimento < hoje) {
                    totalAtraso += valorRestante;
                } else {
                    totalReceber += valorRestante;
                }
            } else if (pagamento.status === 'vencido') {
                totalAtraso += valorRestante;
            }
        });

        // Atualizar elementos da interface
        this.updateElementValue('totalReceber', totalReceber);
        this.updateElementValue('totalRecebido', totalRecebido);
        this.updateElementValue('totalAtraso', totalAtraso);
        this.updateElementValue('totalParcial', totalParcial);
    }

    updateElementValue(elementId, valor) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `R$ ${valor.toFixed(2).replace('.', ',')}`;
        }
    }

    async verificarPagamentosVencidos() {
        if (!this.pagamentoController) return;

        try {
            await this.pagamentoController.verificarPagamentosVencidos();
            this.showMessage('Verificação de pagamentos vencidos concluída', 'success');
            await this.carregarPagamentos(this.filtroAtivo);
        } catch (error) {
            console.error('Erro ao verificar pagamentos vencidos:', error);
            this.showMessage('Erro ao verificar pagamentos vencidos', 'error');
        }
    }

    showLoading(show) {
        const tbody = document.getElementById('corpoTabelaPagamentos');
        if (show && tbody) {
            tbody.innerHTML = '<tr><td colspan="9" class="border px-2 py-4 text-gray-500 text-center">Carregando...</td></tr>';
        }
    }

    showMessage(message, type) {
        // Criar elemento de mensagem se não existir
        let messageEl = document.getElementById('message-pagamentos');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'message-pagamentos';
            messageEl.className = 'mt-4 p-3 rounded-md text-sm';

            const container = document.getElementById('pagamentos');
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
window.PagamentosInterfaceController = PagamentosInterfaceController;

// Funções globais para uso nos botões
window.aplicarFiltrosPagamentos = function () {
    if (window.pagamentosInterface) {
        window.pagamentosInterface.aplicarFiltros();
    }
};

window.verificarPagamentosVencidos = function () {
    if (window.pagamentosInterface) {
        window.pagamentosInterface.verificarPagamentosVencidos();
    }
};

window.registrarPagamentoParcial = function (pagamentoId) {
    // TODO: Implementar modal para registrar pagamento parcial
    alert('Funcionalidade de pagamento parcial será implementada em breve');
};

window.verDetalhes = function (pagamentoId) {
    // TODO: Implementar modal de detalhes do pagamento
    alert('Detalhes do pagamento serão implementados em breve');
};
