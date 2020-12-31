/* 
    Using custom errors in typescript is currently buggy. 
    The code in this file works around this issue. 
    See: https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work 
*/
export class StorageError extends Error {
    /* istanbul ignore next */
    constructor(msg: string) {
        super(`<R-Cache> ${msg}`)
        this.name = 'StorageError'
        Object.setPrototypeOf(this, StorageError.prototype)
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
