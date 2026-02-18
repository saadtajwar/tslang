import * as fs from 'fs';
import * as readline from 'readline';
import { Token } from './lexer/Token';
import { Scanner } from './lexer/Scanner';
import { TokenType } from './lexer/TokenType'
import { Parser } from './parser/Parser';
import { AstPrinter } from './parser/AstPrinter';
import { RuntimeError, Interpreter } from './parser/Interpreter';

export class Slang {
    static hadError: boolean
    static hadRuntimeError: boolean
    private static readonly interpreter = new Interpreter()
    public constructor(args: string[]) {
        Slang.hadError = false
        Slang.hadRuntimeError = false

        if (args.length > 2) {
            console.log("Usage: ts-node src/index.ts slang file")
        } else if (args.length == 2 && args[1]) {
            this.runFile(args[1])
        } else {
            this.runPrompt()
        }
    }

    private runFile(path: string): void {
        const data: Buffer = fs.readFileSync(path);
        this.run(data.toString())
        if (Slang.hadError) {
            process.exit(1)
        }
        if (Slang.hadRuntimeError) {
            process.exit(1)
        }
    }

    private run(sourceCode: string): void {
        const scanner = new Scanner(sourceCode)
        const tokens: Token[] = scanner.scanTokens()

        const parser = new Parser(tokens)
        const expression = parser.parse()
        if (Slang.hadError || !expression) return

        Slang.interpreter.interpret(expression)
    }

    private runPrompt(): void {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.on('line', (line) => {
            if (!line) {
                return
            }
            this.run(line)
            Slang.hadError = false
        });
    }

    static error(line: number, message: string): void {
        this.report(line, "", message)
    }

    static tokenError(token: Token, message: string): void {
        if (token.type == TokenType.EOF) {
            this.report(token.line, " at end", message);
          } else {
            this.report(token.line, " at '" + token.lexeme + "'", message);
          }      
    }

    static runtimeError(error: RuntimeError): void {
        console.log(error.getMessage() + `\nline [${error.token.line}]`)
        Slang.hadRuntimeError = true
    }

    private static report(line: number, where: string, message: string): void {
        console.log(`Line ${line}: Error ${where}: ${message}`)
    }    

}

const slang = new Slang(process.argv.slice(2))