var AutoLoader = Class.create();
AutoLoader.prototype = {
    initialize: function () {
    },

    checkAttachedTemplates: function (sysID, tableName, templateName, format) {
        //check if the attached file has the correct extension, format and name
        var count = 0;
        var excelFormatIdx = 0;
        var fileNameIdx = -1;
        var templateCheckIdx = -1;
        /*
        var sysAttachGr = new GlideRecord('sys_attachment');
        sysAttachGr.addQuery('table_name', tableName);
        sysAttachGr.addQuery('table_sys_id', sysID);
        sysAttachGr.query();
        while (sysAttachGr.next()) {
            count = count + 1;
            if (count > 1) {
                return "You can only attach one " + format + " template file";
            }
            if (format == 'Excel') {
                fileNameIdx = (sysAttachGr.getValue('file_name') || '').indexOf('xls');
                excelFormatIdx = (sysAttachGr.getValue('file_name') || '').indexOf('xlsx');
            } else if (format == 'CSV') {
                fileNameIdx = (sysAttachGr.getValue('file_name') || '').indexOf('csv');
            }
            templateCheckIdx = (sysAttachGr.getValue('file_name') || '').indexOf(templateName);
        }
        if (count == 0) {
            return "Please attach the " + format + " template file";
        }
        */
        var sysAttachData = this._getData('sys_attachment', 'file_name', 'table_name=' + tableName + '^table_sys_id=' + sysID);
        if (!sysAttachData.length || sysAttachData.length > 1) {
            return "You can only attach one " + format + " template file";
        }
        if (format == 'Excel') {
            fileNameIdx = (sysAttachData[0].file_name).indexOf('xls');
            excelFormatIdx = (sysAttachData[0].file_name).indexOf('xlsx');
        } else if (format == 'CSV') {
            fileNameIdx = (sysAttachData[0].file_name).indexOf('csv');
        }
        templateCheckIdx = (sysAttachData[0].file_name).indexOf(templateName);
        if (fileNameIdx == -1) {
            return "Please attach the " + format + " template file";
        }
        if (format == 'Excel' && excelFormatIdx != -1) {
            return "You must attach an Excel template file of the correct version 97-2003 (xls extension)";
        }
        if (templateCheckIdx == -1) {
            return "Please attach the " + format + " template file with the name [" + templateName + "]";
        }
        return 'valid';
    },
    load: function (importer, table, id, clean) {
        try {
            //called from the catalog item to load the data, transform it and send an exeption report to the user
            //create the data source
            var sourceData = this._getSourceConfig(importer);
            var sourceID = this._createSource(sourceData);
            this._copyAttachment(sourceID, table, id);
            //Load the data into an import set and Run the transform map(s)
            var cleanUp = (typeof clean == 'boolean') ? clean : true;
            return this._loadAndTransform(sourceID, importer, cleanUp);
        } catch (ex) {
            gs.error(ex);
        }
    },
    _getSourceConfig: function _getSourceConfig(importer) {
        //create a data source based on the selected category and copy the attachment 
        //retrieve the variables based on the selected Category
        var sourceValue = this._getImporterValue(importer);
        var dataSource = {};
        dataSource.name = 'IMP: ' + sourceValue('u_name') + ' - ' + gs.nowDateTime();
        dataSource.import_set_table_name = sourceValue('u_import_table_name', true);
        dataSource.import_set_table_label = 'IMP Load Data: ' + sourceValue('u_name') + ' - ' + gs.nowDateTime();
        dataSource.type = sourceValue('u_data_source_type');
        dataSource.format = sourceValue('u_format');
        dataSource.file_retrieval_method = sourceValue('u_file_retrival_method');
        dataSource.zipped = sourceValue('u_zipped');
        if (dataSource.format == 'Excel') {
            dataSource.sheet_number = sourceValue('u_sheet_number');
            dataSource.header_row = sourceValue('u_header_row');
        } else if (dataSource.format == 'CSV') {
            dataSource.delimiter = sourceValue('u_csv_delimiter');
        }
        if (sourceValue('u_file_retrival_method') == 'File') {
            dataSource.file_path = sourceValue('u_file_path');
        }
        return dataSource;
    },
    _createSource: function _createSource(sourceData) {
        //crreate the data source record
        return this._insertRecord('sys_data_source', sourceData);
        // var dataSourceGr = new GlideRecord('sys_data_source');
        // dataSourceGr.initialize();
        // var fields = Object.keys(sourceData);
        // for (iField in fields) {
        //     dataSourceGr.setValue(fields[iField], sourceData[fields[iField]]);
        // }
        // return dataSourceGr.insert();
    },
    _copyAttachment: function _copyAttachment(newDataSource, table, id) {
        //copy the import sheet from the catalog item to the data source
        GlideSysAttachment.copy(table, id, 'sys_data_source', newDataSource); //copy attachment from the catalog item to the dataSource
    },
    _loadAndTransform: function _loadAndTransform(sourceID, importer, cleanup) {
        //Load the data into an import set and transform this based on the related transform map(s) 
        var sourceGr = new GlideRecord('sys_data_source');
        // if we have our data source continue
        if (!sourceGr.get(sourceID)) {
            throw 'Did not find Data Source ' + sourceID;
        }

        //create the import set and load this with the data from the data source
        var loader = new GlideImportSetLoader();
        var importSetGr = loader.getImportSetGr(sourceGr);
        var importSetID = importSetGr.getUniqueValue();
        gs.info('Loading Import Set ' + importSetID);
        var ranload = loader.loadImportSetTable(importSetGr, sourceGr);
        if (!ranload) {
            throw 'Failed to load import set ' + importSetID;
        }

        //Running Transfom map(s) of the related import set
        var mapName = 'IMP Load Data: ' + importer;
        gs.info('Running Transform map ' + mapName);
        var importSetRun = new GlideImportSetRun(importSetID);
        var importLog = new GlideImportLog(importSetRun, mapName);
        var imstTransformer = new GlideImportSetTransformer();
        imstTransformer.setLogger(importLog);
        imstTransformer.setImportSetRun(importSetRun);
        imstTransformer.setSyncImport(true);
        imstTransformer.transformAllMaps(importSetGr);

        if (cleanup) {
            gs.eventQueue('autoloader.cleanup.importset', importSetGr, importSetGr.getValue('table_name'), '');
        }
        return importSetID;
    },
    importSetCleaner: function importSetCleaner(tableName, cleanMap) {
        //Clean up Import will not be used, otherwise it's not possible to send the exception report
        cleanMap = (typeof cleanMap == 'boolean') ? cleanMap : true;
        var cleaner = new ImportSetCleaner(tableName);
        cleaner.setDataOnly(true);
        cleaner.setDeleteMaps(cleanMap);
        cleaner.clean();
    },
    sendExceptionReport: function sendExceptionReport(inRequestedFor, importer, inReportResults, inEmailTo, inImportSet) {
        //called from the catalog item to send the exception report results of the upload of assets
        gs.debug('Start report for importset: ' + inImportSet);
        //add the group mail address to receive the report (if not empty)
        /*
        var sTable = autoUploaderGr.u_import_table.name;
        var sFields = autoUploaderGr.u_field_list;
        var sOrder = autoUploaderGr.u_sort_by_list;
        var sTitle = autoUploaderGr.u_report_title + ' - ' + gs.nowDateTime();
        var sSubject = autoUploaderGr.u_email_subject + ' - ' + gs.nowDateTime();
        var sCondition = oldCondition.replace('#@#importset#@#', inImportSet);
        var sBody = String(autoUploaderGr.getValue('u_email_body')).replace('#@#user#@#', sUserName);
        */
        var reportData = this._getReportData(importer, inReportResults, inImportSet, inRequestedFor);
        var reportScheduleData = this._getReportScheduleData(importer);
        //this._sendReport(sTitle, sTable, sFields, sCondition, sOrder, sEmails, sSubject, sBody, inRequestedFor);
        this._sendReport(reportData, reportScheduleData);
    },
    _getReportData: function _getReportData(importer, inReportResults, inImportSet, inRequestedFor) {
        var sourceValue = this._getImporterValue(importer);
        var errorCondition = '^sys_row_error' + ((inReportResults == 'only_errors') ? 'ISNOTEMPTY' : 'ANYTHING');
        var conCondition = (!sourceValue('u_conditions') || sourceValue('u_conditions') == 'null') ? '' : '^' + sourceValue('u_conditions');
        var oldCondition = sourceValue('u_condition_list') + conCondition + errorCondition + '^EQ^ORDERBY' + sourceValue('u_sort_by_list');

        var reportData = {};
        reportData.field_list = sourceValue('u_field_list');
        reportData.orderby_list = sourceValue('u_sort_by_list');
        reportData.title = sourceValue('u_report_title') + ' - ' + gs.nowDateTime();
        reportData.table = sourceValue('u_import_table_name');
        reportData.filter = oldCondition.replace('#@#importset#@#', inImportSet);
        reportData.user = inRequestedFor || gs.getUserID();
        reportData.type = 'list';
        reportData.roles = '';
        return reportData;
    },

    _getReportScheduleData: function _getReportScheduleData(importer, inRequestedFor) {
        var sourceValue = this._getImporterValue(importer);
        var userData = this._getData('sys_user', 'name,email', 'sys_id=' + inRequestedFor);
        var sUserName = (userData.length && userData[0].name) ? userData[0].name : '';
        var sEmails = (userData.length && userData[0].email) ? userData[0].email : '';
        sEmails = sEmails + ',' + sourceValue('u_group_email');

        var reportScheduleData = {};
        reportScheduleData.output_type = 'Excel';
        reportScheduleData.run_type = 'once';
        reportScheduleData.report_body = String(sourceValue('u_email_body')).replace('#@#user#@#', sUserName);
        reportScheduleData.address_list = sEmails;
        reportScheduleData.user_list = sEmails;
        reportScheduleData.report_title = sourceValue('u_report_title') + ' - ' + gs.nowDateTime();
        reportScheduleData.u_email_subject = sourceValue('u_email_subject') + ' - ' + gs.nowDateTime();
        return reportScheduleData;
    },
    _getImporterValue: function _getImporterValue(importer) {
        //retrieve variables based on the category to send the exception report to the requested for user
        var autoUploaderGr = this._getRecord('u_autoloader_config', 'u_name=' + importer);
        if (!autoUploaderGr || !autoUploaderGr.next()) {
            throw 'Autoloader configuration record not found for name ' + importer;
        }
        return this._getSourceValue(autoUploaderGr);
    },
    // _sendReport: function _sendReport(sTitle, sTable, sFields, sCondition, sOrder, inRequestedFor, sEmails, sSubject, sBody) {
    _sendReport: function _sendReport(reportData, scheduleData) {
        //create the report and execute this direct
        // var reportID = this._createListReport(sTitle, sTable, sFields, sCondition, sOrder, inRequestedFor);
        var reportID = this._createListReport(reportData);
        // var scheduleID = this._scheduleReport(reportID, sEmails, sSubject, sBody);
        var scheduleID = this._scheduleReport(scheduleData);
        gs.eventQueue('autoloader.cleanup.report', null, reportID, scheduleID);
    },
    reportCleanUp: function reportCleanUp(reportID, scheduleID) {
        this.deleteReport(reportID + '');     //deletion is too fast; report will not be sent.
        this.deleteSchedule(scheduleID + ''); //deletion is too fast; report will not be sent.
    },
    // _createListReport: function (sTitle, sTable, sFields, sCondition, sOrder, inRequestedFor) {
    _createListReport: function (reportFieldValueObj) {
        //create a list report based on the input variables
        // var grRpt = new GlideRecord('sys_report');
        // grRpt.initialize();
        // grRpt.field_list   = sFields;
        // grRpt.orderby_list = sOrder;
        // grRpt.title  = sTitle;
        // grRpt.table  = sTable;
        // grRpt.filter = sCondition;
        // grRpt.user   = inRequestedFor || gs.getUserID();
        // grRpt.type   = 'list';
        // grRpt.roles  = '';
        // var rptID    = grRpt.insert();

        return this._insertRecord('sys_report', reportFieldValueObj);
    },
    // _scheduleReport: function (sRptID, sEmails, sSubject, sBody) {
    _scheduleReport: function (autoReportFieldValueObj) {
        //execute this report direct and send the results to the related users/groups with the report subject and body text
        // var userID = sEmails;
        // var grSchRpt = new GlideRecord('sysauto_report');
        // grSchRpt.initialize();
        // grSchRpt.name         = 'Auto Sending of ' + grSchRpt.report.title;
        // grSchRpt.output_type  = 'Excel';
        // grSchRpt.run_type     = 'once';
        // grSchRpt.address_list = sEmails;
        // grSchRpt.report_title = sSubject;
        // grSchRpt.report_body  = sBody;
        // grSchRpt.user_list    = userID;
        // grSchRpt.report       = sRptID;
        // var schRptID = grSchRpt.insert(); // since it is a "once" schedule, it will be executed right away.

        return this._insertRecord('sysauto_report', autoReportFieldValueObj);
    },
    // not used otherwise this will not send the report via email to the users/groups
    deleteReport: function (reportID) {
        return this._deleteRecord('sys_report', reportID);
    },
    deleteSchedule: function (scheduleID) {
        return this._deleteRecord('sysauto_report', scheduleID);
    },
    _mapObject: function _mapObject(prop, fn) {
        this.name = prop;
        this.transformer = fn;
        this.transform = function (gr) {
            if (typeof this.transformer == 'function') {
                return this.transformer(gr, this.name);
            }
            return gr.isValidRecord() && gr.isValidField(this.name) ? gr.getValue(this.name) : '';
        };
    },
    _getData: function _getData(table, dataFields, query) {
        var result = [];
        var fields = Array.isArray(dataFields) ? dataFields : String(dataFields).split(',');
        var grTable = this._getRecord(table, query);
        if (!grTable) return [];
        while (grTable.next()) {
            result.push(this._grToObj(grTable, fields));
        }
        return result;
    },
    _grToObj: function _grToObj(grTable, fields) {
        var data = {};
        if (!grTable.isValidRecord()) {
            return data;
        }
        for (index in fields) {
            var field = fields[index];
            data[field] = grTable.isValidField(field) ? String(grTable.getElement(field) || '') : '';
        }
        return data;
    },
    _getSourceValue: function _getSourceValue(source) {
        return function (field, disVal) {
            return disVal ? source.getDisplayValue(field) + '' : source.getValue(field) || '';
        };
    },
    _getRecord: function _getRecord(table, query) {
        var glideRecord = new GlideRecord(table);
        if (!glideRecord.isValid()) {
            gs.error('Invalid table ' + table);
            throw 'A fattle error has occured. Please check the system logs.';
        }
        glideRecord.addEncodedQuery(query);
        glideRecord.query();
        if (!glideRecord.hasNext()) {
            return false;
        }
        return glideRecord;
    },
    _deleteRecord: function (tableName, recordID) {
        var deleteGr = new GlideRecord(tableName);
        if (deleteGr.get(recordID)) {
            deleteGr.deleteRecord();
            return true;
        }
        gs.debug('No record to delete for table ' + tableName + ' and id ' + recordID);
        return false;
    },
    _insertRecord: function _insertRecord(tableName, fieldValueObj) {
        var tableGr = new GlideRecord(tableName);
        if (!tableGr.isValid()) {
            throw 'Invalid table name specified ' + tableName;
        }
        tableGr.initialize();
        for (field in fieldValueObj) {
            if (!tableGr.isValidField(field)) {
                gs.debug('Invalid field ' + field + ' for table ' + tableName);
                continue;
            }
            tableGr[field] = fieldValueObj[tableGr];
        }
        gs.debug('Inserting into table ' + tableName + ' with data \n' + JSON.stringify(fieldValueObj));
        var insertID = tableGr.insert();
        var lastErrMsg = insertID.getLastErrorMessage();
        if (lastErrMsg) {
            gs.error(lastErrMsg);
        }
        return insertID + '';
    },
    type: 'AutoLoader'
};
