import { Interpreter } from "./Interpreter";

export interface SlangCallable {
    readonly name: "callable"
    call(interpreter: Interpreter, argus: object[]): object
    arity(): number
}