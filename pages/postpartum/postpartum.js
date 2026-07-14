(function () {
    'use strict';

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const calculator = document.getElementById('postpartum-calculator');

    if (!calculator || calculator.dataset.initialized === 'true') {
        return;
    }

    calculator.dataset.initialized = 'true';

    function getSelect(prefix, part) {
        return calculator.querySelector(`#postpartum-${prefix}-${part}`);
    }

    function populateYearOptions(prefix, currentWesternYear) {
        const select = getSelect(prefix, 'year');
        select.innerHTML = '';

        [currentWesternYear, currentWesternYear - 1].forEach((year) => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `民國${year - 1911}年`;
            select.appendChild(option);
        });
    }

    function populateMonthOptions(prefix) {
        const select = getSelect(prefix, 'month');
        select.innerHTML = '';

        for (let month = 1; month <= 12; month += 1) {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = `${month}月`;
            select.appendChild(option);
        }
    }

    function updateDayOptions(prefix, preferredDay) {
        const year = Number(getSelect(prefix, 'year').value);
        const month = Number(getSelect(prefix, 'month').value);
        const daySelect = getSelect(prefix, 'day');
        const previouslySelectedDay = preferredDay || Number(daySelect.value) || 1;
        const daysInMonth = new Date(year, month, 0).getDate();
        const adjustedDay = Math.min(previouslySelectedDay, daysInMonth);

        daySelect.innerHTML = '';
        for (let day = 1; day <= daysInMonth; day += 1) {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = `${day}日`;
            daySelect.appendChild(option);
        }
        daySelect.value = adjustedDay;
    }

    function setSelectDate(prefix, date) {
        getSelect(prefix, 'year').value = date.getFullYear();
        getSelect(prefix, 'month').value = date.getMonth() + 1;
        updateDayOptions(prefix, date.getDate());
    }

    function getSelectedDate(prefix) {
        const year = Number(getSelect(prefix, 'year').value);
        const month = Number(getSelect(prefix, 'month').value);
        const day = Number(getSelect(prefix, 'day').value);
        return new Date(Date.UTC(year, month - 1, day));
    }

    function calculatePostpartumDays(serviceDate, deliveryDate) {
        return Math.floor((serviceDate.getTime() - deliveryDate.getTime()) / MS_PER_DAY);
    }

    function determinePostpartumService(serviceDate, deliveryDate) {
        const days = calculatePostpartumDays(serviceDate, deliveryDate);

        if (days < 0) {
            return { status: 'error', days };
        }

        if (days <= 30) {
            return { status: '5P', days };
        }

        if (days <= 92) {
            return { status: '5Q', days };
        }

        return { status: 'expired', days };
    }

    function daysMarkup(days) {
        return `<p class="postpartum-days">目前為產後第 <strong class="postpartum-days-number">${days}</strong> 天</p>`;
    }

    function serviceMarkup(result) {
        const is5P = result.status === '5P';
        const serviceName = is5P ? '第一次產後健康照護' : '第二次產後健康照護';
        const code = is5P ? '5P' : '5Q';
        const cardSequence = is5P ? 'IC5P' : 'IC5Q';
        const applicableDays = is5P ? '產後第0～30天' : '產後第31～92天';
        const recommendedSchedule = is5P ? '產後1～2週' : '產後6～8週';
        const subsidy = is5P ? '540元' : '450元';

        return `
            ${daysMarkup(result.days)}
            <h3 class="postpartum-service-title">${serviceName}</h3>
            <div class="postpartum-codes">
                <div class="postpartum-code">
                    <span class="postpartum-code-label">醫療院所申報代碼</span>
                    <strong class="postpartum-code-value">${code}</strong>
                </div>
                <div class="postpartum-code">
                    <span class="postpartum-code-label">健保卡就醫序號</span>
                    <strong class="postpartum-code-value">${cardSequence}</strong>
                </div>
            </div>
            <ul class="postpartum-details">
                <li>適用天數：${applicableDays}</li>
                <li>建議時程：${recommendedSchedule}</li>
                <li>醫療院所補助：${subsidy}</li>
            </ul>
            <p class="postpartum-note">本結果僅依日期判斷建議項目。實際申報前，仍須確認病人本胎是否已接受過相同服務，避免重複申報。</p>
        `;
    }

    function renderPostpartumResult(result) {
        const resultArea = calculator.querySelector('#postpartum-result');
        resultArea.hidden = false;
        resultArea.className = 'postpartum-result';

        if (result.status === 'error') {
            resultArea.classList.add('is-error');
            resultArea.innerHTML = '<h3 class="postpartum-alert-title">日期錯誤</h3><p>服務日期不可早於生產日期，請重新確認日期。</p>';
            return;
        }

        if (result.status === 'expired') {
            resultArea.classList.add('is-expired');
            resultArea.innerHTML = `
                ${daysMarkup(result.days)}
                <h3 class="postpartum-alert-title">已超過產後健康照護服務時程</h3>
                <p>目前不可依日期直接判定為可申報5P或5Q。</p>
                <ul class="postpartum-details">
                    <li>5P適用天數：產後第0～30天</li>
                    <li>5Q適用天數：產後第31～92天</li>
                </ul>
                <p class="postpartum-note">本結果僅依日期判斷建議項目。實際申報前，仍須確認病人本胎是否已接受過相同服務，避免重複申報。</p>
            `;
            return;
        }

        resultArea.innerHTML = serviceMarkup(result);
    }

    function initializePostpartumCalculator() {
        const today = new Date();
        const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const defaultDeliveryDate = new Date(localToday);
        defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() - 60);

        ['service', 'delivery'].forEach((prefix) => {
            populateYearOptions(prefix, localToday.getFullYear());
            populateMonthOptions(prefix);
            getSelect(prefix, 'year').addEventListener('change', () => updateDayOptions(prefix));
            getSelect(prefix, 'month').addEventListener('change', () => updateDayOptions(prefix));
        });

        setSelectDate('service', localToday);
        setSelectDate('delivery', defaultDeliveryDate);

        calculator.querySelector('#postpartum-calculate-button').addEventListener('click', () => {
            const serviceDate = getSelectedDate('service');
            const deliveryDate = getSelectedDate('delivery');
            renderPostpartumResult(determinePostpartumService(serviceDate, deliveryDate));
        });
    }

    initializePostpartumCalculator();

    window.PostpartumCalculatorTest = Object.freeze({
        calculatePostpartumDays,
        determinePostpartumService
    });
}());
