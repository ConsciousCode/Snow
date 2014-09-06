#ifndef SNOW_SECTION_HPP
#define SNOW_SECTION_HPP

#include "document.hpp"

namespace snow{
	/**
	 * A Snow section object.
	**/
	class Section:public Document{
		public:
			Section();
			/**
			 * Initialize the section with two components.
			**/
			Section(Flake*,Flake* b);

			virtual util::SaneString str() const;

			virtual util::SaneString mini(Tagset*) const;
	};
}

#endif
