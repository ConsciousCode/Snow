#include "tagset.hpp"

using namespace snow;

Tagset::~Tagset(){
	std::vector<Flake*>::iterator it=tagnames.begin(),end=tagnames.end();
	for(;it!=end;++it){
		delete *it;
	}
}

Tagdef Tagset::get(Flake* name){
	std::vector<Flake*>::iterator it=
		tagnames.begin(),
		end=tagnames.end(),
		start=it;

	for(;it!=end;++it){
		if(name->eq(*it)){
			return defs[it-start];
		}
	}

	return Tagdef();
}

bool Tagset::add(Flake* name,Tagdef def){
	if(get(name)){
		return false;
	}

	tagnames.push_back(name);
	defs.push_back(def);
	return true;
}
