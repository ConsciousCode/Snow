#include "text.hpp"

using namespace snow;
using namespace util;

Text::Text(){
	type=Flake::TEXT;
}

Text::Text(const SaneString& text,char q):text(
		//Non-\n newlines need to be converted.
		text.replace_all("\r\n",'\n').replace_all('\r','\n')){
	switch(q){
		case '"':type=Flake::D_TEXT;break;
		case '\'':type=Flake::S_TEXT;break;
		case '`':type=Flake::B_TEXT;break;
		default:type=Flake::TEXT;break;
	}
}

bool Text::eq(const Flake* x) const{
	if(Text* y=x->as_text()){
		if(text==y->text){
			return true;
		}
	}
	return false;
}

SaneString Text::str() const{
	if(text.size()==0){
		return "\"\"";
	}

	std::string::const_iterator
		it=text.begin(),
		end=text.end();

	for(;it!=end;++it){
		char c=*it;
		if(isspace(c) or c=='"' or c=='\'' or c=='`' or c=='[' or c=='}'){
			goto quoted;
		}
	}

	return text;

	quoted:
	size_t d=text.count('"');
	size_t s=text.count('\'');
	size_t b=text.count('`');

	if(d>=s and d>=b){
		return '"'+text.replace_all('"',"\\\"")+'"';
	}
	if(s>=b){
		return '\''+text.replace_all('\'',"\\'")+'\'';
	}
	return '`'+text.replace_all('`',"\\`")+'`';
}

SaneString Text::mini(Tagset*) const{
	return str();
}
