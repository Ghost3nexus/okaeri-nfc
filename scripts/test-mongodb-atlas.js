/**
 * MongoDB Atlas接続テストスクリプト
 * 
 * 使用方法:
 * node scripts/test-mongodb-atlas.js [パスワード]
 * 
 * 例:
 * node scripts/test-mongodb-atlas.js your_password
 */

require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

// コマンドライン引数からパスワードを取得（指定がなければ.envから取得）
const password = process.argv[2] || process.env.MONGODB_PASSWORD || 'your_password';

// MongoDB接続URI
const uri = `mongodb+srv://sackozuki:${password}@cluster0.h1i3x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

console.log('MongoDB Atlas接続テストを開始します...');
console.log(`接続URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // パスワードを隠す

// MongoClientの作成
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log('MongoDB Atlasに接続しています...');
    
    // クライアントをサーバーに接続
    await client.connect();
    
    // pingコマンドを送信して接続を確認
    await client.db("admin").command({ ping: 1 });
    console.log("接続成功！MongoDB Atlasに正常に接続されました。");
    
    // データベース一覧の取得
    const dbs = await client.db().admin().listDatabases();
    console.log('\nデータベース一覧:');
    dbs.databases.forEach(db => {
      console.log(`  - ${db.name}`);
    });
    
    // okaeri-nfcデータベースの作成（存在しない場合）
    const dbName = 'okaeri-nfc';
    console.log(`\n${dbName}データベースを使用します...`);
    const db = client.db(dbName);
    
    // コレクション一覧の取得
    const collections = await db.listCollections().toArray();
    console.log(`${dbName}データベース内のコレクション:`);
    if (collections.length === 0) {
      console.log('  コレクションはまだありません。');
    } else {
      collections.forEach(collection => {
        console.log(`  - ${collection.name}`);
      });
    }
    
    // テスト用のドキュメントを作成
    console.log('\nテスト用のドキュメントを作成します...');
    const testCollection = db.collection('test_connection');
    const result = await testCollection.insertOne({
      test: true,
      createdAt: new Date(),
      message: 'MongoDB Atlas接続テスト'
    });
    
    console.log(`テストドキュメントが正常に作成されました。ID: ${result.insertedId}`);
    
    // テストドキュメントを削除
    console.log('\nテストドキュメントを削除します...');
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('テストドキュメントが正常に削除されました。');
    
    console.log('\nMongoDB Atlas接続テストが正常に完了しました！');
    
    // .envファイルの更新方法を表示
    console.log('\n.envファイルの設定例:');
    console.log(`SKIP_MONGODB=false`);
    console.log(`MONGODB_URI=${uri}`);
    console.log(`MONGODB_PASSWORD=${password}`);
    
  } catch (err) {
    console.error('MongoDB接続エラー:', err);
  } finally {
    // クライアントを閉じる
    await client.close();
    console.log('MongoDB接続を閉じました。');
  }
}

run().catch(console.dir);