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
    const _buffer = {};

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
                        console.log("successfully loaded fresh rates");
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
                    const timeout = 10_000;
                    console.log(`Will re-fetch after timeout: ${timeout / 1000}s`);
                    setTimeout(fetchLatestRates, timeout);
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
                    console.log("saving cookies:", state);
                    storeData({
                        assets: state,
                        rates: savedRates,
                    });
                }}
            />
        </div>
        <ResultsWrapper
            initialRates={savedRates}
            latestRatesConsumer={(latestRatesConsumer) => _buffer.latestRatesConsumer = latestRatesConsumer}
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
