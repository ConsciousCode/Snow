package org.snow;

import java.util.Map;
import java.util.List;

public class Tagset{
	public Tag build(
		Map<Flake,Flake> named,List<Flake> pos,
		int line,int col
	){
		return new Tag(named,pos,line,col);
	}
}