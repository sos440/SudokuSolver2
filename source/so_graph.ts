/**
 * A module for the graph structure of the original sudoku game.
 */
import './math/math';
import { BaseN, range } from './basic/tools';
import { MSet } from './math/math';

/** Representing "0-dimensional" sections. */
export type SOVertexID = number;
export interface SOVertex {
    id: SOVertexID;
    $: {
        rc: SOEdge, rk: SOEdge, ck: SOEdge, bk: SOEdge,
        row: SOFace, col: SOFace, box: SOFace, key: SOFace
    }
}

/** Representing "1-dimensional" sections. */
export type SOEdgeID = number;
export type SOEdgeType = 'rc' | 'rk' | 'ck' | 'bk';
export interface SOEdge {
    type: SOEdgeType;
    proj: SOEdge | SOFace;
    id: SOEdgeID;
    $: {
        v: Set<SOVertex>,
        rc: Set<SOEdge>, rk: Set<SOEdge>, ck: Set<SOEdge>, bk: Set<SOEdge>,
        row?: SOFace, col?: SOFace, box?: SOFace, key?: SOFace
    }
}

/** Representing "2-dimensional" sections. */
export type SOFaceID = number;
export type SOFaceType = 'row' | 'col' | 'box' | 'key';
export interface SOFace {
    type: SOFaceType;
    id: SOFaceID;
    $: { v: Set<SOVertex>, rc: Set<SOEdge>, rk: Set<SOEdge>, ck: Set<SOEdge>, bk: Set<SOEdge> }
}


/** Representing nodes of a search tree for the strong wing of configurations. */
type Family<T> = Array<T> | Set<T>;
class SOSearchTreeNode {
    history: SOEdge[];
    adjWeaks: Set<SOEdge>;
    msetStrongs: MSet<SOVertex>;
    children: SOSearchTreeNode[];
    constructor(history: SOEdge[]) {
        this.history = history;
        this.adjWeaks = new Set<SOEdge>();
        this.msetStrongs = new MSet<SOVertex>();
        this.children = new Array<SOSearchTreeNode>();
    }

    /**
     * Loops through the given range of depths.
     * @param depth_s Start of the depth to loop through, inclusive.
     * @param depth_e End of the depth to loop through, inclusive.
     */
    *levels(depth_s: number, depth_e: number = Infinity): IterableIterator<SOSearchTreeNode> {
        if (depth_e < 0) {
            return;
        }
        if (depth_s <= 0) {
            yield this;
        }
        if (depth_e > 0) {
            for (const node of this.children) {
                yield* node.levels(depth_s - 1, depth_e - 1);
            }
        }
    }

    *levelsDown(depth_s: number, depth_e: number = Infinity): IterableIterator<SOSearchTreeNode> {
        for (let depth = depth_s; depth <= depth_e; depth++) {
            let count = 0;
            for (const node of this.levels(depth, depth)) {
                yield node;
                count++;
            }
            if (count == 0) {
                return;
            }
        }
    }
}

interface SOExpSConfigStatus {
    /** The smallest unexplored index for the list of strong edges. */
    nextS: number;
    /** The list of selected strong edges. */
    edges: SOEdge[];
    /** A partially constructed index function. */
    index: MSet<SOVertex>;
    /** The set of all possible weak edges that is incident to the selected strong edges. */
    ['=>W']: Set<SOEdge>;
    /** The set of all possible strong edges that is incident to the weak edges. */
    ['=>W=>S']: Set<SOEdge>;
}

interface SOExpWConfigStatus {
    /** The list of remaining weak edges to explore. */
    remaining: SOEdge[];
    /** The list of selected weak edges. */
    edges: SOEdge[];
    /** The index function at the given moment. */
    index: MSet<SOVertex>;
}

interface SOExpConfigOutcome {
    /** The list of selected strong edges. */
    strongEdges: SOEdge[];
    /** The list of selected weak edges. */
    weakEdges: SOEdge[];
    /** The index function. */
    index: MSet<SOVertex>;
}


/**
 * Represents vanilla, original sudoku of size parameter Dp
 */
export class SOPuzzle {
    p: number;
    D1: number;
    D2: number;
    D3: number;
    adV: SOVertex[];
    adE: { [key in SOEdgeType]: Array<SOEdge> };
    adF: { [key in SOFaceType]: Array<SOFace> };
    type: string;
    constructor(p: number, v_id_set?: Set<SOVertexID>) {
        if (!this.isDimParam(p)) {
            throw RangeError(`'${p}' is not a valid dimensional parameter.`);
        }

        this.type = 'sudoku original';

        this.p = p;
        this.D1 = this.p ** 2;
        this.D2 = this.D1 ** 2;
        this.D3 = this.D1 ** 3;
        this.adV = [];
        this.adE = { rc: [], rk: [], ck: [], bk: [] };
        this.adF = { row: [], col: [], box: [], key: [] };

        for (const [_, f_type, f_id] of this.loopRawFaces()) {
            this.adF[f_type][f_id] = {
                type: f_type, id: f_id,
                $: {
                    v: new Set<SOVertex>(),
                    rc: new Set<SOEdge>(),
                    rk: new Set<SOEdge>(),
                    ck: new Set<SOEdge>(),
                    bk: new Set<SOEdge>()
                }
            };
        }

        for (const [_, e_type, e_id, f_type1, f_type2] of this.loopRawEdges()) {
            const [f_id1, f_id2] = BaseN.toD(e_id, 2, this.D1);
            const e: SOEdge = {
                type: e_type, id: e_id, proj: this.adF[f_type1][f_id1],
                $: {
                    v: new Set<SOVertex>(),
                    [f_type1]: this.adF[f_type1][f_id1],
                    [f_type2]: this.adF[f_type2][f_id2],
                    rc: new Set<SOEdge>(),
                    rk: new Set<SOEdge>(),
                    ck: new Set<SOEdge>(),
                    bk: new Set<SOEdge>()
                }
            };
            if (e_type == 'rc') {
                e.proj = e;
            };
            this.adE[e_type][e_id] = e;
        }

        v_id_set = v_id_set ?? new Set(range(this.D3));

        for (const v_id of v_id_set) {
            if (!this.isVertexID(v_id)) {
                throw RangeError(`'${v_id}' is not a valid vertex ID.`);
            }

            const [row, col, key] = BaseN.toD(v_id, 3, this.D1);
            const d = BaseN.toD(v_id, 6, this.p);
            const box = BaseN.fromD([d[0], d[2]], this.p);
            const inn = BaseN.fromD([d[1], d[3]], this.p);

            const v = {
                id: v_id,
                $: {
                    rc: this.adE.rc[BaseN.fromD([row, col], this.D1)],
                    rk: this.adE.rk[BaseN.fromD([row, key], this.D1)],
                    ck: this.adE.ck[BaseN.fromD([col, key], this.D1)],
                    bk: this.adE.bk[BaseN.fromD([box, key], this.D1)],
                    row: this.adF.row[row],
                    col: this.adF.col[col],
                    box: this.adF.box[box],
                    key: this.adF.key[key],
                }
            };

            this.adV[v_id] = v;
            for (const e_type of this.edgeTypes()) {
                v.$[e_type].$['v'].add(v);
                for (const e_type2 of this.edgeTypes()) {
                    v.$[e_type].$[e_type2].add(v.$[e_type2]);
                }
            }
            for (const f_type of this.faceTypes()) {
                v.$[f_type].$['v'].add(v);
                for (const e_type of this.edgeTypes()) {
                    v.$[f_type].$[e_type].add(v.$[e_type]);
                }
            }
        }
    }

    isDimParam = (p: number): boolean => {
        return (Number.isInteger(p) && p > 0 && p <= 8);
    };

    isVertexID = (v_id: SOVertexID): boolean => {
        return (Number.isInteger(v_id) && v_id >= 0 && v_id < this.D3);
    };

    isVertexIDSet = (v_ids?: Set<SOVertexID>): boolean => {
        return v_ids ? v_ids.every(this.isVertexID) : false;
    };

    *edgeTypes(): IterableIterator<SOEdgeType> {
        yield* ['rc', 'rk', 'ck', 'bk'];
    }

    *edgeTypeTriples(): IterableIterator<[SOEdgeType, SOFaceType, SOFaceType]> {
        yield* [
            ['rc', 'row', 'col'],
            ['rk', 'row', 'key'],
            ['ck', 'col', 'key'],
            ['bk', 'box', 'key']
        ];
    }

    *faceTypes(): IterableIterator<SOFaceType> {
        yield* ['row', 'col', 'box', 'key'];
    }

    *loopRawEdges(): IterableIterator<[SOEdge, SOEdgeType, SOEdgeID, SOFaceType, SOFaceType]> {
        for (const [e_type, f_type1, f_type2] of this.edgeTypeTriples()) {
            for (const e_id of range(this.D2)) {
                yield [this.adE[e_type][e_id], e_type, e_id, f_type1, f_type2];
            }
        }
    }

    *loopRawFaces(): IterableIterator<[SOFace, SOFaceType, SOFaceID]> {
        for (const f_type of this.faceTypes()) {
            for (const f_id of range(this.D1)) {
                yield [this.adF[f_type][f_id], f_type, f_id];
            }
        }
    }

    *loopEdges(e_types: SOEdgeType[], v_ids?: Set<SOVertexID>): IterableIterator<SOEdge> {
        if (v_ids && !this.isVertexIDSet(v_ids)) {
            throw RangeError(`The input is not a valid set of vertex IDs.`);
        }
        for (const e_type of e_types) {
            if (v_ids) {
                yield* v_ids.map((v) => this.adV[v].$[e_type]);
            }
            else {
                yield* this.adE[e_type];
            }
        }
    }

    *loopLineBox(): IterableIterator<[SOEdge, SOEdge]> {
        for (const e_type of ['rk', 'ck'] as SOEdgeType[]) {
            for (const e_line of this.adE[e_type]) {
                for (const e_box of e_line.$['bk']) {
                    yield [e_line, e_box];
                }
            }
        }
    }

    *loopFaceConfig(subset_size: number, type_triples: [SOFaceType, SOEdgeType, SOEdgeType][]) {
        for (const [f_type, e_type_s, e_type_w] of type_triples) {
            for (const face of this.adF[f_type]) {
                const eset_s = face.$[e_type_s];
                /** Filters strong edges with multiple candidates. */
                const eset_s_f = eset_s.filter((e) => e.$['v'].size > 1);

                /** Loops through subsets of strong units: */
                for (const eset_s_sub of eset_s_f.subsets(subset_size)) {
                    /** Computes the set of weak edges intersecting strong edges. */
                    const vset_s = Set.union(...eset_s_sub.map((e) => e.$['v']));
                    const eset_w = vset_s.map((v) => v.$[e_type_w]);
                    if (eset_w.size > subset_size) { continue; }

                    /** Computes the vertices in each of strong/weak set of edges. */
                    const vset_w = Set.union(...eset_w.map((e) => e.$['v']));
                    const vset_wonly = Set.diff(vset_w, vset_s);
                    if (vset_wonly.size == 0) { continue; }

                    yield {
                        face: face,
                        strongEdges: eset_s_sub,
                        strongVertices: vset_s,
                        weakEdges: eset_w,
                        weakVertices: vset_w,
                        weakOnlyVertices: vset_wonly
                    };
                }
            }
        }
    }

    /**
     * Creates a search tree for lists of strong links that are connected by weak links.
     * @param eset The scope of strong links.
     * @param s_types The types of strong edges to explore.
     * @param w_types The types of weak edges to explore.
     */
    static buildSearchTree(
        eset: Set<SOEdge>,
        s_types: SOEdgeType[],
        w_types: SOEdgeType[],
        max_depth: number = Infinity
    ) {
        const nbd_s_dir = (e: SOEdge) => Set.union(...s_types.map((t) => e.$[t]));
        const nbd_w_dir = (e: SOEdge) => Set.union(...w_types.map((t) => e.$[t]));
        const expand = (ecol: Family<SOEdge>, nbd: (e: SOEdge) => Set<SOEdge>) => Set.union(...ecol.map(nbd));
        const elist = [...eset].sort((e1, e2) => (e1.$['v'].size - e2.$['v'].size));

        const root = new SOSearchTreeNode([]);
        const build_next = (node: SOSearchTreeNode, elist_cur: SOEdge[]) => {
            /** Computes the set of strong edges that can be added. */
            const h_2nbd = (node.history.length > 0)
                ? expand(node.adjWeaks, nbd_s_dir)
                : eset;

            /** Loops through the edges in the given list. */
            for (const [i, e] of elist_cur.entries()) {
                if (!h_2nbd.has(e)) { continue; }

                /** Creates a new child node. */
                const node_child = new SOSearchTreeNode(node.history.concat([e]));
                node_child.adjWeaks = Set.diff(
                    Set.union(node.adjWeaks, nbd_w_dir(e)),
                    new Set(node_child.history)
                );
                node_child.msetStrongs = MSet.add(
                    node.msetStrongs,
                    new MSet(e.$['v'])
                );

                node.children.push(node_child);
                if (node_child.history.length < max_depth) {
                    build_next(node_child, elist_cur.slice(i + 1));
                }
            }

            /** Returns the current node. */
            return node;
        };

        return build_next(root, elist);
    }

    *loopConfig(
        /** Interval notation for the order of configs to be explored. */
        ord_itvl: [number, number],
        /** Interval notation for the rank of configs to be explored. */
        rank_itvl: [number, number],
        /** Allowed types of strong edges. */
        se_types: SOEdgeType[],
        /** Allowed types of weak edges. */
        we_types: SOEdgeType[]
    ) {
        /** Universe of all allowed strong edges. */
        const se_univ = new Array<SOEdge>()
            .concat(...se_types.map((t) => this.adE[t]))
            .filter((e) => (e.$['v'].size > 1))
            .sort((e1, e2) => (e1.$['v'].size - e2.$['v'].size));

        /** Computes the set of all incident strong edges. */
        const incS = (e: SOEdge) => Set.union(...se_types.map((t) => e.$[t]));
        /** Computes the set of all incident weak edges. */
        const incW = (e: SOEdge) => Set.union(...we_types.map((t) => e.$[t]));

        const expW = function* (
            node_s: SOExpSConfigStatus,
            order: number,
            depth: number,
            parent_nodes: SOExpWConfigStatus[]
        ): IterableIterator<SOExpConfigOutcome> {
            if (depth > (order + rank_itvl[1])) { return; }

            const cur_nodes = new Array<SOExpWConfigStatus>();
            for (const node of parent_nodes) {
                const cur_index = node.index;
                /** Sort the remaining weak edges by the total index. */
                const cur_remaining = node.remaining
                    .map<[SOEdge, number]>((e) => [e, cur_index.sum(e.$['v'])])
                    .sort((x1, x2) => x1[1] - x2[1])
                    .map((x) => x[0]);
                for (const [i, ew] of cur_remaining.entries()) {
                    cur_nodes.push({
                        remaining: cur_remaining.slice(i + 1),
                        edges: node.edges.concat([ew]),
                        index: MSet.add(cur_index, ew.$['v'])
                    })
                }
            }

            if (depth >= (order + rank_itvl[0])) {
                for (const node_w of cur_nodes) {
                    yield {
                        strongEdges: node_s.edges,
                        weakEdges: node_w.edges,
                        index: node_w.index
                    }
                }
            }

            yield* expW(node_s, order, depth + 1, cur_nodes);
        };

        /** Creates an internal generator for recursive iteration. */
        const expS = function* (
            /** Current depth. */
            order: number,
            /** Set of nodes at the previous depth. */
            parent_nodes: SOExpSConfigStatus[] = []
        ): IterableIterator<IterableIterator<SOExpConfigOutcome>> {
            /** Terminates the recursion when the depth is beyond the maximum order. */
            if (order > ord_itvl[1]) { return; }

            /** Builds the set of nodes at the current depth. */
            const cur_nodes = new Array<SOExpSConfigStatus>();
            if (order == 1) {
                for (const i of range(0, se_univ.length)) {
                    const se = se_univ[i];

                    /** Creates a new exploration status from scratch. */
                    const new_incW = incW(se);
                    cur_nodes.push({
                        nextS: i + 1,
                        edges: [se],
                        index: MSet.subtract(new MSet<SOVertex>(), new MSet(se.$['v'])),
                        ['=>W']: new_incW,
                        ['=>W=>S']: Set.union(...new_incW.map(incS))
                    });
                }
            }
            else {
                for (const node of parent_nodes) {
                    for (const i of range(node.nextS, se_univ.length)) {
                        const se = se_univ[i];
                        /** Does not allow overlapping strong edges. */
                        if (node['=>W'].has(se)) { continue; }
                        /** Only allows strong edges within 2-edge distance. */
                        if (!node['=>W=>S'].has(se)) { continue; }

                        /** Creates a new exploration status for the enlarged set of strong edges. */
                        const new_incW = incW(se);
                        cur_nodes.push({
                            nextS: i + 1,
                            edges: node.edges.concat([se]),
                            index: MSet.subtract(node.index, new MSet(se.$['v'])),
                            ['=>W']: Set.union(node['=>W'], new_incW),
                            ['=>W=>S']: Set.union(node['=>W=>S'], ...new_incW.map(incS))
                        });
                    }
                }
            }

            /** Yields the status if available. */
            if (order >= ord_itvl[0]) {
                for (const node_s of cur_nodes) {
                    console.log(`Order: ${order} | W-neighbor size: ${node_s['=>W'].size}`);
                    yield expW(node_s, order, 1, [{
                        remaining: [...node_s['=>W']],
                        edges: [],
                        index: node_s.index
                    }]);
                }
            }

            /** Invoke the recursive step. */
            yield* expS(order + 1, cur_nodes);
        }

        /** Initiate the generator. */
        yield* expS(1);
    }
}