import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { FaRobot, FaPaperPlane } from 'react-icons/fa';
import './ChatbotModal.css';
import axios from 'axios';

// API URL constant - adjust if you have it in a constants file
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ChatbotModal = ({ show, onHide }) => {
  // Khởi tạo với tin nhắn chào mừng hoặc load từ localStorage
  const [messages, setMessages] = useState(() => {
    // Không sử dụng localStorage ngay tại thời điểm này
    // Sẽ xử lý ở useEffect để đảm bảo có thể xác định người dùng hiện tại
    return getDefaultWelcomeMessage();
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [chatSessionId, setChatSessionId] = useState('');

  // Hàm trả về tin nhắn chào mừng mặc định
  function getDefaultWelcomeMessage() {
    return [{ 
      text: "Xin chào! Tôi là trợ lý ảo của cửa hàng. Tôi có thể giúp gì cho bạn?", 
      sender: 'bot',
      timestamp: new Date()
    }];
  }

  // Tạo hoặc cập nhật ID phiên chat dựa trên token người dùng hoặc ID phiên
  useEffect(() => {
    const token = localStorage.getItem('token');
    const sessionId = localStorage.getItem('sessionId') || Date.now().toString();
    
    if (!localStorage.getItem('sessionId')) {
      localStorage.setItem('sessionId', sessionId);
    }
    
    // Tạo ID phiên chat dựa trên token hoặc sessionId
    const chatId = token ? `chat_${token.substring(0, 10)}` : `chat_${sessionId}`;
    setChatSessionId(chatId);
    
    // Tải tin nhắn từ localStorage dựa trên ID phiên chat
    const savedMessages = localStorage.getItem(chatId);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Đảm bảo ngày tháng được chuyển đổi đúng định dạng
        setMessages(parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (e) {
        console.error('Error parsing saved messages:', e);
        setMessages(getDefaultWelcomeMessage());
      }
    } else {
      setMessages(getDefaultWelcomeMessage());
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Lưu tin nhắn vào localStorage khi có thay đổi
  useEffect(() => {
    if (messages.length > 0 && chatSessionId) {
      localStorage.setItem(chatSessionId, JSON.stringify(messages));
    }
  }, [messages, chatSessionId]);

  // Lắng nghe sự kiện đăng xuất để reset chat
  useEffect(() => {
    const resetChatOnLogout = () => {
      console.log('Resetting chatbot messages due to logout');
      setMessages(getDefaultWelcomeMessage());
      
      // Xóa tất cả các phiên chat trong localStorage
      // Nhưng giữ lại sessionId
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chat_')) {
          localStorage.removeItem(key);
        }
      });
    };

    // Sự kiện khi đăng nhập thành công
    const resetChatOnLogin = () => {
      console.log('Resetting chatbot messages due to login');
      setMessages(getDefaultWelcomeMessage());
      
      // Cập nhật chatSessionId dựa trên token mới
      const token = localStorage.getItem('token');
      if (token) {
        const newChatId = `chat_${token.substring(0, 10)}`;
        setChatSessionId(newChatId);
      }
    };

    window.addEventListener('user-logout', resetChatOnLogout);
    window.addEventListener('user-login', resetChatOnLogin);
    
    return () => {
      window.removeEventListener('user-logout', resetChatOnLogout);
      window.removeEventListener('user-login', resetChatOnLogin);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Send request to backend
      console.log(`Sending question to ${API_URL}/chatbot/ask`);
      const response = await axios.post(`${API_URL}/chatbot/ask`, {
        question: userMessage.text
      });

      console.log('Chatbot response:', response.data);

      // Add bot response to chat
      setMessages(prev => [...prev, {
        text: response.data.answer,
        sender: 'bot',
        timestamp: new Date(),
      }]);
    } catch (err) {
      console.error('Error getting chatbot response:', err);
      setError('Xin lỗi, tôi không thể xử lý câu hỏi của bạn lúc này. Vui lòng thử lại sau.');
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        text: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Suggested questions
  const suggestedQuestions = [
    'Phí vận chuyển là bao nhiêu?',
    'Làm thế nào để theo dõi đơn hàng?',
    'Chính sách đổi trả hàng như thế nào?',
    'Làm sao để chọn size quần áo phù hợp?'
  ];

  const handleSuggestedQuestion = (question) => {
    setInput(question);
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered
      className="chatbot-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FaRobot className="me-2" />
          Trợ lý ảo
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="chatbot-body">
        <div className="messages-container">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.sender} ${msg.isError ? 'error' : ''}`}
            >
              <div className="message-content">
                <div className="message-text">{msg.text}</div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="message-sources">
                    <small>
                      Nguồn: {msg.sources.join(', ')}
                    </small>
                  </div>
                )}
                <div className="message-time">
                  <small>{formatTime(msg.timestamp)}</small>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message bot">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {messages.length === 1 && (
          <div className="suggested-questions">
            <div className="suggested-title">Câu hỏi phổ biến:</div>
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline-primary"
                size="sm"
                className="suggested-question"
                onClick={() => handleSuggestedQuestion(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="p-2">
        <Form className="chatbot-input-form" onSubmit={handleSendMessage}>
          <Form.Group className="d-flex w-100">
            <Form.Control
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <Button 
              variant="primary" 
              type="submit" 
              className="ms-2 send-button" 
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <FaPaperPlane />
              )}
            </Button>
          </Form.Group>
        </Form>
      </Modal.Footer>
    </Modal>
  );
};

export default ChatbotModal;