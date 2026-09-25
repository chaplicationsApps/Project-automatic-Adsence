"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Copy, Link2, RotateCcw, ShieldCheck } from "lucide-react";
import type { ToolDefinition, ToolInput } from "@/lib/tools/schema";
import { calculateTool } from "@/lib/tools/evaluate";
import { trackToolEvent, type ToolEvent } from "@/lib/analytics";

function initialInputs(tool: ToolDefinition) {
  return Object.fromEntries(tool.inputs.map((input) => [input.id, input.defaultValue ?? ""]));
}

function formattedValue(value: number, decimals: number) {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: decimals }).format(value);
}

export function ToolCalculator({ tool, compact = false }: { tool: ToolDefinition; compact?: boolean }) {
  const instanceId = useId();
  const [inputs, setInputs] = useState<Record<string, string>>(() => initialInputs(tool));
  const [result, setResult] = useState(() => calculateTool(tool, initialInputs(tool)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const started = useRef(false);
  const viewed = useRef("");
  const { slug, category, version } = tool;

  useEffect(() => {
    const identity = `${slug}:${version}`;
    if (viewed.current === identity) return;
    viewed.current = identity;
    trackToolEvent("tool_view", { tool_slug: slug, category, version });
  }, [slug, category, version]);

  function track(event: ToolEvent) {
    trackToolEvent(event, { tool_slug: slug, category, version });
  }

  function startInteraction() {
    if (started.current) return;
    started.current = true;
    track("tool_start");
  }

  function updateInput(id: string, value: string) {
    startInteraction();
    setInputs((previous) => ({ ...previous, [id]: value }));
    setErrors((previous) => ({ ...previous, [id]: "", _form: "" }));
    setDirty(true);
    setCopyStatus("");
  }

  function validateInput(id: string) {
    const checked = calculateTool(tool, inputs);
    setErrors((previous) => ({ ...previous, [id]: checked.ok ? "" : checked.errors[id] ?? "" }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startInteraction();
    track("tool_submit");
    const calculated = calculateTool(tool, inputs);
    setResult(calculated);
    setCopyStatus("");
    if (calculated.ok) {
      setErrors({});
      setDirty(false);
      setHasCalculated(true);
      track("tool_complete");
    } else {
      setErrors(calculated.errors);
      track("tool_error");
      const firstInvalid = tool.inputs.find((input) => calculated.errors[input.id]);
      if (firstInvalid) {
        const field = event.currentTarget.elements.namedItem(firstInvalid.id);
        if (field instanceof HTMLElement) field.focus();
      }
    }
  }

  function reset() {
    const defaults = initialInputs(tool);
    setInputs(defaults);
    setResult(calculateTool(tool, defaults));
    setErrors({});
    setDirty(false);
    setHasCalculated(false);
    setCopyStatus("");
    setShareStatus("");
    started.current = false;
  }

  async function copyResult() {
    if (!result.ok || dirty) return;
    const text = tool.outputs.map((output) => `${output.label}: ${formattedValue(result.values[output.id], output.decimals)}${output.unit ? ` ${output.unit}` : ""}`).join("\n");
    try {
      await navigator.clipboard.writeText(`${tool.title}\n${text}`);
      setCopyStatus("Resultado copiado");
      track("result_copy");
    } catch {
      setCopyStatus("No se pudo copiar. Puedes seleccionar el resultado y copiarlo manualmente.");
    }
  }

  async function copyToolLink() {
    track("share_click");
    const url = new URL(`/herramientas/${encodeURIComponent(slug)}`, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("Enlace copiado. Incluye solo la herramienta, sin tus datos.");
    } catch {
      setShareStatus("No se pudo copiar el enlace. Puedes copiar la dirección de esta página desde tu navegador.");
    }
  }

  function renderField(input: ToolInput) {
    const fieldId = `${instanceId}-${input.id}`;
    const describedBy = [input.unit ? `${fieldId}-unit` : "", input.helpText && !compact ? `${fieldId}-help` : "", errors[input.id] ? `${fieldId}-error` : ""].filter(Boolean).join(" ") || undefined;
    const shared = {
      id: fieldId,
      name: input.id,
      value: inputs[input.id] ?? "",
      required: input.required,
      "aria-invalid": !!errors[input.id],
      "aria-describedby": describedBy,
      onBlur: () => validateInput(input.id),
    };
    return (
      <div className="calculator-field" key={input.id}>
        <label htmlFor={fieldId}>{input.label}</label>
        <div className={`field-control${input.unit ? " field-with-unit" : ""}`}>
          {input.type === "select" ? (
            <select {...shared} onChange={(event) => updateInput(input.id, event.target.value)}><option value="" disabled>Elige una opción</option>{input.options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select>
          ) : (
            <input {...shared} type={input.type === "date" ? "date" : "text"} inputMode={input.type === "date" ? undefined : input.type === "integer" ? "numeric" : "decimal"} placeholder={input.placeholder} autoComplete="off" onChange={(event) => updateInput(input.id, event.target.value)} />
          )}
          {input.unit ? <span className="field-unit" id={`${fieldId}-unit`}>{input.unit}</span> : null}
        </div>
        {input.helpText && !compact ? <p id={`${fieldId}-help`} className="field-help">{input.helpText}</p> : null}
        {errors[input.id] ? <p id={`${fieldId}-error`} className="field-error">{errors[input.id]}</p> : null}
      </div>
    );
  }

  return (
    <div className={`calculator${compact ? " calculator-compact" : ""}`}>
      <form className="calculator-form" noValidate onSubmit={handleSubmit}>
        {!compact ? <div className="calculator-form-heading"><span className="eyebrow">Tus datos</span><button className="text-button" type="button" onClick={reset}><RotateCcw size={14} aria-hidden="true" />Restablecer</button></div> : null}
        <div className="calculator-fields">{tool.inputs.map(renderField)}</div>
        {errors._form ? <p className="field-error" role="alert">{errors._form}</p> : null}
        <button type="submit" className="button button-primary calculator-submit">Calcular <ArrowRight size={18} aria-hidden="true" /></button>
        {!compact ? <p className="calculator-privacy"><ShieldCheck size={14} aria-hidden="true" />El cálculo se realiza en tu dispositivo.</p> : null}
      </form>
      <div className="calculator-result" aria-live="polite" aria-atomic="true">
        <div className="result-heading"><span className="eyebrow">{hasCalculated ? "Tu resultado" : "Resultado de ejemplo"}</span>{result.ok && !dirty ? <span className="result-check"><Check size={14} aria-hidden="true" /></span> : null}</div>
        {result.ok ? (
          <div className={`result-values${dirty ? " result-stale" : ""}`}>{(compact ? tool.outputs.slice(0, 1) : tool.outputs).map((output, index) => <div className={`result-item${index === 0 ? " result-primary" : ""}`} key={output.id}><span className="result-label">{output.label}</span><p className="result-number"><span>{formattedValue(result.values[output.id], output.decimals)}</span>{output.unit ? <span className="result-unit">{output.unit}</span> : null}</p>{output.description && !compact ? <p className="result-description">{output.description}</p> : null}</div>)}</div>
        ) : <p className="result-placeholder">Revisa los datos para obtener tu resultado.</p>}
        <p className="result-note">{dirty ? "Has cambiado los datos. Pulsa Calcular para actualizar." : hasCalculated ? "Listo. Así de sencillo." : "Cambia los valores y hazlo tuyo."}</p>
        {!compact ? <div className="result-actions">{result.ok ? <button className="copy-button" type="button" onClick={copyResult} disabled={dirty}>{copyStatus === "Resultado copiado" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}{copyStatus === "Resultado copiado" ? "Resultado copiado" : "Copiar resultado"}</button> : null}<button className="copy-button" type="button" onClick={copyToolLink}><Link2 size={16} aria-hidden="true" />Copiar enlace</button></div> : null}
        {copyStatus && copyStatus !== "Resultado copiado" ? <p className="copy-feedback" role="status">{copyStatus}</p> : null}
        {shareStatus ? <p className="copy-feedback" role="status">{shareStatus}</p> : null}
      </div>
    </div>
  );
}
