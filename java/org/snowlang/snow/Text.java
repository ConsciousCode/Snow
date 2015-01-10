package org.snowlang.snow;


/**
 * Snow text object, used to store text from tags or sections.
**/
public class Text extends Flake{
	/**
	 * The string value of the text object.
	**/
	protected String val;
	
	public Text(){
		super();
		val="";
	}
	
	public Text(String s){
		super();
		val=s;
	}
	
	public Text(String s,int l,int c,int p){
		super(l,c,p);
		val=s;
	}
	
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
		int q1=count('"'),
			q2=count('\''),
			q3=count('`');
		
		if(q1==0 && q2==0 && q3==0){
			if(val.matches("^[^\\s{:}\\[\\]\"'`]+$")){
				return val;
			}
			return '"'+val+'"';
		}
		
		int q;
		
		if(q1<=q2 && q1<=q3){
			q='"';
		}
		else if(q2<=q3){
			q='\'';
		}
		else{
			q='`';
		}
		
		//Conversion to char is safe because quotes are within ASCII range
		return q+val.replace(Character.toString((char)q),"\\"+q)+q;
	}
	
	//Same as toString because of how trivial minification of text is.
	public String minify(Tagset t){
		return toString();
	}
	
	public boolean equals(Object o){
		if(o instanceof Flake){
			Text t=((Flake)o).as_text();
			if(t!=null){
				return val.equals(t.val);
			}
		}
		
		return false;
	}
	
	/**
	 * Get the string contained by the text object.
	**/
	public String value(){
		return val;
	}
	
	/**
	 * Set the string contained by the text object (null is ignored).
	**/
	public void value(String s){
		if(s!=null){
			val=s;
		}
	}
}