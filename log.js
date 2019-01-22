function print(func){
    var logs = [];
    function log(msg){
        logs.push(msg);
        if(logs.length > 9){
            print();
            logs = [];
        }
    }
    function print(){
        func(logs.join('\n'));
    }
    return {
        log,
        end: print
    };
}
