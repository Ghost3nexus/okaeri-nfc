/**
 * まもタグ - プロフィールページのスクリプト
 */

// DOMが完全に読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
    // ユーザー認証チェック
    checkAuthentication();
    
    // プロフィール情報の読み込み
    loadProfileInfo();
    
    // フォームの送信イベントを設定
    setupFormSubmitEvents();
});

/**
 * ユーザー認証チェック
 */
function checkAuthentication() {
    // ローカルストレージからトークンとユーザー情報を取得
    const token = localStorage.getItem(CONFIG.STORAGE_TOKEN_KEY);
    const userStr = localStorage.getItem(CONFIG.STORAGE_USER_KEY);
    const user = JSON.parse(userStr || '{}');
    
    console.log('checkAuthentication - トークン:', token);
    console.log('checkAuthentication - ユーザー情報:', user);
    
    if (!token) {
        console.log('認証情報がないためログインページにリダイレクト');
        // 認証情報がない場合はログインページにリダイレクト
        window.location.href = 'login.html';
        return;
    }
    
    // ユーザー名を表示
    const userNameElement = document.getElementById('userName');
    if (userNameElement && user.name) {
        userNameElement.textContent = user.name;
    }
    
    // ログアウトボタンの処理
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault();
            
            // ローカルストレージから認証情報を削除
            localStorage.removeItem(CONFIG.STORAGE_TOKEN_KEY);
            localStorage.removeItem(CONFIG.STORAGE_USER_KEY);
            
            console.log('ログアウト - 認証情報を削除しました');
            
            // ログインページにリダイレクト
            window.location.href = 'login.html';
        });
    }
}

/**
 * プロフィール情報を読み込む
 */
async function loadProfileInfo() {
    try {
        // ローディング表示
        const loadingElement = document.getElementById('profileLoading');
        const formElement = document.getElementById('profileForm');
        
        // ローカルストレージからユーザー情報を取得
        const userStr = localStorage.getItem(CONFIG.STORAGE_USER_KEY);
        const user = JSON.parse(userStr || '{}');
        
        // APIからユーザー情報を取得（最新の情報を取得するため）
        const token = localStorage.getItem(CONFIG.STORAGE_TOKEN_KEY);
        
        if (token) {
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/users/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('ユーザー情報を取得しました:', data);
                    
                    if (data.success && data.data && data.data.user) {
                        // ユーザー情報をフォームに設定
                        setProfileFormValues(data.data.user);
                        
                        // ローカルストレージのユーザー情報を更新
                        localStorage.setItem(CONFIG.STORAGE_USER_KEY, JSON.stringify(data.data.user));
                    } else {
                        // APIからの取得に失敗した場合はローカルストレージの情報を使用
                        setProfileFormValues(user);
                    }
                } else {
                    // APIからの取得に失敗した場合はローカルストレージの情報を使用
                    setProfileFormValues(user);
                }
            } catch (apiError) {
                console.error('API呼び出しエラー:', apiError);
                // APIからの取得に失敗した場合はローカルストレージの情報を使用
                setProfileFormValues(user);
            }
        } else {
            // トークンがない場合はローカルストレージの情報を使用
            setProfileFormValues(user);
        }
        
        // ローディング表示を非表示にし、フォームを表示
        if (loadingElement) loadingElement.classList.add('d-none');
        if (formElement) formElement.classList.remove('d-none');
    } catch (error) {
        console.error('プロフィール情報読み込みエラー:', error);
        showToast('プロフィール情報の読み込みに失敗しました', 'error');
    }
}

/**
 * プロフィールフォームに値を設定
 * @param {Object} user - ユーザー情報
 */
function setProfileFormValues(user) {
    // 各フォーム要素に値を設定
    const nameInput = document.getElementById('profileName');
    const emailInput = document.getElementById('profileEmail');
    const phoneInput = document.getElementById('profilePhone');
    const addressInput = document.getElementById('profileAddress');
    const notifyEmailCheckbox = document.getElementById('notifyEmail');
    const notifyAppCheckbox = document.getElementById('notifyApp');
    
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (addressInput) addressInput.value = user.address || '';
    
    // 通知設定（デフォルトはオン）
    if (notifyEmailCheckbox) notifyEmailCheckbox.checked = user.notifyEmail !== false;
    if (notifyAppCheckbox) notifyAppCheckbox.checked = user.notifyApp !== false;
}

/**
 * フォームの送信イベントを設定
 */
function setupFormSubmitEvents() {
    // プロフィール更新フォーム
    const updateProfileForm = document.getElementById('updateProfileForm');
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            try {
                // フォームからデータを取得
                const name = document.getElementById('profileName').value;
                const email = document.getElementById('profileEmail').value;
                const phone = document.getElementById('profilePhone').value;
                const address = document.getElementById('profileAddress').value;
                const notifyEmail = document.getElementById('notifyEmail').checked;
                const notifyApp = document.getElementById('notifyApp').checked;
                
                // バリデーション
                if (!name || !email) {
                    showToast('氏名とメールアドレスは必須です', 'warning');
                    return;
                }
                
                // ユーザー情報の更新データ
                const userData = {
                    name,
                    email,
                    phone,
                    address,
                    notifyEmail,
                    notifyApp
                };
                
                console.log('ユーザー情報を更新します:', userData);
                
                // APIを呼び出してユーザー情報を更新
                const token = localStorage.getItem(CONFIG.STORAGE_TOKEN_KEY);
                
                if (token) {
                    const response = await fetch(`${CONFIG.API_BASE_URL}/users/me`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(userData)
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('ユーザー情報の更新に成功しました:', data);
                        
                        if (data.success && data.data && data.data.user) {
                            // ローカルストレージのユーザー情報を更新
                            localStorage.setItem(CONFIG.STORAGE_USER_KEY, JSON.stringify(data.data.user));
                            
                            // 成功メッセージを表示
                            showToast('プロフィール情報を更新しました', 'success');
                            
                            // ヘッダーのユーザー名を更新
                            const userNameElement = document.getElementById('userName');
                            if (userNameElement) {
                                userNameElement.textContent = data.data.user.name;
                            }
                        } else {
                            showToast('プロフィール情報の更新に失敗しました', 'error');
                        }
                    } else {
                        const errorData = await response.json();
                        console.error('ユーザー情報の更新に失敗しました:', errorData);
                        showToast(errorData.message || 'プロフィール情報の更新に失敗しました', 'error');
                    }
                } else {
                    // デモモードの場合はローカルストレージのみ更新
                    const user = JSON.parse(localStorage.getItem(CONFIG.STORAGE_USER_KEY) || '{}');
                    const updatedUser = { ...user, ...userData };
                    localStorage.setItem(CONFIG.STORAGE_USER_KEY, JSON.stringify(updatedUser));
                    
                    // ヘッダーのユーザー名を更新
                    const userNameElement = document.getElementById('userName');
                    if (userNameElement) {
                        userNameElement.textContent = updatedUser.name;
                    }
                    
                    // 成功メッセージを表示
                    showToast('プロフィール情報を更新しました（デモモード）', 'success');
                }
            } catch (error) {
                console.error('プロフィール更新エラー:', error);
                showToast('プロフィール情報の更新中にエラーが発生しました', 'error');
            }
        });
    }
    
    // パスワード変更フォーム
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            try {
                // フォームからデータを取得
                const currentPassword = document.getElementById('currentPassword').value;
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                // バリデーション
                if (!currentPassword || !newPassword || !confirmPassword) {
                    showToast('すべての項目を入力してください', 'warning');
                    return;
                }
                
                if (newPassword !== confirmPassword) {
                    showToast('新しいパスワードと確認用パスワードが一致しません', 'warning');
                    return;
                }
                
                if (newPassword.length < 8) {
                    showToast('パスワードは8文字以上である必要があります', 'warning');
                    return;
                }
                
                // パスワード変更データ
                const passwordData = {
                    currentPassword,
                    newPassword
                };
                
                console.log('パスワードを変更します');
                
                // APIを呼び出してパスワードを変更
                const token = localStorage.getItem(CONFIG.STORAGE_TOKEN_KEY);
                
                if (token) {
                    const response = await fetch(`${CONFIG.API_BASE_URL}/users/password`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(passwordData)
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('パスワードの変更に成功しました:', data);
                        
                        // フォームをリセット
                        changePasswordForm.reset();
                        
                        // 成功メッセージを表示
                        showToast('パスワードを変更しました', 'success');
                    } else {
                        const errorData = await response.json();
                        console.error('パスワードの変更に失敗しました:', errorData);
                        showToast(errorData.message || 'パスワードの変更に失敗しました', 'error');
                    }
                } else {
                    // デモモードの場合は成功メッセージのみ表示
                    // フォームをリセット
                    changePasswordForm.reset();
                    
                    // 成功メッセージを表示
                    showToast('パスワードを変更しました（デモモード）', 'success');
                }
            } catch (error) {
                console.error('パスワード変更エラー:', error);
                showToast('パスワードの変更中にエラーが発生しました', 'error');
            }
        });
    }
    
    // アカウント削除ボタン
    const deleteAccountButton = document.getElementById('deleteAccountButton');
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', function() {
            // 確認ダイアログを表示
            if (confirm('本当にアカウントを削除しますか？この操作は取り消せません。')) {
                deleteAccount();
            }
        });
    }
}

/**
 * アカウントを削除する
 */
async function deleteAccount() {
    try {
        console.log('アカウントを削除します');
        
        // APIを呼び出してアカウントを削除
        const token = localStorage.getItem(CONFIG.STORAGE_TOKEN_KEY);
        
        if (token) {
            const response = await fetch(`${CONFIG.API_BASE_URL}/users/me`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                console.log('アカウントの削除に成功しました');
                
                // ローカルストレージから認証情報を削除
                localStorage.removeItem(CONFIG.STORAGE_TOKEN_KEY);
                localStorage.removeItem(CONFIG.STORAGE_USER_KEY);
                
                // 成功メッセージを表示
                alert('アカウントを削除しました。ホームページに戻ります。');
                
                // ホームページにリダイレクト
                window.location.href = 'index.html';
            } else {
                const errorData = await response.json();
                console.error('アカウントの削除に失敗しました:', errorData);
                showToast(errorData.message || 'アカウントの削除に失敗しました', 'error');
            }
        } else {
            // デモモードの場合はローカルストレージから認証情報を削除
            localStorage.removeItem(CONFIG.STORAGE_TOKEN_KEY);
            localStorage.removeItem(CONFIG.STORAGE_USER_KEY);
            
            // 成功メッセージを表示
            alert('アカウントを削除しました（デモモード）。ホームページに戻ります。');
            
            // ホームページにリダイレクト
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('アカウント削除エラー:', error);
        showToast('アカウントの削除中にエラーが発生しました', 'error');
    }
}

/**
 * トースト通知を表示
 * @param {string} message - 表示するメッセージ
 * @param {string} type - 通知タイプ（success, error, warning, info）
 */
function showToast(message, type = 'success') {
    // トースト要素がなければ作成
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // トーストのHTMLを作成
    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'error' ? 'bg-danger' : 
                   type === 'warning' ? 'bg-warning' : 
                   type === 'info' ? 'bg-info' : 'bg-success';
    
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgClass} text-white">
                <strong class="me-auto">まもタグ</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    // トースト要素を追加
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Bootstrapのトースト機能を初期化して表示
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
    });
    
    toast.show();
    
    // 表示後、一定時間経過後に要素を削除
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}