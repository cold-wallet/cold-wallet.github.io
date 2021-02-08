import axios from "axios";
import Binance from 'node-binance-api';

const binanceApiUrl = "https://api.binance.com";
const client = new Binance();

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
        client
            .options({
                APIKEY: key,
                APISECRET: secret,
                useServerTime: true,
                reconnect: false,
                verbose: true,
            })
            .balance()
            .then(resultConsumer)
            .catch(onError);
    }
};

export default binanceApiClient
