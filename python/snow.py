import re

class ParseError(RuntimeError):
	def __init__(self,msg,line,col):
		RuntimeError.__init__(self,msg+" (Ln: {}, Col: {})".format(line,col))
		self.line=line
		self.col=col

class Flake:
	def __init__(self,l,c,p):
		self.line=l
		self.col=c
		self.position=p

class Tag(Flake):
	def __init__(self,keys,vals,pos,l=None,c=None,p=None):
		Flake.__init__(self,l,c,p)
		self.keys=keys
		self.vals=vals
		self.pos=pos
	
	def visit(self,visitor,data=None):
		return visitor.visit_tag(self,data)
	
	def __has__(self,key):
		if type(key) is int:
			return key in self.pos
		else:
			return key in self.keys
	
	def __getitem__(self,key):
		if type(key) is int:
			if key<len(self.pos):
				return self.pos[key]
			raise IndexError("tag has no key {}".format(key))
		
		try:
			return self.vals[self.keys.index(key)]
		except (ValueError,TypeError):
			raise IndexError("tag has no key {}".format(orig)) from None
	
	def __setitem__(self,key,val):
		if type(key) is int:
			if key<len(self.pos):
				self.pos[key]=val
			raise IndexError("tag has no key {}".format(key))
		
		try:
			k=self.keys.index(key)
		except ValueError:
			self.keys.append(key)
			k=len(self.keys)-1
		
		self.vals[k]=val
	
	def add(self,val):
		self.pos.append(val)
	
	def __repr__(self):
		if self.line is None or self.col is None or self.position is None:
			return "Tag({!r}, {!r}, {!r})".format(self.keys,self.vals,self.pos)
		return "Tag({!r}, {!r}, {!r}, {}, {}, {})".format(
			self.keys,self.vals,self.pos,
			self.line,self.col,self.position
		)
	
	def __str__(self):
		if len(self.pos)>1:
			if len(self.keys):
				return "{{{} {} {}}}".format(
					self.pos[0],
					' '.join(
						"{}:{}".format(self.keys[x],self.vals[x])
						for x in range(len(self.keys))
					),
					' '.join(str(x) for x in self.pos[1:])
				)
			else:
				return "{{{}}}".format(' '.join(str(x) for x in self.pos))
		elif len(self.pos):
			if len(self.keys):
				return "{{{} {}}}".format(
					self.pos[0],
					' '.join(
						"{}:{}".format(self.keys[x],self.vals[x])
						for x in range(len(self.keys))
					)
				)
			else:
				return "{{{}}}".format(self.pos[0])
		return "{{{}}}".format(
			' '.join(
				"{}:{}".format(self.keys[x],self.vals[x])
				for x in range(len(self.keys))
			)
		)
	
	def __eq__(self,other):
		try:
			return (
				self.keys==other.keys and
				self.vals==other.vals and
				self.pos==other.pos
			)
		except AttributeError:
			return False

class Text(Flake):
	UNQUOTED=re.compile(r'''^((?:[^\s+\\{:}[\]"'`]|\\.)*)$''',re.M)
	
	def __init__(self,text="",l=None,c=None,p=None):
		Flake.__init__(self,l,c,p)
		self.text=text
	
	def visit(self,visitor,data=None):
		return visitor.visit_text(self,data)
	
	def __repr__(self):
		if self.line is None or self.col is None or self.position is None:
			return "Text({!r})".format(self.text)
		return "Text({!r}, {}, {}, {})".format(
			self.text,
			self.line,self.col,self.position
		)
	
	def __str__(self):
		val=self.text
		dq=val.count('"')
		sq=val.count("'")
		bq=val.count('`')
		
		if dq==0 and sq==0 and bq==0:
			if Text.UNQUOTED.match(val) is None:
				return '"{}"'.format(val)
			return val
		elif dq>=sq and dq>=bq:
			return '"{}"'.format(val.replace('"','\\"'))
		elif sq>=bq:
			return "'{}'".format(val.replace("'","\\'"))
		else:
			return '`{}`'.format(val.replace('`','\\`'))
	
	def __eq__(self,other):
		try:
			return self.text==other.text
		except AttributeError:
			return False

class Section(Flake):
	def __init__(self,items=None,l=None,c=None,p=None):
		Flake.__init__(self,l,c,p)
		self.items=items or []
	
	def visit(self,visitor,data=None):
		return visitor.visit_section(self,data)
	
	def add(self,val):
		self.items.append(val)
	
	def __has__(self,val):
		return val in self.items
	
	def __getitem__(self,key):
		return self.items[key]
	
	def __setitem__(self,key,val):
		self.items[key]=val
	
	def __repr__(self):
		if self.line is None or self.col is None or self.position is None:
			return "Section({!r})".format(self.items)
		return "Section({!r}, {}, {}, {})".format(
			self.items,
			self.line,self.col,self.position
		)
	
	def __str__(self):
		return "[{}]".format(''.join(str(x) for x in self.items))
	
	def __eq__(self,other):
		try:
			return self.items==other.items
		except AttributeError:
			return False

class Document(Section):
	def __repr__(self):
		if self.line is None or self.col is None or self.position is None:
			return "Document({!r})".format(self.items)
		return "Document({!r}, {}, {}, {})".format(
			self.items,
			self.line,self.col,self.position
		)
	
	def visit(self,visitor,data):
		return visitor.visit_doc(self,data)
	
	def __str__(self):
		return "{}".format(''.join(str(x) for x in self.items))

class Parser:
	SECTION_TEXT=re.compile(r'(?:[^\\{\]]|\\.)*',re.M|re.S)
	DOCUMENT_TEXT=re.compile(r'(?:[^\\{]|\\.)*',re.M|re.S)
	NEWLINE=re.compile(r"\r\n|\n|\r",re.M)
	SPACE=re.compile(r"\s+")
	QUOTED_TEXT=re.compile(
		r'''"((?:[^\\"]|\\.)*)"|'((?:[^\\']|\\.)*)'|`((?:[^\\`]|\\.)*)`''',
		re.M
	)
	DQ_ESCAPE=re.compile(r'\\([\\"])')
	SQ_ESCAPE=re.compile(r"\\([\\'])")
	BQ_ESCAPE=re.compile(r'\\([\\`])')
	UNQUOTED_TEXT=re.compile(r'''(?:[^\s{:}[\]"'`]|\\.)+''',re.M)
	UNQUOTED_ESCAPE=re.compile(r'''\\([\s\\{:}[\]"'`])''',re.M)
	
	def __init__(self,build=None):
		self.build=build or Tag
		self.colonline=0
		self.coloncol=0
		self.line=0
		self.col=1
		self.pos=0
	
	def maybe(self,text,pattern):
		m=pattern.match(text,self.pos)
		if m:
			m0=m.group(0)
			self.pos+=len(m0)
			lines=Parser.NEWLINE.findall(m0)
			if len(lines)>0:
				self.line+=len(lines)-1
				self.col=len(m0)-lines[-1].end()
			else:
				self.col+=len(m0)
			
			return m
		return None
	
	def parse_section(self,text,extra):
		tl=len(text)
		if self.pos>=tl or text[self.pos]!='[':
			return None
		self.pos+=1
		self.col+=1
		
		items=[]
		st=True
		tg=True
		while st or tg:
			st=self.maybe(text,Parser.SECTION_TEXT)
			if st:
				if st.group(0):
					items.append(Text(Parser.NEWLINE.sub('\n',st.group(0))))
				else:
					st=False
			
			tg=self.parse_tag(text,extra)
			if tg:
				items.append(tag)
		
		if self.pos>=tl or text[self.pos]!=']':
			raise ParseError(
				"Encountered end of string while parsing a section",
				self.line,self.col
			)
		self.pos+=1
		self.col+=1
		return Section(items)
	
	def parse_value(self,text,extra):
		l=self.line
		c=self.col
		p=self.pos
		v=self.maybe(text,Parser.QUOTED_TEXT)
		if v:
			if v.group(1):
				text=v.group(1)
				q=Parser.DQ_ESCAPE
			elif v.group(2):
				text=v.group(2)
				q=Parser.SQ_ESCAPE
			else:
				text=v.group(3)
				q=Parser.BQ_ESCAPE
			
			return Text(re.sub(q,r"\1",text),l,c,p)
		
		v=self.maybe(text,Parser.UNQUOTED_TEXT)
		if v:
			return Text(re.sub(Parser.UNQUOTED_ESCAPE,r"\1",v.group(0)),l,c,p)
		
		v=self.parse_tag(text,extra)
		if v:
			return v
		
		v=self.parse_section(text,extra)
		if v:
			return v
		
		if self.pos>=len(text):
			raise ParseError(
				"reached end of string/file while parsing a tag",l,c
			)
		
		x=text[p]
		
		#if there's a string start, there's a string that ends with EOF
		if x in '"\'`':
			raise ParseError(
				"Missing terminating {} character".format(x),l,c
			)
		
		if x==']':
			raise ParseError(
				"Unexpected close bracket ]. Did you forget to close a tag?",
				l,c-1
			)
		
		if x=="}":
			raise ParseError(
				"Forgot to assign a value to the named attribute.",
				self.colonline,self.coloncol+1
			)
		
		if x==":":
			raise ParseError(
				"The colon is disallowed in unquoted text.",
				l,c-1
			)
		
		#indicates an error in the parser's code. "Shouldn't happen"
		if x.isspace():
			raise ParseError(
				"Expected a value, found whitespace. "+
				"There's a problem with the API's parser code.",l,c
			)
		
		#reserved for cosmic ray errors
		raise ParseError(
			'Something is horribly wrong. Expected value, got "{}{}"'.format(
				text.slice(p,p+8),
				("..." if p>=len(text) else "")
			),l,c
		)
	
	def parse_tag(self,text,extra):
		tl=len(text)
		if self.pos>=tl or text[self.pos]!="{":
			return None
		self.pos+=1
		self.col+=1
		
		self.maybe(text,Parser.SPACE)
		
		keys=[]
		vals=[]
		pos=[]
		while self.pos<tl:
			if text[self.pos]=="}":
				self.pos+=1
				self.col+=1
				break
			key=self.parse_value(text,extra)
			
			self.maybe(text,Parser.SPACE)
			
			if self.pos<tl and text[self.pos]==":":
				if key in keys:
					raise ParseError(
						"duplicate named attribute {}".format(key),
						self.line,self.col
					)
				
				self.colonline=self.line
				self.coloncol=self.col
				
				self.pos+=1
				self.col+=1
				
				self.maybe(text,Parser.SPACE)
				val=self.parse_value(text,extra)
				self.maybe(text,Parser.SPACE)
				
				keys.append(key)
				vals.append(val)
			else:
				pos.append(key)
		else:
			raise ParseError(
				"reached end of string while parsing tag",
				self.line,self.col
			)
		
		return self.build(keys,vals,pos,self.line,self.col,self.pos)
	
	def parse(self,text,extra=None):
		self.colonline=0
		self.coloncol=0
		self.line=0
		self.col=1
		self.pos=0
		
		items=[]
		tx=True
		tg=True
		while tx or tg:
			tx=self.maybe(text,Parser.DOCUMENT_TEXT)
			if tx:
				if tx.group(0):
					items.append(
						Text(re.sub(Parser.NEWLINE,"\n",tx.group(0)))
					)
				else:
					tx=False
			
			tg=self.parse_tag(text,extra)
			if tg:
				items.append(tg)
		
		return Document(items)

def parse(text,build=None):
	return Parser(build).parse(text)