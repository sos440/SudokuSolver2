/**
 * A module for importing and exporting puzzle data.
 */
import { b64_to_uint8, uint8_to_b64 } from "./base64";
import { Supergraph } from "../math/graph";
import { SOGame } from "../math/graph_so";

export type FormatOptions = 'simple' | 'base64';

export class PuzzleIO {
    static exportSymbols = [
        '1', '2', '3', '4', '5', '6', '7', '8', '9',
        ...String.fromCharCode(...new Array(26).fill(0).map((_, i) => 0x41 + i)),
        ...String.fromCharCode(...new Array(26).fill(0).map((_, i) => 0x61 + i)),
        '<', '>'
    ];

    static importSymbols = new Map(this.exportSymbols.map((c, i) => [c, i]));

    /** Converts a formatted string to a vertex list. */
    static import(
        game: Supergraph<number, number, string>,
        input: string,
        format: FormatOptions = 'base64'
    ): Set<number> {
        /** Currently, only 'sudoku original' type is accepted. */
        if (game.type != 'sudoku original') {
            throw TypeError(`The game is not a sudoku original.`);
        }

        const Dp = (game as SOGame).Dp;
        const D1 = (game as SOGame).D1;
        const D2 = (game as SOGame).D2;
        const D3 = (game as SOGame).D3;

        /** Guess the format of the string. */
        if (input.length == D2) {
            format = 'simple';
        }
        else if (input.substring(0, 5) == 'data:') {
            format = 'base64';
        }

        /** Parse string */
        if (format == 'simple') {
            /** Build the list of vertices. */
            const vertex_list: number[] = [];
            for (const [index_rc, c] of Array.from(input).entries()) {
                const index0 = index_rc * D1;
                if (this.importSymbols.has(c)) {
                    vertex_list.push(index0 + (this.importSymbols.get(c) as number));
                }
                else {
                    for (const key of new Array(D1).keys()) {
                        vertex_list.push(index0 + key);
                    }
                }
            }
            return new Set(vertex_list);
        }
        else if (format == 'base64') {
            /** Build the list of indices to include. */
            const compressed = b64_to_uint8(input.substring(5));
            const vertex_list: number[] = [];
            for (const [pos, val] of compressed.entries()) {
                let index = pos * 8;
                for (let i = 0; i < 8; i++) {
                    if (index >= D3) {
                        break;
                    }
                    if ((val & (1 << i)) > 0) {
                        vertex_list.push(index);
                    }
                    index++;
                }
            }
            return new Set(vertex_list);
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
        game: Supergraph<number, number, string>,
        vertex_list: Set<number>,
        format: FormatOptions = 'base64'
    ): string {
        /** Currently, only 'sudoku original' type is accepted. */
        if (game.type != 'sudoku original') {
            throw TypeError(`The game is not a sudoku original.`);
        }

        const Dp = (game as SOGame).Dp;
        const D1 = (game as SOGame).D1;
        const D2 = (game as SOGame).D2;
        const D3 = (game as SOGame).D3;

        if (format == 'simple') {
            const result: string[] = new Array(D2).fill('!');
            for (const vertex of vertex_list) {
                const index_rc = Math.trunc(vertex / D1);
                const key = vertex % D1;
                if (result[index_rc] == '!') {
                    result[index_rc] = this.exportSymbols[key];
                }
                else {
                    result[index_rc] = '.';
                }
            }
            return result.join('');
        }
        else if (format == 'base64') {
            /** Each 8 candidates are compressed to a single number and stored in this array. */
            const compressed = new Uint8Array(Math.ceil(D3 / 8));
            for (const pos of compressed.keys()) {
                /** @type {number} Current character. */
                let c: number = 0;
                for (let i = 0; i < 8; i++) {
                    const index = pos * 8 + i;
                    if (vertex_list.has(index)) {
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