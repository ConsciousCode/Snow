package org.snowlang.snow;

import java.util.List;

public class Tagset{
	public Tag build(
		List<Flake> keys,List<Flake> vals,List<Flake> pos,
		int line,int col,int tpos
	){
		return new Tag(keys,vals,pos,line,col,tpos);
	}
}