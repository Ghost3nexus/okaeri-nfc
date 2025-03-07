/**
 * まもタグ - 共通スクリプト
 * すべてのページで使用される共通の機能を提供します
 */

document.addEventListener('DOMContentLoaded', function() {
    // ログイン状態に応じたヘッダーの表示切り替え
    updateHeaderByLoginStatus();
    
    // ログアウトボタンのイベントリスナー設定
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

/**
 * ログイン状態に応じてヘッダーの表示を切り替える
 */
function updateHeaderByLoginStatus() {
    const isUserLoggedIn = isLoggedIn();
    const loginButtons = document.querySelector('.login-buttons');
    const userMenu = document.querySelector('.user-menu');
    
    if (!loginButtons || !userMenu) return;
    
    if (isUserLoggedIn) {
        // ログイン済みの場合
        loginButtons.classList.add('d-none');
        userMenu.classList.remove('d-none');
        
        // ユーザー名を表示
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            const userData = JSON.parse(localStorage.getItem(CONFIG.STORAGE_USER_KEY) || '{}');
            userNameElement.textContent = userData.name || 'ユーザー';
        }
    } else {
        // 未ログインの場合
        loginButtons.classList.remove('d-none');
        userMenu.classList.add('d-none');
    }
}

/**
 * 保護されたページのアクセス制御
 * ログインしていない場合はログインページにリダイレクト
 */
function protectPage() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

/**
 * 日付をフォーマットする
 * @param {Date|string} date - フォーマットする日付
 * @param {boolean} includeTime - 時間を含めるかどうか
 * @returns {string} フォーマットされた日付文字列
 */
function formatDate(date, includeTime = false) {
    const d = new Date(date);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    if (!includeTime) {
        return `${year}/${month}/${day}`;
    }
    
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}/${month}/${day} ${hours}:${minutes}`;
}

/**
 * エラーメッセージを表示する
 * @param {string} message - エラーメッセージ
 * @param {string} elementId - メッセージを表示する要素のID
 */
function showErrorMessage(message, elementId = 'errorMessage') {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.parentElement.classList.remove('d-none');
        
        // 5秒後に非表示
        setTimeout(() => {
            errorElement.parentElement.classList.add('d-none');
        }, 5000);
    }
}

/**
 * 成功メッセージを表示する
 * @param {string} message - 成功メッセージ
 * @param {string} elementId - メッセージを表示する要素のID
 */
function showSuccessMessage(message, elementId = 'successMessage') {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.parentElement.classList.remove('d-none');
        
        // 5秒後に非表示
        setTimeout(() => {
            successElement.parentElement.classList.add('d-none');
        }, 5000);
    }
}