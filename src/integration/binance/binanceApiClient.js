import axios from "axios";
import Binance from 'binance-api-node'

const binanceApiUrl = "https://api.binance.com";
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
        const client = Binance({
            apiKey: key,
            apiSecret: secret,
            httpBase: proxyUrl,
        })
        client.accountInfo({recvWindow: 30000, useServerTime: true})
            .then(resultConsumer)
            .catch(onError)
    }
};

export default binanceApiClient
