Ink.requireModules(
    ['Ink.UI.ImageCell_1', 'Ink.Dom.Event_1'],
    function(ICell, Evt) {

    'use strict';



    var items = [
        {image:'http://lorempixel.com/600/400/sports/1',   thumbnail:'http://lorempixel.com/300/200/sports/1',   label:'1'},
        {image:'http://lorempixel.com/400/600/food/1',     thumbnail:'http://lorempixel.com/200/300/food/1',     label:'2'},
        {image:'http://lorempixel.com/600/400/nature/1',   thumbnail:'http://lorempixel.com/300/200/nature/1',   label:'3'},
        {image:'http://lorempixel.com/400/600/people/1',   thumbnail:'http://lorempixel.com/200/300/people/1',   label:'4'},
        {image:'http://lorempixel.com/600/400/business/1', thumbnail:'http://lorempixel.com/300/200/business/1', label:'5'},
        {image:'http://lorempixel.com/600/400/technics/1', thumbnail:'http://lorempixel.com/300/200/technics/1', label:'6'}
    ];

    var cells = [];

    var cellDims = [256, 256];
    var isCss3Supported = false;
    var mode = 'cover';

    items.forEach(function(item) {
        var cell = new ICell({
            uri:      item.image,
            cellDims: cellDims,
            skipCss3: !isCss3Supported,
            mode:     mode
        });
        cells.push(cell);
        Ink.i('cells').appendChild(cell.el);
    });

    Evt.observe('apply', 'click', function(ev) {
        cellDims = Ink.i('cellSize').value.split(' ');
        cellDims = [~~cellDims[0], ~~cellDims[1]];
        isCss3Supported = Ink.i('css3').checked;
        mode = Ink.i('modeCover').checked ? 'cover' : 'contain';

        console.log(cellDims, isCss3Supported, mode);

        cells.forEach(function(cell) {
            cell.skipCss3 = !isCss3Supported;
            cell.mode     = mode;
            cell.resize(cellDims);
        });
    });

});
