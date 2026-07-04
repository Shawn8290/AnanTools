(function() {
    // --- 1. 動態載入 SheetJS 函式庫 (若尚未載入) ---
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
        script.onload = () => console.log("SheetJS loaded successfully.");
        document.head.appendChild(script);
    }

    // --- 2. DOM 元素綁定 ---
    const uploadInput = document.getElementById('uploadFile');
    const reportArea = document.getElementById('reportArea');

    // --- 3. 檔案上傳與讀取邏輯 ---
    if (uploadInput) {
        uploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            // 顯示讀取中提示
            reportArea.innerHTML = '<div style="color: #4a5568;">⏳ 資料讀取與檢核中，請稍候...</div>';

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    // 確保 XLSX 已經成功從 CDN 載入
                    if (typeof XLSX === 'undefined') {
                        reportArea.innerHTML = '<div class="error-msg">❌ 系統正在載入 Excel 處理模組，請等待幾秒鐘後重新選擇檔案。</div>';
                        uploadInput.value = ''; // 清空 input 讓使用者可以重選
                        return;
                    }

                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {type: 'array'});
                    
                    // 假設資料都在第一個工作表 (Sheet)
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // 將 Sheet 轉為二維陣列，header: 1 代表保留原本的欄位順序
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                    
                    // 執行驗證
                    validateData(jsonData);
                } catch (error) {
                    reportArea.innerHTML = `<div class="error-msg">❌ 檔案解析失敗，請確認檔案格式是否正確。(${error.message})</div>`;
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // --- 4. 核心檢核邏輯 ---
    function validateData(data, validTownCodes) {
        reportArea.innerHTML = '';
        let errorLog = [];

        // 從 index 1 開始 (跳過 index 0 的表頭)
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 1; // 實際在 Excel 裡面的列號

            // 避免讀到完全空白的列 (檢查前兩個欄位是否有值)
            if (!row || row.length === 0 || (!row[0] && !row[1])) continue; 

            // 輔助函式：安全地取得欄位值，去除前後空白，若無值則回傳空字串
            const getVal = (index) => (row[index] !== undefined && row[index] !== null) ? row[index].toString().trim() : '';

            // 輔助函式：通用欄位檢查 (檢查必填與最大長度)
            const checkField = (val, colName, maxLen, isRequired = false) => {
                if (isRequired && !val) {
                    errorLog.push(`第 ${rowNum} 列：【${colName}】為必填項目`);
                }
                if (val && val.length > maxLen) {
                    errorLog.push(`第 ${rowNum} 列：【${colName}】資料為「${val}」，長度不可超過 ${maxLen}`);
                }
            };

            // 取出欄位值
            const name        = getVal(0);   // A
            const idStr       = getVal(1);   // B
            const birthDate   = getVal(2);   // C
            const phone1      = getVal(3);   // D
            const phone2      = getVal(4);   // E
            const townCode    = getVal(5);   // F
            const address     = getVal(6);   // G
            const hospCode    = getVal(7);   // H
            const checkDate   = getVal(8);   // I
            const pregWeeks   = getVal(9);   // J
            const height      = getVal(10);  // K
            const weight      = getVal(11);  // L
            const bmi         = getVal(12);  // M
            const cardSeq     = getVal(13);  // N

            // ==========================================
            // 依照規則逐一檢核
            // ==========================================

            checkField(name, '姓名', 30, true);
            
            checkField(idStr, '身分證/統一證號', 10, true);
            if (idStr && !/^[A-Z0-9]+$/.test(idStr)) {
                errorLog.push(`第 ${rowNum} 列：【身分證/統一證號】資料為「${idStr}」，必須為大寫半型英數字元`);
            }

            checkField(birthDate, '出生日期', 7, true);
            if (birthDate && !/^\d{7}$/.test(birthDate)) {
                errorLog.push(`第 ${rowNum} 列：【出生日期】資料為「${birthDate}」，格式錯誤，必須為 7 碼數字 (YYYMMDD)`);
            }

            checkField(phone1, '聯絡電話1', 20, false);
            checkField(phone2, '聯絡電話2', 20, false);
            if (!phone1 && !phone2) {
                errorLog.push(`第 ${rowNum} 列：【聯絡電話1】或【聯絡電話2】必須擇一填寫`);
            }

            checkField(townCode, '鄉鎮市區代碼', 4, true);
            if (townCode && validTownCodes && !validTownCodes.includes(townCode)) {
                errorLog.push(`第 ${rowNum} 列：【鄉鎮市區代碼】資料為「${townCode}」，不存在於代碼表中`);
            }

            checkField(address, '居住地址', 60, true);
            checkField(hospCode, '產檢院所醫事機構代碼', 10, true);
            
            checkField(checkDate, '檢查日期', 7, true);
            if (checkDate && !/^\d{7}$/.test(checkDate)) {
                errorLog.push(`第 ${rowNum} 列：【檢查日期】資料為「${checkDate}」，格式錯誤，必須為 7 碼數字`);
            }

            checkField(pregWeeks, '檢查時之孕期週數', 2, true);
            if (pregWeeks && !/^\d{1,2}$/.test(pregWeeks)) {
                errorLog.push(`第 ${rowNum} 列：【孕期週數】資料為「${pregWeeks}」，必須為整數`);
            }

            checkField(height, '身高', 3, (cardSeq === '1'));
            if (height && !/^\d{1,3}$/.test(height)) {
                errorLog.push(`第 ${rowNum} 列：【身高】資料為「${height}」，必須為公分整數`);
            }

            checkField(weight, '體重', 3, true);
            if (weight && !/^\d{1,3}$/.test(weight)) {
                errorLog.push(`第 ${rowNum} 列：【體重】資料為「${weight}」，必須為公斤整數`);
            }

            checkField(bmi, 'BMI值', 5, false);
            if (bmi && !/^\d{1,3}(\.\d{2})?$/.test(bmi)) {
                errorLog.push(`第 ${rowNum} 列：【BMI值】資料為「${bmi}」，格式錯誤，最多3位整數與1位小數`);
            }
        }

        // --- 5. 輸出報告 ---
        if (errorLog.length === 0) {
            reportArea.innerHTML = '<div class="success-msg">✅ 所有資料均符合規格要求！可以安心上傳申報。</div>';
        } else {
            const errorHtml = errorLog.map(msg => `<div class="error-msg">❌ ${msg}</div>`).join('');
            reportArea.innerHTML = `<h3 style="color: #c53030; border-bottom: 1px solid #fc8181; padding-bottom: 10px;">共發現 ${errorLog.length} 個錯誤：</h3>` + errorHtml;
        }
    }
})();