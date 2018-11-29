function getExtendedTable(extended_table, tables){
    if(!tables){
        var tables = [];
    }
    tables.push(extended_table);
    var gr = new GlideRecord('sys_db_object');
    gr.addQuery('name', extended_table);
    gr.addQuery('super_class', '!=', '');
    gr.query();
    if (gr.next()){
        tables = getExtendedTable(gr.super_class.name + '', tables);
    }
    return tables;
}
