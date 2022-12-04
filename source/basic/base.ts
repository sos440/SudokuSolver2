/** A representation of base-n representation. */
export class BaseN {
    base: number;

    /** @param {number} base The base. */
    constructor(base: number) {
        this.base = base;
    }

    /**
     * Converts the digit sequence, interpreted as a base-n representation, to a number.
     * @param {number[]} digits The sequence of digits in decreasing order of importance. 
     * @returns {number} The number.
     */
    static fromD (digits: number[], base: number): number {
        return digits.reduce((p, a) => (p * base + a), 0);
    }

    fromDigits(digits: number[]): number {
        return BaseN.fromD(digits, this.base);
    }

    /**
     * Convert the number to a base-n digit sequence.
     * @param {number} num The number.
     * @param {number} length The number of digits.
     * @returns {number[]} The sequence of digits in decreasing order of importance. 
     */
    static toD (num: number, length: number, base: number): number[] {
        const arr: number[] = Array.from({ length: length });
        for (let i = length - 1; i > 0; i--) {
            arr[i] = num % base;
            num = Math.trunc(num / base);
        }
        arr[0] = num;
        return arr;
    }

    toDigits(num: number, length: number): number[] {
        return BaseN.toD(num, length, this.base);
    }
}