// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @extern node
// ==/ClosureCompiler==

/**
 * A highly concise and expressive tag-based generic data representation.
 *
 * For an informal specification of the format, see http://goo.gl/iMjlL0
 *
 * @module snow
 *
 * @author Robert McDaniels
 * @license The MIT License (MIT)
Copyright (c) 2014 Robert McDaniels

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
**/

/**
 * @export
 * @expose
**/
var snow=(function(){
	'use strict';
	
	/**
	 * Base class for all Snow objects.
	 *
	 * This allows distinguishing Snow objects using the syntax:
	 *  x instanceof snow.Flake
	 *
	 * @export
	 * @struct
	 * @constructor
	 *
	 * @param {number=} line - The line at which the flake occurred, else null.
	 * @param {number=} line - The column at which the flake occurred, else
	 *  null.
	 * @param {number=} line - The position at which the flake occurred, else
	 *  null.
	**/
	function Flake(line,col,pos){
		if(!(this instanceof Flake)){
			return new Flake(line,col,pos);
		}
		
		this.line=typeof line=="undefined"?null:line;
		this.col=typeof col=="undefined"?null:col;
		this.pos=typeof pos=="undefined"?null:pos;
	}
	Flake.prototype.constructor=Flake;
	
	/**
	 * Compare two Snow objects. True only if the other is the exact same
	 *  object.
	 *
	 * @export
	 *
	 * @param {Flake} x - The other object to compare to.
	 *
	 * @return {boolean} Whether or not the two are equivalent.
	**/
	Flake.prototype.eq=function eq(x){
		return this==x;
	}
	
	/**
	 * Visit the object using the visitor pattern. Flake should never appear
	 *  in a document, so this does nothing at all.
	 *
	 * @export
	 *
	 * @param {Object.<string, function(!Flake,?)>} visitor - The visitor.
	 * @param {?} data - Any data required by the visitor.
	**/
	Flake.prototype.visit=function visit(visitor,data){}
	
	/**
	 * @export
	 *
	 * @return {string} The textual representation of the Snow object - as
	 *  this should never appear in a document, this always returns a snowflake
	 *  character.
	**/
	Flake.prototype.toString=function toString(){
		return "\u2744";
	}
	
	/**
	 * A Snow tag, acts as an associative array from Snow objects/integers
	 *  to Snow objects.
	 *
	 * @export
	 * @struct
	 * @constructor
	 * @extends {Flake}
	 *
	 * @param {Array.<Flake>=} keys - An array of the names of named 
	 *  attributes.
	 * @param {Array.<Flake>=} vals - An array of the values of named 
	 *  attributes.
	 * @param {Array.<Flake>=} pos - An array of the positional attributes.
	**/
	function Tag(keys,vals,pos,l,c,p){
		if(!(this instanceof Tag)){
			return new Tag(keys,vals,pos);
		}
		Flake.call(this,l,c,p);
		
		/** @type {Array.<Flake>} **/ this.keys=keys||[];
		/** @type {Array.<Flake>} **/ this.vals=vals||[];
		/** @type {Array.<Flake>} **/ this.pos=pos||[];
	}
	Tag.prototype=Object.create(Flake.prototype);
	Tag.prototype.constructor=Tag;
	
	/**
	 * Apply a function to a retrieved value and return the result.
	 *
	 * @param t {Tag} - The tag to use.
	 * @param x {Flake|number|string} - The key on which to apply the function.
	 * @param f {function(this:!Tag,Array.<Flake>,?number)} - The callback to
	 *  call.
	 *
	 * This is used as an internal utility function to reduce repetition.
	**/
	function tag_apply(t,x,f){
		if(typeof x=="number"){
			return f.call(t,t.pos,x);
		}
		
		if(typeof x=="string"){
			x=new Text(x);
		}
		else if(x instanceof String){
			x=new Text(x.valueOf());
		}
		
		var keys=t.keys,kl=keys.length;
		while(kl--){
			var k=keys[kl];
			if(x.eq(k)){
				return f.call(t,t.vals,kl);
			}
		}
		return f.call(t,null,null);
	}
	
	/**
	 * @export
	 * @override
	 *
	 * @param {*} x - The object to compare to the tag.
	 *
	 * @return {boolean} Whether or not the tag is equal to another object.
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
					if(!ps.eq(opos[kl])){
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
	
	/**
	 * Get the object stored under the given key.
	 *
	 * @export
	 *
	 * @param {Flake|number} x - The key to retrieve the object, either a
	 *  Snow object for named attributes or integer for positional attributes.
	 *
	 * @return {Flake|undefined} The value at the given key.
	**/
	Tag.prototype.get=function get(x){
		return tag_apply(this,x,function(o,k){
			if(k===null){
				return;
			}
			return o[k];
		});
	}
	
	/**
	 * Set the object stored under the given key to the given value.
	 *
	 * @throws {TypeError}
	 *
	 * @export
	 *
	 * @param {Flake|number} x - The key to retrieve the object, either a
	 *  Snow object for named attributes or integer for positional attributes.
	 * @param {Flake} v - The value to store.
	 *
	 * @return {Flake} The new value at the given key.
	**/
	Tag.prototype.set=function set(x,v){
		return tag_apply(this,x,function(o,k){
			if(k===null){
				if(o){
					this.keys.push(x);
					this.vals.push(v);
					
					return v;
				}
				
				throw new TypeError(
					"Tags can only store text, sections, and tags."
				);
			}
			return o[k];
		});
	}
	
	/**
	 * Delete the value with the given key.
	 *
	 * @export
	 *
	 * @param {Flake|number} x - The key of the object to delete.
	**/
	Tag.prototype.del=function del(x){
		tag_apply(this,x,function(o,k){
			if(k!==null){
				this.keys.splice(k,1);
				this.vals.splice(k,1);
			}
		});
	}
	
	/**
	 * @export
	 *
	 * @param {Flake|number} x - The key of the object to find.
	 * @return {boolean} Whether or not the tag has a value with the given key.
	**/
	Tag.prototype.has=function has(x){
		return tag_apply(this,x,function(o,k){
			return k!==null;
		});
	}
	
	/**
	 * Use the visitor pattern to iterate over a Snow document.
	 *
	 * @export
	 * @override
	 *
	 * @param {{visit_tag:function(!Flake,?)}} visitor - The visitor.
	 * @param {?=} data - Any data the visitor needs.
	**/
	Tag.prototype.visit=function visit(visitor,data){
		return visitor.visit_tag(this,data);
	}
	
	/**
	 * @export
	 * @override
	 *
	 * @return {string} The string version of the tag.
	**/
	Tag.prototype.toString=function toString(){
		var keys=this.keys,kl=keys.length,vals=this.vals;
		var pos=this.pos,pl=pos.length,content=[];
		
		if(pos[0]){
			content.push(pos[0]);
		}
		
		for(var i=0;i<kl;++i){
			content.push(keys[i]+":"+vals[i]);
		}
		for(i=1;i<pl;++i){
			content.push(pos[i]);
		}
		
		return "{"+content.join(" ")+"}";
	}
	
	/**
	 * Snow text object (either (un)quoted tag text or section/doc text).
	 *
	 * @export
	 * @struct
	 * @constructor
	 * @extends {Flake}
	 *
	 * @param {string} x - The text to use. 
	**/
	function Text(x,l,c,p){
		if(!(this instanceof Text)){
			return new Text(x);
		}
		
		Flake.call(this,l,c,p);
		
		/**
		 * The text stored by the object.
		 *
		 * @type {string}
		**/
		this.value=x;
	}
	Text.prototype=Object.create(Flake.prototype);
	Text.prototype.constructor=Text;
	
	/**
	 * @export
	 * @override
	 *
	 * @param {*} x - The object to compare to the text.
	 *
	 * @return {boolean} Whether or not the object is equivalent to the text.
	**/
	Text.prototype.eq=function eq(x){
		if(x instanceof Text){
			x=x.value;
		}
		
		if(typeof x=="string"){
			return this.value==x;
		}
		else if(x instanceof String){
			return this.value==x.valueOf();
		}
		
		return false;
	}
	
	/**
	 * Use the visitor pattern to iterate over a text object.
	 *
	 * @export
	 * @override
	 *
	 * @param {{visit_text:function(!Flake,?)}} visitor - The visitor.
	 * @param {?=} data - Any data the visitor needs.
	**/
	Text.prototype.visit=function visit(visitor,data){
		return visitor.visit_text(this,data);
	}
	
	/**
	 * @export
	 * @override
	 *
	 * @return {string} The text object as a string (assuming tag text).
	**/
	Text.prototype.toString=function toString(){
		var x=this.value;
		if(x.match(/^[^\s{:}\[\]"'`]+$/g)){
			return x;
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
		
		var m1=count(x,'"'),m2=count(x,"'"),m3=count(x,'`');
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
	
	/**
	 * A Snow section object, for storing text and tags together as markups.
	 *
	 * @export
	 * @struct
	 * @constructor
	 * @extends {Flake}
	 *
	 * @param {Array.<Text|Tag>} x - The initial value of the section.
	**/
	function Section(x,l,c,p){
		if(!(this instanceof Section)){
			return new Section(x);
		}
		
		Flake.call(this,l,c,p);
		
		/**
		 * The data stored by the section.
		 *
		 * @type {Array.<Text|Tag>}
		**/
		this.value=x;
	}
	Section.prototype=Object.create(Flake.prototype);
	Section.prototype.constructor=Section;
	
	/**
	 * @export
	 *
	 * @param {number} x - The index to get.
	 * @return {Text|Tag|undefined} The Snow object at the index.
	**/
	Section.prototype.get=function get(x){
		return this.value[x];
	}
	
	/**
	 * @export
	 *
	 * @param {number} x - The index to set.
	 * @param {Text|Tag} v - The new value.
	**/
	Section.prototype.set=function set(x,v){
		if(v instanceof Text || v instanceof Tag){
			this.value[x]=v;
		}
	}
	
	/**
	 * @export
	 * @override
	 *
	 * @param {*} x - The object to compare to the section.
	 * @return {boolean} Whether or not the objects were equivalent.
	**/
	Section.prototype.eq=function eq(x){
		if(x instanceof Section){
			x=x.value;
		}
		if(Array.isArray(x)){
			var y=this.value,yl=y.length;
			if(yl!=x.length){
				return false;
			}
			while(yl--){
				if(!x.eq(y)){
					return false;
				}
			}
			
			return true;
		}
		
		return false;
	}
	
	/**
	 * Use the visitor pattern to iterate over the section.
	 *
	 * @export
	 * @override
	 *
	 * @param {{visit_section:function(!Flake,?)}} visitor - The visitor.
	 * @param {?=} data - Any data required by the visitor.
	**/
	Section.prototype.visit=function visit(visitor,data){
		return visitor.visit_section(this,data);
	}
	
	/**
	 * @export
	 * @override
	 *
	 * @return {string} The section as a string.
	**/
	Section.prototype.toString=function toString(){
		return '['+this.value.join("")+']';
	}
	
	/**
	 * A Snow document (a subset of section)
	 *
	 * @export
	 * @struct
	 * @constructor
	 * @extends {Section}
	 *
	 * @param {Array.<Text|Tag>} The initial value of the document.
	**/
	function Document(x,l,c,p){
		if(!(this instanceof Document)){
			return new Document(x);
		}
		
		Section.call(this,x,l,c,p);
	}
	Document.prototype=Object.create(Section.prototype);
	Document.prototype.constructor=Document;
	
	/**
	 * Use the visitor pattern to iterate over the document.
	 *
	 * @export
	 * @override
	 *
	 * @param {{visit_doc:function(!Flake,?)}} visitor - The visitor.
	 * @param {?=} data - Any data the visitor needs.
	**/
	Document.prototype.visit=function visit(visitor,data){
		return visitor.visit_doc(this,data);
	}
	
	/**
	 * @export
	 * @override
	 *
	 * @return {string} The document as a string.
	**/
	Document.prototype.toString=function toString(){
		return this.value.join("");
	}
	
	/**
	 * A tag definition.
	 *
	 * @export
	 *
	 * @param {?Array.<string>=[]} attrn A list of the names of attributes the
	 *  tag has. (default: [])
	 * @param build {function(Array.<Flake>,Array.<Flake>,Array.<Flake>,?):!Tag=} - A function that takes a tag's 
	 *  values, adjusts them, then returns a constructed tag object.
	 *
	 * @return {function(Array.<Flake>,Array.<Flake>,Array.<Flake>,?):!Tag}
	**/
	function Tagdef(attrn,build){
		attrn=(attrn||[]).map(function(v){
			if(typeof v=="string"){
				return new Text(v);
			}
		});
		build=build||function(keys,vals,pos,l,c,p,extra){
			return new Tag(keys,vals,pos,l,c,p);
		}
		
		var al=attrn.length;
		function TagBuilder(keys,vals,pos,l,c,p,extra){
			function nhas_attr(keys,attr,kl){
				while(kl--){
					if(attr.eq(keys[kl])){
						return false;
					}
				}
				return true;
			}
			
			//Process positional attributes as defined.
			var kl=keys.length,pl=pos.length;
			for(var i=0;i<al && i<pl;++i){
				var attr=attrn[i];
				if(nhas_attr(keys,attr,kl)){
					keys.push(attr);
					vals.push(pos.splice(1,1)[0]);
				}
			}
			
			return build(keys,vals,pos,l,c,p,extra);
		}
		
		TagBuilder.attrs=attrn;
		
		return TagBuilder;
	}
	
	/**
	 * An error used to indicate an issue with parsing. Preserves the line
	 *  and column most relevant to the issue.
	 *
	 * @export
	 * @struct
	 * @constructor
	 * @extends {Error}
	 *
	 * @param {string} msg - The error message.
	 * @param {number} line - The line number in the Snow document.
	 * @param {number} col - The column in the Snow document.
	**/
	function ParseError(msg,line,col){
		if(!(this instanceof ParseError)){
			return new ParseError(msg,line,col);
		}
		
		var err=Error.call(this,msg+" (Ln: "+line+" Col: "+col+")");
		var stack=err.stack;
		
		Object.defineProperty(this,"stack",{
			get:function(){
				return stack;
			}
		});
		/**
		 * The error message.
		 *
		 * @type {string}
		**/
		this.message=err.message;
		/**
		 * The line in the document at which the error occurred.
		 *
		 * @type {number}
		**/
		this.line=line;
		/**
		 * The column in the document at which the error occurred.
		 *
		 * @type {number}
		**/
		this.col=col;
	}
	ParseError.prototype=Object.create(Error.prototype);
	ParseError.prototype.constructor=ParseError;
	/** @const **/ ParseError.prototype.name="ParseError";
	
	/**
	 * Regex for newlines as defined by Unicode.
	 *
	 * @const
	 * @type {RegExp}
	**/
	var NEWLINE=/\r\n|[\r\n\x85\v\f\u2028\u2029]/gm,
		SPACE=/\s+/gm,
		QUOTED_TEXT=
			/"((?:[^\\"]|\\.)*)"|'((?:[^\\']|\\.)*)'|`((?:[^\\`]|\\.)*)`/gm,
		UNQUOTED_TEXT=/(?:[^\s{:}\[\]"'`\\]|\\.)+/gm,
		DOC_REPL=new RegExp("("+NEWLINE.source+")|((?:[^\\{]|\\.)*)","gm"),
		SEC_REPL=new RegExp("("+NEWLINE.source+")|((?:[^\\{\]]|\\.)*)","gm"),
		DOC_TEXT=/(?:[^\\{]|\\.)*/gm,
		SEC_TEXT=/(?:[^\\{\]]|\\.)*/gm;
	
	/**
	 * Try to match the regex if possible, else return null
	 *
	 * @param {RegExp} r - The regex to match.
	 * @return {?Array.<string|undefined>} The result of the match.
	**/
	function maybe(text,ps,r){
		r.lastIndex=ps.pos;
		var m=r.exec(text);
		if(m && m.index==ps.pos){
			var lines=m[0].split(NEWLINE);
			if(lines.length>1){
				ps.line+=lines.length-1;
				ps.col=lines[lines.length-1].length;
			}
			else{
				ps.col+=lines[0].length;
			}
			ps.pos+=m[0].length;
			
			return m;
		}
		return null;
	}
	
	/**
	 * Used in Parser.parse_tag and minify - returns the index of a Snow object
	 *  in the given array (like Array.indexOf, but works with Snow objects).
	 *
	 * @param {Array.<Flake>} keys - The array to look in.
	 * @param {Flake|string} x - The object to look for.
	 *
	 * @return {?number} The index of the Snow object, or if it isn't in keys,
	 *  null.
	**/
	function index(keys,x){
		if(typeof x=="string"){
			x=new Text(x);
		}
		else if(x instanceof String){
			x=new Text(x.valueOf());
		}
		
		var i=keys.length;
		while(i--){
			if(x.eq(keys[i])){
				return i;
			}
		}
		return null;
	}
	
	/**
	 * Attempt to parse a tag, else return null.
	 *
	 * @throws {ParseError}
	 *
	 * @param {?} extra - Any extra data for parsing hooks.
	 *
	 * @return {?Tag} The parsed tag.
	**/
	function parse_tag(text,ps,extra){
		if(text[ps.pos]!="{"){
			//Not a tag
			return null;
		}
		var line=ps.line,col=ps.col,p=ps.pos,tl=text.length;
		
		++ps.pos;
		++ps.col;
		
		var keys=[],vals=[],pos=[];
		
		while(ps.pos<tl){
			maybe(text,ps,SPACE);
			if(text[ps.pos]=="}"){
				++ps.pos;
				++ps.col;
				
				return ps.build(keys,vals,pos,line,col,p,extra);
			}
			
			var key=parse_value(text,ps,extra);
			maybe(text,ps,SPACE);
			
			if(text[ps.pos]==":"){
				key.colon={line:ps.line,col:ps.col};
				
				++ps.pos;
				++ps.col;
				
				ps.lastrel=ps.pos;
				maybe(text,ps,SPACE);
				
				var val=parse_value(text,ps,extra);
				var x=index(keys,key);
				if(x===null){
					keys.push(key);
					vals.push(val);
				}
				else{
					throw new ParseError(
						"Duplicate named attribute names",
						ps.line,ps.col
					);
				}
			}
			else{
				//Just a normal position attribute
				pos.push(key);
			}
		}
		
		throw new ParseError("Unclosed tag",line,col);
	}
	
	/**
	 * Attempt to parse a section, else return null.
	 *
	 * @throws {ParseError}
	 *
	 * @param {?} extra - Any extra data for parsing hooks.
	 *
	 * @return {?Section} The parsed section.
	**/
	function parse_section(text,ps,extra){
		if(text[ps.pos]!="["){
			//Not a section
			return null;
		}
		var line=ps.line,col=ps.col,pos=ps.pos;
		++ps.pos;
		++ps.col;
		
		var elems=[],tl=text.length;
		//Quits when neither is true.
		var tx,tg;
		
		do{
			var res=maybe(text,ps,SEC_TEXT);
			if(res && res[0]){
				elems.push(
					new Text(res[0].replace(SEC_REPL,function(m,$1,$2){
						if($1){
							return "\n";
						}
						return $2;
					}))
				)
				tx=true;
			}
			else{
				tx=false;
			}
			
			res=parse_tag(text,ps,extra);
			if(res){
				elems.push(res);
				tg=true;
			}
			else{
				tg=false;
			}
		}while(ps.pos<tl && (tx || tg));
		
		if(text[ps.pos]!="]"){
			throw new ParseError(
				"Expected the end of a section.",line,col
			);
		}
		++ps.pos;
		++ps.col;
		
		return new Section(elems,line,col,pos);
	}
	
	/**
	 * Attempt to parse a value - failure results in a fatal exception.
	 *
	 * @throws {ParseError}
	 *
	 * @param {?} extra - Any extra data for parsing hooks.
	 *
	 * @return {!Flake} The value.
	**/
	function parse_value(text,ps,extra){
		var line=ps.line,col=ps.col,pos=ps.pos;
		var v=maybe(text,ps,QUOTED_TEXT);
		//Quoted text
		if(v){
			if(v[1]){
				var text=v[1],qr=/\\([\\"])/g;
			}
			else if(v[2]){
				var text=v[2],qr=/\\([\\'])/g;
			}
			//v[3]
			else{
				var text=v[3],qr=/\\([\\`])/g;
			}
			
			return new Text(text.replace(qr,"$1"),line,col,pos);
		}
		
		//Unquoted text
		if(v=maybe(text,ps,UNQUOTED_TEXT)){
			return new Text(
				v[0].replace(/\\([\s{:}\[\]"'`\\])/g,"$1"),
				line,col,pos
			);
		}
		
		if(v=parse_tag(text,ps,extra)){
			return v;
		}
		
		if(v=parse_section(text,ps,extra)){
			return v;
		}
		
		//error checking
					
		/*
		Snow errors are very predictable, so check for common
		mistakes. By this point, we know the next character is
		one of the start of quoted text, ], }, whitespace, or EOF (if not,
		something is fundamentally wrong with the parser)
		*/
		
		//check for EOF
		if(ps.pos>=text.length){
			throw new ParseError(
				"Reached end of string/file while parsing a tag.",
				ps.line,ps.col
			);
		}
		
		var c=text[ps.pos];
		
		if('"\'`'.indexOf(c)>=0){
			throw new ParseError(
				"Missing terminating "+c+" character",ps.line,ps.col
			);
		}
		
		if(c==']'){
			throw new ParseError(
				"Unexpected close bracket ]. Did you forget to close a tag?",
				ps.line,ps.col-1
			);
		}
		
		if(c=='}'){
			//Need to calculate the line and col of the colon
			throw new ParseError(
				"Forgot to assign a value to the named attribute.",
				ps.colonline,ps.coloncol
			);
		}
		
		if(c==':'){
			throw new ParseError(
				"Colons are disallowed in unquoted text.",ps.line,ps.col
			);
		}
		
		if(/\s+/gm.test(c)){
			throw new ParseError(
				"Expected a value, found whitespace. "+
				"There's a problem with the API's parser code.",
				ps.line,ps.col
			);
		}
		
		//reserved for cosmic ray errors
		throw new ParseError(
			'Something went horribly wrong. Expected value, got "'+(
				text.slice(ps.pos,ps.pos+8)+
				(ps.pos+8>=text.length)?"":"..."
			)+'"',ps.line,ps.col
		);
	}
	
	/**
	 * The main Snow parser.
	 *
	 * @export
	 * @struct
	 * @constructor
	 *
	 * @param {(object|{get:function(Array.<Flake>,Array.<Flake>,Array.<Flake>,?:!Tag})=}
	**/
	function Parser(ts){
		if(!(this instanceof Parser)){
			return new Parser(ts);
		}
		
		//Parsing
		if(typeof ts=="object"){
			this.build=function static_build(keys,vals,pos){
				var name=pos[0]
				//x has to be a string for it to match anything in ts.
				if(!(name instanceof Text)){
					return;
				}
				return ts[name.value];
			}
		}
		else if(typeof ts=="function"){
			this.build=ts;
		}
		else{
			this.build=function generic_build(keys,vals,pos){
				return new Tag(keys,vals,pos);
			}
		}
	}
	Parser.prototype.constructor=Parser;
	
	/**
	 * Parse the given Snow document.
	 *
	 * @throws {ParseError}
	 *
	 * @export
	 *
	 * @param {string} s - The document text.
	 * @param {?} extra - Any extra data for parsing hooks.
	 *
	 * @return {!Document}
	**/
	Parser.prototype.parse=function parse(text,extra){
		var pos=(text.length>0 && text[0]=="\ufeff")?1:0;
		text=text.toString();
		var ps={
			pos:pos,
			line:1,
			col:0,
			lastrel:0,
			build:this.build
		};
		
		var elems=[],tl=text.length;
		//Quits when neither is true.
		var tx,tg;
		
		do{
			var res=maybe(text,ps,DOC_TEXT);
			if(res && res[0]){
				elems.push(
					new Text(res[0].replace(DOC_REPL,function(m,$1,$2){
						if($1){
							return "\n";
						}
						return $2;
					}))
				);
				tx=true;
			}
			else{
				tx=false;
			}
			
			res=parse_tag(text,ps,extra);
			if(res){
				elems.push(res);
				tg=true;
			}
			else{
				tg=false;
			}
		}while(ps.pos<tl && (tx || tg));
		
		return new Document(elems,1,0,pos);
	}
	
	/**
	 * Shorthand for parsing a Snow document with the given tagset.
	 *
	 * @param {string} s - The Snow document.
	 * @param {(object|{get:function(Array.<Flake>,Array.<Flake>,Array.<Flake>,?:!Tag})=} ts - The tagset.
	 * @param {?} extra - Any extra data for use in parsing hooks.
	 *
	 * @return {!Document}
	**/
	
	function parse(s,ts,extra){
		return new Parser(ts).parse(s,extra);
	}
	
	/**
	 * Shorthand for stringifying a Snow object.
	 *
	 * @param {Flake} x - The Snow object.
	 *
	 * @return {string}
	**/
	function stringify(x){
		return x.toString();
	}
	
	/**
	 * Like stringification, but produces the most compact output possible.
	 *
	 * This is a separate function because it's slightly more costly to run
	 *  and minification can in most cases hamper readability.
	 *
	 * @export
	 *
	 * @param {Flake} x - The Snow object to minify.
	 * @param {(object|{get:function(Array.<Flake>,Array.<Flake>,Array.<Flake>,?:!Tag,mini_section:function})=} tags A tagset (optional).
	 *
	 * @return {string} The smallest possible textual representation of the
	 *  Snow document.
	**/
	function minify(x,tags){
		if(!(x instanceof Flake)){
			throw new TypeError("Attempted to minify non-Snow object");
		}
		
		if(typeof tags=="undefined"){
			tags={
				get:function(){},
				mini_section:function(x){return x;},
				mini_tag:function(){}
			};
		}
		else{
			var ts=tags;
			tags={
				get:tags.get||function(){
					if(x instanceof Text){
						return ts[x.value];
					}
				},
				mini_section:tags.mini_section||function(x){return x;},
				mini_tag:tags.mini_tag||function(keys,vals,pos){
					var tag=this.get(pos[0]);
					
					if(tag){
						var attrs=tag.attrs,al=attrs;
						for(var i=0;i<al;++i){
							var k=index(keys,attrs[i]);
							if(k!==null){
								pos.splice(i+1,0,vals[k]);
								//Remove them from the values
								keys.splice(k,1);
								vals.splice(k,1);
							}
						}
					}
				}
			};
		}
		
		/**
		 * Sub-minify function used for recursion so the tagset check isn't
		 *  performed every iteration.
		 *
		 * @param {Flake} x - The Snow object to minify.
		 * @param {(object|{get:function(Array.<Flake>,Array.<Flake>,Array.<Flake>,?:!Tag})=} tags A tagset 
		 *  (optional).
		 *
		 * @return {string} The smallest possible textual representation of 
		 *  the Snow document.
		**/
		function minify(x,tags){
			function is_unquoted(x){
				if(x instanceof Text){
					return /^[^\s{:}\[\]\\"'`]+$/.test(x);
				}
			}
			
			//Tag minification utility function (hamming distance)
			function utility(x,y){
				if(x==~y&3){
					return 2;
				}
				else if(x==y){
					return 0;
				}
				return 1;
			}
			
			if(x instanceof Text){
				//Text can be made (possibly) smaller in exactly one way -
				// when just one character needs to be escaped, it can be
				// made unquoted (1 character smaller), but doing so is only
				// more optimal when in a tag and neither side needs a space to
				// disambiguate, something only the tag can determine and
				// is fairly hard to integrate into the algorithm.
				return x.toString();
			}
			else if(x instanceof Section){
				//Outsource any section minification to the tagset -
				// can't be done generically
				return "["+tags.mini_section(x.value.slice(0)).map(function(v){
					return minify(v,tags);
				}).join("")+"]";
			}
			else if(x instanceof Tag){
				/**
				 * Explanation of the algorithm (because I know I'll forget):
				 *
				 * Value types can be separated into two categories, unquoted
				 *  text and everything else. Unquoted text is the only value
				 *  type which is less optimal when placed next to itself
				 *  (because then a space is needed). Thus, tag minimization
				 *  becomes an optimization problem of reducing the
				 *  occurrences of 0-0 (two unquoted next to each other) - 
				 *  any other combination (0-1, 1-0, 1-1) is fine, however,
				 *  1-1 is assumed to be sub-optimal because 1 symbols are
				 *  universal separators, and thus valuable "resources" being
				 *  potentially wasted.
				 *
				 * Positional attributes remain fixed no matter what, so they
				 *  can be considered static parameters. Named attributes, on
				 *  the other hand, can be rearranged at will, but consist of
				 *  two separate symbols unambiguously delineated by the
				 *  colon. 4 arrays (1 for each combination of feature) are
				 *  built based on the features of the named attributes.
				 *  Then, an output array is initialized to the contents of
				 *  the positional attributes, and a feature vector is created
				 *  along with it taking note of whether each attribute is
				 *  unquoted or not. Finally, the output array is repeatedly
				 *  iterated over until each of the 4 feature combinations
				 *  (in order of priority: 0-0, 1-1, 0-1, 1-0) are fully
				 *  addressed, with one more iteration cycle devoted to
				 *  assigning positions to the leftover named attributes.
				 *
				 * So, to summarize: call the tagset to minify the tag's
				 *  values (named -> positional, shorter text representations,
				 *  etc), build the named attribute feature arrays, build
				 *  the output array and output feature array, repeatedly
				 *  iterate over the output array looking for high priority
				 *  feature combinations and inserting optimal named
				 *  attributes until none remain, and concatenate the elements
				 *  of the output array with spaces where necessary for the
				 *  final string version.
				**/
				var keys=x.keys.slice(0),kl=keys.length,vals=x.vals.slice(0);
				var pos=x.pos.slice(0),pl=pos.length;
				
				tags.mini_tag(keys,vals,pos);
				
				var LEFT=1,RIGHT=2,BOTH=LEFT|RIGHT;
				
				var pf=new Array(pl+2);
				pf[0]=RIGHT;
				//pf.length==pl+2, pf[pf.length-1] == pf[pl+2-1] ==  pf[pl+1]
				pf[pl+1]=LEFT;
				
				for(var i=0;i<pl;++i){
					if(is_unquoted(pos[i])){
						pf[i+1]=BOTH;
					}
					else{
						pf[i+1]=0;
					}
				}
				
				var n00=[],n01=[],n10=[],n11=[];
				var nfv=[n00,n01,n10,n11];
				for(var i=0;i<kl;++i){
					var x=0,k=keys[i],v=vals[i];
					if(!is_unquoted(k)){
						x=LEFT;
					}
					if(!is_unquoted(v)){
						x|=RIGHT;
					}
					
					nfv[x].push(minify(k,tags)+":"+minify(v,tags));
				}
				var nf=[],i=4;
				while(i--){
					var j=nfv[i].length;
					while(j--){
						nf.push(i);
					}
				}
				var nv=n11.concat(n10,n01,n00);
				
				//Don't stop until all named attributes are inserted
				var out=pos,ol=pl,of=pf;
				while(nv.length){
					var mu=0,p=0,same=false;
					for(var i=0;i<ol && nv.length;++i){
						var u=utility(nv[nv.length-1],of[i+1]);
						if(u==2){
							mu=0;
							same=true;
							out.splice(i,0,nv.pop());
							of.splice(++i,0,nf.pop());
							++ol;
						}
						else if(u>mu){
							mu=u;
							p=i;
						}
					}
					if(!same){
						out.splice(p,0,nv.pop());
						of.splice(p+1,0,nf.pop());
						++ol;
					}
				}
				
				console.log(of);
				
				var s="{";
				for(var i=0;i<ol;++i){
					if(!(of[i]&RIGHT) && !(of[i+1]&LEFT)){
						s+=' ';
					}
					var x=out[i];
					if(typeof x=="string"){
						s+=x;
					}
					else{
						s+=minify(x,tags);
					}
				}
				return s+"}";
			}
			else{
				throw new Error("Cannot minify unknown "+(typeof x));
			}
		}
		
		//Minification can't produce an error.
		if(x instanceof Document){
			return tags.mini_section(x.value.slice(0)).map(function(v){
				return minify(v,tags);
			}).join("");
		}
		return minify(x,tags);
	}
	
	return /** @struct **/ {
		"Flake":Flake,
		"Tag":Tag,
		"Text":Text,
		"Section":Section,
		"Document":Document,
		"Tagdef":Tagdef,
		"ParseError":ParseError,
		"index":index,
		"Parser":Parser,
		"parse":parse,
		"stringify":stringify,
		"minify":minify
	};
})();

//Node support
if(typeof exports!='undefined'){
	if(typeof module!='undefined' && module.exports) {
		module.exports=snow;
	}
	else{
		exports.snow=snow;
	}
}