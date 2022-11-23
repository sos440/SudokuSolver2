/**
 * Main.
 */
import './math/math';
import { SOEdgeID, SOPuzzle, SOVertexID } from "./so_graph";
import { SOSolver } from './so_solver';
import { Caretaker, Memento } from "./system/memento";
import { FormatOptions, SOGameIO } from './basic/io';
import { database as Database } from './database';

console.log(`Sudoku Solver build 009`);

const div_log = document.getElementById('logs') as HTMLElement;
const div_puzzle = document.getElementById('puzzle') as HTMLElement;

/** A Sudoku original game template. */
const Game = new SOPuzzle(3);

/** A puzzle canvas to display puzzles. */
const Editor = new SOSolver(Game);
Editor.canvas.addTo(div_puzzle);

const History = new Caretaker(Editor);

namespace TestRun {
    const loadPuzzle = (input: string, format: FormatOptions = 'base64') => {
        const v_ids = SOGameIO.import(Game, input, format);

        /** Initialize the editor. */
        const pz = new SOPuzzle(Game.p, v_ids);
        const v_id_clues = Set.union(...pz.adE['rc']
            .filter((e) => (e.$['v'].size == 1))
            .map((e) => e.$['v'].map((v) => v.id))
        );

        Editor.snapshot.vertices = v_ids;
        Editor.snapshot.clues = v_id_clues;
        Editor.snapshot.determined = v_id_clues;
        Editor.snapshot.pencilmarked = new Set<SOEdgeID>();
        Editor.snapshot.annotations = [];

        /** Initialize the history and render the puzzle. */
        History.init(new Memento('initial|final', {
            snapshot: Editor.snapshot,
            logs: ['Puzzle loaded.'],
            selected: -1
        }));
        Editor.render();

        console.log('Puzzle has been successfully imported.');
    };

    /** Strategy! */
    const strategy_list = [
        Editor.obviousCandidateRemoval,
        Editor.nakedSingle,
        Editor.hiddenSingle,
        Editor.intersectionPointing,
        Editor.intersectionClaiming,
        Editor.nakedSubsetGenerator(2),
        Editor.nakedSubsetGenerator(3),
        Editor.hiddenSubsetGenerator(2),
        Editor.nakedSubsetGenerator(4),
        Editor.hiddenSubsetGenerator(3),
        Editor.hiddenSubsetGenerator(4),
        Editor.fishGenerator(2),
        Editor.fishGenerator(3),
        Editor.fishGenerator(4)
    ];

    const solve_prev = () => {
        div_log.replaceChildren();
        History.moveBy(-1);
        console.log(`At time: ${History.time}`);
    };

    const solve_next = () => {
        console.time('benchmark');
        div_log.replaceChildren();

        if (History.atEnd()) {
            const v_ids = Editor.snapshot.vertices as Set<SOVertexID>;
            const pz = new SOPuzzle(Game.p, v_ids);
            for (const strategy of strategy_list) {
                const pmem_seg = strategy.call(Editor, pz);
                if (pmem_seg.length == 0) { continue; }
                History.addSegment(pmem_seg);
                break;
            }
        }

        History.moveBy(1);
        console.log(`At time: ${History.time}`);
        console.timeEnd('benchmark');
    };

    const export_puzzle = () => {
        div_log.replaceChildren();
        div_log.appendChild(
            document.createTextNode(`base64: ${SOGameIO.export(Game, (History.now() as Memento).snapshot.vertices as Set<SOVertexID>)}`)
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