import { Vertex } from "../basic/adj";
import { Puzzle } from "../basic/puzzle";
import { StrategyResult } from "../comp/memento";
import { Solver } from "../solver";

declare module "../solver" {
    interface Solver {
        /** Obvious Candidate Removal. */
        obviousCandidateRemoval(pz: Puzzle): StrategyResult;
    }
}

Solver.prototype.obviousCandidateRemoval = function (pz: Puzzle): StrategyResult {
    const mem_seg = new StrategyResult();
    mem_seg.addBlankMementos(2);

    /** Page 1 */
    mem_seg.segment[0].logs = [`
        <div class="msg_title lv_novice">
            Obvious Candidate Removal
        </div>
    `];
    mem_seg.segment[0].snapshot.pencilmarked = new Set(this.gameSpec.cellsList.keys());
    const grp_cmds = mem_seg.segment[0].snapshot.annotations = new Array<string>();

    /** Page 2 */
    const vid_rest = mem_seg.segment[1].snapshot.rest = new Set<number>(this.snapshot.rest);
    mem_seg.segment[1].snapshot.annotations = [];

    /** For each determined vertex in a cell represented by its index: */
    for (const v_src of pz.findAll(/^v\.(?:given|found)/)) {
        for (const v_targ of (v_src as Vertex).visibles(/^e #\{[rcb]\d+n\d+\}/)) {
            mem_seg.isUpdated = true;
            vid_rest.delete(v_targ.attr.index);
            grp_cmds.push(`highlight mark ${v_targ.attr.index} as removed`);
        }
    }

    return mem_seg;
}

export { };