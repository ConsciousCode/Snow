package org.snowlang.snow;

/**
 * Public interface for the Snow parser.
**/
public Parser{
	//Error messages
	private const static String SECTION_EOF=
		"Reached end of string/file while parsing a section.";
	private const static String UNQUOTED_EOF=
		"Reached end of string/file while parsing unquoted text.";
	private const static String QUOTED_EOF=
		"Reached end of string/file while parsing quoted text.";
	private const static String EXPECTED_CLOSE_SECTION=
		"Expected close bracket ].";
	private const static String TAG_EOF=
		"Reached end of string/file while parsing a tag";
	private const static String UNEXPECTED_CLOSE_SECTION=
		"Unexpected close bracket ]. Did you forget to close a tag?";
	private const static String UNNAMED_ATTR=
		"Forgot to assign a value to the named attribute.";
	private const static String ILLEGAL_NAMED=
		"The colon is disallowed in unquoted text.";
	private const static String UNEXPECTED_SPACE=
		"Expected a value, found whitespace. "+
		"There's a problem with the API's parser code.";
	private const static String COSMIC_RAY_ERR=
		"Something went horribly wrong. "+
		"There's a problem with the API's parser code.";

	private const static String UNICODE_EOF=
		"Reached end of string/file while parsing a Unicode codepoint.";

	//Relevant characters
	private const static char OPEN_TAG='{';
	private const static char NAMED_ATTR=':';
	private const static char CLOSE_TAG='}';
	private const static char OPEN_SECTION='[';
	private const static char CLOSE_SECTION=']';
	private const static char QUOTE1='"';
	private const static char QUOTE2='\'';
	private const static char QUOTE3='`'
	private const static char ESCAPE_CHAR='\\';
	
	//Character escape strings
	private const static String UNQUOTED_ESC=
		ESCAPE_CHAR+" \n\r\t\v\f\u0085\u00a0\u1680"+
		OPEN_TAG+NAMED_ATTR+CLOSE_TAG+OPEN_SECTION+CLOSE_SECTION+
		"\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009"+
		"\u200a\u2028\u2029\u202f\u205f\u3000";
	private const static String QUOTED_ESC=""+ESCAPE_CHAR;
	private const static String DOCUMENT_ESC=""+ESCAPE_CHAR+OPEN_TAG;
	private const static String SECTION_ESC=
		""+ESCAPE_CHAR+OPEN_TAG+CLOSE_SECTION;
	
	/**
	 * Used for giving the location of parsing errors.
	**/
	protected int line,col;
	/**
	 * Positions used for special-case error messages involving colons.
	**/
	protected int colonline,coloncol;
	/**
	 * A general-purpose character iterator used in parsing.
	**/
	protected Utf8Iterator it;
	
	/**
	 * The tagset to use with the parser.
	**/
	protected Tagset ts;
	
	public Parser(Tagset ts){
		this.ts=ts;
	}
	
	/**
	 * Calculate the line and column incrementation based on the given
	 *  character as well as abstract non-\n newline modes. This accepts
	 *  all of the Unicode-specified line terminators.
	 *
	 * @param c The character with which to start processing.
	 *
	 * @return The reinterpreted character (either c or \n).
	**/
	protected char calc_line(char c){
		if(c=='\r'){
			//Windows-style newline \r\n
			if(it.hasNext() && it.peek()=='\n'){
				it.incr();
			}
			//Mac-style newline \r
			++line;
			col=0;
		}
		else if(
			//Unix-style newline
			c=='\n' ||
			//Defined by Unicode as newlines for reasons
			c=='\v' || c=='\f' ||
			//Unicode chars NEL (NExt Line), LS (Line Separator), and
			// PS (Paragraph Separator)
			c=='\u0085' || c=='\u2028' || c=='\u2029'
		){
			++line;
			col=0;
		}
		else{
			++col;
			return c;
		}
		
		return '\n';
	}
	
	/**
	 * Main text parsing function which handles escapes.
	 *
	 * @param text The string builder to use.
	 * @param eof The error message to give if the iterator's end is
	 *  encountered, null if no error should be thrown.
	 * @param esc A string containing characters to escape.
	 *
	 * @return The next character (for determining if the parse loop
	 *  should terminate).
	**/
	protected char parse_escape(StringBuilder sb,String eof,String esc){
		char c=it.next();
		if(c==ESCAPE_CHAR){
			//Escapes consume the next character regardless of what it is
			if(it.hasNext()){
				c=it.next();
				if(esc.indexOf(c)<0){
					sb.append(ESCAPE_CHAR);
				}
				//...but we still need to check for newlines for error
				// messages.
				sb.append(calc_line(c));
				if(it.hasNext()){
					c=it.next();
					sb.append(c);
					return c;
				}
			}
			
			if(eof){
				throw new ParseError(eof,line,col);
			}
			
			//Return doesn't strictly matter, but the OPEN_TAG
			// character is checked before EOF, so this avoids a check.
			return OPEN_TAG;
		}
		
		c=calc_line(c);
		sb.append(c);
		
		return c;
	}
	
	/**
	 * Try to parse a single character and increment on success.
	**/
	protected boolean maybe_char(char c){
		if(it.peek()==c){
			it.incr();
			return true;
		}
		
		return false;
	}
	
	/**
	 * Parse a Snow text object (quoted or unquoted)
	 *
	 * @return The Snow text object or null if empty.
	**/
	protected Text parse_text(){
		if(!it.hasNext()){
			return null;
		}

		StringBuilder text=new StringBuilder();
		char c,q;

		if(maybe_char(QUOTE1)){
			q=QUOTE1;
		}
		else if(maybe_char(QUOTE2)){
			q=QUOTE2;
		}
		else if(maybe_char(QUOTE3)){
			q=QUOTE3;
		}
		//Try unquoted
		else{
			do{
				c=parse_escape(text,UNQUOTED_EOF,UNQUOTED_ESC);
			}while(!(
				//Ordered by expected frequency
				Character.isSpaceChar(c) || c==OPEN_TAG ||
				c==CLOSE_TAG || c==NAMED_ATTR || c==QUOTE1 ||
				c==QUOTE2 || c==OPEN_SECTION || c==CLOSE_SECTION ||
				c==QUOTE3
			) && it.hasNext());

			if(text.length()==0){
				return null;
			}

			return new Text(text.toString());
		}

		//Must be quoted
		do{
			c=parse_escape(text,QUOTED_EOF,QUOTED_ESC+q);
		}while(c!=q && it.hasNext());

		if(!maybe_char(q)){
			throw new ParseError(QUOTED_EOF,line,col);
		}

		return new Text(text.toString());
	}
	
	/**
	 * Parse the text pattern used by sections.
	**/
	protected Text parse_section_text(){
		if(!it.hasNext()){
			return null;
		}

		StringBuilder text=new StringBuilder();
		char c;

		do{
			c=parse_escape(text,SECTION_EOF,SECTION_ESC);
		}while(!(c==OPEN_TAG || c==CLOSE_SECTION) && it.hasNext());

		if(text.length()==0){
			return null;
		}

		return new Text(text.toString());
	}
	
	/**
	 * Parse a Snow section object.
	**/
	protected Section parse_section(){
		if(!maybe_char(OPEN_SECTION)){
			return null;
		}

		Section section=new Section();
		
		Text text;
		Tag tag;
		
		do{
			if(text=parse_section_text()){
				section.add(text);
			}
			if(tag=parse_tag()){
				section.add(tag);
			}
		}while(text || tag);

		if(!maybe_char(CLOSE_SECTION)){
			if(!it.hasNext()){
				throw new ParseError(SECTION_EOF,line,col);
			}
			throw new ParseError(EXPECTED_CLOSE_SECTION,line,col);
		}

		return section;
	}
	
	/**
	 * Parse a Snow value (tag, section, or text).
	 *
	 * This is where most parse errors are processed.
	**/
	protected Flake parse_value(){
		Flake f;
		if(f=parse_text()){
			return f;
		}
		
		if(f=parse_tag()){
			return f;
		}
		
		if(f=parse_section()){
			return f;
		}
		
		//Error checking

		/*
		Snow errors are very predictable, so check for common
		mistakes. By this point, we know the next character is
		one of the quote characters, ], }, whitespace, a control
		character, or EOF (if not, something is HORRIBLY wrong)
		*/
		
		if(!it.hasNext()){
			throw new ParseError(TAG_EOF,line,col);
		}
		
		char c=it.next();
		
		if(c==CLOSE_SECTION){
			throw new ParseError(UNEXPECTED_CLOSE_SECTION,line,col-1);
		}

		if(c==CLOSE_TAG){
			throw new ParseError(UNNAMED_ATTR,colonline,coloncol);
		}

		if(c==NAMED_ATTR){
			throw new ParseError(ILLEGAL_NAMED,line,col-1);
		}

		if(Character.isSpaceChar(c)){
			//This should NEVER happen. Guarantees a problem with the
			// parser.
			throw new ParseError(UNEXPECTED_SPACE,line,col);
		}

		//Reserved for cosmic ray errors
		throw new ParseError(COSMIC_RAY_ERR,line,col);
	}
	
	/**
	 * Parse as much whitespace as possible.
	**/
	protected void space(){
		char c;
		while(it.hasNext() && Character.isSpaceChar(c=it.next())){
			calc_line(c);
		}
	}
	
	/**
	 * Try to parse a tag in the Snow document, else return null.
	**/
	protected Tag parse_tag(){
		if(!maybe_char(OPEN_TAG)){
			return null;
		}
		space();
		
		Tag tag=new Tag();
		
		while(!maybe_char(CLOSE_TAG)){
			Flake key=parse_value();
			space();
			if(maybe_char(NAMED_ATTR)){
				colonline=line;
				coloncol=col-1;
				
				space();
				Flake val=parse_value();
				space();
				
				Flake f=tag.get(key);
				if(f){
					Section s=f.as_section();
					if(s){
						s.add(val);
					}
					else{
						tag.set(key,new Section(f,val));
					}
				}
				else{
					tag.set(key,val);
				}
			}
			else{
				tag.add(key);
			}
		}
		
		if(ts){
			Tagdef td=ts.get(tag.get(0));
			if(td){
				return td.process(tag).as_tag();
			}
		}
		return tag;
	}
	
	/**
	 * Parse the character pattern for a document's top level.
	**/
	protected Text parse_doc_text(){
		if(!it.hasNext()){
			return null;
		}

		StringBuilder text=new StringBuilder();
		char c;

		do{
			c=process_escape(text,null,DOCUMENT_ESC);
		}while(c!=OPEN_TAG && it.hasNext());

		if(text.length()==0){
			return null;
		}

		return new Text(text.toString());
	}
	
	/**
	 * Parse a Snow document using the given iterator.
	**/
	public Document parse(Utf8Iterator cit)  ParseError{
		line=1;
		col=0;
		it=cit;
		end=cit.end();
		
		Document doc=new Document();
		Text text=null,tag=null;
		
		do{
			if(text=parse_doc_text()){
				doc.add(text);
			}
			if(tag=parse_tag()){
				doc.add(tag);
			}
		}while(text || tag);
		
		return doc;
	}
	
	/**
	 * Parse a Snow document using the given string.
	**/
	public Document parse(String s){
		return parse(new StringUtf8Iterator(s));
	}
}