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

    fundingAssets(): Promise<FundingAsset[]> {
        return this.client.fundingWallet().then((response: Response<FundingAsset[]>) => {
            return response.data.filter((asset) => +asset.free)
        })
    }

    lockedStaking(): Promise<StakingPosition[]> {
        //`STAKING` - for Locked Staking
        return this.client.stakingProductPosition('STAKING').then((r: Response<StakingPosition[]>) => r.data)
    }

    lockedDeFiStaking(): Promise<StakingPosition[]> {
        //`L_DEFI` - for locked DeFi Staking
        return this.client.stakingProductPosition('L_DEFI').then((r: Response<StakingPosition[]>) => r.data)
    }

    flexibleDefiStaking(): Promise<StakingPosition[]> {
        //`F_DEFI` - for flexible DeFi Staking
        return this.client.stakingProductPosition('F_DEFI').then((r: Response<StakingPosition[]>) => r.data)
    }

    liquidityFarming(): Promise<LiquidityFarmingPool[]> {
        return this.client.bswapLiquidity().then((response: Response<LiquidityFarmingPool[]>) => {
            return response.data.filter((data) => +data.share.shareAmount)
                .reduce((arr: LiquidityFarmingPool[], o) => {
                    let keys = Object.keys(o.share.asset);
                    let first = {...o};
                    first.symbol = keys[0]
                    first.description = `${first.symbol} (${o.poolName})`
                    first.amount = o.share.asset[first.symbol]
                    let second = {...o};
                    second.symbol = keys[1]
                    second.description = `${second.symbol} (${o.poolName})`
                    second.amount = o.share.asset[second.symbol]
                    arr.push(first)
                    arr.push(second)
                    return arr;
                }, [])
        })
    }

    async savingsFixed(): Promise<SavingFixedPosition[]> {
        let client = this.client;
        let savingsAccount: Response<SavingAccount> = await client.savingsAccount();
        let values = savingsAccount.data.positionAmountVos
            .filter((p: SavingAsset) => +p.amount)
            .map(async (position) => {
                let response = await client.savingsCustomizedPosition(position.asset)
                if (!response.data || (!response.data.length)) {
                    return new Array<SavingFixedPosition>()
                }
                return response.data
            });
        let assets = await Promise.all(values);
        return assets
            .filter((value) => value.length)
            .reduce((arr, value) => {
                arr.push(value[0])
                return arr
            }, []);
    }

    async savingsFlexible(): Promise<SavingFlexiblePosition[]> {
        let client = this.client;
        let response = await client.savingsAccount();
        let values: Promise<SavingFlexiblePosition[]>[] = response.data.positionAmountVos
            ?.filter((p: SavingAsset) => +p.amount)
            .map(async (position: SavingAsset) => {
                let response = await client.savingsFlexibleProductPosition(position.asset);
                if (!response.data || (!response.data.length)) {
                    return []
                }
                return response.data
                // return await client.savingsFlexibleProductPosition(position.asset)
                //     .then((response: Response<SavingFlexiblePosition[]>) => {
                //         if (!response.data || (!response.data.length)) {
                //             return []
                //         }
                //         return response.data
                //     })
            });
        let promise = await Promise.all(values);

        return promise.filter((value) => value.length)
            .reduce((arr: SavingFlexiblePosition[], value: SavingFlexiblePosition[]) => {
                arr.push(value[0])
                return arr
            }, [])
        // return await client.savingsAccount()
        //     .then(async (response: Response<SavingAccount>) => {
        //         let values: Promise<SavingFlexiblePosition[]>[] = response.data.positionAmountVos
        //             ?.filter((p) => +p.amount)
        //             .map(async (position) => {
        //                 return await client.savingsFlexibleProductPosition(position.asset)
        //                     .then((response: Response<SavingFlexiblePosition[]>) => {
        //                         if (!response.data || (!response.data.length)) {
        //                             return []
        //                         }
        //                         return response.data
        //                     })
        //             });
        //         let promise = await Promise.all(values);
        //
        //         return promise.filter((value) => value.length)
        //             .reduce((arr: SavingFlexiblePosition[], value: SavingFlexiblePosition[]) => {
        //                 arr.push(value[0])
        //                 return arr
        //             }, [])
        //     })
    }
}

export interface Response<T> {
    data: T
}

export interface SavingFlexiblePosition {
    canRedeem: true
    annualInterestRate: string // "0.1"
    asset: string // "BUSD"
    avgAnnualInterestRate: string // "0.09999905"
    dailyInterestRate: string // "0.00027397"
    freeAmount: string // "5107.93758204"
    freezeAmount: string // "0"
    lockedAmount: string // "0"
    productId: string // "BUSD001"
    productName: string // "BUSD"
    redeemingAmount: string // "0"
    tierAnnualInterestRate: {
        [key: string]: string
    }
    // 0-2000BUSD: "0.10000000"
    // 2000-20000BUSD: "0.02000000"
    // >20000BUSD: "0.01000000"
    todayPurchasedAmount: string // "0.7181452"
    totalAmount: string // "5107.93758204"
    totalInterest: string // "13.89538537"
}

export interface SavingFixedPosition {
    asset: string // "USDT"
    canTransfer: boolean // true
    createTimestamp: number // 1654195447000
    duration: number // 30
    endTime: number // 1656806400000
    interest: string // "41.09589"
    interestRate: string // "0.05"
    lot: number // 100
    positionId: number // 2598969
    principal: string // "10000"
    projectId: string // "CUSDT30DAYSS001"
    projectName: string // "USDT"
    purchaseTime: number // 1654195448000
    redeemDate: string // "2022-07-03"
    startTime: number // 1654214400000
    status: string // "HOLDING"
    type: string // "CUSTOMIZED_FIXED"
}

export interface SavingAccount {
    positionAmountVos: SavingAsset[]
    totalAmountInBTC: string // "0.89371806"
    totalAmountInUSDT: string // "25116.5779009"
    totalFixedAmountInBTC: string // "0.3558"
    totalFixedAmountInUSDT: string // "10000"
    totalFlexibleInBTC: string // "0.53791806"
    totalFlexibleInUSDT: string // "15116.5779009"
}

export interface SavingAsset {
    amount: string // "20002"
    amountInBTC: string // "0.71587158"
    amountInUSDT: string // "20002"
    asset: string // "USDT"
}

export interface LiquidityFarmingPool extends LiquidityFarmingPosition {
    symbol: string // "USDT"
    description: string // "USDT (USDC/USDT)"
    amount?: string //
}

export interface LiquidityFarmingPosition {
    liquidity: {
        [key: string]: string
    }
    // USDC: "6287542.94500803"
    // USDT: "26500676.84738401"
    poolId: number // 5
    poolName: string // "USDC/USDT"
    share: {
        asset: {
            [key: string]: string
        }
        // USDC: "203.70012276"
        // USDT: "858.55336089"
        shareAmount: string // "500.58608303"
        sharePercentage: string // "0.00003239"
    }
    updateTime: number // 1655043494000
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

export interface StakingPosition {
    amount: string // "0.0001"
    apy: string // "0.0279"
    asset: string // "USDC"
    canRedeemEarly: boolean // true
    deliverDate: number // 1655200800000
    nextInterestPay: string // "0"
    nextInterestPayDate: number // 1655078400000
    payInterestPeriod: number // 1
    productId: string // "USDC*defi"
    redeemingAmt: string // "0"
    renewable: boolean // false
    rewardAmt: string // "0"
    rewardAsset: string // "USDC"
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
