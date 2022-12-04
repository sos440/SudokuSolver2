type MSetLike<V> = MSet<V> | Map<V, number> | Iterable<V>;

type Callback<V, R> =
    ((e: V) => R) |
    ((e: V, m: number) => R) |
    ((e: V, m: number, cur_mset: MSet<V>) => R);
    
/** Represents multisets (with multiplicites taking integer values). */
export class MSet<V> extends Map<V, number> {
    constructor(e_iter?: MSetLike<V>) {
        super();
        if (e_iter instanceof MSet<V> || e_iter instanceof Map<V, number>) {
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
        this.safeSet(e, this.safeGet(e) + dm);
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
    every(callback: (e: V, m: number) => boolean): boolean;
    every(callback: (e: V, m: number, mset: MSet<V>) => boolean): boolean;
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
    some(callback: (e: V, m: number) => boolean): boolean;
    some(callback: (e: V, m: number, mset: MSet<V>) => boolean): boolean;
    some(callback: Callback<V, boolean>): boolean {
        for (const [e, m] of this) {
            if (callback(e, m, this)) { return true; }
        }
        return false;
    }

    /** Creates a new MSet consiting of all elements passing the test. */
    filter(callback: (e: V) => boolean): MSet<V>;
    filter(callback: (e: V, m: number) => boolean): MSet<V>;
    filter(callback: (e: V, m: number, mset: MSet<V>) => boolean): MSet<V>;
    filter(callback: Callback<V, boolean>): MSet<V> {
        const result = new MSet<V>();
        for (const [e, m] of this) { callback(e, m, this) && result.set(e, m); }
        return result;
    }

    /** Sanitizes the input and make it an MSet. */
    static sanitize<V>(mset: MSetLike<V>): MSet<V> {
        return (mset instanceof MSet<V>) ? (mset as MSet<V>) : new MSet(mset);
    }

    /** Tests whether every multiplicity is non-negative. */
    isProper<V>(mset: MSet<V>): boolean {
        for (const [_, m] of this) {
            if (m < 0) { return false; }
        }
        return true;
    }

    /** Adds all the elements of the second mset to the first mset. */
    static addMSet<V>(mset1: MSet<V>, mset2: MSetLike<V>) {
        if (mset2 instanceof MSet<V> || mset2 instanceof Map<V, number>) {
            for (const [e, dm] of mset2) { mset1.mod(e, dm); }
        }
        else {
            for (const e of mset2) { mset1.add(e); }
        }
        return mset1;
    }

    /** Removes all the elements of the second mset from the first mset. */
    static removeMSet<V>(mset1: MSet<V>, mset2: MSetLike<V>): MSet<V> {
        if (mset2 instanceof MSet<V> || mset2 instanceof Map<V, number>) {
            for (const [e, dm] of mset2) { mset1.mod(e, -dm); }
        }
        else {
            for (const e of mset2) { mset1.remove(e); }
        }
        return mset1;
    }

    /** Computes the union of two msets. */
    static maxWith<V>(mset1: MSet<V>, mset2: MSetLike<V>): MSet<V> {
        const mset2s = MSet.sanitize(mset2);
        for (const [e, m] of mset2s) { mset1.safeSet(e, Math.max(mset1.safeGet(e), m)); }
        for (const [e, m] of mset1) { mset2s.has(e) || mset1.safeSet(e, Math.max(m, 0)); }
        return mset1;
    }

    /** Computes the intersection of two msets. */
     static minWith<V>(mset1: MSet<V>, mset2: MSetLike<V>): MSet<V> {
        const mset2s = MSet.sanitize(mset2);
        for (const [e, m] of mset2s) { mset1.safeSet(e, Math.min(mset1.safeGet(e), m)); }
        for (const [e, m] of mset1) { mset2s.has(e) || mset1.safeSet(e, Math.min(m, 0)); }
        return mset1;
    }

    /** Tests whether the first argument is a super-mset of the second. */
    static isSuper<V>(mset1: MSet<V>, mset2: MSet<V>): boolean {
        for (const [e1, m1] of mset1) {
            if (m1 < mset2.safeGet(e1)) { return false; }
        }
        for (const [e2, m2] of mset2) {
            if (mset1.safeGet(e2) < m2) { return false; }
        }
        return true;
    }

    /** Computes the sum of msets. */
    static sum<V>(...msets: MSetLike<V>[]): MSet<V> {
        return msets.reduce(MSet.addMSet, new MSet<V>());
    }

    /** Computes the difference between the fisrt mset and the sum of the rest. */
    static diff<V>(mset1: MSetLike<V>, ...msets: MSetLike<V>[]): MSet<V> {
        return msets.reduce(MSet.removeMSet, new MSet<V>(mset1));
    }

    /** Computes the maximum of all MSet's. */
    static max<V>(...msets: MSetLike<V>[]): MSet<V> {
        return msets.reduce(MSet.maxWith, new MSet<V>());
    }

    /** Computes the minimum of all MSet's. */
    static min<V>(...msets: MSetLike<V>[]): MSet<V> {
        return msets.reduce(MSet.minWith, new MSet<V>());
    }
};