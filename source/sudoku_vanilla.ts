import { b64_to_uint8, uint8_to_b64 } from './base64';
import { BaseN } from './tools';
import { MSet } from './multiset';
import { LabeledVertex, Hyperedge, Hypergraph, NullEdgeGroup, NullLabeledVertex } from './hypergraph';

type FormatOptions = 'simple' | 'base64' | 'candibox';
/**
 * Represents vanilla sudoku of size parameter Dp
 */

type SVEdgeGroupNames = 'rc' | 'rk' | 'ck' | 'bk';

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

        /** Computes vertices. */
        const base_Dp = new BaseN(this.Dp);
        const base_D1 = new BaseN(this.D1);

        /** Creates temporary lists. */
        const vertex_list = new Array<LabeledVertex>(this.D3);

        const edge_groups = {
            'rc': new Array<Hyperedge>(this.D2),
            'rk': new Array<Hyperedge>(this.D2),
            'ck': new Array<Hyperedge>(this.D2),
            'bk': new Array<Hyperedge>(this.D2)
        }

        let group_name: SVEdgeGroupNames;
        for (group_name in edge_groups) {
            const group = edge_groups[group_name];
            for (const pos of group.keys()) {
                group[pos] = new MSet<LabeledVertex>();
            }
        }

        /** 
         * Crate vertices and 
         */
        for (const index of vertex_list.keys()) {
            const v = new LabeledVertex();
            vertex_list[index] = v;
            this.addVertex(v);

            const [row, col, key] = base_D1.toDigits(index, 3);
            const digits = base_Dp.toDigits(index, 6);
            const box = base_Dp.fromDigits([digits[0], digits[2]]);
            const inn = base_Dp.fromDigits([digits[1], digits[3]]);

            v.set('index', index);
            v.set('row', row);
            v.set('col', col);
            v.set('key', key);
            v.set('box', box);
            v.set('inn', inn);
            v.set('rc', base_D1.fromDigits([row, col]));
            v.set('rk', base_D1.fromDigits([row, key]));
            v.set('ck', base_D1.fromDigits([col, key]));
            v.set('bk', base_D1.fromDigits([box, key]));

            let group_name: SVEdgeGroupNames;
            for (group_name in edge_groups) {
                const edge = edge_groups[group_name][v.get(group_name)];
                edge.add(v);
                this.incidency.get(v)?.add(edge);
            }
        }

        for (group_name in edge_groups) {
            const edge_group = edge_groups[group_name];
            this.edgeGroups.set(group_name, new Set(edge_group));
            for (const edge of edge_group){
                this.edges.add(edge);
            }
        }
    }


    /**
     * Converts a formatted string to a HGSudokuVanilla.
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
            return this.filterVertices((v) => {
                return (index_list.indexOf(v.get('index')) >= 0);
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
            return this.filterVertices((v) => {
                return (index_list.indexOf(v.get('index')) >= 0);
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
    export(source: Hypergraph, format: FormatOptions = 'base64'): string {
        if (!(source.info.type == this.info.type && source.info.param == this.info.param)) {
            throw TypeError(`The source Hypergraph is not a subgraph of 'this' graph.`);
        }

        if (format == 'simple') {
            const result: string[] = new Array(this.D2).fill('.');
            const group = source.edgeGroups.get('rc') ?? NullEdgeGroup;
            for (const edge of group) {
                /** Write a number only when the cell is determined. */
                if (edge.size == 1) {
                    const v = edge.pick() || NullLabeledVertex;
                    const grid_sno: number = v.get('rc') ?? -1;
                    result[grid_sno] = String.fromCharCode(0x31 + (v.get('key') ?? 0));
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
                    const v = source.firstVertexOf('index', pos * 8 + i);
                    if (v != NullLabeledVertex) {
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
            for (const v of source.incidency.keys()) {
                const digits = baseDp.toDigits(v.get('index') ?? 0, 6);
                const idx = baseDp.fromDigits([digits[0], digits[1], digits[4], digits[2], digits[3], digits[5]]);
                template[slots[idx]] = String.fromCharCode(0x31 + (v.get('key') || 0));
            }

            return template.join('');
        }
        else {
            const __type_exhausted: never = format;
            throw TypeError(`'${format}' is not a valid format.`);
        }
    }
}
