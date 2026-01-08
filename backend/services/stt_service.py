import whisper  # type: ignore
import io
import tempfile
import os
from typing import Tuple


class SpeechToTextService:
    """Speech-to-Text service using OpenAI Whisper"""
    
    def __init__(self, model_name: str = "base"):
        """
        Initialize Whisper model
        
        Args:
            model_name: Whisper model size (tiny, base, small, medium, large)
        """
        print(f"Loading Whisper model: {model_name}")
        self.model = whisper.load_model(model_name)
        print("Whisper model loaded successfully")
    
    def transcribe_audio(self, audio_data: bytes, language: str = None) -> Tuple[str, str]:
        """
        Transcribe audio bytes to text
        
        Args:
            audio_data: Audio file bytes (WAV, MP3, etc.)
            language: Optional language hint (e.g., 'ko', 'bn', 'en')
        
        Returns:
            Tuple of (transcribed_text, detected_language)
        """
        temp_audio_path = None
        try:
            # Create temporary file that won't be auto-deleted
            temp_fd, temp_audio_path = tempfile.mkstemp(suffix='.webm')
            
            # Write audio data
            with os.fdopen(temp_fd, 'wb') as temp_file:
                temp_file.write(audio_data)
            
            print(f"Temp file created: {temp_audio_path}, size: {os.path.getsize(temp_audio_path)}")
            
            # Transcribe audio
            result = self.model.transcribe(
                temp_audio_path,
                language=language,
                task="transcribe",
                fp16=False  # Use FP32 on CPU
            )
            
            transcribed_text = result["text"].strip()
            detected_language = result.get("language", language or "unknown")
            
            print(f"Transcription result: '{transcribed_text}'")
            return transcribed_text, detected_language
        
        except Exception as e:
            print(f"Transcription error: {e}")
            import traceback
            traceback.print_exc()
            return "", "unknown"
        
        finally:
            # Clean up temporary file
            if temp_audio_path and os.path.exists(temp_audio_path):
                try:
                    os.remove(temp_audio_path)
                    print(f"Temp file deleted: {temp_audio_path}")
                except Exception as e:
                    print(f"Error removing temp file: {e}")
    
    def transcribe_from_file(self, file_path: str, language: str = None) -> Tuple[str, str]:
        """
        Transcribe audio from file path
        
        Args:
            file_path: Path to audio file
            language: Optional language hint
        
        Returns:
            Tuple of (transcribed_text, detected_language)
        """
        result = self.model.transcribe(
            file_path,
            language=language,
            task="transcribe"
        )
        
        transcribed_text = result["text"].strip()
        detected_language = result.get("language", language or "unknown")
        
        return transcribed_text, detected_language


# Global instance (lazy loaded)
_stt_service = None


def get_stt_service() -> SpeechToTextService:
    """Get or create STT service instance"""
    global _stt_service
    if _stt_service is None:
        _stt_service = SpeechToTextService(model_name="base")
    return _stt_service
