/**
 * @module Ink.Util.Image_1
 * @author inkdev AT sapo.pt
 * @version 1
 */
Ink.createModule('Ink.Util.Image', '1',
    ['Ink.Dom.Event_1'],
    function(Evt) {

    'use strict';



    var IMG_DIMS    = {}; // uri -> [w, h]
    var IMG_PENDING = {}; // uri -> [ o1, o2, ... ]
    var IMG_ELS     = {}; // uri -> image element

    var MEASURE_TIMER;
    var MEASURE_TIMER_DELTA     =  0.25; // in seconds
    var MEASURE_DEFAULT_TIMEOUT = 10;    // in seconds

    var ON_MEASURE_TIMER = function() {
        var cbs, uri, i, f, o, dt;
        var urisToRemove = [];
        var now = new Date().getTime();
        for (uri in IMG_PENDING) {
            if (!IMG_PENDING.hasOwnProperty(uri)) { continue; }

            cbs = IMG_PENDING[uri];

            for (i = 0, f = cbs.length; i < f; ++i) {
                o = cbs[i];
                    dt = now - o.loadStart;
                dt /= 1000;
                if (dt > o.timeout) {
                    o.cb('timeout', o);
                    cbs.splice(i, 1);
                    --i;
                    --f;
                }
            }

            if (cbs.length === 0) {
                urisToRemove.push(uri);
            }
        }

        for (i = 0, f = urisToRemove.length; i < f; ++i) {
            uri = urisToRemove[i];
            delete IMG_PENDING[uri];
            delete IMG_ELS[uri];
        }
    };



    /**
     * Image utilities
     *
     * @class Ink.Util.Image
     * @version 1
     * @static
     */
    var IImg = {

        /**
         * Calculates the maximum size a rectagle can have maintaining aspect ratio.
         *
         * @method maximizeBox
         * @param  {Number[2]}  maxSz            the maximum size to fill
         * @param  {Number[2]}  realSz           the original size of the element
         * @param  {Boolean}    [forceMaximize]  iif true, the element is zoomed in, otherwise it is centered
         * @return {Array[2]}                    returns 2 array pairs: the suggested element size and padding to remain centered
         * @static
         */
        maximizeBox: function(maxSz, realSz, forceMaximize) {
            var w = realSz[0];
            var h = realSz[1];
            var boxSz;

            if (forceMaximize || (w > maxSz[0] || h > maxSz[1]) ) {
                var arImg = w / h;
                var arMax = maxSz[0] / maxSz[1];
                var s = (arImg > arMax) ? maxSz[0] / w : maxSz[1] / h;
                boxSz = [parseInt(w * s, 10), parseInt(h * s, 10)];
            }
            else {
                boxSz = realSz.slice();
            }

            var padSz = [
                    parseInt( (maxSz[0] - boxSz[0]) / 2 , 10 ),
                    parseInt( (maxSz[1] - boxSz[1]) / 2 , 10 )
            ];

            return [boxSz, padSz];
        },


        /**
         * Calculates the box and pad configuration to mimic cover layout (see background-size: cover CSS3 prop)
         *
         * @method coverBox
         * @param  {Number[2]}  maxSz   the maximum size to fill
         * @param  {Number[2]}  realSz  the original size of the element
         * @return {Array[2]}           returns 2 array pairs: the suggested element size and padding to remain centered
         * @static
         */
        coverBox: function(maxSz, realSz) {
            var w = realSz[0];
            var h = realSz[1];
            var boxSz;

            var arImg = w / h;
            var arMax = maxSz[0] / maxSz[1];

            if (arImg > arMax) { //fix height
                boxSz = [
                    maxSz[1] * arImg,
                    maxSz[1]
                ];
            }
            else { // fix width
                boxSz = [
                    maxSz[0],
                    maxSz[0] / arImg
                ];
            }

            var padSz = [
                    parseInt( (maxSz[0] - boxSz[0]) / 2 , 10 ),
                    parseInt( (maxSz[1] - boxSz[1]) / 2 , 10 )
            ];

            return [boxSz, padSz];
        },


        /**
         * @method measureImage
         * @param  {Object}     o
         * @param  {String}     o.uri
         * @param  {Function}   o.cb
         * @param  {Number}    [o.timeout]  in seconds. defaults to 10
         * @async
         * @static
         */
        measureImage: function(o) {
            if (!o.uri) { throw new Error('url is required!'); }



            // makes full URIs from current page
            //console.log('MEASURE', o.uri);
            if (o.uri.indexOf(':') === -1) {
                var t = location.pathname.split('/');
                t.pop();
                t = t.join('/');
                o.uri = [location.protocol, '//', location.host, t, '/', o.uri].join('');
            }
            //console.log('->', o.uri);



            if (!o.cb) { o.cb = function(){}; }

            if (!o.timeout) {
                o.timeout = MEASURE_DEFAULT_TIMEOUT;
            }
            o.loadStart = new Date().getTime();

            if (!MEASURE_TIMER) {
                MEASURE_TIMER = setInterval(ON_MEASURE_TIMER, MEASURE_TIMER_DELTA * 1000);
            }

            // is image in cache? return it right away
            var dims = IMG_DIMS[o.uri];
            if (dims) {
                o.fromCache = true;
                o.dimensions = dims;
                return o.cb(null, o);
            }

            // is image already awaiting load? just enqueue
            var cbs = IMG_PENDING[o.uri];
            if (cbs) {
                return cbs.push(o);
            }

            // create temporary image off-screen
            var imgEl = document.createElement('img');
            var st = imgEl.style;
            st.visibility   = 'hidden';
            st.borderWidth  = 0;
            st.position     = 'absolute';
            st.left         = '-2600px';
            st.top          = 0;

            IMG_PENDING[o.uri] = [ o ];
            IMG_ELS[o.uri]     = imgEl;

            // once loaded, remove it and notify callback(s)

            Evt.observe(imgEl, 'load',
                Ink.bind(
                    function() {
                        var imgEl = this;
                        var uri = imgEl.src;
                        var dims = [imgEl.offsetWidth, imgEl.offsetHeight];
                        imgEl.parentNode.removeChild(imgEl);
                        IMG_DIMS[uri] = dims;

                        var cbs = IMG_PENDING[uri];
                        delete IMG_PENDING[uri];

                        var o;
                        for (var i = 0, f = cbs.length; i < f; ++i) {
                            o = cbs[i];
                            o.dimensions = dims;
                            o.loadEnd = new Date().getTime();
                            o.loadDuration = (o.loadEnd - o.loadStart) / 1000;
                            o.cb(null, o);
                        }
                    },
                    imgEl
                )
            );

            document.body.insertBefore(imgEl, document.body.firstChild);
            imgEl.src = o.uri;
        },

        /**
         * @method measureImages
         * @param  {String[]}  uris list of image URIs to measure
         * @param  {Function}  cb   returns object with hash of uri -> dims and array timeouts for URIs which have timed out
         * @async
         * @static
         */
        measureImages: function(uris, cb) {
            var left = uris.length;
            var O = {
                measured:  {},
                timeouts:  []
            };

            var innerCb = function(err, o) {
                --left;

                if (err) {
                    O.timeouts.push( o.uri );
                }
                else {
                    O.measured[ o.uri ] = o.dimensions;
                }

                if (left === 0) {
                    cb(O);
                }
            };

            for (var i = 0, f = left; i < f; ++i) {
                IImg.measureImage({
                    uri: uris[i],
                    cb:  innerCb
                });
            }
        }

    };

    return IImg;

});
