const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    pic: {
        type: String,
        default: 'https://res.cloudinary.com/dgurum7um/image/upload/v1698955004/default_avatar_k5oywa.png',
    },
}, { timestamps: true });

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;