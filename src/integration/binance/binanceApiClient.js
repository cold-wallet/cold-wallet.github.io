import axios from "axios";
import Binance from 'node-binance-api';

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
    getUserInfo(key, secret, resultConsumer, onError) {
        new Binance()
            .options({
                APIKEY: key,
                APISECRET: secret,
                useServerTime: true,
                reconnect: false,
                verbose: true,
                urls: {
                    base: "https://ntrocp887e.execute-api.eu-central-1.amazonaws.com/prod/binance/"
                }
            })
            .balance()
            .then(resultConsumer)
            .catch(onError);
    }
};

export default binanceApiClient
