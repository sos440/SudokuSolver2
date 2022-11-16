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
        if (grp1.type !== grp2.type){
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
        if (this.type !== grp.type){
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
        result.VE = this.VE.filter((vertex, edge) => test(vertex, edge ,this));
        result.EG = this.EG.filter((edge, group) => result.VE.columns.has(edge));
        return result;
    }
}