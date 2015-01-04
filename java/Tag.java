package org.snowlang.snow;

import java.util.List;
import java.util.ArrayList;

/**
 * Snow tag object, an associative array.
**/
public class Tag{
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
	
	public is_tag(){
		return true;
	}
	
	public String toString(){
		StringBuilder sb=new StringBuilder("{");
		
		int psize=pos.size(),ksize=keys.size();
		if(psize){
			sb.append(pos.get(0).toString());
			
			if(ksize){
				sb.append(" ");
			}
		}
		
		if(ksize){
			sb.append(keys.get(i).toString());
			sb.append(":");
			sb.append(vals.get(i).toString());
		}
		
		for(int i=1;i<ksize;++i){
			sb.append(" ");
			sb.append(keys.get(i).toString());
			sb.append(":");
			sb.append(vals.get(i).toString());
		}
		
		for(int i=1;i<psize;++i){
			sb.append(" ");
			sb.append(pos.get(i).toString());
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
		const String cs="{:}[]\"'`";
		if(e){
			return cs.indexOf(s.charAt(s.length()-1))<0;
		}
		return cs.indexOf(s.charAt(0))<0;
	}
	
	public String minify(Tagset ts){
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
	}
}