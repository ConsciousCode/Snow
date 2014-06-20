/**
 * A highly concise and expressive tag-based general data representation.
**/
var snow=(function(){
	//This must be available for default values.
	function Tagset(tags,build_tag){
		var bt=build_tag || function(args,kwargs){
			var def=this.tags[args[0]];
			if(def){
				return def(args,kwargs);
			}
			return {
				attrs:kwargs,
				extra:args
			};
		};
		
		return {
			tags:tags,
			build_tag:bt
		};
	}
	
	return new function(){
		/**
		 * A tag definition.
		 *
		 * @param attrs A list of the names of attributes the tag has. (default: [])
		 * @param build A function that takes a name, named attributes object and a list of extra positional attributes and returns a list with the built value (or [] to ignore the tag - defaults to a function which wraps those values)
		**/
		this.Tagdef=function(attrs,build){
			attrs=attrs || [];
			build=build || function(name,attrs,extra,data){
				return {
					name:name,
					attrs:attrs,
					extra:extra
				};
			}
			
			return function(args,kwargs,data){
				var name=args.length>0?args[0]:"";
				var x=1;
				
				for(var i=0;x<args.length && i<attrs.length;++i){
					var v=attrs[i];
					if(!(v in kwargs)){
						kwargs[v]=args[x++];
					}
				};
				
				var val=build(name,kwargs,args.slice(x),data);
				if(Array.isArray(val)){
					if(val.length>0){
						return [val];
					}
					return val;
				}
				//Returned a non-array value - must be wrapped in an array to indicate that the value should be registered in the document.
				return [val];
			}
		}
		
		this.Tagset=Tagset
		this.parse=function(s,ts){
			if(ts===undefined){
				ts=Tagset([]);
			}
			function ParseError(msg,line,col,extra){
				return {
					message:"(Ln: "+line+" Col: "+col+") "+msg,
					line:line,
					col:col,
					extra:extra
				}
			}
			
			return (new function(){
				this.text=s;
				this.line=1;
				this.col=0;
				this.pos=0;
				//used for nice errors
				this.lastrel=0;
				this.ts=ts;
				
				this.peek=function(pat){
					pat.lastIndex=this.pos;
					var m=pat.exec(this.text);
					if(m && m.index==this.pos){
						return m;
					}
				}
				
				this.incr=function(res){
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
				
				this.maybe=function(pat){
					var m=this.peek(pat);
					if(m){
						this.incr(m[0]);
					}
					return m;
				}
				
				this.expect=function(pat){
					var m=this.peek(pat);
					if(m){
						this.incr(m[0]);
						return m;
					}
					throw ParseError('Expected pattern "'+pat+'," got "'+this.text.slice(this.pos,this.pos+8)+(this.text.length>this.pos+8?"":"...")+'"',this.line,this.col);
				}
				
				this.space=function(){
					this.maybe(/\s+/gm);
				}
				
				//txtpat allows this function to be reused for sections
				//by defining the pattern text may follow.
				this.parse_doc=function(txtpat,data){
					var elems=[];
					var text=true,tag=true;
					
					while(this.pos<=this.text.length && (text || tag)){
						var res=this.maybe(txtpat);
						if(res && res[0]){
							elems.push(res[0].replace(/\r\n|\r/g,'\n'));
							text=true;
						}
						else{
							text=false;
						}
						tag=this.parse_tag(data);
						if(tag.length){
							elems.push(tag[0]);
							tag=true;
						}
						else{
							tag=false;
						}
					}
					
					return elems;
				}
				
				this.parse_tag=function(data){
					if(!this.maybe(/\{/g)){
						return [];
					}
					this.space();
					
					var args=[],kwargs={};
					while(!this.maybe(/\}/g)){
						var val=this.parse_value(data);
						this.space();
						if(this.maybe(/:/g)){
							this.lastrel=this.pos;
							this.space();
							
							var dat=this.parse_value(data);
							if(Array.isArray(kwargs[val])){
								kwargs[val].push(dat);
							}
							else if(kwargs[val]===undefined){
								kwargs[val]=dat;
							}
							else{
								kwargs[val]=[kwargs[val],dat];
							}
						}
						else{
							args.push(val);
						}
						this.space();
					}
					
					//If this returns a false value, the tag is ignored
					return this.ts.build_tag(args,kwargs,data);
				}
				
				this.parse_section=function(data){
					if(!this.maybe(/\[/g)){
						return null;
					}
					
					var elems=this.parse_doc(/(?:[^\\{\]]|\\.)*/gm,data);
					//handle escapes
					for(var i=0;i<elems.length;++i){
						if(typeof elems[i]=="string"){
							elems[i]=elems[i].replace(/\\\{|\\\]/g,function(m){
								if(m[0]=="\\{"){
									return "{";
								}
								return "]";
							});
						}
					}
					
					this.expect(/\]/g);
					this.space();
					
					return elems;
				}
				
				function escape(text){
					return text.replace(/\\([abfnrtv'"]|x[\da-f]{2}|u[\da-fA-F]{4}|U[\da-fA-F]{8}|\d\d\d)/gm,function(m){
						var c={a:"\a",b:"\b",f:"\f",n:"\n",r:"\r",t:"\t",v:"\v","'":"'",'"':'"'}[m[1]];
						if(c){
							return c;
						}
						//unicode
						else{
							return String.fromCharCode(parseInt(m[1].slice(1),16));
						}
					});
				}
				
				this.parse_value=function(data){
					var v;
					if(v=this.maybe(/(r)?(?:"([^\\"]*|\\.)"|'([^\\']*|\\.)')/gm)){
						var text;
						//double quote
						if(v[2]){
							text=v[2];
						}
						//single quote
						else{
							text=v[3];
						}
						
						//If a raw string.
						if(v[1]){
							//double quote
							if(v[2]){
								return text.replace('\\"','"');
							}
							else{
								return text.replace("\\'","'");
							}
						}
						else{
							return escape(text);
						}
					}
					
					//Unquoted text
					if(v=this.maybe(/[^\s\x00-\x1f{}\[\]:"']+/g)){
						return v[0];
					}
					
					if((v=this.parse_tag(data)).length){
						return v[0];
					}
					
					if(v=this.parse_section(data)){
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
			
				this.parse=function(s,data){
					return this.parse_doc(/(?:[^\\{]|\\.)*/gm,data);
				}
			}).parse();
		}
	};
})();