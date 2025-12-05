CREATE TABLE USERS (
    user_id AUTOINCREMENT PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    date_of_birth DATETIME,
    password_hash VARCHAR(255),
    user_type VARCHAR(20),
    kyc_status VARCHAR(20),
    created_at DATETIME,
    verified_by LONG
);

CREATE TABLE DOCUMENTS (
    document_id AUTOINCREMENT PRIMARY KEY,
    user_id LONG,
    document_type VARCHAR(50),
    document_number VARCHAR(100),
    expiry_date DATETIME,
    document_image_path VARCHAR(255),
    upload_date DATETIME,
    verification_status VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

CREATE TABLE LOAN_APPLICATIONS (
    loan_id AUTOINCREMENT PRIMARY KEY,
    user_id LONG,
    loan_amount CURRENCY,
    loan_purpose VARCHAR(255),
    interest_rate DOUBLE,
    tenure_months INT,
    application_status VARCHAR(20),
    application_date DATETIME,
    approved_by LONG,
    approval_date DATETIME,
    pdf_document_path VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

CREATE TABLE AUDIT_LOG (
    log_id AUTOINCREMENT PRIMARY KEY,
    user_id LONG,
    action VARCHAR(50),
    action_timestamp DATETIME,
    ip_address VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);
