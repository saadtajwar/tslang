import { Function } from "../parser/Stmt";
import { Environment } from "./Environment";
import { Interpreter } from "./Interpreter";
import { Return } from "./Return";
import { SlangCallable } from "./SlangCallable";

export class SlangFunction implements SlangCallable {
    readonly name = "callable"
    private readonly declaration: Function
    private readonly closure?: Environment

    constructor(declaration: Function, closure?: Environment) {
        this.declaration = declaration
        if (closure) {
            this.closure = closure
        }
    }

    public call(interpreter: Interpreter, argus: object[]): object {
        const environment = new Environment(this.closure)
        for (let i = 0; i < this.declaration.params.length; i++) {
            if (this.declaration.params[i]?.lexeme) {
                // @ts-ignore
                environment.define(this.declaration.params[i].lexeme, argus[i])
            }
        }

        try {
            interpreter.executeBlock(this.declaration.body, environment)
        } catch (error) {
            return (error as Return).value
        }
        // @ts-ignore
        return null
    }

    public arity(): number {
        return this.declaration.params.length
    }

    public toString(): string {
        return " <fn " + this.declaration.name.lexeme + ">"
    }
}