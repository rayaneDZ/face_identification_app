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

    //THIS FUNCTION COMPRESSES THE IMAGE
    async function compressImage(image){
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

    //CHECK IF THE USER UPLOADED AN IMAGE FIRST
    if(image){
        document.getElementById('upload_image_must_select_image').style.display = "none"
        axios.post('http://192.168.1.5:5000/api/check_auth', {
            secret_key : secret_key
        })
        .then(() => {
	    //IF THE SECRET KEY IS CORRECT, COMPRESS THE IMAGE AND SEND IT TO FIREBASE
	    document.getElementById('upload_image_wrong_secret_key').style.display = "none"
	    compressImage(image).then(result => {
		console.log(result)
		uploadToFirebase(result)
	    })

	    //THIS IS THE FUNCTION THAT SENDS THE IMAGE TO FIREBASE
	    function uploadToFirebase(compressedImage){

		//UPDATING THE DOM
                document.getElementById('progress').style.display = "block";
		document.getElementById('uploading').style.display = "block";
                const uploadTask = firebase.storage().ref().child(`${username}/${image_uuid}`).put(compressedImage);
                uploadTask.on("state_changed", (snapshot) => {
                    let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    document.getElementById('determinate').style.width = progress + '%'
                }, () =>{
                    console.log('error occured in uploadtaks to firebase')
                }, () => {
                    // Upload completed successfully, now we can get the download URL
                    uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {

			//IMAGE UPLOADED TO FIREBASE
			console.log('image uploaded to firebase');
			document.getElementById('progress').style.display = "none";
			document.getElementById('uploading').style.display = "none";

			//send image url to backend
                        axios.post('http://192.168.1.5:5000/api/upload_picture', {
                            username : username,
                            image_path : downloadURL
                        }).then(() => {

			    //UPDATING THE DOM
			    console.log('image uploaded to backend');
			    document.getElementById('check_face_progress').style.display = "block";
			    document.getElementById('checking').style.display = "block";

			    //check if the image contains a face
			    axios.post('http://192.168.1.5:5000/api/face_check', {
				url : downloadURL
			    }).then(result=>{

				document.getElementById('check_face_progress').style.display = "none";
				document.getElementById('checking').style.display = "none";
				console.log('checking if the image contains a face');
				if(result.data.message === true){
				    console.log('yes it does contain a face')
				    document.getElementById('yes').style.display = "block";
				    setTimeout(() => {
					document.getElementById('yes').style.display = "none";
				    }, 3000)
				}else {
				    console.log('No it does not contain a face :/')
				    document.getElementById('no').style.display = "block";
				    setTimeout(() => {
					document.getElementById('no').style.display = "none";
				    }, 3000)

				    //DELETE THE IMAGE FROM FIREBASE AND MONGODB
				    firebase.storage().ref().child(`${username}/${image_uuid}`).delete()
            			    .then(() => {
					console.log('image deleted')
            			        axios.post('http://192.168.1.5:5000/api/delete_image', {
					    url : downloadURL,
					    username : username
					}).then(result => {
					    console.log('image deleted from mongodb also');
					})
			            }).catch(() => {
			                console.log('image could not be deleted')
			            })
				}
			    }).catch(err => {
				console.log(err)
			    })
                        })
                    });
                });
	    }
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
