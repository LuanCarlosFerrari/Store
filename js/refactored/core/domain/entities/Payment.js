/**
 * Payment Entity - Representa a entidade Pagamento no domínio
 */
export class Payment {
    static PAYMENT_METHODS = {
        CASH: 'dinheiro',
        PIX: 'pix',
        DEBIT_CARD: 'cartao_debito',
        CREDIT_CARD: 'cartao_credito',
        TRANSFER: 'transferencia',
        BOLETO: 'boleto'
    };

    static PAYMENT_STATUS = {
        PENDING: 'pendente',
        PAID: 'pago',
        PARTIAL: 'parcial',
        OVERDUE: 'vencido'
    };

    constructor({
        id = null,
        saleId,
        totalValue,
        paidValue = 0,
        paymentMethod,
        dueDate,
        paymentDate = null,
        userId = null
    }) {
        this.validateInputs(saleId, totalValue, paymentMethod, dueDate);

        this.id = id;
        this.saleId = saleId;
        this.totalValue = totalValue;
        this.paidValue = paidValue;
        this.paymentMethod = paymentMethod;
        this.dueDate = dueDate;
        this.paymentDate = paymentDate;
        this.userId = userId;
    }

    validateInputs(saleId, totalValue, paymentMethod, dueDate) {
        if (!saleId) {
            throw new Error('ID da venda é obrigatório');
        }

        if (totalValue <= 0) {
            throw new Error('Valor total deve ser maior que zero');
        }

        if (!Object.values(Payment.PAYMENT_METHODS).includes(paymentMethod)) {
            throw new Error('Método de pagamento inválido');
        }

        if (!(dueDate instanceof Date)) {
            throw new Error('Data de vencimento deve ser uma data válida');
        }
    }

    getStatus() {
        if (this.paidValue === 0) {
            return this.isOverdue() ? Payment.PAYMENT_STATUS.OVERDUE : Payment.PAYMENT_STATUS.PENDING;
        }

        if (this.paidValue >= this.totalValue) {
            return Payment.PAYMENT_STATUS.PAID;
        }

        return Payment.PAYMENT_STATUS.PARTIAL;
    }

    getRemainingValue() {
        return Math.max(0, this.totalValue - this.paidValue);
    }

    isOverdue() {
        return new Date() > this.dueDate && this.getStatus() !== Payment.PAYMENT_STATUS.PAID;
    }

    makePayment(amount) {
        if (amount <= 0) {
            throw new Error('Valor do pagamento deve ser maior que zero');
        }

        const newPaidValue = this.paidValue + amount;
        if (newPaidValue > this.totalValue) {
            throw new Error('Valor do pagamento excede o valor total');
        }

        this.paidValue = newPaidValue;

        if (this.getStatus() === Payment.PAYMENT_STATUS.PAID) {
            this.paymentDate = new Date();
        }
    }

    toJSON() {
        return {
            id: this.id,
            saleId: this.saleId,
            totalValue: this.totalValue,
            paidValue: this.paidValue,
            paymentMethod: this.paymentMethod,
            dueDate: this.dueDate,
            paymentDate: this.paymentDate,
            status: this.getStatus(),
            userId: this.userId
        };
    }

    static fromJSON(data) {
        return new Payment({
            id: data.id,
            saleId: data.saleId || data.venda_id,
            totalValue: data.totalValue || data.valor_total,
            paidValue: data.paidValue || data.valor_pago || 0,
            paymentMethod: data.paymentMethod || data.metodo_pagamento,
            dueDate: new Date(data.dueDate || data.data_vencimento),
            paymentDate: data.paymentDate ? new Date(data.paymentDate) : (data.data_pagamento ? new Date(data.data_pagamento) : null),
            userId: data.userId || data.user_id
        });
    }
}
