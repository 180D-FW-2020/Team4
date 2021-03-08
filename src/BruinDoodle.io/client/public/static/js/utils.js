function Utils(errorOutputId) { // eslint-disable-line no-unused-vars
    let self = this;
    //var socket = io('http://localhost:5000', { withCredentials: false  });

    //socket.on('connect', function(){
        //console.log("Connected...!", socket.connected)
    //});

    var sockets = io('http://localhost:5050', { withCredentials: false  });//,transports: ["websocket"]
    sockets.emit('setName', "Laptop1")
    //sockets.on('connection', function(){
        //console.log("Connected...!", sockets.connected)
    //});

    var prevPos= { x: null, y: null };

    this.errorOutput = document.getElementById(errorOutputId);

    const OPENCV_URL = '/static/js/opencv.js';
    this.loadOpenCv = function(onloadCallback) {
        let script = document.createElement('script');
        script.setAttribute('async', '');
        script.setAttribute('type', 'text/javascript');
        script.addEventListener('load', async () => {
            if (cv.getBuildInformation)
            {
                console.log(cv.getBuildInformation());
                onloadCallback();
            }
            else
            {
                // WASM
                if (cv instanceof Promise) {
                    cv = await cv;
                    console.log(cv.getBuildInformation());
                    onloadCallback();
                } else {
                    cv['onRuntimeInitialized']=()=>{
                        console.log(cv.getBuildInformation());
                        onloadCallback();
                    }
                }
            }
        });
        script.addEventListener('error', () => {
            self.printError('Failed to load ' + OPENCV_URL);
        });
        script.src = OPENCV_URL;
        let node = document.getElementsByTagName('script')[0];
        node.parentNode.insertBefore(script, node);
    };

    this.createFileFromUrl = function(path, url, callback) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = function(ev) {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    let data = new Uint8Array(request.response);
                    cv.FS_createDataFile('/', path, data, true, false, false);
                    callback();
                } else {
                    self.printError('Failed to load ' + url + ' status: ' + request.status);
                }
            }
        };
        request.send();
    };

    this.loadImageToCanvas = function(url, cavansId) {
        let canvas = document.getElementById(cavansId);
        let ctx = canvas.getContext('2d');
        let img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0, img.width, img.height);
        };
        img.src = url;
    };

    this.nameStuff = function(fname) {
        sockets.emit('setName', fname+"9");
    }

    this.executeCode = function(textAreaId, streaming) {
        try {
            let video = document.getElementById('videoInput');
            let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
            let dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);

            //let dst_gray = new cv.Mat(video.height, video.width, cv.CV_8UC3);

            let hsv = new cv.Mat();

            let cap = new cv.VideoCapture(video);

            let lower_pink = new cv.Scalar(90, 110, 150);
            let upper_pink = new cv.Scalar(120, 200, 255);

            let mask = new cv.Mat(video.height, video.width, cv.CV_8UC1);

            const FPS = 30;
            
            let ksize = new cv.Size(25,25);

            var contours = new cv.MatVector();
            var hierarchy = new cv.Mat();

            function processVideo() {
                try {
                    if (!streaming) {
                        // clean and stop.
                        src.delete();
                        dst.delete();
                        return;
                    }
                    let begin = Date.now();

                    cap.read(src);

                    if(src.size().width > 0 && src.size().height > 0){

                        cv.GaussianBlur(src, dst, ksize, 0, 0, cv.BORDER_DEFAULT);

                        cv.cvtColor(dst, hsv, cv.COLOR_BGR2HSV);

                        let low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), lower_pink);
                        let high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), upper_pink);

                        cv.inRange(hsv,low,high,mask);


                        cv.findContours(mask, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
                        
                        var max_contour = contours.get(0);

                        if(typeof contours.get(0) != 'undefined'){

                            for(let i = 0; i< contours.size(); i++){
                                if(cv.contourArea(contours.get(i)) > max_contour){
                                    max_contour = contours.get(i);
                                }
                            }
                            //var circle = cv.minEnclosingCircle(max_contour);
                            var M = cv.moments(max_contour);
                            var X = ((M.m10/M.m00)/video.width)*800;
                            var Y = ((M.m01/M.m00)/video.height)*600;
                            var pos= { x: X, y: Y };
                            
                            console.log(pos.x);
                            
                            if (prevPos.x == null || prevPos.y == null){
                                prevPos.x = pos.x;
                                prevPos.y = pos.y;
                            }

                            if(Number.isNaN(pos.x) == false && Number.isNaN(pos.y) == false){
                                if (prevPos.x != pos.x && prevPos.y != pos.y){
                                    let coords = { prevPos: prevPos, currPos: pos };
                                    let paintObj = { color: "#000", coords };
                                    console.log("GOODNESS");
                                    sockets.emit('paint', paintObj);
                                    prevPos.x = pos.x;
                                    prevPos.y = pos.y;
                                }
                            }
                        }
                        
                        cv.imshow('canvasOutput', mask);
                    }
                    else{
                        console.log("mucho no bueno");
                    }
                  
                    //socket.on('pos', function(paintObj){
                    //     sockets.emit('paint', paintObj);
                    // });
                    let delay = 5000/FPS - (Date.now() - begin);
                    setTimeout(processVideo, delay);
                } catch (err) {
                    self.printError(err);
                }
            };

            // schedule the first one.
            setTimeout(processVideo, 0);
        } catch (err) {
            this.printError(err);
        }
    };

    this.clearError = function() {
        this.errorOutput.innerHTML = '';
    };

    this.printError = function(err) {
        if (typeof err === 'undefined') {
            err = '';
        } else if (typeof err === 'number') {
            if (!isNaN(err)) {
                if (typeof cv !== 'undefined') {
                    err = 'Exception: ' + cv.exceptionFromPtr(err).msg;
                }
            }
        } else if (typeof err === 'string') {
            let ptr = Number(err.split(' ')[0]);
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

    this.loadCode = function(scriptId, textAreaId) {
        let scriptNode = document.getElementById(scriptId);
        let textArea = document.getElementById(textAreaId);
        if (scriptNode.type !== 'text/code-snippet') {
            throw Error('Unknown code snippet type');
        }
        //textArea.value = scriptNode.text.replace(/^\n/, '');
    };

    this.addFileInputHandler = function(fileInputId, canvasId) {
        let inputElement = document.getElementById(fileInputId);
        inputElement.addEventListener('change', (e) => {
            let files = e.target.files;
            if (files.length > 0) {
                let imgUrl = URL.createObjectURL(files[0]);
                self.loadImageToCanvas(imgUrl, canvasId);
            }
        }, false);
    };

    function onVideoCanPlay() {
        if (self.onCameraStartedCallback) {
            self.onCameraStartedCallback(self.stream, self.video);
        }
    };

    this.startCamera = function(resolution, callback, videoId) {
        const constraints = {
            'qvga': {width: {exact: 320}, height: {exact: 240}},
            'vga': {width: {exact: 640}, height: {exact: 480}}};
        let video = document.getElementById(videoId);
        if (!video) {
            video = document.createElement('video');
        }

        let videoConstraint = constraints[resolution];
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

    this.stopCamera = function() {
        if (this.video) {
            this.video.pause();
            this.video.srcObject = null;
            this.video.removeEventListener('canplay', onVideoCanPlay);
        }
        if (this.stream) {
            this.stream.getVideoTracks()[0].stop();
        }
    };
};
