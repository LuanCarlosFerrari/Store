/**
 * Configuration and Initialization
 */
import { Application } from './Application.js';

// Configuração do Supabase
const SUPABASE_CONFIG = {
    url: 'https://tthnfrhnqlbvkobmhtqu.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0aG5mcmhucWxidmtvYm1odHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDQ5NzMsImV4cCI6MjA2NjAyMDk3M30.KYmxo-BNljioDJEbCuMn38BiAXRv0mZflU0WvjCOdF8'
};

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Inicializando Supabase...');

        // Verificar se Supabase está disponível
        if (typeof window.supabase === 'undefined') {
            throw new Error('Biblioteca Supabase não encontrada');
        }

        // Criar cliente Supabase
        const supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );

        console.log('Supabase inicializado, iniciando aplicação...');

        // Inicializar aplicação
        await window.initializeApp(supabaseClient);

        console.log('Aplicação inicializada com sucesso!');

    } catch (error) {
        console.error('Erro na inicialização:', error);

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
