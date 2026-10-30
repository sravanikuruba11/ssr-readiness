import re
import uuid
from collections import defaultdict
from app.core.rules import SECTION_PATTERNS, MIN_CHARS
from app.models.schemas import AnalysisResult, CriterionResult

def _contains_reference(text: str) -> bool:
    patterns = [
        r"\\b(annexure|appendix|supporting document|evidence|link|url)\\b",
        r"https?://|www\\.",
        r"\\b[A-Z]{2,}[-_/]?[0-9]{2,}\\b",
        r"\\b(page|p\\.)\\s*\\d+",
    ]
    return any(re.search(p, text, re.I) for p in patterns)

def _score(section_text: str) -> tuple[int, list[str], list[str]]:
    findings, actions = [], []
    score = 0
    if section_text.strip():
        score += 40
    else:
        findings.append("Criterion content was not detected.")
        actions.append("Add the missing criterion narrative and map it to the applicable requirements.")
        return score, findings, actions

    if _contains_reference(section_text):
        score += 25
    else:
        findings.append("No obvious evidence reference, annexure, URL, or page citation was detected.")
        actions.append("Add verifiable evidence IDs, annexure names, URLs, or page references.")

    if len(section_text) >= MIN_CHARS:
        score += 20
    else:
        findings.append(f"Content appears brief ({len(section_text)} characters; heuristic threshold is {MIN_CHARS}).")
        actions.append("Expand the narrative with specific processes, outcomes, and supporting details.")

    if re.search(r"\\d", section_text) or "|" in section_text or re.search(r"\\b(table|%|percentage|students|faculty)\\b", section_text, re.I):
        score += 15
    else:
        findings.append("No obvious numeric or table-like supporting information was detected.")
        actions.append("Include relevant year-wise figures, tables, or measurable outcomes where applicable.")
    return score, findings, actions

def analyze_text(text: str, filename: str) -> AnalysisResult:
    normalized = text.lower()
    detected = [name for name, terms in SECTION_PATTERNS.items() if any(t in normalized for t in terms)]
    criteria_names = [n for n in SECTION_PATTERNS if n.startswith("Criterion")]
    criteria = []
    # Split by approximate criterion headings to avoid scoring the entire SSR for every criterion.
    positions = []
    for name, terms in SECTION_PATTERNS.items():
        if name.startswith("Criterion"):
            found = [normalized.find(t) for t in terms if normalized.find(t) >= 0]
            if found:
                positions.append((min(found), name))
    positions.sort()
    for idx, (start, name) in enumerate(positions):
        end = positions[idx + 1][0] if idx + 1 < len(positions) else len(text)
        chunk = text[start:end]
        score, findings, actions = _score(chunk)
        code = name.split(":")[0].replace("Criterion ", "")
        criteria.append(CriterionResult(
            criterion=f"Criterion {code}", title=name.split(": ", 1)[-1],
            score=score, status="Strong" if score >= 75 else "Needs improvement" if score >= 40 else "Critical",
            findings=findings, recommendations=actions
        ))

    missing = [n for n in criteria_names if n not in detected]
    critical = [f"Missing section: {n}" for n in missing]
    weak = [f"{c.criterion} — {c.title} ({c.score}/100)" for c in criteria if c.score < 60]
    evidence = [f"{c.criterion}: evidence reference not clearly identified" for c in criteria if any("evidence reference" in f.lower() for f in c.findings)]
    consistency = []
    # Basic sanity check: detect repeated year labels with visibly conflicting numeric totals is out of scope.
    years = re.findall(r"\\b20[0-3]\\d\\b", text)
    if len(set(years)) > 8:
        consistency.append("Many different year labels were found; manually verify reporting periods and year-wise tables.")
    if not criteria:
        overall = 0
        limitations = ["No criterion headings were confidently detected. Confirm heading names or update rules.py."]
    else:
        overall = round(sum(c.score for c in criteria) / len(criteria))
        limitations = ["Scores are heuristic indicators, not official accreditation scores.", "Scanned PDFs may require OCR; OCR is not enabled."]
    level = "Ready for detailed review" if overall >= 80 else "Work required" if overall >= 50 else "Significant gaps"
    actions = []
    if missing:
        actions.append("Create or complete the missing criterion sections.")
    actions.extend(a for c in criteria for a in c.recommendations)
    if not actions:
        actions.append("Conduct a manual evidence audit and validate all claims before submission.")
    summary = (f"Detected {len(criteria)} criterion section(s). The heuristic readiness score is {overall}/100. "
               f"Review critical gaps, verify evidence references, and validate all figures against source records.")
    return AnalysisResult(
        analysis_id=str(uuid.uuid4()), filename=filename, overall_score=overall,
        readiness_level=level, extracted_characters=len(text), detected_sections=detected,
        criteria=criteria, critical_gaps=critical, weak_sections=weak,
        evidence_warnings=evidence, consistency_warnings=consistency,
        priority_actions=list(dict.fromkeys(actions))[:12], summary=summary,
        limitations=limitations
    )
