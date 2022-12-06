import { AdjElement, Edge, Vertex } from "../basic/adj";
import { Puzzle } from "../basic/puzzle";
import { StrategyResult } from "../comp/memento";
import { Solver } from "../solver";
import '../basic/subarray';

declare module "../solver" {
    interface Solver {
        /** Naked Single */
        nakedSingle(pz: Puzzle): StrategyResult;

        /** Naked Subset */
        nakedSubsetGenerator(size: number, set_name: string): (pz: Puzzle) => StrategyResult;
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

    /** For each undetermined vertex: */
    for (const v_src of pz.findAll(/^v\.rest/)) {
        const e_rc = (v_src as Vertex).cell();
        if (e_rc.v.size > 1) { continue; }

        mem_seg.isUpdated = true;
        vid_rest.delete(v_src.attr.index);
        vid_found.add(v_src.attr.index);

        grp_cmds.push(`highlight ${e_rc.id} as determined`);

        const num_str = this.gameSpec.numCharMap[v_src.attr.num];
        mem_seg.segment[0].logs.push(`
            <p>
                The candidate <span class="highlight hl_determined">${num_str}</span>
                is a naked single in <span class="highlight hl_based">${e_rc.id}</span>.
            </p>
        `);
    }

    return mem_seg;
}

Solver.prototype.nakedSubsetGenerator = function (size: number, set_name: string) {
    if (!Number.isInteger(size) || size < 2) {
        throw RangeError('The size parameter must be an integer greater than or equal to 2.');
    }
    return (pz: Puzzle): StrategyResult => {
        const mem_seg = StrategyResult.templateRemove(
            `Naked ${set_name}`,
            'lv_apprentice',
            this.snapshot.rest as Set<number>
        );
        const grp_cmds = mem_seg.segment[0].snapshot.annotations as string[];
        const vid_rest = mem_seg.segment[1].snapshot.rest as Set<number>;

        /** For each house: */
        for (const [_, house] of this.gameSpec.houses) {
            /** Collects all the multivalue cells in that house. */
            const elist_cell = [...house.cells]
                .map((cell_id: string) => pz.adj.get(`e.rule #{${cell_id}}`) as Edge)
                .filter((cell: Edge) => cell.isMultivalued);

            /** For each subset of cells of the specified size: */
            for (const elist_sub of elist_cell.subArrays(size)) {
                const eadj_perp = AdjElement
                    .union(elist_sub)
                    .findAll(new RegExp(`^e\\.rule #\\{${house.id}n\\d+\\}`));

                if (eadj_perp.adj.size > size) { continue; }

                const adj_s = Edge.union(elist_sub);
                const adj_w = Edge.union(eadj_perp.adj.values() as IterableIterator<Edge>);
                const v_wonly = Set.diff(adj_w.v, adj_s.v);
                if (v_wonly.size == 0) { continue; }

                mem_seg.isUpdated = true;
                grp_cmds.push(`highlight ${house.id}n0 as affected`);
                grp_cmds.push(`highlight ${elist_sub.map((e) => e.id).join(',')} as intersect`);
                adj_s.v.forEach((v) => {
                    grp_cmds.push(`highlight ${v.id} as based`);
                });
                v_wonly.forEach((v) => {
                    vid_rest.delete(v.attr.index);
                    grp_cmds.push(`highlight ${v.id} as removed`);
                });

                const num_str = [...adj_w.v.map((v: Vertex) => this.gameSpec.numCharMap[v.attr.num])].join(', ');
                const cell_str = elist_sub.map((e: Edge) => e.id).join(', ');
                mem_seg.segment[0].logs.push(`
                    <p>
                        Candidates <span class="highlight hl_based">${num_str} in ${cell_str}</span>
                        forms a naked ${set_name.toLocaleLowerCase()}
                        in the house <span class="highlight hl_based">${house.id}</span>.
                        So, any other candidates <span class="highlight hl_affected">${num_str} in ${house.id}</span>
                        outside of the naked ${set_name.toLocaleLowerCase()} can be erased.
                    </p>
                `);
                return mem_seg;
            }
        }

        return mem_seg;
    };
};

export { };