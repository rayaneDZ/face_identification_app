const express  = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require("cors");
const User = require('./models/User.js');
const secret_key = 'secret'

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://root:TqkFgJNZM7uN6En@face-identification-app-7h6js.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true}, (err, db) =>{
    mongoose.connection.readyState == 1 ? console.log('CONNECTED TO DB') : console.log('UNABLE TO CONNECT TO DB');
    if(err) {
        console.log(err)
    }
});

app.get('/api/users', (req, res) => {
    console.log('getting users')
    User.find()
    .then(result => {
        return res.status(200).json({
            users: result
        })
    })
})

app.post('/api/add_user', (req, res) => {
    const username = req.body.username;
    if(req.body.secret_key === secret_key){
        User.find()
        .then(result => {
            let user_exists = false
            result.forEach(user => {
                console.log('inside for each')
                if(username === user.username){
                    user_exists = true
                    res.status(409).json({
                        message : 'user already exists',
                        code : 1
                    })
                }
            })
            if(!user_exists){
                console.log('creating users')
                const user = new User({
                    username : username
                })
                user.save()
                .then((result) => {
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

app.use(express.static('./client'));
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'index.html'));
});

app.listen(PORT, () => console.log('listening on port ' + PORT))