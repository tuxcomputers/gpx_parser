function $(id) {
    return document.getElementById(id);
}

function ParseAngle(id, limit) {
    var angle = parseFloat($(id).value);
    if (isNaN(angle) || (angle < -limit) || (angle > limit)) {
        $('ErrorMessage').innerHTML = "Invalid angle value.";
        $(id).focus();
        return null;
    } else {
        return angle;
    }
}

function ParseElevation(id) {
    var angle = parseFloat($(id).value);
    if (isNaN(angle)) {
        $('ErrorMessage').innerHTML = "Invalid elevation value.";
        $(id).focus();
        return null;
    } else {
        return angle;
    }
}

function ParseLocation(prefix) {
    var lat = ParseAngle(prefix + '_lat', 90.0);
    var location = null;
    if (lat != null) {
        var lon = ParseAngle(prefix + '_lon', 180.0);
        if (lon != null) {
            var elv = ParseElevation(prefix + '_elv');
            if (elv != null) {
                location = { 'lat': lat, 'lon': lon, 'elv': elv };
            }
        }
    }
    return location;
}

function EarthRadiusInMeters(latitudeRadians)      // latitude is geodetic, i.e. that reported by GPS
{
    // http://en.wikipedia.org/wiki/Earth_radius
    var a = 6378137.0;  // equatorial radius in meters
    var b = 6356752.3;  // polar radius in meters
    var cos = Math.cos(latitudeRadians);
    var sin = Math.sin(latitudeRadians);
    var t1 = a * a * cos;
    var t2 = b * b * sin;
    var t3 = a * cos;
    var t4 = b * sin;
    return Math.sqrt((t1 * t1 + t2 * t2) / (t3 * t3 + t4 * t4));
}

function GeocentricLatitude(lat) {
    // Convert geodetic latitude 'lat' to a geocentric latitude 'clat'.
    // Geodetic latitude is the latitude as given by GPS.
    // Geocentric latitude is the angle measured from center of Earth between a point and the equator.
    // https://en.wikipedia.org/wiki/Latitude#Geocentric_latitude
    var e2 = 0.00669437999014;
    var clat = Math.atan((1.0 - e2) * Math.tan(lat));
    return clat;
}

function LocationToPoint(c, oblate) {
    // Convert (lat, lon, elv) to (x, y, z).
    var lat = c.lat * Math.PI / 180.0;
    var lon = c.lon * Math.PI / 180.0;
    var radius = oblate ? EarthRadiusInMeters(lat) : 6371009;
    var clat = oblate ? GeocentricLatitude(lat) : lat;

    var cosLon = Math.cos(lon);
    var sinLon = Math.sin(lon);
    var cosLat = Math.cos(clat);
    var sinLat = Math.sin(clat);
    var x = radius * cosLon * cosLat;
    var y = radius * sinLon * cosLat;
    var z = radius * sinLat;

    // We used geocentric latitude to calculate (x,y,z) on the Earth's ellipsoid.
    // Now we use geodetic latitude to calculate normal vector from the surface, to correct for elevation.
    var cosGlat = Math.cos(lat);
    var sinGlat = Math.sin(lat);

    var nx = cosGlat * cosLon;
    var ny = cosGlat * sinLon;
    var nz = sinGlat;

    x += c.elv * nx;
    y += c.elv * ny;
    z += c.elv * nz;

    return { 'x': x, 'y': y, 'z': z, 'radius': radius, 'nx': nx, 'ny': ny, 'nz': nz };
}

function Distance(ap, bp) {
    var dx = ap.x - bp.x;
    var dy = ap.y - bp.y;
    var dz = ap.z - bp.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function RotateGlobe(b, a, bradius, aradius, oblate) {
    // Get modified coordinates of 'b' by rotating the globe so that 'a' is at lat=0, lon=0.
    var br = { 'lat': b.lat, 'lon': (b.lon - a.lon), 'elv': b.elv };
    var brp = LocationToPoint(br, oblate);

    // Rotate brp cartesian coordinates around the z-axis by a.lon degrees,
    // then around the y-axis by a.lat degrees.
    // Though we are decreasing by a.lat degrees, as seen above the y-axis,
    // this is a positive (counterclockwise) rotation (if B's longitude is east of A's).
    // However, from this point of view the x-axis is pointing left.
    // So we will look the other way making the x-axis pointing right, the z-axis
    // pointing up, and the rotation treated as negative.

    var alat = -a.lat * Math.PI / 180.0;
    if (oblate) {
        alat = GeocentricLatitude(alat);
    }
    var acos = Math.cos(alat);
    var asin = Math.sin(alat);

    var bx = (brp.x * acos) - (brp.z * asin);
    var by = brp.y;
    var bz = (brp.x * asin) + (brp.z * acos);

    return { 'x': bx, 'y': by, 'z': bz, 'radius': bradius };
}

function NormalizeVectorDiff(b, a) {
    // Calculate norm(b-a), where norm divides a vector by its length to produce a unit vector.
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var dz = b.z - a.z;
    var dist2 = dx * dx + dy * dy + dz * dz;
    if (dist2 == 0) {
        return null;
    }
    var dist = Math.sqrt(dist2);
    return { 'x': (dx / dist), 'y': (dy / dist), 'z': (dz / dist), 'radius': 1.0 };
}

function Calculate(oblate) {
    // clear any previous output or error message...
    $('ErrorMessage').innerHTML = '';
    $('div_Distance').innerHTML = '';
    $('div_Azimuth').innerHTML = '';
    $('div_Altitude').innerHTML = '';

    var a = ParseLocation('a');
    if (a != null) {
        var b = ParseLocation('b');
        if (b != null) {
            var ap = LocationToPoint(a, oblate);
            var bp = LocationToPoint(b, oblate);
            var distKm = 0.001 * Distance(ap, bp);
            $('div_Distance').innerHTML = distKm.toFixed(3) + '&nbsp;km';

            // Let's use a trick to calculate azimuth:
            // Rotate the globe so that point A looks like latitude 0, longitude 0.
            // We keep the actual radii calculated based on the oblate geoid,
            // but use angles based on subtraction.
            // Point A will be at x=radius, y=0, z=0.
            // Vector difference B-A will have dz = N/S component, dy = E/W component.                
            var br = RotateGlobe(b, a, bp.radius, ap.radius, oblate);
            if (br.z * br.z + br.y * br.y > 1.0e-6) {
                var theta = Math.atan2(br.z, br.y) * 180.0 / Math.PI;
                var azimuth = 90.0 - theta;
                if (azimuth < 0.0) {
                    azimuth += 360.0;
                }
                if (azimuth > 360.0) {
                    azimuth -= 360.0;
                }
                $('div_Azimuth').innerHTML = azimuth.toFixed(4) + '&deg;';
            }

            var bma = NormalizeVectorDiff(bp, ap);
            if (bma != null) {
                // Calculate altitude, which is the angle above the horizon of B as seen from A.
                // Almost always, B will actually be below the horizon, so the altitude will be negative.
                // The dot product of bma and norm = cos(zenith_angle), and zenith_angle = (90 deg) - altitude.
                // So altitude = 90 - acos(dotprod).
                var altitude = 90.0 - (180.0 / Math.PI) * Math.acos(bma.x * ap.nx + bma.y * ap.ny + bma.z * ap.nz);
                $('div_Altitude').innerHTML = altitude.toFixed(4).replace(/-/g, '&minus;') + '&deg;';
            }
        }
    }
}

var save_b_lat = '';    // holds point B latitude  from non-geostationary mode
var save_b_elv = '';    // holds point B elevation from non-geostationary mode

function OnGeoCheck() {
    // The geostationary checkbox was clicked.
    var geomode = $('cb_geo').checked;
    if (geomode) {
        // Save values so user doesn't lose them on accidental/curiosity click.
        save_b_lat = $('b_lat').value;
        save_b_elv = $('b_elv').value;

        // Fill in the values for geostationary orbit.
        $('b_lat').value = '0';         // assume satellite is directly above equator.
        $('b_elv').value = '35786000';  // 35,786 km above equator.

        // Disable editing of point B latitude and elevation while box is checked.
        $('b_lat').disabled = true;
        $('b_elv').disabled = true;
    } else {
        // Restore saved values to edit boxes, so user doesn't lose them.
        $('b_lat').value = save_b_lat;
        $('b_elv').value = save_b_elv;

        // Enable editing of point B latitude and elevation while box is checked.
        $('b_lat').disabled = false;
        $('b_elv').disabled = false;
    }
}
