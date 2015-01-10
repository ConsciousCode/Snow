package org.snowlang.snow;

import java.io.Reader;
import java.io.StringReader;
import java.io.IOException;
import java.util.ArrayList;

/**
 * Public interface for the Snow parser.
**/
public class Parser{
	//Error messages
	private final static String SECTION_EOF=
		"Reached end of string/file while parsing a section.";
	private final static String QUOTED_EOF=
		"Reached end of string/file while parsing quoted text.";
	private final static String EXPECTED_CLOSE_SECTION=
		"Expected close bracket ].";
	private final static String TAG_EOF=
		"Reached end of string/file while parsing a tag";
	private final static String UNEXPECTED_CLOSE_SECTION=
		"Unexpected close bracket ]. Did you forget to close a tag?";
	private final static String UNNAMED_ATTR=
		"Forgot to assign a value to the named attribute.";
	private final static String DUPLICATE_ATTR=
		"Duplicate named attribute name.";
	private final static String ILLEGAL_NAMED=
		"The colon is disallowed in unquoted text.";
	private final static String UNEXPECTED_SPACE=
		"Expected a value, found whitespace. "+
		"There's a problem with the API's parser code.";
	private final static String COSMIC_RAY_ERR=
		"Something went horribly wrong. "+
		"There's a problem with the API's parser code.";

	//Relevant characters
	private final static char OPEN_TAG='{';
	private final static char NAMED_ATTR=':';
	private final static char CLOSE_TAG='}';
	private final static char OPEN_SECTION='[';
	private final static char CLOSE_SECTION=']';
	private final static char QUOTE1='"';
	private final static char QUOTE2='\'';
	private final static char QUOTE3='`';
	private final static char ESCAPE_CHAR='\\';
	
	/**
	 * Used for giving the location of parsing errors.
	**/
	protected int line,col,pos;
	/**
	 * Positions used for special-case error messages involving colons.
	**/
	protected int colonline,coloncol;
	
	/**
	 * The tagset to use with the parser.
	**/
	protected Tagset ts;
	
	/**
	 * StringBuilder shared by all text objects (guaranteed no usage overlap).
	**/
	StringBuilder sb;
	
	/**
	 * The next character.
	**/
	protected int nextc;
	/**
	 * Whether or not there's a cached next character.
	**/
	protected boolean hasnext;
	
	public Parser(){
		ts=new Tagset();
		sb=new StringBuilder();
	}
	
	/**
	 * @param ts The tagset to use.
	**/
	public Parser(Tagset ts){
		this.ts=ts;
		sb=new StringBuilder();
	}
	
	/**
	 * Abstracts the input stream such that a character can be cached for
	 *  look-ahead.
	 *
	 * @param it The iterator.
	 *
	 * @return The next character.
	**/
	protected int next(Reader it) throws IOException{
		++pos;
		if(hasnext){
			hasnext=false;
			return nextc;
		}
		
		return it.read();
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
	protected int calc_line(Reader it,int c) throws IOException{
		int x='\n';
		switch(c){
			case '\r':
				x=next(it);
				//Windows or old-style Mac?
				if(x=='\n'){
					++pos;
				}
				else{
					nextc=x;
					hasnext=true;
					x='\n';
				}
			case '\n':
			case '\u002b'://\v
			case '\f':
			case '\u0085':
			case '\u2028':
			case '\u2029':
				++line;
				col=0;
				return x;
			default:
				++col;
				return c;
		}
	}
	
	/**
	 * Try to parse a single character and increment on success. This borrows
	 *  logic from next to reduce unnecessary computation.
	 *
	 * @param it The iterator.
	 * @param c The character to look for.
	**/
	protected boolean maybe_char(Reader it,int c) throws IOException{
		if(hasnext){
			if(nextc==c){
				hasnext=false;
				++pos;
				++col;
				return true;
			}
			return false;
		}
		
		int x=it.read();
		if(x==c){
			++pos;
			++col;
			return true;
		}
		
		hasnext=true;
		nextc=x;
		
		return false;
	}
	
	/**
	 * Parse a Snow section object.
	**/
	protected Section parse_section(Reader it) throws IOException{
		int tl=line,tc=col,tp=pos,c;
		if(!maybe_char(it,OPEN_SECTION)){
			return null;
		}
		
		ArrayList<Flake> sec=new ArrayList<Flake>();
		
		boolean text;
		Tag tag;
		
		sec_loop: do{
			sb.setLength(0);
			
			c=next(it);
			if(c==-1){
				throw new ParseError(SECTION_EOF,tl,tc);
			}
			
			while(c!=OPEN_TAG){
				if(c==CLOSE_SECTION){
					if(text=(sb.length()>0)){
						sec.add(new Text(sb.toString(),tl,tc,tp));
					}
					break sec_loop;
				}
				
				if(c==ESCAPE_CHAR){
					c=next(it);
					if(c==-1){
						throw new ParseError(SECTION_EOF,tl,tc);
					}
					if(c!=ESCAPE_CHAR && c!=OPEN_TAG && c!=CLOSE_SECTION){
						sb.appendCodePoint(ESCAPE_CHAR);
					}
				}
				//Other instances of next in this loop have their line
				// calculation accounted for here
				sb.appendCodePoint(calc_line(it,c));
				c=next(it);
				if(c==-1){
					throw new ParseError(SECTION_EOF,tl,tc);
				}
			}
			hasnext=true;
			nextc=OPEN_TAG;
			
			if(text=(sb.length()>0)){
				sec.add(new Text(sb.toString(),tl,tc,tp));
			}
			
			tag=parse_tag(it);
			if(tag!=null){
				sec.add(tag);
			}
		}while(text || tag!=null);
		
		if(c!=CLOSE_SECTION){
			if(c==-1){
				throw new ParseError(SECTION_EOF,tl,tc);
			}
			throw new ParseError(EXPECTED_CLOSE_SECTION,line,col);
		}
		
		return new Section(sec,tl,tc,tp);
	}
	
	/**
	 * Parse a Snow text object (as they appear in tags).
	 *
	 * This is a function to simplify parsing logic - only used once.
	**/
	protected Text parse_text(Reader it) throws IOException{
		int tl=line,tc=col,tp=pos,c=next(it),q;
		sb.setLength(0);
		
		if(c==-1){
			return null;
		}
		else if(c==QUOTE1){
			q=QUOTE1;
		}
		else if(c==QUOTE2){
			q=QUOTE2;
		}
		else if(c==QUOTE3){
			q=QUOTE3;
		}
		//Try unquoted
		else{
			while(
				//Ordered by expected frequency
				//Space - positional attribute, named_attr - named attribute
				//Close tag before open because open means it's minified
				!Character.isWhitespace(c) && c!=NAMED_ATTR && c!=CLOSE_TAG &&
				//Sections and tags expected to be more common than quoted
				// text
				c!=OPEN_TAG && c!=OPEN_SECTION && c!=QUOTE1 && c!=QUOTE2 &&
				//CLOSE_SECTION is a guaranteed error, so it's last
				// (error not handled here)
				c!=QUOTE3 && c!=CLOSE_SECTION
			){
				if(c==ESCAPE_CHAR){
					c=next(it);
					if(c==-1){
						return null;
					}
					//No particular order, escaping can be anything
					else if(!Character.isWhitespace(c) && c!=NAMED_ATTR &&
						c!=ESCAPE_CHAR && c!=OPEN_TAG && c!=CLOSE_TAG &&
						c!=OPEN_SECTION && c!=CLOSE_SECTION &&
						c!=QUOTE1 && c!=QUOTE2 && c!=QUOTE3
					){
						sb.appendCodePoint(ESCAPE_CHAR);
					}
				}
				sb.appendCodePoint(calc_line(it,c));
				c=next(it);
				if(c==-1){
					return null;
				}
			}

			if(sb.length()==0){
				return null;
			}
			
			hasnext=true;
			nextc=c;
			
			return new Text(sb.toString(),tl,tc,tp);
		}
		
		//Must be quoted
		while((c=next(it))!=q){
			if(c==-1){
				throw new ParseError(QUOTED_EOF,tl,tc);
			}
			
			if(c==ESCAPE_CHAR){
				c=next(it);
				if(c==-1){
					throw new ParseError(QUOTED_EOF,tl,tc);
				}
				if(c!=q && c!=ESCAPE_CHAR){
					sb.appendCodePoint(ESCAPE_CHAR);
				}
			}
			sb.appendCodePoint(calc_line(it,c));
		}

		return new Text(sb.toString(),tl,tc,tp);
	}
	
	/**
	 * Parse a Snow value (tag, section, or text).
	 *
	 * This is where most parse errors are processed.
	**/
	protected Flake parse_value(Reader it) throws IOException{
		Flake f=parse_tag(it);
		if(f!=null){
			return f;
		}
		
		f=parse_section(it);
		if(f!=null){
			return f;
		}
		
		f=parse_text(it);
		if(f!=null){
			return f;
		}
		
		//Error checking

		/*
		Snow errors are very predictable, so check for common
		mistakes. By this point, we know the next character is
		one of the quote characters, ], }, whitespace, a control
		character, or EOF (if not, something is HORRIBLY wrong)
		*/
		
		int c=next(it);
		
		if(c==-1){
			//The calling tag has the position data for the error
			return null;
		}
		
		if(c==CLOSE_SECTION){
			throw new ParseError(UNEXPECTED_CLOSE_SECTION,line,col-1);
		}
		
		if(c==CLOSE_TAG){
			throw new ParseError(UNNAMED_ATTR,colonline,coloncol);
		}
		
		if(c==NAMED_ATTR){
			throw new ParseError(ILLEGAL_NAMED,line,col-1);
		}
		
		if(Character.isWhitespace(c)){
			//This should NEVER happen. Guarantees a problem with the
			// parser.
			throw new ParseError(UNEXPECTED_SPACE,line,col);
		}
		
		//Reserved for cosmic ray errors
		System.out.printf("%c%c\n",c,next(it));
		throw new ParseError(COSMIC_RAY_ERR,line,col);
	}
	
	/**
	 * Parse as much whitespace as possible.
	**/
	protected void space(Reader it) throws IOException{
		int c;
		while(Character.isWhitespace(c=calc_line(it,next(it)))){}
		hasnext=true;
		nextc=c;
	}
	
	/**
	 * Try to parse a tag in the Snow document, else return null.
	**/
	protected Tag parse_tag(Reader it) throws IOException{
		int l=line,c=col,p=pos;
		
		if(!maybe_char(it,OPEN_TAG)){
			return null;
		}
		
		ArrayList<Flake> keys=new ArrayList<Flake>(),
			vals=new ArrayList<Flake>(),
			pos=new ArrayList<Flake>();
		
		while(!maybe_char(it,CLOSE_TAG)){
			space(it);
			Flake key=parse_value(it);
			if(key==null){
				throw new ParseError(TAG_EOF,l,c);
			}
			space(it);
			if(maybe_char(it,NAMED_ATTR)){
				colonline=line;
				coloncol=col-1;
				
				space(it);
				Flake val=parse_value(it);
				if(val==null){
					throw new ParseError(TAG_EOF,l,c);
				}
				
				int x=keys.indexOf(val);
				if(x!=-1){
					throw new ParseError(DUPLICATE_ATTR,colonline,coloncol);
				}
				
				keys.add(key);
				vals.add(val);
			}
			else{
				pos.add(key);
			}
		}
		
		return ts.build(keys,vals,pos,l,c,p);
	}
	
	/**
	 * Parse a Snow document using the given iterator.
	**/
	public Document parse(Reader it) throws IOException{
		int c=it.read();
		//Skip BOM
		if(c=='\ufeff'){
			hasnext=false;
			pos=1;
		}
		else{
			hasnext=true;
			nextc=c;
			pos=0;
		}
		int p=pos;
		
		line=1;
		col=0;
		
		ArrayList<Flake> doc=new ArrayList<Flake>();
		boolean text;
		Tag tag;
		
		try{
			do{
				int tl=line,tc=col,tp=pos;
				c=next(it);
				if(c==-1){
					break;
				}
				
				sb.setLength(0);
				
				while(c!=OPEN_TAG && c!=-1){
					if(c==ESCAPE_CHAR){
						c=next(it);
						if(c!=ESCAPE_CHAR && c!=OPEN_TAG){
							sb.appendCodePoint(ESCAPE_CHAR);
						}
					}
					sb.appendCodePoint(calc_line(it,c));
					c=next(it);
				}
				hasnext=true;
				nextc=c;
				
				if(text=(sb.length()>0)){
					doc.add(new Text(sb.toString(),tl,tc,tp));
				}
				
				tag=parse_tag(it);
				if(tag!=null){
					doc.add(tag);
				}
			}while(text || tag!=null);
		}
		catch(Exception e){
			it.close();
			throw e;
		}
		
		return new Document(doc,1,0,p);
	}
	
	/**
	 * Parse a Snow document using the given string.
	**/
	public Document parse(String s){
		try{
			return parse(new StringReader(s));
		}
		//This shouldn't happen with StringReader, return null to indicate an
		// error during testing.
		catch(IOException io){
			return null;
		}
	}
}