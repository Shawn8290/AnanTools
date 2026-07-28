(function () {
    'use strict';

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const PREGNANCY_DAYS = 280;
    const MAX_SUPPORTED_DAYS = 322;
    const calculator = document.getElementById('pregnancy-calculator');

    if (!calculator || calculator.dataset.initialized === 'true') {
        return;
    }
    calculator.dataset.initialized = 'true';

    const inputDate = calculator.querySelector('#pregnancy-input-date');
    const referenceDate = calculator.querySelector('#pregnancy-reference-date');
    const inputLabel = calculator.querySelector('#pregnancy-input-label');
    const resultArea = calculator.querySelector('#pregnancy-result');

    function toInputValue(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function parseDate(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (!match) return null;

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const date = new Date(Date.UTC(year, month - 1, day));

        if (
            date.getUTCFullYear() !== year ||
            date.getUTCMonth() !== month - 1 ||
            date.getUTCDate() !== day
        ) {
            return null;
        }
        return date;
    }

    function addDays(date, days) {
        return new Date(date.getTime() + days * MS_PER_DAY);
    }

    function differenceInDays(laterDate, earlierDate) {
        return Math.round((laterDate.getTime() - earlierDate.getTime()) / MS_PER_DAY);
    }

    function formatRocDate(date) {
        const year = date.getUTCFullYear() - 1911;
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `民國${year}年${month}月${day}日`;
    }

    function calculatePregnancyInfo(method, sourceDate, asOfDate) {
        const lastPeriodDate = method === 'lmp' ? sourceDate : addDays(sourceDate, -PREGNANCY_DAYS);
        const dueDate = method === 'due' ? sourceDate : addDays(sourceDate, PREGNANCY_DAYS);
        const elapsedDays = differenceInDays(asOfDate, lastPeriodDate);

        if (elapsedDays < 0) {
            return { error: '計算基準日早於推算的最後一次月經日，請重新確認日期。' };
        }
        if (elapsedDays > MAX_SUPPORTED_DAYS) {
            return { error: '計算結果已超過孕期第 46 週，請重新確認輸入日期。' };
        }

        return {
            weeks: Math.floor(elapsedDays / 7),
            days: elapsedDays % 7,
            lastPeriodDate,
            dueDate,
            daysUntilDue: differenceInDays(dueDate, asOfDate)
        };
    }

    function renderError(message) {
        resultArea.hidden = false;
        resultArea.className = 'pregnancy-result is-error';
        resultArea.innerHTML = `<strong>日期無法計算</strong><p>${message}</p>`;
    }

    function renderResult(result) {
        const dueStatus = result.daysUntilDue >= 0
            ? `距預產期尚有 ${result.daysUntilDue} 天`
            : `已超過預產期 ${Math.abs(result.daysUntilDue)} 天`;

        resultArea.hidden = false;
        resultArea.className = 'pregnancy-result';
        resultArea.innerHTML = `
            <p class="pregnancy-week">目前為懷孕第 <strong>${result.weeks}</strong> 週 <strong>${result.days}</strong> 天</p>
            <ul class="pregnancy-details">
                <li>推算最後一次月經日：${formatRocDate(result.lastPeriodDate)}</li>
                <li>推算預產期：${formatRocDate(result.dueDate)}</li>
                <li>${dueStatus}</li>
            </ul>
            <p class="pregnancy-note">本結果依 40 週（280 天）標準孕期推算，僅供日期計算參考；實際孕週與預產期仍應以產檢及醫療專業判定為準。所有資料只在本機瀏覽器中運算，不會上傳。</p>
        `;
    }

    function currentMethod() {
        return calculator.querySelector('input[name="pregnancy-method"]:checked').value;
    }

    function updateMethod() {
        inputLabel.textContent = currentMethod() === 'lmp' ? '最後一次月經日' : '預產期';
        resultArea.hidden = true;
    }

    function initializePregnancyCalculator() {
        const today = new Date();
        const todayValue = toInputValue(today);
        const defaultLastPeriod = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        defaultLastPeriod.setDate(defaultLastPeriod.getDate() - 84);

        referenceDate.value = todayValue;
        inputDate.value = toInputValue(defaultLastPeriod);

        calculator.querySelectorAll('input[name="pregnancy-method"]').forEach((radio) => {
            radio.addEventListener('change', updateMethod);
        });

        calculator.querySelector('#pregnancy-calculate-button').addEventListener('click', () => {
            const source = parseDate(inputDate.value);
            const asOf = parseDate(referenceDate.value);

            if (!source || !asOf) {
                renderError('請完整選擇輸入日期與計算基準日。');
                return;
            }

            const result = calculatePregnancyInfo(currentMethod(), source, asOf);
            if (result.error) {
                renderError(result.error);
                return;
            }
            renderResult(result);
        });
    }

    initializePregnancyCalculator();

    window.PregnancyCalculatorTest = Object.freeze({
        parseDate,
        addDays,
        differenceInDays,
        calculatePregnancyInfo
    });
}());
