import axios from "axios";

const baseUrl = "https://api.monobank.ua";

const monobankApiClient = {

    getUserInfo(token, onUserInfo, onError) {
        axios
            .get(baseUrl + "/personal/client-info", {
                headers: {
                    "X-Token": token,
                }
            })
            .then(response => {
                let userInfo;
                if (response
                    && (response.status === 200)
                    && (userInfo = response.data)
                    && !userInfo.errorDescription
                    && userInfo.name
                    && userInfo.accounts
                ) {
                    onUserInfo(userInfo)
                } else {
                    console.warn("Fetching latest rates failed", response);
                    throw response
                }
            })
            .catch(onError)
    },
}

export default monobankApiClient;
