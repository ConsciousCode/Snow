package org.snow;

/**
 * Interface for traversing a Snow document.
**/
public interface SnowVisitor{
	/**
	 * Called when visiting a text object.
	**/
	public Object visit_text(Text t);
	
	/**
	 * Called when visiting a tag object.
	**/
	public Object visit_tag(Tag t);
	
	/**
	 * Called when visiting a section object.
	**/
	public Object visit_section(Section s);
	
	/**
	 * Called when visiting the root document object (only once).
	**/
	public Object visit_doc(Document d);
}