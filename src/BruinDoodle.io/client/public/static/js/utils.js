function Utils(errorOutputId) { // eslint-disable-line no-unused-vars
    let self = this;
    var socket = io('https://polar-mesa-13022.herokuapp.com/', { withCredentials: false  });

    //socket.on('connect', function(){
        //console.log("Connected...!", socket.connected)
    //});

    var sockets = io('https://fathomless-river-82221.herokuapp.com/', { withCredentials: false  });//,transports: ["websocket"]
    sockets.emit('setName', "Laptop1a")
    //sockets.on('connection', function(){
        //console.log("Connected...!", sockets.connected)
    //});

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

    this.executeCode = function(textAreaId, streaming) {
        try {
            let video = document.getElementById('videoInput');
            let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
            let dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);
            let cap = new cv.VideoCapture(video);

            const FPS = 30;
            function processVideo() {
                try {
                    if (!streaming) {
                        // clean and stop.
                        src.delete();
                        dst.delete();
                        return;
                    }
                    let begin = Date.now();
                    // start processing.
                    cap.read(src);
                    //setInterval(() => {
                        //             cap.read(src);
                        
                    
                    //cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
                    cv.cvtColor(src, dst, cv.COLOR_RGBA2RGB);
                    cv.imshow('canvasOutput', dst);
                    var type = "image/png"
                    var data = document.getElementById("canvasOutput").toDataURL(type);
                    //var data = document.getElementById("videoInput").toDataURL(type);
                    //console.log(data)
                    data = data.replace('data:' + type + ';base64,', ''); //split off junk at the beginning
                    
                    socket.emit('image', data);
                        //         }, 10000/FPS);
                        
                    //socket.on('response_back', function(image){
                        //cv.imshow('canvasOutput', image);
                        //console.log(image)
                    //});
                    socket.on('pos', function(paintObj){
                        ////this.$socket.emit("paint", paintObj);
                        sockets.emit('paint', paintObj);
                        ////console.log('hi');
                    });
                    ////socket.on('response_back', function(image){
                                    //const image_id = document.getElementById('image');
                                    //var image_id = document.getElementById('sockOutput');
                                    //console.log(image);
                                    ////self.loadImageToCanvas(image, 'sockOutput');
                                    //image_id.src = image;
                                    //cv.imshow('canvasOutput', image)
                                ////});
                    // schedule the next one.
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
