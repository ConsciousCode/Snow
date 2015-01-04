#ifndef SNOW_PARSER_HPP
#define SNOW_PARSER_HPP

#include <stdexcept>

#include "flake.hpp"
#include "text.hpp"
#include "tag.hpp"
#include "section.hpp"
#include "document.hpp"

namespace snow{
	/**
	 * Error thrown to indicate a parsing error.
	**/
	class ParseError:public std::runtime_error{
		public:
			/**
			 * The line and column at which the error occurred.
			**/
			size_t line,col;

			ParseError(const std::string& s,size_t line,size_t col);
	};

	/**
	 * The main Snow parser.
	**/
	class Parser{
		protected:
			/**
			 * The text to parse.
			**/
			SaneString text;

			/**
			 * The tagset being parsed (NULL if none is being used). This is
			 *  not owned, and should be handled by the code that creates it.
			**/
			Tagset* ts;

			/**
			 * Iterators used to parse the given string.
			 *
			 * @todo Make these generic (support for files/network connections/
			 *  etc, requires some modifications to Parser::parse_text).
			**/
			util::SaneString::iterator it,end;

			/**
			 * Keeping track of the line and column for debugging.
			**/
			size_t line,col;

			/**
			 * Line and column of the last colon for error messages, which may
			 *  occur after parsing whitespace, thrown when no value is given
			 *  for a named attribute pair. These simplify logic for determining
			 *  the relevant line and column.
			**/
			size_t colonline,coloncol;

			/**
			 * Return true if c is the next character, else false. If true,
			 *  this will also increment the iterator forward.
			**/
			bool maybe_char(char c);
			
			/**
			 * Calculate the change in line and column given the current
			 *  character.
			**/
			void calc_line(char c);

			/**
			 * Attempts to parse an escape and returns the character after it.
			 *  This is mostly used as a utility to avoid repetition. Takes
			 *  the current character and an error message if an EOF is
			 *  encountered (NULL for none).
			**/
			char parse_escape(char c,const char* eof);
			
			/**
			 * Parse as much whitespace as possible.
			**/
			void space();

			/**
			 * Attempt to parse a tag (return NULL if it's not a tag).
			**/
			Tag* parse_tag();

			/**
			 * Parse the text pattern found in a section (NULL when empty,
			 *  error on EOF).
			**/
			Text* parse_section_text();

			/**
			 * Try to parse a section, else return NULL.
			**/
			Section* parse_section();

			/**
			 * Try to parse a Snow text value, else return NULL.
			**/
			Text* parse_text();

			/**
			 * Parse one of the three Snow types, else throw an error.
			 *  This function is guaranteed to return a non-null flake pointer
			 *  or error.
			**/
			Flake* parse_value();

			/**
			 * Parse and return the text pattern found in a document's root
			 *  (NULL on empty).
			**/
			Text* parse_doc_text();
		public:
			/**
			 * Construct a parser for the given tagset.
			**/
			Parser(Tagset* ts=NULL);

			/**
			 * Parse a Snow document from the given string.
			**/
			Document* parse(const util::SaneString&);
	};
}

#endif
