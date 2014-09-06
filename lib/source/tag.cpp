#include "tag.hpp"

using namespace snow;
using namespace util;

bool needs_space(char x){
	if(x=='"' or x=='\'' or x=='{' or x=='}' or x=='[' or x==']' or x=='`'){
		return false;
	}
	return true;
}

Tag::Tag(){
	type=Flake::TAG;
}

Tag::~Tag(){
	std::vector<Flake*>::iterator it=keys.begin(),end=keys.end();
	for(;it!=end;++it){
		delete *it;
	}

	it=vals.begin();
	end=vals.end();
	for(;it!=end;++it){
		delete *it;
	}

	it=pos.begin();
	end=pos.end();
	for(;it!=end;++it){
		delete *it;
	}
}

bool Tag::eq(Flake* x){
	if(Tag* y=x->as_tag()){
		if(keys.size()==y->keys.size() and
				pos.size()==y->pos.size()){
			std::vector<Flake*>::iterator
				kit=keys.begin(),kend=keys.end(),
				vit=vals.begin(),
				pit=pos.begin(),pend=pos.end(),
				ykit=y->keys.begin(),
				yvit=y->vals.begin(),
				ypit=y->pos.begin();

			//Compare pos first.
			for(;pit!=pend;++pit,++ypit){
				if(!(*pit)->eq(*ypit)){
					return false;
				}
			}

			//Compare keys and values simultaneously.
			for(;kit!=kend;++kit,++ykit,++vit,++yvit){
				if(!((*kit)->eq(*ykit) and (*vit)->eq(*yvit))){
					return false;
				}
			}

			return true;
		}
	}
	return false;
}

void Tag::add(Flake* f){
	pos.push_back(f);
}

Flake* Tag::get(Flake* x){
	std::vector<Flake*>::iterator
		start=keys.begin(),it=start,
		end=keys.end();

	for(;it!=end;++it){
		if((*it)->eq(x)){
			return vals[it-start];
		}
	}

	return NULL;
}

const Flake* Tag::get(Flake* x) const{
	std::vector<Flake*>::const_iterator
		start=keys.begin(),it=start,
		end=keys.end();

	for(;it!=end;++it){
		if((*it)->eq(x)){
			return vals[it-start];
		}
	}

	return NULL;
}

bool Tag::set(Flake* key,Flake* val){
	std::vector<Flake*>::iterator
		start=keys.begin(),it=start,
		end=keys.end();

	for(;it!=end;++it){
		if((*it)->eq(key)){
			vals[it-start]=val;
			return true;
		}
	}

	keys.push_back(key);
	vals.push_back(val);
	return false;
}

Flake* Tag::get(size_t x){
	if(x<pos.size()){
		return pos[x];
	}
	return NULL;
}

const Flake* Tag::get(size_t x) const{
	if(x<pos.size()){
		return pos[x];
	}
	return NULL;
}

bool Tag::set(size_t x,Flake* val){
	if(x<pos.size()){
		pos[x]=val;
		return true;
	}
	return false;
}

bool Tag::has(Flake* x) const{
	std::vector<Flake*>::const_iterator
		start=keys.begin(),it=start,
		end=keys.end();

	for(;it!=end;++it){
		if((*it)->eq(x)){
			return true;
		}
	}

	return false;
}

bool Tag::eq(const Flake* f) const{
	if(const Tag* t=f->as_tag()){
		if(keys.size()!=t->keys.size() or pos.size()!=t->pos.size()){
			return false;
		}

		std::vector<Flake*>::const_iterator
			it=keys.begin(),
			vit=vals.begin(),
			end=keys.end();

		for(;it!=end;++it,++vit){
			if(!t->get(*it)->eq(*vit)){
				return false;
			}
		}

		std::vector<Flake*>::const_iterator kit=t->keys.begin();
		it=pos.begin();
		end=pos.end();
		for(;it!=end;++it,++kit){
			if(!(*it)->eq(*kit)){
				return false;
			}
		}

		return true;
	}
	return false;
}

SaneString Tag::str() const{
	SaneString s='{';
	std::vector<Flake*>::const_iterator
		kit=keys.begin(),kend=keys.end(),
		vit=vals.begin(),
		pit=pos.begin(),pend=pos.end();

	if(pit!=pend){
		s+=(*pit++)->str()+' ';
	}

	for(;kit!=kend;++kit,++vit){
		s+=(*kit)->str()+':'+(*vit)->str()+' ';
	}

	for(;pit!=pend;++pit){
		s+=(*pit)->str()+' ';
	}

	if(s.length()>1){
		s[s.length()-1]='}';
	}
	else{
		s+='}';
	}

	return s;
}

SaneString Tag::mini(Tagset* ts) const{
	SaneString s='{';
	if(const Flake* tn=get((size_t)0)){
		s+=tn->mini(ts);
	}

	std::vector<Flake*>::const_iterator
		kit=keys.begin(),kend=keys.end(),
		vit=vals.begin(),
		pit=pos.begin(),pend=pos.end();

	for(;kit!=kend;++kit,++vit){
		if(needs_space(s[s.length()-1])){
			s+=' ';
		}
		s+=(*kit)->mini(ts)+':'+(*vit)->mini(ts);
	}

	for(;pit!=pend;++pit){
		if(needs_space(s[s.length()-1])){
			s+=' ';
		}
		s+=(*pit)->mini(ts);
	}

	if(s.length()>1){
		s[s.length()]='}';
	}
	else{
		s+='}';
	}

	return s;
}
