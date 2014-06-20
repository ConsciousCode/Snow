/**
 * A Snow tagset which encodes JS objects.
**/
snow.json=(function(){
	var tagset=snow.Tagset({
		"number":snow.Tagdef([
				"value"
			],function(name,attrs,extra){
				if(/\d*\.\d+|\d+\.\d*/.test(attrs.value)){
					return parseFloat(attrs.value);
				}
				return parseInt(attrs.value);
			}
		),
		"function":snow.Tagdef([
				"value"
			],function(name,attrs,extra){
				return eval(attrs.value);
			}
		),
		"array":snow.Tagdef([],
			function(name,attrs,extra){
				//Empty arrays need special-case handling or they'll be interpreted as ignoring the value.
				if(extra.length==0){
					return [[]];
				}
				return [extra];
			}
		),
		"object":snow.Tagdef([],
			function(name,attrs,extra){
				return [attrs];
			}
		),
		"true":function(){return [true];},
		"false":function(){return [false];},
		"nan":function(){return [NaN];},
		"null":function(){return [null];},
		"undefined":function(){return [undefined];},
	});
	
	function stringify(x){
		if(typeof x=="string"){
			if(x.match(/^[^\s\x00-\x1f{}\[\]:"']+$/g)){
				return x;
			}
			
			if(x.match(/'/).length>x.match(/"/)){
				return '"'+x.replace("'","\\'")+'"';
			}
			return "'"+x.replace('"','\\"')+"'";
		}
		else if(typeof x=="number"){
			return "{number "+x+"}";
		}
		else if(typeof x=="function"){
			return "{function ["+x.replace("{","\\{")+"]}";
		}
		else if(x!=x){
			return "{nan}";
		}
		else if([true,false,null,undefined].indexOf(x)!=-1){
			return "{"+x+"}";
		}
		else if(Array.isArray(x)){
			for(var i=0;i<x.length;++i){
				x[i]=stringify(x[i]);
			}
			
			return "{array "+x.join(" ")+"}";
		}
		else if(typeof x=="object"){
			var v=[];
			
			for(var kw in x){
				v.push(stringify(kw)+":"+stringify(x[kw]));
			}
			
			return "{object "+v.join(" ")+"}";
		}
		
		throw new Error('Unknown object type "'+typeof x+'"');
	}
	
	return {
		tagset:tagset,
		parse:function(s){
			return snow.parse(s,tagset);
		},
		stringify:stringify
	};
})();