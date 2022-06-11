import Spot from "./connector/spot";
import BinanceApi, {
    Account,
    Binance,
    FuturesBalanceResult,
    IsolatedAsset,
    IsolatedAssetSingle,
    IsolatedMarginAccount
} from "binance-api-node";

const binanceFuturesApiUrl = "https://dapi.binance.com";
const proxyUrl = "https://ntrocp887e.execute-api.eu-central-1.amazonaws.com/prod/binance";

export interface Response<T> {
    data: T
}

export interface FuturesAssetCoinM {
    accountAlias: string // "XqAuFzAuAuXq"
    asset: string // "BNB"
    availableBalance: string // "0.00000001"
    balance: string // "0.00000001"
    crossUnPnl: string // "0.00000000"
    crossWalletBalance: string // "0.00000001"
    updateTime: number // 1654974424727
    withdrawAvailable: string // "0.00000001"
}

export interface CrossMarginAsset {
    asset: string // "AGLD"
    borrowed: string // "0"
    free: string // "0"
    interest: string // "0"
    locked: string // "0"
    netAsset: string // "0"
}

export interface CrossMarginAccount {
    borrowEnabled: boolean
    marginLevel: string // "999"
    totalAssetOfBtc: string // "0"
    totalLiabilityOfBtc: string // "0"
    totalNetAssetOfBtc: string // "0"
    tradeEnabled: boolean
    transferEnabled: boolean
    userAssets: CrossMarginAsset[]
}

class BinanceApiService {

    futuresClient: Spot
    client: Spot
    spotClient: Binance

    constructor(key: string, secret: string) {
        this.futuresClient = new Spot(key, secret, {baseURL: binanceFuturesApiUrl})
        this.client = new Spot(key, secret, {baseURL: proxyUrl})
        this.spotClient = BinanceApi({
            apiKey: key,
            apiSecret: secret,
            httpBase: proxyUrl,
        })
    }

    accountInfo(): Promise<Account> {
        return this.spotClient.accountInfo()
    }

    futuresBalancesUsdM(): Promise<FuturesBalanceResult[]> {
        return this.spotClient.futuresAccountBalance()
            .then((balances: FuturesBalanceResult[]) => {
                return balances.filter(f => +f.balance)
            })
    }

    futuresBalancesCoinM(): Promise<FuturesAssetCoinM[]> {
        return this.futuresClient.futuresCoinMBalance()
            .then((response: Response<FuturesAssetCoinM[]>) => response.data)
            .then((futures: FuturesAssetCoinM[]) => {
                return futures.filter((f: FuturesAssetCoinM) => +f.balance)
            })
    }

    isolatedMarginAssets(): Promise<IsolatedAssetSingle[]> {
        return this.spotClient.marginIsolatedAccount()
            .then((account: IsolatedMarginAccount) => account.assets
                .reduce((arr: IsolatedAssetSingle[], account: IsolatedAsset) => {
                    arr.push(account.baseAsset)
                    arr.push(account.quoteAsset)
                    return arr;
                }, [])
                .filter(p => +p.netAsset))
    }

    crossMarginAssets(): Promise<CrossMarginAsset[]> {
        return this.client.marginAccount().then((response: Response<CrossMarginAccount>) => {
            return response.data.userAssets.filter((p) => +p.netAsset)
        })
    }

    fundingAssets(): Promise<FundingAsset[]> {
        return this.client.fundingWallet().then((response: Response<FundingAsset[]>) => {
            return response.data.filter((asset) => +asset.free)
        })
    }
}

export interface FundingAsset {
    asset: string // "USDC"
    btcValuation: string // "0"
    free: string // "0.00000001"
    freeze: string // "0"
    locked: string // "0"
    withdrawing: string // "0"
}

export default BinanceApiService
