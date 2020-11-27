export class CacheError extends Error {
    /* istanbul ignore next */
    constructor(msg: string) {
        super(`<R-Cache> ${msg}`)
        this.name = 'CacheError'
        Object.setPrototypeOf(this, CacheError.prototype)
    }
}

export class ValueError extends Error {
    /* istanbul ignore next */
    constructor(msg: string) {
        super(`<R-Cache> ${msg}`)
        this.name = 'ValueError'
        Object.setPrototypeOf(this, ValueError.prototype)
    }
}
