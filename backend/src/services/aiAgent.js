/**
 * AI Agent Service
 * Handles intelligent conversation using OpenAI
 */

const OpenAI = require('openai');
const db = require('../config/database');

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

class AIAgent {
  /**
   * Process message with AI when no menu command matches
   */
  static async processMessage(phone, message, user) {
    try {
      // If OpenAI is not configured, return fallback
      if (!openai) {
        console.log('OpenAI not configured, using fallback response');
        return this.getFallbackResponse();
      }

      // Get conversation history from database
      const history = await this.getConversationHistory(user.id);
      
      // Build messages array for OpenAI
      const messages = [
        {
          role: 'system',
          content: `You are a helpful assistant for MuntuShop Platform, a WhatsApp-based service platform offering 11 services:

1. Shopping Store - Browse and purchase products
2. Bulk Messaging - Send messages to multiple contacts
3. Customer Support - Get help and support
4. Appointment Booking - Schedule appointments
5. Group Management - Manage WhatsApp groups
6. Money Assistant - Financial services
7. Online Courses - Educational content
8. News & Updates - Latest news and updates
9. Marketing Services - Marketing tools
10. B2B Wholesale - Business-to-business services
11. IPTV Subscriptions - TV subscription services

Keep responses concise, friendly, and helpful. Guide users to type MENU to see services or HELP for assistance. All services cost $1 each.

If users ask about specific services, provide brief info and encourage them to select from the menu by typing MENU.`
        }
      ];

      // Add recent conversation history (last 5 messages)
      history.slice(-5).forEach(item => {
        messages.push({
          role: item.role === 'user' ? 'user' : 'assistant',
          content: item.content
        });
      });

      // Add current message
      messages.push({
        role: 'user',
        content: message
      });

      // Get AI response
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 200,
        temperature: 0.7
      });

      const response = completion.choices[0].message.content.trim();
      
      // Save conversation to history
      await this.saveConversationHistory(user.id, message, response);
      
      return response;
    } catch (error) {
      console.error('AI Agent error:', error);
      return this.getFallbackResponse();
    }
  }

  /**
   * Get conversation history from database
   */
  static async getConversationHistory(userId) {
    try {
      const result = await db.query(
        `SELECT role, content, created_at 
         FROM conversation_history 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [userId]
      );
      
      // Return in chronological order (oldest first)
      return result.rows.reverse();
    } catch (error) {
      console.error('Error getting conversation history:', error);
      // If table doesn't exist, return empty array
      return [];
    }
  }

  /**
   * Save conversation to history
   */
  static async saveConversationHistory(userId, userMessage, aiResponse) {
    try {
      // Save user message
      await db.query(
        `INSERT INTO conversation_history (user_id, role, content, created_at)
         VALUES ($1, 'user', $2, NOW())`,
        [userId, userMessage]
      );
      
      // Save AI response
      await db.query(
        `INSERT INTO conversation_history (user_id, role, content, created_at)
         VALUES ($1, 'assistant', $2, NOW())`,
        [userId, aiResponse]
      );
    } catch (error) {
      // If table doesn't exist, just log the error (non-critical)
      console.error('Error saving conversation history:', error);
    }
  }

  /**
   * Get fallback response when AI is unavailable
   */
  static getFallbackResponse() {
    return `I'm here to help! 💚

Type MENU to see all available services
Type HELP for assistance

What can I help you with today?`;
  }

  /**
   * Check if AI agent is enabled
   */
  static isEnabled() {
    return !!process.env.OPENAI_API_KEY && !!openai;
  }
}

module.exports = AIAgent;

