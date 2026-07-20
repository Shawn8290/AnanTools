(function (global) {
    'use strict';
    const validators = global.PrenatalValidators = global.PrenatalValidators || {};

    validators['diabetes-anemia'] = {
        label: '妊娠糖尿及貧血紀錄',
        createsDownload: false,
        validate(data) {
            const common = global.PrenatalCommon;
            const screeningIncludes = (code) => (row, helper) => code.includes(helper.text(row, 11));
            const schema = common.commonPersonFields('採檢日期').concat([
                { name: '體重', required: true, maxLength: 3, pattern: /^\d{1,3}$/, patternMessage: '必須為公斤整數' },
                { name: '本次篩檢項目', required: true, maxLength: 1, values: ['1', '2', '3'] },
                { name: 'GLU AC(mg/dL)', required: screeningIncludes(['1', '3']), maxLength: 3, pattern: /^\d{1,3}$/, patternMessage: '必須為整數' },
                { name: 'GLU 1hr(mg/dL)', required: screeningIncludes(['1', '3']), maxLength: 3, pattern: /^\d{1,3}$/, patternMessage: '必須為整數' },
                { name: 'GLU 2hr(mg/dL)', required: screeningIncludes(['1', '3']), maxLength: 3, pattern: /^\d{1,3}$/, patternMessage: '必須為整數' },
                { name: '妊娠糖尿病篩檢結果', headerAliases: ['糖尿病篩檢結果'], required: screeningIncludes(['1', '3']), maxLength: 1, values: ['0', '1'] },
                { name: '白血球(WBC)', required: screeningIncludes(['2', '3']), maxLength: 5, pattern: /^\d{1,2}(?:\.\d{1,2})?$/, patternMessage: '最多 2 位整數及 2 位小數' },
                { name: '紅血球(RBC)', required: screeningIncludes(['2', '3']), maxLength: 5, pattern: /^\d{1,2}(?:\.\d{1,2})?$/, patternMessage: '最多 2 位整數及 2 位小數' },
                { name: '血小板(Plt)', required: screeningIncludes(['2', '3']), maxLength: 4, pattern: /^\d{1,4}$/, patternMessage: '必須為整數' },
                { name: '血球容積比(Hct)', required: screeningIncludes(['2', '3']), maxLength: 4, pattern: /^\d{1,2}(?:\.\d)?$/, patternMessage: '最多 2 位整數及 1 位小數' },
                { name: '平均紅血球體積(MCV)', required: screeningIncludes(['2', '3']), maxLength: 5, pattern: /^\d{1,3}(?:\.\d{1,2})?$/, patternMessage: '必須為數值' },
                { name: '血色素(Hb)', required: screeningIncludes(['2', '3']), maxLength: 4, pattern: /^\d{1,2}(?:\.\d)?$/, patternMessage: '最多 2 位整數及 1 位小數' },
                { name: '第2次貧血檢驗結果', required: screeningIncludes(['2', '3']), maxLength: 1, values: ['0', '1'] },
                { name: 'CountryRemark', required: true, maxLength: 1, values: ['1', '2', '3'] }
            ]);
            return common.validateSchema(data, schema, { validateRow: common.contactRequired });
        }
    };
})(window);
