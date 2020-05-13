import React from "react";
import './ResultsWrapper.css'
import currencies from './../resources/currencies-iso-4217';

// const usdNumCode = 840;
// const eurNumCode = 978;
const uahNumCode = 980;

export default class ResultsWrapper extends React.Component {
    static defaultProps = {
        savedState: {},
    };

    state = {
        rates: [],
    };

    componentDidMount() {
        fetch("https://api.monobank.ua/bank/currency",
            {headers: {'User-agent': 'test' + Date.now()}})
            .then(res => res.json())
            .catch(e => {
                console.error(e);
            })
            .then(rates => {
                if (!rates.errorDescription && rates.length) {
                    this.setState({
                        rates: rates,
                    })
                }
            })
    }

    render() {
        if (!this.state.rates || !this.state.rates.length) {
            return null;
        }
        return <div className={"results-wrapper"}>
            <div className={"results-title"}>Then short statistics would be:</div>
            <div className={"results-container"}>{
                this.getAnalyzers().map((analyzer, i) =>
                    analyzer.buildInnerResult(i, this.props.savedState)
                )
            }</div>
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
            All in {resultCurrencyCode} :
            {
                assetGroups.map((group, i) => (
                    <div key={i} className={"total-amount-in-currencies--group-of-assets"}>
                        <div className={"total-amount-in-currencies--group-name"}>{group.type}</div>
                        {
                            group.assets.map((asset, i) => {
                                const amount = (group.type === "crypto")
                                    ? this.transformAssetToCryptoCurrency(asset, resultCurrencyCode)
                                    : this.transformAssetToCurrency(asset, resultCurrencyCode);

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
                <div className={"total-amount-in-currencies--total-in-currency"}>
                    Total:
                    <p>{totalAmount} {resultCurrencyCode}</p>
                </div>
            </div>
        </div>
    }

    transformAssetToCurrency({amount, currency}, outputCurrency) {
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

    transformAssetToCryptoCurrency(asset, outputCurrency) {
        return asset.amount;
    }
}
