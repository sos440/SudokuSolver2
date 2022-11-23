/**
 * A module for importing and exporting puzzle data.
 */
import { b64_to_uint8, uint8_to_b64 } from "./base64";

export type FormatOptions = 'simple' | 'base64';

export class SOGameIO {
    static exportSymbols = [
        '1', '2', '3', '4', '5', '6', '7', '8', '9',
        ...String.fromCharCode(...new Array(26).fill(0).map((_, i) => 0x41 + i)),
        ...String.fromCharCode(...new Array(26).fill(0).map((_, i) => 0x61 + i)),
        '<', '>'
    ];

    static importSymbols = new Map(this.exportSymbols.map((c, i) => [c, i]));

    /** Converts a formatted string to a vertex list. */
    static import(
        dims: { D1: number, D2: number, D3: number },
        input: string,
        format: FormatOptions = 'base64'
    ): Set<number> {
        if (dims.D1 > SOGameIO.exportSymbols.length) {
            throw RangeError(`The dimensional parameter 'D1' is too large.`);
        }

        /** Guess the format of the string. */
        if (input.length == dims.D2) {
            format = 'simple';
        }
        else if (input.substring(0, 5) == 'data:') {
            format = 'base64';
        }

        /** Parse string */
        if (format == 'simple') {
            /** Build the list of vertices. */
            const v_list: number[] = [];
            for (const [e_rc_id, c] of Array.from(input).entries()) {
                const v_id0 = e_rc_id * dims.D1;
                if (this.importSymbols.has(c)) {
                    v_list.push(v_id0 + (this.importSymbols.get(c) as number));
                }
                else {
                    for (const key of new Array(dims.D1).keys()) {
                        v_list.push(v_id0 + key);
                    }
                }
            }
            return new Set(v_list);
        }
        else if (format == 'base64') {
            /** Build the list of indices to include. */
            const compressed = b64_to_uint8(input.substring(5));
            const v_list: number[] = [];
            for (const [pos, val] of compressed.entries()) {
                let v_id = pos * 8;
                for (let i = 0; i < 8; i++) {
                    if (v_id >= dims.D3) {
                        break;
                    }
                    if ((val & (1 << i)) > 0) {
                        v_list.push(v_id);
                    }
                    v_id++;
                }
            }
            return new Set(v_list);
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
    static export(
        dims: { D1: number, D2: number, D3: number },
        v_set: Set<number>,
        format: FormatOptions = 'base64'
    ): string {
        if (dims.D1 > SOGameIO.exportSymbols.length) {
            throw RangeError(`The dimensional parameter 'D1' is too large.`);
        }

        if (format == 'simple') {
            const result: string[] = new Array(dims.D2).fill('!');
            for (const v_id of v_set) {
                const e_rc_id = Math.trunc(v_id / dims.D1);
                const key = v_id % dims.D1;
                if (result[e_rc_id] == '!') {
                    result[e_rc_id] = this.exportSymbols[key];
                }
                else {
                    result[e_rc_id] = '.';
                }
            }
            return result.join('');
        }
        else if (format == 'base64') {
            /** Each 8 candidates are compressed to a single number and stored in this array. */
            const compressed = new Uint8Array(Math.ceil(dims.D3 / 8));
            for (const pos of compressed.keys()) {
                /** @type {number} Current character. */
                let c: number = 0;
                for (let i = 0; i < 8; i++) {
                    if (v_set.has(pos * 8 + i)) {
                        c |= 1 << i;
                    }
                }
                compressed[pos] = c;
            }

            /** Return the base64 encoding of "compressed". */
            return `data:${uint8_to_b64(compressed)}`;
        }
        else {
            const __type_exhausted: never = format;
            throw TypeError(`'${format}' is not a valid format.`);
        }
    }
}