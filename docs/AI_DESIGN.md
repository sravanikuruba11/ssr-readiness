# AI integration design

The baseline build does not call an LLM. This keeps numerical scoring reproducible and avoids sending sensitive SSR content to a third party without explicit configuration.

If adding AI:
1. Keep deterministic extraction and scoring in `services/analyzer.py`.
2. Create a provider interface in `services/ai_provider.py`.
3. Send only the minimum necessary extracted snippets after consent and privacy review.
4. Require structured JSON output validated against Pydantic schemas.
5. Ask the model to cite source snippets/page references and return confidence.
6. Treat AI output as interpretation/recommendations, never as a source of factual numerical metrics.
7. Record provider/model/version, prompt version, timestamp, and confidence without logging raw uploaded content.
