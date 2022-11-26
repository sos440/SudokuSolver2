/**
 * A module for the graph structure of the original sudoku game.
 */
import './math/math';
import { BaseN, range } from './basic/tools';

/** Representing "0-dimensional" sections. */
export type SOVertexID = number;
export interface SOVertex {
    id: SOVertexID;
    name?: string;
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
    name?: string;
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
    name?: string;
    $: { v: Set<SOVertex>, rc: Set<SOEdge>, rk: Set<SOEdge>, ck: Set<SOEdge>, bk: Set<SOEdge> }
}

/**
 * Represents the type of a configuration.
 */
type SOConfigType = [SOFaceType, SOEdgeType | SOEdgeType[], SOEdgeType | SOEdgeType[]];


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
        if (!SOPuzzle.isDimParam(p)) {
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

        for (const [_, f_type, f_id] of this.__loopRawFaces()) {
            this.adF[f_type][f_id] = {
                type: f_type, id: f_id,
                name: `${f_type}${f_id + 1}`,
                $: {
                    v: new Set<SOVertex>(),
                    rc: new Set<SOEdge>(),
                    rk: new Set<SOEdge>(),
                    ck: new Set<SOEdge>(),
                    bk: new Set<SOEdge>()
                }
            };
        }

        for (const [_, e_type, e_id, f_type1, f_type2] of this.__loopRawEdges()) {
            const [f_id1, f_id2] = BaseN.toD(e_id, 2, this.D1);
            const e: SOEdge = {
                type: e_type, id: e_id, proj: this.adF[f_type1][f_id1],
                name: `${e_type}${f_id1 + 1}${f_id2 + 1}`,
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
                name: `${key + 1}[${row + 1},${col + 1}]`,
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
            for (const e_type of SOPuzzle.edgeTypes) {
                v.$[e_type].$['v'].add(v);
                for (const e_type2 of SOPuzzle.edgeTypes) {
                    v.$[e_type].$[e_type2].add(v.$[e_type2]);
                }
            }
            for (const f_type of SOPuzzle.faceTypes) {
                v.$[f_type].$['v'].add(v);
                for (const e_type of SOPuzzle.edgeTypes) {
                    v.$[f_type].$[e_type].add(v.$[e_type]);
                }
            }
        }
    }

    static edgeTypes: SOEdgeType[] = ['rc', 'rk', 'ck', 'bk'];

    static faceTypes: SOFaceType[] = ['row', 'col', 'box', 'key'];

    static edgeTypeTriples: [SOEdgeType, SOFaceType, SOFaceType][] = [
        ['rc', 'row', 'col'],
        ['rk', 'row', 'key'],
        ['ck', 'col', 'key'],
        ['bk', 'box', 'key']
    ];

    /** Checks if the given input is a valid dimensional parameter. */
    static isDimParam = (p: number): boolean => {
        return (Number.isInteger(p) && p > 0 && p <= 8);
    };

    /** Checks if the given input is a valid format for vertex ID. */
    isVertexID = (v_id: SOVertexID): boolean => {
        return (Number.isInteger(v_id) && v_id >= 0 && v_id < this.D3);
    };

    /** Checks if the given set is a valid set of vertex IDs. */
    isVertexIDSet = (v_ids?: Set<SOVertexID>): boolean => {
        return v_ids ? v_ids.every((v) => this.isVertexID(v)) : false;
    };

    /** Returns the set of all vertices that can see the specified vertex. */
    getVisibles(v: SOVertex) {
        const v_visible = Set.union(v.$['rc'].$['v'], v.$['rk'].$['v'], v.$['ck'].$['v'], v.$['bk'].$['v']);
        v_visible.delete(v);
        return v_visible;
    }

    /** 
     * Loops through the essential information needed to build edges.
     * Only used in the constructor.
     */
    *__loopRawEdges(): IterableIterator<[SOEdge, SOEdgeType, SOEdgeID, SOFaceType, SOFaceType]> {
        for (const [e_type, f_type1, f_type2] of SOPuzzle.edgeTypeTriples) {
            for (const e_id of range(this.D2)) {
                yield [this.adE[e_type][e_id], e_type, e_id, f_type1, f_type2];
            }
        }
    }

    /** 
     * Loops through the essential information needed to build faces.
     * Only used in the constructor.
     */
    *__loopRawFaces(): IterableIterator<[SOFace, SOFaceType, SOFaceID]> {
        for (const f_type of SOPuzzle.faceTypes) {
            for (const f_id of range(this.D1)) {
                yield [this.adF[f_type][f_id], f_type, f_id];
            }
        }
    }

    /** Loops through the edges of the specified types. */
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

    /** 
     * Loops through the rank-0 configuration of the specified order.
     * @param order The set size of each of the strong/weak wings.
     * @param type_triples The list of all (face type, strong edge type, weak edge type) triples to investigate. 
     */
    *loopFaceConfig(order: number, type_triples: SOConfigType[]) {
        for (const [f_type, e_type_s, e_type_w] of type_triples) {
            for (const face of this.adF[f_type]) {
                const eset_s = (typeof e_type_s == 'string')
                    ? face.$[e_type_s]
                    : Set.union(...e_type_s.map((t) => face.$[t]));
                /** Filters strong edges with multiple candidates. */
                const eset_s_f = eset_s.filter((e) => e.$['v'].size > 1);

                /** Loops through subsets of strong units: */
                for (const eset_s_sub of eset_s_f.subsets(order)) {
                    /** Computes the set of weak edges intersecting strong edges. */
                    const vset_s = Set.union(...eset_s_sub.map((e) => e.$['v']));
                    const eset_w = (typeof e_type_w == 'string')
                        ? vset_s.map((v) => v.$[e_type_w])
                        : Set.union(...e_type_w.map((t) => vset_s.map((v) => v.$[t])));
                    if (eset_w.size > order) { continue; }

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
}


