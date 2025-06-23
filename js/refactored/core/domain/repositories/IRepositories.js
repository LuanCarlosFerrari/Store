/**
 * Repository Interfaces - Define contratos para acesso a dados
 */

export class IProductRepository {
    async create(product) {
        throw new Error('Method not implemented');
    }

    async findById(id) {
        throw new Error('Method not implemented');
    }

    async findAll(userId = null) {
        throw new Error('Method not implemented');
    }

    async update(product) {
        throw new Error('Method not implemented');
    }

    async delete(id) {
        throw new Error('Method not implemented');
    }
}

export class ICustomerRepository {
    async create(customer) {
        throw new Error('Method not implemented');
    }

    async findById(id) {
        throw new Error('Method not implemented');
    }

    async findAll(userId = null) {
        throw new Error('Method not implemented');
    }

    async update(customer) {
        throw new Error('Method not implemented');
    }

    async delete(id) {
        throw new Error('Method not implemented');
    }
}

export class ISaleRepository {
    async create(sale) {
        throw new Error('Method not implemented');
    }

    async findById(id) {
        throw new Error('Method not implemented');
    }

    async findAll(userId = null) {
        throw new Error('Method not implemented');
    }

    async findByDateRange(startDate, endDate, userId = null) {
        throw new Error('Method not implemented');
    }

    async update(sale) {
        throw new Error('Method not implemented');
    }

    async delete(id) {
        throw new Error('Method not implemented');
    }
}

export class IPaymentRepository {
    async create(payment) {
        throw new Error('Method not implemented');
    }

    async findById(id) {
        throw new Error('Method not implemented');
    }

    async findAll(userId = null) {
        throw new Error('Method not implemented');
    }

    async findBySaleId(saleId) {
        throw new Error('Method not implemented');
    }

    async findByStatus(status, userId = null) {
        throw new Error('Method not implemented');
    }

    async update(payment) {
        throw new Error('Method not implemented');
    }

    async delete(id) {
        throw new Error('Method not implemented');
    }
}
