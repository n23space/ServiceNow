var gaCatGroup = new GlideAggregate('sc_cat_item_group_mtom');
gaCatGroup.addAggregate('COUNT');
gaCatGroup.groupBy('sc_cat_item');
gaCatGroup.groupBy('sc_avail_group');
gaCatGroup.query();

var totalCount = gaCatGroup.getRowCount();
var count = 0;

while (gaCatGroup.next()) {
    if (gaCatGroup.getAggregate('COUNT') > 1 ) {
        count = count + deleteOneOfRecords(gaCatGroup.getAggregateEncodedQuery('COUNT'));
    }
}

gs.info('Total memberships is '+ totalCount + '. Number of duplicates removed is ' + count);

function deleteOneOfRecords(query){
    var grCatGroup = new GlideRecord('sc_cat_item_group_mtom');
    grCatGroup.addEncodedQuery(query);
    grCatGroup.orderBy('sys_created_on');
    grCatGroup.query();
    var count = grCatGroup.getRowCount();
    
    //return if there is no duplicate
    if (count < 2)   return;
    
    //skip first (older one)
    grCatGroup.next();
    
    //delete the rest
    while(grCatGroup.next()){
       //gr.deleteRecord();
    }
    return count - 1;
}
