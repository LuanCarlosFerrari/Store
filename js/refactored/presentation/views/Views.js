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

        // Elementos da nova interface de venda
        this.saleProducts = [];
        this.setupNewSaleInterface();
    }

    setupNewSaleInterface() {
        // Cache de elementos do formulário de venda
        this.productSelect = document.getElementById('produto-select');
        this.quantityInput = document.getElementById('quantidade-input');
        this.unitPriceInput = document.getElementById('preco-unitario');
        this.addProductBtn = document.getElementById('adicionar-produto');
        this.productsTable = document.getElementById('produtos-venda');
        this.totalElement = document.getElementById('total-venda');
        this.finalizeSaleBtn = document.getElementById('finalizar-venda');
        this.noProductsRow = document.getElementById('no-produtos-row');

        // Event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Atualizar preço quando produto for selecionado
        if (this.productSelect) {
            this.productSelect.addEventListener('change', () => {
                const selectedOption = this.productSelect.selectedOptions[0];
                if (selectedOption && selectedOption.value) {
                    const price = parseFloat(selectedOption.dataset.price || 0);
                    this.unitPriceInput.value = price.toFixed(2);
                } else {
                    this.unitPriceInput.value = '';
                }
            });
        }

        // Adicionar produto à venda
        if (this.addProductBtn) {
            this.addProductBtn.addEventListener('click', () => {
                this.addProductToSale();
            });
        }

        // Enter no campo quantidade adiciona produto
        if (this.quantityInput) {
            this.quantityInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addProductToSale();
                }
            });
        }
    } addProductToSale() {
        const productId = this.productSelect?.value;
        const productOption = this.productSelect?.selectedOptions[0];
        const productName = productOption?.text;
        const quantity = parseInt(this.quantityInput?.value || 0);
        const unitPrice = parseFloat(this.unitPriceInput?.value || 0);

        // Validações
        if (!productId) {
            this.showError('Selecione um produto');
            return;
        }

        if (quantity <= 0) {
            this.showError('Quantidade deve ser maior que zero');
            return;
        }

        if (unitPrice <= 0) {
            this.showError('Preço deve ser maior que zero');
            return;
        }

        // Verificar estoque disponível
        const availableStock = this.getAvailableStock(productOption);
        const existingProduct = this.saleProducts.find(p => p.productId === productId);
        const currentQuantityInSale = existingProduct ? existingProduct.quantity : 0;
        const totalQuantity = currentQuantityInSale + quantity;

        if (totalQuantity > availableStock) {
            this.showError(`Estoque insuficiente. Disponível: ${availableStock}, já adicionado: ${currentQuantityInSale}`);
            return;
        }

        // Verificar se produto já foi adicionado
        const existingProductIndex = this.saleProducts.findIndex(p => p.productId === productId);

        if (existingProductIndex >= 0) {
            // Atualizar quantidade existente
            this.saleProducts[existingProductIndex].quantity += quantity;
            this.saleProducts[existingProductIndex].subtotal =
                this.saleProducts[existingProductIndex].quantity * this.saleProducts[existingProductIndex].unitPrice;
        } else {
            // Adicionar novo produto
            this.saleProducts.push({
                productId,
                productName: productName.split(' (Estoque:')[0], // Remove info de estoque do nome
                quantity,
                unitPrice,
                subtotal: quantity * unitPrice
            });
        }

        // Atualizar interface
        this.updateProductsTable();
        this.updateTotal();
        this.clearProductForm();
        this.updateFinalizeSaleButton();
    }

    getAvailableStock(productOption) {
        if (!productOption) return 0;

        // Extrair o número do estoque do texto da opção
        const stockMatch = productOption.text.match(/Estoque:\s*(\d+)/); return stockMatch ? parseInt(stockMatch[1]) : 0;
    }

    removeProductFromSale(index) {
        this.saleProducts.splice(index, 1);
        this.updateProductsTable();
        this.updateTotal();
        this.updateFinalizeSaleButton();
    }

    updateProductsTable() {
        if (!this.productsTable) return;

        // Esconder linha "nenhum produto" se houver produtos
        if (this.noProductsRow) {
            this.noProductsRow.style.display = this.saleProducts.length > 0 ? 'none' : '';
        }

        // Remover linhas de produtos existentes (exceto a primeira que é o "nenhum produto")
        const existingRows = this.productsTable.querySelectorAll('tr:not(#no-produtos-row)');
        existingRows.forEach(row => row.remove());

        // Adicionar produtos
        this.saleProducts.forEach((product, index) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-4 py-2 border-b">${product.productName}</td>
                <td class="px-4 py-2 border-b">R$ ${product.unitPrice.toFixed(2).replace('.', ',')}</td>
                <td class="px-4 py-2 border-b">${product.quantity}</td>
                <td class="px-4 py-2 border-b">R$ ${product.subtotal.toFixed(2).replace('.', ',')}</td>
                <td class="px-4 py-2 border-b">
                    <button class="remove-product-btn bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600" 
                            data-index="${index}">
                        Remover
                    </button>
                </td>
            `;

            // Event listener para remover produto
            const removeBtn = row.querySelector('.remove-product-btn');
            removeBtn.addEventListener('click', () => {
                this.removeProductFromSale(index);
            });

            this.productsTable.appendChild(row);
        });
    }

    updateTotal() {
        const total = this.saleProducts.reduce((sum, product) => sum + product.subtotal, 0);
        if (this.totalElement) {
            this.totalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        }
        return total;
    }

    updateFinalizeSaleButton() {
        if (this.finalizeSaleBtn) {
            const hasProducts = this.saleProducts.length > 0;
            this.finalizeSaleBtn.disabled = !hasProducts;
        }
    }

    clearProductForm() {
        if (this.productSelect) this.productSelect.value = '';
        if (this.quantityInput) this.quantityInput.value = '1';
        if (this.unitPriceInput) this.unitPriceInput.value = '';
    }

    clearSaleForm() {
        this.saleProducts = [];
        this.updateProductsTable();
        this.updateTotal();
        this.updateFinalizeSaleButton();
        this.clearProductForm();

        // Limpar seleção de cliente
        const customerSelect = document.getElementById('cliente');
        if (customerSelect) customerSelect.value = '';

        // Resetar método de pagamento
        const paymentMethodSelect = document.getElementById('payment-method');
        if (paymentMethodSelect) paymentMethodSelect.value = 'pix';
    }

    getSaleData() {
        const customerSelect = document.getElementById('cliente');
        const paymentMethodSelect = document.getElementById('payment-method');

        if (!customerSelect?.value) {
            throw new Error('Selecione um cliente');
        }

        if (this.saleProducts.length === 0) {
            throw new Error('Adicione pelo menos um produto à venda');
        }

        return {
            customerId: customerSelect.value,
            products: this.saleProducts,
            paymentMethod: paymentMethodSelect?.value || 'pix',
            totalValue: this.updateTotal()
        };
    } displaySales(sales) {
        if (!this.salesContainer) return;

        if (sales.length === 0) {
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
                <td class="border px-4 py-2 max-w-xs truncate" title="${sale.productName || 'N/A'}">${sale.productName || 'N/A'}</td>
                <td class="border px-4 py-2 text-center">${sale.quantity}</td>
                <td class="border px-4 py-2 text-right">${this.formatCurrency(sale.unitValue || sale.totalValue / sale.quantity)}</td>
                <td class="border px-4 py-2 text-right font-semibold">${this.formatCurrency(sale.totalValue)}</td>
                <td class="border px-4 py-2 text-center">
                    <span class="px-2 py-1 rounded text-xs ${this.getPaymentStatusClass(sale.paymentStatus || 'pendente')}">
                        ${this.getPaymentStatusText(sale.paymentStatus || 'pendente')}
                    </span>
                </td>
                <td class="border px-4 py-2 text-center">
                    <button onclick="viewSaleDetails('${sale.id}')" 
                            class="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600">
                        Detalhes
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

    updateProductSelect(products) {
        // Para o select de produtos na nova interface de venda
        const productSelect = document.getElementById('produto-select');
        if (productSelect) {
            productSelect.innerHTML = `
                <option value="">Selecione um produto</option>
                ${products.map(product => `
                    <option value="${product.id}" data-price="${product.price}">
                        ${product.name} (Estoque: ${product.quantity})
                    </option>
                `).join('')}
            `;
        }

        // Para o select de produtos na interface antiga (compatibilidade)
        if (this.productSelect && this.productSelect !== productSelect) {
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
