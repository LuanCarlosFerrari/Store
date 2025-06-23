/**
 * Inicialização Global dos Controladores
 * 
 * Este arquivo garante que os controladores estejam disponíveis globalmente
 * para compatibilidade com o HTML existente e facilitar o debug.
 */

// Aguardar DOM e inicializar controladores globais
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sistema: Inicializando controladores globais...');

    // Aguardar um pouco para garantir que todos os módulos foram carregados
    setTimeout(() => {
        // Verificar se o app principal foi inicializado
        if (window.app) {
            // Tornar controladores disponíveis globalmente para debug e compatibilidade

            // Aguardar os controladores estarem prontos
            const checkControllers = () => {
                if (window.app.produtoController) {
                    window.produtoController = window.app.produtoController;
                    console.log('✓ ProdutoController disponível globalmente');
                }

                if (window.app.clienteController) {
                    window.clienteController = window.app.clienteController;
                    console.log('✓ ClienteController disponível globalmente');
                }

                if (window.app.vendaController) {
                    window.vendaController = window.app.vendaController;
                    console.log('✓ VendaController disponível globalmente');
                }

                if (window.app.databaseController) {
                    window.databaseController = window.app.databaseController;
                    console.log('✓ DatabaseController disponível globalmente');
                }

                // Se nem todos os controladores estão prontos, tentar novamente
                if (!window.produtoController || !window.clienteController || !window.vendaController) {
                    setTimeout(checkControllers, 500);
                } else {
                    console.log('Sistema: Todos os controladores globais foram inicializados!');

                    // Adicionar métodos de debug globais
                    window.debugSystem = () => {
                        if (window.app && window.app.debugStatus) {
                            window.app.debugStatus();
                        } else {
                            console.log('App não inicializado ainda');
                        }
                    };

                    // Método para verificar status
                    window.checkSystemStatus = () => {
                        console.log('=== STATUS DOS CONTROLADORES ===');
                        console.log('AuthController:', !!window.authController);
                        console.log('DatabaseController:', !!window.databaseController);
                        console.log('ProdutoController:', !!window.produtoController);
                        console.log('ClienteController:', !!window.clienteController);
                        console.log('VendaController:', !!window.vendaController);
                        console.log('AppController:', !!window.app);
                        console.log('================================');
                    };

                    console.log('Sistema: Métodos de debug disponíveis:');
                    console.log('- debugSystem()');
                    console.log('- checkSystemStatus()');
                }
            };

            // Iniciar verificação dos controladores
            checkControllers();
        } else {
            console.warn('Sistema: App principal não foi inicializado ainda');
        }
    }, 1000);
});

// Funções utilitárias globais
window.formatarMoeda = (valor) => {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
};

window.formatarData = (data) => {
    if (data instanceof Date) {
        return data.toLocaleDateString('pt-BR');
    }
    if (typeof data === 'string') {
        return new Date(data).toLocaleDateString('pt-BR');
    }
    return data;
};

// Método para recarregar dados de todos os controladores
window.recarregarDados = async () => {
    console.log('Sistema: Recarregando todos os dados...');

    try {
        if (window.produtoController && window.produtoController.carregarProdutos) {
            await window.produtoController.carregarProdutos();
            console.log('✓ Produtos recarregados');
        }

        if (window.clienteController && window.clienteController.carregarClientes) {
            await window.clienteController.carregarClientes();
            console.log('✓ Clientes recarregados');
        }

        if (window.vendaController && window.vendaController.carregarVendas) {
            await window.vendaController.carregarVendas();
            console.log('✓ Vendas recarregadas');
        }

        if (window.app && window.app.atualizarDashboard) {
            await window.app.atualizarDashboard();
            console.log('✓ Dashboard atualizado');
        }

        console.log('Sistema: Todos os dados foram recarregados!');
    } catch (error) {
        console.error('Erro ao recarregar dados:', error);
    }
};

// Método para limpar cache e reinicializar
window.reiniciarSistema = () => {
    console.log('Sistema: Reiniciando...');

    // Limpar cache de autenticação
    if (window.authController && window.authController.clearCache) {
        window.authController.clearCache();
    }

    // Recarregar a página
    window.location.reload();
};

console.log('Sistema: Arquivo de inicialização global carregado');
