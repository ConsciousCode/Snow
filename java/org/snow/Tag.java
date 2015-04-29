package org.snow;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Iterator;

/**
 * Snow tag object, an associative array.
**/
public class Tag extends Flake implements Iterable<Flake>{
	/**
	 * Inner class for enabling the iteration of the named attributes.
	**/
	protected static class NamedIterable implements
	Iterable<Map.Entry<Flake,Flake>>{
		protected Iterator<Map.Entry<Flake,Flake>> it;
		
		public NamedIterable(Iterator<Map.Entry<Flake,Flake>> i){
			it=i;
		}
		
		public Iterator<Map.Entry<Flake,Flake>> iterator(){
			return it;
		}
	}
	
	/**
	 * Named attributes.
	**/
	protected Map<Flake,Flake> named;
	/**
	 * Positional attributes.
	**/
	protected List<Flake> pos;
	
	public Tag(){
		super();
		named=new HashMap<>();
		pos=new ArrayList<>();
	}
	
	public Tag(Map<Flake,Flake> n,List<Flake> p){
		super();
		named=n;
		pos=p;
	}
	
	public Tag(Map<Flake,Flake> n,List<Flake> p,int l,int c){
		super(l,c);
		named=n;
		pos=p;
	}
	
	/**
	 * Enable end-users to iterate over named attributes
	**/
	public Iterable<Map.Entry<Flake,Flake>> iterNamed(){
		return new NamedIterable(named.entrySet().iterator());
	}
	
	@Override
	public Iterator<Flake> iterator(){
		return pos.iterator();
	}
	
	/**
	 * Get the named attribute with the given name.
	**/
	public Flake get(Flake n){
		return named.get(n);
	}
	
	/**
	 * Get the positional attribute with the given index.
	**/
	public Flake get(int p){
		return pos.get(p);
	}
	
	/**
	 * Get the number of named attributes.
	**/
	public int namedCount(){
		return named.size();
	}
	
	/**
	 * Get the number of positional attributes.
	**/
	public int posCount(){
		return pos.size();
	}
	
	@Override
	public boolean is_tag(){
		return true;
	}
	
	@Override
	public String toString(){
		int psize=pos.size(),nsize=named.size();
		if(psize==0 && nsize==0){
			return "{}";
		}
		
		StringBuilder sb=new StringBuilder("{");
		Iterator pit=pos.iterator();
		
		boolean hasPos=false;
		
		if(pit.hasNext()){
			hasPos=true;
			sb.append(pit.next().toString());
			
			while(pit.hasNext()){
				sb.append(" ");
				sb.append(pit.next().toString());
			}
		}
		
		Iterator<Map.Entry<Flake,Flake>> nit=named.entrySet().iterator();
		
		if(nit.hasNext()){
			if(hasPos){
				sb.append(" ");
			}
			
			Map.Entry entry=nit.next();
			sb.append(entry.getKey().toString());
			sb.append(":");
			sb.append(entry.getValue().toString());
			
			while(nit.hasNext()){
				entry=nit.next();
				sb.append(" ");
				sb.append(entry.getKey().toString());
				sb.append(":");
				sb.append(entry.getValue().toString());
			}
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
	
	@Override
	public Object visit(SnowVisitor v){
		return v.visit_tag(this);
	}
	
	@Override
	public int hashCode(){
		return named.hashCode()*31+pos.hashCode();
	}
}