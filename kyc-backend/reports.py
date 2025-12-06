import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import pandas as pd
import datetime

EXPORT_DIR = os.path.join(os.path.dirname(__file__), 'admin_exports')
REPORT_DIR = os.path.join(os.path.dirname(__file__), 'reports')

def generate_loan_pdf(loan_data):
    if not os.path.exists(EXPORT_DIR):
        os.makedirs(EXPORT_DIR)
        
    filename = f"loan_{loan_data['loan_id']}_{loan_data['status']}.pdf"
    filepath = os.path.join(EXPORT_DIR, filename)
    
    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter
    
    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "KYC & Loan Management System")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 70, "Loan Decision Report")
    c.line(50, height - 80, width - 50, height - 80)
    
    # Customer Details
    y = height - 120
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Customer Details:")
    c.setFont("Helvetica", 10)
    c.drawString(70, y - 20, f"Name: {loan_data['customer']}")
    c.drawString(70, y - 40, f"Email: {loan_data['email']}")
    c.drawString(70, y - 60, f"Phone: {loan_data['phone']}")
    
    # Loan Details
    y = y - 100
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Loan Request Details:")
    c.setFont("Helvetica", 10)
    c.drawString(70, y - 20, f"Loan ID: {loan_data['loan_id']}")
    c.drawString(70, y - 40, f"Amount: ${loan_data['amount']}")
    c.drawString(70, y - 60, f"Term: {loan_data['term']} months")
    c.drawString(70, y - 80, f"Purpose: {loan_data['purpose']}")
    
    # Decision
    y = y - 120
    c.setFont("Helvetica-Bold", 14)
    status_str = "APPROVED" if loan_data['status'] == 'approved' else "REJECTED"
    c.drawString(50, y, f"Decision: {status_str}")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, y - 30, f"Decided By: {loan_data['admin']}")
    c.drawString(50, y - 50, f"Decided At: {loan_data['decided_at']}")
    
    c.save()
    return filename

def generate_excel_report(verifications, loans):
    if not os.path.exists(REPORT_DIR):
        os.makedirs(REPORT_DIR)
        
    filename = "kyc_report.xlsx"
    filepath = os.path.join(REPORT_DIR, filename)
    
    with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
        df_v = pd.DataFrame(verifications)
        df_v.to_excel(writer, sheet_name='Verifications', index=False)
        
        df_l = pd.DataFrame(loans)
        df_l.to_excel(writer, sheet_name='Loans', index=False)
        
    return filename
