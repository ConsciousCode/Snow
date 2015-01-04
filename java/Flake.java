package org.snowlang.snow;

/**
 * Base class for all Snow objects.
**/
public abstract class Flake{
	/**
	 * @return whether or not the flake is a tag.
	**/
	public abstract boolean is_tag(){
		return false;
	}
	
	/**
	 * @return the flake as a tag if it's a tag, else null.
	**/
	public abstract Tag as_tag(){
		if(is_tag()){
			return (Tag)this;
		}
		return null;
	}
	
	/**
	 * @return whether or not the flake is a section.
	**/
	public abstract boolean is_section(){
		return false;
	}
	
	/**
	 * @return the flake as a section if it's a section, else null.
	**/
	public abstract Section as_section(){
		if(is_section()){
			return (Section)this;
		}
		return null;
	}
	
	/**
	 * @return whether or not the flake is a document.
	**/
	public abstract boolean is_document(){
		return false;
	}
	
	/**
	 * @return whether or not the flake is text.
	**/
	public abstract boolean is_text(){
		return false;
	}
	
	/**
	 * @return the flake as a text if it's a text, else null.
	**/
	public abstract Text as_text(){
		if(is_text()){
			return (Text)this;
		}
		return null;
	}
	
	/**
	 * Stringify the flake in the smallest way possible.
	**/
	abstract public String minify(Tagset t);
}