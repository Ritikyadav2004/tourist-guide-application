const http = require('http');

const loginData = JSON.stringify({
    email: 'arshadking7163@gmail.com',
    password: 'password123'
});

function post(path, data, token) {
    return new Promise((resolve, reject) => {
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'POST',
            headers: headers
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, body: body });
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function run() {
    try {
        console.log('Logging in...');
        const loginRes = await post('/api/users/login', loginData);
        const loginBody = JSON.parse(loginRes.body);
        const token = loginBody.token;

        const savePayload = JSON.stringify({
            postId: 'not-an-object-id', // Invalid ObjectId
            selectedAssets: [],
            numberOfPeople: 2,
            startDate: '2026-08-25',
            endDate: '2026-08-27'
        });

        console.log('Sending save custom package request...');
        const saveRes = await post('/api/custom-package/save', savePayload, token);
        console.log('Save Response Status:', saveRes.status);
        console.log('Save Response Body:', saveRes.body);

    } catch (err) {
        console.error(err);
    }
}

run();
