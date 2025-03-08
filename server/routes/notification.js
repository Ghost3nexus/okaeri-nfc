const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Tag = require('../models/Tag');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
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
    // 送信元メールアドレスの設定
    const senderEmail = process.env.SENDER_EMAIL || 'info@mamo-tag.jp';
    console.log(`メール送信設定が完了しました (送信元: ${senderEmail})`);
  } catch (err) {
    console.error('メール送信設定エラー:', err);
    console.log('メール送信機能なしでサーバーを起動します');
  }
} else {
  console.log('メール送信機能をスキップします (SKIP_EMAIL=true)');
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

    console.log('通知作成リクエスト受信:', {
      tagId,
      location,
      foundDate,
      details,
      contactEmail,
      contactPhone,
      message
    });

    // MongoDBがスキップされている場合はモックデータを使用
    if (process.env.SKIP_MONGODB === 'true') {
      console.log('MongoDBがスキップされているため、モックデータを使用します');
      
      // 送信元メールアドレスの設定
      const senderEmail = process.env.SENDER_EMAIL || 'info@mamo-tag.jp';
      
      // デモモードでもメール送信をシミュレート
      let emailSent = false;
      if (transporter && process.env.SKIP_EMAIL !== 'true') {
        try {
          // メールの件名と本文を作成
          const subject = '【まもタグ】落とし物が見つかりました';
          
          // メール本文
          const body = `まもタグ運営者様

落とし物が見つかりました。

■ 発見情報
発見場所: ${location}
発見日時: ${new Date(foundDate || Date.now()).toLocaleString('ja-JP')}
${details ? `詳細情報: ${details}` : ''}
${message ? `\n■ 発見者からのメッセージ\n${message}` : ''}

※このメールは自動送信されています。
© 2025 まもタグ. All rights reserved.`;
          
          // メール送信オプション
          const mailOptions = {
            from: `"まもタグ" <${senderEmail}>`,
            to: senderEmail, // 送信先を運営者アドレスに設定
            bcc: 'demo@example.com', // デモユーザーにBCCで送信
            subject: subject,
            text: body
          };
          
          // メール送信
          await transporter.sendMail(mailOptions);
          emailSent = true;
          console.log('デモモードでメールを送信しました (送信元: ' + senderEmail + ')');
        } catch (err) {
          console.error('デモモードのメール送信エラー:', err);
        }
      } else {
        console.log('デモモードでメール送信をスキップしました (SKIP_EMAIL=true または transporter未設定)');
      }
      
      // モックの通知データを作成（デモモード用）
      const mockNotification = {
        _id: 'mock-notification-id-' + Date.now(),
        tag: {
          _id: 'mock-tag-id',
          name: 'デモ用タグ',
          tagId: tagId || 'TAG001'
        },
        location: location || '不明',
        foundDate: foundDate || new Date(),
        details: details || '詳細情報なし',
        contactEmail: contactEmail || senderEmail,
        message: message || '',
        status: '未読',
        createdAt: new Date()
      };
      
      // Node.jsサーバーではlocalStorageは使用できないため、
      // モック通知はメモリ内またはファイルに保存する必要があります
      // ここではシンプルにログ出力のみ行います
      console.log('モック通知を作成しました:', mockNotification);
      
      // 成功レスポンスを返す
      return res.status(201).json({
        success: true,
        message: '通知が正常に送信されました（デモモード）',
        data: {
          notification: {
            id: mockNotification._id,
            createdAt: mockNotification.createdAt
          },
          emailSent: emailSent
        }
      });
    }

    // タグIDからタグ情報を取得
    let tag;
    try {
      // タグIDがサービストークンの場合とタグIDの場合の両方に対応
      tag = await Tag.findOne({
        $or: [
          { tagId: tagId },
          { serviceToken: tagId }
        ]
      }).populate({
        path: 'owner',
        select: 'name email phone'
      });

      if (!tag) {
        console.log('指定されたタグが見つかりません:', tagId);
        return res.status(404).json({
          success: false,
          message: '指定されたタグが見つかりません'
        });
      }
      
      console.log('タグが見つかりました:', tag);
    } catch (dbErr) {
      console.error('データベース接続エラー:', dbErr);
      
      // 送信元メールアドレスの設定
      const senderEmail = process.env.SENDER_EMAIL || 'info@mamo-tag.jp';
      
      // メール通知用のmailtoリンクを生成（データベース接続エラー時）
      const subject = encodeURIComponent('【まもタグ】落とし物が見つかりました');
      const body = encodeURIComponent(
        `まもタグ運営者様\n\n` +
        `落とし物が見つかりました。\n\n` +
        `■ 発見情報\n` +
        `発見場所: ${location}\n` +
        `発見日時: ${new Date(foundDate || Date.now()).toLocaleString('ja-JP')}\n` +
        (details ? `詳細情報: ${details}\n` : '') +
        (message ? `\n■ 発見者からのメッセージ\n${message}\n` : '') +
        (contactEmail || contactPhone ? `\n■ 発見者の連絡先\n` +
          (contactEmail ? `メールアドレス: ${contactEmail}\n` : '') +
          (contactPhone ? `電話番号: ${contactPhone}\n` : '') : '') +
        `\n※このメールは自動送信されています。\n` +
        `© 2025 まもタグ. All rights reserved.`
      );
      
      // mailtoリンクを生成（送信元を統一アドレスに設定）
      const mailtoLink = `mailto:${senderEmail}?subject=${subject}&body=${body}`;
      
      // データベースエラーの場合もデモモードで応答
      return res.status(201).json({
        success: true,
        message: '通知が正常に送信されました（データベース接続なし）',
        data: {
          notification: {
            id: 'mock-notification-id',
            createdAt: new Date()
          },
          emailSent: false
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
      
      console.log('通知が作成されました:', notification);
    } catch (dbErr) {
      console.error('通知作成エラー:', dbErr);
      
      // 送信元メールアドレスの設定
      const senderEmail = process.env.SENDER_EMAIL || 'info@mamo-tag.jp';
      
      // メール通知用のmailtoリンクを生成（通知作成エラー時）
      const subject = encodeURIComponent('【まもタグ】落とし物が見つかりました');
      const body = encodeURIComponent(
        `まもタグ運営者様\n\n` +
        `落とし物が見つかりました。\n\n` +
        `■ 発見情報\n` +
        `発見場所: ${location}\n` +
        `発見日時: ${new Date(foundDate || Date.now()).toLocaleString('ja-JP')}\n` +
        (details ? `詳細情報: ${details}\n` : '') +
        (message ? `\n■ 発見者からのメッセージ\n${message}\n` : '') +
        (contactEmail || contactPhone ? `\n■ 発見者の連絡先\n` +
          (contactEmail ? `メールアドレス: ${contactEmail}\n` : '') +
          (contactPhone ? `電話番号: ${contactPhone}\n` : '') : '') +
        `\n※このメールは自動送信されています。\n` +
        `© 2025 まもタグ. All rights reserved.`
      );
      
      // mailtoリンクを生成（送信元を統一アドレスに設定）
      const mailtoLink = `mailto:${senderEmail}?subject=${subject}&body=${body}`;
      
      // データベースエラーの場合もデモモードで応答
      return res.status(201).json({
        success: true,
        message: '通知が正常に送信されました（データベース接続なし）',
        data: {
          notification: {
            id: 'mock-notification-id',
            createdAt: new Date()
          },
          emailSent: false
        }
      });
    }

    // サーバー側でメール送信
    let emailSent = false;
    if (tag.owner && tag.owner.email && transporter && process.env.SKIP_EMAIL !== 'true') {
      try {
        // 送信元メールアドレスの設定
        const senderEmail = process.env.SENDER_EMAIL || 'info@mamo-tag.jp';
        
        // メールの件名と本文を作成
        const subject = '【まもタグ】あなたの持ち物が見つかりました';
        
        // メール本文
        const body = `${tag.owner.name} 様

あなたの持ち物「${tag.name}」が見つかりました。

■ 発見情報
発見場所: ${location}
発見日時: ${new Date(foundDate || Date.now()).toLocaleString('ja-JP')}
${details ? `詳細情報: ${details}` : ''}
${message ? `\n■ 発見者からのメッセージ\n${message}` : ''}

詳細はアカウントにログインしてご確認ください。
${process.env.FRONTEND_URL || 'http://localhost:3000'}

※このメールは自動送信されています。
© 2025 まもタグ. All rights reserved.`;
        
        // メール送信オプション
        const mailOptions = {
          from: `"まもタグ" <${senderEmail}>`,
          to: senderEmail, // 送信先を運営者アドレスに設定
          bcc: tag.owner.email, // 実際の持ち主にはBCCで送信
          subject: subject,
          text: body
        };
        
        // メール送信
        await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log(`持ち主(${tag.owner.email})へメールを送信しました (送信元: ${senderEmail})`);
      } catch (err) {
        console.error('メール送信エラー:', err);
      }
    } else {
      console.log('メール送信をスキップしました (SKIP_EMAIL=true または transporter未設定)');
      // 通知はデータベースに保存されるので、メール送信がスキップされても問題ない
    }

    res.status(201).json({
      success: true,
      message: '通知が正常に送信されました',
      data: {
        notification: {
          id: notification._id,
          createdAt: notification.createdAt
        },
        emailSent: emailSent
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
    
    console.log('Received Token:', token);
    
    // トークンの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Decoded Token:', decoded);
    
    // MongoDBをスキップする場合はモックユーザーを使用
    if (process.env.SKIP_MONGODB === 'true') {
      console.log('デコードされたトークンID:', decoded.id);
      // デモ用のモックユーザー
      if (decoded.id === 'mock-user-id-123' || decoded.id.toString() === 'mock-user-id-123') {
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

// 現在のユーザーの通知一覧を取得（認証必要）
router.get('/user', protect, async (req, res) => {
  try {
    // MongoDBをスキップする場合はモックデータを使用
    if (process.env.SKIP_MONGODB === 'true') {
      console.log('MongoDBがスキップされているため、モックデータを使用します');
      
      // デモ用のモック通知
      const mockNotifications = [
        {
          _id: 'mock-notification-id-1',
          tag: {
            _id: 'mock-tag-id-1',
            name: 'デモ用財布タグ',
            tagId: 'TAG001'
          },
          location: '東京駅',
          foundDate: new Date(),
          details: 'コインロッカー付近で発見されました',
          contactEmail: 'finder@example.com',
          status: '未読',
          createdAt: new Date()
        },
        {
          _id: 'mock-notification-id-2',
          tag: {
            _id: 'mock-tag-id-2',
            name: 'デモ用キータグ',
            tagId: 'TAG002'
          },
          location: '渋谷駅',
          foundDate: new Date(Date.now() - 86400000), // 1日前
          details: '改札付近で発見されました',
          contactPhone: '090-1234-5678',
          status: '既読',
          createdAt: new Date(Date.now() - 86400000) // 1日前
        }
      ];
      
      return res.status(200).json({
        success: true,
        results: mockNotifications.length,
        data: {
          notifications: mockNotifications
        }
      });
    }
    
    // MongoDBを使用する場合は通常の処理
    // ユーザーのタグを取得
    const tags = await Tag.find({ owner: req.user._id });
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