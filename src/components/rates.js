import axios from "axios";
import historyService from "./historyService";
import currencies from "../resources/currencies-iso-4217";

const uahNumCode = 980;
const BTC = "BTC";
const USD = "USD";
const EUR = "EUR";

const cryptoRatesStoreName = 'crypto-rates';
const ratesStoreName = 'rates';
const milli = 1000;
const startTimeout = 20 * milli;
const timeoutStep = 5 * milli;
const endTimeout = 5 * milli;
let currentTimeout = startTimeout;
let currentCryptoTimeout = 30 * milli;
const _buffer = {};
let savedRates = null;
let savedCryptoRates = null;

(function fetchLatestRates() {
    try {
        axios.get("https://api.monobank.ua/bank/currency")
            .then(response => {
                let fiatRates;
                if (response
                    && (response.status === 200)
                    && (fiatRates = response.data)
                    && !fiatRates.errorDescription
                    && fiatRates.length
                    && (fiatRates !== savedRates)
                ) {
                    storeFiatRates(fiatRates);
                    _buffer.latestRatesConsumer && _buffer.latestRatesConsumer(fiatRates);
                    savedRates = fiatRates;
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

function storeFiatRates(fiatRates) {
    localStorage.setItem(ratesStoreName, JSON.stringify(fiatRates));
    historyService.refreshHistory();
}

function getCryptoPrice(left, right) {
    const ticker = getCryptoRates().filter(r => r.symbol === `${left}${right}`)[0] || {};
    const price = +(ticker.price);

    if (price && !isNaN(price)) {
        return price;
    }
}

function transformCrypto(amountFrom, currencyFrom, currencyTo) {
    let price = getCryptoPrice(currencyFrom, currencyTo);
    if (price) {
        return amountFrom * price;
    }
    price = getCryptoPrice(currencyTo, currencyFrom);
    if (price) {
        return amountFrom / price;
    }
}

function transformCryptoToCrypto(asset, resultCurrencyCode) {
    if (asset.currency === resultCurrencyCode) {
        return asset.amount
    }
    let amount = transformCrypto(asset.amount, asset.currency, resultCurrencyCode);
    if (amount) {
        return amount
    }

    let btcAmount = transformCrypto(asset.amount, asset.currency, BTC);
    return transformCrypto(btcAmount, BTC, resultCurrencyCode);
}

function findFiatRate(left, right) {
    const rate = getRates().filter(r => (r.currencyCodeA === left)
        && (r.currencyCodeB === right))[0];

    return rate.rateCross || ((rate.rateBuy + rate.rateSell) / 2);
}

function transformCurrencyToUAH(amount, currencyNumCode) {
    if (currencyNumCode === uahNumCode) {
        return amount;
    }

    const rateCross = findFiatRate(currencyNumCode, uahNumCode);
    return amount * rateCross;
}

function transformFiatToFiat({amount, currency}, outputCurrency) {
    let outputCurrencyNumCode = +(currencies[outputCurrency].numCode);
    let currencyNumCode = +(currencies[currency].numCode);

    if (currencyNumCode === outputCurrencyNumCode) {
        return amount
    }

    const amountInUah = transformCurrencyToUAH(amount, currencyNumCode);

    if (outputCurrencyNumCode === uahNumCode) {
        return amountInUah
    }

    const rateCross = findFiatRate(outputCurrencyNumCode, uahNumCode);
    return amountInUah / rateCross;
}

function getRates() {
    return JSON.parse(localStorage.getItem(ratesStoreName)) || [];
}

function transformCryptoToFiat(cryptoAsset, outputFiatCurrencyCode) {
    const btcAmount = (cryptoAsset.currency === BTC)
        ? cryptoAsset.amount
        : transformCrypto(cryptoAsset.amount, cryptoAsset.currency, BTC);

    const btcEurPrice = getCryptoPrice(BTC, EUR);
    const amountInEur = btcAmount * btcEurPrice;

    if (cryptoAsset.currency === BTC && outputFiatCurrencyCode === EUR) {
        return amountInEur;
    }

    return transformFiatToFiat({amount: amountInEur, currency: EUR}, outputFiatCurrencyCode);
}

function transformFiatToCrypto(fiatAsset, outputCryptoCurrencyCode) {
    if (fiatAsset.currency === outputCryptoCurrencyCode) {
        return fiatAsset.amount
    }

    const eurAmount = (fiatAsset.currency === EUR)
        ? fiatAsset.amount
        : transformFiatToFiat(fiatAsset, EUR);

    const btcEurPrice = getCryptoPrice(BTC, EUR);
    const btcAmount = eurAmount / btcEurPrice;

    if (outputCryptoCurrencyCode === BTC) {
        return btcAmount
    }

    let amount = transformCrypto(btcAmount, BTC, outputCryptoCurrencyCode);
    if (amount) {
        return amount;
    }

    console.log("not found adequate transformation", fiatAsset, outputCryptoCurrencyCode);
    return 0;
}

function getCryptoRates() {
    return JSON.parse(localStorage.getItem(cryptoRatesStoreName)) || [];
}

export default {
    isReady() {
        return getRates().length
    },
    extractRates() {
        return getRates()
    },
    extractCryptoRates() {
        return getCryptoRates()
    },
    transformAssetValueToFiat(asset, currencyCode) {
        return asset.type === "crypto"
            ? transformCryptoToFiat(asset, currencyCode)
            : transformFiatToFiat(asset, currencyCode)
            ;
    },
    transformAssetValueToCrypto(asset, currencyCode) {
        return asset.type === "crypto"
            ? transformCryptoToCrypto(asset, currencyCode)
            : transformFiatToCrypto(asset, currencyCode)
            ;
    }
};

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
                    storeCryptoRates(cryptoRates);
                    try {
                        _buffer.latestCryptoRatesConsumer && _buffer.latestCryptoRatesConsumer(cryptoRates);
                    } catch (e) {
                        console.error(e);
                    }
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

function storeCryptoRates(cryptoRates) {
    localStorage.setItem(cryptoRatesStoreName, JSON.stringify(cryptoRates));
    historyService.refreshHistory();
}
