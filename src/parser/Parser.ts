import { Slang } from "..";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { Assign, Binary, Expr, Grouping, Literal, Unary, Variable } from "./Expr";
import { Block, Expression, Print, Stmt, Var } from "./Stmt";

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
            if (this.matchAny(TokenType.VAR)) {
                return this.varDeclaration()
            }

            return this.statement()
        } catch (error) {
            this.synchronize()
            return null
        }
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
        if (this.matchAny(TokenType.PRINT)) {
            return this.printStatement()
        }

        if (this.matchAny(TokenType.LEFT_BRACE)) {
            return new Block(this.block())
        }

        return this.expressionStatement()
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
        let expr = this.equality()

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

        return this.primary()
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