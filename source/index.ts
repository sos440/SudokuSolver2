import { SOGame, SOSupergraph, SOVertex } from "./sudoku_original";
import { History, SOStrategies } from './strat_vanilla';
import { PuzzleCanvas } from "./graphics/canvas";

/** This horrible code below is just a test run. */

console.log(`Sudoku Solver build 005 (2022/11/17 15:20)`);

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

const h_seq = SOStrategies.obviousCandidateRemoval({
    puzzle: puzzle,
    determined: Set.union(
        ...puzzle.VE.columns.filter(
            (edge, vertex_set) => (edge < 81 && vertex_set.size == 1)
        ).values()
    )
})

if (h_seq.length > 0) {
    const puzzle_copy = puzzle.copy();
    for (const item of h_seq){
        for (const action of item.actions){
            const query_match = action.query.match(/^unmark (\d+)$/);
            if (query_match){
                puzzle_copy.VE.deleteRow(parseInt(query_match[1]));
            }
        }
    }
    puzzle_copy.EG = puzzle_copy.EG.filter((edge, _) => puzzle_copy.VE.columns.has(edge));
    print_puzzle(puzzle_copy);
}
else {
    print_puzzle(puzzle);
}

const puzzle_canvas = new PuzzleCanvas();

puzzle_canvas.canvas.addTo(document.body);