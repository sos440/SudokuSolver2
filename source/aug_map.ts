/**
 * @module aug_map
 */


/**
 * Represents Map augmented with .aget method.
 */
export interface AMap<K, V> extends Map<K, V> {
    /**
     * @returns {V} Returns the value corresponding to the key in the AMap, or returns the default value if key does not exist in the AMap.
     */
    aget(key: K): V;
}


/**
 * @returns AMap class.
 */
export const createAMapClass = <K, V>(default_value: V) => {
    return class __AMap extends Map<K, V> implements AMap<K, V> {
        aget(key: K): V {
            return this.get(key) ?? default_value;
        }
    };
}