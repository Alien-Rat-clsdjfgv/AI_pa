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

    // 定義各專科常見症狀和相關項目
    const specialtyRelatedItems = {
        '內科': {
            complaints: ['發燒', '頭痛', '胸悶', '呼吸困難', '全身無力'],
            physical: ['發燒 (38.5°C)', '心跳過速', '肺部囉音', '輕微腹壓痛'],
            pastHistory: ['高血壓', '糖尿病', '高血脂', '心臟病']
        },
        '心臟科': {
            complaints: ['胸痛', '呼吸困難', '心悸', '頭暈', '水腫', '運動後胸悶'],
            physical: ['頸靜脈怒張', '下肢水腫', '心律不整', '心雜音', 'S3心音'],
            pastHistory: ['高血壓', '冠心病', '心肌梗塞', '心臟衰竭', '心房顫動']
        },
        '呼吸科': {
            complaints: ['咳嗽', '呼吸困難', '胸痛', '痰多', '咳血', '夜間憋醒'],
            physical: ['肺部濕囉音', '呼吸音減弱', '哮鳴音', '肋間隙凹陷', '呼吸急促'],
            pastHistory: ['肺炎', '氣喘', '慢性阻塞性肺病', '肺結核', '肺纖維化']
        },
        '腸胃科': {
            complaints: ['腹痛', '腹瀉', '便秘', '噁心嘔吐', '消化不良', '血便', '黑便'],
            physical: ['腹部壓痛', '腸鳴音亢進', '肝脾腫大', '右上腹壓痛', '反跳痛'],
            pastHistory: ['胃潰瘍', '十二指腸潰瘍', '胃食道逆流', '膽結石', '胰臟炎']
        },
        '神經科': {
            complaints: ['頭痛', '頭暈', '癲癇發作', '肢體無力', '感覺異常', '視力模糊', '步態不穩'],
            physical: ['巴彬斯基徵陽性', '深部腱反射亢進', '感覺異常', '肌力減退', '共濟失調'],
            pastHistory: ['腦中風', '癲癇', '帕金森氏症', '多發性硬化症', '肌無力']
        },
        '腎臟科': {
            complaints: ['水腫', '血尿', '尿量減少', '尿量增多', '尿頻', '尿急', '腰痛'],
            physical: ['下肢水腫', '腎臟叩擊痛', '血壓升高', '腹水'],
            pastHistory: ['腎功能不全', '腎病症候群', '腎結石', '多囊腎', '腎小球腎炎']
        },
        '風濕免疫科': {
            complaints: ['關節疼痛', '關節腫脹', '皮疹', '肌肉痠痛', '臉部蝴蝶斑', '疲勞'],
            physical: ['關節腫脹', '關節壓痛', '關節活動受限', '皮疹', '肌肉壓痛'],
            pastHistory: ['類風濕性關節炎', '紅斑性狼瘡', '硬皮病', '血管炎', '多發性肌炎']
        },
        '內分泌科': {
            complaints: ['口渴多飲', '多尿', '體重減輕', '疲勞', '視力模糊', '怕熱', '怕冷'],
            physical: ['甲狀腺腫大', '皮膚乾燥', '震顫', '多毛', '眼球突出'],
            pastHistory: ['糖尿病', '甲狀腺功能亢進', '甲狀腺功能低下', '庫欣氏症', '腎上腺功能不全']
        },
        '血液腫瘤科': {
            complaints: ['疲勞', '體重減輕', '盜汗', '淋巴結腫大', '容易出血', '臉色蒼白'],
            physical: ['淋巴結腫大', '脾臟腫大', '貧血', '瘀斑', '出血點'],
            pastHistory: ['白血病', '淋巴瘤', '多發性骨髓瘤', '貧血', '血小板減少症']
        },
        '感染科': {
            complaints: ['發燒', '寒顫', '全身無力', '咳嗽', '腹瀉', '皮疹'],
            physical: ['發燒', '皮疹', '淋巴結腫大', '咽喉發紅', '肺部濕囉音'],
            pastHistory: ['肺結核', '愛滋病', '病毒性肝炎', '梅毒', '瘧疾']
        },
        '急診醫學': {
            complaints: ['胸痛', '呼吸困難', '意識改變', '嚴重頭痛', '嚴重腹痛', '外傷', '出血'],
            physical: ['意識不清', '血壓不穩', '出血', '骨折', '瞳孔不等大', '神經功能缺損'],
            pastHistory: ['高血壓', '糖尿病', '心臟病', '癲癇', '用血液稀釋劑']
        },
        '皮膚科': {
            complaints: ['皮疹', '搔癢', '皮膚乾燥', '皮膚疼痛', '皮膚腫塊', '脫髮'],
            physical: ['紅疹', '丘疹', '水泡', '濕疹', '鱗屑', '色素沉著'],
            pastHistory: ['異位性皮膚炎', '乾癬', '蕁麻疹', '皮膚真菌感染', '帶狀皰疹']
        }
    };

    // 初始化專科相關按鈕
    function updateSpecialtyButtons(specialty) {
        // 如果沒有該專科的數據，使用內科作為默認
        const specialtyData = specialtyRelatedItems[specialty] || specialtyRelatedItems['內科'];
        
        console.log(`更新專科按鈕為: ${specialty}`);
        
        // 更新主訴按鈕
        const complaintButtons = document.querySelector('.common-complaint-buttons-container');
        if (complaintButtons) {
            let buttonsHtml = '';
            specialtyData.complaints.forEach(complaint => {
                buttonsHtml += `<button type="button" class="btn btn-sm btn-outline-secondary common-complaint-btn" 
                                data-complaint="${complaint}" data-target="chief_complaint">${complaint}</button>`;
            });
            complaintButtons.innerHTML = buttonsHtml;
            
            // 重新綁定事件
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
        }
        
        // 更新體格檢查按鈕
        const peButtons = document.querySelector('.physical-examination-buttons-container');
        if (peButtons) {
            let buttonsHtml = '';
            specialtyData.physical.forEach(pe => {
                buttonsHtml += `<button type="button" class="btn btn-sm btn-outline-secondary symptom-pe-btn" 
                               data-symptom-pe="${pe}" data-target="physical_examination">${pe.split(' ')[0]}</button>`;
            });
            peButtons.innerHTML = buttonsHtml;
            
            // 重新綁定事件
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
        }
        
        // 更新過去病史按鈕
        const pastHistoryButtons = document.querySelector('.past-history-buttons-container');
        if (pastHistoryButtons) {
            let buttonsHtml = '';
            specialtyData.pastHistory.forEach(history => {
                buttonsHtml += `<button type="button" class="btn btn-sm btn-outline-info past-history-btn" 
                               data-history="${history}" data-target="past_medical_history">${history}</button>`;
            });
            pastHistoryButtons.innerHTML = buttonsHtml;
            
            // 重新綁定事件
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
        }
    }

    // 專科模板選擇按鈕
    document.querySelectorAll('.specialty-template-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const specialty = this.getAttribute('data-specialty');
            const templateId = this.getAttribute('data-template');
            
            // 更新表單的專科選擇
            const specialtySelect = document.getElementById('specialty');
            if (specialtySelect) {
                specialtySelect.value = specialty;
                
                // 更新專科相關按鈕
                updateSpecialtyButtons(specialty);
            }
            
            // 如果有關聯的模板ID，則設置模板
            if (templateId) {
                const templateSelect = document.getElementById('templateSelect');
                if (templateSelect) {
                    templateSelect.value = templateId;
                    // 觸發模板選擇事件
                    const event = new Event('change');
                    templateSelect.dispatchEvent(event);
                }
            }
        });
    });
    
    // 專科選擇變更時更新按鈕
    const specialtySelect = document.getElementById('specialty');
    if (specialtySelect) {
        specialtySelect.addEventListener('change', function() {
            updateSpecialtyButtons(this.value);
        });
        
        // 初始化按鈕（頁面載入時）
        if (specialtySelect.value) {
            updateSpecialtyButtons(specialtySelect.value);
        }
    }

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