import React from "react";
import './ResultsWrapper.css'
import currencies from './../resources/currencies-iso-4217';
import NumberFormat from 'react-number-format'
import {VictoryLabel, VictoryPie} from "victory"
import noExponents from "../extensions/noExponents";

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
            chartType: props.chartType || "total",
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

                assets = assets
                    .map(asset => {
                        asset.percents = (100 * asset.usdAmount) / totalUsdAmount;
                        return asset
                    });

                function buildTitle(asset) {
                    let afterDecimalPoint;
                    if (asset.percents < 0.01) {
                        afterDecimalPoint = 8;
                    } else if (asset.percents < 2) {
                        afterDecimalPoint = 2
                    } else {
                        afterDecimalPoint = 0
                    }
                    const amount = noExponents(addCommas(asset.amount));
                    const percents = numberFormat(asset.percents, afterDecimalPoint);
                    return `${amount} ${asset.currency} (${percents}%)`
                }

                let preparedAssets;

                if (this.state.chartType === "per-currency") {
                    preparedAssets = Object.entries(assets
                        .reduce((a, asset) => {
                            if (a[asset.currency]) {
                                a[asset.currency].amount += asset.amount;
                                a[asset.currency].usdAmount += asset.usdAmount;
                                a[asset.currency].percents += asset.percents;
                            } else {
                                a[asset.currency] = {...asset};
                            }
                            return a
                        }, {}))
                        .map(entries => entries[1]);

                } else {
                    preparedAssets = assets;
                }

                const tinyAmounts = preparedAssets.filter(asset => asset.percents < 1);
                if (tinyAmounts.length > 1) {
                    const otherAmounts = preparedAssets.filter(asset => asset.percents >= 1);
                    const tinyAssetsComposite = tinyAmounts.reduce((accumulator, asset) => {
                        accumulator.text += `\n${buildTitle(asset)}`;
                        accumulator.usdAmount += asset.usdAmount;
                        return accumulator
                    }, {
                        text: "",
                        usdAmount: 0,
                        percents: 0,
                    });

                    tinyAssetsComposite.percents = (100 * tinyAssetsComposite.usdAmount) / totalUsdAmount;
                    tinyAssetsComposite.text = `Other ${numberFormat(tinyAssetsComposite.percents, 2)}% :`
                        + tinyAssetsComposite.text;

                    otherAmounts.push(tinyAssetsComposite);
                    preparedAssets = otherAmounts;
                }

                const chartsData = preparedAssets.map(asset => {
                    return {
                        x: asset.text ? asset.text : buildTitle(asset),
                        y: asset.usdAmount,
                    }
                });

                if (!chartsData.length) {
                    return null
                }

                return <div key={key} className={"balance-results-container"}>
                    <div className={"balance-circle-container"}>
                        <div className={"balance-circle-chart"}>
                            <VictoryPie
                                labelComponent={<VictoryLabel
                                    text={datum => {
                                        let text = datum.datum.xName
                                            .replace(/(,0 )/gi, ',000 ')
                                            .replace(/(,0,)/gi, ',000,');

                                        if (~text.indexOf("\n")
                                            || ~text.split(" ")[0].toLowerCase().indexOf("e")
                                        ) {
                                            const rows = text.split("\n");
                                            return rows.map((row, i) => {
                                                if (!i && rows.length > 1) {
                                                    return row;
                                                }
                                                const words = row.split(" ");
                                                words[0] = noExponents(words[0]);
                                                words[2] = `(${
                                                    noExponents(words[2].replace(/[(%)]/gi, ""))
                                                }%)`;
                                                return words.join(" ")
                                            })
                                                .join("\n");
                                        }

                                        return text
                                    }}
                                    className={"pie-chart-label"}/>}
                                labelRadius={(e) => {
                                    const maxRadius = 120;
                                    const elementsCount = e.data.length;

                                    if (e.index === elementsCount - 1) {
                                        return maxRadius
                                    }

                                    const step = maxRadius / elementsCount;
                                    const skipCount = 2; // empiric value
                                    let skipIndex = e.index - skipCount;

                                    if (skipIndex <= 0) {
                                        skipIndex = 0;
                                    }

                                    return skipIndex * step + 25
                                }}
                                events={[
                                    {
                                        target: "data",
                                        eventHandlers: {
                                            onMouseOver: () => {
                                                return [{
                                                    target: "labels",
                                                    mutation: (props) => {
                                                        return {
                                                            style: Object.assign({}, props.style, {
                                                                fill: "#00FF03",
                                                            })
                                                        };
                                                    }
                                                }, {
                                                    target: "data",
                                                    mutation: (props) => {
                                                        return {
                                                            style: Object.assign({}, props.style, {
                                                                stroke: "#00FF03",
                                                                strokeWidth: 1,
                                                            })
                                                        };
                                                    }
                                                }];
                                            },
                                            onMouseOut: () => {
                                                return [{
                                                    target: "labels",
                                                    mutation: () => {
                                                        return null
                                                    }
                                                }, {
                                                    mutation: () => {
                                                        return null
                                                    }
                                                }];
                                            }
                                        }
                                    }
                                ]}
                                labelPosition="centroid"
                                data={chartsData}
                                animate={{
                                    duration: 1000
                                }}
                                colorScale={[
                                    "#1b4332",
                                    "#2d6a4f",
                                    "#40916c",
                                    "#52b788",
                                    "#74c69d",
                                    "#95d5b2",
                                    "#a6ddbd",
                                    "#b7e4c7",
                                    "#d8f3dc",
                                ]}
                            />
                        </div>
                        <div className="circle-chart-type--select-container">
                            <div className={"circle-chart-type--item" +
                            (this.state.chartType === "total" ? " circle-chart-type--item--active" : "")
                            }
                                 onClick={() => this.setState({chartType: "total"})}
                            >
                                <div className={"circle-chart-type--item-wrapper"}><VictoryPie
                                    data={[{
                                        x: USD,
                                        y: 0.5,
                                    }, {
                                        x: BTC,
                                        y: 1,
                                    }, {
                                        x: USD,
                                        y: 1.2,
                                    }, {
                                        x: EUR,
                                        y: 1.5,
                                    }]}
                                    style={{labels: {fontSize: 45, fontWeight: "bold"}}}
                                    labelComponent={<VictoryLabel/>}
                                    labelRadius={40}
                                    animate={{
                                        duration: 1000
                                    }}
                                    colorScale={[
                                        "#40916c",
                                        "#52b788",
                                        "#74c69d",
                                        "#95d5b2",
                                        "#a6ddbd",
                                        "#b7e4c7",
                                        "#d8f3dc",
                                    ]}
                                /></div>
                                <div className="circle-chart-type--text">Total picture</div>
                            </div>
                            <div className={"circle-chart-type--item" +
                            (this.state.chartType === "per-currency" ? " circle-chart-type--item--active" : "")
                            }
                                 onClick={() => this.setState({chartType: "per-currency"})}
                            >
                                <div className={"circle-chart-type--item-wrapper"}><VictoryPie
                                    data={[{
                                        x: BTC,
                                        y: 1,
                                    }, {
                                        x: USD,
                                        y: 1.2,
                                    }, {
                                        x: EUR,
                                        y: 1.5,
                                    }]}
                                    style={{labels: {fontSize: 45, fontWeight: "bold"}}}
                                    labelComponent={<VictoryLabel/>}
                                    labelRadius={40}
                                    animate={{
                                        duration: 1000
                                    }}
                                    colorScale={[
                                        "#40916c",
                                        "#52b788",
                                        "#74c69d",
                                        "#95d5b2",
                                        "#a6ddbd",
                                        "#b7e4c7",
                                        "#d8f3dc",
                                    ]}
                                /></div>
                                <span className="circle-chart-type--text">Balance per currency</span>
                            </div>
                            <div className={"circle-chart-type--item" +
                            (this.state.chartType === "per-type" ? " circle-chart-type--item--active" : "")
                            }
                                 onClick={() => this.setState({chartType: "per-type"})}
                            >
                                <div className={"circle-chart-type--item-wrapper"}><VictoryPie
                                    data={[{
                                        x: "cash",
                                        y: 0.5,
                                    }, {
                                        x: "non-cash",
                                        y: 1,
                                    }, {
                                        x: "crypto",
                                        y: 0.8,
                                    }]}
                                    style={{labels: {fontSize: 45, fontWeight: "bold"}}}
                                    labelComponent={<VictoryLabel/>}
                                    labelRadius={40}
                                    animate={{
                                        duration: 1000
                                    }}
                                    colorScale={[
                                        "#40916c",
                                        "#52b788",
                                        "#74c69d",
                                        "#95d5b2",
                                        "#a6ddbd",
                                        "#b7e4c7",
                                        "#d8f3dc",
                                    ]}
                                /></div>
                                <div className="circle-chart-type--text">Balance per type</div>
                            </div>
                        </div>
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
                                        <NumberFormat value={noExponents(asset.amount)}
                                                      displayType={'text'}
                                                      decimalScale={(asset.type === "crypto") ? 8 : 2}
                                                      suffix={" " + asset.currency}
                                                      thousandSeparator={true}/>
                                    </div>
                                    <div>{asset.currency === resultCurrencyCode ? '=' : '≈'}</div>
                                    <div className={"total-amount-in-currencies--asset-row-part"}>
                                        <NumberFormat value={noExponents(amount)}
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
                <div><NumberFormat value={noExponents(totalAmount)}
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
    fixMe = noExponents(fixMe);
    if (afterDecimalPoint === 0) {
        return Math.round(fixMe)
    }
    fixMe = "" + fixMe;
    if (fixMe.indexOf(".") >= 0) {
        const [left, right] = fixMe.split(/[.]/gi);
        if (right.length > afterDecimalPoint) {
            fixMe = left + "." + right.slice(0, afterDecimalPoint)
        }
    }
    return +noExponents(fixMe)
}

function addCommas(toMe) {
    return noExponents(toMe)
        .toString()
        .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
}
