#ifndef SNOW_TEXT_HPP
#define SNOW_TEXT_HPP

#include "flake.hpp"
#include "sanestring.hpp"

namespace snow{
	/**
	 * A Snow text object.
	**/
	class Text:public Flake{
		protected:
			/**
			 * The internal string.
			**/
			util::UString text;
			
		public:
			Text();

			virtual bool eq(const Flake* x) const;

			virtual util::SaneString str() const;

			virtual util::SaneString mini(Tagset*) const;
	};
}

#endif
