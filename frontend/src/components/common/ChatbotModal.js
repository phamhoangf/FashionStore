import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, Spinner, Card } from 'react-bootstrap';
import { FaPaperPlane, FaRobot, FaUser, FaTimes } from 'react-icons/fa';
import { sendChatMessage } from '../../services/chatbotService';
import './ChatbotModal.css';

const ChatbotModal = ({ show, onHide }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Xin chào! Tôi là trợ lý ảo, tôi có thể giúp gì cho bạn?',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: newMessage.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);
    
    try {
      // Send message to backend
      const response = await sendChatMessage(userMessage.text);
      
      // Add bot response to chat
      const botMessage = {
        id: messages.length + 2,
        sender: 'bot',
        text: response.answer,
        timestamp: new Date(),
        sources: response.sources
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        id: messages.length + 2,
        sender: 'bot',
        text: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ với bộ phận hỗ trợ khách hàng qua hotline 1900-1234.',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Suggested questions
  const suggestedQuestions = [
    'Phí vận chuyển là bao nhiêu?',
    'Làm thế nào để theo dõi đơn hàng?',
    'Chính sách đổi trả hàng như thế nào?',
    'Làm sao để chọn size quần áo phù hợp?'
  ];

  if (!show) return null;

  return (
    <div className="chatbot-floating-window">
      <Card className="chatbot-card">
        <Card.Header className="chatbot-header">
          <div className="d-flex align-items-center">
            <FaRobot className="me-2" />
            <span>Trợ lý ảo</span>
          </div>
          <Button 
            variant="link" 
            className="chatbot-close-btn" 
            onClick={onHide}
            aria-label="Close"
          >
            <FaTimes />
          </Button>
        </Card.Header>
        <Card.Body className="chatbot-body p-0">
          <div className="messages-container">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender} ${message.isError ? 'error' : ''}`}
              >
                <div className="message-avatar">
                  {message.sender === 'bot' ? <FaRobot /> : <FaUser />}
                </div>
                <div className="message-content">
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                  {message.sources && message.sources.length > 0 && (
                    <div className="message-sources">
                      Nguồn: {message.sources.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot loading">
                <div className="message-avatar">
                  <FaRobot />
                </div>
                <div className="message-content">
                  <div className="message-text">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">Đang nhập...</span>
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
                  onClick={() => {
                    setNewMessage(question);
                  }}
                >
                  {question}
                </Button>
              ))}
            </div>
          )}
        </Card.Body>
        <Card.Footer className="p-2 border-top-0">
          <Form className="chatbot-form" onSubmit={handleSendMessage}>
            <Form.Control
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isLoading}
            />
            <Button 
              variant="primary" 
              type="submit" 
              disabled={!newMessage.trim() || isLoading}
            >
              <FaPaperPlane />
            </Button>
          </Form>
        </Card.Footer>
      </Card>
    </div>
  );
};

export default ChatbotModal; 