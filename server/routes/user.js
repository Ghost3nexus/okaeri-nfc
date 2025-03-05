const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT トークン生成
const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '90d' }
  );
};

// 認証トークンを送信
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // パスワードを削除
  user.password = undefined;
  
  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user
    }
  });
};

// ユーザー登録
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // メールアドレスの重複チェック
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'このメールアドレスは既に登録されています'
      });
    }
    
    // ユーザー作成
    const newUser = await User.create({
      name,
      email,
      password,
      phone
    });
    
    // サービスURLを生成
    const serviceUrl = newUser.generateServiceUrl();
    
    // トークン生成と送信
    createSendToken(newUser, 201, res);
  } catch (err) {
    console.error('ユーザー登録エラー:', err);
    res.status(500).json({
      success: false,
      message: 'ユーザー登録中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ログイン
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // メールアドレスとパスワードのチェック
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'メールアドレスとパスワードを入力してください'
      });
    }
    
    // MongoDBをスキップする場合はモックデータを使用
    if (process.env.SKIP_MONGODB === 'true') {
      // デモ用のモックユーザー
      if (email === 'demo@example.com' && password === 'password123') {
        const mockUser = {
          _id: 'mock-user-id-123',
          name: 'デモユーザー',
          email: 'demo@example.com',
          serviceToken: 'demo123',
          createdAt: new Date()
        };
        
        // トークン生成と送信
        return createSendToken(mockUser, 200, res);
      } else {
        return res.status(401).json({
          success: false,
          message: 'メールアドレスまたはパスワードが正しくありません'
        });
      }
    }
    
    // MongoDBを使用する場合は通常のログイン処理
    // ユーザー検索（パスワードを含める）
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }
    
    // トークン生成と送信
    createSendToken(user, 200, res);
  } catch (err) {
    console.error('ログインエラー:', err);
    res.status(500).json({
      success: false,
      message: 'ログイン中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 認証ミドルウェア
const protect = async (req, res, next) => {
  try {
    // トークンの取得
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'ログインしてください'
      });
    }
    
    // トークンの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // MongoDBをスキップする場合はモックユーザーを使用
    if (process.env.SKIP_MONGODB === 'true') {
      // デモ用のモックユーザー
      if (decoded.id === 'mock-user-id-123') {
        const mockUser = {
          _id: 'mock-user-id-123',
          name: 'デモユーザー',
          email: 'demo@example.com',
          serviceToken: 'demo123',
          createdAt: new Date()
        };
        
        // リクエストにユーザー情報を追加
        req.user = mockUser;
        return next();
      } else {
        return res.status(401).json({
          success: false,
          message: 'このトークンのユーザーは存在しません'
        });
      }
    }
    
    // MongoDBを使用する場合は通常の処理
    // ユーザーの存在確認
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'このトークンのユーザーは存在しません'
      });
    }
    
    // リクエストにユーザー情報を追加
    req.user = currentUser;
    next();
  } catch (err) {
    console.error('認証エラー:', err);
    res.status(401).json({
      success: false,
      message: '認証に失敗しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// 現在のユーザー情報を取得
router.get('/me', protect, async (req, res) => {
  try {
    // サービスURLを生成
    const serviceUrl = req.user.generateServiceUrl();
    
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        serviceUrl
      }
    });
  } catch (err) {
    console.error('ユーザー情報取得エラー:', err);
    res.status(500).json({
      success: false,
      message: 'ユーザー情報の取得中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 発見者用API - トークンからユーザー情報を取得
router.get('/found', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'トークンが提供されていません'
      });
    }
    
    // MongoDBをスキップする場合はモックデータを使用
    if (process.env.SKIP_MONGODB === 'true') {
      if (token === 'demo123') {
        return res.status(200).json({
          success: true,
          data: {
            name: 'デモユーザー',
            email: 'demo@example.com'
          }
        });
      } else {
        return res.status(404).json({
          success: false,
          message: '指定されたトークンのユーザーが見つかりません'
        });
      }
    }
    
    // トークンからユーザーを検索
    const user = await User.findOne({ serviceToken: token });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '指定されたトークンのユーザーが見つかりません'
      });
    }
    
    // 公開情報のみを返す
    res.status(200).json({
      success: true,
      data: {
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('ユーザー検索エラー:', err);
    res.status(500).json({
      success: false,
      message: 'ユーザー情報の検索中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;