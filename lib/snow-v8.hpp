#include <node.h>

#include "snow.hpp"

class v8Flake:public node::ObjectWrap{
	protected:
		snow::Flake* value;
	public:
		static void InitMethods(v8::Local<v8::FunctionTemplate>& tpl);
		
		static v8Handle equals(const v8::Arguments& args);
		
		static v8Handle is_tag(const v8::Arguments& args);
		static v8Handle is_section(const v8::Arguments& args);
		static v8Handle is_text(const v8::Arguments& args);
		static v8Handle is_doc(const v8::Arguments& args);
		
		static v8Handle toString(const v8::Arguments& args);
		static v8Handle toMini(const v8::Arguments& args);
		
		v8Flake(Flake*);
		virtual ~v8Flake();
}

class v8Text:public v8Flake{
	public:
		static v8::Persistent<v8::FunctionTemplate> constructor;
		static void Init(v8::Handle<v8::Object> target;
		
		static v8::Handle New(const v8::Arguments& args);
		static v8::Handle<v8::Value> TextGetter(v8::Local<v8::String> prop,
			const v8::AccessorInfo& info);
		static void TextSetter(v8::Local<String> prop,v8::Local<v8::Value> val,
			const v8::AccessorInfo& info);
		
		v8Text(snow::Text*);
		v8Text(const std::string&);
};

class v8Document:public v8Flake{
	public:
		static v8::Persistent<v8::FunctionTemplate> constructor;
		static void InitMethods(v8::Local<v8::FunctionTemplate>& tpl);
		static void Init(v8::Handle<v8::Object> target;
		
		static v8::Handle<v8::Value> New(const v8::Arguments& args);
		
		static v8::Handle<v8::Value> Get(uint32_t,const v8::AccessorInfo&);
		static v8::Handle<v8::Value> Set(uint32_t,v8::Local<v8::Value>,
			const v8::AccessorInfo&);
		static v8::Handle<v8::Value> Has(uint32_t,const v8::AccessorInfo&);
		static v8::Handle<v8::Boolean> Del(uint32_t,const v8::AccessorInfo&);
		static v8::Handle<v8::Array> Enum(const v8::AccessorInfo&);
		
		v8Document(Document*);
};