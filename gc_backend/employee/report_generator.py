# employee/report_generator.py

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, Image, SimpleDocTemplate
)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO
from django.http import FileResponse
from .models import ChatMessage
import matplotlib.pyplot as plt
import os

import tempfile
import os

from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import PageBreak

from reportlab.lib.pagesizes import A4
from reportlab.platypus import PageBreak
from reportlab.lib.units import inch

from datetime import datetime


class EmployeeReportGenerator:
    def __init__(self, profile):
        self.buffer = BytesIO()
        self.profile = profile
        self.user = profile.user
        self.styles = getSampleStyleSheet()

    def _generate_mood_plot(self, path):
        weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
        mood_scores = [7.8, 6.5, 8.2, 7.0]

        plt.figure(figsize=(5, 2))
        plt.plot(weeks, mood_scores, marker='o', color='mediumseagreen')
        plt.title('Mood History')
        plt.ylabel('Mood Score')
        plt.ylim(0, 10)
        plt.grid(True)
        plt.tight_layout()
        plt.savefig(path)
        plt.close()

    def _get_employee_details(self):
        return [
            ["Employee Name","John Doe"],
            ["Username", self.user.username],
            ["Email", self.user.email or "Not Available"],
            ["Department", self.profile.department or "Engineering"],
            ["Role", self.profile.role or "Software Developer"],
        ]

    # (HC PART)
    def _get_working_hours_summary(self):
        return [
            ["Metric", "Value"],
            ["Total Hours", "160"],
            ["Regular Hours", "140"],
            ["Overtime Hours", "20"],
            ["Attendance Rate", "95%"],
        ]

    def _get_key_insights(self):
        return [
            "• Logged 160 total hours with 20 hours of overtime.",
            "• Attendance rate is 95%, showing strong commitment.",
            "• Mood scores averaged 7.3/10 – generally positive.",
            "• Consistent productivity observed."
        ]

    def _get_risk_assessment(self):
        return [
            "• No major absenteeism observed.",
            "• Week 2 mood dip (6.5/10) – consider a follow-up.",
            "• Stress level: Low to Moderate."
        ]

    def _get_recommended_actions(self):
        return [
            "• Encourage work-life balance to avoid burnout.",
            "• Schedule a check-in regarding mood drop.",
            "• Recognize consistent performance and attendance."
        ]

 
    def generate_report(self):
        from reportlab.platypus import (
            BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
            PageBreak, Table, TableStyle, Image
        )
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import inch
        from reportlab.pdfgen import canvas
        from datetime import datetime
        import tempfile, os

        self.styles = getSampleStyleSheet()

        # Buffer
        buffer = self.buffer

        # Cover page frame
        frame_cover = Frame(
            50, 50, A4[0] - 100, A4[1] - 100,
            id='cover_frame'
        )

        # Content page frame
        frame_content = Frame(
            50, 60, A4[0] - 100, A4[1] - 130,
            id='content_frame'
        )

        # Header and footer function
        def header_footer(canvas, doc):
            # HEADER
            canvas.saveState()
            canvas.setFillColorRGB(0.0, 0.5, 0.3)  # dark green
            canvas.rect(0, A4[1] - 60, A4[0], 60, fill=1)
            canvas.setFillColorRGB(1, 1, 1)
            canvas.setFont("Helvetica-Bold", 16)
            canvas.drawCentredString(A4[0] / 2, A4[1] - 40, "Employee Performance Report")

            # FOOTER
            canvas.setFillColorRGB(0.85, 0.85, 0.85)
            canvas.rect(0, 0, A4[0], 40, fill=1)
            canvas.setFillColorRGB(0.2, 0.2, 0.2)
            canvas.setFont("Helvetica", 10)
            canvas.drawString(50, 25, f"Generated for: {self.user.username}")
            canvas.drawRightString(A4[0] - 50, 25, f"Page {doc.page}")
            canvas.restoreState()

        # Document setup
        doc = BaseDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=50,
            rightMargin=50,
            topMargin=70,
            bottomMargin=60,
        )

        # Page templates
        from reportlab.platypus import NextPageTemplate

        doc.addPageTemplates([
            PageTemplate(id='Cover', frames=frame_cover),  # No header/footer
            PageTemplate(id='Content', frames=frame_content, onPage=header_footer),
        ])

        elements = []
        styles = self.styles

        # 🎯 COVER PAGE
        title_style = ParagraphStyle(
            "TitleStyle",
            fontName="Helvetica-Bold",
            fontSize=36,
            alignment=1,
            textColor=colors.HexColor("#006400"),
            spaceAfter=20,
        )
        subtitle_style = ParagraphStyle(
            "SubtitleStyle",
            fontName="Helvetica-Oblique",
            fontSize=20,
            alignment=1,
            textColor=colors.HexColor("#2F4F4F"),
        )

        elements.append(Spacer(1, 3 * inch))
        elements.append(Paragraph("Deloitte", title_style))
        elements.append(Spacer(1, 0.5 * inch))
        elements.append(Paragraph("Performance Report", subtitle_style))
        elements.append(NextPageTemplate('Content'))
        elements.append(PageBreak())  # End of cover page

        # ✍️ Content Styling
        heading_style = ParagraphStyle(
            name="SectionHeading",
            parent=styles["Heading2"],
            textColor=colors.darkgreen,
            fontSize=13,
            spaceAfter=6,
        )

        bullet_style = ParagraphStyle(
            name="Bullet",
            parent=styles["Normal"],
            bulletIndent=10,
            leftIndent=15,
        )

        # Employee Summary
        elements.append(Paragraph("Employee Summary", heading_style))
        emp_table = Table(self._get_employee_details(), colWidths=[150, 300])
        emp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica')
        ]))
        elements.append(emp_table)
        elements.append(Spacer(1, 12))

        # Working Hours (HC)
        elements.append(Paragraph("Working Hours Summary", heading_style))
        work_table = Table(self._get_working_hours_summary(), colWidths=[200, 100])
        work_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica')
        ]))
        elements.append(work_table)
        elements.append(Spacer(1, 12))

        # Mood Plot (HC)
        elements.append(Paragraph("Mood History", heading_style))
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmpfile:
            img_path = tmpfile.name
        self._generate_mood_plot(img_path)
        elements.append(Image(img_path, width=400, height=150))
        elements.append(Spacer(1, 12))

        # Key Insights (HC
        elements.append(Paragraph("Key Insights", heading_style))
        for insight in self._get_key_insights():
            elements.append(Paragraph(insight, bullet_style))
        elements.append(Spacer(1, 12))

        # Risk Assessment
        elements.append(Paragraph("Risk Assessment", heading_style))
        for risk in self._get_risk_assessment():
            elements.append(Paragraph(risk, bullet_style))
        elements.append(Spacer(1, 12))

        # Recommended Actions
        elements.append(Paragraph("Recommended Actions", heading_style))
        for action in self._get_recommended_actions():
            elements.append(Paragraph(action, bullet_style))
        elements.append(Spacer(1, 12))

        # Chat Summary
        elements.append(Paragraph("Recent Chat Summary", heading_style))
        chats = ChatMessage.objects.filter(user=self.user).order_by('-timestamp')[:5]
        if not chats:
            elements.append(Paragraph("No chat history available.", styles["Normal"]))
        else:
            for msg in chats:
                text = f"[{msg.timestamp.strftime('%Y-%m-%d %H:%M')}] {msg.direction.title()}: {msg.message[:80]}"
                elements.append(Paragraph(text, styles["Normal"]))

        doc.build(elements)

        self.buffer.seek(0)
        if os.path.exists(img_path):
            os.remove(img_path)

        return FileResponse(self.buffer, as_attachment=True, filename=f"{self.user.username}_report.pdf")