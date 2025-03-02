/**
 * MongoDB接続テストスクリプト
 * 
 * 使用方法:
 * node scripts/test-mongodb.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB接続URI
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('エラー: .envファイルにMONGODB_URIが設定されていません。');
  process.exit(1);
}

console.log('MongoDB接続テストを開始します...');
console.log(`接続URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // パスワードを隠す

// MongoDB接続
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB接続成功！');
  
  // データベース情報の取得
  const db = mongoose.connection.db;
  
  // コレクション一覧の取得
  return db.listCollections().toArray();
})
.then(collections => {
  console.log('\nデータベース内のコレクション:');
  if (collections.length === 0) {
    console.log('  コレクションはまだありません。');
  } else {
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
  }
  
  console.log('\nテスト用のドキュメントを作成します...');
  
  // テスト用のコレクション
  const testCollection = mongoose.connection.collection('test_connection');
  
  // テスト用のドキュメントを挿入
  return testCollection.insertOne({
    test: true,
    createdAt: new Date(),
    message: 'MongoDB接続テスト'
  });
})
.then(result => {
  console.log(`テストドキュメントが正常に作成されました。ID: ${result.insertedId}`);
  console.log('\nテストドキュメントを削除します...');
  
  // テスト用のコレクション
  const testCollection = mongoose.connection.collection('test_connection');
  
  // テストドキュメントを削除
  return testCollection.deleteOne({ _id: result.insertedId });
})
.then(() => {
  console.log('テストドキュメントが正常に削除されました。');
  console.log('\nMongoDB接続テストが正常に完了しました！');
})
.catch(err => {
  console.error('MongoDB接続エラー:', err);
})
.finally(() => {
  // 接続を閉じる
  mongoose.connection.close();
  console.log('MongoDB接続を閉じました。');
});