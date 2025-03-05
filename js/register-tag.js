/**
 * おかえりNFC - タグ登録JavaScript
 */

// DOMが完全に読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
    // ユーザー認証チェック
    checkAuthentication();
    
    // フォーム送信イベントの設定
    setupFormSubmission();
    
    // ユーザー情報の自動入力
    prefillUserInfo();
});

/**
 * ユーザー認証チェック
 */
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user) {
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
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // ログインページにリダイレクト
            window.location.href = 'login.html';
        });
    }
}

/**
 * フォーム送信イベントの設定
 */
function setupFormSubmission() {
    const registerTagForm = document.getElementById('registerTagForm');
    
    if (registerTagForm) {
        registerTagForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            try {
                // フォームデータの取得
                const formData = new FormData(registerTagForm);
                const tagData = {
                    name: formData.get('name'),
                    tagId: formData.get('tagId'),
                    itemType: formData.get('itemType'),
                    description: formData.get('description')
                };
                
                // タグを登録
                const registeredTag = await registerTag(tagData);
                
                // 個人情報の更新（プロフィール情報として保存）
                const userProfileData = {
                    name: formData.get('ownerName'),
                    email: formData.get('ownerEmail'),
                    phone: formData.get('ownerPhone'),
                    address: formData.get('ownerAddress')
                };
                
                await updateUserProfile(userProfileData);
                
                // 登録成功モーダルを表示
                showRegistrationSuccessModal(registeredTag);
                
            } catch (error) {
                console.error('タグ登録エラー:', error);
                showToast('タグの登録に失敗しました: ' + error.message, 'error');
            }
        });
    }
}

/**
 * タグを登録
 * @param {Object} tagData - タグデータ
 * @returns {Promise<Object>} 登録されたタグ情報
 */
async function registerTag(tagData) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${getApiBaseUrl()}/tags`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tagData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'タグの登録に失敗しました');
        }
        
        const data = await response.json();
        return data.data.tag;
    } catch (error) {
        console.error('タグ登録APIエラー:', error);
        throw error;
    }
}

/**
 * ユーザープロフィールを更新
 * @param {Object} profileData - プロフィールデータ
 * @returns {Promise<Object>} 更新されたユーザー情報
 */
async function updateUserProfile(profileData) {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // ユーザーIDが必要
        if (!user._id) {
            throw new Error('ユーザー情報が不足しています');
        }
        
        const response = await fetch(`${getApiBaseUrl()}/users/${user._id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'プロフィールの更新に失敗しました');
        }
        
        const data = await response.json();
        
        // ローカルストレージのユーザー情報を更新
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        return data.data.user;
    } catch (error) {
        console.error('プロフィール更新APIエラー:', error);
        // プロフィール更新に失敗してもタグ登録は続行するため、エラーをスローしない
        showToast('プロフィール情報の更新に失敗しました', 'warning');
        return null;
    }
}

/**
 * ユーザー情報の自動入力
 */
function prefillUserInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user) {
        // 名前
        const ownerNameInput = document.getElementById('ownerName');
        if (ownerNameInput && user.name) {
            ownerNameInput.value = user.name;
        }
        
        // メールアドレス
        const ownerEmailInput = document.getElementById('ownerEmail');
        if (ownerEmailInput && user.email) {
            ownerEmailInput.value = user.email;
        }
        
        // 電話番号
        const ownerPhoneInput = document.getElementById('ownerPhone');
        if (ownerPhoneInput && user.phone) {
            ownerPhoneInput.value = user.phone;
        }
        
        // 住所
        const ownerAddressInput = document.getElementById('ownerAddress');
        if (ownerAddressInput && user.address) {
            ownerAddressInput.value = user.address;
        }
    }
}

/**
 * 登録成功モーダルを表示
 * @param {Object} tag - 登録されたタグ情報
 */
function showRegistrationSuccessModal(tag) {
    const modal = new bootstrap.Modal(document.getElementById('registrationSuccessModal'));
    modal.show();
    
    // モーダルが閉じられたときの処理
    document.getElementById('registrationSuccessModal').addEventListener('hidden.bs.modal', function() {
        // NFCタグ設定ページに遷移
        window.location.href = `nfc-setup.html?tagId=${tag._id}`;
    });
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
                <strong class="me-auto">おかえりNFC</strong>
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