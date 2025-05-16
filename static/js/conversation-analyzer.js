/**
 * 對話分析器 - 分析醫生與病人對話，提取相關醫療訊息
 */

class ConversationAnalyzer {
    constructor() {
        // 存儲分析結果
        this.analysisResults = {
            chiefComplaint: [],        // 主訴
            presentIllness: [],        // 現病史
            accompaniedSymptoms: [],   // 伴隨症狀
            pastMedicalHistory: [],    // 過去病史
            medications: [],           // 用藥史
            allergies: [],             // 過敏史
            familyHistory: [],         // 家族史
            socialHistory: [],         // 社會史
            physicalExam: [],          // 體檢
            vitalSigns: []             // 生命體徵
        };
        
        // 目前選擇的說話者
        this.currentSpeaker = 'doctor';
        
        // 關鍵字映射表
        this.keywordMap = this.setupKeywordMap();
    }
    
    /**
     * 初始化分析器
     */
    initialize() {
        // 設置事件監聽器
        this.setupListeners();
        
        console.log('對話分析器初始化完成');
    }
    
    /**
     * 設置關鍵字映射表
     * @returns {Object} 關鍵字映射表
     */
    setupKeywordMap() {
        return {
            // 主訴關鍵字
            chiefComplaint: [
                '主訴', '問題', '困擾', '哪裡不舒服', '哪裡痛', '為什麼來'
            ],
            
            // 現病史關鍵字
            presentIllness: [
                '什麼時候開始', '多久了', '發作', '症狀', '何時出現', '突然', '漸漸',
                '從什麼時候', '起床發現', '中午', '早上', '晚上', '午後', '白天', '昨天',
                '前天', '上週', '下週', '凌晨', '半夜', '夜裡'
            ],
            
            // 伴隨症狀關鍵字
            accompaniedSymptoms: [
                '同時', '一起', '也有', '伴隨', '還有沒有', '其他不適', '其它症狀',
                '一並', '另外', '伴隨', '並且', '還會'
            ],
            
            // 過去病史關鍵字
            pastMedicalHistory: [
                '過去', '以前', '曾經', '史', '疾病史', '手術史', '住院', '開過刀',
                '有沒有得過', '之前', '從小', '年輕時', '以往'
            ],
            
            // 用藥史關鍵字
            medications: [
                '藥物', '用藥', '服用', '吃藥', '藥品', '處方', '長期用藥', '慢性用藥', 
                '保健品', '維他命', '中藥', '西藥', '成藥', '止痛藥'
            ],
            
            // 過敏史關鍵字
            allergies: [
                '過敏', '敏感', '不能吃', '不能用', '接觸', '蕁麻疹', '紅疹', '藥物過敏'
            ],
            
            // 家族史關鍵字
            familyHistory: [
                '家人', '父母', '兄弟姐妹', '親戚', '遺傳', '家族', '爸爸', '媽媽',
                '爺爺', '奶奶', '外公', '外婆', '家裡'
            ],
            
            // 社會史關鍵字
            socialHistory: [
                '工作', '職業', '抽菸', '喝酒', '吸菸', '煙', '酒', '檳榔', '運動',
                '作息', '生活', '習慣', '旅遊', '出國', '嗜好', '飲食'
            ],
            
            // 體檢關鍵字
            physicalExam: [
                '檢查', '觸診', '聽診', '叩診', '體檢', '脈搏', '血壓', '呼吸音',
                '心音', '腸蠕動音', '腹部'
            ],
            
            // 生命體徵關鍵字
            vitalSigns: [
                '體溫', '血壓', '心跳', '呼吸', '體重', '身高', '血氧', '脈搏',
                '心率', '發燒', '低溫', '高血壓', '低血壓', 'HR', 'BP', 'SpO2'
            ]
        };
    }
    
    /**
     * 設置事件監聽器
     */
    setupListeners() {
        // 監聽語音識別結果
        document.addEventListener('voice-recognition-result', (event) => {
            if (event.detail && event.detail.text) {
                // 分析對話內容 - 不區分說話者
                this.analyzeSpeech(event.detail.text, 'unknown');
            }
        });
    }
    
    /**
     * 分析語音內容
     * @param {string} text - 識別的文字內容
     * @param {string} speaker - 說話者類型 ('doctor' 或 'patient')
     */
    analyzeSpeech(text, speaker) {
        console.log(`說話者分析: 醫生得分=${this.scoreForDoctor(text)}, 病人得分=${this.scoreForPatient(text)}`);
        
        // 添加對話到完整記錄(如果有語音記錄器)
        if (window.speechRecorder) {
            window.speechRecorder.addDialogEntry(speaker, text);
        }
        
        // 自動分析對話
        this.analyzeConversation();
    }
    
    /**
     * 評估文本是否符合醫生說話特徵
     * @param {string} text - 識別的文字內容
     * @returns {number} - 評分
     */
    scoreForDoctor(text) {
        let score = 0;
        
        // 醫生常用問句
        const doctorPatterns = [
            '請問', '有沒有', '多久了', '什麼時候', '哪裡不舒服',
            '怎麼了', '吃了什麼藥', '檢查', '治療', '診斷',
            '會不會', '最近有沒有', '是否', '需要', '建議'
        ];
        
        doctorPatterns.forEach(pattern => {
            if (text.includes(pattern)) {
                score += 2;
            }
        });
        
        return score;
    }
    
    /**
     * 評估文本是否符合病人說話特徵
     * @param {string} text - 識別的文字內容
     * @returns {number} - 評分
     */
    scoreForPatient(text) {
        let score = 0;
        
        // 病人常用表達
        const patientPatterns = [
            '痛', '不舒服', '難受', '我覺得', '我感覺',
            '發燒', '頭暈', '噁心', '嘔吐', '拉肚子',
            '我有', '我是', '變得', '開始', '之後'
        ];
        
        patientPatterns.forEach(pattern => {
            if (text.includes(pattern)) {
                score += 2;
            }
        });
        
        return score;
    }
    
    /**
     * 分析完整對話，提取關鍵訊息
     */
    analyzeConversation() {
        console.log('自動分析對話');
        
        // 如果沒有語音記錄器，則無法獲取完整對話
        if (!window.speechRecorder) {
            return;
        }
        
        // 獲取完整對話記錄
        const dialogHistory = window.speechRecorder.getDialogHistory();
        if (!dialogHistory || dialogHistory.length === 0) {
            return;
        }
        
        console.log('開始分析對話...');
        
        // 重置分析結果
        this.resetAnalysisResults();
        
        // 分析每條對話
        dialogHistory.forEach(entry => {
            const text = entry.text;
            const speaker = entry.speaker;
            
            // 提取關鍵訊息
            this.extractKeyInformation(text, speaker);
        });
        
        // 更新表單
        this.updateForms();
        
        console.log('對話分析完成', this.analysisResults);
    }
    
    /**
     * 重置分析結果
     */
    resetAnalysisResults() {
        Object.keys(this.analysisResults).forEach(key => {
            this.analysisResults[key] = [];
        });
    }
    
    /**
     * 從文本中提取關鍵訊息
     * @param {string} text - 文本內容
     * @param {string} speaker - 說話者
     */
    extractKeyInformation(text, speaker) {
        // 使用關鍵字比對來判斷文本屬於哪類訊息
        Object.keys(this.keywordMap).forEach(category => {
            const keywords = this.keywordMap[category];
            
            // 檢查是否包含關鍵字
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    // 如果是醫生提問，則不加入結果中
                    if (speaker === 'doctor' && this.isQuestion(text)) {
                        break;
                    }
                    
                    // 將文本添加到對應類別中
                    if (!this.analysisResults[category].includes(text)) {
                        this.analysisResults[category].push(text);
                    }
                    break;
                }
            }
        });
        
        // 如果是病人說話，且沒有明確分類，則放入主訴或現病史
        if (speaker === 'patient' && !this.isCategorized(text)) {
            // 簡短表述放入主訴，長文本放入現病史
            if (text.length < 15) {
                this.analysisResults.chiefComplaint.push(text);
            } else {
                this.analysisResults.presentIllness.push(text);
            }
        }
    }
    
    /**
     * 檢查文本是否是問句
     * @param {string} text - 文本內容
     * @returns {boolean} - 是否為問句
     */
    isQuestion(text) {
        const questionPatterns = ['嗎', '呢', '嗎？', '呢？', '?', '？', '請問', '有沒有'];
        return questionPatterns.some(pattern => text.includes(pattern));
    }
    
    /**
     * 檢查文本是否已被分類
     * @param {string} text - 文本內容
     * @returns {boolean} - 是否已被分類
     */
    isCategorized(text) {
        return Object.values(this.analysisResults).some(
            category => category.includes(text)
        );
    }
    
    /**
     * 更新表單
     */
    updateForms() {
        // 根據分析結果更新不同表單
        this.updateField('chief_complaint', this.analysisResults.chiefComplaint.join('。'));
        this.updateField('history_present_illness', this.analysisResults.presentIllness.join('。'));
        this.updateField('past_medical_history', this.analysisResults.pastMedicalHistory.join('。'));
        this.updateField('medications', this.analysisResults.medications.join('。'));
        this.updateField('allergies', this.analysisResults.allergies.join('。'));
        this.updateField('family_history', this.analysisResults.familyHistory.join('。'));
        this.updateField('social_history', this.analysisResults.socialHistory.join('。'));
        this.updateField('physical_examination', this.analysisResults.physicalExam.join('。'));
        this.updateField('vital_signs', this.analysisResults.vitalSigns.join('。'));
    }
    
    /**
     * 更新特定欄位
     * @param {string} fieldId - 欄位 ID
     * @param {string} text - 更新內容
     */
    updateField(fieldId, text) {
        const field = document.getElementById(fieldId);
        if (field && text && text.trim() !== '') {
            // 如果欄位有內容，則僅在末尾添加新內容
            if (field.value && field.value.trim() !== '') {
                if (!field.value.includes(text)) {
                    field.value = field.value + '。' + text;
                }
            } else {
                field.value = text;
            }
        }
    }
    
    /**
     * 獲取分析結果
     * @returns {Object} - 分析結果
     */
    getAnalysisResults() {
        return this.analysisResults;
    }
    
    /**
     * 手動添加對話
     * @param {string} text - 文本內容
     * @param {string} speaker - 說話者
     */
    addConversation(text, speaker) {
        this.analyzeSpeech(text, speaker);
    }
}

// 創建全局實例
window.conversationAnalyzer = new ConversationAnalyzer();