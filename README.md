Snow is a general-purpose, highly expressive data representation. Using just three constructs (tag {...}, section [...], and text), practically any data structure can be represented directly.

Tags may accept _positional_ attributes (or attributes that don't have an associated name except via the tag's definition) or _named_ attributes, which may be intermixed as desired. Named attributes take priority, then/ positional attributes fill in whatever defined attributes haven't been specified. The first positional attribute is considered the tag's name, and attributes are separated by whitespace (if required to make it unambiguous).

Sections allow text and tags to be intermingled to allow for markup. Both the open brace { and close bracket ] can be escaped using a backslash.

Text can appear in tags as attribute names or values, and in sections. In tags, they may be optionally put into quotes (single or double), and support a number of escape sequences. If you prepend r to a quoted string, it's intrpeted as raw text, which doesn't escape anything except for the surrounding quote type.

Tag and attribute names can be text (quoted or unquoted), sections, or tags.

[Specification](https://docs.google.com/document/d/1w7YcvZA8QE_bOgvff7Lgq4eUINM5rttW0hmHlb8hxcU/edit)