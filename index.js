import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import 'dotenv/config';
import connectDB from "./src/config/db.js";
import authRoutes from './src/routes/auth.routes.js';


const app = express();
const PORT = process.env.PORT || 3000;


app.use(morgan('dev'));
app.use(express.json());


app.use(cors({
  origin: true, 
  credentials: true
}));


connectDB();

app.get("/", (req, res) => {
  res.send("C-transit server is running");
});

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://c-transit.vercel.app/"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

