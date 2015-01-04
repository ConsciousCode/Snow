package org.snowlang.snow;

import java.util.List;
import java.util.Arrays;

public class Tagset{
	protected List<Tagdef> defs;
	
	public Tagset(Tagdef... d){
		defs=Arrays.asList(d);
	}
	
	public Tagdef get(int x){
		return defs.get(x);
	}
}