/**
 * 語音識別功能 - 將語音轉換為文字，方便醫生快速輸入醫療筆記
 */

class VoiceRecognition {
    constructor() {
        // 檢查瀏覽器支援
        this.recognition = null;
        this.isRecording = false;
        this.currentTarget = null;
        this.statusElement = null;
        this.languageSelect = null;
        this.supportedLanguages = [
            { code: 'zh-TW', name: '中文 (繁體)' },
            { code: 'zh-CN', name: '中文 (簡體)' },
            { code: 'en-US', name: '英文 (美國)' },
            { code: 'ja-JP', name: '日文' }
        ];
        this.initialize();
    }

    /**
     * 初始化語音識別
     */
    initialize() {
        // 檢查瀏覽器支援
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('您的瀏覽器不支援語音識別功能');
            return;
        }

        // 創建語音識別實例
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // 設置語音識別選項
        this.recognition.continuous = true;  // 持續聽取
        this.recognition.interimResults = true; // 實時結果
        this.recognition.lang = 'zh-TW';  // 預設語言
        
        // 設置事件監聽器
        this.recognition.onresult = (event) => this.handleResult(event);
        this.recognition.onerror = (event) => this.handleError(event);
        this.recognition.onend = () => this.handleEnd();
        
        // 創建UI元素
        this.createUIElements();
    }

    /**
     * 創建UI元素
     */
    createUIElements() {
        // 創建語音按鈕和語言選擇器
        const voiceUI = document.createElement('div');
        voiceUI.className = 'voice-recognition-ui position-fixed bottom-0 end-0 mb-5 me-3 d-flex flex-column';
        voiceUI.style.zIndex = '1050';
        
        // 語言選擇器
        const languageContainer = document.createElement('div');
        languageContainer.className = 'mb-2 bg-dark p-2 rounded shadow-sm d-none'; // 初始隱藏
        
        this.languageSelect = document.createElement('select');
        this.languageSelect.className = 'form-select form-select-sm';
        this.languageSelect.id = 'voice-language-select';
        
        // 添加語言選項
        this.supportedLanguages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = lang.name;
            this.languageSelect.appendChild(option);
        });
        
        this.languageSelect.addEventListener('change', () => {
            if (this.recognition) {
                this.recognition.lang = this.languageSelect.value;
            }
        });
        
        languageContainer.appendChild(this.languageSelect);
        
        // 狀態顯示
        this.statusElement = document.createElement('div');
        this.statusElement.className = 'd-none mb-2 p-2 rounded text-center text-white bg-dark shadow-sm';
        this.statusElement.textContent = '準備中...';
        
        // 主按鈕
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-primary rounded-circle shadow-lg p-3';
        button.style.width = '60px';
        button.style.height = '60px';
        button.innerHTML = '<i class="fas fa-microphone"></i>';
        button.title = '點擊開始語音輸入';
        button.id = 'voice-recognition-btn';
        
        // 添加點擊事件
        button.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                // 顯示目標選擇器
                this.showTargetSelector();
            }
        });
        
        // 添加到UI
        voiceUI.appendChild(this.statusElement);
        voiceUI.appendChild(languageContainer);
        voiceUI.appendChild(button);
        
        // 添加到頁面
        document.body.appendChild(voiceUI);
    }

    /**
     * 顯示目標選擇器 - 讓用戶選擇語音輸入的目標文本框
     */
    showTargetSelector() {
        // 隱藏之前的目標選擇器
        const existingOverlay = document.getElementById('voice-target-overlay');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }
        
        // 創建覆蓋層和提示
        const overlay = document.createElement('div');
        overlay.id = 'voice-target-overlay';
        overlay.className = 'position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex flex-column align-items-center justify-content-center';
        overlay.style.zIndex = '2000';
        
        const message = document.createElement('div');
        message.className = 'text-white mb-4 p-3 rounded bg-dark';
        message.innerHTML = '<h4>請選擇要輸入的欄位</h4><p>點擊任何文本框來開始語音輸入，或點擊此處取消</p>';
        
        // 點擊提示訊息取消
        message.addEventListener('click', (e) => {
            e.stopPropagation();
            document.body.removeChild(overlay);
        });
        
        overlay.appendChild(message);
        
        // 添加到頁面
        document.body.appendChild(overlay);
        
        // 為所有文本框添加點擊事件
        const textareas = document.querySelectorAll('textarea');
        const handler = (element) => {
            return (e) => {
                e.stopPropagation();
                this.currentTarget = element;
                document.body.removeChild(overlay);
                
                // 顯示語言選擇器
                const langContainer = document.querySelector('.voice-recognition-ui .mb-2.bg-dark');
                if (langContainer) {
                    langContainer.classList.remove('d-none');
                }
                
                // 開始錄音
                this.startRecording();
            };
        };
        
        textareas.forEach(textarea => {
            textarea.addEventListener('click', handler(textarea), { once: true });
            
            // 高亮可點擊的文本框
            textarea.dataset.originalBorder = textarea.style.border;
            textarea.style.border = '2px dashed var(--bs-primary)';
            textarea.style.boxShadow = '0 0 10px rgba(13, 110, 253, 0.5)';
        });
        
        // 添加清理函數
        overlay.addEventListener('click', () => {
            textareas.forEach(textarea => {
                textarea.style.border = textarea.dataset.originalBorder || '';
                textarea.style.boxShadow = '';
                delete textarea.dataset.originalBorder;
            });
            document.body.removeChild(overlay);
        });
    }

    /**
     * 開始錄音
     */
    startRecording() {
        if (!this.recognition || !this.currentTarget) return;
        
        try {
            // 更新UI
            this.isRecording = true;
            const button = document.getElementById('voice-recognition-btn');
            if (button) {
                button.innerHTML = '<i class="fas fa-stop"></i>';
                button.classList.remove('btn-primary');
                button.classList.add('btn-danger');
                button.title = '點擊停止語音輸入';
            }
            
            // 顯示狀態
            if (this.statusElement) {
                this.statusElement.textContent = '正在聆聽...';
                this.statusElement.classList.remove('d-none');
                this.statusElement.classList.add('bg-danger');
            }
            
            // 儲存原本文本框的內容
            this.originalContent = this.currentTarget.value;
            
            // 設置實時更新的提示樣式
            this.currentTarget.style.border = '2px solid var(--bs-danger)';
            
            // 開始語音識別
            this.recognition.start();
        } catch (error) {
            console.error('開始語音識別失敗:', error);
            this.stopRecording();
        }
    }

    /**
     * 停止錄音
     */
    stopRecording() {
        if (!this.recognition) return;
        
        try {
            // 更新UI
            this.isRecording = false;
            const button = document.getElementById('voice-recognition-btn');
            if (button) {
                button.innerHTML = '<i class="fas fa-microphone"></i>';
                button.classList.remove('btn-danger');
                button.classList.add('btn-primary');
                button.title = '點擊開始語音輸入';
            }
            
            // 更新狀態
            if (this.statusElement) {
                this.statusElement.textContent = '已停止';
                this.statusElement.classList.remove('bg-danger');
                this.statusElement.classList.add('bg-dark');
                
                // 2秒後隱藏
                setTimeout(() => {
                    if (this.statusElement) {
                        this.statusElement.classList.add('d-none');
                    }
                }, 2000);
            }
            
            // 隱藏語言選擇器
            const langContainer = document.querySelector('.voice-recognition-ui .mb-2.bg-dark');
            if (langContainer) {
                langContainer.classList.add('d-none');
            }
            
            // 恢復文本框樣式
            if (this.currentTarget) {
                this.currentTarget.style.border = '';
                this.currentTarget = null;
            }
            
            // 停止語音識別
            this.recognition.stop();
        } catch (error) {
            console.error('停止語音識別失敗:', error);
        }
    }

    /**
     * 處理識別結果
     */
    handleResult(event) {
        if (!this.currentTarget) return;
        
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
        
        // 更新文本框 - 最終結果添加到原始內容，實時結果顯示為臨時內容
        if (finalTranscript) {
            // 如果原始內容不為空，加上空格再添加
            if (this.originalContent && this.originalContent.trim() !== '') {
                this.originalContent += ' ' + finalTranscript;
            } else {
                this.originalContent = finalTranscript;
            }
            this.currentTarget.value = this.originalContent + interimTranscript;
        } else {
            this.currentTarget.value = (this.originalContent || '') + interimTranscript;
        }
        
        // 觸發變更事件
        const event = new Event('input', { bubbles: true });
        this.currentTarget.dispatchEvent(event);
    }

    /**
     * 處理錯誤
     */
    handleError(event) {
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
        if (this.statusElement) {
            this.statusElement.textContent = errorMessage;
            this.statusElement.classList.remove('d-none', 'bg-danger');
            this.statusElement.classList.add('bg-warning', 'text-dark');
            
            // 3秒後隱藏
            setTimeout(() => {
                if (this.statusElement && !this.isRecording) {
                    this.statusElement.classList.add('d-none');
                }
            }, 3000);
        }
        
        // 如果不是用戶拒絕，可能需要重新開始
        if (event.error !== 'not-allowed' && this.isRecording) {
            this.recognition.stop();
            
            setTimeout(() => {
                if (this.isRecording) {
                    try {
                        this.recognition.start();
                    } catch (e) {
                        console.error('重新啟動語音識別失敗:', e);
                        this.stopRecording();
                    }
                }
            }, 1000);
        } else {
            this.stopRecording();
        }
    }

    /**
     * 處理結束事件
     */
    handleEnd() {
        // 如果還在記錄狀態，則重新開始
        if (this.isRecording) {
            try {
                this.recognition.start();
                
                // 更新狀態
                if (this.statusElement) {
                    this.statusElement.textContent = '繼續聆聽...';
                }
            } catch (error) {
                console.error('重新啟動語音識別失敗:', error);
                this.stopRecording();
            }
        }
    }
}

// 頁面加載完成後初始化語音識別
document.addEventListener('DOMContentLoaded', () => {
    // 延遲初始化，確保其他元素已加載完成
    setTimeout(() => {
        window.voiceRecognition = new VoiceRecognition();
    }, 1000);
});