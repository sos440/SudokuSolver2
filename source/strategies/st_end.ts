import { Edge, Vertex } from "../basic/adj";
import { Puzzle } from "../basic/puzzle";
import { StrategyResult } from "../comp/memento";
import { Solver } from "../solver";

declare module "../solver" {
    interface Solver {
        /** Checks if the given puzzle is solved, valid, etc. */
        validityCheck(pz: Puzzle): StrategyResult;

        /** Invoked when the solver cannot proceed. */
        cannotProceed(pz: Puzzle): StrategyResult;
    }
}

Solver.prototype.validityCheck = function (pz: Puzzle): StrategyResult {
    const mem_seg_solved = new StrategyResult();
    mem_seg_solved.isEnd = true;
    mem_seg_solved.addBlankMementos(1);
    mem_seg_solved.segment[0].logs = [`
        <div class="msg_title done">
            Validity Check
        </div>
        <p>
            The puzzle is already solved.
        </p>
    `];

    const mem_seg_invalid = new StrategyResult();
    mem_seg_invalid.addBlankMementos(1);
    mem_seg_invalid.segment[0].logs = [`
        <div class="msg_title error">
            Validity Check
        </div>
    `];
    


    /** For each rule unit: */
    for (const e of pz.findAll(/^e.rule/)) {
        if (e.findAll(/v\.rest/).adj.size > 0) {
            mem_seg_solved.isEnd = false;
        }
        if ((e as Edge).v.size == 0) {
            mem_seg_invalid.isEnd = true;
            mem_seg_invalid.segment[0].logs.push(`
                <p>
                    The puzzle is invalid! ${e.selector} contains no candidate.
                </p>
            `);
        }
        if (e.findAll(/v\.(?:given|found)/).adj.size > 1) {
            mem_seg_invalid.isEnd = true;
            mem_seg_invalid.segment[0].logs.push(`
                <p>
                    The puzzle is invalid! ${e.selector} contains more than one determined candidates.
                </p>
            `);
        }
    }

    if (mem_seg_invalid.isEnd) {
        return mem_seg_invalid;
    }
    else if (mem_seg_solved.isEnd) {
        return mem_seg_solved;
    }
    else {
        return new StrategyResult();
    }
}

Solver.prototype.cannotProceed = function (pz: Puzzle): StrategyResult {
    const mem_seg = new StrategyResult();
    mem_seg.isEnd = true;
    mem_seg.addBlankMementos(1);
    mem_seg.segment[0].logs = [`
        <div class="msg_title error">
            Stopped
        </div>
        <p>
            The solver cannot proceed further.
        </p>
    `];
    return mem_seg;
}

export { };