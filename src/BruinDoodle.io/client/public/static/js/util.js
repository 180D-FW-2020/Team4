URL = window.URL || window.webkitURL;
var self = this;


var streaming = false;
var videoInput = document.getElementById('videoInput');
var startAndStop = document.getElementById('startAndStop');
var canvasOutput = document.getElementById('canvasOutput');
var canvasContext = canvasOutput.getContext('2d');
var sockOutput = document.getElementById('sockOutput');
var sockContext = sockOutput.getContext('2d');
var headerVideo = document.getElementById('headerVideo');

var sockets;

var prevPos= { x: null, y: null };
var SOCKET_URL = '/static/js/socket.io.js';
var sscripts = document.createElement('script');
sscripts.setAttribute('async', '');
sscripts.addEventListener('load', async () => {
    if (io instanceof Promise) {
        io = await io;
        console.log("yy");
        //onloadCallback();
    }
    sockets = io('https://fathomless-river-82221.herokuapp.com/', { withCredentials: false  });//,transports: ["websocket"]
    console.log("yay")
});
sscripts.addEventListener('error', () => {
    self.printError('Failed to load ' + SOCKET_URL);
});
sscripts.src = SOCKET_URL;
var node = document.getElementsByTagName('script')[0];
node.parentNode.insertBefore(sscripts, node);

//var sockets = io('https://fathomless-river-82221.herokuapp.com/', { withCredentials: false  });//,transports: ["websocket"]


var OPENCV_URL = '/static/js/opencv.js';
var script = document.createElement('script');
script.setAttribute('async', '');
script.addEventListener('load', async () => {
    if (cv.getBuildInformation)
    {
        console.log(cv.getBuildInformation());
        //onloadCallback();
    }
    else
    {
        // WASM
        if (cv instanceof Promise) {
            cv = await cv;
            console.log(cv.getBuildInformation());
            //onloadCallback();
        } else {
            cv['onRuntimeInitialized']=()=>{
            console.log(cv.getBuildInformation());
            //onloadCallback();
            }
        }
    }
});
script.addEventListener('error', () => {
    self.printError('Failed to load ' + OPENCV_URL);
});
script.src = OPENCV_URL;
var node = document.getElementsByTagName('script')[0];
node.parentNode.insertBefore(script, node);
startAndStop.removeAttribute('disabled');

startAndStop.addEventListener('click', () => {
    if (!streaming) {
        //utils.clearError();
        startCamera('qvga', onVideoStarted, 'videoInput');
    } else {
        stopCamera();
        onVideoStopped();
    }
});

function onVideoStarted() {
    nameStuff(document.getElementById('fname').value);
    streaming = true;
    startAndStop.innerText = 'Stop';
    startAndStop.className = 'button is-danger is-borderless';
    headerVideo.innerText = '📸';
    videoInput.width = videoInput.videoWidth;
    videoInput.height = videoInput.videoHeight;
    videoInput.hidden = false;
    executeCode('codeEditor', streaming);
}

function onVideoStopped() {
    streaming = false;
    canvasContext.clearRect(0, 0, canvasOutput.width, canvasOutput.height);
    sockContext.clearRect(0, 0, sockOutput.width, sockOutput.height);
    startAndStop.innerText = 'Start';
    startAndStop.className = 'button is-primary is-borderless';
    headerVideo.innerText = '📷';
    videoInput.hidden = true;
}


function nameStuff (fname) {
    sockets.emit('setName', fname+"9");
}


function executeCode (textAreaId, streaming) {
    try {
        var video = document.getElementById('videoInput');
        var src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        var dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);
            
            
        var hsv = new cv.Mat();

        var cap = new cv.VideoCapture(video);

        var lower_pink = new cv.Scalar(90, 110, 150);
        var upper_pink = new cv.Scalar(120, 200, 255);

        var mask = new cv.Mat(video.height, video.width, cv.CV_8UC1);

        var ksize = new cv.Size(25,25);

        var contours = new cv.MatVector();
        var hierarchy = new cv.Mat();

        var whiteboard = document.getElementById('whiteboardID').getElementsByClassName("whiteboard")[0];
        var whiteboardPositionInfo = whiteboard.getBoundingClientRect();
        var w_height = whiteboardPositionInfo.height;
        var w_width = whiteboardPositionInfo.width;

        var FPS = 100;
            //const FPS = 50;
        function processVideo() {
            try {
                if (!streaming) {
                    // clean and stop.
                    src.delete();
                    dst.delete();
                    hsv.delete();
                    cap.delete();
                    lower_pink.delete();
                    upper_pink.delete();
                    mask.delete();
                    ksize.delete();
                    contours.delete();
                    hierarchy.delete();
                    return;
                }
                var begin = Date.now();
                // start processing.
                cap.read(src);
                cv.flip(src,src,1);
                    
                if(src.size().width > 0 && src.size().height > 0){

                    cv.GaussianBlur(src, dst, ksize, 0, 0, cv.BORDER_DEFAULT);

                    cv.cvtColor(dst, hsv, cv.COLOR_BGR2HSV);

                    var low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), lower_pink);
                    var high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), upper_pink);

                    cv.inRange(hsv,low,high,mask);


                    cv.findContours(mask, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
                        
                    var max_contour = contours.get(0);
                    

                    if(typeof contours.get(0) != 'undefined'){

                        for(var i = 0; i< contours.size(); i++){
                            if(cv.contourArea(contours.get(i)) > max_contour){
                                max_contour = contours.get(i);
                            }
                        }
                        //var circle = cv.minEnclosingCircle(max_contour);
                        if(cv.contourArea(max_contour) > 100){
                            var circle = cv.minEnclosingCircle(max_contour);
                            var area = 3.14*circle.radius*circle.radius;

                            if(area > 700){
                                var M = cv.moments(max_contour);
                                var X = ((M.m10/M.m00)/video.width)*w_width;
                                var Y = ((M.m01/M.m00)/video.height)*w_height;
                                var pos= { x: X, y: Y};
                                

                                if (prevPos.x == null || prevPos.y == null){
                                    prevPos.x = pos.x;
                                    prevPos.y = pos.y;
                                }

                                if(Number.isNaN(pos.x) == false && Number.isNaN(pos.y) == false){
                                    if (prevPos.x != pos.x && prevPos.y != pos.y){
                                        var coords = { prevPos: prevPos, currPos: pos };
                                        var paintObj = { color: "#000", coords };
                                        //console.log(pos);
                                        sockets.emit('paint', paintObj);
                                        prevPos.x = pos.x;
                                        prevPos.y = pos.y;
                                    }
                                }
                                var circle_color = new cv.Scalar(255,0,0);
                                cv.circle(mask, circle.center, circle.radius, circle_color);
                            }
                        }
                    }
                        
                        //cv.imshow('canvasOutput', mask);
                }
                else{
                    console.log("mucho no bueno");
                }

                    

                var delay = 5000/FPS - (Date.now() - begin);
                setTimeout(processVideo, delay);
                //socket.close();
                //sockets.close();
            } catch (err) {
                printError(err);
            }
        };

            // schedule the first one.
        setTimeout(processVideo, 0);
    } catch (err) {
        printError(err);
    }
};



function clearError () {
    this.errorOutput.innerHTML = '';
};


function printError(err) {
    if (typeof err === 'undefined') {
        err = '';
    } else if (typeof err === 'number') {
        if (!isNaN(err)) {
            if (typeof cv !== 'undefined') {
                err = 'Exception: ' + cv.exceptionFromPtr(err).msg;
            }
        }
    } else if (typeof err === 'string') {
        var ptr = Number(err.split(' ')[0]);
        if (!isNaN(ptr)) {
            if (typeof cv !== 'undefined') {
                err = 'Exception: ' + cv.exceptionFromPtr(ptr).msg;
            }
        }
    } else if (err instanceof Error) {
        err = err.stack.replace(/\n/g, '<br>');
    }
    console.log(err);
    //this.errorOutput.innerHTML = err;
};

function onVideoCanPlay() {
    if (self.onCameraStartedCallback) {
        self.onCameraStartedCallback(self.stream, self.video);
    }
};


function startCamera (resolution, callback, videoId) {
    var constraints = {
        'qvga': {width: {exact: 320}, height: {exact: 240}},
        'vga': {width: {exact: 640}, height: {exact: 480}}};
        
    var video = document.getElementById(videoId);
    if (!video) {
        video = document.createElement('video');
    }

    var videoConstraint = constraints[resolution];
    if (!videoConstraint) {
    videoConstraint = true;
    }

    navigator.mediaDevices.getUserMedia({video: videoConstraint, audio: false})
    .then(function(stream) {
        video.srcObject = stream;
        video.play();
        self.video = video;
        self.stream = stream;
        self.onCameraStartedCallback = callback;
        video.addEventListener('canplay', onVideoCanPlay, false);
    })
    .catch(function(err) {
        self.printError('Camera Error: ' + err.name + ' ' + err.message);
    });
};


function stopCamera () {
    if (this.video) {
        this.video.pause();
        this.video.srcObject = null;
        this.video.removeEventListener('canplay', onVideoCanPlay);
    }
    if (this.stream) {
        this.stream.getVideoTracks()[0].stop();
    }
};