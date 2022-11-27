/**
 * Sudoku Solver (build 011)
 */
import './math/math';
import { SOEdgeID, SOPuzzle, SOVertexID } from "./so_graph";
import { FormatOptions, SOGameIO } from './basic/io';
import { database as Database } from './database';
import { Caretaker, Memento } from "./system/memento";
import { SOSolver } from './so_solver';
import './so_strats/strats';

const div_log = document.getElementById('logs') as HTMLElement;
const div_puzzle = document.getElementById('puzzle') as HTMLElement;

/** A Sudoku original game template. */
const Game = new SOPuzzle(3);

/** A puzzle canvas to display puzzles. */
const Editor = new SOSolver(Game);
Editor.canvas.addTo(div_puzzle);

const History = new Caretaker(Editor);

const LogConsole = {
    log(msg: string, attr: object = {}) {
        const dom_line = document.createElement('div');
        for (const key in attr) {
            dom_line.setAttribute(key, attr[key as keyof typeof attr]);
        }
        dom_line.innerHTML = msg;
        div_log.appendChild(dom_line);
    },
    clear() {
        div_log.replaceChildren();
    },
}

Editor.printLogs = (log_list: string[], time: number): void => {
    /** Must delete backward, since the children changes dynamically */
    let has_log = false;
    for (let i = div_log.children.length - 1; i >= 0; i--) {
        const e = div_log.children[i];
        const t = Number.parseInt(e.getAttribute('time') || '99999');
        if (t > time) {
            div_log.removeChild(e);
        }
        else if (t == time) {
            has_log = true;
        }
    }

    /** Writes down the log if it does not already exist. */
    if (!has_log) {
        for (const log of log_list) {
            const attr: { time: string; style?: string; } = {
                time: time.toString()
            };

            const match_title_lv1 = log.match(/^title novice "(.*)"$/);
            const match_title_lv2 = log.match(/^title apprentice "(.*)"$/);
            const match_title_lv3 = log.match(/^title expert "(.*)"$/);
            const match_log = log.match(/log "(.*)"/);

            if (match_title_lv1) {
                attr['style'] = 'font-weight: bold; background-color: #E0E0E0;';
                LogConsole.log(match_title_lv1[1], attr);
            }
            else if (match_title_lv2) {
                /** khaki */
                attr['style'] = 'font-weight: bold; background-color: #F0E68C;';
                LogConsole.log(match_title_lv2[1], attr);
            }
            else if (match_title_lv3) {
                /** cauliflower blue */
                attr['style'] = 'font-weight: bold; background-color: #6495ED; color: white;';
                LogConsole.log(match_title_lv3[1], attr);
            }
            else if (match_log) {
                LogConsole.log(match_log[1], attr);
            }
        }
    }
};

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
        Editor.fishGenerator(4),

        Editor.frankenFishGenerator(2),
        Editor.frankenFishGenerator(3),
        Editor.frankenFishGenerator(4),

        Editor.AICGenerator(
            'X-cycle',
            ['rk', 'ck', 'bk'],
            ['rk', 'ck', 'bk'],
            20
        ),
        Editor.computeGroupedEdges,
        Editor.AICGenerator(
            'Grouped X-cycle',
            ['rk', 'ck', 'bk', 'grp'],
            ['rk', 'ck', 'bk', 'grp'],
            20
        ),

        Editor.AICGenerator(
            'XY-chain',
            ['rc'],
            ['rk', 'ck', 'bk'],
            20
        ),

        Editor.AICGenerator(
            'Alternating Inference Chain',
            ['rc', 'rk', 'ck', 'bk'],
            ['rc', 'rk', 'ck', 'bk'],
            20
        ),
        Editor.AICGenerator(
            'Grouped AIC',
            ['rc', 'rk', 'ck', 'bk', 'grp'],
            ['rc', 'rk', 'ck', 'bk', 'grp'],
            20
        ),

        Editor.computeALEdges(9, [
            ['row', ['rc'], ['rk']],
            ['col', ['rc'], ['ck']],
            ['box', ['rc'], ['bk']]
        ]),
        Editor.AICGenerator(
            'ALS AIC',
            ['rc', 'rk', 'ck', 'bk', 'als'],
            ['rc', 'rk', 'ck', 'bk', 'als'],
            20
        ),
        
        Editor.computeALEdges(9, [
            ['key', ['rk'], ['ck']],
            ['key', ['ck'], ['rk']],
        ]),
        Editor.AICGenerator(
            'Full AIC',
            SOPuzzle.edgeTypes,
            SOPuzzle.edgeTypes,
            20
        ),
    ];

    const solve_prev = () => {
        History.moveBy(-1);
    };

    const solve_next = () => {
        console.time('benchmark');

        if (History.atEnd()) {
            const v_ids = Editor.snapshot.vertices as Set<SOVertexID>;
            const pz = new SOPuzzle(Game.p, v_ids);
            let is_updated = false;
            for (const strategy of strategy_list) {
                const pmem_seg = strategy.call(Editor, pz);
                if (pmem_seg.length == 0) { continue; }
                History.addSegment(pmem_seg);
                is_updated = true;
                break;
            }

            /** Some dirty code added to control the auto solver functionality. */
            if (!is_updated) {
                LogConsole.log(`Cannot proceed further.`, { style: `background-color: red; color: white; font-weight: bold;` });
                autoSolverStatus.isActive = true;
                auto_solve();
            }
        }

        History.moveBy(1);
        console.timeEnd('benchmark');
    };

    const export_puzzle = () => {
        const vset = (History.now() as Memento).snapshot.vertices as Set<SOVertexID>;
        LogConsole.clear();
        LogConsole.log(`simple: ${SOGameIO.export(Game, vset, 'simple')}`);
        LogConsole.log(`base64: ${SOGameIO.export(Game, vset)}`);
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