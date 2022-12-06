/**
 * Represents each hypergraph as a doubly linked line graph.
 */

export type AdjAttribute = { [key: string]: number; };

export type AdjTest = RegExp | AdjAttribute | ((e: AdjElement | Edge | Vertex) => boolean);

// const __find_test = <T extends AdjElement>(e: T, tester: AdjTest): boolean => {
//     if (tester instanceof RegExp) {
//         return tester.test(e.selector);
//     }
//     else if (typeof tester == 'function') {
//         return tester(e);
//     }
//     else if (typeof tester == 'object') {
//         for (const key in tester) {
//             if (tester[key] != e.attr[key]) { return false; }
//         }
//         return true;
//     }
//     else {
//         throw TypeError('Invalid object for testing.');
//     }
// };

/** Represents pure adjacency information. */
export class AdjElement {
    tagName: string;
    className: string;
    id: string;
    attr: AdjAttribute;
    adj: Map<string, AdjElement>;

    constructor(id: string = '', class_name: string = '', attr: AdjAttribute = {}) {
        this.tagName = 'element';
        this.id = id;
        this.className = class_name;
        this.attr = Object.assign({}, attr);
        this.adj = new Map<string, AdjElement>();
    }

    get selector() {
        return `${this.tagName}${this.className} #{${this.id}}`;
    }

    /** Creates a unidirectional connection from this AdjElement to the specified AdjElement. */
    grab(e: AdjElement) {
        if (e != this) {
            this.adj.set(e.selector, e);
        }
        return this;
    }

    /** Removes the unidirectional connection from this AdjElement to the specified AdjElement. */
    ungrab(e: AdjElement) {
        if (e != this) {
            this.adj.delete(e.selector);
        }
        return this;
    }

    /** Iterater over the adjacent AdjElement objects. */
    [Symbol.iterator]() {
        return this.adj.values();
    }

    /** Returns the first AdjElement with selector matching the specified RegExp. */
    find(regexp: RegExp): AdjElement | undefined {
        for (const e of this) {
            if (regexp.test(e.selector)) { return e; }
        }
    }

    /** Returns the set of all AdjElement with selector matching the specified RegExp. */
    findAll(regexp: RegExp): AdjElement {
        const result = new AdjElement();
        for (const e of this) {
            if (regexp.test(e.selector)) { result.grab(e); }
        }
        return result;
    }

    /** Returns the set of all AdjElement passing the specified predicate. */
    filter(predicate: (e: AdjElement) => boolean): AdjElement {
        const result = new AdjElement();
        for (const e of this) {
            if (predicate(e)) { result.grab(e); }
        }
        return result;
    }

    /** Merge this AdjElement with the specified AdjElement. */
    mergeWith(e_set: AdjElement): AdjElement {
        for (const e of e_set) { this.grab(e); }
        return this;
    }

    /** Computes the union of all point sets adjacent to this. */
    static union(e_iter: Iterable<AdjElement>): AdjElement {
        const result = new AdjElement();
        for (const e of e_iter) { result.mergeWith(e); }
        return result;
    }
}


export class Edge extends AdjElement {
    v: Set<Vertex>;

    constructor(id: string = '', class_name: string = '', attr: AdjAttribute = {}) {
        super(id, class_name, attr);
        this.tagName = 'e';
        this.v = new Set<Vertex>();
    }

    /** Creates a mutual connection between this Edge and the specified AdjElement. */
    link(a: AdjElement) {
        if (a instanceof Vertex) {
            a.link(this);
        }
        else {
            this.grab(a);
            a.grab(this);
        }
        return this;
    }

    /** Removes a mutual connection between this Edge and the specified AdjElement. */
    unlink(a: AdjElement) {
        if (a instanceof Vertex) {
            a.unlink(this);
        }
        else {
            this.ungrab(a);
            a.ungrab(this);
        }
        return this;
    }

    /** Recalculate the adjacency structure. */
    recalc() {
        this.adj.clear();
        for (const v of this.v) {
            this.grab(v);
            v.grab(this);
            for (const e_adj of v) {
                this.grab(e_adj);
                e_adj.grab(this);
            }
        }
        return this;
    }

    /** Checks if it is multivalued or not. */
    get isMultivalued(): boolean {
        return this.v.size > 1;
    }

    /** Merge this AdjElement with the specified AdjElement. */
    mergeWith(e_set: Edge): Edge {
        for (const e of e_set) { this.grab(e); }
        for (const v of e_set.v) { this.v.add(v); }
        return this;
    }

    /** Creates an Edge instance from an iterable. */
    static union(e_iter: Iterable<Edge>) {
        const result = new Edge();
        for (const e of e_iter) { result.mergeWith(e); }
        return result;
    }
}


export class Vertex extends Edge {
    constructor(id: string = '', class_name: string = '', attr: AdjAttribute = {}) {
        super(id, class_name, attr);
        this.tagName = 'v';
        this.v.add(this);
    }

    /** Creates a mutual connection between this Vertex and the specified Edge. */
    link(e: Edge) {
        if (!e.v.has(this)) {
            e.v.add(this);
            for (const e_adj of this) {
                e.grab(e_adj);
                e_adj.grab(e);
            }
            e.grab(this);
            this.grab(e);
        }
        return this;
    }

    /** Removes the mutual connection between this Vertex and the specified Edge. */
    unlink(e: Edge) {
        if (e.v.has(this)) {
            e.v.delete(this);
            this.ungrab(e);
            e.recalc();
            for (const e_adj of this) {
                (e_adj as Edge).recalc();
            }
        }
        return this;
    }

    /** Returns all the vertices, other than the Vertex itself, that can see it. */
    visibles(regexp: RegExp): AdjElement {
        const result = AdjElement
            .union(this.findAll(regexp))
            .findAll(/^v/)
            .ungrab(this);
        return result;
    }

    /** Returns the cell containing the Vertex. */
    cell() {
        const e_rc = this.find(/^e.rule #\{r\d+c\d+\}/) as Edge;
        if (typeof e_rc == 'undefined') {
            throw Error(`Something is wrong; the vertex ${this.selector} is not linked to a cell.`);
        }
        return e_rc;
    }
}