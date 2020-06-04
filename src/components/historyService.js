import rates from "./rates";
import numberFormat from "../extensions/numberFormat";
import assetsRepository from "./assetsRepository";

const historyStoreName = 'history';

const buildEmptyHistoryState = () => {
    return {
        series: [],
        named: {},
        assets: assetsRepository.getLatest(),
    };
};

export default {
    readHistory() {
        return JSON.parse(localStorage.getItem(historyStoreName)) || buildEmptyHistoryState();
    },

    updateHistory({assets}) {
        const now = Date.now();
        const currentNamed = this.readHistory().named || {};
        [].concat(assets.cash.assets.concat(assets["non-cash"].assets).concat(assets.crypto.assets))
            .forEach(asset => {
                asset.usdAmount = numberFormat(rates.transformAssetValueToFiat(asset, "USD"), 2);
                const data = [].concat(currentNamed[asset.name] || []);
                data.push([now, (asset.usdAmount)]);
                currentNamed[asset.name] = data;
                return {
                    data: data,
                    name: asset.name,
                }
            });
        const newSeries = Object.entries(currentNamed).map(entry => ({
            name: entry[0],
            data: entry[1],
        }));
        const history = {
            series: newSeries,
            named: currentNamed,
        };
        localStorage.setItem(historyStoreName, JSON.stringify(history));
    },
    refreshHistory() {
        this.updateHistory(assetsRepository.getLatest())
    },
}
