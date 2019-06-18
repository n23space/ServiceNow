function templating(str, obj){
		if (!str) return;
		if (!obj) return str;
		if (typeof str != 'string' || typeof obj != 'object') return str;
		
		var regex = /(?:\$\{)(.+?)(?:\})/g;
		return str.replace(regex, replceTemp);
		function replceTemp(rap, key, pos, fulstr){
			if (!key) return rap;
			if (obj && obj.hasOwnProperty(key)){
				return obj[key];
			}
			return rap;
		}
	}
