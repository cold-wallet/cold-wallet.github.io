import axios from "axios";
import currencies from "./currencies";
import fiatRatesRepository from "../repo/FiatRatesRepository";
import cryptoRatesRepository from "../repo/CryptoRatesRepository";
import monobankApiClient from "./monobankApiClient";
import compareStrings from "./compareStrings";
import cryptoCurrenciesRepository from "../repo/CryptoCurrenciesRepository";

const uahNumCode = 980;
const BTC = "BTC";
const EUR = "EUR";

const milli = 1000;
const startTimeout = 20 * milli;
const timeoutStep = 5 * milli;
const endTimeout = 5 * milli;
let currentTimeout = startTimeout;
let currentCryptoTimeout = 30 * milli;
let savedRates = null;
let savedCryptoRates = null;

const futures = [];
let terminated = false;

const fiatRatesTimeout = 300_000;
const cryptoRatesTimeout = 300_000;

const binanceApiUrl = "https://api.binance.com";

(function fetchLatestRates() {
    if (terminated) {
        return
    }
    try {
        monobankApiClient.getRates(
            fiatRates => {
                if (fiatRates
                    && !fiatRates.errorDescription
                    && fiatRates.length
                ) {
                    if (fiatRates !== savedRates && !terminated) {
                        storeFiatRates(fiatRates);
                        savedRates = fiatRates;
                    }
                    futures.push(setTimeout(fetchLatestRates, fiatRatesTimeout))
                } else {
                    console.warn("Fetching latest rates failed", fiatRates);
                    throw fiatRates
                }
            },
            e => {
                console.warn(e);
                console.log(`Will re-fetch after timeout: ${currentTimeout / milli}s`);
                setTimeout(fetchLatestRates, currentTimeout);
                let newTimeoutValue = currentTimeout - timeoutStep;
                if (newTimeoutValue < endTimeout) {
                    newTimeoutValue = endTimeout
                }
                currentTimeout = newTimeoutValue;
            }
        );
    } catch (e) {
        console.error(e);
    }
})();

(function fetchCryptoCurrencies() {
    if (terminated) {
        return
    }
    try {
        axios.get(binanceApiUrl + "/api/v3/exchangeInfo")
            .then(response => {
                let symbols;
                if (response
                    && (response.status === 200)
                    && (symbols = response.data.symbols)
                ) {
                    if (symbols) {
                        storeCryptoCurrencies(Object.keys(symbols
                            .sort((a, b) => compareStrings(a.symbol, b.symbol))
                            .reduce((result, symbol) => {
                                result[symbol.baseAsset] = true;
                                result[symbol.quoteAsset] = true;
                                return result
                            }, {})));
                    }
                } else {
                    console.warn("Fetching latest binance symbols failed", response);
                    throw response
                }
            })
            .catch(e => {
                console.warn(e);
                const timeout = 10_000;
                console.warn(`Will re-fetch cryptoRates after timeout: ${timeout / milli}s`);
                setTimeout(fetchCryptoCurrencies, timeout);
            })
    } catch (e) {
        console.error(e)
    }
})();

(function fetchLatestCryptoCurrenciesRates() {
    if (terminated) {
        return
    }
    try {
        axios.get(binanceApiUrl + "/api/v1/ticker/price")
            .then(response => {
                let cryptoRates;
                if (response
                    && (response.status === 200)
                    && (cryptoRates = response.data)
                ) {
                    if (cryptoRates !== savedCryptoRates && !terminated) {
                        storeCryptoRates(cryptoRates);
                        savedCryptoRates = cryptoRates;
                    }
                    futures.push(setTimeout(fetchLatestCryptoCurrenciesRates, cryptoRatesTimeout))
                } else {
                    console.warn("Fetching latest cryptoRates failed", response);
                    throw response
                }
            })
            .catch(e => {
                console.warn(e);
                console.warn(`Will re-fetch cryptoRates after timeout: ${currentCryptoTimeout / milli}s`);
                setTimeout(fetchLatestCryptoCurrenciesRates, currentCryptoTimeout);
            })
    } catch (e) {
        console.error(e);
    }
})();

function getCryptoPrice(left, right) {
    const cryptoRates = getCryptoRates();
    let ticker = cryptoRates.filter(r => r.symbol === `${left}${right}`)[0] || {};
    let price = +(ticker.price);

    if (price && !isNaN(price)) {
        return price;
    }
    ticker = cryptoRates.filter(r => r.symbol === `${right}${left}`)[0] || {};
    price = +(ticker.price);

    if (price && !isNaN(price)) {
        return 1 / price;
    }

    const ticker1 = cryptoRates.filter(r => r.symbol === `${left}USDT`)[0] || {};
    const price1 = +(ticker1.price);
    const ticker2 = cryptoRates.filter(r => r.symbol === `${right}USDT`)[0] || {};
    const price2 = +(ticker2.price);
    price = price1 / price2;

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
    const rate = getFiatRates().filter(r => (r.currencyCodeA === left)
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
    const outputCurrencyNumCode = +(currencies.getByStringCode(outputCurrency).numCode);
    const currencyNumCode = +(currencies.getByStringCode(currency).numCode);

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

    console.warn("not found adequate transformation", fiatAsset, outputCryptoCurrencyCode);
    return 0;
}

function storeFiatRates(fiatRates) {
    try {
        fiatRatesRepository.save(fiatRates);
    } catch (e) {
        console.error(e)
    }
}

function getFiatRates() {
    return fiatRatesRepository.getLatest()
}

function storeCryptoCurrencies(data) {
    cryptoCurrenciesRepository.save(data)
}

function getCryptoCurrencies() {
    return cryptoCurrenciesRepository.getLatest()
}

function storeCryptoRates(cryptoRates) {
    cryptoRatesRepository.save(cryptoRates)
}

function getCryptoRates() {
    return cryptoRatesRepository.getLatest()
}

export default {
    isFiat(currencyStrCode) {
        return !!currencies.getByStringCode(currencyStrCode);
    },
    isReady() {
        return getFiatRates().length && getCryptoRates().length
    },
    getCurrenciesByType(type) {
        return type === "crypto"
            ? this.getCryptoCurrencies()
            : this.getFiatCurrencies()
    },
    getCryptoCurrencies() {
        return getCryptoCurrencies()
            .sort(compareStrings)
            .map(currencyStrCode => {
                return {
                    crypto: true,
                    code: currencyStrCode,
                    afterDecimalPoint: 8,
                    name: currencyStrCode,
                }
            })
    },
    getFiatCurrencies() {
        return Object
            .values(getFiatRates().reduce((result, rate) => {
                try {
                    const currency = currencies.getByNumCode(rate.currencyCodeA);
                    result[currency.code] = currency;
                } catch (e) {
                    console.error(e)
                }
                try {
                    const currency = currencies.getByNumCode(rate.currencyCodeB);
                    result[currency.code] = currency;
                } catch (e) {
                    console.error(e)
                }
                return result
            }, {}))
            .sort((a, b) => compareStrings(a.code, b.code))
    },
    transformAssetValue(asset, resultCurrencyCode, resultType) {
        return resultType === "crypto"
            ? this.transformAssetValueToCrypto(asset, resultCurrencyCode)
            : this.transformAssetValueToFiat(asset, resultCurrencyCode)
    },
    transformAssetValueToFiat(asset, currencyCode) {
        return asset.type === "crypto"
            ? transformCryptoToFiat(asset, currencyCode)
            : transformFiatToFiat(asset, currencyCode)
    },
    transformAssetValueToCrypto(asset, currencyCode) {
        return asset.type === "crypto"
            ? transformCryptoToCrypto(asset, currencyCode)
            : transformFiatToCrypto(asset, currencyCode)
    },
    shutDown() {
        terminated = true;
        futures.forEach(clearTimeout)
    }
};
