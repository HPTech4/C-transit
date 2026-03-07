import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import 'dotenv/config';
import conncetDB from './src/config/db.js';
import authroutes from './src/routes/auth.routes.js';


const app = express();
const PORT = process.env.PORT || 3000;


app.use(morgan('dev'));
app.use(express.json());


app.use(cors({
  origin: true, 
  credentials: true
}));


conncetDB();


app.get("/", (req, res) => {
  res.send("C-transit server is running");
});
<<<<<<< Updated upstream:index.js
<<<<<<< Updated upstream:index.js
app.use(cors({
  origin: [
    "http://localhost:3000",
    "// Add the frontend URL here"
  ],
}));
=======
>>>>>>> Stashed changes:backend/index.js
=======
>>>>>>> Stashed changes:backend/index.js

app.use('/api/auth', authroutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

