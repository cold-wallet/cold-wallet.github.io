import currenciesJson from "../resources/currencies-iso-4217";
import currencyCodes from "../resources/currencies-iso-4217-code";

const currencies = {
    getByStringCode(code) {
        return currenciesJson[code]
    },
    getByNumCode(code) {
        const currencyCodeLength = 3;
        const strCode = "" + code;
        let addZeros = currencyCodeLength - strCode.length;

        while (addZeros > 0) {
            code = "0" + code;
            --addZeros
        }
        let res = currencyCodes[code];
        if (!res) {
            console.warn("can't find currency data for code", code)
        }
        return res
    },
}

export default currencies;
