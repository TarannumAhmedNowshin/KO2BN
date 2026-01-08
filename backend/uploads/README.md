# Uploads Directory

This directory stores all uploaded documents from users.

## Structure
- Documents are organized by user_id subdirectories
- Each file is saved with a unique filename to prevent conflicts
- Supported file types: PDF, DOCX

## File Naming Convention
- Format: `{timestamp}_{original_filename}`
- Example: `1704835200_document.pdf`

## Security
- Files are stored outside the web root
- Access is controlled through the API endpoints
- User can only access their own documents
