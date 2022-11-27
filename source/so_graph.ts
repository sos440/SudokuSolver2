/**
 * A module for the graph structure of the original sudoku game.
 */
import './math/math';
import { BaseN, range } from './basic/tools';

export abstract class SOIncidenceElement {
    selector: string;
    $: {
        v: Set<SOVertex>;
        rc: Set<SOEdge>; rk: Set<SOEdge>; ck: Set<SOEdge>; bk: Set<SOEdge>;
        grp: Set<SOEdge>; als: Set<SOEdge>; alf: Set<SOEdge>;
        row?: SOFace; col?: SOFace; box?: SOFace; key?: SOFace;
    };

    constructor() {
        this.selector = '';
        this.$ = {
            v: new Set<SOVertex>(),
            rc: new Set<SOEdge>(),
            rk: new Set<SOEdge>(),
            ck: new Set<SOEdge>(),
            bk: new Set<SOEdge>(),
            grp: new Set<SOEdge>(),
            als: new Set<SOEdge>(),
            alf: new Set<SOEdge>()
        }
    }

    *incident(t: SOEdgeType | Iterable<SOEdgeType>): IterableIterator<SOEdge> {
        if (typeof t == 'string') {
            yield* this.$[t];
        }
        else {
            for (const t_inst of t) { yield* this.$[t_inst]; }
        }
    }
}

/** Representing "0-dimensional" sections. */
export type SOVertexType = 'genuine' | 'abstract';
export type SOVertexID = number;
export class SOVertex extends SOIncidenceElement {
    type: SOVertexType;
    id: SOVertexID;
    name?: string;
    constructor(type: SOVertexType, id: SOVertexID, name?: string) {
        super();
        this.selector = `#v:${id}`;
        this.type = type;
        this.id = id;
        this.name = name;
    }
}

/** Representing "1-dimensional" sections. */
export type SOEdgeID = number;
/**
 * Represents the type of an edge.
 * @example 
 * `
 * rc: a cell
 * rk: a row with key given
 * ck: a column with key given
 * bk: a box with key given
 * grp: an abstract edge used in grouped AIC
 * als: an abstract edge used in ALS-based strategies (ALS = almost locked set)
 * alf: an abstract edge used in ALF-based strategies (ALF = almost locked fish)
 * `
 */
export type SOEdgeTypeGenuine = 'rc' | 'rk' | 'ck' | 'bk';
export type SOEdgeType = SOEdgeTypeGenuine | 'grp' | 'als' | 'alf';
export class SOEdge extends SOIncidenceElement {
    type: SOEdgeType;
    proj: SOEdge | SOFace;
    id: SOEdgeID;
    name?: string;
    constructor(type: SOEdgeType, id: SOEdgeID, name?: string) {
        super();
        this.type = type;
        this.id = id;
        this.name = name;
        this.proj = this;
    }
}

/** Representing "2-dimensional" sections. */
export type SOFaceID = number;
export type SOFaceType = 'row' | 'col' | 'box' | 'key';
export class SOFace {
    type: SOFaceType;
    id: SOFaceID;
    name?: string;
    $: {
        v: Set<SOVertex>;
        rc: Set<SOEdge>; rk: Set<SOEdge>; ck: Set<SOEdge>; bk: Set<SOEdge>;
    };
    constructor(type: SOFaceType, id: SOFaceID, name?: string) {
        this.type = type;
        this.id = id;
        this.name = name;
        this.$ = {
            v: new Set<SOVertex>(),
            rc: new Set<SOEdge>(),
            rk: new Set<SOEdge>(),
            ck: new Set<SOEdge>(),
            bk: new Set<SOEdge>()
        }
    }

    *incident(t: SOEdgeTypeGenuine | Iterable<SOEdgeTypeGenuine>): IterableIterator<SOEdge> {
        if (typeof t == 'string') {
            yield* this.$[t];
        }
        else {
            for (const t_inst of t) { yield* this.$[t_inst]; }
        }
    }
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
        if (!SOPuzzle.isDimParam(p)) {
            throw RangeError(`'${p}' is not a valid dimensional parameter.`);
        }

        this.type = 'sudoku original';

        this.p = p;
        this.D1 = this.p ** 2;
        this.D2 = this.D1 ** 2;
        this.D3 = this.D1 ** 3;
        this.adV = [];
        this.adE = { rc: [], rk: [], ck: [], bk: [], grp: [], als: [], alf: [] };
        this.adF = { row: [], col: [], box: [], key: [] };

        /** Add strict-type faces. */
        for (const [_, f_type, f_id] of this.__loopRawFaces()) {
            this.adF[f_type][f_id] = new SOFace(f_type, f_id, `${f_type}${f_id + 1}`);
        }

        /** Add strict-type edges. */
        for (const [_, e_type, e_id, f_type1, f_type2] of this.__loopRawEdges()) {
            const [f_id1, f_id2] = BaseN.toD(e_id, 2, this.D1);
            const e = new SOEdge(e_type, e_id, `${e_type}${f_id1 + 1}${f_id2 + 1}`);
            e.$[f_type1] = this.adF[f_type1][f_id1];
            e.$[f_type2] = this.adF[f_type2][f_id2];
            if (e_type != 'rc') {
                e.proj = this.adF[f_type1][f_id1];
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

            const v = new SOVertex('genuine', v_id, `${key + 1}[${row + 1},${col + 1}]`);
            v.$['rc'].add(this.adE.rc[BaseN.fromD([row, col], this.D1)]);
            v.$['rk'].add(this.adE.rk[BaseN.fromD([row, key], this.D1)]);
            v.$['ck'].add(this.adE.ck[BaseN.fromD([col, key], this.D1)]);
            v.$['bk'].add(this.adE.bk[BaseN.fromD([box, key], this.D1)]);
            v.$['row'] = this.adF.row[row];
            v.$['col'] = this.adF.col[col];
            v.$['box'] = this.adF.box[box];
            v.$['key'] = this.adF.key[key];

            this.adV[v_id] = v;
            for (const e_type of SOPuzzle.edgeTypesGenuine) {
                for (const e of v.$[e_type]) {
                    e.$['v'].add(v);
                }
                for (const e_type2 of SOPuzzle.edgeTypesGenuine) {
                    for (const e1 of v.$[e_type]) {
                        for (const e2 of v.$[e_type2]) {
                            e1.$[e_type2].add(e2);
                        }
                    }
                }
            }
            for (const f_type of SOPuzzle.faceTypes) {
                v.$[f_type]?.$['v'].add(v);
                for (const e_type of SOPuzzle.edgeTypesGenuine) {
                    for (const e of v.$[e_type]) {
                        v.$[f_type]?.$[e_type].add(e);
                    }
                }
            }
        }
    }

    static edgeTypes: SOEdgeType[] = ['rc', 'rk', 'ck', 'bk', 'grp', 'als', 'alf'];
    static edgeTypesGenuine: SOEdgeTypeGenuine[] = ['rc', 'rk', 'ck', 'bk'];
    static faceTypes: SOFaceType[] = ['row', 'col', 'box', 'key'];
    static edgeTypeTriples: [SOEdgeType, SOFaceType, SOFaceType][] = [
        ['rc', 'row', 'col'],
        ['rk', 'row', 'key'],
        ['ck', 'col', 'key'],
        ['bk', 'box', 'key']
    ];

    /** Loops through all the edges incident to the given vertex. */
    static *incident(v: SOVertex | Iterable<SOVertex>, t: SOEdgeType | Iterable<SOEdgeType>): IterableIterator<SOEdge> {
        if (v instanceof SOVertex) {
            yield* v.incident(t);
        }
        else {
            for (const v_inst of v) { yield* v_inst.incident(t); }
        }
    }

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
    getVisibles(v_src: SOVertex) {
        const v_visible = new Set(v_src.incident(SOPuzzle.edgeTypes))
            .mapUnion((e) => e.$['v'])
            .filter((v) => (v != v_src) && (v.type == 'genuine'));
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
    *loopEdges(e_types: SOEdgeType[]): IterableIterator<SOEdge> {
        for (const e_type of e_types) {
            yield* this.adE[e_type];
        }
    }
}


