/**
 * 說話者選擇器 - 簡單的醫生/病人身份切換工具
 * 提供大型明確的按鈕來標記當前說話內容是來自醫生還是病人
 */

class SpeakerSelector {
    constructor() {
        // 目前選定的說話者 ('doctor' 或 'patient')
        this.currentSpeaker = 'patient'; // 預設為病人
        
        // 對話分析器參考
        this.analyzer = null;
        
        // UI元素參考
        this.container = null;
        this.doctorButton = null;
        this.patientButton = null;
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
            this.doctorButton = document.getElementById('doctor-speaker-btn');
            this.patientButton = document.getElementById('patient-speaker-btn');
            return;
        }
        
        // 創建主容器
        this.container = document.createElement('div');
        this.container.id = 'speaker-selector';
        this.container.className = 'position-fixed';
        this.container.style.bottom = '150px';
        this.container.style.right = '20px';
        this.container.style.zIndex = '1039';
        
        // 創建卡片內容
        this.container.innerHTML = `
            <div class="card shadow">
                <div class="card-header py-2 bg-dark d-flex justify-content-between align-items-center">
                    <small class="fw-bold text-light">當前說話者</small>
                    <button type="button" class="btn-close btn-close-white btn-sm" id="close-speaker-selector"></button>
                </div>
                <div class="card-body p-2">
                    <div class="d-grid gap-2">
                        <button type="button" id="doctor-speaker-btn" class="btn btn-outline-primary btn-lg">
                            <i class="fas fa-user-md me-2"></i> 醫生說話
                        </button>
                        <button type="button" id="patient-speaker-btn" class="btn btn-success btn-lg active">
                            <i class="fas fa-user me-2"></i> 病人說話
                        </button>
                    </div>
                </div>
                <div class="card-footer py-1 bg-dark text-center">
                    <small class="text-light">選擇說話者後再說話</small>
                </div>
            </div>
        `;
        
        // 添加到頁面
        document.body.appendChild(this.container);
        
        // 存儲按鈕參考
        this.doctorButton = document.getElementById('doctor-speaker-btn');
        this.patientButton = document.getElementById('patient-speaker-btn');
    }
    
    /**
     * 設置事件監聽器
     */
    setupListeners() {
        // 關閉按鈕事件
        document.getElementById('close-speaker-selector').addEventListener('click', () => {
            this.container.classList.add('d-none');
        });
        
        // 醫生按鈕點擊事件
        this.doctorButton.addEventListener('click', () => {
            this.setSpeaker('doctor');
        });
        
        // 病人按鈕點擊事件
        this.patientButton.addEventListener('click', () => {
            this.setSpeaker('patient');
        });
        
        // 創建浮動切換按鈕
        this.createToggleButton();
    }
    
    /**
     * 創建浮動切換按鈕
     */
    createToggleButton() {
        const toggleButton = document.createElement('button');
        toggleButton.id = 'speaker-toggle-btn';
        toggleButton.className = 'btn btn-info rounded-circle position-fixed';
        toggleButton.style.width = '50px';
        toggleButton.style.height = '50px';
        toggleButton.style.bottom = '150px';
        toggleButton.style.right = '80px';
        toggleButton.style.zIndex = '1038';
        toggleButton.innerHTML = '<i class="fas fa-microphone"></i>';
        toggleButton.title = '切換說話者';
        
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
     * 設置當前說話者
     * @param {string} speaker - 'doctor' 或 'patient'
     */
    setSpeaker(speaker) {
        this.currentSpeaker = speaker;
        
        // 更新按鈕視覺狀態
        if (speaker === 'doctor') {
            this.doctorButton.classList.remove('btn-outline-primary');
            this.doctorButton.classList.add('btn-primary', 'active');
            
            this.patientButton.classList.remove('btn-success', 'active');
            this.patientButton.classList.add('btn-outline-success');
        } else {
            this.patientButton.classList.remove('btn-outline-success');
            this.patientButton.classList.add('btn-success', 'active');
            
            this.doctorButton.classList.remove('btn-primary', 'active');
            this.doctorButton.classList.add('btn-outline-primary');
        }
        
        // 如果有對話分析器，告知當前說話者已變更
        if (this.analyzer && typeof this.analyzer.setActiveSpeaker === 'function') {
            this.analyzer.setActiveSpeaker(speaker);
        }
        
        console.log(`當前說話者設置為: ${speaker}`);
    }
    
    /**
     * 獲取當前說話者
     * @returns {string} 'doctor' 或 'patient'
     */
    getCurrentSpeaker() {
        return this.currentSpeaker;
    }
    
    /**
     * 連接到對話分析器
     * @param {Object} analyzer - 對話分析器實例
     */
    connectAnalyzer(analyzer) {
        this.analyzer = analyzer;
    }
    
    /**
     * 顯示說話者選擇器
     */
    show() {
        this.container.classList.remove('d-none');
    }
    
    /**
     * 隱藏說話者選擇器
     */
    hide() {
        this.container.classList.add('d-none');
    }
}

// 創建全局實例
window.speakerSelector = new SpeakerSelector();

// 在頁面加載完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    window.speakerSelector.initialize();
});