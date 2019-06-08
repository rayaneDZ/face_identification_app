(getUsers = () => {
    console.log('getting the users')
    axios.get('http://192.168.1.5:5000/api/users')
    .then(result => {
        const options = result.data.users.map(user => `<option value="${user.username}">${user.username}</option>`)
        document.querySelector('select').innerHTML = options
    })
})()

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyDyvR4SeXocW5gooY6vfvtfuDfahnPJ7C8",
    authDomain: "face-identification-c2987.firebaseapp.com",
    databaseURL: "https://face-identification-c2987.firebaseio.com",
    projectId: "face-identification-c2987",
    storageBucket: "face-identification-c2987.appspot.com",
    messagingSenderId: "86919330306",
    appId: "1:86919330306:web:ba1413e0780a2cf3"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

document.getElementById('upload_image_btn').addEventListener('click', () => {
    document.getElementById('add_user_container').style.display = 'none';
    document.getElementById('upload_image_container').style.display = "block";
})

document.getElementById('add_user_btn').addEventListener('click', () => {
    document.getElementById('add_user_container').style.display = 'block';
    document.getElementById('upload_image_container').style.display = "none";
})

document.getElementById('select_image_btn').addEventListener('click', () => {
    document.getElementById('file_input').click();
})

document.getElementById('file_input').addEventListener('change', (e) => {
    const image = e.target.files[0]
    var reader  = new FileReader();
    reader.readAsDataURL(image);
    reader.addEventListener("load", function () {
        const src = reader.result;
        document.getElementById('image_preview').innerHTML = `<img src="${src}" width="100%" alt="Image preview..." id="imagePreview" style="margin-bottom : 10px"/>`
    }, false);
    document.getElementById('image_preview').style.display = "block"
    document.getElementById('upload_image_must_select_image').style.display = "none"
})

document.getElementById('add_user_to_backend_btn').addEventListener('click', () => {
    const username = document.getElementById('add_user_name').value;
    const secret_key = document.getElementById('add_user_secret_key').value;
    axios.post('http://192.168.1.5:5000/api/add_user', {
        username : username.toLowerCase(),
        secret_key : secret_key
    }).then(() => {
        document.getElementById('add_user_wrong_secret_key').style.display = 'none';
        document.getElementById('add_user_user_exists').style.display = 'none';
        document.getElementById('add_user_container').style.display = 'none';
	document.getElementById('upload_image_container').style.display = "block";
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

document.getElementById('upload_image_to_backend_btn').addEventListener('click', () => {
    const image = document.getElementById('file_input').files[0];
    const username = document.querySelector('select').value;
    const secret_key = document.getElementById('upload_image_secret_key').value;
    const image_uuid = uuid()
    async function compressImage(image){
	console.log('source image : ', image)
	let max;
	if(image.size > 500000){
	    max = 0.5
	}else{
	   max = image.size / 1024 / 1024
	}
	const options = {maxSizeMB : max, maxWidthOrHeight : 1024, useWebWorker : false}
	const compressedImage = await imageCompression(image, options)
	return compressedImage;
    }
    if(image){
        document.getElementById('upload_image_must_select_image').style.display = "none"
        axios.post('http://192.168.1.5:5000/api/check_auth', {
            secret_key : secret_key
        })
        .then(() => {
	    compressImage(image).then(result => {
		console.log(result)
		uploadToFirebase(result)
	    });

	    function uploadToFirebase(compressedImage){
		console.log('compressed Image size : ', compressedImage.size)
                document.getElementById('upload_image_wrong_secret_key').style.display = 'none';
                progress = document.getElementById('progress');
                const uploadTask = firebase.storage().ref().child(`${username}/${image_uuid}`).put(compressedImage);
                progress.style.display = 'block';
                uploadTask.on("state_changed", (snapshot) => {
                    let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    document.getElementById('determinate').style.width = progress + '%'
                }, () =>{
                    console.log('error occured in uploadtaks to firebase')
                }, () => {
                    // Upload completed successfully, now we can get the download URL
                    uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                        axios.post('http://192.168.1.5:5000/api/upload_picture', {
                            username : username,
                            image_path : downloadURL
                        }).then(() => {
                            progress.style.display = 'none';
                            document.getElementById('imagePreview').style.display = 'none';
                            alert('Image Added !')
                        })
                    });
                });

	    }
            //add image url to backend
        }).catch(err => {
            if(err.response){
                document.getElementById('upload_image_wrong_secret_key').style.display = 'block';
            }
        })
    }else{
        document.getElementById('upload_image_must_select_image').style.display = "block"
    }
})

document.getElementById('train_btn').addEventListener('click', () => {
    console.log('training the model ...')
    document.getElementById('updating').style.display = 'block';
    document.getElementById('loading').style.display = 'block';
    axios.get('http://192.168.1.5:5000/api/train')
    .then(result => {
        if(result.data.message === 'trained'){
	    console.log('model Trained!!')
	    document.getElementById('model_trained').style.display = 'block';
	    document.getElementById('updating').style.display = 'none';
	    document.getElementById('loading').style.display = 'none';
	    setTimeout(function(){
		document.getElementById('model_trained').style.display = 'none';
	    }, 3000)
	}
    }).catch(err => {
        console.log(err)
    })
})
