import { Hypergraph } from "./hypergraph";
import { SolverStrategiesSV } from "./strat_vanilla";
import { HGSudokuVanilla } from "./sudoku_vanilla";

const solver = SolverStrategiesSV;
const game = new HGSudokuVanilla(3);

const print_puzzle = (puzzle: Hypergraph): void => {
    document.writeln(`<pre style ="font-family: Consolas; font-size:8pt; letter-spacing: 6pt;">`);
    for (const lines of game.export(puzzle, 'candibox').replace(/\*/g, '.').split('\n')) {
        document.writeln(`${lines}`);
    }
    document.writeln(`</pre>`);
};

const puzzle = game.import('092001750500200008000030200075004960200060075069700030008090020700003089903800040');
console.log('Puzzle has been successfully imported.');

const msg = solver.get('naked_single')?.call(null, {
    game: game,
    v_set: new Set([...puzzle.incidency.keys()]),
    settings: {},
    view: {}
}) || [];

if (msg.length > 0) {
    const puzzle2 = puzzle.filterVertices((v) => (msg[0].v_set.has(v)));
    print_puzzle(puzzle2);
}
else {
    print_puzzle(puzzle);
}

