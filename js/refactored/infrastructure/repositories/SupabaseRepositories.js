/**
 * Supabase Repository Implementations
 */
import { IProductRepository, ICustomerRepository, ISaleRepository, IPaymentRepository } from '../../core/domain/repositories/IRepositories.js';
import { Product } from '../../core/domain/entities/Product.js';
import { Customer } from '../../core/domain/entities/Customer.js';
import { Sale } from '../../core/domain/entities/Sale.js';
import { Payment } from '../../core/domain/entities/Payment.js';

export class SupabaseProductRepository extends IProductRepository {
    constructor(supabaseClient) {
        super();
        this.supabase = supabaseClient;
        this.tableName = 'produtos';
    }

    async create(product) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .insert({
                nome: product.name,
                quantidade: product.quantity,
                preco: product.price,
                user_id: product.userId
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar produto: ${error.message}`);
        return Product.fromJSON(data);
    }

    async findById(id) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Erro ao buscar produto: ${error.message}`);
        }

        return data ? Product.fromJSON(data) : null;
    }

    async findAll(userId = null) {
        let query = this.supabase.from(this.tableName).select('*');

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) throw new Error(`Erro ao listar produtos: ${error.message}`);
        return data.map(item => Product.fromJSON(item));
    }

    async update(product) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .update({
                nome: product.name,
                quantidade: product.quantity,
                preco: product.price
            })
            .eq('id', product.id)
            .select()
            .single();

        if (error) throw new Error(`Erro ao atualizar produto: ${error.message}`);
        return Product.fromJSON(data);
    }

    async delete(id) {
        const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Erro ao deletar produto: ${error.message}`);
        return true;
    }
}

export class SupabaseCustomerRepository extends ICustomerRepository {
    constructor(supabaseClient) {
        super();
        this.supabase = supabaseClient;
        this.tableName = 'clientes';
    }

    async create(customer) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .insert({
                nome: customer.name,
                email: customer.email,
                telefone: customer.phone,
                user_id: customer.userId
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar cliente: ${error.message}`);
        return Customer.fromJSON(data);
    }

    async findById(id) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Erro ao buscar cliente: ${error.message}`);
        }

        return data ? Customer.fromJSON(data) : null;
    }

    async findAll(userId = null) {
        let query = this.supabase.from(this.tableName).select('*');

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) throw new Error(`Erro ao listar clientes: ${error.message}`);
        return data.map(item => Customer.fromJSON(item));
    }

    async update(customer) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .update({
                nome: customer.name,
                email: customer.email,
                telefone: customer.phone
            })
            .eq('id', customer.id)
            .select()
            .single();

        if (error) throw new Error(`Erro ao atualizar cliente: ${error.message}`);
        return Customer.fromJSON(data);
    }

    async delete(id) {
        const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Erro ao deletar cliente: ${error.message}`);
        return true;
    }
}

export class SupabaseSaleRepository extends ISaleRepository {
    constructor(supabaseClient) {
        super();
        this.supabase = supabaseClient;
        this.tableName = 'vendas';
    }

    async create(sale) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .insert({
                cliente_id: sale.customerId,
                produto_id: sale.productId,
                quantidade: sale.quantity,
                valor_total: sale.totalValue,
                data_venda: sale.saleDate.toISOString(),
                user_id: sale.userId
            })
            .select(`
                *,
                clientes:cliente_id(nome),
                produtos:produto_id(nome)
            `)
            .single();

        if (error) throw new Error(`Erro ao criar venda: ${error.message}`);
        return Sale.fromJSON(data);
    }

    async findById(id) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select(`
                *,
                clientes:cliente_id(nome),
                produtos:produto_id(nome)
            `)
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Erro ao buscar venda: ${error.message}`);
        }

        return data ? Sale.fromJSON(data) : null;
    } async findAll(userId = null) {
        let query = this.supabase
            .from(this.tableName)
            .select(`
                *,
                clientes:cliente_id(nome),
                produtos:produto_id(nome),
                pagamentos(status)
            `);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query.order('data_venda', { ascending: false });

        if (error) throw new Error(`Erro ao listar vendas: ${error.message}`);
        return data.map(item => {
            const sale = Sale.fromJSON(item);
            // Adicionar informações dos relacionamentos
            if (item.clientes) {
                sale.customerName = item.clientes.nome;
            }
            if (item.produtos) {
                sale.productName = item.produtos.nome;
            }
            // Determinar status do pagamento
            if (item.pagamentos && item.pagamentos.length > 0) {
                sale.paymentStatus = item.pagamentos[0].status;
            } else {
                sale.paymentStatus = 'pendente';
            }
            // Adicionar valor unitário
            sale.unitValue = item.valor_unitario || (sale.totalValue / sale.quantity);
            return sale;
        });
    } async findByDateRange(startDate, endDate, userId = null) {
        let query = this.supabase
            .from(this.tableName)
            .select(`
                *,
                clientes:cliente_id(nome),
                produtos:produto_id(nome),
                pagamentos(status, metodo_pagamento)
            `)
            .gte('data_venda', startDate.toISOString())
            .lte('data_venda', endDate.toISOString());

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query.order('data_venda', { ascending: false });

        if (error) throw new Error(`Erro ao buscar vendas por data: ${error.message}`);
        return data.map(item => {
            const sale = Sale.fromJSON(item);
            // Adicionar informações dos relacionamentos
            if (item.clientes) {
                sale.customerName = item.clientes.nome;
            }
            if (item.produtos) {
                sale.productName = item.produtos.nome;
            }
            // Determinar status e método do pagamento
            if (item.pagamentos && item.pagamentos.length > 0) {
                sale.paymentStatus = item.pagamentos[0].status;
                sale.paymentMethod = item.pagamentos[0].metodo_pagamento;
            } else {
                sale.paymentStatus = 'pendente';
                sale.paymentMethod = 'dinheiro'; // padrão
            }
            // Adicionar valor unitário
            sale.unitValue = item.valor_unitario || (sale.totalValue / sale.quantity);
            return sale;
        });
    }

    async update(sale) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .update({
                cliente_id: sale.customerId,
                produto_id: sale.productId,
                quantidade: sale.quantity,
                valor_total: sale.totalValue,
                data_venda: sale.saleDate.toISOString()
            })
            .eq('id', sale.id)
            .select(`
                *,
                clientes:cliente_id(nome),
                produtos:produto_id(nome)
            `)
            .single();

        if (error) throw new Error(`Erro ao atualizar venda: ${error.message}`);
        return Sale.fromJSON(data);
    }

    async delete(id) {
        const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Erro ao deletar venda: ${error.message}`);
        return true;
    }
}

export class SupabasePaymentRepository extends IPaymentRepository {
    constructor(supabaseClient) {
        super();
        this.supabase = supabaseClient;
        this.tableName = 'pagamentos';
    }

    async create(payment) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .insert({
                venda_id: payment.saleId,
                valor_total: payment.totalValue,
                valor_pago: payment.paidValue,
                metodo_pagamento: payment.paymentMethod,
                data_vencimento: payment.dueDate.toISOString(),
                data_pagamento: payment.paymentDate?.toISOString() || null,
                status: payment.getStatus(),
                user_id: payment.userId
            })
            .select(`
                *,
                vendas:venda_id(data_venda)
            `)
            .single();

        if (error) throw new Error(`Erro ao criar pagamento: ${error.message}`);
        return Payment.fromJSON(data);
    }

    async findById(id) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select(`
                *,
                vendas:venda_id(data_venda)
            `)
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Erro ao buscar pagamento: ${error.message}`);
        }

        return data ? Payment.fromJSON(data) : null;
    } async findAll(userId = null) {
        let query = this.supabase
            .from(this.tableName)
            .select(`
                *,
                vendas:venda_id(
                    id,
                    data_venda,
                    clientes:cliente_id(nome),
                    produtos:produto_id(nome)
                )
            `);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query.order('data_vencimento', { ascending: true });

        if (error) throw new Error(`Erro ao listar pagamentos: ${error.message}`);
        return data.map(item => {
            const payment = Payment.fromJSON(item);
            // Adicionar informações da venda relacionada
            if (item.vendas) {
                payment.saleId = item.vendas.id;
                payment.customerName = item.vendas.clientes?.nome || 'Cliente não encontrado';
                payment.productName = item.vendas.produtos?.nome || 'Produto não encontrado';
            }
            return payment;
        });
    }

    async findBySaleId(saleId) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select(`
                *,
                vendas:venda_id(data_venda)
            `)
            .eq('venda_id', saleId);

        if (error) throw new Error(`Erro ao buscar pagamentos da venda: ${error.message}`);
        return data.map(item => Payment.fromJSON(item));
    }

    async findByStatus(status, userId = null) {
        let query = this.supabase
            .from(this.tableName)
            .select(`
                *,
                vendas:venda_id(data_venda)
            `)
            .eq('status', status);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query.order('data_vencimento', { ascending: true });

        if (error) throw new Error(`Erro ao buscar pagamentos por status: ${error.message}`);
        return data.map(item => Payment.fromJSON(item));
    }

    async update(payment) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .update({
                valor_pago: payment.paidValue,
                data_pagamento: payment.paymentDate?.toISOString() || null,
                status: payment.getStatus()
            })
            .eq('id', payment.id)
            .select(`
                *,
                vendas:venda_id(data_venda)
            `)
            .single();

        if (error) throw new Error(`Erro ao atualizar pagamento: ${error.message}`);
        return Payment.fromJSON(data);
    }

    async delete(id) {
        const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Erro ao deletar pagamento: ${error.message}`);
        return true;
    }
}
