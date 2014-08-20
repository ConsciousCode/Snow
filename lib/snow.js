/**
 * A highly concise and expressive tag-based generic data representation.
**/
(function(root){
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
	
	function snow(){
		this.tip="Use snow.constructor.prototype to see the available functions.";
	}
	snow.prototype.constructor=snow;
	
	var Tag=snow.prototype.Tag=function Tag(keys,vals,pos){
		this.keys=keys||[];
		this.vals=vals||[];
		this.pos=pos||[];
	}
	Tag.prototype.constructor=Tag;
	
	/**
	 * Apply a function to a retrieved value and return the result.
	 *
	 * @param x The key on which to apply the function.
	 * @param f The callback to call (takes a container object and a key -
	 *  a null key means there was no such value). This context is the Tag.
	 *
	 * This is mostly used as an internal utility function to reduce DRY.
	**/
	Tag.prototype.apply=function apply(x,f){
		if(typeof x=="string"){
			var i=this.keys.indexOf(x);
			return f.call(this,this.vals,i<0?null:i);
		}
		if(typeof x=="number"){
			return f.call(this,this.pos,x);
		}
		if(Array.isArray(x)){
			var keys=this.keys,i=keys.length,xl=x.length;
			//Go through keys to find matches
			while(i--){
				var k=keys[i];
				//Only arrays can match
				if(Array.isArray(k)){
					var j=k.length;
					//If the lengths aren't they same, they aren't equal.
					if(j!=xl){
						return f.call(this,keys,null);
					}
					
					//Compare each item (should only contain text and tags).
					while(j--){
						var v=k[j];
						if(typeof v=="string"){
							if(v!=x[j]){
								return f.call(this,keys,null);
							}
						}
						else{
							//Assume it's a tag (not worth checking)
							if(!v.eq(x[j])){
								return f.call(this,keys,null);
							}
						}
					}
					
					//All elements are the same, they're equal.
					return f.call(this,keys,i);
				}
			}
			
			//No element was found that matched the section.
			return f.call(this,keys,null);
		}
		if(x instanceof Tag){
			var k=this.keys,i=k.length;
			while(i){
				if(x.eq(k[i])){
					return f.call(this,this.vals,i);
				}
				--i;
			}
		}
		return f.call(null,null);
	}
	
	/**
	 * Interpret the first non-name positional attribute as a named attribute
	 *  with the name x.
	 *
	 * @param x The name of the interpretation.
	 *
	 * @returns Whether or not a value could be interpreted.
	**/
	Tag.prototype.interpret=function interpret(x){
		var pos=this.pos;
		if(pos.length>1){
			this.keys.push(x);
			this.vals.push(pos.splice(1,1)[0]);
			
			return true;
		}
		
		return false;
	}
	
	/**
	 * @returns Whether or not the tag is equal to another object.
	**/
	Tag.prototype.eq=function eq(x){
		if(x instanceof Tag){
			var keys=this.keys,kl=keys.length,okeys=x.keys;
			var pos=this.pos,pl=pos.length,opos=x.pos;
			//If the lengths are different, they can't be the same
			if(kl!=okeys.length || pl!=opos.length){
				return false;
			}
			
			//Check the named attributes.
			var vals=this.vals,ovals=x.vals;
			while(kl--){
				//Compare keys
				var k=keys[kl];
				if(k instanceof Tag){
					if(!k.eq(okeys[kl])){
						return false;
					}
				}
				else{
					if(k!=okeys[kl]){
						return false;
					}
				}
				
				//Compare values
				var v=vals[kl];
				if(v instanceof Tag){
					if(!v.eq(ovals[kl])){
						return false;
					}
				}
				else{
					if(v!=ovals[kl]){
						return false;
					}
				}
			}
			
			//Check the positional attributes.
			while(pl--){
				var p=pos[pl];
				if(p instanceof Tag){
					if(!p.eq(opos[kl])){
						return false;
					}
				}
				else{
					if(v!=opos[kl]){
						return false;
					}
				}
			}
			
			//Can finally say it's true.
			return true;
		}
		
		return false;
	}
	
	Tag.prototype.get=function get(x){
		return this.apply(x,function(o,k){
			if(k===null){
				return;
			}
			return o[k];
		});
	}
	
	Tag.prototype.set=function set(x,v){
		return this.apply(x,function(o,k){
			if(k===null){
				if(o){
					this.keys.push(x);
					this.vals.push(v);
					
					return v;
				}
				
				throw new Error(
					"Tags can only store text, sections, and tags."
				);
			}
			return o[k];
		});
	}
	
	Tag.prototype.del=function del(x){
		this.apply(x,function(o,k){
			if(k!==null){
				this.keys.splice(k,1);
				this.vals.splice(k,1);
			}
		});
		
		return true;
	}
	
	Tag.prototype.has=function has(x){
		return this.apply(x,function(o,k){
			return k!==null;
		});
	}
	
	/**
	 * Return an object with a next function for iterating over all named
	 *  attributes.
	**/
	Tag.prototype.iter=function iter(){
		var i=0,keys=this.keys,vals=this.vals,kl=keys.length;
		return {
			next:function next(){
				if(i++<kl){
					return {
						name:keys[i-1],
						value:vals[i-1],
						done:false
					};
				}
				
				return {done:true};
			}
		};
	}
	
	/**
	 * A tag definition.
	 *
	 * @param attrs A list of the names of attributes the tag has. (default: [])
	 * @param build A function that takes a name, named attributes object and a list of extra positional attributes and returns a processed object (or null to ignore it).
	**/
	snow.prototype.Tagdef=function Tagdef(attrn,build){
		attrn=attrn||[];
		build=build||function(tag,extra){
			return tag;
		}
		
		function TagBuilder(tag,extra){
			//Process positional attributes as defined.
			var al=attrn.length;
			for(var i=0;i<al;++i){
				var attr=attrn[i];
				if(!tag.has(attr)){
					tag.interpret(attr);
				}
			}
			
			return build(tag,extra);
		}
		
		TagBuilder.attrs=attrn;
		
		return TagBuilder;
	}
	
	var Text=snow.prototype.Text=function Text(x,q){
		x.quote=q||"";
		return x;
	}
	
	var Section=snow.prototype.Section=function Section(x){
		return x;
	}
	
	var ParseError=snow.prototype.ParseError=
		function ParseError(msg,line,col,extra){
			var err=new Error(msg+" (Ln: "+line+" Col: "+col+")");
			err.line=line;
			err.col=col;
			//Extra is for errors involving particular objects for more info.
			err.extra=extra;
			
			return err;
		}
	
	var Parser=snow.prototype.Parser=function Parser(ts){
		//Parsing
		this.text="";
		if(typeof ts=="undefined"){
			this.ts={
				get:function(){}
			};
		}
		else if(typeof ts.get=="undefined"){
			this.ts={
				get:function(x){
					//x has to be a string for it to match anything in ts.
					if(typeof x!="string"){
						return;
					}
					return ts[x];
				}
			}
		}
		else{
			this.ts=ts;
		}
		this.pos=0;
		
		//Error formatting
		this.line=1;
		this.col=0;
		this.lastrel=0;
	}
	Parser.prototype.constructor=Parser;
	
	//Check if the text at the current position matches the given regex.
	Parser.prototype.peek=function peek(r){
		r.lastIndex=this.pos;
		var m=r.exec(this.text);
		if(m && m.index==this.pos){
			return m;
		}
		return null;
	}
	
	//Increment positioning variables according to the result.
	Parser.prototype.incr=function incr(res){
		var lines=res.split(/\r\n|\n|\r/gm);
		if(lines.length>1){
			this.line+=lines.length-1;
			this.col=lines.slice(-1).length;
		}
		else{
			this.col+=lines[0].length;
		}
		this.pos+=res.length;
	}
	
	//Try to match the regex if possible, else return null
	Parser.prototype.maybe=function maybe(r){
		var m=this.peek(r);
		if(m){
			this.incr(m[0]);
		}
		return m;
	}
	
	//Parse a pattern that's expected (e.g. won't parse without)
	//This will give an error if it doesn't get what it expects.
	Parser.prototype.expect=function expect(r,msg){
		var m=this.peek(r);
		if(m){
			this.incr(m[0]);
			return m;
		}
		throw ParseError(msg||'Expected pattern "'+r+'," got "'+
			this.text.slice(this.pos,this.pos+8)+(
				this.text.length>this.pos+8?"":"..."
			)+'"',this.line,this.col
		);
	}
	
	//Helper function for parsing whitespace.
	Parser.prototype.space=function space(){
		this.maybe(/\s+/gm);
	}
	
	//Parse a document - txtpat allows this to be reused for sections, which
	// are treated like special case mini documents.
	Parser.prototype.parse_doc=function parse_doc(txtpat,extra){
		var elems=[],tl=this.text.length;
		//Quits when neither is true.
		var text=true,tag=true;
		
		while(this.pos<tl && (text || tag)){
			var res=this.maybe(txtpat);
			if(res && res[0]){
				elems.push(res[0].replace(/\r\n|\r/g,'\n'));
				text=true;
			}
			else{
				text=false;
			}
			
			tag=this.parse_tag(extra);
			if(tag){
				elems.push(tag);
			}
		}
		
		return Section(elems);
	}
	
	Parser.prototype.parse_tag=function parse_tag(extra){
		if(!this.maybe(/\{/g)){
			//Not a tag
			return null;
		}
		this.space();
		
		var keys=[],vals=[],pos=[];
		var tag=new Tag();
		while(!this.maybe(/\}/g)){
			var key=this.parse_value(extra);
			this.space();
			
			if(this.maybe(/:/g)){
				this.lastrel=this.pos;
				this.space();
				
				var val=this.parse_value(extra);
				var x=tag.get(key);
				if(x){
					if(Array.isArray(x)){
						if(Array.isArray(val)){
							//Lump the sections together
							x.concat(val);
						}
						else{
							//Add the new value to the section
							x.push(val);
						}
					}
					else{
						//Lump the two values into a section
						tag.set(key,[x,val]);
					}
				}
				else{
					//Just a normal named attribute
					tag.set(key,val);
				}
				
				this.space();
			}
			else{
				//Just a normal position attribute
				tag.pos.push(key);
			}
		}
		
		var td=this.ts.get(tag.get(0));
		if(td){
			return td(tag,extra);
		}
		return tag;
	}
	
	Parser.prototype.parse_section=function parse_section(extra){
		if(!this.maybe(/\[/g)){
			//Not a section
			return null;
		}
		
		var elems=this.parse_doc(/(?:[^\\{\]]|\\.)*/gm,extra),el=elems.length;
		//handle generic escapes
		while(el--){
			var e=elems[el];
			if(typeof e=="string"){
				elems[el]=e.replace(/\\([^\\{\]])/g,function(m,$1){
					return $1;
				});
			}
		}
		
		this.expect(/\]/g,"Expected the end of a section.");
		
		return elems;
	}
	
	Parser.prototype.parse_value=function parse_value(extra){
		var v;
		//Quoted text
		if(v=this.maybe(/"([^\\"]*|\\.)"|'([^\\']*|\\.)'|`([^\\`]*|\\.)`/gm)){
			var text,q;
			if(v[1]){
				text=v[1];
				q='"';
			}
			else if(v[2]){
				text=v[2];
				q="'";
			}
			else{
				text=v[3];
				q='`';
			}
			
			return Text(text.replace(/\\(.)/g,function(m,$1){
				if($1==q){
					return q;
				}
				else if($1=='\\'){
					return '\\';
				}
				return m[0];
			}),q);
		}
		
		//Unquoted text
		if(v=this.maybe(/(?:[^\s\x00-\x1f{}\[\]:"'`]|\\.)+/g)){
			return Text(v[0].replace(/\\(.)/g,function(m,$1){
				if(/[^\s\x00-\x1f{}\[\]:"']/.test($1)){
					return $1;
				}
				else if($1=='\\'){
					return '\\';
				}
				return m[0];
			}),"");
		}
		
		if(v=this.parse_tag(extra)){
			return v;
		}
		
		if(v=this.parse_section(extra)){
			return v;
		}
		
		//error checking
					
		/*
		Snow errors are very predictable, so check for common
		mistakes. By this point, we know the next character is
		one of the start of quoted text, ], }, whitespace, a
		control character, or EOF (if not, something is HORRIBLY
		wrong)
		*/
		
		//check for EOF
		if(this.pos>=this.text.length){
			throw ParseError("Reached end of string/file while parsing a tag.",this.line,this.col);
		}
		//if there's a string start, there's a string that ends with EOF
		if(m=this.maybe(/r?("|')/g)){
			throw ParseError("Missing terminating "+m[1]+" character",this.line,this.col);
		}
		//forgot to close a tag
		else if(this.maybe(/\]/g)){
			throw ParseError("Unexpected close bracket ]. Did you forget to close a tag?",this.line,this.col-1);
		}
		//didn't provide a value for named attribute
		else if(this.maybe(/\}/g)){
			//Need to calculate the line and col of the colon
			var lines=this.text.slice(0,this.lastrel).split(/\r\n|\n|\r/m);
			throw ParseError("Forgot to assign a value to the named attribute.",lines.length,lines.slice(-1)[0].length);
		}
		//Colon in unquoted text
		else if(this.maybe(/:/g)){
			throw ParseError("The colon is disallowed in unquoted text.",this.line,this.col-1);
		}
		//control characters are disallowed
		else if(this.maybe(/[\x00-\x1f]/g)){
			throw ParseError("Control characters are disallowed in unquoted text.",this.line,this.col-1);
		}
		//indicates an error in the parser's code. "Shouldn't happen"
		else if(m=this.maybe(/\s+/gm)){
			throw ParseError("Expected a value, found whitespace. There's a problem with the API's parser code.",this.line,this.col-m[0].length);
		}
		
		//something is horribly wrong.
		throw ParseError('Something went horribly wrong. Expected value, got "'+(this.text.slice(this.pos,this.pos+8)+this.pos>=this.text.length?"...":"")+'"',self.line,self.col);
	}
	
	Parser.prototype.parse=function(s,extra){
		this.text=s;
		this.pos=0;
		this.line=1;
		this.col=0;
		this.lastrel=0;
		
		return this.parse_doc(/(?:[^\\{]|\\.)*/gm,extra)
	}
	
	snow.prototype.parse=function parse(s,ts,extra){
		var data=null,err=null;
		try{
			data=new Parser(ts).parse(s,extra);
		}
		catch(e){
			var err=e;
		}
		
		var callback;
		if(typeof extra=="function"){
			callback=extra;
		}
		else if(typeof extra=="object"){
			callback=extra.callback;
		}
		
		if(callback){
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
	
	var stringify=snow.prototype.stringify=function(x,callback){
		function stringify(x){
			if(typeof x=="string"){
				function escape(m,$1){
					return "\\"+$1;
				}
				
				function count(s,c){
					var i=s.length,n=0;
					while(i--){
						if(s[i]==c){
							++n;
						}
					}
					return n;
				}
				
				if(x.match(/^[^\s\x00-\x1f{}\[\]:"']+$/g)){
					return x;
				}
				
				var m1=count(x,'"'),m2=count(x,"'"),m3=count(x,'`');
				if(m1<=m2 && m1<=m3){
					return '"'+x.replace(/["\\]/g,escape)+'"';
				}
				else if(m2<=m3){
					return "'"+x.replace(/['\\]/g,escape)+"'";
				}
				else{
					return '`'+x.replace(/[`\\]/g,escape)+'`';
				}
			}
			else if(Array.isArray(x)){
				var v=[],xl=x.length;
				for(var i=0;i<xl;++i){
					var xi=x[i];
					if(typeof xi=="string"){
						v.push(xi);
					}
					else{
						v.push(stringify(xi));
					}
				}
				return '['+v.join("")+']';
			}
			else{
				var keys=x.keys,kl=keys.length,vals=x.vals;
				var pos=x.pos,pl=pos.length,v=[];
				
				if(pos[0]){
					v.push(stringify(pos[0]));
				}
				
				for(var i=0;i<kl;++i){
					v.push(stringify(keys[i])+":"+stringify(vals[i]));
				}
				for(i=1;i<pl;++i){
					v.push(stringify(pos[i]));
				}
				
				return "{"+v.join(" ")+"}";
			}
		}
		
		//Stringification can't produce an error.
		var data=stringify(x);
		
		if(typeof callback=="function"){
			return nextTick(function(){
				return callback(null,x);
			});
		}
		return data;
	}
	
	/**
	 * Like stringification, but produces the most compact output possible.
	 *
	 * This is a separate function because it's slightly more costly to run
	 *  and minification can in some cases hamper readability.
	 *
	 * @param x The Snow object to minify.
	 * @param tags Either a tagset or a callback (optional).
	 * @param callback A callback to call once the function is done (mostly
	 *  for Node compatibility, optional).
	**/
	snow.prototype.minify=function(x,tags,callback){
		if(typeof tags=="function"){
			callback=tags;
			tags={};
		}
		
		if(typeof ts=="undefined"){
			tags={
				get:function(){}
			};
		}
		else if(typeof tags.get=="undefined"){
			tags={
				get:function(x){return tags[x];}
			}
		}
		
		function minify(x,tags){
			if(typeof x=="string"){
				//Stringify already produces the smallest possible.
				return stringify(x);
			}
			else if(Array.isArray(x)){
				//This could theoretically be smaller if the tagset strips
				//whitespace from lines, but there's no good way to do that
				//generically.
				var v=[],xl=x.length;
				for(var i=0;i<xl;++i){
					var xi=x[i];
					if(typeof xi=="string"){
						v.push(xi);
					}
					else{
						v.push(minify(xi,tags));
					}
				}
				return '['+v.join("")+']';
			}
			else{
				var keys=x.keys.slice(0),kl=keys.length,vals=x.vals.slice(0);
				var pos=x.pos,pl=pos.length,v=[],name=pos[0];
				
				if(name){
					v.push(minify(name,tags));
					
					//Remove names in favor of implicit naming
					var tag=tags[name];
					if(tag){
						var attrs=tag.attrs,al=attrs;
						//If this isn't true, removing data might cause
						// misinterpretation
						if(al<=kl){
							for(var i=0;i<al;++i){
								var k=keys.indexOf(attrs[i]);
								if(k>=0){
									v.push(vals[k]);
									//Remove them from the values
									keys.splice(k,1);
									vals.splice(k,1);
								}
							}
						}
					}
				}
				
				for(var i=0;i<kl;++i){
					v.push(minify(keys[i],tags)+":"+minify(vals[i],tags));
				}
				for(i=1;i<pl;++i){
					v.push(minify(pos[i],tags));
				}
				
				//Join the array
				var s="",vl=v.length;
				for(var i=0;i<vl;++i){
					var a=v[i];
					if(/^$|[\]}"'`]$/g.test(s) || /^[}\["'`]/g.test(a)){
						s+=a;
					}
					else{
						s+=" "+a;
					}
				}
				return "{"+s+"}";
			}
		}
		
		//Minification can't produce an error.
		var data=minify(x,tags);
		
		if(typeof callback=="function"){
			return nextTick(function(){
				return callback(null,x);
			});
		}
		return data;
	}
	
	var s=new snow;
	
	if(typeof exports!='undefined'){
		if(typeof module!='undefined' && module.exports) {
			module.exports=s;
		}
		else{
			exports.snow=s;
		}
	}
	else{
		root.snow=s;
	}
})(this);