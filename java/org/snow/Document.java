package org.snow;

import java.util.List;

public class Document extends Section{
	public Document(){
		super();
	}
	
	/**
	 * Initialize the Document with a pre-made list.
	**/
	public Document(List<Flake> L){
		super(L);
	}
	
	public Document(List<Flake> L,int l,int c){
		super(L,l,c);
	}
	
	@Override
	public boolean is_document(){
		return true;
	}
	
	@Override
	public String toString(){
		StringBuilder sb=new StringBuilder();
		
		for(Flake f: flakes){
			Text txt=f.as_text();
			if(txt==null){
				sb.append(f.toString());
			}
			else{
				sb.append(txt.value().replaceAll("([\\\\{])","\\\\$1"));
			}
		}
		
		return sb.toString();
	}
	
	@Override
	public Object visit(SnowVisitor v){
		return v.visit_doc(this);
	}
}