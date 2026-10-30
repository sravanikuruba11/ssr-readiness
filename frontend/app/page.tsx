"use client";

import { useRef, useState } from "react";

type Criterion = {
  criterion: string;
  title: string;
  score: number;
  status: string;
  findings: string[];
  recommendations: string[];
};

type Result = {
  analysis_id: string;
  filename: string;
  overall_score: number;
  readiness_level: string;
  extracted_characters: number;
  detected_sections: string[];
  criteria: Criterion[];
  critical_gaps: string[];
  weak_sections: string[];
  evidence_warnings: string[];
  consistency_warnings: string[];
  priority_actions: string[];
  summary: string;
  limitations: string[];
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_FILE_LABEL = "20 MB";

function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ResultList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="empty-note">Nothing flagged in this area.</p>;
  }

  return (
    <ul className="result-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
  );
}

export default function Home() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [lead, setLead] = useState({
    name: "",
    official_email: "",
    institution: "",
    designation: "",
    consent: false,
  });
  const [leadMessage, setLeadMessage] = useState("");
  const [leadError, setLeadError] = useState(false);

  function selectFile(selected: File | undefined) {
    if (!selected) return;
    setError("");

    if (!/\.(pdf|docx)$/i.test(selected.name)) {
      setFile(null);
      setError("Choose a PDF or DOCX document to continue.");
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setFile(null);
      setError(`This file is larger than ${MAX_FILE_LABEL}. Choose a smaller document.`);
      return;
    }

    setFile(selected);
    setResult(null);
  }

  async function runAnalysis() {
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`${API}/api/v1/analyze`, {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "The analysis could not be completed.");
      }
      setResult(data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong while analyzing this document.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function downloadReport() {
    if (!result) return;
    setDownloading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/v1/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      if (!response.ok) {
        throw new Error("The PDF report could not be generated. Please try again.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ssr-readiness-report.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The PDF report could not be downloaded.",
      );
    } finally {
      setDownloading(false);
    }
  }

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLeadMessage("");
    setLeadError(false);

    try {
      const response = await fetch(`${API}/api/v1/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Your details could not be submitted.");
      setLeadMessage("Thanks — your request has been received.");
      setLead({
        name: "",
        official_email: "",
        institution: "",
        designation: "",
        consent: false,
      });
    } catch (caught) {
      setLeadError(true);
      setLeadMessage(
        caught instanceof Error ? caught.message : "Your details could not be submitted.",
      );
    }
  }

  const scoreColor =
    result && result.overall_score >= 75
      ? "var(--green)"
      : result && result.overall_score >= 50
        ? "var(--amber)"
        : "var(--red)";

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#" aria-label="SSR Review home">
          <span className="brand-mark" aria-hidden="true">
            S
          </span>
          <span className="brand-name">
            <strong>SSR Review</strong>
            <span>Readiness workspace</span>
          </span>
        </a>
        <div className="topbar-meta">
          <span className="secure-indicator">
            <span aria-hidden="true" />
            Private by design
          </span>
          <span className="workspace-label">INSTITUTION WORKSPACE</span>
        </div>
      </header>

      <div className="page-shell">
        <section className="intro">
          <div className="intro-copy">
            <p className="eyebrow">SELF STUDY REPORT · PRE-SUBMISSION REVIEW</p>
            <h1>
              Make your next
              <br />
              submission <span>stronger.</span>
            </h1>
            <p className="intro-description">
              Get a clear, practical picture of your SSR readiness. Spot gaps, review
              evidence, and know what to work on next.
            </p>
          </div>
          <div className="intro-note">
            <span className="note-icon" aria-hidden="true">
              ✳
            </span>
            <div>
              <strong>Clarity before submission</strong>
              <p>Consistent checks. Actionable next steps.</p>
            </div>
          </div>
        </section>

        <div className="workspace-grid">
          <section className="panel upload-panel" aria-labelledby="upload-title">
            <div className="panel-heading">
              <span className="step-number">01</span>
              <div>
                <h2 id="upload-title">Start with your report</h2>
                <p>Upload a document to get your readiness review.</p>
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              className={`dropzone${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
              onClick={() => fileInput.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInput.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                selectFile(event.dataTransfer.files[0]);
              }}
              aria-label="Choose or drop a PDF or DOCX report"
            >
              <span className="upload-icon" aria-hidden="true">
                {file ? "✓" : "↑"}
              </span>
              {file ? (
                <span className="file-details">
                  <strong>{file.name}</strong>
                  <span>{formatFileSize(file.size)} · Ready to review</span>
                </span>
              ) : (
                <span className="dropzone-copy">
                  <strong>Drop your SSR here, or browse</strong>
                  <span>PDF or DOCX · Up to {MAX_FILE_LABEL}</span>
                </span>
              )}
              {file && <span className="change-file">Change file</span>}
            </div>
            <input
              ref={fileInput}
              id="report-file"
              className="visually-hidden"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => selectFile(event.target.files?.[0])}
              aria-label="Choose a report file"
            />

            {error && (
              <p className="message message-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="primary-button"
              type="button"
              onClick={runAnalysis}
              disabled={!file || busy}
            >
              {busy ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Reviewing your report…
                </>
              ) : (
                <>
                  Analyze my SSR <span aria-hidden="true">→</span>
                </>
              )}
            </button>

            <div className="privacy-note">
              <span aria-hidden="true">◈</span>
              <p>
                Your document is processed in memory and isn’t saved by this demo.
                Avoid uploading confidential personal data.
              </p>
            </div>
          </section>

          <aside className="panel guide-panel">
            <p className="eyebrow">YOUR REVIEW, AT A GLANCE</p>
            <h2>A better-prepared submission starts here.</h2>
            <p className="guide-description">
              The readiness check looks for the signals that make a report easier to
              review and support.
            </p>
            <div className="guide-list">
              <div className="guide-item">
                <span className="guide-check" aria-hidden="true">
                  1
                </span>
                <div>
                  <strong>Section coverage</strong>
                  <p>See which criteria are present or need attention.</p>
                </div>
              </div>
              <div className="guide-item">
                <span className="guide-check" aria-hidden="true">
                  2
                </span>
                <div>
                  <strong>Evidence signals</strong>
                  <p>Surface references and supporting detail to review.</p>
                </div>
              </div>
              <div className="guide-item">
                <span className="guide-check" aria-hidden="true">
                  3
                </span>
                <div>
                  <strong>Prioritized next steps</strong>
                  <p>Turn findings into a focused action list.</p>
                </div>
              </div>
            </div>
            <p className="guide-footnote">
              An illustrative readiness aid — not an official accreditation evaluation.
            </p>
          </aside>
        </div>

        {busy && (
          <div className="loading-panel" role="status" aria-live="polite">
            <span className="spinner spinner-dark" aria-hidden="true" />
            <div>
              <strong>Reviewing your document</strong>
              <p>Extracting text and checking criterion coverage. This may take a moment.</p>
            </div>
          </div>
        )}

        {result && (
          <section className="results" aria-labelledby="results-title">
            <div className="results-heading">
              <div>
                <p className="eyebrow">YOUR READINESS REVIEW</p>
                <h2 id="results-title">Here’s where things stand.</h2>
                <p className="reviewed-file">
                  Report reviewed: <strong>{result.filename}</strong>
                </p>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={downloadReport}
                disabled={downloading}
              >
                {downloading ? "Preparing PDF…" : "↓  Download report"}
              </button>
            </div>

            <div className="metrics-grid">
              <article className="metric-card score-card">
                <p className="metric-label">OVERALL READINESS</p>
                <div className="score-row">
                  <strong className="score-value">{result.overall_score}</strong>
                  <span className="score-out-of">/ 100</span>
                  <span className="score-status">{result.readiness_level}</span>
                </div>
                <div
                  className="score-track"
                  role="progressbar"
                  aria-label="Overall readiness score"
                  aria-valuenow={result.overall_score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span
                    style={{
                      width: `${Math.min(100, Math.max(0, result.overall_score))}%`,
                      backgroundColor: scoreColor,
                    }}
                  />
                </div>
                <p className="metric-caption">A useful starting point for your review</p>
              </article>
              <article className="metric-card">
                <p className="metric-label">CRITERIA REVIEWED</p>
                <strong className="metric-value">{result.criteria.length}</strong>
                <p className="metric-caption">
                  {result.detected_sections.length} sections detected in your report
                </p>
              </article>
              <article className="metric-card">
                <p className="metric-label">TEXT ANALYZED</p>
                <strong className="metric-value">
                  {result.extracted_characters.toLocaleString()}
                </strong>
                <p className="metric-caption">Characters extracted from your document</p>
              </article>
            </div>

            <section className="panel content-panel" aria-labelledby="criteria-title">
              <SectionHeading
                eyebrow="CRITERIA BREAKDOWN"
                title="A closer look at each criterion"
                description="Use these scores as a guide to decide where a human review may help."
              />
              {result.criteria.length ? (
                <div className="criteria-list">
                  {result.criteria.map((criterion) => (
                    <article className="criterion" key={criterion.criterion}>
                      <div className="criterion-topline">
                        <div>
                          <p className="criterion-name">
                            <span>{criterion.criterion}</span> {criterion.title}
                          </p>
                          <p className="criterion-status">{criterion.status}</p>
                        </div>
                        <strong className="criterion-score">
                          {criterion.score}
                          <span>/100</span>
                        </strong>
                      </div>
                      <div className="criterion-track">
                        <span
                          style={{
                            width: `${Math.min(100, Math.max(0, criterion.score))}%`,
                          }}
                        />
                      </div>
                      {criterion.findings.length > 0 && (
                        <div className="criterion-findings">
                          <span>What we noticed</span>
                          <ResultList items={criterion.findings} />
                        </div>
                      )}
                      {criterion.recommendations.length > 0 && (
                        <div className="criterion-findings recommendation">
                          <span>Suggested next steps</span>
                          <ResultList items={criterion.recommendations} />
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">
                  No criteria were detected. Check that the document contains selectable
                  text; scanned PDFs may need OCR before review.
                </p>
              )}
            </section>

            <section className="findings-grid" aria-label="Review findings">
              <article className="panel finding-card">
                <span className="finding-icon finding-red" aria-hidden="true">
                  !
                </span>
                <div>
                  <h3>Critical gaps</h3>
                  <ResultList items={result.critical_gaps} />
                </div>
              </article>
              <article className="panel finding-card">
                <span className="finding-icon finding-amber" aria-hidden="true">
                  ◷
                </span>
                <div>
                  <h3>Sections to strengthen</h3>
                  <ResultList items={result.weak_sections} />
                </div>
              </article>
              <article className="panel finding-card">
                <span className="finding-icon finding-blue" aria-hidden="true">
                  ↗
                </span>
                <div>
                  <h3>Evidence to verify</h3>
                  <ResultList items={result.evidence_warnings} />
                </div>
              </article>
              <article className="panel finding-card">
                <span className="finding-icon finding-purple" aria-hidden="true">
                  ≋
                </span>
                <div>
                  <h3>Consistency checks</h3>
                  <ResultList items={result.consistency_warnings} />
                </div>
              </article>
            </section>

            <section className="panel action-panel">
              <div className="action-column">
                <SectionHeading
                  eyebrow="MAKE YOUR NEXT MOVE"
                  title="Priority actions"
                  description="A focused list to help you move from findings to improvements."
                />
                <ResultList items={result.priority_actions} />
              </div>
              <div className="summary-column">
                <p className="eyebrow">REVIEW SUMMARY</p>
                <p className="summary-copy">{result.summary}</p>
                {result.limitations.length > 0 && (
                  <div className="limitations">
                    <strong>Keep in mind</strong>
                    <ResultList items={result.limitations} />
                  </div>
                )}
              </div>
            </section>

            <section className="panel contact-panel">
              <div className="contact-intro">
                <p className="eyebrow">OPTIONAL FOLLOW-UP</p>
                <h2>Want to continue the conversation?</h2>
                <p>
                  Leave your details if you’d like someone to follow up about your review.
                </p>
              </div>
              <form className="contact-form" onSubmit={submitLead}>
                <label>
                  Full name
                  <input
                    required
                    autoComplete="name"
                    value={lead.name}
                    onChange={(event) => setLead({ ...lead, name: event.target.value })}
                    placeholder="Your name"
                  />
                </label>
                <label>
                  Official email
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={lead.official_email}
                    onChange={(event) =>
                      setLead({ ...lead, official_email: event.target.value })
                    }
                    placeholder="you@institution.edu"
                  />
                </label>
                <label>
                  Institution
                  <input
                    required
                    value={lead.institution}
                    onChange={(event) =>
                      setLead({ ...lead, institution: event.target.value })
                    }
                    placeholder="Institution name"
                  />
                </label>
                <label>
                  Designation
                  <input
                    required
                    value={lead.designation}
                    onChange={(event) =>
                      setLead({ ...lead, designation: event.target.value })
                    }
                    placeholder="Your role"
                  />
                </label>
                <label className="consent-label">
                  <input
                    type="checkbox"
                    checked={lead.consent}
                    onChange={(event) =>
                      setLead({ ...lead, consent: event.target.checked })
                    }
                    required
                  />
                  <span>
                    I consent to being contacted about this review. I can request
                    communication preference changes.
                  </span>
                </label>
                <button className="primary-button contact-submit" type="submit">
                  Request follow-up <span aria-hidden="true">→</span>
                </button>
                {leadMessage && (
                  <p
                    className={`message ${leadError ? "message-error" : "message-success"}`}
                    role={leadError ? "alert" : "status"}
                  >
                    {leadMessage}
                  </p>
                )}
                <p className="form-disclaimer">
                  Demo only: submitted details are held in memory and aren’t stored
                  permanently.
                </p>
              </form>
            </section>
          </section>
        )}

        <footer className="page-footer">
          <span>SSR Review <span aria-hidden="true">·</span> Readiness workspace</span>
          <span>For guidance only — always verify findings with your review team.</span>
        </footer>
      </div>
    </main>
  );
}
