#ifndef SNOW_TEXT_HPP
#define SNOW_TEXT_HPP

#include "flake.hpp"
#include "sanestring.hpp"

namespace snow{
	/**
	 * A Snow text object.
	**/
	class Text:public Flake{
		public:
			/**
			 * The internal string.
			**/
			util::SaneString text;

			Text();

			Text(const util::SaneString& text,char q=' ');

			virtual bool eq(const Flake* x) const;

			virtual util::SaneString str() const;

			virtual util::SaneString mini(Tagset*) const;
	};
}

#endif
