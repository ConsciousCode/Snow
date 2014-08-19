Snow is a general-purpose, highly expressive data representation. Using just three constructs (tag {...}, section [...], and text), practically any data structure can be represented directly.

Tags may accept _positional_ attributes (or attributes that don't have an associated name except via the tag's definition) or _named_ attributes, which may be intermixed as desired. Named attributes take priority, then positional attributes fill in whatever defined attributes haven't been specified. The first positional attribute is by convention considered the tag's name (though it does not necessarily have to be), and attributes are separated by whitespace (if required to make it unambiguous).

Sections allow text and tags to be intermingled to allow for markup. Both the open brace { and close bracket ] can be escaped using a backslash, and any other instance of a backslash will simply yield a backslash.

Text can appear in tags as attribute names or values, and in sections. In tags, they may be optionally put into quotes (single or double), and support a number of escape sequences. If you prepend r to a quoted string, it's intrpeted as raw text, which doesn't escape anything except for the surrounding quote type. If the text is unquoted, there are a few more restrictions to keep them unambiguous.

Tag and attribute names can be text (quoted or unquoted), sections, or tags.

<<<<<<< HEAD
tl;dr:
* **Tagsets** define how to interpret tags and their attributes.
* {**tags** ...} are for structured data (like JSON) and can have _positional_ or _named_ attributes.
  - {tagname "positional attribute" name:"named attribute"}
  - {tagname name:"named attribute" "positional atttribute"} - yields the same interpretation.
  - {[tag names may have any value] val:data} {{including tags} with:attributes}
* [**sections** {with tags}] are for unstructured data (like XML).
  - [Close brackets \\] and open braces \\{ must be escaped in a section. Text escapes also work.]
  - Sections may only contain unquoted text and tags.
* "**text**" 'in' all r"it's" r'forms' is for raw data.
  - There is _only_ text - what it means is left to the tagset.
* The **document** is the whole file and is a special-case section.
  - Close brackets ] _don't_ have to be escaped in the document's root.

[Specification](https://docs.google.com/document/d/1w7YcvZA8QE_bOgvff7Lgq4eUINM5rttW0hmHlb8hxcU/edit) (it's stupidly short)
[Example](https://docs.google.com/document/d/1cD9bDQs-frXRlzWZPJ3e5-jozZo8wKse2Ehfiqo5Gno/edit)

### API Documentation
Note that snow.js and snow.json.js are designed to be loaded in any order.

#### snow.js
Snow.js exposes a single object named snow (for Node, it returns this object).

Notes:
* Values (keys and values of named attributes and positional attributes) are all strings, tags, or arrays of strings or tags

The snow object contains the following functions:
* Tag - Object used to represent a tag in Snow.
 - constructor
  * keys - An array of keys for the named attributes of the tag (optional).
  * vals - An array of values for the named attributes of the tag (optional).
  * pos - An array of positional attributes of the tag (optional).
 - apply - Apply a function to an item contained by the tag (mostly used as an internal utility function to reduce repetition for indexing values).
  * key - The key to index.
  * f - The callback to apply (takes an array and a key with this set to the tag).
 - interpret - Interpret a positional attribute as a named attribute (mostly used internally to build tags).
  * key - The name to give the attribute.
 - eq - Compare the tag with another tag (always returns false for strings and arrays).
 - get - Get the value with a particular key (int for a positional attribute, a Snow value for named attributes).
 - set - Set the value with a particular key to a particular value.
 - del - Delete the value with a particular key.
 - has - Return if the tag has a value with the given key.
 - iter - Implements the ECMAScript 6 iteration protocol (with the extra value name returned for the named attribute) to iterate over the tag's named attributes.
* Tagdef - A utility factory function for creating a tag definition.
 - attrn - Names (Snow values) to interpret positional attributes as named attributes. If these aren't explicitly set by a named attribute, positional attributes are assumed to be these (in order).
 - build - A callback for intercepting the tag building process after it's been built. Takes the built tag and the extra data and should return a processed tag. By default this will just return tag.
* Text - A function for building a text object (currently just a string).
 - s - The string from which to build the text object.
 - q - The quote character used (one of '"', "'", '`', or "")
* Section - A function for building section object (currently just an array).
 - x - The array from which to build the section object.
* ParseError - A utility function for building an error related to parsing.
 - msg - The main message of the error.
 - line - The line on which the error occurs.
 - col - The column on which the error occurs.
 - extra - Extra data to keep with the error (used to give some reports specificity).
* Parser - The main parser object.
 - constructor
  * ts - Either a tag or an object matching tag names to functions which build a tag from the given keys, values, and positional attributes (which will usually be created using Tagdef)
 - peek - Check if the text at the current position matches the given regex.
 - incr - Increment positioning variables according to the result.
 - maybe - Try to match the regex if possible, else return null.
 - expect - Parse a pattern that's expected (e.g. won't parse without) or else error.
 - space - Helper function for parsing whitespace.
 - parse_doc - Parse a document (also used in parse_section).
  * txtpat - A regex matching the text that can be contained by the doc/section (allows this to be reused for sections)
  * extra - Extra data object passed around for storing state during parsing.
 - parse_tag - Parse and return a tag, else return null.
  * extra - Extra data object passed around for storing state during parsing.
 - parse_section - Parse a section, else return null.
  * extra - Extra data object passed around for storing state during parsing.
 - parse_value - Parse a value (text, section, or tag, biggest source of errors).
  * extra - Extra data object passed around for storing state during parsing.
 - parse - Parse a Snow document.
  * s - The string from which to parse the document.
  * extra - Extra data object passed around for storing state during parsing.
* parse - Parse a Snow document without having to deal with the Parser object.
 - s - The string from which to parse the document.
 - ts - Either a tag or an object matching tag names to functions which build a tag from the given keys, values, and positional attributes (which will usually be created using Tagdef)
 - extra - Extra data object passed around for storing state during parsing.
* stringify - Stringify a Snow value (text/string, section/array, or tag, vanilla objects will cause errors).
 - x - The object to stringify.
 - f - Optional, an error first callback mostly used for Node compatibility (executes asynchronously - if not specified, stringification returns synchronously).
* minify - Stringify a Snow value with the smallest possible representation. This is a little bit slower, and can reduce readability.
 - x - The object to minify.
 - tags - An object (same as ts for parse) used to strip names from named attributes in favor of implicit naming (to avoid this, pass {}).
 - f - Optional, an error first callback mostly used for Node compatibility (executes asynchronously - if not specified, minification returns synchronously).