require('dotenv').config();

const fs = require('fs');
const express  = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require("cors");
const User = require('./models/User.js');
const path = require('path');
const cp  = require('child_process');
const request = require('request');

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
    console.log('getting users');
    User.find()
    .then(result => {
        return res.status(200).json({
            users: result
        })
    })
})
app.post('/api/add_user', (req, res) => {
    console.log('req.body.username');
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

app.get('/api/train', (req, res) =>{
    console.log('reached api train route');
    let n = cp.fork('/home/pi/Desktop/face_ID/downloader/downloader.js')
    n.on('message', (m) => {
	if(m.message === 'downloaded'){
	    console.log('downloaded')
	}else if(m.message === 'trained'){
	    console.log('trained')
	    res.status(200).json({
		message : 'trained'
	    })
	}
    })
})

app.post('/api/face_check', (req, res) => {
    const url = req.body.url
    request.head(url, () => {
        console.log('downloading one image .......')
        request(url).pipe(fs.createWriteStream('/home/pi/Desktop/face_identification_app/face_check/check.jpeg')).on('close', () => {
            console.log('downloaded one image to face check it');
            cp.exec('python /home/pi/Desktop/face_identification_app/face_check/face_check.py', (err, stdout, stderr) => {
                if(err){
                    console.log('second exec err : ', err)
                    res.status(500).json({
                        message : 'internal error'
                    })
                }
                if(stdout){
		    console.log('image contains a face');
                    res.status(200).json({
                        message : true
                    })
                }else {
		    console.log('image does NOT contain a face :/');
                    res.status(200).json({
                        message : false
                    })
                }
  	   	fs.unlink('/home/pi/Desktop/face_identification_app/face_check/check.jpeg', () => console.log('deleted check.jpeg'))
            })
        });
    });
})

app.post('/api/delete_image', (req, res) => {
    const url = req.body.url;
    const username = req.body.username
    User.findOne({username : username})
        .exec()
        .then(user => {
            const index = user.images_paths.indexOf(url);
            if(index > -1){
                user.images_paths.splice(index, 1);
                user.save();
                res.status(202).json({
                    message: true
                });
            }else{
                res.status(404).json({
                    message: false
                })
            }
        })
})


app.use(express.static('./client'));
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'index.html'));
});

app.listen(PORT, () => console.log('listening on port ' + PORT))
