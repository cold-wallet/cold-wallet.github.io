import currencies from "../resources/currencies-iso-4217";
import currencyCodes from "../resources/currencies-iso-4217-code";

export default {
    getByStringCode(code) {
        return currencies[code]
    },
    getByNumCode(code) {
        return currencyCodes[code]
    },
}
