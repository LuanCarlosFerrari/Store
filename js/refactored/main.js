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
        }

        // Criar cliente Supabase
        const supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
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

// Funções para produtos
window.editProduct = async (productId) => {
    console.log('Editar produto:', productId);
    alert('Funcionalidade de edição será implementada em breve');
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

// Funções para clientes
window.editCustomer = async (customerId) => {
    console.log('Editar cliente:', customerId);
    alert('Funcionalidade de edição será implementada em breve');
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

// Funções para vendas
window.viewSaleDetails = async (saleId) => {
    console.log('Ver detalhes da venda:', saleId);
    alert('Detalhes da venda serão implementados em breve');
};

// Funções para pagamentos
window.makePayment = async (paymentId) => {
    const amount = prompt('Digite o valor do pagamento:');
    if (amount && !isNaN(parseFloat(amount))) {
        try {
            const paymentController = window.app.getController('payment');
            await paymentController.makePayment(paymentId, parseFloat(amount));
        } catch (error) {
            console.error('Erro ao processar pagamento:', error);
        }
    }
};
