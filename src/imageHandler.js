/**
 *  imageHangler.js
 *  yuhenabc
 *  opyright 2015, MIT License
 *  https://github.com/yuhenabc/imagehandler
 */

(function ($) {

    $.imageHandler = {};

    $.imageHandler.init = function() {
        var imageHanglerView = $('<div id="ih-view"></div>');
        var panelView = $('<div id="ih-panel"></div>');
        var showArea = $('<div id="ih-show-area"><img id="ih-target"/></div>');
        var confirmArea = $('<div id="ih-confirm-area"></div>');
        confirmArea.append($(''));
        panelView.append(showArea);
        panelView.append(confirmArea);
        var hiddeninputs = [];
        hiddeninputs.push('<input type="hidden" id="ih-crop-x"/>');
        hiddeninputs.push('<input type="hidden" id="ih-crop-y"/>');
        hiddeninputs.push('<input type="hidden" id="ih-crop-w"/>');
        hiddeninputs.push('<input type="hidden" id="ih-crop-h"/>');
        imageHanglerView.append(panelView);
        imageHanglerView.append($(hiddeninputs.join('\n')));
        imageHanglerView.appendTo($(document.body));
        imageHanglerView.height($(window).height()).width($(window).width());
        $(imageHanglerView).hide();
    };

    // update info by cropping (onChange and onSelect events handler)
    $.imageHandler.updateInfo = function (e) {
        $('#ih-crop-x').val(e.x);
        $('#ih-crop-y').val(e.y);
        $('#ih-crop-w').val(e.w);
        $('#ih-crop-h').val(e.h);
    };

    // clear info by cropping (onRelease event handler)
    $.imageHandler.clearInfo = function () {
        $('#ih-crop-x').val('');
        $('#ih-crop-y').val('');
        $('#ih-crop-w').val('');
        $('#ih-crop-h').val('');
    };

    $.imageHandler.create = function (opts) {

        var options = $.extend({}, $.imageHandler.defaults, opts);
        options.fileInputId = '#' + options.fileInputId;

        function _shower(file) {

            // show view if hidden
            var $view = $('#ih-view');
            if ($view.is(':hidden')) {
                $view.fadeIn();
            }

            // preview element
            var oImage = $('#ih-target').get(0);

            // prepare HTML5 FileReader
            var oReader = new FileReader();
            oReader.onload = function (e) {
                // e.target.result contains the DataURL which we can use as a source of the image
                oImage.src = e.target.result;

                $(oImage).unbind();
                var jcropHolder = $('.jcrop-holder');
                if (jcropHolder.length > 0) {
                    // remove jcrop
                    $.Jcrop(oImage).destroy();
                    jcropHolder.remove();
                }
                oImage.onload = function () {
                    // Create variables (in this scope) to hold the Jcrop API and image size
                    var jcrop_api, boundx, boundy;

                    // initialize Jcrop
                    $(oImage).Jcrop({
                        minSize: options.cropMinSize,
                        aspectRatio: options.cropRatio,
                        boxWidth: options.boxSize[0],
                        boxHeight: options.boxSize[1],
                        bgFade: true,
                        bgOpacity: .3,
                        onSelect: $.imageHandler.updateInfo,
                        onRelease: $.imageHandler.clearInfo
                    }, function () {
                        // use the Jcrop API to get the real image size
                        var bounds = this.getBounds();
                        boundx = bounds[0];
                        boundy = bounds[1];
                        // Store the Jcrop API in the jcrop_api variable
                        jcrop_api = this;
                    });
                };
            };
            // read selected file as DataURL
            oReader.readAsDataURL(file);
        }

        function _consider() {

            // get selected file (only one)
            var oFile = $(options.fileInputId).get(0).files[0];

            // check is image slected
            if (typeof(oFile) == 'undefined') {
                console.log('请选择一张图片');
                return;
            }

            // check for image type (jpg and png are allowed)
            var regex = /^(image\/jpeg|image\/png)$/i;
            if (!regex.test(oFile.type)) {
                console.log('仅支持 png 和 jpg 格式的图片');
                return;
            }

            // check if browser support HTML5 FileReader
            if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
                console.log('您的浏览器不支持 HTML5，请更换浏览器！');
                return;
            }

            // check image size
            var imgSize = [0, 0];
            var vimage = new Image();
            var vreader = new FileReader();
            vreader.readAsDataURL(oFile);
            vreader.onload = function (e) {
                vimage.src = e.target.result;
                vimage.onload = function () {
                    imgSize = [this.width, this.height];
                    if (options.cropRatio >= 0) {
                        if (imgSize[0] < options.cropMinSize[0] || imgSize[1] < options.cropMinSize[1]) {
                            // 这张图片太小了
                            console.log('请选择大于' + options.cropMinSize[0] + 'x' + options.cropMinSize[1] + '图片');
                        } else {
                            if (imgSize[0] / imgSize[1] == options.cropRatio) {
                                // 这张图片符合比例
                                if (imgSize[0] > options.targetSize[0]) {
                                    // 这张图片可以自动缩小
                                    options.success(_scaler(vimage, options.targetSize[0], options.targetSize[1]));
                                } else {
                                    // 这张图片正好
                                    options.success(_scaler(vimage, imgSize[0], imgSize[1]));
                                }
                            } else {
                                // 这张图片需要剪裁
                                _shower(oFile);
                            }
                        }
                    } else {
                        if (imgSize[0] > options.boxSize[0] || imgSize[1] > options.boxSize[1]) {
                        // 这张图片需要缩小
                            if (imgSize[0] / imgSize[1] > options.boxSize[0] / options.boxSize[1]) {
                                // 这张图片是矮胖型的
                                options.success(_scaler(vimage, options.boxSize[0], Math.round(imgSize[1] * options.boxSize[0] / imgSize[0])));
                            } else if (imgSize[0] / imgSize[1] < options.boxSize[0] / options.boxSize[1]) {
                                // 这张图片是瘦高型的
                                options.success(_scaler(vimage, Math.round(imgSize[0] * options.boxSize[1] / imgSize[1]), options.boxSize[1]));
                            } else {
                                // 这张图片是加大型的
                                options.success(_scaler(vimage, options.boxSize[0], options.boxSize[1]));
                            }
                        } else {
                            // 这张图片不需要缩小
                            options.success(vimage.src.split(";base64,")[1]);
                        }
                    }
                }
            }
        }

        // zoom in/out a image to target size. 'source' must be a Image object
        function _scaler(source, w, h) {
            var image = new Image();
            image.src = source.src;
            var canvas = document.createElement('canvas');
            $(canvas).attr('width', w);
            $(canvas).attr('height', h);
            $(canvas).hide();
            var context = canvas.getContext('2d');
            context.drawImage(image, 0, 0, w, h);
            //canvas.hide();
            var dataURL = canvas.toDataURL('image/png');
            return dataURL.split(";base64,")[1];
        }

        // realy crop a iamge to a new one.  'source' must be a Image object
        function _croper(source, x, y, w, h) {
            // console.log([x,y,w,h]);
            // console.log(source.src);
            var image = new Image();
            image.src = source.src;
            var canvas = document.createElement('canvas');
            $(canvas).attr('width', w);
            $(canvas).attr('height', h);
            $(canvas).hide();
            var context = canvas.getContext('2d');
            context.drawImage(image, x, y, w, h, 0, 0, w, h);
            //canvas.hide();
            //console.log(canvas.toDataURL('image/png'));
            var dataURL = canvas.toDataURL('image/png');
            return dataURL.split(";base64,")[1];
        }

        function _collecter() {
            var imageData;
            // get crop info from page's hidden inputs
            var cropX = Math.round(parseFloat($('#ih-crop-x').val())) || 0,
                cropY = Math.round(parseFloat($('#ih-crop-y').val())) || 0,
                cropW = Math.round(parseFloat($('#ih-crop-w').val())) || 0,
                cropH = Math.round(parseFloat($('#ih-crop-h').val())) || 0,
                imgSource = $('#ih-target').get(0);
            if (cropW == 0 || cropH == 0) {
                console.log('请拖动鼠标来剪裁图片！');
            } else if (cropW <= options.targetSize[0]) {
                imageData = _croper(imgSource, cropX, cropY, cropW, cropH);
                options.success(imageData);
            } else {
                imageData = _croper(imgSource, cropX, cropY, cropW, cropH);
                var imageURL = 'data:image/png;base64,' + imageData;
                var tempimg = new Image();
                tempimg.src = imageURL;
                imageData = _scaler(tempimg, options.targetSize[0], options.targetSize[1]);
                options.success(imageData);
            }
        }


        if (options.fileInputId) {
            $(options.fileInputId).change(function () {
                _consider();
                var $confirm_btn = $('<div id="ih-confirm-btn"><span>确定</span><input type="submit" /></div>');
                var $quit_btn = $('<div id="ih-quit-btn"><span>取消</span><input type="button" /></div>');

                $confirm_btn.click(function () {
                    _collecter();
                    $.imageHandler.clearInfo();
                });

                $quit_btn.click(function () {
                    var $view = $('#ih-view');
                    if ($view.is(':visible')) {
                        $view.hide();
                    }
                    $.imageHandler.clearInfo();
                });

                var $confirm_area = $('#ih-confirm-area');
                $confirm_area.empty();
                $confirm_area.append($confirm_btn);
                $confirm_area.append($quit_btn);

            });
        }
    };

    $.imageHandler.defaults = {
        imageMaxKB: null,
        boxSize: [640, 420],
        cropInitSize: [160, 75],
        targetSize: [640, 300],
        cropMinSize: [320, 150],
        cropRatio: 32 / 15,        // 0 is for requireless
        fileInputId: null,         // input[type=file] 's ID
        success: function (data) {console.log(data)},     // function after confirm verifying passed
        error: function(data) {console.log(data.message)}
    };

})(jQuery);

