import { Function } from "../parser/Stmt";
import { Environment } from "./Environment";
import { Interpreter } from "./Interpreter";
import { SlangCallable } from "./SlangCallable";

export class SlangFunction implements SlangCallable {
    readonly name = "callable"
    private readonly declaration: Function
    constructor(declaration: Function) {
        this.declaration = declaration
    }

    public call(interpreter: Interpreter, argus: object[]): object {
        const environment = new Environment(interpreter.globals)
        for (let i = 0; i < this.declaration.params.length; i++) {
            if (this.declaration.params[i]?.lexeme) {
                // @ts-ignore
                environment.define(this.declaration.params[i].lexeme, argus[i])
            }
        }

        interpreter.executeBlock(this.declaration.body, environment)
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