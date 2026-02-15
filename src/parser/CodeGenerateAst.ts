import * as fs from 'fs'

function generate_ast(args: string[]): void {
    if (args.length != 1) {
        console.log("Usage: ts-node src/parser/CodeGenerateAst.ts {output_directory}")
        process.exit(1)
    }

    const outputDir = args[0] || "src/parser"
    defineAst(outputDir, "Expr", new Map<string, string>(Object.entries({
        "Binary": "Expr left, Token operator, Expr right",
        "Grouping": "Expr expression",
        "Literal": "Object value",
        "Unary": "Token operator, Expr right"
    })))
}

// TODO: fix this lol
function defineAst(outputDir: string, baseName: string, types: Map<string, string>): void {
    const path = outputDir + "/" + baseName + ".ts"
    const typeUnions = createTypeUnionString(types)
    fs.writeFileSync(path, `type ${baseName} = ${typeUnions}\n`)

    const typeStrings = createTypeStrings(types)
    for (const typeString of typeStrings) {
        fs.writeFileSync(path, `${typeString}\n`)
    }
}

function createTypeStrings(types: Map<string, string>): string[] {
    const typeStrings: string[] = []
    for (const type of types) {
        const [typeName, typeFields] = type

        const typeString: string[] = []
        typeString.push(`type ${typeName} = {\n`)
        typeString.push(`\tkind: "${typeName}",\n`)
        typeString.push('}')

        typeStrings.push(typeString.join(""))
    }

    return typeStrings
}

function createTypeUnionString(types: Map<string, string>): string {
    return Array.from(types.keys()).join(" | ")
}

generate_ast(process.argv.slice(2))