#!/usr/bin/python
import sys, datetime
from pathlib import Path
from xml.dom import minidom

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
tracks = parsedFile.getElementsByTagName('trk')

trackNum = 0

# tracks  = ''
# segment = ''
# points  = ''
# point   = ''

for segment in tracks:
    points = segment.getElementsByTagName('trkpt')

    pointNum = 0

    for point in points:
        pointNum += 1
        pointLat = float(point.getAttribute('lat'))
        pointLon = float(point.getAttribute('lon'))
        pointTimeObj = point.getElementsByTagName('time')
        pointElevObj = point.getElementsByTagName('ele')

        # Skip the point if there is no time for the point
        if not pointTimeObj:
            continue

        pointTime = pointTimeObj[0].firstChild.data
        pointElev = float(pointElevObj[0].firstChild.data)

        pointTime = pointTime[0:18]

        dt = datetime.datetime.strptime(pointTime, dateFormat)

        print ('Track', str(trackNum) + ': Point', str(pointNum) + ':-', pointLat, pointLon, dt, pointElev)

    trackNum += 1
    print()




# for staff in staffs:
#         staff_id = staff.getAttribute("id")
#         name = staff.getElementsByTagName("name")[0]
#         salary = staff.getElementsByTagName("salary")[0]
#         print("id:% s, name:% s, salary:% s" %
#               (staff_id, name.firstChild.data, salary.firstChild.data))

