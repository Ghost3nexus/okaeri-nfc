/**
 * おかえりNFC設定ファイル
 * APIエンドポイントやその他の設定を管理します
 */

const CONFIG = {
    // APIのベースURL
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/api' 
        : 'https://okaeri-nfc.onrender.com/api',
    
    // ローカルストレージのキー
    STORAGE_TOKEN_KEY: 'okaeri_nfc_token',
    STORAGE_USER_KEY: 'okaeri_nfc_user',
    
    // トークンの有効期限（ミリ秒）
    TOKEN_EXPIRY: 90 * 24 * 60 * 60 * 1000, // 90日
    
    // サービスのベースURL
    SERVICE_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://okaeri-nfc.onrender.com'
};

/**
 * APIリクエストを送信する関数
 * @param {string} endpoint - APIエンドポイント
 * @param {Object} options - フェッチオプション
 * @returns {Promise<Object>} レスポンスデータ
 */
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem(CONFIG.STORAGE_TOKEN_KEY);
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, mergedOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '通信エラーが発生しました');
        }
        
        return data;
    } catch (error) {
        console.error('API通信エラー:', error);
        throw error;
    }
}

/**
 * ユーザーがログインしているかチェックする関数
 * @returns {boolean} ログイン状態
 */
function isLoggedIn() {
    const token = localStorage.getItem(CONFIG.STORAGE_TOKEN_KEY);
    return !!token;
}

/**
 * ログアウト処理を行う関数
 */
function logout() {
    localStorage.removeItem(CONFIG.STORAGE_TOKEN_KEY);
    localStorage.removeItem(CONFIG.STORAGE_USER_KEY);
    window.location.href = 'login.html';
}

/**
 * URLパラメータを取得する関数
 * @param {string} name - パラメータ名
 * @returns {string|null} パラメータ値
 */
function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}