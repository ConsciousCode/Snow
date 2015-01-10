package org.snowlang.snow;

import java.util.List;
import java.util.ArrayList;

/**
 * Snow tag object, an associative array.
**/
public class Tag extends Flake{
	/**
	 * Named attribute tag names.
	**/
	protected List<Flake> keys;
	/**
	 * Named attribute tag values.
	**/
	protected List<Flake> vals;
	/**
	 * Positional attributes.
	**/
	protected List<Flake> pos;
	
	public Tag(){
		super();
		keys=new ArrayList<Flake>();
		vals=new ArrayList<Flake>();
		pos=new ArrayList<Flake>();
	}
	
	public Tag(List<Flake> k,List<Flake> v,List<Flake> p){
		super();
		keys=k;
		vals=v;
		pos=p;
	}
	
	public Tag(List<Flake> k,List<Flake> v,List<Flake> p,int l,int c,int tp){
		super(l,c,tp);
		keys=k;
		vals=v;
		pos=p;
	}
	
	public boolean is_tag(){
		return true;
	}
	
	public String toString(){
		int psize=pos.size(),ksize=keys.size();
		if(psize==0 && ksize==0){
			return "{}";
		}
		
		StringBuilder sb=new StringBuilder("{");
		
		if(psize>0){
			sb.append(pos.get(0).toString());
			
			for(int i=1;i<psize;++i){
				sb.append(" ");
				sb.append(pos.get(i).toString());
			}
			
			if(ksize>0){
				sb.append(" ");
			}
		}
		
		if(ksize>0){
			sb.append(keys.get(0).toString());
			sb.append(":");
			sb.append(vals.get(0).toString());
		}
		
		for(int i=1;i<ksize;++i){
			sb.append(" ");
			sb.append(keys.get(i).toString());
			sb.append(":");
			sb.append(vals.get(i).toString());
		}
		
		sb.append("}");
		return sb.toString();
	}
	
	/**
	 * Internal utility function used for processing the smallest possible
	 *  stringification of the tag by rearranging the attributes.
	 *
	 * @param s The string to process
	 * @param e True if the end should be checked, false for the start.
	 *
	 * @return Whether the given string is unquoted.
	**/
	private static boolean unquoted(String s,boolean e){
		final String cs="{:}[]\"'`";
		if(e){
			return cs.indexOf(s.charAt(s.length()-1))<0;
		}
		return cs.indexOf(s.charAt(0))<0;
	}
	
	public String minify(Tagset ts){
		return "Tag(NOT IMPLEMENTED YET)";
		/*
		ArrayList<String>
			n=new ArrayList<String>(keys.size()),
			p=new ArrayList<String>(pos.size());
		
		int size=keys.size(),i=0;
		for(;i<size;++i){
			n.add(keys.get(i).minify(ts)+":"+vals.get(i).minify(ts));
		}
		
		size=pos.size();
		for(i=0;i<psize;++i){
			p.add(pos.get(i).minify());
		}
		
		StringBuilder sb=new StringBuilder("{");
		
		size=p.size();
		if(size--){
			for(i=0;i<size;++i){
				if(unquoted(p.get(i),false) && unquoted(p.get(i+1),true)){
					String x=null;
					for(String s: n){
						if(unquoted(s,false) && unquoted(s,true)){
							x=s;
							break;
						}
					}
					
					if(x){
						p.insert(i++,x);
						++size;
					}
					else{
						ArrayList<String> buf=new ArrayList<String>();
						
						//!!!!!!!!!!!!!!!
					}
				}
			}
		}
		
		sb.append("}");
		return sb.toString();
		*/
	}
}