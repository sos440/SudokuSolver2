/**
 * A module for the graph structure of the original sudoku game.
 */
import { BaseN } from '../tools';
import { Supergraph } from './math';

export type FormatOptions = 'simple' | 'base64' | 'candibox';

export interface SOLabel {
    index: number;
    row: number;
    col: number;
    key: number;
    box: number;
    inn: number;
    rc: number;
    rk: number;
    ck: number;
    bk: number;
}

export type SOVertex = number;

export type SOEdge = number;

export type SOGroup = 'rc' | 'rk' | 'ck' | 'bk';

export type SOSupergraph = Supergraph<SOVertex, SOEdge, SOGroup>;


/**
 * Represents vanilla, original sudoku of size parameter Dp
 */
export class SOGame extends Supergraph<SOVertex, SOEdge, SOGroup> {
    Dp: number;
    D1: number;
    D2: number;
    D3: number;
    labels: Map<SOVertex, SOLabel>;
    constructor(Dp: number) {
        if (!Number.isInteger(Dp)){
            throw RangeError(`The dimensional parameter must be an integer.`);
        }
        else if (Dp < 1){
            throw RangeError(`The dimensional parameter must be at least 1.`);
        }
        else if (Dp > 8){
            throw RangeError(`Do you really want to solve such a large puzzle?`);
        }

        super();

        this.type = 'sudoku original';

        this.Dp = Dp;
        this.D1 = this.Dp ** 2;
        this.D2 = this.D1 ** 2;
        this.D3 = this.D1 ** 3;
        this.labels = new Map<SOVertex, SOLabel>();

        const base_Dp = new BaseN(this.Dp);
        const base_D1 = new BaseN(this.D1);
        for (const index of Array(this.D3).keys()) {
            const [row, col, key] = base_D1.toDigits(index, 3);
            const digits = base_Dp.toDigits(index, 6);
            const box = base_Dp.fromDigits([digits[0], digits[2]]);
            const inn = base_Dp.fromDigits([digits[1], digits[3]]);
            const rc = base_D1.fromDigits([row, col]);
            const rk = base_D1.fromDigits([row, key]);
            const ck = base_D1.fromDigits([col, key]);
            const bk = base_D1.fromDigits([box, key]);

            const id_e_rc = base_D1.fromDigits([0, row, col]);
            const id_e_rk = base_D1.fromDigits([1, row, key]);
            const id_e_ck = base_D1.fromDigits([2, col, key]);
            const id_e_bk = base_D1.fromDigits([3, box, key]);

            this.labels.set(index, { index: index, row: row, col: col, key: key, box: box, inn: inn, rc: id_e_rc, rk: id_e_rk, ck: id_e_ck, bk: id_e_bk });

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
}
