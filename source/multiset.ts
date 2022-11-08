/**
 * @module multiset
 */


/**
 * A boolean callback function that iterates through the entries.
 * @callback Callback<K>
 * @param {K} element The current element.
 * @param {number} count The current count.
 * @param {Multiset<K>} cur_mset The current multiset.
 * @returns {V} The truth value.
 */
type Callback<K, V> = (element: K, count: number, cur_mset: Multiset<K>) => V;


/**
 * Represents multisets (with multiplicites taking integer values).
 */
export class Multiset<K> extends Map<K, number> {
    constructor(element_list: K[] = []) {
        super();
        for (const element of element_list) {
            this.add(element);
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
     * @param {K} element The element whose multiplicity is to be set.
     * @param {number} multi The multiplicity
     * @returns {Multiset<K>} The current multiset.
     */

    /**
     * Remove all the occurrences of the element from the multiset.
     * This is inherited from Map class.
     * @method delete
     * @param {K} element The element whose every occurrence is to be removed.
     * @returns {Multiset<K>} The current multiset.
     */

    /**
     * Add an element to the multiset.
     * @param {K} element The element to be added.
     * @returns {Multiset<K>} The current multiset.
     */
    add(element: K): Multiset<K> {
        this.set(element, (this.get(element) ?? 0) + 1);
        return this;
    }

    /**
     * Remove an element from the multiset.
     * @param {K} element The element to be removed.
     * @returns {Multiset<K>} The current multiset.
     */
    remove(element: K): Multiset<K> {
        this.set(element, (this.get(element) ?? 0) - 1);
        return this;
    }

    /**
     * Check if the condition is satisfied by every distinguished elements.
     * @param {Callback<K, boolean>} callback The test function to evaluate through the elements.
     * @returns {boolean} True if the test function results in true for every element.
     */
    every(callback: Callback<K, boolean>): boolean {
        for (const [element, count] of this.entries()) {
            if (!callback(element, count, this)) {
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
        for (const [element, count] of this.entries()) {
            if (callback(element, count, this)) {
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
        for (const [element, count] of this.entries()) {
            if (callback(element, count, this)) {
                result.set(element, count);
            }
        }
        return result;
    }

    /**
     * Check if every count is non-negative.
     * @param {Multiset<K>} cur_set The callback function to evaluate through the elements.
     * @returns {boolean} True if the callback is true for every element.
     */
    static geqZero<K>(cur_set: Multiset<K>): boolean {
        for (const [_, count] of cur_set.entries()) {
            if (count < 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if set_a(x) >= set_b(x) for all x.
     * @param {Multiset<K>} set_a The multiset to compare.
     * @param {Multiset<K>} set_b The multiset to compare.
     * @returns {boolean} True if set_a(x) >= set_b(x) for all x.
     */
    static geq<K>(set_a: Multiset<K>, set_b: Multiset<K>): boolean {
        for (const [element_a, count_a] of set_a.entries()) {
            if (count_a < (set_b.get(element_a) ?? 0)) {
                return false;
            }
        }
        for (const [element_b, count_b] of set_b.entries()) {
            if (count_b > (set_a.get(element_b) ?? 0)) {
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
        for (const cur_set of summands) {
            for (const [element, count] of cur_set.entries()) {
                result.set(element, (result.get(element) ?? 0) + count);
            }
        }
        /** Eliminiate zero-count elements. */
        for (const [element, count] of result.entries()) {
            if (count == 0) {
                result.delete(element);
            }
        }
        return result;
    }

    /**
     * Subtract a multiset from another.
     * @param {Multiset<K>} set_a The multiset to be subtracted from.
     * @param {Multiset<K>} set_b The multiset to subtract.
     * @returns {Multiset<K>} The difference.
     */
    static subtract<K>(set_a: Multiset<K>, set_b: Multiset<K>): Multiset<K> {
        const result = new Multiset<K>();
        for (const [element, count] of set_a.entries()) {
            result.set(element, count);
        }
        for (const [element, count] of set_b.entries()) {
            result.set(element, (result.get(element) ?? 0) - count);
        }
        /** Eliminiate zero-count elements. */
        for (const [element, count] of result.entries()) {
            if (count == 0) {
                result.delete(element);
            }
        }
        return result;
    }
}