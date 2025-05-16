/**
 * 集成語音識別系統 - 專門為繁體中文醫療對話優化
 * 整合了說話者選擇器和對話分析器，完整記錄所有對話內容
 */

class VoiceIntegration {
    constructor() {
        // 語音識別 API
        this.recognition = null;
        
        // 當前語音識別輸入目標欄位
        this.targetField = null;
        
        // 是否正在聆聽
        this.isListening = false;
        
        // 當前狀態
        this.status = 'inactive'; // inactive, listening, processing
        
        // 存儲中間結果
        this.interimResult = '';
        
        // 信心閾值 (百分比)
        this.confidenceThreshold = 0.6;
        
        // 目標元素參考
        this.statusIndicator = null;
        this.voiceButton = null;
        
        // 支援標點符號
        this.supportPunctuation = true;
    }
    
    /**
     * 初始化語音系統
     */
    initialize() {
        // 檢查瀏覽器支援
        if (!this.checkBrowserSupport()) {
            console.error('此瀏覽器不支援語音識別');
            return;
        }
        
        // 創建語音識別實例
        this.createRecognition();
        
        // 設置事件監聽器
        this.setupEvents();
        
        // 創建UI元素
        this.createUI();
        
        console.log('醫療語音系統初始化完成');
    }
    
    /**
     * 檢查瀏覽器支援
     * @returns {boolean} 是否支援
     */
    checkBrowserSupport() {
        return 'webkitSpeechRecognition' in window || 
               'SpeechRecognition' in window;
    }
    
    /**
     * 創建語音識別實例
     */
    createRecognition() {
        // 獲取適當的語音識別API
        const SpeechRecognition = window.SpeechRecognition || 
                                 window.webkitSpeechRecognition;
        
        // 創建實例
        this.recognition = new SpeechRecognition();
        
        // 設置參數 - 優化以獲取完整對話
        this.recognition.continuous = true;      // 連續模式
        this.recognition.interimResults = true;  // 獲取中間結果
        this.recognition.maxAlternatives = 1;    // 只需要最佳結果
        
        // 設定僅使用繁體中文
        this.recognition.lang = 'zh-TW';         // 繁體中文
    }
    
    /**
     * 設置事件監聽器
     */
    setupEvents() {
        // 語音識別開始事件
        this.recognition.onstart = () => {
            this.isListening = true;
            this.status = 'listening';
            this.updateStatusUI();
            
            // 發送語音識別開始事件
            this.dispatchEvent('voice-recognition-start');
            
            // 通知對話記錄器開始記錄
            if (window.speechRecorder) {
                window.speechRecorder.startRecording();
            }
            
            console.log('語音識別開始');
        };
        
        // 語音識別結果事件
        this.recognition.onresult = (event) => {
            // 獲取結果
            let results = event.results;
            let finalTranscript = '';
            let interimTranscript = '';
            
            // 處理所有結果
            for (let i = event.resultIndex; i < results.length; i++) {
                const transcript = results[i][0].transcript;
                
                if (results[i].isFinal) {
                    finalTranscript += transcript;
                    
                    // 使用最高信心度的結果，但降低閾值以接受更多結果
                    const confidence = results[i][0].confidence;
                    if (confidence > 0.2) { // 進一步降低閾值，確保更多語句被記錄
                        // 處理正式結果
                        this.processResult(transcript, confidence);
                    } else {
                        console.log(`結果信心度過低 (${Math.round(confidence * 100)}%): ${transcript}`);
                    }
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // 更新中間結果
            if (interimTranscript) {
                this.interimResult = interimTranscript;
                this.showInterimResult(interimTranscript);
            }
            
            // 處理最終結果
            if (finalTranscript) {
                this.interimResult = '';
                console.log(`獲得最終結果: ${finalTranscript}`);
            }
        };
        
        // 語音識別結束事件
        this.recognition.onend = () => {
            this.isListening = false;
            this.status = 'inactive';
            this.updateStatusUI();
            
            // 發送語音識別結束事件
            this.dispatchEvent('voice-recognition-end');
            
            console.log('語音識別結束事件觸發');
            
            // 自動重新啟動語音識別以維持連續記錄 (連續錄音模式)
            if (this.targetField) {
                console.log('準備自動重新啟動語音識別...');
                setTimeout(() => {
                    try {
                        this.recognition.start();
                        console.log('語音識別自動重新啟動成功');
                        this.isListening = true;
                        this.status = 'listening';
                        this.updateStatusUI();
                    } catch (e) {
                        console.error('語音識別自動重新啟動失敗:', e);
                        // 如果直接啟動失敗，嘗試通過正常流程啟動
                        setTimeout(() => {
                            this.startListening(this.targetField.id);
                        }, 500);
                    }
                }, 100);
            }
        };
        
        // 語音識別錯誤事件
        this.recognition.onerror = (event) => {
            let errorMessage = '';
            
            switch (event.error) {
                case 'no-speech':
                    errorMessage = '未檢測到語音';
                    break;
                case 'aborted':
                    errorMessage = '語音識別已中止';
                    break;
                case 'audio-capture':
                    errorMessage = '無法捕獲音訊';
                    break;
                case 'network':
                    errorMessage = '網絡錯誤';
                    break;
                case 'not-allowed':
                    errorMessage = '未獲得麥克風權限';
                    break;
                case 'service-not-allowed':
                    errorMessage = '服務不可用';
                    break;
                case 'bad-grammar':
                    errorMessage = '語法錯誤';
                    break;
                case 'language-not-supported':
                    errorMessage = '語言不支援';
                    break;
                default:
                    errorMessage = '未知錯誤';
            }
            
            console.error(`語音識別錯誤: ${errorMessage} (${event.error})`);
            
            // 重置狀態
            this.isListening = false;
            this.status = 'inactive';
            this.updateStatusUI();
            
            // 嘗試在錯誤後自動重新啟動 (除非是權限錯誤)
            if (event.error !== 'not-allowed' && event.error !== 'service-not-allowed' && this.targetField) {
                console.log('嘗試在錯誤後重新啟動語音識別...');
                setTimeout(() => {
                    this.startListening(this.targetField.id);
                }, 1000);
            }
        };
    }
    
    /**
     * 創建UI元素
     */
    createUI() {
        // 添加語音按鈕到所有文本輸入欄位
        this.attachVoiceButtonsToFields();
    }
    
    /**
     * 為所有文本輸入欄位添加語音按鈕
     */
    attachVoiceButtonsToFields() {
        // 獲取所有輸入欄位
        const textInputs = document.querySelectorAll('input[type="text"], textarea');
        
        // 為每個欄位添加語音按鈕
        textInputs.forEach((input) => {
            // 檢查是否已有語音按鈕
            const fieldId = input.id;
            const container = input.parentElement;
            
            if (!container || container.querySelector('.voice-btn')) {
                return;
            }
            
            // 創建語音按鈕
            const voiceBtn = document.createElement('button');
            voiceBtn.type = 'button';
            voiceBtn.className = 'btn btn-outline-secondary voice-btn';
            voiceBtn.setAttribute('data-target', fieldId);
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceBtn.title = '語音輸入';
            
            // 設置點擊事件
            voiceBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleListening(fieldId);
            });
            
            // 根據輸入類型確定位置和樣式
            if (input.tagName.toLowerCase() === 'textarea') {
                // 文本區域 - 添加在外部容器的右下角
                voiceBtn.classList.add('position-absolute');
                voiceBtn.style.bottom = '10px';
                voiceBtn.style.right = '10px';
                voiceBtn.style.zIndex = '10';
                
                if (container.style.position !== 'relative') {
                    container.style.position = 'relative';
                }
            } else {
                // 普通輸入框 - 嘗試添加在輸入組的末尾
                const inputGroup = container.classList.contains('input-group') ? 
                    container : container.querySelector('.input-group');
                
                if (inputGroup) {
                    // 已存在輸入組，添加按鈕到末尾
                    voiceBtn.classList.add('input-group-text');
                    inputGroup.appendChild(voiceBtn);
                } else {
                    // 沒有輸入組，添加在右側
                    voiceBtn.classList.add('position-absolute');
                    voiceBtn.style.top = '50%';
                    voiceBtn.style.right = '10px';
                    voiceBtn.style.transform = 'translateY(-50%)';
                    voiceBtn.style.zIndex = '10';
                    
                    if (container.style.position !== 'relative') {
                        container.style.position = 'relative';
                    }
                    
                    container.appendChild(voiceBtn);
                }
            }
            
            // 添加指示器
            const statusIndicator = document.createElement('span');
            statusIndicator.className = 'voice-status d-none position-absolute';
            statusIndicator.style.width = '10px';
            statusIndicator.style.height = '10px';
            statusIndicator.style.borderRadius = '50%';
            statusIndicator.style.backgroundColor = '#ccc';
            statusIndicator.style.top = '5px';
            statusIndicator.style.right = '5px';
            
            voiceBtn.style.position = 'relative';
            voiceBtn.appendChild(statusIndicator);
        });
    }
    
    /**
     * 切換聆聽狀態
     * @param {string} fieldId - 目標欄位 ID
     */
    toggleListening(fieldId) {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening(fieldId);
        }
    }
    
    /**
     * 開始聆聽
     * @param {string} fieldId - 目標欄位 ID
     */
    startListening(fieldId) {
        // 如果已經在聆聽，先停止
        if (this.isListening) {
            this.stopListening();
        }
        
        // 設置目標欄位
        this.targetField = document.getElementById(fieldId);
        if (!this.targetField) {
            console.error(`無法找到欄位: ${fieldId}`);
            return;
        }
        
        // 設置狀態指示器
        const voiceBtn = document.querySelector(`button[data-target="${fieldId}"]`);
        if (voiceBtn) {
            this.voiceButton = voiceBtn;
            this.statusIndicator = voiceBtn.querySelector('.voice-status');
        }
        
        // 開始識別
        try {
            this.recognition.start();
            console.log('語音識別開始');
            this.dispatchEvent('voice-recognition-start');
        } catch (e) {
            console.error('語音識別啟動失敗:', e);
        }
    }
    
    /**
     * 停止聆聽
     */
    stopListening() {
        if (this.isListening) {
            try {
                this.recognition.stop();
                console.log('語音識別停止');
            } catch (e) {
                console.error('語音識別停止失敗:', e);
            }
        }
    }
    
    /**
     * 處理識別結果
     * @param {string} result - 識別結果
     * @param {number} confidence - 信心度
     */
    processResult(result, confidence) {
        if (!result || !this.targetField) return;
        
        // 先忽略說話者，直接使用預設值
        let currentSpeaker = 'unknown'; // 暫時不區分說話者
        
        // 更新目標欄位
        this.updateTargetField(result);
        
        // 發送語音識別結果事件
        this.dispatchEvent('voice-recognition-result', {
            text: result,
            confidence: confidence,
            speaker: currentSpeaker,
            targetField: this.targetField.id
        });
        
        // 同時將結果添加到語音記錄器 (確保所有識別結果都被記錄)
        if (window.speechRecorder) {
            window.speechRecorder.addDialogEntry('unknown', result);
        }
    }
    
    /**
     * 更新目標欄位
     * @param {string} text - 識別文本
     */
    updateTargetField(text) {
        if (!this.targetField) return;
        
        // 更新欄位值
        const currentValue = this.targetField.value;
        
        // 如果欄位為空，直接設置值
        if (!currentValue || currentValue.trim() === '') {
            this.targetField.value = text;
        } else {
            // 否則，在現有內容後添加
            this.targetField.value = currentValue + '。' + text;
        }
        
        // 觸發 input 事件以更新相關狀態
        const event = new Event('input', { bubbles: true });
        this.targetField.dispatchEvent(event);
    }
    
    /**
     * 顯示中間結果
     * @param {string} text - 中間識別結果
     */
    showInterimResult(text) {
        // 未來可以添加中間結果顯示
    }
    
    /**
     * 更新狀態UI
     */
    updateStatusUI() {
        if (!this.statusIndicator) return;
        
        // 顯示狀態指示器
        this.statusIndicator.classList.remove('d-none');
        
        // 更新狀態顏色
        switch (this.status) {
            case 'listening':
                this.statusIndicator.style.backgroundColor = '#28a745'; // 綠色
                this.voiceButton.classList.add('active');
                break;
            case 'processing':
                this.statusIndicator.style.backgroundColor = '#ffc107'; // 黃色
                break;
            case 'inactive':
            default:
                this.statusIndicator.style.backgroundColor = '#ccc'; // 灰色
                this.voiceButton.classList.remove('active');
                break;
        }
    }
    
    /**
     * 發送自定義事件
     * @param {string} eventName - 事件名稱
     * @param {Object} detail - 事件詳情
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
    
    /**
     * 智能語音模式 - 一鍵啟動整體醫療對話記錄
     */
    startSmartVoiceMode() {
        console.log('啟動智能語音模式');
        
        // 開始語音識別(針對病史欄位)
        this.startListening('history_present_illness');
    }
}

// 創建全局實例
window.voiceIntegration = new VoiceIntegration();

// 在頁面加載完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化語音整合系統
    if (window.voiceIntegration) {
        window.voiceIntegration.initialize();
        console.log('醫療表單頁面已加載，初始化語音系統');
    }
    
    // 添加智能按鈕事件
    const smartVoiceBtn = document.getElementById('smart-voice-btn');
    if (smartVoiceBtn) {
        smartVoiceBtn.addEventListener('click', () => {
            if (window.voiceIntegration) {
                window.voiceIntegration.startSmartVoiceMode();
            }
        });
    }
});