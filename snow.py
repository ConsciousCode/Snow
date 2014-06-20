import re
import unicodedata

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
_NUMBER=re.compile(r"(?:-|\+)?(?:(?:\d*\.\d+|\d+\.\d*)(?:e-?\d+)?|(0b|0|0x)?(\d+))$",re.IGNORECASE)
#: Regex for a string
_STRING=re.compile(r"""(r)?(?:"([^\\"]*|\\.)"|'([^\\']*|\\.)')""",re.MULTILINE)
#: Regex for any text that doesn't contain a tag
_NOTAG_TEXT=re.compile(r"(?:[^\\{\]]|\\.)*",re.MULTILINE)
#: Regex for text that may appear in a document
_DOC_TEXT=re.compile(r"(?:[^\\{]|\\.)*",re.MULTILINE)
#: Regex for stripping whitespace from the sides
_STRIPSPACE=re.compile(r"^\s+|\s+$",re.MULTILINE)
#: Regex for a control character
_CONTROL=re.compile(r"[\x00-\x1f]")
#: Regex for the beginning of a quote
_QUOTE=re.compile(r"""r?("|')""")
#: Regex for string escapes
_ESCAPES=re.compile(r"""\\([abfnrtv'"]|x[\da-f]{2}|u[\da-f]{4}|U[\da-f]{8}|\d\d\d|N\{[\w ]\})""")

## DOM type hierarchy
class Value:
	'''
	The base type for all values a Snow document can represent.
	'''
	
	def __eq__(self,other):
		return hash(self)==hash(other)
	
	def __bool__(self):
		return True
	
	def isText(self):
		'''
		Return whether or not the value is a literal Text value.
		'''
		return False
	
	def isTag(self):
		'''
		Return whether or not the value is a literal Tag value.
		'''
		return False
	
	def isSection(self):
		'''
		Return whether or not the value is a literal Section value.
		'''
		return False
	
	def isDocument(self):
		'''
		Return whether or not the value is the document itself.
		'''
		return False
	
	def toText(self):
		'''
		Convert the value to a Text object if applicable, else
		raise a ValueError.
		
		This should be used whenever you're looking for a Text
		value and don't care about its actual type (e.g. "text" and
		[text] should be interchangeable)
		'''
		raise NotImplementatedError()
	
	def toTag(self):
		'''
		Convert the value to a Text object if applicable, else
		raise a ValueError.
		
		Nothing can convert to a tag, so at the moment this is just
		a fancy casting operator.
		'''
		raise NotImplementederror()
	
	def toSection(self):
		'''
		Convert the value to a Section object if applicable, else
		raise a ValueError.
		
		This should be used whenever you're looking for a Section
		value and don't care about its actual type (e.g. "text" and
		[text] should be interchangeable)
		'''
		raise NotImplementedError()
	
	def toNumber(self):
		'''
		Convert the value to a number if applicable,else raise a
		ValueError.
		'''
		raise NotImplementedError()
	
	def visit(self,v):
		'''
		Allows a visitor object to visit the value as well as any
		children it might possess (as defined by the visitor object)
		'''
		v.accept(self)

class Tag(Value,dict):
	'''
	A tag value.
	'''
	def __init__(self,args,kwargs,d):
		'''
		args - Positional attributes.
		kwargs - Named attributes.
		d - The tag's definition.
		'''
		dict.__init__(self)
		self.name=args[0]
		self.extra=[]
		extrakwargs={}
		
		#separate out extra attributes
		for x,y in kwargs.items():
			if x in d.attrs:
				self[x]=y
			else:
				extrakwargs[x]=y
		
		#figure out positional arguments
		for x in range(1,len(args)):
			#if we've gone past the defined attributes, quit
			if len(d.attrs)<=len(self):
				self.extra.extend(args[x:])
				break
			#search through the attributes until we find one
			#that isn't taken
			for y in range(len(d.attrs)):
				if d.attrs[y].name not in self:
					break
			else:
				#this attribute is unknown.
				self.extra.append(args[x])
				continue
			self[d.attrs[y].name]=args[x]
		
		#fill in default values
		for attr in d.attrs:
			if attr.name not in self:
				self[attr.name]=attr.default(self)
		
		#add back in the extra named attributes
		self.update(extrakwargs)
	
	def __hash__(self):
		return hash((Tag,self.name,tuple(self.items()),tuple(self.extra)))
	
	def __getitem__(self,x):
		return dict.__getitem__(self,Text(x) if type(x) is str else x)
	
	def __setitem__(self,x,val):
		dict.__setitem__(self,Text(x) if type(x) is str else x,val)
	
	def __repr__(self):
		if len(self)>0:
			if len(self.extra)>0:
				return "{{{} {} {}}}".format(self.name,' '.join("{}:{}".format(x,repr(y)) for x,y in self.items()),' '.join(repr(x) for x in self.extra))
			else:
				return "{{{} {}}}".format(self.name,' '.join("{}:{}".format(x,repr(y)) for x,y in self.items()))
		else:
			if len(self.extra)>0:
				return "{{{} {}}}".format(self.name,' '.join(repr(x) for x in self.extra))
			else:
				return "{{{}}}".format(self.name)
	
	def isTag(self):
		return True
	
	def toText(self):
		raise ValueError("Attempted to convert a tag to text")
	
	def toTag(self):
		return self
	
	def toSection(self):
		raise ValueError("Attempted to convert a tag to a section")
	
	def toNumber(self):
		raise ValueError("Attempted to convert a tag to a number")

class Section(Value,list):
	'''
	A section of intermixed text and tags.
	'''
	def __init__(self,elems):
		list.__init__(self,elems)
	
	def __hash__(self):
		return hash((Section,tuple(self)))
	
	def __repr__(self):
		return "[{}]".format(''.join(str(x) for x in self))
	
	def isSection(self):
		return True
	
	def toText(self):
		return Text(''.join(x.toText().value for x in self))
	
	def toTag(self):
		raise ValueError("Attempted to convert a section to a tag")
	
	def toSection(self):
		return self
	
	def toNumber(self):
		return self.toText().toNumber()

class Text(Value):
	'''
	A text value (as appears in attribute names, values,
	and sections.
	'''
	def __init__(self,x):
		self.value=x
	
	def __repr__(self):
		return "Text({})".format(repr(self.value))
	
	def __str__(self):
		return str(self.value)
	
	def __hash__(self):
		return hash((Text,self.value))
	
	def isText(self):
		return True
	
	def toText(self):
		return self
	
	def toTag(self):
		raise ValueError("Attempted to convert text to a tag")
	
	def toSection(self):
		return Section([self])
	
	def toNumber(self):
		m=_NUMBER.match(self.value)
		if m:
			base={"0b":2,"0":8,"0x":16,None:None}[m.group(1)] or 10
			try:
				return int(m.group(2),base)
			except ValueError:
				return float(m.group(0))
		else:
			raise ValueError('Invalid number format: {}'.format(repr(self.value)))

class Document(Section):
	'''
	A class representing the entire document.
	'''
	def __init__(self,src,elems):
		Section.__init__(self,elems)
		self.src=src
	
	def isDocument(self):
		return True

#Tagset definitions

class Attribute:
	'''
	An attribute for use in a tag definition
	'''
	def __init__(self,name,default=None):
		if type(name) is str:
			self.name=Text(name)
		else:
			self.name=name
		if callable(default):
			self.default=default
		else:
			self.default=lambda x:default

class Tagdef:
	'''
	A tag definition.
	'''
	def __init__(self,attrs=None):
		'''
		attrs - The attributes which may be positional or named.
		'''
		self.name=None
		if attrs is None:
			self.attrs=[]
		else:
			self.attrs=[Text(x) if type(x) is str else x for x in attrs]
	
	def __repr__(self):
		if len(self.attrs)>0:
			return "{{tag {} {}}}".format(self.name,' '.join(x.name for x in self.attrs))
		return "{{tag {}}}".format(self.name)
	
	def set_name(self,x):
		self.name=x
		return self

class Tagset:
	'''
	The set of definitions for tags.
	'''
	def __init__(self,tags):
		self.tags={Text(x):y.set_name(x) if type(x) is str else (x,y) for x,y in tags.items()}
		food=list(self.tags.items())[0]
	
	def _unknown_tag(self,args,kwargs,p):
		return Tag(args,kwargs,TagDef([]))
	
	def build_tag(self,args,kwargs,p):
		try:
			#support for stuff like comment tags
			if self.tags[args[0]] is None:
				return None
			return Tag(args,kwargs,self.tags[args[0]])
		except KeyError:
			return self._unknown_tag(args,kwargs,p)
		except IndexError as e:
			raise ValueError("Tags must have a name") from None

def unescape(m):
	s=m.group(1)
	try:
		return {"a":"\a","b":"\b","f":"\f","n":"\n","r":"\r","t":"\t","v":"\v","'":"'",'"':'"'}[s]
	except KeyError:
		if s[0]=="N":
			return unicodedata.lookup(s[2:-1])
		else:
			return chr(int(s[1:],16))

class Parser:
	'''
	A parser for a Snow document.
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
		#last relevant character pattern position.
		self.lastrel=0
	
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
		else:
			self.col+=len(res)
	
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
		elems=self._parse_doc(_NOTAG_TEXT)
		for x in elems:
			if x.isText():
				x.value=x.value.replace("\\{","{").replace("\\]","]")
		
		self._expect(_CLOSE_BRACK,"]")
		self._maybe(_WHITESPACE)
		
		return Section(elems)
	
	def _parse_value(self):
		'''
		Parse a traditional value.
		'''
		
		#text
		v=self._maybe(_STRING)
		if v:
			if v.group(2) is None:
				text=v.group(3)
			else:
				text=v.group(2)
			if not v.group(1):
				text=_ESCAPES.sub(unescape,text)
			return Text(text)
		v=self._maybe(_NAME)
		if v:
			return Text(v.group(0))
		
		#tags
		v=self._parse_tag()
		if v:
			return v
		
		#sections
		v=self._parse_section()
		if v:
			return v
		
		#Snow errors are very predictable, so check for common
		#mistakes. By this point, we know the next character is
		#one of the start of quoted text, ], }, whitespace, a
		#control character, or EOF (if not, something is HORRIBLY
		#wrong)
		
		#check for EOF
		if self.pos>=len(self.text):
			raise ParseError("Reached end of string/file while parsing a tag.",self.line,self.col)
		#if there's a string start, there's a string that ends with EOF
		m=self._maybe(_QUOTE)
		if m:
			raise ParseError("Missing terminating {} character".format(m.group(1)),self.line,self.col)
		#forgot to close a tag
		elif self._maybe(_CLOSE_BRACK):
			raise ParseError("Unexpected close bracket ]. Did you forget to close a tag?",self.line,self.col-1)
		#didn't provide a value for named attribute
		elif self._maybe(_CLOSE_BRACE):
			#Need to calculate the line and col of the colon
			lines=_LINES.split(self.text[:self.lastrel])
			raise ParseError("Forgot to assign a value to the named attribute.",len(lines),len(lines[-1]))
		#control characters are disallowed
		elif self._maybe(_CONTROL):
			raise ParseError("Control characters are disallowed in unquoted text.",self.line,self.col-1)
		#indicates an error in the parser's code. "Shouldn't happen"
		m=self._maybe(_WHITESPACE)
		if m:
			raise ParseError("Expected a value, found whitespace. There's a problem with the API's parser code.",self.line,self.col-len(m.group(0)))
		
		#something is horribly wrong.
		raise ParseError('Something went horribly wrong. Expected value, got "{}"'.format(
				self.text[self.pos:self.pos+8]+
				("..." if self.pos>=len(self.text) else "")
			),self.line,self.col
		)
	
	def _parse_tag(self):
		'''
		Parse a Snow tag.
		'''
		if not self._maybe(_OPEN_BRACE):
			return None
		self._maybe(_WHITESPACE)
		args=[]
		kwargs={}
		while not self._maybe(_CLOSE_BRACE):
			val=self._parse_value()
			self._maybe(_WHITESPACE)
			if self._maybe(_COLON):
				#used for error handling
				self.lastrel=self.pos
				self._maybe(_WHITESPACE)
				#this will raise an error if it's malformed
				dat=self._parse_value()
				try:
					#implement section merging
					if type(kwargs[val]) is Section:
						kwargs[val].append(dat)
					else:
						kwargs[val]=Section(kwargs[val],dat)
				except KeyError:
					kwargs[val]=dat
			else:
				args.append(val)
			self._maybe(_WHITESPACE)
		
		self._maybe(_WHITESPACE)
		
		#note that if this returns None, the tag will be ignored.
		return self.tagspace.build_tag(args,kwargs,self)
	
	def _parse_doc(self,pattern):
		'''
		Parse the bare-bones of a document for use in the
		section parser as well as the parser for the full
		document.
		'''
		elems=[]
		text=tag=True
		while text or tag:
			#raises error when ends with }]
			res=self._maybe(pattern)
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
		
		return Document("<string>",self._parse_doc(_DOC_TEXT))
	
	def load(self,ts=None,f=None):
		self.tagspace=ts or self.tagspace
		self.text=f.read() or self.text
		
		return Document(f.name,self._parse_doc(_DOC_TEXT))

def load(ts,f):
	'''
	Load a Snow document from the given file-like object
	using the given tagspace.
	'''
	return Parser().load(ts,f)

def loads(ts,s):
	'''
	Load a Snow document from the given string using the
	given tagspace.
	'''
	return Parser().loads(ts,s)