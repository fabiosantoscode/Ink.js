/**
 * @module Ink.Util.I18n
 * @author inkdev AT sapo.pt
 * @version 1
 */

Ink.createModule('Ink.Util.I18n', '1', [], function () {
    'use strict';

    /**
     * Creates a new internationalization helper object
     * @class Ink.Util.I18n
     * @constructor
     *
     * @param {Object} langObject object containing language objects
     * @param {String} langCode language code of the target language
     * @param {Boolean} translationStringsInRoot whether translation strings are in the root of langObject. This is turned off by default.
     */
    function I18n (langObject, langCode, translationStringsInRoot) {
        this._init(langObject, langCode, translationStringsInRoot);
    }

    I18n.prototype = {
        _init: function (langObject, langCode, translationStringsInRoot) {
            this._testMode = false;
            this._lang = langCode || 'pt_PT';
            this._strings = {};
            this.append(langObject, translationStringsInRoot);  // Add the translation strings
        },
        /**
         * @function ? adds translation strings for this helper to use.
         * @param {Object} baseLangObject
         * @param {Boolean} translationStringsInRoot whether translation strings are in the root of langObject. This is turned off by default.
         */
        append: function (langObject, translationStringsInRoot) {
            var keys = langObject[this._lang];
            if (translationStringsInRoot) {
                keys = langObject;
            }
            Ink.extendObj(this._strings, keys);
        },
        /**
         * @function {String} ? returns base lang
         */
        getLang: function () {return this._lang;},
        /**
         * @function ? sets or unsets test mode. In test mode, unknown strings are wrapped in []
         */
        testMode: function (toggle) {
            this._testMode = toggle || false;
        },
        /**
         * @function {Function} ? returns an alias to I18n.text. Usually bound to "_"
         * check Ink.Util.I18n.text
         */
        alias: function () {
            var that = this;
            return function () {
                return I18n.prototype.text.apply(that, [].slice.call(arguments));
            };
        },
        /**
         * @function {String} ? replaces
         * @param {String}          str     key to look for in i18n dictionary (returns key if unknown)
         * @param {optional String} arg1    replacement #1 (replaces first {%s} and all {%s:1})
         * @param {optional String} arg2... replacement #2 (replaces second {%s} and all {%s:2})
         *
         * @sample
         * _('Gosto muito de {%s} e o céu é {%s}.', 'carros', 'azul');                      // returns 'Gosto muito de carros e o céu é azul.'
         *
         * @sample
         * _('O {%s:1} é {%s:2} como {%s:2} é a cor do {%s:3}.', 'carro', 'azul', 'FCP');   // returns 'O carro é azul como azul é o FCP.'
         */
        text: function (str /*, replace, arguments*/) {
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
         * @function {String} ? returns either singular or plural words
         *
         * @paramset Syntax 1
         * @param {String} strSin  - word to use when count is 1
         * @param {String} strPlur - word to use otherwise
         * @param {Number} count   - number which defines which word to use
         *
         * @paramset Syntax 2
         * @param {String[]} words - words to use
         * @param {Number}   count - number which defines which word to use
         *
         * @sample
         * Ink.Util.I18n.ntext('animal', 'animals', 0); // returns 'animals'
         * Ink.Util.I18n.ntext('animal', 'animals', 1); // returns 'animal'
         *
         * @sample
         * var args = ['', 'st', 'nd', 'rd', 'th'];
         * Ink.Util.I18n.ntext(args, 1);    // returns '1st'
         * Ink.Util.I18n.ntext(args, 2);    // returns '2nd'
         * Ink.Util.I18n.ntext(args, 3);    // returns '3rd'
         * Ink.Util.I18n.ntext(args, 4);    // returns '4th'
         * Ink.Util.I18n.ntext(args, 5);    // returns '5th'
         */
        ntext: function(strSin, strPlur, count) {
            if (typeof strSin === 'string' && typeof strPlur === 'string' && typeof count === 'number') {
                if (count === 1) {
                    return strSin;
                } else {
                    return strPlur;
                }
            }
            else {
                var words = strSin;
                count = strPlur;

                var lastIndex = words.length - 1;

                if (count >= lastIndex) {
                    return words[lastIndex];
                } else {
                    return words[count];
                }
            }
        }
    };
    
    return I18n;
});
