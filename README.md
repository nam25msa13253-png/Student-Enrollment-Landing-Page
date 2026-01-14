const axios = require('axios');

app.get('/google-callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect('/login.html');

    try {
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: '768046406196-dudfbk5ckv7lm0q4f1tq7ut2ks2vj0n1.apps.googleusercontent.com',
            client_secret: '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',
            redirect_uri: 'http://localhost:3000/google-callback',
            grant_type: 'authorization_code'
        });

        const { access_token } = tokenRes.data;
        const userRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${access_token}`);
        const { id, email, name, picture } = userRes.data;

        db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
            if (err) {
                console.error(err);
                return res.redirect('/login.html');
            }

            if (results.length > 0) {
                // Login logic here (e.g., set session)
                return res.redirect('/');
            }

            const newUser = { google_id: id, email, name, avatar: picture, created_at: new Date() };
            db.query('INSERT INTO users SET ?', newUser, (insertErr) => {
                if (insertErr) {
                    console.error(insertErr);
                    return res.redirect('/login.html');
                }
                // Login logic here
                res.redirect('/');
            });
        });

    } catch (error) {
        console.error(error.message);
        res.redirect('/login.html');
    }
});



//Đăng nhập bằng google