import api from './api';

/**
 * Send a chat message to the chatbot API
 * @param {string} question - The user's question
 * @returns {Promise<Object>} Response containing answer and sources
 */
export const sendChatMessage = async (question) => {
  try {
    const response = await api.post('/chatbot/ask', { question });
    return response;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

export default {
  sendChatMessage
}; 