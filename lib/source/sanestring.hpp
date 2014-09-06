#ifndef SNOW_SANESTRING_HPP
#define SNOW_SANESTRING_HPP

#include <string>

namespace snow{
	/**
	 * Used to contain utilities used only internally, lest there be
	 *  unnecessary namespace pollution.
	**/
	namespace util{
		/**
		 * Implements a few of the basic string functions implemented in all
		 * other modern languages.
		**/
		class SaneString:public std::string{
			public:
				SaneString();

				SaneString(char c);

				template<typename T>
				SaneString(T s):std::string(s){}

				/**
				 * Return a new string with all occurrences of f replaced with r.
				**/
				SaneString replace_all(const SaneString& f,const SaneString& r) const;

				/**
				 * Escape all characters in the given string in-place.
				**/
				SaneString& escape(SaneString x,char xc='\\');

				/**
				 * Return the number of occurrences of x.
				**/
				size_t count(const SaneString& s) const;
				size_t count(char c) const;
		};
	}
}

#endif
