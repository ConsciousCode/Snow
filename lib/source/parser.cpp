#include "parser.hpp"
#include "tagset.hpp"

/**
 * Safe pointer class based on RAII. This simplifies the logic and increases
 *  the safety of deallocating flakes when an ParseError occurs.
**/
template<typename T>
class SafePointer{
	protected:
		T* fp;
	public:
		SafePointer(T* p=NULL):fp(p){}

		~SafePointer(){
			if(fp){
				delete fp;
			}
		}

		T* operator ->(){
			return fp;
		}

		operator bool(){
			return (bool)fp;
		}

		/**
		 * Yield ownership of the pointer to the caller.
		**/
		T* yield(){
			T* p=fp;
			fp=NULL;
			return p;
		}

		/**
		 * Claim ownership over the given pointer.
		**/
		T* claim(T* p){
			if(fp){
				delete fp;
			}
			return fp=p;
		}

		/**
		 * Return the pointer without changing ownership (used for passing to
		 *  functions which don't do anything to it).
		**/
		T* value(){
			return fp;
		}
};

ParseError::ParseError(const std::string& s,size_t line,size_t col):
	std::runtime_error(s),line(line),col(col){}

bool Parser::maybe_char(char c){
	if(it!=end and *it==c){
		++it;
		//Maybe is never used with whitespace, so it doesn't have to worry
		//about calculating line changes.
		++col;
		return true;
	}
	return false;
}

/**
 * Parse as much whitespace as possible.
**/
void Parser::space(){
	char c;
	while(it!=end and isspace(c=*it)){
		++it;
		if(c=='\n'){
			++line;
			col=0;
		}
		else if(c=='\r'){
			if(it!=end and *it=='\n'){
				++it;
			}
			++line;
			col=0;
		}
		else{
			++col;
		}
	}
}

/**
 * Attempt to parse a tag (return NULL if it's not a tag).
**/
Tag* Parser::parse_tag(){
	if(!maybe_char('{')){
		return NULL;
	}
	space();

	SafePointer<Tag> tag(new Tag());

	while(!maybe_char('}')){
		SafePointer<Flake> key(parse_value());
		space();
		if(maybe_char(':')){
			colonline=line;
			coloncol=col-1;

			space();
			SafePointer<Flake> val(parse_value());
			space();

			//This isn't owned, so no safe pointer
			if(Flake* f=tag->get(key.value())){
				if(Section* s=f->as_section()){
					//Merge the value with the section.
					s->add(val.yield());
				}
				else{
					//Merge the values into a section.
					tag->set(key.value(),new Section(f,val.yield()));
				}
				//key has no purpose, so it'll be deleted
			}
			else{
				//Add a new named attribute.
				tag->set(key.yield(),val.yield());
			}
		}
		else{
			//Add the value to the positional attributes.
			tag->add(key.yield());
		}
	}

	if(ts){
		if(Tagdef td=ts->get(tag->get((size_t)0))){
			return td(tag.yield())->as_tag();
		}
	}
	return tag.yield();
}

/**
 * Parse the text pattern found in a section.
**/
Text* Parser::parse_section_text(){
	if(it==end){
		return NULL;
	}

	SaneString::iterator start=it;
	char c;

	do{
		c=*it;
		if(c=='\\'){
			//Section escapes consume any character regardless of what they are
			if(++it!=end and ++it!=end){
				c=*it;
			}
			else{
				throw ParseError(
					"EOF encountered while parsing a section.",
					line,col
				);
			}
		}
	}while(!(c=='{' or c==']') and ++it!=end);

	if(start==it){
		return NULL;
	}

	return new Text(text.substr(start-text.begin(),it-start));
}

/**
 * Try to parse a section, else return NULL.
**/
Section* Parser::parse_section(){
	if(!maybe_char('[')){
		return NULL;
	}

	SafePointer<Section> section(new Section());

	//These aren't safe pointers because the moment they have a value,
	//they're immediately handed to another owner.
	Text* text=(Text*)1;
	Tag* tag=(Tag*)1;
	while(text or tag){
		if(text=parse_section_text()){
			section->add(text);
		}
		if(tag=parse_tag()){
			section->add(tag);
		}
	}

	if(!maybe_char(']')){
		if(it==end){
			throw ParseError(
				"Reached end of string/file while parsing a section",line,col
			);
		}
		throw ParseError("Expected closing brace ].",line,col);
	}

	return section.yield();
}

/**
 * Try to parse a Snow text value.
**/
Text* Parser::parse_text(){
	if(it==end){
		return NULL;
	}

	SaneString::iterator start=it;
	char c,q;

	if(maybe_char('"')){
		q='"';
	}
	else if(maybe_char('\'')){
		q='\'';
	}
	else if(maybe_char('`')){
		q='`';
	}
	//Try unquoted
	else{
		do{
			c=*it;
			if(c=='\\'){
				if(++it!=end and ++it!=end){
					c=*it;
				}
				else{
					throw ParseError(
						"EOF encountered while parsing unquoted text",
						line,col
					);
				}
			}
		}while(!(
			//Ordered by expected frequency
			isspace(c) or c=='{' or c=='}' or c==':' or
			c=='"' or c=='\'' or c=='[' or c==']' or c=='`'
		) and ++it!=end);

		if(it==start){
			return NULL;
		}

		return new Text(text.substr(start-text.begin(),it-start));
	}

	//Must be quoted
	do{
		c=*it;
		if(c=='\\'){
			if(++it!=end and ++it!=end){
				c=*it;
			}
			else{
				throw ParseError(
					"EOF encountered while parsing quoted text",
					line,col
				);
			}
		}
	}while(c!=q and ++it!=end);

	if(!maybe_char(q)){
		throw ParseError(
			"EOF encountered while parsing quoted text",line,col
		);
	}

	return new Text(
		((SaneString)text.substr(start-text.begin(),it-start)).escape(q)
	);
}

Flake* Parser::parse_value(){
	Flake* f;
	if(f=parse_text()){
		return f;
	}

	if(f=parse_tag()){
		return f;
	}

	if(f=parse_section()){
		return f;
	}

	//Error checking

	/*
	Snow errors are very predictable, so check for common
	mistakes. By this point, we know the next character is
	one of the quote characters, ], }, whitespace, a control
	character, or EOF (if not, something is HORRIBLY wrong)
	*/

	if(it==end){
		throw ParseError(
			"Reached end of string/file while parsing tag",
			line,col
		);
	}

	char c=*it;

	if(c==']'){
		throw ParseError(
			"Unexpected close bracket ]. Did you forget to close a tag?",
			line,col-1
		);
	}

	if(c=='}'){
		throw ParseError(
			"Forgot to assign a value to the named attribute.",
			//These should point to the colon.
			colonline,coloncol
		);
	}

	if(c==':'){
		throw ParseError(
			"The colon is disallowed in unquoted text.",line,col-1
		);
	}

	if(isspace(c)){
		throw ParseError(
			"Expected a value, found whitespace. "
			"There's a problem with the API's parser code.",
			line,col
		);
	}

	//Reserved for cosmic ray errors
	throw ParseError(
		"Something went horribly wrong. "
		"There's a problem with the API's parser code.",
		line,col
	);
}

Text* Parser::parse_doc_text(){
	if(it==end){
		return NULL;
	}

	SaneString::iterator start=it;
	char c;

	do{
		c=*it;
		if(c=='\\' and ++it!=end){
			if(++it!=end){
				c=*it;
			}
			else{
				break;
			}
		}
	}while(c!='{' and ++it!=end);

	if(start==it){
		return NULL;
	}

	return new Text(text.substr(start-text.begin(),it-start));
}

Parser::Parser(Tagset* ts):ts(ts){}

Document* Parser::parse(const SaneString& s){
	text=s;
	it=text.begin();
	end=text.end();
	line=1;
	col=0;

	SafePointer<Document> doc(new Document());

	//These aren't safe pointers because the moment they have a value,
	//they're immediately handed to another owner.
	Flake* text=(Flake*)1;
	Flake* tag=(Flake*)1;
	while(text or tag){
		if(text=parse_doc_text()){
			doc->add(text);
		}
		if(tag=parse_tag()){
			doc->add(tag);
		}
	}

	return doc.yield();
}
