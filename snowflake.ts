{tagset "Snowflake"
	{meta ! description:"A comment."}
	{tag in name repl description:"Define how an input tag should be converted to an output tag."}
	{tag out name description:"Creates a tag to be handed to the output."}
	{tag @ filter description:"Selects a tag or attribute from the input based on some filter."}
	{tag # start end:{@ start} description:"Select an extra positional attribute or a range of extra attributes."}
	{tag $ filter on description:"Selects a tag or attribute from the output tags based on some filter."}
}