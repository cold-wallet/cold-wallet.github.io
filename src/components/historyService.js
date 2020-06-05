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

        [].concat(assets.cash.assets.concat(assets["non-cash"].assets).concat(assets.crypto.assets))
            .map(asset => {
                asset.usdAmount = numberFormat(rates.transformAssetValueToFiat(asset, "USD"), 2);
                const newItem = [now, asset.usdAmount];
                const identifier = asset.id || asset.name;
                const data = [].concat(currentNamed[identifier]?.data || [[prev, 0]]);
                data.push(newItem);
                return currentNamed[identifier] = {
                    id: asset.id,
                    data: data,
                    name: asset.name,
                }
            });
        let newSeries = Object.values(currentNamed);

        if (newSeries[0].data.length > 3 && isNothingNew(lastHistory.series, newSeries)) {
            newSeries = prolongData(lastHistory.series, newSeries)
        }

        const history = {
            series: newSeries,
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
    const newLatest = newSeries.map(s => s.data[s.data.length - 1]);
    return oldSeries.map((s, i) => {
        s.data[s.data.length - 1][0] = newLatest[i][0];
        return s
    });
}
