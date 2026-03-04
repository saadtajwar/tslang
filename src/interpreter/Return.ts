import { RuntimeError } from "./Interpreter";

// TODO: finish this
export class Return extends Error {
    readonly value: object
    constructor(value: object) {
        super()
        this.value = value
    }
}