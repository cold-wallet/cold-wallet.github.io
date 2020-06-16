import assetsRepository from "./assetsRepository";
import settingsRepository from "../repo/SettingsRepository";
import monobankUserDataRepository from "../repo/MonobankUserDataRepository";
import currencies from "../extensions/currencies";
import AssetDTO from "../components/AssetDTO";

const assetsService = {
    getCurrentAssets() {
        const storedData = assetsRepository.getLatest();
        return {
            assets: extractAssets(storedData.assets),
        }
    },
    subscribeOnChange(consumer) {
        assetsRepository.subscribeOnChange(state => consumer({
            assets: extractAssets(state.assets),
        }))
    },
    save(state) {
        assetsRepository.save(state)
    }
};

monobankUserDataRepository.subscribeOnChange(__ => {
    assetsService.save(assetsService.getCurrentAssets())
});

function extractAssets(assets) {
    const settings = settingsRepository.getLatest();
    if (settings.integrations.monobank.monobankIntegrationEnabled) {
        const monobankUserInfo = monobankUserDataRepository.getLatest();
        if (monobankUserInfo && monobankUserInfo.accounts) {
            let monobankAssets = monobankUserInfo.accounts.map(account => {
                const currency = currencies.getByNumCode(account.currencyCode).code;
                const name = `monobank ${currency} ${account.maskedPan[0]} ${account.type}`;
                return new AssetDTO(
                    'fiat',
                    account.balance / 100,
                    currency,
                    name,
                    name,
                    account.id,
                );
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
    return assets
}

export default assetsService
