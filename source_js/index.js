import { Multiset } from './multiset';
import { LabeledVertex, Hypergraph, GameSudokuVanilla } from './geometry';

const sudoku = new GameSudokuVanilla(3);
const puzzle = sudoku.import('092001750500200008000030200075004960200060075069700030008090020700003089903800040');

console.log(sudoku.export(puzzle, 'candibox'));