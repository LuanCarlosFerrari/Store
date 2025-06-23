/**
 * Use Cases - Contém a lógica de negócio da aplicação
 */
import { Product } from '../../domain/entities/Product.js';
import { Customer } from '../../domain/entities/Customer.js';
import { Sale } from '../../domain/entities/Sale.js';
import { Payment } from '../../domain/entities/Payment.js';

export class ProductUseCases {
    constructor(productRepository) {
        this.productRepository = productRepository;
    }

    async createProduct(productData) {
        const product = new Product(productData);
        return await this.productRepository.create(product);
    }

    async getAllProducts(userId = null) {
        return await this.productRepository.findAll(userId);
    }

    async getProductById(id) {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new Error('Produto não encontrado');
        }
        return product;
    }

    async updateProduct(id, updateData) {
        const existingProduct = await this.getProductById(id);

        if (updateData.name) existingProduct.name = updateData.name;
        if (updateData.quantity !== undefined) existingProduct.updateQuantity(updateData.quantity);
        if (updateData.price) existingProduct.updatePrice(updateData.price);

        return await this.productRepository.update(existingProduct);
    }

    async deleteProduct(id) {
        const product = await this.getProductById(id);
        return await this.productRepository.delete(id);
    }

    async getProductsInStock(userId = null) {
        const products = await this.getAllProducts(userId);
        return products.filter(product => product.isInStock());
    }

    async getTotalInventoryValue(userId = null) {
        const products = await this.getAllProducts(userId);
        return products.reduce((total, product) => total + product.getTotalValue(), 0);
    }
}

export class CustomerUseCases {
    constructor(customerRepository) {
        this.customerRepository = customerRepository;
    }

    async createCustomer(customerData) {
        const customer = new Customer(customerData);
        return await this.customerRepository.create(customer);
    }

    async getAllCustomers(userId = null) {
        return await this.customerRepository.findAll(userId);
    }

    async getCustomerById(id) {
        const customer = await this.customerRepository.findById(id);
        if (!customer) {
            throw new Error('Cliente não encontrado');
        }
        return customer;
    }

    async updateCustomer(id, updateData) {
        const existingCustomer = await this.getCustomerById(id);

        if (updateData.name) existingCustomer.name = updateData.name;
        if (updateData.email !== undefined || updateData.phone !== undefined) {
            existingCustomer.updateContactInfo(
                updateData.email !== undefined ? updateData.email : existingCustomer.email,
                updateData.phone !== undefined ? updateData.phone : existingCustomer.phone
            );
        }

        return await this.customerRepository.update(existingCustomer);
    }

    async deleteCustomer(id) {
        const customer = await this.getCustomerById(id);
        return await this.customerRepository.delete(id);
    }
}

export class SaleUseCases {
    constructor(saleRepository, productRepository, customerRepository) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
    }

    async createSale(saleData) {
        // Validar se cliente existe
        await this.customerRepository.findById(saleData.customerId);

        // Validar se produto existe e tem estoque suficiente
        const product = await this.productRepository.findById(saleData.productId);
        if (!product) {
            throw new Error('Produto não encontrado');
        }

        if (product.quantity < saleData.quantity) {
            throw new Error('Estoque insuficiente');
        }

        // Criar venda
        const sale = new Sale(saleData);
        const createdSale = await this.saleRepository.create(sale);

        // Atualizar estoque do produto
        product.updateQuantity(product.quantity - saleData.quantity);
        await this.productRepository.update(product);

        return createdSale;
    }

    async getAllSales(userId = null) {
        return await this.saleRepository.findAll(userId);
    }

    async getSaleById(id) {
        const sale = await this.saleRepository.findById(id);
        if (!sale) {
            throw new Error('Venda não encontrada');
        }
        return sale;
    }

    async getSalesByDateRange(startDate, endDate, userId = null) {
        return await this.saleRepository.findByDateRange(startDate, endDate, userId);
    }

    async getSalesToday(userId = null) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        return await this.getSalesByDateRange(startOfDay, endOfDay, userId);
    }

    async getTotalSalesValue(userId = null) {
        const sales = await this.getAllSales(userId);
        return sales.reduce((total, sale) => total + sale.totalValue, 0);
    }

    async getTotalSalesValueByDate(date, userId = null) {
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

        const sales = await this.getSalesByDateRange(startOfDay, endOfDay, userId);
        return sales.reduce((total, sale) => total + sale.totalValue, 0);
    }
}

export class PaymentUseCases {
    constructor(paymentRepository, saleRepository) {
        this.paymentRepository = paymentRepository;
        this.saleRepository = saleRepository;
    }

    async createPayment(paymentData) {
        // Validar se venda existe
        await this.saleRepository.findById(paymentData.saleId);

        const payment = new Payment(paymentData);
        return await this.paymentRepository.create(payment);
    } async getAllPayments(userId = null) {
        console.log('PaymentUseCases: Buscando todos os pagamentos para userId:', userId);
        const payments = await this.paymentRepository.findAll(userId);
        console.log(`PaymentUseCases: ${payments.length} pagamentos encontrados no total`);

        payments.forEach(payment => {
            console.log(`- ID: ${payment.id}, Status: ${payment.getStatus()}, Total: ${payment.totalValue}, Pago: ${payment.paidValue}, Restante: ${payment.getRemainingValue()}, Vencimento: ${payment.dueDate}`);
        });

        return payments;
    }

    async getPaymentById(id) {
        const payment = await this.paymentRepository.findById(id);
        if (!payment) {
            throw new Error('Pagamento não encontrado');
        }
        return payment;
    }

    async getPaymentsBySale(saleId) {
        return await this.paymentRepository.findBySaleId(saleId);
    }

    async getPaymentsByStatus(status, userId = null) {
        return await this.paymentRepository.findByStatus(status, userId);
    }

    async makePayment(paymentId, amount) {
        const payment = await this.getPaymentById(paymentId);
        payment.makePayment(amount);
        return await this.paymentRepository.update(payment);
    }

    async getOverduePayments(userId = null) {
        const payments = await this.getAllPayments(userId);
        return payments.filter(payment => payment.isOverdue());
    }

    async getPendingPayments(userId = null) {
        return await this.getPaymentsByStatus(Payment.PAYMENT_STATUS.PENDING, userId);
    }

    async getPartialPayments(userId = null) {
        return await this.getPaymentsByStatus(Payment.PAYMENT_STATUS.PARTIAL, userId);
    }

    async getTotalReceived(userId = null) {
        const payments = await this.getAllPayments(userId);
        return payments.reduce((total, payment) => total + payment.paidValue, 0);
    } async getTotalReceivedByDate(date, userId = null) {
        try {
            const payments = await this.getAllPayments(userId);
            console.log(`Analisando ${payments.length} pagamentos para data ${date.toISOString().split('T')[0]}`);

            const paymentsForDate = payments.filter(payment => {
                if (!payment.paymentDate) return false;
                const paymentDate = new Date(payment.paymentDate);
                const targetDate = date.toDateString();
                const isMatch = paymentDate.toDateString() === targetDate;

                if (isMatch) {
                    console.log(`Pagamento encontrado para a data: R$ ${payment.paidValue} - Status: ${payment.status}`);
                }

                return isMatch;
            });

            const totalReceived = paymentsForDate.reduce((total, payment) => total + payment.paidValue, 0);
            console.log(`Total recebido na data ${date.toISOString().split('T')[0]}: R$ ${totalReceived}`);

            return totalReceived;
        } catch (error) {
            console.error('Erro ao buscar pagamentos por data:', error);
            throw error;
        }
    } async getTotalPending(userId = null) {
        console.log('PaymentUseCases: Calculando total pendente...');
        const payments = await this.getAllPayments(userId);
        console.log(`PaymentUseCases: Total de ${payments.length} pagamentos encontrados`);

        const unpaidPayments = payments.filter(payment => {
            const status = payment.getStatus();
            const isUnpaid = status !== Payment.PAYMENT_STATUS.PAID;

            console.log(`- Pagamento ID: ${payment.id}, Status: ${status}, Valor restante: ${payment.getRemainingValue()}, Vencimento: ${payment.dueDate}, Incluído: ${isUnpaid}`);

            return isUnpaid;
        });

        const totalPending = unpaidPayments.reduce((total, payment) => total + payment.getRemainingValue(), 0);
        console.log(`PaymentUseCases: Total pendente calculado: R$ ${totalPending}`);

        return totalPending;
    }

    async getTotalOverdue(userId = null) {
        const overduePayments = await this.getOverduePayments(userId);
        return overduePayments.reduce((total, payment) => total + payment.getRemainingValue(), 0);
    }
}
