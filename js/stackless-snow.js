var Document=snow.Document,
	Section=snow.Section,
	Tag=snow.Tag,
	Text=snow.Text,
	ParseError=snow.ParseError;

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
function parse(text,build,extra){
	'use strict';
	
	if(typeof build!="function"){
		build=Tag;
	}
	
	//BOM is ignored
	var tl=text.length,bom=tl>0 && text[0]=="\ufeff",
		pos=bom|0,line=1,col=0,colonline=1,coloncol=0;
	
	function maybe(r){
		r.lastIndex=pos;
		var m=r.exec(text);
		if(m && m.index==pos){
			var lines=m[0].split(NEWLINE);
			if(lines.length>1){
				line+=lines.length-1;
				col=lines[lines.length-1].length;
			}
			else{
				col+=lines[0].length;
			}
			pos+=m[0].length;
			return m;
		}
		return null;
	}
	
	//Regexes used for iterative parsing (changes .lastIndex in maybe())
	var QUOTED_TEXT=
			/"((?:[^\\"]|\\.)*)"|'((?:[^\\']|\\.)*)'|`((?:[^\\`]|\\.)*)`/gm,
		UNQUOTED_TEXT=/(?:[^\s{:}\[\]"'`\\]|\\.)+/gm,
		DOC_TEXT_REG=/(?:[^\\{]|\\.)+/gm,
		NEWLINE=/\r\n|[\r\n\x85\v\f\u2028\u2029]/gm,
		SPACE=/\s+/gm;
	
	//Pseudo-labels
	var DOC_TEXT=0,
		TAG=1,TAG_COLON=2,TAG_KEY=3,
		VALUE_TEXT=4,VALUE_TAG=5,VALUE_ERR=6,
		SEC_START=7,SEC_BODY=8;
	
	var m;
	var doc=[],tagstack=[],secstack=[],val_try=[],toptag;
	var val=null,next=DOC_TEXT,callstack=[];
	
	var i=0;
	
	/**
	 * Q: WTF is this?
	 * A: This, my dear curious reader, is the product of someone's insane
	 *  desire to make a JS Snow parser as fast as possible. To do this,
	 *  function calls have been eliminated as the primary algorithmic
	 *  structure, instead opting for an "outside-in" approach which smashes
	 *  all of the functions together into a big spaghetti code mess of
	 *  pseudo-goto and labels using a switch-case.
	 *
	 *  All of this is done by manually managing a stack, stack frames, and
	 *  shared states all while carefully managing the flow of control using
	 *  these constructs.
	**/
	for(;;){
		if(++i>1000){
			throw new Error("1000 loops and no progress");
		}
		switch(next){
			case DOC_TEXT:
				if(val){
					doc.push(val);
				}
				else{
					if(pos>=tl){
						return new Document(doc,1,0,bom|0);
					}
				}
				
				var l=line,c=col,p=pos;
				if(m=maybe(DOC_TEXT_REG)){
					doc.push(new Text(
						m[0].replace(/\\([\\{])/g,"$1"),
						l,c,p
					));
				}
				callstack.push(DOC_TEXT);
				//next=TAG;continue;
			
			case TAG:
				val=null;
				if(text[pos]!="{"){
					//"return" null
					next=callstack.pop();
					continue;
				}
				toptag={
					keys:[],vals:[],pos:[],
					line:line,col:col++,p:pos++
				}
				tagstack.push(toptag);
				//Either TAG or TAG_COLON can fall through to TAG_KEY, but
				// TAG_COLON can be "called" more than once per tag parsing
				// circuit, and thus can be potentially more efficient. TAG
				// is only more efficient for tags like {tag}
				next=TAG_KEY;
				continue;
			
			case TAG_COLON:
				maybe(SPACE);
				if(text[pos]==":"){
					toptag.keys.push(val);
					++pos;
					++col;
					maybe(SPACE);
					callstack.push(TAG_KEY);
					next=VALUE_TEXT;
					continue;
				}
				toptag.pos.push(val);
				val=null;
				//next=TAG_KEY;continue;
			
			case TAG_KEY:
				if(val){
					toptag.vals.push(val);
				}
				maybe(SPACE);
				
				//No need to check for pos<=tl because VALUE_* will catch
				// any in-tag EOF error
				if(text[pos]=="}"){
					++pos;
					++col;
					var tag=tagstack.pop();
					toptag=tagstack[tagstack.length-1];
					val=build(
						tag.keys,tag.vals,tag.pos,
						tag.line,tag.col,tag.p,
						extra
					);
					next=callstack.pop();
					continue;
				}
				//Once the value is determined, goto TAG_COLON
				callstack.push(TAG_COLON);
				//next=VALUE_TEXT;continue;
			
			case VALUE_TEXT:
				if(m=maybe(QUOTED_TEXT)){
					var tr,qr;
					if(m[1]){
						tr=m[1];
						qr=/\\([\\"])/g;
					}
					else if(m[2]){
						tr=m[2];
						qr=/\\([\\'])/g;
					}
					else if(m[3]){
						tr=m[3];
						qr=/\\([\\`])/g;
					}
					
					val=new Text(tr.replace(qr,"$1"));
				}
				else if(m=maybe(UNQUOTED_TEXT)){
					val=new Text(
						m[0].replace(/\\([\s{:}\[\]"'`\\])/g,"$1")
					);
				}
				else{
					callstack.push(VALUE_TAG);
					next=TAG;
					continue;
				}
				
				//Successful, return to next block
				next=callstack.pop();
				continue;
			
			case VALUE_TAG:
				if(val){
					//Successful, return to next block
					next=callstack.pop();
					continue;
				}
				//next=SEC_START;continue;
			
			case SEC_START:
				//Sections are the last checked value - if it's not there,
				// it MUST be an error
				if(text[pos]!='['){
					/*
					Snow errors are very predictable, so check for common
					mistakes. By this point, we know the next character is
					one of the start of quoted text, ], }, EOF, or whitespace.
					Whitespace is an error in the parsing logic, but is
					predictable. If it's not any of these, it's completely
					unknown what's wrong.
					*/
					
					//check for EOF
					if(pos>=tl){
						throw new ParseError(
							"Reached end of string/file while "+
							"parsing a tag.",toptag.line,toptag.col
						);
					}
					
					var c=text[pos];
					
					if('"\'`'.indexOf(c)>=0){
						throw new ParseError(
							"Missing terminating "+c+" character",
							line,col
						);
					}
					
					if(c==']'){
						var p=secstack.pop();
						throw new ParseError(
							"Unexpected close bracket ]. "+
							"Did you forget to close a tag?",
							p.line,p.col-1
						);
					}
					
					if(c=='}'){
						throw new ParseError(
							"Forgot to assign a value to "+
							"the named attribute.",coloncol,colonline
						);
					}
					
					if(c==':'){
						throw new ParseError(
							"Colons are disallowed in unquoted text.",
							line,col
						);
					}
					
					if(SPACE.test(c)){
						throw new ParseError(
							"Expected a value, found whitespace. "+
							"There's a problem with the API's  parser code.",
							line,col
						);
					}
					
					//reserved for cosmic ray errors
					throw new ParseError(
						'Something went horribly wrong. '+
						'Expected value, got "'+(
							text.slice(pos,pos+8)+
							(pos+8>=tl)?"":"..."
						)+'"',line,col
					);
				}
				//next=SEC_BODY;continue;
			
			case SEC_BODY:
				var ss=secstack[secstack.length-1];
				if(val!==null){
					ss.push(val);
				}
				
				if(m=maybe(DOC_TEXT_REG,ps)){
					ss.push(new Text(m[0].replace(/\\([\\{])/g,"$1")));
				}
				
				if(pos>=tl){
					throw new ParseError(
						"Reached end of string/file while parsing section",
						line,col
					);
				}
				
				if(text[pos]==']'){
					++pos;
					++col;
					val=new Section(ss,line,col,pos);
					//sections must come from the value circuit
					next=VALUE_SEC;
					continue;
				}
				callstack.push(SEC_BODY);
				next=TAG;
				continue;
		}
	}
}

function optimized_parse(f,r,y){function l(a){a.lastIndex=c;if((a=a.exec(f))&&a.index==c){var b=a[0].split(z);1<b.length?(g+=b.length-1,d=b[b.length-1].length):d+=b[0].length;c+=a[0].length;return a}return null}"function"!=typeof r&&(r=function(a,b,c,d,e,f,g){return new Tag(a,b,c,d,e,f)});for(var m=f.length,v=0<m&&"\ufeff"==f[0],c=v|0,g=1,d=0,A=/"((?:[^\\"]|\\.)*)"|'((?:[^\\']|\\.)*)'|`((?:[^\\`]|\\.)*)`/gm,B=/(?:[^\s{:}\[\]"'`\\]|\\.)+/gm,w=/(?:[^\\{]|\\.)+/gm,z=/\r\n|[\r\n\x85\v\f\u2028\u2029]/gm,t=/\s+/gm,
e,u=[],h=[],x=[],a=null,b=0,k=[];;)switch(b){case 0:if(a)u.push(a);else if(c>=m)return new Document(u,1,0,v|0);var a=g,b=d,n=c;(e=l(w))&&u.push(new Text(e[0].replace(/\\([\\{])/g,"$1"),a,b,n));k.push(0);case 1:a=null;if("{"!=f[c]){b=k.pop();continue}h.push({keys:[],vals:[],pos:[],line:g,col:d++,p:c++});b=3;continue;case 2:l(t);if(":"==f[c]){h[h.length-1].keys.push(a);++c;++d;l(t);k.push(3);b=4;continue}h[h.length-1].pos.push(a);a=null;b=3;continue;case 3:a&&h[h.length-1].vals.push(a);l(t);if("}"==
f[c]){++c;++d;a=h.pop();a=r(a.keys,a.vals,a.pos,a.line,a.col,a.p,y);b=k.pop();continue}k.push(2);case 4:if(e=l(A)){var p,q;e[1]?(p=e[1],q=/\\([\\"])/g):e[2]?(p=e[2],q=/\\([\\'])/g):e[3]&&(p=e[3],q=/\\([\\`])/g);a=new Text(p.replace(q,"$1"))}else if(e=l(B))a=new Text(e[0].replace(/\\([\s{:}\[\]"'`\\])/g,"$1"));else{k.push(5);b=1;continue}b=k.pop();continue;case 5:if(a){b=k.pop();continue}case 7:if("["!=f[c]){if(c>=m)throw a=h.pop(),new ParseError("Reached end of string/file while parsing a tag.",a.line,
a.col);b=f[c];if(0<="\"'`".indexOf(b))throw new ParseError("Missing terminating "+b+" character",g,d);if("]"==b)throw n=spstack.pop(),new ParseError("Unexpected close bracket ]. Did you forget to close a tag?",n.line,n.col-1);if("}"==b)throw new ParseError("Forgot to assign a value to the named attribute.",0,1);if(":"==b)throw new ParseError("Colons are disallowed in unquoted text.",g,d);if(/\s+/gm.test(b))throw new ParseError("Expected a value, found whitespace. There's a problem with the API's  parser code.",
g,d);throw new ParseError('Something went horribly wrong. Expected value, got "'+(f.slice(c,c+8)+(c+8>=m)?"":"...")+'"',g,d);}case 8:b=x[x.length-1];null!==a&&b.push(a);(e=l(w,ps))&&b.push(new Text(e[0].replace(/\\([\\{])/g,"$1")));if(c>=m)throw new ParseError("Reached end of string/file while parsing section",g,d);if("]"==f[c]){a=new Section(b,g,d,c);b=VALUE_SEC;continue}k.push(8);b=1}};