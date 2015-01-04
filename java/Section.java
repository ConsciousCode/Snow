package org.snowlang.snow;

import java.util.List;
import java.util.ArrayList;

/**
 * A Snow section object.
**/
public class Section extends Flake{
	/**
	 * Sub-values (assumed to be text or tag).
	**/
	protected List<Flake> flakes;
	
	public boolean is_section(){
		return true;
	}
	
	public toString(){
		StringBuilder sb("[");
		
		for(Flake f: flakes){
			Text txt=f.as_text();
			if(t){
				sb.add(txt.get());
			}
			else{
				sb.add(f.toString());
			}
		}
		
		sb.add("]");
		return sb.toString();
	}
	
	//Could make smaller if whitespace could be trimmed, but there's no way
	// to nicely communicate that.
	public minify(Tagset t){
		StringBuilder sb=new StringBuilder("[");
		
		for(Flake f: flakes){
			Text txt=f.as_text();
			if(t){
				sb.append(txt.get());
			}
			else{
				sb.append(f.minify(t));
			}
		}
		
		sb.add("]");
		return sb.toString();
	}
	
	public boolean equals(Object o){
		if(o instanceof Flake){
			Section s=((Flake)o).as_section();
			if(s){
				int size=flakes.size();
				if(size==s.flakes.size()){
					//Easily compared backwards and forwards
					while(size--){
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
	
	public Section(){
		flakes=new ArrayList<Flake>();
	}
	
	/**
	 * Initialize the section with two flakes (used for attribute merging).
	**/
	public Section(Flake a,Flake b){
		flakes=new ArrayList<Flake>();
		flakes.add(a);
		flakes.add(b);
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
		return flakes.set(x,f);
	}
	
	/**
	 * Add a flake to the section.
	 *
	 * @return The added flake.
	**/
	public Flake add(Flake f){
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
	 * @return The internal list object used to represent the section.
	**/
	public List<Flake> getFlakes(){
		return flakes;
	}
}