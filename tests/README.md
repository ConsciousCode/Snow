All .test files in this directory are designed to allow testing for correct Snow parsing and the handling of specific edge cases. They are formatted such that the sample Snow document begins the file, and the corresponding textual serialized version is separated via the text sequence ~~. For convenience, a JSON file that contains all of these is made available along with the Python script to generate it. Newlines and whitespace surrounding this sequence are literal and part of the corresponding document.

The serialization format is designed to unambiguously illuminate any parsing issues and be algorithmically trivial to generate for most languages. A test is passed if the serialized version of the document compares IDENTICALLY to the provided serialization. n/m are arbitrary-length decimal numbers indicating the length of the object or group of objects they describe; they should be integers with no leading zeros. The format is command-based using the following commands:

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
  - n is the length of the text in characters (the length of the original string in characters, not the literal length including the escapes, e.g. "1:~128555.")
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
	* " (unclosed double-quoted text)
	* ' (unclosed single-quoted text)
	* ` (unclosed back tick-quoted text)

Any character outside of the value range [32,125] must be escaped using a tilde ~ character and the unicode codepoint in decimal ending with a period. Note that the tilde itself is not within that range and should be encoded as "~126.". This escape should use the smallest possible number of characters, having no leading 0s; the null character is the only exception ("~0."). Originally hexadecimal was used, however it was determined that this was needlessly complex, as most languages require less code to convert integers to decimal, especially when the result had to be capitalized.

Named attributes are lexicographically ordered using the already encoded name. Note that no two names can be identical, thus appending the named attribute's value to the name before ordering will produce identical results. This scheme greatly simplifies ordering logic at the cost of human readability, as the ordering between two text objects looks at the string length before any other characters. Between objects, text will always come before sections which will always come before tags; documents will never need to be compared.

This serialization format is designed for simple and unambiguous serialization only. While it's possible to read and de-serialize, no effort is made or expected from implementers to do so.