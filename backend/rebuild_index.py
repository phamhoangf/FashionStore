#!/usr/bin/env python
"""
Script to rebuild the vector store for the chatbot.
This can be run manually when new knowledge base files are added.
"""

import os
import sys
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the backend directory to the Python path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

try:
    from app.chatbot.rag_model import get_chatbot_instance

    logger.info("Starting vector store rebuild process...")
    
    # Get a fresh instance with rebuild_index=True
    chatbot = get_chatbot_instance(rebuild_index=True)
    
    logger.info("Vector store rebuild completed successfully!")
    
    # Test the chatbot with a simple question
    test_question = "Làm thế nào để theo dõi đơn hàng?"
    logger.info(f"Testing chatbot with question: {test_question}")
    
    answer = chatbot.get_answer(test_question)
    logger.info(f"Chatbot answer: {answer['answer']}")
    logger.info(f"Sources: {answer['sources']}")
    
    logger.info("Chatbot is working correctly!")

except Exception as e:
    logger.error(f"Error rebuilding vector store: {e}")
    import traceback
    logger.error(traceback.format_exc())
    sys.exit(1)

sys.exit(0) 