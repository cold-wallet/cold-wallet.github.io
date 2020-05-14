import React from "react";
import './ResultsWrapper.css'
import currencies from './../resources/currencies-iso-4217';

const uahNumCode = 980;

export default class ResultsWrapper extends React.Component {
    static defaultProps = {
        savedState: {},
        initialRates: [],
        latestAssetsConsumer: (latestAssetsConsumer) => false,
        latestRatesConsumer: (latestRatesConsumer) => false,
        latestCryptoRatesConsumer: (latestCryptoRatesConsumer) => false,
    };

    constructor(props, context) {
        super(props, context);
        this.state = {
            assets: props.savedState || [],
            rates: props.initialRates || [],
            cryptoRates: props.initialCryptoRates || [],
        };
        this.props.latestAssetsConsumer(assets => this.setState({assets}));
        this.props.latestRatesConsumer(rates => this.setState({rates}));
        this.props.latestCryptoRatesConsumer(cryptoRates => this.setState({cryptoRates}));
    }

    render() {
        if (!this.state.assets
            || !this.state.rates
            || !this.state.rates.length
            || !this.state.cryptoRates
            || !this.state.cryptoRates.length
        ) {
            console.log("state is not ready", this.state);
            return null;
        }
        return <div className={"results-wrapper"}>
            <div className="results-one-more-wrap-layer">
                <div className={"results-title"}>Then short statistics would be:</div>
                <div className={"results-container"}>
                    <div className={"total-amount-in-one-currency--container"}>{
                        this.getAnalyzers().map((analyzer, i) =>
                            analyzer.buildInnerResult(i, this.state.assets)
                        )
                    }</div>
                </div>
            </div>
        </div>
    }

    getAnalyzers() {
        return [{
            name: 'total amount in currencies',
            buildInnerResult: (key, data) => {
                const usdCurrencyCode = "USD";
                const eurCurrencyCode = "EUR";
                const uahCurrencyCode = "UAH";
                const assetGroups = [
                    data.cash,
                    data["non-cash"],
                    data.crypto,
                ];
                return [
                    this.buildCurrencyTotalResult(assetGroups, usdCurrencyCode),
                    this.buildCurrencyTotalResult(assetGroups, eurCurrencyCode),
                    this.buildCurrencyTotalResult(assetGroups, uahCurrencyCode),
                ];
            }
        }]
    }

    buildCurrencyTotalResult(assetGroups, resultCurrencyCode) {
        let totalAmount = 0;
        return <div key={resultCurrencyCode} className={"total-amount-in-one-currency"}>
            <div className={"total-amount-in-currencies--title"}>All in {resultCurrencyCode} :</div>
            {
                assetGroups.map((group, i) => (
                    <div key={i} className={"total-amount-in-currencies--group-of-assets"}>
                        <div className={"total-amount-in-currencies--group-name"}>{group.type}</div>
                        {
                            group.assets.map((asset, i) => {
                                const amount = (group.type === "crypto")
                                    ? this.cryptoCurrencyAssetToCurrency(asset, resultCurrencyCode)
                                    : this.currencyAssetToCurrency(asset, resultCurrencyCode);

                                totalAmount += +amount;

                                return <div
                                    key={i}
                                    className={"total-amount-in-currencies--asset-row"}
                                >{asset.amount} {asset.currency} ≈ {amount} {resultCurrencyCode}</div>
                            })
                        }</div>
                ))
            }
            <div className={"total-amount-in-currencies--total-amounts"}>
                Total:
                <p>{totalAmount} {resultCurrencyCode}</p>
            </div>
        </div>
    }

    currencyAssetToCurrency({amount, currency}, outputCurrency) {
        let outputCurrencyNumCode = +(currencies[outputCurrency].numCode);
        let currencyNumCode = +(currencies[currency].numCode);

        if (currencyNumCode === outputCurrencyNumCode) {
            return amount
        }

        const amountInUah = this.transformCurrencyToUAH(amount, currencyNumCode);

        if (outputCurrencyNumCode === uahNumCode) {
            return amountInUah
        }

        const rateUahToCurrency = this.state.rates.filter(r => (r.currencyCodeA === outputCurrencyNumCode)
            && (r.currencyCodeB === uahNumCode))[0];

        if (!rateUahToCurrency) {
            return 0;
        }

        const rateCross = rateUahToCurrency.rateCross || ((rateUahToCurrency.rateBuy + rateUahToCurrency.rateSell) / 2);

        return amountInUah / rateCross;
    }

    transformCurrencyToUAH(amount, currencyNumCode) {
        if (currencyNumCode === uahNumCode) {
            return amount;
        }

        let rateToUah = this.state.rates.filter(r => (r.currencyCodeA === currencyNumCode)
            && (r.currencyCodeB === uahNumCode))[0];

        const rateCross = rateToUah.rateCross || ((rateToUah.rateBuy + rateToUah.rateSell) / 2);

        return amount * rateCross;
    }

    cryptoCurrencyAssetToCurrency(asset, outputCurrency) {
        let btcAmount;

        if (asset.currency !== "BTC") {
            const currencyToBtcTicker = this.state.cryptoRates.filter(r => r.symbol === `${asset.currency}BTC`)[0] || {};
            const currencyToBtcPrice = +(currencyToBtcTicker.price);

            if (currencyToBtcPrice && !isNaN(currencyToBtcPrice)) {
                btcAmount = asset.amount * currencyToBtcPrice;

            } else {
                const btcToCurrencyTicker = this.state.cryptoRates.filter(r => r.symbol === `BTC${asset.currency}`)[0] || {};
                const btcToCurrencyPrice = +(btcToCurrencyTicker.price);

                if (!btcToCurrencyPrice || isNaN(btcToCurrencyPrice)) {
                    console.error(`no btc price for ${asset.currency}! returning zero`, this.state.cryptoRates);
                    return 0
                }

                btcAmount = asset.amount / btcToCurrencyPrice;
            }
        } else {
            btcAmount = asset.amount
        }

        const btcEurSymbol = "BTCEUR";
        const btcEurTicker = this.state.cryptoRates.filter(r => r.symbol === btcEurSymbol)[0];
        const btcEurPrice = +(btcEurTicker.price);

        if (!btcEurPrice || isNaN(btcEurPrice)) {
            console.error("no price for btc-eur!", this.state.cryptoRates);
            return 0
        }

        const amountInEur = btcAmount * btcEurPrice;

        if (`${asset.currency}${outputCurrency}` === btcEurSymbol) {
            return amountInEur;
        }

        return this.currencyAssetToCurrency({amount: amountInEur, currency: "EUR"}, outputCurrency);
    }
}
