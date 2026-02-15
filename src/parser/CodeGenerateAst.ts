import * as fs from 'fs'
import * as path from 'path'

function generate_ast(args: string[]): void {
    if (args.length !== 1) {
        console.log("Usage: ts-node src/parser/CodeGenerateAst.ts {output_directory}")
        process.exit(1)
    }

    const outputDir = args[0] || 'src/parser'

    defineAst(outputDir, "Expr", [
        "Binary   : Expr left, Token operator, Expr right",
        "Grouping : Expr expression",
        "Literal  : Object value",
        "Unary    : Token operator, Expr right"
    ])
}

function defineAst(
    outputDir: string,
    baseName: string,
    types: string[]
): void {
    const filePath = path.join(outputDir, `${baseName}.ts`)
    const lines: string[] = []

    lines.push(`import { Token } from "../lexer/Token"\n\n`)
    lines.push(`export abstract class ${baseName} {}\n\n`)

    for (const type of types) {
        const [classNameRaw, fieldsRaw] = type.split(":")
        if (!classNameRaw || !fieldsRaw) {
            continue
        }
        const className = classNameRaw.trim()
        const fieldList = fieldsRaw.trim()

        lines.push(defineType(baseName, className, fieldList))
    }

    fs.writeFileSync(filePath, lines.join(""))
}

function defineType(
    baseName: string,
    className: string,
    fieldList: string
): string {
    const lines: string[] = []

    const fields = fieldList.split(", ").map(f => f.trim())

    lines.push(`export class ${className} extends ${baseName} {\n`)

    for (const field of fields) {
        const [type, name] = field.split(" ")
        lines.push(`\treadonly ${name}: ${type};\n`)
    }

    lines.push(`\n`)

    const constructorParams = fields
        .map(field => {
            const [type, name] = field.split(" ")
            return `${name}: ${type}`
        })
        .join(", ")

    lines.push(`\tconstructor(${constructorParams}) {\n`)
    lines.push(`\t\tsuper();\n`)

    for (const field of fields) {
        const [, name] = field.split(" ")
        lines.push(`\t\tthis.${name} = ${name};\n`)
    }

    lines.push(`  }\n`)
    lines.push(`}\n\n`)

    return lines.join("")
}

generate_ast(process.argv.slice(2))
