All files in this directory (excluding this file) are designed to allow testing for correct Snow parsing and the handling of specific edge cases. They are formatted such that the sample Snow document begins the file, and the corresponding textual serialized version is separated via the text sequence /* --- */.

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
  - n is the length of the text in characters
  - Note that it has a redundant closing quote " - any occurrence of the " character within the string has no special meaning and should not be escaped in any way.
* !s
  - An error (should be the only "object" if an error occurs)
  - s is a string indicating the type of error that occurred. It can be one of:
    * : (unexpected colon in tag text)
	* :: (duplicate named attribute)
	* :? (didn't assign value to named attribute)
	* { (unclosed tag)
	* [ (unclosed section)
	* " (unclosed quoted text)