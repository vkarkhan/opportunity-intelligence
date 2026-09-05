"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  Layers3,
  LoaderCircle,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import examples from "../../examples/opportunities.json";
import { analyzeOpportunity, type Analysis } from "../lib/api";

function List({ items, empty }: { items: string[]; empty: string }) {
  return items.length ? (
    <ul className="item-list">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  ) : (
    <p className="muted">{empty}</p>
  );
}

export default function Workspace() {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [analyzedText, setAnalyzedText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const stale = result && text !== analyzedText;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const brief = text.trim();
    if (
      brief.length < 30 ||
      brief.length > 20000 ||
      brief.split(/\s+/).length < 5 ||
      (brief.match(/\p{L}/gu) || []).length < 20
    ) {
      setError(
        "Enter 30–20,000 characters with at least five words and 20 letters.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      setResult(await analyzeOpportunity(brief));
      setAnalyzedText(text);
      requestAnimationFrame(() => resultHeading.current?.focus());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Analysis failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">
            <Layers3 size={21} />
          </span>
          Opportunity Intelligence<span className="version">WORKSPACE</span>
        </div>
        <span className="local-badge">
          <span /> Local analysis
        </span>
      </header>
      <main>
        <div className="page-heading">
          <div>
            <p className="eyebrow">FROM BRIEF TO CLARITY</p>
            <h1>Make your next move informed.</h1>
            <p className="subtitle">
              Structure the opportunity. Surface the unknowns. Decide what comes
              next.
            </p>
          </div>
          <span className="edition">FOUNDATION / 01</span>
        </div>
        <div className="workspace-grid">
          <section className="input-panel" aria-labelledby="input-title">
            <div className="panel-heading">
              <div className="section-label">
                <span className="step">01</span>
                <h2 id="input-title">Opportunity brief</h2>
              </div>
              <FileText size={18} className="muted" />
            </div>
            <form onSubmit={submit}>
              <label className="field-label" htmlFor="example">
                Start with an example
              </label>
              <select
                id="example"
                value={selected}
                disabled={busy}
                onChange={(e) => {
                  setSelected(e.target.value);
                  const example = examples.find((x) => x.id === e.target.value);
                  if (example) {
                    setText(example.text);
                    setError("");
                  }
                }}
              >
                <option value="">Choose a synthetic opportunity…</option>
                {examples.map((example) => (
                  <option key={example.id} value={example.id}>
                    {example.label}
                  </option>
                ))}
              </select>
              <div className="divider-label">
                <span />
                or paste your own
                <span />
              </div>
              <label className="field-label" htmlFor="brief">
                What’s the opportunity?
              </label>
              <textarea
                id="brief"
                value={text}
                disabled={busy}
                maxLength={20000}
                aria-describedby="brief-hint input-error"
                aria-invalid={Boolean(error)}
                onChange={(e) => {
                  setText(e.target.value);
                  setSelected("");
                  setError("");
                }}
                placeholder={
                  "Paste a job description, consulting enquiry, RFP or hackathon brief…\n\nInclude the scope, requirements, timeline and any constraints you have. More context makes the structure more useful."
                }
              />
              <div className="input-meta">
                <span id="brief-hint">30 characters minimum</span>
                <span>{text.length.toLocaleString()} / 20,000</span>
              </div>
              <p id="input-error" role="alert" className="error">
                {error}
              </p>
              <button
                className="analyze-button"
                disabled={busy || !text.trim()}
                type="submit"
              >
                {busy ? (
                  <>
                    <LoaderCircle size={18} className="spin" /> Analyzing
                    opportunity…
                  </>
                ) : (
                  <>
                    Analyze opportunity <ArrowRight size={18} />
                  </>
                )}
              </button>
              <button
                className="clear-button"
                type="button"
                disabled={busy || (!text && !result)}
                onClick={() => {
                  setText("");
                  setSelected("");
                  setResult(null);
                  setError("");
                }}
              >
                Clear workspace
              </button>
            </form>
            <div className="privacy-note">
              <ShieldCheck size={19} />
              <p>
                <strong>Local by design</strong>Your brief is processed by your
                local backend. Nothing is saved by this application.
              </p>
            </div>
          </section>

          <section
            className="results-panel"
            aria-labelledby="results-title"
            aria-busy={busy}
          >
            <div className="panel-heading">
              <div className="section-label">
                <span className="step">02</span>
                <h2 id="results-title" ref={resultHeading} tabIndex={-1}>
                  Opportunity intelligence
                </h2>
              </div>
              <span className="status-tag">
                {busy
                  ? "PROCESSING"
                  : result
                    ? "READY TO REVIEW"
                    : "AWAITING BRIEF"}
              </span>
            </div>
            <div role="status" className="sr-only">
              {busy
                ? "Analyzing with local rules."
                : result
                  ? "Analysis ready to review."
                  : "Paste a brief to begin."}
            </div>
            {stale && (
              <p className="stale-note">
                Your brief has changed. Analyze again to update these results.
              </p>
            )}
            {result ? (
              <div className="results-content">
                <div className="result-summary">
                  <span className="type-badge">{result.opportunity_type}</span>
                  <h3>{result.opportunity_title}</h3>
                  <p>{result.summary}</p>
                </div>
                <div className="metrics">
                  {[
                    [result.requirements.length, "Requirements"],
                    [result.missing_information.length, "Gaps to clarify"],
                    [result.risks.length, "Potential risks"],
                    [result.recommended_next_actions.length, "Next actions"],
                  ].map(([value, label]) => (
                    <div key={label}>
                      <strong>{value}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <section className="result-section">
                  <h3>
                    Requirements <span>{result.requirements.length}</span>
                  </h3>
                  {result.requirements.length ? (
                    <ul className="requirements">
                      {result.requirements.map((item, i) => (
                        <li key={i}>
                          <Check size={16} />
                          <div>
                            <p>{item.description}</p>
                            <div className="tags">
                              <span>{item.category}</span>
                              <span>{item.priority}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">
                      No explicit requirement keywords detected. Review the
                      source manually.
                    </p>
                  )}
                </section>
                <div className="result-columns">
                  <section className="result-section">
                    <h3>Constraints</h3>
                    <List
                      items={result.constraints}
                      empty="No constraint keywords detected."
                    />
                  </section>
                  <section className="result-section gap-section">
                    <h3>Missing information</h3>
                    <List
                      items={result.missing_information}
                      empty="All four checklist topics were mentioned. Verify their completeness."
                    />
                  </section>
                </div>
                <section className="result-section">
                  <h3>Potential risks</h3>
                  {result.risks.length ? (
                    <ul className="risk-list">
                      {result.risks.map((risk, i) => (
                        <li key={i}>
                          <span className={`severity ${risk.severity}`}>
                            {risk.severity}
                          </span>
                          {risk.description}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">
                      No rule-based flags detected. This does not establish that
                      the opportunity is risk-free.
                    </p>
                  )}
                </section>
                <section className="result-section">
                  <h3>Clarification questions</h3>
                  <List
                    items={result.clarification_questions}
                    empty="No checklist questions generated. Confirm details with the owner."
                  />
                </section>
                <section className="result-section actions">
                  <h3>
                    <ArrowUpRight size={18} /> Recommended next actions
                  </h3>
                  <ol>
                    {result.recommended_next_actions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ol>
                </section>
                <section className="result-section">
                  <h3>Assumptions</h3>
                  <List
                    items={result.assumptions}
                    empty="No assumptions listed."
                  />
                </section>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-art">
                  <ScanLine size={35} strokeWidth={1.3} />
                </div>
                <p className="eyebrow">A CLEARER STARTING POINT</p>
                <h3>
                  Your next opportunity,
                  <br />
                  in perspective.
                </h3>
                <p>
                  Turn an unstructured brief into a practical
                  <br className="desktop-break" /> overview you can review and
                  act on.
                </p>
                <div className="preview-cards">
                  <div>
                    <Check size={17} />
                    <span>Requirements</span>
                  </div>
                  <div>
                    <ScanLine size={17} />
                    <span>Gaps & risks</span>
                  </div>
                  <div>
                    <ArrowUpRight size={17} />
                    <span>Next actions</span>
                  </div>
                </div>
                <span className="empty-instruction">
                  Add a brief on the left to get started{" "}
                  <ArrowRight size={14} />
                </span>
              </div>
            )}
            <footer className="analyzer-note">
              <Sparkles size={15} />
              <span>
                Deterministic local analyzer · Transparent keyword rules, no AI
                model. Review all findings.
              </span>
            </footer>
          </section>
        </div>
        <footer className="page-footer">
          <span>OPPORTUNITY INTELLIGENCE</span>
          <span>Clarity before commitment.</span>
        </footer>
      </main>
    </div>
  );
}
