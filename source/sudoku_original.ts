import { b64_to_uint8, uint8_to_b64 } from './base64';
import { BaseN } from './tools';
import { Supergraph } from './math/math';

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
        super();

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

            this.labels.set(index, { index: index, row: row, col: col, key: key, box: box, inn: inn, rc: rc, rk: rk, ck: ck, bk: bk });

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

    /**
     * Converts a formatted string to a HGSudokuVanilla.
     */
    import(input: string, format: FormatOptions = 'base64'): SOSupergraph {
        /** Guess the format of the string. */
        if (input.length == this.D2) {
            format = 'simple';
        }
        else if (input.substring(0, 5) == 'data:') {
            format = 'base64';
        }

        /** Parse string */
        if (format == 'simple') {
            /** Build the list of indices to include. */
            const index_list: number[] = [];
            for (const [grid_sno, c] of Array.from(input).entries()) {
                const index0 = grid_sno * this.D1;
                if ('1' <= c && c <= '9') {
                    index_list.push(index0 + parseInt(c) - 1);
                }
                else {
                    for (const key of new Array(this.D1).keys()) {
                        index_list.push(index0 + key);
                    }
                }
            }

            /** Return the sub-hypergraph filtered by the list. */
            return this.filter((vertex) => {
                return (index_list.indexOf(vertex) >= 0);
            });
        }
        else if (format == 'base64') {
            /** Build the list of indices to include. */
            const compressed = b64_to_uint8(input.substring(5));
            const index_list: number[] = [];
            for (const [pos, val] of compressed.entries()) {
                let index = pos * 8;
                for (let i = 0; i < 8; i++) {
                    if (index >= this.D3) {
                        break;
                    }
                    if ((val & (1 << i)) > 0) {
                        index_list.push(index);
                    }
                    index++;
                }
            }

            /** Return the sub-hypergraph filtered by the list. */
            return this.filter((vertex) => {
                return (index_list.indexOf(vertex) >= 0);
            });
        }
        else if (format == 'candibox') {
            /** @todo This is not implemented yet. */
            return this.copy();
        }
        else {
            const __type_exhausted: never = format;
            throw TypeError(`'${format}' is not a valid format.`);
        }
    }


    /**
     * Convert the source Hypergraph to a formatted string.
     * The source must be a subgraph of 'this' HGSudokuVanilla graph.
     */
    export(source: SOSupergraph, format: FormatOptions = 'base64'): string {
        if (format == 'simple') {
            const result: string[] = new Array(this.D2).fill('.');
            const group = source.EG.columns.get('rc') as Set<SOEdge>;
            for (const e_id of group) {
                const edge = source.VE.columns.get(e_id) as Set<SOVertex>;
                /** Write a number only when the cell is determined. */
                if (typeof edge != 'undefined' && edge.size == 1) {
                    const index = [...edge.keys()][0];
                    const cur_label = (this.labels.get(index) as SOLabel);
                    result[cur_label.rc] = String.fromCharCode(0x31 + cur_label.key);
                }
            }
            return result.join('');
        }
        else if (format == 'base64') {
            /** Each 8 candidates are compressed to a single number and stored in this array. */
            const compressed = new Uint8Array(Math.ceil(this.D3 / 8));
            for (const pos of compressed.keys()) {
                /** @type {number} Current character. */
                let c: number = 0;
                for (let i = 0; i < 8; i++) {
                    const index = pos * 8 + i;
                    if (source.VE.rows.has(index)) {
                        c |= 1 << i;
                    }
                }
                compressed[pos] = c;
            }

            /** Return the base64 encoding of "compressed". */
            return `data:${uint8_to_b64(compressed)}`;
        }
        else if (format == 'candibox') {
            /** Compute the template. */
            const s1 = `*${new Array(this.Dp).fill(new Array(this.Dp).fill(' ').join('')).join('*')}*`;
            const s2 = new Array(this.Dp).fill(s1).join('');
            const s3 = Array.from(s2).map(c => (c == '*' ? new Array(s2.length).fill('*').join('') : s2)).join('\n');
            const template = Array.from(s3);

            const slots: number[] = [];
            for (const [pos, c] of template.entries()) {
                if (c == ' ') {
                    slots.push(pos);
                }
            }

            /** Fill in the candidates. */
            const baseDp = new BaseN(this.Dp);
            for (const index of source.VE.rows.keys()) {
                const digits = baseDp.toDigits(index, 6);
                const idx = baseDp.fromDigits([digits[0], digits[1], digits[4], digits[2], digits[3], digits[5]]);
                template[slots[idx]] = String.fromCharCode(0x31 + (this.labels.get(index)?.key || 0));
            }

            return template.join('');
        }
        else {
            const __type_exhausted: never = format;
            throw TypeError(`'${format}' is not a valid format.`);
        }
    }
}
