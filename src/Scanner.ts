import { Token } from "./Token"
import { TokenType } from "./TokenType"
import { Slang } from "."
import { isatty } from "node:tty"

export class Scanner {
    private readonly source: string
    private readonly tokens: Token[]
    private start: number
    private current: number
    private line: number

    public constructor(source: string) {
        this.source = source
        this.tokens = []
        this.start = 0
        this.current = 0
        this.line = 1
    }

    public scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current
            this.scanToken()
        }

        this.tokens.push(new Token(TokenType.EOF, "", null, line))
        return this.tokens
    }

    private scanToken(): void {
        const c: string = this.advance()
        switch (c) {
            case "(": 
                this.addToken(TokenType.LEFT_PAREN)
                break
            case ")": 
                this.addToken(TokenType.RIGHT_PAREN)
                break
            case "{": 
                this.addToken(TokenType.LEFT_BRACE)
                break
            case "}": 
                this.addToken(TokenType.RIGHT_BRACE)
                break
            case ",": 
                this.addToken(TokenType.COMMA)
                break
            case ".": 
                this.addToken(TokenType.DOT)
                break
            case "-": 
                this.addToken(TokenType.MINUS)
                break
            case "+": 
                this.addToken(TokenType.PLUS)
                break
            case ";": 
                this.addToken(TokenType.SEMICOLON)
                break
            case "*": 
                this.addToken(TokenType.STAR)
                break
            case '!':
                this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
                break;
            case '=':
                this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
                break;
            case '<':
                this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
                break;
            case '>':
                this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
                break;
            case "/":
                if (this.match("/")) {
                    // go to the end of the line
                    while (!this.isAtEnd() && this.peek() != '\n') {
                        this.advance()
                    }
                } else {
                    this.addToken(TokenType.SLASH)
                }
                break;
            case ' ':
            case '\r':
            case '\t':
                // Ignore whitespace.
                break;
            case '\n':
                this.line++;
                break;
            default:
                Slang.error(this.line, `Unsupported character: ${c}`)
                break;
        }
    }

    private peek(): string {
        if (this.isAtEnd()) {
            return "\0"
        }
        return this.source.charAt(this.current)
    }

    private addToken(tokenType: TokenType): void {
        this.addTokenImpl(tokenType, null)
    }

    private addTokenImpl(tokenType: TokenType, literal: object): void {
        const text: string = this.source.substring(this.start, this.current)
        this.tokens.push(new Token(tokenType, text, literal, this.line))
    }

    private match(expected: string): boolean {
        if (this.isAtEnd() || this.source.charAt(this.current) != expected) {
            return false
        }
        
        this.current++
        return true
    }

    private advance(): string {
        this.current++
        return this.source.charAt(this.current)
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length
    }
}
