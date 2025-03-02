const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');
const Notification = require('../models/Notification');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

// 認証ミドルウェア（user.jsと同じ内容）
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

// タグ情報の取得（タグIDとトークンから）- 認証不要
router.get('/public/:tagId', async (req, res) => {
  try {
    const { token } = req.query;
    const tag = await Tag.findOne({ tagId: req.params.tagId });
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '指定されたタグが見つかりません'
      });
    }
    
    // トークンが提供され、一致する場合は追加情報を返す
    const isTokenValid = token && tag.urlToken === token;
    
    // 公開情報を返す
    res.status(200).json({
      success: true,
      data: {
        tagId: tag.tagId,
        name: tag.name,
        itemType: tag.itemType,
        isActive: tag.isActive,
        // トークンが有効な場合のみ追加情報を含める
        verified: isTokenValid,
        ownerVerified: isTokenValid ? tag.isActive : undefined
      }
    });
  } catch (err) {
    console.error('タグ取得エラー:', err);
    res.status(500).json({
      success: false,
      message: 'タグ情報の取得中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// タグのサービスURL情報を取得（認証必要）
router.get('/:id/service-url', protect, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '指定されたタグが見つかりません'
      });
    }
    
    // 所有者のみがアクセス可能
    if (tag.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'このタグの情報にアクセスする権限がありません'
      });
    }
    
    // サービスURLを生成
    const serviceUrl = tag.generateServiceUrl();
    
    // QRコードを生成（存在しない場合）
    if (!tag.qrCodeUrl) {
      const qrDir = path.join(__dirname, '../../public/qrcodes');
      
      // ディレクトリが存在しない場合は作成
      if (!fs.existsSync(qrDir)) {
        fs.mkdirSync(qrDir, { recursive: true });
      }
      
      const qrFileName = `tag_${tag._id}.png`;
      const qrFilePath = path.join(qrDir, qrFileName);
      const qrCodeUrl = `/qrcodes/${qrFileName}`;
      
      // QRコードを生成して保存
      await QRCode.toFile(qrFilePath, serviceUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300
      });
      
      // QRコードURLを保存
      tag.qrCodeUrl = qrCodeUrl;
      await tag.save();
    }
    
    res.status(200).json({
      success: true,
      data: {
        tagId: tag.tagId,
        urlToken: tag.urlToken,
        serviceUrl: serviceUrl,
        qrCodeUrl: tag.qrCodeUrl,
        nfcWritten: tag.nfcWritten,
        nfcWrittenAt: tag.nfcWrittenAt
      }
    });
  } catch (err) {
    console.error('サービスURL取得エラー:', err);
    res.status(500).json({
      success: false,
      message: 'サービスURLの取得中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ユーザーのタグ一覧を取得
router.get('/user', protect, async (req, res) => {
  try {
    const tags = await Tag.find({ owner: req.user._id });
    
    res.status(200).json({
      success: true,
      results: tags.length,
      data: {
        tags
      }
    });
  } catch (err) {
    console.error('タグ一覧取得エラー:', err);
    res.status(500).json({
      success: false,
      message: 'タグ一覧の取得中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 新しいタグを登録
router.post('/', protect, async (req, res) => {
  try {
    const { tagId, name, description, itemType } = req.body;
    
    // タグIDの重複チェック
    const existingTag = await Tag.findOne({ tagId });
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: 'このタグIDは既に登録されています'
      });
    }
    
    // タグを作成
    const newTag = await Tag.create({
      tagId,
      name,
      description,
      itemType,
      owner: req.user._id
    });
    
    res.status(201).json({
      success: true,
      data: {
        tag: newTag
      }
    });
  } catch (err) {
    console.error('タグ登録エラー:', err);
    res.status(500).json({
      success: false,
      message: 'タグの登録中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// タグ情報を更新
router.patch('/:id', protect, async (req, res) => {
  try {
    // タグの所有者確認
    const tag = await Tag.findById(req.params.id);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '指定されたタグが見つかりません'
      });
    }
    
    // 所有者のみが更新可能
    if (tag.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'このタグを更新する権限がありません'
      });
    }
    
    // 更新するフィールドをフィルタリング
    const filteredBody = {};
    const allowedFields = ['name', 'description', 'itemType', 'isActive', 'customUrl'];
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredBody[key] = req.body[key];
      }
    });
    
    // タグ情報を更新
    const updatedTag = await Tag.findByIdAndUpdate(
      req.params.id,
      filteredBody,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: {
        tag: updatedTag
      }
    });
  } catch (err) {
    console.error('タグ更新エラー:', err);
    res.status(500).json({
      success: false,
      message: 'タグの更新中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// NFCタグ書き込みステータスを更新
router.patch('/:id/nfc-status', protect, async (req, res) => {
  try {
    // タグの所有者確認
    const tag = await Tag.findById(req.params.id);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '指定されたタグが見つかりません'
      });
    }
    
    // 所有者のみが更新可能
    if (tag.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'このタグを更新する権限がありません'
      });
    }
    
    // NFCタグ書き込みステータスを更新
    tag.nfcWritten = true;
    tag.nfcWrittenAt = new Date();
    await tag.save();
    
    res.status(200).json({
      success: true,
      data: {
        tag: {
          id: tag._id,
          tagId: tag.tagId,
          nfcWritten: tag.nfcWritten,
          nfcWrittenAt: tag.nfcWrittenAt
        }
      }
    });
  } catch (err) {
    console.error('NFC書き込みステータス更新エラー:', err);
    res.status(500).json({
      success: false,
      message: 'NFC書き込みステータスの更新中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// URLトークンを再生成
router.post('/:id/regenerate-token', protect, async (req, res) => {
  try {
    // タグの所有者確認
    const tag = await Tag.findById(req.params.id);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '指定されたタグが見つかりません'
      });
    }
    
    // 所有者のみが更新可能
    if (tag.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'このタグを更新する権限がありません'
      });
    }
    
    // 新しいURLトークンを生成
    const crypto = require('crypto');
    tag.urlToken = crypto.randomBytes(4).toString('hex');
    
    // QRコードURLをリセット（新しいURLで再生成するため）
    tag.qrCodeUrl = null;
    
    await tag.save();
    
    // サービスURLを生成
    const serviceUrl = tag.generateServiceUrl();
    
    res.status(200).json({
      success: true,
      data: {
        tag: {
          id: tag._id,
          tagId: tag.tagId,
          urlToken: tag.urlToken,
          serviceUrl: serviceUrl
        }
      }
    });
  } catch (err) {
    console.error('トークン再生成エラー:', err);
    res.status(500).json({
      success: false,
      message: 'トークンの再生成中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// タグを削除
router.delete('/:id', protect, async (req, res) => {
  try {
    // タグの所有者確認
    const tag = await Tag.findById(req.params.id);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '指定されたタグが見つかりません'
      });
    }
    
    // 所有者のみが削除可能
    if (tag.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'このタグを削除する権限がありません'
      });
    }
    
    // 関連する通知も削除
    await Notification.deleteMany({ tag: req.params.id });
    
    // タグを削除
    await Tag.findByIdAndDelete(req.params.id);
    
    res.status(204).json({
      success: true,
      data: null
    });
  } catch (err) {
    console.error('タグ削除エラー:', err);
    res.status(500).json({
      success: false,
      message: 'タグの削除中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// タグの通知履歴を取得
router.get('/:id/notifications', protect, async (req, res) => {
  try {
    // タグの所有者確認
    const tag = await Tag.findById(req.params.id);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '指定されたタグが見つかりません'
      });
    }
    
    // 所有者のみが閲覧可能
    if (tag.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'このタグの通知履歴を閲覧する権限がありません'
      });
    }
    
    // タグに関連する通知を取得
    const notifications = await Notification.find({ tag: req.params.id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      results: notifications.length,
      data: {
        notifications
      }
    });
  } catch (err) {
    console.error('通知履歴取得エラー:', err);
    res.status(500).json({
      success: false,
      message: '通知履歴の取得中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;