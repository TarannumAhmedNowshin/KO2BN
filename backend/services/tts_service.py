from gtts import gTTS  # type: ignore
import io
from typing import Optional


class TextToSpeechService:
    """Text-to-Speech service using Google TTS"""
    
    def __init__(self):
        """Initialize TTS service"""
        # Language mapping for gTTS
        self.language_map = {
            "ko": "ko",  # Korean
            "bn": "bn",  # Bengali/Bangla
            "en": "en",  # English
            "korean": "ko",
            "bengali": "bn",
            "bangla": "bn",
            "english": "en"
        }
    
    def text_to_speech(self, text: str, language: str = "en") -> bytes:
        """
        Convert text to speech audio
        
        Args:
            text: Text to convert to speech
            language: Language code (ko, bn, en)
        
        Returns:
            Audio bytes (MP3 format)
        """
        # Normalize language code
        lang_code = self.language_map.get(language.lower(), "en")
        
        # Generate speech
        tts = gTTS(text=text, lang=lang_code, slow=False)
        
        # Save to BytesIO
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        return audio_buffer.read()
    
    def save_to_file(self, text: str, language: str, output_path: str):
        """
        Convert text to speech and save to file
        
        Args:
            text: Text to convert
            language: Language code
            output_path: Output file path (.mp3)
        """
        lang_code = self.language_map.get(language.lower(), "en")
        tts = gTTS(text=text, lang=lang_code, slow=False)
        tts.save(output_path)


# Global instance
_tts_service = None


def get_tts_service() -> TextToSpeechService:
    """Get or create TTS service instance"""
    global _tts_service
    if _tts_service is None:
        _tts_service = TextToSpeechService()
    return _tts_service
