import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import conversationRoutes from './routes/conversations.js';
import { TONES } from './config/tones.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/tones', (req, res) => res.json(Object.keys(TONES)));
app.use('/api/conversations', conversationRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

await mongoose.connect(process.env.MONGODB_URI);
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`MongoDB connected. API running on ${port}`));