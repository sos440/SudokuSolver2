/**
 * @module map_set
 */


/** Static properties of Set */
declare global {
    export interface SetConstructor {
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
    export interface Set<T> {
        /** Creates a new Set consisting of all elements that pass the test. */
        filter(test: (e: T, set?: Set<T>) => boolean): Set<T>;
        /** Creates a new Set by applying the map to each element. */
        map<U>(transform: (e: T, set?: Set<T>) => U): Set<U>;
        /** Loops through the family of subsets of the specified size. */
        subsets(size: number, prev_set?: Set<T>, prev_list?: T[]): Generator<Set<T>>;
        /** Returns true if every element of the Set passes the test, or false otherwise. */
        every(this: Set<T>, test: (e: T, set?: Set<T>) => boolean): boolean;
        /** Returns true if some element of the Set passes the test, or false otherwise. */
        some(this: Set<T>, test: (e: T, set?: Set<T>) => boolean): boolean;
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

const set_subsets = function* <T>(this: Set<T>, size: number, prev_set?: Set<T>, prev_list?: T[]): Generator<Set<T>> {
    if (size > this.size || size < 0) {
        return;
    }
    else if (size == 0) {
        yield new Set<T>();
        return;
    }
    else if (size == this.size) {
        yield new Set<T>(this);
        return;
    }

    prev_list = prev_list ?? [...this.values()];
    for (let i = 0; i < prev_list.length; i++) {
        const cur_set = new Set<T>(prev_set).add(prev_list[i]);
        if (size == 1) {
            yield cur_set;
        }
        else {
            yield* this.subsets(size - 1, cur_set, prev_list.slice(i + 1));
        }
    }
};

const set_every = function <T>(this: Set<T>, test: (e: T, set?: Set<T>) => boolean): boolean {
    for (const e of this) {
        if (!test(e, this)) {
            return false;
        }
    }
    return true;
};

const set_some = function <T>(this: Set<T>, test: (e: T, set?: Set<T>) => boolean): boolean {
    for (const e of this) {
        if (test(e, this)) {
            return true;
        }
    }
    return false;
};

Object.defineProperty(Set.prototype, 'filter', {
    value: set_filter,
    enumerable: false
});

Object.defineProperty(Set.prototype, 'map', {
    value: set_map,
    enumerable: false
});

Object.defineProperty(Set.prototype, 'subsets', {
    value: set_subsets,
    enumerable: false
});

Object.defineProperty(Set.prototype, 'every', {
    value: set_every,
    enumerable: false
});

Object.defineProperty(Set.prototype, 'some', {
    value: set_some,
    enumerable: false
});


/** To make Typescript recognize this is indeed a module. */
export {};