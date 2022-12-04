/**
 * Sudoku Solver (build 011)
 */
import { GameSpecItem, GameSpecs } from './spec/spec';
import { Puzzle, RawPuzzle } from './basic/puzzle';
import { FormatOptions, IO } from './basic/io';
import { database as Database } from './database';
import { Caretaker, Memento, StrategyResult } from "./comp/memento";
import { Solver } from './solver';
import './strategies/merge';

/** Import the original sudoku rule. */
const GameSO = GameSpecs.collections.get('sudoku original (3)') as GameSpecItem;
if (typeof GameSO == 'undefined') {
    throw TypeError('Failed to load the game rule.');
}

/** A puzzle canvas to display puzzles. */
const Editor = new Solver(GameSO);
Editor.canvas.addTo(document.getElementById('puzzle') as HTMLElement);

/** An object storing and manipulating history. */
const History = new Caretaker(Editor);

/** Console */
namespace LogConsole {
    const div_log = document.getElementById('logs') as HTMLElement;

    export const log = (msg: string, attr: object = {}) => {
        const dom_line = document.createElement('div');
        for (const key in attr) {
            dom_line.setAttribute(key, attr[key as keyof typeof attr]);
        }
        dom_line.insertAdjacentHTML('beforeend', msg);
        
        div_log.appendChild(dom_line);
        div_log.scrollTop = div_log.scrollHeight;
    };

    /** Clears part of the messages. Returns true if a message at the specified time alreday exists. */
    export const clear = (time?: number): boolean => {
        if (typeof time == 'undefined') {
            div_log.replaceChildren();
            return false;
        }
        else {
            /** Must delete backward, since the children changes dynamically */
            let has_log = false;
            for (let i = div_log.children.length - 1; i >= 0; i--) {
                const e = div_log.children[i];
                const t = Number.parseInt(e.getAttribute('time') || '99999999');
                if (t > time) {
                    div_log.removeChild(e);
                }
                else if (t == time) {
                    has_log = true;
                }
            }
            return has_log;
        }
    };
}

Editor.printLogs = (msg_list: string[], time: number): void => {
    const has_log = LogConsole.clear(time);
    if (has_log) { return; }

    /** Writes down the log if it does not already exist. */
    LogConsole.log(msg_list.join(''), { time: time.toString() });
};

namespace TestRun {
    const loadPuzzle = (input: string, format: FormatOptions) => {
        const pz_raw = IO.import(input, GameSO, format);
        const pz = new Puzzle(GameSO, pz_raw);

        /** Initialize the editor. */
        Editor.snapshot.type = 'sudoku original (3)';
        Editor.snapshot.given = pz_raw.given;
        Editor.snapshot.found = pz_raw.found;
        Editor.snapshot.rest = pz_raw.rest;
        Editor.snapshot.pencilmarked = new Set<number>();
        Editor.snapshot.annotations = [];

        /** Initialize the history and render the puzzle. */
        History.init(new Memento('initial|final', {
            snapshot: Editor.snapshot,
            logs: ['Puzzle loaded.'],
            selected: -1
        }));

        Editor.render();
        History.moveBy(0);
    };

    /** Strategy! */
    const strategy_list = [
        Editor.obviousCandidateRemoval,
        Editor.nakedSingle,
        Editor.hiddenSingle
    ];

    const solve_prev = () => {
        History.moveBy(-1);
    };

    const solve_next = () => {
        console.time('benchmark');
        LogConsole.clear(History.time);

        if (History.atEnd()) {
            const pz = new Puzzle(GameSO, Editor.snapshot as RawPuzzle);
            let pmem_seg = new StrategyResult();
            for (const strategy of strategy_list) {
                pmem_seg = strategy.call(Editor, pz);
                if (pmem_seg.isUpdated) {
                    History.addSegment(pmem_seg.export());
                    break;
                }
                else if (pmem_seg.isUpdated) {
                    History.addSegment(pmem_seg.export());
                    break;
                }
            }

            /** Some dirty code added to control the auto solver functionality. */
            if (!(pmem_seg.isEnd || pmem_seg.isUpdated)) {
                LogConsole.log(`
                    <div class="msg_title error">
                    Cannot proceed further.
                    </div>
                `);
                autoSolverStatus.isActive = true;
                auto_solve();
            }
        }

        History.moveBy(1);
        console.timeEnd('benchmark');
    };

    const export_puzzle = () => {
        const pz_raw = (History.now() as Memento).snapshot as RawPuzzle;
        LogConsole.clear();
        LogConsole.log(`simple: <pre>${IO.export(pz_raw, GameSO, 'simple')}</pre>`);
        LogConsole.log(`grid: <pre>${IO.export(pz_raw, GameSO, 'grid')}</pre>`);
        LogConsole.log(`json: <pre>${IO.export(pz_raw, GameSO, 'json')}</pre>`);
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
        LogConsole.clear();
        if (samples.selectedIndex >= 0) {
            const item = Database[samples.selectedIndex];
            loadPuzzle(item.data, item.format);
        }
        else {
            LogConsole.log(`No puzzle is selected.`);
        }
    };

    import_sample();

    const apply_cmd = () => {
        const cmd_field = document.getElementById('cmd') as HTMLInputElement;
        const cmd = cmd_field.value;
        History.now()?.snapshot.annotations?.push(cmd);
        Editor.load(History.now() as Memento, History.time);
        cmd_field.value = "";
    };

    const autoSolverStatus = {
        isActive: false,
        handle: -1,
        button: document.getElementById('auto') as HTMLButtonElement
    };

    const auto_solve = () => {
        if (autoSolverStatus.isActive) {
            autoSolverStatus.isActive = false;
            clearInterval(autoSolverStatus.handle);
            autoSolverStatus.button.innerHTML = 'Auto';
        }
        else {
            autoSolverStatus.isActive = true;
            autoSolverStatus.handle = setInterval(solve_next, 25);
            autoSolverStatus.button.innerHTML = 'Stop';
        }
    }

    document.getElementById('prev')?.addEventListener('click', solve_prev);
    document.getElementById('next')?.addEventListener('click', solve_next);
    document.getElementById('export')?.addEventListener('click', export_puzzle);
    samples.addEventListener('change', import_sample);
    document.getElementById('import')?.addEventListener('click', import_sample);
    document.getElementById('apply_cmd')?.addEventListener('click', apply_cmd);
    autoSolverStatus.button.addEventListener('click', auto_solve);
}