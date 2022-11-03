/** @type {number} Dimensional parameter on which all the other dimensional constants depend. */
const Dp = 3;
/** @type {number} Number of rows/columns/boxes. */
const D1 = Dp ** 2;
/** @type {number} Number of sites. */
const D2 = D1 ** 2;
/** @type {number} Number of vertices. */
const D3 = D1 ** 3;


/**
 * @readonly
 */
const State = {
    /** The vertex is vacant, i.e., it is marked with a pencilmark. */
    VACANT: 0,
    /** The vertex is occupied, i.e., it is unmarked. */
    OCCUPIED: 1
};


/**
 * A namespace for various constants
 * @namespace
 */
const Constants = (() => {
    /** 
     * Since we are computing constants, performance is not a serious issue
     * and hence functional paradigm can be used.
     */

    /** An integer interval from 0 to D1. */
    const list_D1 = Array.from({ length: D1 }).map((_, x) => x);

    /** An integer interval from 0 to D2. */
    const list_D2 = Array.from({ length: D2 }).map((_, x) => x);

    /** An integer interval from 0 to D3. */
    const list_D3 = Array.from({ length: D3 }).map((_, x) => x);

    /** A conversion map (index) => Uint8Array([row, site, box, site]). */
    const g_to_rcbs = list_D3.map((grid) => {
        const col = grid % D1;
        const row = Math.trunc(grid / D1);
        const box = Math.trunc(row / Dp) * Dp + Math.trunc(col / Dp);
        const site = (row % Dp) * Dp + (col % Dp);
        return new Uint8Array([row, col, box, site]);
    });

    /** A conversion map (index) => Uint8Array([row, site, key, box, site]). */
    const i_to_rckbs = list_D3.map((index) => {
        const key = index % D1;
        index = Math.trunc(index / D1);
        const col = index % D1;
        const row = Math.trunc(index / D1);
        const box = Math.trunc(row / Dp) * Dp + Math.trunc(col / Dp);
        const site = (row % Dp) * Dp + (col % Dp);
        return new Uint8Array([row, col, key, box, site]);
    });

    /** A conversion map (box, site) => (index) */
    const bs_to_g = list_D1.map(box => list_D1.map(site => {
        const row = Math.trunc(box / Dp) * Dp + Math.trunc(site / Dp);
        const col = (box % Dp) * Dp + (site % Dp);
        return (row * D1 + col);
    }));

    /** the namespace */
    return {
        LD1: list_D1,
        LD2: list_D2,
        LD3: list_D3,
        I2RCKBS: i_to_rckbs,
        G2RCBS: g_to_rcbs,
        BS2G: bs_to_g
    };
})();


/** Creates an instance of puzzle. */
class Puzzle {
    /** Constructor */
    constructor() {
        /** An array storing states as a 1D list. */
        this.buffer = new Uint8Array(D3);
    }

    /**
     * Return the state at position (grid, key).
     * @param {number} grid The grid position.
     * @param {number} key The pencilmark.
     * @returns {State} state at the given position.
     */
    getStateAtGK(grid, key) {
        return this.buffer[Puzzle.GK2I(grid, key)];
    }

    /**
     * Assign the state to position (grid, key).
     * @param {number} grid The grid position.
     * @param {number} key The pencilmark.
     * @param {State} state The state to be asigned.
     */
    setStateAtGK(grid, key, state) {
        this.buffer[Puzzle.GK2I(grid, key)] = state;
    }

    /**
     * Return the state at position (row, col, key).
     * @param {number} row The row.
     * @param {number} col The column.
     * @param {number} key The pencilmark.
     * @returns {State} state at the given position.
     */
    getStateAtRCK(row, col, key) {
        return this.buffer[Puzzle.RCK2I(row, col, key)];
    }

    /**
     * Assign the state to position (row, col, key).
     * @param {number} row The row.
     * @param {number} col The column.
     * @param {number} key The pencilmark.
     * @param {State} state The state to be assigned.
     */
    setStateAtRCK(row, col, key, state) {
        this.buffer[Puzzle.RCK2I(row, col, key)] = state;
    }

    /**
     * Return the state at position (box, site, key).
     * @param {number} box The box.
     * @param {number} site The site within the box.
     * @param {number} key The pencilmark.
     * @returns {State} state at the given position.
     */
    getStateAtBSK(box, site, key) {
        return this.buffer[Puzzle.BSK2I(box, site, key)];
    }

    /**
     * Assign the state to position (box, site, key).
     * @param {number} box The box.
     * @param {number} site The site within the box.
     * @param {number} key The pencilmark.
     * @param {State} state The state to be assigned.
     */
    setStateAtBSK(box, site, key, state) {
        this.buffer[Puzzle.BSK2I(box, site, key)] = state;
    }

    /**
     * Occupy the state at position (grid, key).
     * @param {number} grid The grid position.
     * @param {number} key The pencilmark.
     */
    markAtGK(grid, key) {
        this.setStateAtGK(grid, key, State.OCCUPIED);
    }

    /**
     * Vacate the state at position (grid, key).
     * @param {number} grid The grid position.
     * @param {number} key The pencilmark.
     */
    unmarkAtGK(grid, key) {
        this.setStateAtGK(grid, key, State.VACANT);
    }

    /**
     * Occupy the state at position (row, col, key).
     * @param {number} row The row.
     * @param {number} col The column.
     * @param {number} key The pencilmark.
     */
    markAtRCK(row, col, key) {
        this.setStateAtRCK(row, col, key, State.OCCUPIED);
    }

    /**
     * Vacate the state at position (row, col, key).
     * @param {number} row The row.
     * @param {number} col The column.
     * @param {number} key The pencilmark.
     */
    unmarkAtRCK(row, col, key) {
        this.setStateAtRCK(row, col, key, State.VACANT);
    }

    /**
     * Occupy the state at position (box, site, key).
     * @param {number} box The box.
     * @param {number} site The site within the box.
     * @param {number} key The pencilmark.
     */
    markAtBSK(box, site, key) {
        this.setStateAtBSK(box, site, key, State.OCCUPIED);
    }

    /**
     * Vacate the state at position (box, site, key).
     * @param {number} box The box.
     * @param {number} site The site within the box.
     * @param {number} key The pencilmark.
     */
    unmarkAtBSK(box, site, key) {
        this.setStateAtBSK(box, site, key, State.VACANT);
    }

    /**
     * Create a copy of a puzzle.
     * @param {Puzzle} source The source puzzle.
     * @returns {Puzzle} A copy of the source.
     */
    static copy(source) {
        const target = new Puzzle();
        target.buffer.set(source.buffer);
        return target;
    }

    /**
     * Convert a digit pair to a single number.
     * @param {number} a1 1st digit.
     * @param {number} a0 0th digit.
     * @returns Returns the number.
     */
    static D1PairToNumber(a1, a0) {
        return a1 * D1 + a0;
    }

    /**
     * Convert a digit triple to a single number.
     * @param {number} a2 2nd digit.
     * @param {number} a1 1st digit.
     * @param {number} a0 0th digit.
     * @returns Returns the number.
     */
    static D1TripleToNumber(a2, a1, a0) {
        return a2 * D2 + a1 * D1 + a0;
    }

    /**
     * Convert a number to a pair of digits.
     * @param {number} num The input, typically interpreted as a subindex. 
     * @returns A pair of digits in D1-adic expansion.
     */
    static numberToD1Pair(num) {
        return [Math.trunc(num / D1), num % D1];
    }

    /**
     * Convert a number to a triple of digits.
     * @param {number} num The input, typically interpreted as a subindex. 
     * @returns A triple of digits in D1-adic expansion.
     */
    static numberToD1Triple(num) {
        return [Math.trunc(num / D2), Math.trunc(num / D1) % D1, num % D1];
    }

    /**
     * Computes the index using position (grid, key).
     * @param {number} grid The grid-based position.
     * @param {number} key The pencilmark.
     * @returns {number} The computed index.
     */
    static GK2I = Puzzle.D1PairToNumber;

    /**
     * Computes the grid using position (row, col).
     * @param {number} row The row.
     * @param {number} col The column.
     * @returns {number} The computed grid.
     */
    static RC2G = Puzzle.D1PairToNumber;

    /**
     * Computes the index using position (row, col, key).
     * @param {number} row The row.
     * @param {number} col The column.
     * @param {number} key The pencilmark.
     * @returns {number} Returns the computed index.
     */
    static RCK2I = Puzzle.D1TripleToNumber;

    /**
     * Computes the grid subindex using position (box, site).
     * @param {number} box Index of the box.
     * @param {number} site Index of the site.
     * @returns {number} Returns the computed index.
     */
    static BS2G(box, site) {
        return Constants.BS2G[box][site];
    }

    /**
     * Computes the index using position (box, site, key).
     * @param {number} box Index of the box.
     * @param {number} site Index of the site.
     * @param {number} key The pencilmark.
     * @returns {number} Returns the computed index.
     */
    static BSK2I(box, site, key) {
        return Constants.BS2G[box][site] * D1 + key;
    }

    /**
     * Computes the position using index.
     * @param {number} index The index.
     * @returns {Uint8Array[]} Returns the position in the form of [row, site, key, box, site].
     */
    static I2RCKBS(index) {
        return Constants.I2RCKBS[index];
    }

    /**
     * Computes the position using index.
     * @param {number} grid The grid position.
     * @returns {Uint8Array[]} Returns the position in the form of [row, site, key, box, site].
     */
    static G2RCBS(grid) {
        return Constants.G2RCBS[grid];
    }

    /**
     * Load a puzzle from a string.
     * @param {string} str An input string, either in simple/base64/JSON format.
     * @param {string} [format] The format of the output.
     * @returns {Puzzle} Returns the loaded puzzle.
     * @todo Implement this shit.
     */
    static importFromString(str, format) {
        const puzzle = new Puzzle();

        /** Guess the format of the string. */
        if (typeof format == 'string') {
            /** Do nothing. */
        }
        else if (str.length == D2) {
            format = 'simple';
        }

        /** Parse string */
        if (format == 'simple') {
            Array.from(str).forEach((c, grid) => {
                if ('1' <= c && c <= '9') {
                    puzzle.markAtGK(grid, parseInt(c) - 1);
                }
                else {
                    Constants.LD1.forEach(key => {
                        puzzle.markAtGK(grid, key);
                    });
                }
            });
            return puzzle;
        }
        else {
            throw new RangeError('Failed to parse the string.');
        }
    }

    /**
     * Conver the source to a simple string.
     * @param {Puzzle} source The source puzzle
     * @param {string} format The format of the output.
     * @returns {string} The simple string.
     */
    static exportToString(source, format) {
    }
}


/**
 * Message protocol between strategies.
 * This is purely for ensuring the validity of the input/output.
 */
class PuzzleMessage {
    constructor(obj) {
        /** @type {Puzzle} The current puzzle. */
        this.puzzle = null;
        /** @type {string} The type of the message. */
        this.type = 'none';
        /** Copy properties of obj to this. */
        Object.assign(this, obj);

        return this;
    }
}


class PuzzleEventUpdate {
    constructor(strategy = 'none') {
        this.strategy = strategy;
        this.updates = {};
    }

    addUpdateInstance(index, obj) {
        this.updates[index] = this.updates[index] ?? [];
        this.updates[index].push(obj);
    }
}


/**
 * A namespace for strategies.
 */
class Strategies {
    /**
     * 
     * @param {PuzzleMessage} msg_input An input message containing the source puzzle.
     * @returns {PuzzleMessage} Returns the output message with connectivity included.
     */
    static computeConnectivity(msg_input) {
        /** The source puzzle. */
        const source = msg_input.puzzle;
        /** The output message. */
        const msg_output = new PuzzleMessage({
            /** Return the source puzzle. */
            puzzle: source,
            /** @todo Consider chaning this to an enum type. */
            type: 'connectivity',
            /** 2D array of key indices for occupied vertices in RC logical units. */
            K_in_RC: Array.from({ length: D2 }).map(_ => []),
            /** 2D array of column indices for occupied vertices in RN logical units. */
            C_in_RK: Array.from({ length: D2 }).map(_ => []),
            /** 2D array of row indices for occupied vertices in RN logical units. */
            R_in_CK: Array.from({ length: D2 }).map(_ => []),
            /** 2D array of site indices for occupied vertices in RN logical units. */
            S_in_BK: Array.from({ length: D2 }).map(_ => []),
            /** @todo Consider collecting all bivalue units. */
        });

        /** Loop for computing the connectivity. */
        for (let i = 0; i < D1; i++) {
            for (let j = 0; j < D1; j++) {
                /** A flattened 2D subindex. */
                const subindex = Puzzle.D1PairToNumber(i, j);
                /** Compute the connectivity information of the source puzzle.  */
                for (let k = 0; k < D1; k++) {
                    if (source.getStateAtRCK(i, j, k) == State.OCCUPIED) {
                        msg_output.K_in_RC[subindex].push(k);
                    }
                    if (source.getStateAtRCK(i, k, j) == State.OCCUPIED) {
                        msg_output.C_in_RK[subindex].push(k);
                    }
                    if (source.getStateAtRCK(k, i, j) == State.OCCUPIED) {
                        msg_output.R_in_CK[subindex].push(k);
                    }
                    if (source.getStateAtBSK(i, k, j) == State.OCCUPIED) {
                        msg_output.S_in_BK[subindex].push(k);
                    }
                }
            }
        }

        return msg_output;
    }

    /** @todo Implement this! */
    static checkIsValid(msg_input) {

    }

    /** @todo Implement this! */
    static checkIsSolved(msg_input) {

    }

    /**
     * Apply the naked single strategy.
     * @param {PuzzleMessage} msg_input An input message containing the source puzzle and its computed connectivity.
     * @returns {PuzzleMessage} Returns the output message.
     */
    static nakedSingle(msg_input) {
        /** Compute the connectivity if not done already. */
        if (msg_input?.type != 'connectivity') {
            msg_input = this.computeConnectivity(msg_input);
        }

        /** The source puzzle. */
        const source = msg_input.puzzle;
        /** The output message. */
        const msg_output = new PuzzleMessage({
            puzzle: Puzzle.copy(source),
            messages: PuzzleEventUpdate('naked single'),
            isUpdated: false
        });

        /** Discover using cells. */
        for (let grid = 0; grid < D2; grid++) {
            /** The current logical unit. */
            const cur_lu = msg_input.K_in_RC[grid];
            /** If a naked single is found, */
            if (cur_lu.length == 1) {
                /** In this loop, subindex <=> (box, key) */
                const key = cur_lu[0];
                const [row, col, box, site] = Puzzle.G2RCBS(grid);

                /** Erase all the other marks having the same row and key as the naked single. */
                msg_input.C_in_RK[Puzzle.D1PairToNumber(row, key)].forEach(col2 => {
                    if (col == col2) {
                        /** Ignore when it is the naked single. */
                    }
                    else {
                        /** Remove the mark from the output puzzle. */
                        msg_output.puzzle.unmarkAtRCK(row, col2, key);
                        /** Update the flag 'isUpdated' and evidences. */
                        msg_output.isUpdated = true;
                        msg_output.messages.add(
                            Puzzle.RCK2I(row, col2, key),
                            {
                                unit: 'row',
                                index: Puzzle.RCK2I(row, col, key)
                            }
                        );
                    }
                });

                /** Erase all the other marks having the same column and key as the naked single. */
                msg_input.R_in_CK[Puzzle.D1PairToNumber(col, key)].forEach(row2 => {
                    if (row == row2) {
                        /** Ignore when it is the naked single. */
                    }
                    else {
                        /** Remove the mark from the output puzzle. */
                        msg_output.puzzle.unmarkAtRCK(row2, col, key);
                        /** Update the flag 'isUpdated' and evidences. */
                        msg_output.isUpdated = true;
                        msg_output.messages.add(
                            Puzzle.RCK2I(row2, col, key),
                            {
                                unit: 'col',
                                index: Puzzle.RCK2I(row, col, key)
                            }
                        );
                    }
                });

                /** Erase all the other marks having the same box and key as the naked single. */
                msg_input.S_in_BK[Puzzle.D1PairToNumber(box, key)].forEach(site2 => {
                    if (site == site2) {
                        /** Ignore when it is the naked single. */
                    }
                    else {
                        /** Remove the mark from the output puzzle. */
                        msg_output.puzzle.unmarkAtBSK(box, site2, key);
                        /** Update the flag 'isUpdated' and evidences. */
                        msg_output.isUpdated = true;
                        msg_output.messages.add(
                            Puzzle.BSK2I(box, site2, key),
                            {
                                unit: 'box',
                                index: Puzzle.BSK2I(box, site, key)
                            }
                        );
                    }
                });
            }
        }

        return msg_output;
    }

    /**
     * Apply the hidden single strategy.
     * @param {PuzzleMessage} msg_input An input message containing the source puzzle and its computed connectivity.
     * @returns {PuzzleMessage} Returns the output message.
     */
    static hiddneSingle(msg_input) {
        /** Compute the connectivity if not done already. */
        if (msg_input?.type != 'connectivity') {
            msg_input = this.computeConnectivity(msg_input);
        }

        /** The source puzzle. */
        const source = msg_input.puzzle;
        /** The output message. */
        const msg_output = new PuzzleMessage({
            puzzle: Puzzle.copy(source),
            messages: PuzzleEventUpdate('hidden single'),
            isUpdated: false
        });

        /** Discover using boxes. */
        for (let subindex = 0; subindex < D2; subindex++) {
            /** The current logical unit. */
            const cur_lu = msg_input.S_in_BK[subindex];
            /** If a hidden single is found, */
            if (cur_lu.length == 1) {
                /** In this loop, subindex <=> (box, key) */
                const key = subindex % D1;
                const box = Math.trunc(subindex / D1);
                const site = cur_lu[0];
                const grid = Puzzle.BS2G(box, site);

                /** Erase all the other marks in the same site as the hidden single. */
                msg_input.K_in_RC[grid].forEach(key2 => {
                    if (key == key2) {
                        /** Ignore when it is the hidden single. */
                    }
                    else {
                        /** Remove the mark from the output puzzle. */
                        msg_output.puzzle.unmarkAtGK(grid, key2);
                        /** Update the flag 'isUpdated' and evidences. */
                        msg_output.isUpdated = true;
                        msg_output.messages.add(
                            Puzzle.GK2I(grid, key2)
                            {
                                unit: 'box',
                                index: Puzzle.GK2I(grid, key2)
                            }
                        );
                    }
                });
            }
        }

        /** Discover using rows. */
        for (let subindex = 0; subindex < D2; subindex++) {
            /** The current logical unit. */
            const cur_lu = msg_input.C_in_RK[subindex];
            /** If a hidden single is found, */
            if (cur_lu.length == 1) {
                /** In this loop, subindex <=> (row, key) */
                const key = subindex % D1;
                const grid = Puzzle.RC2G(Math.trunc(subindex / D1), cur_lu[0]);

                /** Erase all the other marks in the same site as the hidden single. */
                msg_input.K_in_RC[grid].forEach(key2 => {
                    if (key == key2) {
                        /** Ignore when it is the hidden single. */
                    }
                    else {
                        /** Remove the mark from the output puzzle. */
                        msg_output.puzzle.unmarkAtGK(grid, key2);
                        /** Update the flag 'isUpdated' and evidences. */
                        msg_output.isUpdated = true;
                        msg_output.messages.add(
                            Puzzle.GK2I(grid, key2)
                            {
                                unit: 'row',
                                index: Puzzle.GK2I(grid, key2)
                            }
                        );
                    }
                });
            }
        }

        /** Discover using columns. */
        for (let subindex = 0; subindex < D2; subindex++) {
            /** The current logical unit. */
            const cur_lu = msg_input.R_in_CK[subindex];
            /** If a hidden single is found, */
            if (cur_lu.length == 1) {
                /** In this loop, subindex <=> (col, key) */
                const key = subindex % D1;
                const grid = Puzzle.RC2G(cur_lu[0], Math.trunc(subindex / D1));

                /** Erase all the other marks in the same site as the hidden single. */
                msg_input.K_in_RC[grid].forEach(key2 => {
                    if (key == key2) {
                        /** Ignore when it is the hidden single. */
                    }
                    else {
                        /** Remove the mark from the output puzzle. */
                        msg_output.puzzle.unmarkAtGK(grid, key2);
                        /** Update the flag 'isUpdated' and evidences. */
                        msg_output.isUpdated = true;
                        msg_output.messages.add(
                            Puzzle.GK2I(grid, key2)
                            {
                                unit: 'col',
                                index: Puzzle.GK2I(grid, key2)
                            }
                        );
                    }
                });
            }
        }

        return msg_output;
    }
};


/* export { Dp, D1, D2, D3, Constants, Puzzle, PuzzleMessage, Strategies }; */