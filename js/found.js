/**
 * おかえりNFC - 落とし物発見ページのスクリプト
 */

document.addEventListener('DOMContentLoaded', function() {
    // URLからトークンを取得
    const token = getUrlParam('token');
    
    if (token) {
        // トークンがある場合は持ち主情報を取得
        fetchOwnerInfo(token);
    } else {
        // トークンがない場合はエラー表示
        showError();
    }
});

/**
 * 持ち主情報を取得する
 * @param {string} token - サービストークン
 */
async function fetchOwnerInfo(token) {
    const userInfoElement = document.getElementById('userInfo');
    const loadingElement = document.getElementById('loadingInfo');
    const errorElement = document.getElementById('errorInfo');
    
    try {
        const response = await fetchAPI(`/users/found?token=${token}`);
        
        console.log('API Response:', response);
        
        if (response.success && response.data) {
            // 持ち主情報を表示
            displayOwnerInfo(response.data);
            
            // 表示を切り替え
            userInfoElement.classList.remove('d-none');
            loadingElement.classList.add('d-none');
            errorElement.classList.add('d-none');
        } else {
            // エラー表示
            showError();
        }
    } catch (error) {
        console.error('持ち主情報取得エラー:', error);
        showError();
    }
}

/**
 * 持ち主情報を表示する
 * @param {Object} ownerData - 持ち主データ
 */
function displayOwnerInfo(ownerData) {
    // 名前を表示
    const ownerNameElement = document.getElementById('ownerName');
    if (ownerNameElement && ownerData.name) {
        ownerNameElement.textContent = ownerData.name;
    }
    
    // メールアドレスを表示
    const ownerEmailElement = document.getElementById('ownerEmail');
    if (ownerEmailElement && ownerData.email) {
        ownerEmailElement.textContent = ownerData.email;
    }
    
    // メールリンクを設定
    const mailtoLinkElement = document.getElementById('mailtoLink');
    if (mailtoLinkElement && ownerData.email) {
        // メールリンクのクリックイベントを設定
        mailtoLinkElement.addEventListener('click', function(e) {
            // フォームから情報を取得
            const relationship = document.getElementById('relationship').value;
            const foundLocation = document.getElementById('foundLocation').value;
            const message = document.getElementById('message').value;
            
            // メール本文を作成
            const subject = encodeURIComponent('【おかえりNFC】落とし物を発見しました');
            let body = `${ownerData.name}様\n\nおかえりNFCを通じて、あなたの落とし物を発見しました。\n\n`;
            
            // 本人との関係
            if (relationship) {
                body += `本人との関係：${relationship}\n`;
            }
            
            // 発見場所
            if (foundLocation) {
                body += `発見場所：${foundLocation}\n`;
            } else {
                body += `発見場所：\n`;
            }
            
            body += `発見日時：${new Date().toLocaleString('ja-JP')}\n\n`;
            
            // メッセージ
            if (message) {
                body += `メッセージ：\n${message}\n\n`;
            }
            
            body += `返却方法について相談させてください。\n\nよろしくお願いいたします。`;
            
            // メールリンクを設定
            this.href = `mailto:${ownerData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        });
    }
    
    // 電話リンクを設定（電話番号がある場合のみ）
    const telLinkElement = document.getElementById('telLink');
    if (telLinkElement && ownerData.phone) {
        telLinkElement.href = `tel:${ownerData.phone}`;
        telLinkElement.classList.remove('d-none');
    }
}

/**
 * エラー表示を行う
 */
function showError() {
    const userInfoElement = document.getElementById('userInfo');
    const loadingElement = document.getElementById('loadingInfo');
    const errorElement = document.getElementById('errorInfo');
    
    userInfoElement.classList.add('d-none');
    loadingElement.classList.add('d-none');
    errorElement.classList.remove('d-none');
}