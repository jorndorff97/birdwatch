import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import identifyRouter from './routes/identify.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', identifyRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Birdwatch backend running on http://localhost:${PORT}`);
});
