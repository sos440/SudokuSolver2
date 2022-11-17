import { SOGame, SOSupergraph, SOVertex } from "./sudoku_original";
import { History, SOStrategies } from './strat_vanilla';
import { SVG, PuzzleCanvas } from "./graphics/canvas";

/** This horrible code below is just a test run. */

console.log(`Sudoku Solver build 005 (2022/11/17 15:20)`);

const game = new SOGame(3);

const puzzle_canvas = new PuzzleCanvas();
puzzle_canvas.canvas.addTo(document.body);


type AnnotatedPuzzle = {
    puzzle: SOSupergraph;
    clues?: Set<SOVertex>;
    determined?: Set<SOVertex>;
}

const print_puzzle = (anotpuzzle: AnnotatedPuzzle): void => {
    const puzzle = anotpuzzle.puzzle;
    const clues = anotpuzzle.clues ?? new Set<SOVertex>();
    const determined = anotpuzzle.determined ?? new Set<SOVertex>();

    puzzle_canvas.cellTexts.hideAll().clearAll();
    puzzle_canvas.markRects.hideAll().clearAll();
    puzzle_canvas.markTexts.hideAll().clearAll();

    for (const index of clues) {
        (puzzle_canvas.cellTexts.show(Math.trunc(index / 9)) as SVG)
            .html(`${(index % 9) + 1}`)
            .attr({ fill: 'blue' });
    }

    for (const index of determined) {
        if (clues.has(index)) { continue; }
        (puzzle_canvas.cellTexts.show(Math.trunc(index / 9)) as SVG)
            .html(`${(index % 9) + 1}`);
    }

    for (const index of new Array(729).keys()) {
        if (!puzzle.VE.rows.has(index) || clues.has(index) || determined.has(index)) { continue; }
        puzzle_canvas.markTexts.show(index);
    }
};


namespace TestRun {
    const puzzle = game.import('092001750500200008000030200075004960200060075069700030008090020700003089903800040');
    console.log('Puzzle has been successfully imported.');

    const clues = Set.union(
        ...puzzle.VE.columns.filter(
            (edge, vertex_set) => (edge < 81 && vertex_set.size == 1)
        ).values()
    );
    const h_seq = SOStrategies.obviousCandidateRemoval({
        puzzle: puzzle,
        determined: clues
    })

    if (h_seq.length > 0) {
        const puzzle_copy = puzzle.copy();
        for (const item of h_seq) {
            for (const action of item.actions) {
                const query_match = action.query.match(/^unmark (\d+)$/);
                if (query_match) {
                    puzzle_copy.VE.deleteRow(parseInt(query_match[1]));
                }
            }
        }
        puzzle_copy.EG = puzzle_copy.EG.filter((edge, _) => puzzle_copy.VE.columns.has(edge));
        print_puzzle({
            puzzle: puzzle_copy,
            clues: clues
        });
    }
    else {
        print_puzzle({
            puzzle: puzzle,
            clues: clues
        });
    }

    puzzle_canvas.markRects.show(3)?.attr({ fill: 'yellow', stroke: 'red', 'stroke-width': 1 });
}