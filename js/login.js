/**
 * おかえりNFC - ログイン・新規登録ページのスクリプト
 */

document.addEventListener('DOMContentLoaded', function() {
    // URLハッシュに基づいてタブを切り替え
    if (window.location.hash === '#register') {
        const registerTab = document.getElementById('register-tab');
        if (registerTab) {
            const tabInstance = new bootstrap.Tab(registerTab);
            tabInstance.show();
        }
    }

    // ログインフォームの処理
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 新規登録フォームの処理
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // パスワード表示切り替え
    setupPasswordToggle('loginPassword', 'toggleLoginPassword');
    setupPasswordToggle('registerPassword', 'toggleRegisterPassword');

    // サービスURLコピーボタン
    const copyServiceUrlBtn = document.getElementById('copyServiceUrl');
    if (copyServiceUrlBtn) {
        copyServiceUrlBtn.addEventListener('click', copyServiceUrl);
    }
});

/**
 * ログイン処理
 * @param {Event} event - フォームのサブミットイベント
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginButton = document.getElementById('loginButton');
    const loginError = document.getElementById('loginError');
    const loginErrorMessage = document.getElementById('loginErrorMessage');
    
    // ボタンを無効化し、ローディング表示
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ログイン中...';
    
    // エラーメッセージを非表示
    loginError.classList.add('d-none');
    
    try {
        const response = await fetchAPI('/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        // トークンとユーザー情報を保存
        localStorage.setItem(CONFIG.STORAGE_TOKEN_KEY, response.token);
        localStorage.setItem(CONFIG.STORAGE_USER_KEY, JSON.stringify(response.data.user));
        
        // ダッシュボードにリダイレクト
        window.location.href = 'index.html';
    } catch (error) {
        // エラーメッセージを表示
        loginErrorMessage.textContent = error.message || 'ログインに失敗しました';
        loginError.classList.remove('d-none');
        
        // ボタンを元に戻す
        loginButton.disabled = false;
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>ログイン';
    }
}

/**
 * 新規登録処理
 * @param {Event} event - フォームのサブミットイベント
 */
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const phone = document.getElementById('registerPhone').value;
    const registerButton = document.getElementById('registerButton');
    const registerError = document.getElementById('registerError');
    const registerErrorMessage = document.getElementById('registerErrorMessage');
    
    // ボタンを無効化し、ローディング表示
    registerButton.disabled = true;
    registerButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 登録中...';
    
    // エラーメッセージを非表示
    registerError.classList.add('d-none');
    
    try {
        const response = await fetchAPI('/users/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, phone })
        });
        
        // トークンとユーザー情報を保存
        localStorage.setItem(CONFIG.STORAGE_TOKEN_KEY, response.token);
        localStorage.setItem(CONFIG.STORAGE_USER_KEY, JSON.stringify(response.data.user));
        
        // サービスURLを取得
        const userInfo = await fetchAPI('/users/me');
        
        // サービスURLを表示
        const serviceUrlInput = document.getElementById('serviceUrl');
        if (serviceUrlInput && userInfo.data.serviceUrl) {
            serviceUrlInput.value = userInfo.data.serviceUrl;
        }
        
        // 登録成功モーダルを表示
        const registerSuccessModal = new bootstrap.Modal(document.getElementById('registerSuccessModal'));
        registerSuccessModal.show();
        
        // ボタンを元に戻す
        registerButton.disabled = false;
        registerButton.innerHTML = '<i class="fas fa-user-plus me-2"></i>登録する';
    } catch (error) {
        // エラーメッセージを表示
        registerErrorMessage.textContent = error.message || '登録に失敗しました';
        registerError.classList.remove('d-none');
        
        // ボタンを元に戻す
        registerButton.disabled = false;
        registerButton.innerHTML = '<i class="fas fa-user-plus me-2"></i>登録する';
    }
}

/**
 * パスワード表示切り替え機能をセットアップ
 * @param {string} passwordId - パスワード入力フィールドのID
 * @param {string} toggleId - 切り替えボタンのID
 */
function setupPasswordToggle(passwordId, toggleId) {
    const passwordInput = document.getElementById(passwordId);
    const toggleButton = document.getElementById(toggleId);
    
    if (passwordInput && toggleButton) {
        toggleButton.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // アイコンを切り替え
            const icon = toggleButton.querySelector('i');
            if (icon) {
                icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        });
    }
}

/**
 * サービスURLをクリップボードにコピー
 */
function copyServiceUrl() {
    const serviceUrlInput = document.getElementById('serviceUrl');
    if (serviceUrlInput) {
        serviceUrlInput.select();
        document.execCommand('copy');
        
        // コピー成功表示
        const copyButton = document.getElementById('copyServiceUrl');
        const originalHTML = copyButton.innerHTML;
        copyButton.innerHTML = '<i class="fas fa-check"></i>';
        
        setTimeout(() => {
            copyButton.innerHTML = originalHTML;
        }, 2000);
    }
}