from flask import Blueprint, request, jsonify
import logging
import traceback
import time
from ..chatbot.rag_model import get_chatbot_instance
import uuid

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Dictionary to store session-specific chatbot instances
# This allows each user to have their own conversation history
session_chatbots = {}

chatbot_blueprint = Blueprint('chatbot', __name__)

@chatbot_blueprint.route('/ask', methods=['POST'])
def ask_question():
    """API endpoint to ask a question to the chatbot"""
    try:
        start_time = time.time()
        logger.info("Received question request")
        
        # Get request data
        data = request.get_json()
        
        # Validate request
        if not data or 'question' not in data:
            logger.warning("Missing question in request data")
            return jsonify({"error": "Missing question parameter"}), 400
        
        question = data['question']
        logger.info(f"Processing question: {question}")
        
        # Get session ID, create one if not provided
        session_id = data.get('session_id', None)
        if not session_id:
            session_id = str(uuid.uuid4())
            logger.info(f"Created new session ID: {session_id}")
        else:
            logger.info(f"Using existing session ID: {session_id}")
        
        # Check if question is empty
        if not question or not question.strip():
            logger.warning("Empty question received")
            return jsonify({"error": "Question cannot be empty"}), 400
        
        # Try to get answer from chatbot
        try:
            # Get or create session-specific chatbot instance
            if session_id not in session_chatbots:
                logger.info(f"Creating new chatbot instance for session {session_id}")
                session_chatbots[session_id] = get_chatbot_instance()
            
            # Get answer from the session's chatbot
            chatbot = session_chatbots[session_id]
            result = chatbot.get_answer(question)
            
            # Include session_id in the response
            result['session_id'] = session_id
            
            # Log the processing time
            elapsed_time = time.time() - start_time
            logger.info(f"Question processed in {elapsed_time:.2f} seconds")
            
            return jsonify(result)
        except Exception as e:
            # Log the original error
            logger.error(f"Error with chatbot: {e}")
            logger.error(traceback.format_exc())
            
            # Try with fallback responses for common questions
            fallback_answer = get_fallback_answer(question)
            if fallback_answer:
                logger.info(f"Using fallback answer for question: {question}")
                return jsonify({
                    "answer": fallback_answer,
                    "sources": ["fallback_responses"],
                    "session_id": session_id
                })
            
            # If no fallback, return error
            raise
    
    except Exception as e:
        logger.error(f"Error processing question: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            "answer": "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.",
            "sources": [],
            "error": str(e),
            "session_id": data.get('session_id', str(uuid.uuid4()))
        }), 500

@chatbot_blueprint.route('/rebuild-index', methods=['POST'])
def rebuild_index():
    """API endpoint to rebuild the chatbot's vector index"""
    try:
        logger.info("Received request to rebuild vector index")
        
        # Get the chatbot instance with rebuild_index=True
        start_time = time.time()
        chatbot = get_chatbot_instance(rebuild_index=True)
        
        # Clear all session chatbots to force reload with new index
        global session_chatbots
        session_chatbots = {}
        
        # Log the rebuild time
        elapsed_time = time.time() - start_time
        logger.info(f"Index rebuilt in {elapsed_time:.2f} seconds")
        
        return jsonify({"message": "Vector index rebuilt successfully"})
    
    except Exception as e:
        logger.error(f"Error rebuilding vector index: {e}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@chatbot_blueprint.route('/health', methods=['GET'])
def health_check():
    """API endpoint to check if the chatbot service is healthy"""
    try:
        logger.info("Received health check request")
        
        # Try to get the chatbot instance to check if it's working
        chatbot = get_chatbot_instance()
        
        return jsonify({
            "status": "healthy",
            "message": "Chatbot service is running"
        })
    
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

@chatbot_blueprint.route('/clear-session', methods=['POST'])
def clear_session():
    """API endpoint to clear a specific chatbot session history"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({"error": "Missing session_id parameter"}), 400
        
        if session_id in session_chatbots:
            # Remove the session chatbot instance
            del session_chatbots[session_id]
            logger.info(f"Cleared session {session_id}")
            return jsonify({"message": f"Session {session_id} cleared successfully"})
        else:
            logger.info(f"Session {session_id} not found")
            return jsonify({"message": f"Session {session_id} not found"}), 404
            
    except Exception as e:
        logger.error(f"Error clearing session: {e}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def get_fallback_answer(question):
    """Provide fallback answers for common questions when the chatbot fails"""
    question_lower = question.lower()
    
    # Common question patterns and answers
    fallbacks = {
        "theo dõi đơn hàng": "Bạn có thể theo dõi đơn hàng bằng cách đăng nhập vào tài khoản của bạn, sau đó vào mục 'Đơn hàng của tôi'. Tại đây, bạn sẽ thấy tất cả các đơn hàng đã đặt, tình trạng và thông tin vận chuyển của từng đơn.",
        
        "phí vận chuyển": "Phí vận chuyển phụ thuộc vào địa điểm và phương thức vận chuyển bạn chọn. Đối với các đơn hàng trên 500.000 VND, chúng tôi miễn phí vận chuyển toàn quốc. Đối với các đơn hàng dưới 500.000 VND, phí vận chuyển sẽ từ 30.000 VND đến 50.000 VND tùy theo khu vực.",
        
        "chính sách đổi trả": "Cửa hàng chúng tôi chấp nhận đổi trả trong vòng 30 ngày kể từ ngày mua hàng, với điều kiện sản phẩm còn nguyên tem nhãn, chưa qua sử dụng và có hóa đơn mua hàng. Đối với sản phẩm giảm giá, thời gian đổi trả là 14 ngày.",
        
        "thời gian giao hàng": "Thời gian giao hàng thông thường là 2-3 ngày làm việc đối với các thành phố lớn và 3-5 ngày làm việc đối với các tỉnh thành khác. Đối với khu vực miền núi và hải đảo, thời gian giao hàng có thể kéo dài từ 5-7 ngày làm việc.",
        
        "tài khoản": "Để tạo tài khoản mới, bạn chỉ cần nhấp vào biểu tượng người dùng ở góc phải trên cùng của trang web, sau đó chọn 'Đăng ký'. Điền thông tin cá nhân của bạn như tên, email và mật khẩu, sau đó nhấp vào nút 'Đăng ký'.",
        
        "phương thức thanh toán": "Chúng tôi chấp nhận nhiều phương thức thanh toán khác nhau bao gồm: thẻ tín dụng/ghi nợ (Visa, MasterCard, JCB), ví điện tử (Momo, VNPay, ZaloPay), chuyển khoản ngân hàng và thanh toán khi nhận hàng (COD).",
        
        "liên hệ": "Bạn có thể liên hệ với bộ phận chăm sóc khách hàng của chúng tôi thông qua các kênh sau: Hotline: 1900-1234 (8h-22h hàng ngày), Email: support@example.com, Live chat trên website, hoặc qua trang Fanpage Facebook chính thức của chúng tôi.",
        
        "mã giảm giá": "Để áp dụng mã giảm giá, bạn cần thêm sản phẩm vào giỏ hàng, sau đó chuyển đến trang thanh toán. Tại đây, bạn sẽ thấy ô 'Mã giảm giá' - hãy nhập mã của bạn và nhấp vào 'Áp dụng'."
    }
    
    # Check for matching patterns
    for key, answer in fallbacks.items():
        if key in question_lower:
            return answer
    
    # Check for generic greetings
    greetings = ["xin chào", "chào", "hello", "hi", "hey"]
    for greeting in greetings:
        if greeting in question_lower:
            return "Xin chào! Tôi là trợ lý ảo của cửa hàng. Tôi có thể giúp bạn trả lời các câu hỏi về sản phẩm, đơn hàng, vận chuyển và các chính sách của cửa hàng."
    
    # No match found
    return None