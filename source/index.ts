import { SOEdge, SOGame, SOVertex } from "./math/graph_so";
import { SOSolver } from './solver_so';
import { Caretaker, Memento } from "./system/memento";
import { PuzzleIO } from './system/io';

console.log(`Sudoku Solver build 007`);

const div_log = document.getElementById('logs') as HTMLElement;
const div_puzzle = document.getElementById('puzzle') as HTMLElement;

/** A Sudoku original game template. */
const Game = new SOGame(3);

/** A puzzle canvas to display puzzles. */
const Editor = new SOSolver(Game);
Editor.canvas.addTo(div_puzzle);

const History = new Caretaker(Editor);

namespace TestRun {
    const vertices = PuzzleIO.import(Game, '001000000920400076000500002000120364007000050000900000000000005008050100019240000');
    console.log('Puzzle has been successfully imported.');

    /** Initialize the editor. */
    const puzzle = Game.filter((vertex, _) => vertices.has(vertex));
    const cell_units = puzzle.EG.columns.get('rc') as Set<SOEdge>;
    const clues = Set.union(
        ...puzzle.VE.columns.filter(
            (edge, vertex_set) => (cell_units.has(edge) && vertex_set.size == 1)
        ).values()
    );

    Editor.snapshot.vertices = vertices;
    Editor.snapshot.clues = clues;
    Editor.snapshot.determined = clues;

    /** Initialize the history and render the puzzle. */
    History.init(new Memento('initial|final', {
        snapshot: Editor.snapshot,
        logs: ['Puzzle loaded.'],
        selected: -1
    }));
    Editor.render();

    /** Strategy! */
    const strategy_list = [
        Editor.obviousCandidateRemoval,
        Editor.nakedSingle,
        Editor.hiddenSingle,
        Editor.intersectionPointing,
        Editor.intersectionClaiming
    ];

    const solve_prev = () => {
        div_log.replaceChildren();
        History.moveBy(-1);
        console.log(`At time: ${History.time}`);
    };
    
    const solve_next = () => {
        div_log.replaceChildren();

        if (History.atEnd()) {
            const vertices = Editor.snapshot.vertices as Set<SOVertex>;
            const puzzle = Game.filter((vertex, _) => vertices.has(vertex));
            for (const strategy of strategy_list) {
                const pmem_seg = strategy.call(Editor, puzzle);
                if (pmem_seg.length == 0) { continue; }
                History.addSegment(pmem_seg);
                break;
            }
        }

        History.moveBy(1);
        console.log(`At time: ${History.time}`);
    };

    document.getElementById('prev')?.addEventListener('click', solve_prev);
    document.getElementById('next')?.addEventListener('click', solve_next);
}