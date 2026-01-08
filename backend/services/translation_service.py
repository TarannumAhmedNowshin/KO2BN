from deep_translator import GoogleTranslator
from typing import Optional, Dict, List
import re


class TranslationService:
    """Service for handling translation requests using free Google Translate"""
    
    def __init__(self):
        # Using deep-translator with Google Translate (free)
        pass
    
    def apply_glossary(
        self,
        text: str,
        glossary_terms: Optional[List[Dict[str, str]]] = None
    ) -> tuple[str, Dict[str, str]]:
        """
        Apply glossary terms to text before translation.
        Returns modified text and mapping of placeholders.
        
        Args:
            text: Original text
            glossary_terms: List of dicts with 'source_term' and 'target_term'
            
        Returns:
            Tuple of (modified_text, term_mapping)
        """
        if not glossary_terms:
            return text, {}
        
        term_mapping = {}
        modified_text = text
        
        # Sort by length (longest first) to avoid partial replacements
        sorted_terms = sorted(
            glossary_terms,
            key=lambda x: len(x['source_term']),
            reverse=True
        )
        
        for idx, term in enumerate(sorted_terms):
            source_term = term['source_term']
            target_term = term['target_term']
            placeholder = f"___GLOSSARY_{idx}___"
            
            # Case-insensitive replacement
            pattern = re.compile(re.escape(source_term), re.IGNORECASE)
            if pattern.search(modified_text):
                modified_text = pattern.sub(placeholder, modified_text)
                term_mapping[placeholder] = target_term
        
        return modified_text, term_mapping
    
    def restore_glossary(
        self,
        translated_text: str,
        term_mapping: Dict[str, str]
    ) -> str:
        """
        Restore glossary terms in translated text.
        
        Args:
            translated_text: Text after translation
            term_mapping: Mapping of placeholders to target terms
            
        Returns:
            Text with glossary terms restored
        """
        result = translated_text
        for placeholder, target_term in term_mapping.items():
            result = result.replace(placeholder, target_term)
        return result
    
    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        glossary_terms: Optional[List[Dict[str, str]]] = None,
        context: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Translate text using Google Translate (free) with optional glossary.
        
        Args:
            text: Text to translate
            source_lang: Source language code (ko, bn, en)
            target_lang: Target language code (ko, bn, en)
            glossary_terms: List of custom terms to preserve (dict with 'source_term' and 'target_term')
            context: Additional context for translation (not used with free API)
        
        Returns:
            Dictionary with translated_text and confidence score
        """
        
        try:
            # Map language codes
            lang_map = {
                "ko": "ko",
                "bn": "bn",
                "en": "en"
            }
            
            src = lang_map.get(source_lang, source_lang)
            tgt = lang_map.get(target_lang, target_lang)
            
            # Apply glossary terms (replace with placeholders)
            modified_text, term_mapping = self.apply_glossary(text, glossary_terms)
            
            # Translate using Google Translate
            translator = GoogleTranslator(source=src, target=tgt)
            translated_text = translator.translate(modified_text)
            
            # Restore glossary terms
            final_text = self.restore_glossary(translated_text, term_mapping)
            
            return {
                "translated_text": final_text,
                "source_lang": source_lang,
                "target_lang": target_lang,
                "confidence": 0.90  # Estimated confidence for free service
            }
        
        except Exception as e:
            raise Exception(f"Translation error: {str(e)}")
    
    async def translate_multi(
        self,
        text: str,
        source_lang: str,
        target_langs: List[str]
    ) -> Dict[str, str]:
        """
        Translate text to multiple target languages at once
        
        Returns:
            Dictionary mapping language codes to translations
        """
        results = {}
        
        for target_lang in target_langs:
            if target_lang != source_lang:
                result = await self.translate(text, source_lang, target_lang)
                results[target_lang] = result["translated_text"]
            else:
                results[target_lang] = text  # Same language, no translation needed
        
        return results


# Global service instance
translation_service = TranslationService()

