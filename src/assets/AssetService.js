import assetsRepository from "./assetsRepository";
import settingsRepository from "../settings/SettingsRepository";
import monobankUserDataRepository from "../integration/monobank/MonobankUserDataRepository";
import binanceUserDataRepository from "../integration/binance/BinanceUserDataRepository";
import currencies from "../extensions/currencies";
import AssetDTO from "./AssetDTO";
import compareStrings from "../extensions/compareStrings";
import ratesClient from "../integration/ratesClient";

const assetsService = {
    getCurrentAssets() {
        const storedData = assetsRepository.getLatest();
        return {
            assets: extractAssets(storedData.assets),
        }
    },
    subscribeOnChange(consumer) {
        try {
            assetsRepository.subscribeOnChange(state => consumer({
                assets: extractAssets(state.assets),
            }));
        } catch (e) {
            console.warn(e)
        }
    },
    save(state) {
        assetsRepository.save(state)
    }
};

monobankUserDataRepository.subscribeOnChange(__ => {
    assetsService.save(assetsService.getCurrentAssets())
});
binanceUserDataRepository.subscribeOnChange(__ => {
    assetsService.save(assetsService.getCurrentAssets())
});

function extractAssets(assets) {
    const settings = settingsRepository.getLatest();
    if (settings?.integrations?.monobank?.monobankIntegrationEnabled) {
        const monobankUserInfo = monobankUserDataRepository.getLatest();
        if (monobankUserInfo && monobankUserInfo.accounts) {
            let monobankAssets = monobankUserInfo.accounts
                .sort((a, b) => compareStrings(a.id, b.id))
                .map(account => {
                    const currency = currencies.getByNumCode(account.currencyCode).code;
                    const name = `monobank ${currency} ${account.maskedPan
                        ? (account.maskedPan[0] ? (account.maskedPan[0] + " ") : "")
                        : ""}${account.type}`;
                    return new AssetDTO(
                        'fiat',
                        (account.balance || 0) / 100,
                        currency,
                        name,
                        name,
                        account.id,
                        false,
                        true
                    )
                });
            const monobankAssetIds = monobankAssets.reduce((a, b) => {
                a[b.id] = true;
                return a
            }, {});
            const otherFiatAssets = assets.fiat.assets.filter(asset => !monobankAssetIds[asset.id]);
            monobankAssets = monobankAssets.filter(asset => asset.amount);
            assets.fiat.assets = [].concat(otherFiatAssets).concat(monobankAssets);
        }
    }
    if (settings?.integrations?.binance?.binanceIntegrationEnabled) {
        const binanceUserInfo = binanceUserDataRepository.getLatest();
        if (binanceUserInfo && binanceUserInfo.balances) {
            let accountAssets = Object.values(binanceUserInfo.accounts || {})
                .filter(arr => arr.length)
                .reduce((arr, account) => {
                    if (!account) {
                        return arr;
                    }
                    account.forEach(element => arr.push(element))
                    return arr;
                }, [])
                .sort((a, b) => compareStrings(a.asset, b.asset))
            let spotAssets = binanceUserInfo.balances
                .filter(balance => !(balance.asset.startsWith("LD") && balance.asset.length >= 5))
                .sort((a, b) => compareStrings(a.asset, b.asset))
                .map(balance => {
                    let currency = balance.asset;
                    let type = binanceUserInfo.accountType;
                    const name = `binance ${currency} ${type}`;
                    return new AssetDTO(
                        ratesClient.getCurrencyType(balance.asset),
                        (+balance.free) + (+balance.locked),
                        currency,
                        name,
                        name,
                        name,
                        true,
                        false
                    )
                });
            let binanceAssets = [].concat(spotAssets).concat(accountAssets)
                .sort((a, b) => compareStrings(a.asset, b.asset))
            let binanceFiatAsset = binanceAssets.filter(asset => asset.type === "fiat");
            const binanceFiatAssetIds = binanceFiatAsset.reduce((a, b) => {
                a[b.id] = true;
                return a
            }, {});
            let binanceCryptoAssets = binanceAssets.filter(asset => asset.type === "crypto");
            const binanceCryptoAssetIds = binanceCryptoAssets
                .reduce((a, b) => {
                    a[b.id] = true;
                    return a
                }, {});
            const otherFiatAssets = assets.fiat.assets.filter(
                asset => !binanceFiatAssetIds[asset.id] && !asset.isBinanceAsset
            );
            const otherCryptoAssets = assets.crypto.assets.filter(
                asset => !binanceCryptoAssetIds[asset.id] && !asset.isBinanceAsset
            );
            binanceFiatAsset = binanceFiatAsset.filter(asset => asset.amount);
            binanceCryptoAssets = binanceCryptoAssets.filter(asset => asset.amount);
            assets.fiat.assets = [].concat(otherFiatAssets).concat(binanceFiatAsset);
            assets.crypto.assets = [].concat(otherCryptoAssets).concat(binanceCryptoAssets);
        }
    }
    return assets
}

export default assetsService
