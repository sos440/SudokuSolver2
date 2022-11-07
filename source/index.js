import * as Tools from './tools';
import { Multiset, LabeledVertex, Hypergraph, GameSudokuVanilla } from './geom';

const sudoku = new GameSudokuVanilla(3);
console.log(sudoku.edgeGroups.get('rk').get(3));

const conn = sudoku.filter([3, 7, 13, 115, 368]);
console.log(conn.edgeGroups.get('rk').keys());