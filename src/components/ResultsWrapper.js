import React from "react";
import './ResultsWrapper.css'
import currencies from './../resources/currencies-iso-4217';

const usdNumCode = 840;
const eurNumCode = 978;
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
        </div>;
    }

    getAnalyzers() {
        return [{
            name: 'total amount in currencies',
            buildInnerResult: (key, data) => {
                const usdCurrencyCode = "USD";
                const eurCurrencyCode = "EUR";
                const uahCurrencyCode = "UAH";
                let totalAmountInUSD = 0.0;
                let totalAmountInEUR = 0.0;
                let totalAmountInUAH = 0.0;
                const assetGroups = [
                    data.cash,
                    data["non-cash"],
                    data.crypto,

                ];
                return [
                    <div key={key + usdCurrencyCode} className={"total-amount-in-one-currency"}>
                        All in {usdCurrencyCode} :
                        {
                            assetGroups.map((group, i) => (
                                <div key={i} className={"total-amount-in-currencies--group-of-assets"}>
                                    <div className={"total-amount-in-currencies--group-name"}>{group.type}</div>
                                    {
                                        group.assets.map((asset, i) => {
                                            const amountInUSD = (group.type === "crypto")
                                                ? this.transformCryptoCurrencyToUSD(asset)
                                                : this.transformCurrencyToUSD(asset);

                                            totalAmountInUSD += +amountInUSD;

                                            return <div
                                                key={i}
                                                className={"total-amount-in-currencies--asset-row"}
                                            >{asset.amount} {asset.currency} ≈ {amountInUSD} {usdCurrencyCode}</div>
                                        })
                                    }</div>
                            ))
                        }{
                        <div className={"total-amount-in-currencies--total-amounts"}>
                            <div className={"total-amount-in-currencies--total-in-currency"}>
                                Total:
                                <p>{totalAmountInUSD} {usdCurrencyCode}</p>
                            </div>
                        </div>
                    }
                    </div>,
                    <div key={key + eurCurrencyCode} className={"total-amount-in-one-currency"}>
                        All in {eurCurrencyCode} :
                        {
                            assetGroups.map((group, i) => (
                                <div key={i} className={"total-amount-in-currencies--group-of-assets"}>
                                    <div className={"total-amount-in-currencies--group-name"}>{group.type}</div>
                                    {
                                        group.assets.map((asset, i) => {
                                            const amountInEUR = (group.type === "crypto")
                                                ? this.transformCryptoCurrencyToEUR(asset)
                                                : this.transformCurrencyToEUR(asset);

                                            totalAmountInEUR += +amountInEUR;

                                            return <div
                                                key={i}
                                                className={"total-amount-in-currencies--asset-row"}
                                            >{asset.amount} {asset.currency} ≈ {amountInEUR} {eurCurrencyCode}</div>
                                        })
                                    }</div>
                            ))
                        }{
                        <div className={"total-amount-in-currencies--total-amounts"}>
                            <div className={"total-amount-in-currencies--total-in-currency"}>
                                Total:
                                <p>{totalAmountInEUR} {eurCurrencyCode}</p>
                            </div>
                        </div>
                    }
                    </div>,
                    <div key={key + uahCurrencyCode} className={"total-amount-in-one-currency"}>
                        All in {uahCurrencyCode} :
                        {
                            assetGroups.map((group, i) => (
                                <div key={i} className={"total-amount-in-currencies--group-of-assets"}>
                                    <div className={"total-amount-in-currencies--group-name"}>{group.type}</div>
                                    {
                                        group.assets.map((asset, i) => {
                                            const amountInUAH = (group.type === "crypto")
                                                ? this.transformCryptoCurrencyToUAH(asset)
                                                : this.transformCurrencyToUAH(asset);

                                            totalAmountInUAH += +amountInUAH;

                                            return <div
                                                key={i}
                                                className={"total-amount-in-currencies--asset-row"}
                                            >{asset.amount} {asset.currency} ≈ {amountInUAH} {uahCurrencyCode}</div>
                                        })
                                    }</div>
                            ))
                        }{
                        <div className={"total-amount-in-currencies--total-amounts"}>
                            <div className={"total-amount-in-currencies--total-in-currency"}>
                                Total:
                                <p>{totalAmountInUAH} {uahCurrencyCode}</p>
                            </div>
                        </div>
                    }
                    </div>
                ];
            }
        }]
    }

    transformCurrencyToUSD({amount, currency}) {
        let currencyNumCode = +(currencies[currency].numCode);

        if (currencyNumCode === usdNumCode) {
            return amount;
        }

        const rateUahUsd = this.state.rates.filter(r => (r.currencyCodeA === usdNumCode)
            && (r.currencyCodeB === uahNumCode))[0];

        if (!rateUahUsd) {
            return 0;
        }

        const rateCross = rateUahUsd.rateCross || ((rateUahUsd.rateBuy + rateUahUsd.rateSell) / 2);

        if (currencyNumCode === uahNumCode) {
            return amount / rateCross;
        }

        let rateToUah = this.state.rates.filter(r => (r.currencyCodeA === currencyNumCode)
            && (r.currencyCodeB === uahNumCode))[0];

        const rateCrossToUah = rateToUah.rateCross || ((rateToUah.rateBuy + rateToUah.rateSell) / 2);

        const amountInUah = amount * rateCrossToUah;

        return amountInUah / rateCross;
    }

    transformCryptoCurrencyToUSD({amount, currency}) {
        return amount;
    }

    transformCurrencyToEUR({amount, currency}) {
        let currencyNumCode = +(currencies[currency].numCode);

        if (currencyNumCode === eurNumCode) {
            return amount;
        }

        const rateUahEur = this.state.rates.filter(r => (r.currencyCodeA === eurNumCode)
            && (r.currencyCodeB === uahNumCode))[0];

        if (!rateUahEur) {
            return 0;
        }

        const rateCross = rateUahEur.rateCross || ((rateUahEur.rateBuy + rateUahEur.rateSell) / 2);

        if (currencyNumCode === uahNumCode) {
            return amount / rateCross;
        }

        let rateToUah = this.state.rates.filter(r => (r.currencyCodeA === currencyNumCode)
            && (r.currencyCodeB === uahNumCode))[0];

        const rateCrossToUah = rateToUah.rateCross || ((rateToUah.rateBuy + rateToUah.rateSell) / 2);

        const amountInUah = amount * rateCrossToUah;

        return amountInUah / rateCross;
    }

    transformCryptoCurrencyToEUR({amount, currency}) {
        return amount;
    }

    transformCurrencyToUAH({amount, currency}) {
        let currencyNumCode = +(currencies[currency].numCode);

        if (currencyNumCode === uahNumCode) {
            return amount;
        }

        let rateToUah = this.state.rates.filter(r => (r.currencyCodeA === currencyNumCode)
            && (r.currencyCodeB === uahNumCode))[0];

        const rateCross = rateToUah.rateCross || ((rateToUah.rateBuy + rateToUah.rateSell) / 2);

        return amount * rateCross;
    }

    transformCryptoCurrencyToUAH({amount, currency}) {
        return amount;
    }
}
