/*
  html2canvas @VERSION@ <http://html2canvas.hertzen.com>
  Copyright (c) 2011 Niklas von Hertzen. All rights reserved.
  http://www.twitter.com/niklasvh

  Released under MIT License
*/

function hexToRGB(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToRGBObject (rgba) {
    var result = /^\s*(?:rgb|rgba)\(\s*([0-9]+),\s*([0-9]+),\s*([0-9]+)/i.exec(rgba);
    return result ? {
        r: parseInt(result[1], 10),
        g: parseInt(result[2], 10),
        b: parseInt(result[3], 10)
    } : null;
}

function colorToRGB (color) {
    return color.indexOf("rgb") == -1 ? hexToRGB(color) : rgbToRGBObject(color);
}  

// size in points: 'a3': [841.89, 1190.55]
_html2canvas.Renderer.PDF = function( options ) {

    options = options || {};

    var doc = document,

    methods,

    pageWidth = 1190,
    pageHeight = 841;

    methods = {
        _create: function( zStack, options, doc, queue, _html2canvas ) {

            var pdf = new jsPDF('landscape','pt','a3'),
                storageContext,
                i,
                queueLen,
                a,
                bounds,
                storageLen,
                renderItem,
                safeImages,
                fstyle,
                bstyle,
                cstyle,
                tmp = {},
                value,
                fontProperties,
                property;

            fstyle = tmp.fillColor || {r: 255, g: 255, b: 255};
            tmp.fillColor = fstyle; // tmp.fillColor = colorToRGB(zStack.backgroundColor);
            pdf.setFillColor(tmp.fillColor.r,tmp.fillColor.b,tmp.fillColor.g);
            pdf.rect(0,0,pageWidth,pageHeight,"F");
            tmp.fillColor = fstyle;

            for ( i = 0, queueLen = queue.length; i < queueLen; i+=1 ) {

                storageContext = queue.splice(0, 1)[0];
                storageContext.canvasPosition = storageContext.canvasPosition || {};

                if (storageContext.ctx.storage){

                    for (a = 0, storageLen = storageContext.ctx.storage.length; a < storageLen; a+=1){

                        renderItem = storageContext.ctx.storage[a];


                        switch(renderItem.type){
                            case "variable":
                                // ctx[renderItem.name] = renderItem['arguments'];
                                switch(renderItem.name) {
                                    case "fillStyle":
                                        // fstyle = tmp.fillColor;
                                        value = renderItem["arguments"];
                                        tmp.fillColor = colorToRGB(value);
                                        pdf.setFillColor(tmp.fillColor.r, tmp.fillColor.g, tmp.fillColor.b);
                                        break;
                                    case "font":
                                        // normal normal bold 32px 'DejaVu Sans', 'URW Gothic L', 'Helvetica Neue', Helvetica, Arial, 'Microsoft Sans Serif', sans-serif
                                        tmp.fontNames = renderItem["arguments"].split(","); // style size font
                                        fontProperties = tmp.fontNames[0].split(" ");
                                        if (tmp.fontNames.length > 1) {
                                            tmp.fontNames = tmp.fontNames.slice(1);
                                        } else {
                                            tmp.fontNames = [];
                                        }

                                        while ( property = fontProperties.shift() ) {

                                            if (isNaN(property.replace(/px$/,""))) {
                                                tmp.fontStyle = property;
                                            } else {
                                                tmp.fontSize = parseInt(property, 10);
                                                break;
                                            }
                                        }

                                        tmp.fontNames.unshift(fontProperties.join(" "));

                                        pdf.setFontType(tmp.fontStyle);
                                        pdf.setFontSize(tmp.fontSize);
                                        
                                        fonts:
                                        while ( tmp.fontName = tmp.fontNames.shift() )
                                            switch (tmp.fontName.toLowerCase()) {
                                                case "helvetica":
                                                case "helvetica-bold":
                                                case "helvetica-oblique":
                                                case "helvetica-boldoblique":
                                                case "courier":
                                                case "courier-bold":
                                                case "courier-oblique":
                                                case "courier-boldoblique":
                                                case "times-roman":
                                                case "times-bold":
                                                case "times-italic":
                                                case "times-bolditalic":
                                                    pdf.setFont(fontProperties[2]); // only knows some fonts, so fix this
                                                    break fonts;
                                                    break;
                                                default:
                                                    try {
                                                        pdf.setFont("helvetica");
                                                    } catch (e) {
                                                        pdf.setStyle("normal");
                                                        pdf.setFont("helvetica");
                                                    }
                                                    break;
                                            }
                                        break;
                                    default:
                                        name = renderItem["name"];
                                        value = renderItem["arguments"];
                                        break;
                                }
                                break;
                            case "function":
                                if (renderItem.name === "fillRect") {

                                    pdf.rect.apply(pdf, Array.prototype.concat.call(renderItem["arguments"], "F"));

                                /*
                                } else if (renderItem.name === "drawShape") {
                                    
                                    ( function( args ) {
                                      
                                        var i, len = args.length;
                                        ctx.beginPath();
                                        for ( i = 0; i < len; i++ ) {   
                                            ctx[ args[ i ].name ].apply( ctx, args[ i ]['arguments'] );
                                        }
                                        ctx.closePath();
                                        ctx.fill();
                                    })( renderItem['arguments'] );
                                */
                                    
                                } else if (renderItem.name === "fillText") {

                                    value = renderItem["arguments"];
                                    pdf.text.call(pdf, value[1], value[2], value[0]);

                                } else if (renderItem.name === "drawImage") {

                                    if (renderItem['arguments'][8] > 0 && renderItem['arguments'][7]){

                                        value = renderItem["arguments"];
                                        tmp.img = value[0];

                                        tmp.canvas = document.createElement("canvas");
                                        document.body.appendChild(tmp.canvas);
                                        tmp.canvas.width = tmp.img.width;
                                        tmp.canvas.height = tmp.img.height;

                                        tmp.ctx = tmp.canvas.getContext("2d");
                                        tmp.ctx.drawImage( tmp.img, 0, 0);

                                        switch(tmp.img.src.substring(tmp.img.src.lastIndexOf("."))) {
                                            case "jpg":
                                                tmp.imageMime = "image/jpeg";
                                                tmp.imageType = "JPEG";
                                                break;
                                        }
                                        tmp.data = atob(tmp.canvas.toDataURL(tmp.imageMime).slice('data:' + tmp.imageMime + ";base64".length));
                                        document.body.removeChild(tmp.canvas);

                                        pdf.addImage(tmp.data, tmp.imageType, value[1], value[2]);

                                        // ctx.drawImage.apply( ctx, renderItem['arguments'] );
                                    }
                                }


                                break;
                            default:

                        }

                    }

                }

            }

            /* h2clog("html2canvas: Renderer: Canvas renderer done - returning canvas obj");

            queueLen = options.elements.length;

            if (queueLen === 1) {
                if (typeof options.elements[ 0 ] === "object" && options.elements[ 0 ].nodeName !== "BODY" && usingFlashcanvas === false) {
                    // crop image to the bounds of selected (single) element
                    bounds = _html2canvas.Util.Bounds( options.elements[ 0 ] );
                    newCanvas = doc.createElement('canvas');
                    newCanvas.width = bounds.width;
                    newCanvas.height = bounds.height;
                    ctx = newCanvas.getContext("2d");

                    ctx.drawImage( canvas, bounds.left, bounds.top, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height );
                    canvas = null;
                    return newCanvas;
                }
            } */
            pdf.output("datauriwindow");

            return pdf;
        }
    };

    return methods;

};
