from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm

def build_pdf(data: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=16*mm, bottomMargin=16*mm)
    styles = getSampleStyleSheet()
    story = [Paragraph("SSR Readiness Score — Analysis Report", styles["Title"]),
             Paragraph(f"File: {data.get('filename','')}", styles["Normal"]),
             Paragraph(f"Overall readiness: {data.get('overall_score',0)}/100 — {data.get('readiness_level','')}", styles["Heading2"]),
             Spacer(1, 8)]
    story.append(Paragraph(data.get("summary", ""), styles["BodyText"]))
    story.append(Spacer(1, 10))
    rows = [["Criterion", "Score", "Status"]]
    for c in data.get("criteria", []):
        rows.append([c.get("criterion", ""), f"{c.get('score',0)}/100", c.get("status", "")])
    if len(rows) > 1:
        table = Table(rows, repeatRows=1, colWidths=[85*mm, 25*mm, 55*mm])
        table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#e8eef7")),
                                   ("GRID",(0,0),(-1,-1),0.4,colors.grey),
                                   ("VALIGN",(0,0),(-1,-1),"TOP"), ("PADDING",(0,0),(-1,-1),6)]))
        story.append(table)
    for heading, key in [("Critical gaps","critical_gaps"),("Weak sections","weak_sections"),
                         ("Evidence warnings","evidence_warnings"),("Consistency warnings","consistency_warnings"),
                         ("Priority actions","priority_actions"),("Limitations","limitations")]:
        story += [Spacer(1, 10), Paragraph(heading, styles["Heading2"])]
        items = data.get(key, [])
        if items:
            story.extend(Paragraph("• " + str(item), styles["BodyText"]) for item in items)
        else:
            story.append(Paragraph("None identified by automated checks.", styles["BodyText"]))
    doc.build(story)
    return buffer.getvalue()
