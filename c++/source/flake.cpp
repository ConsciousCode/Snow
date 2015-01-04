#include "flake.hpp"

using namespace snow;
using namespace util;

Flake::~Flake(){}

bool Flake::is_tag() const{
	return type==TAG;
}

Tag* Flake::as_tag() const{
	if(is_tag()){
		return (Tag*)this;
	}
	return NULL;
}

bool Flake::is_section() const{
	//This can mean either section or document.
	return type&SECTION;
}

Section* Flake::as_section() const{
	if(is_section()){
		return (Section*)this;
	}
	return NULL;
}

bool Flake::is_text() const{
	//The text type is split into 3 subtypes for the quotations used.
	return type&TEXT;
}

Text* Flake::as_text() const{
	if(is_text()){
		return (Text*)this;
	}
	return NULL;
}

bool Flake::is_doc() const{
	return type==DOCUMENT;
}

Document* Flake::as_doc() const{
	if(is_doc()){
		return (Document*)this;
	}
	return NULL;
}
