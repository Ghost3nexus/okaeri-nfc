const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

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
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 仮想フィールド: ユーザーに関連するタグ
userSchema.virtual('tags', {
  ref: 'Tag',
  localField: '_id',
  foreignField: 'owner'
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

// パスワードリセットトークン生成メソッド
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10分間有効
  
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;