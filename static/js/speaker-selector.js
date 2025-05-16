/**
 * 說話者選擇器 - 允許使用者明確指定當前說話者（醫生或病人）
 */

class SpeakerSelector {
    constructor() {
        // 當前選擇的說話者
        this.currentSpeaker = 'doctor'; // 預設為醫生
        
        // UI元素參考
        this.container = null;
        this.doctorBtn = null;
        this.patientBtn = null;
        this.toggleBtn = null;
        
        // 關聯的對話分析器
        this.analyzer = null;
    }
    
    /**
     * 初始化說話者選擇器
     */
    initialize() {
        // 創建UI元素
        this.createUI();
        
        // 設置事件監聽器
        this.setupListeners();
        
        console.log('說話者選擇器初始化完成');
    }
    
    /**
     * 創建UI元素
     */
    createUI() {
        // 檢查是否已存在
        if (document.getElementById('speaker-selector')) {
            this.container = document.getElementById('speaker-selector');
            this.doctorBtn = document.getElementById('doctor-speaker-btn');
            this.patientBtn = document.getElementById('patient-speaker-btn');
            return;
        }
        
        // 創建主容器
        this.container = document.createElement('div');
        this.container.id = 'speaker-selector';
        this.container.className = 'position-fixed d-flex';
        this.container.style.bottom = '20px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        
        // 創建按鈕組
        this.container.innerHTML = `
            <div class="btn-group shadow-lg" role="group">
                <button type="button" id="doctor-speaker-btn" class="btn btn-primary active d-flex align-items-center">
                    <i class="fas fa-user-md me-2"></i> 醫生說話
                </button>
                <button type="button" id="patient-speaker-btn" class="btn btn-outline-success d-flex align-items-center">
                    <i class="fas fa-user me-2"></i> 病人說話
                </button>
            </div>
        `;
        
        // 添加到頁面
        document.body.appendChild(this.container);
        
        // 存儲按鈕參考
        this.doctorBtn = document.getElementById('doctor-speaker-btn');
        this.patientBtn = document.getElementById('patient-speaker-btn');
        
        // 創建浮動切換按鈕
        this.createToggleButton();
    }
    
    /**
     * 創建浮動切換按鈕
     */
    createToggleButton() {
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.id = 'speaker-toggle-btn';
        this.toggleBtn.className = 'btn btn-dark rounded-circle position-fixed d-flex align-items-center justify-content-center';
        this.toggleBtn.style.width = '60px';
        this.toggleBtn.style.height = '60px';
        this.toggleBtn.style.bottom = '20px';
        this.toggleBtn.style.right = '20px';
        this.toggleBtn.style.zIndex = '1040';
        this.toggleBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        this.toggleBtn.title = '切換說話者';
        
        document.body.appendChild(this.toggleBtn);
    }
    
    /**
     * 設置事件監聽器
     */
    setupListeners() {
        // 醫生按鈕點擊事件
        this.doctorBtn.addEventListener('click', () => {
            this.setCurrentSpeaker('doctor');
        });
        
        // 病人按鈕點擊事件
        this.patientBtn.addEventListener('click', () => {
            this.setCurrentSpeaker('patient');
        });
        
        // 切換按鈕點擊事件
        this.toggleBtn.addEventListener('click', () => {
            // 切換為另一個說話者
            this.setCurrentSpeaker(this.currentSpeaker === 'doctor' ? 'patient' : 'doctor');
        });
        
        // 語音識別開始事件
        document.addEventListener('voice-recognition-start', () => {
            // 顯示說話者選擇器
            this.show();
        });
        
        // 語音識別結束事件
        document.addEventListener('voice-recognition-end', () => {
            // 處理語音識別結束事件
        });
    }
    
    /**
     * 設置當前說話者
     * @param {string} speaker - 'doctor' 或 'patient'
     */
    setCurrentSpeaker(speaker) {
        this.currentSpeaker = speaker;
        
        // 更新UI
        if (speaker === 'doctor') {
            this.doctorBtn.classList.add('active');
            this.doctorBtn.classList.remove('btn-outline-primary');
            this.doctorBtn.classList.add('btn-primary');
            
            this.patientBtn.classList.remove('active');
            this.patientBtn.classList.remove('btn-success');
            this.patientBtn.classList.add('btn-outline-success');
        } else {
            this.patientBtn.classList.add('active');
            this.patientBtn.classList.remove('btn-outline-success');
            this.patientBtn.classList.add('btn-success');
            
            this.doctorBtn.classList.remove('active');
            this.doctorBtn.classList.remove('btn-primary');
            this.doctorBtn.classList.add('btn-outline-primary');
        }
        
        // 更新切換按鈕樣式
        if (speaker === 'doctor') {
            this.toggleBtn.classList.remove('btn-success');
            this.toggleBtn.classList.add('btn-primary');
        } else {
            this.toggleBtn.classList.remove('btn-primary');
            this.toggleBtn.classList.add('btn-success');
        }
        
        // 更新說話者圖標
        this.toggleBtn.innerHTML = speaker === 'doctor' ? 
            '<i class="fas fa-user-md"></i>' : 
            '<i class="fas fa-user"></i>';
        
        console.log('當前說話者設置為: ' + speaker);
        
        // 廣播事件通知其他組件
        this.broadcastSpeakerChange(speaker);
    }
    
    /**
     * 廣播說話者變更事件
     * @param {string} speaker - 當前說話者
     */
    broadcastSpeakerChange(speaker) {
        const event = new CustomEvent('speaker-changed', {
            detail: { speaker: speaker }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 連接到對話分析器
     * @param {Object} analyzer - 對話分析器實例
     */
    connectAnalyzer(analyzer) {
        this.analyzer = analyzer;
        console.log('已連接到現有對話分析器');
    }
    
    /**
     * 獲取當前說話者
     * @returns {string} - 當前說話者 ('doctor' 或 'patient')
     */
    getCurrentSpeaker() {
        return this.currentSpeaker;
    }
    
    /**
     * 顯示說話者選擇器
     */
    show() {
        this.container.classList.remove('d-none');
        this.toggleBtn.classList.remove('d-none');
    }
    
    /**
     * 隱藏說話者選擇器
     */
    hide() {
        this.container.classList.add('d-none');
        this.toggleBtn.classList.add('d-none');
    }
}

// 創建全局實例
window.speakerSelector = new SpeakerSelector();