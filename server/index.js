require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const notificationRoutes = require('./routes/notification');
const userRoutes = require('./routes/user');
const tagRoutes = require('./routes/tag');

// Express アプリの初期化
const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, '../')));

// APIルートの設定
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tags', tagRoutes);

// フロントエンドへのルーティング
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/found', (req, res) => {
  res.sendFile(path.join(__dirname, '../found.html'));
});

// MongoDB接続（オプション）
let dbConnected = false;

try {
  if (process.env.SKIP_MONGODB !== 'true') {
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/okaeri-nfc', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => {
      console.log('MongoDB接続成功');
      dbConnected = true;
    })
    .catch((err) => {
      console.error('MongoDB接続エラー:', err);
      console.log('MongoDBなしでサーバーを起動します（一部機能が制限されます）');
    });
  } else {
    console.log('MongoDBをスキップしてサーバーを起動します（一部機能が制限されます）');
  }
} catch (err) {
  console.error('MongoDB接続エラー:', err);
  console.log('MongoDBなしでサーバーを起動します（一部機能が制限されます）');
}

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'サーバーエラーが発生しました',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;