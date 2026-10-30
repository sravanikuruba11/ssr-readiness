# Scoring and analysis assumptions

The initial implementation uses transparent deterministic heuristics rather than an LLM to calculate scores.

For each detected criterion:
- 40: criterion section detected
- 25: at least one evidence-like reference signal detected
- 20: section has at least 350 characters
- 15: numeric/table-like content detected

The score is the sum of those checks. Overall readiness is the arithmetic mean of detected criterion scores. Missing criterion headings are reported as critical gaps and are not included as zero-valued criterion rows in the mean.

Evidence detection uses lexical signals (annexure, appendix, evidence, URL, page number, etc.). It does not verify that a link works or that an annexure actually supports a claim. Consistency checks are deliberately conservative and only flag unusually many year labels for manual review.

These rules are illustrative defaults and must be reviewed against the exact SSR framework/version used by the institution.
