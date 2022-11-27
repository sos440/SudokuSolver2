/**
 * @module strategy
 */

import './math/math';
import { Originator, Memento } from "./system/memento";
import { SOVertexID, SOEdgeID, SOFaceType, SOPuzzle } from "./so_graph";
import { PuzzleCanvasSnapshot, PuzzleCanvas, Attributes, SVG } from "./system/canvas";


export class SOSolver extends Originator {
    game: SOPuzzle;
    canvas: PuzzleCanvas;
    snapshot: PuzzleCanvasSnapshot;
    selected: number;
    constructor(game: SOPuzzle, attr?: Attributes) {
        super();
        this.game = game;
        this.canvas = new PuzzleCanvas(attr);
        this.snapshot = {
            vertices: new Set<SOVertexID>(),
            clues: new Set<SOVertexID>(),
            determined: new Set<SOVertexID>(),
            pencilmarked: new Set<SOEdgeID>(),
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

    render(): void {
        const v_ids = this.snapshot.vertices as Set<SOVertexID>;
        const v_id_clues = this.snapshot.clues as Set<SOVertexID>;
        const v_id_dets = this.snapshot.determined as Set<SOVertexID>;
        const e_id_pms = this.snapshot.pencilmarked as Set<SOEdgeID>;
        const grp_cmds = this.snapshot.annotations as string[];
        const pz = new SOPuzzle(this.game.p, v_ids);
        const svg = this.canvas;
        const o = svg.style;

        svg.cellRects.clearAll();
        svg.cellTexts.hideAll().clearAll();
        svg.markRects.hideAll().clearAll();
        svg.markTexts.hideAll().clearAll();
        svg.drawing.html('');

        /** Renders each cell. */
        for (const edge of pz.loopEdges(['rc'])) {
            const vset = edge.$['v'];

            if (vset.size == 1) {
                vset.forEach((v) => {
                    if (v_id_clues.has(v.id)) {
                        (svg.cellTexts.show(edge.id) as SVG)
                            .html(`${o['mark-symbols'].charAt(v.id % 9)}`)
                            .attr({ fill: 'blue' });
                    }
                    else if (v_id_dets.has(v.id)) {
                        (svg.cellTexts.show(edge.id) as SVG)
                            .html(`${o['mark-symbols'].charAt(v.id % 9)}`);
                    }
                    else {
                        svg.markTexts.show(v.id);
                    }
                });
            }
            else if (vset.size == 0) {
                (svg.cellTexts.show(edge.id) as SVG)
                    .html('X')
                    .attr({ fill: 'red' });
            }
            else if (e_id_pms.has(edge.id)) {
                vset.forEach((v) => {
                    svg.markTexts.show(v.id);
                });
            }
        }

        /** Render annotations. */
        for (const cmd of grp_cmds) {
            /** Match highlights. */
            const match_hl = cmd.match(/^highlight (\S+) ([\d\s,]+) as (.*)$/);
            const match_uhl = cmd.match(/^unhighlight (\S+) ([\d\s,]+)$/);
            if (match_hl) {
                const type = match_hl[1];
                const id_list = match_hl[2].split(/[\s,]+/).map((s) => Number.parseInt(s));
                const class_name = match_hl[3];

                for (const id of id_list) {
                    if (id < 0) { continue; }
                    if (type == 'mark') {
                        svg.markRects.show(id)?.attr(o[`rect:${class_name}`]);
                        svg.markTexts.get(id)?.attr(o[`text:${class_name}`]);
                        if (class_name == 'removed') {
                            const mark_elem = (svg.markRects.get(id) as SVG).element;
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
                        svg.cellRects.show(id)?.attr(o[`rect:${class_name}`]);
                        svg.cellTexts.get(id)?.attr(o[`text:${class_name}`]);
                    }
                    else if (type == 'row' || type == 'col' || type == 'box') {
                        for (const e_rc of pz.adF[type as SOFaceType][id].$['rc']) {
                            svg.cellRects.show(e_rc.id)?.attr(o[`rect:${class_name}`]);
                            svg.cellTexts.get(e_rc.id)?.attr(o[`text:${class_name}`]);
                        }
                    }
                }
            }
            else if (match_uhl) {
                const type = match_uhl[1];
                const id_list = match_uhl[2].split(/[\s,]+/).map((s) => Number.parseInt(s));

                for (const id of id_list) {
                    if (id < 0) { continue; }
                    if (type == 'mark') {
                        svg.markRects.clearStyle(id);
                        svg.markRects.hide(id);
                        svg.markTexts.clearStyle(id);
                    }
                    else if (type == 'cell' || type == 'rc') {
                        svg.cellRects.clearStyle(id);
                        svg.cellTexts.clearStyle(id);
                    }
                    else if (type == 'row' || type == 'col' || type == 'box') {
                        for (const e_rc of pz.adF[type as SOFaceType][id].$['rc']) {
                            svg.cellRects.clearStyle(e_rc.id);
                            svg.cellTexts.clearStyle(e_rc.id);
                        }
                    }
                }
            }

            /** Match line draws */
        }
    }
}