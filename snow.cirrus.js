/**
 * Snow tagset meant to convey document layout and styling (like HTML/CSS).
**/
snow.cirrus=(function(){
	function require(url,load){
		var elem=document.createElement("script");
		elem.type="text/javascript";
		elem.src=url;
		if(load){
			elem.addEventListener("load",load);
		}
		document.head.appendChild(elem);
	}
	
	//The dependencies of Cirrus
	var root="//ajax.googleapis.com/ajax/libs/";
	require(root+"jquery/1.11.1/jquery.min.js",function(){
		require(root+"jqueryui/1.10.4/jquery-ui.min.js");
	});
	
	
	var mouse={};
	window.addEventListener("load",function(){
		$(document).mousemove(function(e){
			mouse.x=e.clientX;
			mouse.y=e.clientY;
		});
	});
	
	var defstyle=[
		//Get rid of some default styles
		"html,body{margin:0;padding:0;}",
		"ul,ol{display:inline-block;margin:0;}",
		"div{overflow:hidden;}",
		//Snow has formattable tooltips, so some CSS is needed for its default.
		".-sno-tooltip{padding:1px 5px !important;border:1px solid #777 !important;color:#555 !important;background:#fff !important;font-size:12px !important;font-family:Arial !important;box-shadow:6px 6px 1px -4px rgba(0,0,0,0.4) !important;border-radius:0 !important;}",
		//Snow has ways to make it easy to vertically center elements.
		".-sno-vcenter{position:absolute;top:50%;width:100%;-ms-transform:translate(0px,-50%);-webkit-transform:translate(0px,-50%);transform:translate(0px,-50%);}",
		".-sno-col{float:left;}\n.-sno-cols{margin:0;}",
		".-sno-row{}\n.-sno-rows{}\n.-sno-row>*{}"
	].join("\n");
	
	//Used by mktag to recursively add children.
	function addchildren($tag,children){
		if(children){
			if($.isArray(children)){
				for(var i=0;i<children.length;++i){
					addchildren($tag,children[i]);
				}
			}
			else{
				$tag.append(children);
			}
		}
	}
	
	//This returns undefined if tag is undefined
	function getattr($tag,attr){
		if($tag){
			return $tag.prop(attr);
		}
	}
	
	function as(type,obj){
		if(type=="text"){
			if(obj===undefined){
				return "";
			}
			else if(typeof obj=="string"){
				return obj;
			}
			else if($.isArray(obj)){
				var a=[];
				$.each(obj,function(x,v){
					a.push(as(type,v));
				});
				return a.join("");
			}
			else{
				return obj.attrs.get("...")||"";
			}
		}
		else if(type=="image"){
			if(obj===undefined){
				return undefined;
			}
			else if($.isArray(obj)){
				return as("text",obj);
			}
			else if(typeof obj=="object"){
				if(obj.name=="image" || obj.name=="link"){
					return obj.attrs.get("url");
				}
				return as("text",obj);
			}
			else if(typeof obj=="string"){
				return obj;
			}
		}
		else if(type=="url"){
			if(obj===undefined){
				return undefined;
			}
			else if($.isArray(obj)){
				return as("text",obj);
			}
			else if(typeof obj=="object"){
				if(obj.name=="link"){
					return obj.attrs.get("url");
				}
				return as("text",obj);
			}
			else if(typeof obj=="string"){
				return obj;
			}
		}
		else if(type=="size"){
			var val=as("text",obj).trim();
			if(m=/(\d+|\d*\.\d+|\d+\.\d*)(px)?/.exec(val)){
				return Math.floor(parseFloat(m[1]))+"px";
			}
			else if(m=/(\d+|\d*\.\d+|\d+\.\d*)%/.exec(val)){
				return m[0];
			}
		}
	}
	
	function isTag(x){
		if(typeof x=="object" && !Array.isArray(x)){
			if(x.attrs && x.attrs instanceof snow.Map){
				return true;
			}
		}
		return false;
	}
	
	//If a, apply a function to it, else return b
	function applyor(a,apply,b){
		if(a){
			return apply(a);
		}
		return b;
	}
	
	//Convenience function to make a tag with attributes and children (REALLY helps for recursive value building)
	function mktag(n,attrs,children,events){
		var $tag=$("<"+n+">");
		
		$.each(attrs,function(k,v){
			if(v!==undefined){
				var m;
				if(k=="class"){
					$tag.addClass(v);
				}
				else if(m=/^data-(.*)/.exec(k)){
					$tag.data(m[1],v);
					$tag.attr("data-has"+m[1],"1");
				}
				else{
					$tag.attr(k,v);
				}
			}
		});
		
		addchildren($tag,children);
		
		if(events){
			$.each(events,function(x,v){
				$tag.on(x,v);
			});
		}
		
		return $tag;
	}
	
	function build(x){
		if(x===undefined){
			return;
		}
		else if($.isArray(x)){
			var out=[];
			$.each(x,function(i,v){
				out.push(build(v));
			});
			return out;
		}
		else if(typeof x=="object"){
			var tag=tags[x.name];
			if(tag){
				return tag.build(x.name,x.attrs,x.extra);
			}
			else{
				//Later change this to build a span-like tag.
				throw new Error('Unrecognized tag name "'+x.name+'"');
			}
		}
		//Must be text, but sanity check
		else if(typeof x=="string"){
			return x;
		}
		throw new Error("Unrecognized type");
	}
	
	//"Override" of tagdef for local data storage
	function Tagdef(attrs,build_tag){
		return {
			attrs:attrs,
			build:function(name,attrs,extra){
				var stuff=build_tag(name,attrs,extra);
				if(typeof stuff=="string" || $.isArray(stuff)){
					return stuff;
				}
				//Global stuff
				var tip=build(attrs.get("tip"));
				if(tip){
					stuff.data("tip",tip).attr("data-hastip","");
				}
				return stuff.
					attr("id",as("text",attrs.get("id"))||undefined).
					addClass(as("text",attrs.get("class")));
			}
		};
	}
	
	/**
	 * Compile a {sel} tag into a CSS selector.
	**/
	function compile_sel(x){
		//classes, ids, pseudo 
		var k=[],ids=[],pseudo=[]
		var v=x.attrs.get("class");
		if(v){
			if(typeof v=="object"
		}
	}
	
	var tags={
		//Comment
		"!":Tagdef([],
			function(name,attrs,extra){
				//A raw [] is interpreted as meaning "ignore this value"
				return [];
			}
		),
		"doc":Tagdef(["..."],
			function(name,attrs,extra){
				//Wrap in an array to disable global modifications.
				return [mktag("html",{},[
					mktag("head",{},[
						applyor(as("text",attrs.get("title")),
							function(x){
								return mktag("title",{},x);
							}
						),
						applyor(as("image",attrs.get("link")),
							function(x){
								return mktag("link",{
									rel:"shortcut icon",
									href:x
								});
							}
						),
						//Default, built-in styles.
						mktag("style",{
							type:"text/css",
							id:"snow-style"
						},defstyle),
						applyor(as("text",attrs.get("style")),
							function(x){
								return mktag("style",{
									type:"text/css"
								},x);
							}
						)
					]),
					mktag("body",{},build(attrs.get("...")))
				])];
			}
		),
		"bold":Tagdef(["..."],
			function(name,attrs,extra){
				var content=attrs.get("...");
				return mktag("b",{},build(content));
			}
		),
		"italic":Tagdef(["..."],
			function(name,attrs,extra){
				return mktag("i",{},build(attrs.get("...")));
			}
		),
		"underline":Tagdef(["..."],
			function(name,attrs,extra){
				return mktag("u",{},build(attrs.get("...")));
			}
		),
		"strike":Tagdef(["..."],
			function(name,attrs,extra){
				return mktag("del",{},build(attrs.get("...")));
			}
		),
		"center":Tagdef(["..."],
			function(name,attrs,extra){
				return mktag("center",{},build(attrs.get("...")));
			}
		),
		"vcenter":Tagdef(["..."],
			function(name,attrs,extra){
				return mktag("div",{
					"class":"-sno-vcenter"
				},build(attrs.get("...")));
			}
		),
		"link":Tagdef(["url","..."],
			function(name,attrs,extra){
				return mktag("a",{
					href:as("url",attrs.get("url"))
				},build(attrs.get("...")));
			}
		),
		"image":Tagdef(["url"],
			function(name,attrs,extra){
				return mktag("img",{
					src:as("url",attrs.get("url")),
					alt:as("text",attrs.get("alt"))
				});
			}
		),
		"list":Tagdef([],
			function(name,attrs,extra){
				var rel=attrs.get("rel");
				if(rel && rel=="defs"){
					if(extra.length && typeof extra[0]=="object"){
						var elems=[];
						extra[0].each(function(x,v){
							elems.push(mktag("dt",{},x));
							elems.push(mktag("dd",{},v));
						});
						return mktag("dl",{},elems);
					}
					//No extra, fall through to normal list building
				}
				
				var attrs_by=as("text",attrs.get("by"));
				var by,type;
				if(attrs_by){
					if(attrs_by.name=="image"){
						by="list-style-image:url("+attrs.by.attrs.url+");";
						type="ul";
					}
					else if(by={"*":"disc",o:"circle",square:"square","":"none"}[attrs_by]){
						by="list-style-type:"+by+";";
						type="ul";
					}
					else if(by={0:"decimal-leading-zero",1:"decimal",a:"lower-alpha",A:"upper-alpha",i:"lower-roman",I:"upper-roman"}[attrs_by]){
						by="list-style-type:"+by+";";
						type="ol";
					}
				}
				else{
					type="ul";
				}
				
				var elems=[];
				$.each(extra,function(x,v){
					elems.push($("<li>").append(build(v)));
				});
				
				return mktag(type,{
					style:by
				},elems);
			}
		),
		"cols":Tagdef([],
			function(name,attrs,extra){
				var expand=0;
				var flex=[];
				var rigid=[];
				$.each(extra,function(x,v){
					if(isTag(v)){
						var w=as("text",v.attrs.get("width"));
						if(/\d+%/.test(w)){
							flex.push(w);
						}
						else if(/\d+px/.test(w)){
							rigid.push(w);
						}
						else{
							++expand;
						}
					}
					else{
						++expand;
					}
				});
				
				var eqspace="100%/"+(expand+flex.length+rigid.length);
				var elems=[];
				$.each(extra,function(x,v){
					var rw,w;
					if(isTag(v)){
						rw=v.attrs.get("width");
					}
					
					if(rw && (/\d+%/.test(rw) || /\d+px/.test(rw))){
						w=rw;
					}
					else{
						//Unspecified widths depend on other columns.
						w=["calc(",eqspace];
						$.each(rigid,function(x,v){
							w.push(
								" + (",
								eqspace,
								" - ",
								v,
								")/",
								expand+flex.length
							);
						});
						$.each(flex,function(x,v){
							w.push(" - ",v);
						});
						w.push(")");
						w=w.join("");
					}
					
					elems.push($("<div>").addClass("-sno-col").css({width:w}).append(build(v)));
				});
				
				return mktag("div",{
					"class":"-sno-cols"
				},elems);
			}
		),
		"rows":Tagdef([],
			function(name,attrs,extra){
				var elems=[];
				$.each(extra,function(x,v){
					elems.push($("<div>").addClass("-sno-row").append(build(v)));
				});
				
				return mktag("div",{
					"class":"-sno-rows"
				},elems);
			}
		),
		"style",Tagdef(["..."],
			function(name,attrs,extra){
				var content=attrs.get("...");
				if(content){
					if(isTag(content)){
						if(content.name=="sel"){
							// !!!!!!!!!!!!!!!!
						}
					}
				}
			}
		)
	};
	
	//Build the tagset from the tags object.
	var tagset=(function(){
		var ts={};
		//jQuery might not be available yet.
		for(var x in tags){
			//v.build is used in post-parsing.
			ts[x]=snow.Tagdef(tags[x].attrs);
		}
		
		return snow.Tagset(ts);
	})();
	
	function load(s){
		var doc;
		//Parse and ignore leading text.
		$.each(snow.parse(s.trim(),tagset),function(x,v){
			if(typeof v=="object"){
				doc=v;
				return false;
			}
		});
		
		//Convert the doc to an HTML structure.
		var $doc=build(doc)[0];
		
		$doc.find("[data-hastip]").tooltip({
			content:function(){
				return $(this).data("tip");
			},
			items:"[data-hastip]",
			tooltipClass:"-sno-tooltip"
		});
		
		//Deindent and store for debugging.
		var indent=99;
		s=s.trimRight().replace(/^\s*(\r\n|\n|\r)/gm,"");
		$.each(s.match(/^\t*/gm),function(x,v){
			if(v.length<indent){
				indent=v.length;
			}
		});
		this.doc=s.replace(new RegExp("^\t{"+indent+"}","gm"),"");
		
		//jQuery has nothing to do this, so we must use straight JS.
		try{
			document.replaceChild($doc[0],document.documentElement);
		}
		catch(e){
			document.open("text/html","replace");
			document.write($doc.html());
			document.close();
		}
		
		$(document.head).append(
			$("<link>").attr({
				rel:"stylesheet",
				href:root+"jqueryui/1.10.4/themes/smoothness/jquery-ui.css"
			})
		);
	}
	
	return {
		tagset:tagset,
		load:load,
		fromurl:function(url,type){
			$.ajax(url,{
				type:type||"GET",
				success:function(data){
					load(data);
				}
			});
		}
	};
})();