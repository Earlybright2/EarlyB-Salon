(async () => {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/test/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testuser@example.com', password: 'password123' }),
    });
    console.log('STATUS', res.status);
    console.log('SET-COOKIE', res.headers.get('set-cookie'));
    const text = await res.text();
    console.log('BODY', text);
  } catch (err) {
    console.error('ERR', err.message || err);
  }
})();
