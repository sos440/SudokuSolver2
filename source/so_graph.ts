/**
 * A module for the graph structure of the original sudoku game.
 */
import './math/math';
import { BaseN, range } from './basic/tools';

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
}