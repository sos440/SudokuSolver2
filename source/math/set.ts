/**
 * @module map_set
 */


/** Static properties of Set */
declare global {
    interface SetConstructor {
        /** Computes the union of the two Sets. */
        union<T>(...sets: Set<T>[]): Set<T>;
        /** Computes the intersection of the two Sets. */
        intersection<T>(...sets: Set<T>[]): Set<T>;
        /** Computes the first set subtracted by the second set. */
        diff<T>(set_a: Set<T>, set_b: Set<T>): Set<T>;
    }
}

const set_union = function <T>(...sets: Set<T>[]): Set<T> {
    if (sets.length == 0) {
        return new Set<T>();
    }
    else if (sets.length == 1) {
        return new Set<T>(sets[0]);
    }
    else if (sets.length == 2) {
        const [set_a, set_b] = (sets[0].size > sets[1].size) ? sets : sets.reverse();
        const result = new Set<T>(set_a);
        for (const e of set_b) {
            result.add(e);
        }
        return result;
    }
    else {
        return set_union(set_union(...sets.slice(0, 2)), ...sets.slice(2));
    }
};

const set_intersection = function <T>(...sets: Set<T>[]): Set<T> {
    if (sets.length == 0) {
        throw RangeError(`Set intersection requires at least one set.`);
    }
    else if (sets.length == 1) {
        return new Set<T>(sets[0]);
    }
    else if (sets.length == 2) {
        const [set_a, set_b] = (sets[0].size < sets[1].size) ? sets : sets.reverse();
        const result = new Set<T>(set_a);
        for (const e of set_a) {
            if (!set_b.has(e)) {
                result.delete(e);
            }
        }
        return result;
    }
    else {
        return set_intersection(set_intersection(...sets.slice(0, 2)), ...sets.slice(2));
    }
}

const set_difference = function <T>(set_a: Set<T>, set_b: Set<T>): Set<T> {
    const result = new Set(set_a);
    for (const e of set_b) {
        result.delete(e);
    }
    return result;
}

Object.defineProperty(Set, 'union', {
    value: set_union,
    enumerable: false
});

Object.defineProperty(Set, 'intersection', {
    value: set_intersection,
    enumerable: false
});

Object.defineProperty(Set, 'diff', {
    value: set_difference,
    enumerable: false
});


/** Local properties of Set */
declare global {
    interface Set<T> {
        /** Creates a new Set consisting of all elements that pass the test. */
        filter(test: (e: T, set?: Set<T>) => boolean): Set<T>;
        /** Creates a new Set by applying the map to each element. */
        map<U>(transform: (e: T, set?: Set<T>) => U): Set<U>;
    }
}

const set_filter = function <T>(this: Set<T>, test: (e: T, set?: Set<T>) => boolean): Set<T> {
    const result = new Set<T>();
    for (const e of this) {
        if (test(e, this)) {
            result.add(e);
        }
    }
    return result;
};

const set_map = function <T, U>(this: Set<T>, transform: (e: T, set?: Set<T>) => U): Set<U> {
    const result = new Set<U>();
    for (const e of this) {
        result.add(transform(e, this));
    }
    return result;
};

Object.defineProperty(Set.prototype, 'filter', {
    value: set_filter,
    enumerable: false
});

Object.defineProperty(Set.prototype, 'map', {
    value: set_map,
    enumerable: false
});


/** To make Typescript recognize this is indeed a module. */
export { };