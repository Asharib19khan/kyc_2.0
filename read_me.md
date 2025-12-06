## KYC & Loan Management System
A complete KYC and Loan Management system I built with Python on the backend and React on the frontend, connected to a Microsoft Access database.

# What You Need
You'll need Python 3.10, Node.js with npm, and the Microsoft Access ODBC driver

# How It's Organized
I split this into two main folders: 
1) kyc-backend; handles the Flask server, the Access database, and all the PDF/Excel generation. 
2) kyc-frontend; is the React app built with Vite.

# Getting It Running

1) Setting Up the Database;
- The system lives in [kyc-backend/db/kyc.accdb]
```Bash
python init_db.py  #kyc-backend folder
```

2) Starting the Backend; kyc-backend: 
```bash 
pip install -r requirements.txt"
```
again 
```bash 
python init_db.py
now 
```bash 
python app.py
```
The server will simply spin up.

3) Starting the Frontend
kyc-frontend: 
```bash
npm install
```bash 
npm run dev
```

4) Then just open [http://localhost:xyz] in your browser.

5) How to Use It
Start by logging in as the admin (username: admin, password: admin123). If you want to test the customer flow, click register to create a new account. Once you're set up as a customer, you can submit a loan application. Then switch back to the admin account and go to the dashboard to approve or reject applications. When you approve a loan, you can download a PDF of the decision. There's also an Excel export button if you want to pull all your data into a spreadsheet.

[https://github.com/Asharib19khan/kyc_2.0.git]

Hosting It
The tricky part is that Access databases are file-based, so they don't play nicely with most hosting platforms. Your best bet is to spin up a Windows VPS somewhere (AWS, Azure, whatever) and just run it there. Clone the repo, install Python and the drivers, and fire up python app.py.
For the frontend, build it with npm run build and throw the dist folder onto Netlify or Vercel. They'll handle the rest.
Fair Warning