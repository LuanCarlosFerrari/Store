/**
 * Application Entry Point - Dependency Injection e Inicialização
 */
import { AuthService } from './infrastructure/services/AuthService.js';
import { DashboardService } from './infrastructure/services/DashboardService.js';
import { SupabaseProductRepository, SupabaseCustomerRepository, SupabaseSaleRepository, SupabasePaymentRepository } from './infrastructure/repositories/SupabaseRepositories.js';
import { ProductController, CustomerController, SaleController, PaymentController, DashboardController } from './presentation/controllers/Controllers.js';
import { ProductView, CustomerView, SaleView, PaymentView, DashboardView } from './presentation/views/Views.js';
import { ProductUseCases, CustomerUseCases, SaleUseCases, PaymentUseCases } from './core/application/usecases/UseCases.js';

export class Application {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.isInitialized = false;
        this.currentTab = 'dashboard';

        // Services
        this.authService = null;
        this.dashboardService = null;

        // Repositories
        this.productRepository = null;
        this.customerRepository = null;
        this.saleRepository = null;
        this.paymentRepository = null;

        // Use Cases
        this.productUseCases = null;
        this.customerUseCases = null;
        this.saleUseCases = null;
        this.paymentUseCases = null;

        // Controllers
        this.productController = null;
        this.customerController = null;
        this.saleController = null;
        this.paymentController = null;
        this.dashboardController = null;

        // Views
        this.productView = null;
        this.customerView = null;
        this.saleView = null;
        this.paymentView = null;
        this.dashboardView = null;
    } async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('Inicializando aplicação...');

            // Verificar autenticação
            await this.initializeAuth();

            // Inicializar dependências
            await this.initializeDependencies();

            // Configurar interface
            this.setupUI();

            // Carregar dados iniciais
            await this.loadInitialData();

            this.isInitialized = true;
            console.log('Aplicação inicializada com sucesso!');

        } catch (error) {
            console.error('Erro na inicialização da aplicação:', error);
            throw error;
        }
    }

    async initializeAuth() {
        this.authService = new AuthService(this.supabase);

        const isAuthenticated = await this.authService.isAuthenticated();
        if (!isAuthenticated) {
            window.location.href = 'login.html';
            return;
        }

        // Configurar listener de mudanças de autenticação
        this.authService.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                window.location.href = 'login.html';
            }
        });

        // Exibir informações do usuário
        const user = await this.authService.getCurrentUser();
        const userEmailEl = document.getElementById('userEmail');
        if (user && userEmailEl) {
            userEmailEl.textContent = `Logado como: ${user.email}`;
        }
    }

    async initializeDependencies() {
        // Repositories
        this.productRepository = new SupabaseProductRepository(this.supabase);
        this.customerRepository = new SupabaseCustomerRepository(this.supabase);
        this.saleRepository = new SupabaseSaleRepository(this.supabase);
        this.paymentRepository = new SupabasePaymentRepository(this.supabase);

        // Use Cases
        this.productUseCases = new ProductUseCases(this.productRepository);
        this.customerUseCases = new CustomerUseCases(this.customerRepository);
        this.saleUseCases = new SaleUseCases(this.saleRepository, this.productRepository, this.customerRepository);
        this.paymentUseCases = new PaymentUseCases(this.paymentRepository, this.saleRepository);

        // Services
        this.dashboardService = new DashboardService(
            this.productUseCases,
            this.customerUseCases,
            this.saleUseCases,
            this.paymentUseCases
        );

        // Views
        this.productView = new ProductView();
        this.customerView = new CustomerView();
        this.saleView = new SaleView();
        this.paymentView = new PaymentView();
        this.dashboardView = new DashboardView();

        // Controllers
        this.productController = new ProductController(this.productRepository, this.authService);
        this.productController.setView(this.productView);

        this.customerController = new CustomerController(this.customerRepository, this.authService);
        this.customerController.setView(this.customerView);

        this.saleController = new SaleController(this.saleRepository, this.productRepository, this.customerRepository, this.authService);
        this.saleController.setView(this.saleView);

        this.paymentController = new PaymentController(this.paymentRepository, this.saleRepository, this.authService);
        this.paymentController.setView(this.paymentView);

        this.dashboardController = new DashboardController(this.dashboardService, this.authService);
        this.dashboardController.setView(this.dashboardView);
    }

    setupUI() {
        // Configurar navegação
        this.setupNavigation();

        // Configurar formulários
        this.setupForms();

        // Configurar seletor de data
        this.setupDateSelector();

        // Configurar botão de logout
        this.setupLogout();
    }

    setupNavigation() {
        // Mostrar dashboard por padrão
        this.showTab('dashboard');

        // Event listeners para navegação
        document.querySelectorAll('[data-tab]').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = element.getAttribute('data-tab');
                this.showTab(tabId);
            });
        });
    }

    setupForms() {
        // Formulário de produtos
        const productForm = document.querySelector('#produtos form');
        if (productForm) {
            productForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleProductSubmit(new FormData(productForm));
            });
        }

        // Formulário de clientes
        const customerForm = document.querySelector('#clientes form');
        if (customerForm) {
            customerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleCustomerSubmit(new FormData(customerForm));
            });
        }

        // Formulário de vendas
        const saleForm = document.querySelector('#vendas form');
        if (saleForm) {
            saleForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleSaleSubmit(new FormData(saleForm));
            });
        }
    }

    setupDateSelector() {
        const dateInput = document.getElementById('dataSelecionada');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
            dateInput.max = today;

            dateInput.addEventListener('change', async () => {
                const selectedDate = dateInput.value || null;
                await this.dashboardController.setSelectedDate(selectedDate);
            });
        }
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await this.authService.signOut();
                } catch (error) {
                    console.error('Erro ao fazer logout:', error);
                }
            });
        }
    }

    async showTab(tabId) {
        // Ocultar todas as abas
        document.querySelectorAll('.aba').forEach(tab => {
            tab.classList.add('hidden');
        });

        // Mostrar aba selecionada
        const activeTab = document.getElementById(tabId);
        if (activeTab) {
            activeTab.classList.remove('hidden');
        }

        // Atualizar navegação
        document.querySelectorAll('aside a').forEach(link => {
            link.classList.remove('bg-gray-700');
        });

        const activeLink = document.getElementById(`nav-${tabId}`);
        if (activeLink) {
            activeLink.classList.add('bg-gray-700');
        }

        this.currentTab = tabId;

        // Carregar dados da aba
        await this.loadTabData(tabId);
    }

    async loadTabData(tabId) {
        try {
            switch (tabId) {
                case 'dashboard':
                    await this.dashboardController.loadDashboard();
                    break;
                case 'produtos':
                    await this.productController.loadProducts();
                    break;
                case 'clientes':
                    await this.customerController.loadCustomers();
                    break;
                case 'vendas':
                    await this.saleController.loadSales();
                    break;
                case 'pagamentos':
                    await this.paymentController.loadPayments();
                    break;
            }
        } catch (error) {
            console.error(`Erro ao carregar dados da aba ${tabId}:`, error);
        }
    }

    async loadInitialData() {
        // Carregar dados do dashboard
        await this.dashboardController.loadDashboard();

        // Pré-carregar produtos e clientes para os selects
        await this.productController.loadProducts();
        await this.customerController.loadCustomers();
    }

    async handleProductSubmit(formData) {
        const productData = {
            name: formData.get('nome'),
            quantity: parseInt(formData.get('quantidade')),
            price: parseFloat(formData.get('preco'))
        };

        await this.productController.createProduct(productData);

        // Atualizar dashboard se estiver ativo
        if (this.currentTab === 'dashboard') {
            await this.dashboardController.refreshDashboard();
        }
    }

    async handleCustomerSubmit(formData) {
        const customerData = {
            name: formData.get('nome'),
            email: formData.get('email') || null,
            phone: formData.get('telefone') || null
        };

        await this.customerController.createCustomer(customerData);

        // Atualizar dashboard se estiver ativo
        if (this.currentTab === 'dashboard') {
            await this.dashboardController.refreshDashboard();
        }
    }

    async handleSaleSubmit(formData) {
        const saleData = {
            customerId: formData.get('cliente'),
            productId: formData.get('produto'),
            quantity: parseInt(formData.get('quantidade')),
            totalValue: parseFloat(formData.get('valor_total')),
            saleDate: new Date()
        };

        await this.saleController.createSale(saleData);

        // Recarregar produtos (estoque atualizado)
        await this.productController.loadProducts();

        // Atualizar dashboard se estiver ativo
        if (this.currentTab === 'dashboard') {
            await this.dashboardController.refreshDashboard();
        }
    }

    // Métodos públicos para compatibilidade com HTML existente
    async refreshDashboard() {
        await this.dashboardController.refreshDashboard();
    }

    async filterByDate(date) {
        await this.dashboardController.setSelectedDate(date);
    }

    getController(name) {
        const controllers = {
            'product': this.productController,
            'customer': this.customerController,
            'sale': this.saleController,
            'payment': this.paymentController,
            'dashboard': this.dashboardController
        };
        return controllers[name];
    }
}
