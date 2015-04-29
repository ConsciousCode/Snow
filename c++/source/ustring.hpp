#ifndef SNOW_UTIL_USTRING_HPP
#define SNOW_UTIL_USTRING_HPP

#include <cstdint>

namespace snow{
	namespace util{
		class UString{
			protected:
				/**
				 * The size and length of the internal string.
				**/
				int size,len;
				
				/**
				 * The width of the unit code points in the string.
				**/
				uint_fast8_t width;
				
				/**
				 * The actual string data.
				**/
				union{
					/**
					 * Used when all the character code points can be stored
					 *  within 8 bits.
					**/
					uint8_t* data1;
					/**
					 * Used when all the character code points can be stored
					 *  within 16 bits.
					**/
					uint16_t* data2;
					/**
					 * Used when all the character code points can be stored
					 *  within 32 bits.
					**/
					uint32_t* data4;
				};
			
			public:
				UString();
				
				unsigned length();
				
				unsigned get(unsigned x);
				
				void append(unsigned x);
		};
	}
}

#endif
