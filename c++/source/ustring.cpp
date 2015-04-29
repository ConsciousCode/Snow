#include <cstdexcept>
#include "ustring.hpp"

UString::UString(){
	size=8;
	len=0;
	width=1;
	data1=(uint8_t*)malloc(8*sizeof uint8_t);
}

unsigned UString::length(){
	return len;
}

unsigned UString::get(unsigned x){
	if(x>len){
		throw std::out_of_range("snow::util::UString::get");
	}
	
	switch(width){
		case 1:
			return data1[x];
		case 2:
			return data2[x];
		case 4:
			return data3[x];
		default:
			//Fail nicely if code elsewhere uses a different width
			throw std::exception(
				"A character width that isn't 1, 2, or 4 isn't "
				"yet implemented for UString"
			);
	}
}

void UString::append(unsigned x){
	switch(width){
		case 1:
			if(x<256){
				if(len==size){
					data1=(uint8_t*)realloc(data1,size*sizeof uint8_t);
				}
				data1[len]=x;
			}
			else if(x<65536){
				data2=(uint16_t*)realloc(data1,size*sizeof uint16_t);
				data2[len]=x;
			}
			else{
				data4=(uint32_t*)realloc(data1,size*sizeof uint32_t);
				data4[len]=x;
			}
			break;
		case 2:
			if(x>=65536){
				data4=(uint32_t*)realloc(data2,size*sizeof uint32_t);
				data4[len]=x;
			}
			else{
				if(len==size){
					data2=(uint16_t*)realloc(data2,size*sizeof uint16_t);
				}
				data2[len]=x;
			}
			break;
		case 4:
			if(len==size){
				size+=size/2;
				data4=(uint32_t*)realloc(data4,size*sizeof uint32_t);
			}
			data4[len]=x;
			break;
		default:
			//Fail nicely if code elsewhere uses a different width
			throw std::exception(
				"A character width that isn't 1, 2, or 4 isn't "
				"yet implemented for UString"
			);
	}
	
	if(++len==size){
		size+=size/2;
	}
}