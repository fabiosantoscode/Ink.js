/**
 * @module Ink.UI.Sticky_1
 * @author inkdev AT sapo.pt
 * @version 1
 */
Ink.createModule('Ink.UI.Sticky', '1', ['Ink.UI.Aux_1','Ink.Dom.Event_1','Ink.Dom.Css_1','Ink.Dom.Element_1','Ink.Dom.Selector_1'], function(Aux, Event, Css, InkElement, Selector ) {
    'use strict';

    /**
     * The Sticky component takes an element and transforms it's behavior in order to, when the user scrolls he sets its position
     * to fixed and maintain it until the user scrolls back to the same place.
     *
     * @class Ink.UI.Sticky
     * @constructor
     * @version 1
     * @uses Ink.UI.Aux
     * @uses Ink.Dom.Event
     * @uses Ink.Dom.Css
     * @uses Ink.Dom.Element
     * @uses Ink.Dom.Selector
     * @param {String|DOMElement} selector
     * @param {Object} [options] Options
     *     @param {Number}     options.offsetBottom       Number of pixels of distance from the bottomElement.
     *     @param {Number}     options.offsetTop          Number of pixels of distance from the topElement.
     *     @param {String}     options.topElement         CSS Selector that specifies a top element with which the component could collide.
     *     @param {String}     options.bottomElement      CSS Selector that specifies a bottom element with which the component could collide.
     * @example
     *      <script>
     *          Ink.requireModules( ['Ink.Dom.Selector_1','Ink.UI.Sticky_1'], function( Selector, Sticky ){
     *              var menuElement = Ink.s('#menu');
     *              var stickyObj = new Sticky( menuElement );
     *          });
     *      </script>
     */
    var Sticky = function( selector, options ){
        this._init(selector, options);
    };

    Sticky.prototype = {

        /**
         * Init function called by the constructor
         *
         * @method _init
         * @private
         */
        _init: function (selector, options) {
            this._rootElement = Aux.elOrSelector(selector, 'Ink.UI.Sticky: root sticky element');

            /**
             * Setting default options and - if needed - overriding it with the data attributes and given options
             */
            var o = this._options = Ink.extendObj({
                offsetBottom: 0,
                offsetTop: 0,
                topElement: null,
                bottomElement: null 
            }, options || {}, InkElement.data( this._rootElement ) );

            this._topElement = Selector.select( o.topElement )[0];
            this._bottomElement = Selector.select( o.bottomElement )[0];

            this._computedStyle = window.getComputedStyle ?
                window.getComputedStyle(this._rootElement, null) :
                this._rootElement.currentStyle;

            this._dims = {
                height: this._computedStyle.height,
                width: this._computedStyle.width
            };  // TODO use this not, since change it might

            Event.observe( document, 'scroll', Ink.bindEvent(this._onScrollFilter,this));
            Event.observe( window, 'resize', Ink.bindEvent(this._onResizeFilter,this));
            this._calculateOriginalSizes();
            this._calculateOffsets();
            this._onScroll();
        },

        /**
         * Scroll handler. Meant to execute `_onScroll` on the next tick, so as to avoid
         * calculating events too many times.
         *
         * @method _onScrollFilter
         * @private
         */
        _onScrollFilter: function(){
            clearTimeout(this._scrollTimeout);
            this._scrollTimeout = setTimeout(Ink.bind(this._onScroll,this), 0);
        },

        /**
         * Resize handler
         *
         * @method _onResizeFilter
         * @private
         */
        _onResizeFilter: function(){
            clearTimeout(this._resizeTimeout);
            this._resizeTimeout = setTimeout(Ink.bind(function(){
                this._rootElement.removeAttribute('style');
                this._calculateOriginalSizes();
                this._calculateOffsets();
                this._onScroll();
            }, this),0);  // Avoid catering to several events on the same tick.
        },

        /**
         * Place the element correctly on the page
         * @method _onScroll
         * @private
         **/
        _onScroll: function(){
            var viewport = (document.compatMode === "CSS1Compat") ?  document.documentElement : document.body;

            if(
                ( ( (InkElement.elementWidth(this._rootElement)*100)/viewport.clientWidth ) > 90 ) ||
                ( viewport.clientWidth<=649 )
            ){
                if( InkElement.hasAttribute(this._rootElement,'style') ){
                    this._rootElement.removeAttribute('style');
                }
                return;
            }

            var scrollHeight = InkElement.scrollHeight();

            if( InkElement.hasAttribute(this._rootElement,'style') ){
                if( scrollHeight <= (this._options.originalTop-this._options.originalOffsetTop)){
                    this._rootElement.removeAttribute('style');
                } else if( ((document.body.scrollHeight-(scrollHeight+parseInt(this._dims.height,10))) < this.offsetBottom) ){

                    this._rootElement.style.position = 'fixed';
                    this._rootElement.style.top = 'auto';
                    this._rootElement.style.left = this._options.originalLeft + 'px';

                    if( this.offsetBottom < parseInt(document.body.scrollHeight - (document.documentElement.clientHeight+scrollHeight),10) ){
                        this._rootElement.style.bottom = this._options.originalOffsetBottom + 'px';
                    } else {
                        this._rootElement.style.bottom = this.offsetBottom - parseInt(document.body.scrollHeight - (document.documentElement.clientHeight+scrollHeight),10) + 'px';
                    }
                    this._rootElement.style.width = this._options.originalWidth + 'px';

                } else if( ((document.body.scrollHeight-(scrollHeight+parseInt(this._dims.height,10))) >= this.offsetBottom) ){
                    this._rootElement.style.left = this._options.originalLeft + 'px';
                    this._rootElement.style.position = 'fixed';
                    this._rootElement.style.bottom = 'auto';
                    this._rootElement.style.left = this._options.originalLeft + 'px';
                    this._rootElement.style.top = this._options.originalOffsetTop + 'px';
                    this._rootElement.style.width = this._options.originalWidth + 'px';
                }
            } else {
                if( scrollHeight <= (this._options.originalTop-this._options.originalOffsetTop)){
                    return;
                }
                this._rootElement.style.left = this._options.originalLeft + 'px';
                this._rootElement.style.position = 'fixed';
                this._rootElement.style.bottom = 'auto';
                this._rootElement.style.left = this._options.originalLeft + 'px';
                this._rootElement.style.top = this._options.originalOffsetTop + 'px';
                this._rootElement.style.width = this._options.originalWidth + 'px';
            }
        },

        /**
         * On each resizing (and in the beginning) the component recalculates the offsets, since
         * the top and bottom element heights might have changed.
         *
         * @method _calculateOffsets
         * @private
         */
        _calculateOffsets: function(){
            /**
             * Calculating the offset top
             */
            if( this._topElement ){
                var topElementHeight = InkElement.elementHeight( this._topElement ),
                    topElementTop = InkElement.elementTop( this._topElement )
                ;

                this.offsetTop = ( parseInt(topElementHeight,10) + parseInt(topElementTop,10) ) + parseInt(this._options.originalOffsetTop,10);
            } else {
                this.offsetTop = parseInt(this._options.originalOffsetTop,10);
            }

            /**
             * Calculating the offset bottom
             */
            if( this._bottomElement ){
                var
                    bottomElementHeight = Element.elementHeight(this._bottomElement)
                ;
                this.offsetBottom = parseInt(bottomElementHeight,10) + parseInt(this._options.originalOffsetBottom,10);
            } else {
                this.offsetBottom = parseInt(this._options.originalOffsetBottom,10);
            }
        },

        /**
         * Function to calculate the 'original size' of the element.
         * It's used in the begining (_init method) and when a scroll happens
         *
         * @method _calculateOriginalSizes
         * @private
         */
        _calculateOriginalSizes: function(){

            if( typeof this._options.originalOffsetTop === 'undefined' ){
                this._options.originalOffsetTop = parseInt(this._options.offsetTop,10);
                this._options.originalOffsetBottom = parseInt(this._options.offsetBottom,10);
            }
            this._options.originalTop = parseInt(this._rootElement.offsetTop,10);
            this._options.originalLeft = parseInt(this._rootElement.offsetLeft,10);
            if(isNaN(this._options.originalWidth = parseInt(this._dims.width,10))) {
                this._options.originalWidth = 0;
            }
            this._options.originalWidth = parseInt(this._computedStyle.width,10);
        }
    };

    return Sticky;

});
