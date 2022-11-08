/**
 * @module multiset
 */


/**
 * A boolean callback function that iterates through the entries.
 * @callback Callback<K>
 * @param {K} element The current element.
 * @param {number} multi The current count.
 * @param {Multiset<K>} cur_mset The current multiset.
 * @returns {V} The truth value.
 */
type Callback<K, V> = (element: K, multi: number, cur_mset: Multiset<K>) => V;


/**
 * Represents multisets (with multiplicites taking integer values).
 */
export class Multiset<K> extends Map<K, number> {
    constructor(e_list: K[] = []) {
        super();
        for (const e of e_list) {
            this.add(e);
        }
    }

    /**
     * Count the total count.
     * @returns {number} The sum of all multiplicities.
     */
    get count(): number {
        return Array.from(this.values()).reduce((s, x) => s + x, 0);
    }

    /**
     * Set the multiplicites (number of occurrences) of the element.
     * This is inherited from Map class.
     * @method set
     * @param {K} e The element whose multiplicity is to be set.
     * @param {number} multi The multiplicity
     * @returns {Multiset<K>} The current multiset.
     */

    /**
     * Remove all the occurrences of the element from the multiset.
     * This is inherited from Map class.
     * @method delete
     * @param {K} e The element whose every occurrence is to be removed.
     * @returns {Multiset<K>} The current multiset.
     */

    /**
     * Add an element to the multiset.
     * @param {K} e The element to be added.
     * @returns {Multiset<K>} The current multiset.
     */
    add(e: K): Multiset<K> {
        this.set(e, (this.get(e) ?? 0) + 1);
        return this;
    }

    /**
     * Remove an element from the multiset.
     * @param {K} e The element to be removed.
     * @returns {Multiset<K>} The current multiset.
     */
    remove(e: K): Multiset<K> {
        this.set(e, (this.get(e) ?? 0) - 1);
        return this;
    }

    /**
     * Check if the condition is satisfied by every distinguished elements.
     * @param {Callback<K, boolean>} callback The test function to evaluate through the elements.
     * @returns {boolean} True if the test function results in true for every element.
     */
    every(callback: Callback<K, boolean>): boolean {
        for (const [e, multi] of this.entries()) {
            if (!callback(e, multi, this)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if the condition is satisfied by some distinguished element.
     * @param {Callback<K, boolean>} callback The test function to evaluate through the elements.
     * @returns {boolean} True if the test function results in true for some element.
     */
    some(callback: Callback<K, boolean>): boolean {
        for (const [e, multi] of this.entries()) {
            if (callback(e, multi, this)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Filter all the elements satisfying the condition.
     * @param {Callback} callback The test function to evaluate through the elements.
     * @returns {Multiset} The sub-multiset consisting of all element satisfying the test function.
     */
    filter(callback: Callback<K, boolean>): Multiset<K> {
        const result = new Multiset<K>();
        for (const [e, multi] of this.entries()) {
            if (callback(e, multi, this)) {
                result.set(e, multi);
            }
        }
        return result;
    }

    /**
     * Check if every count is non-negative.
     * @param {Multiset<K>} cur_mset The callback function to evaluate through the elements.
     * @returns {boolean} True if the callback is true for every element.
     */
    static geqZero<K>(cur_mset: Multiset<K>): boolean {
        for (const [_, multi] of cur_mset.entries()) {
            if (multi < 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if set_a(x) >= set_b(x) for all x.
     * @param {Multiset<K>} mset_a The multiset to compare.
     * @param {Multiset<K>} mset_b The multiset to compare.
     * @returns {boolean} True if set_a(x) >= set_b(x) for all x.
     */
    static geq<K>(mset_a: Multiset<K>, mset_b: Multiset<K>): boolean {
        for (const [e_a, multi_a] of mset_a.entries()) {
            if (multi_a < (mset_b.get(e_a) ?? 0)) {
                return false;
            }
        }
        for (const [e_b, multi_b] of mset_b.entries()) {
            if (multi_b > (mset_a.get(e_b) ?? 0)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Add multisets.
     * @param {...Multiset<K>} summands Multisets to be summed up.
     * @returns {Multiset<K>} The sum.
     */
    static add<K>(...summands: Multiset<K>[]): Multiset<K> {
        const result = new Multiset<K>();
        for (const cur_mset of summands) {
            for (const [e, multi] of cur_mset.entries()) {
                result.set(e, (result.get(e) ?? 0) + multi);
            }
        }
        /** Eliminiate zero-count elements. */
        for (const [e, multi] of result.entries()) {
            if (multi == 0) {
                result.delete(e);
            }
        }
        return result;
    }

    /**
     * Subtract a multiset from another.
     * @param {Multiset<K>} mset_a The multiset to be subtracted from.
     * @param {Multiset<K>} mset_b The multiset to subtract.
     * @returns {Multiset<K>} The difference.
     */
    static subtract<K>(mset_a: Multiset<K>, mset_b: Multiset<K>): Multiset<K> {
        const result = new Multiset<K>();
        for (const [e, multi] of mset_a.entries()) {
            result.set(e, multi);
        }
        for (const [e, multi] of mset_b.entries()) {
            result.set(e, (result.get(e) ?? 0) - multi);
        }
        /** Eliminiate zero-count elements. */
        for (const [e, multi] of result.entries()) {
            if (multi == 0) {
                result.delete(e);
            }
        }
        return result;
    }

    /**
     * Pick an element of the set.
     * Almost exclusively used when the set has a unique distinghished element.
     * @returns {K | undefined} An element of the set | undefined if the set is empty.
     */
    pick(): K | undefined {
        return Array.from(this.keys())[0];
    }
}