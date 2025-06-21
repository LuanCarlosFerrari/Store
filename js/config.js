// Configuração do Supabase
// INSTRUÇÕES PARA CONFIGURAR:
// 1. Acesse https://supabase.com e crie um projeto
// 2. Vá em Settings > API
// 3. Copie a URL do projeto e a chave anônima
// 4. Substitua os valores abaixo

const SUPABASE_CONFIG = {
    url: 'https://tthnfrhnqlbvkobmhtqu.supabase.co', // Ex: https://xyzcompany.supabase.co
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0aG5mcmhucWxidmtvYm1odHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDQ5NzMsImV4cCI6MjA2NjAyMDk3M30.KYmxo-BNljioDJEbCuMn38BiAXRv0mZflU0WvjCOdF8' // Chave anônima (pública)
};

// Exportar configuração
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
