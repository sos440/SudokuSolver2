/**
 * A boolean callback function that iterates through the entries.
 * @callback iterateBoolean
 * @param {any} element The current element.
 * @param {number} count The current count.
 * @param {Multiset} cur_set The current multiset.
 * @returns {boolean} The truth value.
 */
type iterateBoolean = (element: any, count: number, cur_set: Multiset) => boolean;


class Multiset extends Map {
    constructor(...element_list: any) {
        super();
        for (const element of element_list) {
            this.add(element);
        }
    }

    /**
     * Count the total count.
     * @returns {number} The total count.
     */
    get count(): number {
        return Array.from(this.values()).reduce((s, x) => s + x, 0);
    }

    /**
     * Add an element to the multiset.
     * @param {any} element The element to be added.
     * @returns {Multiset} The current multiset.
     */
    add(element: any): Multiset {
        this.set(element, (this.get(element) ?? 0) + 1);
        return this;
    }

    /**
     * Remove an element to the multiset.
     * @param {any} element The element to be removed.
     * @returns {Multiset} The current multiset.
     */
    remove(element: any): Multiset {
        this.set(element, (this.get(element) ?? 0) - 1);
        return this;
    }

    /**
     * Check if the condition is satisfied by every distinguished elements.
     * @param {iterateBoolean} callbackfn The test function to evaluate through the elements.
     * @returns {boolean} True if the test function results in true for every element.
     */
    every(callbackfn: iterateBoolean): boolean {
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
    some(callbackfn: iterateBoolean): boolean {
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
    filter(callbackfn: iterateBoolean): Multiset {
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
    static geqZero(cur_set: Multiset): boolean {
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
    static geq(set_a: Multiset, set_b: Multiset): boolean {
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
     * @param {...Multiset} summands Multisets to be summed up.
     * @returns The sum.
     */
    static add(...summands: Multiset[]) {
        const result = new Multiset();
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
     * @param {Multiset} set_a The multiset to be subtracted from.
     * @param {Multiset} set_b The multiset to subtract.
     * @returns The difference.
     */
    static subtract(set_a: Multiset, set_b: Multiset) {
        const result = new Multiset();
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

const a = new Multiset(1, 1, 1, 2, 3, 3, 4);
const b = new Multiset(1, 1, 2, 3);
console.log('a = ', a);
console.log('b = ', b);
console.log('a + b = ', Multiset.add(a, b));
console.log('a - b = ', Multiset.subtract(a, b));
console.log('a >= b = ', Multiset.geq(a, b));
console.log('Elements with multiple counts: ', a.filter((_, c) => c >= 2));