/**
 * Sale Entity - Representa a entidade Venda no domínio
 */
export class Sale {
    constructor({
        id = null,
        customerId,
        productId,
        quantity,
        totalValue,
        saleDate = new Date(),
        userId = null
    }) {
        this.validateInputs(customerId, productId, quantity, totalValue);

        this.id = id;
        this.customerId = customerId;
        this.productId = productId;
        this.quantity = quantity;
        this.totalValue = totalValue;
        this.saleDate = saleDate;
        this.userId = userId;
    }

    validateInputs(customerId, productId, quantity, totalValue) {
        if (!customerId) {
            throw new Error('ID do cliente é obrigatório');
        }

        if (!productId) {
            throw new Error('ID do produto é obrigatório');
        }

        if (quantity <= 0) {
            throw new Error('Quantidade deve ser maior que zero');
        }

        if (totalValue <= 0) {
            throw new Error('Valor total deve ser maior que zero');
        }
    }

    getFormattedDate() {
        return this.saleDate.toISOString().split('T')[0];
    }

    toJSON() {
        return {
            id: this.id,
            customerId: this.customerId,
            productId: this.productId,
            quantity: this.quantity,
            totalValue: this.totalValue,
            saleDate: this.saleDate,
            userId: this.userId
        };
    }

    static fromJSON(data) {
        return new Sale({
            id: data.id,
            customerId: data.customerId || data.cliente_id,
            productId: data.productId || data.produto_id,
            quantity: data.quantity || data.quantidade,
            totalValue: data.totalValue || data.valor_total,
            saleDate: data.saleDate ? new Date(data.saleDate) : new Date(data.data_venda),
            userId: data.userId || data.user_id
        });
    }
}
