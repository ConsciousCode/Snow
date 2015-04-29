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
	function Flake(line,col){
		if(!(this instanceof Flake)){
			return new Flake(line,col);
		}
		
		this.line=typeof line=="undefined"?null:line;
		this.col=typeof col=="undefined"?null:col;
	}
	var p=Flake.prototype={
		"constructor":Flake,
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
		"equals":function(x){
			return this==x;
		},
		/**
		 * Visit the object using the visitor pattern. Flake should never 
		 *  appear in a document, so this does nothing at all.
		 *
		 * @export
		 *
		 * @param {Object.<string, function(!Flake,?)>} visitor - The visitor.
		 * @param {?} data - Any data required by the visitor.
		**/
		"visit":function(visitor,data){},
		/**
		 * @export
		 *
		 * @return {string} The textual representation of the Snow object. As
		 *  this should never appear in a document, this always returns a 
		 *  snowflake character.
		**/
		"toString":function(){
			return "\u2744";
		}
	};
	
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
	function Tag(keys,vals,pos,line,col){
		if(!(this instanceof Tag)){
			return new Tag(keys,vals,pos);
		}
		Flake.call(this,line,col);
		
		/** @type {Array.<Flake>} **/ this.keys=keys||[];
		/** @type {Array.<Flake>} **/ this.vals=vals||[];
		/** @type {Array.<Flake>} **/ this.pos=pos||[];
	}
	p=Tag.prototype=Object.create(p);
	p.constructor=Tag;
	
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
			if(x.equals(k)){
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
	p.equals=function(x){
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
					if(!k.equals(okeys[kl])){
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
					if(!v.equals(ovals[kl])){
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
					if(!ps.equals(opos[kl])){
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
	p.get=function(x){
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
	p.set=function(x,v){
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
	p.del=function(x){
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
	p.has=function(x){
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
	p.visit=function(visitor,data){
		return visitor.visit_tag(this,data);
	}
	
	/**
	 * @export
	 * @override
	 *
	 * @return {string} The string version of the tag.
	**/
	p.toString=function(){
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
	function Text(x,l,c){
		if(!(this instanceof Text)){
			return new Text(x,l,c);
		}
		
		Flake.call(this,l,c);
		
		/**
		 * The text stored by the object.
		 *
		 * @type {string}
		**/
		this.value=x;
	}
	p=Text.prototype=Object.create(Flake.prototype);
	p.constructor=Text;
	
	/**
	 * @export
	 * @override
	 *
	 * @param {*} x - The object to compare to the text.
	 *
	 * @return {boolean} Whether or not the object is equivalent to the text.
	**/
	p.equals=function(x){
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
	p.visit=function(visitor,data){
		return visitor.visit_text(this,data);
	}
	
	/**
	 * @export
	 * @override
	 *
	 * @return {string} The text object as a string (assuming tag text).
	**/
	p.toString=function(){
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
			return '"'+x.replace(/"/g,"\\$&")+'"';
		}
		else if(m2<=m3){
			return "'"+x.replace(/'/g,"\\$&")+"'";
		}
		else{
			return '`'+x.replace(/`/g,"\\$&")+'`';
		}
	}
	
	/**
	 * @export
	 *
	 * @return {Uint32Array} The content of the object as a UTF-32 typed
	 *  array.
	**/
	p.toUint32Array=function(){
		var data=[],value=this.value,vl=value.length;
		
		for(var i=0;i<vl;++i){
			var x=value.charCodeAt(i);
			if(x>=0xd800 && x<=0xd8ff && i+1<vl){
				var y=value.charCodeAt(++i);
				data.push(((x-0xd800)<<10)|(y-0xdc00)+0x010000);
			}
			else{
				data.push(x);
			}
		}
		
		return new Uint32Array(data);
	}
	
	/**
	 * @param {number} at The index of the code point.
	 *
	 * @return {number|undefined} The Unicode code point at the given index.
	**/
	p.codePointAt=function(at){
		var value=this.value,vl=value.length;
		
		for(var i=0;i<vl;++i,--at){
			var x=value.charCodeAt(i);
			if(at==0){
				if(x>=0xd800 && x<=0xdbff && i+1<vl){
					var y=value.charCodeAt(++i);
					return ((x-0xd800)<<10)|(y-0xdc00)+0x010000;
				}
				return x;
			}
			
			if(x>=0xd800 && x<=0xdbff){
				++i;
			}
		}
		
		//return undefined
	}
	
	/**
	 * @param {number} The index of the character to get.
	 *
	 * @return {string|undefined} The character/surrogate pair at the given
	 *  index.
	**/
	p.get=function(at){
		var value=this.value,vl=value.length;
		
		for(var i=0;i<vl;++i,--at){
			var x=value.charCodeAt(i);
			if(at==0){
				if(x>=0xd800 && x<=0xdbff && i+1<vl){
					return value.slice(i,i+2);
				}
				return value[i];
			}
			
			if(x>=0xd800 && x<=0xdbff){
				++i;
			}
		}
		
		//return undefined
	}
	
	var SURPAIR=/[\ud800-\udbff][\udc00-\udfff]/g;
	Object.defineProperty(p,"length",{
		get:function(){
			var value=this.value,c=0;
			SURPAIR.lastIndex=0;
			while(SURPAIR.test(value)){
				++c;
			}
			
			return value.length-c;
		}
	});
	
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
	function Section(x,l,c){
		if(!(this instanceof Section)){
			return new Section(x);
		}
		
		Flake.call(this,l,c);
		
		/**
		 * The data stored by the section.
		 *
		 * @type {Array.<Text|Tag>}
		**/
		this.value=x||[];
	}
	p=Section.prototype=Object.create(Flake.prototype);
	p.constructor=Section;
	
	/**
	 * @export
	 *
	 * @param {number} x - The index to get.
	 * @return {Text|Tag|undefined} The Snow object at the index.
	**/
	p.get=function(x){
		return this.value[x];
	}
	
	/**
	 * @export
	 *
	 * @param {number} x - The index to set.
	 * @param {Text|Tag} v - The new value.
	**/
	p.set=function(x,v){
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
	p.equals=function(x){
		if(x instanceof Section){
			x=x.value;
		}
		if(Array.isArray(x)){
			var y=this.value,yl=y.length;
			if(yl!=x.length){
				return false;
			}
			while(yl--){
				if(!y[yl].equals(x[yl])){
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
	p.visit=function(visitor,data){
		return visitor.visit_section(this,data);
	}
	
	/**
	 * @export
	 * @override
	 *
	 * @return {string} The section as a string.
	**/
	p.toString=function(){
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
	function Document(x,l,c){
		if(!(this instanceof Document)){
			return new Document(x);
		}
		
		Section.call(this,x,l,c);
	}
	p=Document.prototype=Object.create(p);
	p.constructor=Document;
	
	/**
	 * Use the visitor pattern to iterate over the document.
	 *
	 * @export
	 * @override
	 *
	 * @param {{visit_doc:function(!Flake,?)}} visitor - The visitor.
	 * @param {?=} data - Any data the visitor needs.
	**/
	p.visit=function(visitor,data){
		return visitor.visit_doc(this,data);
	}
	
	/**
	 * @export
	 * @override
	 *
	 * @return {string} The document as a string.
	**/
	p.toString=function(){
		return this.value.join("");
	}
	
	/**
	 * A common-use tag definition.
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
			
			return v;
		});
		build=build||Tag;
		
		var al=attrn.length;
		function TagBuilder(keys,vals,pos,l,c,extra){
			function nhas_attr(keys,attr,kl){
				while(kl--){
					if(attr.equals(keys[kl])){
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
			
			return build(keys,vals,pos,l,c,extra);
		}
		
		TagBuilder.attrs=attrn;
		
		return TagBuilder;
	}
	
	/**
	 * Array of error messages for conversion from error code.
	 * @const
	 * @type {Array.<string>}
	**/
	var errmsg=[
		"Colons are disallowed in unquoted text.",//COLON
		"Duplicate named attribute names.",//DUPLICATE
		"Forgot to assign a value to the named attribute.",//NO_VALUE
		"Unclosed tag.",//UNCLOSED_TAG
		"Expected the end of a section.",//UNCLOSED_SECTION
		"Unexpected close bracket ]. Did you forget to close a tag?",//MIXED
		'Missing terminating " character.',//UNCLOSED_DQ
		"Missing terminating ' character.",//UNCLOSED_SQ
		'Missing terminating ` character.'//UNCLOSED_BQ
	];
	
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
		
		if(typeof msg=="number"){
			this.code=msg;
			msg=errmsg[msg];
		}
		else{
			this.code=0;
		}
		
		var err=this.base=Error.call(this,msg+(
			typeof line!="undefined" && typeof col!="undefined"?
				" (Ln: "+line+" Col: "+col+")":""
			)
		);
		
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
	p=ParseError.prototype=Object.create(Error.prototype);
	p.constructor=ParseError;
	/** @const **/ p.name="ParseError";
	Object.defineProperty(p,"stack",{
		get:function(x){
			var stack=this.base.stack;
			if(typeof stack!="undefined"){
				return stack;
			}
			
			return "Stack trace not supported by this environment";
		}
	});
	
	/** @const **/ var COLON=ParseError.COLON=1,
	/** @const **/ DUPLICATE=ParseError.DUPLICATE=2,
	/** @const **/ NO_VALUE=ParseError.NO_VALUE=3,
	/** @const **/ UNCLOSED_TAG=ParseError.UNCLOSED_TAG=4,
	/** @const **/ UNCLOSED_SECTION=ParseError.UNCLOSED_SECTION=5,
	/** @const **/ MIXED=ParseError.MIXED=6,
	/** @const **/ UNCLOSED_DQ=ParseError.UNCLOSED_DQ=7,
	/** @const **/ UNCLOSED_SQ=ParseError.UNCLOSED_SQ=8,
	/** @const **/ UNCLOSED_BQ=ParseError.UNCLOSED_BQ=9;
	
	/**
	 * Shared regexes.
	 * @type {RegExp}
	**/
	var NEWLINE=/\r\n?|[\n\x85\v\f\u2028\u2029]/m,
		SPACE=/\s+/gm,
		
		QUOTED_TEXT=
		/"((?:[^\\"]|\\[^])*)"|'((?:[^\\']|\\[^])*)'|`((?:[^\\`]|\\[^])*)`/gm,
		UNQUOTED_TEXT=/(?:[^\s{:}\[\]"'`\\]|\\[^])+/gm,
		
		DOC_TEXT=/(?:[^\\{]|\\[^]|\\$)*/gm,
		SEC_TEXT=/(?:[^\\{\]]|\\[^])*/gm,
		
		DOC_REPL=new RegExp("\\\\([\\\\{])|("+NEWLINE.source+")","gm"),
		SEC_REPL=new RegExp("\\\\([\\\\{\\]])|("+NEWLINE.source+")","gm"),
		DQ_REPL=new RegExp('\\\\([\\\\"])|('+NEWLINE.source+')',"gm"),
		SQ_REPL=new RegExp("\\\\([\\\\'])|("+NEWLINE.source+")","gm"),
		BQ_REPL=new RegExp("\\\\([\\\\`])|("+NEWLINE.source+')',"gm"),
		UNQ_REPL=new RegExp(
			"\\\\([\\s{:}\\[\\]\"'`\\\\])|("+NEWLINE.source+')',"gm"
		);
	
	//Used for replacements of newline -> \n and \\special -> special
	function normalize($0,$1,$2){
		return $2 || NEWLINE.test($1)?"\n":$1;
	}
	
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
			if(x.equals(keys[i])){
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
				
				return ps.build(keys,vals,pos,line,col,extra);
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
					throw new ParseError(DUPLICATE,ps.line,ps.col);
				}
			}
			else{
				//Just a normal position attribute
				pos.push(key);
			}
		}
		
		throw new ParseError(UNCLOSED_TAG,line,col);
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
					new Text(res[0].replace(SEC_REPL,normalize),ps.col,ps.line)
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
			throw new ParseError(UNCLOSED_SECTION,line,col);
		}
		++ps.pos;
		++ps.col;
		
		return new Section(elems,line,col);
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
				var text=v[1],qr=DQ_REPL;
			}
			else if(v[2]){
				var text=v[2],qr=SQ_REPL;
			}
			//v[3]
			else{
				var text=v[3],qr=BQ_REPL;
			}
			
			return new Text(text.replace(qr,normalize),line,col);
		}
		
		//Unquoted text
		if(v=maybe(text,ps,UNQUOTED_TEXT)){
			return new Text(v[0].replace(UNQ_REPL,normalize),line,col);
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
			throw new ParseError(UNCLOSED_TAG,ps.line,ps.col);
		}
		
		var c=text[ps.pos];
		switch(c){
			case '"':
				throw new ParseError(UNCLOSED_DQ,ps.line,ps.col);
			case "'":
				throw new ParseError(UNCLOSED_SQ,ps.line,ps.col);
			case '`':
				throw new ParseError(UNCLOSED_BQ,ps.line,ps.col);
			case ']':
				throw new ParseError(MIXED,ps.line,ps.col-1);
			case "}":
				throw new ParseError(
					NO_VALUE,ps.colonline,ps.coloncol
				);
			case ":":
				throw new ParseError(COLON,ps.line,ps.col);
		}
		
		//Parser logic errors
		
		if(SPACE.test(c)){
			throw new ParseError(
				"Expected a value, found whitespace. "+
				"There's a problem with the API's parser code.",
				ps.line,ps.col
			);
		}
		
		//reserved for cosmic ray errors
		throw new ParseError(
			'Something went horribly wrong. Expected value, got '+
			JSON.stringify(
				text.slice(ps.pos,ps.pos+8)+
				(ps.pos+8>=text.length)?"":"..."
			),ps.line,ps.col
		);
	}
	
	/**
	 * The main Snow parser.
	 *
	 * @export
	 * @struct
	 * @constructor
	 *
	 * @param {(object|function(Array.<Flake>,Array.<Flake>,Array.<Flake>,number,number,number,?):Tag)=} ts - The tagset to use with the parser.
	**/
	function Parser(ts){
		if(!(this instanceof Parser)){
			return new Parser(ts);
		}
		
		//Parsing
		if(typeof ts=="object"){
			this.build=function(keys,vals,pos,l,c,p,extra){
				var name=pos[0];
				//x has to be a string for it to match anything in ts.
				if(name instanceof Text && name.value in ts){
					return ts[name.value](keys,vals,pos,l,c,p,extra);
				}
				
				return new Tag(keys,vals,pos,l,c,p);
			}
		}
		else if(typeof ts=="function"){
			this.build=ts;
		}
		else{
			this.build=Tag;
		}
	}
	p=Parser.prototype;
	p.constructor=Parser;
	
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
	 * @return {Document}
	**/
	p.parse=function(text,extra){
		text=text.toString();
		var pos=(text.length>0 && text[0]=="\ufeff")?1:0;
		var ps={
			pos:pos,
			line:1,
			col:0,
			colonline:1,
			coloncol:0,
			build:this.build
		};
		
		var elems=[],tl=text.length;
		//Quits when neither is true.
		var tx,tg;
		
		do{
			var res=maybe(text,ps,DOC_TEXT);
			if(res && res[0]){
				elems.push(
					new Text(
						res[0].replace(DOC_REPL,normalize),ps.line,ps.col
					)
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
	 * Main function for making the async parser possible.
	 *
	 * @const
	 * @type {function(function())}
	**/
	var nextTick=
		typeof process!="undefined" && typeof process.nextTick=="function"?
			process.nextTick:function(call){
				setTimeout(call,0);
			}
	
	/**
	 * Parse the given Snow document asynchronously.
	 *
	 * Because of the highly recursive nature of Snow document parsing,
	 *  this is accomplished by smashing all the parsing functions into a
	 *  single function using a pseudo-goto structure. At the end of the
	 *  processing per loop, either process.nextTick(...) or setTimeout(...,0)
	 *  is called to yield processing to the rest of the program.
	 *
	 * When an error occurs or the document is fully parsed, the provided
	 *  error-first callback function is called.
	 *
	 * @throws {TypeError}
	 *
	 * @export
	 *
	 * @param {string} s - The document text.
	 * @param {function(!ParseError,!Document)} ret - The callback to call
	 *  once parsing finishes.
	 * @param {?} extra - Any extra data for parsing hooks.
	 *
	 * @return {Document}
	**/
	p.parseAsync=function(text,ret,extra){
		/**
		 * Pseudo-labels
		 *
		 * @const
		 * @type {number}
		**/
		var $DOC_TEXT=1,
			$TAG=2,$TAG_COLON=3,$TAG_KEY=4,
			$VALUE_TEXT=5,$VALUE_TAG=6,$VALUE_ERR=7,
			$SEC_START=8,$SEC_BODY=9;
		
		function innerParseAsync(next,text,ps,ret,extra){
			//Avoid redefining this all over the place
			var m;
			
			switch(next){
				case $DOC_TEXT:
					if(ps.val){
						ps.doc.push(ps.val);
					}
					else{
						if(ps.pos>=text.length){
							ret(null,new Document(ps.doc,1,0,ps.bom));
							return;
						}
					}
					
					if((m=maybe(text,ps,DOC_TEXT)) && m[0]){
						ps.doc.push(new Text(
							m[0].replace(DOC_REPL,normalize),
							ps.line,ps.col
						));
					}
					ps.callstack.push($DOC_TEXT);
					//next=$TAG;break;
				
				case $TAG:
					ps.val=null;
					if(text[ps.pos]!="{"){
						//"return" null
						next=ps.callstack.pop();
						break;
					}
					
					ps.tagstack.push(
						ps.toptag={
							keys:[],vals:[],pos:[],
							line:ps.line,col:ps.col++,p:ps.pos++
						}
					);
					
					/*
					Either TAG or TAG_COLON can fall through to 
					 TAG_KEY, but TAG_COLON can be "called" more than
					 once per tag parsing circuit, and thus can be
					 potentially more efficient. TAG is only more
					 efficient for tags like {tag}
					*/
					next=$TAG_KEY;
					break;
				
				case $TAG_COLON:
					maybe(text,ps,SPACE);
					if(text[ps.pos]==":"){
						if(index(ps.toptag.keys,ps.val)!==null){
							ret(new ParseError(
								DUPLICATE,ps.line,ps.col
							),null);
							return;
						}
						ps.toptag.keys.push(ps.val);
						++ps.pos;
						++ps.col;
						maybe(text,ps,SPACE);
						ps.callstack.push($TAG_KEY);
						next=$VALUE_TEXT;
						break;
					}
					ps.toptag.pos.push(ps.val);
					ps.val=null;
					//next=$TAG_KEY;break;
				
				case $TAG_KEY:
					if(ps.val){
						ps.toptag.vals.push(ps.val);
					}
					maybe(text,ps,SPACE);
					
					//No need to check for pos<=tl because VALUE_* will catch
					// any in-tag EOF error
					if(text[ps.pos]=="}"){
						++ps.pos;
						++ps.col;
						var tag=ps.tagstack.pop();
						ps.toptag=ps.tagstack[ps.tagstack.length-1];
						ps.val=this.build(
							tag.keys,tag.vals,tag.pos,
							tag.line,tag.col,tag.p,
							extra
						);
						next=ps.callstack.pop();
						break;
					}
					//Once the value is determined, goto TAG_COLON
					ps.callstack.push($TAG_COLON);
					//next=$VALUE_TEXT;break;
				
				case $VALUE_TEXT:
					if(m=maybe(text,ps,QUOTED_TEXT)){
						var tr,qr;
						if(m[1]){
							tr=m[1];
							qr=DQ_REPL;
						}
						else if(m[2]){
							tr=m[2];
							qr=SQ_REPL;
						}
						else if(m[3]){
							tr=m[3];
							qr=BQ_REPL;
						}
						
						ps.val=new Text(
							tr.replace(qr,normalize),
							ps.line,ps.col
						);
					}
					else if(m=maybe(text,ps,UNQUOTED_TEXT)){
						ps.val=new Text(
							m[0].replace(UNQ_REPL,normalize),
							ps.line,ps.col
						);
					}
					else{
						ps.callstack.push($VALUE_TAG);
						next=$TAG;
						break;
					}
					
					//Successful, return to next block
					next=ps.callstack.pop();
					break;
				
				case $VALUE_TAG:
					if(ps.val){
						//Successful, return to next block
						next=ps.callstack.pop();
						break;
					}
					//next=$SEC_START;break;
				
				case $SEC_START:
					//Sections are the last checked value - if it's not there,
					// it MUST be an error
					if(text[ps.pos]!='['){
						/*
						Snow errors are very predictable, so check for common
						mistakes. By this point, we know the next character is
						one of the start of quoted text, ], }, EOF, or whitespace.
						Whitespace is an error in the parsing logic, but is
						predictable. If it's not any of these, it's completely
						unknown what's wrong.
						*/
						
						//check for EOF
						if(ps.pos>=text.length){
							ret(new ParseError(
								UNCLOSED_TAG,
								ps.toptag.line,ps.toptag.col
							),null);
							return;
						}
						
						var c=text[ps.pos];
						
						switch(c){
							case '"':
								ret(new ParseError(
									UNCLOSED_DQ,
									ps.line,ps.col
								),null);
								return;
							case "'":
								ret(new ParseError(
									UNCLOSED_SQ,
									ps.line,ps.col
								),null);
								return;
							case '`':
								ret(new ParseError(
									UNCLOSED_BQ,
									ps.line,ps.col
								),null);
								return;
							case ']':
								var p=ps.secstack.pop();
								ret(new ParseError(
									MIXED,
									p.line,p.col-1
								),null);
								return;
							case "}":
								ret(new ParseError(
									NO_VALUE,
									ps.coloncol,ps.colonline
								),null);
								return;
							case ":":
								ret(new ParseError(
									COLON,
									ps.line,ps.col
								),null);
								return;
						}
						
						if(/\s/m.test(c)){
							ret(new ParseError(
								"Expected a value, found whitespace. "+
								"There's a problem with the API's  parser code.",
								ps.line,ps.col
							),null);
							return;
						}
						
						//reserved for cosmic ray errors
						ret(new ParseError(
							'Something went horribly wrong. '+
							'Expected value, got "'+(
								text.slice(ps.pos,ps.pos+8)+
								(ps.pos+8>=text.length)?"":"..."
							)+'"',ps.line,ps.col
						),null);
						return;
					}
					++ps.pos;
					++ps.col;
					ps.secstack.push([]);
					//next=$SEC_BODY;break;
				
				case $SEC_BODY:
					var ss=ps.secstack[ps.secstack.length-1];
					if(ps.val!==null){
						ss.push(ps.val);
					}
					
					if((m=maybe(text,ps,SEC_TEXT)) && m[0]){
						ss.push(new Text(
							m[0].replace(SEC_REPL,normalize),
							ps.line,ps.col
						));
					}
					
					if(ps.pos>=text.length){
						ret(new ParseError(
							UNCLOSED_SECTION,ps.line,ps.col
						),null);
						return;
					}
					
					if(text[ps.pos]==']'){
						++ps.pos;
						++ps.col;
						ps.val=new Section(ss,ps.line,ps.col,ps.pos);
						//sections must come from the value circuit
						next=ps.callstack.pop();
						break;
					}
					ps.callstack.push($SEC_BODY);
					next=$TAG;
					break;
			}
			
			var self=this;
			nextTick(function(){
				innerParseAsync.call(self,next,text,ps,ret,extra);
			});
		}
		
		if(typeof ret!="function"){
			throw new TypeError(
				"snow.parseAsync must be given a callback."
			);
		}
		
		var bom=(text.length>0 && text[0]=="\ufeff")|0,self=this;
		nextTick(function(){
			innerParseAsync.call(self,$DOC_TEXT,text,{
				bom:bom,
				pos:bom,
				line:1,
				col:bom,
				colonline:1,
				coloncol:0,
				doc:[],tagstack:[],secstack:[],toptag:null,
				val:null,callstack:[]
			},ret,extra);
		});
	}
	
	/**
	 * Shorthand for parsing a Snow document with the given tagset.
	 *
	 * @param {string} s - The Snow document.
	 * @param {(object|function(Array.<Flake>,Array.<Flake>,Array.<Flake>,number,number,number,?):Tag)=} ts - The tagset.
	 * @param {?} extra - Any extra data for use in parsing hooks.
	 *
	 * @return {Document}
	**/
	function parse(s,ts,extra){
		return new Parser(ts).parse(s,extra);
	}
	
	/**
	 * Shorthand for asynchronously parsing a Snow document with the given
	 *  tagset.
	 *
	 * @param {string} s - The snow document.
	 * @param {function(!ParseError,!Document)} ret - The callback to call
	 *  on success or error.
	 * @param {(object|function(Array.<Flake>,Array.<Flake>,Array.<Flake>,number,number,number,?):!Tag)=} ts - The tagset.
	 * {?} extra - Any extra data for use in parsing hooks.
	 *
	 * @return {Document}
	**/
	function parseAsync(s,ret,ts,extra){
		new Parser(ts).parseAsync(s,ret,extra);
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
	 * @param {(object|{get:function(Array.<Flake>,Array.<Flake>,Array.<Flake>,?:!Tag,mini_section:function})=} ts A tagset (optional).
	 *
	 * @return {string} The smallest possible textual representation of the
	 *  Snow document.
	**/
	function minify(x,ts){
		if(!(x instanceof Flake)){
			throw new TypeError("Attempted to minify non-Snow object");
		}
		
		function d_mini_sec(sec,ts){
			return "["+sec.value.map(function(v){
				if(v instanceof snow.Text){
					return v;
				}
				
				return inner_mini(v,ts);
			}).join("")+"]";
		}
		
		function d_mini_doc(doc,ts){
			return doc.value.map(function(v){
				if(v instanceof snow.Text){
					return v;
				}
				
				return inner_mini(v,ts);
			}).join("");
		}
		
		function d_mini_tag(tag){
			return tag;
		}
		
		if(typeof ts=="undefined"){
			ts={}
		}
		
		ts={
			mini_doc:ts.mini_doc||d_mini_doc,
			mini_section:ts.mini_section||d_mini_sec,
			mini_tag:ts.mini_tag||d_mini_tag,
		};
		
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
		function inner_mini(x,ts){
			var LEFT=1,RIGHT=2,BOTH=LEFT|RIGHT;
			
			function is_unquoted(x){
				if(x instanceof Text){
					return /^[^\s{:}\[\]\\"'`]+$/.test(x.value);
				}
				
				return false;
			}
			
			//Tag minification utility function
			var MAX_SCORE=5;
			function utility(a,b){
				return 3*(2*a!=b)+b;
			}
			
			if(x instanceof Text){
				//Text can be made (possibly) smaller in exactly one way -
				// when just one character needs to be escaped, it can be
				// made unquoted (1 character smaller), but doing so is only
				// more optimal when in a tag and neither side needs a space
				// to disambiguate, something only the tag can determine and
				// is fairly hard to integrate into the algorithm.
				return x.toString();
			}
			else if(x instanceof Section){
				//Outsource any section minification to the tagset -
				// can't be done generically
				return ts.mini_section(x,ts);
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
				
				x=ts.mini_tag(x,ts);
				var named=[],keys=x.keys,vals=x.vals;
				for(var i=keys.length;i--;){
					var k=keys[i],v=vals[i];
					named.push({
						value:inner_mini(k,ts)+":"+inner_mini(v,ts),
						lr:(is_unquoted(k)?0:LEFT)|(is_unquoted(v)?0:RIGHT)
					});
				}
				
				//Sort 11 to 00
				named.sort(function(a,b){
					return a.lr-b.lr;
				});
				
				var out=[{lr:RIGHT}],pos=x.pos,pl=pos.length;
				for(var i=0;i<pl;++i){
					var e=pos[i];
					out.push({
						value:inner_mini(e,ts),
						lr:is_unquoted(e)?0:BOTH
					});
				}
				out.push({lr:LEFT});
				
				while(named.length){
					var i=out.length-1;
					var name=named.pop(),best=1,score=0,left=out[i].lr;
					var nlr=name.lr,nl=nlr&LEFT,nr=nlr&RIGHT;
					for(;--i;){
						var right=left;
						left=out[i].lr;
						
						var u=utility(nl,left&RIGHT)+utility(right&LEFT,nr);
						if(u>score){
							score=u;
							best=i;
							if(score==MAX_SCORE){
								break;
							}
						}
					}
					
					out.splice(best,0,name);
				}
				
				console.log(out);
				
				//named now contains all elements sorted into the best
				// possible arrangement. Concatenate with spaces based on if
				// they're needed.
				var s="{",ol=out.length-1,left=out[0].lr;
				for(var i=1;i<ol;++i){
					var e=out[i];
					if((left&RIGHT)+((left=e.lr)&LEFT)==0){
						s+=" ";
					}
					
					s+=e.value;
				}
				return s+"}";
			}
			else{
				throw new Error("Cannot minify unknown "+(typeof x));
			}
		}
		
		if(x instanceof Document){
			return ts.mini_doc(x,ts);
		}
		return inner_mini(x,ts);
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
		"parseAsync":parseAsync,
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