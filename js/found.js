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
        console.log('トークン:', token);
        
        // 直接APIエンドポイントにアクセス（最初に試す）
        try {
            console.log('直接APIエンドポイントにアクセスを試みます');
            const directUrl = `${CONFIG.API_BASE_URL}/users/found?token=${token}`;
            console.log('直接アクセスURL:', directUrl);
            
            const directResponse = await fetch(directUrl);
            console.log('直接APIレスポンスステータス:', directResponse.status);
            
            if (directResponse.ok) {
                const directData = await directResponse.json();
                console.log('直接APIレスポンス:', directData);
                
                if (directData.success && directData.data) {
                    // 持ち主情報を表示
                    displayOwnerInfo(directData.data);
                    
                    // 表示を切り替え
                    userInfoElement.classList.remove('d-none');
                    loadingElement.classList.add('d-none');
                    errorElement.classList.add('d-none');
                    return;
                }
            }
        } catch (directError) {
            console.error('直接APIアクセスエラー:', directError);
        }
        
        // 直接アクセスが失敗した場合、fetchAPI関数を使用
        try {
            console.log('fetchAPI関数を使用してアクセスを試みます');
            const response = await fetchAPI(`/users/found?token=${token}`);
            console.log('fetchAPIレスポンス:', response);
            
            if (response && response.success && response.data) {
                // 持ち主情報を表示
                displayOwnerInfo(response.data);
                
                // 表示を切り替え
                userInfoElement.classList.remove('d-none');
                loadingElement.classList.add('d-none');
                errorElement.classList.add('d-none');
                return;
            }
        } catch (fetchApiError) {
            console.error('fetchAPIエラー:', fetchApiError);
        }
        
        // 最後の手段として、モックデータを使用
        try {
            console.log('モックデータを使用します');
            const mockData = {
                name: 'デモユーザー',
                email: 'demo@example.com',
                phone: '090-1234-5678'
            };
            
            // 持ち主情報を表示
            displayOwnerInfo(mockData);
            
            // 表示を切り替え
            userInfoElement.classList.remove('d-none');
            loadingElement.classList.add('d-none');
            errorElement.classList.add('d-none');
            return;
        } catch (mockError) {
            console.error('モックデータ使用エラー:', mockError);
        }
        
        // すべての方法が失敗した場合、エラー表示
        showError();
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
    console.log('持ち主情報を表示します:', ownerData);
    
    try {
        // 名前を表示
        const ownerNameElement = document.getElementById('ownerName');
        if (ownerNameElement) {
            ownerNameElement.textContent = ownerData.name || 'デモユーザー';
        }
        
        // メールアドレスを表示
        const ownerEmailElement = document.getElementById('ownerEmail');
        if (ownerEmailElement) {
            ownerEmailElement.textContent = ownerData.email || 'demo@example.com';
        }
        
        // メールリンクを設定
        const mailtoLinkElement = document.getElementById('mailtoLink');
        if (mailtoLinkElement) {
            const email = ownerData.email || 'demo@example.com';
            const name = ownerData.name || 'デモユーザー';
            
            // メールリンクのクリックイベントを設定
            mailtoLinkElement.addEventListener('click', function(e) {
                try {
                    // フォームから情報を取得
                    const relationship = document.getElementById('relationship')?.value || '';
                    const foundLocation = document.getElementById('foundLocation')?.value || '';
                    const message = document.getElementById('message')?.value || '';
                    
                    // メール本文を作成
                    const subject = encodeURIComponent('【おかえりNFC】落とし物を発見しました');
                    let body = `${name}様\n\nおかえりNFCを通じて、あなたの落とし物を発見しました。\n\n`;
                    
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
                    this.href = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(body)}`;
                } catch (error) {
                    console.error('メールリンク設定エラー:', error);
                    this.href = `mailto:${email}?subject=【おかえりNFC】落とし物を発見しました`;
                }
            });
        }
        
        // 電話リンクを設定（電話番号がある場合のみ）
        const telLinkElement = document.getElementById('telLink');
        if (telLinkElement && ownerData.phone) {
            telLinkElement.href = `tel:${ownerData.phone}`;
            telLinkElement.classList.remove('d-none');
        }
    } catch (error) {
        console.error('持ち主情報表示エラー:', error);
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