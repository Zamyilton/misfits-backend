const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Limit upload size to 50MB
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

app.use(cors());

app.post('/send', (req, res, next) => {
  upload.single('media')(req, res, err => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large. Max 50MB allowed.' });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  const { caption } = req.body;
  const media = req.file;

  if (!media) {
    return res.status(400).json({ error: 'Missing media file.' });
  }

  const formData = new FormData();
  formData.append('chat_id', process.env.CHAT_ID);
  if (caption) formData.append('caption', caption);

  let telegramEndpoint = '';

  if (media.mimetype.startsWith('video')) {
    formData.append('video', media.buffer, {
      filename: media.originalname,
      contentType: media.mimetype,
    });
    telegramEndpoint = 'sendVideo';
  } else if (media.mimetype.startsWith('image')) {
    formData.append('photo', media.buffer, {
      filename: media.originalname,
      contentType: media.mimetype,
    });
    telegramEndpoint = 'sendPhoto';
  } else {
    return res.status(400).json({ error: 'Unsupported media type. Only images and videos allowed.' });
  }

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/${telegramEndpoint}`,
      formData,
      { headers: formData.getHeaders() }
    );
    res.json({ success: true, telegram_response: response.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send to Telegram', detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
