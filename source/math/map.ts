/**
 * @module map_set
 */

import { } from './set';

type mergeable<Key, Value> = Value | Set<Value> | Map<Key, Value>;

/** Static properties of Map */
declare global {
    export interface MapConstructor {
        /** Merge two collection-valued Maps. */
        merge<K, K2, V>(x: Map<K, mergeable<K2, V>>, y: Map<K, mergeable<K2, V>>): Map<K, mergeable<K2, V>>;
    }
}

function map_merge<K, V>(x: Map<K, V>, y: Map<K, V>): Map<K, V>;
function map_merge<K, V>(x: Map<K, Set<V>>, y: Map<K, Set<V>>): Map<K, Set<V>>;
function map_merge<K, K2, V>(x: Map<K, Map<K2, V>>, y: Map<K, Map<K2, V>>): Map<K, Map<K2, V>>;
function map_merge<K, K2, V>(x: Map<K, mergeable<K2, V>>, y: Map<K, mergeable<K2, V>>) {
    const result = new Map(x);

    for (const [a, b] of x.entries()) {
        result.set(a, b);
    }
    for (const [a, b2] of y.entries()) {
        if (result.has(a)) {
            const b1 = result.get(a);
            if (b2 instanceof Set<V> && b1 instanceof Set<V>) {
                result.set(a, Set.union<V>(b1, b2));
            }
            else if (b2 instanceof Map<K2, V> && b1 instanceof Map<K2, V>) {
                result.set(a, map_merge<K2, V>(b1, b2));
            }
            else {
                /** Overrided! */
                result.set(a, b2);
            }
        }
        else {
            result.set(a, b2);
        }
    }

    return result;
}

Object.defineProperty(Map, 'merge', {
    value: map_merge,
    enumerable: false
});


/** Local properties of Map */
declare global {
    export interface Map<K, V> {
        /** Creates a new Map consisting of all key-value pairs that pass the test. */
        filter(test: (key: K, value: V, map?: Map<K, V>) => boolean): Map<K, V>;
        /** Creates a new Map by applying the map to each value of the key-value pair. */
        map<W>(transform: (key: K, value: V, map?: Map<K, V>) => W): Map<K, W>;
        /** Clears empty keys. */
        clearEmptyKeys(): Map<K, V>;
    }
}

const map_filter = function <K, V>(this: Map<K, V>, test: (key: K, value: V, map?: Map<K, V>) => boolean): Map<K, V> {
    const result = new Map<K, V>();
    for (const [key, value] of this) {
        if (test(key, value, this)) {
            result.set(key, value);
        }
    }
    return result;
};

const map_map = function <K, V, W>(this: Map<K, V>, transform: (key: K, value: V, map?: Map<K, V>) => W): Map<K, W> {
    const result = new Map<K, W>();
    for (const [key, value] of this) {
        result.set(key, transform(key, value, this));
    }
    return result;
};

const map_clear_empty_keys = function <K, V>(this: Map<K, V>): Map<K, V> {
    const result = new Map<K, V>();
    for (const [key, value] of this) {
        if (typeof value == 'undefined') {
            continue;
        }
        else if (value instanceof Set && value.size == 0) {
            continue;
        }
        else if (value instanceof Map && value.size == 0) {
            continue;
        }
        result.set(key, value);
    }
    return result;
};

Object.defineProperty(Map.prototype, 'filter', {
    value: map_filter,
    enumerable: false
});

Object.defineProperty(Map.prototype, 'map', {
    value: map_map,
    enumerable: false
});

Object.defineProperty(Map.prototype, 'clearEmptyKeys', {
    value: map_clear_empty_keys,
    enumerable: false
});


/** Make typescript recognize this as a module. */
export {};