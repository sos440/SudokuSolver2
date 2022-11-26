import { SOVertexID, SOPuzzle } from "../so_graph";
import { PartialMemento } from "../system/memento";
import { SOSolver } from "../so_solver";

declare module "../so_solver" {
    interface SOSolver {
        /** hidden Single */
        hiddenSingle(pz: SOPuzzle): PartialMemento[];
        /** Hidden Subset Generator */
        hiddenSubsetGenerator(order: number): (pz: SOPuzzle) => PartialMemento[];
    }
}

SOSolver.prototype.hiddenSingle = function (pz: SOPuzzle): PartialMemento[] {
    const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
    const v_id_dets = new Set(this.snapshot.determined);
    const grp_cmds_rm = new Array<string>();
    const grp_cmds_det = new Array<string>();
    const h_seg: PartialMemento[] = [
        {
            type: 'initial',
            logs: [`title novice "Hidden Single"`],
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


SOSolver.prototype.hiddenSubsetGenerator = function (order: number) {
    if (!Number.isInteger(order) || order < 2 || order > 4) {
        throw RangeError(`Invalid range of parameter.`);
    }

    const subset_type = { [2]: 'Pair', [3]: 'Triple', [4]: 'Quad' }[order];

    return (pz: SOPuzzle): PartialMemento[] => {
        const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
        const grp_cmds = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`title apprentice "Hidden ${subset_type}"`],
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

        for (const found of pz.loopFaceConfig(order, [
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