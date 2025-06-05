const express = require('express');
const multer  = require('multer');
const cors = require('cors');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'uploads/' });

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/audiodb';
let db;

async function connectDB() {
  const client = new MongoClient(mongoUrl);
  await client.connect();
  db = client.db(); // db = 'audiodb'
  console.log('MongoDB connected');
}
connectDB();

app.post('/api/upload', upload.single('audio'), async (req, res) => {
  const { age, gender } = req.body;
  const audioFile = req.file.filename;
  const entry = {
    age,
    gender,
    audioFile,
    createdAt: new Date()
  };
  await db.collection('audioentries').insertOne(entry);
  res.json({ status: 'ok', filename: audioFile });
});

app.listen(3001, () => console.log('API backend running on http://localhost:3001'));
