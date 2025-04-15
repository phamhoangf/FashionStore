"""
RAG (Retrieval Augmented Generation) Chatbot Model
"""
import os
import logging
import traceback
from typing import List, Dict, Any, Optional
import numpy as np
from pathlib import Path
from collections import deque

# Langchain imports
from google import genai
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from langchain.prompts import PromptTemplate

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
KNOWLEDGE_BASE_DIR = Path(os.path.dirname(os.path.abspath(__file__))) / "knowledge_base"
FAISS_INDEX_PATH = Path(os.path.dirname(os.path.abspath(__file__))) / "vector_store"
EMBEDDINGS_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"  # Multilingual model supporting Vietnamese
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
TOP_K_RESULTS = 5  # Increased to get more context
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") 
MAX_HISTORY_LENGTH = 10  # Maximum number of messages to keep in conversation history

class RAGChatbot:
    """RAG-based Chatbot class for customer support"""
    
    def __init__(self, rebuild_index: bool = False):
        """
        Initialize the RAG chatbot
        
        Args:
            rebuild_index: Whether to rebuild the vector index from knowledge base files
        """
        try:
            logger.info("Initializing RAG chatbot")
            
            # Create directories if they don't exist
            os.makedirs(KNOWLEDGE_BASE_DIR, exist_ok=True)
            
            # Initialize conversation history as a deque with max length
            self.conversation_history = deque(maxlen=MAX_HISTORY_LENGTH)
            
            # Initialize embeddings
            logger.info(f"Loading embeddings model: {EMBEDDINGS_MODEL}")
            self.embeddings = HuggingFaceEmbeddings(model_name=EMBEDDINGS_MODEL)
            logger.info("Embeddings model loaded successfully")
            
            if rebuild_index or not os.path.exists(FAISS_INDEX_PATH):
                logger.info("Building vector store from knowledge base...")
                self.vectorstore = self._build_vectorstore()
            else:
                try:
                    logger.info("Loading existing vector store...")
                    # Check if index file exists before trying to load
                    index_file = os.path.join(FAISS_INDEX_PATH, "index.faiss")
                    docstore_file = os.path.join(FAISS_INDEX_PATH, "index.pkl")
                    
                    if not (os.path.exists(index_file) and os.path.exists(docstore_file)):
                        logger.warning(f"Vector store files not found at {FAISS_INDEX_PATH}")
                        logger.info("Rebuilding vector store...")
                        self.vectorstore = self._build_vectorstore()
                    else:
                        self.vectorstore = FAISS.load_local(str(FAISS_INDEX_PATH), self.embeddings)
                        logger.info("Vector store loaded successfully")
                except Exception as e:
                    logger.error(f"Error loading vector store: {e}")
                    logger.error(traceback.format_exc())
                    logger.info("Rebuilding vector store...")
                    self.vectorstore = self._build_vectorstore()
            
            # Define the prompt template for customer support
            self.prompt_template = PromptTemplate(
                input_variables=["question", "context", "history"],
                template="""
                Bạn là trợ lý ảo của một cửa hàng thời trang nam. Nhiệm vụ của bạn là trả lời các câu hỏi của khách hàng 
                một cách chính xác, lịch sự và hữu ích.
                
                Cửa hàng chúng tôi chuyên kinh doanh các sản phẩm thời trang nam cao cấp với hai danh mục chính:
                1. QUẦN NAM: gồm quần short, quần jeans, quần âu, quần kaki
                2. ÁO NAM: gồm áo thun, áo polo, áo sơ mi, áo khoác, áo len
                
                Dưới đây là lịch sử cuộc trò chuyện với khách hàng:
                {history}
                
                Dựa trên các thông tin từ cửa hàng được cung cấp bên dưới và lịch sử trò chuyện, hãy trả lời câu hỏi của khách hàng.
                Nếu bạn không tìm thấy câu trả lời trong thông tin được cung cấp, hãy nói rằng bạn không có thông tin về vấn đề đó 
                và đề nghị khách hàng liên hệ trực tiếp với bộ phận chăm sóc khách hàng.
                
                Thông tin: {context}
                
                Câu hỏi của khách hàng: {question}
                
                Trả lời:
                """
            )
            
            logger.info("RAG chatbot initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize RAG chatbot: {e}")
            logger.error(traceback.format_exc())
            raise
    
    def _build_vectorstore(self) -> FAISS:
        """Build the vector store from knowledge base files"""
        try:
            # Ensure knowledge base directory exists
            if not os.path.exists(KNOWLEDGE_BASE_DIR):
                logger.warning(f"Knowledge base directory not found: {KNOWLEDGE_BASE_DIR}")
                os.makedirs(KNOWLEDGE_BASE_DIR, exist_ok=True)
                logger.info(f"Created knowledge base directory: {KNOWLEDGE_BASE_DIR}")
                
                # Create a sample knowledge file if none exists
                if not any(KNOWLEDGE_BASE_DIR.glob("*.txt")):
                    sample_path = KNOWLEDGE_BASE_DIR / "sample.txt"
                    with open(sample_path, 'w', encoding='utf-8') as f:
                        f.write("Câu hỏi: Làm thế nào để tạo tài khoản mới?\n")
                        f.write("Trả lời: Để tạo tài khoản mới, bạn có thể nhấn vào nút 'Đăng ký' ở góc phải trên cùng của trang web.\n\n")
                    logger.info(f"Created sample knowledge file: {sample_path}")
            
            # Get all text files from knowledge base directory
            text_files = list(KNOWLEDGE_BASE_DIR.glob("*.txt"))
            
            if not text_files:
                logger.warning("No text files found in knowledge base directory")
                sample_path = KNOWLEDGE_BASE_DIR / "sample.txt"
                with open(sample_path, 'w', encoding='utf-8') as f:
                    f.write("Câu hỏi: Làm thế nào để tạo tài khoản mới?\n")
                    f.write("Trả lời: Để tạo tài khoản mới, bạn có thể nhấn vào nút 'Đăng ký' ở góc phải trên cùng của trang web.\n\n")
                text_files = [sample_path]
                logger.info(f"Created sample knowledge file: {sample_path}")
            
            # Load and combine all text documents
            raw_documents = []
            for file_path in text_files:
                try:
                    logger.info(f"Reading file: {file_path}")
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        raw_documents.append(Document(page_content=content, metadata={"source": file_path.name}))
                except Exception as e:
                    logger.error(f"Error reading file {file_path}: {e}")
            
            if not raw_documents:
                logger.warning("No documents loaded from knowledge base files")
                # Create a dummy document
                raw_documents.append(Document(
                    page_content="Đây là nội dung mẫu cho chatbot.",
                    metadata={"source": "default.txt"}
                ))
            
            # Split documents into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=CHUNK_SIZE,
                chunk_overlap=CHUNK_OVERLAP
            )
            documents = text_splitter.split_documents(raw_documents)
            logger.info(f"Created {len(documents)} document chunks from {len(text_files)} files")
            
            # Create vector store
            vectorstore = FAISS.from_documents(documents, self.embeddings)
            
            # Save the vector store
            try:
                os.makedirs(FAISS_INDEX_PATH, exist_ok=True)
                full_path = os.path.join(FAISS_INDEX_PATH, "index.faiss")
                # Make sure parent directory exists
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                logger.info(f"Saving vector store to {full_path}")
                vectorstore.save_local("app/chatbot/vector_store")
                logger.info(f"Vector store saved to {FAISS_INDEX_PATH}")
            except Exception as e:
                logger.error(f"Failed to save vector store: {e}")
                logger.error(traceback.format_exc())
                # Continue even if saving fails
                logger.info("Will continue with in-memory vector store")
            
            return vectorstore
        except Exception as e:
            logger.error(f"Error building vector store: {e}")
            logger.error(traceback.format_exc())
            raise
    
    def get_answer(self, question: str) -> Dict[str, Any]:
        """
        Get answer for a customer question
        
        Args:
            question: Customer's question in Vietnamese
            
        Returns:
            Dict containing the answer and relevant sources
        """
        try:
            logger.info(f"Processing question: {question}")
            
            # Search for relevant documents
            docs = self.vectorstore.similarity_search(question, k=TOP_K_RESULTS)
            logger.info(f"Retrieved {len(docs)} relevant documents")
            
            # Extract and combine relevant contexts
            contexts = [doc.page_content for doc in docs]
            # sources = [doc.metadata.get("source", "Unknown") for doc in docs]
            context_text = "\n\n".join(contexts)
            
            logger.debug(f"Context for question: {context_text[:500]}...")
            
            # Format the prompt with the question, context, and conversation history
            history_text = "\n".join(self.conversation_history)
            prompt_text = self.prompt_template.format(
                question=question,
                context=context_text,
                history=history_text
            )

            # Use gemini from google
            client = genai.Client(api_key=GOOGLE_API_KEY)
            model_name = "gemini-2.0-flash"
            answer = client.models.generate_content(contents=prompt_text, model=model_name).text
            
            # Update conversation history
            self.conversation_history.append(f"Khách hàng: {question}")
            self.conversation_history.append(f"Trợ lý: {answer}")
            
            logger.info(f"Generated answer: {answer[:100]}...")
            
            return {"answer": answer}
        except Exception as e:
            logger.error(f"Error getting answer: {e}")
            logger.error(traceback.format_exc())
            return {
                "answer": "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ với bộ phận hỗ trợ của chúng tôi.",
                "sources": []
            }


# Singleton instance
_chatbot_instance = None

def get_chatbot_instance(rebuild_index: bool = False) -> RAGChatbot:
    """Get the singleton chatbot instance"""
    global _chatbot_instance
    try:
        if _chatbot_instance is None or rebuild_index:
            logger.info(f"Creating new chatbot instance (rebuild_index={rebuild_index})")
            _chatbot_instance = RAGChatbot(rebuild_index=rebuild_index)
        return _chatbot_instance
    except Exception as e:
        logger.error(f"Error getting chatbot instance: {e}")
        logger.error(traceback.format_exc())
        raise