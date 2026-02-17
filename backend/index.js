import express from 'express';
import morgan from 'morgan';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(express.json());

conncetDB();

app.get("/", (req, res) => {
  res.send("C-transit server is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});