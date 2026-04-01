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
        "SERVER=10.7.60.234,1433;"
        f"Failover_Partner={};"
        "DATABASE=LIBRARY_MANAGEMENT;"
        f"UID={uid};"
        f"PWD={pwd};"
        "TrustServerCertificate=yes;"
    )
    return conn