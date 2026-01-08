"""
Database migration script to add document management features.
This script will create the documents table and update relationships.
"""
from database import engine, init_db
from models import Document

def migrate():
    """Run database migrations"""
    print("Starting database migration...")
    
    # Create all tables (including the new documents table)
    init_db()
    
    print("✓ Database migration completed successfully!")
    print("✓ Documents table created")
    print("✓ Relationships updated")

if __name__ == "__main__":
    migrate()
