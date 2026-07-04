// 使用 IIFE (立即執行函式) 包覆，避免變數污染全域，並確保每次切換頁面時重新綁定事件
(function() {
    const presets = {
        // penMg: 整支筆的總藥量 (mg)
        // penClicks: 整支筆的總格數
        // penVol: 整支筆的總容量 (cc/ml) -> 官方規格通常為 2.4ml
        "2.5": { penMg: 10, penClicks: 240, penVol: 2.4 },
        "5":   { penMg: 20, penClicks: 240, penVol: 2.4 },
        "7.5": { penMg: 30, penClicks: 240, penVol: 2.4 },
        "10":  { penMg: 40, penClicks: 240, penVol: 2.4 }
    };

    const calcBtn = document.getElementById('calcBtn');
    
    // 確保按鈕存在才綁定事件 (避免頁面切換時的潛在錯誤)
    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
            const key = document.getElementById('preset').value;
            const targetMg = parseFloat(document.getElementById('targetMg').value);
            const outEl = document.getElementById('out');

            if(isNaN(targetMg) || targetMg <= 0){
                outEl.style.display = 'block';
                outEl.innerHTML = '<span style="color:#a33">請輸入有效的劑量 (mg)。</span>';
                return;
            }

            const { penMg, penClicks, penVol } = presets[key];
            
            // 計算每 mg 對應多少格
            const clicksPerMg = penClicks / penMg;
            
            // 計算目標劑量需要的格數
            const needClicks = targetMg * clicksPerMg;
            
            // 計算施打體積 (cc)
            // 公式：目標格數 * (總容量 / 總格數) 或 (目標mg / 總mg) * 總容量
            const volPerClick = penVol / penClicks; // 通常是 0.01 cc
            const needVol = needClicks * volPerClick;

            // 計算這支筆還能打幾次 (以整支筆計算)
            const doses = Math.floor(penClicks / needClicks);
            const remainingClicks = penClicks - doses * needClicks;

            let html = `<strong>${key} mg 筆</strong><br>`;
            html += `每 mg 約 <strong>${clicksPerMg.toFixed(2)}</strong> 格<br>`;
            
            html += `<hr style="margin:12px 0; border:0; border-top:1px dashed #ccc;">`;
            
            html += `<div style="font-size:1.1em; margin-bottom:6px;">目標：${targetMg} mg</div>`;
            html += `<div style="margin-bottom:4px;">需轉動：<span class="mounjaro-highlight">${Math.round(needClicks)}</span> 格</div>`;
            html += `<div>注射體積：<span class="mounjaro-highlight">${needVol.toFixed(2)}</span> cc</div>`;
            
            html += `<hr style="margin:12px 0; border:0; border-top:1px dashed #ccc;">`;
            
            html += `<div style="font-size:0.9rem; color:#666;">此筆約可施打 <strong>${doses}</strong> 次</div>`;
            // 若有剩餘格數才顯示
            if(remainingClicks > 0) {
                html += `<div style="font-size:0.9rem; color:#666;">(餘約 ${Math.round(remainingClicks)} 格)</div>`;
            }

            outEl.style.display = 'block';
            outEl.innerHTML = html;
        });
    }
})();