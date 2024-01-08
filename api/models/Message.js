const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    file: String,
    filename: String,
}, { timestamps: true });

const MessageModel = mongoose.model('Message', MessageSchema);

// MessageModel.deleteMany({})
//   .then(() => {
//     console.log('All messages have been deleted.');
//   })
//   .catch((err) => {
//     console.error('Error deleting messages:', err);
//   });


module.exports = MessageModel;