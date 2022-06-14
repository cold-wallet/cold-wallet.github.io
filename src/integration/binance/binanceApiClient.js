import axios from "axios";
import BinanceApiService from "./BinanceApiService";

const binanceApiUrl = "https://api.binance.com";

function extractResponse(onSuccess) {
    return response => {
        if (response && (response.status === 200)) {
            onSuccess(response)
        } else {
            throw response
        }
    };
}

const binanceApiClient = {
    fetchCryptoCurrencies(onSuccess, onError) {
        axios.get(binanceApiUrl + "/api/v3/exchangeInfo")
            .then(extractResponse(onSuccess))
            .catch(onError)
    },
    fetchLatestCryptoCurrenciesRates(onSuccess, onError) {
        axios.get(binanceApiUrl + "/api/v1/ticker/price")
            .then(extractResponse(onSuccess))
            .catch(onError)
    },
    async getUserInfoAsync(key, secret) {
        let binanceApiService = new BinanceApiService(key, secret);
        // spot account info
        let account = await binanceApiService.accountInfo();
        if (!account.accounts) {
            account.accounts = {};
        }
        try {
            account.accounts.marginIsolated = await binanceApiService.isolatedMarginAssets()
        } catch (e) {
            console.warn("failed to load isolatedMarginAssets from binance", e)
        }
        try {
            account.accounts.marginCross = await binanceApiService.crossMarginAssets()
        } catch (e) {
            console.warn("failed to load crossMarginAssets from binance", e)
        }
        try {
            account.accounts.futuresUsdM = await binanceApiService.futuresBalancesUsdM()
        } catch (e) {
            console.warn("failed to load futuresBalancesUsdM from binance", e)
        }
        try {
            account.accounts.futuresCoinM = await binanceApiService.futuresBalancesCoinM()
        } catch (e) {
            console.warn("failed to load futuresBalancesCoinM from binance", e)
        }
        try {
            account.accounts.funding = await binanceApiService.fundingAssets()
        } catch (e) {
            console.warn("failed to load fundingAssets from binance", e)
        }
        try {
            account.accounts.lockedStaking = await binanceApiService.lockedStaking()
        } catch (e) {
            console.warn("failed to load lockedStaking from binance", e)
        }
        try {
            account.accounts.lockedDeFiStaking = await binanceApiService.lockedDeFiStaking()
        } catch (e) {
            console.warn("failed to load lockedDeFiStaking from binance", e)
        }
        try {
            account.accounts.flexibleDefiStaking = await binanceApiService.flexibleDefiStaking()
        } catch (e) {
            console.warn("failed to load flexibleDefiStaking from binance", e)
        }
        try {
            account.accounts.liquidityFarming = await binanceApiService.liquidityFarming()
        } catch (e) {
            console.warn("failed to load liquidityFarming from binance", e)
        }
        try {
            account.accounts.savingsFixed = await binanceApiService.savingsFixed()
        } catch (e) {
            console.warn("failed to load savingsFixed from binance", e)
        }
        try {
            account.accounts.savingsFlexible = await binanceApiService.savingsFlexible()
        } catch (e) {
            console.warn("failed to load savingsFlexible from binance", e)
        }
        return account
    },
};

export default binanceApiClient
