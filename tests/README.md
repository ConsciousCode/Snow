All files in this directory (excluding this file) are designed to allow testing for correct Snow parsing and the handling of specific edge cases. They are formatted such that the sample Snow document begins the file, and the corresponding textual serialized version is separated via the text sequence ~~. Newlines and whitespace surrounding this sequence are literal and part of the corresponding document.

The serialization format is designed to unambiguously illuminate any parsing issues. A test is passed if the serialized version of the document compares IDENTICALLY to the provided serialization. n/m are arbitrary-length textual numbers indicating the length of the object or group of objects they describe; they should be integers with no leading zeros. The format is command-based using the following commands:

* {n<positional x n>m<<key><val> x m>}
  - Indicates a tag
  - n is the number of positional attributes
  - m is the number of named attributes
    * Paired keys and values should appear directly after one another
  - Note that it has a redundant closing brace } - any occurrence of } before the end of the tag has no special meaning and should not be escaped in any way.
* (n<values x n>)
  - Indicates a document
  - n is the number of items in the document
  - Note that it has a redundant closing parenthesis ) - any occurrence of ) before the end of the document has no special meaning and should not be escaped in any way.
* [n<values x n>]
  - Indicates a section
  - n is the number of items in the section
  - Note that it has a redundant closing bracket ] - any occurrence of ] before the end of the section has no special meaning and should not be escaped in any way.
* "n:<characters x n>"
  - Indicates a text object
  - n is the length of the text in characters (the length of the original string in characters, not the literal length including the escapes, e.g. "1:~1F62B.")
  - Note that it has a redundant closing quote " - any occurrence of the " character within the string has no special meaning and should not be escaped in any way.
* !s
  - An error (should be the only "object" if an error occurs, no document)
  - s is a string indicating the type of error that occurred. It can be one of:
    * : (unexpected colon in tag text)
	* :: (duplicate named attribute)
	* :? (didn't assign value to named attribute)
	* { (unclosed tag)
	* [ (unclosed section)
	* {] (mixed up tag and section)
	* " (unclosed quoted text)

Any character outside of the value range [32,125] must be escaped using a tilde ~ character and the unicode codepoint in hexadecimal (using all caps, e.g. ABCDEF) ended with a period. Note that the tilde itself is not within that range and should be encoded as "~7E.". This escape should use the smallest possible number of characters, having no leading 0s; the null character should have no digits ("~.").

Named attributes are ordered using the following rules:
* Text
  - Ordered by unicode codepoints, smaller text given precedence ("a" before "ab")
* Tag
  - Ordered by positional attributes first, then named attributes (in this order)
* Section
  - Ordered by contents of the section

This serialization format is designed for unambiguous serialization only. While it's possible to deserialize, no effort is made or expected from implementors to support it.