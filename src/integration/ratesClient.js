import rates from "cross-rates-browser";

rates.refreshRates();

const ratesClient = {
    isReady() {
        return rates.isReady()
    },
    getCurrenciesByType(type) {
        return (type === "crypto")
            ? rates.getCryptoCurrencies()
            : rates.getFiatCurrencies()
    },
    triggerOnChange(callMe) {
        rates.triggerOnChange(callMe);
    },
    onFiatRatesUpdate(consumer) {
        rates.onFiatRatesUpdate(consumer);
    },
    onCryptoRatesUpdate(consumer) {
        rates.onCryptoRatesUpdate(consumer);
    },
    transformAssetValue({amount, currency}, resultCurrency) {
        return rates.transform(amount, currency, resultCurrency)
    },
    shutDown() {
    },
};

export default ratesClient;

(function refetchRates() {
    setTimeout(() => {
        rates.refreshRates();
        refetchRates();
    }, 60 * 1000)
})();
