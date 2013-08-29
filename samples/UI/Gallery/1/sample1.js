Ink.requireModules(
    ['Ink.Util.Array_1', 'Ink.Dom.Selector_1', 'Ink.UI.Gallery_1'],
    function(Arr, Sel, Gal) {

    'use strict';



    /*var galleryContainers = Ink.ss('.ink-galleryx');
    Arr.each(galleryContainers, function(ctn) {
        window.g = new Gal(ctn, {});
    });*/

    window.g1 = new Gal('#g1');

    window.g2 = new Gal('#g2', {
        model: [
            {
                "mainSrc": "lorem/600-400-sports-1",
                "thumbSrc": "lorem/300-200-sports-1"
            },
            {
                "mainSrc": "lorem/400-600-food-1",
                "thumbSrc": "lorem/200-300-food-1"
            },
            {
                "mainSrc": "lorem/600-400-nature-1",
                "thumbSrc": "lorem/300-200-nature-1"
            },
            {
                "mainSrc": "lorem/400-600-people-1",
                "thumbSrc": "lorem/200-300-people-1"
            },
            {
                "mainSrc": "lorem/600-400-business-1",
                "thumbSrc": "lorem/300-200-business-1"
            },
            {
                "mainSrc": "lorem/600-400-technics-1",
                "thumbSrc": "lorem/300-200-technics-1"
            }
        ],
        thumbDims: [64, 64]
    });

    window.g3 = new Gal('#g3');

    window.g4 = new Gal('#g4', {
        model: [
            {
                "mainSrc": "lorem/600-400-sports-1"
            },
            {
                "mainSrc": "lorem/400-600-food-1"
            },
            {
                "mainSrc": "lorem/600-400-nature-1"
            },
            {
                "mainSrc": "lorem/400-600-people-1"
            },
            {
                "mainSrc": "lorem/600-400-business-1"
            },
            {
                "mainSrc": "lorem/600-400-technics-1"
            }
        ]
    });

});
