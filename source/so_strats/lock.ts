import { range } from "../basic/tools";
import { MSet } from "../math/multiset";
import { SOVertex, SOEdge, SOEdgeType, SOEdgeTypeGenuine, SOFace, SOFaceType, SOPuzzle } from "../so_graph";
import { SOSolver } from "../so_solver";
import { PartialMemento } from "../system/memento";

/** Merge declaration of the class SOSolver. */
declare module "../so_solver" {
    interface SOSolver {
        /** Augments the puzzle with abstract vertices and edges representing grouped configs. */
        computeGroupedEdges(pz: SOPuzzle): PartialMemento[];
        /** Augments the puzzle with abstract vertices and edges representing ALS/ALF. */
        computeALEdges(max_order: number, type_triples: SOConfigType[]): (pz: SOPuzzle) => PartialMemento[];
    }
}

SOSolver.prototype.computeGroupedEdges = function (pz: SOPuzzle): PartialMemento[] {
    pz.computeGroupedEdges();
    return [];
}

SOSolver.prototype.computeALEdges = function (
    max_order: number,
    type_triples: SOConfigType[]
): (pz: SOPuzzle) => PartialMemento[] {
    return (pz: SOPuzzle): PartialMemento[] => {
        pz.computeALEdges(max_order, type_triples);
        return [];
    };
}


/** Merge declaration of the class SOPuzzle. */
declare module "../so_graph" {
    interface SOPuzzle {
        /** Loops through the edges of the specified types. */
        loopLineBox(): IterableIterator<[SOEdge, SOEdge]>;

        /** 
         * Loops through the rank-0 configuration of the specified order.
         * @param {number} order The set size of each of the strong/weak wings.
         * @param {SOConfigType[]} type_triples The list of all (face type, strong edge type, weak edge type) triples to investigate. 
         */
        loopFaceConfig(order: number, type_triples: SOConfigType[]): Generator<LockedConfig>;

        /** Computes the group edges in preparation of grouped AIC. */
        computeGroupedEdges(): void;

        /** Compuates the almost-locked edges in preparation of ALS|ALF-based AIC. */
        computeALEdges(max_order: number, type_triples: SOConfigType[]): void;
    }
}

/** Represents a locked configuration in a face. */
export interface LockedConfig {
    face: SOFace;
    strongEdges: Set<SOEdge>;
    strongVertices: Set<SOVertex>;
    weakEdges: Set<SOEdge>;
    weakVertices: Set<SOVertex>;
    weakOnlyVertices: Set<SOVertex>;
};

/** Represents the type of a configuration. */
export type SOConfigType = [SOFaceType, SOEdgeTypeGenuine[], SOEdgeTypeGenuine[]];

SOPuzzle.prototype.loopLineBox = function* (): IterableIterator<[SOEdge, SOEdge]> {
    for (const e_type of ['rk', 'ck'] as SOEdgeType[]) {
        for (const e_line of this.adE[e_type]) {
            for (const e_box of e_line.$['bk']) {
                yield [e_line, e_box];
            }
        }
    }
}

SOPuzzle.prototype.loopFaceConfig = function* (order: number, type_triples: SOConfigType[]): Generator<LockedConfig> {
    for (const [f_type, e_type_s, e_type_w] of type_triples) {
        for (const face of this.adF[f_type]) {
            /** Filters strong edges with multiple candidates. */
            const eset_s = new Set(face.incident(e_type_s));
            const eset_s_f = eset_s.filter((e) => e.$['v'].size > 1);

            /** Loops through subsets of strong units: */
            for (const eset_s_sub of eset_s_f.subsets(order)) {
                /** Computes the set of weak edges intersecting strong edges. */
                const vset_s = eset_s_sub.mapUnion((e) => e.$['v']);
                const eset_w = new Set(SOPuzzle.incident(vset_s, e_type_w));
                if (eset_w.size > order) { continue; }

                /** Computes the vertices in each of strong/weak set of edges. */
                const vset_w = eset_w.mapUnion((e) => e.$['v']);
                const vset_wonly = Set.diff(vset_w, vset_s);
                if (vset_wonly.size == 0) { continue; }

                const result: LockedConfig = {
                    face: face,
                    strongEdges: eset_s_sub,
                    strongVertices: vset_s,
                    weakEdges: eset_w,
                    weakVertices: vset_w,
                    weakOnlyVertices: vset_wonly
                };
                yield result;
            }
        }
    }
}

SOPuzzle.prototype.computeGroupedEdges = function () {
    for (const e_type of ['rk', 'ck'] as SOEdgeType[]) {
        for (const e_line of this.adE[e_type]) {
            for (const e_box of e_line.$['bk']) {
                const vset_bonly = Set.diff(e_box.$['v'], e_line.$['v']);
                const vset_lonly = Set.diff(e_line.$['v'], e_box.$['v']);
                const vset_both = Set.intersection(e_line.$['v'], e_box.$['v']);

                if (vset_bonly.size == 0 || vset_lonly.size == 0) { continue; }
                if (vset_bonly.size > 1 && vset_lonly.size > 1) { continue; }
                if (vset_both.size == 1) { continue; }

                /** Create an abstract vertex representing the intersection. */
                const vset_both_names = vset_both.map((v) => v.name);
                const v_abs = new SOVertex('abstract', -1, [...vset_both_names].join('|'));

                /** Create an abstract edge in the direction of the line. */
                const e_grp_l = new SOEdge('grp', e_line.id, e_line.name);
                e_grp_l.$['v'].add(v_abs);
                v_abs.$['grp'].add(e_grp_l);
                for (const v of vset_lonly) {
                    v.$['grp'].add(e_grp_l);
                    e_grp_l.$['v'].add(v);
                    for (const e of v.incident(SOPuzzle.edgeTypes)) {
                        e_grp_l.$['grp'].add(e);
                    }
                }
                this.adE['grp'].push(e_grp_l);

                /** Create an abstract edge in the direction of the box. */
                const e_grp_b = new SOEdge('grp', e_box.id, e_box.name);
                v_abs.$['grp'].add(e_grp_b);
                e_grp_b.$['v'].add(v_abs);
                for (const v of vset_bonly) {
                    v.$['grp'].add(e_grp_b);
                    e_grp_b.$['v'].add(v);
                    for (const e of v.incident(SOPuzzle.edgeTypes)) {
                        e_grp_b.$['grp'].add(e);
                    }
                }
                this.adE['grp'].push(e_grp_b);
            }
        }
    }
}

SOPuzzle.prototype.computeALEdges = function (max_order: number, type_triples: SOConfigType[]) {
    for (const order of range(2, max_order + 1)) {
        for (const [f_type, e_type_s, e_type_w] of type_triples) {
            for (const face of this.adF[f_type]) {
                /** Filters strong edges with multiple candidates. */
                const eset_s = new Set(face.incident(e_type_s));
                const eset_s_f = eset_s.filter((e) => e.$['v'].size > 1);

                /** Loops through subsets of strong units: */
                for (const eset_s_sub of eset_s_f.subsets(order)) {
                    /** Computes the multiset representing the sum of given strong edges. */
                    const vset_s = MSet.add(...eset_s_sub.map((e) => e.$['v']));

                    const eset_w = new Set(SOPuzzle.incident(vset_s.keys(), e_type_w));
                    for (const eset_w_sub of eset_w.subsets(order)) {
                        /** Computes the multiset representing the sum of given weak edges. */
                        const vset_w = MSet.add(...eset_w_sub.map((e) => e.$['v']));

                        /** Computes the index function and its positive/negative parts. */
                        const vset_idx = MSet.subtract(vset_w, vset_s);
                        const vset_idx_neg = new MSet<SOVertex>();
                        const vset_idx_pos = new MSet<SOVertex>();
                        for (const [v, m] of vset_idx) {
                            if (m > 0) { vset_idx_pos.set(v, m); }
                            else if (m < 0) { vset_idx_neg.set(v, m); }
                        }

                        /** Check if the given index function can be regarded as an AL config. */
                        if (vset_idx_pos.count > vset_idx_pos.size || vset_idx_neg.count < -1) { continue; }

                        /** Creates an abstract vertex and edges effectively replacing the given AL config. */
                        const ea_type = (e_type_s.indexOf('rc') >= 0 || e_type_w.indexOf('rc') >= 0) ? 'als' : 'alf';
                        
                        const vset_both = Set.intersection(new Set(vset_s.elements()), new Set(vset_w.elements()));
                        const va_name = [...vset_both].map((v) => v.name).join('|');
                        const ea_s_name = [...eset_s_sub].map((e) => e.name).join('|');
                        const ea_w_name = [...eset_w_sub].map((e) => e.name).join('|');

                        const v_abs = new SOVertex('abstract', -1, va_name);
                        const e_abs_s = new SOEdge(ea_type, -1, ea_s_name);
                        const e_abs_w = new SOEdge(ea_type, -1, ea_w_name);
                        
                        v_abs.$[ea_type].add(e_abs_s).add(e_abs_w);
                        e_abs_s.$['v'].add(v_abs);
                        e_abs_w.$['v'].add(v_abs);

                        for (const v of vset_idx_neg.elements()) {
                            v.$[ea_type].add(e_abs_s);
                            e_abs_s.$['v'].add(v);
                        }
                        for (const v of vset_idx_pos.elements()) {
                            v.$[ea_type].add(e_abs_w);
                            e_abs_w.$['v'].add(v);
                        }

                        this.adE[ea_type].push(e_abs_s);
                        this.adE[ea_type].push(e_abs_w);
                        /** End of the subset loops. */
                    }
                }
                /** End of the "outer" loops. */
            }
        }
    }
}