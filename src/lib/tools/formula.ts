/** A deliberately small arithmetic language. No JavaScript is interpreted. */
export const FORMULA_LIMITS = Object.freeze({
  characters: 1024,
  tokens: 256,
  depth: 32,
  operations: 256,
  exponent: 100,
});

export class FormulaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormulaError";
  }
}

type Operator = "+" | "-" | "*" | "/" | "%" | "^" | "<" | ">" | "<=" | ">=" | "==" | "!=";
type FormulaNode =
  | { kind: "number"; value: number }
  | { kind: "variable"; name: string }
  | { kind: "unary"; operator: "+" | "-"; value: FormulaNode }
  | { kind: "binary"; operator: Operator; left: FormulaNode; right: FormulaNode }
  | { kind: "call"; name: string; args: FormulaNode[] };

type Token = { kind: "number" | "identifier" | "symbol" | "end"; value: string };

const functionArity: Readonly<Record<string, readonly [number, number]>> = Object.freeze({
  round: [1, 2], floor: [1, 1], ceil: [1, 1], abs: [1, 1],
  min: [1, 16], max: [1, 16], pow: [2, 2], sqrt: [1, 1],
  log: [1, 1], exp: [1, 1], if: [3, 3],
});

export function isSafeIdentifier(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_]{0,47}$/.test(value)
    && !["constructor", "prototype", "__proto__", "globalThis", "window", "document", "process", "require", "import", "eval", "Function"].includes(value)
    && !Object.hasOwn(functionArity, value);
}

function finite(value: number): number {
  if (!Number.isFinite(value)) throw new FormulaError("El cálculo no produce un número finito.");
  return Object.is(value, -0) ? 0 : value;
}

function tokenize(source: string): Token[] {
  if (source.length === 0 || source.length > FORMULA_LIMITS.characters) {
    throw new FormulaError("La fórmula está vacía o supera el límite de longitud.");
  }
  const tokens: Token[] = [];
  let position = 0;
  while (position < source.length) {
    const rest = source.slice(position);
    const whitespace = /^\s+/.exec(rest);
    if (whitespace) { position += whitespace[0].length; continue; }
    const number = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(rest);
    const identifier = /^[a-zA-Z][a-zA-Z0-9_]*/.exec(rest);
    const symbol = /^(?:<=|>=|==|!=|[+\-*/%^(),<>])/.exec(rest);
    const match = number ?? identifier ?? symbol;
    if (!match) throw new FormulaError("La fórmula contiene un carácter no permitido.");
    tokens.push({ kind: number ? "number" : identifier ? "identifier" : "symbol", value: match[0] });
    position += match[0].length;
    if (tokens.length > FORMULA_LIMITS.tokens) throw new FormulaError("La fórmula tiene demasiados elementos.");
  }
  tokens.push({ kind: "end", value: "" });
  return tokens;
}

const binding: Readonly<Record<string, readonly [number, number]>> = {
  "<": [5, 6], ">": [5, 6], "<=": [5, 6], ">=": [5, 6], "==": [5, 6], "!=": [5, 6],
  "+": [10, 11], "-": [10, 11], "*": [20, 21], "/": [20, 21], "%": [20, 21], "^": [30, 30],
};

function parse(source: string): FormulaNode {
  const tokens = tokenize(source);
  let cursor = 0;
  const peek = () => tokens[cursor]!;
  const next = () => tokens[cursor++]!;
  const expect = (value: string) => {
    if (next().value !== value) throw new FormulaError(`Se esperaba «${value}».`);
  };
  function expression(minBinding = 0, depth = 0): FormulaNode {
    if (depth > FORMULA_LIMITS.depth) throw new FormulaError("La fórmula supera la profundidad máxima.");
    const token = next();
    let left: FormulaNode;
    if (token.kind === "number") {
      left = { kind: "number", value: finite(Number(token.value)) };
    } else if (token.value === "+" || token.value === "-") {
      left = { kind: "unary", operator: token.value, value: expression(25, depth + 1) };
    } else if (token.value === "(") {
      left = expression(0, depth + 1);
      expect(")");
    } else if (token.kind === "identifier") {
      if (peek().value === "(") {
        if (!Object.hasOwn(functionArity, token.value)) throw new FormulaError("La función no está permitida.");
        next();
        const args: FormulaNode[] = [];
        if (peek().value !== ")") {
          do {
            args.push(expression(0, depth + 1));
            if (peek().value !== ",") break;
            next();
          } while (true);
        }
        expect(")");
        const [minimum, maximum] = functionArity[token.value]!;
        if (args.length < minimum || args.length > maximum) throw new FormulaError("Número de argumentos incorrecto.");
        left = { kind: "call", name: token.value, args };
      } else {
        if (!isSafeIdentifier(token.value)) throw new FormulaError("El nombre de variable no está permitido.");
        left = { kind: "variable", name: token.value };
      }
    } else {
      throw new FormulaError("La fórmula contiene una expresión incompleta.");
    }
    while (peek().kind === "symbol" && Object.hasOwn(binding, peek().value)) {
      const operator = peek().value as Operator;
      const [leftBinding, rightBinding] = binding[operator]!;
      if (leftBinding < minBinding) break;
      next();
      left = { kind: "binary", operator, left, right: expression(rightBinding, depth + 1) };
    }
    return left;
  }
  const tree = expression();
  if (peek().kind !== "end") throw new FormulaError("Hay elementos inesperados al final de la fórmula.");
  // Pratt parsing can build deep left-associated trees without deep recursion.
  checkTree(tree);
  return tree;
}

function checkTree(node: FormulaNode, allowedVariables?: ReadonlySet<string>, depth = 0): void {
  if (depth > FORMULA_LIMITS.depth) throw new FormulaError("La fórmula supera la profundidad máxima.");
  if (node.kind === "variable" && allowedVariables && !allowedVariables.has(node.name)) {
    throw new FormulaError(`Variable desconocida: ${node.name}.`);
  }
  if (node.kind === "unary") checkTree(node.value, allowedVariables, depth + 1);
  if (node.kind === "binary") {
    checkTree(node.left, allowedVariables, depth + 1);
    checkTree(node.right, allowedVariables, depth + 1);
  }
  if (node.kind === "call") node.args.forEach((arg) => checkTree(arg, allowedVariables, depth + 1));
}

export function validateFormula(source: string, allowedVariables: readonly string[]): void {
  checkTree(parse(source), new Set(allowedVariables));
}

function power(base: number, exponent: number): number {
  if (Math.abs(exponent) > FORMULA_LIMITS.exponent) throw new FormulaError("El exponente supera el límite permitido.");
  if (base === 0 && exponent < 0) throw new FormulaError("No se puede dividir entre cero.");
  return finite(Math.pow(base, exponent));
}

export function evaluateFormula(source: string, variables: Readonly<Record<string, number>>): number {
  const tree = parse(source);
  checkTree(tree, new Set(Object.keys(variables)));
  let operations = 0;
  const evaluate = (node: FormulaNode): number => {
    if (++operations > FORMULA_LIMITS.operations) throw new FormulaError("El cálculo supera el límite de operaciones.");
    if (node.kind === "number") return node.value;
    if (node.kind === "variable") {
      if (!Object.hasOwn(variables, node.name)) throw new FormulaError("Falta un valor de entrada.");
      return finite(variables[node.name]!);
    }
    if (node.kind === "unary") return finite((node.operator === "-" ? -1 : 1) * evaluate(node.value));
    if (node.kind === "binary") {
      const left = evaluate(node.left);
      const right = evaluate(node.right);
      switch (node.operator) {
        case "+": return finite(left + right);
        case "-": return finite(left - right);
        case "*": return finite(left * right);
        case "/": if (right === 0) throw new FormulaError("No se puede dividir entre cero."); return finite(left / right);
        case "%": if (right === 0) throw new FormulaError("No se puede dividir entre cero."); return finite(left % right);
        case "^": return power(left, right);
        case "<": return Number(left < right);
        case ">": return Number(left > right);
        case "<=": return Number(left <= right);
        case ">=": return Number(left >= right);
        case "==": return Number(left === right);
        case "!=": return Number(left !== right);
      }
    }
    // Lazy branching allows explicit protection against invalid operations.
    if (node.name === "if") return evaluate(node.args[evaluate(node.args[0]!) !== 0 ? 1 : 2]!);
    const args = node.args.map(evaluate);
    const first = args[0]!;
    switch (node.name) {
      case "round": {
        const decimals = args[1] ?? 0;
        if (!Number.isInteger(decimals) || decimals < 0 || decimals > 12) throw new FormulaError("El redondeo admite entre 0 y 12 decimales.");
        const factor = 10 ** decimals;
        return finite(Math.round(finite(first * factor)) / factor);
      }
      case "floor": return Math.floor(first);
      case "ceil": return Math.ceil(first);
      case "abs": return Math.abs(first);
      case "min": return Math.min(...args);
      case "max": return Math.max(...args);
      case "pow": return power(first, args[1]!);
      case "sqrt": return finite(Math.sqrt(first));
      case "log": return finite(Math.log(first));
      case "exp":
        if (Math.abs(first) > FORMULA_LIMITS.exponent) throw new FormulaError("El exponente supera el límite permitido.");
        return finite(Math.exp(first));
      default: throw new FormulaError("La función no está permitida.");
    }
  };
  return finite(evaluate(tree));
}
