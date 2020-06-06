import rates from "./rates";
import numberFormat from "../extensions/numberFormat";
import assetsRepository from "./assetsRepository";
import fiatRatesRepository from "./FiatRatesRepository";
import cryptoRatesRepository from "./CryptoRatesRepository";
import historyRepository from "./HistoryRepository"

const historyService = {
    readHistory() {
        return historyRepository.getLatest();
    },

    updateHistory({assets}) {
        if (!rates.isReady()) {
            return
        }
        const now = Date.now();
        const lastHistory = this.readHistory();
        const prev = (lastHistory.series
            && lastHistory.series[0]
            && lastHistory.series[0].data
            && lastHistory.series[0].data.length)
            ? lastHistory.series[0].data[lastHistory.series[0].data.length - 1][0]
            : now - 10_000;
        const currentNamed = lastHistory.named;
        const allAssets = [].concat(assets.cash.assets.concat(assets["non-cash"].assets).concat(assets.crypto.assets));
        const partialPerCurrencies = lastHistory.partialPerCurrencies || {};
        const currencies = Object.keys(allAssets.map(asset => asset.currency)
            .reduce((a, c) => {
                a[c] = true;
                return a
            }, {}));
        allAssets.forEach(asset => {
            const identifier = asset.id || asset.name;
            currencies.forEach(currency => {
                if (!partialPerCurrencies[currency]) {
                    partialPerCurrencies[currency] = {}
                }
                const type = rates.isFiat(currency) ? "cash" : "crypto";
                const afterDecimalPoint = type === "crypto" ? 8 : 2;
                const value = numberFormat(rates.transformAssetValue(asset, currency, type), afterDecimalPoint);
                const newItem = [now, value];
                const data = [].concat(partialPerCurrencies[currency][identifier]?.data || [[prev, 0]]);
                data.push(newItem);
                partialPerCurrencies[currency][identifier] = {
                    id: asset.id,
                    data: data,
                    name: asset.name,
                };
            });
            asset.usdAmount = numberFormat(rates.transformAssetValueToFiat(asset, "USD"), 2);
            const newItem = [now, asset.usdAmount];
            const data = [].concat(currentNamed[identifier]?.data || [[prev, 0]]);
            data.forEach(a => {
                if (isNaN(+a[1])) {
                    a[1] = 0
                }
            });
            data.push(newItem);
            currentNamed[identifier] = {
                id: asset.id,
                data: data,
                name: asset.name,
            };
        });
        let newSeries = Object.values(currentNamed);

        const currentTotalNamed = lastHistory.totalSeriesNamed || {};
        const activeCurrenciesToNewData = {};
        allAssets.forEach(asset => activeCurrenciesToNewData[asset.currency] = currentTotalNamed[asset.currency]
            || (currentTotalNamed[asset.currency] = {
                id: asset.id,
                data: [[prev, 0]],
                name: asset.currency,
                __type: asset.type,
                currency: asset.currency,
            }));

        const newTotalDataPerCurrency = Object.values(activeCurrenciesToNewData);
        newTotalDataPerCurrency.forEach(info => {
            info.data.push([now, 0])
        });
        allAssets.forEach(asset => {
            newTotalDataPerCurrency.forEach(info => {
                const amount = rates.transformAssetValue(
                    asset, info.currency, info.__type
                );
                const last = info.data.length - 1;
                info.name = info.currency;
                info.data[last][1] = numberFormat(info.data[last][1] + amount,
                    info.__type === "crypto" ? 8 : 2);
            });
        });

        if (newSeries && isNothingNew(newSeries)) {
            newSeries = optimiseData(newSeries);
            Object.entries(activeCurrenciesToNewData).forEach(entry => {
                const cur = entry[0];
                activeCurrenciesToNewData[cur] = optimiseData([currentTotalNamed[cur]])[0]
            });
        }

        const history = {
            series: newSeries,
            totalSeriesNamed: currentTotalNamed,
            named: currentNamed,
            partialPerCurrencies: partialPerCurrencies,
        };
        historyRepository.save(history);
    },
};

assetsRepository.subscribeOnChange(assets => historyService.updateHistory(assets));
fiatRatesRepository.subscribeOnChange(rates => historyService.updateHistory(assetsRepository.getLatest()));
cryptoRatesRepository.subscribeOnChange(cryptoRates => historyService.updateHistory(assetsRepository.getLatest()));

export default historyService

function isNothingNew(series) {
    const prevOld = series.map(s => (s.data[s.data.length - 3] || [])[1]).toString();
    const lastOld = series.map(s => (s.data[s.data.length - 2] || [])[1]).toString();
    const newOnes = series.map(s => (s.data[s.data.length - 1] || [])[1]).toString();
    return prevOld === lastOld && lastOld === newOnes;
}

function optimiseData(series) {
    series.forEach(datum => {
        const last = datum.data.pop();
        datum.data.pop(); // this one is thrown away
        datum.data.push(last);
    });
    return series
}
