import sys
import os.path
import re
import snow

cirrus=snow.TagSet({
	"doc":snow.TagDef([
		snow.Attribute("title",snow.Text("Cirrus")),
		snow.Attribute("...")
	]),
	"bold":snow.TagDef([
		snow.Attribute("...")
	]),
	"italic":snow.TagDef([
		snow.Attribute("...")
	]),
	"underline":snow.TagDef([
		snow.Attribute("...")
	]),
	"link":snow.TagDef([
		snow.Attribute("url",snow.Text("")),
		snow.Attribute("...")
	]),
	"line":snow.TagDef(),
	"image":snow.TagDef([
		snow.Attribute("url",snow.Text(""))
	])
})

_NEWLINE=re.compile(r"(\r\n|\n|\r)")
def indent(text,by=1,c="\t"):
	return c*by+_NEWLINE.sub(r"\1"+c*by,text)

class Element:
	def __init__(self,name,space=False,attrs=None,content=None,atomic=True):
		self.name=name
		self.parent=None
		self.attrs=attrs or {}
		self.content=content or []
		self.atomic=atomic
		self.space=space
	
	def __getitem__(self,x):
		return self.attrs[x]
	
	def __setitem__(self,x,val):
		self.attrs[x]=val
	
	def append(self,x):
		self.content.append(x)
		x.parent=self
		return x
	
	def solidify(self):
		attrs=" ".join('{}="{}"'.format(x,y) for x,y in self.attrs.items())
		if attrs:
			attrs=" "+attrs
		if len(self.content)>0:
			def gen():
				for x in self.content:
					c=x.solidify()
					if c==" ":
						continue
					yield c
			if self.space:
				return "<{0}{1}>\n{2}\n</{0}>".format(self.name,attrs,indent('\n'.join(gen())))
			return "<{0}{1}>{2}</{0}>".format(self.name,attrs,' '.join(gen()))
		if self.atomic:
			return "<{}{}/>".format(self.name,attrs)
		else:
			return "<{0}{1}></{0}>".format(self.name,attrs)

class TextElement(Element):
	def __init__(self,text):
		Element.__init__(self,"",False,None,[text])
	
	def solidify(self):
		return self.content[0]

class HTMLVisitor:
	def __init__(self):
		self.head=Element("head",True)
		self.body=Element("body",True)
		self.cur=self.body
	
	def visit(self,which):
		which.visit(self)
	
	def accept(self,which):
		cur=self.cur
		if which.isDocument():
			#only visit the first element
			for x in which:
				if x.isTag():
					x.visit(self)
					return
			print("The Cirrus document has no readable content")
			exit()
		elif which.isTag():
			name=which.name.toText().value
			if name=="doc":
				if which["title"]:
					self.head.append(Element("title",False,None,[TextElement(which["title"].value)]))
				if self.cur.parent is not None:
					print("A doc tag should only be at the root of the document")
					exit()
				which["..."].visit(self)
			elif name=="bold":
				self.cur=self.cur.append(Element("b"))
				which["..."].visit(self)
			elif name=="italic":
				self.cur=self.cur.append(Element("i"))
				which["..."].visit(self)
			elif name=="underline":
				self.cur=self.cur.append(Element("u"))
				which["..."].visit(self)
			elif name=="link":
				self.cur=self.cur.append(Element("a",False,{"href":which["url"].toText().value}))
				which["..."].visit(self)
			#contentless tags
			elif name=="line":
				self.cur.append(Element("br"))
				self.cur.append(TextElement(""))
			elif name=="image":
				self.cur.append(Element("img",False,{"src":which["url"].toText().value}))
			else:
				print('Unexepcted tag "{}"'.format(name))
				self.cur.append(Element("div"))
		elif which.isSection():
			for x in which:
				x.visit(self)
		else:
			self.cur.append(TextElement(which.value))
		self.cur=cur
	
	def solidify(self):
		return "<html>\n{}\n{}\n</html>".format(indent(self.head.solidify()),indent(self.body.solidify()))

if len(sys.argv)>2:
	src=sys.argv[1]
	dst=sys.argv[2]
elif len(sys.argv)>1:
	src=sys.argv[1]
	dst=os.path.splitext(src)[0]+".html"
else:
	print("""Usage: python cirrus.py src [dst]
	src		The source file.
	dst	The destination file.""")

doc=snow.load(cirrus,open(src))
visitor=HTMLVisitor()
visitor.visit(doc)

open(dst,"w").write(visitor.solidify())