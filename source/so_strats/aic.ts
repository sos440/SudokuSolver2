import { SOVertex, SOVertexID, SOEdge, SOEdgeType, SOPuzzle } from "../so_graph";
import { PartialMemento } from "../system/memento";
import { SOSolver } from "../so_solver";
import { range } from "../basic/tools";
import { MSet } from "../math/multiset";

/** Merge declaration of the class SOSolver. */
declare module "../so_solver" {
    interface SOSolver {
        /** AIC Generator */
        AICGenerator(
            name: string,
            s_dir: SOEdgeType[],
            w_dir: SOEdgeType[],
            max_depth: number
        ): (pz: SOPuzzle) => PartialMemento[];
    }
}

/** AIC Generator */
SOSolver.prototype.AICGenerator = function (
    name: string,
    s_dir: SOEdgeType[],
    w_dir: SOEdgeType[],
    max_depth: number
) {
    return (pz: SOPuzzle): PartialMemento[] => {
        const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
        const grp_cmds = new Array<string>();
        const grp_cmds_rm = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`title expert "${name}"`],
                snapshot: {
                    annotations: grp_cmds
                }
            },
            {
                type: 'middle',
                logs: [],
                snapshot: {
                    annotations: grp_cmds_rm
                }
            },
            {
                type: 'final',
                logs: [],
                snapshot: {
                    vertices: v_ids,
                    annotations: []
                }
            }
        ];

        for (const result of pz.loopAIC(s_dir, w_dir, max_depth)) {
            const vlist = result.vertexChain;
            const vlist_1 = vlist.filter((_, i) => ((i % 2) == 0));
            const vlist_2 = vlist.filter((_, i) => ((i % 2) == 1));
            vlist_1.forEach((v) => { grp_cmds.push(`highlight mark ${v.id} as intersect`); });
            vlist_2.forEach((v) => { grp_cmds.push(`highlight mark ${v.id} as based`); });

            /** A temporary code for conveniently dealing with rank -1 config. */
            if (result.rank == -1) {
                /** Creates a report. */
                h_seg[0].logs?.push(`log "A nice discontinuous loop of rank -1 and order ${result.strongEdges.size} has been found."`);
                h_seg[0].logs?.push(`log "${vlist.map((v, i) => `${(i % 2) ? 'X' : ''}${v.name}`).join(' -- ')}"`);
                h_seg[0].logs?.push(`log "The discontinuity at ${result.conflictAt.name} is determed as true."`);

                grp_cmds.push(`highlight mark ${result.conflictAt.id} as determined`);
                grp_cmds_rm.push(`highlight mark ${result.conflictAt.id} as determined`);

                for (const v_targ of pz.getVisibles(result.conflictAt)) {
                    v_ids.delete(v_targ.id);
                    h_seg[1].logs?.push(`log "${v_targ.name} can see the determined candidate."`);
                    h_seg[2].logs?.push(`log "${v_targ.name} is erased."`);
                    grp_cmds_rm.push(`highlight mark ${v_targ.id} as removed`);
                }

                return h_seg;
            }
            else if (result.rank == 0) {
                vlist.pop();

                /** Creates a report. */
                h_seg[0].logs?.push(`log "A nice continuous loop of rank 0 and order ${result.strongEdges.size} has been found."`);
                h_seg[0].logs?.push(`log "${vlist.map((v, i) => `${(i % 2) ? 'X' : ''}${v.name}`).join(' -- ')} -- cycle"`);

                vlist_1.forEach((v) => { grp_cmds_rm.push(`highlight mark ${v.id} as intersect`); });
                vlist_2.forEach((v) => { grp_cmds_rm.push(`highlight mark ${v.id} as based`); });

                /** Loops through the vertices to be removed. */
                for (const [v_targ, m] of result.weakOnlyVertices) {
                    if (m <= result.rank) { continue; }
                    v_ids.delete(v_targ.id);
                    h_seg[1].logs?.push(`log "${v_targ.name} can see both colors of the loop."`);
                    h_seg[2].logs?.push(`log "${v_targ.name} is erased."`);
                    grp_cmds_rm.push(`highlight mark ${v_targ.id} as removed`);
                }

                return h_seg;
            }
            else if (result.rank == 1) {
                vlist.pop();
                vlist.shift();

                /** Creates a report. */
                h_seg[0].logs?.push(`log "A nice discontinuous loop of rank 1 and order ${result.strongEdges.size} has been found."`);
                h_seg[0].logs?.push(`log "${vlist.map((v, i) => `${(i % 2) ? '' : 'X'}${v.name}`).join(' -- ')}"`);

                grp_cmds.push(`unhighlight mark ${result.conflictAt.id}`);
                vlist_1.forEach((v) => { grp_cmds_rm.push(`highlight mark ${v.id} as intersect`); });
                vlist_2.forEach((v) => { grp_cmds_rm.push(`highlight mark ${v.id} as based`); });

                for (const v_targ of Set.intersection(
                    pz.getVisibles(vlist[0]),
                    pz.getVisibles(vlist[vlist.length - 1])
                )) {
                    v_ids.delete(v_targ.id);
                    h_seg[1].logs?.push(`log "${v_targ.name} can see both endpoints."`);
                    h_seg[2].logs?.push(`log "${v_targ.name} is erased."`);
                    grp_cmds_rm.push(`highlight mark ${v_targ.id} as removed`);
                }

                return h_seg;
            }
        }

        return [];
    };
}

/** Represents the logical strength of a given edge. */
export enum AICStrength {
    Weak = 0,
    Strong = 1,
    Any = 2,
    Never = 3
}

/** Represents the assumed truth value of a vertex in the exploration. */
export enum AICTruth {
    False = 0,
    True = 1,
    Any = 2,
    Never = 3
}

/** Represents the outcome of the exploration. */
export interface AICOutcome {
    /** The rank of the configuration. */
    rank: number;
    /** The vertex that caused the logical conflict. */
    conflictAt: SOVertex;
    /** The strong edges in the loop. */
    strongEdges: Set<SOEdge>;
    /** The vertices belonging to any of the strong edges found. */
    strongVertices: MSet<SOVertex>;
    /** The weak edges in the loop. */
    weakEdges: Set<SOEdge>;
    /** The vertices belonging to any of the weak edges found. */
    weakVertices: MSet<SOVertex>;
    /** The index function. */
    weakOnlyVertices: MSet<SOVertex>;
    /** The chain of vertices that formed the loop. */
    vertexChain: Array<SOVertex>;
};


/** Represents the exploration state of a vertex. */
export class AICExpState {
    /** Represents the current vertex. */
    vertex: SOVertex;
    /** Represents the graph distance from the root. */
    dist: number;
    /** Represents the previous state. */
    prev: AICExpState | null;
    /** Represents the last "inward" hyperedge that updated this state. */
    lastEdge: SOEdge | null;
    /** Represents the logical strength of the last edge. */
    lastEdgeStr: AICStrength;
    /** Represents the assumed truth value of the initial vertex. */
    initTruth: AICTruth;

    constructor(
        v: SOVertex,
        dist?: number,
        prev?: AICExpState,
        last_edge?: SOEdge,
        last_edge_str?: AICStrength
    ) {
        this.vertex = v;
        this.dist = dist ?? Infinity;
        this.prev = prev ?? null;
        this.lastEdge = last_edge ?? null;
        this.lastEdgeStr = last_edge_str ?? AICStrength.Any;
        this.initTruth = this.computeInitTruth();
    }

    /** Computes the assumed truth value of the initial vertex. */
    computeInitTruth(): AICTruth {
        switch (this.lastEdgeStr) {
            case AICStrength.Weak:
                return (this.dist % 2) ? AICTruth.True : AICTruth.False;
            case AICStrength.Strong:
                return (this.dist % 2) ? AICTruth.False : AICTruth.True;
            case AICStrength.Any:
                return AICTruth.Any;
            case AICStrength.Never:
                return AICTruth.Never;
        }
    }

    /** Returns the edge path from the root to the current vertex. */
    get edgeHistory(): SOEdge[] {
        let cur_state: AICExpState | null = this;
        const result: SOEdge[] = [];
        while (cur_state && cur_state.lastEdge) {
            result.unshift(cur_state.lastEdge);
            cur_state = cur_state.prev;
        }
        return result;
    }

    /** Returns the vertex path from the root to the current vertex. */
    get vertexHistory(): SOVertex[] {
        let cur_state: AICExpState | null = this;
        const result: SOVertex[] = [];
        while (cur_state) {
            result.unshift(cur_state.vertex);
            cur_state = cur_state.prev;
        }
        return result;
    }
}

/** Represents the exploration machine running on top of the puzzle. */
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

    /** Explore while a nice loop is found or all the states reach the maximum depth. */
    *explore(max_dist: number): IterableIterator<AICOutcome> {
        let loop_continue = true;
        while (loop_continue) {
            loop_continue = false;
            for (const [i, cur_v] of this.queue.entries()) {
                const cur_state = this.states.get(cur_v) as AICExpState;
                /** Only accepts the vertex within the maximum allowed distance. */
                if (cur_state.dist >= max_dist) { continue; }

                /** Takes the current vertex out of the queue. */
                this.queue.splice(i, 1);
                yield* this.propagate(cur_state);

                /** Continue exploration. */
                loop_continue = true;
                break;
            }
        }
    };

    /** Propagate the current state to the neighboring vertices. */
    *propagate(cur_state: AICExpState): IterableIterator<AICOutcome> {
        const cur_v = cur_state.vertex;
        for (const cur_e of SOPuzzle.incident(cur_v, SOPuzzle.edgeTypes)) {
            const new_t = cur_e.type;

            /** Casted strength type of the current edge based on that of the previous and current one. */
            const new_str = AICExplore.regardAs(
                cur_state.lastEdgeStr,
                (cur_e.$['v'].size == 2) ? AICStrength.Strong : AICStrength.Weak
            );

            /** Only accepts the admissible edge types. */
            if (new_str == AICStrength.Never) { continue; }
            if (new_str == AICStrength.Strong && this.sDir.indexOf(new_t) == -1) { continue; }
            if (new_str == AICStrength.Weak && this.wDir.indexOf(new_t) == -1) { continue; }

            /** Loops through the vertices in the current edge. */
            for (const new_v of cur_e.$['v']) {
                /** Skips the current vertex. */
                if (new_v == cur_v) { continue; }
                /** No direct backtracking! */
                if (new_v == cur_state.prev?.vertex) { continue; }

                const new_state = new AICExpState(new_v, cur_state.dist + 1, cur_state, cur_e, new_str);
                const result = this.resolve(new_state);
                if (result) {
                    yield result;
                    return;
                }
            }
        }
    }

    /** Resolves the conflict if necessary and then updates the queue. */
    resolve(new_state: AICExpState): AICOutcome | undefined {
        const old_state = this.states.get(new_state.vertex);

        /** Resolve conflict between the old and new states. */
        if (old_state) {
            /** If the two state originaed from the same state: */
            if (new_state.prev == old_state.prev) {
                /** Each link must be used only once, hence the new one is ignored. */
                return;
            }
            else if (new_state.vertex.type == 'abstract') {
                /** We do not care about conflicts at abstract vertices, hence the new one is ignored. */
                return;
            }
            /** If the two states originated from the same initial truth value: */
            else if (new_state.initTruth == old_state.initTruth) {
                /** Chooses the one with the shorter distance to the initial vertex: */
                if (new_state.dist < old_state.dist) {
                    this.states.set(new_state.vertex, new_state);
                    this.queue.push(new_state.vertex);
                }
                return;
            }
            /** If the two states originated from different truth values: */
            else {
                const result: AICOutcome = {
                    /** The rank of the configuration. */
                    rank: 0,
                    /** The vertex that caused the logical conflict. */
                    conflictAt: new_state.vertex,
                    strongEdges: new Set<SOEdge>(),
                    strongVertices: new MSet<SOVertex>(),
                    weakEdges: new Set<SOEdge>(),
                    weakVertices: new MSet<SOVertex>(),
                    weakOnlyVertices: new MSet<SOVertex>(),
                    vertexChain: new Array<SOVertex>()
                };

                /** Compute the rank. */
                if (new_state.lastEdgeStr == old_state.lastEdgeStr) {
                    result.rank = (new_state.lastEdgeStr == AICStrength.Strong) ? -1 : 1;
                }

                /** Compute the configuration. */
                const cycle = [...new_state.edgeHistory.reverse(), ...old_state.edgeHistory];
                const even_only = (_: SOEdge, i: number) => ((i % 2) == 0);
                const odd_only = (_: SOEdge, i: number) => ((i % 2) == 1);
                const is_se_first = new_state.lastEdgeStr == AICStrength.Strong;

                result.strongEdges = new Set<SOEdge>(cycle.filter(is_se_first ? even_only : odd_only));
                result.weakEdges = new Set<SOEdge>(cycle.filter(is_se_first ? odd_only : even_only));

                result.strongVertices = MSet.add(...result.strongEdges.map((e) => e.$['v']));
                result.weakVertices = MSet.add(...result.weakEdges.map((e) => e.$['v']));

                result.weakOnlyVertices = MSet.subtract(result.weakVertices, result.strongVertices);

                if (result.rank >= 0 &&
                    !result.weakOnlyVertices.some((v: SOVertex, m: number) =>
                        (m > result.rank) && (v.type == 'genuine')
                    )
                ) { return; }

                result.vertexChain = [...new_state.vertexHistory.reverse(), ...old_state.vertexHistory.slice(1)];

                /** ...and return the computed result. */
                return result;
            }
        }
        else {
            this.states.set(new_state.vertex, new_state);
            this.queue.push(new_state.vertex);
        }
    };

    /** Compute the possible weak/strong-types of the edges to explore. */
    static regardAs(type_prev: AICStrength, type_cur: AICStrength): AICStrength {
        switch (type_prev) {
            case AICStrength.Strong:
                return AICStrength.Weak;
            case AICStrength.Weak:
                switch (type_cur) {
                    case AICStrength.Strong:
                        return AICStrength.Strong;
                    default:
                        return AICStrength.Never;
                }
            case AICStrength.Any:
                return type_cur;
            case AICStrength.Never:
                return AICStrength.Never;
        }
    }
}

/** Merge declaration of the class SOPuzzle. */
declare module "../so_graph" {
    interface SOPuzzle {
        /** Loops through nice loops. */
        loopAIC(s_dir: SOEdgeType[], w_dir: SOEdgeType[], max_depth: number): Generator<AICOutcome>;
    }
}

SOPuzzle.prototype.loopAIC = function* (
    s_dir: SOEdgeType[],
    w_dir: SOEdgeType[],
    max_depth: number
) {
    /** Stores partial exploration status. */
    const exp_hashmap = new Map<SOVertex, AICExplore>();

    /** Loops through maximum allowed depths. */
    for (const depth of range(2, max_depth + 1)) {
        for (const v of this.adV) {
            /** Skip missing vertices and naked singles. */
            if (!v) { continue; }
            if ([...SOPuzzle.incident(v, SOPuzzle.edgeTypesGenuine)].some((e) => e.$['v'].size == 1)) { continue; }

            /** Initializes an exploration if it doesn't already have one. */
            if (!exp_hashmap.has(v)) {
                exp_hashmap.set(v, new AICExplore(v, s_dir, w_dir));
            }

            const explorer = exp_hashmap.get(v) as AICExplore;
            yield* explorer.explore(depth);
        }
    }
}