# まもタグ

NFCタグを活用した落とし物発見サービス「まもタグ」のソースコードです。

## 概要

「まもタグ」は、NFCタグを使って持ち物を管理し、紛失した場合に発見者が簡単に持ち主に通知できるサービスです。

### 主な機能

- NFCタグの登録・管理
- 発見者用フォームインターフェース
- 持ち主への通知機能（メール）
- ユーザーダッシュボード
- 管理画面での通知確認機能

### 最新の改善点

- **プライバシー保護の強化**: 持ち主の個人情報（名前、連絡先）を発見者に表示しないよう変更
- **通知方法の統一**: すべての通知メールを企業の統一アドレス（info@mamo-tag.jp）から送信
- **管理画面への通知機能**: 落とし物発見時の通知をダッシュボードに表示

### 通知機能の仕組み

1. **通知の作成**:
   - 落とし物発見ページで発見者が情報を入力
   - 「通知を送信する」ボタンをクリック
   - サーバーに通知データを送信

2. **通知の表示場所**:
   - ダッシュボード画面の「最近の通知」セクション
   - 通知専用ページ（notifications.html）
   - ダッシュボード上部の未読通知カウンター

## システム要件

- Node.js (v14以上)
- MongoDB (ローカルまたはMongoDB Atlas)
- SMTPサーバー（Gmailなど）

## インストール

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/mamo-tag.git
cd mamo-tag

# 依存パッケージのインストール
npm install
```

## 設定

### 環境変数の設定

`.env`ファイルを編集して、必要な環境変数を設定します：

```
# サーバー設定
PORT=3000
NODE_ENV=development

# MongoDB設定
SKIP_MONGODB=false
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/mamo-tag?retryWrites=true&w=majority

# JWT設定
JWT_SECRET=your-secret-key-should-be-at-least-32-characters-long
JWT_EXPIRES_IN=90d

# メール設定
SKIP_EMAIL=false
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
SENDER_EMAIL=info@mamo-tag.jp

# フロントエンド URL
FRONTEND_URL=http://localhost:3000
```

### MongoDB Atlasの設定

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)にアカウントを作成
2. クラスターを作成（無料枠でOK）
3. データベースユーザーを作成
4. ネットワークアクセスを設定（開発環境では「Allow Access from Anywhere」）
5. 接続文字列を取得し、`.env`ファイルの`MONGODB_URI`に設定

### Gmailの設定（メール通知用）

1. Googleアカウントの2段階認証を有効化
2. [アプリパスワード](https://myaccount.google.com/apppasswords)を生成
3. 生成されたパスワードを`.env`ファイルの`EMAIL_PASS`に設定

## テスト

### MongoDB接続テスト

```bash
node scripts/test-mongodb.js
```

### メール送信テスト

```bash
node scripts/test-email.js test@example.com
```

## 起動

```bash
# 開発モード
npm run dev

# 本番モード
npm start
```

サーバーが起動したら、ブラウザで http://localhost:3000 にアクセスしてください。

## プロジェクト構成

```
まもタグ/
├── css/                  # スタイルシート
├── images/               # 画像ファイル
├── js/                   # クライアントサイドJavaScript
├── scripts/              # ユーティリティスクリプト
├── server/               # サーバーサイドコード
│   ├── models/           # データモデル
│   └── routes/           # APIルート
├── .env                  # 環境変数
├── package.json          # プロジェクト設定
└── README.md             # プロジェクト説明
```

## 開発モード

開発中は、MongoDBやメール送信機能をスキップすることができます：

```
# .envファイルの設定
SKIP_MONGODB=true  # MongoDBをスキップ
SKIP_EMAIL=true    # メール送信をスキップ
```

## ライセンス

MIT