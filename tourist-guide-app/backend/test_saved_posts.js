const http = require('http');

// Helper to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  const host = 'localhost';
  const port = 5000;
  let token = '';
  let postId = '';

  console.log('--- STARTING INTEGRATION TESTS FOR SAVED POSTS API ---');

  try {
    // 1. Log in
    console.log('\nStep 1: Logging in as arshadking7163@gmail.com...');
    const loginRes = await makeRequest({
      hostname: host,
      port: port,
      path: '/api/users/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      email: 'arshadking7163@gmail.com',
      password: 'password123',
    });

    if (loginRes.statusCode !== 200 || !loginRes.body.token) {
      throw new Error(`Login failed with status ${loginRes.statusCode}: ${JSON.stringify(loginRes.body)}`);
    }

    token = loginRes.body.token;
    console.log('Login successful! Token acquired.');

    // 2. Fetch all posts to get a valid post ID
    console.log('\nStep 2: Fetching posts to find a valid postId...');
    const postsRes = await makeRequest({
      hostname: host,
      port: port,
      path: '/api/posts/all',
      method: 'GET',
    });

    const postsList = postsRes.body.posts || [];
    if (postsList.length === 0) {
      throw new Error('No posts found in database to test with.');
    }

    postId = postsList[0]._id;
    console.log(`Found post ID: ${postId} ("${postsList[0].title}")`);

    // 3. Save post
    console.log(`\nStep 3: Saving post ${postId} via POST /api/users/save-post/${postId}...`);
    const saveRes = await makeRequest({
      hostname: host,
      port: port,
      path: `/api/users/save-post/${postId}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Save response status:', saveRes.statusCode);
    console.log('Save response body:', JSON.stringify(saveRes.body, null, 2));

    if (saveRes.statusCode !== 200 || !saveRes.body.success) {
      throw new Error('Save post endpoint failed or returned success: false');
    }

    // 4. Get saved posts
    console.log('\nStep 4: Fetching saved posts via GET /api/users/saved-posts...');
    const getRes = await makeRequest({
      hostname: host,
      port: port,
      path: '/api/users/saved-posts',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Get saved posts status:', getRes.statusCode);
    console.log('Get saved posts count:', getRes.body.savedPosts ? getRes.body.savedPosts.length : 0);
    if (getRes.body.savedPosts && getRes.body.savedPosts.length > 0) {
      const firstSaved = getRes.body.savedPosts[0];
      console.log('First saved post details:', {
        id: firstSaved._id,
        title: firstSaved.title,
        price: firstSaved.price,
        postedBy: firstSaved.postedBy ? firstSaved.postedBy.name : null,
      });
    }

    if (getRes.statusCode !== 200 || !getRes.body.success) {
      throw new Error('Get saved posts endpoint failed or returned success: false');
    }

    // Verify it includes our saved post
    const hasPost = getRes.body.savedPosts.some(p => p._id === postId);
    console.log(`Is the saved post present in the list? ${hasPost ? 'YES (SUCCESS)' : 'NO (FAILED)'}`);
    if (!hasPost) {
      throw new Error('Saved post was not found in getSavedPosts list.');
    }

    // 5. Unsave post
    console.log(`\nStep 5: Un-saving post ${postId} via POST /api/users/unsave-post/${postId}...`);
    const unsaveRes = await makeRequest({
      hostname: host,
      port: port,
      path: `/api/users/unsave-post/${postId}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Unsave response status:', unsaveRes.statusCode);
    console.log('Unsave response body:', JSON.stringify(unsaveRes.body, null, 2));

    if (unsaveRes.statusCode !== 200 || !unsaveRes.body.success) {
      throw new Error('Unsave post endpoint failed or returned success: false');
    }

    // 6. Get saved posts again to verify removal
    console.log('\nStep 6: Fetching saved posts again to verify removal...');
    const getRes2 = await makeRequest({
      hostname: host,
      port: port,
      path: '/api/users/saved-posts',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const hasPostAfter = getRes2.body.savedPosts.some(p => p._id === postId);
    console.log(`Is the saved post still present in the list? ${hasPostAfter ? 'YES (FAILED)' : 'NO (SUCCESS)'}`);
    if (hasPostAfter) {
      throw new Error('Post was not successfully removed from the savedPosts array.');
    }

    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('\n!!! TEST RUN FAILED !!!');
    console.error(error.message);
    process.exit(1);
  }
}

run();
