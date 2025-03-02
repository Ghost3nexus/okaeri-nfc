/**
 * メール送信テストスクリプト
 * 
 * 使用方法:
 * node scripts/test-email.js [送信先メールアドレス]
 * 
 * 例:
 * node scripts/test-email.js test@example.com
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

// コマンドライン引数から送信先メールアドレスを取得
const recipient = process.argv[2];

if (!recipient) {
  console.error('エラー: 送信先メールアドレスが指定されていません。');
  console.error('使用方法: node scripts/test-email.js [送信先メールアドレス]');
  process.exit(1);
}

// メール設定の確認
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
  console.error('エラー: .envファイルにメール設定が不足しています。');
  console.error('必要な設定: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS');
  process.exit(1);
}

console.log('メール送信テストを開始します...');
console.log(`SMTP設定:
  ホスト: ${EMAIL_HOST}
  ポート: ${EMAIL_PORT}
  セキュア接続: ${EMAIL_SECURE ? 'はい' : 'いいえ'}
  ユーザー: ${EMAIL_USER}
  パスワード: ${'*'.repeat(8)}
`);

// トランスポーターの作成
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_SECURE,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

console.log('SMTPサーバーへの接続を確認中...');

// SMTP接続のテスト
transporter.verify()
  .then(() => {
    console.log('SMTPサーバーへの接続に成功しました。');
    console.log(`テストメールを送信します: ${recipient}`);

    // テストメールの送信
    return transporter.sendMail({
      from: `"おかえりNFC" <${EMAIL_USER}>`,
      to: recipient,
      subject: '【おかえりNFC】メール送信テスト',
      html: `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>おかえりNFC - メール送信テスト</title>
          <style>
            body {
              font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', Meiryo, sans-serif;
              color: #333;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              background-color: #8BC34A;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
            }
            .notification-box {
              background-color: #f9f9f9;
              border-left: 4px solid #8BC34A;
              padding: 15px;
              margin-bottom: 20px;
            }
            .footer {
              background-color: #333;
              color: white;
              padding: 15px;
              text-align: center;
              font-size: 12px;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>おかえりNFC</h1>
            </div>
            <div class="content">
              <h2>メール送信テスト</h2>
              
              <div class="notification-box">
                <p>このメールは「おかえりNFC」のメール送信テストです。</p>
                <p>このメールが正常に届いた場合、メール送信機能は正常に動作しています。</p>
              </div>
              
              <p>テスト情報:</p>
              <ul>
                <li>送信日時: ${new Date().toLocaleString('ja-JP')}</li>
                <li>送信元: ${EMAIL_USER}</li>
                <li>送信先: ${recipient}</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>このメールは自動送信されています。返信はできません。</p>
              <p>&copy; 2025 おかえりNFC. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  })
  .then(info => {
    console.log('テストメールが正常に送信されました！');
    console.log(`メッセージID: ${info.messageId}`);
    console.log(`プレビューURL: ${nodemailer.getTestMessageUrl(info)}`);
    console.log('\nメール送信テストが正常に完了しました！');
  })
  .catch(err => {
    console.error('メール送信エラー:', err);
  });