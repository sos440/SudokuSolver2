/**
 * Defines an object that specifies the structure and rendering information of the game.
 */

/** A number alias, emphasizing how this number are computed. */
export type CellIndex = number;

export class GameCell {
    id: string;
    houses: Set<string>;
    index: CellIndex;
    row: number;
    col: number;
    constructor(id: string) {
        this.id = id;
        this.houses = new Set<string>();
        this.index = -1;
        this.row = 0;
        this.col = 0;
    }
}

export class GameHouse {
    id: string;
    cells: Set<string>;
    constructor(id: string) {
        this.id = id;
        this.cells = new Set<string>();
    }
}

export class GameSpecItem {
    /** The type of the game, which is a string unique to each game. */
    type: string;
    /** The number of possible candidates. */
    size: number;
    /** An associative array between the cell IDs and the cells. */
    cells: Map<string, GameCell>;
    /** An associative array between the house IDs and the houses */
    houses: Map<string, GameHouse>;
    /** The array of cells, indexed lexicographically. */
    cellsList: GameCell[];
    /** Maximum number of rows. */
    height: number;
    /** Maximum number of columns. */
    width: number;
    /** Conversion map from zero-based candidate number to character. */
    numCharMap: string[];
    /** Conversion map from zero-based row index to character. */
    rowCharMap: string[];
    /** Conversion map from zero-based column index to character. */
    colCharMap: string[];
    /** Text grid template */
    gridTemplate: string;

    constructor() {
        this.type = 'unknown';
        this.size = 0;
        this.cells = new Map<string, GameCell>();
        this.houses = new Map<string, GameHouse>();
        this.cellsList = [];
        this.height = 0;
        this.width = 0;
        this.numCharMap = [];
        this.rowCharMap = [];
        this.colCharMap = [];
        this.gridTemplate = '';
    }

    invNumCharMap(char: string) {
        return this.numCharMap.indexOf(char);
    }
}

export type INIParsedResult = {
    [section: string]: { [param: string]: string };
};

const __ini_regex = {
    section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
    param: /^\s*([^=]+?)\s*(\+?=)\s*(.*?)\s*$/,
    comment: /^\s*;.*$/,
    empty: /^\s*$/,
};

const __regex_rc_index = /r\s*(\d+|\{\s*\d+(?:\s*,\s*\d+)*\s*\})\s*c\s*(\d+|\{\s*\d+(?:\s*,\s*\d+)*\s*\})/g;

const __sort_lexico = (a: GameCell, b: GameCell): number => {
    return (a.row != b.row) ? (a.row - b.row) : (a.col - b.col);
};

export class GameSpecs {
    static collections = new Map<string, GameSpecItem>();

    static parseINI(data: string): INIParsedResult {
        const result: INIParsedResult = {};

        let section = 'global';
        const lines = data.split(/[\r\n]+/);
        lines.forEach((line: string) => {
            let line_type: keyof typeof __ini_regex;
            for (line_type in __ini_regex) {
                const match = line.match(__ini_regex[line_type]);
                if (!match) { continue; }

                switch (line_type) {
                    case 'comment':
                        return;

                    case 'section':
                        section = match[1].toLowerCase();
                        return;

                    case 'param':
                        if (!(section in result)) {
                            result[section] = {};
                        }
                        const cur_section = result[section];
                        const param_name = match[1].toLowerCase();
                        const param_mode = match[2];
                        const param_prev_value = cur_section[param_name] ?? '';
                        const param_cur_value = match[3].replace(/^"(.*)"$/, '$1');

                        if (param_mode == '=') {
                            cur_section[param_name] = param_cur_value;
                        }
                        else if (param_mode == '+=') {
                            cur_section[param_name] = param_prev_value + '\n' + param_cur_value;
                        }
                        return;

                    case 'empty':
                        section = 'global';
                        return;

                    default:
                        throw Error('Fool! This part can never happen.');
                }
            }
        });

        return result;
    }

    static parseSpec(data: string): GameSpecItem {
        const result = new GameSpecItem();
        const parsed_ini = this.parseINI(data);

        /** Checks if the necessary fields are missing or not. */
        if (!('global' in parsed_ini)) {
            throw TypeError(`The section 'Global' is missing.`);
        }
        if (!('print' in parsed_ini)) {
            throw TypeError(`The section 'Print' is missing.`);
        }
        if (!('houses' in parsed_ini)) {
            throw TypeError(`The section 'Houses' is missing.`);
        }
        if (!('type' in parsed_ini.global)) {
            throw TypeError('The type of the game is missing.');
        }
        if (!('size' in parsed_ini.global)) {
            throw TypeError('The size of the game is missing.');
        }
        if (!('numcharmap' in parsed_ini.print)) {
            throw TypeError('The character map for numbers is missing.');
        }
        if (!('rowcharmap' in parsed_ini.print)) {
            throw TypeError('The character map for rows is missing.');
        }
        if (!('colcharmap' in parsed_ini.print)) {
            throw TypeError('The character map for columns is missing.');
        }
        if (!('gridtemplate' in parsed_ini.print)) {
            throw TypeError('The grid template is missing.');
        }

        /** Updates the result accordingly. */
        result.type = parsed_ini.global.type;
        result.size = Number.parseInt(parsed_ini.global.size);
        result.numCharMap = Array.from(parsed_ini.print.numcharmap);
        result.rowCharMap = Array.from(parsed_ini.print.rowcharmap);
        result.colCharMap = Array.from(parsed_ini.print.colcharmap);
        result.gridTemplate = parsed_ini.print.gridtemplate;

        /** Checks the validity of the size parameter. */
        if (result.size == NaN) {
            throw TypeError('The size of the game is missing.');
        }
        if (result.size <= 1) {
            throw TypeError('The size of the game must be at least 2.');
        }
        if (result.size > 61) {
            throw TypeError('The size of the game is too large to be handled.');
        }

        const houses = parsed_ini.houses;
        for (const house_id in houses) {
            const house = new GameHouse(house_id);
            result.houses.set(house_id, house);

            /** Parse the house selector. */
            for (const match of houses[house_id].matchAll(__regex_rc_index)) {
                match[1].replace(/[^\d,]/g, '').split(',').forEach((row: string) => {
                    match[2].replace(/[^\d,]/g, '').split(',').forEach((col: string) => {
                        /** For each cell ID parsed, add it to the current house. */
                        const cell_id = `r${row}c${col}`;
                        house.cells.add(cell_id);

                        /** Creates the cell, if necessary, and adds the current house ID to it. */
                        const cell = (() => {
                            if (result.cells.has(cell_id)) {
                                return result.cells.get(cell_id) as GameCell;
                            }
                            else {
                                const cell = new GameCell(cell_id);
                                cell.row = Number.parseInt(row) - 1;
                                cell.col = Number.parseInt(col) - 1;
                                result.cells.set(cell_id, cell);
                                return cell;
                            }
                        })();
                        cell.houses.add(house_id);

                        /** Updates the dimension of the grid. */
                        result.height = Math.max(result.height, cell.row + 1);
                        result.width = Math.max(result.width, cell.col + 1);
                    })
                });
            }
        }

        if (result.numCharMap.length < result.size) {
            throw RangeError(`The character map for numbers is shorter than the possible number of candidates.`);
        }
        if (result.rowCharMap.length < result.height) {
            throw RangeError(`The character map for rows is shorter than the number of rows.`);
        }
        if (result.colCharMap.length < result.width) {
            throw RangeError(`The character map for columns is shorter than the number of columns.`);
        }
        if ((result.gridTemplate.match(/\./g) || []).length != result.cells.size) {
            throw RangeError(`The number of placeholders in the grid template does not match the number of cells.`);
        }

        /** Index cells in lexicogrpahical order. */
        result.cellsList = [...result.cells.values()].sort(__sort_lexico);
        result.cellsList.forEach((cell, index) => { cell.index = index; });

        return result;
    }

    static addSpecFromINI(data: string) {
        const result = this.parseSpec(data);
        this.collections.set(result.type, result);
    }
}

import __inidata_so_3 from './spec_so_3.txt';
GameSpecs.addSpecFromINI(__inidata_so_3);