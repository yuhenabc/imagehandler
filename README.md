# imagehandler

A html5 image handler including file selecting, image croping and scaling, finally image to DataURL.

## Install

If you use bower, just go like:

```
bower install jquery jcrop imageHandler
```

Otherwise, you can download from the **"download" button and copy to your directory.

## Usage

Depend on:

```
jquery, Jcrop
```

Files:

```
build
├── css
│   ├── imageHandler.css
│   └── imageHandler.min.css
└── js
    ├── imageHandler.js
    └── imageHandler.min.js
```

HTML:

```
<link href="(some directory...)/jquery.Jcrop.min.css" rel="stylesheet" type="text/css">
<link href="(some directory...)/imageHandler.css" rel="stylesheet" type="text/css">
<script src="(some directory...)/jquery.min.js"></script>
<script src="(some directory...)/jquery.Jcrop.min.js"></script>
<script src="(some directory...)/imageHandler.js"></script>
```

Javacript:

```
$.imageHandler.create({
    imageMaxKB: null,
    cropInitSize: [200, 200],
    targetSize: [500, 500],
    cropMinSize: [100, 100],
    cropRatio: 0,                    // less than 0 is for requireless, 0 is for freedom, more than 0 is for require
    fileInputId: 'file1',            // input[type=file] 's ID
    success: function (data) {       // function after confirm verifying passed
        // do something with data
    },
    error: function(err) {
        // do something
    }
});
```

## Demo

Click [here](http://yuhenabc.github.io/imagehandler/demo).

## Support or Contact

Having trouble with imageHandler? Contact yuhenabc@126.com and I’ll help you sort it out.