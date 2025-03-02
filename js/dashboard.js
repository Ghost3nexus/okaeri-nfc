/**
 * おかえりNFC - ダッシュボード用JavaScriptファイル
 */

// APIのベースURL
const API_BASE_URL = '/api';

// DOMが完全に読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
    // 認証チェック
    checkAuthentication();
    
    // ユーザー情報の表示
    displayUserInfo();
    
    // ダッシュボードデータの読み込み
    loadDashboardData();
    
    // ログアウトボタンの設定
    setupLogoutButton();
});

/**
 * 認証チェック
 * ログインしていない場合はログインページにリダイレクト
 */
function checkAuthentication() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
}

/**
 * ユーザー情報の表示
 */
function displayUserInfo() {
    const userJson = localStorage.getItem('user');
    
    if (userJson) {
        const user = JSON.parse(userJson);
        const userNameElement = document.getElementById('userName');
        
        if (userNameElement && user.name) {
            userNameElement.textContent = user.name;
        }
    }
}

/**
 * ダッシュボードデータの読み込み
 */
function loadDashboardData() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return;
    }
    
    // ユーザー情報とタグの取得
    fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('ユーザー情報の取得に失敗しました');
        }
        return response.json();
    })
    .then(data => {
        // タグ数の表示
        updateTagCount(data.data.tags.length);
        
        // タグリストの表示
        displayTags(data.data.tags);
        
        // 通知の取得
        return fetchNotifications(token, data.data.user._id);
    })
    .catch(error => {
        console.error('データ取得エラー:', error);
        showToast('データの取得に失敗しました', 'error');
    });
}

/**
 * 通知の取得
 */
function fetchNotifications(token, userId) {
    return fetch(`${API_BASE_URL}/notifications/user/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('通知の取得に失敗しました');
        }
        return response.json();
    })
    .then(data => {
        // 未読通知数の表示
        const unreadCount = data.data.notifications.filter(n => n.status === '未読').length;
        updateUnreadCount(unreadCount);
        
        // 発見回数の表示
        updateFoundCount(data.data.notifications.length);
        
        // 最近の通知の表示
        displayRecentNotifications(data.data.notifications);
    })
    .catch(error => {
        console.error('通知取得エラー:', error);
        // 通知の取得に失敗した場合でも、エラーは表示せずに空の状態を表示
        updateUnreadCount(0);
        updateFoundCount(0);
        displayRecentNotifications([]);
    });
}

/**
 * タグ数の更新
 */
function updateTagCount(count) {
    const tagCountElement = document.getElementById('tagCount');
    
    if (tagCountElement) {
        tagCountElement.textContent = count;
    }
}

/**
 * 未読通知数の更新
 */
function updateUnreadCount(count) {
    const unreadCountElement = document.getElementById('unreadCount');
    
    if (unreadCountElement) {
        unreadCountElement.textContent = count;
    }
}

/**
 * 発見回数の更新
 */
function updateFoundCount(count) {
    const foundCountElement = document.getElementById('foundCount');
    
    if (foundCountElement) {
        foundCountElement.textContent = count;
    }
}

/**
 * タグリストの表示
 */
function displayTags(tags) {
    const tagsLoading = document.getElementById('tagsLoading');
    const tagsEmpty = document.getElementById('tagsEmpty');
    const tagsList = document.getElementById('tagsList');
    const tagsTableBody = document.getElementById('tagsTableBody');
    
    // ローディング表示を非表示
    if (tagsLoading) {
        tagsLoading.classList.add('d-none');
    }
    
    // タグがない場合
    if (!tags || tags.length === 0) {
        if (tagsEmpty) {
            tagsEmpty.classList.remove('d-none');
        }
        return;
    }
    
    // タグリストを表示
    if (tagsList) {
        tagsList.classList.remove('d-none');
    }
    
    // タグテーブルの内容をクリア
    if (tagsTableBody) {
        tagsTableBody.innerHTML = '';
        
        // 最大5件まで表示
        const displayTags = tags.slice(0, 5);
        
        // タグ行の追加
        displayTags.forEach(tag => {
            const row = document.createElement('tr');
            
            // ステータスクラスの設定
            const statusClass = tag.isActive ? 'text-success' : 'text-danger';
            const statusText = tag.isActive ? '有効' : '無効';
            
            row.innerHTML = `
                <td>${tag.name}</td>
                <td><code>${tag.tagId}</code></td>
                <td>${tag.itemType || 'その他'}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
            `;
            
            tagsTableBody.appendChild(row);
        });
    }
}

/**
 * 最近の通知の表示
 */
function displayRecentNotifications(notifications) {
    const notificationsLoading = document.getElementById('notificationsLoading');
    const notificationsEmpty = document.getElementById('notificationsEmpty');
    const notificationsList = document.getElementById('notificationsList');
    
    // ローディング表示を非表示
    if (notificationsLoading) {
        notificationsLoading.classList.add('d-none');
    }
    
    // 通知がない場合
    if (!notifications || notifications.length === 0) {
        if (notificationsEmpty) {
            notificationsEmpty.classList.remove('d-none');
        }
        return;
    }
    
    // 通知リストを表示
    if (notificationsList) {
        notificationsList.classList.remove('d-none');
        notificationsList.innerHTML = '';
        
        // 最大5件まで表示
        const recentNotifications = notifications.slice(0, 5);
        
        // 通知アイテムの追加
        recentNotifications.forEach(notification => {
            const notificationDate = new Date(notification.createdAt);
            const formattedDate = notificationDate.toLocaleDateString('ja-JP') + ' ' + 
                                 notificationDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            
            // ステータスクラスの設定
            const statusClass = notification.status === '未読' ? 'bg-light' : '';
            
            const item = document.createElement('a');
            item.href = `notification-detail.html?id=${notification._id}`;
            item.className = `list-group-item list-group-item-action ${statusClass}`;
            
            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${notification.tag ? notification.tag.name : 'タグ名不明'} が見つかりました</h6>
                    <small class="text-muted">${formattedDate}</small>
                </div>
                <p class="mb-1">発見場所: ${notification.location}</p>
                <small class="text-muted">
                    ${notification.status === '未読' ? '<span class="badge bg-danger">未読</span>' : ''}
                </small>
            `;
            
            notificationsList.appendChild(item);
        });
    }
}

/**
 * ログアウトボタンの設定
 */
function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault();
            
            // ローカルストレージからユーザー情報を削除
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // ホームページにリダイレクト
            window.location.href = 'index.html';
        });
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