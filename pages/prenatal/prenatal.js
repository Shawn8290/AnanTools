(function() {
    // --- 1. 動態載入 SheetJS 函式庫 (若尚未載入) ---
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
        script.onload = () => console.log("SheetJS loaded successfully.");
        document.head.appendChild(script);
    }
    
    // --- 動態載入 JSZip 函式庫 (用來打包ZIP) ---
    if (typeof JSZip === 'undefined') {
        const zipScript = document.createElement('script');
        zipScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        document.head.appendChild(zipScript);
    }

    // --- 2. DOM 元素綁定 ---
    const uploadInput = document.getElementById('uploadFile');
    const reportArea = document.getElementById('reportArea');

    // --- 3. 檔案上傳與讀取邏輯 ---
    if (uploadInput) {
        uploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            reportArea.innerHTML = '<div style="color: #4a5568;">⏳ 資料讀取與檢核中，請稍候...</div>';

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    if (typeof XLSX === 'undefined' || typeof JSZip === 'undefined') {
                        reportArea.innerHTML = '<div class="error-msg">❌ 系統正在載入處理模組，請等待幾秒鐘後重新選擇檔案。</div>';
                        uploadInput.value = ''; 
                        return;
                    }

                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {type: 'array'});
                    
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                    
                    // 取得原始檔名 (去除副檔名)
                    const baseFileName = file.name.replace(/\.[^/.]+$/, "");
                    
                    // 執行驗證，並把原始檔名傳過去
                    validateData(jsonData, null, baseFileName);
                } catch (error) {
                    reportArea.innerHTML = `<div class="error-msg">❌ 檔案解析失敗，請確認檔案格式是否正確。(${error.message})</div>`;
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // --- 4. 核心檢核邏輯 (維持原始邏輯完全不變) ---
    function validateData(data, validTownCodes, baseFileName) {
        reportArea.innerHTML = '';
        let errorLog = [];
        let validRows = []; // 用來儲存過濾掉空白列的乾淨資料，以備後續分割

        // 保留表頭 (第 0 列)
        if (data.length > 0) {
            validRows.push(data[0]);
        }

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 1;

            // 避免讀到完全空白的列
            if (!row || row.length === 0 || (!row[0] && !row[1])) continue; 

            validRows.push(row);

            const getVal = (index) => (row[index] !== undefined && row[index] !== null) ? row[index].toString().trim() : '';

            const checkField = (val, colName, maxLen, isRequired = false) => {
                if (isRequired && !val) {
                    errorLog.push(`第 ${rowNum} 列：【${colName}】為必填項目`);
                }
                if (val && val.length > maxLen) {
                    errorLog.push(`第 ${rowNum} 列：【${colName}】資料為「${val}」，長度不可超過 ${maxLen}`);
                }
            };

            const name        = getVal(0);   
            const idStr       = getVal(1);   
            const birthDate   = getVal(2);   
            const phone1      = getVal(3);   
            const phone2      = getVal(4);   
            const townCode    = getVal(5);   
            const address     = getVal(6);   
            const hospCode    = getVal(7);   
            const checkDate   = getVal(8);   
            const pregWeeks   = getVal(9);   
            const height      = getVal(10);  
            const weight      = getVal(11);  
            const bmi         = getVal(12);  
            const cardSeq     = getVal(13);  

            // ==========================================
            // 完全保留原始的規則檢核
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

        // --- 5. 判斷輸出報告或執行分割打包 ---
        if (errorLog.length === 0) {
            reportArea.innerHTML = '<div class="success-msg">✅ 格式完全正確！正在自動為您分割資料並打包成 ZIP...</div>';
            splitAndZipData(validRows, baseFileName);
        } else {
            const errorHtml = errorLog.map(msg => `<div class="error-msg">❌ ${msg}</div>`).join('');
            reportArea.innerHTML = `<h3 style="color: #c53030; border-bottom: 1px solid #fc8181; padding-bottom: 10px;">共發現 ${errorLog.length} 個錯誤：</h3>` + errorHtml;
        }
    }

    // --- 6. 分割資料與打包 ZIP 邏輯 ---
    async function splitAndZipData(validRows, baseFileName) {
        try {
            if (validRows.length <= 1) {
                reportArea.innerHTML += '<div class="error-msg" style="margin-top:10px;">⚠️ 檔案內沒有可轉換的資料。</div>';
                return;
            }

            const header = validRows[0];         
            const dataRows = validRows.slice(1); 
            const chunkSize = 30;                
            
            const zip = new JSZip();
            let partCount = 0;

            for (let i = 0; i < dataRows.length; i += chunkSize) {
                partCount++;
                const chunk = dataRows.slice(i, i + chunkSize);
                
                // 將表頭組合至該批次的資料最上方
                const sheetData = [header, ...chunk];
                
                const ws = XLSX.utils.aoa_to_sheet(sheetData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
                
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                
                const fileName = `${baseFileName}_${partCount}.xlsx`;
                zip.file(fileName, wbout);
            }

            const zipContent = await zip.generateAsync({ type: "blob" });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipContent);
            link.download = `${baseFileName}_自動分割.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            reportArea.innerHTML = `
                <div class="success-msg" style="text-align:left; padding:20px;">
                    <div style="font-size:1.2em; margin-bottom:10px;">✅ 檢核與分割成功！</div>
                    <ul style="color:#2f855a; font-weight:normal; margin:0; line-height:1.6;">
                        <li>總有效筆數：<b>${dataRows.length}</b> 筆</li>
                        <li>分割檔案數：<b>${partCount}</b> 個檔案 (.xlsx)</li>
                        <li>已自動為您下載打包好的 <b>${baseFileName}_自動分割.zip</b></li>
                    </ul>
                </div>`;

        } catch (error) {
            console.error("分割打包過程發生錯誤:", error);
            reportArea.innerHTML += `<div class="error-msg" style="margin-top:10px;">❌ 分割打包失敗：${error.message}</div>`;
        }
    }
})();
