/**
 * @module strategy
 */

import { Originator, Memento, PartialMemento } from "./system/memento";
import { SOVertex, SOEdge, SOSupergraph, SOGroup, SOGame, SOGridCd, SOVertexAd, SOType } from "./math/graph_so";
import { PuzzleCanvasSnapshot, PuzzleCanvas, Attributes, SVG } from "./graphics/canvas";
import { BaseN, multirange, range } from "./tools";


export class SOSolver extends Originator {
    game: SOGame;
    canvas: PuzzleCanvas;
    snapshot: PuzzleCanvasSnapshot;
    selected: number;
    constructor(game: SOGame, attr?: Attributes) {
        super();
        this.game = game;
        this.canvas = new PuzzleCanvas(attr);
        this.snapshot = {
            vertices: new Set<SOVertex>(),
            clues: new Set<SOVertex>(),
            determined: new Set<SOVertex>(),
            pencilmarked: new Set<SOEdge>(),
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
        const vertices = this.snapshot.vertices as Set<SOVertex>;
        const clues = this.snapshot.clues as Set<SOVertex>;
        const determined = this.snapshot.determined as Set<SOVertex>;
        const pencilmarked = this.snapshot.pencilmarked as Set<SOEdge>;
        const annotations = this.snapshot.annotations as string[];
        const puzzle = this.game.filter((vertex, _) => vertices.has(vertex));
        const o = this.canvas.style;

        this.canvas.cellRects.clearAll();
        this.canvas.cellTexts.hideAll().clearAll();
        this.canvas.markRects.hideAll().clearAll();
        this.canvas.markTexts.hideAll().clearAll();
        this.canvas.drawing.html('');

        /** Renders each cell. */
        for (const edge of puzzle.EG.columns.get('rc') as Set<SOEdge>) {
            const vertex_set = puzzle.VE.columns.get(edge) as Set<SOVertex>;

            if (vertex_set.size == 1) {
                vertex_set.forEach((index) => {
                    if (clues.has(index)) {
                        (this.canvas.cellTexts.show(edge) as SVG)
                            .html(`${o['mark-symbols'].charAt(index % 9)}`)
                            .attr({ fill: 'blue' });
                    }
                    else if (determined.has(index)) {
                        (this.canvas.cellTexts.show(edge) as SVG)
                            .html(`${o['mark-symbols'].charAt(index % 9)}`);
                    }
                    else {
                        this.canvas.markTexts.show(index);
                    }
                });
            }
            else if (vertex_set.size == 0) {
                (this.canvas.cellTexts.show(edge) as SVG)
                    .html('X')
                    .attr({ fill: 'red' });
            }
            else if (pencilmarked.has(edge)) {
                vertex_set.forEach((index) => {
                    this.canvas.markTexts.show(index);
                });
            }
        }

        /** Render annotations. */
        for (const cmd of annotations) {
            /** Match highlights. */
            const match_hl = cmd.match(/^highlight (\S+) (\d+) as (.*)$/);
            if (match_hl) {
                const type = match_hl[1];
                const index = Number.parseInt(match_hl[2]);
                const class_name = match_hl[3];

                if (type == 'mark') {
                    this.canvas.markRects.show(index)?.attr(o[`rect:${class_name}`]);
                    this.canvas.markTexts.get(index)?.attr(o[`text:${class_name}`]);
                    if (class_name == 'removed') {
                        const mark_elem = (this.canvas.markRects.get(index) as SVG).element;
                        const x = mark_elem.getAttribute('x');
                        const y = mark_elem.getAttribute('y');
                        const w = mark_elem.getAttribute('width');
                        const h = mark_elem.getAttribute('height');
                        this.canvas.drawing
                            .path({ 'd': `M ${x} ${y} l ${w} ${h} m -${w} 0 l ${w} -${h}` })
                            .attr({ 'stroke': 'red' })
                    }
                }
                else if (type == 'cell' || type == 'rc') {
                    this.canvas.cellRects.show(index)?.attr(o[`rect:${class_name}`]);
                    this.canvas.cellTexts.get(index)?.attr(o[`text:${class_name}`]);
                }
                else if (type == 'row') {
                    const row = index;
                    for (const col of range(this.game.D1)) {
                        const cell_id = BaseN.fromD([row, col], this.game.D1);
                        this.canvas.cellRects.show(cell_id)?.attr(o[`rect:${class_name}`]);
                        this.canvas.cellTexts.get(cell_id)?.attr(o[`text:${class_name}`]);
                    }
                }
                else if (type == 'col') {
                    const col = index;
                    for (const row of range(this.game.D1)) {
                        const cell_id = BaseN.fromD([row, col], this.game.D1);
                        this.canvas.cellRects.show(cell_id)?.attr(o[`rect:${class_name}`]);
                        this.canvas.cellTexts.get(cell_id)?.attr(o[`text:${class_name}`]);
                    }
                }
                else if (type == 'box') {
                    const a = BaseN.toD(index, 2, this.game.Dp);
                    for (const b of multirange(this.game.Dp, this.game.Dp)) {
                        const cell_id = BaseN.fromD([a[0], b[0], a[1], b[1]], this.game.Dp);
                        this.canvas.cellRects.show(cell_id)?.attr(o[`rect:${class_name}`]);
                        this.canvas.cellTexts.get(cell_id)?.attr(o[`text:${class_name}`]);
                    }
                }
                /** @depreciated Legacy code. */
                else if (type == 'rk' || type == 'ck' || type == 'bk' || type == '*k') {
                    this.game['V($e)'](index)?.forEach((vertex) => {
                        const index_rc = Math.trunc(vertex / this.game.D1);
                        this.canvas.cellRects.show(index_rc)?.attr(o[`rect:${class_name}`]);
                        this.canvas.cellTexts.get(index_rc)?.attr(o[`text:${class_name}`]);
                    });
                }
            }

            /** Match line draws */
        }
    }

    obviousCandidateRemoval(puzzle: SOSupergraph): PartialMemento[] {
        let is_updated = false;
        const pz = puzzle;
        const vertices = new Set<SOVertex>(this.snapshot.vertices);
        const determined = this.snapshot.determined as Set<SOVertex>;
        const annotations = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`updated by obvious candidate removal`],
                snapshot: {
                    pencilmarked: puzzle.EG.columns.get('rc') as Set<SOEdge>,
                    annotations: annotations
                }
            },
            {
                type: 'final',
                logs: [],
                snapshot: {
                    vertices: vertices,
                    annotations: []
                }
            }
        ];

        /** For each determined vertex in a cell represented by its index: */
        for (const index_src of determined) {
            /** Loops through the 'visible' vertices. */
            for (const index_targ of pz.visibleFrom(index_src)) {
                is_updated = true;
                vertices.delete(index_targ);
                annotations.push(`highlight mark ${index_targ} as removed`);
            }
        }

        return (is_updated) ? h_seg : [];
    }


    /** Naked single */
    nakedSingle(puzzle: SOSupergraph): PartialMemento[] {
        let is_updated = false;
        const pz = puzzle;
        const determined = new Set(this.snapshot.determined);
        const annotations = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`updated by naked single`],
                snapshot: {
                    determined: determined,
                    annotations: annotations
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
        for (const edge of pz['E($g)']('rc') as Set<SOEdge>) {
            const vertex_set = pz['V($e)'](edge) as Set<SOVertex>;
            const first_vertex = [...vertex_set][0];
            /** If a naked single has been found: */
            if (vertex_set.size == 1 && !determined.has(first_vertex)) {
                is_updated = true;
                const index_rc = Math.trunc(first_vertex / this.game.D1);
                determined.add(first_vertex);
                annotations.push(`highlight cell ${index_rc} as determined`);
            }
        }

        return (is_updated) ? h_seg : [];
    }


    /** Hidden single */
    hiddenSingle(puzzle: SOSupergraph): PartialMemento[] {
        const pz = puzzle;
        const vertices = new Set<SOVertex>(this.snapshot.vertices);
        const determined = new Set(this.snapshot.determined);
        const annote_rem = new Array<string>();
        const annote_det = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`updated by hidden single`],
                snapshot: {
                    annotations: annote_rem
                }
            },
            {
                type: 'middle',
                logs: [],
                snapshot: {
                    vertices: vertices,
                    determined: determined,
                    annotations: annote_det
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
        for (const group of ['bk', 'rk', 'ck'] as SOGroup[]) {
            for (const edge of pz['E($g)'](group) as Set<SOEdge>) {
                /** Skips if the cell has more than  */
                const vertex_set = pz['V($e)'](edge) as Set<SOVertex>;
                if (vertex_set.size > 1) { continue; }

                const first_vertex = [...vertex_set][0];
                if (determined.has(first_vertex)) { continue; }

                const visibles = pz.visibleFrom(first_vertex, 'rc');
                if (visibles.size == 0) { continue; } /** This condition means that the vertex is a NS. */

                /** If a hidden single has been found. */
                h_seg[0].logs?.push(`log "Vertex ${first_vertex} is a hidden single in the ${group} containing it."`);
                annote_rem.push(`highlight mark ${first_vertex} as determined`);
                annote_rem.push(`highlight ${group} ${edge} as based`);
                annote_rem.push(`highlight cell ${Math.trunc(first_vertex / this.game.D1)} as intersect`);

                determined.add(first_vertex);
                annote_det.push(`highlight cell ${Math.trunc(first_vertex / this.game.D1)} as determined`);

                /** Loops through the vertices visible from the hidden single. */
                for (const index_targ of visibles) {
                    vertices.delete(index_targ);
                    h_seg[1].logs?.push(`log "Vertex ${index_targ} is in the same unit as the hidden single, hence is removed."`);
                    annote_rem.push(`highlight mark ${index_targ} as removed`);
                }

                return h_seg;
            }
        }

        return [];
    }


    /** Intersection pointing */
    intersectionPointing(puzzle: SOSupergraph): PartialMemento[] {
        const pz = puzzle;
        const vertices = new Set<SOVertex>(this.snapshot.vertices);
        const annotations = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`updated by intersection (pointing)`],
                snapshot: {
                    annotations: annotations
                }
            },
            {
                type: 'final',
                logs: [],
                snapshot: {
                    vertices: vertices,
                    annotations: []
                }
            }
        ];

        for (const [line_ad, line, box_ad, box] of this.game.loopLineBox()) {
            const vset_box = pz['V($e)'](box) as Set<SOVertex>;
            const vset_line = pz['V($e)'](line) as Set<SOVertex>;
            const vset_band = Set.intersection(vset_box, vset_line);

            if (vset_box.size > vset_band.size) { continue; }
            if (vset_line.size == vset_band.size) { continue; }

            /** If a hidden single has been found. */
            h_seg[0].logs?.push(`log "Vertices ${[...vset_band]} form a pointer in ${line_ad.type} ${line_ad.cd1 + 1}."`);

            vset_band.forEach((vertex) => {
                annotations.push(`highlight mark ${vertex} as determined`);
            });

            annotations.push(`highlight ${line_ad.type} ${line_ad.cd1} as affected`);
            annotations.push(`highlight box ${box_ad.cd1} as based`);
            Set.intersection(
                this.game['V($e)'](box) as Set<SOVertex>,
                this.game['V($e)'](line) as Set<SOVertex>
            ).forEach((vertex) => {
                annotations.push(`highlight cell ${this.game.adV.get(vertex)?.rc} as intersect`);
            });

            /** Loops through the vertices visible from the hidden single. */
            for (const index_targ of Set.diff(vset_line, vset_band)) {
                vertices.delete(index_targ);
                h_seg[1].logs?.push(`log "Vertex ${index_targ} in box ${box_ad.cd1 + 1} is erased by the pointer."`);
                annotations.push(`highlight mark ${index_targ} as removed`);
            }

            return h_seg;
        }

        return [];
    }


    /** Intersection pointing */
    intersectionClaiming(puzzle: SOSupergraph): PartialMemento[] {
        const pz = puzzle;
        const vertices = new Set<SOVertex>(this.snapshot.vertices);
        const annotations = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`updated by intersection (pointing)`],
                snapshot: {
                    annotations: annotations
                }
            },
            {
                type: 'final',
                logs: [],
                snapshot: {
                    vertices: vertices,
                    annotations: []
                }
            }
        ];

        for (const [line_ad, line, box_ad, box] of this.game.loopLineBox()) {
            const vset_box = pz['V($e)'](box) as Set<SOVertex>;
            const vset_line = pz['V($e)'](line) as Set<SOVertex>;
            const vset_band = Set.intersection(vset_box, vset_line);

            if (vset_line.size > vset_band.size) { continue; }
            if (vset_box.size == vset_band.size) { continue; }

            /** If a hidden single has been found. */
            h_seg[0].logs?.push(`log "Vertices ${[...vset_band]} form a claimer in ${line_ad.type} ${line_ad.cd1 + 1}."`);

            vset_band.forEach((vertex) => {
                annotations.push(`highlight mark ${vertex} as determined`);
            });

            annotations.push(`highlight box ${box_ad.cd1} as affected`);
            annotations.push(`highlight ${line_ad.type} ${line_ad.cd1} as based`);
            Set.intersection(
                this.game['V($e)'](box) as Set<SOVertex>,
                this.game['V($e)'](line) as Set<SOVertex>
            ).forEach((vertex) => {
                annotations.push(`highlight cell ${this.game.adV.get(vertex)?.rc} as intersect`);
            });

            /** Loops through the vertices visible from the hidden single. */
            for (const index_targ of Set.diff(vset_box, vset_band)) {
                vertices.delete(index_targ);
                h_seg[1].logs?.push(`log "Vertex ${index_targ} in box ${box_ad.cd1 + 1} is erased by the claimer."`);
                annotations.push(`highlight mark ${index_targ} as removed`);
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

        const subset_type = new Map(
            [[2, 'pair'], [3, 'triple'], [4, 'quad']]
        ).get(subset_size) as string;

        return (puzzle: SOSupergraph): PartialMemento[] => {
            const pz = puzzle;
            const vertices = new Set<SOVertex>(this.snapshot.vertices);
            const annotations = new Array<string>();
            const h_seg: PartialMemento[] = [
                {
                    type: 'initial',
                    logs: [`updated by naked ${subset_type}`],
                    snapshot: {
                        annotations: annotations
                    }
                },
                {
                    type: 'final',
                    logs: [],
                    snapshot: {
                        vertices: vertices,
                        annotations: []
                    }
                }
            ];

            for (const [cell_set, unit_set, unit_ad] of this.game.loopCellUnit()) {
                /** Only takes cells with multiple candidates. */
                const cell_set_f = cell_set.filter(
                    (cell) => (pz['V($e)'](cell) as Set<SOVertex>).size > 1
                );

                /** Constructs a map (cell) => (keys on the cell) for multivaled cells. */
                const ck_map = this.game.projAsMap(pz, new Set<SOEdge>(cell_set_f), 'key');

                /** Scan through subsets of {subset_size} cells: */
                for (const subsets of new Set<SOEdge>(cell_set_f).subsets(subset_size)) {
                    /** Computes the number of keys in the subset. */
                    const keys = Set.union(...subsets.map((cell) => ck_map.get(cell) as Set<number>));
                    if (keys.size > subset_size) { continue; }

                    /** Computes the vertices in each of strong/weak set of edges. */
                    const v_strong = pz['V(${e})'](subsets);
                    const v_weak = pz['V(${e})'](keys.map((key) => unit_set[key]));
                    const v_weakonly = Set.diff(v_weak, v_strong);
                    if (v_weakonly.size == 0) { continue; }

                    /** Creates a report. */
                    h_seg[0].logs?.push(`log "Cells ${[...subsets]} form a naked ${subset_type}."`);
                    v_strong.forEach((vertex) => {
                        annotations.push(`highlight mark ${vertex} as determined`);
                    });
                    annotations.push(`highlight ${unit_ad.type} ${unit_ad.cd1} as affected`);
                    subsets.forEach((cell) => {
                        annotations.push(`highlight cell ${cell} as intersect`);
                    })

                    /** Loops through the vertices visible from the hidden single. */
                    for (const index_targ of v_weakonly) {
                        vertices.delete(index_targ);
                        h_seg[1].logs?.push(`log "Vertex ${index_targ} is erased."`);
                        annotations.push(`highlight mark ${index_targ} as removed`);
                    }

                    return h_seg;
                }
            }

            return [];
        };
    }


    /** Naked Subset Generator */
    hiddenSubsetGenerator(subset_size: number) {
        if (!Number.isInteger(subset_size) || subset_size < 2 || subset_size > 4) {
            throw RangeError(`Invalid range of parameter.`);
        }

        const subset_type = new Map(
            [[2, 'pair'], [3, 'triple'], [4, 'quad']]
        ).get(subset_size) as string;

        return (puzzle: SOSupergraph): PartialMemento[] => {
            const pz = puzzle;
            const vertices = new Set<SOVertex>(this.snapshot.vertices);
            const annotations = new Array<string>();
            const h_seg: PartialMemento[] = [
                {
                    type: 'initial',
                    logs: [`updated by hidden ${subset_type}`],
                    snapshot: {
                        annotations: annotations
                    }
                },
                {
                    type: 'final',
                    logs: [],
                    snapshot: {
                        vertices: vertices,
                        annotations: []
                    }
                }
            ];

            for (const [cell_set, unit_set, unit_ad] of this.game.loopCellUnit()) {
                /** Only takes units with multiple candidates. */
                const unit_set_f = unit_set.filter(
                    (cell) => (pz['V($e)'](cell) as Set<SOVertex>).size > 1
                );

                /** Constructs a map (unit) => (cd_perp) for multivaled cells. */
                const cd_type_perp = unit_ad.typePerp as keyof SOVertexAd;
                const uc_map = this.game.projAsMap(pz, new Set<SOEdge>(unit_set_f), cd_type_perp);

                /** Scan through subsets of {subset_size} cells: */
                for (const subsets of new Set<SOEdge>(unit_set_f).subsets(subset_size)) {
                    /** Computes the number of keys in the subset. */
                    const cd_perps = Set.union(...subsets.map((unit) => uc_map.get(unit) as Set<number>));
                    if (cd_perps.size > subset_size) { continue; }

                    /** Computes the vertices in each of strong/weak set of edges. */
                    const hidden_cells = cd_perps.map((cd) => cell_set[cd]);
                    const v_strong = pz['V(${e})'](subsets);
                    const v_weak = pz['V(${e})'](hidden_cells);
                    const v_weakonly = Set.diff(v_weak, v_strong);
                    if (v_weakonly.size == 0) { continue; }

                    /** Creates a report. */
                    h_seg[0].logs?.push(`log "Cells ${[...hidden_cells]} form a hidden ${subset_type}."`);
                    v_strong.forEach((vertex) => {
                        annotations.push(`highlight mark ${vertex} as determined`);
                    });
                    annotations.push(`highlight ${unit_ad.type} ${unit_ad.cd1} as based`);
                    hidden_cells.forEach((cell) => {
                        annotations.push(`highlight cell ${cell} as intersect`);
                    })

                    /** Loops through the vertices visible from the hidden single. */
                    for (const index_targ of v_weakonly) {
                        vertices.delete(index_targ);
                        h_seg[1].logs?.push(`log "Vertex ${index_targ} is erased."`);
                        annotations.push(`highlight mark ${index_targ} as removed`);
                    }

                    return h_seg;
                }
            }

            return [];
        };
    }
}