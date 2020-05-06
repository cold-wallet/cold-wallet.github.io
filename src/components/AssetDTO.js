export default class AssetDTO {

    type;
    amount;
    currency;


    constructor(type, amount, currency) {
        this.type = type;
        this.amount = amount;
        this.currency = currency;
    }
}
