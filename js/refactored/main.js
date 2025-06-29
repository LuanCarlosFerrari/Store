/**
 * Configuration and Initialization
 */
import { Application } from './Application.js';
import { SUPABASE_CONFIG, Logger } from './config/config.js';

// Função global para inicializar a aplicação
window.initializeApp = async (supabaseClient) => {
    try {
        Logger.log('Criando instância da aplicação...');
        const app = new Application(supabaseClient);
        Logger.log('Instância criada, inicializando...');
        await app.initialize();
        Logger.log('Aplicação inicializada com sucesso!');

        // Armazenar globalmente para compatibilidade
        window.app = app;
        return app;
    } catch (error) {
        Logger.error('Erro ao inicializar aplicação:', error);
        throw error;
    }
};

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    try {
        Logger.log('Inicializando Supabase...');

        // Verificar se Supabase está disponível
        if (typeof window.supabase === 'undefined') {
            throw new Error('Biblioteca Supabase não encontrada');
        }        // Criar cliente Supabase
        const supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey,
            SUPABASE_CONFIG.options
        );

        Logger.log('Supabase inicializado, iniciando aplicação...');

        // Inicializar aplicação
        await window.initializeApp(supabaseClient);

        Logger.log('Aplicação inicializada com sucesso!');

    } catch (error) {
        Logger.error('Erro na inicialização:', error);

        // Mostrar erro para o usuário
        const errorContainer = document.createElement('div');
        errorContainer.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
        errorContainer.innerHTML = `
            <strong>Erro de Inicialização:</strong><br>
            ${error.message}
        `;
        document.body.appendChild(errorContainer);

        // Remover erro após 10 segundos
        setTimeout(() => {
            errorContainer.remove();
        }, 10000);
    }
});

// Configuração de desenvolvimento
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Configurações de desenvolvimento
    console.log('Modo de desenvolvimento ativo');

    // Configurar dados mock se necessário
    window.mockData = {
        products: [
            { id: '1', name: 'Produto Exemplo 1', quantity: 10, price: 15.00 },
            { id: '2', name: 'Produto Exemplo 2', quantity: 5, price: 8.50 }
        ],
        customers: [
            { id: '1', name: 'Cliente Exemplo 1', email: 'cliente1@exemplo.com' },
            { id: '2', name: 'Cliente Exemplo 2', phone: '(11) 99999-9999' }
        ]
    };
}

// Funções utilitárias globais
window.utils = {
    formatCurrency: (value) => {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    },

    formatDate: (date) => {
        return new Date(date).toLocaleDateString('pt-BR');
    },

    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Funções globais para compatibilidade com HTML existente
window.mostrarAba = async (tabId) => {
    if (window.app) {
        await window.app.showTab(tabId);
    }
};

window.atualizarDashboard = async () => {
    if (window.app) {
        await window.app.refreshDashboard();
    }
};

window.filtrarVendasPorData = async () => {
    const dateInput = document.getElementById('dataSelecionada');
    if (window.app && dateInput) {
        await window.app.filterByDate(dateInput.value || null);
    }
};

window.resetarFiltroData = async () => {
    const dateInput = document.getElementById('dataSelecionada');
    if (window.app && dateInput) {
        dateInput.value = '';
        await window.app.filterByDate(null);
    }
};

// ============================================================================
// FUNÇÕES CRUD GLOBAIS PARA TODAS AS ABAS
// ============================================================================

// ========== PRODUTOS ==========
window.editProduct = async (productId) => {
    try {
        const productController = window.app.getController('product');
        const product = await productController.productUseCases.getProductById(productId);

        // Preencher formulário com dados do produto
        document.querySelector('#produtos input[name="nome"]').value = product.name || '';
        document.querySelector('#produtos input[name="quantidade"]').value = product.quantity || 0;
        document.querySelector('#produtos input[name="preco"]').value = product.price || 0;

        // Adicionar ID oculto para identificar edição
        let hiddenId = document.getElementById('edit-product-id');
        if (!hiddenId) {
            hiddenId = document.createElement('input');
            hiddenId.type = 'hidden';
            hiddenId.id = 'edit-product-id';
            document.querySelector('#produtos form').appendChild(hiddenId);
        }
        hiddenId.value = productId;

        // Alterar texto do botão
        const submitBtn = document.querySelector('#produtos form button[type="submit"]');
        submitBtn.textContent = 'Atualizar Produto';

        // Adicionar botão de cancelar se não existir
        let cancelBtn = document.getElementById('cancel-edit-product');
        if (!cancelBtn) {
            cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.id = 'cancel-edit-product';
            cancelBtn.className = 'bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors';
            cancelBtn.textContent = 'Cancelar';
            cancelBtn.onclick = window.cancelEditProduct;
            submitBtn.parentNode.appendChild(cancelBtn);
        }
        // Focar no primeiro campo
        document.querySelector('#produtos input[name="nome"]').focus();

        showNotification('Modo de edição ativado para o produto', 'info');

    } catch (error) {
        console.error('Erro ao editar produto:', error);
        showNotification('Erro ao carregar dados do produto: ' + error.message, 'error');
    }
};

window.deleteProduct = async (productId) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
            const productController = window.app.getController('product');
            await productController.deleteProduct(productId);
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
        }
    }
};

window.cancelEditProduct = () => {
    // Limpar formulário
    document.querySelector('#produtos form').reset();

    // Remover ID oculto se existir
    const hiddenId = document.getElementById('edit-product-id');
    if (hiddenId) {
        hiddenId.remove();
    }

    // Remover botão de cancelar
    const cancelBtn = document.getElementById('cancel-edit-product');
    if (cancelBtn) {
        cancelBtn.remove();
    }

    // Restaurar texto do botão
    const submitBtn = document.querySelector('#produtos form button[type="submit"]');
    submitBtn.textContent = 'Adicionar Produto';
};

window.viewProduct = async (productId) => {
    try {
        const productController = window.app.getController('product');
        const product = await productController.productUseCases.getProductById(productId);

        const totalValue = typeof product.getTotalValue === 'function' ?
            product.getTotalValue() : (product.quantity * product.price);

        alert(`
Produto: ${product.name}
Quantidade: ${product.quantity}
Preço Unitário: R$ ${product.price.toFixed(2)}
Valor Total: R$ ${totalValue.toFixed(2)}
        `);
    } catch (error) {
        console.error('Erro ao visualizar produto:', error);
        alert('Erro ao carregar dados do produto: ' + error.message);
    }
};

// ========== CLIENTES ==========
window.editCustomer = async (customerId) => {
    try {
        const customerController = window.app.getController('customer');
        const customer = await customerController.customerUseCases.getCustomerById(customerId);

        // Preencher formulário com dados do cliente
        document.querySelector('#clientes input[name="nome"]').value = customer.name || '';
        document.querySelector('#clientes input[name="email"]').value = customer.email || '';
        document.querySelector('#clientes input[name="telefone"]').value = customer.phone || '';

        // Adicionar ID oculto para identificar edição
        let hiddenId = document.getElementById('edit-customer-id');
        if (!hiddenId) {
            hiddenId = document.createElement('input');
            hiddenId.type = 'hidden';
            hiddenId.id = 'edit-customer-id';
            document.querySelector('#clientes form').appendChild(hiddenId);
        }
        hiddenId.value = customerId;

        // Alterar texto do botão
        const submitBtn = document.querySelector('#clientes form button[type="submit"]');
        submitBtn.textContent = 'Atualizar Cliente';

        // Adicionar botão de cancelar se não existir
        let cancelBtn = document.getElementById('cancel-edit-customer');
        if (!cancelBtn) {
            cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.id = 'cancel-edit-customer';
            cancelBtn.className = 'bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors';
            cancelBtn.textContent = 'Cancelar';
            cancelBtn.onclick = window.cancelEditCustomer;
            submitBtn.parentNode.appendChild(cancelBtn);
        }
        // Focar no primeiro campo
        document.querySelector('#clientes input[name="nome"]').focus();

        showNotification('Modo de edição ativado para o cliente', 'info');

    } catch (error) {
        console.error('Erro ao editar cliente:', error);
        showNotification('Erro ao carregar dados do cliente: ' + error.message, 'error');
    }
};

window.deleteCustomer = async (customerId) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        try {
            const customerController = window.app.getController('customer');
            await customerController.deleteCustomer(customerId);
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
        }
    }
};

window.cancelEditCustomer = () => {
    // Limpar formulário
    document.querySelector('#clientes form').reset();

    // Remover ID oculto se existir
    const hiddenId = document.getElementById('edit-customer-id');
    if (hiddenId) {
        hiddenId.remove();
    }

    // Remover botão de cancelar
    const cancelBtn = document.getElementById('cancel-edit-customer');
    if (cancelBtn) {
        cancelBtn.remove();
    }

    // Restaurar texto do botão
    const submitBtn = document.querySelector('#clientes form button[type="submit"]');
    submitBtn.textContent = 'Adicionar Cliente';
};

window.viewCustomer = async (customerId) => {
    try {
        const customerController = window.app.getController('customer');
        const customer = await customerController.customerUseCases.getCustomerById(customerId);

        alert(`
Cliente: ${customer.name}
Email: ${customer.email || 'Não informado'}
Telefone: ${customer.phone || 'Não informado'}
        `);
    } catch (error) {
        console.error('Erro ao visualizar cliente:', error);
        alert('Erro ao carregar dados do cliente: ' + error.message);
    }
};

// ========== VENDAS ==========
window.viewSaleDetails = async (saleId) => {
    try {
        const saleController = window.app.getController('sale');
        const sale = await saleController.saleUseCases.getSaleById(saleId);

        // Buscar dados do produto e cliente
        const productController = window.app.getController('product');
        const customerController = window.app.getController('customer');

        let productName = 'Produto não encontrado';
        let customerName = 'Cliente não encontrado';

        try {
            const product = await productController.productUseCases.getProductById(sale.productId);
            productName = product.name;
        } catch (e) {
            console.warn('Produto não encontrado:', sale.productId);
        }

        try {
            const customer = await customerController.customerUseCases.getCustomerById(sale.customerId);
            customerName = customer.name;
        } catch (e) {
            console.warn('Cliente não encontrado:', sale.customerId);
        }

        alert(`
DETALHES DA VENDA

Produto: ${productName}
Cliente: ${customerName}
Quantidade: ${sale.quantity}
Valor Total: R$ ${sale.totalValue.toFixed(2)}
Data: ${new Date(sale.date).toLocaleDateString('pt-BR')}
        `);
    } catch (error) {
        console.error('Erro ao visualizar venda:', error);
        alert('Erro ao carregar detalhes da venda: ' + error.message);
    }
};

window.editSale = async (saleId) => {
    alert('A edição de vendas não é permitida para manter a integridade dos dados. Use o sistema de pagamentos para ajustes necessários.');
};

window.deleteSale = async (saleId) => {
    if (confirm('ATENÇÃO: Excluir uma venda pode afetar o estoque e pagamentos relacionados. Tem certeza?')) {
        try {
            // Implementar lógica de exclusão de venda (se necessário)
            alert('Funcionalidade de exclusão de vendas será implementada com validações especiais.');
        } catch (error) {
            console.error('Erro ao excluir venda:', error);
        }
    }
};

// ========== PAGAMENTOS ==========
window.makePayment = async (paymentId) => {
    try {
        const paymentController = window.app.getController('payment');
        const payment = await paymentController.paymentUseCases.getPaymentById(paymentId);

        const remainingValue = payment.getRemainingValue();

        if (remainingValue <= 0) {
            alert('Este pagamento já foi quitado!');
            return;
        }

        const amount = prompt(`
Valor restante: R$ ${remainingValue.toFixed(2)}
Digite o valor do pagamento:`);

        if (amount && !isNaN(parseFloat(amount))) {
            const paymentAmount = parseFloat(amount);

            if (paymentAmount <= 0) {
                alert('O valor deve ser maior que zero!');
                return;
            }

            if (paymentAmount > remainingValue) {
                const confirma = confirm(`O valor informado (R$ ${paymentAmount.toFixed(2)}) é maior que o valor restante (R$ ${remainingValue.toFixed(2)}). Deseja continuar?`);
                if (!confirma) return;
            }

            await paymentController.makePayment(paymentId, paymentAmount);
        }
    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        alert('Erro ao processar pagamento: ' + error.message);
    }
};

window.viewPaymentDetails = async (paymentId) => {
    try {
        const paymentController = window.app.getController('payment');
        const payment = await paymentController.paymentUseCases.getPaymentById(paymentId);

        const status = payment.getStatus();
        const remainingValue = payment.getRemainingValue();

        alert(`
DETALHES DO PAGAMENTO

Valor Total: R$ ${payment.totalValue.toFixed(2)}
Valor Pago: R$ ${payment.paidValue.toFixed(2)}
Valor Restante: R$ ${remainingValue.toFixed(2)}
Status: ${status}
Vencimento: ${new Date(payment.dueDate).toLocaleDateString('pt-BR')}
${payment.paymentDate ? `Data do Pagamento: ${new Date(payment.paymentDate).toLocaleDateString('pt-BR')}` : ''}
        `);
    } catch (error) {
        console.error('Erro ao visualizar pagamento:', error);
        alert('Erro ao carregar detalhes do pagamento: ' + error.message);
    }
};

window.editPayment = async (paymentId) => {
    try {
        const paymentController = window.app.getController('payment');
        const payment = await paymentController.paymentUseCases.getPaymentById(paymentId);

        if (payment.getStatus() === 'paid') {
            alert('Não é possível editar um pagamento que já foi quitado.');
            return;
        }

        const newDueDate = prompt(`
Data de vencimento atual: ${new Date(payment.dueDate).toLocaleDateString('pt-BR')}
Nova data de vencimento (DD/MM/AAAA):`);

        if (newDueDate) {
            // Converter data DD/MM/AAAA para Date
            const dateParts = newDueDate.split('/');
            if (dateParts.length === 3) {
                const newDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);

                if (!isNaN(newDate.getTime())) {
                    // Atualizar data de vencimento (implementar no repositório se necessário)
                    alert('Funcionalidade de edição de data de vencimento será implementada.');
                } else {
                    alert('Data inválida! Use o formato DD/MM/AAAA');
                }
            } else {
                alert('Data inválida! Use o formato DD/MM/AAAA');
            }
        }
    } catch (error) {
        console.error('Erro ao editar pagamento:', error);
        alert('Erro ao editar pagamento: ' + error.message);
    }
};

window.deletePayment = async (paymentId) => {
    if (confirm('Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita.')) {
        try {
            // Implementar exclusão de pagamento
            alert('Funcionalidade de exclusão de pagamentos será implementada com validações especiais.');
        } catch (error) {
            console.error('Erro ao excluir pagamento:', error);
        }
    }
};

// ========== SISTEMA DE NOTIFICAÇÕES AVANÇADAS ==========
window.showNotification = (message, type = 'info', duration = 5000) => {
    // Criar container de notificações se não existir
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'fixed top-20 right-4 z-50 space-y-2';
        document.body.appendChild(notificationContainer);
    }

    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `
        max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto 
        border-l-4 ${type === 'success' ? 'border-green-500' :
            type === 'error' ? 'border-red-500' :
                type === 'warning' ? 'border-yellow-500' : 'border-blue-500'}
        transform transition-all duration-300 ease-in-out translate-x-full opacity-0
    `;

    const icon = type === 'success' ? '✅' :
        type === 'error' ? '❌' :
            type === 'warning' ? '⚠️' : 'ℹ️';

    notification.innerHTML = `
        <div class="p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <span class="text-lg">${icon}</span>
                </div>
                <div class="ml-3 w-0 flex-1 pt-0.5">
                    <p class="text-sm font-medium text-gray-900">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" 
                            class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500">
                        <span class="sr-only">Fechar</span>
                        <span class="text-xl">&times;</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    notificationContainer.appendChild(notification);

    // Animar entrada
    setTimeout(() => {
        notification.classList.remove('translate-x-full', 'opacity-0');
    }, 100);

    // Auto remover
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }
};

// ========== FUNÇÕES DE BUSCA E FILTROS ==========
window.searchProducts = (searchTerm) => {
    const rows = document.querySelectorAll('#produtos-lista tr');
    const term = searchTerm.toLowerCase();

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const text = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
            row.style.display = text.includes(term) ? '' : 'none';
        }
    });
};

window.searchCustomers = (searchTerm) => {
    const rows = document.querySelectorAll('#clientes-lista tr');
    const term = searchTerm.toLowerCase();

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const text = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
            row.style.display = text.includes(term) ? '' : 'none';
        }
    });
};

window.searchSales = (searchTerm) => {
    const rows = document.querySelectorAll('#vendas-lista tr');
    const term = searchTerm.toLowerCase();

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const text = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
            row.style.display = text.includes(term) ? '' : 'none';
        }
    });
};

window.searchPayments = (searchTerm) => {
    const rows = document.querySelectorAll('#pagamentos-lista tr');
    const term = searchTerm.toLowerCase();

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const text = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
            row.style.display = text.includes(term) ? '' : 'none';
        }
    });
};

window.filterPaymentsByStatus = (status) => {
    const rows = document.querySelectorAll('#pagamentos-lista tr');

    rows.forEach(row => {
        if (status === 'todos') {
            row.style.display = '';
        } else {
            const statusCell = row.querySelector('td:nth-child(9) span');
            if (statusCell) {
                const rowStatus = statusCell.textContent.toLowerCase();
                row.style.display = rowStatus.includes(status.toLowerCase()) ? '' : 'none';
            }
        }
    });
};

// ========== FUNÇÕES DE EXPORTAÇÃO (PLACEHOLDERS) ==========
window.exportProducts = () => {
    showNotification('Função de exportação será implementada em breve', 'info');
};

window.exportCustomers = () => {
    showNotification('Função de exportação será implementada em breve', 'info');
};

window.exportSales = () => {
    showNotification('Função de exportação será implementada em breve', 'info');
};

window.exportPayments = () => {
    showNotification('Função de exportação será implementada em breve', 'info');
};

// ========== FUNÇÕES DE RELATÓRIOS ==========
window.generateInventoryReport = async () => {
    try {
        const productController = window.app.getController('product');
        const products = await productController.productUseCases.getAllProducts();

        if (products.length === 0) {
            showNotification('Nenhum produto encontrado para o relatório', 'warning');
            return;
        }

        let totalValue = 0;
        let lowStockProducts = 0;
        let outOfStockProducts = 0;

        products.forEach(product => {
            const value = typeof product.getTotalValue === 'function' ?
                product.getTotalValue() : (product.quantity * product.price);
            totalValue += value;

            if (product.quantity === 0) {
                outOfStockProducts++;
            } else if (product.quantity < 5) {
                lowStockProducts++;
            }
        });

        alert(`
RELATÓRIO DE ESTOQUE

Total de Produtos: ${products.length}
Valor Total do Estoque: R$ ${totalValue.toFixed(2)}
Produtos em Falta: ${outOfStockProducts}
Produtos com Estoque Baixo: ${lowStockProducts}
        `);

    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        showNotification('Erro ao gerar relatório de estoque', 'error');
    }
};

window.generateSalesReport = async () => {
    try {
        const saleController = window.app.getController('sale');
        const sales = await saleController.saleUseCases.getAllSales();

        if (sales.length === 0) {
            showNotification('Nenhuma venda encontrada para o relatório', 'warning');
            return;
        }

        const totalSales = sales.length;
        const totalValue = sales.reduce((sum, sale) => sum + sale.totalValue, 0);
        const averageValue = totalValue / totalSales;

        // Vendas hoje
        const today = new Date();
        const todaySales = sales.filter(sale => {
            const saleDate = new Date(sale.date || sale.saleDate);
            return saleDate.toDateString() === today.toDateString();
        });

        alert(`
RELATÓRIO DE VENDAS

Total de Vendas: ${totalSales}
Valor Total: R$ ${totalValue.toFixed(2)}
Ticket Médio: R$ ${averageValue.toFixed(2)}
Vendas Hoje: ${todaySales.length}
        `);

    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        showNotification('Erro ao gerar relatório de vendas', 'error');
    }
};
