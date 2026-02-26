import { Slang } from "..";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { Assign, Binary, Call, Expr, Grouping, Literal, Logical, Unary, Variable } from "./Expr";
import { Block, Expression, Function, If, Print, Return, Stmt, Var, While } from "./Stmt";

class ParseError extends Error {}
export class Parser {
    private readonly tokens: Token[]
    private current: number

    constructor(tokens: Token[]) {
        this.tokens = tokens
        this.current = 0
    }

    parse(): Stmt[] {
        const statements: Stmt[] = []
        while (!this.isAtEnd()) {
            const stmt = this.declaration()
            if (stmt) {
                statements.push(stmt)
            }
        }

        return statements
    }

    private declaration(): Stmt | null {
        try {
            if (this.matchAny(TokenType.FUN)) {
                return this.function("function")
            }
            if (this.matchAny(TokenType.VAR)) {
                return this.varDeclaration()
            }

            return this.statement()
        } catch (error) {
            this.synchronize()
            return null
        }
    }

    private function(kind: string): Function {
        const name = this.consume(TokenType.IDENTIFIER, "Expect " + kind + " name")
        this.consume(TokenType.LEFT_PAREN, "Expect ( after " + kind + " name")
        const params: Token[] = []
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (params.length >= 255) {
                    this.error(this.peek(), "Cant have more than 255 params")
                }

                params.push(
                    this.consume(TokenType.IDENTIFIER, "Expect param name")
                )
            } while (this.matchAny(TokenType.COMMA))
        }

        this.consume(TokenType.RIGHT_PAREN, "Expect ) after params")

        this.consume(TokenType.LEFT_BRACE, "Expect { before " + kind + " body")
        const body: Stmt[] = this.block()

        return new Function(name, params, body)
    }

    private varDeclaration(): Var {
        const name = this.consume(TokenType.IDENTIFIER, "Expect identifier after var")

        // @ts-ignore
        let initializer: Expr = null
        if (this.matchAny(TokenType.EQUAL)) {
            initializer = this.expression()
        }

        this.consume(TokenType.SEMICOLON, "Expect ';' after value")
        return new Var(name, initializer)
    }

    private statement(): Stmt {
        if (this.matchAny(TokenType.IF)) {
            return this.ifStatement()
        }

        if (this.matchAny(TokenType.FOR)) {
            return this.forStatement()
        }

        if (this.matchAny(TokenType.WHILE)) {
            return this.whileStatement()
        }

        if (this.matchAny(TokenType.PRINT)) {
            return this.printStatement()
        }

        if (this.matchAny(TokenType.RETURN)) {
            return this.returnStatement()
        }

        if (this.matchAny(TokenType.LEFT_BRACE)) {
            return new Block(this.block())
        }

        return this.expressionStatement()
    }

    private returnStatement(): Stmt {
        const keyword = this.previous()
        let value = null
        if (!this.check(TokenType.SEMICOLON)) {
            value = this.expression()
        }

        this.consume(TokenType.SEMICOLON, "Expect ; after return value")
        return new Return(keyword, value as Expr)
    }

    private forStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect ( after for")
        let initializer = null
        if (this.matchAny(TokenType.VAR)) {
            initializer = this.varDeclaration()
        } else {
            initializer = this.expressionStatement()
        }

        let condition = null
        if (!this.check(TokenType.SEMICOLON)) {
            condition = this.expression()
        }
        this.consume(TokenType.SEMICOLON, "Expect ; after loop condition")

        let increment = null
        if (!this.check(TokenType.RIGHT_PAREN)) {
            increment = this.expression()
        }
        this.consume(TokenType.RIGHT_PAREN, "Expect ) after for clauses")

        let body = this.statement()

        if (increment) {
            body = new Block(
                [
                    body,
                    new Expression(increment)
                ]
            )
        }

        if (!condition) condition = new Literal(true)
        body = new While(condition, body)

        if (initializer) body = new Block([initializer, body])

        return body
    }

    private whileStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect ( after while")
        const condition = this.expression()
        this.consume(TokenType.RIGHT_PAREN, "Expect ) after condition")
        
        const body = this.statement()

        return new While(condition, body)
    }

    private ifStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect ( after if")
        const condition = this.expression()
        this.consume(TokenType.RIGHT_PAREN, "Expect ) after condition")

        const thenBranch = this.statement()
        let elseBranch = null
        if (this.matchAny(TokenType.ELSE)) {
            elseBranch = this.statement()
        }

        return new If(condition, thenBranch, elseBranch as Stmt)
    }

    private block(): Stmt[] {
        const statements: Stmt[] = []
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            const dec = this.declaration()
            if (dec) statements.push(dec)
        }

        this.consume(TokenType.RIGHT_BRACE, "Expect } after block")
        return statements
    }

    private printStatement(): Stmt {
        const value = this.expression()
        this.consume(TokenType.SEMICOLON, "Expect ';' after value")
        return new Print(value)
    }

    private expressionStatement(): Stmt {
        const value = this.expression()
        this.consume(TokenType.SEMICOLON, "Expect ';' after value")
        return new Expression(value)
    }

    private expression(): Expr {
        return this.assignment()
    }

    private assignment(): Expr {
        let expr = this.or()

        if (this.matchAny(TokenType.EQUAL)) {
            const equals = this.previous()
            const value = this.assignment()

            if (expr instanceof Variable) {
                const name = expr.name
                return new Assign(name, value)
            }

            this.error(equals, "Invalid assignment target")
        }

        return expr
    }

    private or(): Expr {
        let expr = this.and()

        while (this.matchAny(TokenType.OR)) {
            const operator = this.previous()
            const right = this.and()
            expr = new Logical(expr, operator, right)
        }

        return expr
    }

    private and(): Expr {
        let expr = this.equality()
        while (this.matchAny(TokenType.AND)) {
            const operator = this.previous()
            const right = this.equality()
            expr = new Logical(expr, operator, right)
        }

        return expr
    }

    private equality(): Expr {
        let expr = this.comparison()

        while (this.matchAny(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
            const operator = this.previous()
            const right = this.comparison()
            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    private comparison(): Expr {
        let expr = this.term()
        while (this.matchAny(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
            const operator = this.previous()
            const right = this.term()
            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    private term(): Expr {
        let expr = this.factor()
        while (this.matchAny(TokenType.MINUS, TokenType.PLUS)) {
            const operator = this.previous()
            const right = this.factor()
            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    private factor(): Expr {
        let expr = this.unary()
        while (this.matchAny(TokenType.SLASH, TokenType.STAR)) {
            const operator = this.previous()
            const right = this.unary()
            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    private unary(): Expr {
        while (this.matchAny(TokenType.BANG, TokenType.MINUS)) {
            const operator = this.previous()
            const right = this.unary()
            return new Unary(operator, right)
        }

        return this.call()
    }

    private call(): Expr {
        let expr = this.primary()
        while (true) {
            if (this.matchAny(TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr)
            } else {
                break
            }
        }

        return expr
    }

    private finishCall(callee: Expr): Expr {
        const argus: Expr[] = []
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (argus.length >= 255) {
                    this.error(this.peek(), "Cant have more than 255 args")
                }
                argus.push(this.expression())
            } while (this.matchAny(TokenType.COMMA))
        }

        const paren = this.consume(TokenType.RIGHT_PAREN, "Expect ) after arguments")
        return new Call(callee, paren, argus)
    }

    private primary(): Expr {
        if (this.matchAny(TokenType.FALSE)) return new Literal(false);
        if (this.matchAny(TokenType.TRUE)) return new Literal(true);
        if (this.matchAny(TokenType.NIL)) return new Literal(null);
    
        if (this.matchAny(TokenType.NUMBER, TokenType.STRING)) {
          return new Literal(this.previous().literal);
        }

        if (this.matchAny(TokenType.IDENTIFIER)) {
            return new Variable(this.previous())
        }
    
        if (this.matchAny(TokenType.LEFT_PAREN)) {
          const expr = this.expression();
          this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
          return new Grouping(expr);
        }

        throw this.error(this.peek(), "Expect expression")
    }

    private matchAny(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance()
                return true
            }
        }

        return false
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false
        return this.peek().type == type
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++
        return this.previous()
    }

    private isAtEnd(): boolean {
        return this.current == this.tokens.length - 1
    }

    private peek(): Token {
        // @ts-ignore
        return this.tokens[this.current]
    }

    private previous(): Token {
        // @ts-ignore
        return this.tokens[this.current - 1]
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance()
        throw this.error(this.peek(), message)
    }

    private error(token: Token, message: string): ParseError {
        Slang.tokenError(this.peek(), message)
        return new ParseError()
    }

    private synchronize(): void {
        this.advance()
        while (!this.isAtEnd()) {
            if (this.previous().type == TokenType.SEMICOLON) return

            switch (this.peek().type) {
                case TokenType.CLASS:
                case TokenType.FUN:
                case TokenType.VAR:
                case TokenType.FOR:
                case TokenType.IF:
                case TokenType.WHILE:
                case TokenType.PRINT:
                case TokenType.RETURN:
                  return;
              }
        
              this.advance();
        }
    }
}