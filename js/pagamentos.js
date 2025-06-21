/**
 * Controlador de Pagamentos
 * Gerencia pagamentos de vendas, métodos de pagamento e status
 */

class PagamentoController {
    constructor(databaseController) {
        this.database = databaseController;
        this.metodosPagemento = [
            { id: 'dinheiro', nome: 'Dinheiro' },
            { id: 'pix', nome: 'PIX' },
            { id: 'cartao_debito', nome: 'Cartão de Débito' },
            { id: 'cartao_credito', nome: 'Cartão de Crédito' },
            { id: 'transferencia', nome: 'Transferência Bancária' },
            { id: 'boleto', nome: 'Boleto' }
        ];

        this.statusPagamento = [
            { id: 'pendente', nome: 'Pendente', cor: 'text-yellow-600' },
            { id: 'pago', nome: 'Pago', cor: 'text-green-600' },
            { id: 'parcial', nome: 'Parcialmente Pago', cor: 'text-blue-600' },
            { id: 'vencido', nome: 'Vencido', cor: 'text-red-600' },
            { id: 'cancelado', nome: 'Cancelado', cor: 'text-gray-600' }
        ];
    }

    /**
     * Criar um pagamento para uma venda
     */
    async criarPagamento(dadosPagamento) {
        try {
            if (!this.database) {
                throw new Error('Database não disponível');
            }

            const pagamento = await this.database.criarPagamento({
                venda_id: dadosPagamento.venda_id,
                valor_total: dadosPagamento.valor_total,
                valor_pago: dadosPagamento.valor_pago || 0,
                metodo_pagamento: dadosPagamento.metodo_pagamento,
                data_vencimento: dadosPagamento.data_vencimento,
                numero_parcelas: dadosPagamento.numero_parcelas || 1,
                status: dadosPagamento.status || 'pendente',
                observacoes: dadosPagamento.observacoes || null
            });

            // Se for parcelado, criar as parcelas
            if (dadosPagamento.numero_parcelas > 1) {
                await this.criarParcelas(pagamento.id, dadosPagamento);
            }

            return pagamento;
        } catch (error) {
            console.error('Erro ao criar pagamento:', error);
            throw error;
        }
    }

    /**
     * Criar parcelas para um pagamento
     */
    async criarParcelas(pagamentoId, dadosPagamento) {
        const valorParcela = dadosPagamento.valor_total / dadosPagamento.numero_parcelas;
        const dataBase = new Date(dadosPagamento.data_vencimento);

        const parcelas = [];
        for (let i = 0; i < dadosPagamento.numero_parcelas; i++) {
            const dataVencimento = new Date(dataBase);
            dataVencimento.setMonth(dataVencimento.getMonth() + i);

            parcelas.push({
                pagamento_id: pagamentoId,
                numero_parcela: i + 1,
                valor_parcela: valorParcela,
                valor_pago: 0,
                data_vencimento: dataVencimento.toISOString().split('T')[0],
                status: 'pendente'
            });
        }

        return await this.database.criarParcelas(parcelas);
    }

    /**
     * Registrar um pagamento (total ou parcial)
     */
    async registrarPagamento(pagamentoId, valorPago, metodoPagamento, observacoes = null) {
        try {
            const pagamento = await this.database.obterPagamento(pagamentoId);
            if (!pagamento) {
                throw new Error('Pagamento não encontrado');
            }

            const novoValorPago = pagamento.valor_pago + valorPago;
            let novoStatus = 'pendente';

            if (novoValorPago >= pagamento.valor_total) {
                novoStatus = 'pago';
            } else if (novoValorPago > 0) {
                novoStatus = 'parcial';
            }

            // Atualizar pagamento
            await this.database.atualizarPagamento(pagamentoId, {
                valor_pago: novoValorPago,
                status: novoStatus,
                metodo_pagamento: metodoPagamento,
                data_ultimo_pagamento: new Date().toISOString().split('T')[0]
            });

            // Registrar histórico do pagamento
            await this.database.criarHistoricoPagamento({
                pagamento_id: pagamentoId,
                valor_pago: valorPago,
                metodo_pagamento: metodoPagamento,
                data_pagamento: new Date().toISOString().split('T')[0],
                observacoes: observacoes
            });

            return { status: novoStatus, valor_pago: novoValorPago };
        } catch (error) {
            console.error('Erro ao registrar pagamento:', error);
            throw error;
        }
    }

    /**
     * Listar pagamentos com filtros
     */
    async listarPagamentos(filtros = {}) {
        try {
            return await this.database.listarPagamentos(filtros);
        } catch (error) {
            console.error('Erro ao listar pagamentos:', error);
            throw error;
        }
    }

    /**
     * Obter relatório de pagamentos
     */
    async obterRelatorioPagamentos(dataInicio, dataFim) {
        try {
            const pagamentos = await this.database.listarPagamentosPorPeriodo(dataInicio, dataFim);

            const relatorio = {
                total_vendas: 0,
                total_pago: 0,
                total_pendente: 0,
                total_vencido: 0,
                por_metodo: {},
                por_status: {}
            };

            pagamentos.forEach(pagamento => {
                relatorio.total_vendas += pagamento.valor_total;
                relatorio.total_pago += pagamento.valor_pago;
                relatorio.total_pendente += (pagamento.valor_total - pagamento.valor_pago);

                // Agrupar por método de pagamento
                if (!relatorio.por_metodo[pagamento.metodo_pagamento]) {
                    relatorio.por_metodo[pagamento.metodo_pagamento] = 0;
                }
                relatorio.por_metodo[pagamento.metodo_pagamento] += pagamento.valor_pago;

                // Agrupar por status
                if (!relatorio.por_status[pagamento.status]) {
                    relatorio.por_status[pagamento.status] = 0;
                }
                relatorio.por_status[pagamento.status] += 1;

                // Verificar vencidos
                if (pagamento.status === 'pendente' && new Date(pagamento.data_vencimento) < new Date()) {
                    relatorio.total_vencido += (pagamento.valor_total - pagamento.valor_pago);
                }
            });

            return relatorio;
        } catch (error) {
            console.error('Erro ao obter relatório de pagamentos:', error);
            throw error;
        }
    }

    /**
     * Obter métodos de pagamento disponíveis
     */
    getMetodosPagemento() {
        return this.metodosPagemento;
    }

    /**
     * Obter status de pagamento disponíveis
     */
    getStatusPagamento() {
        return this.statusPagamento;
    }

    /**
     * Calcular valor de multa por atraso
     */
    calcularMulta(valorTotal, diasAtraso, percentualMulta = 2) {
        if (diasAtraso <= 0) return 0;
        return (valorTotal * percentualMulta / 100) + (valorTotal * 0.033 / 100 * diasAtraso); // 2% multa + 0.033% ao dia
    }

    /**
     * Verificar pagamentos vencidos e atualizar status
     */
    async verificarPagamentosVencidos() {
        try {
            const hoje = new Date().toISOString().split('T')[0];
            const pagamentosPendentes = await this.database.listarPagamentos({ status: 'pendente' });

            for (const pagamento of pagamentosPendentes) {
                if (pagamento.data_vencimento < hoje) {
                    await this.database.atualizarPagamento(pagamento.id, { status: 'vencido' });
                }
            }
        } catch (error) {
            console.error('Erro ao verificar pagamentos vencidos:', error);
        }
    }
}

// Exportar para uso global
window.PagamentoController = PagamentoController;
