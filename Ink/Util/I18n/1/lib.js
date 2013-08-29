/**
 * @module Ink.Util.I18n_1
 * @author inkdev AT sapo.pt
 */

Ink.createModule('Ink.Util.I18n', '1', [], function () {
    'use strict';

    /**
     * Creates a new internationalization helper object
     *
     * @class Ink.Util.I18n
     * @constructor
     *
     * @param {Object} langObject object mapping language codes (in the form of `pt_PT`, `pt_BR`, `fr`, `en_US`, etc.) to their Object dictionaries.
     *     @param {Object} langObject.(dictionaries...) 
     * @param {String} [langCode='pt_PT'] language code of the target language
     * @param {Boolean} [translationStringsInRoot=false] indicates whether translation strings are in the root of langObject. This is turned off by default.
     *
     * @example
     *      var dictionaries = {    // This could come from a JSONP request from your server
     *          'pt_PT': {
     *              'hello': 'olá',
     *              'me': 'eu',
     *              'i have a {%s} for you': 'tenho um {%s} para ti'
     *          },
     *          'pt_BR': {
     *              'hello': 'oi',
     *              'me': 'eu',
     *              'i have a {%s} for you': 'tenho um {%s} para você'
     *          }
     *      };
     *      Ink.requireModules(['Ink.Util.I18n_1'], function (I18n) {
     *          var i18n = new I18n(dictionaries, 'pt_PT');
     *          i18n.text('hello');  // returns 'olá'
     *          i18n.text('i have a {%s} for you', 'IRON SWORD'); // returns 'tenho um IRON SWORD' para ti
     *          
     *          i18n.setLang('pt_BR');  // Changes language. pt_BR dictionary is loaded
     *          i18n.text('hello');  // returns 'oi'
     *
     *          i18n.setLang('en_US');  // Missing language.
     *          i18n.text('hello');  // returns 'hello'. If testMode is on, returns '[hello]'
     *      });
     */
    function I18n (langObject, langCode, translationStringsInRoot) {
        this._init(langObject, langCode, translationStringsInRoot);
    }

    function makeObj (key, val) { // To make an object from an arbitrary key and a value
        var ret = {};
        ret[key] = val;
        return ret;
    }

    I18n.prototype = {
        _init: function (langObject, langCode, translationStringsInRoot) {
            this._testMode = false;
            this._lang = langCode || 'pt_PT';
            this._strings = {};
            this._otherDicts = [];
            this.append(langObject || {}, translationStringsInRoot);  // Add the translation strings
        },
        /**
         * Adds translation strings for this helper to use.
         *
         * @method append
         * @param {Object} baseLangObject object containing language objects identified by their language code
         * @param {Boolean} [translationStringsInRoot=false] indicates whether translation strings are in the root of langObject. This is turned off by default.
         *
         * @example
         *     var i18n = new I18n({}, 'pt_PT');
         *     i18n.append({'pt_PT': {
         *         'sfraggles': 'braggles'
         *     }});
         *     equal(i18n.text('sfraggles'), 'braggles');
         */
        append: function (langObject, translationStringsInRoot) {
            if (translationStringsInRoot) {
                langObject = makeObj(this._lang, langObject);
            }
            this._otherDicts.push(langObject);
            Ink.extendObj(this._strings, langObject[this._lang]);
        },
        /**
         * Get the language code
         *
         * @returns {String} the language code for this instance
         * @method {String} getLang
         */
        getLang: function () {return this._lang;},
        /**
         * Set the language. If there are more dictionaries available in cache, they will be loaded.
         *
         * @method  setLang
         * @param   lang    {String} Language code to set this instance to.
         */
        setLang: function (lang) {
            if (this._lang === lang) {
                return;
            }
            this._lang = lang;
            this._strings = {};
            for (var i = 0, len = this._otherDicts.length; i < len; i++) {
                Ink.extendObj(this._strings,
                    this._otherDicts[i][lang] || {});
            }
        },
        /**
         * Sets or unsets test mode. In test mode, unknown strings are wrapped
         * in `[ ... ]`. This is useful for debugging your application and
         * making sure all your translation keys are in place.
         *
         * @method testMode
         * @param {Boolean} toggle boolean value to set the test mode to.
         */
        testMode: function (toggle) {
            this._testMode = toggle || false;
        },
        /**
         * Returns an alias to `text()`, for convenience. The resulting function is
         * traditionally assigned to "_".
         *
         * @method alias
         * @returns {Function} an alias to `text()`. You can also access the rest of the translation API through this alias.
         *
         * @example
         *     var i18n = new I18n({
         *         'pt_PT': {
         *             'hi': 'olá',
         *             '{%s} day': '{%s} dia',
         *             '{%s} days': '{%s} dias',
         *             '_ordinals': {
         *                 'default': 'º'
         *             }
         *         }
         *     }, 'pt_PT');
         *     var _ = i18n.alias();
         *     equal(_('hi'), 'olá');
         *     equal(_('{%s} days', 3), '3 dias');
         *     equal(_.ntext('{%s} day', '{%s} days', 2), '2 dias');
         *     equal(_.ntext('{%s} day', '{%s} days', 1), '1 dia');
         *     equal(_.ordinal(3), 'º');
         */
        alias: function () {
            var ret = Ink.bind(I18n.prototype.text, this);
            ret.ntext = Ink.bind(I18n.prototype.ntext, this);
            ret.append = Ink.bind(I18n.prototype.append, this);
            ret.ordinal = Ink.bind(I18n.prototype.ordinal, this);
            ret.testMode = Ink.bind(I18n.prototype.testMode, this);
            return ret;
        },
        /**
         * Given a translation key, return a translated string, with replaced parameters.
         * When a translated string is not available, the original string is returned unchanged.
         *
         * @method {String} text
         * @param {String} str key to look for in i18n dictionary (which is returned verbatim if unknown)
         * @param {optional String} arg1 replacement #1 (replaces first {%s} and all {%s:1})
         * @param {optional String} arg2 replacement #2 (replaces second {%s} and all {%s:2})
         * @param {optional String} argn... replacement #n (replaces nth {%s} and all {%s:n})
         *
         * @example
         *     _('Gosto muito de {%s} e o céu é {%s}.', 'carros', 'azul');
         *     // returns 'Gosto muito de carros e o céu é azul.'
         *
         * @example
         *     _('O {%s:1} é {%s:2} como {%s:2} é a cor do {%s:3}.', 'carro', 'azul', 'FCP');
         *     // returns 'O carro é azul como azul é o FCP.'
         */
        text: function (str /*, replacements...*/) {
            if (typeof str !== 'string') {return;} // Backwards-compat

            var original, res;
            if (!this._strings) {
                original = str;
            }
            else {
                res = this._strings[str];
                original = (typeof res === 'undefined') ? (this._testMode ? '[' + str + ']' : str) : res;
            }

            var re = false,
                i,
                l = arguments.length;

            if (l > 1) {
                for (i = 1; i < l; ++i) {
                    if (typeof arguments[i] !== 'undefined') {
                        re = new RegExp('{%s:' + i + '}', '');
                        if (re.test(original)) {
                            original = original.replace(re, arguments[i]);
                        }
                        else {
                            original = original.replace(/\{%s\}/, arguments[i]);
                        }
                        re = null;
                        re = false;
                    }
                }
            }
            original = original.replace(/\{%s(\:\d*)?\}/ig, '');

            return original;
        },
        /**
         * Given a singular string, a plural string, and a number, translates
         * either the singular or plural string.
         *
         * @method ntext
         * @return {String}
         *
         * @param {String} strSin   word to use when count is 1
         * @param {String} strPlur  word to use otherwise
         * @param {Number} count    number which defines which word to use
         * @param [...]             extra arguments, to be passed to `text()`
         *
         * @example
         *     i18n.ntext('platypus', 'platypuses', 1); // returns 'ornitorrinco'
         *     i18n.ntext('platypus', 'platypuses', 2); // returns 'ornitorrincos'
         * 
         * @example
         *     // Extra arguments are passed to text()
         *     i18n.ntext('{%s} platypus', '{%s} platypuses', 1, 1); // returns '1 ornitorrinco'
         *     i18n.ntext('{%s} platypus', '{%s} platypuses', 2, 2); // returns '2 ornitorrincos'
         */
        ntext: function(strSin, strPlur, count) {
            var argsForText = [].slice.call(arguments, 2);
            if (count === 1) {
                return this.text.apply(this, [strSin].concat(argsForText));
            } else {
                return this.text.apply(this, [strPlur].concat(argsForText));
            }
        },
        /**
         * Returns the ordinal suffix of `num` (For example, 1 > 'st', 2 > 'nd', 5 > 'th', ...).
         *
         * This works by using transforms (in the form of Objects or Functions) passed into the
         * function or found in the special key `_ordinals` in the active language dictionary.
         *
         * @method ordinal
         *
         * @param {Number}          num             Input number
         * 
         * @param {Object}          [options={}]
         *
         *    Maps for translating. Each of these options' fallback is found in the current
         *    language's dictionary. The lookup order is the following:
         *   
         *        1. `exceptions`
         *        2. `byLastDigit`
         *        3. `default`
         *   
         *    Each of these may be either an `Object` or a `Function`. If it's a function, it
         *    is called, and if the function returns a string, that is used. If it's an object,
         *    the property is looked up using `[...]`. If what is found is a string, it is used.
         *
         * @param {Object|Function} [options.byLastDigit={}]
         *    If the language requires the last digit to be considered, mappings of last digits
         *    to ordinal suffixes can be created here.
         *
         * @param {Object|Function} [options.exceptions={}]
         *    Map unique, special cases to their ordinal suffixes.
         *
         * @returns {String}        Ordinal suffix for `num`.
         *
         * @example
         *     var i18n = new I18n({
         *         fr: {  // 1er, 2e, 3e, 4e, ...
         *             _ordinals: {  // The _ordinals key is special.
         *                 'default': "e", // Usually the suffix is "e" in french...
         *                 exceptions: {
         *                     1: "er"   // ... Except for the number one.
         *                 }
         *             }
         *         },
         *         en_US: {  // 1st, 2nd, 3rd, 4th, ..., 11th, 12th, ... 21st, 22nd...
         *             _ordinals: {
         *                 'default': "th",// Usually the digit is "th" in english...
         *                 byLastDigit: {
         *                     1: "st",  // When the last digit is 1, use "th"...
         *                     2: "nd",  // When the last digit is 2, use "nd"...
         *                     3: "rd"   // When the last digit is 3, use "rd"...
         *                 },
         *                 exceptions: { // But these numbers are special
         *                     0: "",
         *                     11: "th",
         *                     12: "th",
         *                     13: "th"
         *                 }
         *             }
         *         }
         *     });
         *
         *     i18n.setLang('fr');
         *     i18n.ordinal(1);    // return 'er'
         *     i18n.ordinal(2);    // return 'e'
         *     i18n.ordinal(11);   // return 'e'
         *
         *     i18n.setLang('en');
         *     i18n.ordinal(1);    // returns 'st'
         *     i18n.ordinal(2);    // returns 'nd'
         *     i18n.ordinal(12);   // returns 'th'
         *     i18n.ordinal(22);   // returns 'nd'
         *     i18n.ordinal(3);    // returns 'rd'
         *     i18n.ordinal(4);    // returns 'th'
         *     i18n.ordinal(5);    // returns 'th'
         *      
         *     // Examples of passing in the options directly
         *     var ptOrdinals = {
         *         'default': 'º'
         *     }
         *     var i18n2 = new I18n();
         *     i18n2.ordinal(1, ptOrdinals); // Returns 'º'
         *     i18n2.ordinal(4, ptOrdinals); // Returns 'º'
         *
         **/
        ordinal: function (num, options) {
            if (typeof num === 'undefined') {
                return '';
            }
            var numStr = num.toString();
            options = options || {};
            var fromDict = this._strings._ordinals || {};
            
            var tryRet;
            if (typeof options === 'function') {
                tryRet = options(num)
            } else if (typeof fromDict === 'function') {
                tryRet = fromDict(num);
            }
            if (typeof tryRet === 'string') {
                return tryRet;
            }

            function v(inside, number) {
                number = typeof number === 'undefined' ? num : number;
                if (typeof inside === 'undefined') {
                    return;
                } else if (typeof inside === 'function') {
                    try {
                        var ret = inside(number);
                        return typeof ret === 'string' ? ret : null;
                    } catch(e) {}
                } else if (typeof inside === 'object') {
                    return inside[number];
                } else if (typeof inside === 'string') {
                    // Useful for the default option, or to define a global _ordinals rule for languages which don't need it.
                    return inside;
                }
            }

            function lookup (obj) {
                var tmp;

                tmp = v(obj.exceptions);
                if (typeof tmp === 'string') {
                    return tmp;
                }

                tmp = v(obj.byLastDigit, +(numStr[numStr.length - 1]));
                if (typeof tmp === 'string') {
                    return tmp;
                }

                tmp = v(obj['default'])
                if (typeof tmp === 'string') {
                    return tmp;
                }
            }

            var ret;
            
            ret = lookup(options)
            if (typeof ret === 'string') {
                return ret;
            }
            
            ret = lookup(fromDict)
            if (typeof ret === 'string') {
                return ret;
            }

            return '';
        }
    };
    
    return I18n;
});
