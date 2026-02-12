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
    private readonly keywords: Map<string, TokenType>

    public constructor(source: string) {
        this.source = source
        this.tokens = []
        this.start = 0
        this.current = 0
        this.line = 1
        this.keywords = new Map<string, TokenType>()
        this.keywords.set("and",   TokenType.AND);
        this.keywords.set("class", TokenType.CLASS);
        this.keywords.set("else",  TokenType.ELSE);
        this.keywords.set("false", TokenType.FALSE);
        this.keywords.set("for",   TokenType.FOR);
        this.keywords.set("fun",   TokenType.FUN);
        this.keywords.set("if",    TokenType.IF);
        this.keywords.set("nil",   TokenType.NIL);
        this.keywords.set("or",    TokenType.OR);
        this.keywords.set("print", TokenType.PRINT);
        this.keywords.set("return", TokenType.RETURN);
        this.keywords.set("super", TokenType.SUPER);
        this.keywords.set("this",  TokenType.THIS);
        this.keywords.set("true",  TokenType.TRUE);
        this.keywords.set("var",   TokenType.VAR);
        this.keywords.set("while", TokenType.WHILE);

    }

    public scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current
            this.scanToken()
        }

        this.tokens.push(new Token(TokenType.EOF, "", null, this.line))
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
            case "\"":  
                this.string()
                break
            default:
                if (this.isDigit(c)) {
                    this.number()
                } else if (this.isAlpha(c)) {
                    this.identifier()
                } else {
                    Slang.error(this.line, `Unsupported character: ${c}`)
                    break;
                }
        }
    }

    private identifier(): void {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance()
        }

        const identifierText = this.source.substring(this.start, this.current)
        let identifierTokenType = this.keywords.get(identifierText)
        if (!identifierTokenType) {
            identifierTokenType = TokenType.IDENTIFIER
        }

        this.addToken(identifierTokenType)
    }

    private number(): void {
        while (this.isDigit(this.peek())) {
            this.advance()
        }

        if (this.peek() === "." && this.isDigit(this.peekNext())) {
            this.advance()
            while (this.isDigit(this.peek())) {
                this.advance()
            }            
        }

        const numValue = Number(this.source.substring(this.start, this.current))
        this.addTokenImpl(TokenType.NUMBER, numValue)
    }

    private isAlphaNumeric(char: string) {
        return this.isDigit(char) || this.isAlpha(char)
    }

    private isDigit(char: string): boolean {
        return char >= "0" && char <= "9"
    }

    private isAlpha(char: string): boolean {
        return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char == "_"
    }

    private string(): void {
        while (!this.isAtEnd() && this.peek() != "\"") {
            if (this.peek() == "\n") {
                this.line++
            }
            this.advance()
        }
        
        if (this.isAtEnd()) {
            Slang.error(this.line, "Unterminated string")
            return
        }

        this.advance()

        const stringValue: string = this.source.substring(this.start + 1, this.current - 1)
        this.addTokenImpl(TokenType.STRING, stringValue)
    }

    private peekNext(): string {
        if (this.current + 1 >= this.source.length) {
            return "\0"
        }
        return this.source.charAt(this.current + 1)
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

    private addTokenImpl(tokenType: TokenType, literal: Object | null): void {
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
        const current_char = this.source.charAt(this.current)
        this.current++
        return current_char
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length
    }
}
