import { SOVertexID, SOEdge, SOEdgeType, SOPuzzle } from "../so_graph";
import { PartialMemento } from "../system/memento";
import { SOSolver } from "../so_solver";

/** Merge declaration of the class SOSolver. */
declare module "../so_solver" {
    interface SOSolver {
        /** Intersection Pointing */
        intersectionPointing(pz: SOPuzzle): PartialMemento[];
        /** Intersection Pointing */
        intersectionClaiming(pz: SOPuzzle): PartialMemento[];
    }
}

/** Intersection Pointing */
SOSolver.prototype.intersectionPointing = function (pz: SOPuzzle): PartialMemento[] {
    const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
    const grp_cmds = new Array<string>();
    const h_seg: PartialMemento[] = [
        {
            type: 'initial',
            logs: [`title novice "Intersection (Pointing)"`],
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

/** Intersection Pointing */
SOSolver.prototype.intersectionClaiming = function (pz: SOPuzzle): PartialMemento[] {
    const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
    const grp_cmds = new Array<string>();
    const h_seg: PartialMemento[] = [
        {
            type: 'initial',
            logs: [`title novice "Intersection (Claiming)"`],
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


/** Merge declaration of the class SOPuzzle. */
declare module "../so_graph" {
    interface SOPuzzle {
        /** Loops through the edges of the specified types. */
        loopLineBox(): IterableIterator<[SOEdge, SOEdge]>;
    }
}

SOPuzzle.prototype.loopLineBox = function* (): IterableIterator<[SOEdge, SOEdge]> {
    for (const e_type of ['rk', 'ck'] as SOEdgeType[]) {
        for (const e_line of this.adE[e_type]) {
            for (const e_box of e_line.$['bk']) {
                yield [e_line, e_box];
            }
        }
    }
}