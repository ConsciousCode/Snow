from cxd import *

print(load(TagSpace({
	"menu":TagDef(),
	"food":TagDef([
		Attribute("name"),
		Attribute("price"),
		Attribute("description"),
		Attribute("calories")
	])
}),open("test.cxd")))