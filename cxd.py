import re

class ParseError(RuntimeError):
	'''
	An error issued whenever there was an error in parsing.
	'''
	def __init__(self,msg,line,col,extra=None):
		'''
		msg - The message of the error.
		line - The line at which the error occurred.
		col - The column at which the error occurred.
		extra - Any relevant extra data.
		'''
		RuntimeError.__init__(self,"{} (ln: {} col: {})".format(msg,line,col))
		self.line=line
		self.col=col
		self.extra=extra

## Compiled regexes for use in the parser

#: Regex for matching a newline
_LINES=re.compile(r"\r\n|\n|\r",re.MULTILINE)
#: Regex for matching a block of whitespace
_WHITESPACE=re.compile(r"\s+",re.MULTILINE)
#: Regex for an open brace {
_OPEN_BRACE=re.compile(r"\{")
#: Regex for a close brace }
_CLOSE_BRACE=re.compile(r"\}")
#: Regex for an open bracket [
_OPEN_BRACK=re.compile(r"\[")
#: Regex for a close bracket ]
_CLOSE_BRACK=re.compile(r"\]")
#: Regex for a colon
_COLON=re.compile(":")
#: Regex for a name
_NAME=re.compile(r"""[^\s\x00-\x1f{}\[\]:"']+""")
#: Regex for a number
_NUMBER=re.compile(r"(?:-|\+)?(?:(?:\d*\.\d+|\d+\.\d*)(?:e-?\d+)?|(0b|0|0x)?(\d+))",re.IGNORECASE)
#: Regex for a string
_STRING=re.compile(r"""(r)?(?:"([^\\"]*|\\.)"|'([^\\']*|\\.)')""",re.MULTILINE)
#: Regex for a comment
_COMMENT=re.compile(r"\{!([^\\}]|\\.)\}",re.MULTILINE)
#: Regex for any text that doesn't contain a tag
_NOTAG_TEXT=re.compile(r"(?:[^\\{\]]|\\.)*",re.MULTILINE)

## DOM type hierarchy
class Value:
	'''
	The base type for all values a CXD document can represent.
	'''
	pass

class Tag(Value):
	'''
	A tag value.
	'''
	def __init__(self,args,kwargs,d):
		'''
		args - Positional attributes.
		kwargs - Named attributes.
		d - The tag's definition.
		'''
		self.name=args[0]
		self.attrs=kwargs
		self.extra=[]
		#figure out positional arguments
		for x in range(1,len(args)):
			#if we've gone past the defined attributes, quit
			if len(d.attrs)==len(self.attrs):
				self.extra.extend(args[x:])
				break
			#search through the attributes until we find one
			#that isn't taken
			for y in range(len(d.attrs)):
				if d.attrs[y].name not in self.attrs:
					break
			else:
				#this attribute is unknown.
				self.extra.append(args[x])
				continue
			self.attrs[d.attrs[y].name]=args[x]
	
	def __hash__(self):
		return hash((Tag,self.name,tuple(self.attrs.items(),tuple(self.extra))))
	
	def __repr__(self):
		if len(self.attrs)>0:
			if len(self.extra)>0:
				return "{{{} {} {}}}".format(self.name,' '.join("{}:{}".format(x,repr(y)) for x,y in self.attrs.items()),' '.join(repr(x) for x in self.extra))
			else:
				return "{{{} {}}}".format(self.name,' '.join("{}:{}".format(x,repr(y)) for x,y in self.attrs.items()))
		else:
			if len(self.extra)>0:
				return "{{{} {}}}".format(self.name,' '.join(repr(x) for x in self.extra))
			else:
				return "{{{}}}".format(self.name)

class Section(Value):
	'''
	A section of intermixed text and tags.
	'''
	def __init__(self,elems):
		#strip whitespace
		if len(elems)>1:
			self.elems=[Text(x.value.strip()) if type(x) is Text else x for x in  elems]
		else:
			self.elems=elems
	
	def __hash__(self):
		return hash((Section,tuple(self.elems)))
	
	def __repr__(self):
		return "[{}]".format(''.join(repr(x) for x in self.elems))
	
	def toText(self,stringify=False):
		'''
		Section's toText can optionally take a boolean to
		indicate whether to stringify any tags within the
		section, or to generate an error.
		'''
		
		def gen():
			for x in self.elems:
				if type(x) is not Tag:
					yield x.toText().value
				else:
					raise ValueError("Attempted to stringify a tag")
		
		return Text(''.join(gen()))
	
	def append(self,x):
		self.elems.append(x)

class WrapperValue(Value):
	'''
	Shorthand for the value types that are simple wrappers
	around normal data.
	'''
	def __init__(self,x):
		self.value=x
	
	def __hash__(self):
		return hash((type(self),self.value))
	
	def __str__(self):
		return str(self.value)
	
	def __repr__(self):
		return repr(self.value)
	
	def toText(self):
		'''
		Convert the value to a text object.
		'''
		return Text(str(self.value))

class Name(WrapperValue):
	'''
	A name, an unquoted string often used to identify tags
	and attributes
	'''

class Text(WrapperValue):
	'''
	A text value as found in sections or strings.
	'''

class Integer(WrapperValue):
	'''
	An integer value.
	'''

class Float(WrapperValue):
	'''
	A floating point value.
	'''

class Document:
	'''
	A class representing the entire document.
	'''
	def __init__(self,elems):
		self.elems=elems
	
	def __repr__(self):
		return ''.join(str(x) for x in self.elems)

#Tagspace definitions

class Attribute:
	'''
	An attribute for use in a tag definition
	'''
	def __init__(self,name,default=None):
		self.name=name
		if callable(default):
			self.default=default
		else:
			self.default=lambda x:default

class TagDef:
	'''
	A tag definition.
	'''
	def __init__(self,name,attrs):
		self.name=name
		self.attrs=attrs
	
	def __repr__(self):
		if len(self.attrs)>0:
			return "{{tag {} {}}}".format(self.name,' '.join(x.name for x in self.attrs))
		return "{{tag {}}}".format(self.name)

#: A tag definition for when a tag is unknown
nulltag=TagDef("",[])

class TagSpace:
	'''
	A space containing the definitions for tags.
	'''
	def __init__(self,tags):
		self.tags=tags
	
	def _unknown_tag(self,args,kwargs,p):
		return Tag(args,kwargs,nulltag)
	
	def build_tag(self,args,kwargs,p):
		args[0]=args[0].toText().value
		try:
			return Tag(args,kwargs,self.tags[args[0]])
		except KeyError:
			return self._unknown_tag(args,kwargs,p)

class Parser:
	'''
	A parser for a CXD document.
	'''
	
	def __init__(self,ts=None,text=""):
		'''
		ts - The tagspace of the text to parse.
		text - The text to parse.
		'''
		self.tagspace=ts
		self.text=text
		self.pos=0
		self.line=1
		self.col=0
	
	def _peek(self,r):
		'''
		Peek at the next token satisfying the given pattern.
		'''
		return r.match(self.text,self.pos)
	
	def _incr(self,res):
		'''
		Increment based on the given result (accounting for lines).
		'''
		self.pos+=len(res)
		lines=_LINES.split(res)
		if len(lines)>1:
			self.line+=len(lines)-1
		self.col=len(lines[-1])
	
	def _maybe(self,r):
		'''
		Consume a token if it exists, else return None.
		'''
		m=self._peek(r)
		if m:
			self._incr(m.group(0))
		return m
	
	def _expect(self,r,what):
		'''
		Consume a token if it exists, else raise an error.
		'''
		m=self._peek(r)
		if m:
			self._incr(m.group(0))
			return m
		raise ParseError("Expected {}".format(what),self.line,self.col)
	
	def _parse_section(self):
		'''
		Parse a section (anything within [...])
		'''
		if not self._maybe(_OPEN_BRACK):
			return None
		
		#the root doc parsing follows the same format as sections
		elems=self._parse_doc()
		
		self._expect(_CLOSE_BRACK,"]")
		
		return Section(elems)
	
	def _parse_value(self):
		'''
		Parse a traditional value.
		'''
		
		#numbers
		v=self._maybe(_NUMBER)
		if v:
			base={"0b":2,"0":8,"0x":16,None:None}[v.group(1)] or 10
			try:
				return Integer(int(v.group(2),base))
			except ValueError:
				return Float(float(v.group(0)))
		#strings
		v=self._maybe(_STRING)
		if v:
			if v.group(2) is None:
				return Text(v.group(3))
			return Text(v.group(2))
		#names
		v=self._maybe(_NAME)
		if v:
			return Name(v.group(0))
		#tags
		v=self._parse_tag()
		if v:
			return v
		#sections
		v=self._parse_section()
		if v:
			return v
		
		print('"{}"'.format(self.text[self.pos]))
		raise ParseError("Unknown value format ",self.line,self.col)
	
	def _parse_tag(self):
		'''
		Parse a CXD tag.
		'''
		if not self._maybe(_OPEN_BRACE):
			return None
		args=[]
		kwargs={}
		while not self._maybe(_CLOSE_BRACE):
			self._maybe(_WHITESPACE)
			val=self._parse_value()
			self._maybe(_WHITESPACE)
			if self._maybe(_COLON):
				self._maybe(_WHITESPACE)
				#this will raise an error if it's malformed
				dat=self._parse_value()
				try:
					if type(kwargs[val]) is Section:
						kwargs[val].append(dat)
					else:
						kwargs[val]=Section(kwargs[val],dat)
				except KeyError:
					kwargs[val]=dat
			else:
				args.append(val)
		
		return self.tagspace.build_tag(args,kwargs,self)
	
	def _parse_doc(self):
		'''
		Parse the bare-bones of a document for use in the
		section parser as well as the parser for the full
		document.
		'''
		elems=[]
		text=tag=True
		while text or tag:
			#raises error when ends with }]
			res=self._maybe(_NOTAG_TEXT)
			if res.group(0):
				elems.append(Text(res.group(0)))
				text=True
			else:
				text=False
			#raises error if section ends with text
			tag=self._parse_tag()
			if tag:
				elems.append(tag)
		
		return elems
	
	def loads(self,ts=None,text=None):
		self.tagspace=ts or self.tagspace
		self.text=text or self.text
		
		return Document(self._parse_doc())

def load(ts,f):
	'''
	Load a CXD document from the given file-like object
	using the given tagspace.
	'''
	return Parser(ts,f.read()).loads()

def loads(ts,s):
	'''
	Load a CXD document from the given string using the
	given tagspace.
	'''
	return Parser(ts,s).loads()