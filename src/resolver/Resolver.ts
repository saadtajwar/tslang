import { Slang } from "..";
import { Interpreter } from "../interpreter/Interpreter";
import { Token } from "../lexer/Token";
import { Assign, Binary, Call, Expr, Visitor as ExprVisitor, Grouping, Literal, Logical, Unary, Variable } from "../parser/Expr";
import { Block, Expression, Function, If, Print, Return, Stmt, Visitor as StmtVisitor, Var, While } from "../parser/Stmt"

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

    public visitVariableExpr(expr: Variable): void {
        if (this.scopeStack.length === 0 && this.scopeStack.at(-1)?.get(expr.name.lexeme) == false) {
            Slang.error(0, "Cant read local variable in its own initializer")
        }

        this.resolveLocal(expr, expr.name)
    }

    private resolveLocal(expr: Expr, name: Token): void {
        for (let i = this.scopeStack.length - 1; i >= 0; i--) {
            if (this.scopeStack.at(i)?.has(name.lexeme)) {
                this.interpreter.resolve(expr, this.scopeStack.length - 1 - i)
                return
            }
        }
    }

    public visitFunctionStmt(stmt: Function): void {
        this.declare(stmt.name)
        this.define(stmt.name)

        this.resolveFunction(stmt)
    }

    private resolveFunction(fnction: Function): void {
        this.beginScope()
        for (const param of fnction.params) {
            this.declare(param)
            this.define(param)
        }
        this.resolveStatements(fnction.body)
        this.endScope()
    }

    public visitExpressionStmt(stmt: Expression): void {
        this.resolveExpr(stmt.expression)
    }

    public visitIfStmt(stmt: If): void {
        this.resolveExpr(stmt.condition)
        this.resolveStatements([stmt.thenBranch])
        if (stmt.elseBranch) {
            this.resolveStatements([stmt.elseBranch])
        }
    }

    public visitPrintStmt(stmt: Print): void {
        this.resolveExpr(stmt.expression)
    }

    visitReturnStmt(stmt: Return): void {
        if (stmt.value) {
            this.resolveExpr(stmt.value)
        }
    }

    visitWhileStmt(stmt: While): void {
        this.resolveExpr(stmt.condition)
        this.resolveStatements([stmt.body])
    }

    visitBinaryExpr(expr: Binary): void {
        this.resolveExpr(expr.left)
        this.resolveExpr(expr.right)
    }

    visitCallExpr(expr: Call): void {
        this.resolveExpr(expr.callee)

        for (const argu of expr.argus) {
            this.resolveExpr(argu)
        }
    }

    visitGroupingExpr(expr: Grouping): void {
        this.resolveExpr(expr.expression)
    }

    visitLiteralExpr(expr: Literal): void {
        return
    }

    visitLogicalExpr(expr: Logical): void {
        this.resolveExpr(expr.left)
        this.resolveExpr(expr.right)
    }

    visitUnaryExpr(expr: Unary): void {
        this.resolveExpr(expr.right)
    }

    public visitAssignExpr(expr: Assign): void {
        this.resolveExpr(expr.value)
        this.resolveLocal(expr, expr.name)
    }

    private beginScope(): void {
        this.scopeStack.push({} as Map<string, boolean>)
    }

    private endScope(): void {
        this.scopeStack.pop()
    }
}