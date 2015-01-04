#include "parser.hpp"
#include "tagset.hpp"

//Error messages
const char* SECTION_EOF="Reached end of string/file while parsing a section.";
const char* UNQUOTED_EOF=
	"Reached end of string/file while parsing unquoted text.";
const char* QUOTED_EOF="Reached end of string/file while parsing quoted text.";
const char* EXPECTED_CLOSE_SECTION="Expected close bracket ].";
const char* TAG_EOF="Reached end of string/file while parsing a tag";
const char* UNEXPECTED_CLOSE_SECTION=
	"Unexpected close bracket ]. Did you forget to close a tag?";
const char* UNNAMED_ATTR="Forgot to assign a value to the named attribute.";
const char* ILLEGAL_NAMED="The colon is disallowed in unquoted text.";
const char* UNEXPECTED_SPACE="Expected a value, found whitespace. "
	"There's a problem with the API's parser code.";
const char* COSMIC_RAY_ERR="Something went horribly wrong. "
	"There's a problem with the API's parser code.";

const char* UNICODE_EOF="Reached end of string/file while parsing a Unicode "
	"codepoint.";

//Relevant characters
char OPEN_TAG='{';
char NAMED_ATTR=':';
char CLOSE_TAG='}';
char OPEN_SECTION='[';
char CLOSE_SECTION=']';
char QUOTE1='"';
char QUOTE2='\'';
char QUOTE3='`'
char ESCAPE_CHAR='\\';

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

void Parser::calc_line(char c){
	if(c=='\r'){
		if(it!=end and *it=='\n'){
			++it;
		}
		++line;
		col=0;
	}
	//Unix-style and some ASCII newlines in Unicode standard
	else if(c=='\n' or c=='\v' or c=='\f'){
		++line;
		col=0;
	}
	else{
		++col;
	}
}

char Parser::parse_escape(char c,const char* eof){
	if(c==ESCAPE_CHAR){
		//Escapes consume the next character regardless of what it is
		if(++it!=end){
			//We still need to check for newlines for error messages.
			calc_line(*it);
			if(++it!=end){
				return *it;
			}
		}
		
		if(eof){
			throw ParseError(eof,line,col);
		}
		
		return *(--it);
	}
	
	calc_line(c);
	
	//Can't return c directly because calc_line may have incremented.
	return *it;
}

void Parser::space(){
	char c;
	while(it!=end and isspace(c=*it)){
		++it;
		calc_line(c);
	}
}

Tag* Parser::parse_tag(){
	if(!maybe_char(OPEN_TAG)){
		return NULL;
	}
	space();

	SafePointer<Tag> tag(new Tag());

	while(!maybe_char(CLOSE_TAG)){
		SafePointer<Flake> key(parse_value());
		space();
		if(maybe_char(NAMED_ATTR)){
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

Text* Parser::parse_section_text(){
	if(it==end){
		return NULL;
	}

	SaneString::iterator start=it;
	char c;

	do{
		c=parse_escape(*it,SECTION_EOF);
	}while(!(c==OPEN_TAG or c==CLOSE_SECTION) and ++it!=end);

	if(start==it){
		return NULL;
	}

	return new Text(text.substr(start-text.begin(),it-start));
}

Section* Parser::parse_section(){
	if(!maybe_char(OPEN_SECTION)){
		return NULL;
	}

	SafePointer<Section> section(new Section());

	//These aren't safe pointers because the moment they have a value,
	//they're immediately handed to another owner.
	Text* text;
	Tag* tag;
	do{
		if(text=parse_section_text()){
			section->add(text);
		}
		if(tag=parse_tag()){
			section->add(tag);
		}
	}while(text or tag);

	if(!maybe_char(CLOSE_SECTION)){
		if(it==end){
			throw ParseError(SECTION_EOF,line,col);
		}
		throw ParseError(EXPECTED_CLOSE_SECTION,line,col);
	}

	return section.yield();
}

Text* Parser::parse_text(){
	if(it==end){
		return NULL;
	}

	SaneString::iterator start=it;
	char c,q;

	if(maybe_char(QUOTE1)){
		q=QUOTE1;
	}
	else if(maybe_char(QUOTE2)){
		q=QUOTE2;
	}
	else if(maybe_char(QUOTE3)){
		q=QUOTE3;
	}
	//Try unquoted
	else{
		do{
			c=parse_escape(*it,UNQUOTED_EOF);
		}while(!(
			//Ordered by expected frequency
			isspace(c) or c==OPEN_TAG or c==CLOSE_TAG or c==NAMED_ATTR or
			c==QUOTE1 or c==QUOTE2 or c==OPEN_SECTION or c==CLOSE_SECTION or
			c==QUOTE3
		) and ++it!=end);

		if(it==start){
			return NULL;
		}

		return new Text(text.substr(start-text.begin(),it-start));
	}

	//Must be quoted
	do{
		c=parse_escape(*it,QUOTED_EOF);
	}while(c!=q and ++it!=end);

	if(!maybe_char(q)){
		throw ParseError(QUOTED_EOF,line,col);
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
		throw ParseError(TAG_EOF,line,col);
	}

	char c=*it;

	if(c==CLOSE_SECTION){
		throw ParseError(UNEXPECTED_CLOSE_SECTION,line,col-1);
	}

	if(c==CLOSE_TAG){
		throw ParseError(UNNAMED_ATTR,colonline,coloncol);
	}

	if(c==NAMED_ATTR){
		throw ParseError(ILLEGAL_NAMED,line,col-1);
	}

	if(isspace(c)){
		//This should NEVER happen. Guarantees a problem with the parser.
		throw ParseError(UNEXPECTED_SPACE,line,col);
	}

	//Reserved for cosmic ray errors
	throw ParseError(COSMIC_RAY_ERR,line,col);
}

Text* Parser::parse_doc_text(){
	if(it==end){
		return NULL;
	}

	SaneString::iterator start=it;
	char c;

	do{
		c=parse_escape(*it,NULL);
	}while(c!=OPEN_TAG and ++it!=end);

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
	Flake* text;
	Flake* tag;
	do{
		if(text=parse_doc_text()){
			doc->add(text);
		}
		if(tag=parse_tag()){
			doc->add(tag);
		}
	}while(text or tag);

	return doc.yield();
}
