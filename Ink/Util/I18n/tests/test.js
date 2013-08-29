/*globals equal,test*/
Ink.requireModules(['Ink.Util.I18n'], function () {
    'use strict';

    var I18n = Ink.Util.I18n;

    function make() {
        return new I18n(dict, 'pt_PT');
    }

    var dict = {'pt_PT': {
        'me': 'eu',
        'i have a {%s} for you': 'tenho um {%s} para ti',
        '1:, {%s:1}, 2: {%s:2}': '2: {%s:2}, 1: {%s:1}',
        '{%s} day': '{%s} dia',
        '{%s} days': '{%s} dias'
    }};

    var _ = make().alias();

    test('basic usage', function () {
        var i18n = make();
        equal(i18n.text('me'), 'eu');
    });

    test('when the dictionary has translation keys in root', function () {
        var i18n = new I18n({
            'translation': 'traducao'
        }, 'pt_PT', 'translation strings in root');
        equal(i18n.text('translation'), 'traducao');
    });

    test('alias', function () {
        var i18n = make();
        var aliased = i18n.alias();
        equal(aliased('me'), 'eu');
    });

    test('append', function () {
        var i18n = make();
        i18n.append({'pt_PT': {
            'sfraggles': 'braggles'
        }});
        equal(i18n.text('sfraggles'), 'braggles');
    });

    test('_testMode', function() {
        var i18n = make();
        var _ = i18n.alias();
        i18n.testMode(true);
        equal(_('unknown'), '[unknown]');
        equal(_('me'), 'eu');

        i18n.testMode(false);
        equal(_('unknown'), 'unknown');
        equal(_('me'), 'eu');
    });

    test('replacements', function () {
        equal(_('i have a {%s} for you', 'presente'), 'tenho um presente para ti');
        equal(_('1:, {%s:1}, 2: {%s:2}', 1, 2), '2: 2, 1: 1');
    });

    test('ntext()', function() {
        var i18n = make();

        equal(i18n.ntext('animal', 'animals', 1),
            'animal');

        equal(i18n.ntext('animal', 'animals', 2),
            'animals');

        equal(i18n.ntext('{%s} day', '{%s} days', 1), '1 dia');
        equal(i18n.ntext('{%s} day', '{%s} days', 2), '2 dias');
    });

    test('ordinal (from dict)', function () {
        var dict = {
            fr: {
                _ordinals: {
                    "default": "<sup>e</sup>",
                    exceptions: {
                        1: "<sup>er</sup>"
                    }
                }
            },
            en_US: {
                _ordinals: {
                    "default": "th",
                    byLastDigit: {
                        1: "st",
                        2: "nd",
                        3: "rd"
                    },
                    exceptions: {
                        0: "",
                        11: "th",
                        12: "th",
                        13: "th"
                    }
                }
            }
        };

        var i18n = new I18n(dict, 'fr');
        equal(i18n.ordinal(1), '<sup>er</sup>');
        equal(i18n.ordinal(2), '<sup>e</sup>');
        equal(i18n.ordinal(11), '<sup>e</sup>');
        
        i18n = new I18n(dict, 'en_US');
        equal(i18n.ordinal(1), 'st');  // x
        equal(i18n.ordinal(2), 'nd');  // x
        equal(i18n.ordinal(0), '');
        equal(i18n.ordinal(12), 'th');
        equal(i18n.ordinal(22), 'nd');  // x
        equal(i18n.ordinal(3), 'rd');  // x
        equal(i18n.ordinal(4), 'th');
        equal(i18n.ordinal(5), 'th');
    });

    test('ordinal (from passed options)', function () {
        // Examples of passing in the options directly
        var ptOrdinals = {
            "default": '&ordm;'
        };
        var i18n = new I18n();
        equal(i18n.ordinal(1, ptOrdinals), '&ordm;'); // Returns 'º'
        equal(i18n.ordinal(4, ptOrdinals), '&ordm;'); // Returns 'º'
    });

    test('ordinal (with functions)', function () {
        var dict = {
            'en': {
                _ordinals: {
                    byLastDigit: function (digit) {return digit === 0 ? 'th' : undefined;},
                    exceptions: function (num) {return num === 3 ? 'rd' : undefined;}
                }
            }
        };
        var i18n = new I18n(dict, 'en');
        equal(i18n.ordinal(0), 'th');
        equal(i18n.ordinal(10), 'th');
        equal(i18n.ordinal(200), 'th');
        equal(i18n.ordinal(3), 'rd');
        equal(i18n.ordinal(123), '');
        equal(i18n.ordinal(12312312), '');
    });

    test('ordinal (passed a function)', function () {
        var i18n = make();
        equal(
            i18n.ordinal(123, function () {return 'THTH';}),
            'THTH'
        );
        equal(
            i18n.ordinal(123, function () {return null;}),
            ''
        );

    });

    test('multilang', function () {
        var i18n = make();
        i18n.append({
            pt_PT: {
                yeah_text: 'pois'
            },
            en_US: {
                yeah_text: 'yeah'
            }
        });
        equal(i18n.text('yeah_text'), 'pois');
        i18n.setLang('en_US');
        equal(i18n.text('yeah_text'), 'yeah');
    });

    test('alias doctest', function () {
        var i18n = new I18n({
           'pt_PT': {
               'hi': 'olá',
               '{%s} day': '{%s} dia',
               '{%s} days': '{%s} dias',
               '_ordinals': {
                   'default': 'º'
               }
           }
        }, 'pt_PT');
        var _ = i18n.alias();
        equal(_('hi'), 'olá');
        equal(_('{%s} days', 3), '3 dias');
        equal(_.ntext('{%s} day', '{%s} days', 2), '2 dias');
        equal(_.ntext('{%s} day', '{%s} days', 1), '1 dia');
        equal(_.ordinal(3), 'º');
    });
});
