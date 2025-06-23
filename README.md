# Sistema de Controle de Estoque e Vendas - Refatorado

## 📋 Descrição
Sistema de gerenciamento de estoque e vendas refatorado seguindo os princípios SOLID e Clean Architecture.

## 🎯 Arquitetura
- **Clean Architecture**: Separação clara entre camadas (Domain, Application, Infrastructure, Presentation)
- **SOLID Principles**: Código modular, testável e fácil de manter
- **Padrão Repository**: Abstração da camada de dados
- **Injeção de Dependência**: Baixo acoplamento entre componentes

## 📁 Estrutura do Projeto
```
store/
├── index.html                          # Interface principal do sistema
├── login.html                          # Página de login
├── js/
│   ├── config.js                       # Configurações do Supabase
│   ├── store-refactored-bundled.js     # Sistema refatorado (bundled)
│   ├── refactored/                     # Código fonte modular
│   │   ├── core/
│   │   │   ├── domain/
│   │   │   │   ├── entities/           # Entidades de domínio
│   │   │   │   └── repositories/       # Interfaces dos repositórios
│   │   │   └── application/
│   │   │       └── usecases/           # Casos de uso
│   │   ├── infrastructure/
│   │   │   ├── repositories/           # Implementações Supabase
│   │   │   └── services/               # Serviços de infraestrutura
│   │   ├── presentation/
│   │   │   ├── controllers/            # Controladores
│   │   │   └── views/                  # Camada de apresentação
│   │   ├── Application.js              # Ponto de entrada da aplicação
│   │   ├── main.js                     # Inicialização do sistema
│   │   └── *.md                        # Documentação técnica
│   └── backup/                         # Backup dos arquivos legados
└── sql/                                # Scripts do banco de dados
```

## 🚀 Como Executar
1. Abra o arquivo `index.html` em um servidor web
2. Configure as credenciais do Supabase em `js/config.js`
3. O sistema carregará automaticamente com a nova arquitetura

## ⚡ Funcionalidades
- **Dashboard**: Métricas e relatórios em tempo real
- **Produtos**: CRUD completo com validações
- **Clientes**: Gerenciamento de clientes
- **Vendas**: Registro e histórico de vendas
- **Pagamentos**: Controle de pagamentos e status

## 🛠️ Tecnologias
- **Frontend**: HTML5, CSS3 (Tailwind), JavaScript ES6+
- **Backend**: Supabase (PostgreSQL)
- **Arquitetura**: Clean Architecture, SOLID Principles

## 📈 Melhorias Implementadas
- ✅ Código modular e testável
- ✅ Separação de responsabilidades
- ✅ Interface responsiva
- ✅ Validações robustas
- ✅ Tratamento de erros
- ✅ Loading states
- ✅ Mensagens de feedback

## 🔄 Migração Completa
O sistema foi completamente migrado da arquitetura monolítica para Clean Architecture, mantendo todas as funcionalidades originais e adicionando melhorias significativas na qualidade do código.

---
**Status**: ✅ Migração concluída - Sistema em produção
