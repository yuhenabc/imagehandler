/**
 *  imageHangler.js
 *  yuhenabc
 *  copyright 2015, MIT License
 *  https://github.com/yuhenabc/imagehandler
 */

(function ($) {

    $.imageHandler = {};

    $.imageHandler.init = function() {
        if (window['isImageHandlerInited']) {
            return;
        }
        var ih = $.imageHandler;
        ih.view = $('<div id="ih-view"></div>');
        ih.panel = $('<div id="ih-panel"></div>');
        ih.target = $('<img id="ih-target"/>');
        ih.show_area = $('<div id="ih-show-area"></div>');
        ih.show_area.append(ih.target);
        ih.confirm_area = $('<div id="ih-confirm-area"></div>');
        ih.panel.append(ih.show_area);
        ih.panel.append(ih.confirm_area);
        ih.view.append(ih.panel);
        ih.view.hide();
        ih.view.appendTo($(document.body));
        ih.view.height(document.documentElement.clientHeight);
        window.onresize = function() {
            ih.view.height(document.documentElement.clientHeight);
        };
        window['isImageHandlerInited'] = true;
    };

    // crop info
    $.imageHandler.cropX = 0;
    $.imageHandler.cropY = 0;
    $.imageHandler.cropW = 0;
    $.imageHandler.cropH = 0;

    // update info by cropping (onChange and onSelect events handler)
    $.imageHandler.updateInfo = function (e) {
        var ih = $.imageHandler;
        ih.cropX = e.x;
        ih.cropY = e.y;
        ih.cropW = e.w;
        ih.cropH = e.h;
    };

    // clear info by cropping (onRelease event handler)
    $.imageHandler.clearInfo = function () {
        var ih = $.imageHandler;
        ih.cropX = 0;
        ih.cropY = 0;
        ih.cropW = 0;
        ih.cropH = 0;
    };

    // show view
    $.imageHandler.show = function () {
        var ih = $.imageHandler;
        if (ih.view.is(':hidden')) {
            ih.view.fadeIn();
        }
        return ih;
    };

    // hide view
    $.imageHandler.hide = function () {
        var ih = $.imageHandler;
        if (ih.view.is(':visible')) {
            ih.view.hide();
        }
        return ih;
    };

    $.imageHandler.create = function (opts) {
        var ih = $.imageHandler;
        ih.init();
        var options = $.extend({}, $.imageHandler.defaults, opts);
        var $file_input = $('#'+options.fileInputId);

        function _shower(file) {

            // show view if hidden
            ih.show();

            // preview element
            var oImage = ih.target.get(0);

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
                        onSelect: ih.updateInfo,
                        onRelease: ih.clearInfo
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
            var oFile = $file_input.get(0).files[0];

            // check is image slected
            if (typeof(oFile) == 'undefined') {
                options.error('请选择一张图片');
                return;
            }

            // check for image type (jpg and png are allowed)
            var regex = /^(image\/jpeg|image\/png)$/i;
            if (!regex.test(oFile.type)) {
                options.error('仅支持 png 和 jpg 格式的图片');
                return;
            }

            // check if browser support HTML5 FileReader
            if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
                options.error('您的浏览器不支持 HTML5，请更换浏览器！');
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
                            options.error('请选择大于' + options.cropMinSize[0] + 'x' + options.cropMinSize[1] + '图片');
                        } else {
                            if (imgSize[0] / imgSize[1] == options.cropRatio) {
                                // 这张图片符合比例
                                if (imgSize[0] > options.targetSize[0]) {
                                    // 这张图片可以自动缩小
                                    options.success(_scaler(vimage, imgSize[0], imgSize[1], options.targetSize[0], options.targetSize[1]));
                                } else {
                                    // 这张图片正好
                                    options.success(vimage.src);
                                }
                            } else {
                                // 这张图片需要剪裁
                                _shower(oFile);
                            }
                        }
                    } else {
                        if (imgSize[0] > options.targetSize[0] || imgSize[1] > options.targetSize[1]) {
                        // 这张图片需要缩小
                            if (imgSize[0] / imgSize[1] > options.targetSize[0] / options.targetSize[1]) {
                                // 这张图片是矮胖型的
                                options.success(_scaler(vimage, imgSize[0], imgSize[1], options.targetSize[0], Math.round(imgSize[1] * options.targetSize[0] / imgSize[0])));
                            } else if (imgSize[0] / imgSize[1] < options.targetSize[0] / options.targetSize[1]) {
                                // 这张图片是瘦高型的
                                options.success(_scaler(vimage, imgSize[0], imgSize[1], Math.round(imgSize[0] * options.targetSize[1] / imgSize[1]), options.targetSize[1]));
                            } else {
                                // 这张图片是加大型的
                                options.success(_scaler(vimage, imgSize[0], imgSize[1], options.targetSize[0], options.targetSize[1]));
                            }
                        } else {
                            // 这张图片不需要缩小
                            options.success(vimage.src);
                        }
                    }
                }
            }
        }

        // zoom in/out a image to target size. 'source' must be a Image object
        function _scaler(source, ow, oh, w, h) {
            //console.log(ow, oh, w, h);
            var canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            var context = canvas.getContext('2d');
            context.drawImage(source, 0, 0, ow, oh, 0, 0, w, h);
            return canvas.toDataURL();
        }

        // realy crop a iamge to a new one.  'source' must be a Image object
        function _croper(source, x, y, w, h) {
            //console.log(x, y, w, h);
            var canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            var context = canvas.getContext('2d');
            context.drawImage(source, x, y, w, h, 0, 0, w, h);
            return canvas.toDataURL();
        }

        function _collecter() {
            var imageData;
            var imgSource = $('#ih-target').get(0);
            if (ih.cropW == 0 || ih.cropH == 0) {
                options.error('请拖动鼠标来剪裁图片！');
            } else if (options.cropRatio && ih.cropW <= options.targetSize[0]) {
                imageData = _croper(imgSource, ih.cropX, ih.cropY, ih.cropW, ih.cropH);
                if (options.success) {
                    options.success(imageData);
                }
                ih.hide();
            } else {
                imageData = _croper(imgSource, ih.cropX, ih.cropY, ih.cropW, ih.cropH);
                var vimage = new Image();
                vimage.src = imageData;
                vimage.onload = function() {
                    var imgSize = [this.width, this.height];
                    if (options.cropRatio) {
                        options.success(_scaler(vimage, imgSize[0], imgSize[1], options.targetSize[0], options.targetSize[1]));
                    } else {
                        if (imgSize[0] > options.targetSize[0] || imgSize[1] > options.targetSize[1]) {
                            if (imgSize[0] / imgSize[1] > options.targetSize[0] / options.targetSize[1]) {
                                options.success(_scaler(vimage, imgSize[0], imgSize[1], options.targetSize[0], Math.round(imgSize[1] * options.targetSize[0] / imgSize[0])));
                            } else if (imgSize[0] / imgSize[1] < options.targetSize[0] / options.targetSize[1]) {
                                options.success(_scaler(vimage, imgSize[0], imgSize[1], Math.round(imgSize[0] * options.targetSize[1] / imgSize[1]), options.targetSize[1]));
                            } else {
                                options.success(_scaler(vimage, imgSize[0], imgSize[1], options.targetSize[0], options.targetSize[1]));
                            }
                        } else {
                            options.success(imageData);
                        }
                    }
                };
                ih.hide();
            }
        }

        if ($file_input.length > 0) {
            $file_input.change(function () {
                _consider();
                var $confirm_btn = $('<div id="ih-confirm-btn">确定</div>');
                var $quit_btn = $('<div id="ih-cancel-btn">取消</div>');
                $confirm_btn.click(function () {
                    _collecter();
                    ih.clearInfo();
                    $file_input.val('');
                });
                $quit_btn.click(function () {
                    ih.hide();
                    ih.clearInfo();
                    $file_input.val('');
                });
                ih.confirm_area.empty().append($confirm_btn).append($quit_btn);
            });
        }
    };

    $.imageHandler.defaults = {
        imageMaxKB: null,
        boxSize: [640, 420],
        targetSize: [1000, 1000],
        cropInitSize: [100, 100],
        cropMinSize: [50, 50],
        cropRatio: 0,                                     // less than 0 is for requireless, 0 is for freedom, more than 0 is for require
        fileInputId: null,                                // input[type=file] 's ID
        success: function (data) {console.log(data)},     // function after confirm verifying passed
        error: function(data) {console.log(data)}
    };

})(jQuery);

