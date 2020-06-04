export default class AssetDTO {

    type;
    amount;
    currency;
    name;
    description;


    constructor(type, amount, currency, name, description) {
        this.type = type;
        this.amount = amount;
        this.currency = currency;
        this.name = name;
        this.description = description;
    }

    static copy(origin) {
        return new AssetDTO(
            origin.type,
            origin.amount,
            origin.currency,
            origin.name,
            origin.description,
        )
    }
}
