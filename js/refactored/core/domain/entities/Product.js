/**
 * Product Entity - Representa a entidade Produto no domínio
 */
export class Product {
    constructor({ id = null, name, quantity, price, userId = null }) {
        this.validateInputs(name, quantity, price);

        this.id = id;
        this.name = name;
        this.quantity = quantity;
        this.price = price;
        this.userId = userId;
    }

    validateInputs(name, quantity, price) {
        if (!name || name.trim().length === 0) {
            throw new Error('Nome do produto é obrigatório');
        }

        if (quantity < 0) {
            throw new Error('Quantidade não pode ser negativa');
        }

        if (price <= 0) {
            throw new Error('Preço deve ser maior que zero');
        }
    }

    updateQuantity(newQuantity) {
        if (newQuantity < 0) {
            throw new Error('Quantidade não pode ser negativa');
        }
        this.quantity = newQuantity;
    }

    updatePrice(newPrice) {
        if (newPrice <= 0) {
            throw new Error('Preço deve ser maior que zero');
        }
        this.price = newPrice;
    }

    getTotalValue() {
        return this.quantity * this.price;
    }

    isInStock() {
        return this.quantity > 0;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            quantity: this.quantity,
            price: this.price,
            userId: this.userId
        };
    }

    static fromJSON(data) {
        return new Product({
            id: data.id,
            name: data.name || data.nome,
            quantity: data.quantity || data.quantidade,
            price: data.price || data.preco,
            userId: data.userId || data.user_id
        });
    }
}
