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

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../login.html'));
});

app.get('/register-tag', (req, res) => {
  res.sendFile(path.join(__dirname, '../register-tag.html'));
});

app.get('/nfc-setup', (req, res) => {
  res.sendFile(path.join(__dirname, '../nfc-setup.html'));
});

app.get('/my-tags', (req, res) => {
  res.sendFile(path.join(__dirname, '../my-tags.html'));
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
  const errorLog = {
    timestamp,
    type,
    message,
    error: error ? error.toString() : null,
    stack: error && error.stack ? error.stack : null
  };
  
  // コンソールにエラーを出力
  console.error(`[${timestamp}] [${type}] ${message}:`, error);
  
  // エラーログをファイルに保存（オプション）
  if (process.env.LOG_ERRORS === 'true') {
    const fs = require('fs');
    const logDir = path.join(__dirname, '../logs');
    
    // ログディレクトリが存在しない場合は作成
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(errorLog) + '\n');
  }
  
  // 管理者に通知（オプション）
  if (process.env.NOTIFY_ADMIN === 'true' && process.env.ADMIN_EMAIL) {
    // メール通知（実装例）
    // sendAdminNotification(errorLog);
    console.log(`管理者通知が有効: ${process.env.ADMIN_EMAIL} に通知が送信されます`);
  }
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