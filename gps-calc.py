import math

def locationToPoint(p_lat, p_lon, p_ele):
    lat    = p_lat * math.pi / 180
    lon    = p_lon * math.pi / 180
    radius = earthRadiusInMeters(lat)
    glat   = geocentricLatitude(lat)

    cosLon = math.cos(lon);
    sinLon = math.sin(lon);
    cosLat = math.cos(clat);
    sinLat = math.sin(clat);
    x = radius * cosLon * cosLat;
    y = radius * sinLon * cosLat;
    z = radius * sinLat;

    # We used geocentric latitude to calculate (x,y,z) on the Earth's ellipsoid.
    # Now we use geodetic latitude to calculate normal vector from the surface, to correct for elevation.
    cosGlat = math.cos(lat);
    sinGlat = math.sin(lat);

    nx = cosGlat * cosLon;
    ny = cosGlat * sinLon;
    nz = sinGlat;

    x += p_ele * nx;
    y += p_ele * ny;
    z += p_ele * nz;
    
    return { 'x': x, 'y': y, 'z': z, 'radius': radius, 'nx': nx, 'ny': ny, 'nz': nz }


def earthRadiusInMeters(latitudeRadians):
    a = 6378137.0;  # equatorial radius in meters
    b = 6356752.3;  # polar radius in meters
    cos = math.cos(latitudeRadians);
    sin = math.sin(latitudeRadians);
    t1 = a * a * cos;
    t2 = b * b * sin;
    t3 = a * cos;
    t4 = b * sin;
    return math.sqrt((t1 * t1 + t2 * t2) / (t3 * t3 + t4 * t4));


def geocentricLatitude(lat):
    # Convert geodetic latitude 'lat' to a geocentric latitude 'clat'.
    # Geodetic latitude is the latitude as given by GPS.
    # Geocentric latitude is the angle measured from center of Earth between a point and the equator.
    # https://en.wikipedia.org/wiki/Latitude#Geocentric_latitude
    e2 = 0.00669437999014
    glat = math.atan((1.0 - e2) * math.tan(lat))
    return glat


