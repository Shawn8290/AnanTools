(function (global) {
    'use strict';

    const entryUrl = document.currentScript && document.currentScript.src;
    const baseUrl = entryUrl ? new URL('.', entryUrl) : new URL('./', global.location.href);
    const MODULES = [
        ['prenatal-common.js', () => Boolean(global.PrenatalCommon)],
        ['prenatal-routine.js', () => Boolean(global.PrenatalValidators && global.PrenatalValidators.routine)],
        ['prenatal-diabetes-anemia.js', () => Boolean(global.PrenatalValidators && global.PrenatalValidators['diabetes-anemia'])],
        ['prenatal-education.js', () => Boolean(global.PrenatalValidators && global.PrenatalValidators.education)],
        ['prenatal-ultrasound-first.js', () => Boolean(global.PrenatalValidators && global.PrenatalValidators['ultrasound-first'])],
        ['prenatal-ultrasound-second.js', () => Boolean(global.PrenatalValidators && global.PrenatalValidators['ultrasound-second'])],
        ['prenatal-ultrasound-third.js', () => Boolean(global.PrenatalValidators && global.PrenatalValidators['ultrasound-third'])]
    ];
    function loadScriptOnce(src, readyCheck) {
        if (readyCheck && readyCheck()) return Promise.resolve();

        const absoluteSrc = new URL(src, baseUrl).href;
        const existing = Array.from(document.scripts).find((script) => script.src === absoluteSrc);
        if (existing) {
            if (readyCheck && readyCheck()) return Promise.resolve();
            return new Promise((resolve, reject) => {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
            });
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = absoluteSrc;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`無法載入 ${src}`));
            document.head.appendChild(script);
        });
    }

    async function loadModules() {
        for (const [file, readyCheck] of MODULES) {
            await loadScriptOnce(file, readyCheck);
        }
    }

    async function ensureXlsx() {
        await loadScriptOnce(
            'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js',
            () => typeof global.XLSX !== 'undefined'
        );
    }

    async function ensureJsZip() {
        await loadScriptOnce(
            'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
            () => typeof global.JSZip !== 'undefined'
        );
    }

    function selectedType(container) {
        const selected = container.querySelector('input[name="prenatalRecordType"]:checked');
        return selected ? selected.value : 'routine';
    }

    function clearReport(reportArea) {
        reportArea.replaceChildren();
    }

    function showStatus(reportArea, message) {
        clearReport(reportArea);
        const status = document.createElement('div');
        status.style.color = '#4a5568';
        status.textContent = message;
        reportArea.appendChild(status);
    }

    function showErrors(reportArea, errors) {
        clearReport(reportArea);
        const heading = document.createElement('h3');
        heading.style.cssText = 'color:#c53030;border-bottom:1px solid #fc8181;padding-bottom:10px;';
        heading.textContent = `共發現 ${errors.length} 個錯誤：`;
        reportArea.appendChild(heading);

        errors.forEach((message) => {
            const item = document.createElement('div');
            item.className = 'error-msg';
            item.textContent = `❌ ${message}`;
            reportArea.appendChild(item);
        });
    }

    function showValidationSuccess(reportArea, label, rowCount) {
        clearReport(reportArea);
        const message = document.createElement('div');
        message.className = 'success-msg';
        message.style.textAlign = 'left';
        message.textContent = `✅ ${label}格式檢核通過，共 ${rowCount} 筆資料。未產生或下載任何副檔。`;
        reportArea.appendChild(message);
    }

    async function splitAndDownload(rows, baseFileName, reportArea) {
        await ensureJsZip();
        const header = rows[0];
        const dataRows = rows.slice(1);
        const zip = new global.JSZip();
        let partCount = 0;

        for (let index = 0; index < dataRows.length; index += 30) {
            partCount += 1;
            const sheet = global.XLSX.utils.aoa_to_sheet([header].concat(dataRows.slice(index, index + 30)));
            const workbook = global.XLSX.utils.book_new();
            global.XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
            const output = global.XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            zip.file(`${baseFileName}_${partCount}.xlsx`, output);
        }

        const zipContent = await zip.generateAsync({ type: 'blob' });
        const objectUrl = URL.createObjectURL(zipContent);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `${baseFileName}_自動分割.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

        clearReport(reportArea);
        const result = document.createElement('div');
        result.className = 'success-msg';
        result.style.textAlign = 'left';
        result.innerHTML = `
            <div style="font-size:1.2em;margin-bottom:10px;">✅ 檢核與分割成功！</div>
            <ul style="color:#2f855a;font-weight:normal;margin:0;line-height:1.6;">
                <li>總有效筆數：<b>${dataRows.length}</b> 筆</li>
                <li>分割檔案數：<b>${partCount}</b> 個檔案 (.xlsx)</li>
                <li>已下載：<b></b></li>
            </ul>`;
        result.querySelector('li:last-child b').textContent = `${baseFileName}_自動分割.zip`;
        reportArea.appendChild(result);
    }

    function readWorkbook(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('無法讀取選擇的檔案。'));
            reader.onload = (event) => {
                try {
                    const workbook = global.XLSX.read(new Uint8Array(event.target.result), { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    resolve(global.XLSX.utils.sheet_to_json(worksheet, {
                        header: 1,
                        raw: false,
                        defval: ''
                    }));
                } catch (error) {
                    reject(new Error(`檔案解析失敗，請確認檔案格式是否正確。(${error.message})`));
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    async function handleFile(file, type, reportArea, uploadInput) {
        showStatus(reportArea, '⏳ 資料讀取與檢核中，請稍候...');
        uploadInput.disabled = true;
        try {
            await ensureXlsx();
            const data = await readWorkbook(file);
            const validator = global.PrenatalValidators && global.PrenatalValidators[type];
            if (!validator) throw new Error('找不到所選項目的檢核模組。');

            const result = validator.validate(data);
            if (!reportArea.isConnected) return;
            if (result.errors.length > 0) {
                showErrors(reportArea, result.errors);
                return;
            }

            if (validator.createsDownload) {
                showStatus(reportArea, '✅ 格式正確，正在每 30 筆分割並打包 ZIP...');
                const baseFileName = file.name.replace(/\.[^/.]+$/, '');
                await splitAndDownload(result.rows, baseFileName, reportArea);
            } else {
                showValidationSuccess(reportArea, validator.label, result.rows.length - 1);
            }
        } catch (error) {
            if (reportArea.isConnected) showErrors(reportArea, [error.message]);
        } finally {
            if (uploadInput.isConnected) {
                uploadInput.disabled = false;
                uploadInput.value = '';
            }
        }
    }

    async function initialize() {
        const container = document.querySelector('.prenatal-container');
        if (!container || container.dataset.initialized === 'true') return;
        container.dataset.initialized = 'true';

        const uploadInput = container.querySelector('#uploadFile');
        const reportArea = container.querySelector('#reportArea');
        const modeHint = container.querySelector('#prenatalModeHint');
        const radios = container.querySelectorAll('input[name="prenatalRecordType"]');
        if (!uploadInput || !reportArea || !modeHint || radios.length !== 6) return;

        try {
            await loadModules();
        } catch (error) {
            showErrors(reportArea, [`檢核模組載入失敗：${error.message}`]);
            uploadInput.disabled = true;
            return;
        }

        radios.forEach((radio) => {
            radio.addEventListener('change', () => {
                uploadInput.value = '';
                clearReport(reportArea);
                modeHint.hidden = selectedType(container) !== 'routine';
            });
        });

        uploadInput.addEventListener('change', () => {
            const file = uploadInput.files && uploadInput.files[0];
            if (file) handleFile(file, selectedType(container), reportArea, uploadInput);
        });
    }

    initialize();
})(window);
