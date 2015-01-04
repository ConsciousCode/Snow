package org.snowlang.snow;

/**
 * A custom iterator interface for iterating over UTF-8 data.
**/
public interface Utf8Iterator{
	/**
	 * @return the code point of the next UTF-8 character. The return value
	 *  is negative if the sequence is invalid.
	**/
	public int next();
	
	/**
	 * Increment the iterator without returning anything.
	**/
	public void incr();
	
	/**
	 * @return whether or not the iterator has a next element.
	**/
	public boolean hasNext();
}