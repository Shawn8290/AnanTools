(function (global) {
    'use strict';
    const validators = global.PrenatalValidators = global.PrenatalValidators || {};
    validators['ultrasound-first'] = {
        label: '產檢超音波紀錄(第一次)',
        createsDownload: false,
        validate(data) {
            const common = global.PrenatalCommon;
            const schema = common.ultrasoundBaseFields().concat([
                { name: '著床位置', required: true, maxLength: 1, values: ['0', '1'] },
                common.decimalField('胎兒頭臀長'),
                { name: 'CountryRemark', required: true, maxLength: 1, values: ['1', '2', '3'] }
            ]);
            return common.validateSchema(data, schema, { validateRow: common.contactRequired });
        }
    };
})(window);
