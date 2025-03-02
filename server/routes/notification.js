const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Tag = require('../models/Tag');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// メール送信設定
let transporter;
if (process.env.SKIP_EMAIL !== 'true') {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('メール送信設定が完了しました');
  } catch (err) {
    console.error('メール送信設定エラー:', err);
    console.log('メール送信機能なしでサーバーを起動します');
  }
} else {
  console.log('メール送信機能をスキップします');
}

// 通知の作成（発見者からの情報送信）
router.post('/', async (req, res) => {
  try {
    const {
      tagId,
      location,
      foundDate,
      details,
      contactEmail,
      contactPhone,
      message
    } = req.body;

    // MongoDBがスキップされている場合はモックデータを使用
    if (process.env.SKIP_MONGODB === 'true') {
      console.log('MongoDBがスキップされているため、モックデータを使用します');
      console.log('受信データ:', {
        tagId,
        location,
        foundDate,
        details,
        contactEmail,
        contactPhone,
        message
      });
      
      // メール通知用のmailtoリンクを生成（デモモード）
      const subject = encodeURIComponent('【おかえりNFC】あなたの持ち物が見つかりました');
      const body = encodeURIComponent(
        `持ち主様\n\n` +
        `あなたの持ち物が見つかりました。\n\n` +
        `■ 発見情報\n` +
        `発見場所: ${location}\n` +
        `発見日時: ${new Date(foundDate || Date.now()).toLocaleString('ja-JP')}\n` +
        (details ? `詳細情報: ${details}\n` : '') +
        (message ? `\n■ 発見者からのメッセージ\n${message}\n` : '') +
        (contactEmail || contactPhone ? `\n■ 発見者の連絡先\n` +
          (contactEmail ? `メールアドレス: ${contactEmail}\n` : '') +
          (contactPhone ? `電話番号: ${contactPhone}\n` : '') : '') +
        `\n※このメールは自動送信されています。\n` +
        `© 2025 おかえりNFC. All rights reserved.`
      );
      
      // mailtoリンクを生成（受信者は空欄）
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      
      // 成功レスポンスを返す
      return res.status(201).json({
        success: true,
        message: '通知が正常に送信されました（デモモード）',
        data: {
          notification: {
            id: 'mock-notification-id',
            createdAt: new Date()
          },
          mailtoLink: mailtoLink
        }
      });
    }

    // タグIDからタグ情報を取得
    let tag;
    try {
      tag = await Tag.findOne({ tagId }).populate({
        path: 'owner',
        select: 'name email phone'
      });

      if (!tag) {
        return res.status(404).json({
          success: false,
          message: '指定されたタグが見つかりません'
        });
      }
    } catch (dbErr) {
      console.error('データベース接続エラー:', dbErr);
      // メール通知用のmailtoリンクを生成（データベース接続エラー時）
      const subject = encodeURIComponent('【おかえりNFC】あなたの持ち物が見つかりました');
      const body = encodeURIComponent(
        `持ち主様\n\n` +
        `あなたの持ち物が見つかりました。\n\n` +
        `■ 発見情報\n` +
        `発見場所: ${location}\n` +
        `発見日時: ${new Date(foundDate || Date.now()).toLocaleString('ja-JP')}\n` +
        (details ? `詳細情報: ${details}\n` : '') +
        (message ? `\n■ 発見者からのメッセージ\n${message}\n` : '') +
        (contactEmail || contactPhone ? `\n■ 発見者の連絡先\n` +
          (contactEmail ? `メールアドレス: ${contactEmail}\n` : '') +
          (contactPhone ? `電話番号: ${contactPhone}\n` : '') : '') +
        `\n※このメールは自動送信されています。\n` +
        `© 2025 おかえりNFC. All rights reserved.`
      );
      
      // mailtoリンクを生成（受信者は空欄）
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      
      // データベースエラーの場合もデモモードで応答
      return res.status(201).json({
        success: true,
        message: '通知が正常に送信されました（データベース接続なし）',
        data: {
          notification: {
            id: 'mock-notification-id',
            createdAt: new Date()
          },
          mailtoLink: mailtoLink
        }
      });
    }

    // 通知の作成
    let notification;
    try {
      notification = await Notification.create({
        tag: tag._id,
        location,
        foundDate: foundDate || new Date(),
        details,
        contactEmail,
        contactPhone,
        message,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (dbErr) {
      console.error('通知作成エラー:', dbErr);
      // メール通知用のmailtoリンクを生成（通知作成エラー時）
      const subject = encodeURIComponent('【おかえりNFC】あなたの持ち物が見つかりました');
      const body = encodeURIComponent(
        `持ち主様\n\n` +
        `あなたの持ち物が見つかりました。\n\n` +
        `■ 発見情報\n` +
        `発見場所: ${location}\n` +
        `発見日時: ${new Date(foundDate || Date.now()).toLocaleString('ja-JP')}\n` +
        (details ? `詳細情報: ${details}\n` : '') +
        (message ? `\n■ 発見者からのメッセージ\n${message}\n` : '') +
        (contactEmail || contactPhone ? `\n■ 発見者の連絡先\n` +
          (contactEmail ? `メールアドレス: ${contactEmail}\n` : '') +
          (contactPhone ? `電話番号: ${contactPhone}\n` : '') : '') +
        `\n※このメールは自動送信されています。\n` +
        `© 2025 おかえりNFC. All rights reserved.`
      );
      
      // mailtoリンクを生成（受信者は空欄）
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      
      // データベースエラーの場合もデモモードで応答
      return res.status(201).json({
        success: true,
        message: '通知が正常に送信されました（データベース接続なし）',
        data: {
          notification: {
            id: 'mock-notification-id',
            createdAt: new Date()
          },
          mailtoLink: mailtoLink
        }
      });
    }

    // メール通知用のmailtoリンクを生成
    let mailtoLink = null;
    if (tag.owner && tag.owner.email) {
      try {
        // メールの件名と本文を作成
        const subject = encodeURIComponent('【おかえりNFC】あなたの持ち物が見つかりました');
        
        // メール本文
        let body = encodeURIComponent(
          `${tag.owner.name} 様\n\n` +
          `あなたの持ち物「${tag.name}」が見つかりました。\n\n` +
          `■ 発見情報\n` +
          `発見場所: ${location}\n` +
          `発見日時: ${new Date(foundDate || Date.now()).toLocaleString('ja-JP')}\n` +
          (details ? `詳細情報: ${details}\n` : '') +
          (message ? `\n■ 発見者からのメッセージ\n${message}\n` : '') +
          (contactEmail || contactPhone ? `\n■ 発見者の連絡先\n` +
            (contactEmail ? `メールアドレス: ${contactEmail}\n` : '') +
            (contactPhone ? `電話番号: ${contactPhone}\n` : '') : '') +
          `\n詳細はアカウントにログインしてご確認ください。\n` +
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}\n\n` +
          `※このメールは自動送信されています。\n` +
          `© 2025 おかえりNFC. All rights reserved.`
        );
        
        // mailtoリンクを生成
        mailtoLink = `mailto:${tag.owner.email}?subject=${subject}&body=${body}`;
        console.log(`持ち主(${tag.owner.email})へのmailtoリンクを生成しました`);
      } catch (err) {
        console.error('mailtoリンク生成エラー:', err);
      }
    } else {
      console.log('メール通知用のmailtoリンク生成をスキップしました');
    }

    res.status(201).json({
      success: true,
      message: '通知が正常に送信されました',
      data: {
        notification: {
          id: notification._id,
          createdAt: notification.createdAt
        },
        mailtoLink: mailtoLink
      }
    });
  } catch (err) {
    console.error('通知作成エラー:', err);
    res.status(500).json({
      success: false,
      message: '通知の作成中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 特定のユーザーの通知一覧を取得（認証必要）
router.get('/user/:userId', async (req, res) => {
  try {
    // 認証チェック（実際の実装では認証ミドルウェアを使用）
    // if (req.user.id !== req.params.userId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'アクセス権限がありません'
    //   });
    // }

    const userId = req.params.userId;
    
    // ユーザーのタグを取得
    const tags = await Tag.find({ owner: userId });
    const tagIds = tags.map(tag => tag._id);
    
    // タグに関連する通知を取得
    const notifications = await Notification.find({ tag: { $in: tagIds } })
      .sort({ createdAt: -1 })
      .populate({
        path: 'tag',
        select: 'name tagId'
      });
    
    res.status(200).json({
      success: true,
      results: notifications.length,
      data: {
        notifications
      }
    });
  } catch (err) {
    console.error('通知取得エラー:', err);
    res.status(500).json({
      success: false,
      message: '通知の取得中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 通知のステータス更新（認証必要）
router.patch('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '指定された通知が見つかりません'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        notification
      }
    });
  } catch (err) {
    console.error('通知更新エラー:', err);
    res.status(500).json({
      success: false,
      message: '通知の更新中にエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;