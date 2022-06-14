const {isEmptyValue} = require('./utils')

export const validateRequiredParameters = paramObject => {
    if (!paramObject || isEmptyValue(paramObject)) {
        throw new Error("missing parameters")
    }
    const emptyParams = []
    Object.keys(paramObject).forEach(param => {
        if (isEmptyValue(paramObject[param])) {
            emptyParams.push(param)
        }
    })
    if (emptyParams.length) {
        throw new Error(`One or more of required parameters is missing: ${emptyParams.slice().join(', ')}`)
    }
}

export const hasOneOfParameters = paramObject => {
    if (!paramObject || isEmptyValue(paramObject)) {
        throw new Error("missing parameters")
    }
    const params = Object.values(paramObject)
    if (params.every(isEmptyValue)) {
        throw new Error(`One or more of required parameters is missing: ${Object.keys(paramObject).slice().join(', ')}`)
    }
}
