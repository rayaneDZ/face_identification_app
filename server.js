require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require("cors");
const User = require('./models/User.js');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://'+process.env.MONGODB_USERNAME+':'+process.env.MONGODB_PASSWORD+'@face-identification-app-7h6js.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true}, (err, db) =>{
    mongoose.connection.readyState == 1 ? console.log('CONNECTED TO DB') : console.log('UNABLE TO CONNECT TO DB');
    if(err) {
        console.log(err)
    }
});

app.post('/api/check_auth', (req, res) => {
    const secret_key = req.body.secret_key;
    if(secret_key === process.env.SECRET_KEY){
        return res.status(200).json({
            code : true
        })
    }
    return res.status(401).json({
        code : false
    })
})
app.get('/api/users', (req, res) => {
    User.find()
    .then(result => {
        return res.status(200).json({
            users: result
        })
    })
})
app.post('/api/add_user', (req, res) => {
    const username = req.body.username;
    if(req.body.secret_key === process.env.SECRET_KEY){
        User.find()
        .then(result => {
            let user_exists = false
            result.forEach(user => {
                if(username === user.username){
                    user_exists = true
                    res.status(409).json({
                        message : 'user already exists',
                        code : 1
                    })
                }
            })
            if(!user_exists){
                console.log('creating user')
                const user = new User({
                    username : username
                })
                user.save()
                .then((result) => {
                    console.log('user created!')
                    res.status(201).json({
                        response : result
                    })
                })
            }
        })
    }else{
        console.log('wrong secret key')
        res.status(401).json({
            message : 'wrong secret key',
            code : 0
        })
    }
})
app.post('/api/upload_picture', (req, res) => {
    const username = req.body.username;
    const image_path = req.body.image_path;
    User.findOneAndUpdate({username : username}, {$push : {images_paths : image_path}})
    .then(() => {
        res.status(201).json({
            message : 'added image entry successfully'
        })
    }).catch(() => {
        res.status(500).json({
            message : 'error'
        })
    })
})

app.use(express.static('./client'));
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'index.html'));
});

app.listen(PORT, () => console.log('listening on port ' + PORT))