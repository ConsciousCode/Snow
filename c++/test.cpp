#include <cstdio>
#include "snow.hpp"

int main(){
	Parser p;

	try{
		Document* d=p.parse("Hello {i World p:[Section test {with tags}]}");
		printf("%s %d",d->str().c_str(),(int)d->flakes.size());
		delete d;
	}
	catch(const ParseError& e){
		printf("Error: %s\n",e.what());
	}

	return 0;
}
