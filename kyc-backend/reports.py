import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import pandas as pd
import datetime

EXPORT_DIR = os.path.join(os.path.dirname(__file__), 'admin_exports')
REPORT_DIR = os.path.join(os.path.dirname(__file__), 'reports')

# EDITING INSTRUCTION:
# To change the PDF layout, modify the `draw_header` and `draw_footer` functions.
# To change the body text, modify the content list in `generate_loan_pdf`.

def draw_header(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor('#6366f1')) # Brand Color
    canvas.rect(0, 10.5*inch, 8.5*inch, 0.5*inch, fill=1, stroke=0)
    
    canvas.setFillColor(colors.white)
    canvas.setFont('Helvetica-Bold', 18)
    canvas.drawString(0.5*inch, 10.65*inch, "KYC & LOAN SYSTEM")
    
    canvas.setFont('Helvetica', 10)
    canvas.drawRightString(8*inch, 10.65*inch, "Official Decision Letter")
    canvas.restoreState()

def draw_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.lightgrey)
    canvas.line(0.5*inch, 0.75*inch, 8*inch, 0.75*inch)
    
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(colors.grey)
    canvas.drawString(0.5*inch, 0.5*inch, f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    canvas.drawRightString(8*inch, 0.5*inch, "Page %d" % doc.page)
    canvas.restoreState()

def generate_loan_pdf(loan_data):
    if not os.path.exists(EXPORT_DIR):
        os.makedirs(EXPORT_DIR)
        
    filename = f"loan_{loan_data['loan_id']}_{loan_data['status']}.pdf"
    filepath = os.path.join(EXPORT_DIR, filename)
    
    doc = SimpleDocTemplate(filepath, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    styles.add(ParagraphStyle(name='DecisionTitle', parent=styles['Heading1'], fontSize=24, spaceAfter=20, textColor=colors.HexColor('#1e293b')))
    styles.add(ParagraphStyle(name='SectionHeader', parent=styles['Heading2'], fontSize=14, spaceBefore=20, spaceAfter=10, textColor=colors.HexColor('#6366f1')))
    styles.add(ParagraphStyle(name='NormalCustom', parent=styles['Normal'], fontSize=12, leading=16))
    
    content = []
    
    # Title
    decision_text = "Loan APPROVED" if loan_data['status'] == 'approved' else "Loan REJECTED"
    decision_color = colors.HexColor('#10b981') if loan_data['status'] == 'approved' else colors.HexColor('#ef4444')
    
    content.append(Spacer(1, 0.5*inch))
    content.append(Paragraph(f"Notice of Decision: {decision_text}", 
                             ParagraphStyle(name='DecisionColor', parent=styles['DecisionTitle'], textColor=decision_color)))
    
    content.append(Paragraph(f"Dear {loan_data['customer']},", styles['NormalCustom']))
    content.append(Spacer(1, 12))
    
    if loan_data['status'] == 'approved':
        text = f"We are pleased to inform you that your loan application for <b>${loan_data['amount']:,}</b> has been <font color='#10b981'><b>APPROVED</b></font>."
    else:
        text = f"We regret to inform you that your loan application for <b>${loan_data['amount']:,}</b> has been <font color='#ef4444'><b>REJECTED</b></font>."
    
    content.append(Paragraph(text, styles['NormalCustom']))
    content.append(Spacer(1, 20))
    
    # Details Table
    data = [
        ['Loan ID', f"#{loan_data['loan_id']}"],
        ['Amount', f"${loan_data['amount']:,}"],
        ['Term', f"{loan_data['term']} months"],
        ['Purpose', loan_data['purpose']],
        ['Date of Application', loan_data.get('applied_at', 'N/A')],
        ['Decision Date', loan_data.get('decided_at', 'N/A')],
        ['Admin Notes', loan_data.get('notes', 'N/A') if loan_data.get('notes') else 'No additional notes']
    ]
    
    t = Table(data, colWidths=[2.5*inch, 4*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8fafc')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#475569')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#6366f1'))
    ]))
    content.append(t)
    
    content.append(Spacer(1, 40))
    content.append(Paragraph("Thank you for choosing our services.", styles['NormalCustom']))
    content.append(Spacer(1, 12))
    content.append(Paragraph("Sincerely,", styles['NormalCustom']))
    content.append(Paragraph("The Credit Team", styles['NormalCustom']))

    doc.build(content, onFirstPage=draw_header, onLaterPages=draw_footer)
    return filename

def generate_excel_report(verifications, loans):
    if not os.path.exists(REPORT_DIR):
        os.makedirs(REPORT_DIR)
        
    filename = f"Full_Report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    filepath = os.path.join(REPORT_DIR, filename)
    
    with pd.ExcelWriter(filepath) as writer:
        if verifications:
            pd.DataFrame(verifications).to_excel(writer, sheet_name='Verifications', index=False)
        if loans:
            pd.DataFrame(loans).to_excel(writer, sheet_name='Loan Requests', index=False)
            
    return filename

def generate_csv_export(data, type_name):
    if not os.path.exists(REPORT_DIR):
        os.makedirs(REPORT_DIR)
    
    filename = f"{type_name}_Export_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    filepath = os.path.join(REPORT_DIR, filename)
    
    df = pd.DataFrame(data)
    df.to_csv(filepath, index=False)
    
    return filename
