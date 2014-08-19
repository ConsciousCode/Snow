//Try to include the snow script if possible
if(typeof require=="function"){
	try{
		//Don't set snow until we're sure it imported correctly
		var lib=require("snow");
		if(typeof lib=="object"){
			var snow=lib;
		}
	}
	catch(e){}
}

(function(root){
	var reserved=["abstract", "arguments", "boolean", "break", "byte", "case", "catch", "char", "class", "const", "continue", "debugger", "default", "delete", "do", "double", "else", "enum", "eval", "export", "extends", "false", "final", "finally", "float", "for", "function", "goto", "if", "implements", "import", "in", "instanceof", "int", "interface", "let", "long", "native", "new", "null", "package", "private", "protected", "public", "return", "short", "static", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "true", "try", "typeof", "var", "void", "volatile", "while", "with", "yield"];
	
	if(typeof process=="undefined" ||
			typeof process!="undefined" &&
			typeof process.nextTick=="undefined"){
		function nextTick(f){
			return f();
		}
	}
	else{
		var nextTick=process.nextTick;
	}
	
	function json(){}
	json.prototype.constructor=json;
	
	function Tagdef(f,ig){
		if(ig!==false){
			ig=ig||[];
		}
		
		var td=snow.Tagdef();
		td.build=ig?function(v,data){
			var res=f(v,data),keys=v.keys,vals=v.vals,i=keys.length;
			
			//Add in explicit named data.
			while(i--){
				var key=keys[i];
				if(ig.indexOf(key)<0){
					res[build(key,data).toString()]=build(vals[i],data);
				}
			}
			
			return res;
		}:f;
		
		return td;
	}
	
	var tags=json.prototype.tags={
		"number":Tagdef(
			function(v){
				var val=v.get(1);
				if(/\d*\.\d+|\d+\.\d*/.test(val)){
					return parseFloat(val);
				}
				return parseInt(val);
			}
		),
		"function":Tagdef(
			function(v){
				var name=v.get("name")||"";
				//Sanitize function name.
				if(!/[a-z_$][a-z\d_$]+/gi.test(name) &&
						reserved.indexOf(name)>=0){
					name="";
				}
				
				var args=v.get("arguments");
				if(args){
					args=build(args,data);
					if(typeof args=="string"){
						if(/[a-z_$][a-z\d_$]+/gi.test(name) ||
								reserved.indexOf(name)<0){
							args=[args];
						}
						else{
							args=[];
						}
					}
					else if(!Array.isArray(args)){
						args=[];
					}
				}
				else{
					args=[];
				}
				
				var f=new Function(
					//Rename the function
					"return function "+name+"("+args.join(",")+"){"+
						//datact the function body (avoiding auto-executing
						//potentially dangerous code)
						/^function\s+\(\)\s*\{(.+?)\}$/g.exec(
							new Function(
								v.get(1)||""
							).toString()
						)[1]+
					"}"
				)();
				
				data.refs.push(f);
				
				return f;
			},["name","arguments"]
		),
		"array":Tagdef(
			function(v,data){
				var res=[],pos=v.pos,pl=pos.length;
				data.refs.push(res);
				
				for(var i=1;i<pl;++i){
					res.push(build(v.get(i),data));
				}
				
				return res;
			},["length"]
		),
		"object":Tagdef(function(v){
			var r={};
			return r;
		}),
		"ref":Tagdef(
			function(v,data){
				return data.refs[parseInt(v.get(1))]||null;
			}
		),
		"date":Tagdef(
			function(v){
				return new Date(parseInt(v.get(1))||0);
			}
		),
		"regex":Tagdef(
			function(v){
				var r=new RegExp(v.get(1),v.get(2));
				r.lastIndex=parseInt(v.get("lastIndex"))||0;
				
				return r;
			},["source","lastIndex"]
		),
		"html":Tagdef(
			function(v,data){
				var e=document.createElement(v.get(1)||"div");
				
				var attr,it=v.iter();
				while(!(attr=it.next()).done){
					e.setAttribute(build(attr.name,data).toString(),
						build(attr.value,data).toString());
				}
				
				var content=v.get(2)||[];
				if(Array.isArray(content)){
					var cl=content.length;
					for(var i=0;i<cl;++i){
						var x=content[i];
						if(typeof x=="string"){
							e.appendChild(document.createTextNode(x));
						}
						else if(x.get(0)=="html"){
							e.appendChild(build(x,data));
						}
						else{
							e.appendChild(document.createTextNode(
								build(x,data).toString())
							);
						}
					}
				}
				else if(typeof content=="string"){
					e.appendChild(document.createTextNode(content));
				}
				else if(content.get(0)=="html"){
					e.appendChild(build(content,data));
				}
				else{
					e.appendChild(document.createTextNode(
						build(content,data).toString())
					);
				}
				
				return e;
			},false
		),
		//Constants
		"true":Tagdef(function(){return true;}),
		"false":Tagdef(function(){return false;}),
		"null":Tagdef(function(){return null;}),
		"undef":Tagdef(function(){return undefined;}),
		"inf":Tagdef(function(){return Infinity;}),
		"nan":Tagdef(function(){return NaN;})
	};
	
	var build=json.prototype.build=function build(x,data){
		if(typeof x=="undefined" || typeof x=="string"){
			return x;
		}
		else if(Array.isArray(x)){
			var v=[],len=x.length;
			for(var i=0;i<len;++i){
				v.push(build(x[i],data));
			}
			return v;
		}
		else if(x instanceof snow.Tag){
			var tag=tags[x.get(0)];
			if(tag){
				return tag.build(x,data);
			}
			return null;
		}
		
		throw new Error("Object is not a Snow object: "+x);
	}
	
	var stringify=json.prototype.stringify=function(x,callback){
		function stringify(x,refs){
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
				return snow.stringify(x);
			}
			else if(typeof x=="number"){
				return "{number "+x+"}";
			}
			else if(typeof x=="function"){
				var name=x.name?" name:"+x.name:"";
				var args=/^function\s*[^\s]*\s*\((.*?)\)/.
					exec(x.toString())[1].trim().split(/,\s*/);
				
				if(args.length==0 || args.length==1 && args[0]==""){
					args="";
				}
				else if(args.length==1){
					args=" arguments:"+stringify(args[0]);
				}
				else{
					args=" arguments:"+stringify(args);
				}
				
				var code=/^function\s*[^\s]*\s*\([^()]*\)\s*\{(.*?)\}$/gm.exec(
					x.toString()
				)[1];
				
				return "{function"+name+args+" "+stringify(code)+"]}";
			}
			//Common special data types
			else if(x instanceof Date){
				return "{date "+x.getTime()+"}";
			}
			else if(x instanceof RegExp){
				var flags=(x.ignorecase?"i":"")+(x.global?"g":"")+(x.multiline?"m":"");
				return "{regex "+stringify(x.source)+(flags?" "+flags:"")+"}";
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
				
				//Add in extra properties
				for(var a in x){
					if(a!="length"){
						v.push(stringify(a,refs)+":"+stringify(x[a],refs));
					}
				}
				
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
			
			throw new Error("Unknown object "+x);
		}
		
		var data=null,err=null;
		try{
			data=stringify(x,[]);
		}
		catch(e){
			err=e;
		}
		
		if(typeof callback=="function"){
			return nextTick(function(){
				return callback(err,data);
			});
		}
		else{
			if(err){
				throw err;
			}
			return data;
		}
	}
	
	json.prototype.minify=function(x,callback){
		function minify(x,refs){
			//Constants and non-container types
			if(["string","number","function"].indexOf(typeof x) ||
					x instanceof Date || x instanceof RegExp ||
					x instanceof HTMLElement){
				return stringify(x);
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
				
				//Add in extra properties
				for(var a in x){
					if(x!="length"){
						v.push(minify(a,tags)+":"+minify(x[a],tags));
					}
				}
				
				//Join array
				var vl=v.length,s="{array";
				for(i=0;i<vl;++i){
					var a=v[i];
					if(/[\]}"'`]$/g.test(s) || /^[\[{"'`]/g.test(a)){
						s+=a;
					}
					else{
						s+=" "+a;
					}
				}
				
				return s+"}";
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
		
		var data=null,err=null;
		try{
			data=minify(x,[]);
		}
		catch(e){
			err=e;
		}
		
		if(typeof callback=="function"){
			return nextTick(function(){
				return callback(err,data);
			});
		}
		else{
			if(err){
				throw err;
			}
			return data;
		}
	}
	
	json.prototype.parse=function parse(s,callback){
		var data=null,err=null;
		try{
			//Because tags are parsed from the inside out, recursive structures aren't available for the {ref} tag, so it must be pre-parsed.
			data=snow.parse(s.trim(),tags);
			if(data.length==1){
				data=data[0];
			}
		}
		catch(e){
			err=e;
		}
		
		if(typeof callback=="function"){
			if(err){
				return nextTick(function(){
					return callback(err,null);
				});
			}
			
			return nextTick(function(){
				try{
					data=build(data,{refs:[]});
				}
				catch(e){
					err=e;
					data=null;
				}
				
				return nextTick(function(){
					return callback(err,data);
				});
			});
		}
		else{
			if(err){
				throw err;
			}
			
			return build(data,{refs:[]});
		}
	}
	
	//Add to the snow object
	if(typeof snow=="undefined"){
		root.snow={};
	}
	var s=root.snow.json=new json;
	
	//Export the object too
	if(typeof exports!="undefined"){
		if(typeof module!="undefined" && module.exports) {
			module.exports=s;
		}
		else{
			exports.snow=s;
		}
	}
})(this);