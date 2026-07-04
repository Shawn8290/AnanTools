// 使用 IIFE 包覆，確保變數與其他頁面隔離
(function() {
  const presets = {
    "0.25": { standardMg: 0.25, clicksPerStdDose: 36, colorName: "淺藍色", totalDoses: 4 },
    "0.5":  { standardMg: 0.5,  clicksPerStdDose: 36, colorName: "紅色",   totalDoses: 4 },
    "1.0":  { standardMg: 1.0,  clicksPerStdDose: 72, colorName: "橘色",   totalDoses: 4 },
    "1.7":  { standardMg: 1.7,  clicksPerStdDose: 72, colorName: "藍色",   totalDoses: 4 },
    "2.4":  { standardMg: 2.4,  clicksPerStdDose: 72, colorName: "灰色",   totalDoses: 4 }
  };

  const calcBtn = document.getElementById('wegovyCalcBtn');

  if (calcBtn) {
    calcBtn.addEventListener('click', () => {
      const key = document.getElementById('wegovyPreset').value;
      const targetMg = parseFloat(document.getElementById('wegovyTargetMg').value);
      const outEl = document.getElementById('wegovyOut');

      // 防呆檢查
      if (isNaN(targetMg) || targetMg <= 0) {
        outEl.style.display = 'block';
        outEl.innerHTML = '<span style="color:#a33">請輸入有效的劑量數字。</span>';
        return;
      }

      const { standardMg, clicksPerStdDose, colorName, totalDoses } = presets[key];

      // 計算整支筆的總格數 (Total Clicks in a new pen)
      const totalPenClicks = clicksPerStdDose * totalDoses;
      
      // 計算每 1 mg 對應多少格 (Clicks per mg)
      const clicksPerMg = clicksPerStdDose / standardMg;

      // 計算目標劑量需要的格數
      const needClicksRaw = targetMg * clicksPerMg;
      const needClicks = Math.round(needClicksRaw);

      // 計算全新筆可以打幾次這個目標劑量
      const possibleDoses = Math.floor(totalPenClicks / needClicks);

      let html = `<strong>${key} mg 筆 (${colorName})</strong><br>`;
      html += `<span style="font-size:0.9em; color:#666;">每 1 mg 約需轉 ${clicksPerMg.toFixed(1)} 格</span><br>`;
      html += `<span style="font-size:0.9em; color:#666;">全筆總格數：${totalPenClicks} 格</span>`;
      
      html += `<hr style="margin:15px 0; border:0; border-top:1px dashed #ccc;">`;
      
      html += `<div style="font-size:1.1em; margin-bottom:8px;">目標劑量：<strong>${targetMg} mg</strong></div>`;
      html += `<div>需轉動：<span class="wegovy-highlight">${needClicks}</span> 格</div>`;
      
      html += `<hr style="margin:15px 0; border:0; border-top:1px dashed #ccc;">`;
      
      if (possibleDoses >= 1) {
          html += `<div style="font-size:0.95rem; color:#005c53;">若為全新筆，約可施打 <strong>${possibleDoses}</strong> 次</div>`;
          
          // 提醒：如果算出來次數很多 (例如超過 6 次)，要提醒期限
          if (possibleDoses > 6) {
             html += `<div style="font-size:0.85rem; color:#d63384; margin-top:4px;">(注意：開封後期限僅 6 週)</div>`;
          }
      } else {
          html += `<div style="font-size:0.9rem; color:#a33;">此劑量超過單支筆總藥量！</div>`;
      }

      outEl.style.display = 'block';
      outEl.innerHTML = html;
    });
  }
})();