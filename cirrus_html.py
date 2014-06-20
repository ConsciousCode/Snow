import snow

cirrus_html=snow.Tagset({
	"in":snow.Tagdef([
		"filter":snow.Attribute(),
		"repl":snow.Attribute()
	]),
	"out":snow.Tagdef(),
	"!":None,
	"@":snow.Tagdef(),
	"#":snow.Tagdef([
		"start":snow.Attribute(snow.Text("0")),
		"end":snow.Attribute(snow.Text("-1"))
	]),
	"$":snow.Tagdef([
		"selrep":snow.Attribute(),
		"arg":snow.Attribute()
	])
})