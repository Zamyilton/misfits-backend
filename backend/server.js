const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
require('dotenv').config();

const app = express();
const upload = multer();

app.use(cors());

app.post('/send', upload.single('photo'), async (req, res) => {
  const { caption } = req.body;
  const photo = req.file;

  if (!photo || !caption) return res.status(400).json({ error: 'Missing image or message.' });

  const formData = new FormData();
  formData.append('chat_id', process.env.CHAT_ID);
  formData.append('caption', caption);
  formData.append('photo', photo.buffer, {
    filename: photo.originalname,
    contentType: photo.mimetype,
  });

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendPhoto`,
      formData,
      { headers: formData.getHeaders() }
    );
    res.json({ success: true, telegram_response: response.data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send to Telegram', detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
