import noExponents from "./noExponents";

export default function numberFormat(fixMe, afterDecimalPoint) {
    fixMe = noExponents(fixMe);
    if (afterDecimalPoint === 0) {
        return Math.round(fixMe)
    }
    fixMe = "" + fixMe;
    if (fixMe.indexOf(".") >= 0) {
        const [left, right] = fixMe.split(/[.]/gi);
        if (right.length > afterDecimalPoint) {
            fixMe = left + "." + right.slice(0, afterDecimalPoint)
        }
    }
    return +noExponents(fixMe)
}

export function numberFormatByType(fixMe, type) {
    fixMe = "" + noExponents(fixMe);
    if (fixMe.indexOf(".") >= 0) {
        const [left, right] = fixMe.split(/[.]/gi);
        const afterDecimalPoint = type === "crypto" ? 8 : 2;
        if (right.length > afterDecimalPoint) {
            fixMe = left + "." + right.slice(0, afterDecimalPoint)
        }
    }
    return +noExponents(fixMe)
}
