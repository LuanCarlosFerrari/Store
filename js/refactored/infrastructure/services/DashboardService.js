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
            console.log(`Dashboard: Calculando métricas para data ${targetDate.toISOString().split('T')[0]}`);

            const [
                totalProducts,
                totalCustomers,
                totalSalesToday,
                totalReceived,
                totalPending,
                totalOverdue,
                recentSales
            ] = await Promise.all([
                this.getTotalProductsInStock(userId),
                this.getTotalCustomers(userId),
                this.getTotalSalesForDate(targetDate, userId),
                this.getTotalReceivedForDate(targetDate, userId),
                this.getTotalPending(userId),
                this.getTotalOverdue(userId),
                this.getRecentSales(targetDate, userId)
            ]);

            console.log('Dashboard métricas calculadas:', {
                totalProducts,
                totalCustomers,
                totalSalesToday,
                totalReceived,
                totalPending,
                totalOverdue,
                recentSalesCount: recentSales.length
            });

            return {
                totalProducts,
                totalCustomers,
                totalSalesToday,
                totalReceived,
                totalPending,
                totalOverdue,
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
            const received = await this.paymentUseCases.getTotalReceivedByDate(date, userId);

            // Método alternativo: verificar se há vendas sem pagamentos correspondentes
            const salesTotal = await this.getTotalSalesForDate(date, userId);

            console.log(`Data: ${date.toISOString().split('T')[0]}`);
            console.log(`Total de pagamentos registrados: R$ ${received}`);
            console.log(`Total de vendas no dia: R$ ${salesTotal}`);

            // Se não há pagamentos registrados mas há vendas, usar as vendas
            if (received === 0 && salesTotal > 0) {
                console.log('Nenhum pagamento registrado, usando vendas do dia como fallback');
                return salesTotal;
            }

            // Se há pagamentos, mas o valor é menor que as vendas, pode haver vendas sem pagamento
            if (received > 0 && received < salesTotal) {
                console.log(`Possível discrepância: vendas (${salesTotal}) > pagamentos (${received}). Usando vendas como valor recebido.`);
                return salesTotal;
            }

            return received;
        } catch (error) {
            console.error('Erro ao calcular total recebido:', error);
            // Em caso de erro, tentar usar vendas do dia como fallback
            try {
                const salesTotal = await this.getTotalSalesForDate(date, userId);
                console.log('Usando vendas do dia como fallback devido a erro:', salesTotal);
                return salesTotal;
            } catch (fallbackError) {
                console.error('Erro no fallback também:', fallbackError);
                return 0;
            }
        }
    }

    async getTotalPending(userId = null) {
        return await this.paymentUseCases.getTotalPending(userId);
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

    formatCurrency(value) {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }

    formatDate(date) {
        return date.toLocaleDateString('pt-BR');
    }
}
