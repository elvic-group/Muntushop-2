// Conversation State Manager
// Manages user conversation states and context

const userStates = new Map();

class ConversationManager {
  /**
   * Get or create user state
   */
  static getUserState(phoneNumber) {
    if (!userStates.has(phoneNumber)) {
      userStates.set(phoneNumber, {
        currentService: null,
        currentStep: null,
        context: {},
        history: [],
        createdAt: new Date()
      });
    }
    return userStates.get(phoneNumber);
  }

  /**
   * Update user state
   */
  static updateUserState(phoneNumber, updates) {
    const state = this.getUserState(phoneNumber);
    Object.assign(state, updates);
    userStates.set(phoneNumber, state);
    return state;
  }

  /**
   * Add message to history
   */
  static addToHistory(phoneNumber, message, sender = 'user') {
    const state = this.getUserState(phoneNumber);
    state.history.push({
      message,
      sender,
      timestamp: new Date()
    });

    // Keep only last 20 messages
    if (state.history.length > 20) {
      state.history = state.history.slice(-20);
    }

    userStates.set(phoneNumber, state);
  }

  /**
   * Set current service
   */
  static setService(phoneNumber, serviceName, step = null) {
    return this.updateUserState(phoneNumber, {
      currentService: serviceName,
      currentStep: step
    });
  }

  /**
   * Clear user state (reset conversation)
   */
  static clearState(phoneNumber) {
    userStates.delete(phoneNumber);
  }

  /**
   * Get context value
   */
  static getContext(phoneNumber, key) {
    const state = this.getUserState(phoneNumber);
    return state.context[key];
  }

  /**
   * Set context value
   */
  static setContext(phoneNumber, key, value) {
    const state = this.getUserState(phoneNumber);
    state.context[key] = value;
    userStates.set(phoneNumber, state);
  }
}

module.exports = ConversationManager;
