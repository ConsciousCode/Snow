package org.snow;

public class ParseError extends RuntimeException{
	//Error messages - using these allows the type of error to be determined
	// by comparing references. If it's none of these, it must be a custom
	// error message.
	public final static String SECTION_EOF=
		"Reached end of string/file while parsing a section.";
	public final static String QUOTED_EOF=
		"Reached end of string/file while parsing quoted text.";
	public final static String TAG_EOF=
		"Reached end of string/file while parsing a tag";
	public final static String UNEXPECTED_CLOSE_SECTION=
		"Unexpected close bracket ]. Did you forget to close a tag?";
	public final static String UNNAMED_ATTR=
		"Forgot to assign a value to the named attribute.";
	public final static String DUPLICATE_ATTR=
		"Duplicate named attribute name.";
	public final static String ILLEGAL_NAMED=
		"The colon is disallowed in unquoted text.";
	public final static String DQ_EOF=
		"Reached end of string/file while parsing double-quoted text.";
	public final static String SQ_EOF=
		"Reached end of string/file while parsing single-quoted text.";
	public final static String BQ_EOF=
		"Reached end of string/file while parsing back tick-quoted text.";
	public final static String MIXED=
		"Attempted to close section while parsing tag.";
	
	/**
	 * Serialization version UID for RuntimeException compliance.
	 */
	public static final long serialVersionUID = 1L;
	
	/**
	 * The line and column in the document at which the error occurred.
	**/
	protected int line,col;
	
	public ParseError(String msg,int ln,int c){
		super(msg);
		line=ln;
		col=c;
	}
	
	@Override
	public String getLocalizedMessage(){
		return getMessage()+" (Ln: "+line+", Col: "+col+")";
	}
}