const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Message = require('./models/Message');
const ws = require('ws');
const fs = require('fs');
// const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

const DatauriParser = require("datauri/parser");
const parser = new DatauriParser();

cloudinary.config({
    cloud_name: 'dgurum7um',
    api_key: '896266595269685',
    api_secret: 'fl56uaBXjGwIw2a-xTq-2iSaa0Y',
    secure: true
});


dotenv.config();

mongoose.connect(process.env.MONGO_URL).then(res => console.log("Done"));

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();
const upload = multer();
app.use(upload.any());


// app.use(fileUpload({
//     useTempFiles: true
// }));

// app.use('/uploads', express.static(__dirname + '/uploads'));

app.use(express.json());

app.use(cookieParser());

app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));

async function getUserdataFromRequest(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;

        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) throw err;
                resolve(userData);
            });
        }
        else {
            reject('no token');
        }
    });
}

app.get('/test', (req, res) => {
    res.json('test ok');
});

app.get('/messages/:userId', async (req, res) => {
    const { userId } = req.params;
    const userData = await getUserdataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
        sender: { $in: [userId, ourUserId] },
        recipient: { $in: [userId, ourUserId] },
    }).sort({ createdAt: 1 });
    res.json(messages);
});

app.get('/people', async (req, res) => {
    const users = await User.find({}, { '_id': 1, username: 1, pic:1 });
    res.json(users);
});

app.get('/profile', (req, res) => {
    const token = req.cookies?.token;

    try {
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) throw err;
                res.json(userData);
            });
        }
        else {
            res.status(401).json('no token');
        }
    }
    catch (error) {
        console.error("An error occured", error);
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const foundUser = await User.findOne({ username });

    if (foundUser) {
        const passOk = bcrypt.compareSync(password, foundUser.password);
        if (passOk) {
            jwt.sign({ userId: foundUser._id, username, profilePhoto: foundUser.pic }, jwtSecret, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token, { sameSite: 'none', secure: true }).json({
                    id: foundUser._id,
                });
            });
        }
    }

})

app.post('/logout', (req, res) => {
    res.cookie('token', '', { sameSite: 'none', secure: true }).json('ok');
})

app.post('/register', async (req, res) => {
    // app.post('/register', upload.single('profilePhoto'), async (req, res) => {
    const { username, password } = req.body;
    // console.log("req.body = ", req.body);
    // console.log("req files = ", req.files);
    // console.log(req);
    const profilePhoto = req.files[0];
    const extName = path.extname(profilePhoto.originalname).toString();
    const file64 = parser.format(extName, profilePhoto.buffer);

    let cloudinaryUrl = "https://res.cloudinary.com/dgurum7um/image/upload/v1698955004/default_avatar_k5oywa.png";
    // console.log("profile Photo is", profilePhoto.path);
    if (profilePhoto) {
        const filename = profilePhoto.originalname.split('.')[0];
        try {
            // const result = await cloudinary.uploader.upload(file.data, {});
            const result = await cloudinary.uploader.upload(file64.content, {});
            cloudinaryUrl = result.secure_url;
            // console.log("Url is", cloudinaryUrl);
        }
        catch (error) {
            console.error("Error uploading file to Cloudinary:", error);
        }
    }
    try {
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
        const createdUser = await User.create({
            username: username,
            password: hashedPassword,
            pic: cloudinaryUrl,
        });
        jwt.sign({ userId: createdUser._id, username, profilePhoto: cloudinaryUrl }, jwtSecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, { sameSite: 'none', secure: true }).status(201).json({
                id: createdUser._id,
            });
        });

    }
    catch (err) {
        if (err) throw err;
        res.status(500).json('error');
    }
});

const server = app.listen(4000);

const wss = new ws.WebSocketServer({ server });

wss.on('connection', (connection, req) => {

    function notifyAboutOnlinePeople() {
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username, profilePhoto:c.profilePhoto })),
            }
            ));
        });
    }

    connection.isAlive = true;

    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOnlinePeople();
            // console.log('dead');
        }, 1000)
    }, 5000);

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
    });

    // read username and id from the cookie for this connection
    const cookies = req.headers.cookie;
    if (cookies) {
        const tokenCookieString1 = cookies.split(';').find(str => str.startsWith(' token='));
        const tokenCookieString2 = cookies.split(';').find(str => str.startsWith('token='));
        let tokenCookieString;
        if (typeof tokenCookieString1 != 'undefined') {
            tokenCookieString = tokenCookieString1;
        }
        else if (typeof tokenCookieString2 != 'undefined') {
            tokenCookieString = tokenCookieString2;
        }
        if (tokenCookieString) {
            const token = tokenCookieString.split('=')[1];
            if (token) {
                jwt.verify(token, jwtSecret, {}, (err, userData) => {
                    if (err) throw err;
                    const { userId, username, profilePhoto } = userData;
                    connection.userId = userId;
                    connection.username = username;
                    connection.profilePhoto = profilePhoto;
                });
            }
        }
    }

    connection.on('message', async (message) => {
        const messageData = JSON.parse(message.toString());
        const { recipient, text, file } = messageData;
        let cloudinaryUrl = null;
        let filename = null;
        if (file) {
            filename = file.name.split('.')[0];
            // const parts = file.name.split('.');
            // const ext = parts[parts.length - 1];
            // filename = Date.now() + '.' + ext;
            // const path = __dirname + '/uploads/' + filename;
            // const bufferData = new Buffer(file.data.split(',')[1], 'base64');
            // fs.writeFile(path, bufferData, () => {
            //     console.log('file saved:' + path);
            // });
            try {
                const result = await cloudinary.uploader.upload(file.data, {});
                // console.log(result)
                cloudinaryUrl = result.secure_url;
                // console.log("url is ", cloudinaryUrl);
            } catch (error) {
                console.error('Error uploading file to Cloudinary:', error);
            }
        }
        if (recipient && (text || file)) {
            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient,
                text,
                // file: file ? filename : null,
                file: file ? cloudinaryUrl : null,
                filename,
                // file: cloudinaryUrl,
            });
            connection.send(JSON.stringify({
                type: 'acknowledgment',
                messageId: messageData.messageId, // Use a unique identifier for the message
            }));
            [...wss.clients]
                .filter(c => c.userId === recipient)
                .forEach(c => c.send(JSON.stringify({
                    text,
                    sender: connection.userId,
                    recipient,
                    // file: file ? filename : null,
                    file: file ? cloudinaryUrl : null,
                    filename,
                    _id: messageDoc._id,
                })));
        }
    });



    // Notify everyone about online people (when someone connects)

    notifyAboutOnlinePeople();
});


// vfa3JhU8qA6N9TSQ
