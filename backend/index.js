import express from 'express';
import morgan from 'morgan';
import 'dotenv/config';
import conncetDB from './config/db.js';
import authroutes from './routes/auth.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(express.json());

conncetDB();

app.get("/", (req, res) => {
  res.send("C-transit server is running");
});

app.use('/api/auth', authroutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});