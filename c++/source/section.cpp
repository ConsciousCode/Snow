#include "section.hpp"
#include "text.hpp"

using namespace snow;
using namespace util;

Section::Section(){
	type=Flake::SECTION;
}

Section::Section(Flake* a,Flake* b){
	add(a);
	add(b);
}

SaneString Section::str() const{
	SaneString s='[';
	std::vector<Flake*>::const_iterator
		it=flakes.begin(),
		end=flakes.end();

	for(;it!=end;++it){
		if(const Text* t=(*it)->as_text()){
			s+=((SaneString)t->text).escape("{]");
		}
		else{
			s+=(*it)->str();
		}
	}
	s+=']';
	return s;
}

SaneString Section::mini(Tagset*) const{
	//This can theoretically be smaller if whitespace around lines
	//is ignored, but there's no way to nicely tell it that.
	return str();
}
