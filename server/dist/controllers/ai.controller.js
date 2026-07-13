"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithAI = void 0;
const openai_1 = __importDefault(require("openai"));
// Initialize OpenAI conditionally to avoid crashing if key is not set immediately
let openai = null;
try {
    if (process.env.OPENAI_API_KEY) {
        openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
}
catch (error) {
    console.warn("Could not initialize OpenAI client:", error);
}
const SYSTEM_PROMPT = `You are the NexusAI Assistant, a smart, helpful project management AI embedded in the NexusAI SaaS platform. 
Your goal is to help users manage their tasks, understand their project status, and provide insights.
Respond clearly and concisely using Markdown. If asked about tasks or projects, use the provided context.`;
const chatWithAI = async (req, res) => {
    try {
        const { messages, message } = req.body;
        const userId = req.user.id;
        // Standardize input format
        let chatMessages = [];
        if (messages && Array.isArray(messages)) {
            chatMessages = messages;
        }
        else if (message && typeof message === 'string') {
            chatMessages = [{ role: 'user', content: message }];
        }
        if (!openai || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('your_') || process.env.OPENAI_API_KEY.includes('placeholder')) {
            const lastUserMessage = chatMessages[chatMessages.length - 1]?.content?.toLowerCase() || '';
            let mockReply = `I'm currently running in sandbox mode. To enable real AI responses, please set a valid \`OPENAI_API_KEY\` in the backend environment. How can I help you manage your tasks today?`;
            if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi')) {
                mockReply = `Hello! I am your NexusAI Assistant. I can help you summarize tasks, organize sprints, or give productivity advice. How can I help you today?`;
            }
            else if (lastUserMessage.includes('task') || lastUserMessage.includes('sprint') || lastUserMessage.includes('project')) {
                mockReply = `Based on your current workspace, you have active projects on track. Would you like me to write a project status report or draft new tasks for you?`;
            }
            return res.status(200).json({
                role: 'assistant',
                content: mockReply,
                timestamp: new Date().toISOString()
            });
        }
        if (!chatMessages || chatMessages.length === 0) {
            return res.status(400).json({ message: 'Messages array or message string is required' });
        }
        // Optional: Fetch some user context to inject into the system prompt
        // const userTasks = await Task.find({ assignee: userId, status: { $ne: 'done' } }).limit(5);
        // const tasksContext = userTasks.map(t => `- [${t.status}] ${t.title}`).join('\\n');
        const fullMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...chatMessages.map((m) => ({
                role: m.role,
                content: m.content
            }))
        ];
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: fullMessages,
            temperature: 0.7,
        });
        const reply = response.choices[0].message.content;
        res.status(200).json({
            role: 'assistant',
            content: reply,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in AI chat:', error);
        res.status(500).json({ message: 'Error processing AI request', error: error.message });
    }
};
exports.chatWithAI = chatWithAI;
