var subscriptionKey = 'e443ee0f769347a792cab82b7e853bc5';
var uriBase = 'https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect';
var params = {
    'returnFaceId': 'true',
    'returnFaceLandmarks': 'false'
};

var ImageViewModel = function () {
    var self = this;

    self.isInProgress = ko.observable(false);
    self.isImageLoaded = ko.observable(false);
    self.isImageProcessed = ko.observable(false);
    self.sourceImage = new Image();

    var dropElement = $('#imageInputDrop')[0];
    var canvas = $('#canvas')[0];
    var canvasContext = canvas.getContext('2d');
    var catImage = new Image();

    self.dragover = function () {
        dropElement.classList.add('dragover');
    }

    self.dragleave = function () {
        dropElement.classList.remove('dragover');
    }

    self.drop = function (data, e) {
        dropElement.classList.remove('dragover');
        self.readImage(data, e.originalEvent);
    }

    self.inputClick = function () {
        $('#imageInput').click();
    }

    self.readImage = function (data, e) {
        var files = e.dataTransfer
            ? e.dataTransfer.files
            : e.target.files;

        var file = files[0];
        var reader = new FileReader();
        reader.onload = function () {
            setImageSource(reader.result);
        };

        reader.readAsDataURL(file);
    };

    self.replaceFaces = function () {
        self.isInProgress(true);
        var blob = makeBlob(self.sourceImage.src);
        var url = uriBase + '?' + $.param(params);
        $.ajax({
            url: url,
            type: 'POST',
            beforeSend: setHeaders,
            data: blob,
            processData: false
        })
            .done(process)
            .fail(displayError);
    };

    self.deleteImage = function () {
        self.isImageLoaded(false);
        self.isImageProcessed(false);
        self.sourceImage = new Image();
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        $('#imageInput')[0].value = '';
    };

    function setImageSource(source) {
        self.sourceImage.src = source;
        self.sourceImage.onload = function () {
            canvas.width = self.sourceImage.width;
            canvas.height = self.sourceImage.height;
            canvasContext.drawImage(self.sourceImage, 0, 0);
        };
        self.isImageLoaded(true);
        self.isImageProcessed(false);
    }

    function process(faces) {
        catImage.onload = function () {
            faces.forEach(function (f) {
                var r = f.faceRectangle;
                canvasContext.drawImage(catImage, r.left, r.top, r.width, r.height);
            })
            self.isInProgress(false);
            self.isImageProcessed(true);
        }
        catImage.src = 'cat.png';
    }
}

// Выполнить при загрузке страницы
$(function () {
    var viewModel = new ImageViewModel();
    ko.applyBindings(viewModel);
});

function makeBlob(dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = decodeURIComponent(parts[1]);
        return new Blob([raw], { type: contentType });
    }
    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;
    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
}

function setHeaders(xhrObj) {
    xhrObj.setRequestHeader('Content-Type', 'application/octet-stream');
    xhrObj.setRequestHeader('Ocp-Apim-Subscription-Key', subscriptionKey);
}

function displayError(jqXHR, textStatus, errorThrown) {
    // оторбазить ошибку
    var errorString = (errorThrown === '')
        ? 'Error. '
        : errorThrown + ' (' + jqXHR.status + '): ';
    errorString += (jqXHR.responseText === '')
        ? ''
        : ($.parseJSON(jqXHR.responseText).message)
            ? $.parseJSON(jqXHR.responseText).message
            : $.parseJSON(jqXHR.responseText).error.message;
    alert(errorString);
}