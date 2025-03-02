const mongoose = require('mongoose');
const crypto = require('crypto');

const tagSchema = new mongoose.Schema({
  tagId: {
    type: String,
    required: [true, 'タグIDは必須です'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'タグ名は必須です'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, '所有者は必須です']
  },
  itemType: {
    type: String,
    enum: ['財布', 'キー', 'バッグ', 'スマートフォン', '書類', 'その他'],
    default: 'その他'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastFoundAt: {
    type: Date
  },
  // 追加フィールド
  urlToken: {
    type: String,
    unique: true,
    default: function() {
      // ランダムなURLトークンを生成（8文字）
      return crypto.randomBytes(4).toString('hex');
    }
  },
  customUrl: {
    type: String,
    trim: true
  },
  qrCodeUrl: {
    type: String
  },
  nfcWritten: {
    type: Boolean,
    default: false
  },
  nfcWrittenAt: {
    type: Date
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// サービス固有URLを生成するメソッド
tagSchema.methods.generateServiceUrl = function(baseUrl = process.env.SERVICE_BASE_URL || 'http://localhost:3000') {
  return `${baseUrl}/found.html?tagId=${this.tagId}&token=${this.urlToken}`;
};

// 仮想フィールド: タグに関連する通知
tagSchema.virtual('notifications', {
  ref: 'Notification',
  localField: '_id',
  foreignField: 'tag'
});

// インデックス
tagSchema.index({ tagId: 1 });
tagSchema.index({ owner: 1 });

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;