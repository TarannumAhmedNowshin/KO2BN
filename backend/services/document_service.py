"""
Document processing service for extracting text from PDF and DOCX files.
"""
import io
from typing import Optional
from PyPDF2 import PdfReader
from docx import Document


class DocumentService:
    """Service for processing documents and extracting text."""
    
    @staticmethod
    def extract_text_from_pdf(file_content: bytes) -> str:
        """
        Extract text from a PDF file.
        
        Args:
            file_content: Binary content of the PDF file
            
        Returns:
            Extracted text from all pages
        """
        try:
            pdf_file = io.BytesIO(file_content)
            pdf_reader = PdfReader(pdf_file)
            
            text_parts = []
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            
            return "\n\n".join(text_parts)
        except Exception as e:
            raise ValueError(f"Error extracting text from PDF: {str(e)}")
    
    @staticmethod
    def extract_text_from_docx(file_content: bytes) -> str:
        """
        Extract text from a DOCX file.
        
        Args:
            file_content: Binary content of the DOCX file
            
        Returns:
            Extracted text from all paragraphs
        """
        try:
            docx_file = io.BytesIO(file_content)
            doc = Document(docx_file)
            
            text_parts = []
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_parts.append(paragraph.text)
            
            return "\n\n".join(text_parts)
        except Exception as e:
            raise ValueError(f"Error extracting text from DOCX: {str(e)}")
    
    @staticmethod
    def extract_text(file_content: bytes, filename: str) -> str:
        """
        Extract text from a document based on file extension.
        
        Args:
            file_content: Binary content of the file
            filename: Name of the file (to determine type)
            
        Returns:
            Extracted text
            
        Raises:
            ValueError: If file type is not supported
        """
        filename_lower = filename.lower()
        
        if filename_lower.endswith('.pdf'):
            return DocumentService.extract_text_from_pdf(file_content)
        elif filename_lower.endswith('.docx'):
            return DocumentService.extract_text_from_docx(file_content)
        else:
            raise ValueError("Unsupported file type. Only PDF and DOCX files are supported.")
