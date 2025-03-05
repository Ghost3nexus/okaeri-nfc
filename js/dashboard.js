/**
 * おかえりNFC - ダッシュボードJavaScript
 */

// DOMが完全に読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
    // ユーザー認証チェック
    checkAuthentication();
    
    // ダッシュボード情報の読み込み
    loadDashboardInfo();
});

/**
 * ユーザー認証チェック
 */
function checkAuthentication() {
    // ローカルストレージまたはセッションストレージからトークンとユーザー情報を取得
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userFromLocal = localStorage.getItem('user');
    const userFromSession = sessionStorage.getItem('user');
    const user = JSON.parse(userFromLocal || userFromSession || '{}');
    
    console.log('checkAuthentication - トークン:', token);
    console.log('checkAuthentication - ユーザー情報:', user);
    console.log('checkAuthentication - ローカルストレージからのトークン:', localStorage.getItem('token'));
    console.log('checkAuthentication - セッションストレージからのトークン:', sessionStorage.getItem('token'));
    
    if (!token || !user || !user._id) {
        console.log('認証情報がないためログインページにリダイレクト');
        // 認証情報がない場合はログインページにリダイレクト
        window.location.href = '/login';
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
            
            // ローカルストレージとセッションストレージから認証情報を削除
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            
            console.log('ログアウト - 認証情報を削除しました');
            
            // ログインページにリダイレクト
            window.location.href = '/login';
        });
    }
}

/**
 * ダッシュボード情報の読み込み
 */
async function loadDashboardInfo() {
    try {
        // タグ一覧を取得
        const tags = await fetchUserTags();
        
        // 通知一覧を取得
        const notifications = await fetchUserNotifications();
        
        // ダッシュボード情報を表示
        updateDashboardStats(tags, notifications);
        
        // 最近の通知を表示
        displayRecentNotifications(notifications);
        
        // 登録済みタグを表示
        displayRegisteredTags(tags);
    } catch (error) {
        console.error('ダッシュボード情報読み込みエラー:', error);
        showToast('ダッシュボード情報の読み込みに失敗しました', 'error');
    }
}

/**
 * ユーザーのタグ一覧を取得
 * @returns {Promise<Array>} タグ一覧
 */
async function fetchUserTags() {
    try {
        // ローカルストレージまたはセッションストレージからトークンを取得
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        console.log('fetchUserTags - トークン:', token);
        console.log('fetchUserTags - ローカルストレージからのトークン:', localStorage.getItem('token'));
        console.log('fetchUserTags - セッションストレージからのトークン:', sessionStorage.getItem('token'));
        console.log('fetchUserTags - APIベースURL:', getApiBaseUrl());
        
        const response = await fetch(`${getApiBaseUrl()}/tags/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('fetchUserTags - レスポンスステータス:', response.status);
        
        if (!response.ok) {
            throw new Error('タグ一覧の取得に失敗しました');
        }
        
        const data = await response.json();
        return data.data.tags;
    } catch (error) {
        console.error('タグ一覧取得エラー:', error);
        throw error;
    }
}

/**
 * ユーザーの通知一覧を取得
 * @returns {Promise<Array>} 通知一覧
 */
async function fetchUserNotifications() {
    try {
        // ローカルストレージまたはセッションストレージからトークンを取得
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        console.log('fetchUserNotifications - トークン:', token);
        console.log('fetchUserNotifications - ローカルストレージからのトークン:', localStorage.getItem('token'));
        console.log('fetchUserNotifications - セッションストレージからのトークン:', sessionStorage.getItem('token'));
        console.log('fetchUserNotifications - APIベースURL:', getApiBaseUrl());
        
        const response = await fetch(`${getApiBaseUrl()}/notifications/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('fetchUserNotifications - レスポンスステータス:', response.status);
        
        if (!response.ok) {
            throw new Error('通知一覧の取得に失敗しました');
        }
        
        const data = await response.json();
        return data.data.notifications;
    } catch (error) {
        console.error('通知一覧取得エラー:', error);
        throw error;
    }
}

/**
 * ダッシュボード統計情報を更新
 * @param {Array} tags - タグ一覧
 * @param {Array} notifications - 通知一覧
 */
function updateDashboardStats(tags, notifications) {
    // タグ数
    const tagCount = document.getElementById('tagCount');
    if (tagCount) {
        tagCount.textContent = tags.length;
    }
    
    // 未読通知数
    const unreadCount = document.getElementById('unreadCount');
    if (unreadCount) {
        const unreadNotifications = notifications.filter(notification => !notification.isRead);
        unreadCount.textContent = unreadNotifications.length;
    }
    
    // 発見回数
    const foundCount = document.getElementById('foundCount');
    if (foundCount) {
        foundCount.textContent = notifications.length;
    }
}

/**
 * 最近の通知を表示
 * @param {Array} notifications - 通知一覧
 */
function displayRecentNotifications(notifications) {
    // ローディング表示を非表示
    document.getElementById('notificationsLoading').classList.add('d-none');
    
    if (notifications.length === 0) {
        // 通知がない場合
        document.getElementById('notificationsEmpty').classList.remove('d-none');
    } else {
        // 通知がある場合
        document.getElementById('notificationsList').classList.remove('d-none');
        
        const notificationsList = document.getElementById('notificationsList');
        
        // リストをクリア
        notificationsList.innerHTML = '';
        
        // 最新5件のみ表示
        const recentNotifications = notifications.slice(0, 5);
        
        // 通知ごとにリストアイテムを追加
        recentNotifications.forEach(notification => {
            const notificationDate = new Date(notification.createdAt).toLocaleString('ja-JP');
            
            const listItem = document.createElement('a');
            listItem.href = `/notification-detail?id=${notification._id}`;
            listItem.className = 'list-group-item list-group-item-action';
            
            // 未読の場合はハイライト
            if (!notification.isRead) {
                listItem.classList.add('bg-light');
            }
            
            listItem.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">
                        ${!notification.isRead ? '<span class="badge bg-primary me-2">新着</span>' : ''}
                        発見場所: ${notification.location || '不明'}
                    </h6>
                    <small class="text-muted">${notificationDate}</small>
                </div>
                <p class="mb-1 text-truncate">${notification.details || '詳細情報なし'}</p>
                <small class="text-muted">
                    <i class="fas fa-tag me-1"></i>${notification.tagName || 'タグ名不明'}
                </small>
            `;
            
            notificationsList.appendChild(listItem);
        });
    }
}

/**
 * 登録済みタグを表示
 * @param {Array} tags - タグ一覧
 */
function displayRegisteredTags(tags) {
    // ローディング表示を非表示
    document.getElementById('tagsLoading').classList.add('d-none');
    
    if (tags.length === 0) {
        // タグがない場合
        document.getElementById('tagsEmpty').classList.remove('d-none');
    } else {
        // タグがある場合
        document.getElementById('tagsList').classList.remove('d-none');
        
        const tagsTableBody = document.getElementById('tagsTableBody');
        
        // テーブルをクリア
        tagsTableBody.innerHTML = '';
        
        // 最新5件のみ表示
        const recentTags = tags.slice(0, 5);
        
        // タグごとに行を追加
        recentTags.forEach(tag => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            
            // クリックイベント
            row.addEventListener('click', function() {
                window.location.href = `/my-tags?tagId=${tag._id}`;
            });
            
            // タグ名
            const nameCell = document.createElement('td');
            nameCell.textContent = tag.name || '-';
            row.appendChild(nameCell);
            
            // タグID
            const idCell = document.createElement('td');
            idCell.textContent = tag.tagId || '-';
            row.appendChild(idCell);
            
            // 種類
            const typeCell = document.createElement('td');
            typeCell.textContent = tag.itemType || '-';
            row.appendChild(typeCell);
            
            // ステータス
            const statusCell = document.createElement('td');
            if (tag.nfcWritten) {
                statusCell.innerHTML = '<span class="badge bg-success">書き込み済み</span>';
            } else {
                statusCell.innerHTML = '<span class="badge bg-warning text-dark">未書き込み</span>';
            }
            row.appendChild(statusCell);
            
            // 行をテーブルに追加
            tagsTableBody.appendChild(row);
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