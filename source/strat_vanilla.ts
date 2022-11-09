/**
 * @module strategy
 */

import { MSet } from './multiset';
import { LabeledVertex, Hypergraph } from './hypergraph';
import { HGSudokuVanilla } from "./sudoku_vanilla";

/** An interface for storing and updating the rendered image. */
interface PuzzleView {
    /** @todo Design and implement it. */
}

/** A protocol for exchanging the data between solvers. */
interface SolverMessage<T extends Hypergraph> {
    /** Represents the game being played. */
    game: T;
    /** Represents the remaining candidates. */
    rawPuzzle: LabeledVertex[];
    /** Represents the setting being used. */
    settings: SolverSetting<T>;
    /** Represents the rendered image. */
    view: PuzzleView

    /** @todo Review the current design and impement it. */
}

type SolverStrategyItem<T extends Hypergraph> = (msg: SolverMessage<T>, setting: SolverSetting<T>) => SolverMessage<T>[];

type SolverSetting<T> = {};

class SolverStrategies<T extends Hypergraph> extends Map<string, SolverStrategyItem<T>>{
}



/**
 * Implementation for Vanilla Sudoku Game
 */

const SolverStrategiesSV = new SolverStrategies<HGSudokuVanilla>();

type SolverMessageSV = SolverMessage<HGSudokuVanilla>;

/**
 * Naked single strategy
 * When you know that a given cell can contain only a single candiate,
 * you can determine the cell's value as that candidate and then
 * erase all the other candidates that can see it.
 */

/*
SolverStrategiesSV.set(
    'naked_single',
    (msg: SolverMessageSV, setting: SolverSetting): SolverMessageSV[] => {
        const h_seq: SolverMessageSV[] = [];
        const puzzle: Hypergraph = msg.puzzle;
        const game: HGSudokuVanilla = msg.game;

        type SolverMessageSV = SolverMessage<HGSudokuVanilla>;
        const eg_rc = puzzle.edgeGroups.get('rc') || new Map<number, Multiset<LabeledVertex>>();
        for (const [sno, mset] of eg_rc) {
            if (mset.size == 1) {
                const v = mset.pick();
                const multi = Multiset.subtract(
                    Multiset.add(
                        ...Array.from(v?.layers.get('rk')?.keys()).map(sno => puzzle.edgeGroups.get('rk'))
                        ),
                    mset
                )
            }
        }

        return h_seq;
    }
);
*/

const sudoku = new HGSudokuVanilla(3);

