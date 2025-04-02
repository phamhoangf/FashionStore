import React from 'react';
import { Button } from 'react-bootstrap';
import { FaRobot, FaCommentDots } from 'react-icons/fa';
import './ChatbotButton.css';

const ChatbotButton = ({ onClick }) => {
  return (
    <Button 
      className="chatbot-button"
      variant="primary"
      onClick={onClick}
      aria-label="Open chatbot"
    >
      <div className="chatbot-button-content">
        <FaCommentDots size={24} />
        <span className="chatbot-button-label">Hỗ trợ</span>
      </div>
    </Button>
  );
};

export default ChatbotButton; 