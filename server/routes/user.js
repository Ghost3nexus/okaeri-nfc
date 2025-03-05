const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tag = require('../models/Tag');

// JWT トークン生成
const signToken = (id) => {
  // idが文字列かどうかをチェック（モックユーザーの場合）
  const payload = typeof id === 'string' ? { id } : { id: id.toString() };
  
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '90d' }
  );
  
  console.log('Generated Token Payload:', payload);
  console.log('Generated Token:', token);
  
  return token;
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
router.post('/signup', async (req, res) => {
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
          role: 'user',
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
    
    console.log('Received Token:', token);
    
    // トークンの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Decoded Token:', decoded);
    
    // MongoDBをスキップする場合はモックユーザーを使用
    if (process.env.SKIP_MONGODB === 'true') {
      // デモ用のモックユーザー
      if (decoded.id === 'mock-user-id-123') {
        const mockUser = {
          _id: 'mock-user-id-123',
          name: 'デモユーザー',
          email: 'demo@example.com',
          role: 'user',
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
    // ユーザーに関連するタグを取得
    const tags = await Tag.find({ owner: req.user._id });
    
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        tags
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

// ユーザー情報の更新
router.patch('/updateMe', protect, async (req, res) => {
  try {
    // パスワード更新は別のルートで処理
    if (req.body.password) {
      return res.status(400).json({
        success: false,
        message: 'このルートではパスワードを更新できません。/updateMyPassword を使用してください'
      });
    }
    
    // 更新するフィールドをフィルタリング
    const filteredBody = {};
    const allowedFields = ['name', 'email', 'phone', 'address'];
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredBody[key] = req.body[key];
      }
    });
    
    // ユーザー情報を更新
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      filteredBody,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: {
        user: updatedUser
      }
    });
  } catch (err) {
    console.error('ユーザー更新エラー:', err);
    res.status(500).json({
      success: false,
      message: 'ユーザー情報の更新中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 特定のユーザー情報を更新（IDを指定）
router.patch('/:id', protect, async (req, res) => {
  try {
    // パスワード更新は別のルートで処理
    if (req.body.password) {
      return res.status(400).json({
        success: false,
        message: 'このルートではパスワードを更新できません'
      });
    }
    
    // 更新するフィールドをフィルタリング
    const filteredBody = {};
    const allowedFields = ['name', 'email', 'phone', 'address'];
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredBody[key] = req.body[key];
      }
    });
    
    // ユーザーの存在確認
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '指定されたユーザーが見つかりません'
      });
    }
    
    // 自分自身のアカウントのみ更新可能
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '他のユーザーの情報を更新する権限がありません'
      });
    }
    
    // ユーザー情報を更新
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      filteredBody,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: {
        user: updatedUser
      }
    });
  } catch (err) {
    console.error('ユーザー更新エラー:', err);
    res.status(500).json({
      success: false,
      message: 'ユーザー情報の更新中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// パスワード更新
router.patch('/updateMyPassword', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // 現在のユーザーを取得（パスワードを含める）
    const user = await User.findById(req.user._id).select('+password');
    
    // 現在のパスワードが正しいか確認
    if (!(await user.correctPassword(currentPassword, user.password))) {
      return res.status(401).json({
        success: false,
        message: '現在のパスワードが正しくありません'
      });
    }
    
    // パスワードを更新
    user.password = newPassword;
    await user.save();
    
    // トークン生成と送信
    createSendToken(user, 200, res);
  } catch (err) {
    console.error('パスワード更新エラー:', err);
    res.status(500).json({
      success: false,
      message: 'パスワードの更新中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;