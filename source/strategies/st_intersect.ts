import { Edge } from "../basic/adj";
import { Puzzle } from "../basic/puzzle";
import { StrategyResult } from "../comp/memento";
import { Solver } from "../solver";
import "../basic/set";

declare module "../solver" {
    interface Solver {
        /** Intersection Pointing */
        intersectionPointing(pz: Puzzle): StrategyResult;

        /** Intersection Claiming */
        intersectionClaiming(pz: Puzzle): StrategyResult;
    }
}

Solver.prototype.intersectionPointing = function (pz: Puzzle): StrategyResult {
    const mem_seg = StrategyResult.templateRemove(
        'Intersection Pointing',
        'lv_novice',
        this.snapshot.rest as Set<number>
    );
    const grp_cmds = mem_seg.segment[0].snapshot.annotations as string[];
    const vid_rest = mem_seg.segment[1].snapshot.rest as Set<number>;

    /** For each box: */
    for (const e_box of pz.findAll(/^e\.rule \#\{b\d+n\d+\}/)) {
        /** For each line intersecting the box: */
        for (const e_line of e_box.findAll(/^e\.rule \#\{[rc]\d+n\d+\}/)) {
            const v_band = Set.intersection((e_box as Edge).v, (e_line as Edge).v);
            const v_s = Set.diff((e_box as Edge).v, (e_line as Edge).v);
            const v_w = Set.diff((e_line as Edge).v, (e_box as Edge).v);

            if (v_s.size > 0 || v_w.size == 0) { continue; }

            mem_seg.isUpdated = true;
            grp_cmds.push(`highlight ${e_line.id} as affected`);
            grp_cmds.push(`highlight ${e_box.id} as based`);
            grp_cmds.push(`highlight ${e_box.id} & ${e_line.id} as intersect`);
            v_band.forEach((v) => {
                grp_cmds.push(`highlight ${v.id} as based`);
            });
            v_w.forEach((v) => {
                vid_rest.delete(v.attr.index);
                grp_cmds.push(`highlight ${v.id} as removed`);
            });

            const num_str = e_box.id.match(/n(\d+)/)?.[1] ?? '?';
            mem_seg.segment[0].logs.push(`
                <p>
                Candidate <span class="highlight hl_based">${num_str} in ${e_box.id}</span> is confined 
                in the <span class="highlight hl_intersect">mini-line in ${e_line.id}</span>.
                So, any other candidates <span class="highlight hl_affected">${num_str} in ${e_line.id}</span> outside of
                that mini-line can be erased.
                </p>
            `);
            return mem_seg;
        }
    }

    return mem_seg;
}

Solver.prototype.intersectionClaiming = function (pz: Puzzle): StrategyResult {
    const mem_seg = StrategyResult.templateRemove(
        'Intersection Claiming',
        'lv_novice',
        this.snapshot.rest as Set<number>
    );
    const grp_cmds = mem_seg.segment[0].snapshot.annotations as string[];
    const vid_rest = mem_seg.segment[1].snapshot.rest as Set<number>;

    /** For each line: */
    for (const e_line of pz.findAll(/^e\.rule \#\{[rc]\d+n\d+\}/)) {
        /** For each box intersecting the line: */
        for (const e_box of e_line.findAll(/^e\.rule \#\{b\d+n\d+\}/)) {
            const v_band = Set.intersection((e_box as Edge).v, (e_line as Edge).v);
            const v_s = Set.diff((e_line as Edge).v, (e_box as Edge).v);
            const v_w = Set.diff((e_box as Edge).v, (e_line as Edge).v);

            if (v_s.size > 0 || v_w.size == 0) { continue; }

            mem_seg.isUpdated = true;
            grp_cmds.push(`highlight ${e_box.id} as affected`);
            grp_cmds.push(`highlight ${e_line.id} as based`);
            grp_cmds.push(`highlight ${e_box.id} & ${e_line.id} as intersect`);
            v_band.forEach((v) => {
                grp_cmds.push(`highlight ${v.id} as based`);
            });
            v_w.forEach((v) => {
                vid_rest.delete(v.attr.index);
                grp_cmds.push(`highlight ${v.id} as removed`);
            });

            const num_str = e_line.id.match(/n(\d+)/)?.[1] ?? '?';
            mem_seg.segment[0].logs.push(`
                <p>
                    Candidate <span class="highlight hl_based">${num_str} in ${e_line.id}</span> is confined 
                    in the <span class="highlight hl_intersect">mini-line in ${e_box.id}</span>.
                    So, any other candidates <span class="highlight hl_affected">${num_str} in ${e_box.id}</span> outside of
                    that mini-line can be erased.
                </p>
            `);
            return mem_seg;
        }
    }

    return mem_seg;
}

export { };