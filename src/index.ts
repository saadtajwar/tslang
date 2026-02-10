

function main(args: string[]) {
    if (args.length > 2) {
        console.log("Usage: ts-node src/index.ts slang file")
    } else if (args.length == 2) {
        runFile(args[1])
    } else {
        runPrompt()
    }
    
}

main(process.argv.slice(2))