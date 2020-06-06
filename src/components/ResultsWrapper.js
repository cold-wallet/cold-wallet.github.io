import React from "react";
import './ResultsWrapper.css'
import NumberFormat from 'react-number-format'
import {VictoryLabel, VictoryPie} from "victory"
import noExponents from "../extensions/noExponents";
import numberFormat from "../extensions/numberFormat";
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import './../extensions/highChartTheme'
import rates from "./rates";
import highCharts3d from 'highcharts/highcharts-3d'
import assetsRepository from "./assetsRepository";
import historyService from "./historyService";
import fiatRatesRepository from "./FiatRatesRepository";
import cryptoRatesRepository from "./CryptoRatesRepository";
import historyRepository from "./HistoryRepository";

// -> Load Highcharts modules
highCharts3d(Highcharts);

const BTC = "BTC";
const USD = "USD";
const EUR = "EUR";

let unmount;

export default class ResultsWrapper extends React.Component {
    static defaultProps = {
        savedState: {},
    };

    constructor(props, context) {
        super(props, context);
        this.state = {
            assets: props.savedState || [],
            chartType: props.chartType || "total",
            activeResultsTab: props.activeResultsTab || "first",
        };
    }

    componentDidMount() {
        unmount = false;
        assetsRepository.subscribeOnChange(
            assets => !unmount && this.setState({assets: assets.assets}));
        fiatRatesRepository.subscribeOnChange(
            fiatRates => !unmount && this.setState({fiatRates: fiatRates}));
        cryptoRatesRepository.subscribeOnChange(
            cryptoRates => !unmount && this.setState({cryptoRates: cryptoRates}));
        try {
            historyRepository.subscribeOnChange(
                history => !unmount && this.setState({historyData: history}))
        } catch (e) {
            console.error(e)
        }
    }

    componentWillUnmount() {
        unmount = true;
        rates.shutDown();
    }

    render() {
        if (!this.state.assets || !rates.isReady()) {
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
                if (this.state.activeResultsTab !== "first") {
                    return null
                }
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

                return <div
                    key={key}
                    style={
                        this.state.goToNextBlock === "requested" ? {} : {} // todo: finish implementation
                    }
                    className={"total-amount-in-one-currency--container"}>{
                    Object.entries(currenciesBuffer).map(
                        currencyCodeToType => this.buildCurrencyTotalResult(assetGroups, currencyCodeToType)
                    )
                }</div>
            }
        }, {
            name: 'balance',
            buildInnerResult: (key, data) => {
                if (this.state.activeResultsTab !== "first") {
                    return null
                }
                let assets = data.cash.assets
                    .concat(data["non-cash"].assets)
                    .concat(data.crypto.assets)
                    .map(asset => {
                        asset.usdAmount = rates.transformAssetValueToFiat(asset, USD);
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

                function buildAnotherTitle({percents, amount, currency}) {
                    let afterDecimalPoint;
                    if (percents < 0.01) {
                        afterDecimalPoint = 8;
                    } else if (percents < 2) {
                        afterDecimalPoint = 2
                    } else {
                        afterDecimalPoint = 0
                    }
                    return ` : ${noExponents(addCommas(numberFormat(amount, afterDecimalPoint)))} ${currency}`
                }

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

                function buildHighChartsTitle(asset) {
                    const amount = noExponents(addCommas(asset.amount));
                    return `${amount} ${asset.currency}`
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

                let amountPerTypeChartData = [];
                let yToEventKey = {};

                if (this.state.chartType === "per-type") {
                    const buffer = [];
                    const cashAssets = assets.filter(asset => asset.type === "cash");
                    if (cashAssets.length) {
                        buffer.push({type: "cash", groupAssets: cashAssets})
                    }
                    const nonCashAssets = assets.filter(asset => asset.type === "non-cash");
                    if (nonCashAssets.length) {
                        buffer.push({type: "non-cash", groupAssets: nonCashAssets})
                    }
                    const cryptoAssets = assets.filter(asset => asset.type === "crypto");
                    if (cryptoAssets.length) {
                        buffer.push({type: "crypto", groupAssets: cryptoAssets})
                    }

                    amountPerTypeChartData = buffer
                        .map(({type, groupAssets}) => groupAssets.reduce((a, asset) => {
                            a.y += asset.usdAmount;
                            a.percents += asset.percents;
                            return a
                        }, {
                            eventKey: type,
                            x: type,
                            percents: 0,
                            y: 0,
                        }))
                        .map((o) => {
                            o.x += buildAnotherTitle({
                                percents: o.percents,
                                amount: o.y,
                                currency: USD,
                            });
                            return o
                        });
                    preparedAssets = cashAssets.concat(nonCashAssets).concat(cryptoAssets).map(asset => {
                        asset.eventKey = asset.type;
                        return asset
                    })
                } else {
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
                        tinyAssetsComposite.text = `Other : ${tinyAssetsComposite.text}`;

                        otherAmounts.push(tinyAssetsComposite);
                        preparedAssets = otherAmounts;
                    }
                }

                const chartsData = preparedAssets.map(asset => {
                    return {
                        x: asset.text ? asset.text : buildTitle(asset),
                        y: asset.usdAmount,
                        type: asset.type,
                    }
                }).map(datum => {
                    yToEventKey[datum.x] = datum.type;
                    return datum
                });

                if (!chartsData.length) {
                    return null
                }

                const series = [{
                    allowPointSelect: true,
                    name: 'TOTAL',
                    innerSize: (this.state.chartType === "per-type") ? '55%' : 0,
                    size: '85%',
                    accessibility: {
                        announceNewData: {
                            enabled: true
                        },
                    },
                    dataLabels: {
                        distance: 20,
                        filter: {
                            property: 'percentage',
                            operator: '>',
                            value: 1
                        }
                    },
                    data: preparedAssets.map(asset => {
                        return {
                            x: asset.text ? asset.text : buildHighChartsTitle(asset),
                            y: asset.usdAmount,
                            type: asset.type,
                        }
                    }).map(item => ({
                        name: item.x,
                        y: item.y,
                    }))
                }];
                if (this.state.chartType === "per-type") {
                    series.unshift({
                        name: 'Total',
                        size: '44%',
                        dataLabels: {
                            distance: -30,
                            filter: {
                                property: 'percentage',
                                operator: '>',
                                value: 0
                            }
                        },
                        allowPointSelect: false,
                        data: amountPerTypeChartData.map(item => ({
                            name: item.x,
                            y: item.y,
                        })),
                    })
                }

                const pieColors = [
                    "#103b34",
                    "#245741",
                    "#2d6a4f",
                    "#357a5b",
                    "#41926d",
                    "#5bac85",
                    "#6ab791",
                    "#78c19c",
                    "#98d3b2",
                    "#b7e4c7",
                    "#d8f3dc",
                ];

                const options = {
                    chart: {
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: false,
                        type: 'pie',
                        options3d: {
                            enabled: true,
                            alpha: 35,
                            beta: 0
                        },
                    },
                    title: {
                        text: '',
                    },
                    tooltip: {
                        pointFormat: `<tspan style="color:{point.color}" x="8" dy="15">●</tspan>
                                      <span>{series.name}</span>: <b>{point.y:,.2f} USD</b> ({point.percentage:.2f}%)<br/>`,
                    },
                    accessibility: {
                        announceNewData: {
                            enabled: true
                        },
                        point: {
                            valueSuffix: '%'
                        }
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            depth: 35,
                            colors: pieColors,
                            dataLabels: {
                                enabled: true,
                                format: '<b>{point.name}</b><br>{point.percentage:.2f} %',
                                distance: 20,
                                filter: {
                                    property: 'percentage',
                                    operator: '>',
                                    value: 1
                                }
                            }
                        }
                    },
                    series: series,
                };

                const colorScale = [
                    "#40916c",
                    "#52b788",
                    "#74c69d",
                    "#95d5b2",
                    "#a6ddbd",
                    "#b7e4c7",
                    "#d8f3dc",
                ];

                const buildGoToNext = () => this.state.activeResultsTab === "first"
                    ? <div key={"go-to-next"}
                           onClick={() => this.setState({
                               activeResultsTab: "timelapse",
                           })}>
                        <img className={"go-to-next-block--button"}
                             alt="go to next analysis block view"
                             title={"go to next block"}
                             src="https://img.icons8.com/carbon-copy/100/000000/double-left.png"/>
                        <span style={{display: "none",}}>
                             <a href="https://icons8.com/icon/81122/double-left">Double Left icon by Icons8</a>
                         </span>
                    </div> : null;

                return <div key={key} className={"balance-results-container"}>
                    <div className={"balance-circle-container"}>
                        <div className={"balance-circle-chart"}>
                            <HighchartsReact
                                key={"highChart"}
                                highcharts={Highcharts}
                                options={options}
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
                                    colorScale={colorScale}
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
                                    colorScale={colorScale}
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
                                    colorScale={colorScale}
                                /></div>
                                <div className="circle-chart-type--text">Balance per type</div>
                            </div>
                        </div>
                    </div>
                    {buildGoToNext()}
                </div>
            }
        }, {
            name: 'timelapse',
            buildInnerResult: (key, data) => {
                if (!data.cash.assets
                    .concat(data["non-cash"].assets)
                    .concat(data.crypto.assets).length) {
                    return null
                }
                const historyChartsData = historyService.readHistory();
                const historySeries = historyChartsData.series;
                const buildChronologyChart = () => this.state.activeResultsTab === "timelapse"
                    ? <div key={key} className={"results-timelapse--block"}>
                        <div className="results-timelapse--container">
                            <HighchartsReact
                                key={"total-history-chart"}
                                highcharts={(function (newConf) {
                                    newConf.theme.colors = [
                                        "#1ea267",
                                        "#b7e4c7",
                                        "#ffe066",
                                        "#245741",
                                        "#f25f5c",
                                        "#eafce0",
                                        "#247ba0",
                                        "#70c1b3",
                                    ];
                                    newConf.setOptions(newConf.theme);
                                    return newConf
                                })({...Highcharts})}
                                options={{
                                    chart: {
                                        height: '60%',
                                        type: 'area',
                                        zoomType: 'x',
                                    },
                                    title: {
                                        text: ''
                                    },
                                    xAxis: {
                                        type: 'datetime',
                                        tickmarkPlacement: 'on',
                                    },
                                    yAxis: {
                                        title: {
                                            text: ''
                                        },
                                    },
                                    tooltip: {
                                        valueSuffix: ' USD'
                                    },
                                    plotOptions: {
                                        series: {
                                            marker: {
                                                enabled: false,
                                            }
                                        },
                                        area: {
                                            stacking: 'normal',
                                            lineColor: '#666666',
                                            lineWidth: 1,
                                            marker: {
                                                lineWidth: 1,
                                                lineColor: '#666666'
                                            }
                                        }
                                    },
                                    series: historySeries,
                                    legend: {
                                        enabled: false
                                    },
                                }}
                            />
                            <div className="chart-currencies-switch-controls-wrapper"></div>
                        </div>
                    </div> : null;

                return [
                    this.buildButton_GoToPrev("timelapse", "first"),
                    buildChronologyChart(),
                    this.buildButton_GoToNext("timelapse", "timelapse-percents"),
                ]
            }
        }, {
            name: 'timelapse-percents',
            buildInnerResult: (key, data) => {
                if (!data.cash.assets
                    .concat(data["non-cash"].assets)
                    .concat(data.crypto.assets).length) {
                    return null
                }
                const historyChartsData = historyService.readHistory();
                const historySeries = historyChartsData.series;
                const buildChronologyPercentageChart = () => this.state.activeResultsTab === "timelapse-percents"
                    ? <div key={key} className={"results-timelapse-percents--block"}>
                        <div className="results-timelapse-percents--container">
                            <HighchartsReact
                                key={"timelapse-chart"}
                                highcharts={Highcharts}
                                options={{
                                    chart: {
                                        height: '60%',
                                        type: 'area',
                                        zoomType: 'x',
                                    },
                                    title: {
                                        text: ''
                                    },
                                    subtitle: {
                                        text: ''
                                    },
                                    xAxis: {
                                        type: 'datetime',
                                    },
                                    yAxis: {
                                        labels: {
                                            format: '{value}%'
                                        },
                                        title: {
                                            enabled: false
                                        }
                                    },
                                    legend: {
                                        enabled: false
                                    },
                                    tooltip: {
                                        pointFormat: `<tspan style="color:{point.color}" x="8" dy="15">●</tspan>
                                            <span>{series.name}</span>: <b>
                                            {point.percentage:.2f}%</b>
                                             {point.y:,.2f} USD<br/>`,
                                    },
                                    plotOptions: {
                                        series: {
                                            marker: {
                                                enabled: false,
                                            }
                                        },
                                        area: {
                                            stacking: 'percent',
                                            lineColor: '#ffffff',
                                            lineWidth: 1,
                                            marker: {
                                                lineWidth: 1,
                                                lineColor: '#ffffff'
                                            },
                                        }
                                    },
                                    series: historySeries,
                                }}
                            />
                            <div className="chart-currencies-switch-controls-wrapper"></div>
                        </div>
                    </div> : null;

                return [
                    this.buildButton_GoToPrev("timelapse-percents", "timelapse"),
                    buildChronologyPercentageChart(),
                    this.buildButton_GoToNext("timelapse-percents", "timelapse-total"),
                ]
            }
        }, {
            name: 'timelapse-total',
            buildInnerResult: (key, data) => {
                if (!data.cash.assets
                    .concat(data["non-cash"].assets)
                    .concat(data.crypto.assets).length) {
                    return null
                }
                const historyChartsData = historyService.readHistory();
                const historyTotalSeries = historyChartsData.totalSeries || [];
                const buildChronologyTotalChart = () => this.state.activeResultsTab === "timelapse-total"
                    ? <div key={key} className={"results-timelapse--block"}>
                        <div className="results-timelapse--container">
                            <HighchartsReact
                                key={"timelapse-total-chart"}
                                highcharts={Highcharts}
                                options={{
                                    chart: {
                                        height: '60%',
                                        type: 'area',
                                        zoomType: 'x',
                                    },
                                    title: {
                                        text: ''
                                    },
                                    xAxis: {
                                        type: 'datetime',
                                        tickmarkPlacement: 'on',
                                    },
                                    yAxis: {
                                        title: {
                                            text: ''
                                        },
                                    },
                                    tooltip: {
                                        valueSuffix: ' USD'
                                    },
                                    plotOptions: {
                                        series: {
                                            marker: {
                                                enabled: false,
                                            }
                                        },
                                        area: {
                                            stacking: 'normal',
                                            lineColor: '#666666',
                                            lineWidth: 1,
                                            marker: {
                                                lineWidth: 1,
                                                lineColor: '#666666'
                                            }
                                        }
                                    },
                                    series: historyTotalSeries,
                                    legend: {
                                        enabled: false
                                    },
                                }}
                            />
                            <div className="chart-currencies-switch-controls-wrapper"></div>
                        </div>
                    </div> : null;

                return [
                    this.buildButton_GoToPrev("timelapse-total", "timelapse-percents"),
                    buildChronologyTotalChart(),
                    this.buildButton_GoToNext("timelapse-total", "timelapse-total"),
                ]
            }
        }]
    }

    buildButton_GoToNext(activeTab, newTab) {
        return (this.state.activeResultsTab === activeTab
            ? <div key={"go-to-next"}
                   onClick={() => {
                       this.setState({
                           activeResultsTab: newTab,
                       })
                   }}>
                <img className={"go-to-next-block--button"}
                     alt="go to next analysis block view"
                     title={"go to next block"}
                     src="https://img.icons8.com/carbon-copy/100/000000/double-left.png"/>
                <span style={{display: "none",}}>
                             <a href="https://icons8.com/icon/81122/double-left">Double Left icon by Icons8</a>
                         </span>
            </div> : null)
    }

    buildButton_GoToPrev(activeTab, newTab) {
        return (this.state.activeResultsTab === activeTab
            ? <div key={"go-to-prev"}
                   onClick={() => this.setState({
                       activeResultsTab: newTab,
                   })}>
                <img className={"go-to-prev-block--button"}
                     alt="go to prev analysis block view"
                     title={"go to prev block"}
                     src="https://img.icons8.com/carbon-copy/100/000000/double-right.png"/>
                <span style={{display: "none",}}>
                             <a href="https://icons8.com/icon/81122/double-right">Double Right icon by Icons8</a>
                         </span>
            </div> : null)
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
                                    amount = rates.transformAssetValueToCrypto(asset, resultCurrencyCode);
                                } else {
                                    amount = rates.transformAssetValueToFiat(asset, resultCurrencyCode);
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
}

function addCommas(toMe) {
    return noExponents(toMe)
        .toString()
        .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
}
