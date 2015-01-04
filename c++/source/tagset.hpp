#ifndef SNOW_TAGSET_HPP
#define SNOW_TAGSET_HPP

#include <vector>

#include "flake.hpp"

namespace snow{
	/**
	 * Utility class to store generic callables as tag definitions
	 *  rather than just function pointers.
	**/
	class Tagdef{
		protected:
			/**
			 * Abstracts away the type-specific wrapper using virtual functions.
			**/
			struct CallableBase{
				virtual ~CallableBase()=0;
				virtual Flake* call(Flake*)=0;
			}* callable;

			/**
			 * Type-specific wrapper that interfaces with the callable.
			**/
			template<typename T>
			struct Callable:public CallableBase{
				T callable;

				Callable(T f):callable(f){}

				virtual Flake* call(Flake* f){
					return callable(f);
				}
			};
		public:
			/**
			 * Construct an invalid tagdef.
			**/
			Tagdef(){
				callable=NULL;
			}

			template<typename T>
			Tagdef(T f){
				callable=new Callable<T>(f);
			}

			~Tagdef(){
				if(callable){
					delete callable;
				}
			}

			Flake* operator()(Flake* f){
				if(callable){
					return callable->call(f);
				}
				return NULL;
			}

			operator bool(){
				return (bool)callable;
			}
	};

	/**
	 * Manages tagset interaction with data interpretation.
	**/
	class Tagset{
		protected:
			/**
			 * A vector mapping tagnames to their definitions.
			**/
			std::vector<Flake*> tagnames;
			/**
			 * A vector storing functions to define tags.
			**/
			std::vector<Tagdef> defs;
		public:
			~Tagset();

			/**
			 * Get a tag definition from the list.
			**/
			Tagdef get(Flake* name);

			/**
			 * Add a tag definition to the list.
			 *
			 * If the name already exists, return false, else true.
			**/
			bool add(Flake* name,Tagdef def);
	};
}

#endif
