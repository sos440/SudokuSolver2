/**
 * @module hypergraph
 */

import { Multiset } from './multiset';
import * as Tools from './tools';
import { b64_to_uint8, uint8_to_b64 } from './base64';


/** 
 * Represents labeled vertices.
 */
export class LabeledVertex {
    /** This stores labels as [key, value] pairs. */
    labels: Map<string, number>;

    /** This stores layes as [group_name, index_list] pairs. */
    layers: Map<string, Set<number>>;

    constructor() {
        this.labels = new Map()
        this.layers = new Map();
    }

    /** 
     * The null vertex.
     * This is merely to avoid undefined's where they are guaranteed to not arise.
     * */
    static Null: LabeledVertex = new LabeledVertex();
}


/**
 * A callback function that performs a test on each vertex.
 * @callback CallbackBoolean
 * @param {LabeledVertex} v The vertex to test.
 * @param {number} [index] The index of the vertex in the vertex list.
 * @returns {boolean} The truth value.
 */
type CallbackBoolean = (v?: LabeledVertex, index?: number) => boolean;


interface HypergraphInfo {
    type: string,
    param?: any
}


/**
 * Interface for hypergraphs that represent exact hitting games.
 * Any instance of this class is inteded as immutable, 
 * hence its structure must be determined at the time of its creation.
 */
export class Hypergraph {
    /** The sparse array of the form {index => vertex}. */
    vertices: Map<number, LabeledVertex>;

    /** The sparse tensor of the form {name => serial_no => vertex}. */
    edgeGroups: Map<string, Map<number, Multiset<LabeledVertex>>>;

    /** The type information. */
    info: HypergraphInfo;

    constructor(...group_names: string[]) {
        this.vertices = new Map();
        this.edgeGroups = new Map(
            group_names.map((name: string): [string, Map<number, Multiset<LabeledVertex>>] => {
                return [name, new Map<number, Multiset<LabeledVertex>>()];
            })
        );
        this.info = {
            type: 'hypergraph'
        };
    }

    /** 
     * Compute the transpose of the sparse tensor (v => name => index)
     * in the form (name => index => v).
     */
    computeHyperedges(): void {
        for (const [name, group] of this.edgeGroups.entries()) {
            for (const v of this.vertices.values()) {
                const v_layers = v.layers;
                for (const sno of v_layers.get(name) || new Set<number>()) {
                    if (group.has(sno)) {
                        group.get(sno)?.add(v);
                    }
                    else {
                        const new_edge = new Multiset<LabeledVertex>();
                        new_edge.add(v);
                        group.set(sno, new_edge);
                    }
                }
            }
        }
    }

    /**
     * Create a subgraph consisting of all 
     * @param {number[] | callback_boolean} any_filter The test function.
     * @returns {Hypergraph} The subgraph consisting of all vertices passing the test.
     */
    filter(any_filter: number[] | CallbackBoolean): Hypergraph {
        const g = new Hypergraph(...this.edgeGroups.keys());

        /** Inherit type information. */
        Object.assign(g.info, this.info);

        /** Filter vertices. */
        if (typeof any_filter == 'function') {
            for (const [index, v] of this.vertices.entries()) {
                if (any_filter(v, index)) {
                    g.vertices.set(index, v);
                }
            }
        }
        else if (any_filter instanceof Array<number>) {
            for (const index of any_filter) {
                if (this.vertices.has(index)) {
                    g.vertices.set(index, this.vertices.get(index) ?? LabeledVertex.Null);
                }
            }
        }
        else {
            const __type_exhausted : never = any_filter;
            throw TypeError(`'${any_filter}' is not a valid type of filters.`);
        }

        /** Fill in vertices to hyperedges. */
        g.computeHyperedges();

        return g;
    }
}


type FormatOptions = 'simple' | 'base64' | 'candibox';

/**
 * Represents vanilla sudoku of size parameter Dp
 */
export class HGSudokuVanilla extends Hypergraph {
    /** The dimensional parameter on which all the others depend. */
    Dp: number;

    /** The length of each side. */
    D1: number;

    /** The area of the botton. */
    D2: number;

    /** Tehe volume of the 3D lattice. */
    D3: number;

    /** @param {number} Dp The dimensional parameter on which all the others depend. */
    constructor(Dp: number) {
        super('rc', 'rk', 'ck', 'bk');

        this.info.type = 'sudoku_vanilla';
        this.info.param = Dp;

        this.Dp = Dp;
        this.D1 = this.Dp ** 2;
        this.D2 = this.D1 ** 2;
        this.D3 = this.D1 ** 3;

        /** Compute vertices. */
        const base_Dp = new Tools.BaseN(this.Dp);
        const base_D1 = new Tools.BaseN(this.D1);
        for (const index of new Array(this.D3).keys()) {
            const v = new LabeledVertex();
            this.vertices.set(index, v);

            const [row, col, key] = base_D1.toDigits(index, 3);
            const digits = base_Dp.toDigits(index, 6);
            const box = base_Dp.fromDigits([digits[0], digits[2]]);
            const inn = base_Dp.fromDigits([digits[1], digits[3]]);
            v.labels
                .set('index', index)
                .set('row', row)
                .set('col', col)
                .set('key', key)
                .set('box', box)
                .set('inn', inn);
            v.layers
                .set('rc', new Set<number>().add(base_D1.fromDigits([row, col])))
                .set('rk', new Set<number>().add(base_D1.fromDigits([row, key])))
                .set('ck', new Set<number>().add(base_D1.fromDigits([col, key])))
                .set('bk', new Set<number>().add(base_D1.fromDigits([box, key])));
        }

        /** Compute hyperedge groups. */
        this.computeHyperedges();
    }


    /**
     * Import from a string.
     * @param {string} input An input string, either in simple/base64 format.
     * @param {FormatOptions} [format] The format of the output.
     * @returns {Hypergraph} Returns the loaded sub-hypergraph.
     */
    import(input: string, format: FormatOptions = 'base64'): Hypergraph {
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
            return this.filter(index_list);
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
            return this.filter(index_list);
        }
        else if (format == 'candibox'){
            /** @todo This is not implemented yet. */
            return this.filter(() => true);
        }
        else {
            const __type_exhausted: never = format;
            throw TypeError(`'${format}' is not a valid format.`);
        }
    }


    /**
     * Export the source as a formatted string.
     * @param {Hypergraph} source The source puzzle.
     * @param {FormatOptions} format The format of the output.
     * @returns {string} The output string.
     */
    export(source: Hypergraph, format: FormatOptions = 'base64'): string {
        if (format == 'simple') {
            const result: string[] = new Array(this.D2).fill('.');
            const group = source.edgeGroups.get('rc') ?? new Map<number, Multiset<LabeledVertex>>();
            for (const [grid_sno, edge] of group.entries()) {
                /** Write a number only when the cell is determined. */
                if (edge.size == 1) {
                    result[grid_sno] = String.fromCharCode(0x31 + (edge.pick()?.labels.get('key') ?? 0));
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
                    if (source.vertices.has(pos * 8 + i)) {
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
            const baseDp = new Tools.BaseN(this.Dp);
            for (const [index, v] of source.vertices.entries()) {
                const digits = baseDp.toDigits(index, 6);
                const idx = baseDp.fromDigits([digits[0], digits[1], digits[4], digits[2], digits[3], digits[5]]);
                template[slots[idx]] = String.fromCharCode(0x31 + (v.labels.get('key') || 0));
            }

            return template.join('');
        }
        else {
            const __type_exhausted: never = format;
            throw TypeError(`'${format}' is not a valid format.`);
        }
    }
}