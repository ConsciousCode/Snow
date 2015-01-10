import org.snowlang.snow.*;

public class Test{
	public static void main(String[] args){
		Parser p=new Parser();
		Document d=p.parse("bla{test {name {b\\ `hello`}}:attr pos hello");
		System.out.println(d);
	}
}