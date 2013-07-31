/**
 * @module Ink.UI.Gallery_1
 * @author inkdev AT sapo.pt
 * @version 1
 */
Ink.createModule('Ink.UI.Gallery', '1',
    ['Ink.UI.Aux_1', 'Ink.Dom.Browser_1', 'Ink.Dom.Css_1', 'Ink.Dom.Element_1', 'Ink.Dom.Event_1', 'Ink.UI.ImageCell_1', 'Ink.Util.Swipe_1'],
    function(Aux, Brwsr, Css, Elem, Evt, ImageCell, Swipe) {

    'use strict';

    /*jshint laxcomma:true */



    // http://caniuse.com/background-img-opts
    var ver = parseInt(Brwsr.version, 10);
    var doesNotSupportBgSize = (Brwsr.IE    && ver < 9) ||
                               (Brwsr.GECKO && ver < 4);
    //doesNotSupportBgSize=true; // uncomment to test fallback mode



    var insertAtStart = function(container, element) {
        var firstChild = container.firstChild;
        if (!firstChild) {
            container.appendChild(element);
        }
        else {
            container.insertBefore(element, firstChild);
        }
    };

    var insertAfter = function(container, element, afterEl) {
        if (container.lastChild === afterEl) {
            container.appendChild(element);
        }
        else {
            container.insertBefore(element, afterEl.nextSibling);
        }
    };

    var wrapAround = function(i, n) {
        if (i < 0) {  return i + n; }
        if (i >= n) { return i - n; }
        return i;
    };



    /**
     * 
     *
     * The selector is expected to point at a DOM element with the class `ink-galleryx`
     * Gallery tries to identify special classes and give them behaviour.
     * Currently it supports:
     * - stage (wrapper for the main content)
     *     - content can be either `img` elements of other elements as long as having the class `item`
     *     - `prev` and `next` classes provide elements for changing the currently visible item
     *     - the `pagination` class, is existent, is used to display the current item in the collection. its first child is used as bullet for display.
     *     - the `caption` class, if existent, is used to display caption information related to the currently visible item
     *
     * The supported data used from `img` elements is its `src` and `alt` attributes (`alt` provides caption information).
     * Besides explicit items inside the markup, one can populate the gallery from JavaScript via the model option.
     *
     * The remaining options can be provided either as JavaScript options or data attributes.
     * Example: you want to change the gallery aspect ratio - either set `data-aspect-ratio` or the JS option `aspectRatio`.
     *
     * TODO CSS-related
     * - layout prev/next vertically
     * - layout caption bottom without height
     * - move gallery-related css to ink
     *
     * TODO JS
     * - support changing page by clicking on the pagination bullets
     * - documented samples
     * - animate thumbnail change? (nice to have)
     * - different thumbnail placements (nice to have)
     * - vertical mode (nice to have)
     * - transitions (nice to have)
     * 
     * @class Ink.UI.Gallery
     *
     * @constructor
     * @param  {String|DOMElement} selector
     * @param  {Object}   options
     * @param  {Array}   [options.model]          when defined, no DOM extraction is done. Object should have mainSrc and optionally thumbSrc
     * @param  {Array}   [options.thumbDims]      dimensions of thumbnails, in pixels. default is [128, 128]
     * @param  {String}  [options.thumbMode]      either cover or contain. default is cover
     * @param  {String}  [options.mainMode]       either cover or contain. default is contain
     * @param  {Number}  [options.aspectRatio]    aspect ratio for the gallery. default is 4/3
     * @param  {Number}  [options.autoNext]       number of seconds before next is automatically triggered. stops on first user interaction.
     * @param  {Boolean} [options.circular]       if true, gallery wraps around limits. default is true
     * @param  {Boolean} [options.adaptToResize]  if true, gallery updates on window size change
     * @param  {Boolean} [options.useProxies]     if true, image fetching is postponed
     */
    var Gallery = function(selector, options) {

        // parse container and options
        this._containerEl = Aux.elOrSelector(selector, '1st argument');

        this._options = Ink.extendObj({
             thumbDims:     [128, 128]
            ,thumbMode:     'cover'
            ,mainMode:      'contain'
            ,direction:     'x'             // TODO not yet in use
            ,aspectRatio:   4/3
            ,adaptToResize: true
            ,circular:      true
            ,useProxies:    false
        }, Elem.data(this._containerEl));

        this._options = Ink.extendObj(this._options, options || {});

        var ops = this._options;

        // boolean
        if (typeof ops.circular === 'string' && ops.circular !== 'true') {
            ops.circular = false;
        }
        if (typeof ops.adaptToResize === 'string' && ops.adaptToResize !== 'true') {
            ops.adaptToResize = false;
        }

        // int,int
        if (typeof ops.thumbDims === 'string') {
            ops.thumbDims = ops.thumbDims.split(',');
            ops.thumbDims[0] = parseInt(ops.thumbDims[0], 10);
            ops.thumbDims[1] = parseInt(ops.thumbDims[1], 10);
        }

        // float
        if (typeof ops.aspectRatio === 'string') {
            ops.aspectRatio = parseFloat( ops.aspectRatio );
        }



        this._currentIndex = 0;

        // find meaningful markup elements
        this._stageEl       = Ink.s('.stage',        this._containerEl);
        this._thumbHolderEl = Ink.s('.thumb-holder', this._containerEl);
        this._captionEl     = Ink.s('.caption',      this._containerEl);
        this._paginationEl  = Ink.s('.pagination',   this._containerEl);
        this._prevEl = Ink.s('.prev', this._stageEl);
        this._nextEl = Ink.s('.next', this._stageEl);

        if (!this._stageEl) {
            throw new Error('Could not find any descendant element having the class stage!');
        }

        if (this._paginationEl) {
            this._pageEl = Ink.s('*', this._paginationEl);
            this._paginationEl.removeChild(this._pageEl);
        }

        Elem.removeTextNodeChildren(this._stageEl);

        if (this._thumbHolderEl) {
            Elem.removeTextNodeChildren(this._thumbHolderEl);
        }



        if (this._options.model) {
            this._model = Aux.clone(this._options.model);
            this._makeTempElements();
        }
        else {
            this._extractModel();
        }

        if (this._paginationEl) {
            this._makePagination();
        }

        this._render();



        // events
        Evt.observe(this._containerEl, 'click', Ink.bindEvent(this._onClick, this) );

        if (this._options.adaptToResize) {
            Evt.observe(window, 'resize', Ink.bindEvent(this._onResize, this) );
        }

        new Swipe(this._containerEl, {
            callback:       Ink.bind(this._onSwipe, this),
            forceAxis:      'x',
            minDuration:    0.01, // in seconds
            maxDuration:    0.5,
            minDist:        4, // in pixels
            maxDist:        400,
            stopEvents:     false,
            storeGesture:   false
        });

        // to reduce interferences with other events
        var fn = function(ev) { Evt.stop(ev); return false; };
        Evt.observe(this._containerEl, 'dragstart',   fn);
        Evt.observe(this._containerEl, 'selectstart', fn); // IE



        if (this._options.autoNext) {
            this._autoNextTimer = setInterval(Ink.bind(this.next, this), this._options.autoNext * 1000);
        }
    };

    Gallery.prototype = {

        /**
         * Returns the length of the collection being displayed
         *
         * @method getLength
         * @return {Number} number of elements in display
         */
        getLength: function() {
            return this._model.length;
        },

        /**
         * Returns the index of the element being displayed
         *
         * @method getIndex
         * @return {Number} index of element being displayed
         */
        getIndex: function() {
            return this._currentIndex;
        },

        /**
         * Returns information relative to the element being displayed
         *
         * @method getItem
         * @return {Object} model information of the element being displayed
         */
        getItem: function() {
            return Aux.clone( this._model[ this._currentIndex ] );
        },

        /**
         * changes the item in display
         *
         * @method goTo
         * @param  {Number}   index       index of the item we want displayed
         * @param  {Boolean} [isRelative] if true, adds to the current index
         */
        goTo: function(index, isRelative) {
            var i = this._currentIndex;
            var l = this._model.length;
            var circ = this._options.circular;

            if (isRelative) {
                i += index;
            }
            else {
                i = index;
            }

            if (i < 0) {
                if (!circ) { return; }
                i += l;
            }
            else if (i >= l) {
                if (!circ) { return; }
                i -= l;
            }

            this._goTo(i);
        },

        /**
         * shows previous item
         *
         * @method previous
         */
        previous: function() {
            this.goTo(-1, true);
        },

        /**
         * shows next item
         *
         * @method next
         */
        next: function() {
            this.goTo(1, true);
        },

        /**
         * returs the state of the full screen feature
         *
         * @method isInFullScreen
         * @return {Boolean} true if gallery is currently in full screen
         */
        isInFullScreen: function() {
            return this._inFullScreen;
        },

        /**
         * toggles between normal and full screen modes
         *
         * @method toggleFullScreen
         */
        toggleFullScreen: function() {
            this._inFullScreen = !this._inFullScreen;
            if (!this._inFullScreen) {
                this._containerEl.style.width = '';
            }

            Css.addRemoveClassName(this._containerEl, 'ink-galleryx-fullscreen', this._inFullScreen);
            this._render();
        },



        _goTo: function(i) {
            var prevI = this._currentIndex;
            var l = this._model.length;

            if (i !== undefined) {
                this._currentIndex = i;
            }
            else {
                i = this._currentIndex;
            }

            var w = this._mainDims[0];
            var ww = this._options.thumbDims[0];
            this._stageEl.style.marginLeft = '-' + (i * w) + 'px';
            if (this._thumbHolderEl) {
                this._thumbHolderEl.scrollLeft = i * ww;
                Css.removeClassName(this._tTmp[prevI].el, 'ink-inset');
                Css.addClassName(   this._tTmp[i    ].el, 'ink-inset');
            }

            if (this._captionEl) {
                this._captionEl.innerHTML = this._model[i].caption || '';
            }

            if (this._paginationEl) {
                Css.removeClassName(this._pageEls[prevI], 'current');
                Css.addClassName(   this._pageEls[i    ], 'current');
            }

            // fetch current, prev and next
            if (this._options.useProxies) {
                var t, ic;
                t = wrapAround(i-1, l); ic = this._sTmp[t]; if (!t.uri) { ic.setURI( this._model[t].mainSrc ); }
                t = wrapAround(i,   l); ic = this._sTmp[t]; if (!t.uri) { ic.setURI( this._model[t].mainSrc ); }
                t = wrapAround(i+1, l); ic = this._sTmp[t]; if (!t.uri) { ic.setURI( this._model[t].mainSrc ); }
            }
        },

        _makeTempElements: function() {
            var el, prevSEl, prevTEl, i, l = this._model.length;
            this._sTmp = new Array(l);
            this._tTmp = new Array(l);

            for (i = 0; i < l; ++i) {
                el = document.createElement('div');
                if (prevSEl) {
                    insertAfter(this._stageEl, el, prevSEl);
                }
                else {
                    insertAtStart(this._stageEl, el);
                }
                this._sTmp[i] = el;
                prevSEl = el;

                if (!this._thumbHolderEl) {
                    continue;
                }

                el = document.createElement('div');
                if (prevTEl) {
                    insertAfter(this._thumbHolderEl, el, prevTEl);
                }
                else {
                    insertAtStart(this._thumbHolderEl, el);
                }
                this._tTmp[i] = el;
                prevTEl = el;
            }
        },

        _makePagination: function() {
            var el, i, l = this._model.length;
            this._pageEls = new Array(l);
            for (i = 0; i < l; ++i) {
                el = this._pageEl.cloneNode(true);
                this._paginationEl.appendChild(el);
                this._pageEls[i] = el;
            }
        },

        _extractModel: function() {
            this._model = [];
            this._sTmp = [];
            this._tTmp = [];

            // a) traverse .stage children
            var t, o, el = this._stageEl.firstChild;
            while (el) {
                if ( el.nodeType !== 1 /*||
                     Css.hasClassName(el, 'prev') ||
                     Css.hasClassName(el, 'next')*/ ) {
                    el = el.nextSibling;
                    continue;
                }

                o = {};

                if (el.nodeName.toLowerCase() === 'img') {
                    o.mainSrc = el.getAttribute('src');
                    t = el.getAttribute('alt');
                    if (t) {
                        o.caption = t;
                    }
                    this._model.push(o);
                    this._sTmp.push(el); // we store the elements to replace them
                }
                else if (Css.hasClassName(el, 'item')) {
                    this._model.push({});
                    this._sTmp.push(el);
                }

                //console.log('s', el);

                el = el.nextSibling;
            }

            // b) traverse .thumb-holder children
            if (!this._thumbHolderEl) {
                return;
            }

            var i = 0;
            el = this._thumbHolderEl.firstChild;
            while (el) {
                if (el.nodeType !== 1) {
                    el = el.nextSibling;
                    continue;
                }

                o = this._model[i++];

                if (el.nodeName.toLowerCase() === 'img') {
                    o.thumbSrc = el.getAttribute('src');
                    this._tTmp.push(el); // we store the elements to replace them
                }

                //console.log('t', el);

                el = el.nextSibling;
            }
        },

        _disableAutoNext: function() {
            clearInterval(this._autoNextTimer);
            delete this._autoNextTimer;
        },

        _render: function() {
            var l = this._model.length;

            var hh = this._thumbHolderEl ? this._options.thumbDims[1] : 0;

            // measure mainDims and prepare stageEl
            var mainDims = [0, 0];
            if (this._inFullScreen) {
                mainDims[0] = window.innerWidth;
                mainDims[1] = window.innerHeight - hh;
                this._containerEl.style.width = mainDims[0] + 'px';
            }
            else {
                mainDims[0] = this._containerEl.offsetWidth;
                mainDims[1] = ~~(mainDims[0] * 1/this._options.aspectRatio);
            }

            this._mainDims = mainDims;

            if (this._options.direction === 'x') {
                Css.addClassName(this._stageEl, 'horizontal');
                this._stageEl.style.width = (mainDims[0] * l) + 'px';
            }

            this._stageEl.style.height = mainDims[1] + 'px';



            // update DOM
            var o, i, sEl, tEl, ic, s;
            for (i = 0; i < l; ++i) {
                o = this._model[i];
                sEl = this._sTmp[i];
                tEl = this._tTmp[i];

                if (tEl instanceof ImageCell) {
                    //this._tTmp[i].resize(this._options.thumbDims); // these haven't changed so no need to update!
                }
                else if (tEl) {
                    ic = new ImageCell({
                        uri:      o.thumbSrc,
                        skipCss3: doesNotSupportBgSize,
                        cellDims: this._options.thumbDims,
                        mode:     this._options.thumbMode
                    });
                    this._thumbHolderEl.replaceChild(ic.el, tEl);
                    this._tTmp[i] = ic;
                }

                if (Css.hasClassName(sEl, 'item')) {
                    s = sEl.style;
                    s.width  = mainDims[0] + 'px';
                    s.height = mainDims[1] + 'px';
                }
                else if (sEl instanceof ImageCell) {
                    this._sTmp[i].resize(mainDims);
                }
                else {
                    ic = new ImageCell({
                        uri:      this._options.useProxies ? undefined : o.mainSrc,
                        skipCss3: doesNotSupportBgSize,
                        cellDims: mainDims,
                        mode:     this._options.mainMode
                    });
                    this._stageEl.replaceChild(ic.el, sEl);
                    this._sTmp[i] = ic;
                }
            }

            var h;
            if (this._prevEl) {
                s = this._prevEl.style;
                s.height = 'auto';
                s.paddingTop = 0;
                h = this._prevEl.offsetHeight;
                //console.log(mainDims[1], h, (mainDims[1] - h) / 2 );
                s.paddingTop = ~~( (mainDims[1] - h) / 2 ) + 'px';
                s.height = mainDims[1] + 'px';
            }
            if (this._nextEl) {
                s = this._nextEl.style;
                s.height = 'auto';
                s.paddingTop = 0;
                h = this._nextEl.offsetHeight;
                //console.log(mainDims[1], h, (mainDims[1] - h) / 2 );
                s.paddingTop = ~~( (mainDims[1] - h) / 2 ) + 'px';
                s.height = mainDims[1] + 'px';
            }

            if (this._captionEl && this._thumbHolderEl) {
                this._captionEl.style.bottom = this._options.thumbDims[1] + 'px';
            }

            this._goTo();
        },

        _onClick: function(ev) {
            if (this._autoNextTimer) {
                this._disableAutoNext();
            }

            var el = Evt.element(ev);
            //console.log('click', el);

            var hasPrev = Css.hasClassName(el, 'prev');
            var hasNext = Css.hasClassName(el, 'next');

            if (hasPrev || hasNext) {
                this.goTo(hasPrev ? -1 : 1, true);
            }
            else if (Css.hasClassName(el, 'resize')) {
                Css.toggleClassName(el, 'icon-resize-full');
                Css.toggleClassName(el, 'icon-resize-small');
                this.toggleFullScreen();
            }
            else if ( Css.hasClassName(el.parentNode, 'pagination') ||
                      Css.hasClassName(el, 'image-cell') ) {
                var i = Aux.childIndex(el);
                this._goTo(i);
            }

            Evt.stop(ev);
        },

        _onSwipe: function(sw, o) {
            if (this._autoNextTimer) {
                this._disableAutoNext();
            }

            Evt.stop(o.upEvent);
            var dx = o.dr[0];
            dx = (dx > 0) ? -1 : 1;
            this.goTo(dx, true);
        },

        _onResize: function() {
            if (this._containerEl.offsetWidth !== this._mainDims[0]) {
                this._render();
            }
        }

    };



    return Gallery;

});
