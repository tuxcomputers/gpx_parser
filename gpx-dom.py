#!/usr/bin/python
import sys, datetime, math
from pathlib import Path
from xml.dom import minidom

class trackPoint:
    def __init__(tp, lat, lon, dtm, ele, prevPoint = ''):
        tp.lat       = lat
        tp.lat       = lon
        tp.lat       = dtm
        tp.lat       = ele
        tp.prevPoint = prevPoint

        if prevPoint:
            print ('It was given a previous point')

dateFormat = '%Y-%m-%dT%H:%M:%S'

# Read the script name
scriptName = sys.argv[0]

# Read how man arguments there were to the script
argsNum = len(sys.argv)

# If there are not 2 tell them only one file
if argsNum != 2:
    print ('The script', scriptName, 'requires a single file as an argument')
    print ()
    print ()
    exit()

# Read the file name from the command line argument
fileName = sys.argv[1]

# Read the file object
fileItself = Path(fileName)

# Check if it is a file
if not fileItself.is_file():
    print (fileName, 'is not a file')
    print ()
    print ()
    exit()

# Open the file
xmlFile = open(fileName)

# Parse the file
parsedFile = minidom.parse(xmlFile)

# Read the tracks
tracksList = parsedFile.getElementsByTagName('trk')

# Create the track array
trackArray = []
trackNum = 0

# Loop through each track
for track in tracksList:
    points = track.getElementsByTagName('trkpt')

    pointNum = 0

    # Loop though each point in the track
    for point in points:
        
        pointNum += 1

        # Read the Lat and Lon
        pointLat = float(point.getAttribute('lat'))
        pointLon = float(point.getAttribute('lon'))
        
        # Read the time and elevation
        pointTimeObj = point.getElementsByTagName('time')
        pointElevObj = point.getElementsByTagName('ele')
        pointElev = 0.0

        # Skip the point if there is no time for the point
        if not pointTimeObj:
            print ('Track', str(trackNum) + ': Point', str(pointNum) + ' has no time and cannot be included')
            continue

        pointTime = pointTimeObj[0].firstChild.data
        if pointElevObj:
            pointElev = float(pointElevObj[0].firstChild.data)

        pointTime = pointTime[0:18]

        dt = datetime.datetime.strptime(pointTime, dateFormat)

        if pointNum == 1:
            curPoint = trackPoint(pointLat, pointLon, dt, pointElev)
        else:
            curPoint = trackPoint(pointLat, pointLon, dt, pointElev, pastPoint)

        pastPoint = curPoint

        # print ('Track', str(trackNum) + ': Point', str(pointNum) + ':-', pointLat, pointLon, dt, pointElev)

    trackNum += 1
    print()

