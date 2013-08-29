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
                "thumbSrc": "lorem/300-200-sports-1",
                "caption": "I was brought up to believe that the only thing worth doing was to add to the sum of accurate information in the world."
            },
            {
                "mainSrc": "lorem/400-600-food-1",
                "thumbSrc": "lorem/200-300-food-1",
                "caption": "Sometimes your joy is the source of your smile, but sometimes your smile can be the source of your joy."
            },
            {
                "mainSrc": "lorem/600-400-nature-1",
                "thumbSrc": "lorem/300-200-nature-1",
                "caption": "Tomorrow is the most important thing in life. Comes into us at midnight very clean. It's perfect when it arrives and it puts itself in our hands. It hopes we've learned something from yesterday."
            },
            {
                "mainSrc": "lorem/400-600-people-1",
                "thumbSrc": "lorem/200-300-people-1",
                "caption": "Rage is the only quality which has kept me, or anybody I have ever studied, writing columns for newspapers."
            },
            {
                "mainSrc": "lorem/600-400-business-1",
                "thumbSrc": "lorem/300-200-business-1",
                "caption": "Just because your voice reaches halfway around the world doesn't mean you are wiser than when it reached only to the end of the bar."
            },
            {
                "mainSrc": "lorem/600-400-technics-1",
                "thumbSrc": "lorem/300-200-technics-1",
                "caption": "Passion is seldom the end of any story, for it cannot long endure if it is not soon supplemented with true affection and mutual respect."
            }
        ],
        autoNext: 2
    });

});
