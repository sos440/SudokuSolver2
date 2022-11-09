/**
 * @module hypergraph
 */

import { MSet } from './multiset';


/**
 * Represents a labeled vertex.
 */
export class LabeledVertex extends Map<string, any> {}

export const NullLabeledVertex = new LabeledVertex();

export type Hyperedge = MSet<LabeledVertex>;

export const NullHyperedge = new MSet<LabeledVertex>();

export type EdgeGroup = Set<Hyperedge>;

export const NullEdgeGroup = new Set<Hyperedge>();

export interface GraphInfo {
    type: string,
    param?: any
}

/**
 * Represents hypergraphs used in exact hitting games.
 */
export class Hypergraph {
    /** @readonly Represents the set of hyperedges. */
    edges: Set<Hyperedge>;
    /** @readonly Represents a collection of edge groups enumerated by their name. */
    edgeGroups: Map<string, EdgeGroup>;
    /** @readonly Represents the sparse incidency matrix. */
    incidency: Map<LabeledVertex, EdgeGroup>
    /** @readonly Represents the type information. */
    info: GraphInfo;

    constructor(...group_names: string[]) {
        this.edges = new Set();

        this.edgeGroups = new Map();
        for (const name of group_names) {
            this.edgeGroups.set(name, new Set());
        }

        this.incidency = new Map();

        this.info = {
            type: 'hypergraph'
        };
    }

    /** 
     * Adds a new vertex to the Hypergraph and updates the incidency matrix accordingly.
     * If the vertex already exists in the graph, nothing happens.
     */
    addVertex(vertex: LabeledVertex): Hypergraph {
        if (!this.incidency.has(vertex)) {
            this.incidency.set(vertex, new Set());
        }
        return this;
    }

    /** 
     * Removes the vertex from the Hypergraph and updates the incidency graph accordingly.
     * @returns {boolean} true if the vertex exists in the Hypergraph and has been removed, or false if the vertex does not exist.
     */
    deleteVertex(vertex: LabeledVertex): boolean {
        if (this.incidency.has(vertex)) {
            /** For each edge containing the vertex, removes the vertex from it. */
            for (const edge of this.incidency.get(vertex) ?? NullEdgeGroup){
                edge.delete(vertex);
            }
            /** Removes the vertex from the incidency matrix. */
            return this.incidency.delete(vertex);
        }
        return false;
    }

    /**
     * Adds a hyperedge to an edge group of the Hypergraph
     * and updates the incidency matrix accordingly.
     */
    addEdge(edge: Hyperedge, group_name: string): Hypergraph {
        if (!this.edges.has(edge)){
            this.edges.add(edge);
            this.createEdgeGroup(group_name);
            this.edgeGroups.get(group_name)?.add(edge);

            /** Updates the incidency matrix. */
            for (const vertex of edge.elements()) {
                this.addVertex(vertex);
                this.incidency.get(vertex)?.add(edge);
            }
        }
        return this;
    }

    /**
     * Removes a hyperedge from the Hypergraph and updates both the incidency matrix and edge groups accordingly.
     * @returns {boolean} true if the edge exists in the Hypergraph and has been removed, or false if the edge does not exist.
     */
    deleteEdge(edge: Hyperedge): boolean {
        if (this.edges.has(edge)){
            /** Removes the edge from the edge set. */
            this.edges.delete(edge);

            /** Updates the edge groups. */
            for (const [group_name, edge_group] of this.edgeGroups){
                edge_group.delete(edge);
            }

            /** Updates the incidency matrix. */
            for (const [vertex, edge_group] of this.incidency){
                edge_group.delete(edge);
            }
        }
        return false;
    }

    /**
     * @returns {boolean} true if the name does not already exist and a new group has been created, or false if the name already exists. 
     */
    createEdgeGroup(group_name: string): boolean {
        if (!this.edgeGroups.has(group_name)) {
            this.edgeGroups.set(group_name, new Set());
            return true;
        }
        return false;
    }

    /**
     * Creates a copy of the Hypergraph.
     */
    copy(): Hypergraph {
        const g = new Hypergraph();

        /** Inherits the type information. */
        Object.assign(g.info, this.info);

        /** Copies the vertex set and prepare the incidency matrix. */
        for (const vertex of this.incidency.keys()) {
            g.addVertex(vertex);
        }

        /** Creates new hyperedges. */
        const replace_edge = new Map<Hyperedge, Hyperedge>();
        for (const edge_old of this.edges) {
            const edge_new: Hyperedge = new MSet<LabeledVertex>(edge_old);
            replace_edge.set(edge_old, edge_new);
            g.edges.add(edge_new);
        }

        /** Computes the edge groups and incidency matrix. */
        for (const [group_name, edge_group] of this.edgeGroups) {
            /** Creates an edge group and adds it to the copy. */
            const cur_group: EdgeGroup = new Set<Hyperedge>();
            g.edgeGroups.set(group_name, cur_group);
            for (const edge_old of edge_group) {
                const edge_new = replace_edge.get(edge_old) ?? NullHyperedge;
                cur_group.add(edge_new);
                /** Updates the incidency matrix. */
                for (const vertex of edge_new.elements()){
                    g.incidency.get(vertex)?.add(edge_new);
                }
            }
        }

        return g;
    }

    /**
     * Creates a subgraph of all edges that makes the test function true.
     * The vertex set is not changed.
     * @note The copied Hypergraph can be used as an optional argument for the test function, but it will change dynamically during the filtering process.
     * @todo Optimize it later.
     */
    filterEdges (test: (edge: Hyperedge, g?: Hypergraph) => boolean): Hypergraph {
        const result = this.copy();
        /** Removes all edges that do not pass the test from the copied Hypergraph. */
        for (const edge of result.edges){
            if (!test(edge, result)){
                result.deleteEdge(edge);
            }
        }
        return result;
    }

    /**
     * Creates a subgraph of all vertices that 
     */
    filterVertices (test: (vertex: LabeledVertex, g?: Hypergraph) => boolean): Hypergraph {
        const result = this.copy();
        /** Removes all vertices that do not pass the test from the copied Hypergraph. */
        for (const vertex of result.incidency.keys()){
            if (!test(vertex, result)){
                result.deleteVertex(vertex);
            }
        }
        return result;
    }

    /**
     * @returns The first instance of the labeled vertices having the specified key-value pair, or NullLabeledVertex if there are no such vertices.
     */
    firstVertexOf (key: string, value: any): LabeledVertex {
        for (const v of this.incidency.keys()){
            if (v.get(key) == value){
                return v;
            }
        }
        return NullLabeledVertex
    }
}