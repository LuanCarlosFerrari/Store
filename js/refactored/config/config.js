/**
 * Configuração centralizada da aplicação
 */

// Configuração do Supabase
export const SUPABASE_CONFIG = {
    url: 'https://tthnfrhnqlbvkobmhtqu.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0aG5mcmhucWxidmtvYm1odHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDQ5NzMsImV4cCI6MjA2NjAyMDk3M30.KYmxo-BNljioDJEbCuMn38BiAXRv0mZflU0WvjCOdF8'
};

// Configurações da aplicação
export const APP_CONFIG = {
    defaultTab: 'dashboard',
    autoRefreshInterval: 30000, // 30 segundos
    dateFormat: 'pt-BR',
    currency: 'BRL',
    isDevelopment: true // Alterar para false em produção
};

// Sistema de logging simplificado
export const Logger = {
    log: (message, ...args) => {
        if (APP_CONFIG.isDevelopment) {
            console.log(`[${new Date().toLocaleTimeString()}]`, message, ...args);
        }
    },

    error: (message, ...args) => {
        console.error(`[${new Date().toLocaleTimeString()}] ERROR:`, message, ...args);
    },

    warn: (message, ...args) => {
        if (APP_CONFIG.isDevelopment) {
            console.warn(`[${new Date().toLocaleTimeString()}] WARN:`, message, ...args);
        }
    }
};
