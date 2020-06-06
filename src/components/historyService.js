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
        allAssets.forEach(asset => {
            asset.usdAmount = numberFormat(rates.transformAssetValueToFiat(asset, "USD"), 2);
            const newItem = [now, asset.usdAmount];
            const identifier = asset.id || asset.name;
            const data = [].concat(currentNamed[identifier]?.data || [[prev, 0]]);
            data.push(newItem);
            currentNamed[identifier] = {
                id: asset.id,
                data: data,
                name: asset.name,
            }
        });
        let newSeries = Object.values(currentNamed);

        const currentTotalNamed = lastHistory.totalSeriesNamed || {};
        const activeCurrenciesToNewData = {};
        allAssets.forEach(asset => activeCurrenciesToNewData[asset.currency] = currentTotalNamed[asset.currency]
            || (currentTotalNamed[asset.currency] = {
                id: asset.id,
                data: [],
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
                const amount = numberFormat(rates.transformAssetValue(
                    asset, info.currency, info.__type
                ), 2);
                const last = info.data.length - 1;
                info.name = info.currency;
                info.data[last][1] = numberFormat(info.data[last][1] + amount, 2);
            });
        });

        let newTotalSeries = [currentTotalNamed["USD"]];

        if (newSeries[0].data.length > 3 && isNothingNew(lastHistory.series, newSeries)) {
            newSeries = prolongData(lastHistory.series, newSeries);
        }

        if (newTotalSeries[0].data.length > 3 && isNothingNew(lastHistory.totalSeries, newTotalSeries)) {
            newTotalSeries = prolongData(lastHistory.totalSeries, newTotalSeries);
        }

        const history = {
            series: newSeries,
            totalSeries: newTotalSeries,
            totalSeriesNamed: currentTotalNamed,
            named: currentNamed,
        };
        historyRepository.save(history);
    },
};

assetsRepository.subscribeOnChange(assets => historyService.updateHistory(assets));
fiatRatesRepository.subscribeOnChange(rates => historyService.updateHistory(assetsRepository.getLatest()));
cryptoRatesRepository.subscribeOnChange(cryptoRates => historyService.updateHistory(assetsRepository.getLatest()));

export default historyService

function isNothingNew(oldSeries, newSeries) {
    const prevOld = oldSeries.map(s => s.data[s.data.length - 2][1]).toString();
    const lastOld = oldSeries.map(s => s.data[s.data.length - 1][1]).toString();
    const newOnes = newSeries.map(s => s.data[s.data.length - 1][1]).toString();
    return prevOld === lastOld && lastOld === newOnes;
}

function prolongData(oldSeries, newSeries) {
    if (!oldSeries.length) {
        return newSeries
    }
    const newLatest = newSeries.map(s => s.data[s.data.length - 1]);
    return oldSeries.map((s, i) => {
        s.data[s.data.length - 1][0] = newLatest[i][0];
        return s
    });
}
