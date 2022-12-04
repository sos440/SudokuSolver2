import { Vertex } from "../basic/adj";
import { Puzzle } from "../basic/puzzle";
import { StrategyResult } from "../comp/memento";
import { Solver } from "../solver";

declare module "../solver" {
    interface Solver {
        /** Naked Single */
        nakedSingle(pz: Puzzle): StrategyResult;
    }
}

Solver.prototype.nakedSingle = function (pz: Puzzle): StrategyResult {
    const mem_seg = new StrategyResult();
    mem_seg.addBlankMementos(2);

    /** Page 1 */
    mem_seg.segment[0].logs = [`
        <div class="msg_title lv_novice">
            Naked Single
        </div>
    `];
    const vid_rest = mem_seg.segment[0].snapshot.rest = new Set<number>(this.snapshot.rest);
    const vid_found = mem_seg.segment[0].snapshot.found = new Set<number>(this.snapshot.found);
    const grp_cmds = mem_seg.segment[0].snapshot.annotations = new Array<string>();

    /** Page 2 */
    mem_seg.segment[1].snapshot.annotations = [];

    /** For each determined vertex in a cell represented by its index: */
    for (const v_src of pz.findAll(/^v\.rest/)) {
        const e_rc = (v_src as Vertex).cell();
        if (e_rc.v.size > 1) { continue; }

        mem_seg.isUpdated = true;
        vid_rest.delete(v_src.attr.index);
        vid_found.add(v_src.attr.index);

        grp_cmds.push(`highlight cell ${e_rc.attr.index} as determined`);
        mem_seg.segment[0].logs.push(`
            <p>
                The candidate ${this.gameSpec.numCharMap[v_src.attr.num]}
                is a naked single in ${e_rc.selector}.
            </p>
        `);
    }

    return mem_seg;
}

export { };