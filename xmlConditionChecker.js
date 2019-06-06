var xmlStr = '<one><two>2</two></one>';
var xmlDoc = new XMLDocument2();
xmlDoc.parseXML(xmlStr);

var checker = _conditionChecker(xmlDoc);
checker.and('//two=2');
checker.and('//one');
checker.and('//two=1');
gs.info(checker.conditions);
gs.info(checker.check());

function _conditionChecker(xmlDoc){
		var checker = {};
		checker.conditions = [];
		checker.and = function(node, query){
			checker.conditions.push(node+''+((!query)? '':query));
		};
		checker.check = function(){
			return checker.conditions.every(checkConditions);
		};
		function checkConditions(condition){
                        gs.info(condition);
			if (!condition || condition == '') return true;
			var parts = condition.split('=');
			var name = parts[0];
                        gs.info(name);
			var query = parts.length > 0 ? parts[1] : '';
			var node = xmlDoc.getFirstNode(name);
			if (!node) return false;
			if (!query || query =='') return true;
			var regExOnlyAlphaNum = /^[a-z0-9]+$/i;
			var regEx = (regExOnlyAlphaNum.test(query)) ? new RegExp('^'+query+'$') : new RegExp(query);
			if (regEx.test(node.getTextContent())){
				return true;
			} else {
				return false;
			}
		}
		return checker;
	}
