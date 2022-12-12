#!/usr/bin/python
import sys
from pathlib import Path
from xml.dom import minidom

# def getName(name):
#     nameBits = name.split('}')
#     return nameBits[1]

# Read the script name
scriptName = sys.argv[0]

# Read how man arguments there were to the script
argsNum = len(sys.argv)

# If there are not 2 tell them only one file
if argsNum != 2:
    print ('The script', scriptName, 'requires a single file as an argument')

# Read the file name from the command line argument
fileName = sys.argv[1]

# Read the file object
fileItself = Path(fileName)

# Check if it is a file
if not fileItself.is_file():
    print (fileName, 'is not a file')

# xmlFile = open(fileName)
# parsedFile = minidom.parse(xmlFile)

# tracks = parsedFile.getElementsByTagName('trk')

# for i in tracks:
#     print(i)

