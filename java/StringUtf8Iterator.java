package org.snowlang.snow;

/**
 * A UTF-8 iterator for strings.
**/
public class StringUtf8Iterator implements Utf8Iterator{
	/**
	 * UTF-8 encoded data to iterate over.
	**/
	protected String data;
	/**
	 * The position in data.
	**/
	protected int x;
	
	public int next(){
		if(!hasNext()){
			//Parser shouldn't ever reach this, acts as a sanity check.
			throw new NoSuchElementException();
		}
		
		return data.codePointAt(x);
	}
	
	public void incr(){
		++x;
	}
	
	public boolean hasNext(){
		return x<data.length;
	}
	
	public StringUtf8Iterator(String s){
		data=s;
		x=0;
	}
}