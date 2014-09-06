#ifndef SNOW_TAG_HPP
#define SNOW_TAG_HPP

#include <vector>

#include "flake.hpp"

namespace snow{
	/**
	 * A Snow tag. This acts as both an associative array for the named
	 *  attributes as well as a normal 
	**/
	class Tag:public Flake{
		public:
			std::vector<Flake*> keys;
			std::vector<Flake*> vals;
			std::vector<Flake*> pos;

			Tag();

			virtual ~Tag();

			virtual bool eq(Flake* x);

			/**
			 * Add a flake to the positional attributes.
			**/
			void add(Flake* f);

			/**
			 * Get a named attribute with the given name, else NULL.
			**/
			Flake* get(Flake* x);
			const Flake* get(Flake* x) const;

			/**
			 * Set a named attribute to the given name. If it previously existed, *  return true, else return false.
			**/
			bool set(Flake* key,Flake* val);

			/**
			 * Get a positional attribute at the given position, else NULL.
			**/
			Flake* get(size_t x);
			const Flake* get(size_t x) const;

			/**
			 * Set a positional attribute at the given position if it exists and
			 *  return true, else return false.
			**/
			bool set(size_t x,Flake* val);

			/**
			 * Return if the tag has a named attribute with the given key.
			**/
			bool has(Flake* x) const;

			/**
			 * Compare the tag to another flake.
			**/
			virtual bool eq(const Flake*) const;

			virtual util::SaneString str() const;

			virtual util::SaneString mini(Tagset* ts) const;
	};
}

#endif
