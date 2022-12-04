/**
 * Represents each hypergraph as a doubly linked line graph.
 */

export type AdjAttribute = { [key: string]: number; };

const __attr_is_super = (attr1: AdjAttribute, attr2: AdjAttribute): boolean => {
    for (const key in attr2) {
        if (attr1[key] != attr2[key]) { return false; }
    }
    return true;
};

/** Represents pure adjacency information. */
export class AdjElement {
    selector: string;
    attr: AdjAttribute;
    adj: Map<string, AdjElement>;

    constructor(selector: string = '', attr: AdjAttribute = {}) {
        this.selector = selector;
        this.attr = Object.assign({}, attr);
        this.adj = new Map<string, AdjElement>();
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

    /** Returns the first edge matching the ID and attrbutes. */
    find(regex: RegExp, attr?: AdjAttribute): AdjElement | undefined {
        if (attr) {
            for (const e of this) {
                if (regex.test(e.selector) && __attr_is_super(e.attr, attr)) { return e; }
            }
        }
        else {
            for (const e of this) {
                if (regex.test(e.selector)) { return e; }
            }
        }
    }

    /** Returns the set of all edges matching the ID and attrbutes. */
    findAll(regex: RegExp, attr?: AdjAttribute): AdjElement {
        const result = new AdjElement();
        if (attr) {
            for (const e of this) {
                if (regex.test(e.selector) && __attr_is_super(e.attr, attr)) { result.grab(e); }
            }
        }
        else {
            for (const e of this) {
                if (regex.test(e.selector)) { result.grab(e); }
            }
        }
        return result;
    }

    private unionReduce(e_set: AdjElement): AdjElement {
        for (const e of e_set) { this.grab(e); }
        return this;
    }

    /** Computes the union of all point sets adjacent to this. */
    static union(e_iter: Iterable<AdjElement>): AdjElement {
        const result = new AdjElement();
        for (const e of e_iter) { result.unionReduce(e); }
        return result;
    }
}


export class Edge extends AdjElement {
    v: Set<Vertex>;

    constructor(selector: string = '', attr: AdjAttribute = {}) {
        super(selector, attr);
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
}


export class Vertex extends Edge {
    constructor(selector: string = '', attr: AdjAttribute = {}) {
        super(selector, attr);
        this.v.add(this);
    }

    /** Creates a mutual connection between this Vertex and the specified Edge. */
    link(e: Edge) {
        if (!e.v.has(this)) {
            for (const e_adj of this) {
                e.grab(e_adj);
            }
            e.grab(this);
            e.v.add(this);
            this.grab(e);
        }
        return this;
    }

    /** Removes the mutual connection between this Vertex and the specified Edge. */
    unlink(e: Edge) {
        if (e.v.has(this)) {
            this.ungrab(e);
            e.v.delete(this);
            e.adj.clear();
            for (const v of e.v) {
                for (const e_adj of v) {
                    e.grab(e_adj);
                }
            }
        }
        return this;
    }

    /** Returns all the vertices, other than the Vertex itself, that can see it. */
    visibles(regex: RegExp, attr?: AdjAttribute): AdjElement {
        const result = AdjElement
            .union(this.findAll(regex, attr))
            .findAll(/^v/)
            .ungrab(this);
        return result;
    }

    /** Returns the cell containing the Vertex. */
    cell() {
        const e_rc = this.find(/^e #\{r\d+c\d+\}/) as Edge;
        if (typeof e_rc == 'undefined') {
            throw Error(`Something is wrong; the vertex ${this.selector} is not linked to a cell.`);
        }
        return e_rc;
    }
}