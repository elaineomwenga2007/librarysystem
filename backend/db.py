import pyodbc

def get_connection(role='borrower'):

    if role=='librarian':
        uid="librarian"
        pwd="Ashton 15822"
    else:
        uid="Borrower"
        pwd="Borrower 2025"

    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=172.20.10.6,1433;"
        "DATABASE=LIBRARY_MANAGEMENT;"
        f"UID={uid};"
        f"PWD={pwd};"
        "TrustServerCertificate=yes;"
    )
    return conn