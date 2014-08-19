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
=======
[Specification](https://docs.google.com/document/d/1w7YcvZA8QE_bOgvff7Lgq4eUINM5rttW0hmHlb8hxcU/edit)
>>>>>>> bf2316e517c6787d4e34508ac39acaba85332b9b
