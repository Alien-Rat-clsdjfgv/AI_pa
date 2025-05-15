/**
 * 簡單的語音輸入功能 
 * 用於醫療病例記錄的語音識別
 */

document.addEventListener('DOMContentLoaded', function() {
    // 檢查瀏覽器支援
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('您的瀏覽器不支援語音識別功能');
        const voiceButton = document.getElementById('voice-button');
        if (voiceButton) {
            voiceButton.disabled = true;
            voiceButton.title = '您的瀏覽器不支援語音識別功能';
            voiceButton.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        }
        return;
    }
    
    // 獲取DOM元素
    const voiceButton = document.getElementById('voice-button');
    const voiceStatus = document.getElementById('voice-status');
    const languageContainer = document.getElementById('voice-language-container');
    const languageSelect = document.getElementById('voice-language');
    
    if (!voiceButton || !voiceStatus || !languageContainer || !languageSelect) {
        console.error('找不到語音輸入所需的DOM元素');
        return;
    }
    
    // 語音識別變數
    let recognition = null;
    let isRecording = false;
    let currentTarget = null;
    let originalContent = '';
    
    // 創建語音識別實例
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // 設置語音識別選項
    recognition.continuous = true;  // 持續聽取
    recognition.interimResults = true; // 實時結果
    recognition.lang = languageSelect.value;
    
    // 語言變更事件
    languageSelect.addEventListener('change', function() {
        if (recognition) {
            recognition.lang = this.value;
        }
    });
    
    // 點擊語音按鈕
    voiceButton.addEventListener('click', function() {
        if (isRecording) {
            stopRecording();
        } else {
            showTargetSelector();
        }
    });
    
    // 顯示目標選擇器
    function showTargetSelector() {
        // 移除任何之前的選擇器
        const existingOverlay = document.getElementById('target-selector-overlay');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }
        
        // 創建選擇器覆蓋層
        const overlay = document.createElement('div');
        overlay.id = 'target-selector-overlay';
        overlay.className = 'position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex flex-column align-items-center justify-content-center';
        overlay.style.zIndex = '2000';
        
        // 創建提示訊息
        const message = document.createElement('div');
        message.className = 'text-white mb-4 p-3 rounded bg-dark';
        message.innerHTML = '<h4>請選擇要輸入的文本區域</h4><p>點擊任何文本框開始語音輸入，或點擊此處取消</p>';
        
        // 點擊提示取消
        message.addEventListener('click', function(e) {
            e.stopPropagation();
            document.body.removeChild(overlay);
        });
        
        overlay.appendChild(message);
        document.body.appendChild(overlay);
        
        // 為所有文本框添加事件
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(function(textarea) {
            const originalBorder = textarea.style.border;
            const originalShadow = textarea.style.boxShadow;
            
            // 高亮顯示可以選擇的文本框
            textarea.style.border = '2px dashed var(--bs-primary)';
            textarea.style.boxShadow = '0 0 10px rgba(13, 110, 253, 0.5)';
            
            // 點擊事件
            textarea.addEventListener('click', function onTextareaClick(e) {
                e.stopPropagation();
                // 恢復所有文本框樣式
                textareas.forEach(function(t) {
                    t.style.border = '';
                    t.style.boxShadow = '';
                    t.removeEventListener('click', onTextareaClick);
                });
                
                // 設置當前目標
                currentTarget = textarea;
                document.body.removeChild(overlay);
                
                // 開始錄音
                startRecording();
            }, { once: true });
        });
        
        // 點擊空白區域取消
        overlay.addEventListener('click', function() {
            textareas.forEach(function(textarea) {
                textarea.style.border = '';
                textarea.style.boxShadow = '';
            });
            document.body.removeChild(overlay);
        });
    }
    
    // 開始錄音
    function startRecording() {
        if (!recognition || !currentTarget) return;
        
        try {
            // 顯示語言選擇
            languageContainer.classList.remove('d-none');
            
            // 更新按鈕
            voiceButton.innerHTML = '<i class="fas fa-stop"></i>';
            voiceButton.classList.remove('btn-primary');
            voiceButton.classList.add('btn-danger');
            voiceButton.title = '點擊停止語音輸入';
            
            // 更新狀態
            voiceStatus.textContent = '正在聆聽...';
            voiceStatus.classList.remove('d-none', 'bg-dark');
            voiceStatus.classList.add('bg-danger');
            
            // 保存原始內容
            originalContent = currentTarget.value;
            
            // 高亮當前輸入目標
            currentTarget.style.border = '2px solid var(--bs-danger)';
            currentTarget.style.boxShadow = '0 0 8px rgba(255, 107, 107, 0.4)';
            currentTarget.classList.add('voice-input-active');
            
            // 設置事件處理
            recognition.onresult = handleResult;
            recognition.onerror = handleError;
            recognition.onend = handleEnd;
            
            // 開始語音識別
            isRecording = true;
            recognition.start();
        } catch (e) {
            console.error('語音識別啟動失敗:', e);
            stopRecording();
        }
    }
    
    // 停止錄音
    function stopRecording() {
        if (!recognition) return;
        
        try {
            // 隱藏語言選擇
            languageContainer.classList.add('d-none');
            
            // 更新按鈕
            voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceButton.classList.remove('btn-danger');
            voiceButton.classList.add('btn-primary');
            voiceButton.title = '點擊開始語音輸入';
            
            // 更新狀態
            voiceStatus.textContent = '已停止';
            voiceStatus.classList.remove('bg-danger');
            voiceStatus.classList.add('bg-dark');
            
            // 恢復文本框樣式
            if (currentTarget) {
                currentTarget.style.border = '';
                currentTarget.style.boxShadow = '';
                currentTarget.classList.remove('voice-input-active');
                currentTarget = null;
            }
            
            // 停止語音識別
            isRecording = false;
            recognition.stop();
            
            // 2秒後隱藏狀態
            setTimeout(function() {
                voiceStatus.classList.add('d-none');
            }, 2000);
        } catch (e) {
            console.error('語音識別停止失敗:', e);
        }
    }
    
    // 處理語音識別結果
    function handleResult(event) {
        if (!currentTarget) return;
        
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        
        // 最終結果添加到原始內容
        if (finalTranscript) {
            if (originalContent && originalContent.trim() !== '') {
                originalContent += ' ' + finalTranscript;
            } else {
                originalContent = finalTranscript;
            }
            
            currentTarget.value = originalContent + interimTranscript;
        } else {
            currentTarget.value = (originalContent || '') + interimTranscript;
        }
        
        // 觸發變更事件
        const event = new Event('input', { bubbles: true });
        currentTarget.dispatchEvent(event);
    }
    
    // 處理語音識別錯誤
    function handleError(event) {
        console.error('語音識別錯誤:', event.error);
        
        let errorMessage = '發生錯誤';
        switch (event.error) {
            case 'not-allowed':
                errorMessage = '麥克風存取被拒絕';
                break;
            case 'network':
                errorMessage = '網路錯誤';
                break;
            case 'no-speech':
                errorMessage = '未檢測到語音';
                break;
        }
        
        // 更新狀態
        voiceStatus.textContent = errorMessage;
        voiceStatus.classList.remove('d-none', 'bg-danger');
        voiceStatus.classList.add('bg-warning', 'text-dark');
        
        // 如果不是用戶拒絕，嘗試重新啟動
        if (event.error !== 'not-allowed' && isRecording) {
            try {
                recognition.stop();
                
                setTimeout(function() {
                    if (isRecording) {
                        try {
                            recognition.start();
                            voiceStatus.textContent = '重新聆聽...';
                            voiceStatus.classList.remove('bg-warning', 'text-dark');
                            voiceStatus.classList.add('bg-danger', 'text-white');
                        } catch (e) {
                            console.error('重新啟動語音識別失敗:', e);
                            stopRecording();
                        }
                    }
                }, 1000);
            } catch (e) {
                console.error('停止語音識別失敗:', e);
                stopRecording();
            }
        } else {
            stopRecording();
        }
    }
    
    // 處理語音識別結束
    function handleEnd() {
        // 如果還在錄音狀態，重新啟動
        if (isRecording) {
            try {
                recognition.start();
                voiceStatus.textContent = '繼續聆聽...';
            } catch (e) {
                console.error('重新啟動語音識別失敗:', e);
                stopRecording();
            }
        }
    }
});