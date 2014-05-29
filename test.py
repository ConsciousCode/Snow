from cxd import *

print(load(TagSpace({
	"menu":TagDef("menu",[]),
	"food":TagDef("food",[
		Attribute("name"),
		Attribute("price"),
		Attribute("description"),
		Attribute("calories")
	])
}),open("test.cxd")))