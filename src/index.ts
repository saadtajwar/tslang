import * as fs from 'fs';
import * as readline from 'readline';
import { CLIENT_RENEG_LIMIT } from 'tls';

class Scanner {}
class Token {}

class Slang {
    hadError: boolean = false
    constructor(args: string[]) {
            if (args.length > 2) {
                console.log("Usage: ts-node src/index.ts slang file")
            } else if (args.length == 2 && args[1]) {
                this.runFile(args[1])
            } else {
                this.runPrompt()
            }
    }

    runFile(path: string) {
        const data: Buffer = fs.readFileSync(path);
        this.run(data.toString())
        if (this.hadError) {
            process.exit(1)
        }
    }

    run(sourceCode: string) {
        const scanner = new Scanner(sourceCode)
        const tokens: []Token = scanner.scanTokens()
        for (const token of tokens) {
            console.log(token)
        }
    }

    runPrompt() {
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

    error(line: number, message: string) {
        this.report(line, "", message)
    }

    report(line: number, where: string, message: string) {
        console.log(`Line ${line}: Error ${where}: ${message}`)
    }    

}

const slang = new Slang(process.argv.slice(2))