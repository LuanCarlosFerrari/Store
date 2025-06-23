/**
 * Presentation Layer Controllers - Interface entre UI e Use Cases
 */
import { ProductUseCases, CustomerUseCases, SaleUseCases, PaymentUseCases } from '../../core/application/usecases/UseCases.js';

export class ProductController {
    constructor(productRepository, authService) {
        this.productUseCases = new ProductUseCases(productRepository);
        this.authService = authService;
        this.view = null;
    }

    setView(view) {
        this.view = view;
    }

    async loadProducts() {
        try {
            this.view?.showLoading(true);
            const user = await this.authService.getCurrentUser();
            const products = await this.productUseCases.getAllProducts(user?.id);
            this.view?.displayProducts(products);
            return products;
        } catch (error) {
            this.view?.showError('Erro ao carregar produtos: ' + error.message);
            throw error;
        } finally {
            this.view?.showLoading(false);
        }
    }

    async createProduct(productData) {
        try {
            const user = await this.authService.getCurrentUser();
            productData.userId = user?.id;

            const product = await this.productUseCases.createProduct(productData);
            this.view?.showSuccess('Produto criado com sucesso!');
            await this.loadProducts(); // Recarregar lista
            return product;
        } catch (error) {
            this.view?.showError('Erro ao criar produto: ' + error.message);
            throw error;
        }
    }

    async updateProduct(id, updateData) {
        try {
            const product = await this.productUseCases.updateProduct(id, updateData);
            this.view?.showSuccess('Produto atualizado com sucesso!');
            await this.loadProducts(); // Recarregar lista
            return product;
        } catch (error) {
            this.view?.showError('Erro ao atualizar produto: ' + error.message);
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            await this.productUseCases.deleteProduct(id);
            this.view?.showSuccess('Produto excluído com sucesso!');
            await this.loadProducts(); // Recarregar lista
        } catch (error) {
            this.view?.showError('Erro ao excluir produto: ' + error.message);
            throw error;
        }
    }

    async getProductsInStock() {
        try {
            const user = await this.authService.getCurrentUser();
            return await this.productUseCases.getProductsInStock(user?.id);
        } catch (error) {
            this.view?.showError('Erro ao carregar produtos em estoque: ' + error.message);
            throw error;
        }
    }
}

export class CustomerController {
    constructor(customerRepository, authService) {
        this.customerUseCases = new CustomerUseCases(customerRepository);
        this.authService = authService;
        this.view = null;
    }

    setView(view) {
        this.view = view;
    }

    async loadCustomers() {
        try {
            this.view?.showLoading(true);
            const user = await this.authService.getCurrentUser();
            const customers = await this.customerUseCases.getAllCustomers(user?.id);
            this.view?.displayCustomers(customers);
            return customers;
        } catch (error) {
            this.view?.showError('Erro ao carregar clientes: ' + error.message);
            throw error;
        } finally {
            this.view?.showLoading(false);
        }
    }

    async createCustomer(customerData) {
        try {
            const user = await this.authService.getCurrentUser();
            customerData.userId = user?.id;

            const customer = await this.customerUseCases.createCustomer(customerData);
            this.view?.showSuccess('Cliente criado com sucesso!');
            await this.loadCustomers(); // Recarregar lista
            return customer;
        } catch (error) {
            this.view?.showError('Erro ao criar cliente: ' + error.message);
            throw error;
        }
    }

    async updateCustomer(id, updateData) {
        try {
            const customer = await this.customerUseCases.updateCustomer(id, updateData);
            this.view?.showSuccess('Cliente atualizado com sucesso!');
            await this.loadCustomers(); // Recarregar lista
            return customer;
        } catch (error) {
            this.view?.showError('Erro ao atualizar cliente: ' + error.message);
            throw error;
        }
    }

    async deleteCustomer(id) {
        try {
            await this.customerUseCases.deleteCustomer(id);
            this.view?.showSuccess('Cliente excluído com sucesso!');
            await this.loadCustomers(); // Recarregar lista
        } catch (error) {
            this.view?.showError('Erro ao excluir cliente: ' + error.message);
            throw error;
        }
    }
}

export class SaleController {
    constructor(saleRepository, productRepository, customerRepository, authService, paymentRepository = null) {
        this.saleUseCases = new SaleUseCases(saleRepository, productRepository, customerRepository);
        this.authService = authService;
        this.paymentRepository = paymentRepository;
        this.view = null;
    }

    setView(view) {
        this.view = view;
    }

    async loadSales() {
        try {
            this.view?.showLoading(true);
            const user = await this.authService.getCurrentUser();
            const sales = await this.saleUseCases.getAllSales(user?.id);
            this.view?.displaySales(sales);
            return sales;
        } catch (error) {
            this.view?.showError('Erro ao carregar vendas: ' + error.message);
            throw error;
        } finally {
            this.view?.showLoading(false);
        }
    } async createSale(saleData) {
        try {
            const user = await this.authService.getCurrentUser();
            saleData.userId = user?.id;

            // Compatibilidade: converter dados do novo formato se necessário
            if (saleData.unitPrice && !saleData.totalValue) {
                saleData.totalValue = saleData.unitPrice * saleData.quantity;
            }

            const sale = await this.saleUseCases.createSale(saleData);

            // Criar automaticamente um pagamento para a venda
            if (this.paymentRepository) {
                try {
                    const { Payment } = await import('../../core/domain/entities/Payment.js');

                    const paymentData = {
                        saleId: sale.id,
                        totalValue: sale.totalValue,
                        paidValue: sale.totalValue, // Assumir que é pago à vista
                        paymentMethod: saleData.paymentMethod || Payment.PAYMENT_METHODS.PIX,
                        dueDate: new Date(), // Vencimento hoje para pagamento à vista
                        paymentDate: new Date(), // Pago hoje
                        status: Payment.PAYMENT_STATUS.PAID,
                        userId: user?.id
                    };

                    const payment = new Payment(paymentData);
                    await this.paymentRepository.create(payment);

                    console.log('Pagamento criado automaticamente para venda:', sale.id);
                } catch (paymentError) {
                    console.error('Erro ao criar pagamento automático:', paymentError);
                    // Não falhar a venda se o pagamento não puder ser criado
                }
            }

            return sale;
        } catch (error) {
            this.view?.showError('Erro ao realizar venda: ' + error.message);
            throw error;
        }
    }

    async getSalesForDate(date) {
        try {
            const user = await this.authService.getCurrentUser();
            const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

            return await this.saleUseCases.getSalesByDateRange(startOfDay, endOfDay, user?.id);
        } catch (error) {
            this.view?.showError('Erro ao carregar vendas da data: ' + error.message);
            throw error;
        }
    }
}

export class PaymentController {
    constructor(paymentRepository, saleRepository, authService) {
        this.paymentUseCases = new PaymentUseCases(paymentRepository, saleRepository);
        this.authService = authService;
        this.view = null;
    }

    setView(view) {
        this.view = view;
    }

    async loadPayments() {
        try {
            this.view?.showLoading(true);
            const user = await this.authService.getCurrentUser();
            const payments = await this.paymentUseCases.getAllPayments(user?.id);
            this.view?.displayPayments(payments);
            return payments;
        } catch (error) {
            this.view?.showError('Erro ao carregar pagamentos: ' + error.message);
            throw error;
        } finally {
            this.view?.showLoading(false);
        }
    }

    async createPayment(paymentData) {
        try {
            const user = await this.authService.getCurrentUser();
            paymentData.userId = user?.id;

            const payment = await this.paymentUseCases.createPayment(paymentData);
            this.view?.showSuccess('Pagamento criado com sucesso!');
            await this.loadPayments(); // Recarregar lista
            return payment;
        } catch (error) {
            this.view?.showError('Erro ao criar pagamento: ' + error.message);
            throw error;
        }
    }

    async makePayment(paymentId, amount) {
        try {
            const payment = await this.paymentUseCases.makePayment(paymentId, amount);
            this.view?.showSuccess('Pagamento processado com sucesso!');
            await this.loadPayments(); // Recarregar lista
            return payment;
        } catch (error) {
            this.view?.showError('Erro ao processar pagamento: ' + error.message);
            throw error;
        }
    }

    async getOverduePayments() {
        try {
            const user = await this.authService.getCurrentUser();
            return await this.paymentUseCases.getOverduePayments(user?.id);
        } catch (error) {
            this.view?.showError('Erro ao carregar pagamentos em atraso: ' + error.message);
            throw error;
        }
    }

    async getPartialPayments() {
        try {
            const user = await this.authService.getCurrentUser();
            return await this.paymentUseCases.getPartialPayments(user?.id);
        } catch (error) {
            this.view?.showError('Erro ao carregar pagamentos parciais: ' + error.message);
            throw error;
        }
    }
}

export class DashboardController {
    constructor(dashboardService, authService) {
        this.dashboardService = dashboardService;
        this.authService = authService;
        this.view = null;
        this.selectedDate = null;
    }

    setView(view) {
        this.view = view;
    }

    async loadDashboard(selectedDate = null) {
        try {
            this.view?.showLoading(true);
            const user = await this.authService.getCurrentUser();

            const metrics = await this.dashboardService.getDashboardMetrics(user?.id, selectedDate);
            const paymentMetrics = await this.dashboardService.getPaymentMetrics(user?.id);

            this.view?.displayMetrics(metrics, paymentMetrics);
            this.selectedDate = selectedDate;

        } catch (error) {
            this.view?.showError('Erro ao carregar dashboard: ' + error.message);
            throw error;
        } finally {
            this.view?.showLoading(false);
        }
    }

    async setSelectedDate(date) {
        this.selectedDate = date;
        await this.loadDashboard(date);
    }

    async refreshDashboard() {
        await this.loadDashboard(this.selectedDate);
    }
}
