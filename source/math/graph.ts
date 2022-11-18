/**
 * @module graph
 * This is an experimental code for implementing supergraph structures.
 */

import { } from './set';
import { } from './map';
import { IncidenceMatrix } from './incidence';


/**
 * Represents the structure of a supergraph via incidence tensors.
 */
export interface Superincidence<V, E, G> {
    type: string;
    VE: IncidenceMatrix<V, E>;
    EG: IncidenceMatrix<E, G>;
}


export class Supergraph<V, E, G> implements Superincidence<V, E, G> {
    type: string;
    VE: IncidenceMatrix<V, E>;
    EG: IncidenceMatrix<E, G>;

    constructor(obj?: Superincidence<V, E, G>) {
        this.type = 'basic';
        if (typeof obj == 'undefined') {
            this.VE = new IncidenceMatrix<V, E>();
            this.EG = new IncidenceMatrix<E, G>();
        }
        else {
            this.VE = obj.VE.copy();
            this.EG = obj.EG.copy();
        }
    }

    /** Merges two SupergraphStructure. */
    static merge<V, E, G>(grp1: Superincidence<V, E, G>, grp2: Superincidence<V, E, G>) {
        if (grp1.type !== grp2.type) {
            throw TypeError(`The type of the two graphs do not match.`);
        }
        const result = new Supergraph<V, E, G>();
        result.type = grp1.type;
        result.VE = IncidenceMatrix.union(grp1.VE, grp2.VE);
        result.EG = IncidenceMatrix.union(grp2.EG, grp2.EG);
        return result;
    }

    /** Merges the Supergraph with another SupergraphStructure. */
    merge(grp: Superincidence<V, E, G>): this {
        if (this.type !== grp.type) {
            throw TypeError(`The type of the two graphs do not match.`);
        }
        const result = new Supergraph<V, E, G>();
        this.VE = IncidenceMatrix.union(this.VE, grp.VE);
        this.EG = IncidenceMatrix.union(this.EG, grp.EG);
        return this;
    }

    /** Creates a copy of the Supergraph. */
    copy(): Supergraph<V, E, G> {
        return Supergraph.merge(this, new Supergraph<V, E, G>());
    }

    /** Creates a new Supergraph consisting of vertices and edges that pass the test. */
    filter(test: (vertex: V, edge: E, grp?: Supergraph<V, E, G>) => boolean): Supergraph<V, E, G> {
        const result = new Supergraph<V, E, G>();
        result.type = this.type;
        result.VE = this.VE.filter((vertex, edge) => test(vertex, edge, this));
        result.EG = this.EG.filter((edge, _) => result.VE.columns.has(edge));
        return result;
    }

    /** Dynamically computes the incidence of various signatures. */
    'E($v)'(vertex: V) {
        return this.VE.rows.get(vertex);
    }

    'V($e)'(edge: E) {
        return this.VE.columns.get(edge);
    }

    'G($e)'(edge: E) {
        return this.EG.rows.get(edge);
    }

    'E($g)'(group: G) {
        return this.EG.columns.get(group);
    }

    'V(${e})'(edge_set: Set<E>) {
        return Set.union(
            ...edge_set.map((edge: E) => this['V($e)'](edge) as Set<V>)
        );
    }

    'V(E($v))'(vertex: V) {
        return this['V(${e})'](this['E($v)'](vertex) as Set<E>);
    }

    'V(E($v)&E($g))'(vertex: V, group: G) {
        return this['V(${e})'](
            Set.intersection(this['E($v)'](vertex) as Set<E>, this['E($g)'](group) as Set<E>)
        );
    }

    'E(${v})'(vertex_set: Set<V>) {
        return Set.union(
            ...vertex_set.map((vertex: V) => this['E($v)'](vertex) as Set<E>)
        );
    }

    'E(V($e))'(edge: E) {
        return this['E(${v})'](this['V($e)'](edge) as Set<V>);
    }

    'E(V($e))&E($g)'(edge: E, group: G) {
        return Set.intersection(this['E(V($e))'](edge) as Set<E>, this['E($g)'](group) as Set<E>);
    }

    /** Returns the set of all the other vertices that can see the specified vertex. */
    visibleFrom(vertex: V, group?: G): Set<V> {
        const vertex_visible = (typeof group == 'undefined')
            ? this['V(E($v))'](vertex) : this['V(E($v)&E($g))'](vertex, group);
        vertex_visible.delete(vertex);
        return vertex_visible;
    }
}