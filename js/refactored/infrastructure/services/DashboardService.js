/**
 * Dashboard Service - Calcula métricas e estatísticas do dashboard
 */
export class DashboardService {
    constructor(productUseCases, customerUseCases, saleUseCases, paymentUseCases) {
        this.productUseCases = productUseCases;
        this.customerUseCases = customerUseCases;
        this.saleUseCases = saleUseCases;
        this.paymentUseCases = paymentUseCases;
    } async getDashboardMetrics(userId = null, selectedDate = null) {
        const targetDate = selectedDate ? new Date(selectedDate) : new Date();

        try {
            console.log(`Dashboard: Calculando métricas para data ${targetDate.toISOString().split('T')[0]}`); const [
                totalProducts,
                totalCustomers,
                totalSalesToday,
                totalReceived,
                totalPending,
                totalOverdue,
                totalPartial,
                recentSales
            ] = await Promise.all([
                this.getTotalProductsInStock(userId),
                this.getTotalCustomers(userId),
                this.getTotalSalesForDate(targetDate, userId),
                this.getTotalReceivedForDate(targetDate, userId),
                this.getTotalPending(userId),
                this.getTotalOverdue(userId),
                this.getTotalPartial(userId),
                this.getRecentSales(targetDate, userId)
            ]); console.log('Dashboard métricas calculadas:', {
                totalProducts,
                totalCustomers,
                totalSalesToday,
                totalReceived,
                totalPending,
                totalOverdue,
                totalPartial,
                recentSalesCount: recentSales.length
            });

            return {
                totalProducts,
                totalCustomers,
                totalSalesToday,
                totalReceived,
                totalPending,
                totalOverdue,
                totalPartial,
                recentSales,
                selectedDate: targetDate.toISOString().split('T')[0]
            };
        } catch (error) {
            console.error('Erro ao calcular métricas do dashboard:', error);
            throw error;
        }
    }

    async getTotalProductsInStock(userId = null) {
        const products = await this.productUseCases.getAllProducts(userId);
        return products.reduce((total, product) => total + product.quantity, 0);
    }

    async getTotalCustomers(userId = null) {
        const customers = await this.customerUseCases.getAllCustomers(userId);
        return customers.length;
    }

    async getTotalSalesForDate(date, userId = null) {
        return await this.saleUseCases.getTotalSalesValueByDate(date, userId);
    } async getTotalReceivedForDate(date, userId = null) {
        try {
            // Buscar apenas pagamentos que foram realmente pagos (status = 'pago') na data especificada
            const allPayments = await this.paymentUseCases.getAllPayments(userId);

            console.log(`Data: ${date.toISOString().split('T')[0]}`);
            console.log(`Analisando ${allPayments.length} pagamentos para encontrar os pagos na data`);

            // Log de todos os pagamentos para debug
            allPayments.forEach(payment => {
                console.log(`Pagamento ID: ${payment.id}, Status: ${payment.getStatus()}, Valor Pago: ${payment.paidValue}, Data Pagamento: ${payment.paymentDate}, Data Última: ${payment.lastPaymentDate}`);
            });

            const paidPaymentsForDate = allPayments.filter(payment => {
                // Só considerar pagamentos com status 'pago'
                const isPaid = payment.getStatus() === 'pago';

                console.log(`Pagamento ${payment.id}: Status = ${payment.getStatus()}, isPaid = ${isPaid}`);

                if (!isPaid) {
                    console.log(`Pagamento ${payment.id} ignorado - status: ${payment.getStatus()}`);
                    return false;
                }

                // Verificar se a data de pagamento corresponde à data solicitada
                // MUDANÇA: Vamos também considerar pagamentos pagos criados na mesma data da venda
                let isDateMatch = false;

                // Opção 1: Data de pagamento específica
                if (payment.paymentDate) {
                    const paymentDate = new Date(payment.paymentDate);
                    isDateMatch = paymentDate.toDateString() === date.toDateString();
                    console.log(`Pagamento ${payment.id}: Data pagamento ${paymentDate.toDateString()} vs ${date.toDateString()} = ${isDateMatch}`);
                }

                // Opção 2: Data da última atualização
                if (!isDateMatch && payment.lastPaymentDate) {
                    const lastPaymentDate = new Date(payment.lastPaymentDate);
                    isDateMatch = lastPaymentDate.toDateString() === date.toDateString();
                    console.log(`Pagamento ${payment.id}: Data última ${lastPaymentDate.toDateString()} vs ${date.toDateString()} = ${isDateMatch}`);
                }

                // Opção 3: Se não tem data de pagamento mas está pago, considerar pela data de criação
                if (!isDateMatch && !payment.paymentDate && !payment.lastPaymentDate) {
                    console.log(`Pagamento ${payment.id}: Sem data de pagamento, mas está pago. Considerando como recebido na data.`);
                    isDateMatch = true;
                }

                const shouldInclude = isPaid && isDateMatch;

                console.log(`Pagamento ${payment.id}: shouldInclude = ${shouldInclude}`);

                if (shouldInclude) {
                    console.log(`✅ Pagamento pago encontrado: ID ${payment.id}, Valor: R$ ${payment.paidValue}, Data: ${payment.paymentDate || payment.lastPaymentDate || 'sem data específica'}`);
                }

                return shouldInclude;
            });

            const totalReceived = paidPaymentsForDate.reduce((total, payment) => total + payment.paidValue, 0);

            console.log(`📊 Total recebido (apenas pagamentos com status 'pago') na data: R$ ${totalReceived}`);
            console.log(`📊 Número de pagamentos pagos encontrados: ${paidPaymentsForDate.length}`);

            return totalReceived;
        } catch (error) {
            console.error('Erro ao calcular total recebido:', error);
            return 0;
        }
    } async getTotalPending(userId = null) {
        console.log('DashboardService: Calculando total pendente...');
        const totalPending = await this.paymentUseCases.getTotalPending(userId);
        console.log('DashboardService: Total pendente calculado:', totalPending);
        return totalPending;
    }

    async getTotalOverdue(userId = null) {
        return await this.paymentUseCases.getTotalOverdue(userId);
    }

    async getRecentSales(date, userId = null, limit = 10) {
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

        const sales = await this.saleUseCases.getSalesByDateRange(startOfDay, endOfDay, userId);
        return sales.slice(0, limit);
    }

    async getPaymentMetrics(userId = null) {
        const [
            overduePayments,
            partialPayments,
            pendingPayments
        ] = await Promise.all([
            this.paymentUseCases.getOverduePayments(userId),
            this.paymentUseCases.getPartialPayments(userId),
            this.paymentUseCases.getPendingPayments(userId)
        ]);

        return {
            overdue: {
                count: overduePayments.length,
                total: overduePayments.reduce((sum, p) => sum + p.getRemainingValue(), 0)
            },
            partial: {
                count: partialPayments.length,
                total: partialPayments.reduce((sum, p) => sum + p.getRemainingValue(), 0)
            },
            pending: {
                count: pendingPayments.length,
                total: pendingPayments.reduce((sum, p) => sum + p.getRemainingValue(), 0)
            }
        };
    }

    async getTotalPartial(userId = null) {
        console.log('DashboardService: Calculando total parcial...');
        const partialPayments = await this.paymentUseCases.getPartialPayments(userId);
        const total = partialPayments.reduce((sum, payment) => sum + payment.getRemainingValue(), 0);
        console.log('DashboardService: Total parcial calculado:', total);
        return total;
    }

    formatCurrency(value) {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }

    formatDate(date) {
        return date.toLocaleDateString('pt-BR');
    }
}
