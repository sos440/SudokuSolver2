import { HGSudokuVanilla } from "./sudoku_vanilla";

const sudoku = new HGSudokuVanilla(3);
const puzzle = sudoku.import('092001750500200008000030200075004960200060075069700030008090020700003089903800040');
console.log('Puzzle has been successfully imported.');
console.log(puzzle);

document.writeln(`<pre style ="font-family: Consolas; font-size:8pt; letter-spacing: 6pt;">`);
for (const lines of sudoku.export(puzzle, 'candibox').replace(/\*/g, '.').split('\n')){
    document.writeln(`${lines}`);
}
document.writeln(`</pre>`);