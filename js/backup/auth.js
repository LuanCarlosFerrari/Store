/**
 * Controlador de Autenticação Otimizado
 * 
 * Funcionalidades:
 * - Cache de sessão para evitar verificações desnecessárias
 * - Controle de redirecionamentos automáticos
 * - Verificação silenciosa para não interromper o fluxo
 * - Configurações ajustáveis para diferentes cenários
 * 
 * Uso:
 * - authController.isAuthenticated() - Verificação com cache
 * - authController.isAuthenticatedSilent() - Verificação sem redirecionamentos
 * - authController.disableAutoRedirect() - Desabilitar redirecionamentos automáticos
 * - authController.configure(options) - Ajustar configurações
 */

class AuthController {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.authCheckInProgress = false;
        this.sessionCache = null;
        this.sessionCacheExpiry = 0;
        this.authListenerConfigured = false;

        // Configurações para controlar verificações
        this.config = {
            enableAutoRedirect: true,
            cacheTimeout: 30000, // 30 segundos
            maxAuthChecks: 3,
            authCheckInterval: 5000 // 5 segundos entre verificações
        };
        this.authCheckCount = 0;
        this.lastAuthCheck = 0;

        // Aguardar configuração estar disponível
        this.waitForConfig();
    }

    waitForConfig() {
        const checkConfig = () => {
            if (window.SUPABASE_CONFIG) {
                this.SUPABASE_URL = window.SUPABASE_CONFIG.url;
                this.SUPABASE_ANON_KEY = window.SUPABASE_CONFIG.anonKey;
                this.init();
            } else {
                setTimeout(checkConfig, 100);
            }
        };
        checkConfig();
    }

    init() {
        if (this.isInitialized) return;

        // Inicializar cliente Supabase apenas se as credenciais estiverem configuradas
        this.supabase = null;
        this.initSupabase();
        this.initEventListeners();
        this.checkAuthStatus();

        this.isInitialized = true;
    }

    initSupabase() {
        if (this.SUPABASE_URL !== 'YOUR_SUPABASE_URL' && this.SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
            this.supabase = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
        } else {
            this.showMessage('Configuração do Supabase necessária. Verifique as credenciais em js/auth.js', 'error');
        }
    }

    initEventListeners() {
        // Botões de navegação entre formulários
        document.getElementById('showRegisterBtn')?.addEventListener('click', () => this.showRegisterForm());
        document.getElementById('showLoginBtn')?.addEventListener('click', () => this.showLoginForm());

        // Botões de ação
        document.getElementById('loginBtn')?.addEventListener('click', () => this.handleLogin());
        document.getElementById('registerBtn')?.addEventListener('click', () => this.handleRegister());

        // Enter nos campos de input
        document.getElementById('email')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        document.getElementById('password')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Botão de logout (se existir)
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
    }

    showRegisterForm() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
        this.hideMessage();
    }

    showLoginForm() {
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
        this.hideMessage();
    }

    async handleLogin() {
        if (!this.supabase) {
            this.showMessage('Supabase não configurado', 'error');
            return;
        }

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            this.showMessage('Por favor, preencha todos os campos', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw error;
            }

            this.showMessage('Login realizado com sucesso!', 'success');

            // Redirecionar para o sistema principal após sucesso
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } catch (error) {
            console.error('Erro no login:', error);
            this.showMessage(this.getErrorMessage(error.message), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister() {
        if (!this.supabase) {
            this.showMessage('Supabase não configurado', 'error');
            return;
        }

        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!email || !password || !confirmPassword) {
            this.showMessage('Por favor, preencha todos os campos', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('As senhas não coincidem', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password
            });

            if (error) {
                throw error;
            }

            this.showMessage('Cadastro realizado! Verifique seu email para confirmar a conta.', 'success');

            // Voltar para o formulário de login
            setTimeout(() => {
                this.showLoginForm();
            }, 3000);

        } catch (error) {
            console.error('Erro no cadastro:', error);
            this.showMessage(this.getErrorMessage(error.message), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleLogout() {
        if (!this.supabase) return;

        this.showLoading(true);

        try {
            const { error } = await this.supabase.auth.signOut();

            if (error) {
                throw error;
            }

            // Limpar dados locais e cache
            this.clearCache();
            localStorage.clear();
            sessionStorage.clear();

            // Redirecionar para login
            window.location.href = 'login.html';

        } catch (error) {
            console.error('Erro no logout:', error);
            this.showMessage('Erro ao fazer logout', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async checkAuthStatus() {
        if (!this.supabase || this.authCheckInProgress) return;

        // Limitar número de verificações automáticas
        const now = Date.now();
        if (this.authCheckCount >= this.config.maxAuthChecks &&
            (now - this.lastAuthCheck) < this.config.authCheckInterval) {
            return;
        }

        this.authCheckInProgress = true;
        this.authCheckCount++;
        this.lastAuthCheck = now;

        try {
            // Usar cache de sessão se ainda válido
            if (this.sessionCache && now < this.sessionCacheExpiry) {
                const session = this.sessionCache;
                if (this.config.enableAutoRedirect) {
                    this.handleAuthRedirect(session);
                }
                return;
            }

            const { data: { session } } = await this.supabase.auth.getSession();

            // Cachear a sessão
            this.sessionCache = session;
            this.sessionCacheExpiry = now + this.config.cacheTimeout;
            this.currentUser = session?.user || null;

            if (this.config.enableAutoRedirect) {
                this.handleAuthRedirect(session);
            }

            // Configurar listener apenas uma vez
            if (!this.authListenerConfigured) {
                this.setupAuthListener();
                this.authListenerConfigured = true;
            }

        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
        } finally {
            this.authCheckInProgress = false;
        }
    }

    handleAuthRedirect(session) {
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('login.html');
        const isMainPage = currentPath.includes('index.html');

        // Evitar redirecionamento em loop
        if (session && isLoginPage) {
            if (!window._redirecting) {
                window._redirecting = true;
                window.location.href = 'index.html';
            }
            return;
        }

        if (!session && isMainPage) {
            if (!window._redirecting) {
                window._redirecting = true;
                window.location.href = 'login.html';
            }
            return;
        }
    }

    setupAuthListener() {
        if (this._listenerConfigured) return; // Evita múltiplos listeners
        this._listenerConfigured = true;
        this.supabase.auth.onAuthStateChange((event, session) => {
            // Limpar cache quando há mudança de estado
            this.sessionCache = null;
            this.sessionCacheExpiry = 0;
            this.currentUser = session?.user || null;

            // Evitar redirecionamento em loop
            if (event === 'SIGNED_OUT') {
                if (!window.location.pathname.includes('login.html') && !window._redirecting) {
                    window._redirecting = true;
                    window.location.href = 'login.html';
                }
            } else if (event === 'SIGNED_IN') {
                if (!window.location.pathname.includes('index.html') && !window._redirecting) {
                    window._redirecting = true;
                    window.location.href = 'index.html';
                }
            }
        });
    }

    showMessage(message, type) {
        const messageEl = document.getElementById('message');
        if (!messageEl) return;

        messageEl.textContent = message;
        messageEl.className = `mt-4 p-3 rounded-md text-sm ${type === 'success'
            ? 'bg-green-100 text-green-700 border border-green-300'
            : 'bg-red-100 text-red-700 border border-red-300'
            }`;
        messageEl.classList.remove('hidden');
    }

    hideMessage() {
        const messageEl = document.getElementById('message');
        if (messageEl) {
            messageEl.classList.add('hidden');
        }
    }

    showLoading(show) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            if (show) {
                loadingEl.classList.remove('hidden');
            } else {
                loadingEl.classList.add('hidden');
            }
        }
    }

    getErrorMessage(error) {
        const errorMessages = {
            'Invalid login credentials': 'Email ou senha incorretos',
            'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
            'User already registered': 'Este email já está cadastrado',
            'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
            'Invalid email': 'Email inválido',
            'Network request failed': 'Erro de conexão. Verifique sua internet.'
        };

        return errorMessages[error] || `Erro: ${error}`;
    }

    // Método para obter o usuário atual (com cache)
    async getCurrentUser() {
        if (!this.supabase) return null;

        // Usar cache se disponível
        if (this.currentUser) {
            return this.currentUser;
        }

        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            this.currentUser = user;
            return user;
        } catch (error) {
            console.error('Erro ao obter usuário:', error);
            return null;
        }
    }

    // Método para verificar se está autenticado (com cache otimizado)
    async isAuthenticated() {
        if (!this.supabase) return false;

        // Usar cache se disponível e ainda válido
        const now = Date.now();
        if (this.sessionCache !== null && now < this.sessionCacheExpiry) {
            return !!this.sessionCache;
        }

        try {
            const { data: { session } } = await this.supabase.auth.getSession();

            // Atualizar cache com timeout mais longo para verificações manuais
            this.sessionCache = session;
            this.sessionCacheExpiry = now + this.config.cacheTimeout;
            this.currentUser = session?.user || null;

            return !!session;
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            // Em caso de erro, não limpar cache imediatamente
            return this.sessionCache ? !!this.sessionCache : false;
        }
    }

    // Verificação silenciosa de autenticação (sem redirecionamentos)
    async isAuthenticatedSilent() {
        if (!this.supabase) return false;

        // Usar cache se disponível e ainda válido
        const now = Date.now();
        if (this.sessionCache && now < this.sessionCacheExpiry) {
            return !!this.sessionCache;
        }

        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();

            if (!error) {
                // Atualizar cache apenas se não houve erro
                this.sessionCache = session;
                this.sessionCacheExpiry = now + 30000; // 30 segundos
                this.currentUser = session?.user || null;
            }

            return !!session;
        } catch (error) {
            // Em caso de erro, não fazer nada drástico, apenas retornar false
            console.warn('Erro silencioso na verificação de auth:', error);
            return false;
        }
    }

    // Limpar cache quando fazer logout
    clearCache() {
        this.sessionCache = null;
        this.sessionCacheExpiry = 0;
        this.currentUser = null;
    }

    // Método para desabilitar redirecionamentos automáticos
    disableAutoRedirect() {
        this.config.enableAutoRedirect = false;
        console.log('Auth: Redirecionamentos automáticos desabilitados');
    }

    // Método para habilitar redirecionamentos automáticos
    enableAutoRedirect() {
        this.config.enableAutoRedirect = true;
        console.log('Auth: Redirecionamentos automáticos habilitados');
    }

    // Método para resetar contadores de verificação
    resetAuthChecks() {
        this.authCheckCount = 0;
        this.lastAuthCheck = 0;
        console.log('Auth: Contadores de verificação resetados');
    }

    // Método para configurar opções de auth
    configure(options) {
        this.config = { ...this.config, ...options };
        console.log('Auth: Configuração atualizada', this.config);
    }

    // Utility function para debounce
    debounce(func, wait) {
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
}

// Inicializar o controlador de autenticação
document.addEventListener('DOMContentLoaded', () => {
    // Evitar múltiplas instâncias
    if (!window.authController) {
        window.authController = new AuthController();
        console.log('Auth: Controlador inicializado');
    }
});
