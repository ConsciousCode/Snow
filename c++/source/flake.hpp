#ifndef SNOW_FLAKE_HPP
#define SNOW_FLAKE_HPP

#include "sanestring.hpp"

namespace snow{
	class Tag;
	class Section;
	class Text;
	class Document;
	class Tagset;

	/**
	 * Base class for snow data types.
	**/
	class Flake{
		public:
			/**
			 * Enum for the data type.
			**/
			enum Type{
				D_TEXT=1,
				S_TEXT=2,
				B_TEXT=3,
				TEXT=4,
				TAG=8,
				SECTION=16,
				DOCUMENT=17
			}type;

			virtual ~Flake();

			/**
			 * Return whether or not the flake is equal to the other.
			**/
			virtual bool eq(const Flake* f) const=0;

			/**
			 * Return if the flake is a tag.
			**/
			bool is_tag() const;

			/**
			 * Return the flake as a tag if it is one, else NULL.
			**/
			Tag* as_tag() const;

			/**
			 * Return if the flake is a section (includes document).
			**/
			bool is_section() const;

			/**
			 * Return the flake as a section if it is one, else NULL.
			**/
			Section* as_section() const;

			/**
			 * Return if the flake is a text object.
			**/
			bool is_text() const;

			/**
			 * Return the flake as a text object if it is one, else NULL.
			**/
			Text* as_text() const;

			/**
			 * Return if the flake is a document object.
			**/
			bool is_doc() const;

			/**
			 * Return the flake as a document if it is one, else NULL.
			**/
			Document* as_doc() const;

			/**
			 * Stringify the Snow value.
			**/
			virtual util::SaneString str() const=0;
			/**
			 * Stringify the Snow value as the smallest possible representation.
			 *  This takes a tagset because tags can use it to remove names
			 *  from named attributes.
			**/
			virtual util::SaneString mini(Tagset*) const=0;
	};
}

#endif
