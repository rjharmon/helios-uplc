import { FlatWriter } from "../flat/FlatWriter.js"
import { UplcType } from "./UplcType.js"

/**
 * @typedef {import("./UplcValue.js").UplcUnitI} UplcUnitI
 * @typedef {import("./UplcValue.js").UplcValue} UplcValue
 */

/**
 * Primitive unit value.
 * @implements {UplcUnitI}
 */
export class UplcUnit {
    constructor() {}

    /**
     * @type {"unit"}
     */
    get kind() {
        return "unit"
    }

    /**
     * @type {number}
     */
    get memSize() {
        return 1
    }

    /**
     * @type {number}
     */
    get flatSize() {
        return 4
    }

    /**
     * @returns {UplcType}
     */
    get type() {
        return UplcType.unit()
    }

    /**
     * @param {UplcValue} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other.kind == "unit"
    }

    /**
     * @returns {string}
     */
    toString() {
        return "()"
    }

    /**
     * Doesn't add any bits (typeBits are written by the UplcConst term)
     * @param {FlatWriter} writer
     */
    toFlat(writer) {}
}
