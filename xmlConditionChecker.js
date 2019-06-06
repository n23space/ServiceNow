var xmlStr = '<one><two>21</two></one>';
var xmlDoc = new XMLDocument2();
xmlDoc.parseXML(xmlStr);

var checker = _conditionChecker(xmlDoc);
checker.andCondition('//two=^2');
var cond = checker.andCondition('//one/two=2.1');
cond.orCondition('21');
checker.andCondition('//two=1$');
gs.info(checker.conditions);
gs.info(checker.check());

function _conditionChecker(xmlDoc) {
    var checker = {};
    checker.conditions = [];
    checker.andCondition = function (node, query) {
        checker.conditions.push(node + '' + ((!query) ? '' : query));
        return {
            orCondition: getOrHandler(checker.conditions.length)
        };
    };
    checker.check = function () {
        return checker.conditions.every(checkConditions);
    };
    function checkConditions(condition) {
        gs.info(condition);
        if (!condition || condition == '') return true;
        if (Array.isArray(condition)){
            return condition.some(checkConditions);
        }
        var parts = condition.split('=');
        var name = parts[0];
        gs.info(name);
        var query = parts.length > 0 ? parts[1] : '';
        var node = xmlDoc.getFirstNode(name);
        if (!node) return false;
        if (!query || query == '') return true;
        var regExOnlyAlphaNum = /^[a-z0-9]+$/i;
        var regEx = (regExOnlyAlphaNum.test(query)) ? new RegExp('^' + query + '$') : new RegExp(query);
        gs.info('regex for ' + query + ' => ' + regEx);
        if (regEx.test(node.getTextContent())) {
            return true;
        } else {
            return false;
        }
    }
    function getOrHandler(index){
        return function(condition){
            var currConditions = (checker.conditions[index-1] +'').split(',');
            currConditions.push(condition);
            checker.conditions[index - 1] = currConditions;
            return {
                orCondition: getOrHandler(index)
            };
        }
    }
    return checker;
}
