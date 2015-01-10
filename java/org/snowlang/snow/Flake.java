package org.snowlang.snow;

/**
 * Base class for all Snow objects.
**/
public abstract class Flake{
	/**
	 * The position of the flake in the document (-1 if N/A).
	**/
	public int line,col,pos;
	
	public Flake(){
		line=-1;
		col=-1;
		pos=-1;
	}
	
	public Flake(int l,int c,int p){
		line=l;
		col=c;
		pos=p;
	}
	
	/**
	 * @return whether or not the flake is a tag.
	**/
	public boolean is_tag(){
		return false;
	}
	
	/**
	 * @return the flake as a tag if it's a tag, else null.
	**/
	public Tag as_tag(){
		if(is_tag()){
			return (Tag)this;
		}
		return null;
	}
	
	/**
	 * @return whether or not the flake is a section.
	**/
	public boolean is_section(){
		return false;
	}
	
	/**
	 * @return the flake as a section if it's a section, else null.
	**/
	public Section as_section(){
		if(is_section()){
			return (Section)this;
		}
		return null;
	}
	
	/**
	 * @return whether or not the flake is a document.
	**/
	public boolean is_document(){
		return false;
	}
	
	/**
	 * @return whether or not the flake is text.
	**/
	public boolean is_text(){
		return false;
	}
	
	/**
	 * @return the flake as a text if it's a text, else null.
	**/
	public Text as_text(){
		if(is_text()){
			return (Text)this;
		}
		return null;
	}
	
	/**
	 * Stringify the flake in the smallest way possible.
	**/
	public abstract String minify(Tagset t);
}