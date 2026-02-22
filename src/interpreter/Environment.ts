import { Token } from "../lexer/Token"
import { RuntimeError } from "./Interpreter"

export class Environment {
    private readonly values: Map<string, object>
    constructor() {
        this.values = new Map<string, object>()
    } 

    assign(name: Token, value: object): void {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value)
            return
        }
        
        throw new RuntimeError(name, `Undefined variable ${name.lexeme}`)

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