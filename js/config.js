/**
 * おかえりNFC - 設定ファイル
 * アプリケーション全体で使用する共通設定を定義
 */

// 設定オブジェクト
window.APP_CONFIG = {
  // アプリケーション情報
  appName: 'おかえりNFC',
  version: '1.0.0',
  
  // API設定
  apiBaseUrl: window.location.hostname.includes('render.com') ? '/api' : '/api',
  
  // 認証設定
  authTokenName: 'token',
  userDataName: 'user',
  
  // 日付フォーマット設定
  dateFormat: 'ja-JP',
  
  // デモアカウント
  demoAccount: {
    email: 'demo@example.com',
    password: 'password123'
  }
};

// グローバル関数としてgetApiBaseUrlを定義
window.getApiBaseUrl = function() {
  return window.APP_CONFIG ? window.APP_CONFIG.apiBaseUrl : '/api';
};