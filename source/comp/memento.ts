/**
 * A module for recording and navigating history.
 */

import { PuzzleCanvasSnapshot } from "./svg";

/** Represents the editor. */
export abstract class Originator {
    abstract snapshot: PuzzleCanvasSnapshot;
    abstract selected: number;
    abstract load(mem: Memento, time: number): void;
}

export interface PartialMemento {
    /** Type of the HistoryElement. */
    type?: string;
    /** Snapshot representing the puzzle right after the change has occurred. */
    snapshot: PuzzleCanvasSnapshot;
    /** List of logs. */
    logs: string[];
    /** Selected cell. */
    selected?: number;
}

/** Represents items in the timeline. */
export class Memento implements PartialMemento {
    type: string = 'undefined';
    snapshot: PuzzleCanvasSnapshot;
    logs: string[];
    selected: number;
    constructor(type: string = 'undefined', pmem?: PartialMemento) {
        this.type = type;
        this.snapshot = {};
        this.logs = [];
        this.selected = -1;
        if (typeof pmem != 'undefined') {
            this.copyFrom(pmem);
        }
    }

    isInitial(): boolean {
        return (this.type.match(/initial/) != null);
    }

    isFinal(): boolean {
        return (this.type.match(/final/) != null);
    }

    copyFrom(pmem: PartialMemento) {
        this.type = pmem.type ?? this.type;
        this.logs = pmem.logs ?? this.logs;
        this.selected = (pmem.selected && pmem.selected != NaN) ? pmem.selected : this.selected;
        Object.assign(this.snapshot, pmem.snapshot ?? {});
        return this;
    }
}

/** Records and controls the history. */
export class Caretaker {
    history: Memento[];
    time: number;
    originator: Originator;
    constructor(originator: Originator) {
        this.history = new Array<Memento>();
        this.time = -1;
        this.originator = originator;
    }

    /** Checks if the current memento is the final one. */
    atEnd(): boolean {
        return (this.time == this.history.length - 1);
    }

    /** Returns the current memento. */
    now(): Memento | null {
        return this.history[this.time] ?? null;
    }

    /** Returns the last memento. */
    last(): Memento | null {
        return this.history[this.history.length - 1] ?? null;
    }

    /** Computes the time of the last memento of type 'final'. */
    getLastFinalTime(time: number): number {
        for (let t = time; t >= 0; t--) {
            if (this.history[t].isFinal()) {
                return t;
            }
        }
        return -1;
    }

    /** Initialize the caretaker. */
    init(pmem: Memento): void {
        this.history = [];
        this.history.push(pmem);
        this.time = 0;
    }

    /** Trims the history and appends new mementos to the history. */
    addSegment(segment: PartialMemento[]): void {
        /** Performs trimming. */
        const last_final = this.getLastFinalTime(this.time);
        if (last_final == -1) {
            throw RangeError(`Something is wrong; there are no final events up to the specified time.`);
        }
        this.history = this.history.slice(0, last_final + 1);

        /** Appends new mementos to the history. */
        for (const pmem of segment) {
            this.history.push(new Memento().copyFrom(this.last() as Memento).copyFrom(pmem));
        }
    }

    /** 
     * Moves to a new momento at the specified tiem.
     * @returns {boolean} true if the move was successful, or false if the caretaker was unable to move.
     */
    moveTo(time_new: number): boolean {
        if (time_new >= this.history.length || time_new < 0) {
            return false;
        }
        this.time = time_new;
        this.originator.load(this.history[this.time], this.time);
        return true;
    }

    /** 
     * Moves to a new momento by the specified unit of time.
     * @returns {boolean} true if the move was successful, or false if the caretaker was unable to move.
     */
    moveBy(dt: number): boolean {
        return this.moveTo(this.time + dt);
    }
}

/** Represents the result of a strategy. */
export class StrategyResult {
    /** Indicates whether there has been updates made by the specified strategy. */
    isUpdated: boolean;
    /** Indicates whether the puzzle cannot be updated further (as it is solved, invalid, stuck, etc.) */
    isEnd: boolean;
    /** Stores partial mementos. */
    segment: PartialMemento[];
    constructor() {
        this.isUpdated = false;
        this.isEnd = false;
        this.segment = [];
    }

    addBlankMementos(count: number) {
        for (const _ of new Array(count).keys()) {
            this.segment.push({ type: 'middle', logs: [], snapshot: {} });
        }
        return this;
    }

    export(): PartialMemento[] {
        if (!(this.isEnd || this.isUpdated)) {
            return [];
        }
        else if (this.segment.length == 1) {
            this.segment[0].type = 'initial|final';
        }
        else if (this.segment.length > 1) {
            this.segment[0].type = 'initial';
            this.segment[this.segment.length - 1].type = 'final';
        }
        return this.segment;
    }

    static templateRemove(st_name: string, st_lv: string, vid_rest: Set<number>): StrategyResult {
        const mem_seg = new StrategyResult();
        mem_seg.addBlankMementos(2);
        mem_seg.segment[0].logs = [`
            <div class="msg_title ${st_lv}">
                ${st_name}
            </div>
        `];
        mem_seg.segment[0].snapshot.annotations = new Array<string>();
        mem_seg.segment[1].snapshot.rest = new Set<number>(vid_rest);
        mem_seg.segment[1].snapshot.annotations = [];
        return mem_seg;
    }
}