/**
 * A module for the graph structure of the original sudoku game.
 */
import { BaseN, multirange, range } from '../tools';
import { Supergraph } from './math';

export interface SOVertexAd {
    row: SOGridCd;
    col: SOGridCd;
    key: SOGridCd;
    box: SOGridCd;
    inn: SOGridCd;
    rc: SOEdge;
    rk: SOEdge;
    ck: SOEdge;
    bk: SOEdge;
}

export interface SOEdgeAd {
    type: SOType;
    typePerp?: SOType;
    cd1: SOGridCd;
    cd2?: SOGridCd;
}

/** Representing a vertex. */
export type SOVertex = number;

/** Representing a value of a coordinate variable. */
export type SOGridCd = number;

/** Representing an edge. */
export type SOEdge = number;

/** Representing a group. */
export type SOGroup = 'rc' | 'rk' | 'ck' | 'bk';

/** Representing the type of a grid unit. */
export type SOType = 'cell' | 'row' | 'col' | 'box' | 'inn' | 'key';

export type SOSupergraph = Supergraph<SOVertex, SOEdge, SOGroup>;


/**
 * Represents vanilla, original sudoku of size parameter Dp
 */
export class SOGame extends Supergraph<SOVertex, SOEdge, SOGroup> {
    Dp: number;
    D1: number;
    D2: number;
    D3: number;
    adV: Map<SOVertex, SOVertexAd>;
    adE: Map<SOEdge, SOEdgeAd>;
    constructor(Dp: number) {
        if (!Number.isInteger(Dp)) {
            throw RangeError(`The dimensional parameter must be an integer.`);
        }
        else if (Dp < 1) {
            throw RangeError(`The dimensional parameter must be at least 1.`);
        }
        else if (Dp > 8) {
            throw RangeError(`Do you really want to solve such a large puzzle?`);
        }

        super();

        this.type = 'sudoku original';

        this.Dp = Dp;
        this.D1 = this.Dp ** 2;
        this.D2 = this.D1 ** 2;
        this.D3 = this.D1 ** 3;
        this.adV = new Map<SOVertex, SOVertexAd>();
        this.adE = new Map<SOEdge, SOEdgeAd>();

        for (const [row, col, key] of multirange(this.D1, this.D1, this.D1)) {
            const index = BaseN.fromD([row, col, key], this.D1);
            const d = BaseN.toD(index, 6, this.Dp);
            const box = BaseN.fromD([d[0], d[2]], this.Dp);
            const inn = BaseN.fromD([d[1], d[3]], this.Dp);
            const rc = this.rc(row, col);
            const rk = BaseN.fromD([row, key], this.D1);
            const ck = BaseN.fromD([col, key], this.D1);
            const bk = BaseN.fromD([box, key], this.D1);

            const id_e_rc = BaseN.fromD([0, row, col], this.D1);
            const id_e_rk = BaseN.fromD([1, row, key], this.D1);
            const id_e_ck = BaseN.fromD([2, col, key], this.D1);
            const id_e_bk = BaseN.fromD([3, box, key], this.D1);

            this.adV.set(index, { row: row, col: col, key: key, box: box, inn: inn, rc: id_e_rc, rk: id_e_rk, ck: id_e_ck, bk: id_e_bk });
            this.adE.set(id_e_rc, { type: 'cell', cd1: row, cd2: col });
            this.adE.set(id_e_rk, { type: 'row', cd1: row, cd2: key });
            this.adE.set(id_e_ck, { type: 'col', cd1: col, cd2: key });
            this.adE.set(id_e_bk, { type: 'box', cd1: box, cd2: key });

            this.VE.add(index, id_e_rc);
            this.VE.add(index, id_e_rk);
            this.VE.add(index, id_e_ck);
            this.VE.add(index, id_e_bk);
            this.EG.add(id_e_rc, 'rc');
            this.EG.add(id_e_rk, 'rk');
            this.EG.add(id_e_ck, 'ck');
            this.EG.add(id_e_bk, 'bk');
        }
    }

    /** Converts the number-based unit type to string-based unit type. */
    typeE(g: number): SOType {
        if (g == 0) { return 'cell'; }
        else if (g == 1) { return 'row'; }
        else if (g == 2) { return 'col'; }
        else if (g == 3) { return 'box'; }
        else { throw RangeError(`Invalid range of parameter.`) }
    }
    /** Converts the number-based unit type to string-based unit type of the perpendicular unit. */
    typeEPerp(g: number): SOType {
        if (g == 1) { return 'col'; }
        else if (g == 2) { return 'row'; }
        else if (g == 3) { return 'inn'; }
        else { throw RangeError(`Invalid range of parameter.`) }
    }
    rc(row: SOGridCd, col: SOGridCd): SOVertex { return BaseN.fromD([row, col], this.D1); }
    rk(row: SOGridCd, key: SOGridCd): SOVertex { return BaseN.fromD([row, key], this.D1); }
    ck(col: SOGridCd, key: SOGridCd): SOVertex { return BaseN.fromD([col, key], this.D1); }
    bk(box: SOGridCd, key: SOGridCd): SOVertex { return BaseN.fromD([box, key], this.D1); }

    /** Loops through pairs of intersecting line and box, given the key. */
    *loopLineBoxPerKey(key: SOGridCd): IterableIterator<[SOEdgeAd, SOEdge, SOEdgeAd, SOEdge]> {
        for (const [a1, a2, a3] of multirange(this.Dp, this.Dp, this.Dp)) {
            const row: SOGridCd = BaseN.fromD([a1, a2], this.Dp);
            const e_row: SOEdge = BaseN.fromD([1, row, key], this.D1);
            const box: SOGridCd = BaseN.fromD([a1, a3], this.Dp);
            const e_box: SOEdge = BaseN.fromD([3, box, key], this.D1);
            yield [
                { type: 'row', cd1: row },
                e_row,
                { type: 'box', cd1: box },
                e_box
            ];
        }
        for (const [a1, a2, a3] of multirange(this.Dp, this.Dp, this.Dp)) {
            const col: SOGridCd = BaseN.fromD([a1, a2], this.Dp);
            const e_col: SOEdge = BaseN.fromD([2, col, key], this.D1);
            const box: SOGridCd = BaseN.fromD([a3, a1], this.Dp);
            const e_box: SOEdge = BaseN.fromD([3, box, key], this.D1);
            yield [
                { type: 'col', cd1: col },
                e_col,
                { type: 'box', cd1: box },
                e_box
            ];
        }
    }

    /** Loops through pairs of intersecting line and box for any keys. */
    *loopLineBox(): IterableIterator<[SOEdgeAd, SOEdge, SOEdgeAd, SOEdge]> {
        for (const key of range(this.D1)) {
            yield* this.loopLineBoxPerKey(key);
        }
    }

    /** Loops through the cells in grid-based units. */
    *loopCellUnit(): IterableIterator<[SOEdge[], SOEdge[], SOEdgeAd]> {
        for (const [g, cd1] of multirange([1, 4], this.D1)) {
            const a = BaseN.toD(cd1, 2, this.Dp);
            yield [
                new Array<SOEdge>(this.D1).fill(0).map((_, cd2) => {
                    const b = BaseN.toD(cd2, 2, this.Dp);
                    if (g == 1) {
                        return BaseN.fromD([a[0], a[1], b[0], b[1]], this.Dp);
                    }
                    else if (g == 2) {
                        return BaseN.fromD([b[0], b[1], a[0], a[1]], this.Dp);
                    }
                    else if (g == 3) {
                        return BaseN.fromD([a[0], b[0], a[1], b[1]], this.Dp);
                    }
                    else { return 0; } /** This never happens; pnly added for safety. */
                }),
                new Array<SOEdge>(this.D1).fill(0).map((_, key) => {
                    return BaseN.fromD([g, cd1, key], this.D1);
                }),
                { type: this.typeE(g), cd1: cd1, typePerp: this.typeEPerp(g) }
            ];
        }
    }

    projAsSet(pz: SOSupergraph, e_set: Set<SOEdge>, prop: keyof SOVertexAd): Set<SOGridCd> {
        return pz['V(${e})'](e_set).map((v) => (this.adV.get(v) as SOVertexAd)[prop]);
    }
    
    projAsMap(puzzle: SOSupergraph, e_set: Set<SOEdge>, prop: keyof SOVertexAd): Map<SOEdge, Set<SOGridCd>> {
        return new Map(e_set.map((e) => [
            e,
            (puzzle['V($e)'](e) as Set<SOVertex>).map((v) => (this.adV.get(v) as SOVertexAd)[prop])
        ]));
    }
}