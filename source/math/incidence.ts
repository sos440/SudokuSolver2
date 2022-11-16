/**
 * @module incidence_matrix
 */

import { } from './set';


/** Represents an incidence matrix. */
export class IncidenceMatrix<A, B> {
    rows: Map<A, Set<B>>;
    columns: Map<B, Set<A>>;
    constructor() {
        this.rows = new Map<A, Set<B>>();
        this.columns = new Map<B, Set<A>>();
    }

    /** Loops through the pairs (a, b) of the IncidenceMatrix. */
    *[Symbol.iterator](): IterableIterator<[A, B]> {
        for (const [a, set_b] of this.rows) {
            for (const b of set_b) {
                yield [a, b];
            }
        }
    }

    /** Checks if the IncidenceMatrix has the specified pair. */
    has(a: A, b: B): boolean {
        return (this.rows.has(a) && (this.rows.get(a) as Set<B>).has(b));
    }

    /** Adds a new row to the IncidenceMatrix. */
    addRow(a: A): this {
        if (!this.rows.has(a)) {
            this.rows.set(a, new Set<B>());
        }
        return this;
    }

    /** Adds a column row to the IncidenceMatrix. */
    addColumn(b: B): this {
        if (!this.columns.has(b)) {
            this.columns.set(b, new Set<A>());
        }
        return this;
    }

    /** Appends a new pair to the IncidenceMatrix. */
    add(a: A, b: B): this {
        this.addRow(a);
        this.addColumn(b);
        (this.rows.get(a) as Set<B>).add(b);
        (this.columns.get(b) as Set<A>).add(a);
        return this;
    }

    /** Removes a row from the IncidenceMatrix. */
    deleteRow(a: A): boolean {
        if (this.rows.has(a)) {
            const cur_row = this.rows.get(a) as Set<B>;
            for (const b of cur_row) {
                const cur_col = this.columns.get(b) as Set<A>;
                cur_col.delete(a);
                if (cur_col.size == 0) {
                    this.columns.delete(b);
                }
            }
            this.rows.delete(a);
            return true;
        }
        return false;
    }

    /** Removes a column from the IncidenceMatrix. */
    deleteColumn(b: B): boolean {
        if (this.columns.has(b)) {
            const cur_col = this.columns.get(b) as Set<A>;
            for (const a of cur_col) {
                const cur_row = this.rows.get(a) as Set<B>;
                cur_row.delete(b);
                if (cur_row.size == 0) {
                    this.rows.delete(a);
                }
            }
            this.columns.delete(b);
            return true;
        }
        return false;
    }

    /** Removes an existing pair from the IncidenceMatrix. */
    delete(a: A, b: B): boolean {
        if (this.has(a, b)) {
            (this.rows.get(a) as Set<B>).delete(b);
            (this.columns.get(b) as Set<A>).delete(a);
            return true;
        }
        return false;
    }

    /** Clears empty rows and columns. */
    clearEmpty(): this {
        this.rows.clearEmptyKeys();
        this.columns.clearEmptyKeys();
        return this;
    }

    /** Applies the callback function to each pair of the IncidenceMatrix. */
    forEach(callback: (a: A, b: B, m?: this) => void): void {
        for (const [a, b] of this) {
            callback(a, b, this);
        }
    }

    /** Creates a new IncidenceMatrix by applying the specified transform to the pairs of the current IncidenceMatrix. */
    transform<C, D>(callback: (a: A, b: B, m?: this) => [C, D]): IncidenceMatrix<C, D> {
        const result = new IncidenceMatrix<C, D>();
        for (const [a, b] of this) {
            result.add(...callback(a, b, this));
        }
        return result;
    }

    /** Applies the callback function to each pair of the IncidenceMatrix. */
    filter(callback: (a: A, b: B, m?: this) => boolean): IncidenceMatrix<A, B> {
        const result = new IncidenceMatrix<A, B>();
        for (const [a, b] of this) {
            if (callback(a, b, this)) {
                result.add(a, b);
            }
        }
        return result;
    }

    /** Returns the transpose of the IncidenceMatrix. */
    transpose(): IncidenceMatrix<B, A> {
        return this.transform((a, b) => [b, a]);
    }

    /** Creates a copy of the IncidenceMatrix. */
    copy(): IncidenceMatrix<A, B> {
        const result = new IncidenceMatrix<A, B>();
        for (const [a, set_b] of this.rows) {
            result.rows.set(a, new Set(set_b));
        }
        for (const [b, set_a] of this.columns) {
            result.columns.set(b, new Set(set_a));
        }
        return result;
    }

    /** Merges two IncidenceMatrix's. */
    static union<A, B>(m1: IncidenceMatrix<A, B>, m2: IncidenceMatrix<A, B>): IncidenceMatrix<A, B> {
        const result = m1.copy();
        for (const [a, set_b] of m2.rows) {
            if (result.rows.has(a)) {
                result.rows.set(a, Set.union(result.rows.get(a) as Set<B>, set_b));
            }
            else {
                result.rows.set(a, set_b);
            }
        }
        for (const [b, set_a] of m2.columns) {
            if (result.columns.has(b)) {
                result.columns.set(b, Set.union(result.columns.get(b) as Set<A>, set_a));
            }
            else {
                result.columns.set(b, set_a);
            }
        }
        return result;
    }
}