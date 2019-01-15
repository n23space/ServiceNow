function getGR(table){
  return function(query, fn){
     var gr = new GlideRecord(table);
     gr.addEncodedQuery(query);
     if(fn) gr = fn(gr);
     gr.query();
     gr.next();
     return gr;
  };
}
