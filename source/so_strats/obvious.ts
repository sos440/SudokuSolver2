import { SOVertexID, SOEdgeID, SOPuzzle } from "../so_graph";
import { PartialMemento } from "../system/memento";
import { SOSolver } from "../so_solver";

declare module "../so_solver" {
    interface SOSolver {
        /** Obvious Candidate Removal. */
        obviousCandidateRemoval(pz: SOPuzzle): PartialMemento[];
    }
}

SOSolver.prototype.obviousCandidateRemoval = function(pz: SOPuzzle): PartialMemento[] {
    let is_updated = false;
    const v_ids = new Set<SOVertexID>(this.snapshot.vertices);
    const v_id_dets = this.snapshot.determined as Set<SOVertexID>;
    const grp_cmds = new Array<string>();
    const h_seg: PartialMemento[] = [
        {
            type: 'initial',
            logs: [`title novice "Obvious Candidate Removal"`],
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
        for (const v_targ of pz.getVisibles(v_src)) {
            is_updated = true;
            v_ids.delete(v_targ.id);
            grp_cmds.push(`highlight mark ${v_targ.id} as removed`);
        }
    }

    return (is_updated) ? h_seg : [];
}

export {};