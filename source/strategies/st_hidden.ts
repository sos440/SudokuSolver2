import { AdjElement, Edge, Vertex } from "../basic/adj";
import { Puzzle } from "../basic/puzzle";
import { StrategyResult } from "../comp/memento";
import { Solver } from "../solver";
import '../basic/set';

declare module "../solver" {
    interface Solver {
        /** Hidden Single */
        hiddenSingle(pz: Puzzle): StrategyResult;

        /** Hidden Subset Generator */
        hiddenSubsetGenerator(size: number, set_name: string): (pz: Puzzle) => StrategyResult;
    }
}

Solver.prototype.hiddenSingle = function (pz: Puzzle): StrategyResult {
    const mem_seg = StrategyResult.templateRemove(
        'Hidden Single',
        'lv_novice',
        this.snapshot.rest as Set<number>
    );
    const grp_cmds = mem_seg.segment[0].snapshot.annotations as string[];
    const vid_rest = mem_seg.segment[1].snapshot.rest as Set<number>;
    const vid_found = mem_seg.segment[1].snapshot.found = new Set<number>(this.snapshot.found);

    /** For each undetermined vertex: */
    for (const v_src of pz.findAll(/^v\.rest/)) {
        /** Finds all the rule unit, adjacent to the vertex, that contains one vertex. */
        const arr_sel_evidence: string[] = [];
        for (const e of v_src.findAll(/^e.rule #\{[rcb]\d+n\d+\}/)) {
            if ((e as Edge).v.size == 1) {
                arr_sel_evidence.push(e.id);
            }
        }
        if (arr_sel_evidence.length == 0) { continue; }

        mem_seg.isUpdated = true;
        for (const v_targ of (v_src as Vertex).visibles(/^e.rule #\{r\d+c\d+\}/)) {
            vid_rest.delete(v_targ.attr.index);
            grp_cmds.push(`highlight ${v_targ.id} as removed`);
        }
        grp_cmds.push(`highlight ${(v_src as Vertex).cell().id} as affected`);
        grp_cmds.push(`highlight ${v_src.id} as determined`);
        vid_rest.delete(v_src.attr.index);
        vid_found.add(v_src.attr.index);

        const num_str = this.gameSpec.numCharMap[v_src.attr.num];
        mem_seg.segment[0].logs.push(`
            <p>
                The candidate <span class="highlight hl_based">${num_str}</span>
                is a hidden single in <span class="highlight hl_affected">${arr_sel_evidence.join(', ')}</span>.
            </p>
        `);
    }

    return mem_seg;
}

Solver.prototype.hiddenSubsetGenerator = function (size: number, set_name: string) {
    if (!Number.isInteger(size) || size < 2) {
        throw RangeError('The size parameter must be an integer greater than or equal to 2.');
    }
    return (pz: Puzzle): StrategyResult => {
        const mem_seg = StrategyResult.templateRemove(
            `Hidden ${set_name}`,
            'lv_apprentice',
            this.snapshot.rest as Set<number>
        );
        const grp_cmds = mem_seg.segment[0].snapshot.annotations as string[];
        const vid_rest = mem_seg.segment[1].snapshot.rest as Set<number>;

        /** For each house: */
        for (const [_, house] of this.gameSpec.houses) {
            /** Collects all the multivalued units in that house. */
            const eadj_unit = pz
                .findAll(new RegExp(`^e\\.rule #\\{${house.id}n\\d+\\}`))
                .filter((e) => (e as Edge).isMultivalued);

            /** For each subset of cells of the specified size: */
            for (const elist_sub of [...eadj_unit.adj.values()].subArrays(size)) {
                const eadj_perp = AdjElement
                    .union(elist_sub)
                    .findAll(/^e\.rule #\{r\d+c\d+\}/);

                if (eadj_perp.adj.size > size) { continue; }

                const elist_perp = [...eadj_perp.adj.values()];
                const adj_s = Edge.union(elist_sub as Array<Edge>);
                const adj_w = Edge.union(elist_perp as Array<Edge>);
                const v_wonly = Set.diff(adj_w.v, adj_s.v);
                if (v_wonly.size == 0) { continue; }

                mem_seg.isUpdated = true;
                const cell_str = elist_perp.map((e) => e.id).join(', ');
                grp_cmds.push(`highlight ${house.id}n0 as based`);
                grp_cmds.push(`highlight ${cell_str} as affected`);
                v_wonly.forEach((v) => {
                    vid_rest.delete(v.attr.index);
                    grp_cmds.push(`highlight ${v.id} as removed`);
                });

                const num_str = [...adj_s.v.map((v: Vertex) => this.gameSpec.numCharMap[v.attr.num])].join(', ');
                mem_seg.segment[0].logs.push(`
                    <p>
                        Candidates <span class="highlight hl_based">${num_str} in ${cell_str}</span>
                        forms a hidden ${set_name.toLocaleLowerCase()}
                        in the house <span class="highlight hl_based">${house.id}</span>.
                        So, any other candidates in those cells can be erased.
                    </p>
                `);
                return mem_seg;
            }
        }

        return mem_seg;
    };
};

export { };