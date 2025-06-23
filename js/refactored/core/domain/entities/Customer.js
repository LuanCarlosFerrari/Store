/**
 * Customer Entity - Representa a entidade Cliente no domínio
 */
export class Customer {
    constructor({ id = null, name, email = null, phone = null, userId = null }) {
        this.validateInputs(name);

        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.userId = userId;
    }

    validateInputs(name) {
        if (!name || name.trim().length === 0) {
            throw new Error('Nome do cliente é obrigatório');
        }
    }

    updateContactInfo(email, phone) {
        this.email = email;
        this.phone = phone;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            phone: this.phone,
            userId: this.userId
        };
    }

    static fromJSON(data) {
        return new Customer({
            id: data.id,
            name: data.name || data.nome,
            email: data.email,
            phone: data.phone || data.telefone,
            userId: data.userId || data.user_id
        });
    }
}
