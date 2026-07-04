(function() {
    // --- 資料定義 ---
    const roles = {
        nurse: { name: '護理人員', base: 26400, nightRate: 6.70 },
        head_nurse: { name: '護理長', base: 31400, nightRate: 6.70 },
        assistant: { name: '護佐', base: 25650, nightRate: 6.70 },
        admin: { name: '病歷室/行政', base: 27400, nightRate: null }, 
        student: { name: '工讀生', base: 0, nightRate: 300 } 
    };

    const MEAL_ALLOWANCE = 3600;
    const BONUS_FIXED = 20000;
    const HIDDEN_SPECIAL_HEAD_NURSE = 5000; 

    // --- DOM 元素綁定 ---
    const roleSelect = document.getElementById('roleSelect');
    const calcPayrollBtn = document.getElementById('calcPayrollBtn');

    // --- 介面更新邏輯 ---
    function updateUI() {
        const role = roleSelect.value;
        const regularInputs = document.getElementById('regularInputs');
        const studentInputs = document.getElementById('studentInputs');
        const baseDisplay = document.getElementById('baseSalaryDisplay');
        const baseLabel = document.getElementById('baseSalaryLabel');
        const hiddenHint = document.getElementById('hidden-allowance-hint');
        
        const specialSection = document.getElementById('special-section');
        const licenseSection = document.getElementById('license-section');
        
        const chkSpecialEdu = document.getElementById('special_edu');
        const chkSpecialLead = document.getElementById('special_lead');
        const chkLicense = document.getElementById('license_check');

        specialSection.style.display = 'block';
        licenseSection.style.display = 'block';
        hiddenHint.style.display = 'none'; 

        if (role === 'student') {
            regularInputs.classList.add('hidden');
            studentInputs.classList.remove('hidden');
        } else {
            regularInputs.classList.remove('hidden');
            studentInputs.classList.add('hidden');
            
            baseDisplay.textContent = roles[role].base;

            if (role === 'nurse') {
                baseLabel.textContent = "舊制底薪 (參數)";
                chkLicense.checked = true;
                chkSpecialEdu.checked = false;
                chkSpecialLead.checked = false;
                specialSection.style.display = 'block';
                licenseSection.style.display = 'block';
            }
            else if (role === 'head_nurse') {
                baseLabel.textContent = "舊制底薪 (參數)";
                chkSpecialEdu.checked = true; 
                chkSpecialLead.checked = false; 
                chkLicense.checked = true;
                specialSection.style.display = 'block';
                licenseSection.style.display = 'block';
            }
            else if (role === 'assistant') {
                baseLabel.textContent = "舊制底薪 (參數)";
                chkLicense.checked = false;
                chkSpecialEdu.checked = false;
                chkSpecialLead.checked = false;
                licenseSection.style.display = 'none';
            } 
            else if (role === 'admin') {
                baseLabel.textContent = "新制底薪 (固定)"; 
                chkSpecialEdu.checked = false;
                chkSpecialLead.checked = false;
                chkLicense.checked = false;
                specialSection.style.display = 'none';
                licenseSection.style.display = 'none';
            }
        }
        
        document.getElementById('resultBox').style.display = 'none';
    }

    // --- 核心計算邏輯 ---
    function round2(num) {
        return Math.round(num * 100) / 100;
    }

    function calculate() {
        const roleKey = roleSelect.value;
        const resultBox = document.getElementById('resultBox');
        let html = '';

        if (roleKey === 'student') {
            const hourlyRate = parseFloat(document.getElementById('hourlyRateSelect').value);
            const perMinute = round2(hourlyRate / 60);
            
            const otHourResult = round2(hourlyRate * 1.3333); 
            const otMinuteResult = round2(otHourResult / 60);
            const nightRate = 300; 

            html += `<h3>${roles[roleKey].name} - 薪資試算</h3>`;
            html += `<table class="result-table">`;
            html += `<tr><th>時薪</th><td>${hourlyRate}</td></tr>`;
            html += `<tr><th>每分鐘</th><td>${perMinute}</td></tr>`;
            html += `<tr><th>每日 (8H)</th><td>${hourlyRate * 8}</td></tr>`;
            html += `<tr><th>加班費 (1.33倍/時)</th><td>${otHourResult}</td></tr>`;
            html += `<tr><th>加班費 (1.33倍/分)</th><td>${otMinuteResult}</td></tr>`;
            html += `<tr class="total-row"><th>22點後 (每小時)</th><td>${nightRate}</td></tr>`;
            html += `</table>`;
        } else {
            const oldBase = roles[roleKey].base;
            const meal = MEAL_ALLOWANCE;
            
            let visibleSpecial = 0;
            if (document.getElementById('special_edu').checked) visibleSpecial += 2000;
            if (document.getElementById('special_lead').checked) visibleSpecial += 2000;

            let license = 0;
            if (document.getElementById('license_check').checked) license += 3000;

            let hiddenSpecial = (roleKey === 'head_nurse') ? HIDDEN_SPECIAL_HEAD_NURSE : 0;
            const totalSpecial = visibleSpecial + hiddenSpecial;

            let newBase = 0;
            let newMonthly = 0;
            let oldMonthly = 0; 

            if (roleKey === 'admin') {
                newBase = oldBase; 
                newMonthly = newBase + meal + visibleSpecial + license;
            } else {
                oldMonthly = oldBase + license + meal + totalSpecial; 
                
                const buyOut = round2((oldBase + license + meal + totalSpecial) * 2 / 12);
                newBase = oldBase + buyOut;

                if (roleKey === 'head_nurse') {
                    newMonthly = newBase + license + meal + totalSpecial;
                } else {
                    newMonthly = newBase + license + meal;
                }
            }

            const leaveCash = round2(newMonthly / 30);
            const otRateHour = round2(leaveCash / 8);
            const otRateMin = round2(otRateHour / 60);
            const ot133 = round2(otRateMin * 1.3333);
            const ot166 = round2(otRateMin * 1.6666);
            const compCash = round2((ot133 * 2 * 60) + (ot166 * 6 * 60));
            const yearEndTotal = newMonthly + BONUS_FIXED;
            const nightVal = roles[roleKey].nightRate;

            html += `<h3>${roles[roleKey].name} - 薪資試算</h3>`;
            html += `<table class="result-table">`;
            
            if (roleKey !== 'admin') {
                let oldTitle = "舊制月薪<br><span style='font-size:0.8em'>";
                oldTitle += (roleKey === 'head_nurse') ? "底薪+執照+伙食+特別津貼</span>" : "底薪+執照+伙食</span>";
                
                html += `<tr style="background:#f9f9f9; color:#777;"><th>(參考) ${oldTitle}</th><td>${oldMonthly.toLocaleString()}</td></tr>`;
                
                if(totalSpecial > 0) {
                     let note = (roleKey === 'head_nurse') ? "已納入底薪運算，且外加於月薪" : "已納入新制底薪運算";
                     let specialText = `$${totalSpecial.toLocaleString()}`;
                     if(hiddenSpecial > 0) specialText += ` <span style="font-size:0.8em">(含職務加給$${hiddenSpecial})</span>`;

                     html += `<tr style="background:#f9f9f9; color:#777;"><th>(參考) 特別津貼<br><span style="font-size:0.8em">${note}</span></th><td>${specialText}</td></tr>`;
                }
                html += `<tr><td colspan="2" style="border-bottom: 2px solid #ddd;"></td></tr>`;
            }

            let baseTitle = (roleKey === 'admin') ? "新制底薪 (固定)" : "新制底薪 <span class='info-tag'>(算式結果)</span>";
            
            let monthLabel = "";
            if(roleKey === 'admin') monthLabel = "(底薪+伙食)";
            else if(roleKey === 'head_nurse') monthLabel = "(底薪+執照+伙食+特別)";
            else monthLabel = "(底薪+執照+伙食)";

            html += `<tr><th>${baseTitle}</th><td>${newBase.toLocaleString()}</td></tr>`;
            html += `<tr><th>新制月薪 <span class="info-tag">${monthLabel}</span></th><td style="color:blue; font-size:1.2em">${newMonthly.toLocaleString()}</td></tr>`;
            
            html += `<tr><th>特休換錢 <span class="info-tag">(/30)</span></th><td>${leaveCash}</td></tr>`;
            html += `<tr><th>加班費 (時) <span class="info-tag">(/8)</span></th><td>${otRateHour}</td></tr>`;
            html += `<tr><th>加班費 (分) <span class="info-tag">(/60)</span></th><td>${otRateMin}</td></tr>`;
            html += `<tr><th>加班費 1.33 <span class="info-tag">(*1.3333)</span></th><td>${ot133}</td></tr>`;
            html += `<tr><th>加班費 1.66 <span class="info-tag">(*1.6666)</span></th><td>${ot166}</td></tr>`;
            
            if (nightVal !== null) {
                html += `<tr><th>22點後 <span class="info-tag">(每分鐘)</span></th><td class="highlight">${nightVal.toFixed(2)}</td></tr>`;
            }

            html += `<tr class="total-row"><th>補休換錢<br><span style="font-size:0.5em; font-weight:normal">(1.33*120分 + 1.66*360分)</span></th><td>${compCash.toLocaleString()}</td></tr>`;
            html += `<tr><th>年終預估 <span class="info-tag">(月薪+2萬)</span></th><td>${yearEndTotal.toLocaleString()}</td></tr>`;
            html += `</table>`;
            
            html += `<div style="margin-top:10px; font-size:0.9em; color:#666;">
                * 計算公式依據 115年 新制規範<br>
                * 所有金額皆四捨五入至小數點第2位
            </div>`;
        }

        resultBox.innerHTML = html;
        resultBox.style.display = 'block';

        // 改用捲動到容器底部，而不是整個視窗，這樣在 SPA 體驗會更好
        const container = document.querySelector('.payroll-container');
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }

    // --- 事件綁定與初始化 ---
    if (roleSelect && calcPayrollBtn) {
        roleSelect.addEventListener('change', updateUI);
        calcPayrollBtn.addEventListener('click', calculate);
        
        // 初始載入時先執行一次 UI 更新
        updateUI();
    }
})();