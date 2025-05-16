/**
 * 完整語音記錄器 - 記錄所有對話內容，包含標點符號
 */

class SpeechRecorder {
    constructor() {
        // 記錄的對話內容
        this.dialogHistory = [];
        
        // UI元素參考
        this.container = null;
        this.dialogList = null;
        
        // 目前是否在記錄中
        this.isRecording = false;
    }
    
    /**
     * 初始化語音記錄器
     */
    initialize() {
        // 創建UI元素
        this.createUI();
        
        // 設置事件監聽器
        this.setupListeners();
        
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
        
        // 創建卡片內容
        this.container.innerHTML = `
            <div class="card shadow">
                <div class="card-header py-2 bg-dark d-flex justify-content-between align-items-center">
                    <small class="fw-bold text-light">完整對話記錄 (含標點符號)</small>
                    <div>
                        <button type="button" class="btn btn-outline-light btn-sm" id="clear-dialog-btn">
                            <i class="fas fa-eraser"></i>
                        </button>
                        <button type="button" class="btn-close btn-close-white btn-sm" id="close-recorder-btn"></button>
                    </div>
                </div>
                <div class="card-body p-0" style="max-height: 50vh; overflow-y: auto;">
                    <div id="speech-record-list" class="list-group list-group-flush"></div>
                </div>
                <div class="card-footer py-1 bg-dark d-flex justify-content-between">
                    <small class="text-light">自動記錄語音內容 (包含標點符號)</small>
                    <span class="badge bg-danger" id="recording-status">錄製中</span>
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
        
        // 監聽語音識別結果
        document.addEventListener('voice-recognition-result', (event) => {
            if (event.detail && event.detail.text) {
                const text = event.detail.text;
                const speaker = event.detail.speaker || '未知';
                this.addDialogEntry(speaker, text);
            }
        });
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
        
        // 暫時忽略說話者，全部顯示為同一樣式
        // 根據要求先忽略說話者選擇
        const displayName = '語音記錄';
        const bgColor = 'bg-dark bg-opacity-10';
        const textColor = 'text-dark';
        
        // 創建條目
        const entry = {
            speaker: 'unknown',  // 先忽略說話者
            text: text,
            timestamp: new Date()
        };
        
        // 添加到歷史記錄
        this.dialogHistory.push(entry);
        
        // 更新UI
        this.updateDialogUI();
    }
    
    /**
     * 更新對話UI
     */
    updateDialogUI() {
        // 清空當前列表
        this.dialogList.innerHTML = '';
        
        // 添加所有對話 - 忽略說話者區分
        this.dialogHistory.forEach(entry => {
            const displayName = '語音記錄';
            const bgColor = 'bg-dark bg-opacity-10';
            const textColor = 'text-dark';
            
            const listItem = document.createElement('div');
            listItem.className = `list-group-item ${bgColor} border-0`;
            listItem.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <small class="${textColor} fw-bold">${displayName}</small>
                    <small class="text-muted">${this.formatTime(entry.timestamp)}</small>
                </div>
                <p class="mb-1">${entry.text}</p>
            `;
            
            this.dialogList.appendChild(listItem);
        });
        
        // 滾動到底部
        this.dialogList.scrollTop = this.dialogList.scrollHeight;
    }
    
    /**
     * 清空對話歷史
     */
    clearDialogHistory() {
        this.dialogHistory = [];
        this.updateDialogUI();
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