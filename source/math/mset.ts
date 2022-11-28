/**
 * @module multiset
 * Refactored and optimized.
 */

type Callback<V, R> =
    ((e: V) => R) |
    ((e: V, m: number) => R) |
    ((e: V, m: number, cur_mset: MSet<V>) => R);

type MSetLike<V> = MSet<V> | Iterable<V>;

/** Represents multisets (with multiplicites taking integer values). */
export class MSet<V> extends Map<V, number> {
    constructor(e_iter?: MSetLike<V>) {
        super();
        if (e_iter instanceof MSet<V>) {
            for (const [e, m] of e_iter) { this.set(e, m); }
        }
        else if (e_iter) {
            for (const e of e_iter) { this.add(e); }
        }
    }

    /** Counts the sum of multiplicites in the MSet. */
    get count(): number {
        let c = 0;
        for (const m of this.values()) { c += m; }
        return c;
    }

    /** Computes the sum of multiplicites over the given set of elements. */
    sum(eset: Iterable<V>): number {
        let c = 0;
        for (const e of eset) { c += this.get(e) ?? 0; }
        return c;
    }

    /** Returns the "first" element of the MSet. */
    first(): V | undefined {
        return this.keys().next().value;
    }

    /**
     * Removes all the occurrences of the element from the MSet.
     * This is inherited from Map class.
     * @method delete
     */

    /** Returns the multiplicity of the element, or 0 if the element does not exist in MSet. */
    safeGet(e: V): number {
        return this.get(e) ?? 0;
    }

    /** Returns the multiplicity of the element, or 0 if the element does not exist in MSet. */
    safeSet(e: V, m: number): this {
        m ? this.set(e, m) : this.delete(e);
        return this;
    }

    /** Modifies the multiplicity of the element by the specified amount. */
    mod(e: V, dm: number): this {
        this.safeSet(e, (this.get(e) ?? 0) + dm);
        return this;
    }

    /** Eliminates elements with zero multiplicity. */
    trim(): MSet<V> {
        for (const [e, m] of this) { m || this.delete(e); }
        return this;
    }

    /** Adds an occurrence of the element to the MSet. */
    add(e: V): MSet<V> {
        return this.mod(e, 1);
    }

    /** Removes an occurrence of the element from the MSet. */
    remove(e: V): MSet<V> {
        return this.mod(e, -1);
    }

    /** Returns an iterator over the distinguished elements. */
    elements(): IterableIterator<V> {
        return this.keys();
    }

    /**
     * @returns {boolean} true if the test results in true for every distinguished element, or false if the test fails for some element.
     */
    every(callback: (e: V) => boolean): boolean;
    every(callback: (e: V, multi: number) => boolean): boolean;
    every(callback: (e: V, multi: number, cur_mset: MSet<V>) => boolean): boolean;
    every(callback: Callback<V, boolean>): boolean {
        for (const [e, m] of this) {
            if (!callback(e, m, this)) { return false; }
        }
        return true;
    }

    /**
     * @returns {boolean} true if the test results in true for some distinguished element, or false if the test fails for every element.
     */
    some(callback: (e: V) => boolean): boolean;
    some(callback: (e: V, multi: number) => boolean): boolean;
    some(callback: (e: V, multi: number, cur_mset: MSet<V>) => boolean): boolean;
    some(callback: Callback<V, boolean>): boolean {
        for (const [e, m] of this) {
            if (callback(e, m, this)) { return true; }
        }
        return false;
    }

    /** Creates a new MSet consiting of all elements passing the test. */
    filter(callback: Callback<V, boolean>): MSet<V> {
        const result = new MSet<V>();
        for (const [e, m] of this) {
            if (callback(e, m, this)) { result.set(e, m); }
        }
        return result;
    }

    /** Sanitizes the input and make it an MSet. */
    static sanitize<V>(mset: MSetLike<V>): MSet<V> {
        return (mset instanceof MSet<V>) ? (mset as MSet<V>) : new MSet(mset);
    }

    /** Tests whether every multiplicity is >= 0 */
    static geqZero<V>(mset: MSet<V>): boolean {
        for (const m of mset.values()) {
            if (m < 0) { return false; }
        }
        return true;
    }

    /** Tests whether mset1 >= mset2 or not. */
    static geq<V>(mset1: MSet<V>, mset2: MSet<V>): boolean {
        for (const [e1, m1] of mset1) {
            if (m1 < mset2.safeGet(e1)) { return false; }
        }
        for (const [e2, m2] of mset2) {
            if (mset1.safeGet(e2) < m2) { return false; }
        }
        return true;
    }

    /** Computes mset1 + mset2 + ... */
    static add<V>(...msets: MSetLike<V>[]): MSet<V> {
        if (msets.length == 0) { return new MSet<V>(); }
        const result = new MSet<V>(msets[0]);
        for (let i = 1; i < msets.length; i++) {
            for (const [e, m] of MSet.sanitize(msets[i])) { result.mod(e, m); }
        }
        return result;
    }

    /** Computes mset1 - mset2. */
    static diff<V>(mset1: MSetLike<V>, mset2: MSetLike<V>): MSet<V> {
        const result = new MSet<V>(mset1);
        for (const [e, m] of MSet.sanitize(mset2)) { result.mod(e, -m); }
        return result;
    }

    /** Computes the maximum of all MSet's. */
    static max<V>(...msets: MSetLike<V>[]): MSet<V> {
        if (msets.length == 0) { return new MSet<V>(); }
        const result = new MSet<V>(msets[0]);
        for (let i = 1; i < msets.length; i++) {
            const mset2 = MSet.sanitize(msets[i]);
            for (const [e, m] of mset2) {
                result.safeSet(e, Math.max(m, result.safeGet(e)));
            }
            for (const [e, m] of result) {
                if (m < 0 && !mset2.has(e)) { result.delete(e); }
            }
        }
        return result;
    }

    /** Computes the minimum of all MSet's. */
    static min<V>(...msets: MSetLike<V>[]): MSet<V> {
        if (msets.length == 0) { return new MSet<V>(); }
        const result = new MSet<V>(msets[0]);
        for (let i = 1; i < msets.length; i++) {
            const mset2 = MSet.sanitize(msets[i]);
            for (const [e, m] of mset2) {
                result.safeSet(e, Math.min(m, result.safeGet(e)));
            }
            for (const [e, m] of result) {
                if (m > 0 && !mset2.has(e)) { result.delete(e); }
            }
        }
        return result;
    }
};