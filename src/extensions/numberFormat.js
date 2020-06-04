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
