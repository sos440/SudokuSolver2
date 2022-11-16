/**
 * @module strategy
 */

import { SOGame } from "./sudoku_original";

/** An interface for storing and updating the rendered image. */
interface PuzzleView {
    /** @todo Design and implement it. */
}

/** A protocol for exchanging the data between solvers. */
interface SolverMessage<T extends Hypergraph> {
    /** Represents the game being played. */
    game: T;
    /** Represents the remaining candidates. */
    v_set: Set<LabeledVertex>;
    /** Represents the setting being used. */
    settings: SolverSetting<T>;
    /** Represents the rendered image. */
    view: PuzzleView

    /** @todo Review the current design and impement it. */
}

type SolverStrategyItem<T extends Hypergraph> = (msg: SolverMessage<T>) => (SolverMessage<T>[]);

type SolverSetting<T extends Hypergraph> = {};

class SolverStrategies<T extends Hypergraph> extends Map<string, SolverStrategyItem<T>>{
}



/**
 * Implementation for Vanilla Sudoku Game
 */

export const SolverStrategiesSV = new SolverStrategies<SOGame>();

export type SolverMessageSV = SolverMessage<SOGame>;

export type SolverSettingSV = SolverSetting<SOGame>;


/**
 * Naked single strategy
 * When you know that a given cell can contain only a single candiate,
 * you can determine the cell's value as that candidate and then
 * erase all the other candidates that can see it.
 */


/**
 * @todo It works, but it is TOO LONG. Improve it by faithfully implementing the
 * general puzzle logic using multiplicies and ranks.
 */
 SolverStrategiesSV.set(
    'naked_single',
    (msg: SolverMessageSV): SolverMessageSV[] => {
        const v_set: Set<LabeledVertex> = msg.v_set;
        const game: SOGame = msg.game;
        const msg_seq: SolverMessageSV[] = [];

        const v_set_new: Set<LabeledVertex> = new Set(v_set);

        /** This code may be refactors when .filterVertices() are modifed to accept array types. */
        const puzzle = game.filterVertices((v) => (v_set.has(v)));
        const eg_rc = puzzle.edgeGroups.get('rc') || NullEdgeGroup;
        for (const edge of eg_rc) {
            /** If a naked single has been found: */
            if (edge.size == 1) {
                const v = edge.pick() || NullLabeledVertex;
                /** Computes the ranks of each pencilmark. */
                const v_multis = Hyperedge.subtract(
                    Hyperedge.add(...(puzzle.incidency.get(v) || NullEdgeGroup)),
                    edge
                );
                v_multis.delete(v);
                /** Erases all the vertcies with multiplicity greater than the rank. */
                for (const [v_del, multi] of v_multis) {
                    if (multi > 0) {
                        /** @todo Consider reporting evidences to the solver. */
                        v_set_new.delete(v_del);
                    }
                }
            }
        }

        /** Builds the message list if there are any updates. */
        if (v_set_new.size < v_set.size){
            msg_seq.push({
                game: game,
                v_set: v_set_new,
                settings: {},
                view: {}
            });
        }

        return msg_seq;
    }
);