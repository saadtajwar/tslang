import { Interpreter } from "../interpreter/Interpreter";
import { Token } from "../lexer/Token";
import { Expr, Visitor as ExprVisitor } from "../parser/Expr";
import { Block, Stmt, Visitor as StmtVisitor, Var } from "../parser/Stmt"

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
    private readonly interpreter: Interpreter
    private readonly scopeStack: Map<string, boolean>[]

    constructor(interpreter: Interpreter) {
        this.interpreter = interpreter
        this.scopeStack = []
    }

    public visitBlockStmt(stmt: Block): void {
        this.beginScope()
        this.resolveStatements(stmt.statements)
        this.endScope()
    }

    public visitVarStmt(stmt: Var): void {
        this.declare(stmt.name)
        if (stmt.initializer) {
            this.resolveExpr(stmt.initializer)
        }
        this.define(stmt.name)
    }

    private declare(name: Token): void {
        if (this.scopeStack.length == 0) return
        const scope = this.scopeStack.at(-1) as Map<string, boolean>
        scope.set(name.lexeme, false)
    }

    private define(name: Token): void {
        if (this.scopeStack.length == 0) return
        (this.scopeStack.at(-1) as Map<string, boolean>).set(name.lexeme, true)
    }

    private resolveExpr(expr: Expr): void {        
        expr.accept(this)
    }

    private resolveStatements(statements: Stmt[]): void {
        for (const statement of statements) {
            statement.accept(this)
        }
    }

    private beginScope(): void {
        this.scopeStack.push({} as Map<string, boolean>)
    }

    private endScope(): void {
        this.scopeStack.pop()
    }
}