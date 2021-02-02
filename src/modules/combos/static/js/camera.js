var socket = io('http://localhost:5000');

    socket.on('connect', function(){
        console.log("Connected...!", socket.connected)
    });


var video = document.querySelector("#videoElement");


if (navigator.mediaDevices.getUserMedia) {
   navigator.mediaDevices.getUserMedia({ video: true })
     .then(function (stream) {
         video.srcObject = stream;
         let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
         let dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);
         let cap = new cv.VideoCapture(video);
         const FPS = 30;
         function processVideo() {
             try {
                 //if (!streaming) {
                     // clean and stop.
                     //src.delete();
                     //dst.delete();
                     //return;
                 //}
                 let begin = Date.now();
                 // start processing.
                 cap.read(src);
                 cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
                 console.log("hi")
                 cv.imshow('canvasOutput', dst);
                 // schedule the next one.
                 let delay = 1000/FPS - (Date.now() - begin);
                 setTimeout(processVideo, delay);
             } catch (err) {
                console.log(err);
             }
         };
         setTimeout(processVideo, 0);
         //const FPS = 22;

//         setInterval(() => {
//             cap.read(src);

//             var type = "image/png"
//             var data = document.getElementById("canvasOutput").toDataURL(type);
//             data = data.replace('data:' + type + ';base64,', ''); //split off junk at the beginning

//             socket.emit('image', data);
//         }, 10000/FPS);


//         socket.on('response_back', function(image){
//             const image_id = document.getElementById('image');
//             image_id.src = image;
//         });
     })
     .catch(function (err0r) {
        console.log("Something went wrong!");
    });
}

