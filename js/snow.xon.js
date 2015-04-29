var xon=(function(snow){
	'use strict';
	
	if(typeof snow!="object"){
		if(typeof require=="function"){
			snow=require("snow");
		}
		else{
			throw new Error("snow.json depends on snow");
		}
	}
	
	function XONError(msg,line,col){
		if(!(this instanceof XONError)){
			return new XONError(msg,line,col);
		}
		
		var err=Error.call(this,msg+" (Ln: "+line+" Col: "+col+")");
		var stack=err.stack;
		
		Object.defineProperty(this,"stack",{
			get:function(){
				return stack;
			}
		});
		
		this.message=err.message;
		this.line=line;
		this.col=col;
	}
	XONError.prototype=Object.create(Error.prototype);
	XONError.prototype.constructor=XONError;
	XONError.prototype.name="XONError";
	
	var COMMENT={};
	
	//Use to simplify extended properties on objects
	function build_properties(obj,tag,data){
		var keys=tag.keys,vals=tag.vals,kl=keys.length;
		while(kl--){
			var k=keys[kl];
			if(k instanceof snow.Text){
				var x=vals[kl].visit(this,data);
				if(x!==COMMENT){
					obj[k.value]=x;
				}
			}
			else{
				throw new XONError(
					"Object keys must be textual",k.line,k.col
				);
			}
		}
		
		return obj;
	}
	
	var tags={
		//meta
		"/":function build_comment(tag,data){
			return COMMENT;
		},
		"@":function build_ref(tag,data){
			var value=tag.get("value");
			if(typeof value=="undefined"){
				throw new XONError(
					"References must have a value",tag.line,tag.col
				);
			}
			if(!(value instanceof snow.Text)){
				throw new XONError(
					"Reference values must be textual",value.line,value.col
				);
			}
			
			if(!/^\d+/.test(value.value)){
				throw new XONError(
					"Reference values must be integers",value.line,value.col
				);
			}
			
			var x=parseInt(value.value);
			if(x>=data.memo.length){
				throw new XONError(
					"Referenced non-existent object #"+value.value,
					tag.line,tag.col
				);
			}
			
			return data.memo[x];
		},
		"?":function build_unknown(tag,data){
			return data.build.call(this,tag,data);
		},
		//fundamental types
		"#":function build_number(tag,data){
			var value=tag.get("value");
			if(typeof value=="undefined"){
				throw new XONError(
					"Numbers require a value",tag.line,tag.col
				);
			}
			
			if(value instanceof snow.Text){
				var n=parseFloat(value.value,10);
				if(n!=n){
					throw new XONError(
						"Number values must be numeric",tag.line,tag.col
					);
				}
				return n;
			}
			
			throw new XONError(
				"Number values must be textual",value.line,value.col
			);
		},
		//aggregates
		"%":function build_object(tag,data){
			var obj={};
			data.memo.push(obj);
			return build_properties.call(this,obj,tag,data);
		},
		",":function build_array(tag,data){
			var arr=[],pos=tag.pos,pl=pos.length;
			data.memo.push(arr);
			for(var i=1;i<pl;++i){
				var x=pos[i].visit(this,data);
				if(x!==COMMENT){
					arr.push(x);
				}
			}
			
			//Some arrays have custom properties
			return build_properties.call(this,arr,tag,data);
		},
		//non-fundamental built in types
		".":function build_regex(tag,data){
			var pattern=tag.get("pattern");
			if(typeof pattern=="undefined"){
				throw new XONError(
					"Regexes must have a pattern",tag.line,tag.col
				);
			}
			if(!(pattern instanceof snow.Text)){
				throw new XONError(
					"Regex patterns must be textual",tag.line,tag.col
				);
			}
			
			var mode=tag.get("mode");
			if(typeof mode=="undefined"){
				mode="";
			}
			else if(mode instanceof snow.Text){
				mode=mode.value;
			}
			else{
				throw new XONError(
					"Regex modes must be textual",tag.line,tag.col
				);
			}
			
			var r=new RegExp(pattern.value,mode);
			data.memo_objects(x);
			data.memo_results(r);
			return build_properties.call(this,r,tag,data);
		},
		//literals
		"":function build_undefined(){
			return;
		},
		"true":function build_true(){
			return true;
		},
		"false":function build_false(){
			return false;
		},
		"null":function build_null(){
			return null;
		},
		"inf":function build_inf(){
			return Infinity;
		},
		"-inf":function build_inf(){
			return -Infinity;
		},
		"nan":function build_nan(){
			return NaN;
		}
	};
	
	function parse(text,data){
		if(typeof data=="undefined"){
			data={};
		}
		
		data={
			memo:data.memo||[],
			build:data.build||function(tag,data){
				throw new XONError(
					"No meaning has been provided for ? tags",
					tag.line,tag.col
				);
			}
		};
		
		return snow.parse(text,function(keys,vals,pos,l,c){
			function nameorpos(keys,vals,pos,key){
				var v=snow.index(keys,key);
				if(v===null){
					if(pos.length>1){
						keys.push(key);
						vals.push(pos.splice(1,1)[0]);
					}
				}
			}
			
			var name=pos[0];
			if(typeof name=="undefined"){
				pos.push(name=new snow.Text(""));
			}
			else if(!(name instanceof snow.Text)){
				throw new XONError("Unknown tag",l,c);
			}
			
			var nv=name.value;
			if(!(nv in tags) && nv.length>1){
				pos.push(new snow.Text(nv.slice(1)));
				nv=name.value=nv[0];
			}
			
			if(nv=="#" || nv=="@"){
				nameorpos(keys,vals,pos,new snow.Text("value"));
			}
			else if(nv=="."){
				nameorpos(keys,vals,pos,new snow.Text("pattern"));
				nameorpos(keys,vals,pos,new snow.Text("mode"));
			}
			
			if(!(nv in tags)){
				throw new XONError("Unknown tag",l,c);
			}
			
			return new snow.Tag(keys,vals,pos,l,c);
		}).visit({
			visit_doc:function parse_doc(doc,data){
				var dv=doc.value;
				if(doc.value.length>1){
					//Tag is guaranteed to be in the first two slots
					var i=2;
					while(i--){
						var x=dv[i];
						if(x instanceof snow.Tag){
							return this.visit_tag(x,data);
						}
					}
				}
				
				return dv[0].visit(this,data);
			},
			visit_section:function parse_section(sec,data){
				throw new XONError(
					"Sections have no meaning in XON",sec.line,sec.col
				);
			},
			visit_tag:function parse_tag(tag,data){
				var name=tag.get(0);
				if(!(name instanceof snow.Text)){
					throw new XONError("Unknown tag "+name,tag.line,tag.col);
				}
				
				var t=tags[name.value];
				if(typeof t!="function"){
					throw new XONError(
						"Unknown tag "+name.value,tag.line,tag.col
					);
				}
				
				return t.call(this,tag,data);
			},
			visit_text:function parse_text(text){
				return text.value;
			}
		},data);
	}
	
	function count(x,c){
		var i=0,cc=-1;
		do{
			i=x.indexOf(c,i);
			++cc;
			++i;
		}while(i!=0);
		
		return cc;
	}
	
	function isPlain(x){
		return Object.getPrototypeOf(x)==Object.prototype;
	}
	
	function stringify(x,data){
		function stringify(x,data){
			var mx=data.memo.indexOf(x);
			if(mx>=0){
				return "{@ "+mx+"}";
			}
			
			var tx=typeof x;
			
			if(tx=="number"){
				if(x!=x){
					return "{nan}";
				}
				if(x==Infinity){
					return "{inf}";
				}
				if(x==-Infinity){
					return "{-inf}";
				}
				return "{# "+x+"}";
			}
			
			if(tx=="string"){
				if(x.match(/^[^\s{:}\[\]"'`]+$/g)){
					return x;
				}
				
				var m1=count(x,'"'),m2=count(x,"'"),m3=count(x,'1');
				if(m1<=m2 && m1<=m3){
					return '"'+x.replace(/["\\]/g,"\\$&")+'"';
				}
				else if(m2<=m3){
					return "'"+x.replace(/['\\]/g,"\\$&")+"'";
				}
				else{
					return '`'+x.replace(/[`\\]/g,"\\$&")+'`';
				}
			}
			
			if(tx=="boolean"){
				return x?"{true}":"{false}";
			}
			
			if(x===null){
				return "{null}"
			}
			
			if(tx=="undefined"){
				return "{}";
			}
			
			if(x instanceof Array){
				data.memo.push(x);
				return "{, "+x.map(function(v){
					return stringify(v,data);
				}).join(" ")+"}";
			}
			
			if(x instanceof RegExp){
				var mode=(x.global?"g":"")+
					(x.ignoreCase?"i":"")+
					(x.multiline?"m":"");
				data.memo.push(x);
				return "{. "+stringify(x.pattern,data)+(mode?" "+mode:"")+"}";
			}
			
			if(tx=="object" && isPlain(x)){
				data.memo.push(x);
				var values="";
				for(var key in x){
					values+=" "+stringify(key,data)+":"+
						stringify(x[key],data);
				}
				
				return "{%"+values+"}";
			}
			
			return data.extra(x);
		}
		
		data=data||{};
		return stringify(x,{
			memo:data.memo||[],
			extra:data.extra||function(x){
				if(typeof x=="function"){
					throw new TypeError(
						"Cannot serialize a function normally"
					);
				}
				throw new TypeError(
					"Cannot serialize "+typeof x+" "+x+
					" without an extension"
				);
			}
		});
	}
	
	function minify(x,data){
		function minify(x,data){
			var mx=data.memo.indexOf(x);
			if(mx>=0){
				return "{@"+mx+"}";
			}
			
			var tx=typeof x;
			
			if(tx=="number"){
				if(x!=x){
					return "{nan}";
				}
				if(x==Infinity){
					return "{inf}";
				}
				if(x==-Infinity){
					return "{-inf}";
				}
				return "{#"+x+"}";
			}
			
			if(tx=="string"){
				if(x.match(/^[^\s{:}\[\]"'`]+$/g)){
					return x;
				}
				
				var m1=count(x,'"'),m2=count(x,"'"),m3=count(x,'1');
				if(m1<=m2 && m1<=m3){
					return '"'+x.replace(/["\\]/g,"$&")+'"';
				}
				else if(m2<=m3){
					return "'"+x.replace(/['\\]/g,"$&")+"'";
				}
				else{
					return '`'+x.replace(/[`\\]/g,"$&")+'`';
				}
			}
			
			if(tx=="boolean"){
				return x?"{true}":"{false}";
			}
			
			if(x==null){
				return "{null}"
			}
			
			if(tx=="undefined"){
				return "{}";
			}
			
			if(x instanceof Array){
				data.memo.push(x);
				var unq=false,xl=x.length,s="{,";
				for(var i=0;i<xl;++i){
					var v=minify(x[i],data);
					var nunq=!/^["'`{]/.test(v);
					if(unq && nunq){
						s+=" ";
					}
					unq=nunq;
					s+=v;
				}
				
				return s+"}";
			}
			
			if(x instanceof RegExp){
				var mode=(x.global?"g":"")+
					(x.ignoreCase?"i":"")+
					(x.multiline?"m":"");
				
				data.memo.push(x);
				var pattern=minify(x.pattern,data);
				if(/^["'`]/.test(pattern[0])){
					return "{."+pattern+mode+"}";
				}
				return "{. "+pattern+(mode?" "+mode:"")+"}";
			}
			
			//Calculates how good the given position is
			function swap_value(ol,sl,sr,or){
				return (ol!=sl || ol)+(or!=sr || sr);
			}
			
			console.log(tx);
			if(tx=="object" && isPlain(x)){
				data.memo.push(x);
				
				var LEFT=1<<0,RIGHT=1<<1,qr=/^["'`{]/;
				var values=["%"],types=[RIGHT,0];
				for(var key in x){
					var k=minify(key,data),v=minify(x[key],data),t=0;
					if(qr.test(k)){
						t|=LEFT;
					}
					if(qr.test(v)){
						t|=RIGHT;
					}
					values.push(k+":"+v);
					types.push(t);
				}
				types.push(LEFT);
				
				//For each element, look at each other element after it,
				// recording the highest sort value, then swap the two.
				// If none is found, no change.
				var l=values.length,s="{",unq=true;
				for(var i=0;i<l;++i){
					var tl=types[i]&RIGHT,tr=types[i+2]&LEFT,
						tc=types[i+1],swap=null,swapval=swap_value(
							tl,tc&LEFT,tc&RIGHT,tr
						);
					
					for(var j=i+1;j<l;++j){
						var toc=types[j+1],nr=swap_value(
							tl,toc&LEFT,toc&RIGHT,tr
						);
						if(nr>swapval){
							swapval=nr;
							swap=j;
						}
					}
					
					var nunq=!(types[swap+1]&LEFT);
					if(unq && nunq){
						s+=' ';
					}
					unq=nunq;
					
					if(swap===null){
						s+=values[i];
					}
					else{
						s+=values[swap];
						//don't need to move backwards, won't be
						// seen again
						values[swap]=values[i];
						types[swap]=types[i];
					}
				}
				
				return s+"}";
			}
			
			return data.extra(x);
		}
		
		data=data||{};
		return minify(x,{
			memo:data.memo||[],
			extra:data.extra||function default_extra(x){
				if(typeof x=="function"){
					throw new TypeError(
						"Cannot serialize a function normally"
					);
				}
				throw new TypeError(
					"Cannot serialize "+typeof x+" "+x+" without an extension"
				);
			}
		});
	}
	
	return snow.xon={
		XONError:XONError,
		parse:parse,
		stringify:stringify,
		minify:minify
	};
})(snow);

//Node support
if(typeof exports!='undefined'){
	if(typeof module!='undefined' && module.exports) {
		module.exports=xon;
	}
	else{
		exports.xon=xon;
	}
}