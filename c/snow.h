#ifndef SNOW_LANG_H
#define SNOW_LANG_H

#include <stdint.h>

#include <stdbool.h>

/**
 * @file snow.h
 *
 * C implementation of a Snow parser.
 *
 * Any pointers and subpointers held by structures are assumed to be non-null
 *  and owned solely by the instance of that object. Ownership is not shared
 *  among objects; this only becomes relevant when using the included
 *  delete_flake function should the end user violate these assumptions.
**/

/**
 * Enum of Snow Flake types to simulate virtual behavior.
**/
typedef enum{
	TEXT=1,
	TAG=2,
	SECTION=3,
	DOCUMENT=4
} FlakeType;

/**
 * Base structure of Snow objects.
**/
typedef struct{
	/**
	 * Flake type to simulate virtual behavior.
	**/
	FlakeType type;
} Flake;

/**
 * Growable list of Snow objects.
**/
typedef struct{
	/**
	 * The size and length of the data.
	**/
	size_t size,length;
	/**
	 * The data in the list.
	**/
	Flake** data;
} FlakeList;

/**
 * Text object.
**/
typedef struct{
	/**
	 * Base structure.
	**/
	Flake base;
	
	/**
	 * A string representing the contained text (NOT NULL TERMINATED!).
	**/
	char* text;
	/**
	 * Actual size/capcity of the string.
	**/
	size_t size;
	/**
	 * Length of the string.
	**/
	size_t length;
} Text;

/**
 * Tag object.
**/
typedef struct{
	/**
	 * Base structure.
	**/
	Flake base;
	
	/**
	 * The named attribute names.
	**/
	FlakeList keys;
	/**
	 * The named attribute values.
	**/
	FlakeList vals;
	/**
	 * The positional attributes.
	**/
	FlakeList pos;
} Tag;

typedef struct{
	/**
	 * Base structure.
	**/
	Flake base;
	
	/**
	 * Contained Snow objects.
	**/
	FlakeList vals;
} Section;

/**
 * Snow document.
**/
typedef Section Document;

/**
 * Construct a new text object.
 *
 * @param s - The initial string content (may contain null).
 * @param own - Whether or not the content is owned (if not, copy it so it is).
 * @param len - The length of the string (if -1, use strlen)
 *
 * @return The new text object.
**/
Text* new_text(char* s,bool own=true,int len=-1);

/**
 * Construct a new tag object.
 *
 * @param keys - An array of named attribute names.
 * @param vals - An array of named attribute values.
 * @param pos - An array of positional attributes.
 *
 * @param 
 *
 * @return The new tag object.
**/
Tag* new_tag(Flake** keys,Flake** 

#endif
