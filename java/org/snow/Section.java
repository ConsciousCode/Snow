package org.snow;

import java.util.List;
import java.util.ArrayList;

import java.util.Iterator;

/**
 * A Snow section object.
**/
public class Section extends Flake implements Iterable<Flake>{
	/**
	 * Sub-values (assumed to be text or tag).
	**/
	protected List<Flake> flakes;
	
	public Section(){
		flakes=new ArrayList<Flake>();
	}
	
	/**
	 * Initialize the section with a pre-made list.
	**/
	public Section(List<Flake> L){
		flakes=L;
	}
	
	public Section(List<Flake> L,int l,int c){
		super(l,c);
		flakes=L;
	}
	
	@Override
	public Iterator<Flake> iterator(){
		return flakes.iterator();
	}
	
	@Override
	public boolean is_section(){
		return true;
	}
	
	@Override
	public String toString(){
		StringBuilder sb=new StringBuilder("[");
		
		for(Flake f: flakes){
			Text txt=f.as_text();
			if(txt!=null){
				sb.append(txt.value().replaceAll("([\\\\{\\]])","\\\\$1"));
			}
			else{
				sb.append(f.toString());
			}
		}
		
		sb.append("]");
		return sb.toString();
	}
	
	//Could make smaller if whitespace could be trimmed, but there's no way
	// to nicely communicate that.
	@Override
	public String minify(Tagset t){
		StringBuilder sb=new StringBuilder("[");
		
		for(Flake f: flakes){
			Text txt=f.as_text();
			if(t!=null){
				sb.append(txt.value());
			}
			else{
				sb.append(f.minify(t));
			}
		}
		
		sb.append("]");
		return sb.toString();
	}
	
	@Override
	public boolean equals(Object o){
		if(this==o){
			return true;
		}
		
		if(o instanceof Flake){
			Section s=((Flake)o).as_section();
			if(s!=null){
				int size=flakes.size();
				if(size==s.flakes.size()){
					//Easily compared backwards and forwards
					for(;size>0;--size){
						if(!get(size).equals(s.get(size))){
							return false;
						}
					}
					
					return true;
				}
			}
		}
		
		return false;
	}
	
	/**
	 * Get the flake at the given position.
	**/
	public Flake get(int x){
		return flakes.get(x);
	}
	
	/**
	 * Set the flake at the given position.
	 *
	 * @return The old value.
	**/
	public Flake set(int x,Flake f){
		if(f.is_section()){
			return null;
		}
		return flakes.set(x,f);
	}
	
	/**
	 * Add a flake to the section.
	 *
	 * @return The added flake.
	**/
	public Flake add(Flake f){
		if(f.is_section()){
			return null;
		}
		flakes.add(f);
		return f;
	}
	
	/**
	 * Remove the flake at the given position.
	 *
	 * @return The old value.
	**/
	public Flake remove(int x){
		return flakes.remove(x);
	}
	
	/**
	 * Clear the section of all sub-flakes.
	**/
	public void clear(){
		flakes.clear();
	}
	
	/**
	 * @return The number of elements in the section.
	**/
	public int size(){
		return flakes.size();
	}
	
	/**
	 * @note This may be removed as it breaks encapsulation.
	 *
	 * @return The internal list object used to represent the section.
	**/
	public List<Flake> getFlakes(){
		return flakes;
	}
	
	@Override
	public Object visit(SnowVisitor v){
		return v.visit_section(this);
	}
	
	@Override
	public int hashCode(){
		return flakes.hashCode();
	}
}