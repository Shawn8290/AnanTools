(function (global) {
    'use strict';

    const api = global.PrenatalCommon = global.PrenatalCommon || {};

    api.text = function (row, index) {
        const value = row && row[index];
        return value === undefined || value === null ? '' : String(value).trim();
    };

    api.normalizeHeader = function (value) {
        return String(value || '').replace(/[\s、，,()（）_＿]/g, '').toLowerCase();
    };

    api.isEmptyRow = function (row) {
        return !row || row.every((value) => String(value ?? '').trim() === '');
    };

    api.validateSchema = function (data, schema, options) {
        const errors = [];
        const rows = [];
        const settings = options || {};

        if (!Array.isArray(data) || data.length === 0 || api.isEmptyRow(data[0])) {
            return { errors: ['檔案缺少必要表頭。'], rows: [] };
        }

        const header = data[0];
        if (settings.validateHeaders !== false) {
            if (header.length < schema.length) {
                errors.push(`表頭欄位不足：應有 ${schema.length} 欄，目前只有 ${header.length} 欄。`);
            }

            schema.forEach((field, index) => {
                const actual = api.normalizeHeader(header[index]);
                const accepted = [field.name].concat(field.headerAliases || []).map(api.normalizeHeader);
                if (!actual || !accepted.some((name) => actual === name || actual.startsWith(name))) {
                    errors.push(`表頭第 ${index + 1} 欄應為「${field.name}」，目前為「${api.text(header, index) || '空白'}」。`);
                }
            });
        }

        for (let index = 1; index < data.length; index += 1) {
            const row = data[index];
            if (api.isEmptyRow(row)) continue;
            rows.push(row);
            const rowNumber = index + 1;

            schema.forEach((field, columnIndex) => {
                const value = api.text(row, columnIndex);
                const required = typeof field.required === 'function'
                    ? field.required(row, api)
                    : Boolean(field.required);

                if (required && !value) {
                    errors.push(`第 ${rowNumber} 列：【${field.name}】為必填項目。`);
                    return;
                }
                if (!value) return;
                if (field.maxLength && value.length > field.maxLength) {
                    errors.push(`第 ${rowNumber} 列：【${field.name}】資料為「${value}」，長度不可超過 ${field.maxLength}。`);
                    return;
                }
                if (field.pattern && !field.pattern.test(value)) {
                    errors.push(`第 ${rowNumber} 列：【${field.name}】資料為「${value}」，${field.patternMessage || '格式不正確'}。`);
                }
                if (field.values && !field.values.includes(value)) {
                    errors.push(`第 ${rowNumber} 列：【${field.name}】資料為「${value}」，僅可填 ${field.values.join('、')}。`);
                }
                if (field.validate) {
                    const message = field.validate(value, row, api);
                    if (message) errors.push(`第 ${rowNumber} 列：【${field.name}】${message}`);
                }
            });

            if (settings.validateRow) {
                settings.validateRow(row, rowNumber, errors, api);
            }
        }

        if (rows.length === 0) {
            errors.push('檔案內沒有可檢核的資料。');
        }
        return { errors, rows: [header].concat(rows) };
    };

    api.commonPersonFields = function (dateLabel) {
        return [
            { name: '姓名', required: true, maxLength: 30 },
            {
                name: '身分證、統一證號或護照號碼',
                headerAliases: ['身分證、統一證號\n或護照號碼', '身分證/統一證號'],
                required: true,
                maxLength: 10,
                pattern: /^[A-Z0-9]+$/,
                patternMessage: '必須為大寫半型英數字元'
            },
            { name: '出生日期', required: true, maxLength: 7, pattern: /^\d{7}$/, patternMessage: '必須為 7 碼民國日期 YYYMMDD' },
            { name: '聯絡電話1', headerAliases: ['連絡電話1(住家)', '聯絡電話1(住家)'], maxLength: 20 },
            { name: '聯絡電話2', headerAliases: ['連絡電話2(手機)', '聯絡電話2(手機)'], maxLength: 20 },
            { name: '鄉鎮市區代碼', required: true, maxLength: 4, pattern: /^\d{4}$/, patternMessage: '必須為 4 碼代碼' },
            { name: '現居住地址', headerAliases: ['居住地址'], required: true, maxLength: 60 },
            { name: '產檢院所醫事機構代碼', required: true, maxLength: 10 },
            { name: dateLabel, required: true, maxLength: 7, pattern: /^\d{7}$/, patternMessage: '必須為 7 碼民國日期 YYYMMDD' },
            { name: `${dateLabel === '採檢日期' ? '採檢' : '檢查'}時之孕期週數`, required: true, maxLength: 2, pattern: /^\d{1,2}$/, patternMessage: '必須為 1 至 2 位整數' }
        ];
    };

    api.contactRequired = function (row, rowNumber, errors) {
        if (!api.text(row, 3) && !api.text(row, 4)) {
            errors.push(`第 ${rowNumber} 列：【聯絡電話1】或【聯絡電話2】必須擇一填寫。`);
        }
    };

    api.ultrasoundBaseFields = function () {
        return api.commonPersonFields('檢查日期').concat([
            { name: '預產期', required: true, maxLength: 7, pattern: /^\d{7}$/, patternMessage: '必須為 7 碼民國日期 YYYMMDD' },
            { name: '身高', required: true, maxLength: 3, pattern: /^\d{1,3}$/, patternMessage: '必須為公分整數' },
            { name: '體重', required: true, maxLength: 3, pattern: /^\d{1,3}$/, patternMessage: '必須為公斤整數' },
            { name: 'BMI值', required: true, maxLength: 5, pattern: /^\d{1,3}(?:\.\d{1,2})?$/, patternMessage: '最多 3 位整數及 2 位小數' },
            { name: '胎數', required: true, maxLength: 1, values: ['1', '2', '3'] },
            { name: '＿胎', headerAliases: ['胎'], maxLength: 2, required: (row, helper) => helper.text(row, 14) === '3', pattern: /^\d{1,2}$/, patternMessage: '多胞胎時必須填 1 至 2 位整數' },
            { name: '胎兒心跳', required: true, maxLength: 1, values: ['0', '1'] }
        ]);
    };

    api.decimalField = function (name) {
        return { name, required: true, maxLength: 5, pattern: /^\d{1,3}(?:\.\d{1,2})?$/, patternMessage: '必須為整數或小數，且長度不可超過 5' };
    };
})(window);
