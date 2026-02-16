import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { Binary, Expr, Grouping, Literal, Unary, Visitor } from "./Expr";

export class AstPrinter implements Visitor<string> {
    print(expr: Expr) {
        return expr.accept(this)
    }

    visitBinaryExpr(expr: Binary): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
    }

    visitGroupingExpr(expr: Grouping): string {
        return this.parenthesize("group", expr.expression)
    }

    visitLiteralExpr(expr: Literal): string {
        if (expr.value === null) return "nil"
        return expr.value.toString()
    }

    visitUnaryExpr(expr: Unary): string {
        return this.parenthesize(expr.operator.lexeme, expr.right)
    }

    parenthesize(name: string, ...exprs: Expr[]): string {
        const builder: string[] = []

        builder.push("(")
        builder.push(name)
        for (const expr of exprs) {
            builder.push(" ")
            builder.push(expr.accept(this))
        }
        builder.push(")")

        return builder.join("")
    }
}

function prettyPrintExample() {
    const expression: Expr = new Binary(
        new Unary(
            new Token(TokenType.MINUS, "-", null, 1),
            new Literal(123)
        ),
        new Token(TokenType.STAR, "*", null, 1),
        new Grouping(
            new Literal(45.67)
        )
    )
    
    console.log(new AstPrinter().print(expression)) 
    // -> this should, recursively, print to stdout the following: (* (- 123) (group 45.67)) #lisp
}

prettyPrintExample()