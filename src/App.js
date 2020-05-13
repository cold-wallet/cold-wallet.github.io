import React from 'react';
import './App.css';
import ResultsWrapper from "./components/ResultsWrapper";
import {AssetsGroupsWrapper} from "./components/AssetsGroupsWrapper";
import "./fonts.scss";
import "./mixin.scss";
import "./reset.scss";

const dataStoreName = 'data';

export default function App() {
    const storedData = JSON.parse(localStorage.getItem(dataStoreName)) || {};
    const savedState = thisOrDefaultState(storedData.assets);
    let savedRates = storedData.rates || [];
    const _buffer = {};

    try {
        fetch("https://api.monobank.ua/bank/currency",
            {headers: {'User-agent': 'test' + Date.now()}})
            .then(res => res.json())
            .catch(e => {
                console.error(e);
            })
            .then(rates => {
                if (!rates.errorDescription && rates.length && (rates !== savedRates)) {
                    storeData({
                        assets: savedState,
                        rates,
                    });
                    _buffer.latestRatesConsumer && _buffer.latestRatesConsumer(rates);
                    savedRates = rates;
                }
            });
    } catch (e) {
        console.error(e);
    }

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

function thisOrDefaultState(savedCookies) {
    if (savedCookies) {
        console.log("read cookies:", savedCookies);
        return savedCookies
    } else {
        return buildEmptyState()
    }
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
