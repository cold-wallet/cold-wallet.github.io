import APIBase from "./APIBase";
import modules from "./modules";
import {flowRight} from "./helpers/utils";

class Spot extends flowRight(...Object.values(modules))(APIBase) {
    constructor(apiKey = '', apiSecret = '', options = {}) {
        options.baseURL = options.baseURL || 'https://api.binance.com'
        super({
            apiKey,
            apiSecret,
            ...options
        })
    }
}

export default Spot
