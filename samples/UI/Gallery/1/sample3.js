Ink.requireModules(
    ['Ink.Util.Array_1', 'Ink.Dom.Selector_1', 'Ink.UI.Gallery_1'],
    function(Arr, Sel, Gal) {

    'use strict';



    /*var galleryContainers = Ink.ss('.ink-galleryx');
    Arr.each(galleryContainers, function(ctn) {
        window.g = new Gal(ctn, {});
    });*/

    window.g1 = new Gal('#g1', {
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
        ],
        useProxies: true
    });

});
