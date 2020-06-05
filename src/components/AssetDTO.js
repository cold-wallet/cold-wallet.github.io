export default class AssetDTO {

    type;
    amount;
    currency;
    name;
    description;
    id;


    constructor(type, amount, currency, name, description, id) {
        this.type = type;
        this.amount = amount;
        this.currency = currency;
        this.name = name;
        this.description = description;
        this.id = id;
    }

    static copy(origin) {
        return new AssetDTO(
            origin.type,
            origin.amount,
            origin.currency,
            origin.name,
            origin.description,
            origin.id,
        )
    }
}
