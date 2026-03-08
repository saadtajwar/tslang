import { Token } from "../lexer/Token"
import { RuntimeError } from "./Interpreter"

export class Environment {
    readonly enclosing: Environment
    private readonly values: Map<string, object>

    constructor(enclosing?: Environment) {
        this.values = new Map<string, object>()
        if (enclosing) {
            this.enclosing = enclosing
        } else {
            this.enclosing = null as unknown as Environment
        }
    }
    
    getAt(distance: number, name: string): object {
        // @ts-ignore
        return this.ancestor(distance).values.get(name)
    }

    ancestor(distance: number): Environment {
        let environment = this
        for (let i = 0; i < distance; i++) {
            // @ts-ignore
            environment = environment.enclosing
        }

        return environment
    }

    assign(name: Token, value: object): void {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value)
            return
        }

        if (this.enclosing) {
            this.enclosing.assign(name, value)
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

        if (this.enclosing) return this.enclosing.get(name)
        throw new RuntimeError(name, `undefined variable ${name.lexeme}`)
    }
}