package org.snowlang.snow;

/**
 * Snow text object, used to store text from tags or sections.
**/
public class Text extends Flake{
	/**
	 * The string value of the text object.
	**/
	protected String val;
	
	public boolean is_text(){
		return true;
	}
	
	/**
	 * @return the number of occurrences of the given char in the text object.
	**/
	private int count(char c){
		int x=0,n=0;
		while((x=val.indexOf(c,x))>=0){
			++n;
		}
		
		return n;
	}
	
	public String toString(){
		int q1=count(Parser.QUOTE1),
			q2=count(Parser.QUOTE2),
			q3=count(Parser.QUOTE3);
		
		if(q1==0 && q2==0 && q3==0){
			return val;
		}
		
		char q;
		
		if(q1<=q2 && q1<=q3){
			q=QUOTE1;
		}
		else if(q2<=q3){
			q=QUOTE2;
		}
		else{
			q=QUOTE3;
		}
		
		return q+val.replace(Character.toString(q),"\\"+q)+q;
	}
	
	//Same as toString because of how trivial minification of text is.
	public String minify(Tagset t){
		return toString();
	}
	
	public boolean equals(Object o){
		if(o instanceof Flake){
			Text t=((Flake)o).as_text();
			if(t){
				return get().equals(t.get());
			}
		}
		
		return false;
	}
	
	public Text(String s=""){
		val=s;
	}
	
	/**
	 * Get the string contained by the text object.
	**/
	public String get(){
		return val;
	}
	
	/**
	 * Set the string contained by the text object (null is ignored).
	**/
	public void set(String s){
		if(s){
			val=s;
		}
	}
}