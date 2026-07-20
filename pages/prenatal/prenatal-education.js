(function (global) {
    'use strict';
    const validators = global.PrenatalValidators = global.PrenatalValidators || {};

    validators.education = {
        label: '產前衛教指導紀錄',
        createsDownload: false,
        validate(data) {
            const common = global.PrenatalCommon;
            const binary = ['0', '1'];
            const schema = [
                { name: '衛教次數', required: true, values: ['1', '2'] },
                { name: '指導日期', required: true, pattern: /^\d{4}-\d{2}-\d{2}$/, patternMessage: '必須為西元日期 YYYY-MM-DD' },
                { name: '懷孕週數', required: true, maxLength: 2, pattern: /^\d{1,2}$/, patternMessage: '必須為整數' },
                { name: '孕次', required: true, maxLength: 2, pattern: /^\d{1,2}$/, patternMessage: '必須為整數' },
                { name: '姓名', required: true, maxLength: 30 },
                { name: '出生日期', required: true, pattern: /^\d{4}-\d{2}-\d{2}$/, patternMessage: '必須為西元日期 YYYY-MM-DD' },
                { name: '身分證字號', required: true, maxLength: 10, pattern: /^[A-Z0-9]+$/, patternMessage: '必須為大寫半型英數字元' },
                { name: '縣市代碼', required: true, maxLength: 4, pattern: /^\d{4}$/, patternMessage: '必須為 4 碼代碼' },
                { name: '聯絡地址', required: true, maxLength: 60 },
                { name: '聯絡方式(手機)', maxLength: 20 },
                { name: '聯絡方式(住家)', maxLength: 20 },
                { name: '1.是否吸菸', required: true, values: binary },
                { name: '2.注意遠離二手菸環境', required: true, values: binary },
                { name: '3.是否喝酒', required: true, values: binary },
                { name: '4.是否嚼檳榔', required: true, values: binary },
                { name: '5.是否曾使用毒品或濫用藥物', required: true, values: binary },
                { name: '6.是否咳嗽', required: true, values: binary },
                { name: '心情溫度計-憂鬱檢測_情緒', required: true, values: binary },
                { name: '心情溫度計-憂鬱檢測_事物', required: true, values: binary },
                { name: '醫療史', required: true, values: binary },
                { name: '醫療史細項' },
                { name: '第二次衛教醫療史_8細項' },
                { name: '醫療史細項其他說明' },
                { name: '衛教主題', required: true, pattern: /^(?:Y|N)(?:,(?:Y|N))*$/, patternMessage: '必須為逗號分隔的 Y/N 項目' },
                { name: '指導重點', required: true, pattern: /^(?:Y|N)(?:,(?:Y|N))*$/, patternMessage: '必須為逗號分隔的 Y/N 項目' },
                { name: '醫事人員', required: true, maxLength: 30 },
                { name: '院所代碼', required: true, maxLength: 10 },
                { name: '國籍', required: true, values: ['1', '2', '3'] },
                { name: '身高', required: true, maxLength: 3, pattern: /^\d{1,3}(?:\.0)?$/, patternMessage: '必須為公分數值' },
                { name: '目前體重', required: true, maxLength: 5, pattern: /^\d{1,3}(?:\.\d{1,2})?$/, patternMessage: '必須為公斤數值' },
                { name: '最後一次月經日', required: true, pattern: /^\d{4}-\d{2}-\d{2}$/, patternMessage: '必須為西元日期 YYYY-MM-DD' },
                { name: '懷孕前體重', required: true, maxLength: 5, pattern: /^\d{1,3}(?:\.\d{1,2})?$/, patternMessage: '必須為公斤數值' },
                { name: 'BMI', required: true, maxLength: 5, pattern: /^\d{1,3}(?:\.\d{1,2})?$/, patternMessage: '必須為數值' }
            ];
            return common.validateSchema(data, schema, {
                validateRow(row, rowNumber, errors) {
                    if (!common.text(row, 9) && !common.text(row, 10)) {
                        errors.push(`第 ${rowNumber} 列：【聯絡方式(手機)】或【聯絡方式(住家)】必須擇一填寫。`);
                    }
                }
            });
        }
    };
})(window);
