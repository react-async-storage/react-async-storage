export class CacheError extends Error {
    /* istanbul ignore next */
    constructor(msg: string) {
        super(`<R-Cache> ${msg}`)
        this.name = 'CacheError'
        // this is a fix for the notorious TS error inheritence problem
        // see: https://stackoverflow.com/questions/55065742/implementing-instanceof-checks-for-custom-typescript-error-instances
        Object.setPrototypeOf(this, CacheError.prototype)
    }
}

export class ValueError extends Error {
    /* istanbul ignore next */
    constructor(msg: string) {
        super(`<R-Cache> ${msg}`)
        this.name = 'ValueError'
        // this is a fix for the notorious TS error inheritence problem
        // see: https://stackoverflow.com/questions/55065742/implementing-instanceof-checks-for-custom-typescript-error-instances
        Object.setPrototypeOf(this, ValueError.prototype)
    }
}
