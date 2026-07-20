(function (global) {
    'use strict';
    const validators = global.PrenatalValidators = global.PrenatalValidators || {};
    validators['ultrasound-second'] = {
        label: '產檢超音波紀錄(第二次)',
        createsDownload: false,
        validate(data) {
            const common = global.PrenatalCommon;
            const schema = common.ultrasoundBaseFields().concat([
                { name: '前置胎盤', required: true, maxLength: 1, values: ['0', '1'] },
                common.decimalField('胎兒頭雙頂骨徑'),
                common.decimalField('胎兒腹圍'),
                common.decimalField('胎兒股骨長度'),
                { name: '羊水量', required: true, maxLength: 1, values: ['1', '2', '3'] },
                { name: 'CountryRemark', required: true, maxLength: 1, values: ['1', '2', '3'] }
            ]);
            return common.validateSchema(data, schema, { validateRow: common.contactRequired });
        }
    };
})(window);
