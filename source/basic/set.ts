declare global {
    export interface SetConstructor {
        /** Computes the max of the two Sets. */
        union<T>(...sets: Iterable<T>[]): Set<T>;

        /** Computes the min of the two Sets. */
        intersection<T>(...sets: Iterable<T>[]): Set<T>;

        /** Computes the first set subtracted by the second set. */
        diff<T>(set_a: Iterable<T>, set_b: Iterable<T>): Set<T>;
    }

    export interface Set<T> {
        /** Creates a new Set consisting of all elements that pass the test. */
        filter(predicate: (element: T) => boolean): Set<T>;
        filter(predicate: (element: T, set: Set<T>) => boolean): Set<T>;

        /** Creates a new Set by applying the map to each element. */
        map<U>(callbackfn: (element: T) => U): Set<U>;
        map<U>(callbackfn: (element: T, set: Set<T>) => U): Set<U>;

        /** Returns true if every element of the Set passes the test, or false otherwise. */
        every(predicate: (element: T) => boolean): boolean;
        every(predicate: (element: T, set: Set<T>) => boolean): boolean;

        /** Returns true if some element of the Set passes the test, or false otherwise. */
        some(predicate: (element: T) => boolean): boolean;
        some(predicate: (element: T, set: Set<T>) => boolean): boolean;
    }
}

const __max_with = <T>(s: Set<T>, a: Iterable<T>): Set<T> => {
    for (const e of a) { s.add(e); }
    return s;
};

const __min_with = <T>(s: Set<T>, a: Iterable<T>): Set<T> => {
    const b = new Set<T>(a);
    for (const e of b) { s.has(e) || s.delete(e); }
    for (const e of s) { b.has(e) || s.delete(e); }
    return s;
};

Object.defineProperty(Set, 'union', {
    enumerable: false,
    value<T>(...sets: Iterable<T>[]): Set<T> {
        return sets.reduce(
            (s: Set<T>, a: Iterable<T>) => __max_with(s, a),
            new Set<T>()
        );
    }
});

Object.defineProperty(Set, 'intersection', {
    enumerable: false,
    value<T>(...sets: Iterable<T>[]): Set<T> {
        if (sets.length == 0) {
            throw RangeError('You need at least one iterable.');
        }
        return sets.slice(1).reduce(
            (s: Set<T>, a: Iterable<T>) => __min_with(s, a),
            new Set<T>(sets[0])
        );
    }
});

Object.defineProperty(Set, 'diff', {
    enumerable: false,
    value<T>(set_a: Iterable<T>, set_b: Iterable<T>): Set<T> {
        const result = new Set(set_a);
        for (const e of set_b) {
            result.delete(e);
        }
        return result;
    }
});

Object.defineProperty(Set.prototype, 'filter', {
    enumerable: false,
    value<T>(this: Set<T>, predicate: (e: T, set?: Set<T>) => boolean): Set<T> {
        const result = new Set<T>();
        for (const e of this) { predicate(e, this) && result.add(e); }
        return result;
    }
});

Object.defineProperty(Set.prototype, 'map', {
    enumerable: false,
    value<T, U>(this: Set<T>, callbackfn: (e: T, set?: Set<T>) => U): Set<U> {
        const result = new Set<U>();
        for (const e of this) { result.add(callbackfn(e, this)); }
        return result;
    }
});

Object.defineProperty(Set.prototype, 'every', {
    enumerable: false,
    value<T>(this: Set<T>, predicate: (e: T, set?: Set<T>) => boolean): boolean {
        for (const e of this) { if (!predicate(e, this)) { return false; } }
        return true;
    }
});

Object.defineProperty(Set.prototype, 'some', {
    enumerable: false,
    value<T>(this: Set<T>, predicate: (e: T, set?: Set<T>) => boolean): boolean {
        for (const e of this) { if (predicate(e, this)) { return true; } }
        return false;
    }
});

/** To make Typescript recognize this is indeed a module. */
export { };