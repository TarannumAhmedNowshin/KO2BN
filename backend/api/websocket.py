from fastapi import WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict, List
import json
import base64
from datetime import datetime

from database import get_db
from models.session import MeetingSession, SessionStatus
from models.transcript import Transcript
from services.stt_service import get_stt_service
from services.tts_service import get_tts_service
from services.translation_service import TranslationService


class ConnectionManager:
    """Manage WebSocket connections for meeting sessions"""
    
    def __init__(self):
        # session_code -> list of WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, session_code: str):
        """Connect a client to a session"""
        await websocket.accept()
        if session_code not in self.active_connections:
            self.active_connections[session_code] = []
        self.active_connections[session_code].append(websocket)
    
    def disconnect(self, websocket: WebSocket, session_code: str):
        """Disconnect a client from a session"""
        if session_code in self.active_connections:
            self.active_connections[session_code].remove(websocket)
            if not self.active_connections[session_code]:
                del self.active_connections[session_code]
    
    async def broadcast(self, session_code: str, message: dict):
        """Broadcast message to all clients in a session"""
        if session_code in self.active_connections:
            for connection in self.active_connections[session_code]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error broadcasting to client: {e}")


manager = ConnectionManager()


async def handle_websocket(
    websocket: WebSocket,
    session_code: str,
    db: Session
):
    """Handle WebSocket connection for a meeting session"""
    
    # Verify session exists and is active
    session = db.query(MeetingSession).filter(
        MeetingSession.session_code == session_code
    ).first()
    
    if not session:
        await websocket.close(code=1008, reason="Session not found")
        return
    
    if session.status != SessionStatus.active:
        await websocket.close(code=1008, reason="Session is not active")
        return
    
    # Connect client
    await manager.connect(websocket, session_code)
    
    # Send welcome message
    await websocket.send_json({
        "type": "connected",
        "session_code": session_code,
        "message": "Connected to session"
    })
    
    # Get services
    stt_service = get_stt_service()
    tts_service = get_tts_service()
    translation_service = TranslationService()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            print(f"Received message type: {message_type}")  # Debug log
            
            if message_type == "audio":
                # Process audio for transcription and translation
                await process_audio_message(
                    data, session, db, stt_service, tts_service, translation_service, session_code
                )
            
            elif message_type == "text":
                # Process text message for translation only
                await process_text_message(
                    data, session, db, tts_service, translation_service, session_code
                )
            
            elif message_type == "ping":
                # Keep-alive ping
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_code)
        await manager.broadcast(session_code, {
            "type": "user_disconnected",
            "message": "A user disconnected"
        })
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, session_code)


async def process_audio_message(
    data: dict,
    session: MeetingSession,
    db: Session,
    stt_service,
    tts_service,
    translation_service: TranslationService,
    session_code: str
):
    """Process audio message: STT -> Translation -> TTS -> Broadcast"""
    
    print("=== Processing audio message ===")  # Debug log
    
    try:
        # Decode audio data
        audio_base64 = data.get("audio")
        speaker_name = data.get("speaker_name", "Unknown")
        user_id = data.get("user_id")
        
        print(f"Speaker: {speaker_name}, Audio length: {len(audio_base64) if audio_base64 else 0}")  # Debug
        
        if not audio_base64:
            print("No audio data received!")
            return
        
        audio_bytes = base64.b64decode(audio_base64)
        print(f"Decoded audio bytes: {len(audio_bytes)}")  # Debug
        
        # Step 1: Speech-to-Text
        print("Starting transcription...")
        original_text, detected_language = stt_service.transcribe_audio(audio_bytes)
        print(f"Transcribed: '{original_text}' (language: {detected_language})")  # Debug
        
        if not original_text:
            print("No text transcribed from audio!")
            await manager.broadcast(session_code, {
                "type": "error",
                "message": "Could not transcribe audio. Please speak clearly and try again."
            })
            return
        
        # Step 2: Translate to all three languages
        translations = {}
        
        # Map detected language
        lang_map = {
            "ko": "korean",
            "bn": "bengali",
            "en": "english",
            "korean": "korean",
            "bengali": "bengali",
            "english": "english"
        }
        
        source_lang = lang_map.get(detected_language, "auto")
        
        # Translate to Korean
        if detected_language != "ko":
            result = await translation_service.translate(original_text, source_lang, "korean")
            translations["ko"] = result["translated_text"]
        else:
            translations["ko"] = original_text
        
        # Translate to Bengali
        if detected_language != "bn":
            result = await translation_service.translate(original_text, source_lang, "bengali")
            translations["bn"] = result["translated_text"]
        else:
            translations["bn"] = original_text
        
        # Translate to English
        if detected_language != "en":
            result = await translation_service.translate(original_text, source_lang, "english")
            translations["en"] = result["translated_text"]
        else:
            translations["en"] = original_text
        
        # Step 3: Generate TTS for translations
        audio_files = {}
        for lang, text in translations.items():
            if text and text != original_text:
                audio_bytes = tts_service.text_to_speech(text, lang)
                audio_files[lang] = base64.b64encode(audio_bytes).decode('utf-8')
        
        # Step 4: Save to database
        transcript = Transcript(
            session_id=session.id,
            user_id=user_id,
            speaker_name=speaker_name,
            original_text=original_text,
            original_language=detected_language,
            translated_text_ko=translations.get("ko"),
            translated_text_bn=translations.get("bn"),
            translated_text_en=translations.get("en"),
            timestamp=datetime.utcnow()
        )
        db.add(transcript)
        db.commit()
        db.refresh(transcript)
        
        # Step 5: Broadcast to all clients
        await manager.broadcast(session_code, {
            "type": "transcript",
            "transcript_id": transcript.id,
            "speaker_name": speaker_name,
            "original_text": original_text,
            "original_language": detected_language,
            "translations": translations,
            "audio_files": audio_files,
            "timestamp": transcript.timestamp.isoformat()
        })
    
    except Exception as e:
        print(f"Error processing audio: {e}")
        await manager.broadcast(session_code, {
            "type": "error",
            "message": f"Error processing audio: {str(e)}"
        })


async def process_text_message(
    data: dict,
    session: MeetingSession,
    db: Session,
    tts_service,
    translation_service: TranslationService,
    session_code: str
):
    """Process text message: Translation -> TTS -> Broadcast"""
    
    print("=== Processing text message ===")  # Debug log
    
    try:
        text = data.get("text")
        language = data.get("language", "auto")
        speaker_name = data.get("speaker_name", "Unknown")
        user_id = data.get("user_id")
        
        print(f"Speaker: {speaker_name}, Text: '{text}', Language: {language}")  # Debug
        
        if not text:
            print("No text received!")
            return
        
        # Map language codes
        lang_map = {
            "ko": "korean",
            "bn": "bengali",
            "en": "english",
            "korean": "korean",
            "bengali": "bengali",
            "english": "english",
            "auto": "auto"
        }
        
        source_lang = lang_map.get(language, "auto")
        
        # Translate to all three languages
        translations = {}
        
        print(f"Translating from {source_lang}...")  # Debug
        
        # Translate to Korean
        if source_lang != "korean":
            result = await translation_service.translate(text, source_lang, "korean")
            translations["ko"] = result["translated_text"]
        else:
            translations["ko"] = text
        
        # Translate to Bengali
        if source_lang != "bengali":
            result = await translation_service.translate(text, source_lang, "bengali")
            translations["bn"] = result["translated_text"]
        else:
            translations["bn"] = text
        
        # Translate to English
        if source_lang != "english":
            result = await translation_service.translate(text, source_lang, "english")
            translations["en"] = result["translated_text"]
        else:
            translations["en"] = text
        
        print(f"Translations: {translations}")  # Debug
        
        # Generate TTS
        audio_files = {}
        for lang, translated_text in translations.items():
            if translated_text:
                try:
                    audio_bytes = tts_service.text_to_speech(translated_text, lang)
                    audio_files[lang] = base64.b64encode(audio_bytes).decode('utf-8')
                    print(f"Generated TTS for {lang}, size: {len(audio_files[lang])}")  # Debug
                except Exception as e:
                    print(f"Error generating TTS for {lang}: {e}")
        
        # Save to database
        transcript = Transcript(
            session_id=session.id,
            user_id=user_id,
            speaker_name=speaker_name,
            original_text=text,
            original_language=language,
            translated_text_ko=translations.get("ko"),
            translated_text_bn=translations.get("bn"),
            translated_text_en=translations.get("en"),
            timestamp=datetime.utcnow()
        )
        db.add(transcript)
        db.commit()
        db.refresh(transcript)
        
        print(f"Saved transcript with ID: {transcript.id}")  # Debug
        
        # Broadcast to all clients
        await manager.broadcast(session_code, {
            "type": "transcript",
            "transcript_id": transcript.id,
            "speaker_name": speaker_name,
            "original_text": text,
            "original_language": language,
            "translations": translations,
            "audio_files": audio_files,
            "timestamp": transcript.timestamp.isoformat()
        })
    
    except Exception as e:
        print(f"Error processing text: {e}")
        await manager.broadcast(session_code, {
            "type": "error",
            "message": f"Error processing text: {str(e)}"
        })
