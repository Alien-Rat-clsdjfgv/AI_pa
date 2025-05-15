document.addEventListener('DOMContentLoaded', function() {
    // 為常見主訴下拉菜單項添加點擊事件
    document.querySelectorAll('[data-complaint]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const complaint = this.getAttribute('data-complaint');
            const chiefComplaintField = document.getElementById('chief_complaint');
            if (chiefComplaintField) {
                chiefComplaintField.value = complaint;
            }
        });
    });

    // 專科模板選擇按鈕
    document.querySelectorAll('.specialty-template-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const specialty = this.getAttribute('data-specialty');
            const templateId = this.getAttribute('data-template');
            
            // 更新表單的專科選擇
            document.getElementById('specialty').value = specialty;
            
            // 如果有關聯的模板ID，則設置模板
            if (templateId) {
                document.getElementById('templateSelect').value = templateId;
                // 觸發模板選擇事件
                const event = new Event('change');
                document.getElementById('templateSelect').dispatchEvent(event);
            }
        });
    });

    // 實驗室檢查規模按鈕
    document.querySelectorAll('.lab-complexity-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const complexity = this.getAttribute('data-complexity');
            document.getElementById('labComplexity').value = complexity;
        });
    });

    // 常見主訴快速按鈕
    document.querySelectorAll('.common-complaint-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const complaint = this.getAttribute('data-complaint');
            const targetId = this.getAttribute('data-target') || 'chief_complaint';
            const targetField = document.getElementById(targetId);
            
            if (targetField) {
                targetField.value = complaint;
            } else {
                console.error(`無法找到目標欄位: ${targetId}`);
            }
        });
    });
    
    // 現病史按鈕
    document.querySelectorAll('.present-illness-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const illness = this.getAttribute('data-illness');
            const textareaId = this.getAttribute('data-target');
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                if (textarea.value) {
                    textarea.value += "\n" + illness;
                } else {
                    textarea.value = illness;
                }
            }
        });
    });
    
    // 伴隨症狀與體格檢查(PE)按鈕
    document.querySelectorAll('.symptom-pe-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const symptomPe = this.getAttribute('data-symptom-pe');
            const textareaId = this.getAttribute('data-target');
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                if (textarea.value) {
                    textarea.value += "\n" + symptomPe;
                } else {
                    textarea.value = symptomPe;
                }
            }
        });
    });
    
    // 過去病史按鈕
    document.querySelectorAll('.past-history-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const history = this.getAttribute('data-history');
            const textareaId = this.getAttribute('data-target');
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                if (textarea.value) {
                    textarea.value += "\n" + history;
                } else {
                    textarea.value = history;
                }
            }
        });
    });
    
    // 目前用藥按鈕
    document.querySelectorAll('.medication-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const medication = this.getAttribute('data-medication');
            const textareaId = this.getAttribute('data-target');
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                if (textarea.value) {
                    textarea.value += "\n" + medication;
                } else {
                    textarea.value = medication;
                }
            }
        });
    });
    
    // 過敏史按鈕
    document.querySelectorAll('.allergy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const allergy = this.getAttribute('data-allergy');
            const textareaId = this.getAttribute('data-target');
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                if (textarea.value) {
                    textarea.value += "\n" + allergy;
                } else {
                    textarea.value = allergy;
                }
            }
        });
    });
    
    // 家族史按鈕
    document.querySelectorAll('.family-history-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const familyHistory = this.getAttribute('data-family-history');
            const textareaId = this.getAttribute('data-target');
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                if (textarea.value) {
                    textarea.value += "\n" + familyHistory;
                } else {
                    textarea.value = familyHistory;
                }
            }
        });
    });
    
    // 社會史按鈕
    document.querySelectorAll('.social-history-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const socialHistory = this.getAttribute('data-social-history');
            const textareaId = this.getAttribute('data-target');
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                if (textarea.value) {
                    textarea.value += "\n" + socialHistory;
                } else {
                    textarea.value = socialHistory;
                }
            }
        });
    });
});