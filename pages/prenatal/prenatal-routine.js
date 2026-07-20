(function (global) {
    'use strict';
    const validators = global.PrenatalValidators = global.PrenatalValidators || {};

    validators.routine = {
        label: '產前檢查常規項目紀錄',
        createsDownload: true,
        validate(data) {
            const common = global.PrenatalCommon;
            const schema = [
                { name: '姓名', required: true, maxLength: 30 },
                { name: '身分證/統一證號', headerAliases: ['身分證、統一證號或護照號碼'], required: true, maxLength: 10, pattern: /^[A-Z0-9]+$/, patternMessage: '必須為大寫半型英數字元' },
                { name: '出生日期', required: true, maxLength: 7, pattern: /^\d{7}$/, patternMessage: '必須為 7 碼數字 YYYMMDD' },
                { name: '聯絡電話1', headerAliases: ['連絡電話1(住家)'], maxLength: 20 },
                { name: '聯絡電話2', headerAliases: ['連絡電話2(手機)'], maxLength: 20 },
                { name: '鄉鎮市區代碼', required: true, maxLength: 4, pattern: /^\d{4}$/, patternMessage: '必須為 4 碼代碼' },
                { name: '居住地址', required: true, maxLength: 60 },
                { name: '產檢院所醫事機構代碼', required: true, maxLength: 10 },
                { name: '檢查日期', required: true, maxLength: 7, pattern: /^\d{7}$/, patternMessage: '必須為 7 碼數字 YYYMMDD' },
                { name: '檢查時之孕期週數', required: true, maxLength: 2, pattern: /^\d{1,2}$/, patternMessage: '必須為整數' },
                { name: '身高', maxLength: 3, required: (row, helper) => helper.text(row, 13) === '1', pattern: /^\d{1,3}$/, patternMessage: '必須為公分整數' },
                { name: '體重', required: true, maxLength: 3, pattern: /^\d{1,3}$/, patternMessage: '必須為公斤整數' },
                { name: 'BMI值', maxLength: 5, pattern: /^\d{1,3}(?:\.\d{2})?$/, patternMessage: '必須為整數或含 2 位小數' },
                { name: '產檢次數', headerAliases: ['健保卡就醫序號', '卡序'], maxLength: 2 }
            ];
            return common.validateSchema(data, schema, {
                validateHeaders: false,
                validateRow: common.contactRequired
            });
        }
    };
})(window);
