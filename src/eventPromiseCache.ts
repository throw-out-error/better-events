/**
 * Cache eventPromises
 * @param source
 * @param cacheProp
 * @param {string} eventName - The name of the event.
 * @param {function} fn - The inner function for the promise.
 */
export function eventPromiseCache(
    source: Record<string, unknown>,
    cacheProp: string,
    eventName: string,
    fn
) {
    if (!source[cacheProp]) source[cacheProp] = {};

    const cache = source[cacheProp];
    if (!cache[eventName])
        cache[eventName] = new Promise((resolve, reject) => {
            function deleteAnd(fn) {
                // delete wrapper
                return (result) => {
                    delete cache[eventName];
                    fn(result);
                };
            }

            fn(deleteAnd(resolve), deleteAnd(reject));
        });

    return cache[eventName];
}
