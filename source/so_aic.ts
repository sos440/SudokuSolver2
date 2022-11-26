import { MSet } from './math/math';
import { SOEdge, SOVertex, SOEdgeType, SOPuzzle } from './so_graph';
import { SOSolver } from './so_solver';

export enum AICEdgeType {
    Weak = 0,
    Strong = 1,
    Any = 2,
    Never = 3
}

export enum AICTruth {
    False = 0,
    True = 1,
    Any = 2,
    Never = 3
}

/** Represents the exploration state of a vertex. */
export class AICExpState {
    /** Represents the current vertex. */
    vertex: SOVertex;
    /** Represents the graph distance from the root. */
    dist: number;
    /** Represents the previous state. */
    previousState: AICExpState | null;
    /** Represents the "inward" hyperedge that updated this state. */
    updater: SOEdge | null;
    /** Represents the type of the updater edge. */
    updaterType: AICEdgeType;

    constructor(
        v: SOVertex,
        dist?: number,
        prev?: AICExpState,
        updater?: SOEdge,
        updaterType?: AICEdgeType
    ) {
        this.vertex = v;
        this.dist = dist ?? Infinity;
        this.previousState = prev ?? null;
        this.updater = updater ?? null;
        this.updaterType = updaterType ?? AICEdgeType.Any;
    }

    /** Computes the original truth, based on the assumption that
     * the true state is initially propagated via weak edges, and
     * the false state is initially propagated via strong edges.
     */
    get initialTruth(): AICTruth {
        switch (this.updaterType) {
            case AICEdgeType.Weak:
                return (this.dist % 2) ? AICTruth.True : AICTruth.False;
            case AICEdgeType.Strong:
                return (this.dist % 2) ? AICTruth.False : AICTruth.True;
            case AICEdgeType.Any:
                return AICTruth.Any;
            case AICEdgeType.Never:
                return AICTruth.Never;
        }
    }

    get edgeHistory(): SOEdge[] {
        let cur_state: AICExpState | null = this;
        const result: SOEdge[] = [];
        while (cur_state && cur_state.updater) {
            result.unshift(cur_state.updater);
            cur_state = cur_state.previousState;
        }
        return result;
    }

    get vertexHistory(): SOVertex[] {
        let cur_state: AICExpState | null = this;
        const result: SOVertex[] = [];
        while (cur_state) {
            result.unshift(cur_state.vertex);
            cur_state = cur_state.previousState;
        }
        return result;
    }
}

export class AICExplore {
    root: AICExpState;
    states: Map<SOVertex, AICExpState>;
    queue: SOVertex[];
    sDir: SOEdgeType[];
    wDir: SOEdgeType[];
    constructor(v: SOVertex, s_dir: SOEdgeType[], w_dir: SOEdgeType[]) {
        this.root = new AICExpState(v, 0);
        this.states = new Map([[v, this.root]]);
        this.queue = [v];
        this.sDir = s_dir;
        this.wDir = w_dir;
    }

    advance(
        cur_state: AICExpState,
        cur_v: SOVertex,
        cur_e: SOEdge,
        new_t: AICEdgeType,
        new_v: SOVertex
    ) {
        /** Skips the current vertex. */
        if (new_v == cur_v) { return; }
        /** Creates a new state. */
        const new_state = new AICExpState(new_v, cur_state.dist + 1, cur_state, cur_e, new_t);

        /** Otherwise, compare this with an existing one and add it to the list if necessary. */
        const old_state = this.states.get(new_v);
        if (old_state) {
            /** Resolve conflict. */
            /** If the two states originated from the same initial truth value: */
            if (new_state.previousState == old_state.previousState) {
                /** Each link must be used only once, hence the new one is ignored. */
            }
            else if (new_state.initialTruth == old_state.initialTruth) {
                /** Chooses the one with the shorter distance to the initial vertex: */
                if (new_state.dist < old_state.dist) {
                    this.states.set(new_v, new_state);
                    this.queue.push(new_v);
                }
                else {
                    /** Do nothing */
                    return;
                }
            }
            /** If the two states originated from the different truth value: */
            else {
                const result = {
                    /** The rank of the configuration. */
                    rank: 0,
                    /** The vertex that caused the logical conflict. */
                    evidence: new_v,
                    strongEdges: new Set<SOEdge>(),
                    strongVertices: new MSet<SOVertex>(),
                    weakEdges: new Set<SOEdge>(),
                    weakVertices: new MSet<SOVertex>(),
                    weakOnlyVertices: new MSet<SOVertex>(),
                    vertexChain: new Array<SOVertex>()
                };

                /** Compute the rank. */
                if (new_state.updaterType == old_state.updaterType) {
                    result.rank = (new_state.updaterType == AICEdgeType.Strong) ? -1 : 1;
                }

                /** Compute the configuration. */
                const cycle = [...new_state.edgeHistory.reverse(), ...old_state.edgeHistory];
                const even_only = (_: SOEdge, i: number) => ((i % 2) == 0);
                const odd_only = (_: SOEdge, i: number) => ((i % 2) == 1);
                const is_se_first = new_state.updaterType == AICEdgeType.Strong;

                result.strongEdges = new Set<SOEdge>(cycle.filter(is_se_first ? even_only : odd_only));
                result.weakEdges = new Set<SOEdge>(cycle.filter(is_se_first ? odd_only : even_only));

                result.strongVertices = MSet.add(...result.strongEdges.map((e) => e.$['v']));
                result.weakVertices = MSet.add(...result.weakEdges.map((e) => e.$['v']));

                result.weakOnlyVertices = MSet.subtract(result.weakVertices, result.strongVertices);

                if (result.rank >= 0 && !result.weakOnlyVertices.some((_: SOVertex, m: number) => m > result.rank)) { return; }

                result.vertexChain = [...new_state.vertexHistory.reverse(), ...old_state.vertexHistory.slice(1)];

                /** ...and return the computed result. */
                return result;
            }
        }
        else {
            this.states.set(new_v, new_state);
            this.queue.push(new_v);
        }
    };

    *explore(max_dist: number) {
        /** Explore while all the states reach the maximum depth. */
        let loop_continue = true;
        while (loop_continue) {
            loop_continue = false;
            for (const [i, cur_v] of this.queue.entries()) {
                const cur_state = this.states.get(cur_v) as AICExpState;
                /** Only accepts the vertex within the maximum allowed distance. */
                if (cur_state.dist >= max_dist) { continue; }

                this.queue.splice(i, 1);
                loop_continue = true;

                /** Explore each type of edges incident to the current vertex. */
                for (const t of SOPuzzle.edgeTypes) {
                    const cur_e = cur_v.$[t];

                    /** Computes the current type of the edge. */
                    const new_t = AICExplore.regardAsTypes(
                        cur_state.updaterType,
                        (cur_e.$['v'].size == 2) ? AICEdgeType.Strong : AICEdgeType.Weak
                    );

                    /** Only accepts the admissible edge types. */
                    if (new_t == AICEdgeType.Never) { continue; }
                    if (new_t == AICEdgeType.Strong && this.sDir.indexOf(t) == -1) { continue; }
                    if (new_t == AICEdgeType.Weak && this.wDir.indexOf(t) == -1) { continue; }

                    /** Loops through the vertices in the current edge. */
                    for (const new_v of cur_e.$['v']) {
                        /** No direct backtracking! */
                        if (new_v == cur_state.previousState?.vertex) { continue; }

                        const result = this.advance(cur_state, cur_v, cur_e, new_t, new_v);
                        if (result) {
                            yield result;
                            return;
                        }
                    }
                }

                break;
            }
        }
        /** End of exploration. */
    };

    /** Compute the possible weak/strong-types of the edges to explore. */
    static regardAsTypes(type_prev: AICEdgeType, type_cur: AICEdgeType): AICEdgeType {
        switch (type_prev) {
            case AICEdgeType.Strong:
                return AICEdgeType.Weak;
            case AICEdgeType.Weak:
                switch (type_cur) {
                    case AICEdgeType.Strong:
                        return AICEdgeType.Strong;
                    default:
                        return AICEdgeType.Never;
                }
            case AICEdgeType.Any:
                return type_cur;
            case AICEdgeType.Never:
                return AICEdgeType.Never;
        }
    }
}
