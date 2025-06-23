/**
 * Dashboard Service - Calcula métricas e estatísticas do dashboard
 */
export class DashboardService {
    constructor(productUseCases, customerUseCases, saleUseCases, paymentUseCases) {
        this.productUseCases = productUseCases;
        this.customerUseCases = customerUseCases;
        this.saleUseCases = saleUseCases;
        this.paymentUseCases = paymentUseCases;
    }

    async getDashboardMetrics(userId = null, selectedDate = null) {
        const targetDate = selectedDate ? new Date(selectedDate) : new Date();

        try {
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
    }

    async getTotalReceivedForDate(date, userId = null) {
        const received = await this.paymentUseCases.getTotalReceivedByDate(date, userId);

        // Fallback: se não há pagamentos registrados, considerar vendas do dia como recebidas
        if (received === 0) {
            const salesTotal = await this.getTotalSalesForDate(date, userId);
            return salesTotal;
        }

        return received;
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
