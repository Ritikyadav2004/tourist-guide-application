const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, 'config', 'config.env') });
const User = require('./models/userModel');
const { savePackage } = require('./controller/customPackageController');

async function run() {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('DB Connected');

        const tourist = await User.findOne({ email: 'arshadking7163@gmail.com' });

        const req = {
            user: tourist,
            body: {
                postId: '6a328111285f3956dc778d00', // Non-existent ID
                selectedAssets: [],
                numberOfPeople: 2,
                startDate: '2026-08-25',
                endDate: '2026-08-27'
            }
        };

        const res = {
            status: function(code) {
                console.log('Response Status:', code);
                return this;
            },
            json: function(data) {
                console.log('Response JSON:', JSON.stringify(data, null, 2));
                return this;
            }
        };

        console.log('Invoking savePackage...');
        await savePackage(req, res);
        process.exit(0);
    } catch (err) {
        console.error('Unhandled script error:', err);
        process.exit(1);
    }
}

run();
