const express  = require('express');
const app = express();
const PORT = 5000;

app.get('/api/test', (req, res) => {
    res.status(200).send('testss')
})

app.use(express.static('./client'));
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'index.html'));
});

app.listen(PORT, () => console.log('listening on port ' + PORT))