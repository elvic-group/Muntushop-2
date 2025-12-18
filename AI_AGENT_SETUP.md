# AI Agent Setup Guide

## ✅ Implementation Details

The AI Agent uses:
- **OpenAI SDK** (official `openai` npm package - version 6.14.0)
- **Chat Completions API** (`openai.chat.completions.create()`)
- **Model**: GPT-3.5-turbo (cost-effective and fast)
- **Conversation history** stored in PostgreSQL for context

This is the **standard OpenAI SDK approach** for building conversational AI agents.

## 📋 Setup Steps

### 1. Add OpenAI API Key to .env

Add this to your `.env` file in the root directory:

```bash
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

Get your API key from: https://platform.openai.com/api-keys

### 2. Run Database Migration

The AI agent requires a `conversation_history` table. Run the migration:

**Option A: Using the migration script**
```bash
cd backend
node scripts/migrate-ai-agent.js
```

**Option B: Using psql directly**
```bash
psql $DATABASE_URL -f database/migrations/add_ai_agent_conversation_history.sql
```

### 3. Verify Setup

The AI agent will:
- ✅ Work if `OPENAI_API_KEY` is set
- ✅ Fallback gracefully if OpenAI is unavailable
- ✅ Store conversation history for context

## 🔍 How It Works

1. **User sends message** → Handler receives it
2. **Menu commands** (MENU, HELP, 1-11) → Handled normally
3. **Service flows** → Routed to service handlers
4. **Natural language** → Processed by AI Agent
5. **AI Agent**:
   - Loads conversation history
   - Sends to OpenAI Chat Completions API
   - Returns intelligent response
   - Saves to conversation history

## 🧪 Testing

Send a natural language message that doesn't match menu commands:

```
User: "What services do you offer?"
Bot: [AI Agent responds intelligently]
```

## 📝 Notes

- The AI agent only activates for messages that don't match menu commands
- Conversation history provides context for better responses
- Falls back to menu if OpenAI fails
- Uses GPT-3.5-turbo for cost-effectiveness (can be changed in code)

