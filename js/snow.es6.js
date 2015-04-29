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
 * Used in Parser.parse_tag and minify - returns the index of a Snow object
 *  in the given array (like Array.indexOf, but works with Snow objects).
 *
 * @param keys The array to look in.
 * @param x The object to look for.
 *
 * @return The index of the Snow object, or if it isn't in keys, null.
**/
export function index(keys,x){
	if(!(x instanceof Flake)){
		x=new Text(x.toString());
	}
	
	let i=keys.length;
	while(i-- && !x.equals(keys[i])){}
	
	return i;
}

/**
 * Base class for all Snow objects.
 *
 * This allows distinguishing Snow objects using the syntax:
 *  x instanceof snow.Flake
 *
 * @param line The line at which the object was parsed.
 * @param col The column at which the object was parsed.
**/
export class Flake{
	constructor(line=null,col=null){
		this.line=line;
		this.col=col;
	}
}

/**
 * A Snow tag, acts as an associative array from Snow objects/integers
 *  to Snow objects.
 *
 * @param keys An array of the names of named attributes.
 * @param vals An array of the values of named attributes.
 * @param pos  An array of the positional attributes.
**/
export class Tag extends Flake{
	constructor(keys=[],vals=[],pos=[],line=null,col=null){
		super(line,col);
		
		this.keys=keys;
		this.vals=vals;
		this.pos=pos;
	}
	
	/**
	 * @return The string version of the tag.
	**/
	toString(){
		const keys=this.keys,kl=keys.length,vals=this.vals;
		const pos=this.pos,pl=pos.length,content=[];
		
		if(pos[0]){
			content.push(pos[0]);
		}
		
		for(let i=0;i<kl;++i){
			content.push(keys[i]+":"+vals[i]);
		}
		for(let i=1;i<pl;++i){
			content.push(pos[i]);
		}
		
		return "{"+content.join(" ")+"}";
	}
	
	/**
	 * Compare this object to another.
	 *
	 * @param x The object to compare to the tag.
	 *
	 * @return Whether or not the tag is equal to another object.
	**/
	equals(x){
		if(x instanceof Tag){
			const keys=this.keys,okeys=x.keys;
			const pos=this.pos,opos=x.pos;
			let kl=keys.length,pl=pos.length;
			
			//If the lengths are different, they can't be the same
			if(kl!=okeys.length || pl!=opos.length){
				return false;
			}
			
			//Check the named attributes.
			const vals=this.vals,ovals=x.vals;
			while(kl--){
				const k=keys[kl],oki=index(okeys,k);
				if(oki<0 || !vals[kl].equals(ovals[oki])){
					return false;
				}
			}
			
			//Check the positional attributes.
			while(pl--){
				if(!pos[pl].equals(opos[pl])){
					return false;
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
	 * @param x The key to retrieve the object, either a Snow object for
	 *  named attributes or integer for positional attributes.
	 *
	 * @return The value at the given key.
	**/
	get(x){
		if(typeof x=="number"){
			return this.pos[i];
		}
		
		const i=index(this.keys,x);
		if(i>=0){
			return this.vals[i];
		}
	}
	
	/**
	 * @param x The key of the object to find.
	 * @return Whether or not the tag has a value with the given key.
	**/
	has(x){
		if(typeof x=="number"){
			return x>=0 && x<this.pos.length;
		}
		
		return index(this.keys,x)>=0;
	}
	
	/**
	 * Use the visitor pattern to iterate over a Snow document.
	 *
	 * @param visitor The visitor.
	 * @param data Any data the visitor needs.
	**/
	visit(visitor,data){
		return visitor.visit_tag(this,data);
	}
}

/**
 * Snow text object (either (un)quoted tag text or section/doc text).
 *
 * @param x The text to use. 
**/
export class Text extends Flake{
	constructor(x="",l=null,c=null){
		super(l,c);
		
		this.value=x;
	}
	
	/**
	 * @return The text object as a string (assuming tag text).
	**/
	toString(){
		const x=this.value;
		if(x.match(/^[^\s{:}\[\]"'`]+$/g)){
			return x;
		}
		
		function count(x,c){
			let i=0,cc=0;
			while(i=x.indexOf(c,i)+1){
				++cc;
			}
			return cc;
		}
		
		const m1=count(x,'"'),m2=count(x,"'"),m3=count(x,'`');
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
	 * @param x The object to compare to the text.
	 *
	 * @return Whether or not the object is equivalent to the text.
	**/
	equals(x){
		if(x instanceof Text){
			return this.value==x.value;
		}
		
		return this.value==x.toString();
	}
	
	/**
	 * Use the visitor pattern to iterate over a text object.
	 *
	 * @param visitor The visitor.
	 * @param data Any data the visitor needs.
	**/
	visit(visitor,data){
		return visitor.visit_text(this,data);
	}
	
	/**
	 * @return The content of the object as a UTF-32 encoded typed array.
	**/
	toUint32Array(){
		const data=[],value=this.value,vl=value.length;
		
		for(let i=0;i<vl;++i){
			const x=value.charCodeAt(i);
			if(x>=0xd800 && x<=0xd8ff && i+1<vl){
				const y=value.charCodeAt(++i);
				data.push(((x-0xd800)<<10)|(y-0xdc00)+0x010000);
			}
			else{
				data.push(x);
			}
		}
		
		return new Uint32Array(data);
	}
	
	/**
	 * @param at The index of the code point.
	 *
	 * @return The Unicode code point at the given index.
	**/
	get(at){
		return this.value.codePointAt(at);
	}
	
	get length(){
		const SURPAIR=/[\ud800-\udbff][\udc00-\udfff]/g,value=this.value;
		let c=0;
		SURPAIR.lastIndex=0;
		
		while(SURPAIR.test(value)){
			++c;
		}
		
		return value.length-c;
	}
}

/**
 * A Snow section object, for storing text and tags together as markups.
 *
 * @param x The initial value of the section.
**/
export class Section extends Flake{
	constructor(x=[],l=null,c=null){
		super(l,c);
		
		this.value=x;
	}
	
	/**
	 * @return The section as a string.
	**/
	toString(){
		return '['+this.value.join("")+']';
	}
	
	/**
	 * @param x The object to compare to the section.
	 * @return Whether or not the objects were equivalent.
	**/
	equals(x){
		if(x instanceof Section){
			x=x.value;
		}
		else if(!Array.isArray(x)){
			return false;
		}
		
		let y=this.value,yl=y.length;
		
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
	
	/**
	 * @param x The index to get.
	 * @return The Snow object at the index.
	**/
	get(x){
		return this.value[x];
	}
	
	/**
	 * Use the visitor pattern to iterate over the section.
	 *
	 * @param visitor The visitor.
	 * @param data Any data required by the visitor.
	**/
	visit(visitor,data){
		return visitor.visit_section(this,data);
	}
}

/**
 * A Snow document (a subset of section)
 *
 * @param The initial value of the document.
**/
export class Document extends Section{
	constructor(x=[],l=null,c=null){
		super(x,l,c);
	}
	
	/**
	 * @return The document as a string.
	**/
	toString(){
		return this.value.join("");
	}
	
	/**
	 * Use the visitor pattern to iterate over the document.
	 *
	 * @param visitor The visitor.
	 * @param data Any data the visitor needs.
	**/
	visit(visitor,data){
		return visitor.visit_doc(this,data);
	}
}

function build_tag(k,v,p,l,c){
	return new Tag(k,v,p,l,c);
}

/**
 * A common-use tag definition.
 *
 * @param attrn A list of the names of attributes the tag has.
 * @param build A function that constructs a tag from its attributes.
 *
 * @return The constructed tag
**/
export function Tagdef(attrn=[],build=build_tag){
	attrn=attrn.map(function(v){
		if(typeof v=="string"){
			return new Text(v);
		}
		
		return v;
	});
	
	const al=attrn.length;
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
		const kl=keys.length,pl=pos.length;
		for(var i=0;i<al && i<pl;++i){
			const attr=attrn[i];
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
 * @param msg The error message.
 * @param line The line number in the Snow document.
 * @param col The column in the Snow document.
**/
export class ParseError extends Error{
	constructor(msg,line,col){
		if(typeof msg=="number"){
			var code=msg;
			msg=ermsg[msg];
		}
		else{
			var code=0;
		}
		
		super(typeof line!="undefined" && typeof col!="undefined"?
			msg+" (Ln: "+line+" Col: "+col+")":msg
		);
		
		this.code=code;
		this.line=line;
		this.col=col;
	}
	
	static name="ParseError";
}

const COLON=ParseError.COLON=1,
	DUPLICATE=ParseError.DUPLICATE=2,
	NO_VALUE=ParseError.NO_VALUE=3,
	UNCLOSED_TAG=ParseError.UNCLOSED_TAG=4,
	UNCLOSED_SECTION=ParseError.UNCLOSED_SECTION=5,
	MIXED=ParseError.MIXED=6,
	UNCLOSED_DQ=ParseError.UNCLOSED_DQ=7,
	UNCLOSED_SQ=ParseError.UNCLOSED_SQ=8,
	UNCLOSED_BQ=ParseError.UNCLOSED_BQ=9;

/**
 * Shared regexes.
**/
const NEWLINE=/\r\n?|[\n\x85\v\f\u2028\u2029]/m,
	SPACE=/\s+/gm,
	
	QUOTED_TEXT=
	/"((?:[^\\"]|\\[^])*)"|'((?:[^\\']|\\[^])*)'|`((?:[^\\`]|\\[^])*)`/gm,
	UNQUOTED_TEXT=/(?:[^\s{:}\[\]"'`\\]|\\[^])+/gm,
	
	DOC_TEXT=/(?:[^\\{]|\\[^]|\\$)*/gm,
	SEC_TEXT=/(?:[^\\{\]]|\\[^])*/gm,
	
	DOC_REPL=new RegExp(`\\\\([\\\\{])|(${+NEWLINE.source})`,"gm"),
	SEC_REPL=new RegExp(`\\\\([\\\\{\\]])|(${NEWLINE.source})`,"gm"),
	DQ_REPL=new RegExp(`\\\\([\\\\"])|(${NEWLINE.source})`,"gm"),
	SQ_REPL=new RegExp(`\\\\([\\\\'])|(${NEWLINE.source})`,"gm"),
	BQ_REPL=new RegExp(`\\\\([\\\\\`])|(${NEWLINE.source})`,"gm"),
	UNQ_REPL=new RegExp(
		`\\\\([\\s{:}\\[\\]"'\`\\\\])|(${NEWLINE.source})`,"gm"
	);

//Used for replacements of newline -> \n and \\special -> special
function normalize($0,$1,$2){
	return $2 || NEWLINE.test($1)?"\n":$1;
}

/**
 * Try to match the regex if possible, else return null
 *
 * @param r The regex to match.
 * @return The result of the match.
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
 * Attempt to parse a tag, else return null.
 *
 * @param extra Any extra data for parsing hooks.
 *
 * @return The parsed tag.
**/
function parse_tag(text,ps,extra){
	if(text[ps.pos]!="{"){
		//Not a tag
		return null;
	}
	const line=ps.line,col=ps.col,p=ps.pos,tl=text.length;
	
	++ps.pos;
	++ps.col;
	
	const keys=[],vals=[],pos=[];
	
	while(ps.pos<tl){
		maybe(text,ps,SPACE);
		if(text[ps.pos]=="}"){
			++ps.pos;
			++ps.col;
			
			return ps.build(keys,vals,pos,line,col,extra);
		}
		
		const key=parse_value(text,ps,extra);
		maybe(text,ps,SPACE);
		
		if(text[ps.pos]==":"){
			key.colon={line:ps.line,col:ps.col};
			
			++ps.pos;
			++ps.col;
			
			ps.lastrel=ps.pos;
			maybe(text,ps,SPACE);
			
			const val=parse_value(text,ps,extra),x=index(keys,key);
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
 * @param extra Any extra data for parsing hooks.
 *
 * @return The parsed section.
**/
function parse_section(text,ps,extra){
	if(text[ps.pos]!="["){
		//Not a section
		return null;
	}
	const line=ps.line,col=ps.col,pos=ps.pos;
	++ps.pos;
	++ps.col;
	
	const elems=[],tl=text.length;
	//Quits when neither is true.
	let tx,tg;
	
	do{
		let res=maybe(text,ps,SEC_TEXT);
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
 * @param extra Any extra data for parsing hooks.
 *
 * @return The value.
**/
function parse_value(text,ps,extra){
	const line=ps.line,col=ps.col,pos=ps.pos;
	let v=maybe(text,ps,QUOTED_TEXT);
	//Quoted text
	if(v){
		const [text,qr]=v[1]?
			[v[1],DQ_REPL]:
			v[2]?
				[v[2],SQ_REPL]:
				[v[3],BQ_REPL];
		
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
	
	const c=text[ps.pos];
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
 * Main function for making the async parser possible.
**/
var nextTick=
	typeof process!="undefined" && typeof process.nextTick=="function"?
		process.nextTick:function(call){
			setTimeout(call,0);
		}

/**
 * The main Snow parser.
 *
 * @param ts The tagset to use with the parser.
**/
export class Parser{
	constructor(ts){
		//Parsing
		if(typeof ts=="object"){
			this.build=function(k,v,p,l,c,e){
				var name=pos[0];
				//x has to be a string for it to match anything in ts.
				if(name instanceof Text && name.value in ts){
					return ts[name.value](k,v,p,l,c,e);
				}
				
				return new Tag(k,v,p,l,c,e);
			}
		}
		else if(typeof ts=="function"){
			this.build=ts;
		}
		else{
			this.build=build_tag;
		}
	}

	/**
	 * Parse the given Snow document.
	 *
	 * @params The document text.
	 * @param extra Any extra data for parsing hooks.
	**/
	parse(text,extra){
		text=text.toString();
		
		let pos=(text.length>0 && text[0]=="\ufeff")?1:0,
			ps={
				pos:pos,
				line:1,
				col:0,
				colonline:1,
				coloncol:0,
				build:this.build
			},elems=[],tl=text.length,
			//Quits when neither is true.
			tx,tg;
		
		do{
			let res=maybe(text,ps,DOC_TEXT);
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
	 * Parse the given Snow document asynchronously.
	 *
	 * Because of the highly recursive nature of Snow document parsing,
	 *  this is accomplished by smashing all the parsing functions into a
	 *  single function using a pseudo-goto structure. At the end of the
	 *  processing per loop, either process.nextTick(...) or setTimeout(...,0)
	 *  is called to yield processing to the rest of the program.
	 *
	 * @param s The document text.
	 * @param ret The callback to call once parsing finishes.
	 * @param extra Any extra data for parsing hooks.
	 *
	 * @return A promise satisfying the parsing of the document.
	**/
	parseAsync(text,extra){
		return new Promise(function(ok,err){
			/**
			 * Pseudo-labels
			**/
			const $DOC_TEXT=1,
				$TAG=2,$TAG_COLON=3,$TAG_KEY=4,
				$VALUE_TEXT=5,$VALUE_TAG=6,$VALUE_ERR=7,
				$SEC_START=8,$SEC_BODY=9;
			
			function innerParseAsync(next,text,ps,extra){
				//Avoid redefining this all over the place
				let m;
				
				switch(next){
					case $DOC_TEXT:
						if(ps.val){
							ps.doc.push(ps.val);
						}
						else{
							if(ps.pos>=text.length){
								ok(new Document(ps.doc,1,0));
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
								err(new ParseError(DUPLICATE,ps.line,ps.col));
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
						
						//No need to check for pos<=tl because VALUE_* will
						// catch any in-tag EOF error
						if(text[ps.pos]=="}"){
							++ps.pos;
							++ps.col;
							const tag=ps.tagstack.pop();
							ps.toptag=ps.tagstack[ps.tagstack.length-1];
							ps.val=ps.build(
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
							let tr,qr;
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
						//Sections are the last checked value - if it's not
						// there, it MUST be an error
						if(text[ps.pos]!='['){
							/*
							Snow errors are very predictable, so check for
							common mistakes. By this point, we know the next
							character is one of the start of quoted text, ],
							}, EOF, or whitespace. Whitespace is an error in
							the parsing logic, but is predictable. If it's
							not any of these, it's completely unknown what's
							wrong.
							*/
							
							//check for EOF
							if(ps.pos>=text.length){
								err(new ParseError(
									UNCLOSED_TAG,
									ps.toptag.line,ps.toptag.col
								));
								return;
							}
							
							const c=text[ps.pos];
							
							switch(c){
								case '"':
									err(new ParseError(
										UNCLOSED_DQ,
										ps.line,ps.col
									));
									return;
								case "'":
									err(new ParseError(
										UNCLOSED_SQ,
										ps.line,ps.col
									));
									return;
								case '`':
									err(new ParseError(
										UNCLOSED_BQ,
										ps.line,ps.col
									));
									return;
								case ']':
									const p=ps.secstack.pop();
									err(new ParseError(
										MIXED,
										p.line,p.col-1
									));
									return;
								case "}":
									err(new ParseError(
										NO_VALUE,
										ps.coloncol,ps.colonline
									));
									return;
								case ":":
									err(new ParseError(
										COLON,
										ps.line,ps.col
									));
									return;
							}
							
							if(/\s/m.test(c)){
								err(new ParseError(
									"Expected a value, found whitespace. "+
									"There's a problem with the API's "+
									"parser code.",ps.line,ps.col
								));
								return;
							}
							
							//reserved for cosmic ray errors
							err(new ParseError(
								'Something went horribly wrong. '+
								'Expected value, got "'+(
									text.slice(ps.pos,ps.pos+8)+
									(ps.pos+8>=text.length)?"":"..."
								)+'"',ps.line,ps.col
							));
							return;
						}
						++ps.pos;
						++ps.col;
						ps.secstack.push([]);
						//next=$SEC_BODY;break;
					
					case $SEC_BODY:
						const ss=ps.secstack[ps.secstack.length-1];
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
							err(new ParseError(
								UNCLOSED_SECTION,ps.line,ps.col
							));
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
				
				nextTick(function(){
					innerParseAsync(next,text,ps,extra);
				});
			}
			
			const bom=(text.length>0 && text[0]=="\ufeff")|0;
			nextTick(function(){
				innerParseAsync($DOC_TEXT,text,{
					pos:bom,
					line:1,
					col:bom,
					colonline:1,
					coloncol:0,
					doc:[],tagstack:[],secstack:[],toptag:null,
					val:null,callstack:[]
				},extra);
			});
		});
	}
}

/**
 * Shorthand for parsing a Snow document with the given tagset.
 *
 * @param s The Snow document.
 * @param ts The tagset.
 * @param extra - Any extra data for use in parsing hooks.
**/
export function parse(s,ts,extra){
	return new Parser(ts).parse(s,extra);
}

/**
 * Shorthand for asynchronously parsing a Snow document with the given
 *  tagset.
 *
 * @param s The snow document.
 * @param ret The callback to call on success or error.
 * @param ts The tagset.
 * @param extra Any extra data for use in parsing hooks.
 *
 * @return a promise for the result.
**/
export function parseAsync(s,ret,ts,extra){
	return new Parser(ts).parseAsync(s,ret,extra);
}

/**
 * Shorthand for stringifying a Snow object.
 *
 * @param x The Snow object.
**/
export function stringify(x){
	return x.toString();
}

/**
 * Like stringification, but produces the most compact output possible.
 *
 * This is a separate function because it's slightly more costly to run
 *  and minification can in most cases hamper readability.
 *
 * @param x The Snow object to minify.
 * @param ts A tagset (optional).
 *
 * @return The smallest possible textual representation of the Snow document.
**/
export function minify(x,ts){
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