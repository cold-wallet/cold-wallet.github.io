import axios from 'axios';

const soChainBaseUrl = "https://sochain.com";

// cryptoApi.checkAddress('BTC', 'bc1q6wuepxr0fz75kam2q5r5e2vuw9vpjlaazzzk2j')
//     .then(console.log).catch(console.log);

const cryptoApi = {
    async checkAddress(currencyCode, addressValue) {
        const supportedSochainApiCoins = [
            'BTC', 'LTC', 'DASH', 'ZCASH', 'DOGE',
        ];
        if (~supportedSochainApiCoins.indexOf(currencyCode)) {
            const response = await axios
                .get(
                    `${soChainBaseUrl}/api/v2/address/${currencyCode.toLowerCase()}/${addressValue}`
                )
                .then(response => {
                    if (response && (response.status === 200) && response.data) {
                        return response.data
                    } else {
                        throw response
                    }
                })
                .catch(console.error);

            console.log("response", response);
            return response.data
        }
        return false
    },
};

export default cryptoApi
