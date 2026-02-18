import { Slang } from "..";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { Binary, Expr, Grouping, Literal, Unary, Visitor } from "./Expr";

export class RuntimeError extends Error {
    readonly token: Token
    constructor(token: Token, message: string) {
        super()
        this.token = token
    }

    public getMessage(): string {
        return "" // idk
    }
}

export class Interpreter implements Visitor<any> {
    public interpret(expression: Expr): void {
        try {
            const value = this.evaluate(expression)
            console.log(this.stringify(value))
        } catch (error) {
            Slang.runtimeError(error as RuntimeError)
        }
    }

    public visitLiteralExpr(expr: Literal): any {
        return expr.value
    }

    public visitGroupingExpr(expr: Grouping): any {
        return this.evaluate(expr.expression)
    }

    public visitBinaryExpr(expr: Binary): any {
        const left = this.evaluate(expr.left)
        const right = this.evaluate(expr.right)

        switch (expr.operator.type) {
            case TokenType.BANG_EQUAL: return !this.isEqual(left, right);
            case TokenType.EQUAL_EQUAL: return this.isEqual(left, right);


            case TokenType.GREATER:
                this.checkMultipleNumberOperand(expr.operator, left, right)
                return (left as number) > (right as number)
            case TokenType.GREATER_EQUAL:
                this.checkMultipleNumberOperand(expr.operator, left, right)
                return (left as number) >= (right as number)
            case TokenType.LESS:
                this.checkMultipleNumberOperand(expr.operator, left, right)
                return (left as number) < (right as number)
            case TokenType.LESS_EQUAL:
                this.checkMultipleNumberOperand(expr.operator, left, right)
                return (left as number) <= (right as number)

            case TokenType.MINUS:
                this.checkMultipleNumberOperand(expr.operator, left, right)
                return (left as number) - (right as number)
            case TokenType.PLUS:
                if (typeof left === "string" && typeof right === "string") {
                    return (left as string) + (right as string)
                } else if (typeof left === "number" && typeof right === "number") {
                    return (left as number) + (right as number)
                }

                throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings")
            case TokenType.SLASH:
                this.checkMultipleNumberOperand(expr.operator, left, right)
                return (left as number) / (right as number)
            case TokenType.STAR:
                this.checkMultipleNumberOperand(expr.operator, left, right)
                return (left as number) * (right as number)
        }
    }

    public visitUnaryExpr(expr: Unary): any {
        const right = this.evaluate(expr.right)
        switch (expr.operator.type) {
            case TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right)
                return -(right as number)
            case TokenType.BANG:
                return !this.isTruthy(right)
        }

        return null
    }

    private stringify(value: any): string {
        if (value === null) return "nil"
        if (typeof value === "number") {
            let text = value.toString()
            if (text.endsWith(".0")) {
                text = text.substring(0, text.length - 2)
            }
            return text
        }

        return value as string
    }

    private checkMultipleNumberOperand(operator: Token, operand_1: any, operand_2: any): void {
        if (typeof operand_1 === "number" && typeof operand_2 === "number") return
        throw new RuntimeError(operator, "Operands must be number")
    }

    private checkNumberOperand(operator: Token, operand: any): void {
        if (typeof operand === "number") return
        throw new RuntimeError(operator, "Operand must be number")
    }

    private isEqual(expr_1: any, expr_2: any): boolean {
        if (expr_1 === null && expr_2 === null) return true
        if (expr_1 === null || expr_2 === null) return false
        return expr_1 === expr_2
    }

    private isTruthy(evaledExpr: any) {
        if (evaledExpr === null) return false
        if (typeof evaledExpr === "boolean") return evaledExpr
        return true
    }

    private evaluate(expr: Expr): any {
        return expr.accept(this)
    }
}