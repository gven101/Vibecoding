import mongoose from 'mongoose';

const exchangeSchema = new mongoose.Schema({
  prompt:    { type: String, required: true },
  response:  { type: String, default: '' },
  tone:      { type: String, enum: ['professional', 'casual', 'concise'], required: true },
  stopped:   { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema(
  { title: { type: String, default: 'New chat' }, exchanges: [exchangeSchema] },
  { timestamps: true }
);

export default mongoose.model('Conversation', conversationSchema);