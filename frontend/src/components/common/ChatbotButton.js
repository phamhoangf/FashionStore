import React from 'react';
import { Button } from 'react-bootstrap';
import { FaCommentDots } from 'react-icons/fa';
import './ChatbotButton.css';

const ChatbotButton = ({ onClick }) => {
  return (
    <Button
      className="chatbot-button"
      variant="primary"
      onClick={onClick}
      aria-label="Open chat support"
    >
      <FaCommentDots className="me-2" />
      <span className="d-none d-md-inline">Hỗ trợ</span>
    </Button>
  );
};

export default ChatbotButton; 