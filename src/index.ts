import * as fs from 'fs';
import * as readline from 'readline';
import { Token } from './Token';
import { Scanner } from './Scanner';

export class Slang {
    hadError: boolean = false
    public constructor(args: string[]) {
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
        if (this.hadError) {
            process.exit(1)
        }
    }

    private run(sourceCode: string): void {
        const scanner = new Scanner(sourceCode)
        const tokens: Token[] = scanner.scanTokens()
        for (const token of tokens) {
            console.log(token.toString())
        }
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
            console.log(`Line: ${line}`);
            this.run(line)
            this.hadError = false
        });
    }

    static error(line: number, message: string): void {
        this.report(line, "", message)
    }

    private static report(line: number, where: string, message: string): void {
        console.log(`Line ${line}: Error ${where}: ${message}`)
    }    

}

const slang = new Slang(process.argv.slice(2))