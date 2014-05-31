from snow import *

print(load(TagSet({
	"menu":TagDef(),
	"food":TagDef([
		Attribute("name"),
		Attribute("price"),
		Attribute("description"),
		Attribute("calories")
	])
}),open("test.sno")))