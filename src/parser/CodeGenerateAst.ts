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

    lines.push(`// NOTE: This file is codegened! To update the structure of the AST, update the CodeGenerateAst file"\n`)
    lines.push(`import { Token } from "../lexer/Token"\n\n`)

    lines.push(defineVisitor(baseName, types))
    lines.push("\n")

    lines.push(`export abstract class ${baseName} {\n`)
    lines.push(`  abstract accept<R>(visitor: Visitor<R>): R;\n`)
    lines.push(`}\n\n`)

    for (const type of types) {
        const [classNameRaw, fieldsRaw] = type.split(":")
        if (!classNameRaw || !fieldsRaw) continue

        const className = classNameRaw.trim()
        const fieldList = fieldsRaw.trim().split(", ").map(f => f.trim())

        lines.push(defineType(baseName, className, fieldList))
    }

    fs.writeFileSync(filePath, lines.join(""))
}

function defineVisitor(
    baseName: string,
    types: string[]
): string {
    const lines: string[] = []

    lines.push(`export interface Visitor<R> {\n`)

    for (const type of types) {
        const [classNameRaw] = type.split(":")
        if (!classNameRaw) continue

        const typeName = classNameRaw.trim()
        const paramName = baseName.toLowerCase()

        lines.push(
            `  visit${typeName}${baseName}(${paramName}: ${typeName}): R;\n`
        )
    }

    lines.push(`}\n`)

    return lines.join("")
}

function defineType(
    baseName: string,
    className: string,
    fieldList: string[]
): string {
    const lines: string[] = []

    lines.push(`export class ${className} extends ${baseName} {\n`)

    for (const field of fieldList) {
        const [type, name] = field.split(" ")
        lines.push(`  ${name}: ${type};\n`)
    }

    lines.push(`\n`)

    const constructorParams = fieldList
        .map(field => {
            const [type, name] = field.split(" ")
            return `${name}: ${type}`
        })
        .join(", ")

    lines.push(`  constructor(${constructorParams}) {\n`)
    lines.push(`    super();\n`)

    for (const field of fieldList) {
        const [, name] = field.split(" ")
        lines.push(`    this.${name} = ${name};\n`)
    }

    lines.push(`  }\n\n`)

    lines.push(`  accept<R>(visitor: Visitor<R>): R {\n`)
    lines.push(
        `    return visitor.visit${className}${baseName}(this);\n`
    )
    lines.push(`  }\n`)

    lines.push(`}\n\n`)

    return lines.join("")
}

generate_ast(process.argv.slice(2))
