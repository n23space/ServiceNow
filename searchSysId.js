function findSysID(sys_id) {
    var table_name = [];
    var returnStr = 'Searching for sys_id: ' + sys_id + ' and the result is:\n\n';
    var table = new GlideRecord('sys_db_object');
    table.orderBy('name');
    table.query();
    while (table.next()) {
        var tabName = table.getValue('name');
        var regExp = getRegEx();
        if (tabName != '' && !regExp.test(tabName)) {
            var object = new GlideRecord(table.name);
            if (object.get(sys_id)) {
                table_name.push(table.name.toString());
            }
        }
    }
    if (table_name) {
        return returnStr += 'Found ' + sys_id + ' in table(s): ' + table_name.join(', ') + '.\n Use nav_to.do?uri=' + table_name[0] + '.do?sys_id=' + sys_id;
    }
    else {
        return returnStr += 'Did not find sys_id ' + sys_id + '.';
    }
}
function getRegEx(){
    return new RegExp('^(ts|v_|dis|pa|dsc|ecc|ha_|wf_|win|sys_roll|sysx)');
}
