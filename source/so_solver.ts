/**
 * @module strategy
 */

import './math/math';
import { Originator, Memento, PartialMemento } from "./system/memento";
import { SOVertexID, SOEdgeID, SOFaceType, SOPuzzle, SOEdge, SOVertex } from "./so_graph";
import { PuzzleCanvasSnapshot, PuzzleCanvas, Attributes, SVG } from "./system/canvas";
import { range } from './basic/tools';
import { MSet } from './math/math';


interface PuzzleConsole {
    log: (cmd: string) => void;
    clear: () => void;
}


export class SOSolver extends Originator {
    game: SOPuzzle;
    canvas: PuzzleCanvas;
    console: PuzzleConsole;
    snapshot: PuzzleCanvasSnapshot;
    selected: number;
    constructor(game: SOPuzzle, attr?: Attributes) {
        super();
        this.game = game;
        this.canvas = new PuzzleCanvas(attr);
        this.console = console;
        this.snapshot = {
            vertices: new Set<SOVertexID>(),
            clues: new Set<SOVertexID>(),
            determined: new Set<SOVertexID>(),
            pencilmarked: new Set<SOEdgeID>(),
            annotations: []
        };
        this.selected = -1;
    }

    load(mem: Memento): void {
        this.snapshot = mem.snapshot;
        this.selected = mem.selected;
        this.printLogs(mem.logs);
        this.render();
    }

    printLogs(log_list: string[]): void {
        this.console.clear();
        for (const log of log_list) {
            this.console.log(log);
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
            if (match_hl) {
                const type = match_hl[1];
                const id_list = match_hl[2].split(/[\s,]+/).map((s) => Number.parseInt(s));
                const class_name = match_hl[3];

                for (const id of id_list) {
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

            /** Match line draws */
        }
    }

    obviousCandidateRemoval(pz: SOPuzzle): PartialMemento[] {
        let is_updated = false;
        const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
        const v_id_dets = this.snapshot.determined as Set<SOVertexID>;
        const grp_cmds = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`title "Obvious Candidate Removal"`],
                snapshot: {
                    pencilmarked: new Set<SOEdgeID>(pz.adE['rc'].keys()),
                    annotations: grp_cmds
                }
            },
            {
                type: 'final',
                logs: [],
                snapshot: {
                    vertices: v_ids,
                    annotations: []
                }
            }
        ];

        /** For each determined vertex in a cell represented by its index: */
        for (const v_id_src of v_id_dets) {
            const v_src = pz.adV[v_id_src];
            const v_visible = Set.union(v_src.$['rk'].$['v'], v_src.$['ck'].$['v'], v_src.$['bk'].$['v']);
            v_visible.delete(v_src);
            for (const v_targ of v_visible) {
                is_updated = true;
                v_ids.delete(v_targ.id);
                grp_cmds.push(`highlight mark ${v_targ.id} as removed`);
            }
        }

        return (is_updated) ? h_seg : [];
    }


    /** Naked single */
    nakedSingle(pz: SOPuzzle): PartialMemento[] {
        let is_updated = false;
        const v_id_dets = new Set(this.snapshot.determined);
        const grp_cmds = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`title "Naked Single"`],
                snapshot: {
                    determined: v_id_dets,
                    annotations: grp_cmds
                }
            },
            {
                type: 'final',
                logs: [],
                snapshot: {
                    annotations: []
                }
            }
        ];

        /** Loops through cells to find naked singles: */
        for (const edge of pz.adE['rc']) {
            const vset = edge.$['v'];
            const v_first = [...vset][0];
            /** If a naked single has been found: */
            if (vset.size == 1 && !v_id_dets.has(v_first.id)) {
                is_updated = true;
                v_id_dets.add(v_first.id);
                grp_cmds.push(`highlight cell ${v_first.$['rc'].id} as determined`);
            }
        }

        return (is_updated) ? h_seg : [];
    }


    /** Hidden single */
    hiddenSingle(pz: SOPuzzle): PartialMemento[] {
        const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
        const v_id_dets = new Set(this.snapshot.determined);
        const grp_cmds_rm = new Array<string>();
        const grp_cmds_det = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`title "Hidden Single"`],
                snapshot: {
                    annotations: grp_cmds_rm
                }
            },
            {
                type: 'middle',
                logs: [],
                snapshot: {
                    vertices: v_ids,
                    determined: v_id_dets,
                    annotations: grp_cmds_det
                }
            },
            {
                type: 'final',
                logs: [],
                snapshot: {
                    annotations: []
                }
            }
        ];

        /** Loop through *K-type units to find hidden singles: */
        for (const edge of pz.loopEdges(['rk', 'ck', 'bk'])) {
            const f_proj = edge.proj;

            /** Skips if the edge has more than one vertex. */
            const vset = edge.$['v'];
            if (vset.size > 1) { continue; }

            /** Skips if the vertex has already been determined. */
            const v_first = [...vset][0];
            if (v_id_dets.has(v_first.id)) { continue; }

            /** Skips naked singles. (This never happens if NS has already been applied.) */
            const e_cell = v_first.$['rc'];
            const v_visible = new Set(e_cell.$['v']);
            v_visible.delete(v_first);
            if (v_visible.size == 0) { continue; }

            /** If a hidden single has been found. */
            h_seg[0].logs?.push(`log "#v:${v_first.id} is a hidden single in #${f_proj.type}:${f_proj.id}."`);
            grp_cmds_rm.push(`highlight mark ${v_first.id} as determined`);
            grp_cmds_rm.push(`highlight ${f_proj.type} ${f_proj.id} as based`);
            grp_cmds_rm.push(`highlight cell ${e_cell.id} as intersect`);
            for (const v_targ of v_visible) {
                v_ids.delete(v_targ.id);
                h_seg[1].logs?.push(`log "#v:${v_targ.id} is in the same unit as the hidden single, hence is removed."`);
                grp_cmds_rm.push(`highlight mark ${v_targ.id} as removed`);
            }

            v_id_dets.add(v_first.id);
            grp_cmds_det.push(`highlight cell ${e_cell.id} as determined`);

            return h_seg;
        }

        return [];
    }


    /** Intersection pointing */
    intersectionPointing(pz: SOPuzzle): PartialMemento[] {
        const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
        const grp_cmds = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`title "Intersection (Pointing)"`],
                snapshot: {
                    annotations: grp_cmds
                }
            },
            {
                type: 'final',
                logs: [],
                snapshot: {
                    vertices: v_ids,
                    annotations: []
                }
            }
        ];

        for (const [e_line, e_box] of pz.loopLineBox()) {
            const vset_box = e_box.$['v'];
            const vset_line = e_line.$['v'];
            const vset_band = Set.intersection(vset_box, vset_line);

            if (!(vset_box.size == vset_band.size && vset_line.size > vset_band.size)) { continue; }

            /** If an intersection pointer has been found. */
            h_seg[0].logs?.push(`log "The #box:${e_box.proj.id} and #${e_line.proj.type}:${e_line.proj.id} forms a locked configuration."`);
            grp_cmds.push(`highlight mark ${[...vset_band.map((v) => v.id)]} as determined`);
            grp_cmds.push(`highlight ${e_line.proj.type} ${e_line.proj.id} as affected`);
            grp_cmds.push(`highlight box ${e_box.proj.id} as based`);
            grp_cmds.push(`highlight cell ${[...Set.intersection(e_line.$['rc'], e_box.$['rc']).map((e) => e.id)]} as intersect`);

            /** Loops through the vertices to be removed. */
            for (const v_targ of Set.diff(vset_line, vset_band)) {
                v_ids.delete(v_targ.id);
                h_seg[1].logs?.push(`log "#v:${v_targ.id} in #${e_line.proj.type}:${e_box.proj.id} is erased by the pointer."`);
                grp_cmds.push(`highlight mark ${v_targ.id} as removed`);
            }

            return h_seg;
        }

        return [];
    }


    /** Intersection pointing */
    intersectionClaiming(pz: SOPuzzle): PartialMemento[] {
        const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
        const grp_cmds = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`title "Intersection (Claiming)"`],
                snapshot: {
                    annotations: grp_cmds
                }
            },
            {
                type: 'final',
                logs: [],
                snapshot: {
                    vertices: v_ids,
                    annotations: []
                }
            }
        ];

        for (const [e_line, e_box] of pz.loopLineBox()) {
            const vset_box = e_box.$['v'];
            const vset_line = e_line.$['v'];
            const vset_band = Set.intersection(vset_box, vset_line);

            if (!(vset_line.size == vset_band.size && vset_box.size > vset_band.size)) {
                continue;
            }

            /** If an intersection claimer has been found. */
            h_seg[0].logs?.push(`log "The #box:${e_box.proj.id} and #${e_line.proj.type}:${e_line.proj.id} forms a locked configuration."`);
            grp_cmds.push(`highlight mark ${[...vset_band.map((v) => v.id)]} as determined`);
            grp_cmds.push(`highlight box ${e_box.proj.id} as affected`);
            grp_cmds.push(`highlight ${e_line.proj.type} ${e_line.proj.id} as based`);
            grp_cmds.push(`highlight cell ${[...Set.intersection(e_line.$['rc'], e_box.$['rc']).map((e) => e.id)]} as intersect`);

            /** Loops through the vertices to be removed. */
            for (const v_targ of Set.diff(vset_box, vset_band)) {
                v_ids.delete(v_targ.id);
                h_seg[1].logs?.push(`log "#v:${v_targ.id} in #box:${e_box.proj.id + 1} is erased by the claimer."`);
                grp_cmds.push(`highlight mark ${v_targ.id} as removed`);
            }

            return h_seg;
        }

        return [];
    }


    /** Naked Subset Generator */
    nakedSubsetGenerator(subset_size: number) {
        if (!Number.isInteger(subset_size) || subset_size < 2 || subset_size > 4) {
            throw RangeError(`Invalid range of parameter.`);
        }

        const subset_type = { [2]: 'Pair', [3]: 'Triple', [4]: 'Quad' }[subset_size];

        return (pz: SOPuzzle): PartialMemento[] => {
            const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
            const grp_cmds = new Array<string>();
            const h_seg: PartialMemento[] = [
                {
                    type: 'initial',
                    logs: [`title "Naked ${subset_type}"`],
                    snapshot: {
                        annotations: grp_cmds
                    }
                },
                {
                    type: 'final',
                    logs: [],
                    snapshot: {
                        vertices: v_ids,
                        annotations: []
                    }
                }
            ];

            for (const found of pz.loopFaceConfig(subset_size, [
                ['row', 'rc', 'rk'],
                ['col', 'rc', 'ck'],
                ['box', 'rc', 'bk']
            ])) {
                const face = found.face;
                const eset_s = found.strongEdges;
                const vset_s = found.strongVertices;
                const vset_wonly = found.weakOnlyVertices;
                /** Creates a report. */
                h_seg[0].logs?.push(`log "#cell:${[...eset_s.map((e) => e.id)]} form a naked ${subset_type?.toLocaleLowerCase()} in #${face.type}:${face.id}."`);
                grp_cmds.push(`highlight mark ${[...vset_s.map((v) => v.id)]} as determined`);
                grp_cmds.push(`highlight ${face.type} ${face.id} as affected`);
                grp_cmds.push(`highlight cell ${[...eset_s.map((e) => e.id)]} as intersect`);

                /** Loops through the vertices to be removed. */
                for (const v_targ of vset_wonly) {
                    v_ids.delete(v_targ.id);
                    h_seg[1].logs?.push(`log "#v:${v_targ.id} is erased."`);
                    grp_cmds.push(`highlight mark ${v_targ.id} as removed`);
                }

                return h_seg;
            }

            return [];
        };
    }


    /** Hidden Subset Generator */
    hiddenSubsetGenerator(subset_size: number) {
        if (!Number.isInteger(subset_size) || subset_size < 2 || subset_size > 4) {
            throw RangeError(`Invalid range of parameter.`);
        }

        const subset_type = { [2]: 'Pair', [3]: 'Triple', [4]: 'Quad' }[subset_size];

        return (pz: SOPuzzle): PartialMemento[] => {
            const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
            const grp_cmds = new Array<string>();
            const h_seg: PartialMemento[] = [
                {
                    type: 'initial',
                    logs: [`title "Hidden ${subset_type}"`],
                    snapshot: {
                        annotations: grp_cmds
                    }
                },
                {
                    type: 'final',
                    logs: [],
                    snapshot: {
                        vertices: v_ids,
                        annotations: []
                    }
                }
            ];

            for (const found of pz.loopFaceConfig(subset_size, [
                ['row', 'rk', 'rc'],
                ['col', 'ck', 'rc'],
                ['box', 'bk', 'rc']
            ])) {
                const face = found.face;
                const vset_s = found.strongVertices;
                const eset_w = found.weakEdges;
                const vset_wonly = found.weakOnlyVertices;
                /** Creates a report. */
                h_seg[0].logs?.push(`log "#cell:${[...eset_w.map((e) => e.id)]} form a hidden ${subset_type?.toLocaleLowerCase()} in #${face.type}:${face.id}."`);
                grp_cmds.push(`highlight mark ${[...vset_s.map((v) => v.id)]} as determined`);
                grp_cmds.push(`highlight ${face.type} ${face.id} as based`);
                grp_cmds.push(`highlight cell ${[...eset_w.map((e) => e.id)]} as intersect`);

                /** Loops through the vertices to be removed. */
                for (const v_targ of vset_wonly) {
                    v_ids.delete(v_targ.id);
                    h_seg[1].logs?.push(`log "#v:${v_targ.id} is erased."`);
                    grp_cmds.push(`highlight mark ${v_targ.id} as removed`);
                }

                return h_seg;
            }

            return [];
        };
    }


    /** Fish Generator */
    fishGenerator(subset_size: number) {
        if (!Number.isInteger(subset_size) || subset_size < 2 || subset_size > 4) {
            throw RangeError(`Invalid range of parameter.`);
        }

        const subset_type = { [2]: 'X-wing', [3]: 'Swordfish', [4]: 'Jellyfish' }[subset_size];

        return (pz: SOPuzzle): PartialMemento[] => {
            const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
            const grp_cmds = new Array<string>();
            const h_seg: PartialMemento[] = [
                {
                    type: 'initial',
                    logs: [`title "${subset_type}"`],
                    snapshot: {
                        annotations: grp_cmds
                    }
                },
                {
                    type: 'final',
                    logs: [],
                    snapshot: {
                        vertices: v_ids,
                        annotations: []
                    }
                }
            ];

            for (const found of pz.loopFaceConfig(subset_size, [
                ['key', 'rk', 'ck'],
                ['key', 'ck', 'rk'],
            ])) {
                const face = found.face;
                const eset_s = found.strongEdges;
                const vset_s = found.strongVertices;
                const eset_w = found.weakEdges;
                const vset_wonly = found.weakOnlyVertices;
                /** Creates a report. */
                h_seg[0].logs?.push(`log "#key:${face.id} of #cell:${[...vset_s.map((v) => v.$['rc'].id)]} form a ${subset_type?.toLocaleLowerCase()}."`);
                grp_cmds.push(`highlight mark ${[...vset_s.map((v) => v.id)]} as determined`);
                eset_s.forEach((e) => { grp_cmds.push(`highlight ${e.proj.type} ${e.proj.id} as based`); });
                eset_w.forEach((e) => { grp_cmds.push(`highlight ${e.proj.type} ${e.proj.id} as affected`); });
                grp_cmds.push(`highlight cell ${[...vset_s.map((v) => v.$['rc'].id)]} as intersect`);

                /** Loops through the vertices to be removed. */
                for (const v_targ of vset_wonly) {
                    v_ids.delete(v_targ.id);
                    h_seg[1].logs?.push(`log "#v:${v_targ.id} is erased."`);
                    grp_cmds.push(`highlight mark ${v_targ.id} as removed`);
                }

                return h_seg;
            }

            return [];
        };
    }


    /** TEST: Counts the number of bivalue and multivalue edges */
    singleDigit(pz: SOPuzzle): PartialMemento[] {
        const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
        const grp_cmds = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`title "Single Digit Strategy"`],
                snapshot: {
                    annotations: grp_cmds
                }
            },
            {
                type: 'final',
                logs: [],
                snapshot: {
                    vertices: v_ids,
                    annotations: []
                }
            }
        ];

        for (const w_iter of pz.loopConfig(
            [2, 4],
            [0, 1],
            ['rk', 'ck', 'bk'],
            ['rk', 'ck', 'bk']
        )) {
            // for (const outcome of w_iter) {
            //     const order = outcome.strongEdges.length;
            //     const rank = outcome.weakEdges.length - order;
            //     const idx = outcome.index;

            //     if (!idx.every((_: SOVertex, m: number) => (m >= 0))) { continue; }
            //     if (!idx.some((_: SOVertex, m: number) => (m > rank))) { continue; }

            //     /** If a locked configuration has been found, */
            //     h_seg[0].logs?.push(`log "Found a rank-${rank} locked configuration!"`);
            //     outcome.weakEdges.forEach((e) => {
            //         h_seg[0].logs?.push(`log "weak link: #${e.type}:${e.id}"`);
            //         grp_cmds.push(`highlight ${e.proj.type} ${e.proj.id} as affected`);
            //     });
            //     outcome.strongEdges.forEach((e) => {
            //         h_seg[0].logs?.push(`log "strong link: #${e.type}:${e.id}"`);
            //         grp_cmds.push(`highlight ${e.proj.type} ${e.proj.id} as based`);
            //     });

            //     for (const [v_targ, m] of idx) {
            //         if (m <= rank) { continue; }
            //         v_ids.delete(v_targ.id);
            //         h_seg[1].logs?.push(`log "#v:${v_targ.id} is erased."`);
            //         grp_cmds.push(`highlight mark ${v_targ.id} as removed`);
            //     }

            //     return h_seg;
            // }
        }

        return [];
    }


    /** TEST: Counts the number of bivalue and multivalue edges */
    countMultivalues(pz: SOPuzzle): PartialMemento[] {
        const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
        const grp_cmds = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`title "Counting"`],
                snapshot: {
                    annotations: grp_cmds
                }
            },
            {
                type: 'final',
                logs: [],
                snapshot: {
                    vertices: v_ids,
                    annotations: []
                }
            }
        ];

        const count_fn = (iter: IterableIterator<SOEdge>) => {
            let count_bi = 0;
            let count_multi = 0;
            for (const edge of iter) {
                const size = edge.$['v'].size;
                if (size == 2) { count_bi++; }
                if (size >= 2) { count_multi++; }
            }

            this.console.log(`# of bivalue edges: ${count_bi}`);
            this.console.log(`# of multivalue edges: ${count_multi}`);
        };

        this.console.clear();
        this.console.log(`As a whole:`);
        count_fn(pz.loopEdges(['rc', 'rk', 'ck', 'bk']));

        for (const face of pz.adF['key']) {
            this.console.log(`<br>For key ${face.id + 1}:`);
            count_fn(Set.union(face.$['rk'], face.$['ck'], face.$['bk']).values());
        }

        return [];
    }
}