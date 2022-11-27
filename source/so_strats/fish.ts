import { SOVertexID, SOPuzzle } from "../so_graph";
import { PartialMemento } from "../system/memento";
import { SOSolver } from "../so_solver";

/** Merge declaration of the class SOSolver. */
declare module "../so_solver" {
    interface SOSolver {
        /** Fish Generator */
        fishGenerator(order: number): (pz: SOPuzzle) => PartialMemento[];
        /** Franken Fish Generator */
        frankenFishGenerator(order: number): (pz: SOPuzzle) => PartialMemento[];
    }
}

/** Fish Generator */
SOSolver.prototype.fishGenerator = function (order: number) {
    if (!Number.isInteger(order) || order < 2 || order > 4) {
        throw RangeError(`Invalid range of parameter.`);
    }

    const subset_type = { [2]: 'X-wing', [3]: 'Swordfish', [4]: 'Jellyfish' }[order];

    return (pz: SOPuzzle): PartialMemento[] => {
        const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
        const grp_cmds = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`title apprentice "${subset_type}"`],
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
            ['key', ['rk'], ['ck']],
            ['key', ['ck'], ['rk']],
        ])) {
            const face = found.face;
            const eset_s = found.strongEdges;
            const vset_s = found.strongVertices;
            const eset_w = found.weakEdges;
            const vset_wonly = found.weakOnlyVertices;

            /** Creates a report. */
            const eset_s_rc_ids = [...vset_s.mapUnion((v) => v.$['rc']).map((e) => e.id)];
            const vset_s_ids = [...vset_s.map((v) => v.id)];
            h_seg[0].logs?.push(`log "#key:${face.id} of #cell:${eset_s_rc_ids} form a ${subset_type?.toLocaleLowerCase()}."`);
            grp_cmds.push(`highlight mark ${vset_s_ids} as determined`);
            eset_s.forEach((e) => { grp_cmds.push(`highlight ${e.proj.type} ${e.proj.id} as based`); });
            eset_w.forEach((e) => { grp_cmds.push(`highlight ${e.proj.type} ${e.proj.id} as affected`); });
            grp_cmds.push(`highlight cell ${eset_s_rc_ids} as intersect`);

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

/** Franken Fish Generator */
SOSolver.prototype.frankenFishGenerator = function (order: number) {
    if (!Number.isInteger(order) || order < 2 || order > 4) {
        throw RangeError(`Invalid range of parameter.`);
    }

    const subset_type = { [2]: 'X-wing', [3]: 'Swordfish', [4]: 'Jellyfish' }[order];

    return (pz: SOPuzzle): PartialMemento[] => {
        const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
        const grp_cmds = new Array<string>();
        const h_seg: PartialMemento[] = [
            {
                type: 'initial',
                logs: [`title expert "Franken ${subset_type}"`],
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
            ['key', ['rk', 'bk'], ['ck', 'bk']],
            ['key', ['ck', 'bk'], ['rk', 'bk']],
        ])) {
            const face = found.face;
            const eset_s = found.strongEdges;
            const vset_s = found.strongVertices;
            const eset_w = found.weakEdges;
            const vset_wonly = found.weakOnlyVertices;
            
            /** Creates a report. */
            const eset_s_rc_ids = Set.union(...vset_s.map((v) => v.$['rc'])).map((e) => e.id);
            const vset_s_ids = [...vset_s.map((v) => v.id)];
            h_seg[0].logs?.push(`log "#key:${face.id} of #cell:${eset_s_rc_ids} form a Franken ${subset_type?.toLocaleLowerCase()}."`);
            grp_cmds.push(`highlight mark ${vset_s_ids} as determined`);
            eset_s.forEach((e) => { grp_cmds.push(`highlight ${e.proj.type} ${e.proj.id} as based`); });
            eset_w.forEach((e) => { grp_cmds.push(`highlight ${e.proj.type} ${e.proj.id} as affected`); });
            grp_cmds.push(`highlight cell ${eset_s_rc_ids} as intersect`);

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