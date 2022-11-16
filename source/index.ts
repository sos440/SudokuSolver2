import { SOGame, SOSupergraph } from "./sudoku_original";

console.log(`Sudoku Solver build 004 (2022/11/16 21:19)`);

const game = new SOGame(3);

const print_puzzle = (puzzle: SOSupergraph): void => {
    document.writeln(`<pre style ="font-family: Consolas; font-size:8pt; letter-spacing: 6pt;">`);
    for (const lines of game.export(puzzle, 'candibox').replace(/\*/g, '.').split('\n')) {
        document.writeln(`${lines}`);
    }
    document.writeln(`</pre>`);
};

const puzzle = game.import('092001750500200008000030200075004960200060075069700030008090020700003089903800040');
console.log('Puzzle has been successfully imported.');

print_puzzle(puzzle);