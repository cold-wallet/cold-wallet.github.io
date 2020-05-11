import React from "react";
import './ResultsWrapper.css'
import currencies from './../resources/currencies-iso-4217';

const usdNumCode = 840;
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
        if (!this.state.rates) {
            return null;
        }
        return <div className={"results-wrapper"}>
            <div className={"results-title"}>Then short statistics would be:</div>
            <div className={"results-container"}>{
                this.getAnalyzers().map((analyzer, i) =>
                    analyzer.buildInnerResult.apply(this, [i, this.props.savedState])
                )
            }</div>
        </div>;
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

    getAnalyzers() {
        let totalAmountInUSD = 0.0;

        return [{
            name: 'total amount in currencies',
            buildInnerResult(key, data) {
                console.log("Building inner result for state", data);
                return <div key={key} className={"total-amount-in-currencies"}>{
                    [
                        data.cash,
                        data["non-cash"],
                        data.crypto,

                    ].map((group, i) => <div key={i} className={"total-amount-in-currencies--group-of-assets"}>
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
                                >{asset.amount} {asset.currency} ≈ {amountInUSD} $</div>
                            })
                        }</div>)
                }{
                    <div className={"total-amount-in-currencies--total-amounts"}>
                        <div className={"total-amount-in-currencies--total-in-currency"}>Total:
                            <p>{totalAmountInUSD} $</p>
                        </div>
                    </div>
                }
                </div>;
            }
        }]
    }
}
