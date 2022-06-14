export default class AssetDTO {

    type;
    amount;
    currency;
    name;
    description;
    id;
    isBinanceAsset;
    isMonobankAsset;

    constructor(type, amount, currency, name, description, id, isBinanceAsset, isMonobankAsset) {
        this.type = type;
        this.amount = amount;
        this.currency = currency;
        this.name = name;
        this.description = description || name;
        this.id = id || name;
        this.isBinanceAsset = isBinanceAsset;
        this.isMonobankAsset = isMonobankAsset;
    }

    static copy(origin) {
        return new AssetDTO(
            origin.type,
            origin.amount,
            origin.currency,
            origin.name,
            origin.description,
            origin.id,
            origin.isBinanceAsset,
            origin.isMonobankAsset,
        )
    }
}
