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
		".-sno-col{float:left;}\n.-sno-cols{margin:0;}"
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
	
	//Convenience function to make a tag with attributes and children (REALLY helps for recursive value building)
	function mktag(n,attrs,children,events){
		var $tag=$("<"+n+">");
		
		$.each(attrs||{},function(k,v){
			if(v!==undefined){
				var m=/^data-(.*)/.exec(k);
				if(m){
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
		
		$tag.tooltip({
			content:function(){
				return $(this).data("tip");
			},
			items:"[data-hastip]",
			tooltipClass:"-sno-tooltip"
		});
		
		return $tag;
	}
	
	//"Override" of tagdef for local data storage
	function Tagdef(attrs,build){
		return {
			attrs:attrs,
			build:build
		};
	}
	
	function build(x){
		if($.isArray(x)){
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
		//Must be text
		else{
			return x;
		}
	}
	
	var tags={
		"doc":Tagdef(["title","..."],
			function(name,attrs,extra){
				return mktag("html",{},[
					mktag("head",{},[
						attrs.title?mktag("title",{},attrs.title):undefined,
						attrs.icon?mktag("link",{
							rel:"shortcut icon",
							href:attrs.icon
						}):undefined,
						//Default, built-in styles.
						mktag("style",{
								type:"text/css"
							},defstyle
						),
						attrs.style?mktag("style",{
								type:"text/css"
							},attrs.style
						):undefined
					]),
					mktag("body",{
						"data-tip":build(attrs.tip),
						id:attrs.id,
						"class":attrs["class"]
					},build(attrs["..."]))
				]);
			}
		),
		"bold":Tagdef(["..."],
			function(name,attrs,extra){
				return mktag("b",{
					"data-tip":build(attrs.tip),
					id:attrs.id,
					"class":attrs["class"]
				},build(attrs["..."]));
			}
		),
		"italic":Tagdef(["..."],
			function(name,attrs,extra){
				return mktag("i",{
					"data-tip":build(attrs.tip),
					id:attrs.id,
					"class":attrs["class"]
				},build(attrs["..."]));
			}
		),
		"underline":Tagdef(["..."],
			function(name,attrs,extra){
				return mktag("u",{
					"data-tip":build(attrs.tip),
					id:attrs.id,
					"class":attrs["class"]
				},build(attrs["..."]));
			}
		),
		"strike":Tagdef(["..."],
			function(name,attrs,extra){
				return mktag("del",{
					"data-tip":build(attrs.tip),
					id:attrs.id,
					"class":attrs["class"]
				},build(attrs["..."]));
			}
		),
		"center":Tagdef(["..."],
			function(name,attrs,extra){
				return mktag("center",{
					"data-tip":build(attrs.tip),
					id:attrs.id,
					"class":attrs["class"]
				},build(attrs["..."]));
			}
		),
		"vcenter":Tagdef(["..."],
			function(name,attrs,extra){
				return mktag("div",{
					"data-tip":build(attrs.tip),
					"class":"-sno-vcenter"+(attrs["class"]?" "+attrs["class"]:""),
					id:attrs.id
				},build(attrs["..."]));
			}
		),
		"link":Tagdef(["url","..."],
			function(name,attrs,extra){
				return mktag("a",{
					href:attrs.url,
					"data-tip":build(attrs.tip),
					id:attrs.id,
					"class":attrs["class"]
				},build(attrs["..."]));
			}
		),
		"image":Tagdef(["url"],
			function(name,attrs,extra){
				return mktag("img",{
					src:attrs.url,
					alt:attrs.alt,
					"data-tip":build(attrs.tip),
					id:attrs.id,
					"class":attrs["class"]
				});
			}
		),
		"list":Tagdef([],
			function(name,attrs,extra){
				var by,type;
				if(attrs.by){
					if(attrs.by.name=="image"){
						by="list-style-image:url("+attrs.by.attrs.url+");";
						type="ul";
					}
					else if(by={"*":"disc",o:"circle",square:"square","":"none"}[attrs.by]){
						by="list-style-type:"+by+";";
						type="ul";
					}
					else if(by={0:"decimal-leading-zero",1:"decimal",a:"lower-alpha",A:"upper-alpha",i:"lower-roman",I:"upper-roman"}[attrs.by]){
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
					var w=v.attrs?v.attrs.width:"";
					if(/\d+%/.test(w)){
						flex.push(w);
					}
					else if(/\d+px/.test(w)){
						rigid.push(w);
					}
					else{
						++expand;
					}
				});
				
				var elems=[];
				$.each(extra,function(x,v){
					var rw=v.attrs?v.attrs.width:"",w;
					var eqspace="100%/"+(expand+flex.length+rigid.length);
					
					if(rw && (/\d+%/.test(rw) || /\d+px/.test(rw))){
						w=rw;
					}
					else{
						//Unspecified widths depend on other columns.
						w="calc("+eqspace;
						$.each(rigid,function(x,v){
							w+=" + ("+eqspace+" - "+v+")/"+(expand+flex.length);
						});
						$.each(flex,function(x,v){
							w+=" - "+v;
						});
						w+=")";
					}
					
					elems.push($("<div>").addClass("-sno-col").css({width:w}).append(build(v)));
				});
				
				return mktag("div",{
					"class":(attrs["class"]?attrs["class"]+" ":"")+"-sno-cols",
					"id":attrs.id
				},elems);
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
		var $doc=build(doc);
		
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