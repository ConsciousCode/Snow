import re

class ParseError(RuntimeError):
	def __init__(self,msg,line,col):
		RuntimeError.__init__(self,msg+" (Ln: {}, Col: {})".format(line,col))
		self.line=line
		self.col=col

class Tag:
	def __init__(self,keys=None,vals=None,pos=None):
		if keys is None:
			vals=[]
			vals=[]
			pos=[]
		elif vals is None:
			vals=keys.values()
			keys=keys.keys()
			pos=[]
		elif pos is None:
			try:
				pos=vals
				vals=keys.values()
				keys=keys.keys()
			except AttributeError:
				pos=[]
		self.keys=keys
		self.vals=vals
		self.pos=pos
	
	def __iter__(self):
		for x in range(len(self.pos)):
			yield x,self.pos[x]
		
		for x in range(len(self.keys)):
			yield self.keys[x],self.vals[x]
	
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
	
	def append(self,val):
		self.pos.append(val)
	
	def __repr__(self):
		return "Tag({!r}, {!r}, {!r})".format(self.keys,self.vals,self.pos)
	
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

class Text:
	def __init__(self,text=None):
		if text is None:
			text=""
		self.text=text
	
	def __repr__(self):
		return "Text({!r})".format(self.text)
	
	def __str__(self):
		val=self.text
		dq=val.count('"')
		sq=val.count("'")
		bq=val.count('`')
		
		if dq==0 and sq==0 and bq==0:
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

class Section:
	def __init__(self,items=None):
		self.items=items or []
	
	def append(self,val):
		self.items.append(val)
	
	def __iter__(self):
		for x in range(len(self.items)):
			yield self.items[x]
	
	def __has__(self,val):
		return val in self.items
	
	def __getitem__(self,key):
		return self.items[key]
	
	def __setitem__(self,key,val):
		self.items[key]=val
	
	def __repr__(self):
		return "Section({!r})".format(self.items)
	
	def __str__(self):
		return "[{}]".format(''.join(str(x) for x in self.items))
	
	def __eq__(self,other):
		try:
			return self.items==other.items
		except AttributeError:
			return False

class Document(Section):
	def __repr__(self):
		return "Document({!r})".format(self.items)
	
	def __str__(self):
		return "{}".format(''.join(str(x) for x in self.items))

class Parser:
	SECTION_TEXT=re.compile(r'(?:[^\\{\]]|\\.)*',re.M|re.S)
	DOCUMENT_TEXT=re.compile(r'(?:[^\\{]|\\.)*',re.M|re.S)
	NEWLINE=re.compile(r"\r\n|\n|\r",re.M)
	SPACE=re.compile(r"\s+")
	QUOTED_TEXT=re.compile(
		r'''"([^\\"]*|\\.)"|'([^\\']*|\\.)'|`([^\\`]*|\\.)`''',re.M
	)
	UNQUOTED_TEXT=re.compile(r'''(?:[^\s{}\[\]:"'`]|\\.)+''',re.M)
	ESCAPE_UNQUOTED=re.compile(r'''\\([^\s\\{}\[\]:"'`])''',re.M)
	
	def __init__(self,ts=None):
		self.ts=ts
		self.colonline=0
		self.coloncol=0
		self.line=0
		self.col=1
		self.pos=0
		self.text=None
	
	def maybe(self,pattern):
		m=pattern.match(self.text,self.pos)
		if m and m.start()==self.pos:
			self.pos+=len(m.group(0))
			lines=re.split(Parser.NEWLINE,m.group(0))
			if len(lines)>1:
				self.line+=len(lines)-1
				self.col=len(lines[-1])
			else:
				self.col+=len(lines[0])
			
			return m
		else:
			return None
	
	def parse_section(self,extra):
		text=self.text
		tl=len(text)
		if self.pos>=tl or text[self.pos]!='[':
			return None
		self.pos+=1
		self.col+=1
		
		items=[]
		st=True
		tag=True
		while st or tag:
			st=self.maybe(Parser.SECTION_TEXT)
			if st:
				if st.group(0):
					items.append(Text(re.sub(Parser.NEWLINE,'\n',st.group(0))))
				else:
					st=None
			
			tag=self.parse_tag(extra)
			if tag:
				items.append(tag)
		
		if self.pos>=tl or text[self.pos]!=']':
			raise ParseError(
				"Encountered end of string while parsing a section",
				self.line,self.col
			)
		self.pos+=1
		self.col+=1
		return Section(items)
	
	def parse_value(self,extra):
		val=self.maybe(Parser.QUOTED_TEXT)
		if val:
			if val.group(1):
				text=v.group(1)
				q='"'
			elif val.group(2):
				text=v.group(2)
				q="'"
			else:
				text=v.group(3)
				q='`'
			
			return Text(re.sub(
				Parser.ESCAPE,
				lambda m:(
					q if m.group(1)==q
					else '\\' if m.group(1)=='\\'
					else m.group(0)
				),
				text
			))
		
		val=self.maybe(Parser.UNQUOTED_TEXT)
		if val:
			return Text(re.sub(
				Parser.ESCAPE_UNQUOTED,
				lambda m:m.group(1),
				val.group(0)
			))
		
		val=self.parse_tag(extra)
		if val:
			return val
		
		val=self.parse_section(extra)
		if val:
			return val
		
		if self.pos>=self.text.length:
			raise ParseError(
				"reached end of string/file while parsing a tag",
				self.line,self.col
			)
		
		c=self.text[self.pos]
		
		#if there's a string start, there's a string that ends with EOF
		if c in '"\'`':
			raise ParseError(
				"Missing terminating {} character".format(c),self.line,self.col
			)
		
		if c==']':
			raise ParseError(
				"Unexpected close bracket ]. Did you forget to close a tag?",
				self.line,self.col-1
			)
		
		if c=="}":
			raise ParseError(
				"Forgot to assign a value to the named attribute.",
				self.colonline,self.coloncol+1
			)
		
		if c==":":
			raise ParseError(
				"The colon is disallowed in unquoted text.",
				self.line,self.col-1
			)
		
		#indicates an error in the parser's code. "Shouldn't happen"
		if c.isspace():
			raise ParseError(
				"Expected a value, found whitespace. "+
				"There's a problem with the API's parser code.",
				self.line,self.col
			)
		
		#reserved for cosmic ray errors
		raise ParseError(
			'Something is horribly wrong. Expected value, got "{}{}"'.format(
				self.text.slice(self.pos,self.pos+8),
				("..." if self.pos>=len(self.text) else "")
			),
			self.line,self.col
		)
	
	def parse_tag(self,extra):
		text=self.text
		tl=len(text)
		if self.pos>=tl or text[self.pos]!="{":
			return None
		self.pos+=1
		self.col+=1
		
		self.maybe(Parser.SPACE)
		
		keys=[]
		vals=[]
		pos=[]
		while self.pos<tl:
			if text[self.pos]=="}":
				self.pos+=1
				self.col+=1
				break
			key=self.parse_value(extra)
			
			self.maybe(Parser.SPACE)
			
			if self.pos<tl and text[self.pos]==":":
				self.colonline=self.line
				self.coloncol=self.col
				
				self.pos+=1
				self.col+=1
				
				self.maybe(Parser.SPACE)
				val=self.parse_value(extra)
				self.maybe(Parser.SPACE)
				
				try:
					k=keys.index(key)
					v=vals[k]
					if type(v) is Section:
						v.append(val)
					else:
						vals[k]=Section(v,val)
				except ValueError:
					keys.append(key)
					vals.append(val)
			else:
				pos.append(key)
		else:
			raise ParseError(
				"reached end of string while parsing tag",
				self.line,serf.col
			)
		
		if self.ts:
			if len(pos):
				k=pos[0]
			else:
				k=None
			return self.ts[k](keys,vals,pos,extra)
		return Tag(keys,vals,pos)
	
	def parse(self,text,extra=None):
		self.colonline=0
		self.coloncol=0
		self.line=0
		self.col=1
		self.pos=0
		self.text=text
		
		items=[]
		text=True
		tag=True
		while text or tag:
			text=self.maybe(Parser.DOCUMENT_TEXT)
			if text:
				if text.group(0):
					items.append(
						Text(re.sub(Parser.NEWLINE,"\n",text.group(0)))
					)
				else:
					text=None
			
			tag=self.parse_tag(extra)
			if tag:
				items.append(tag)
		
		return Document(items)