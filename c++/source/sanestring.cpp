#include <algorithm>

#include "sanestring.hpp"

using namespace snow;
using namespace util;

SaneString::SaneString():std::string(){}

SaneString::SaneString(char c):std::string(1,c){}

SaneString SaneString::replace_all(const SaneString& f,const SaneString& r)
		const{
	SaneString s=*this;
	size_t start=0;

	while((start=s.find(f,start))!=SaneString::npos){
		s.replace(start,f.length(),r);
		start+=r.length();
	}

	return s;
}

SaneString& SaneString::escape(SaneString x,char xc){
	size_t i=length();
	char esc[2]={xc,' '};

	while(i--){
		if(at(i)==xc or x.find(esc[1]=at(i))!=SaneString::npos){
			replace(i,1,esc);
		}
	}

	return *this;
}

size_t SaneString::count(const SaneString& s) const{
	size_t n=0,start=0;

	while((start=find(s,start))!=SaneString::npos){
		++n;
		start+=s.length();
	}

	return n;
}

size_t SaneString::count(char c) const{
	return std::count(begin(),end(),c);
}
