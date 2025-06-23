/**
 * Login Module - Gerencia autenticação usando o AuthService refatorado
 */
import { AuthService } from './refactored/infrastructure/services/AuthService.js';

// Configuração do Supabase
const SUPABASE_CONFIG = {
    url: 'https://tthnfrhnqlbvkobmhtqu.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0aG5mcmhucWxidmtvYm1odHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDQ5NzMsImV4cCI6MjA2NjAyMDk3M30.KYmxo-BNljioDJEbCuMn38BiAXRv0mZflU0WvjCOdF8'
};

class LoginManager {
    constructor() {
        this.authService = null;
        this.currentForm = 'login'; // 'login' ou 'register'
    }

    async initialize() {
        try {
            // Verificar se Supabase está disponível
            if (typeof window.supabase === 'undefined') {
                throw new Error('Biblioteca Supabase não encontrada');
            }

            // Criar cliente Supabase
            const supabaseClient = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );

            // Inicializar AuthService
            this.authService = new AuthService(supabaseClient);

            // Verificar se já está logado
            const isAuthenticated = await this.authService.isAuthenticated();
            if (isAuthenticated) {
                this.redirectToMain();
                return;
            }

            // Configurar interface
            this.setupUI();

            console.log('Login manager inicializado com sucesso');

        } catch (error) {
            console.error('Erro ao inicializar login manager:', error);
            this.showMessage('Erro ao inicializar sistema de login', 'error');
        }
    }

    setupUI() {
        // Elementos do DOM
        this.elements = {
            loginForm: document.getElementById('loginForm'),
            registerForm: document.getElementById('registerForm'),
            loginBtn: document.getElementById('loginBtn'),
            registerBtn: document.getElementById('registerBtn'),
            showRegisterBtn: document.getElementById('showRegisterBtn'),
            showLoginBtn: document.getElementById('showLoginBtn'),
            message: document.getElementById('message'),
            loading: document.getElementById('loading')
        };

        // Event listeners
        this.elements.loginBtn.addEventListener('click', () => this.handleLogin());
        this.elements.registerBtn.addEventListener('click', () => this.handleRegister());
        this.elements.showRegisterBtn.addEventListener('click', () => this.showRegisterForm());
        this.elements.showLoginBtn.addEventListener('click', () => this.showLoginForm());

        // Enter key listeners
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (this.currentForm === 'login') {
                    this.handleLogin();
                } else {
                    this.handleRegister();
                }
            }
        });
    }

    async handleLogin() {
        try {
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                this.showMessage('Por favor, preencha todos os campos', 'error');
                return;
            }

            this.showLoading(true);
            this.showMessage('');

            await this.authService.signIn(email, password);

            this.showMessage('Login realizado com sucesso!', 'success');

            // Pequeno delay para mostrar a mensagem antes de redirecionar
            setTimeout(() => {
                this.redirectToMain();
            }, 1000);

        } catch (error) {
            console.error('Erro no login:', error);
            this.showMessage(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister() {
        try {
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
            this.showMessage('');

            await this.authService.signUp(email, password);

            this.showMessage('Conta criada com sucesso! Verifique seu e-mail e faça login.', 'success');

            // Voltar para o formulário de login
            setTimeout(() => {
                this.showLoginForm();
            }, 2000);

        } catch (error) {
            console.error('Erro no cadastro:', error);
            this.showMessage(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showLoginForm() {
        this.currentForm = 'login';
        this.elements.loginForm.classList.remove('hidden');
        this.elements.registerForm.classList.add('hidden');
        this.showMessage('');
        this.clearForms();
    }

    showRegisterForm() {
        this.currentForm = 'register';
        this.elements.loginForm.classList.add('hidden');
        this.elements.registerForm.classList.remove('hidden');
        this.showMessage('');
        this.clearForms();
    }

    clearForms() {
        // Limpar formulário de login
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';

        // Limpar formulário de registro
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }

    showMessage(message, type = 'info') {
        if (!message) {
            this.elements.message.classList.add('hidden');
            return;
        }

        this.elements.message.textContent = message;
        this.elements.message.classList.remove('hidden', 'bg-red-100', 'bg-green-100', 'bg-blue-100', 'text-red-700', 'text-green-700', 'text-blue-700');

        switch (type) {
            case 'error':
                this.elements.message.classList.add('bg-red-100', 'text-red-700');
                break;
            case 'success':
                this.elements.message.classList.add('bg-green-100', 'text-green-700');
                break;
            default:
                this.elements.message.classList.add('bg-blue-100', 'text-blue-700');
                break;
        }
    }

    showLoading(show) {
        if (show) {
            this.elements.loading.classList.remove('hidden');
        } else {
            this.elements.loading.classList.add('hidden');
        }
    }

    redirectToMain() {
        window.location.href = 'index.html';
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    const loginManager = new LoginManager();
    await loginManager.initialize();
});
