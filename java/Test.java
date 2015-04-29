import org.snow.*;
import org.json.*;

import java.util.regex.Pattern;
import java.util.regex.Matcher;

import java.util.Map;
import java.util.Arrays;

import java.io.FileReader;
import java.io.FileNotFoundException;

/**
 * Run the library through the test suite.
**/
public class Test implements SnowVisitor{
	/**
	 * Pattern for characters which must be encoded using ~*.
	**/
	private static final Pattern toEncode=Pattern.compile(
		"[^ -}]",Pattern.DOTALL
	);
	
	/**
	 * The parser used to parse test cases.
	**/
	Parser parser;
	
	/**
	 * Method used by both section and document
	**/
	public Object visit_secdoc(Section sec){
		String s=Integer.toString(sec.size());
		for(Flake elem: sec){
			s+=elem.visit(this);
		}
		return s;
	}
	
	@Override
	public Object visit_doc(Document d){
		return "("+visit_secdoc(d)+")";
	}
	
	@Override
	public Object visit_text(Text t){
		StringBuffer build=new StringBuffer("\"");
		String src=t.value();
		
		build.append(src.codePointCount(0,src.length()));
		build.append(":");
		
		Matcher m=toEncode.matcher(src);
		while(m.find()){
			m.appendReplacement(build,
				"~"+Integer.toString(m.group().codePointAt(0))+"."
			);
		}
		
		m.appendTail(build);
		build.append("\"");
		return build.toString();
	}
	
	@Override
	public Object visit_section(Section s){
		return "["+visit_secdoc(s)+"]";
	}
	
	@Override
	public Object visit_tag(Tag t){
		StringBuilder build=new StringBuilder("{");
		build.append(t.posCount());
		for(Flake pos: t){
			build.append(pos.visit(this));
		}
		
		build.append(t.namedCount());
		
		String[] named=new String[t.namedCount()];
		int x=0;
		
		for(Map.Entry<Flake,Flake> n: t.iterNamed()){
			named[x++]=n.getKey().visit(this).toString()+
				n.getValue().visit(this);
		}
		
		Arrays.sort(named);
		
		for(String n: named){
			build.append(n);
		}
		
		build.append("}");
		return build.toString();
	}
	
	public Test(Parser p){
		parser=p;
	}
	
	public String gen_test(String doc){
		try{
			return parser.parse(doc).visit(this).toString();
		}
		catch(ParseError err){
			switch(err.getMessage()){
				case ParseError.SECTION_EOF:
					return "![";
				case ParseError.DQ_EOF:
					return "!\"";
				case ParseError.SQ_EOF:
					return "!'";
				case ParseError.BQ_EOF:
					return "!`";
				case ParseError.TAG_EOF:
					return "!{";
				case ParseError.UNEXPECTED_CLOSE_SECTION:
					return "!{]";
				case ParseError.UNNAMED_ATTR:
					return "!:?";
				case ParseError.DUPLICATE_ATTR:
					return "!::";
				case ParseError.ILLEGAL_NAMED:
					return "!:";
				case ParseError.MIXED:
					return "!{]";
			}
			
			//Unexpected error
			throw err;
		}
	}
	
	public static void main(String[] args){
		Test tester=new Test(new Parser());
		JSONObject tests=null;
		
		try{
			tests=new JSONObject(
				new JSONTokener(new FileReader("../tests/test.json"))
			);
		}
		catch(FileNotFoundException e){
			System.out.println(
				"Couldn't find test suite file ../tests/test.json"
			);
			return;
		}
		
		int fails=0;
		for(String name: JSONObject.getNames(tests)){
			JSONObject test=tests.getJSONObject(name);
			System.out.print("Testing "+name+"... ");
			
			String st=tester.gen_test(test.getString("doc")),
				answer=test.getString("test");
			
			if(st.equals(answer)){
				System.out.println("pass");
			}
			else{
				System.out.println("fail!");
				System.out.println(" *Have: "+st);
				System.out.println(" *Want: "+answer);
				++fails;
			}
		}
		
		if(fails>0){
			System.out.println();
			System.out.println(fails+" failures!");
		}
		else{
			System.out.println();
			System.out.println("Test successful; no failures");
		}
	}
}