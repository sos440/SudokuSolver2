declare global {
    export interface Array<T> {
        /** Loops through the family of subsets of the specified size. */
        subArrays(size: number): IterableIterator<T[]>;
    }
}

Object.defineProperty(Array.prototype, 'subArrays', {
    enumerable: false,
    value<T>(this: T[], size: number): IterableIterator<T[]> {
        return new SubarrayIterator(this, size);
    }
});

class SubarrayIterator<T> implements IterableIterator<T[]> {
    list: T[];
    pointers: number[];
    started: boolean;
    result: IteratorResult<T[]>;
    constructor(list: T[], subset_size: number) {
        this.list = list;
        this.pointers = [...new Array(subset_size).keys()];
        this.started = false;
        this.result = {
            done: (this.pointers.length > this.list.length),
            value: this.list.slice(0, subset_size)
        };
    }

    next() {
        /** The very first step should be different and pronounced :) */
        if (!this.started) {
            this.started = true;
            return this.result;
        }

        /** The total number of pointers. */
        const num_p = this.pointers.length;
        /** The index of the current pointer. */
        let i = num_p - 1;
        /** The maximum of the value of the current pointer. */
        let m = this.list.length - 1;

        /** Finds the first pointer that can be incremented. */
        while ((i >= 0) && this.pointers[i] == m) { i--; m--; }

        /** If everything is flushed to the right, stop the loop. */
        if (i == -1) {
            this.result.done = true;
        }
        else {
            let p_val = this.pointers[i];
            while (i < num_p) {
                p_val++;
                this.pointers[i] = p_val;
                this.result.value[i] = this.list[p_val];
                i++;
            }
        }

        /** Returns the result. */
        return this.result;
    }

    [Symbol.iterator]() {
        return this;
    }
}

export { };