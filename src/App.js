import React from 'react';
import './App.css';
import ResultsWrapper from "./components/ResultsWrapper";
import {AssetsGroupsWrapper} from "./components/AssetsGroupsWrapper";
import "./fonts.scss";
import "./mixin.scss";
import "./reset.scss";
import axios from "axios";

const dataStoreName = 'data';

export default function App() {
    const storedData = JSON.parse(localStorage.getItem(dataStoreName)) || {};
    const savedState = storedData.assets || buildEmptyState();
    let savedRates = storedData.rates || [];
    let savedCryptoRates = storedData.cryptoRates || [];
    const _buffer = {};
    const milli = 1000;
    const startTimeout = 20 * milli;
    const timeoutStep = 5 * milli;
    const endTimeout = 5 * milli;
    let currentTimeout = startTimeout;
    let currentCryptoTimeout = 30 * milli;

    (function fetchLatestRates() {
        try {
            axios.get("https://api.monobank.ua/bank/currency")
                .then(response => {
                    let rates;
                    if (response
                        && (response.status === 200)
                        && (rates = response.data)
                        && !rates.errorDescription
                        && rates.length
                        && (rates !== savedRates)
                    ) {
                        storeData({
                            assets: savedState,
                            rates,
                        });
                        _buffer.latestRatesConsumer && _buffer.latestRatesConsumer(rates);
                        savedRates = rates;
                    } else {
                        console.warn("Fetching latest rates failed", response);
                        throw response
                    }
                })
                .catch(e => {
                    console.warn(e);
                    console.log(`Will re-fetch after timeout: ${currentTimeout / milli}s`);
                    setTimeout(fetchLatestRates, currentTimeout);

                    let newTimeoutValue = currentTimeout - timeoutStep;

                    if (newTimeoutValue < endTimeout) {
                        newTimeoutValue = endTimeout
                    }

                    currentTimeout = newTimeoutValue;
                })
        } catch (e) {
            console.error(e);
        }
    })();

    (function fetchLatestCryptoCurrenciesRates() {
        try {
            axios.get("https://api.binance.com/api/v1/ticker/price")
                .then(response => {
                    let cryptoRates;
                    if (response
                        && (response.status === 200)
                        && (cryptoRates = response.data)
                        && (cryptoRates !== savedCryptoRates)
                    ) {
                        storeData({
                            assets: savedState,
                            rates: savedRates,
                            cryptoRates: cryptoRates,
                        });
                        _buffer.latestCryptoRatesConsumer && _buffer.latestCryptoRatesConsumer(cryptoRates);
                        savedCryptoRates = cryptoRates;
                    } else {
                        console.warn("Fetching latest cryptoRates failed", response);
                        throw response
                    }
                })
                .catch(e => {
                    console.warn(e);
                    console.log(`Will re-fetch cryptoRates after timeout: ${currentCryptoTimeout / milli}s`);
                    setTimeout(fetchLatestCryptoCurrenciesRates, currentCryptoTimeout);
                })
        } catch (e) {
            console.error(e);
        }
    })();

    function storeData(data) {
        localStorage.setItem(dataStoreName, JSON.stringify(data));
    }

    return <div className="dashboard">
        <div className={"assets-wrapper"}>
            <div className={"assets-wrapper-title"}>{"So if you have:"}</div>
            <AssetsGroupsWrapper
                savedState={savedState}
                saveState={(state) => {
                    storeData({
                        assets: state,
                        rates: savedRates,
                        cryptoRates: savedCryptoRates,
                    });
                    _buffer.latestAssetsConsumer && _buffer.latestAssetsConsumer(state)
                }}
            />
        </div>
        <ResultsWrapper
            initialRates={savedRates}
            initialCryptoRates={savedCryptoRates}
            latestAssetsConsumer={latestAssetsConsumer => _buffer.latestAssetsConsumer = latestAssetsConsumer}
            latestRatesConsumer={latestRatesConsumer => _buffer.latestRatesConsumer = latestRatesConsumer}
            latestCryptoRatesConsumer={cryptoRatesConsumer => _buffer.latestCryptoRatesConsumer = cryptoRatesConsumer}
            savedState={savedState}/>
    </div>
}

function buildEmptyState() {
    return {
        cash: {
            type: 'cash',
            assets: [],
        },
        "non-cash": {
            type: 'non-cash',
            assets: [],
        },
        crypto: {
            type: 'crypto',
            assets: [],
        },
    }
}
