export class CacheError extends Error {
    /* istanbul ignore next */
    constructor(msg: string) {
        super(`<R-Cache> ${msg}`)
        this.name = 'CacheError'
    }
}
