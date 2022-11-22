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
        data: '070008029002000004854020000008374200000000000003261700000090612200000400130600070',
        desc: 'Naked triple example 1 from SudokuWiki.'
    },
    {
        format: 'simple',
        data: '200010000600800009300607054000056000040080060000470000730104005900005001000020007',
        desc: 'Naked triple example 2 from SudokuWiki.'
    },
    {
        format: 'simple',
        data: '000004000000170600480356100004007500000010700500020034950000006120000008000000000',
        desc: 'naked triple exampe 3 from Hodoku.'
    },
    {
        format: 'simple',
        data: '000030086000020000000008500371000094900000005400007600200700800030005000700004030',
        desc: 'Naked quad example 1 from SudokuWiki.'
    },
    {
        format: 'simple',
        data: '000000060000030047032500000600007005207010908081004000000002000000000001005870000',
        desc: 'Naked quad example 2 from Hodoku.'
    },
    {
        format: 'simple',
        data: '009032000000700000162000000010020560000900000050000107000000403026009000005870000',
        desc: 'Hidden pair example.'
    }
];