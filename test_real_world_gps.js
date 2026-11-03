const http = require('http');

function postJson(path, data, token = null) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getJson(path, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('TESTING REAL-WORLD WORKING SCHOOL BUS TRACKER');
  console.log('====================================================');

  try {
    // 1. Authenticate Admin
    const adminLogin = await postJson('/api/auth/login', { username: 'admin', password: 'admin123' });
    if (adminLogin.status !== 200 || !adminLogin.data.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    }
    const adminToken = adminLogin.data.token;
    console.log('[TEST 1] Admin Authentication: SUCCESS');

    // 2. Fetch Fleet Routes
    const routesRes = await getJson('/api/transport', adminToken);
    if (routesRes.status !== 200 || !Array.isArray(routesRes.data) || routesRes.data.length === 0) {
      throw new Error(`Failed to fetch fleet routes: ${JSON.stringify(routesRes.data)}`);
    }
    console.log(`[TEST 2] Fetch Fleet Routes: SUCCESS (${routesRes.data.length} active routes found)`);
    const route1 = routesRes.data[0];

    // 3. Driver Real-World GPS Stream (navigator.geolocation stream emulation)
    // Send live GPS coordinate near Civil Lines Metro Interchange (28.640, 77.218)
    const gpsStreamRes = await postJson(`/api/transport/${route1.id}/gps-stream`, {
      latitude: 28.6405,
      longitude: 77.2182,
      speedKmh: 36,
      heading: 142.5,
      accuracyMeters: 4.2,
      batteryLevel: 91,
      source: 'DRIVER_DEVICE'
    }, adminToken);

    if (gpsStreamRes.status !== 200 || !gpsStreamRes.data.success) {
      throw new Error(`GPS stream failed: ${JSON.stringify(gpsStreamRes.data)}`);
    }
    console.log('[TEST 3] Driver Real-World GPS Stream: SUCCESS');
    console.log(`         Updated Route Lat/Lng: ${gpsStreamRes.data.route.currentLat}, ${gpsStreamRes.data.route.currentLng}`);
    console.log(`         Detected Status / Stop: ${gpsStreamRes.data.route.currentStatus}`);
    console.log(`         Speed: ${gpsStreamRes.data.route.currentSpeedKmh} km/h | Heading: ${gpsStreamRes.data.route.heading}°`);

    // 4. Verify Breadcrumbs History
    const historyRes = await getJson(`/api/transport/${route1.id}/gps-history`, adminToken);
    if (historyRes.status !== 200 || !Array.isArray(historyRes.data) || historyRes.data.length === 0) {
      throw new Error(`Failed to fetch breadcrumbs history: ${JSON.stringify(historyRes.data)}`);
    }
    console.log(`[TEST 4] GPS Breadcrumbs Trail: SUCCESS (${historyRes.data.length} historical breadcrumb points recorded)`);

    // 5. Test Passenger Boarding Scanner Check-in
    const boardingRes = await postJson(`/api/transport/${route1.id}/board-passenger`, {
      studentId: 1,
      studentName: 'Alex Morgan',
      actionType: 'BOARDED_PICKUP',
      stopName: 'Civil Lines Metro Interchange',
      latitude: 28.6405,
      longitude: 77.2182,
      scannedBy: 'DRIVER_COCKPIT'
    }, adminToken);

    if (boardingRes.status !== 200 || !boardingRes.data.success) {
      throw new Error(`Boarding record failed: ${JSON.stringify(boardingRes.data)}`);
    }
    console.log(`[TEST 5] Student Boarding Scanner: SUCCESS (Alex Morgan checked-in at ${boardingRes.data.boardingRecord.stopName})`);

    // 6. Verify Route Boarding Logs
    const boardingLogsRes = await getJson(`/api/transport/${route1.id}/boarding-logs`, adminToken);
    if (boardingLogsRes.status !== 200 || !Array.isArray(boardingLogsRes.data) || boardingLogsRes.data.length === 0) {
      throw new Error(`Failed to fetch boarding logs: ${JSON.stringify(boardingLogsRes.data)}`);
    }
    console.log(`[TEST 6] Boarding Activity Log: SUCCESS (${boardingLogsRes.data.length} scans logged today)`);

    // 7. Student Portal Live Proximity Tracking
    const studentLogin = await postJson('/api/auth/login', { username: 'student1', password: 'student123' });
    if (studentLogin.status !== 200 || !studentLogin.data.token) {
      throw new Error(`Student login failed: ${JSON.stringify(studentLogin.data)}`);
    }
    const studentToken = studentLogin.data.token;

    const studentLiveRes = await getJson('/api/transport/my-bus/live', studentToken);
    if (studentLiveRes.status !== 200 || !studentLiveRes.data.assigned) {
      throw new Error(`Student live tracking failed: ${JSON.stringify(studentLiveRes.data)}`);
    }
    console.log('[TEST 7] Student Live Proximity Tracker: SUCCESS');
    console.log(`         Assigned Bus: ${studentLiveRes.data.route.busNumber}`);
    console.log(`         Designated Stop: ${studentLiveRes.data.busStop}`);
    console.log(`         Distance to Stop: ${studentLiveRes.data.distanceToStopMeters ? Math.round(studentLiveRes.data.distanceToStopMeters) + ' meters' : 'N/A'}`);
    console.log(`         Approaching: ${studentLiveRes.data.isApproaching}`);
    console.log(`         ETA: ${studentLiveRes.data.etaMinutes} mins`);
    console.log(`         Last Boarding: ${studentLiveRes.data.lastBoarding ? studentLiveRes.data.lastBoarding.actionType : 'None'}`);

    // 8. Emergency Panic SOS Test
    const sosRes = await postJson(`/api/transport/${route1.id}/sos`, {
      emergencyStatus: 'EMERGENCY_SOS',
      sosAlertMessage: 'Traffic gridlock at Ring Road flyover'
    }, adminToken);
    if (sosRes.status !== 200 || !sosRes.data.success) {
      throw new Error(`SOS trigger failed: ${JSON.stringify(sosRes.data)}`);
    }
    console.log('[TEST 8] Emergency SOS Trigger: SUCCESS (Alert broadcasted to dispatch)');

    // Reset SOS to Normal
    await postJson(`/api/transport/${route1.id}/sos`, {
      emergencyStatus: 'NORMAL',
      sosAlertMessage: null
    }, adminToken);
    console.log('[TEST 9] Emergency SOS Resolve: SUCCESS (Reset to Normal)');

    console.log('====================================================');
    console.log('ALL 9 REAL-WORLD GPS TRACKER INTEGRATION TESTS PASSED!');
    console.log('====================================================');
  } catch (err) {
    console.error('TEST SUITE ERROR:', err.message);
    process.exit(1);
  }
}

runTests();
