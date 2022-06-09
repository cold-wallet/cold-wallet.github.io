import axios from "axios";
import Binance from 'binance-api-node'
import Spot from './connector/spot'

const binanceApiUrl = "https://api.binance.com";
const binanceFuturesApiUrl = "https://dapi.binance.com";
const proxyUrl = "https://ntrocp887e.execute-api.eu-central-1.amazonaws.com/prod/binance";

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
    getUserInfo(key, secret, resultConsumer, onError) {
        const spotClient = Binance({
            apiKey: key,
            apiSecret: secret,
            httpBase: proxyUrl,
        })

        spotClient.futuresAccountInfo({recvWindow: 30000, useServerTime: true}).then(e => {
            console.log("futuresAccountInfo", e)
        })
        spotClient.futuresAccountBalance({recvWindow: 30000, useServerTime: true})
            .then(e => {
                console.log("futures", e)
                e.filter(f => +f.balance)
                    .forEach(f => console.log("future " + f.asset, f))
            })
            .catch(onError);
        const client = new Spot(key, secret, {baseURL: proxyUrl})
        const futuresClient = new Spot(key, secret, {baseURL: binanceFuturesApiUrl})
        futuresClient.futuresCoinMBalance().then(response => {
            console.log("futures COIN-M balances", response.data)
            response.data.filter(balance => +balance.balance)
                .forEach(balance => console.log("futures COIN-M balance " + balance.asset, balance))
        })
        client.isolatedMarginAccountInfo().then(response => {
            console.log("margin isolated", response.data)
            response?.data?.assets
                ?.reduce((arr, o) => {
                    arr.push(o.baseAsset)
                    arr.push(o.quoteAsset)
                    return arr;
                }, [])
                .filter(p => +p.netAsset)
                .forEach(position => console.log("margin isolated " + position.asset, position))
        })
        client.marginAccount().then(response => {
            console.log("margin cross", response.data)
            response?.data?.userAssets?.filter(p => +p.netAsset)
                .forEach(position => console.log("margin cross " + position.asset, position))
        })
        client.fundingWallet().then(response => {
            console.log("fundingWallet", response.data)
            response.data.filter(asset => +asset.free)
                .forEach(asset => console.log("funding " + asset.asset, asset))
        })
        /*`STAKING`,`F_DEFI`,`L_DEFI`*/
        client.stakingProductPosition('STAKING').then(response => {
            console.log("stakingProductPosition STAKING", response.data)
        })
        client.stakingProductPosition('F_DEFI').then(response => {
            console.log("stakingProductPosition F_DEFI", response.data)
        })
        client.stakingProductPosition('L_DEFI').then(response => {
            console.log("stakingProductPosition L_DEFI", response.data)
        })
        client.bswapUnclaimedRewards(0).then(response => {
            console.log("bswapUnclaimedRewards Swap rewards", response.data)
        })
        client.bswapUnclaimedRewards(1).then(response => {
            console.log("bswapUnclaimedRewards Liquidity rewards", response.data)
        })
        client.bswapLiquidity().then(response => {
            console.log("bswapLiquidity", response.data)
            response.data.filter(data => +data.share.shareAmount)
                .reduce((arr, o) => {
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
                .forEach(data => console.log("bswapLiquidity " + data.description, data))
        })
        client.savingsAccount().then(response => {
            console.log("savingsAccount", response.data)
            response.data.positionAmountVos?.filter(p => +p.amount)
                .forEach(position => {
                    client.savingsFlexibleProductPosition(position.asset)
                        .then(response => {
                            console.log("saving flexible " + position.asset, response.data)
                            return client.savingsCustomizedPosition(position.asset)
                        })
                        .then(response => {
                            if (!response.data || (response.data.__proto__ === [].__proto__ && !response.data.length)) {
                                return
                            }
                            console.log("saving fixed " + position.asset, response.data)
                        })
                })
        })
        // client.savingsFlexibleProductPosition('USDT').then(response => console.log("savingsFlexibleProductPosition USDT", response.data))
        // client.savingsFlexibleProductPosition('BUSD').then(response => console.log("savingsFlexibleProductPosition BUSD", response.data))
        // client.isolatedMarginAccountInfo().then(response => console.log("isolatedMarginAccountInfo", response.data))
    }
};

export default binanceApiClient
