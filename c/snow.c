#include <stdlib.h>
#include <string.h>
#include "snow.h"

Text* new_text(char* text,bool own,size_t len){
	if(len==0){
		len=strlen(text);
	}
	
	if(!own){
		char* copy=malloc(len*sizeof char);
		memcpy(copy,text,len);
		text=copy;
	}
	
	Text* this=malloc(sizeof Text);
	this->base.type=TEXT;
	this->text=text;
	this->size=len+1;
	this->length=len;
	
	return this;
}

Tag* new_tag(FlakeList keys,FlakeList vals,FlakeList pos){
	Tag* this=malloc(sizeof Tag);
	this->base.type=TAG;
	this->keys=keys;
	this->vals=vals;
	this->pos=pos;
	
	return this;
}

Section* new_section(FlakeList vals){
	Section* this=malloc(sizeof Section);
	this->base.type=SECTION;
	this->vals=vals;
	
	return this;
}

Document* new_document(FlakeList vals){
	Document* this=malloc(sizeof Document);
	this->base.type=DOCUMENT;
	this->vals=vals;
	
	return this;
}

void delete_flake(Flake* f){
	switch(f->base.type){
		case TEXT:{
			Text* t=f;
			if(t->own){
				free(t->text);
			}
			break;
		}
		case TAG:{
			Tag* t=f;
			Flake* keys=t->keys.data;
			Flake* vals=t->vals.data;
			size_t i=t->keys.length;
			while(i--){
				delete_flake(*(keys++));
				delete_flake(*(vals++));
			}
			
			free(t->keys.data);
			free(t->vals.data);
			
			Flake* pos=t->pos.data;
			i=t->poslen;
			while(i--){
				delete_flake(*(pos++));
			}
			
			free(t->pos.data);
			
			break;
		}
		case SECTION:
		case DOCUMENT:{
			Section* s=f;
			Flake* it=s->vals.data;
			size_t i=s->length;
			while(i--){
				delete_flake(*(it++));
			}
			
			free(s->vals.data);
		}
	}
	
	free(f);
}

Text* as_text(Flake* f){
	if(f->base.type==TEXT){
		return f;
	}
	return NULL;
}

Tag* as_tag(Flake* f){
	if(f->base.type==TAG){
		return f;
	}
	return NULL;
}

Section* as_section(Flake* f){
	if(f->base.type==SECTION){
		return f;
	}
	return NULL;
}

Document* as_document(Flake* f){
	if(f->base.type==DOCUMENT){
		return f;
	}
	return NULL;
}

FlakeList new_flakelist(size_t n,...){
	va_list varg;
	Flake** f=malloc(n*sizeof Flake);
	
	va_start(varg,n);
	for(;n>=0;--n){
		*(f++)=va_arg(varg,Flake*);
	}
	
	FlakeList fl={n,n,f};
	return fl;
}

void flakelist_add(FlakeList* fl,Flake* f){
	if(fl->length==fl->size){
		fl->data=realloc(fl->data,fl->size+=fl->size/2);
	}
	fl->data[fl->length++]=f;
}

Section* section_add(Section* s,Flake* f){
	if(s->length==s->size){
		s->vals=realloc(s->vals,s->size+=s->size/2);
	}
	s->vals[s->len++]=f;
}

typedef struct{
	const char* error;
	size_t line,col,pos;
	Tag* hook(Tag*);
} ParserState;

void space(const char* text,size_t length,ParserState* ps){
	//Cache pos. Don't bother with line, it won't change that often.
	//Might consider caching text+pos instead, though that'd complicate the
	// logic somewhat
	size_t pos=ps->pos;
	
	while(pos<length){
		switch(text[pos]){
			//If it's not in this list, it's either not whitespace or
			// the stream is misaligned.
			default:
				goto not_space;
			
			//\u0085 and \u00a0 (NEL and NBSP)
			case 0xc2:
				if(pos+2<length){
					goto not_space;
				}
				++pos;
				//NEL
				if(text[pos]==0x85){
					++ps->line;
				}
				//NBSP? if not, exit
				else if(text[pos]!=0xa0){
					goto not_space
				}
				++pos;
				continue;
			
			//\u1680, "ogham space mark"
			case 0xe1:
				if(pos+2<length){
					goto not_space;
				}
				if(text[++pos]==0x9a){
					if(text[++pos]==0x80){
						++pos;
						continue;
					}
				}
				continue;
			//\u2000-\u200a, \u2028-\u2029, \u202f, \u205f
			case 0xe2:
				if(pos+2<length){
					goto not_space;
				}
				if(text[++pos]==0x80){
					++pos;
					//\u2000-\u200a
					if(text[pos]>=0x80 && text[pos]<=0x8a){
						++pos;
						continue;
					}
					//\u2008-\u2009, "line separator" & "paragraph separator"
					if(text[pos]==0xa8 || text[pos]==0xa9){
						++pos;
						++ps->line;
						continue;
					}
				}
				continue;
			//\u3000, "ideographic space"
			case 0xe3:
				if(pos+2<length){
					goto not_space;
				}
				if(text[++pos]==0x80){
					if(text[++pos]==0x80){
						++pos;
						continue;
					}
				}
				continue;
			
			case '\r':
				if(pos+1<length && text[pos+1]=='\n'){
					++pos;
				}
			case '\v':
			case '\f':
			case '\n':
				++ps->line;
			case '\t':
			case ' ':
				++pos;
		}
	}
	
	//Break from switch to outer loop
	not_space:
	
	ps->pos=pos;
}

Tag* parse_tag(const char* text,size_t length,ParserState* ps){
	if(ps->pos>=length || text[ps->pos]!='{'){
		return NULL;
	}
	++ps->pos;
	++ps->col;
	
	space(text,length,ps);
	
	Array* keys=new_array();
	Array* vals=new_array();
	Array* pos=new_array();
	
	while(ps->pos<length && text[ps->pos]!='}'){
		Flake* key=parse_value(text,length,ps);
		if(ps->error){
			return NULL;
		}
		
		space(text,length,ps);
		if(ps->pos<length){
			if(text[ps->pos]==':'){
				Flake** ka=keys->data;
				Flake** ke=ka+keys->length;
				for(;ka!=ke;++ka){
					if(flake_equal(*ka,key)){
						ps->error="Duplicate named attribute";
						return NULL;
					}
				}
				
				++ps->pos;
				++ps->col;
				
				space(text,length,ps);
				
				Flake* val=parse_value(text,length,ps);
				if(ps->error){
					return NULL;
				}
				
				array_add(keys,key);
				array_add(vals,val);
			}
			else{
				array_add(pos,key);
			}
		}
		else{
			ps->error="Reached EOF while parsing a tag.";
			return NULL;
		}
	}
	
	Tag* t=new_tag(keys->data,vals->data,pos->data,keys->length,pos->length);
	return ps->hook(t);
}

bool doc_needs_escape(char c){
	return c=='\\' || c=='{';
}

Text* parse_doc_text(const char* text,size_t length,ParserState* ps){
	size_t pos=ps->pos;
	
	while(ps->pos<length && !doc_needs_escape(text[ps->pos])){
		incr_pos(ps);
	}
	
	char* v=malloc((ps->pos-pos+1)*sizeof char);
	v[ps->pos-pos]=0;
	return new_text(v,true);
}

Document* parse(const char* doctext,size_t length=0){
	if(length==0){
		length=strlen(doctext);
	}
	ParserState ps={NULL,1,0,0};
	
	Array* a=new_array();
	Text* text;
	Tag* tag;
	do{
		text=parse_doc_text(doctext,length,&ps);
		if(text){
			array_add(a,text);
		}
		
		Tag* tag=parse_tag(doctext,length,&ps);
		if(tag){
			array_add(a,tag);
		}
	}while(text || tag);
	
	Document* doc=new_document(a->data);
	free(a);
	
	return doc;
}