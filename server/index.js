require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const userRoutes = require('./routes/user');

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
app.use('/api/users', userRoutes);

// フロントエンドへのルーティング
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/found', (req, res) => {
  res.sendFile(path.join(__dirname, '../found.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../login.html'));
});

// MongoDB接続（オプション）
let dbConnected = false;

/**
 * エラーログを記録する関数
 * @param {string} type - エラータイプ
 * @param {Error} error - エラーオブジェクト
 * @param {string} message - エラーメッセージ
 */
const logError = (type, error, message) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${type}] ${message}:`, error);
};

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
      logError('DATABASE', err, 'MongoDB接続エラー');
      console.log('MongoDBなしでサーバーを起動します（一部機能が制限されます）');
    });
  } else {
    console.log('MongoDBをスキップしてサーバーを起動します（一部機能が制限されます）');
  }
} catch (err) {
  logError('DATABASE', err, 'MongoDB接続エラー（例外）');
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