import { SOVertexID, SOPuzzle } from "../so_graph";
import { PartialMemento } from "../system/memento";
import { SOSolver } from "../so_solver";

declare module "../so_solver" {
    interface SOSolver {
        /** Naked Single */
        nakedSingle(pz: SOPuzzle): PartialMemento[];
        /** Naked Subset Generator */
        nakedSubsetGenerator(order: number): (pz: SOPuzzle) => PartialMemento[];
    }
}

SOSolver.prototype.nakedSingle = function (pz: SOPuzzle): PartialMemento[] {
    let is_updated = false;
    const v_id_dets = new Set(this.snapshot.determined);
    const grp_cmds = new Array<string>();
    const h_seg: PartialMemento[] = [
        {
            type: 'initial',
            logs: [`title novice "Naked Single"`],
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
            v_first.$['rc'].forEach((e) => { grp_cmds.push(`highlight cell ${e.id} as determined`); });
        }
    }

    return (is_updated) ? h_seg : [];
}


SOSolver.prototype.nakedSubsetGenerator = function (order: number) {
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
                logs: [`title apprentice "Naked ${subset_type}"`],
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
            ['row', ['rc'], ['rk']],
            ['col', ['rc'], ['ck']],
            ['box', ['rc'], ['bk']]
        ])) {
            const face = found.face;
            const eset_s = found.strongEdges;
            const vset_s = found.strongVertices;
            const vset_wonly = found.weakOnlyVertices;
            /** Creates a report. */
            const eset_s_ids = [...eset_s.map((e) => e.id)];
            const vset_s_ids = [...vset_s.map((v) => v.id)];
            h_seg[0].logs?.push(`log "#cell:${eset_s_ids} form a naked ${subset_type?.toLocaleLowerCase()} in #${face.type}:${face.id}."`);
            grp_cmds.push(`highlight mark ${vset_s_ids} as determined`);
            grp_cmds.push(`highlight ${face.type} ${face.id} as affected`);
            grp_cmds.push(`highlight cell ${eset_s_ids} as intersect`);

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