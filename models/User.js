const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username : {type : String, required : true, unique : true},
    images_paths : {type : Array, default : []}
});

module.exports = mongoose.model('User', userSchema);