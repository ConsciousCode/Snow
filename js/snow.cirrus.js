function crs2html(text){
	'use strict';
	
	function content(tag){
		return tag.get("...")||"";
	}
	
	function textify(x){
		if(typeof x=="undefined"){
			return "";
		}
		return x.visit({
			visit_section:function(sec){
				return sec.value.map(function(v){
					return v.visit(this).trim();
				},this).join('');
			},
			visit_tag:function(tag){
				return content(tag);
			},
			visit_text:function(text){
				return text.value;
			}
		});
	}
	
	function htmlify(x){
		return x.replace(/<>&/g,function(m){
			return {"<":"&lt;",">":"&gt;","&":"&amp;"}[m[0]];
		});
	}
	
	function htmlstring(x){
		return '"'+x.replace(/"/g,"&quot;")+'"';
	}
	
	function format_attrs(attrs){
		var av=[];
		for(var a in attrs){
			var x=attrs[a];
			if(typeof x!="undefined"){
				av.push(a+"="+htmlstring(x));
			}
		}
		
		if(av.length){
			return " "+av.join(" ");
		}
		return "";
	}
	
	function make_tag(f){
		return function(tag){
			var attrs={},x=null;
			if(x=tag.get("class")){
				attrs["class"]=textify(x);
			}
			if(x=tag.get("id")){
				attrs.id=textify(x);
			}
			if(x=tag.get("tip")){
				attrs.title=textify(x);
			}
			if(x=tag.get("lang")){
				attrs.lang=textify(x);
			}
			
			return f.call(this,tag,attrs);
		}
	}
	
	function visit(v,x){
		if(x instanceof snow.Flake){
			return x.visit(v);
		}
		return "";
	}
	
	function add2attr(attrs,a,val,sep){
		var aa=attrs[a];
		if(aa){
			if(aa[aa.length-1]==sep){
				attrs[a]+=sep+val;
			}
			else{
				attrs[a]+=val;
			}
		}
		attrs[a]=val;
	}
	
	var normal=snow.Tagdef(["..."]),empty=snow.Tagdef();
	var defs={
		doc:normal,
		box:normal,
		span:normal,
		link:snow.Tagdef(['url','...']),
		image:snow.Tagdef(['url']),
		line:empty,
		"break":empty,
		rows:empty,col:empty,
		cols:empty,row:empty,
		list:empty,
		input:empty,
		grid:empty
	};
	var build={
		doc:function(tag){
			var head=[
				'<link rel="stylesheet" href="http://parachan.org/snow/cirrus/cirrus.css"/>'
			],x;
			if(x=tag.get("title")){
				head.push("<title>"+textify(x)+"</title>");
			}
			
			return '<!DOCTYPE html><html><head>'+
				head.join('')+'</head><body>'+
				visit(this,tag.get("..."))+"</body></html>";
		},
		box:make_tag(function(tag,gattrs){
			return "<div"+format_attrs(attrs)+">"+
				visit(this,tag.get("..."))+
			"</div>";
		}),
		span:make_tag(function(tag,attrs){
			return "<span"+format_attrs(attrs)+">"+
				visit(this,tag.get("..."))+
			"</span>";
		}),
		link:make_tag(function(tag,attrs){
			attrs.href=textify(tag.get("url"));
			
			return "<a"+format_attrs(attrs)+">"+
				(visit(this,tag.get("..."))||visit(this,url)||"")+
			"</a>";
		}),
		image:make_tag(function(tag,attrs){
			attrs.src=textify(tag.get("url"));
			return "<img"+format_attrs(attrs)+"/>";
		}),
		line:make_tag(function(tag,attrs){
			return "<br"+format_attrs(attrs)+"/>";
		}),
		"break":make_tag(function(tag,attrs){
			return "<hr"+format_attrs(attrs)+"/>";
		}),
		rows:make_tag(function(tag,attrs){
			add2attr(attrs,"class","-cirrus-rows"," ");
			
			var content=[],pos=tag.pos,pl=pos.length;
			for(var i=1;i<pl;++i){
				content.push(
					'<div class="-cirrus-rows-row">'+
					visit(this,pos[i])+"</div>"
				);
			}
			
			return "<div"+format_attrs(attrs)+">"+content.join("")+"</div>";
		}),
		cols:make_tag(function(tag,attrs){
			add2attr(attrs,"class","-cirrus-cols"," ");
			
			var content=[],pos=tag.pos,pl=pos.length;
			for(var i=1;i<pl;++i){
				content.push(
					'<div class="-cirrus-cols-col">'+
					visit(this,pos[i])+"</div>"
				);
			}
			
			return "<div"+format_attrs(attrs)+">"+content.join("")+"</div>";
		}),
		list:make_tag(function(tag,attrs){
			var by=tag.get("by"),content=tag.pos.slice(1).map(function(v){
				return '<li>'+visit(this,v)+'</li>';
			},this).join("");
			
			if(typeof by!="undefined"){
				if(by instanceof snow.Tag && by.get(0) &&
						by.get(0).value=="image"){
					add2attr(attrs,"style",
						"list-style-image:url("+
						textify(by.get("url"))+")",";"
					);
				}
				else{
					by=textify(by);
					if(["1","A","a","I","i"].indexOf(by)>=0){
						attrs.type=by;
						return '<ol'+format_attrs(attrs)+'>'+
							content+'</ol>';
					}
					
					by={
						"*":"disc",
						"o":"circle"
					}[by]||by;
					
					if(["disc","circle","square","none"].indexOf(by)>=0){
						add2attr(attrs,"style","list-style-type:"+by,";");
					}
				}
			}
			return '<ul'+format_attrs(attrs)+'>'+content+'</ul>';
		}),
		input:make_tag(function(tag,attrs){
			var tmp=tag.get("value");
			if(tmp){
				attrs.value=textify(tmp);
			}
			
			tmp=tag.get("placeholder");
			if(tmp){
				attrs.placeholder=textify(tmp);
			}
			
			tmp=tag.get("type");
			if(tmp){
				attrs.type=textify(tmp);
			}
			
			return '<input'+format_attrs(attrs)+"/>";
		}),
		grid:make_tag(function(tag,attrs){
			return '<table'+format_attrs(attrs)+'><tbody>'+
				tag.pos.slice(1).map(function(v){
					"<tr>"+v.pos.slice(1).map(function(v){
						return "<td>"+visit(this,v)+"</td>";
					},this).join("")+"</tr>";
				},this).join("")+"</tbody></table>";
		})
	};
	
	build.row=build.cols;
	build.col=build.rows;
	
	return snow.parse(text,{
		get:function(keys,vals,pos){
			var x=pos[0];
			if(x instanceof snow.Text && x.value in defs){
				return defs[x.value];
			}
			return defs.span;
		}
	}).visit({
		visit_doc:function(doc){
			var items=doc.value,dl=items.length;
			for(var i=0;i<dl;++i){
				var x=items[i];
				if(x instanceof snow.Tag){
					var xn=x.get(0);
					if(xn instanceof snow.Text && xn.value=="doc"){
						return x.visit(this);
					}
				}
			}
			return "<!DOCTYPE html><html>"+
				"<head><title>Untitled</title></head><body>"+
				this.visit_section(doc)+
			"</body></html>";
		},
		visit_section:function(sec){
			var items=sec.value,il=items.length,out=[];
			for(var i=0;i<il;++i){
				out.push(items[i].visit(this).trim());
			}
			return out.join('');
		},
		visit_tag:function(tag){
			var tn=tag.get(0);
			if(tn instanceof snow.Text){
				var def=build[tn.value];
				if(typeof def=="undefined"){
					def=build.span;
				}
			}
			else{
				var def=build.span;
			}
			
			return def.call(this,tag);
		},
		visit_text:function(text){
			return text.value;
		}
	});
}