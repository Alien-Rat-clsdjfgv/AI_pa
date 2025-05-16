/**
 * 最簡化欄位語音輸入 - 專為移動設備優化
 * 直接在每個欄位旁添加小語音按鈕，減少複雜性
 */

document.addEventListener('DOMContentLoaded', function() {
    // 檢查瀏覽器支持
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('瀏覽器不支持語音識別');
        return;
    }
    
    console.log('初始化欄位語音輸入系統...');
    
    // 為所有文本輸入添加語音按鈕
    const inputFields = document.querySelectorAll('input[type="text"], textarea');
    
    inputFields.forEach(field => {
        // 確保欄位被包在一個容器中
        let container = field.parentElement;
        if (!container.classList.contains('input-group')) {
            // 如果不是input-group，創建一個新的輸入組
            const originalParent = field.parentElement;
            container = document.createElement('div');
            container.className = 'input-group';
            
            // 從原父元素移除，添加到新容器
            field.parentElement.insertBefore(container, field);
            container.appendChild(field);
        }
        
        // 創建語音按鈕
        const voiceButton = document.createElement('button');
        voiceButton.type = 'button';
        voiceButton.className = 'btn btn-outline-secondary field-voice-btn';
        voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceButton.title = '語音輸入';
        
        // 將按鈕添加到輸入組
        container.appendChild(voiceButton);
        
        // 事件監聽
        voiceButton.addEventListener('click', function() {
            startSpeechRecognition(field, voiceButton);
        });
    });
    
    // 開始語音識別
    function startSpeechRecognition(field, button) {
        // 恢復所有按鈕
        document.querySelectorAll('.field-voice-btn').forEach(btn => {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-microphone"></i>';
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-outline-secondary');
        });
        
        // 禁用當前按鈕
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        button.classList.remove('btn-outline-secondary');
        button.classList.add('btn-danger');
        
        // 創建語音識別實例
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        // 設置
        recognition.lang = 'zh-TW';
        recognition.continuous = false;
        recognition.interimResults = true;
        
        // 結果處理
        recognition.onresult = function(event) {
            const result = event.results[0];
            const transcript = result[0].transcript;
            
            // 顯示中間結果
            if (!result.isFinal) {
                button.title = `識別中: ${transcript.substring(0, 15)}...`;
                return;
            }
            
            // 最終結果
            field.value = field.value ? field.value + ', ' + transcript : transcript;
            
            // 觸發事件
            const inputEvent = new Event('input', { bubbles: true });
            field.dispatchEvent(inputEvent);
            
            // 恢復按鈕
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.title = `已添加: ${transcript.substring(0, 15)}${transcript.length > 15 ? '...' : ''}`;
            button.classList.remove('btn-danger');
            button.classList.add('btn-success');
            
            // 顯示成功提示
            createToast(field, transcript);
            
            // 2秒後恢復按鈕
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-microphone"></i>';
                button.classList.remove('btn-success');
                button.classList.add('btn-outline-secondary');
            }, 2000);
        };
        
        // 錯誤處理
        recognition.onerror = function(event) {
            console.error('語音識別錯誤:', event.error);
            
            // 恢復按鈕
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            button.title = `錯誤: ${event.error}`;
            button.classList.remove('btn-danger');
            button.classList.add('btn-warning');
            
            // 2秒後恢復按鈕
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-microphone"></i>';
                button.classList.remove('btn-warning');
                button.classList.add('btn-outline-secondary');
            }, 2000);
        };
        
        // 結束事件
        recognition.onend = function() {
            // 如果按鈕還是禁用狀態，恢復它
            if (button.disabled) {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-microphone"></i>';
                button.classList.remove('btn-danger');
                button.classList.add('btn-outline-secondary');
            }
        };
        
        // 啟動識別
        try {
            recognition.start();
            console.log(`開始對欄位 ${field.id} 進行語音識別`);
        } catch (e) {
            console.error('啟動語音識別失敗:', e);
            
            // 恢復按鈕
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-microphone"></i>';
            button.classList.remove('btn-danger');
            button.classList.add('btn-outline-secondary');
        }
    }
    
    // 創建提示浮層
    function createToast(field, text) {
        // 獲取欄位位置
        const rect = field.getBoundingClientRect();
        
        // 創建提示
        const toast = document.createElement('div');
        toast.className = 'position-fixed bg-success text-white px-3 py-2 rounded';
        toast.style.zIndex = '9999';
        toast.style.left = `${rect.left}px`;
        toast.style.top = `${rect.top - 40}px`;
        toast.textContent = `已添加: ${text.substring(0, 20)}${text.length > 20 ? '...' : ''}`;
        
        document.body.appendChild(toast);
        
        // 2秒後淡出並移除
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                try {
                    document.body.removeChild(toast);
                } catch(e) {}
            }, 500);
        }, 2000);
    }
    
    console.log('欄位語音輸入系統初始化完成');
});