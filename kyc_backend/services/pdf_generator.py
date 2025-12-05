import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime
from config import Config

def generate_loan_decision_pdf(customer_name: str, loan_id: int, loan_amount: float, status: str) -> str:
    """
    Generates a PDF for loan approval or rejection.
    Returns the absolute path to the generated file.
    """
    filename = f"loan_decision_{loan_id}_{status}.pdf"
    # Ensure directory exists
    directory = os.path.join(Config.UPLOAD_FOLDER, 'loan_docs')
    os.makedirs(directory, exist_ok=True)
    
    filepath = os.path.join(directory, filename)
    
    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter
    
    # Title
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 50, "KYC Loan Management System")
    
    # Date
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 80, f"Date: {datetime.now().strftime('%Y-%m-%d')}")
    
    # Content
    c.setFont("Helvetica-Bold", 18)
    if status.lower() == 'approved':
        c.drawString(50, height - 150, "LOAN APPROVAL LETTER")
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 200, f"Dear {customer_name},")
        c.drawString(50, height - 230, f"We are pleased to inform you that your loan application (ID: {loan_id})")
        c.drawString(50, height - 250, f"for the amount of ${loan_amount} has been APPROVED.")
        c.drawString(50, height - 300, "Please verify your bank details in your dashboard to receive funds.")
    else:
        c.drawString(50, height - 150, "LOAN REJECTION LETTER")
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 200, f"Dear {customer_name},")
        c.drawString(50, height - 230, f"We regret to inform you that your loan application (ID: {loan_id})")
        c.drawString(50, height - 250, f"for the amount of ${loan_amount} has been REJECTED due to policy criteria.")
        
    c.drawString(50, height - 400, "Sincerely,")
    c.drawString(50, height - 420, "The Loan Management Team")
    
    c.save()
    return filepath
