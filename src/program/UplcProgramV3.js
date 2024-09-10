import { None } from "@helios-lang/type-utils"
import { builtinsV3 } from "../builtins/index.js"
import {
    CostModel,
    CostModelParamsProxy,
    DEFAULT_COST_MODEL_PARAMS_V3
} from "../costmodel/index.js"
import { apply } from "../terms/index.js"
import {
    decodeCborProgram,
    decodeFlatProgram,
    encodeCborProgram,
    encodeFlatProgram,
    evalProgram,
    hashProgram
} from "./UplcProgram.js"
import { parseProgram } from "./parse.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("../cek/index.js").CekResult} CekResult
 * @typedef {import("../terms/index.js").UplcTerm} UplcTerm
 * @typedef {import("../values/index.js").UplcValue} UplcValue
 * @typedef {import("./UplcProgram.js").UplcProgramV3I} UplcProgramV3I
 */

const PLUTUS_VERSION = "PlutusScriptV3"
const PLUTUS_VERSION_TAG = 3
const UPLC_VERSION = "1.1.0"

/**
 * @implements {UplcProgramV3I}
 */
export class UplcProgramV3 {
    /**
     * @readonly
     * @type {UplcTerm}
     */
    root

    /**
     * @readonly
     * @type {Option<UplcProgramV3I>}
     */
    alt

    /**
     * @type {Option<() => string>}
     */
    #ir

    /**
     * @type {Option<number[]>}
     */
    #cachedHash

    /**
     * @param {UplcTerm} root
     * @param {{
     *   alt?: Option<UplcProgramV3I>
     *   ir?: Option<() => string>
     * }} props - the optional ir property is lazy because it is only used for debugging and might require an expensive formatting operation
     */
    constructor(root, props = {}) {
        this.root = root
        this.alt = props.alt
        this.#ir = props.ir
        this.#cachedHash = None
    }

    /**
     * @param {number[]} bytes
     * @returns {UplcProgramV3}
     */
    static fromFlat(bytes) {
        return new UplcProgramV3(decodeFlatProgram(bytes, UPLC_VERSION))
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {UplcProgramV3}
     */
    static fromCbor(bytes) {
        return new UplcProgramV3(decodeCborProgram(bytes, UPLC_VERSION))
    }

    /**
     * @param {string} src
     * @returns {UplcProgramV3}
     */
    static fromString(src) {
        return new UplcProgramV3(
            parseProgram(src, {
                uplcVersion: UPLC_VERSION,
                builtins: builtinsV3
            })
        )
    }

    /**
     * Used for debugging the compiler
     * @type {Option<string>}
     */
    get ir() {
        return this.#ir ? this.#ir() : None
    }

    /**
     * @type {typeof PLUTUS_VERSION}
     */
    get plutusVersion() {
        return PLUTUS_VERSION
    }

    /**
     * @type {typeof PLUTUS_VERSION_TAG}
     */
    get plutusVersionTag() {
        return PLUTUS_VERSION_TAG
    }

    /**
     * @type {typeof UPLC_VERSION}
     */
    get uplcVersion() {
        return UPLC_VERSION
    }

    /**
     * Wrap the top-level term with consecutive UplcCall (not exported) terms.
     *
     * Returns a new UplcProgramV1 instance, leaving the original untouched.
     * @param {UplcValue[]} args
     * @returns {UplcProgramV3} - a new UplcProgram instance
     */
    apply(args) {
        const alt = this.alt ? this.alt.apply(args) : None
        return new UplcProgramV3(apply(this.root, args), { alt })
    }

    /**
     * @param {undefined | UplcValue[]} args - if undefined, eval the root term without any applications, if empy: apply a force to the root term
     * @param {number[]} costModelParams
     * @returns {CekResult}
     */
    eval(args, costModelParams = DEFAULT_COST_MODEL_PARAMS_V3()) {
        const costModel = new CostModel(
            new CostModelParamsProxy(costModelParams),
            builtinsV3
        )
        return evalProgram(builtinsV3, costModel, this.root, args)
    }

    /**
     * @returns {number[]} - 28 byte hash
     */
    hash() {
        if (!this.#cachedHash) {
            this.#cachedHash = hashProgram(this)
        }

        return this.#cachedHash
    }

    /**
     * Returns the Cbor encoding of a script (flat bytes wrapped twice in Cbor bytearray).
     * @returns {number[]}
     */
    toCbor() {
        return encodeCborProgram(this.root, UPLC_VERSION)
    }

    /**
     * @returns {number[]}
     */
    toFlat() {
        return encodeFlatProgram(this.root, UPLC_VERSION)
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.root.toString()
    }

    /**
     * @param {UplcProgramV3I} alt
     * @returns {UplcProgramV3I}
     */
    withAlt(alt) {
        return new UplcProgramV3(this.root, { alt, ir: this.#ir })
    }
}
