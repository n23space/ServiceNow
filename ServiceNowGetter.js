var test = { 
    val: 1,
    newVal: { 
       val: 1, 
       disVal: 'One'
    }
};
Object.defineProperty(test, 'new', {
  get: function() { 
       return this.val ?  this.newVal : this.newVal.val; 
  }
});
test.val = 0;
gs.info(JSON.stringify(test));
gs.info(test['new']);
test.val = 1;
gs.info(JSON.stringify(test['new']));
gs.info(test['new'].disVal);
