"""
RAG (Retrieval Augmented Generation) Chatbot Model
"""
import os
import logging
import traceback
from typing import List, Dict, Any, Optional
import numpy as np
from pathlib import Path

# Langchain imports
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
                input_variables=["question", "context"],
                template="""
                Bạn là trợ lý ảo của một cửa hàng thời trang trực tuyến. Nhiệm vụ của bạn là trả lời các câu hỏi của khách hàng 
                một cách chính xác, lịch sự và hữu ích.
                
                Dựa trên các thông tin từ cửa hàng được cung cấp bên dưới, hãy trả lời câu hỏi của khách hàng.
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
                vectorstore.save_local(str(FAISS_INDEX_PATH))
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
            sources = [doc.metadata.get("source", "Unknown") for doc in docs]
            context_text = "\n\n".join(contexts)
            
            logger.debug(f"Context for question: {context_text[:500]}...")
            
            # Format the prompt with the question and context
            prompt_text = self.prompt_template.format(
                question=question,
                context=context_text
            )
            
            # For simplicity, we'll use a rule-based approach for common questions
            # In a production environment, you would use an LLM like OpenAI's GPT here
            answer = self._direct_qa_match(question, contexts)
            
            if not answer or answer.startswith("Xin lỗi"):
                # If no direct match, try keyword-based approach
                answer = self._rule_based_answers(question, contexts)
            
            if not answer or answer.startswith("Xin lỗi"):
                # If still no answer, extract relevant sentences
                answer = self._extract_relevant_sentences(question, contexts)
            
            logger.info(f"Generated answer: {answer[:100]}...")
            
            return {
                "answer": answer,
                "sources": sources
            }
        except Exception as e:
            logger.error(f"Error getting answer: {e}")
            logger.error(traceback.format_exc())
            return {
                "answer": "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ với bộ phận hỗ trợ của chúng tôi.",
                "sources": []
            }
    
    def _direct_qa_match(self, question: str, contexts: List[str]) -> str:
        """
        Try to find a direct question-answer pair match
        
        Args:
            question: The user's question
            contexts: Retrieved context passages
            
        Returns:
            A direct answer if found, otherwise empty string
        """
        try:
            question_lower = question.lower()
            
            # Extract potential answers from the contexts based on question-answer format
            for context in contexts:
                lines = context.split('\n')
                for i, line in enumerate(lines):
                    if ('câu hỏi:' in line.lower() or '?' in line) and i+1 < len(lines):
                        # Check if this question is similar to the user question
                        if self._is_similar_question(question_lower, line.lower()):
                            # Get the answer (typically in the next line)
                            answer_line = lines[i+1].strip()
                            if answer_line.lower().startswith('trả lời:'):
                                return answer_line.replace('Trả lời:', '').strip()
                            elif i+2 < len(lines) and not lines[i+2].lower().startswith('câu hỏi:'):
                                # Return both the answer line and the next line if it's not a new question
                                return answer_line + ' ' + lines[i+2].strip()
                            else:
                                return answer_line
            
            return ""
        except Exception as e:
            logger.error(f"Error in direct QA match: {e}")
            return ""
    
    def _rule_based_answers(self, question: str, contexts: List[str]) -> str:
        """
        Simple rule-based answering system
        In a production environment, replace this with an actual LLM
        
        Args:
            question: The user's question
            contexts: Retrieved context passages
            
        Returns:
            A generated answer
        """
        try:
            # Lowercase question for easier matching
            question_lower = question.lower()
            
            # Extract potential answers from the contexts
            potential_answers = []
            for context in contexts:
                lines = context.split('\n')
                for i, line in enumerate(lines):
                    # Look for question patterns
                    if "câu hỏi:" in line.lower() or "?" in line:
                        # Check if this question is similar to the user question
                        if self._is_similar_question(question_lower, line.lower()):
                            # Get the answer (assume it's in the next line)
                            if i + 1 < len(lines) and lines[i + 1].strip():
                                if lines[i + 1].lower().startswith("trả lời:"):
                                    potential_answers.append(lines[i + 1].replace("Trả lời:", "").strip())
                                else:
                                    potential_answers.append(lines[i + 1].strip())
            
            # If we found potential answers, return the first one
            if potential_answers:
                return potential_answers[0]
            
            # If no direct Q&A match, look for keyword matches
            keywords = self._extract_keywords(question_lower)
            
            # Store sentences containing keywords
            matching_sentences = []
            
            for context in contexts:
                context_lower = context.lower()
                for keyword in keywords:
                    if keyword in context_lower:
                        # Find the sentences containing the keyword
                        sentences = context.replace('\n', ' ').split('.')
                        for sentence in sentences:
                            if keyword in sentence.lower() and len(sentence.split()) > 3:
                                matching_sentences.append(sentence.strip() + ".")
            
            # Return most relevant sentences (up to 3)
            if matching_sentences:
                # Count keyword occurrences in each sentence
                sentence_scores = []
                for sentence in matching_sentences:
                    score = sum(1 for keyword in keywords if keyword in sentence.lower())
                    sentence_scores.append((score, sentence))
                
                # Sort by score and return top sentences
                sentence_scores.sort(reverse=True)
                return " ".join([s[1] for s in sentence_scores[:3]])
            
            # Default response if no match found
            return "Xin lỗi, tôi không có thông tin cụ thể về câu hỏi của bạn. Vui lòng liên hệ với bộ phận chăm sóc khách hàng qua số 1900-1234 hoặc email support@example.com để được hỗ trợ trực tiếp."
        except Exception as e:
            logger.error(f"Error in rule-based answers: {e}")
            return "Xin lỗi, tôi không thể trả lời câu hỏi này. Vui lòng liên hệ với bộ phận hỗ trợ khách hàng."
    
    def _extract_relevant_sentences(self, question: str, contexts: List[str]) -> str:
        """
        Extract sentences that might be relevant to the question
        
        Args:
            question: The user's question
            contexts: Retrieved context passages
            
        Returns:
            Combined relevant sentences
        """
        try:
            # Extract keywords from question
            keywords = self._extract_keywords(question.lower())
            
            if not keywords:
                return "Xin lỗi, tôi không hiểu câu hỏi của bạn. Vui lòng cung cấp thêm thông tin."
            
            # Combine contexts into one text
            combined_text = ' '.join(contexts)
            
            # Split into sentences
            sentences = combined_text.replace('\n', ' ').split('.')
            
            # Score sentences by keyword matches
            scored_sentences = []
            for sentence in sentences:
                sentence = sentence.strip()
                if len(sentence) < 10:  # Skip very short sentences
                    continue
                
                # Count keyword occurrences
                score = sum(1 for keyword in keywords if keyword in sentence.lower())
                if score > 0:
                    scored_sentences.append((score, sentence))
            
            # Sort by score
            scored_sentences.sort(reverse=True)
            
            # Take top 3 sentences
            top_sentences = [s[1] + '.' for s in scored_sentences[:3]]
            
            if top_sentences:
                return ' '.join(top_sentences)
            else:
                return "Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi của bạn."
        except Exception as e:
            logger.error(f"Error extracting relevant sentences: {e}")
            return "Xin lỗi, tôi không thể tìm thấy câu trả lời phù hợp."
    
    def _is_similar_question(self, query: str, candidate: str) -> bool:
        """Check if two questions are similar based on keyword overlap"""
        try:
            # Clean the candidate
            candidate = candidate.replace('câu hỏi:', '').strip()
            
            query_keywords = self._extract_keywords(query)
            candidate_keywords = self._extract_keywords(candidate)
            
            if not query_keywords or not candidate_keywords:
                return False
            
            # Count matching keywords
            matches = sum(1 for keyword in query_keywords if any(keyword in cand for cand in candidate_keywords))
            
            # Consider similar if at least 2 keywords match or 50% of keywords match
            threshold = min(2, len(query_keywords) * 0.5)
            return matches >= threshold
        except Exception as e:
            logger.error(f"Error comparing questions: {e}")
            return False
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text (simplified)"""
        try:
            # Remove common Vietnamese stopwords
            stopwords = ['và', 'hoặc', 'là', 'của', 'cho', 'trong', 'với', 'có', 'được', 'không', 
                        'về', 'tôi', 'bạn', 'làm', 'thế', 'nào', 'gì', 'vì', 'sao', 'khi', 'từ', 
                        'lúc', 'đã', 'rồi', 'sẽ', 'bởi', 'tại', 'cần', 'như', 'ở', 'một', 'các',
                        'những', 'để', 'mà', 'này', 'đó', 'thì', 'nên', 'vậy', 'phải', 'đến', 'theo']
            
            # Split text and filter out stopwords and short words
            words = text.replace('?', ' ').replace('.', ' ').replace(',', ' ').lower().split()
            keywords = [word for word in words if word not in stopwords and len(word) > 2]
            
            return keywords
        except Exception as e:
            logger.error(f"Error extracting keywords: {e}")
            return []


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