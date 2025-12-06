# KYC & Loan Management System

This is a complete KYC and Loan Management system built with Python (Backend) and React (Frontend), using a Microsoft Access database.

## Prerequisites
- Python 3.x
- Node.js & npm
- Microsoft Access Driver (ODBC) installed (standard with Office or searchable as "Microsoft Access Database Engine 2016 Redistributable")

## Project Structure
- `kyc-backend/`: Flask server, Access DB, PDF/Excel generation.
- `kyc-frontend/`: React application (Vite).

## Setup Instructions

### 1. Database Setup
The system uses `kyc-backend/db/kyc.accdb`.
- If the file is missing, the system will look for it.
- **IMPORTANT**: You must have a `db/kyc.accdb` file.
- Run `python init_db.py` inside `kyc-backend/` to create the tables if you have an empty Access file, or to verify connection.

### 2. Backend Setup
1. Open a terminal in `kyc-backend/`.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Initialize/Check DB (optional but recommended):
   ```bash
   python init_db.py
   ```
   *Note: If you don't have an Access file, create an empty one named `kyc.accdb` in `kyc-backend/db/` first.*
4. Start the server:
   ```bash
   python app.py
   ```
   Server runs at `http://127.0.0.1:5000`.

### 3. Frontend Setup
1. Open a new terminal in `kyc-frontend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open your browser at `http://localhost:5173`.

## Usage Workflow
1. **Admin**: Login with `admin` / `admin123` (seeded by `init_db.py` or default).
2. **Customer**: Click "Register" to create an account.
3. **Verification**: 
   - Login as Admin.
   - Go to Dashboard -> Verification Requests.
   - Click "Approve" for the new customer.
4. **Loan Application**:
   - Login as the Customer.
   - Apply for a loan on the dashboard.
5. **Loan Decision**:
   - Login as Admin.
   - Go to Dashboard -> Loan Requests.
   - Click "Approve" or "Reject".
   - **Download PDF**: Click the button (or check `admin_exports` folder).
6. **Reporting**:
   - As Admin, click "Export Excel Report" to download `.xlsx`.

## Deployment (Git & Hosting)

### 1. Git Push
```bash
git init
git add .
git commit -m "Initial commit"
# Create repo on GitHub
git remote add origin https://github.com/YOUR_USERNAME/kyc-loans.git
git push -u origin main
```

### 2. Hosting
**Backend (Python + Access)**:
- Hosting Access DBs online is difficult (Access is file-based).
- **Recommended**: Host on a **Windows VPS** (e.g., AWS EC2 Windows, Azure VM) or local server.
- **Service**: PythonAnywhere (supports SQLite/MySQL but not Access easily).
- **Instruction**: 
  - Rent a generic Windows VPS.
  - Clone repo.
  - Install Python & Drivers.
  - Run `python app.py`.

**Frontend (React)**:
- Build for production:
  ```bash
  npm run build
  ```
- Host `dist/` folder on Netlify/Vercel:
  - **Netlify**: Drag and drop `dist` folder.
  - **GitHub Pages**: Use `gh-pages` package.

## Notes
- **Security**: Passwords are stored in plain text for educational clarity. DO NOT use in real production.
- **Reporting**: Excel files generated in `backend/reports/`. PDFs in `backend/admin_exports/`.
