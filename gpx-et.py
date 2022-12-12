#!/usr/bin/python
import sys
import xml.etree.ElementTree as ET

def getName(name):
    nameBits = name.split('}')
    return nameBits[1]


fileName = sys.argv[1]

parsedFile = ET.parse(fileName)

root = parsedFile.getroot()

rootName = getName(root.tag)

print('rootName', rootName)

for i in root:
    name = getName(i.tag)
    print ('name:', name)

    if name == 'trk':
        trackSeg = i[0]
        trackSegName = getName(trackSeg.tag)
        print ('trackSegName:', trackSegName)

        for point in trackSeg:
            pointLat = point.attrib['lat']
            pointLon = point.attrib['lon']
            print(pointLat, pointLon)

