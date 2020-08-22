import axios from 'axios';

const soChainBaseUrl = "https://sochain.com";

const supportedSochainApiCoins = [
    'BTC', 'LTC', 'DASH', 'ZCASH', 'DOGE',
];

const cryptoApi = {
    checkAddress(currencyCode, addressValue) {
        if (this.isAddressSupportedFor(currencyCode)) {
            return this.getBalance(currencyCode, addressValue)
        }
        return false
    },
    isAddressSupportedFor(currencyCode) {
        return !!supportedSochainApiCoins.find(c => c === currencyCode)
    },
    async getBalance(currencyCode, address) {
        const response = await axios
            .get(
                `${soChainBaseUrl}/api/v2/address/${currencyCode.toLowerCase()}/${address}`
            )
            .then(response => {
                if (response && (response.status === 200) && response.data) {
                    return response.data
                } else {
                    throw response
                }
            })
            .catch(console.error);

        console.log("response", response.data);
        return +(response.data.balance)
    }
};

export default cryptoApi

// cryptoApi.checkAddress('BTC', 'bc1q6wuepxr0fz75kam2q5r5e2vuw9vpjlaazzzk2j')
//     .then(console.log).catch(console.log);

