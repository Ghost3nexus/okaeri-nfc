const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  tag: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tag',
    required: [true, 'タグIDは必須です']
  },
  location: {
    type: String,
    required: [true, '発見場所は必須です'],
    trim: true
  },
  foundDate: {
    type: Date,
    required: [true, '発見日時は必須です'],
    default: Date.now
  },
  details: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['未読', '既読', '対応中', '完了'],
    default: '未読'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// インデックス
notificationSchema.index({ tag: 1 });
notificationSchema.index({ createdAt: -1 });

// 通知が作成されたときに関連するタグの lastFoundAt を更新
notificationSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      await mongoose.model('Tag').findByIdAndUpdate(
        this.tag,
        { lastFoundAt: this.foundDate }
      );
    } catch (err) {
      console.error('タグの更新に失敗しました:', err);
    }
  }
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;