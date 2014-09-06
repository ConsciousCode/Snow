#include "document.hpp"
#include "text.hpp"

using namespace snow;
using namespace util;

Document::Document(){
	type=Flake::DOCUMENT;
}

Document::~Document(){
	//All the flakes are guaranteed to be made with new.
	std::vector<Flake*>::iterator it=flakes.begin(),end=flakes.end();
	for(;it!=end;++it){
		delete *it;
	}
}

bool Document::eq(const Flake* x) const{
	if(x==this){
		return true;
	}

	if(Document* y=x->as_doc()){
		if(flakes.size()==y->flakes.size()){
			std::vector<Flake*>::const_iterator
				it=flakes.begin(),
				yit=y->flakes.begin(),
				end=flakes.end();

			for(;it!=end;++it,++yit){
				if(!(*it)->eq(*yit)){
					return false;
				}
			}

			return true;
		}
	}

	return false;
}

std::vector<Flake*>::iterator Document::begin(){
	return flakes.begin();
}

std::vector<Flake*>::iterator Document::end(){
	return flakes.end();
}

Flake* Document::add(Flake* x){
	//Sections should not be within a document.
	if(!x->is_section()){
		flakes.push_back(x);
	}
	return x;
}

Flake* Document::get(size_t x){
	if(x<flakes.size()){
		return flakes[x];
	}
	return NULL;
}

bool Document::set(size_t x,Flake* f){
	if(f->is_section()){
		return false;
	}
	if(x<=flakes.size()){
		flakes[x]=f;
		return true;
	}
	return false;
}

SaneString Document::str() const{
	std::vector<Flake*>::const_iterator
		it=flakes.begin(),
		end=flakes.end();
	SaneString s;

	for(;it!=end;++it){
		if(const Text* t=(*it)->as_text()){
			s+=((SaneString)t->text).escape('{');
		}
		else{
			s+=(*it)->str();
		}
	}

	return s;
}

SaneString Document::mini(Tagset*) const{
	//This can theoretically be smaller if whitespace around lines
	//is ignored, but there's no way to nicely tell it that.
	return str();
}
