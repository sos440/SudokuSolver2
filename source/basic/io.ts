/**
 * A module for importing and exporting puzzle data.
 */
import { GameSpecItem } from "../spec/spec";
import { RawPuzzle } from "./puzzle";

export type FormatOptions = 'simple' | 'grid' | 'json';

export type RawPuzzleJSON = {
    type: string;
    given: number[];
    found: number[];
    rest: number[];
}

export class IO {
    static import(data: string, game_spec: GameSpecItem, format: FormatOptions): RawPuzzle {
        const size = game_spec.size;
        const num_cells = game_spec.cells.size;

        const result: RawPuzzle = {
            type: game_spec.type,
            given: new Set<number>(),
            found: new Set<number>(),
            rest: new Set<number>(),
        };

        /** Parse string */
        if (format == 'simple') {
            if (data.length != num_cells) {
                throw TypeError(`The input is not a valid simple format.`);
            }

            /** Read each character and parse it accordingly. */
            for (const [index, c] of Array.from(data).entries()) {
                const v_id0 = index * size;
                const num_idx = game_spec.invNumCharMap(c);
                if (num_idx >= 0) {
                    result.given.add(v_id0 + num_idx);
                }
                else {
                    for (const num of new Array(size).keys()) {
                        result.rest.add(v_id0 + num);
                    }
                }
            }
        }
        else if (format == 'grid') {
            const match = data.match(new RegExp(`([${game_spec.numCharMap.join('')}]+|\\.)`, 'g'));
            if (!match || match.length != num_cells) {
                throw TypeError(`The input is not a valid grid format.`);
            }

            for (const [index, entry] of match.entries()) {
                const v_id0 = index * size;
                if (entry == '.') {
                    for (const num of new Array(size).keys()) {
                        result.rest.add(v_id0 + num);
                    }
                }
                else if (entry.length == 1) {
                    const num_idx = game_spec.invNumCharMap(entry);
                    (num_idx >= 0) && result.found.add(v_id0 + num_idx);
                }
                else {
                    for (const num_char of Array.from(entry)) {
                        const num_idx = game_spec.invNumCharMap(num_char);
                        (num_idx >= 0) && result.rest.add(v_id0 + num_idx);
                    }
                }
            }
        }
        else if (format == 'json') {
            const parsed = JSON.parse(data) as RawPuzzleJSON;
            if (parsed.type != result.type) {
                throw TypeError(`The input is not a valid JSON format.`);
            }

            result.given = new Set(parsed.given);
            result.found = new Set(parsed.found);
            result.rest = new Set(parsed.rest);
        }
        else {
            const __type_exhausted: never = format;
            throw TypeError(`'${format}' is not a valid format.`);
        }

        return result;
    }


    static export(data: RawPuzzle, game_spec: GameSpecItem, format: FormatOptions): string {
        const size = game_spec.size;
        const num_cells = game_spec.cells.size;

        if (format == 'simple') {
            /** Prepares a character map */
            const result: string[] = new Array(num_cells).fill('.');
            for (const v_id of [...data.given, ...data.found]) {
                result[Math.trunc(v_id / size)] = game_spec.numCharMap[v_id % size];
            }
            return result.join('');
        }
        else if (format == 'grid') {
            /** Compuates the cell entries as array of zero-based indices. */
            const entries: Array<number[]> = new Array(num_cells).fill(null).map(() => []);
            for (const index of [...data.given, ...data.found, ...data.rest]) {
                const cell_id = Math.trunc(index / size);
                entries[cell_id].push(index % size);
            }

            /** Converts the entries to string. */
            const entries_str = entries.map((entry) => {
                if (entry.length == size) { return '.'; }
                else { return entry.sort().map((num) => game_spec.numCharMap[num]).join(''); }
            });

            /** Computes column width. */
            const col_width = new Array(game_spec.width).fill(0);
            for (const [cell_index, entry_str] of entries_str.entries()) {
                const cell = game_spec.cellsList[cell_index];
                const col0 = cell.col - 1;
                col_width[col0] = Math.max(col_width[col0], entry_str.length);
            }

            /** @todo Implement the rest! */
            return '';
        }
        else if (format == 'json') {
            return JSON.stringify({
                type: data.type,
                given: [...data.given],
                found: [...data.found],
                rest: [...data.rest],
            });
        }
        else {
            const __type_exhausted: never = format;
            throw TypeError(`'${format}' is not a valid format.`);
        }
    }
}