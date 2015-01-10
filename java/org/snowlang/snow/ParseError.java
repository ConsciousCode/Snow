package org.snowlang.snow;

public class ParseError extends RuntimeException{
	/**
	 * Serialization version UID for RuntimeException compliance.
	 */
	private static final long serialVersionUID = 1L;
	
	/**
	 * The line and column in the document at which the error occurred.
	**/
	protected int line,col;
	
	ParseError(String msg,int ln,int c){
		super(msg+" (Ln: "+ln+", Col: "+c+")");
		line=ln;
		col=c;
	}
}