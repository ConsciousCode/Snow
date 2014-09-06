#ifndef SNOW_DOC_HPP
#define SNOW_DOC_HPP

#include <vector>

#include "flake.hpp"
#include "sanestring.hpp"

namespace snow{
	/**
	 * An object representing a Snow document. This also acts as a base for
	 *  Section because of the stark similarities.
	**/
	class Document:public Flake{
		public:
			/**
			 * A list of all the flakes contained by the document.
			 * ALL of these are assumed to be text and tags - sections have
			 *  undefined behavior.
			**/
			std::vector<Flake*> flakes;

			Document();

			virtual ~Document();

			virtual bool eq(const Flake* x) const;

			/**
			 * Return an iterator for the beginning.
			**/
			std::vector<Flake*>::iterator begin();

			/**
			 * Return an iterator for the end.
			**/
			std::vector<Flake*>::iterator end();

			/**
			 * Add another flake to the section and return it.
			**/
			Flake* add(Flake* x);

			/**
			 * Get an entry from the document. If it doesn't exist, return NULL.
			**/
			Flake* get(size_t x);

			/**
			 * Set an entry in the document. If x isn't within the document's
			 *  range, return false, else true. If x is out of range, but only
			 *  by one, has the same behavior as add()
			**/
			bool set(size_t x,Flake* f);

			virtual util::SaneString str() const;

			virtual util::SaneString mini(Tagset*) const;
	};
}

#endif
