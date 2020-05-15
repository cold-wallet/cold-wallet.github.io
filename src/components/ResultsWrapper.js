import React from "react";
import './ResultsWrapper.css'
import currencies from './../resources/currencies-iso-4217';
import NumberFormat from 'react-number-format'
import {PieChart} from "react-minimal-pie-chart";

const uahNumCode = 980;
const BTC = "BTC";
const USD = "USD";
const EUR = "EUR";

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
            return null;
        }
        return <div className={"results-wrapper"}>
            <div className="results-one-more-wrap-layer">
                <div className={"results-title"}>Then short statistics would be:</div>
                <div className={"results-container"}>{
                    this.getAnalyzers().map((analyzer, i) =>
                        analyzer.buildInnerResult(i, this.state.assets)
                    )
                }</div>
            </div>
        </div>
    }

    getAnalyzers() {
        return [{
            name: 'total amount in currencies',
            buildInnerResult: (key, data) => {
                const assetGroups = [
                    data.cash,
                    data["non-cash"],
                    data.crypto,
                ];
                const currenciesBuffer = data.cash.assets.concat(data["non-cash"].assets)
                    .concat(data.crypto.assets)
                    .reduce((result, asset) => {
                        result[asset.currency] = asset.type;
                        return result;
                    }, {});

                return <div key={key} className={"total-amount-in-one-currency--container"}>{
                    Object.entries(currenciesBuffer).map(
                        currencyCodeToType => this.buildCurrencyTotalResult(assetGroups, currencyCodeToType)
                    )
                }</div>
            }
        }, {
            name: 'balance',
            buildInnerResult: (key, data) => {
                console.log("building balance");

                let assets = data.cash.assets
                    .concat(data["non-cash"].assets)
                    .concat(data.crypto.assets)
                    .map(asset => {
                        asset.usdAmount = (asset.type === "crypto")
                            ? this.cryptoCurrencyAssetToCurrency(asset, USD)
                            : this.currencyAssetToCurrency(asset, USD);

                        return asset
                    })
                    .sort((a, b) => b.usdAmount - a.usdAmount)
                    .map(asset => {
                        asset.usdAmount = +numberFormat(asset.usdAmount, (asset.type === "crypto") ? 8 : 2);
                        return asset
                    });

                const totalUsdAmount = assets.map(asset => asset.usdAmount)
                    .reduce((a, b) => a + b, 0);

                const colors = [
                    "#081c15",
                    "#1b4332",
                    "#2d6a4f",
                    "#40916c",
                    "#52b788",
                    "#74c69d",
                    "#95d5b2",
                    "#a6ddbd",
                    "#b7e4c7",
                    "#d8f3dc",
                ];

                let count = 0;

                const chartsData = assets.map(asset => {
                    ++count;

                    if (count >= colors.length) {
                        count = 0
                    }

                    return {
                        value: asset.usdAmount,
                        color: `${colors[count]}`,
                        title: `${asset.amount} ${asset.currency}`,
                    }
                });

                return <div key={key} className={"balance-results-container"}>
                    <div className={"balance-circle-container"}>
                        <PieChart
                            labelStyle={{
                                lineHeight: "20px",
                                fontSize: "7px",
                            }}
                            totalValue={totalUsdAmount}
                            label={({dataEntry}) => {
                                return `${Math.round(dataEntry.percentage)}%`
                            }}
                            data={chartsData}
                        />
                    </div>
                </div>
            }
        }]
    }

    buildCurrencyTotalResult(assetGroups, currencyCodeToType) {
        const resultCurrencyCode = currencyCodeToType[0];
        const resultCurrencyType = currencyCodeToType[1];
        let totalAmount = 0;


        return <div key={resultCurrencyCode} className={"total-amount-in-one-currency"}>
            <div className={"total-amount-in-currencies--title"}>All in {resultCurrencyCode} :</div>
            {
                assetGroups.map((group, i) => (
                    <div key={i} className={"total-amount-in-currencies--group-of-assets"}>
                        <div className={"total-amount-in-currencies--group-name"}>{group.type}</div>
                        {
                            group.assets.map((asset, i) => {
                                let amount;

                                if (asset.currency === resultCurrencyCode) {
                                    amount = asset.amount

                                } else if (resultCurrencyType === "crypto") {
                                    amount = (group.type === "crypto")
                                        ? this.cryptoCurrencyAssetToCryptoCurrency(asset, resultCurrencyCode)
                                        : this.currencyAssetToCryptoCurrency(asset, resultCurrencyCode);
                                } else {
                                    amount = (group.type === "crypto")
                                        ? this.cryptoCurrencyAssetToCurrency(asset, resultCurrencyCode)
                                        : this.currencyAssetToCurrency(asset, resultCurrencyCode);
                                }
                                totalAmount += +amount;

                                return <div
                                    key={i}
                                    className={"total-amount-in-currencies--asset-row"}
                                >
                                    <div className={"total-amount-in-currencies--asset-row-part"}>
                                        <NumberFormat value={asset.amount}
                                                      displayType={'text'}
                                                      decimalScale={(asset.type === "crypto") ? 8 : 2}
                                                      suffix={" " + asset.currency}
                                                      thousandSeparator={true}/>
                                    </div>
                                    <div>{asset.currency === resultCurrencyCode ? '=' : '≈'}</div>
                                    <div className={"total-amount-in-currencies--asset-row-part"}>
                                        <NumberFormat value={amount}
                                                      displayType={'text'}
                                                      decimalScale={(resultCurrencyType === "crypto") ? 8 : 2}
                                                      suffix={" " + resultCurrencyCode}
                                                      thousandSeparator={true}/>
                                    </div>
                                </div>
                            })
                        }</div>
                ))
            }
            <div className={"total-amount-in-currencies--total-amounts"}>
                <div>Total:</div>
                <div><NumberFormat value={totalAmount}
                                   displayType={'text'}
                                   decimalScale={(resultCurrencyType === "crypto") ? 8 : 2}
                                   suffix={" " + resultCurrencyCode}
                                   thousandSeparator={true}/></div>
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

        const rateCross = this.findRate(outputCurrencyNumCode, uahNumCode);
        return amountInUah / rateCross;
    }

    findRate(left, right) {
        const rate = this.state.rates.filter(r => (r.currencyCodeA === left)
            && (r.currencyCodeB === right))[0];

        return rate.rateCross || ((rate.rateBuy + rate.rateSell) / 2);
    }

    transformCurrencyToUAH(amount, currencyNumCode) {
        if (currencyNumCode === uahNumCode) {
            return amount;
        }

        const rateCross = this.findRate(currencyNumCode, uahNumCode);
        return amount * rateCross;
    }

    getCryptoPrice(left, right) {
        const ticker = this.state.cryptoRates.filter(r => r.symbol === `${left}${right}`)[0] || {};
        const price = +(ticker.price);

        if (price && !isNaN(price)) {
            return price;
        }
    }

    cryptoCurrencyAssetToCurrency(asset, outputCurrency) {
        const btcAmount = (asset.currency === BTC)
            ? asset.amount
            : this.transformCrypto(asset.amount, asset.currency, BTC);

        const btcEurPrice = this.getCryptoPrice(BTC, EUR);
        const amountInEur = btcAmount * btcEurPrice;

        if (asset.currency === BTC && outputCurrency === EUR) {
            return amountInEur;
        }

        return this.currencyAssetToCurrency({amount: amountInEur, currency: EUR}, outputCurrency);
    }

    currencyAssetToCryptoCurrency(asset, outputCurrency) {
        if (asset.currency === outputCurrency) {
            return asset.amount
        }

        const eurAmount = (asset.currency === EUR)
            ? asset.amount
            : this.currencyAssetToCurrency(asset, EUR);

        const btcEurPrice = this.getCryptoPrice(BTC, EUR);
        const btcAmount = eurAmount / btcEurPrice;

        if (outputCurrency === BTC) {
            return btcAmount
        }

        let amount = this.transformCrypto(btcAmount, BTC, outputCurrency);
        if (amount) {
            return amount;
        }

        console.log("not found adequate transformation", asset, outputCurrency);
        return 0;
    }

    cryptoCurrencyAssetToCryptoCurrency(asset, resultCurrencyCode) {
        if (asset.currency === resultCurrencyCode) {
            return asset.amount
        }
        let amount = this.transformCrypto(asset.amount, asset.currency, resultCurrencyCode);
        if (amount) {
            return amount
        }

        let btcAmount = this.transformCrypto(asset.amount, asset.currency, BTC);
        return this.transformCrypto(btcAmount, BTC, resultCurrencyCode);
    }

    transformCrypto(amountFrom, currencyFrom, currencyTo) {
        let price = this.getCryptoPrice(currencyFrom, currencyTo);
        if (price) {
            return amountFrom * price;
        }
        price = this.getCryptoPrice(currencyTo, currencyFrom);
        if (price) {
            return amountFrom / price;
        }
    }
}

function numberFormat(fixMe, afterDecimalPoint) {
    fixMe = "" + fixMe;
    if (fixMe.indexOf(".") >= 0) {
        const [left, right] = fixMe.split(/[.]/gi);
        if (right.length > afterDecimalPoint) {
            fixMe = left + "." + right.slice(0, afterDecimalPoint)
        }
    }
    return +fixMe
}
