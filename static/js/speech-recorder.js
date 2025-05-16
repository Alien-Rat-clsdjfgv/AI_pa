/**
 * 完整語音記錄器 - 記錄所有對話內容，包含標點符號
 * 優化版本：提供更完整的對話記錄體驗
 */

class SpeechRecorder {
    constructor() {
        // 記錄的對話內容
        this.dialogHistory = [];
        
        // UI元素參考
        this.container = null;
        this.dialogList = null;
        this.textArea = null;
        
        // 目前是否在記錄中
        this.isRecording = false;
        
        // 完整記錄的文本內容
        this.fullText = '';
        
        // 用於去重的最後記錄內容
        this.lastRecordedText = '';
    }
    
    /**
     * 初始化語音記錄器
     */
    initialize() {
        // 創建UI元素
        this.createUI();
        
        // 設置事件監聽器
        this.setupListeners();
        
        // 獲取文本區域參考
        this.textArea = document.getElementById('full-speech-record');
        
        console.log('完整語音記錄器初始化完成');
    }
    
    /**
     * 創建UI元素
     */
    createUI() {
        // 檢查是否已存在
        if (document.getElementById('speech-recorder-container')) {
            this.container = document.getElementById('speech-recorder-container');
            this.dialogList = document.getElementById('speech-record-list');
            return;
        }
        
        // 創建主容器
        this.container = document.createElement('div');
        this.container.id = 'speech-recorder-container';
        this.container.className = 'position-fixed';
        this.container.style.top = '100px';
        this.container.style.right = '20px';
        this.container.style.width = '350px';
        this.container.style.maxHeight = '60vh';
        this.container.style.zIndex = '1039';
        
        // 創建卡片內容 - 使用完整的文本區域代替列表
        this.container.innerHTML = `
            <div class="card shadow">
                <div class="card-header py-2 bg-dark d-flex justify-content-between align-items-center">
                    <small class="fw-bold text-light">完整對話記錄 (含標點符號)</small>
                    <div>
                        <button type="button" class="btn btn-outline-light btn-sm" id="copy-dialog-btn" title="複製">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button type="button" class="btn btn-outline-light btn-sm" id="clear-dialog-btn" title="清除">
                            <i class="fas fa-eraser"></i>
                        </button>
                        <button type="button" class="btn-close btn-close-white btn-sm" id="close-recorder-btn"></button>
                    </div>
                </div>
                <div class="card-body p-2">
                    <textarea id="full-speech-record" class="form-control" 
                        style="height: 300px; resize: none; font-size: 14px;" 
                        readonly></textarea>
                </div>
                <div class="card-footer py-1 bg-dark d-flex justify-content-between align-items-center">
                    <small class="text-light">自動記錄完整對話 (包含標點符號)</small>
                    <div>
                        <span class="badge bg-danger me-2" id="recording-status">錄製中</span>
                        <small class="text-light" id="speech-counter">0 字</small>
                    </div>
                </div>
            </div>
        `;
        
        // 添加到頁面
        document.body.appendChild(this.container);
        
        // 存儲對話列表參考
        this.dialogList = document.getElementById('speech-record-list');
        
        // 創建浮動切換按鈕
        this.createToggleButton();
    }
    
    /**
     * 創建浮動切換按鈕
     */
    createToggleButton() {
        const toggleButton = document.createElement('button');
        toggleButton.id = 'recorder-toggle-btn';
        toggleButton.className = 'btn btn-primary rounded-circle position-fixed';
        toggleButton.style.width = '50px';
        toggleButton.style.height = '50px';
        toggleButton.style.top = '100px';
        toggleButton.style.right = '80px';
        toggleButton.style.zIndex = '1038';
        toggleButton.innerHTML = '<i class="fas fa-list-alt"></i>';
        toggleButton.title = '查看對話記錄';
        
        // 點擊事件
        toggleButton.addEventListener('click', () => {
            if (this.container.classList.contains('d-none')) {
                this.container.classList.remove('d-none');
            } else {
                this.container.classList.add('d-none');
            }
        });
        
        document.body.appendChild(toggleButton);
    }
    
    /**
     * 設置事件監聽器
     */
    setupListeners() {
        // 關閉按鈕事件
        document.getElementById('close-recorder-btn').addEventListener('click', () => {
            this.container.classList.add('d-none');
        });
        
        // 清空按鈕事件
        document.getElementById('clear-dialog-btn').addEventListener('click', () => {
            this.clearDialogHistory();
        });
        
        // 複製按鈕事件
        document.getElementById('copy-dialog-btn').addEventListener('click', () => {
            this.copyToClipboard();
        });
        
        // 監聽語音識別結果 - 對於語音識別，直接從 voice-integration.js 收到事件
        document.addEventListener('voice-recognition-result', (event) => {
            if (event.detail && event.detail.text) {
                const text = event.detail.text;
                const speaker = event.detail.speaker || '未知';
                
                // 確保不重複添加最後一句
                if (this.dialogHistory.length === 0 || 
                    this.dialogHistory[this.dialogHistory.length - 1].text !== text) {
                    this.addDialogEntry(speaker, text);
                }
            }
        });
    }
    
    /**
     * 複製對話內容到剪貼板
     */
    copyToClipboard() {
        if (!this.textArea || !this.fullText) return;
        
        try {
            // 複製到剪貼板
            navigator.clipboard.writeText(this.fullText).then(() => {
                alert('對話記錄已複製到剪貼板');
            }).catch(err => {
                console.error('複製失敗：', err);
                // 備用方案
                this.textArea.select();
                document.execCommand('copy');
            });
        } catch (err) {
            console.error('複製失敗：', err);
        }
    }
    
    /**
     * 開始記錄
     */
    startRecording() {
        this.isRecording = true;
        document.getElementById('recording-status').textContent = '錄製中';
        console.log('開始錄製完整對話');
    }
    
    /**
     * 停止記錄
     */
    stopRecording() {
        this.isRecording = false;
        document.getElementById('recording-status').textContent = '已暫停';
        console.log('暫停錄製對話');
    }
    
    /**
     * 添加對話條目
     * @param {string} speaker - 'doctor' 或 'patient' 或 'unknown'
     * @param {string} text - 對話文本
     */
    addDialogEntry(speaker, text) {
        // 如果沒有在記錄則跳過
        if (!this.isRecording) return;
        
        // 檢查是否與上一次記錄的內容相同 (去重)
        if (text === this.lastRecordedText) {
            console.log('重複內容，跳過記錄:', text);
            return;
        }
        
        // 獲取當前時間
        const currentTime = new Date();
        const timeStr = this.formatTime(currentTime);
        
        // 創建條目
        const entry = {
            speaker: 'unknown',  // 先忽略說話者
            text: text,
            timestamp: currentTime
        };
        
        // 添加到歷史記錄
        this.dialogHistory.push(entry);
        
        // 更新完整文本
        if (this.fullText.length > 0) {
            this.fullText += '\n\n';
        }
        this.fullText += `[${timeStr}] ${text}`;
        
        // 保存這次的文本，用於去重
        this.lastRecordedText = text;
        
        // 更新文本區域
        this.updateTextArea();
        
        // 更新字數計數器
        this.updateCounter();
        
        console.log('成功記錄對話:', text);
    }
    
    /**
     * 更新文本區域
     */
    updateTextArea() {
        // 獲取文本區域
        const textArea = document.getElementById('full-speech-record');
        if (!textArea) return;
        
        // 設置文本內容
        textArea.value = this.fullText;
        
        // 滾動到底部
        textArea.scrollTop = textArea.scrollHeight;
    }
    
    /**
     * 更新字數計數器
     */
    updateCounter() {
        const counter = document.getElementById('speech-counter');
        if (!counter) return;
        
        // 計算字數 (中文每個字算一個字)
        const charCount = this.fullText.length;
        counter.textContent = `${charCount} 字`;
    }
    
    /**
     * 清空對話歷史
     */
    clearDialogHistory() {
        this.dialogHistory = [];
        this.fullText = '';
        this.updateTextArea();
        this.updateCounter();
        console.log('清空對話歷史');
    }
    
    /**
     * 格式化時間
     * @param {Date} date - 時間對象
     * @returns {string} - 格式化的時間字符串
     */
    formatTime(date) {
        return date.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    /**
     * 顯示記錄器
     */
    show() {
        this.container.classList.remove('d-none');
    }
    
    /**
     * 隱藏記錄器
     */
    hide() {
        this.container.classList.add('d-none');
    }
    
    /**
     * 獲取完整對話歷史
     * @returns {Array} - 對話歷史數組
     */
    getDialogHistory() {
        return this.dialogHistory;
    }
}

// 創建全局實例
window.speechRecorder = new SpeechRecorder();

// 在頁面加載完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    window.speechRecorder.initialize();
    window.speechRecorder.startRecording();
});