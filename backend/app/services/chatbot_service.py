"""
Service for handling chatbot operations
"""
from typing import Dict, Any, List
import logging
import traceback
from flask import current_app
from app.chatbot.rag_model import get_chatbot_instance

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ChatbotService:
    @staticmethod
    def get_answer(question: str) -> Dict[str, Any]:
        """
        Get answer from the chatbot for a user's question
        
        Args:
            question: The user's question in Vietnamese
            
        Returns:
            Dictionary with the answer and source information
        """
        try:
            logger.info(f"Processing chatbot question: {question}")
            
            if not question or not isinstance(question, str) or len(question) < 2:
                logger.warning(f"Invalid question format: {question}")
                return {
                    "answer": "Vui lòng nhập câu hỏi hợp lệ.",
                    "sources": []
                }
            
            # Initialize chatbot and get answer
            chatbot = get_chatbot_instance()
            logger.info("Chatbot instance initialized")
            
            # Get answer
            response = chatbot.get_answer(question)
            logger.info(f"Chatbot answered: {response['answer'][:50]}... with sources: {response['sources']}")
            
            return response
        except Exception as e:
            logger.error(f"Error in chatbot service: {str(e)}")
            logger.error(traceback.format_exc())
            
            # Check if running in a flask context
            if current_app:
                current_app.logger.error(f"Chatbot error: {str(e)}")
                current_app.logger.error(traceback.format_exc())
            
            return {
                "answer": "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ với bộ phận hỗ trợ của chúng tôi.",
                "sources": []
            }
    
    @staticmethod
    def rebuild_index() -> Dict[str, Any]:
        """
        Rebuild the knowledge base vector index
        
        Returns:
            Status message
        """
        try:
            logger.info("Starting knowledge base index rebuild")
            get_chatbot_instance(rebuild_index=True)
            logger.info("Knowledge base index rebuilt successfully")
            return {"status": "success", "message": "Knowledge base index rebuilt successfully"}
        except Exception as e:
            logger.error(f"Error rebuilding index: {str(e)}")
            logger.error(traceback.format_exc())
            return {"status": "error", "message": f"Failed to rebuild index: {str(e)}"} 