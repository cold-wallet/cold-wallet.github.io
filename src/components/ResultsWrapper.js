import React from "react";
import './ResultsWrapper.css'
import NumberFormat from 'react-number-format'
import {VictoryLabel, VictoryPie} from "victory"
import noExponents from "../extensions/noExponents";
import numberFormat, {numberFormatByType} from "../extensions/numberFormat";
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import './../extensions/highChartTheme'
import rates from "./rates";
import highCharts3d from 'highcharts/highcharts-3d'
import treemap from 'highcharts/modules/treemap'
import assetsRepository from "./assetsRepository";
import historyService from "./historyService";
import fiatRatesRepository from "./FiatRatesRepository";
import cryptoRatesRepository from "./CryptoRatesRepository";
import historyRepository from "./HistoryRepository";
import btcIcon from "../resources/currencies/btc.png";
import ethIcon from "../resources/currencies/eth.png";
import usdtIcon from "../resources/currencies/usdt.png";
import ltcIcon from "../resources/currencies/ltc.png";
import eosIcon from "../resources/currencies/eos.png";
import bchIcon from "../resources/currencies/bch.png";

// -> Load Highcharts modules
highCharts3d(Highcharts);
treemap(Highcharts);

const BTC = "BTC";
const USD = "USD";
const EUR = "EUR";
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
        fiatRatesRepository.subscribeOnChange(fiatRates => {
            if (!unmount) {
                return
            }
            try {
                this.setState({fiatRates: fiatRates});
            } catch (e) {
                console.error(e)
            }
        });
        cryptoRatesRepository.subscribeOnChange(cryptoRates => {
            if (!unmount) {
                return
            }
            try {
                this.setState({cryptoRates: cryptoRates});
            } catch (e) {
                console.error(e)
            }
        });
        historyRepository.subscribeOnChange(history => {
            if (!unmount) {
                return
            }
            try {
                this.setState({historyData: history});
            } catch (e) {
                console.error(e)
            }
        });
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
                const assetGroups = data.fiat ? [data.fiat] : [data.cash, data["non-cash"]];
                assetGroups.push(data.crypto);
                const currenciesBuffer = extractAllAssets(data).reduce((result, asset) => {
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
                let assets = extractAllAssets(data)
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

                assets = assets.map(asset => {
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
                    const fiatAssets = assets.filter(asset => asset.type === "fiat");
                    if (fiatAssets.length) {
                        buffer.push({type: "fiat", groupAssets: fiatAssets})
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
                            x: type + ": ",
                            percents: 0,
                            y: 0,
                        }));
                    preparedAssets = fiatAssets.concat(cryptoAssets).map(asset => {
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
                const chartOptions = {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    type: 'pie',
                    options3d: {
                        enabled: true,
                        alpha: 35,
                        beta: 0
                    },
                    style: {
                        width: "100%",
                    },
                };
                if (this.state.chartType === "per-type") {
                    series.push({
                        name: 'Total',
                        size: '44%',
                        dataLabels: {
                            format: '<b>{point.name}</b> {point.percentage:.2f} %',
                            distance: -20,
                            filter: {
                                property: 'percentage',
                                operator: '>',
                                value: 0
                            }
                        },
                        allowPointSelect: false,
                        data: amountPerTypeChartData.map((item, i) => {
                            let colorIndex = i + 1;
                            while (colorIndex > (pieColors.length - 1)) {
                                colorIndex -= pieColors.length
                            }
                            return {
                                name: item.x,
                                y: item.y,
                                color: pieColors[colorIndex] || pieColors[1],
                            }
                        }),
                    });
                    chartOptions.options3d.enabled = false;
                }

                const options = {
                    chart: chartOptions,
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
                           className="go-to-button-block--container">
                        <img className={"go-to-next-block--button"}
                             alt="go to next analysis block view"
                             title={"go to next block"}
                             src="https://img.icons8.com/carbon-copy/100/000000/double-left.png"
                             onClick={() => this.setState({
                                 activeResultsTab: "timelapse",
                             })}/>
                        <span style={{display: "none",}}>
                             <a href="https://icons8.com/icon/81122/double-left">Double Left icon by Icons8</a>
                         </span>
                    </div> : null;

                return [
                    <div key={key} className={"balance-results-container"}>
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
                                            x: "fiat",
                                            y: 0.6,
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
                    </div>,
                    buildGoToNext(),
                ]
            }
        }, {
            name: 'timelapse',
            buildInnerResult: (key, data) => {
                const allAssets = extractAllAssets(data);
                if (!allAssets.length || (this.state.activeResultsTab !== "timelapse")) {
                    return null
                }
                const currencyToType = allAssets.reduce((result, asset) => {
                    result[asset.currency] = asset.type;
                    return result;
                }, {});
                const currencies = Object.keys(currencyToType);
                const historyChartsData = historyService.readHistory();
                const currentCurrency = this.state.chartsBufferActiveCurrency
                    || this.state.chartsCurrencySelected
                    || currencies[0];
                const historySeries = Object.values(
                    (historyChartsData.partialPerCurrencies || {})[currentCurrency] || {}
                );
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
                                        height: '55%',
                                        style: {
                                            height: "100%",
                                        },
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
                                        valueSuffix: ' ' + currentCurrency
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
                            {buildCurrenciesSwitchControls(currencyToType, currency => {
                                this.setState({
                                    chartsCurrencySelected: currency,
                                    chartsBufferActiveCurrency: null,
                                })
                            }, currentCurrency)}
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
                const allAssets = extractAllAssets(data);
                if (!allAssets.length || (this.state.activeResultsTab !== "timelapse-percents")) {
                    return null
                }
                const currencyToType = allAssets.reduce((result, asset) => {
                    result[asset.currency] = asset.type;
                    return result;
                }, {});
                const currencies = Object.keys(currencyToType);
                const historyChartsData = historyService.readHistory();
                const currentCurrency = this.state.chartsBufferActiveCurrency
                    || this.state.chartsCurrencySelected
                    || currencies[0];
                const currentType = currencyToType[currentCurrency];
                const afterDecimalPoint = currentType === "crypto" ? 8 : 2;
                const historySeries = Object.values(
                    (historyChartsData.partialPerCurrencies || {})[currentCurrency] || {}
                );
                const buildChronologyPercentageChart = () => this.state.activeResultsTab === "timelapse-percents"
                    ? <div key={key} className={"results-timelapse-percents--block"}>
                        <div className="results-timelapse-percents--container">
                            <HighchartsReact
                                key={"timelapse-chart"}
                                highcharts={Highcharts}
                                options={{
                                    chart: {
                                        height: '55%',
                                        style: {
                                            height: "100%",
                                        },
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
                                            {point.y:,.${afterDecimalPoint}f} ${currentCurrency}<br/>`,
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
                            {buildCurrenciesSwitchControls(currencyToType, currency => {
                                this.setState({
                                    chartsCurrencySelected: currency,
                                    chartsBufferActiveCurrency: null,
                                })
                            }, currentCurrency)}
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
                const historyChartsData = historyService.readHistory();
                const allAssets = extractAllAssets(data);
                const currencyToType = allAssets.reduce((result, asset) => {
                    result[asset.currency] = asset.type;
                    return result;
                }, {});
                const currencies = Object.keys(currencyToType);
                if (!allAssets.length || (this.state.activeResultsTab !== "timelapse-total")) {
                    return null
                }
                if (!this.state.chartsCurrencySelected) {
                    setTimeout(() => this.setState({
                        chartsCurrencySelected: this.state.chartsBufferActiveCurrency || currencies[0]
                    }));
                }
                const currentCurrency = this.state.chartsBufferActiveCurrency
                    || this.state.chartsCurrencySelected
                    || currencies[0];
                const historyTotalSeries = historyChartsData.totalSeriesNamed[currentCurrency]
                    ? [historyChartsData.totalSeriesNamed[currentCurrency]]
                    : [];
                const buildChronologyTotalChart = () => (
                    <div key={key} className={"results-timelapse--block"}>
                        <div className="results-timelapse--container">
                            <HighchartsReact
                                key={"timelapse-total-chart"}
                                highcharts={{...Highcharts}}
                                options={{
                                    chart: {
                                        height: '55%',
                                        style: {
                                            height: "100%",
                                        },
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
                                    animation: {},
                                    tooltip: {
                                        valueSuffix: ` ${currentCurrency}`
                                    },
                                    plotOptions: {
                                        area: {
                                            stacking: 'normal',
                                            lineColor: '#666666',
                                            lineWidth: 1,
                                            marker: {
                                                lineWidth: 1,
                                                lineColor: '#666666',
                                                radius: 2,
                                            },
                                            states: {
                                                hover: {
                                                    lineWidth: 1,
                                                },
                                            },
                                            threshold: null,
                                        },
                                        series: {
                                            softThreshold: true,
                                            marker: {
                                                enabled: false,
                                            },
                                        },
                                    },
                                    series: historyTotalSeries,
                                    legend: {
                                        enabled: false
                                    },
                                }}
                            />
                            {buildCurrenciesSwitchControls(currencyToType, currency => {
                                this.setState({
                                    chartsCurrencySelected: currency,
                                    chartsBufferActiveCurrency: null,
                                })
                            }, currentCurrency)}
                        </div>
                    </div>);

                return [
                    this.buildButton_GoToPrev("timelapse-total", "timelapse-percents"),
                    buildChronologyTotalChart(),
                    this.buildButton_GoToNext("timelapse-total", "balance-treemap"),
                ]
            }
        }, {
            name: 'balance-treemap',
            buildInnerResult: (key, data) => {
                const allAssets = extractAllAssets(data);
                if (!allAssets.length || (this.state.activeResultsTab !== "balance-treemap")) {
                    return null
                }
                if (!this.state.chartsCurrencySelected) {
                    // a required thing, chart in not shown for unknown reason until state is updated and
                    // component will re-render itself correctly
                    setTimeout(() => this.setState({
                        chartsCurrencySelected: this.state.chartsBufferActiveCurrency || currencies[0]
                    }));
                }
                const currencyToType = allAssets.reduce((result, asset) => {
                    result[asset.currency] = asset.type;
                    return result;
                }, {});
                const currencies = Object.keys(currencyToType);
                const currentCurrency = this.state.chartsBufferActiveCurrency
                    || this.state.chartsCurrencySelected
                    || currencies[0];
                const currentType = currencyToType[currentCurrency];
                const afterDecimalPoint = currentType === "crypto" ? 8 : 2;
                let totalValue = 0;
                const colors = [
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
                let series = {
                    type: "treemap",
                    layoutAlgorithm: 'squarified',
                    data: allAssets
                        .map((asset, i) => {
                            const value = rates.transformAssetValue(asset, currentCurrency, currentType);
                            totalValue += value;
                            let colorIndex = i;
                            while (colorIndex > (colors.length - 1)) {
                                colorIndex -= colors.length
                            }
                            return {
                                value: value,
                                name: asset.name,
                                currency: asset.currency,
                                assetName: asset.name,
                                amount: asset.amount,
                                assetType: asset.type,
                                color: colors[colorIndex] || colors[0],
                            }
                        })
                        .sort((a, b) => b.value - a.value)
                        .map((asset, i) => {
                            asset.percentage = (asset.value * 100) / totalValue;
                            asset.name +=
                                `: ${addCommas(numberFormatByType(asset.amount, asset.assetType))} ${asset.currency}`;
                            return asset
                        }),
                };

                const buildTotalTreemapChart = () => this.state.activeResultsTab === "balance-treemap"
                    ? <div key={key} className={"results-timelapse-percents--block"}>
                        <div className="results-timelapse-percents--container">
                            <HighchartsReact
                                key={"balance-treemap-chart"}
                                highcharts={Highcharts}
                                options={{
                                    chart: {
                                        height: '55%',
                                        type: 'treemap',
                                    },
                                    title: {
                                        text: ''
                                    },
                                    subtitle: {
                                        text: ''
                                    },
                                    tooltip: {
                                        pointFormat: `<tspan style="color:{point.color}" x="8" dy="15">●</tspan>
                                             <span>{point.assetName}</span>: <b>{point.percentage:.2f}%</b>
                                            {point.value:,.${afterDecimalPoint}f} ${currentCurrency}<br/>`,
                                    },
                                    series: series,
                                    plotOptions: {
                                        treemap: {
                                            colors: [
                                                "#245741",
                                                "#2d6a4f",
                                                "#357a5b",
                                                "#5bac85",
                                                "#b7e4c7",
                                                "#d8f3dc",
                                                "#6ab791",
                                                "#41926d",
                                                "#78c19c",
                                                "#98d3b2",
                                            ],
                                        }
                                    }
                                }}
                            />
                            {buildCurrenciesSwitchControls(currencyToType, currency => {
                                this.setState({
                                    chartsCurrencySelected: currency,
                                    chartsBufferActiveCurrency: null,
                                })
                            }, currentCurrency)}
                        </div>
                    </div> : null;

                return [
                    this.buildButton_GoToPrev("balance-treemap", "timelapse-total"),
                    buildTotalTreemapChart(),
                    this.buildButton_GoToNext("balance-treemap", "balance-treemap"),
                ]
            }
        }]
    }

    buildButton_GoToNext(activeTab, newTab) {
        return (this.state.activeResultsTab === activeTab
            ? <div key={"go-to-next"} className="go-to-button-block--container">
                <img className={"go-to-next-block--button"}
                     alt="go to next analysis block view"
                     title={"go to next block"}
                     src="https://img.icons8.com/carbon-copy/100/000000/double-left.png"
                     onClick={() => {
                         this.setState({
                             activeResultsTab: newTab,
                             chartsBufferActiveCurrency: this.state.chartsCurrencySelected
                                 || this.state.chartsBufferActiveCurrency,
                             chartsCurrencySelected: null,
                         })
                     }}/>
                <span style={{display: "none",}}>
                    <a href="https://icons8.com/icon/81122/double-left">Double Left icon by Icons8</a>
                </span>
            </div> : null)
    }

    buildButton_GoToPrev(activeTab, newTab) {
        return (this.state.activeResultsTab === activeTab
            ? <div key={"go-to-prev"}
                   className="go-to-button-block--container">
                <img className={"go-to-prev-block--button"}
                     alt="go to prev analysis block view"
                     title={"go to prev block"}
                     src="https://img.icons8.com/carbon-copy/100/000000/double-right.png"
                     onClick={() => this.setState({
                         activeResultsTab: newTab,
                         chartsBufferActiveCurrency: this.state.chartsCurrencySelected
                             || this.state.chartsBufferActiveCurrency,
                         chartsCurrencySelected: null,
                     })}/>
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

function extractAllAssets(data) {
    return []
        .concat(data.fiat?.assets || data.cash.assets.concat(data["non-cash"].assets))
        .concat(data.crypto.assets);
}

function addCommas(toMe) {
    return noExponents(toMe)
        .toString()
        .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
}

function buildCurrenciesSwitchControls(currencyToType, onCurrencySelected, currentCurrency) {
    const currencyToInfo = getListOfTopCurrenciesByType();
    return <div className="chart-currencies-switch-controls-wrapper">{
        Object.keys(currencyToType).map((currency, i) => {
            const info = currencyToInfo[currency];
            return <div key={i}
                        title={info.name}
                        onClick={() => onCurrencySelected(currency)}
                        className={`chart-currencies-switch-controls--container
                        ${(currency === currentCurrency) && " chart-currencies-switch-controls--container__active"}`}>
                <div className="chart-currencies-switch-controls--currency-icon-wrapper">{info.htmlCode}</div>
                <div className={"asset-pic--name"}>{info.code}</div>
            </div>
        })}</div>
}

function getListOfTopCurrenciesByType() {
    const result = {
        "BTC": {
            name: "Bitcoin",
            code: "BTC",
            icon: btcIcon,
        },
        "ETH": {
            name: "Ethereum",
            code: "ETH",
            icon: ethIcon,
        },
        "USDT": {
            name: "Tether",
            code: "USDT",
            icon: usdtIcon,
        },
        "LTC": {
            name: "Litecoin",
            code: "LTC",
            icon: ltcIcon,
        },
        "EOS": {
            name: "EOS",
            code: "EOS",
            icon: eosIcon,
        },
        "BCH": {
            name: "Bitcoin Cash",
            code: "BCH",
            icon: bchIcon,
        },
    };
    Object.keys(result).forEach(currency => {
        const info = result[currency];
        info.htmlCode = <img className={"asset-pic--image-img"} src={info.icon} alt={info.name}/>;
    });
    result["USD"] = {
        name: "US Dollar",
        code: "USD",
        htmlCode: <span className={"chart-currencies-switch-controls--currency-icon asset-currency-icon"}>&#x24;</span>
    };
    result["EUR"] = {
        name: "Euro",
        code: "EUR",
        htmlCode: <span className={"chart-currencies-switch-controls--currency-icon asset-currency-icon"}>&euro;</span>
    };
    result["GBP"] = {
        name: "Pound sterling",
        code: "GBP",
        htmlCode: <span className={"chart-currencies-switch-controls--currency-icon asset-currency-icon"}>&#xA3;</span>
    };
    result["UAH"] = {
        name: "Ukrainian hryvnia",
        code: "UAH",
        htmlCode: <span className={"chart-currencies-switch-controls--currency-icon asset-currency-icon"}>&#8372;</span>
    };
    result["PLN"] = {
        name: "Polish zloty",
        code: "PLN",
        htmlCode: <span
            className={"chart-currencies-switch-controls--currency-icon asset-currency-icon"}>&#122;&#322;</span>
    };
    result["RUB"] = {
        name: "Russian ruble",
        code: "RUB",
        htmlCode: <span
            className={"chart-currencies-switch-controls--currency-icon asset-currency-icon"}>&#x20BD;</span>
    };
    return result
}
