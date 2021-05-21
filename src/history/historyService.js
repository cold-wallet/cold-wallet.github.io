import rates from "../integration/ratesClient";
import numberFormat from "../extensions/numberFormat";
import historyRepository from "./HistoryRepository"
import assetsService from "../assets/AssetService";

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
        const partialPerCurrencies = lastHistory.partialPerCurrencies || {};
        const currentTotalNamed = lastHistory.totalSeriesNamed || {};
        const currentTotalValues = Object.values(currentTotalNamed);
        const currentTotalValue = currentTotalValues[0];
        const prev = (currentTotalValue
            && currentTotalValue.data
            && currentTotalValue.data.length)
            ? currentTotalValue.data[0][0]
            : now - 1000;
        const prevData = prev ? [[prev, 0]] : [];
        const allAssets = [].concat(assets.fiat?.assets || assets.cash.assets.concat(assets["non-cash"].assets))
            .concat(assets.crypto.assets);
        const currencyToType = allAssets.reduce((result, asset) => {
            result[asset.currency] = asset.type;
            return result;
        }, {});
        const currencies = Object.keys(currencyToType);
        const activeCurrenciesToNewData = {};
        allAssets.forEach(asset => {
            const identifier = asset.id || asset.name;
            currencies.forEach(currency => {
                if (!partialPerCurrencies[currency]) {
                    partialPerCurrencies[currency] = {}
                }
                const type = currencyToType[currency];
                const afterDecimalPoint = type === "crypto" ? 8 : 2;
                const value = numberFormat(rates.transformAssetValue(asset, currency), afterDecimalPoint);
                const newItem = [now, value];
                let data = [].concat(partialPerCurrencies[currency][identifier]?.data || [...prevData]);
                data.push(newItem);
                partialPerCurrencies[currency][identifier] = {
                    id: identifier,
                    data: data,
                    name: asset.name,
                };
            });
            activeCurrenciesToNewData[asset.currency] = currentTotalNamed[asset.currency]
                || (currentTotalNamed[asset.currency] = {
                    id: identifier,
                    data: [...prevData],
                    name: asset.currency,
                    __type: asset.type,
                    currency: asset.currency,
                });
        });

        const newTotalDataPerCurrency = Object.values(activeCurrenciesToNewData);
        if (isNothingNew(newTotalDataPerCurrency)) {
            optimiseData(newTotalDataPerCurrency)
        }
        newTotalDataPerCurrency.forEach(info => {
            info.data.push([now, 0])
        });
        allAssets.forEach(asset => {
            newTotalDataPerCurrency.forEach(info => {
                const amount = rates.transformAssetValue(asset, info.currency);
                const last = info.data.length - 1;
                info.name = info.currency;
                info.data[last][1] = numberFormat(info.data[last][1] + amount,
                    info.__type === "crypto" ? 8 : 2);
            });
        });
        newTotalDataPerCurrency.forEach(info => {
            info.data = optimiseLastData(info.data)
        });

        const history = {
            totalSeriesNamed: currentTotalNamed,
            partialPerCurrencies: partialPerCurrencies,
        };
        try {
            historyRepository.save(history);
        } catch (e) {
            if (
                (e instanceof DOMException)
                && (e.message === `Failed to execute 'setItem' on 'Storage': Setting the value of '${historyRepository.name}' exceeded the quota.`)
                && (e.name === "QuotaExceededError")
            ) {
                historyRepository.save(minimizeHistoryData(history))
            } else {
                console.error(e);
            }
        }
    },
};

function minimizeHistoryData(history) {
    Object.values(history.totalSeriesNamed).forEach(dataContainer => {
        const length = dataContainer.data.length;
        if (length >= 50) {
            dataContainer.data = dataContainer.data.filter((v, i) => {
                return (i === length - 1) || (i % 2 !== 0)
            })
        }
    })
    Object.values(history.partialPerCurrencies)
        .map(v => Object.entries(v))
        .forEach(currentEntries => {
            const timesToRemove = {};
            let index = 3;
            while (true) {
                let earliestTime;
                for (let i = 0; i < currentEntries.length; i++) {
                    const data = currentEntries[i][1].data;
                    const entry = data[index];
                    if (!entry) {
                        continue
                    }
                    const entryTime = entry[0];
                    if (!earliestTime || (earliestTime > entryTime)) {
                        earliestTime = entryTime
                    }
                }
                if (!earliestTime) {
                    break;
                }
                timesToRemove[earliestTime] = true;
                index += 2;
            }
            currentEntries.forEach(e => e[1].data = e[1].data.filter(ee => !timesToRemove[ee[0]]));
        });
    return history
}

assetsService.subscribeOnChange(assets => historyService.updateHistory(assets));
rates.triggerOnChange(() => historyService.updateHistory(assetsService.getCurrentAssets()));

export default historyService

function isNothingNew(series) {
    const prevOld1 = series.map(s => (s.data[s.data.length - 4] || [])[1]).toString();
    const prevOld = series.map(s => (s.data[s.data.length - 3] || [])[1]).toString();
    const lastOld = series.map(s => (s.data[s.data.length - 2] || [])[1]).toString();
    const newOnes = series.map(s => (s.data[s.data.length - 1] || [])[1]).toString();
    return prevOld1 === prevOld
        && prevOld === lastOld
        && lastOld === newOnes;
}

function optimiseData(series) {
    series.forEach(datum => {
        const last = datum.data.pop();
        datum.data.pop(); // this one is thrown away
        datum.data.push(last);
    });
}

function optimiseLastData(dataArr) {
    if (dataArr.length <= 3) {
        return dataArr
    }
    const prevOld = dataArr[dataArr.length - 3][1];
    const lastOld = dataArr[dataArr.length - 2][1];
    const newOne = dataArr[dataArr.length - 1][1];
    const isNothingNew = prevOld === lastOld && lastOld === newOne;
    if (isNothingNew) {
        const last = dataArr.pop();
        dataArr.pop(); // this one is thrown away
        dataArr.push(last);
    }
    return dataArr
}
