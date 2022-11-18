/**
 * @module strategy
 */

import { Originator, Memento, PartialMemento } from "./system/memento";
import { SOVertex, SOEdge, SOSupergraph, SOGroup, SOGame } from "./math/graph_so";
import { PuzzleCanvasSnapshot, PuzzleCanvas, Attributes, SVG } from "./graphics/canvas";


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
                }
                else if (type == 'cell' || type == 'rc') {
                    this.canvas.cellRects.show(index)?.attr(o[`rect:${class_name}`]);
                    this.canvas.cellTexts.get(index)?.attr(o[`text:${class_name}`]);
                }
                else if (type == 'rk' || type == 'ck' || type == 'bk') {
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
        const annote_based = new Array<string>();
        const annote_removed = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`updated by hidden single`],
                snapshot: {
                    annotations: annote_based
                }
            },
            {
                type: 'middle',
                logs: [],
                snapshot: {
                    annotations: annote_removed
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

        /** Loop through *K-type units to find hidden singles: */
        for (const group of ['bk', 'rk', 'ck'] as SOGroup[]) {
            for (const edge of pz['E($g)'](group) as Set<SOEdge>) {
                /** Skips if the cell has more than  */
                const vertex_set = pz['V($e)'](edge) as Set<SOVertex>;
                if (vertex_set.size > 1) { continue; }

                const first_vertex = [...vertex_set][0];
                if (determined.has(first_vertex)) { continue; }

                const visibles = pz.visibleFrom(first_vertex, 'rc');
                if (visibles.size == 0){ continue; } /** This condition means that the vertex is a NS. */

                /** If a hidden single has been found. */
                h_seg[0].logs?.push(`log "Vertex ${first_vertex} is a hidden single in the ${group} containing it."`);
                annote_based.push(`highlight mark ${first_vertex} as determined`);
                annote_based.push(`highlight ${group} ${edge} as based`);

                /** Loops through the vertices visible from the hidden single. */
                for (const index_targ of visibles) {
                    vertices.delete(index_targ);
                    h_seg[1].logs?.push(`log "Vertex ${index_targ} is in the same unit as the hidden single, hence is removed."`);
                    annote_removed.push(`highlight mark ${index_targ} as removed`);
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
        const annote_based = new Array<string>();
        const annote_removed = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`updated by intersection (pointing)`],
                snapshot: {
                    annotations: annote_based
                }
            },
            {
                type: 'middle',
                logs: [],
                snapshot: {
                    annotations: annote_removed
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

        console.time('bm1');

        /** Loop through rows/columns to find a locked configuration: */
        for (const group of ['rk', 'ck'] as SOGroup[]) {
            for (const edge of pz['E($g)'](group) as Set<SOEdge>) {
                const box = [...pz['E(V($e))&E($g)'](edge, 'bk')][0];
                const vertex_set_box = pz['V($e)'](box) as Set<SOVertex>;
                const vertex_set_line = pz['V($e)'](edge) as Set<SOVertex>;
                const vertex_set_band = Set.intersection(vertex_set_box, vertex_set_line);
                
                if (vertex_set_box.size > vertex_set_band.size){ continue; }
                if (vertex_set_line.size == vertex_set_band.size){ continue; }

                /** If a hidden single has been found. */
                h_seg[0].logs?.push(`log "Vertices ${[...vertex_set_band]} form a pointer in the box containing it."`);
                vertex_set_band.forEach((vertex) => {
                    annote_based.push(`highlight mark ${vertex} as determined`);
                });
                annote_based.push(`highlight ${group} ${edge} as affected`);
                annote_based.push(`highlight bk ${box} as based`);

                /** Loops through the vertices visible from the hidden single. */
                for (const index_targ of Set.diff(vertex_set_line, vertex_set_band)) {
                    vertices.delete(index_targ);
                    h_seg[1].logs?.push(`log "Vertex ${index_targ} is outside of the box and pointed by the pointer."`);
                    annote_removed.push(`highlight mark ${index_targ} as removed`);
                }

                return h_seg;
            }
        }

        console.timeLog('bm1');
        console.timeEnd('bm1');

        return [];
    }


    /** Intersection pointing */
    intersectionClaiming(puzzle: SOSupergraph): PartialMemento[] {
        const pz = puzzle;
        const vertices = new Set<SOVertex>(this.snapshot.vertices);
        const annote_based = new Array<string>();
        const annote_removed = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`updated by intersection (pointing)`],
                snapshot: {
                    annotations: annote_based
                }
            },
            {
                type: 'middle',
                logs: [],
                snapshot: {
                    annotations: annote_removed
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

        /** Loop through rows/columns to find a locked configuration: */
        for (const group of ['rk', 'ck'] as SOGroup[]) {
            for (const edge of pz['E($g)'](group) as Set<SOEdge>) {
                const box = [...pz['E(V($e))&E($g)'](edge, 'bk')][0];
                const vertex_set_box = pz['V($e)'](box) as Set<SOVertex>;
                const vertex_set_line = pz['V($e)'](edge) as Set<SOVertex>;
                const vertex_set_band = Set.intersection(vertex_set_box, vertex_set_line);
                
                if (vertex_set_box.size == vertex_set_band.size){ continue; }
                if (vertex_set_line.size > vertex_set_band.size){ continue; }

                /** If a hidden single has been found. */
                h_seg[0].logs?.push(`log "Vertices ${[...vertex_set_line]} form a clamer in the line containing it."`);
                vertex_set_band.forEach((vertex) => {
                    annote_based.push(`highlight mark ${vertex} as determined`);
                });
                annote_based.push(`highlight bk ${box} as affected`);
                annote_based.push(`highlight ${group} ${edge} as based`);

                /** Loops through the vertices visible from the hidden single. */
                for (const index_targ of Set.diff(vertex_set_box, vertex_set_band)) {
                    vertices.delete(index_targ);
                    h_seg[1].logs?.push(`log "Vertex ${index_targ} is outside of the box and pointed by the pointer."`);
                    annote_removed.push(`highlight mark ${index_targ} as removed`);
                }

                return h_seg;
            }
        }

        return [];
    }
}