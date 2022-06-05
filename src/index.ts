function wrapPromise<T, E = Error>(promise: Promise<T>): Promise<[E, undefined] | [null, T]> {
    return promise.then<[null, T]>((result: T) => [null, result]).catch<[E, undefined]>((err: E) => [err, undefined]);
}

export { wrapPromise };
export * from './types';
