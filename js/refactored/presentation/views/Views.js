/**
 * View Classes - Interface para manipulação da UI
 */

export class BaseView {
    constructor() {
        this.loadingElement = null;
        this.messageContainer = null;
    }

    showLoading(show = true) {
        if (this.loadingElement) {
            this.loadingElement.classList.toggle('hidden', !show);
        }
    }

    showMessage(message, type = 'info') {
        if (this.messageContainer) {
            const className = type === 'error' ? 'bg-red-100 text-red-700' :
                type === 'success' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700';

            this.messageContainer.innerHTML = `
                <div class="p-4 mb-4 rounded ${className}">
                    ${message}
                </div>
            `;

            // Auto-hide após 5 segundos
            setTimeout(() => {
                if (this.messageContainer) {
                    this.messageContainer.innerHTML = '';
                }
            }, 5000);
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    formatCurrency(value) {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('pt-BR');
    }

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }
}

export class ProductView extends BaseView {
    constructor() {
        super();
        this.loadingElement = document.getElementById('products-loading');
        this.messageContainer = document.getElementById('products-messages');
        this.productsContainer = document.getElementById('produtos-lista');
        this.productSelect = document.getElementById('produto');
    }

    displayProducts(products) {
        if (!this.productsContainer) return; if (products.length === 0) {
            this.productsContainer.innerHTML = `
                <tr>
                    <td colspan="5" class="py-4 text-center text-gray-500">
                        Nenhum produto cadastrado
                    </td>
                </tr>
            `;
            return;
        }

        this.productsContainer.innerHTML = products.map(product => `
            <tr class="hover:bg-gray-50">
                <td class="border px-4 py-2">${product.name}</td>
                <td class="border px-4 py-2">${product.quantity}</td>
                <td class="border px-4 py-2">${this.formatCurrency(product.price)}</td>
                <td class="border px-4 py-2">${this.formatCurrency(typeof product.getTotalValue === 'function' ? product.getTotalValue() : product.quantity * product.price)}</td>
                <td class="border px-4 py-2">
                    <button onclick="editProduct('${product.id}')" 
                            class="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600 mr-2">
                        Editar
                    </button>
                    <button onclick="deleteProduct('${product.id}')" 
                            class="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                        Excluir
                    </button>
                </td>
            </tr>
        `).join('');

        // Atualizar select de produtos
        this.updateProductSelect(products);
    }

    updateProductSelect(products) {
        if (!this.productSelect) return;

        this.productSelect.innerHTML = `
            <option value="">Selecione um produto</option>
            ${products.map(product => `
                <option value="${product.id}" data-price="${product.price}">
                    ${product.name} (Estoque: ${product.quantity})
                </option>
            `).join('')}
        `;
    }
}

export class CustomerView extends BaseView {
    constructor() {
        super();
        this.loadingElement = document.getElementById('customers-loading');
        this.messageContainer = document.getElementById('customers-messages');
        this.customersContainer = document.getElementById('clientes-lista');
        this.customerSelect = document.getElementById('cliente');
    }

    displayCustomers(customers) {
        if (!this.customersContainer) return;

        if (customers.length === 0) {
            this.customersContainer.innerHTML = `
                <tr>
                    <td colspan="4" class="py-4 text-center text-gray-500">
                        Nenhum cliente cadastrado
                    </td>
                </tr>
            `;
            return;
        }

        this.customersContainer.innerHTML = customers.map(customer => `
            <tr class="hover:bg-gray-50">
                <td class="border px-4 py-2">${customer.name}</td>
                <td class="border px-4 py-2">${customer.email || 'N/A'}</td>
                <td class="border px-4 py-2">${customer.phone || 'N/A'}</td>
                <td class="border px-4 py-2">
                    <button onclick="editCustomer('${customer.id}')" 
                            class="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600 mr-2">
                        Editar
                    </button>
                    <button onclick="deleteCustomer('${customer.id}')" 
                            class="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                        Excluir
                    </button>
                </td>
            </tr>
        `).join('');

        // Atualizar select de clientes
        this.updateCustomerSelect(customers);
    }

    updateCustomerSelect(customers) {
        if (!this.customerSelect) return;

        this.customerSelect.innerHTML = `
            <option value="">Selecione um cliente</option>
            ${customers.map(customer => `
                <option value="${customer.id}">
                    ${customer.name}
                </option>
            `).join('')}
        `;
    }
}

export class SaleView extends BaseView {
    constructor() {
        super();
        this.loadingElement = document.getElementById('sales-loading');
        this.messageContainer = document.getElementById('sales-messages');
        this.salesContainer = document.getElementById('vendas-lista');
    }

    displaySales(sales) {
        if (!this.salesContainer) return; if (sales.length === 0) {
            this.salesContainer.innerHTML = `
                <tr>
                    <td colspan="8" class="py-4 text-center text-gray-500">
                        Nenhuma venda registrada
                    </td>
                </tr>
            `;
            return;
        }

        this.salesContainer.innerHTML = sales.map(sale => `
            <tr class="hover:bg-gray-50">
                <td class="border px-4 py-2">${this.formatDate(sale.saleDate)}</td>
                <td class="border px-4 py-2">${sale.customerName || 'N/A'}</td>
                <td class="border px-4 py-2">${sale.productName || 'N/A'}</td>
                <td class="border px-4 py-2">${sale.quantity}</td>
                <td class="border px-4 py-2">${this.formatCurrency(sale.unitValue || sale.totalValue / sale.quantity)}</td>
                <td class="border px-4 py-2">${this.formatCurrency(sale.totalValue)}</td>
                <td class="border px-4 py-2">
                    <span class="px-2 py-1 rounded text-xs ${this.getPaymentStatusClass(sale.paymentStatus || 'pendente')}">
                        ${this.getPaymentStatusText(sale.paymentStatus || 'pendente')}
                    </span>
                </td>
                <td class="border px-4 py-2">
                    <button onclick="viewSaleDetails('${sale.id}')" 
                            class="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600">
                        Ver Detalhes
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getPaymentStatusClass(status) {
        const colors = {
            'pago': 'bg-green-100 text-green-800',
            'pendente': 'bg-yellow-100 text-yellow-800',
            'parcial': 'bg-blue-100 text-blue-800',
            'vencido': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

    getPaymentStatusText(status) {
        const statuses = {
            'pago': 'Pago',
            'pendente': 'Pendente',
            'parcial': 'Parcial',
            'vencido': 'Vencido'
        };
        return statuses[status] || status;
    }
}

export class PaymentView extends BaseView {
    constructor() {
        super();
        this.loadingElement = document.getElementById('payments-loading');
        this.messageContainer = document.getElementById('payments-messages');
        this.paymentsContainer = document.getElementById('pagamentos-lista');
    }

    displayPayments(payments) {
        if (!this.paymentsContainer) return;

        if (payments.length === 0) {
            this.paymentsContainer.innerHTML = `
                <tr>
                    <td colspan="7" class="py-4 text-center text-gray-500">
                        Nenhum pagamento registrado
                    </td>
                </tr>
            `;
            return;
        } if (payments.length === 0) {
            this.paymentsContainer.innerHTML = `
                <tr>
                    <td colspan="10" class="py-4 text-center text-gray-500">
                        Nenhum pagamento registrado
                    </td>
                </tr>
            `;
            return;
        }

        this.paymentsContainer.innerHTML = payments.map(payment => `
            <tr class="hover:bg-gray-50">
                <td class="border px-2 py-1 text-sm">#${payment.saleId || 'N/A'}</td>
                <td class="border px-2 py-1 text-sm">${payment.customerName || 'N/A'}</td>
                <td class="border px-2 py-1 text-sm">${payment.productName || 'N/A'}</td>
                <td class="border px-2 py-1 text-sm">${this.formatDate(payment.dueDate)}</td>
                <td class="border px-2 py-1 text-sm">${this.formatCurrency(payment.totalValue)}</td>
                <td class="border px-2 py-1 text-sm">${this.formatCurrency(payment.paidValue)}</td>
                <td class="border px-2 py-1 text-sm">${this.formatCurrency(payment.getRemainingValue())}</td>
                <td class="border px-2 py-1 text-sm">${this.getPaymentMethodText(payment.paymentMethod)}</td>
                <td class="border px-2 py-1">
                    <span class="px-2 py-1 rounded text-xs ${this.getStatusColorClass(payment.getStatus())}">
                        ${this.getStatusText(payment.getStatus())}
                    </span>
                </td>
                <td class="border px-2 py-1">
                    ${payment.getStatus() !== 'pago' ? `
                        <button onclick="makePayment('${payment.id}')" 
                                class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600">
                            Pagar
                        </button>
                    ` : `
                        <span class="text-green-600 text-xs">✓ Pago</span>
                    `}
                </td>
            </tr>
        `).join('');
    }

    getPaymentMethodText(method) {
        const methods = {
            'dinheiro': 'Dinheiro',
            'pix': 'PIX',
            'cartao_debito': 'Cartão Débito',
            'cartao_credito': 'Cartão Crédito',
            'transferencia': 'Transferência',
            'boleto': 'Boleto'
        };
        return methods[method] || method;
    }

    getStatusText(status) {
        const statuses = {
            'pendente': 'Pendente',
            'pago': 'Pago',
            'parcial': 'Parcial',
            'vencido': 'Vencido'
        };
        return statuses[status] || status;
    }

    getStatusColorClass(status) {
        const colors = {
            'pendente': 'bg-yellow-100 text-yellow-800',
            'pago': 'bg-green-100 text-green-800',
            'parcial': 'bg-blue-100 text-blue-800',
            'vencido': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }
}

export class DashboardView extends BaseView {
    constructor() {
        super();
        this.loadingElement = document.getElementById('dashboard-loading');
        this.messageContainer = document.getElementById('dashboard-messages');
    }

    displayMetrics(metrics, paymentMetrics) {        // Atualizar métricas principais
        this.updateElement('total-produtos', metrics.totalProducts);
        this.updateElement('total-clientes', metrics.totalCustomers);
        this.updateElement('vendas-dia', this.formatCurrency(metrics.totalSalesToday));
        this.updateElement('recebido-dia', this.formatCurrency(metrics.totalReceived));
        this.updateElement('pendente-total', this.formatCurrency(metrics.totalPending));
        this.updateElement('atraso-total', this.formatCurrency(metrics.totalOverdue));
        this.updateElement('parcial-total', this.formatCurrency(metrics.totalPartial || 0));

        // Atualizar métricas de pagamento
        this.updateElement('qtd-atraso',
            `${paymentMetrics.overdue.count} pagamento${paymentMetrics.overdue.count !== 1 ? 's' : ''} vencido${paymentMetrics.overdue.count !== 1 ? 's' : ''}`
        );
        this.updateElement('qtd-parcial',
            `${paymentMetrics.partial.count} pagamento${paymentMetrics.partial.count !== 1 ? 's' : ''} parcial${paymentMetrics.partial.count !== 1 ? 'is' : ''}`
        );        // Atualizar data selecionada
        this.updateElement('data-selecionada-display', this.formatDate(metrics.selectedDate));
        this.updateElement('data-selecionada-display-2', this.formatDate(metrics.selectedDate));

        // Atualizar tabela de vendas recentes
        this.displayRecentSales(metrics.recentSales);
    } displayRecentSales(sales) {
        const container = document.getElementById('dashboard-vendas');
        if (!container) return;

        if (sales.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="py-4 px-2 text-center text-gray-500">
                        Nenhuma venda registrada para esta data
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = sales.map(sale => `
            <tr class="hover:bg-gray-50">
                <td class="border px-2 py-1">${this.formatDate(sale.saleDate)}</td>
                <td class="border px-2 py-1">${sale.customerName || 'N/A'}</td>
                <td class="border px-2 py-1">${sale.productName || 'N/A'}</td>
                <td class="border px-2 py-1">${sale.quantity}</td>
                <td class="border px-2 py-1">${this.formatCurrency(sale.totalValue)}</td>
                <td class="border px-2 py-1">${this.getPaymentMethodText(sale.paymentMethod || 'dinheiro')}</td>
                <td class="border px-2 py-1">
                    <span class="px-2 py-1 rounded text-xs ${this.getPaymentStatusClass(sale.paymentStatus || 'pendente')}">
                        ${this.getPaymentStatusText(sale.paymentStatus || 'pendente')}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    getPaymentMethodText(method) {
        const methods = {
            'dinheiro': 'Dinheiro',
            'pix': 'PIX',
            'cartao_debito': 'Cartão Débito',
            'cartao_credito': 'Cartão Crédito',
            'transferencia': 'Transferência',
            'boleto': 'Boleto'
        };
        return methods[method] || method;
    }

    getPaymentStatusClass(status) {
        const colors = {
            'pago': 'bg-green-100 text-green-800',
            'pendente': 'bg-yellow-100 text-yellow-800',
            'parcial': 'bg-blue-100 text-blue-800',
            'vencido': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

    getPaymentStatusText(status) {
        const statuses = {
            'pago': 'Pago',
            'pendente': 'Pendente',
            'parcial': 'Parcial',
            'vencido': 'Vencido'
        };
        return statuses[status] || status;
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }
}
