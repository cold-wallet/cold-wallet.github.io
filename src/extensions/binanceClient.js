import Binance from 'binance-api-node'

let _client;

function getClient(apiKey, apiSecret) {
    return _client || (_client = Binance({
        apiKey,
        apiSecret
    }))
}

const binanceClient = {
    getAccountData(apiKey, apiSecret) {
        return getClient(apiKey, apiSecret).accountInfo()
    }
};

export default binanceClient
