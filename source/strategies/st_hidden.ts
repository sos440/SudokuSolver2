import { Edge, Vertex } from "../basic/adj";
import { Puzzle } from "../basic/puzzle";
import { StrategyResult } from "../comp/memento";
import { Solver } from "../solver";

declare module "../solver" {
    interface Solver {
        /** Hidden Single */
        hiddenSingle(pz: Puzzle): StrategyResult;
    }
}

Solver.prototype.hiddenSingle = function (pz: Puzzle): StrategyResult {
    const mem_seg = new StrategyResult();
    mem_seg.addBlankMementos(2);

    /** Page 1 */
    mem_seg.segment[0].logs = [`
        <div class="msg_title lv_novice">
            Hidden Single
        </div>
    `];
    const grp_cmds = mem_seg.segment[0].snapshot.annotations = new Array<string>();
    
    /** Page 2 */
    const vid_rest = mem_seg.segment[1].snapshot.rest = new Set<number>(this.snapshot.rest);
    const vid_found = mem_seg.segment[1].snapshot.found = new Set<number>(this.snapshot.found);
    mem_seg.segment[1].snapshot.annotations = [];

    /** For each determined vertex in a cell represented by its index: */
    for (const v_src of pz.findAll(/^v\.rest/)) {
        const arr_sel_evidence: string[] = [];
        for (const e of v_src.findAll(/^e #\{[rcb]\d+n\d+\}/)) {
            if ((e as Edge).v.size == 1) {
                arr_sel_evidence.push(e.selector);
            }
        }
        if (arr_sel_evidence.length == 0) { continue; }

        mem_seg.isUpdated = true;
        for (const v_targ of (v_src as Vertex).visibles(/^e #\{r\d+c\d+\}/)) {
            vid_rest.delete(v_targ.attr.index);
            grp_cmds.push(`highlight mark ${v_targ.attr.index} as removed`);
        }
        grp_cmds.push(`highlight cell ${(v_src as Vertex).cell().attr.index} as based`);
        grp_cmds.push(`highlight mark ${v_src.attr.index} as determined`);
        vid_rest.delete(v_src.attr.index);
        vid_found.add(v_src.attr.index);

        mem_seg.segment[0].logs.push(`
            <p>
                The candidate ${this.gameSpec.numCharMap[v_src.attr.num]}
                is a hidden single in ${arr_sel_evidence.join(', ')}.
            </p>
        `);
    }

    return mem_seg;
}

export { };