import { Token } from "../lexer/Token"
import { RuntimeError } from "./Interpreter"

export class Environment {
    private readonly values: Map<string, object>
    constructor() {
        this.values = new Map<string, object>()
    } 

    define(name: string, value: object): void {
        this.values.set(name, value)
    }

    get(name: Token): object {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme) as object
        }

        throw new RuntimeError(name, `undefined variable ${name.lexeme}`)
    }
}