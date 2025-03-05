const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '名前は必須です'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'メールアドレスは必須です'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, '有効なメールアドレスを入力してください']
  },
  password: {
    type: String,
    required: [true, 'パスワードは必須です'],
    minlength: [8, 'パスワードは8文字以上である必要があります'],
    select: false
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return validator.isMobilePhone(v, 'ja-JP') || validator.isEmpty(v);
      },
      message: '有効な電話番号を入力してください'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // サービスURL用のトークン
  serviceToken: {
    type: String,
    unique: true,
    default: function() {
      // ランダムなサービストークンを生成（8文字）
      return crypto.randomBytes(4).toString('hex');
    }
  }
});

// パスワードハッシュ化のミドルウェア
userSchema.pre('save', async function(next) {
  // パスワードが変更されていない場合はスキップ
  if (!this.isModified('password')) return next();
  
  // パスワードをハッシュ化
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// パスワード検証メソッド
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// サービスURL生成メソッド
userSchema.methods.generateServiceUrl = function(baseUrl = process.env.SERVICE_BASE_URL || 'http://localhost:3000') {
  return `${baseUrl}/found?token=${this.serviceToken}`;
};

const User = mongoose.model('User', userSchema);

module.exports = User;