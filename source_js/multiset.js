/**
 * @module multiset
 */


/**
 * Represents multisets (with multiplicites taking integer values).
 */
 export class Multiset extends Map {
    /** @param {any[]} element_list The array of elements */
    constructor(element_list) {
        super();
        if (element_list instanceof Array){
            for (const element of element_list) {
                this.add(element);
            }
        }
        else if (typeof element_list != 'undefined') {
            this.add(element_list);
        }
    }

    /**
     * Count the total count.
     * @returns {number} The total count.
     */
    get count() {
        return Array.from(this.values()).reduce((s, x) => s + x, 0);
    }

    /**
     * Add an element to the multiset.
     * @param {any} element The element to be added.
     * @returns {Multiset} The current multiset.
     */
    add(element) {
        this.set(element, (this.get(element) ?? 0) + 1);
        return this;
    }

    /**
     * Remove an element to the multiset.
     * @param {any} element The element to be removed.
     * @returns {Multiset} The current multiset.
     */
    remove(element) {
        this.set(element, (this.get(element) ?? 0) - 1);
        return this;
    }

    /**
     * A boolean callback function that iterates through the entries.
     * @callback iterateBoolean
     * @param {any} element The current element.
     * @param {number} count The current count.
     * @param {Multiset} this The current multiset.
     * @returns {boolean} The truth value.
     */

    /**
     * Check if the condition is satisfied by every distinguished elements.
     * @param {iterateBoolean} callbackfn The test function to evaluate through the elements.
     * @returns {boolean} True if the test function results in true for every element.
     */
    every(callbackfn) {
        for (const [element, count] of this.entries()) {
            if (!callbackfn(element, count, this)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if the condition is satisfied by some distinguished element.
     * @param {iterateBoolean} callbackfn The test function to evaluate through the elements.
     * @returns {boolean} True if the test function results in true for some element.
     */
    some(callbackfn) {
        for (const [element, count] of this.entries()) {
            if (callbackfn(element, count, this)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Filter all the elements satisfying the condition.
     * @param {iterateBoolean} callbackfn The test function to evaluate through the elements.
     * @returns {Multiset} The sub-multiset consisting of all element satisfying the test function.
     */
    filter(callbackfn) {
        const result = new Multiset();
        for (const [element, count] of this.entries()) {
            if (callbackfn(element, count, this)) {
                result.set(element, count);
            }
        }
        return result;
    }

    /**
     * Check if every count is non-negative.
     * @param {Multiset} cur_set The callback function to evaluate through the elements.
     * @returns {boolean} True if the callback is true for every element.
     */
    static geqZero(cur_set) {
        for (const [_, count] of cur_set.entries()) {
            if (count < 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if set_a(x) >= set_b(x) for all x.
     * @param {Multiset} set_a The multiset to compare.
     * @param {Multiset} set_b The multiset to compare.
     * @returns {boolean} True if set_a(x) >= set_b(x) for all x.
     */
    static geq(set_a, set_b) {
        for (const [element_a, count_a] of set_a.entries()) {
            if (count_a < (set_b.get(element_a) ?? 0)){
                return false;
            }
        }
        for (const [element_b, count_b] of set_b.entries()) {
            if (count_b > (set_a.get(element_b) ?? 0)){
                return false;
            }
        }
        return true;
    }

    /**
     * Add multisets.
     * @param {...Multiset} summands Multisets to be summed up.
     * @returns The sum.
     */
    static add(...summands) {
        const result = new Multiset();
        for (const cur_set of summands) {
            for (const [element, count] of cur_set.entries()) {
                result.set(element, (result.get(element) ?? 0) + count);
            }
        }
        /** Eliminiate zero-count elements. */
        for (const [element, count] of result.entries()) {
            if (count == 0){
                result.delete(element);
            }
        }
        return result;
    }

    /**
     * Subtract a multiset from another.
     * @param {Multiset} set_a The multiset to be subtracted from.
     * @param {Multiset} set_b The multiset to subtract.
     * @returns The difference.
     */
    static subtract(set_a, set_b) {
        const result = new Multiset();
        for (const [element, count] of set_a.entries()) {
            result.set(element, count);
        }
        for (const [element, count] of set_b.entries()) {
            result.set(element, (result.get(element) ?? 0) - count);
        }
        /** Eliminiate zero-count elements. */
        for (const [element, count] of result.entries()) {
            if (count == 0){
                result.delete(element);
            }
        }
        return result;
    }
}