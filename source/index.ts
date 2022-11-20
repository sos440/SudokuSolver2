import { SOEdge, SOGame, SOVertex } from "./math/graph_so";
import { SOSolver } from './solver_so';
import { Caretaker, Memento } from "./system/memento";
import { FormatOptions, PuzzleIO } from './system/io';
import { database as Database } from './database';

console.log(`Sudoku Solver build 008`);

const div_log = document.getElementById('logs') as HTMLElement;
const div_puzzle = document.getElementById('puzzle') as HTMLElement;

/** A Sudoku original game template. */
const Game = new SOGame(3);

/** A puzzle canvas to display puzzles. */
const Editor = new SOSolver(Game);
Editor.canvas.addTo(div_puzzle);

const History = new Caretaker(Editor);

namespace TestRun {
    const loadPuzzle = (input: string, format: FormatOptions = 'base64') => {
        const vertices = PuzzleIO.import(Game, input, format);
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
        Editor.snapshot.pencilmarked = new Set<SOEdge>();

        /** Initialize the history and render the puzzle. */
        History.init(new Memento('initial|final', {
            snapshot: Editor.snapshot,
            logs: ['Puzzle loaded.'],
            selected: -1
        }));
        Editor.render();
    };

    /** Strategy! */
    const strategy_list = [
        Editor.obviousCandidateRemoval,
        Editor.nakedSingle,
        Editor.hiddenSingle,
        Editor.intersectionPointing,
        Editor.intersectionClaiming,
        Editor.nakedSubsetGenerator(2),
        Editor.hiddenSubsetGenerator(2),
        Editor.nakedSubsetGenerator(3),
        Editor.hiddenSubsetGenerator(3),
        Editor.nakedSubsetGenerator(4),
        Editor.hiddenSubsetGenerator(4)
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

    const export_puzzle = () => {
        div_log.replaceChildren();
        div_log.appendChild(
            document.createTextNode(`base64: ${PuzzleIO.export(Game, (History.now() as Memento).snapshot.vertices as Set<SOVertex>)}`)
        );
        /** Copy the image to the clipboard. */
        navigator.clipboard.writeText(`data:image/svg+xml;base64,${btoa(Editor.canvas.element.outerHTML)}`);
    };

    const samples = document.getElementById('samples') as HTMLSelectElement;
    for (const [index, item] of Database.entries()) {
        const option = document.createElement('option');
        option.value = index.toString();
        option.innerText = item.desc ?? `Sample #${index + 1}`;
        option.selected = index == 0;
        samples.appendChild(option);
    }

    const import_sample = () => {
        div_log.replaceChildren();
        if (samples.selectedIndex >= 0) {
            const item = Database[samples.selectedIndex];
            loadPuzzle(item.data, item.format);
            div_log.appendChild(
                document.createTextNode(`Puzzle loaded.`)
            );
        }
        else {
            div_log.appendChild(
                document.createTextNode(`No puzzle is selected.`)
            );
        }
    };

    import_sample();

    const apply_cmd = () => {
        const cmd_field = document.getElementById('cmd') as HTMLInputElement;
        const cmd = cmd_field.value;
        History.now()?.snapshot.annotations?.push(cmd);
        Editor.load(History.now() as Memento);
        cmd_field.value = "";
    };

    document.getElementById('prev')?.addEventListener('click', solve_prev);
    document.getElementById('next')?.addEventListener('click', solve_next);
    document.getElementById('export')?.addEventListener('click', export_puzzle);
    samples.addEventListener('change', import_sample);
    document.getElementById('import')?.addEventListener('click', import_sample);
    document.getElementById('apply_cmd')?.addEventListener('click', apply_cmd);
}