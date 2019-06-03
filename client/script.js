const getUsers = () => {
    axios.get('http://localhost:5000/api/users')
    .then(result => {
        const options = result.data.users.map(user => `<option value="${user.username}">${user.username}</option>`)
        document.querySelector('select').innerHTML = options
    })
}

getUsers();

document.getElementById('upload_image_btn').addEventListener('click', () => {
    document.getElementById('upload_image_container').style.display = 'block';
    document.getElementById('add_user_container').style.display = 'none';
    document.getElementById('file_input').click();
})

document.getElementById('add_user_btn').addEventListener('click', () => {
    document.getElementById('upload_image_container').style.display = 'none';
    const AUC = document.getElementById('add_user_container');
    if(AUC.style.display === 'block'){
        AUC.style.display = 'none'
    }else {
        AUC.style.display = 'block'
    }
})

document.getElementById('file_input').addEventListener('change', (e) => {
    const image = e.target.files[0]
    var reader  = new FileReader();
    reader.readAsDataURL(image);
    reader.addEventListener("load", function () {
        const src = reader.result;
        document.getElementById('image_preview').innerHTML = `<img src="${src}" width="100%" alt="Image preview..." id="imagePreview" style="margin-bottom : 10px"/>`
    }, false);
})

document.getElementById('add_user_to_backend_btn').addEventListener('click', () => {
    const username = document.getElementById('add_user_name').value;
    const secret_key = document.getElementById('add_user_secret_key').value;
    axios.post('http://localhost:5000/api/add_user', {
        username : username,
        secret_key : secret_key
    }).then(() => {
        document.getElementById('add_user_wrong_secret_key').style.display = 'none';
        document.getElementById('add_user_user_exists').style.display = 'none';
        document.getElementById('add_user_container').style.display = 'none';
        alert('User Added !')
        getUsers();
    }).catch((err) => {
        const code = err.response.data.code;
        console.log(err)
        if(code === 1){
            document.getElementById('add_user_wrong_secret_key').style.display = 'none';
            document.getElementById('add_user_user_exists').style.display = 'block';
        }else if ( code === 0){
            document.getElementById('add_user_wrong_secret_key').style.display = 'block';
            document.getElementById('add_user_user_exists').style.display = 'none';
        }
    })
})