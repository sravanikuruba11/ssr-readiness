from app.services.analyzer import analyze_text

def test_empty_document_has_zero_score():
    result = analyze_text("Some unrelated text.", "sample.docx")
    assert result.overall_score == 0
    assert result.criteria == []

def test_detects_criterion_and_scores():
    text = ("Criterion 1 Curricular Aspects " + ("Evidence annexure A1 2022 2023 table students " * 30) +
            " Criterion 2 Teaching-Learning and Evaluation " + ("Evidence link https://example.org 2023 " * 30))
    result = analyze_text(text, "sample.docx")
    assert result.overall_score > 0
    assert len(result.criteria) == 2
