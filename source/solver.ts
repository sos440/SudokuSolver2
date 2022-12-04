import { Edge } from "./basic/adj";
import { RawPuzzle, Puzzle } from "./basic/puzzle";
import { PuzzleCanvasSnapshot, PuzzleCanvas, Attributes, SVG } from "./comp/svg";
import { Originator, Memento } from "./comp/memento";
import { GameSpecItem } from "./spec/spec";


export class Solver extends Originator {
    gameSpec: GameSpecItem;
    canvas: PuzzleCanvas;
    snapshot: PuzzleCanvasSnapshot;
    selected: number;
    constructor(game_spec: GameSpecItem, attr?: Attributes) {
        super();
        this.gameSpec = game_spec;
        this.canvas = new PuzzleCanvas(game_spec, attr);
        this.snapshot = {
            type: 'unknown',
            rest: new Set<number>(),
            given: new Set<number>(),
            found: new Set<number>(),
            pencilmarked: new Set<number>(),
            annotations: []
        };
        this.selected = -1;
    }

    load(mem: Memento, time: number): void {
        this.snapshot = mem.snapshot;
        this.selected = mem.selected;
        this.printLogs(mem.logs, time);
        this.render();
    }

    printLogs(log_list: string[], time: number): void {
        console.clear();
        for (const log of log_list) {
            console.log(log);
        }
    }

    parseSelector(target: string) {
        /** @todo Design and implement mark/cell selector. */
    }

    render(): void {
        const vid_given = this.snapshot.given as Set<number>;
        const vid_found = this.snapshot.found as Set<number>;
        const eid_marks = this.snapshot.pencilmarked as Set<number>;
        const grp_cmds = this.snapshot.annotations as string[];
        const pz = new Puzzle(this.gameSpec, this.snapshot as RawPuzzle);
        const svg = this.canvas;
        const o = svg.style;

        svg.cellRects.clearAll();
        svg.cellTexts.hideAll().clearAll();
        svg.markRects.hideAll().clearAll();
        svg.markTexts.hideAll().clearAll();
        svg.drawing.html('');

        /** Renders each cell. */
        for (const e of pz.findAll(/e #\{r\d+c\d+\}/)) {
            const vset = (e as Edge).v;

            if (vset.size == 1) {
                for (const v of vset) {
                    if (vid_given.has(v.attr.index)) {
                        (svg.cellTexts.show(e.attr.index) as SVG)
                            .html(`${this.gameSpec.numCharMap[v.attr.num]}`)
                            .attr({ fill: 'blue' });
                    }
                    else if (vid_found.has(v.attr.index)) {
                        (svg.cellTexts.show(e.attr.index) as SVG)
                            .html(`${this.gameSpec.numCharMap[v.attr.num]}`);
                    }
                    else {
                        svg.markTexts.show(v.attr.index);
                    }
                }
            }
            else if (vset.size == 0) {
                (svg.cellTexts.show(e.attr.index) as SVG)
                    .html('X')
                    .attr({ fill: 'red' });
            }
            else if (eid_marks.has(e.attr.index)) {
                for (const v of vset) {
                    svg.markTexts.show(v.attr.index);
                }
            }
        }

        /** Render annotations. */
        for (const cmd of grp_cmds) {
            /** Match highlights. */
            const match_hl = cmd.match(/^highlight (\S+) ([\d\s,]+) as (.*)$/);
            const match_uhl = cmd.match(/^unhighlight (\S+) ([\d\s,]+)$/);

            if (match_hl) {
                const type = match_hl[1];
                const arg_list = match_hl[2].split(/[\s,]+/).map((s) => Number.parseInt(s));
                const class_name = match_hl[3];

                for (const arg of arg_list) {
                    if (arg < 0) { continue; }
                    else if (type == 'mark') {
                        svg.markRects.show(arg)?.attr(o[`rect:${class_name}`]);
                        svg.markTexts.get(arg)?.attr(o[`text:${class_name}`]);
                        if (class_name == 'removed') {
                            const mark_elem = (svg.markRects.get(arg) as SVG).element;
                            const x = mark_elem.getAttribute('x');
                            const y = mark_elem.getAttribute('y');
                            const w = mark_elem.getAttribute('width');
                            const h = mark_elem.getAttribute('height');
                            svg.drawing
                                .path({ 'd': `M ${x} ${y} l ${w} ${h} m -${w} 0 l ${w} -${h}` })
                                .attr({ 'stroke': 'red' })
                        }
                    }
                    else if (type == 'cell' || type == 'rc') {
                        svg.cellRects.show(arg)?.attr(o[`rect:${class_name}`]);
                        svg.cellTexts.get(arg)?.attr(o[`text:${class_name}`]);
                    }
                    else if (type == 'row') {
                        for (let j = 0; j < o['columns']; j++) {
                            const id = arg * o['columns'] + j;
                            svg.cellRects.show(id)?.attr(o[`rect:${class_name}`]);
                            svg.cellTexts.get(id)?.attr(o[`text:${class_name}`]);
                        }
                    }
                    else if (type == 'col') {
                        for (let i = 0; i < o['rows']; i++) {
                            const id = i * o['columns'] + arg;
                            svg.cellRects.show(id)?.attr(o[`rect:${class_name}`]);
                            svg.cellTexts.get(id)?.attr(o[`text:${class_name}`]);
                        }
                    }
                    else if (type == 'box') {
                        /** @todo Implement a more robust way of drawing a puzzle. */
                    }
                }
            }
            else if (match_uhl) {
                const type = match_uhl[1];
                const arg_list = match_uhl[2].split(/[\s,]+/).map((s) => Number.parseInt(s));

                for (const arg of arg_list) {
                    if (arg < 0) { continue; }
                    else if (type == 'mark') {
                        svg.markRects.clearStyle(arg);
                        svg.markRects.hide(arg);
                        svg.markTexts.clearStyle(arg);
                    }
                    else if (type == 'cell' || type == 'rc') {
                        svg.cellRects.clearStyle(arg);
                        svg.cellTexts.clearStyle(arg);
                    }
                    else if (type == 'row') {
                        for (let j = 0; j < o['columns']; j++) {
                            const id = arg * o['columns'] + j;
                            svg.cellRects.clearStyle(id);
                            svg.cellTexts.clearStyle(id);
                        }
                    }
                    else if (type == 'col') {
                        for (let i = 0; i < o['rows']; i++) {
                            const id = i * o['columns'] + arg;
                            svg.cellRects.clearStyle(id);
                            svg.cellTexts.clearStyle(id);
                        }
                    }
                    else if (type == 'box') {
                        /** @todo Implement a more robust way of drawing a puzzle. */
                    }
                }
            }

            /** Match line draws */
        }
    }
}