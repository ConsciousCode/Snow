package org.snow;

import java.io.Reader;
import java.io.StringReader;
import java.io.IOException;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

/**
 * Public interface for the Snow parser.
**/
public class Parser{
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
	protected int line,col;
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
	
	/**
	 * @param ts The tagset to use.
	**/
	public Parser(Tagset ts){
		this.ts=ts;
		sb=new StringBuilder();
	}
	
	public Parser(){
		this(new Tagset());
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
		switch(c){
			case '\r':{
				int x=next(it);
				//Windows or old-style Mac?
				if(x!='\n'){
					//Mac, put the character back
					nextc=x;
					hasnext=true;
				}
				//Fall through to adjust the position and return \n
			}
			case '\n':
			case '\u000b'://\v
			case '\f':
			case '\u0085'://NEL
			case '\u2028'://Line separator (LS)
			case '\u2029'://Paragraph separator (PS)
				++line;
				col=0;
				return '\n';
			
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
				++col;
				return true;
			}
			return false;
		}
		
		int x=it.read();
		if(x==c){
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
		int tl=line,tc=col,sl=tl,sc=tc-1,c;
		
		List<Flake> sec=new ArrayList<>();
		
		boolean text;
		Tag tag;
		
		do{
			sb.setLength(0);
			
			c=next(it);
			
			while(c!=OPEN_TAG && c>=0){
				if(c==CLOSE_SECTION){
					++col;
					if(sb.length()>0){
						sec.add(new Text(sb.toString(),tl,tc));
					}
					return new Section(sec,sl,sc);
				}
				
				if(c==ESCAPE_CHAR){
					c=next(it);
					++col;
					if(c!=ESCAPE_CHAR && c!=OPEN_TAG && c!=CLOSE_SECTION){
						sb.appendCodePoint(ESCAPE_CHAR);
					}
				}
				
				//Other instances of next in this loop have their line
				// calculation accounted for here
				c=calc_line(it,c);
				if(c<0){
					break;
				}
				sb.appendCodePoint(c);
				c=next(it);
			}
			
			if(text=(sb.length()>0)){
				sec.add(new Text(sb.toString(),tl,tc));
			}
			
			if(c<0){
				break;
			}
			
			tag=parse_tag(it);
			if(tag!=null){
				sec.add(tag);
			}
			
			tl=line;
			tc=col;
		}while(text || tag!=null);
		
		if(c<0){
			throw new ParseError(ParseError.SECTION_EOF,sl,sc);
		}
		
		return new Section(sec,sl,sc);
	}
	
	/**
	 * Java's Character.isWhitespace and isSpace don't conform
	 *  to Unicode standards; isWhitespace allows too many characters
	 *  (flagging control characters like FS) and isSpaceChar doesn't allow 
	 *  enough (notably excluding \t).
	 *
	 * @return whether the given codepoint has the property WSpace=Y
	**/
	private static boolean isSpace(int c){
		return Character.isWhitespace(c) && (c>'\u001f' || c<'\u001c');
	}
	
	/**
	 * Helper method for parse_text
	**/
	private static boolean needs_escape(int c){
		//Ordered by expected frequency
		//Space - positional attribute, named_attr - named attribute
		//Close tag before open because open means it's minified
		return isSpace(c) || c==NAMED_ATTR || c==CLOSE_TAG ||
			//Sections and tags expected to be more common than quoted text
			c==OPEN_TAG || c==OPEN_SECTION || c==QUOTE1 || c==QUOTE2 ||
			//CLOSE_SECTION is a guaranteed error, so it's last (error not
			// handled here)
			c==QUOTE3 || c==CLOSE_SECTION;
	}
	
	/**
	 * Parse a Snow text object (as they appear in tags).
	 *
	 * This is a function to simplify parsing logic - only used once.
	**/
	protected Text parse_text(Reader it,int q) throws IOException{
		int tl=line,tc=col,c;
		sb.setLength(0);
		
		if(q==QUOTE1 || q==QUOTE2 || q==QUOTE3){
			while((c=next(it))!=q){
				if(c==ESCAPE_CHAR){
					c=next(it);
					++col;
					if(c!=q && c!=ESCAPE_CHAR){
						sb.appendCodePoint(ESCAPE_CHAR);
					}
				}
				
				c=calc_line(it,c);
				if(c<0){
					switch(q){
						case QUOTE1:
							throw new ParseError(ParseError.DQ_EOF,tl,tc);
						case QUOTE2:
							throw new ParseError(ParseError.SQ_EOF,tl,tc);
						case QUOTE3:
							throw new ParseError(ParseError.BQ_EOF,tl,tc);
					}
				}
				
				sb.appendCodePoint(c);
			}
			
			return new Text(sb.toString(),tl,tc);
		}
		
		//Try unquoted
		c=q;
		while(!needs_escape(c)){
			if(c==ESCAPE_CHAR){
				c=next(it);
				++col;
				if(!needs_escape(c) && c!=ESCAPE_CHAR){
					sb.appendCodePoint(ESCAPE_CHAR);
				}
			}
			
			c=calc_line(it,c);
			if(c<0){
				//Tag will have the error line and column
				return null;
			}
			sb.appendCodePoint(c);
			c=next(it);
		}
		
		hasnext=true;
		nextc=c;
		
		if(sb.length()==0){
			return null;
		}
		
		return new Text(sb.toString(),tl,tc);
	}
	
	/**
	 * Parse a Snow value (tag, section, or text).
	 *
	 * This is where most parse errors are processed.
	**/
	protected Flake parse_value(Reader it) throws IOException{
		int c=next(it);
		if(c<0){
			return null;
		}
		
		if(c==OPEN_TAG){
			return parse_tag(it);
		}
		
		if(c==OPEN_SECTION){
			return parse_section(it);
		}
		
		Flake f=parse_text(it,c);
		if(f!=null){
			return f;
		}
		
		//Error checking

		/*
		Snow errors are very predictable, so check for common mistakes. By
		this point, we know the next character is ], }, whitespace, a control
		character, or EOF (if not, something is HORRIBLY wrong)
		*/
		
		switch(c=next(it)){
			case -1:
				//The calling tag has the position data for the error
				return null;
			case CLOSE_SECTION:
				throw new ParseError(ParseError.MIXED,line,col);
			case CLOSE_TAG:
				throw new ParseError(
					ParseError.UNNAMED_ATTR,colonline,coloncol
				);
			case NAMED_ATTR:
				throw new ParseError(ParseError.ILLEGAL_NAMED,line,col);
		}
		
		if(isSpace(c)){
			//This should NEVER happen. Guarantees a problem with the
			// parser.
			throw new ParseError(
				"Expected a value, found whitespace. "+
				"There's a problem with the API's parser code.",
				line,col
			);
		}
		
		//Reserved for cosmic ray errors
		throw new ParseError(
			"Something went horribly wrong. "+
			"There's a problem with the API's parser code.",
			line,col
		);
	}
	
	/**
	 * Parse as much whitespace as possible.
	**/
	protected void space(Reader it) throws IOException{
		int c;
		while(isSpace(c=calc_line(it,next(it)))){}
		hasnext=true;
		nextc=c;
	}
	
	/**
	 * Try to parse a tag in the Snow document, else return null.
	**/
	protected Tag parse_tag(Reader it) throws IOException{
		int tl=line,tc=col;
		
		Map<Flake,Flake> named=new HashMap<>();
		List<Flake> pos=new ArrayList<>();
		
		while(!maybe_char(it,CLOSE_TAG)){
			space(it);
			Flake key=parse_value(it);
			if(key==null){
				throw new ParseError(ParseError.TAG_EOF,tl,tc);
			}
			
			space(it);
			if(maybe_char(it,NAMED_ATTR)){
				colonline=line;
				coloncol=col-1;
				
				space(it);
				Flake val=parse_value(it);
				if(val==null){
					throw new ParseError(ParseError.TAG_EOF,tl,tc);
				}
				
				if(named.containsKey(key)){
					throw new ParseError(
						ParseError.DUPLICATE_ATTR,colonline,coloncol
					);
				}
				
				named.put(key,val);
			}
			else{
				pos.add(key);
			}
		}
		
		return ts.build(named,pos,tl,tc);
	}
	
	/**
	 * Parse a Snow document using the given iterator.
	**/
	public Document parse(Reader it) throws IOException{
		int c=it.read(),p=0;
		//Skip BOM
		if(c=='\ufeff'){
			hasnext=false;
			p=1;
		}
		else{
			hasnext=true;
			nextc=c;
		}
		
		line=1;
		col=p;
		
		List<Flake> doc=new ArrayList<>();
		boolean text;
		Tag tag;
		
		try{
			do{
				int tl=line,tc=col;
				c=next(it);
				
				sb.setLength(0);
				
				while(c!=OPEN_TAG && c>=0){
					if(c==ESCAPE_CHAR){
						c=next(it);
						++col;
						if(c!=OPEN_TAG){
							sb.appendCodePoint(ESCAPE_CHAR);
						}
					}
					
					c=calc_line(it,c);
					if(c<0){
						break;
					}
					sb.appendCodePoint(c);
					c=next(it);
				}
				
				if(text=(sb.length()>0)){
					doc.add(new Text(sb.toString(),tl,tc));
				}
				
				if(c<0){
					break;
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
		
		return new Document(doc,1,p);
	}
	
	/**
	 * Parse a Snow document using the given string.
	**/
	public Document parse(String s){
		try{
			return parse(new StringReader(s));
		}
		//This shouldn't happen with StringReader, throw just in case
		catch(IOException io){
			throw new RuntimeException(
				"IOException caught while parsing a string",io
			);
		}
	}
}