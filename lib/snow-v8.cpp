#include "snow-v8.hpp"

#define V8_WRAP(NAME,TYPE,FUNC) v8Flake::NAME(const Arguments& args){\
	HandleScope scope;\
	return scope.Close(\
		TYPE::New(ObjectWrap::Unwrap(args.This())->FUNC())\
	);\
}

#define V8_ADD_METHOD(NAME) tpl->PrototypeTemplate()->Set(\
	String::NewSymbol(#NAME),FunctionTemplate::New(NAME)->GetFunction());

using namespace v8;

v8Flake::v8Flake(Flake* f){
	value=f;
}

v8Flake::~v8Flake(){
	delete value;
}

V8_WRAP(equals,Boolean,eq);
V8_WRAP(is_tag,Boolean,is_tag);
V8_WRAP(is_section,Boolean,is_section);
V8_WRAP(is_text,Boolean,is_text);
V8_WRAP(is_doc,Boolean,is_doc);
V8_WRAP(toString,Boolean,str);
V8_WRAP(toMini,Boolean,mini);

v8Flake::InitMethods(Persistent<FunctionTemplate>& tpl){
	V8_ADD_METHOD(equals);
	V8_ADD_METHOD(is_tag);
	V8_ADD_METHOD(is_section);
	V8_ADD_METHOD(is_text);
	V8_ADD_METHOD(is_doc);
	V8_ADD_METHOD(toString);
	V8_ADD_METHOD(toMini);
}

void v8Text::Init(Handle<Object> target){
	HandleScope scope;
	
	Local<FunctionTemplate> tpl=FunctionTemplate::New(New);
	Local<String> name=String::NewSymbol("Text");
	
	constructor=Persistent<FunctionTemplate>::New(tpl);
	constructor->InstanceTemplate()->SetInternalFieldCount(1);
	constructor->SetClassName(name);
	
	v8Flake::InitMethods(tpl);
	
	target->Set(name,constructor->GetFunction());
}

Handle v8Text::New(const Arguments& args){
	HandleScope scope;
	
	if(args.IsConstructCall()){
		TryCatch err;
		char* s=String::Utf8Value(args[0]->ToString());
		if(err.HasCaught()){
			return err.ReThrow();
		}
		v8Text* self=new v8Text(s);
		self->Wrap(args.This());
		
		self->SetAccessor(String::New("text"),TextGetter,TextSetter);
		
		return args.This();
	}
	else{
		const int argc=1;
		Local argv[argc]={args[0]};
		return scope.Close(constructor->NewInstance(argc,argv));
	}
}

//Utility function to extract this pointer from an AccessorInfo object.
template<typename T>
T* unwrap_self(const AccessorInfo& info){
	Local<Object> holder=info.Holder();
	Local<External> wrap=Local<External>::Cast(holder->GetInternalField(0));
	return (T*)wrap->Value();
}

Local<Value> v8Text::TextGetter(Local<String> prop,const AccessorInfo& info){
	return String::New(unwrap_self<v8Text>(info)->str().c_str());
}

void v8Text::TextSetter(Local<String> prop,Local<Value> val,
		const AccessorInfo& info){
	if(char* s=*String::Utf8Value(val)){
		unwrap_self<v8Text>(info)->text=s;
	}
}

v8Text::v8Text(Text* t):v8Flake(t){}

v8Text::v8Text(const std::string& s):v8Flake(new Text(s));

void InitMethods(v8::Persistent<v8::FunctionTemplate>& tpl){
	v8Flake::InitMethods(tpl);
	tpl->SetIndexedPropertyHandler(
		v8Document::Get,
		v8Document::Set,
		v8Document::Has,
		v8Document::Del,
		v8Document::Enum
	);
}

void v8Document::Init(Handle<Object> target){
	HandleScope scope;
	
	Local<FunctionTemplate> tpl=FunctionTemplate::New(New);
	Local<String> name=String::NewSymbol("Document");
	
	constructor=Persistent<FunctionTemplate>::New(tpl);
	constructor->InstanceTemplate()->SetInternalFieldCount(1);
	constructor->SetClassName(name);
	
	v8Document::InitMethods(tpl);
	
	target->Set(name,constructor->GetFunction());
}

Handle<Value> v8Document::Get(uint32_t x,const AccessorInfo& info){
	v8Document* self=unwrap_self<v8Document>(info);
	
	Flake* f=self->get(x);
	if(f){
		if(Text* t=f->as_text()){
			return External::New(new Text(t));
		}
		else{
			return External::New(new Tag((Tag*)f));
		}
	}
	return Undefined();
}

Handle<Value> v8Document::Set(uint32_t x,Local<Value> v,const AccessorInfo&){
}

Handle<Value> v8Document::Has(uint32_t x,const AccessorInfo&){
}

Handle<Boolean> v8Document::Del(uint32_t x,const AccessorInfo&){
}

Handle<Array> v8Document::Enum(const AccessorInfo&){
}

void RegisterModule(Handle<Object> target){
	v8Text::Init(target);
	v8Document::Init(target);
	v8Section::Init(target);
	v8Tag::Init(target);
	v8Parser::Init(target);
}

NODE_MODULE(snow,RegisterModule);