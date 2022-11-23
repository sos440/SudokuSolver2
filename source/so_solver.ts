/**
 * @module strategy
 */

import './math/math';
import { Originator, Memento, PartialMemento } from "./system/memento";
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

    load(mem: Memento): void {
        this.snapshot = mem.snapshot;
        this.selected = mem.selected;
        for (const log of mem.logs) {
            console.log(log);
        }
        this.render();
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
                logs: [`updated by obvious candidate removal`],
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
                logs: [`updated by naked single`],
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
                logs: [`updated by hidden single`],
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
            h_seg[0].logs?.push(`log "Vertex ${v_first.id} is a hidden single in ${f_proj.type} ${f_proj.id + 1}."`);
            grp_cmds_rm.push(`highlight mark ${v_first.id} as determined`);
            grp_cmds_rm.push(`highlight ${f_proj.type} ${f_proj.id} as based`);
            grp_cmds_rm.push(`highlight cell ${e_cell.id} as intersect`);
            for (const v_targ of v_visible) {
                v_ids.delete(v_targ.id);
                h_seg[1].logs?.push(`log "Vertex ${v_targ.id} is in the same unit as the hidden single, hence is removed."`);
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
                logs: [`updated by intersection (pointing)`],
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
            h_seg[0].logs?.push(`log "The box ${e_box.proj.id + 1} and ${e_line.proj.type} ${e_line.proj.id + 1} are locked."`);
            grp_cmds.push(`highlight mark ${[...vset_band.map((v) => v.id)]} as determined`);
            grp_cmds.push(`highlight ${e_line.proj.type} ${e_line.proj.id} as affected`);
            grp_cmds.push(`highlight box ${e_box.proj.id} as based`);
            grp_cmds.push(`highlight cell ${[...Set.intersection(e_line.$['rc'], e_box.$['rc']).map((e) => e.id)]} as intersect`);

            /** Loops through the vertices visible from the hidden single. */
            for (const v_targ of Set.diff(vset_line, vset_band)) {
                v_ids.delete(v_targ.id);
                h_seg[1].logs?.push(`log "Vertex ${v_targ.id} in ${e_line.proj.type} ${e_box.proj.id + 1} is erased by the pointer."`);
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
                logs: [`updated by intersection (pointing)`],
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
            h_seg[0].logs?.push(`log "The box ${e_box.proj.id + 1} and ${e_line.proj.type} ${e_line.proj.id + 1} are locked."`);
            grp_cmds.push(`highlight mark ${[...vset_band.map((v) => v.id)]} as determined`);
            grp_cmds.push(`highlight box ${e_box.proj.id} as affected`);
            grp_cmds.push(`highlight ${e_line.proj.type} ${e_line.proj.id} as based`);
            grp_cmds.push(`highlight cell ${[...Set.intersection(e_line.$['rc'], e_box.$['rc']).map((e) => e.id)]} as intersect`);

            /** Loops through the vertices visible from the hidden single. */
            for (const v_targ of Set.diff(vset_box, vset_band)) {
                v_ids.delete(v_targ.id);
                h_seg[1].logs?.push(`log "Vertex ${v_targ.id} in box ${e_box.proj.id + 1} is erased by the claimer."`);
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

        const subset_type = { [2]: 'pair', [3]: 'triple', [4]: 'quad' }[subset_size];

        return (pz: SOPuzzle): PartialMemento[] => {
            const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
            const grp_cmds = new Array<string>();
            const h_seg: PartialMemento[] = [
                {
                    type: 'initial',
                    logs: [`updated by naked ${subset_type}`],
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
                h_seg[0].logs?.push(`log "Cells ${[...eset_s.map((e) => e.id)]} form a naked ${subset_type} in ${face.type} ${face.id + 1}."`);
                grp_cmds.push(`highlight mark ${[...vset_s.map((v) => v.id)]} as determined`);
                grp_cmds.push(`highlight ${face.type} ${face.id} as affected`);
                grp_cmds.push(`highlight cell ${[...eset_s.map((e) => e.id)]} as intersect`);

                /** Loops through the vertices visible from the hidden single. */
                for (const v_targ of vset_wonly) {
                    v_ids.delete(v_targ.id);
                    h_seg[1].logs?.push(`log "Vertex ${v_targ.id} is erased."`);
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

        const subset_type = { [2]: 'pair', [3]: 'triple', [4]: 'quad' }[subset_size];

        return (pz: SOPuzzle): PartialMemento[] => {
            const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
            const grp_cmds = new Array<string>();
            const h_seg: PartialMemento[] = [
                {
                    type: 'initial',
                    logs: [`updated by hidden ${subset_type}`],
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
                h_seg[0].logs?.push(`log "Cells ${[...eset_w.map((e) => e.id)]} form a hidden ${subset_type} in ${face.type} ${face.id + 1}."`);
                grp_cmds.push(`highlight mark ${[...vset_s.map((v) => v.id)]} as determined`);
                grp_cmds.push(`highlight ${face.type} ${face.id} as based`);
                grp_cmds.push(`highlight cell ${[...eset_w.map((e) => e.id)]} as intersect`);

                /** Loops through the vertices visible from the hidden single. */
                for (const v_targ of vset_wonly) {
                    v_ids.delete(v_targ.id);
                    h_seg[1].logs?.push(`log "Vertex ${v_targ.id} is erased."`);
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

        const subset_type = { [2]: 'X-wing', [3]: 'swordfish', [4]: 'jellyfish' }[subset_size];

        return (pz: SOPuzzle): PartialMemento[] => {
            const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
            const grp_cmds = new Array<string>();
            const h_seg: PartialMemento[] = [
                {
                    type: 'initial',
                    logs: [`updated by ${subset_type}`],
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
                h_seg[0].logs?.push(`log "Candidates ${face.id + 1} of cells ${[...vset_s.map((v) => v.$['rc'].id)]} form a ${subset_type}."`);
                grp_cmds.push(`highlight mark ${[...vset_s.map((v) => v.id)]} as determined`);
                eset_s.forEach((e) => { grp_cmds.push(`highlight ${e.proj.type} ${e.proj.id} as based`); });
                eset_w.forEach((e) => { grp_cmds.push(`highlight ${e.proj.type} ${e.proj.id} as affected`); });
                grp_cmds.push(`highlight cell ${[...vset_s.map((v) => v.$['rc'].id)]} as intersect`);

                /** Loops through the vertices visible from the hidden single. */
                for (const v_targ of vset_wonly) {
                    v_ids.delete(v_targ.id);
                    h_seg[1].logs?.push(`log "Vertex ${v_targ.id} is erased."`);
                    grp_cmds.push(`highlight mark ${v_targ.id} as removed`);
                }

                return h_seg;
            }

            return [];
        };
    }
}