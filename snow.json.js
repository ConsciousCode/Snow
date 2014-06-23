/**
 * A Snow tagset which encodes JS objects.
**/
snow.json=(function(){
	function Tagdef(attrs,build){
		return {
			attrs:attrs,
			build:build
		};
	}
	
	var tags={
		"number":Tagdef(["value"],
			function(name,attrs,extra){
				var val=attrs.get("value");
				if(/\d*\.\d+|\d+\.\d*/.test(val)){
					return parseFloat(val);
				}
				return parseInt(val);
			}
		),
		"function":Tagdef(["value"],
			function(name,attrs,extra){
				return eval(attrs.get("value"));
			}
		),
		"array":Tagdef([],
			function(name,attrs,extra,data){
				var v=[],len=extra.length;
				data.refs.push(v);
				for(var i=0;i<len;++i){
					v.push(build(extra[i],data));
				}
				return v;
			}
		),
		"object":Tagdef([],
			function(name,attrs,extra,data){
				//This should only return null if the data is hand written and they intend for a Map.
				var v={};
				data.refs.push(v);
				attrs.each(function(i,x){
					if(typeof i=="string"){
						v[i]=build(x,data);
					}
				});
				return v;
			}
		),
		"ref":Tagdef(["id"],
			function(name,attrs,extra,data){
				return data.refs[parseInt(attrs.get("id"))]||null;
			}
		),
		"date":Tagdef(["xunix"],
			function(name,attrs){
				if(attrs.xunix){
					return new Date(parseInt(attrs.xunix));
				}
				return new Date();
			}
		),
		"regex":Tagdef(["pattern","flags"],
			function(name,attrs){
				var pat=attrs.get("pattern");
				if(pat){
					var flags=attrs.get("flags");
					if(flags){
						return new RegExp(pat,flags);
					}
					return new RegExp(pat);
				}
				return new RegExp();
			}
		),
		"html":Tagdef(["tag","..."],
			function(name,attrs,extra,data){
				var tag=attrs.get("tag");
				if(tag){
					var e=document.createElement(tag);
					
					attrs.each(function(x,v){
						if(x!="tag" && x!="..."){
							e.setAttribute(x,v);
						}
					});
					
					var content=attrs.get("...");
					if(content){
						if(Array.isArray(content)){
							var len=content.length;
							for(var i=0;i<len;++i){
								var v=content[i];
								if(typeof v=="string"){
									e.appendChild(document.createTextNode(v));
								}
								else{
									if(v.name=="html"){
										e.appendChild(build(v,data));
									}
								}
							}
						}
						else if(typeof content=="string"){
							e.appendChild(document.createTextNode(content));
						}
						else{
							if(content.name=="html"){
								e.appendChild(build(content,data));
							}
						}
					}
					
					return e;
				}
				return null;
			}
		),
		//Constants
		"true":function(){return true;},
		"false":function(){return false;},
		"null":function(){return null;},
		"undef":function(){return undefined;},
		"inf":function(){return Infinity;},
		"nan":function(){return NaN;}
	};
	
	var tagset=(function(){
		var ts={};
		for(var x in tags){
			//v.build is used in post-parsing.
			ts[x]=snow.Tagdef(tags[x].attrs);
		}
		return snow.Tagset(ts);
	})();
	
	function build(x,data){
		if(x===undefined){
			return x;
		}
		
		if(typeof x=="string"){
			return x;
		}
		else if(Array.isArray(x)){
			var v=[],len=x.length;
			for(var i=0;i<len;++i){
				v.push(build(x[i],data));
			}
			return v;
		}
		else{
			var tag=tags[x.name];
			if(tag){
				return tag.build(x.name,x.attrs,x.extra,data);
			}
			return null;
		}
	}
	
	function stringify(x,refs){
		//Used to detect recursive structures
		refs=refs||[];
		
		//Constants
		if(x!=x){
			return "{nan}";
		}
		else if([true,false,null,undefined,Infinity].indexOf(x)!=-1){
			if(x===undefined){
				return "{undef}";
			}
			else if(x===Infinity){
				return "{inf}";
			}
			//true false null
			return "{"+x+"}";
		}
		//Primitive non-aggregate types
		else if(typeof x=="string"){
			if(x.match(/^[^\s\x00-\x1f{}\[\]:"']+$/g)){
				return x;
			}
			
			var m1=x.match(/'/)||[],m2=x.match(/"/)||[];
			if(m1.length>m2.length){
				return '"'+x.replace("'","\\'")+'"';
			}
			return "'"+x.replace('"','\\"')+"'";
		}
		else if(typeof x=="number"){
			return "{number "+x+"}";
		}
		else if(typeof x=="function"){
			return "{function ["+x.replace("{","\\{").replace("]","\\]")+"]}";
		}
		//Common special data types
		else if(x instanceof Date){
			return "{date "+x.getTime()+"}";
		}
		else if(x instanceof RegExp){
			var flags=(x.ignorecase?"i":"")+(x.global?"g":"")+(x.multiline?"m":"");
			return "{regex "+x.source+(flags?" "+flags:"")+"}";
		}
		else if(x instanceof HTMLElement){
			var attrs=[];
			var len=x.attributes.length;
			for(var i=0;i<len;++i){
				var a=x.attributes[i];
				attrs.push(stringify(a.name,refs)+":"+stringify(a.value,refs));
			}
			attrs=attrs.join(" ");
			if(attrs){
				attrs=" "+attrs;
			}
			
			var content;
			if(x.childNodes){
				content=[];
				len=x.childNodes.length;
				if(len>1){
					for(var i=0;i<len;++i){
						var n=x.childNodes[i];
						if(n.data){
							//Text nodes
							content.push(n.data.
								replace("{","\\{").
								replace("]","\\]").
								replace(/^\s+|\s+$/gm," ")
							);
						}
						else{
							content.push(stringify(n,refs));
						}
					}
					
					content="["+content.join("")+"]";
				}
				else if(len==1){
					var v=x.childNodes[0];
					content=stringify((v.data?v.data:v),refs);
				}
			}
			else{
				content="";
			}
			
			if(content){
				content=" "+content;
			}
			
			return "{html "+x.tagName.toLowerCase()+attrs+content+"}";
		}
		
		//Check for recursive structures
		var r=refs.indexOf(x);
		if(r>=0){
			return "{ref "+r+"}";
		}
		else{
			refs.push(x);
		}
		
		//Primitive aggregate types
		if(Array.isArray(x)){
			var v=[];
			for(var i=0;i<x.length;++i){
				v.push(stringify(x[i],refs));
			}
			
			return "{array "+v.join(" ")+"}";
		}
		else if(typeof x=="object"){
			var v=[];
			
			for(var kw in x){
				v.push(stringify(kw,refs)+":"+stringify(x[kw],refs));
			}
			
			return "{object "+v.join(" ")+"}";
		}
		
		throw new Error('Unknown object type "'+typeof x+'"');
	}
	
	return {
		tagset:tagset,
		parse:function(s){
			//Because tags are parsed from the inside out, recursive structures aren't available for the {ref} tag, so it must be preparsed.
			var data=snow.parse(s,tagset);
			return build(data,{refs:[]})[0];
		},
		stringify:stringify
	};
})();