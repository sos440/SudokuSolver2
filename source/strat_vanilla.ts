/**
 * @module strategy
 */

import { SOVertex, SOEdge, SOSupergraph, SOGroup } from "./sudoku_original";

/** Represents annotations on the puzzle canvas. */
interface PuzzleCanvasAnnotations {
}

/** Represents any action that can be done on the puzzle canvas. */
interface PuzzleAction {
    query: string;
}

/** Represents log messages to be displayed. */
interface SolverLogMessage {
}

/** Represents items in the timeline. */
export class HistoryElement {
    /** The type of the HistoryElement. */
    type: string = 'undefined';
    /** Set of vertices in the current puzzle. */
    vertices?: Set<SOVertex>;
    /** Set of givens (clues) in the current puzzle. */
    clues?: Set<SOVertex>;
    /** Set of determined vertices (including givens) in the current puzzle. */
    determined?: Set<SOVertex>;
    /** List of actions to be applied to the puzzle canvas/editor/etc. */
    actions: PuzzleAction[];

    constructor(arg: string | object | undefined) {
        this.actions = new Array<PuzzleAction>();
        if (typeof arg == 'undefined') {
            /** Do nothing */
        }
        else if (typeof arg == 'string') {
            this.type = arg;
        }
        else {
            Object.assign(this, arg);
        }
    }
}

/** The singleton object that controls the history. */
export class History {
    static timeline = new Array<HistoryElement[]>();
    static time = -1;
    static substep = 0;

    static next(): void {
    }

    static previous(): void {
    }

    static jump(time: number): void {
    }

    static view(): void {
    }

    static add(segment: HistoryElement[]): void {
    }

    static forgetFuture(): void {
    }
}

/** Represents an input of a strategy function. */
interface SolverRequest {
    puzzle: SOSupergraph;
    determined?: Set<SOVertex>;
}


export namespace SOStrategies {
    /** Obvious Candidate Removal */
    export const obviousCandidateRemoval = function (request: SolverRequest): HistoryElement[] {
        if (typeof request.determined == 'undefined') {
            throw TypeError(`A set of determined vertices must be provided.`);
        }

        let is_updated = false;
        const VE = request.puzzle.VE;
        const vertices = new Set<SOVertex>([...VE.rows.keys()]);
        const determined = request.determined;
        const h_seg = [
            new HistoryElement({
                type: 'obvious candidate removal',
                actions: [{ query: `updated by obvious candidate removal` }]
            }),
            new HistoryElement({
                type: 'obvious candidate removal',
                vertices: vertices
            })
        ];

        /** For each determined vertex in a cell represented by its index: */
        for (const index of determined) {
            /** Computes the set of vertices that can see the determined vertex. */
            const incident_edges = VE.rows.get(index) as Set<SOEdge>;
            const incident_edge_set = VE.columns.filter((edge, _) => incident_edges.has(edge));
            const vertex_visible = Set.union(...incident_edge_set.values());
            vertex_visible.delete(index);
            /** Loops through the 'visible' vertices. */
            for (const index2 of vertex_visible) {
                is_updated = true;
                vertices.delete(index2);
                h_seg[0].actions.push({ query: `highlight ${index2} as removed` });
                h_seg[1].actions.push({ query: `unmark ${index2}` });
                h_seg[1].actions.push({ query: `unhighlight ${index2}` });
            }
        }

        return (is_updated) ? h_seg : [];
    }


    /** Naked single */
    export const nakedSingle = function (request: SolverRequest): HistoryElement[] {
        if (typeof request.determined == 'undefined') {
            throw TypeError(`A set of determined vertices must be provided.`);
        }

        let is_updated = false;
        const VE = request.puzzle.VE;
        const EG = request.puzzle.EG;
        const determined = new Set(request.determined);
        const h_seg = [
            new HistoryElement({
                type: 'naked single',
                actions: [{ query: `updated by naked single` }]
            }),
            new HistoryElement({
                type: 'naked single',
                determined: determined
            })
        ];

        /** Loops through cells to find naked singles: */
        for (const edge of EG.columns.get('rc') as Set<SOEdge>) {
            const vertex_set = VE.columns.get(edge) as Set<SOVertex>;
            const first_vertex = [...vertex_set][0];
            /** If a naked single has been found: */
            if (vertex_set.size == 1 && !determined.has(first_vertex)) {
                is_updated = true;
                determined.add(first_vertex);
                h_seg[0].actions.push({ query: `highlight ${first_vertex} as determined` });
                h_seg[0].actions.push({ query: `determine ${first_vertex}` });
                h_seg[1].actions.push({ query: `unhighlight ${first_vertex}` });
            }
        }

        return (is_updated) ? h_seg : [];
    }


    /** Hidden single */
    export const hiddenSingle = function (request: SolverRequest): HistoryElement[] {
        let is_updated = false;
        const VE = request.puzzle.VE;
        const EG = request.puzzle.EG;
        const vertices = new Set<SOVertex>([...VE.rows.keys()]);
        const h_seg = [
            new HistoryElement({
                type: 'hidden single',
                actions: [{ query: `updated by hidden single` }]
            }),
            new HistoryElement({
                type: 'hidden single',
                vertices: vertices
            })
        ];

        /** Loop through *K-type units to find hidden singles: */
        for (const group of ['rk', 'ck', 'bk'] as SOGroup[]){
            for (const edge of EG.columns.get(group) as Set<SOEdge>){
                const vertex_set = VE.columns.get(edge) as Set<SOVertex>;
                const first_vertex = [...vertex_set][0];
                /** If a hidden single has been found: */
                if (vertex_set.size == 1) {
                    is_updated = true;
                    vertices.delete(first_vertex);
                    h_seg[0].actions.push({ query: `highlight ${first_vertex} as removed` });
                    h_seg[0].actions.push({ query: `log "Vertex ${first_vertex} is a hidden single of type ${group}."` });
                    h_seg[1].actions.push({ query: `unmark ${first_vertex}` });
                    h_seg[1].actions.push({ query: `unhighlight ${first_vertex}` });
                }
            }
        }

        return (is_updated) ? h_seg : [];
    }
}