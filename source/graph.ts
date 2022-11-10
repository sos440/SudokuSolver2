/**
 * @module graph
 * This is an experimental code for implementing supergraph structures.
 */

import { AMap, createAMapClass } from "./aug_map";
import { MSet, createMSetClass } from "./multiset";


type IncidencyV<V, E, G> = V | '*';
type IncidencyE<V, E, G> = E | '*';
type IncidencyG<V, E, G> = G | '*';

/** @todo Implement this. */
interface Supergraph<V, E, G> {
    'V=>{E}': AMap<V, Set<E>>;
    'E=>{G}': AMap<E, Set<G>>;
    'G=>{E}': AMap<G, Set<E>>;
    'V=>G=>{E}': AMap<V, AMap<G, Set<E>>>;

    add(v: IncidencyV<V, E, G>, e: IncidencyE<V, E, G>, g: IncidencyG<V, E, G>): Supergraph<V, E, G>;
    delete(v: IncidencyV<V, E, G>, e: IncidencyE<V, E, G>, g: IncidencyG<V, E, G>): Supergraph<V, E, G>;
}