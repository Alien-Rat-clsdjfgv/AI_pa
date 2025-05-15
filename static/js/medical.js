document.addEventListener('DOMContentLoaded', function() {
    // 為常見主訴下拉菜單項添加點擊事件
    document.querySelectorAll('[data-complaint]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('chiefComplaint').value = this.getAttribute('data-complaint');
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
            document.getElementById('chiefComplaint').value = complaint;
        });
    });
});