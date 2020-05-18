export default function noExponents(fixME) {
    if (!fixME || !(+fixME) || String(fixME).toLowerCase().indexOf("e") === -1) {
        return fixME
    }

    let data = String(fixME).split(/[eE]/);
    if (data.length === 1) {
        return data[0];
    }

    let z = '';
    let sign = fixME < 0 ? '-' : '';
    let str = data[0].replace('.', '');
    let mag = Number(data[1]) + 1;

    if (mag < 0) {
        z = sign + '0.';
        while (mag++) z += '0';
        return z + str.replace(/^-/, '');
    }
    mag -= str.length;
    while (mag--) z += '0';
    return str + z;
};
