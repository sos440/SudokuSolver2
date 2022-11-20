import { FormatOptions } from "./system/io";

export type DatabaseItem = {
    format: FormatOptions;
    data: string;
    desc?: string;
}

export const database: DatabaseItem[] = [
    {
        format: 'simple',
        data: '956700000400800000300910700021000000000000300790000120000029003000008004000007650',
        desc: 'Diabolic grade from SudokuWiki.'
    },
    {
        format: 'simple',
        data: '300750001000300020000009407020001005700000006500900070905100000070003000100068002',
        desc: 'Devious grade from Sudoku+.'
    },
    {
        format: 'simple',
        data: '..3.5...7.96..85.....3.2...3....7.6...2...9...8.2....5...9.4.....18..63.4...1.8..',
        desc: 'Devious grade from Sudoku+.'
    },
    {
        format: 'simple',
        data: '000008040009040000006203008042009003005000800800400970200307500000090300030800000',
        desc: 'Devious grade from Sudoku+.'
    },
    {
        format: 'simple',
        data: '009032000000700000162000000010020560000900000050000107000000403026009000005870000',
        desc: 'Hidden pair example.'
    }
];