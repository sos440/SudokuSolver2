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
 * Address structure for Sudoku puzzle.
 */
class Address {
    constructor(index) {
        this.index = index;
        this.key = index % D1;
        index = Math.trunc(index / D1);
        this.row = Math.trunc(index / D1);
        this.col = index % D1;
        this.box = Math.trunc(this.row / Dp) * Dp + Math.trunc(this.col / Dp);
        this.site = (this.row % Dp) * Dp + (this.col % Dp);
        this.rc = this.row * D1 + this.col;
        this.rk = this.row * D1 + this.key;
        this.ck = this.col * D1 + this.key;
        this.bk = this.box * D1 + this.key;
        this.textKey = Address.symbolKeys[this.key];
        this.textRow = Address.symbolRows[this.row];
        this.textCol = Address.symbolCols[this.col];
        this.textBox = `box ${this.box + 1}`;
        this.textRC = this.textRow + this.textCol;
        this.text = `${this.textKey}@${this.textRC}`;
    }

    toString() {
        return this.text;
    }

    static symbolKeys = '123456789';
    static symbolRows = 'ABCDEFGHJ';
    static symbolCols = '123456789';

    static D1List = Array.from({ length: D1 }).map((_, i) => i);
    static D2List = Array.from({ length: D2 }).map((_, i) => i);
    static D3List = Array.from({ length: D3 }).map((_, i) => i);

    /** Precomputed addresses. Must use these ones when referring to a position! */
    static ad = Address.D3List.map(index => new Address(index));
}


/** Creates an instance of puzzle. */
class Puzzle {
    /** Constructor */
    constructor() {
        /** An array storing states as a 1D list. */
        this.buffer = new Uint8Array(D3);
    }

    /**
     * Read the state of the vertex.
     * @param {Address} addr The position of the vertex to read. 
     */
    readAt(addr) {
        return this.buffer[addr.index];
    }

    /**
     * Set the state of the vertex as marked.
     * @param {Address} addr The position of the vertex to mark. 
     */
    markAt(addr) {
        this.buffer[addr.index] = State.OCCUPIED;
    }

    /**
     * Set the state of the vertex as unmarked.
     * @param {Address} addr The position of the vertex to unmark. 
     */
    unmarkAt(addr) {
        this.buffer[addr.index] = State.VACANT;
    }

    /**
     * Copy the current puzzle.
     * @param {Puzzle} source The source puzzle to copy.
     * @returns {Puzzle} The copy of the source.
     */
    static copy(source) {
        const o = new Puzzle();
        o.buffer.set(source.buffer);
        return o;
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
                    puzzle.markAt(Address.ad[grid * D1 + parseInt(c) - 1]);
                }
                else {
                    Address.D1List.forEach(key => {
                        puzzle.markAt(Address.ad[grid * D1 + key]);
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
 * A container for computed connectivity information.
 */
class PuzzleConnectivity {
    constructor() {
        /** 
         * 2D array of addresses for occupied vertices in RC logical units.
         * @type {Address[][]}
         */
        this.rc = Address.D2List.map(_ => []);
        /** 
         * 2D array of addresses for occupied vertices in RN logical units.
         * @type {Address[][]}
         */
        this.rk = Address.D2List.map(_ => []);
        /** 
         * 2D array of addresses for occupied vertices in RN logical units.
         * @type {Address[][]}
         */
        this.ck = Address.D2List.map(_ => []);
        /** 
         * 2D array of addresses for occupied vertices in RN logical units.
         * @type {Address[][]}
         */
        this.bk = Address.D2List.map(_ => []);
    }

    /**
     * Compute the connectivity information of the given puzzle.
     * @param {Puzzle} source An input message containing the source puzzle.
     * @return {PuzzleConnectivity} The computed connectivity information of the source.
     */
    static compute(source) {
        /** The output message. */
        const output = new PuzzleConnectivity();

        /** Loop for computing the connectivity. */
        for(const addr of Address.ad){
            if (source.readAt(addr) == State.OCCUPIED) {
                output.rc[addr.rc].push(addr);
                output.rk[addr.rk].push(addr);
                output.ck[addr.ck].push(addr);
                output.bk[addr.bk].push(addr);
            }
        }

        return output;
    }
}


/**
 * Message protocol for exchanging data between strategies.
 */
class StrategyMessage {
    constructor(obj) {
        /** @type {string} The type of the message. */
        this.type = 'none';

        /** @type {Puzzle} The current puzzle. */
        this.puzzle = null;

        /** @type {PuzzleConnectivity} The current connectivity of the puzzle. */
        this.conn = null;

        /** @type {boolean} Indicates whether the current puzzle is updated or not. */
        this.isUpdated = false;

        /** @type {object} Messages, grouped by the address of the affected position. */
        this.groupedMsgs = {};

        /** Copy properties of obj to this. */
        Object.assign(this, obj);

        return this;
    }

    /**
     * Returns the connectivity of the current puzzle. Ensures that this property is computed.
     * @returns {PuzzleConnectivity} The connectivity information.
     */
    getConnectivity() {
        if (this.conn == null && this.puzzle != null) {
            this.conn = PuzzleConnectivity.compute(this.puzzle);
        }
        return this.conn;
    }

    /**
     * Add the message to its update logs, grouped by the address of the affected position.
     * @param {Address} addr The address of the unmarked state.
     * @param {object} obj The 
     */
    addMessage(addr, obj) {
        const key = addr.toString();
        this.groupedMsgs[key] = this.groupedMsgs[key] ?? [];
        this.groupedMsgs[key].push(obj);
    }
}


/**
 * A namespace for strategies.
 */
class Strategies {
    /**
     * Parse the signature into a list of property keys.
     * @param {string} signature The signature to be parsed. (It should be of the form {rc|rk|ck|bk} => {rc|rk|ck|bk})
     * @returns {object | null} An object that allows to loop through the parsed signature.
     */
    static parseSignature(signature) {
        const parsed = signature
            .toLocaleLowerCase()
            .replace(/\s+/g, '')
            .match(/s\{([\w|]+)\}=>w\{([\w|]+)\}/);
        if (parsed) {
            return {
                strong: parsed[1].split('|'),
                weak: parsed[2].split('|'),
                loop(callback) {
                    for (const type_s of this.strong){
                        for (const type_w of this.weak){
                            callback(type_s, type_w);
                        }
                    }
                }
            };
        }
        else {
            throw RangeError(`'${signature}' is an invalid signature.`);
        }
    }

    /** @todo Implement this! */
    static checkIsValid(msg_input) {

    }

    /** @todo Implement this! */
    static checkIsSolved(msg_input) {

    }

    /**
     * Implements the order 1, rank 0 locking strategy.
     * @param {PuzzleConnectivity} conn The connectivity information.
     * @param {string} type_s The type of the strong logical unit.
     * @param {string} type_w The type of the weak logical unit.
     * @param {function} callback The callback function invoked each time a position is unmarked.
     */
    static lockingOrder1Rank0(conn, type_s, type_w, callback) {
        /** @type {Address[][]} */
        const luarr_s = conn[type_s];
        /** @type {Address[][]} */
        const luarr_w = conn[type_w];

        /** Loop through the logical units in search of strong ones. */
        for (const cur_lu of luarr_s) {
            /** If the current logical unit is strong, */
            if (cur_lu.length == 1) {
                const addr_s = cur_lu[0];
                /** Loop through all the other positions in the weak logical unit. */
                for (const addr_w of luarr_w[addr_s[type_w]]) {
                    if (addr_s.index != addr_w.index) {
                        callback({
                            type_strong: type_s,
                            type_weak: type_w,
                            addr_strong: addr_s,
                            addr_weak: addr_w
                        });
                    }
                }
            }
        }
    }

    /**
     * Apply the naked single strategy.
     * @param {StrategyMessage} msg_arg An input message containing the source puzzle and its computed connectivity.
     * @returns {StrategyMessage} Returns the output message.
     */
    static nakedSingle(msg_arg) {
        const source = msg_arg.puzzle;
        const conn = msg_arg.getConnectivity();
        const msg_return = new StrategyMessage({
            puzzle: Puzzle.copy(source),
            type: 'naked single'
        });

        Strategies.parseSignature('S{rc} => W{rk|ck|bk}')
            .loop((type_s, type_w) => {
                Strategies.lockingOrder1Rank0(
                    conn, type_s, type_w,
                    o => {
                        msg_return.puzzle.unmarkAt(o.addr_weak);
                        msg_return.isUpdated = true;
                        msg_return.addMessage(o.addr_weak, o);
                    }
                );
            });

        return msg_return;
    }

    /**
     * Apply the hidden single strategy.
     * @param {StrategyMessage} msg_arg An input message containing the source puzzle and its computed connectivity.
     * @returns {StrategyMessage} Returns the output message.
     */
    static hiddneSingle(msg_arg) {
        const source = msg_arg.puzzle;
        const conn = msg_arg.getConnectivity();
        const msg_return = new StrategyMessage({
            puzzle: Puzzle.copy(source),
            type: 'hidden single'
        });

        Strategies.parseSignature('S{rk|ck|bk} => W{rc}')
            .loop((type_s, type_w) => {
                Strategies.lockingOrder1Rank0(
                    conn, type_s, type_w,
                    o => {
                        msg_return.puzzle.unmarkAt(o.addr_weak);
                        msg_return.isUpdated = true;
                        msg_return.addMessage(o.addr_weak, o);
                    }
                );
            });

        return msg_return;
    }
};


/* export { Dp, D1, D2, D3, Constants, Puzzle, PuzzleMessage, Strategies }; */