(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var _keycode = require('keycode');

var _keycode2 = _interopRequireDefault(_keycode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var hotkeys = [];
var editType = '';
var sysState = 'open';

var addEvents = function addEvents() {
    document.getElementById('editOpen').addEventListener('click', function (e) {
        editType = 'open';
        openDialog();
    });
    document.getElementById('editClose').addEventListener('click', function (e) {
        editType = 'close';
        openDialog();
    });
    document.getElementById('dialogCancel').addEventListener('click', function (e) {
        closeDialog();
    });
    document.getElementById('dialogConfirm').addEventListener('click', function (e) {
        if (hotkeys.length > 0) {
            saveHotKey();
        }
        closeDialog();
    });
    document.getElementById('hotkey').addEventListener('keydown', function (e) {
        var code = e.keyCode;
        if (hotkeys.indexOf(code) == -1) {
            hotkeys.push(code);
        }
        e.preventDefault();
    });
    document.getElementById('hotkey').addEventListener('keyup', function (e) {
        keyToName();
        document.getElementById('hotkey').blur();
        var classNames = document.getElementById('hotkeyWrap').className;
        document.getElementById('hotkeyWrap').setAttribute('class', classNames + ' is-dirty');
        e.preventDefault();
    });
    document.getElementById('hotkey').addEventListener('focus', function (e) {
        hotkeys = [];
    });
    document.getElementById('isOpen').addEventListener('change', function (e) {
        var state = e.target.checked ? 'open' : 'close';
        chrome.storage.sync.set({ state: state }, function () {
            switchState();
        });
    });
};
var keyToName = function keyToName() {
    var keyNames = '';
    hotkeys.map(function (data, k) {
        keyNames += '' + _keycode2.default.names[data] + (k < hotkeys.length - 1 ? ' + ' : '');
    });
    document.getElementById('hotkey').value = keyNames;
};

var keyToLabel = function keyToLabel(keys) {
    var keyNames = '(';
    keys.map(function (data, k) {
        keyNames += '' + _keycode2.default.names[data] + (k < keys.length - 1 ? '+' : '');
    });
    keyNames += ')';
    return keyNames;
};

var saveHotKey = function saveHotKey() {
    var obj = {};
    obj[editType] = hotkeys;
    chrome.storage.sync.set(obj, function () {
        initSetLabel();
        var snackbarContainer = document.querySelector('#toast');
        var data = { message: '\u4FEE\u6539\u6210\u529F, \u5237\u65B0\u9875\u9762\u540E\u751F\u6548!' };
        snackbarContainer.MaterialSnackbar.showSnackbar(data);
    });
};

var openDialog = function openDialog() {
    if (sysState == 'close') return;
    hotkeys = [];
    chrome.storage.sync.get(editType, function (data) {
        if (data.hasOwnProperty(editType)) {
            hotkeys = data[editType];
        }
        keyToName();
        document.getElementsByClassName('hot-key-dialog')[0].style.display = 'flex';
        document.getElementById('hotkey').focus();
    });
};
var closeDialog = function closeDialog() {
    document.getElementsByClassName('hot-key-dialog')[0].style.display = 'none';
};
var initSetLabel = function initSetLabel() {
    chrome.storage.sync.get('open', function (data) {
        if (data.hasOwnProperty('open')) {
            var label = keyToLabel(data.open);
            document.getElementById('openLabel').innerText = label;
        } else {
            document.getElementById('openLabel').innerText = '(shift+enter)';
        }
    });
    chrome.storage.sync.get('close', function (data) {
        if (data.hasOwnProperty('close')) {
            var label = keyToLabel(data.close);
            document.getElementById('closeLabel').innerText = label;
        } else {
            document.getElementById('closeLabel').innerText = '(esc)';
        }
    });
};
var switchState = function switchState() {
    chrome.storage.sync.get('state', function (data) {
        if (data.hasOwnProperty('state')) {
            sysState = data.state;
        } else {
            sysState = 'open';
        }
    });
};
switchState();
addEvents();
initSetLabel();

},{"keycode":2}],2:[function(require,module,exports){
// Source: http://jsfiddle.net/vWx8V/
// http://stackoverflow.com/questions/5603195/full-list-of-javascript-keycodes

/**
 * Conenience method returns corresponding value for given keyName or keyCode.
 *
 * @param {Mixed} keyCode {Number} or keyName {String}
 * @return {Mixed}
 * @api public
 */

function keyCode(searchInput) {
  // Keyboard Events
  if (searchInput && 'object' === typeof searchInput) {
    var hasKeyCode = searchInput.which || searchInput.keyCode || searchInput.charCode
    if (hasKeyCode) searchInput = hasKeyCode
  }

  // Numbers
  if ('number' === typeof searchInput) return names[searchInput]

  // Everything else (cast to string)
  var search = String(searchInput)

  // check codes
  var foundNamedKey = codes[search.toLowerCase()]
  if (foundNamedKey) return foundNamedKey

  // check aliases
  var foundNamedKey = aliases[search.toLowerCase()]
  if (foundNamedKey) return foundNamedKey

  // weird character?
  if (search.length === 1) return search.charCodeAt(0)

  return undefined
}

/**
 * Compares a keyboard event with a given keyCode or keyName.
 *
 * @param {Event} event Keyboard event that should be tested
 * @param {Mixed} keyCode {Number} or keyName {String}
 * @return {Boolean}
 * @api public
 */
keyCode.isEventKey = function isEventKey(event, nameOrCode) {
  if (event && 'object' === typeof event) {
    var keyCode = event.which || event.keyCode || event.charCode
    if (keyCode === null || keyCode === undefined) { return false; }
    if (typeof nameOrCode === 'string') {
      // check codes
      var foundNamedKey = codes[nameOrCode.toLowerCase()]
      if (foundNamedKey) { return foundNamedKey === keyCode; }
    
      // check aliases
      var foundNamedKey = aliases[nameOrCode.toLowerCase()]
      if (foundNamedKey) { return foundNamedKey === keyCode; }
    } else if (typeof nameOrCode === 'number') {
      return nameOrCode === keyCode;
    }
    return false;
  }
}

exports = module.exports = keyCode;

/**
 * Get by name
 *
 *   exports.code['enter'] // => 13
 */

var codes = exports.code = exports.codes = {
  'backspace': 8,
  'tab': 9,
  'enter': 13,
  'shift': 16,
  'ctrl': 17,
  'alt': 18,
  'pause/break': 19,
  'caps lock': 20,
  'esc': 27,
  'space': 32,
  'page up': 33,
  'page down': 34,
  'end': 35,
  'home': 36,
  'left': 37,
  'up': 38,
  'right': 39,
  'down': 40,
  'insert': 45,
  'delete': 46,
  'command': 91,
  'left command': 91,
  'right command': 93,
  'numpad *': 106,
  'numpad +': 107,
  'numpad -': 109,
  'numpad .': 110,
  'numpad /': 111,
  'num lock': 144,
  'scroll lock': 145,
  'my computer': 182,
  'my calculator': 183,
  ';': 186,
  '=': 187,
  ',': 188,
  '-': 189,
  '.': 190,
  '/': 191,
  '`': 192,
  '[': 219,
  '\\': 220,
  ']': 221,
  "'": 222
}

// Helper aliases

var aliases = exports.aliases = {
  'windows': 91,
  '⇧': 16,
  '⌥': 18,
  '⌃': 17,
  '⌘': 91,
  'ctl': 17,
  'control': 17,
  'option': 18,
  'pause': 19,
  'break': 19,
  'caps': 20,
  'return': 13,
  'escape': 27,
  'spc': 32,
  'spacebar': 32,
  'pgup': 33,
  'pgdn': 34,
  'ins': 45,
  'del': 46,
  'cmd': 91
}

/*!
 * Programatically add the following
 */

// lower case chars
for (i = 97; i < 123; i++) codes[String.fromCharCode(i)] = i - 32

// numbers
for (var i = 48; i < 58; i++) codes[i - 48] = i

// function keys
for (i = 1; i < 13; i++) codes['f'+i] = i + 111

// numpad keys
for (i = 0; i < 10; i++) codes['numpad '+i] = i + 96

/**
 * Get by code
 *
 *   exports.name[13] // => 'Enter'
 */

var names = exports.names = exports.title = {} // title for backward compat

// Create reverse mapping
for (i in codes) names[codes[i]] = i

// Add aliases
for (var alias in aliases) {
  codes[alias] = aliases[alias]
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXZTcmMvcG9wdXAuanMiLCJub2RlX21vZHVsZXMva2V5Y29kZS9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDR0E7Ozs7OztBQUhBLElBQUksVUFBVSxFQUFkO0FBQ0EsSUFBSSxXQUFXLEVBQWY7QUFDQSxJQUFJLFdBQVcsTUFBZjs7QUFFQSxJQUFNLFlBQVksU0FBWixTQUFZLEdBQU07QUFDcEIsYUFBUyxjQUFULENBQXdCLFVBQXhCLEVBQW9DLGdCQUFwQyxDQUFxRCxPQUFyRCxFQUE4RCxVQUFDLENBQUQsRUFBTztBQUNqRSxtQkFBVyxNQUFYO0FBQ0E7QUFDSCxLQUhEO0FBSUEsYUFBUyxjQUFULENBQXdCLFdBQXhCLEVBQXFDLGdCQUFyQyxDQUFzRCxPQUF0RCxFQUErRCxVQUFDLENBQUQsRUFBTztBQUNsRSxtQkFBVyxPQUFYO0FBQ0E7QUFDSCxLQUhEO0FBSUEsYUFBUyxjQUFULENBQXdCLGNBQXhCLEVBQXdDLGdCQUF4QyxDQUF5RCxPQUF6RCxFQUFrRSxVQUFDLENBQUQsRUFBTztBQUNyRTtBQUNILEtBRkQ7QUFHQSxhQUFTLGNBQVQsQ0FBd0IsZUFBeEIsRUFBeUMsZ0JBQXpDLENBQTBELE9BQTFELEVBQW1FLFVBQUMsQ0FBRCxFQUFPO0FBQ3RFLFlBQUcsUUFBUSxNQUFSLEdBQWlCLENBQXBCLEVBQXVCO0FBQ25CO0FBQ0g7QUFDRDtBQUNILEtBTEQ7QUFNQSxhQUFTLGNBQVQsQ0FBd0IsUUFBeEIsRUFBa0MsZ0JBQWxDLENBQW1ELFNBQW5ELEVBQThELFVBQUMsQ0FBRCxFQUFPO0FBQ2pFLFlBQUksT0FBTyxFQUFFLE9BQWI7QUFDQSxZQUFHLFFBQVEsT0FBUixDQUFnQixJQUFoQixLQUF5QixDQUFDLENBQTdCLEVBQWdDO0FBQzVCLG9CQUFRLElBQVIsQ0FBYSxJQUFiO0FBQ0g7QUFDRCxVQUFFLGNBQUY7QUFDSCxLQU5EO0FBT0Es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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImxldCBob3RrZXlzID0gW107XG5sZXQgZWRpdFR5cGUgPSAnJztcbmxldCBzeXNTdGF0ZSA9ICdvcGVuJztcbmltcG9ydCBrZXljb2RlIGZyb20gJ2tleWNvZGUnO1xuY29uc3QgYWRkRXZlbnRzID0gKCkgPT4ge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlZGl0T3BlbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgZWRpdFR5cGUgPSAnb3Blbic7XG4gICAgICAgIG9wZW5EaWFsb2coKTtcbiAgICB9KTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZWRpdENsb3NlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICBlZGl0VHlwZSA9ICdjbG9zZSc7XG4gICAgICAgIG9wZW5EaWFsb2coKTtcbiAgICB9KTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nQ2FuY2VsJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICBjbG9zZURpYWxvZygpO1xuICAgIH0pO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dDb25maXJtJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICBpZihob3RrZXlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNhdmVIb3RLZXkoKTtcbiAgICAgICAgfVxuICAgICAgICBjbG9zZURpYWxvZygpO1xuICAgIH0pO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdob3RrZXknKS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IHtcbiAgICAgICAgbGV0IGNvZGUgPSBlLmtleUNvZGU7XG4gICAgICAgIGlmKGhvdGtleXMuaW5kZXhPZihjb2RlKSA9PSAtMSkge1xuICAgICAgICAgICAgaG90a2V5cy5wdXNoKGNvZGUpO1xuICAgICAgICB9XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9KTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaG90a2V5JykuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCAoZSkgPT4ge1xuICAgICAgICBrZXlUb05hbWUoKTtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2hvdGtleScpLmJsdXIoKTtcbiAgICAgICAgbGV0IGNsYXNzTmFtZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaG90a2V5V3JhcCcpLmNsYXNzTmFtZTtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2hvdGtleVdyYXAnKS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgYCR7Y2xhc3NOYW1lc30gaXMtZGlydHlgKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0pO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdob3RrZXknKS5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIChlKSA9PiB7XG4gICAgICAgIGhvdGtleXMgPSBbXTtcbiAgICB9KTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaXNPcGVuJykuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGUpID0+IHtcbiAgICAgICAgbGV0IHN0YXRlID0gZS50YXJnZXQuY2hlY2tlZD8nb3Blbic6J2Nsb3NlJztcbiAgICAgICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5zZXQoe3N0YXRlOiBzdGF0ZX0sICgpID0+IHtcbiAgICAgICAgICAgIHN3aXRjaFN0YXRlKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcbmNvbnN0IGtleVRvTmFtZSA9ICgpID0+IHtcbiAgICBsZXQga2V5TmFtZXMgPSBgYDtcbiAgICBob3RrZXlzLm1hcCgoZGF0YSwgaykgPT4ge1xuICAgICAgICBrZXlOYW1lcyArPSBgJHtrZXljb2RlLm5hbWVzW2RhdGFdfSR7ayA8IChob3RrZXlzLmxlbmd0aCAtIDEpPycgKyAnOicnfWA7XG4gICAgfSk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2hvdGtleScpLnZhbHVlID0ga2V5TmFtZXM7XG59O1xuXG5jb25zdCBrZXlUb0xhYmVsID0gKGtleXMpID0+IHtcbiAgICBsZXQga2V5TmFtZXMgPSBgKGA7XG4gICAga2V5cy5tYXAoKGRhdGEsIGspID0+IHtcbiAgICAgICAga2V5TmFtZXMgKz0gYCR7a2V5Y29kZS5uYW1lc1tkYXRhXX0ke2sgPCAoa2V5cy5sZW5ndGggLSAxKT8nKyc6Jyd9YDtcbiAgICB9KTtcbiAgICBrZXlOYW1lcyArPSBgKWA7XG4gICAgcmV0dXJuIGtleU5hbWVzO1xufTtcblxuY29uc3Qgc2F2ZUhvdEtleSA9ICgpID0+IHtcbiAgICBsZXQgb2JqID0ge307XG4gICAgb2JqW2VkaXRUeXBlXSA9IGhvdGtleXM7XG4gICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5zZXQob2JqLCAoKSA9PiB7XG4gICAgICAgIGluaXRTZXRMYWJlbCgpO1xuICAgICAgICBsZXQgc25hY2tiYXJDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdG9hc3QnKTtcbiAgICAgICAgbGV0IGRhdGEgPSB7bWVzc2FnZTogYOS/ruaUueaIkOWKnywg5Yi35paw6aG16Z2i5ZCO55Sf5pWIIWB9O1xuICAgICAgICBzbmFja2JhckNvbnRhaW5lci5NYXRlcmlhbFNuYWNrYmFyLnNob3dTbmFja2JhcihkYXRhKTtcbiAgICB9KTtcbn07XG5cbmNvbnN0IG9wZW5EaWFsb2cgPSAoKSA9PiB7XG4gICAgaWYoc3lzU3RhdGUgPT0gJ2Nsb3NlJykgcmV0dXJuO1xuICAgIGhvdGtleXMgPSBbXTtcbiAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLmdldChlZGl0VHlwZSwgKGRhdGEpID0+IHtcbiAgICAgICAgaWYoZGF0YS5oYXNPd25Qcm9wZXJ0eShlZGl0VHlwZSkpIHtcbiAgICAgICAgICAgIGhvdGtleXMgPSBkYXRhW2VkaXRUeXBlXTtcbiAgICAgICAgfVxuICAgICAgICBrZXlUb05hbWUoKTtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnaG90LWtleS1kaWFsb2cnKVswXS5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaG90a2V5JykuZm9jdXMoKTtcbiAgICB9KTtcbn07XG5jb25zdCBjbG9zZURpYWxvZyA9ICgpID0+IHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdob3Qta2V5LWRpYWxvZycpWzBdLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG59O1xuY29uc3QgaW5pdFNldExhYmVsID0gKCkgPT4ge1xuICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KCdvcGVuJywgKGRhdGEpID0+IHtcbiAgICAgICAgaWYoZGF0YS5oYXNPd25Qcm9wZXJ0eSgnb3BlbicpKSB7XG4gICAgICAgICAgICBsZXQgbGFiZWwgPSBrZXlUb0xhYmVsKGRhdGEub3Blbik7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3BlbkxhYmVsJykuaW5uZXJUZXh0ID0gbGFiZWw7XG4gICAgICAgIH1lbHNlIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvcGVuTGFiZWwnKS5pbm5lclRleHQgPSBgKHNoaWZ0K2VudGVyKWA7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLmdldCgnY2xvc2UnLCAoZGF0YSkgPT4ge1xuICAgICAgICBpZihkYXRhLmhhc093blByb3BlcnR5KCdjbG9zZScpKSB7XG4gICAgICAgICAgICBsZXQgbGFiZWwgPSBrZXlUb0xhYmVsKGRhdGEuY2xvc2UpO1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Nsb3NlTGFiZWwnKS5pbm5lclRleHQgPSBsYWJlbDtcbiAgICAgICAgfWVsc2Uge1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Nsb3NlTGFiZWwnKS5pbm5lclRleHQgPSBgKGVzYylgO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuY29uc3Qgc3dpdGNoU3RhdGUgPSAoKSA9PiB7XG4gICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQoJ3N0YXRlJywgKGRhdGEpID0+IHtcbiAgICAgICAgaWYoZGF0YS5oYXNPd25Qcm9wZXJ0eSgnc3RhdGUnKSkge1xuICAgICAgICAgICAgc3lzU3RhdGUgPSBkYXRhLnN0YXRlO1xuICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgICBzeXNTdGF0ZSA9ICdvcGVuJztcbiAgICAgICAgfVxuICAgIH0pO1xufTtcbnN3aXRjaFN0YXRlKCk7XG5hZGRFdmVudHMoKTtcbmluaXRTZXRMYWJlbCgpOyIsIi8vIFNvdXJjZTogaHR0cDovL2pzZmlkZGxlLm5ldC92V3g4Vi9cbi8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTYwMzE5NS9mdWxsLWxpc3Qtb2YtamF2YXNjcmlwdC1rZXljb2Rlc1xuXG4vKipcbiAqIENvbmVuaWVuY2UgbWV0aG9kIHJldHVybnMgY29ycmVzcG9uZGluZyB2YWx1ZSBmb3IgZ2l2ZW4ga2V5TmFtZSBvciBrZXlDb2RlLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IGtleUNvZGUge051bWJlcn0gb3Iga2V5TmFtZSB7U3RyaW5nfVxuICogQHJldHVybiB7TWl4ZWR9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGtleUNvZGUoc2VhcmNoSW5wdXQpIHtcbiAgLy8gS2V5Ym9hcmQgRXZlbnRzXG4gIGlmIChzZWFyY2hJbnB1dCAmJiAnb2JqZWN0JyA9PT0gdHlwZW9mIHNlYXJjaElucHV0KSB7XG4gICAgdmFyIGhhc0tleUNvZGUgPSBzZWFyY2hJbnB1dC53aGljaCB8fCBzZWFyY2hJbnB1dC5rZXlDb2RlIHx8IHNlYXJjaElucHV0LmNoYXJDb2RlXG4gICAgaWYgKGhhc0tleUNvZGUpIHNlYXJjaElucHV0ID0gaGFzS2V5Q29kZVxuICB9XG5cbiAgLy8gTnVtYmVyc1xuICBpZiAoJ251bWJlcicgPT09IHR5cGVvZiBzZWFyY2hJbnB1dCkgcmV0dXJuIG5hbWVzW3NlYXJjaElucHV0XVxuXG4gIC8vIEV2ZXJ5dGhpbmcgZWxzZSAoY2FzdCB0byBzdHJpbmcpXG4gIHZhciBzZWFyY2ggPSBTdHJpbmcoc2VhcmNoSW5wdXQpXG5cbiAgLy8gY2hlY2sgY29kZXNcbiAgdmFyIGZvdW5kTmFtZWRLZXkgPSBjb2Rlc1tzZWFyY2gudG9Mb3dlckNhc2UoKV1cbiAgaWYgKGZvdW5kTmFtZWRLZXkpIHJldHVybiBmb3VuZE5hbWVkS2V5XG5cbiAgLy8gY2hlY2sgYWxpYXNlc1xuICB2YXIgZm91bmROYW1lZEtleSA9IGFsaWFzZXNbc2VhcmNoLnRvTG93ZXJDYXNlKCldXG4gIGlmIChmb3VuZE5hbWVkS2V5KSByZXR1cm4gZm91bmROYW1lZEtleVxuXG4gIC8vIHdlaXJkIGNoYXJhY3Rlcj9cbiAgaWYgKHNlYXJjaC5sZW5ndGggPT09IDEpIHJldHVybiBzZWFyY2guY2hhckNvZGVBdCgwKVxuXG4gIHJldHVybiB1bmRlZmluZWRcbn1cblxuLyoqXG4gKiBDb21wYXJlcyBhIGtleWJvYXJkIGV2ZW50IHdpdGggYSBnaXZlbiBrZXlDb2RlIG9yIGtleU5hbWUuXG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXZlbnQgS2V5Ym9hcmQgZXZlbnQgdGhhdCBzaG91bGQgYmUgdGVzdGVkXG4gKiBAcGFyYW0ge01peGVkfSBrZXlDb2RlIHtOdW1iZXJ9IG9yIGtleU5hbWUge1N0cmluZ31cbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5rZXlDb2RlLmlzRXZlbnRLZXkgPSBmdW5jdGlvbiBpc0V2ZW50S2V5KGV2ZW50LCBuYW1lT3JDb2RlKSB7XG4gIGlmIChldmVudCAmJiAnb2JqZWN0JyA9PT0gdHlwZW9mIGV2ZW50KSB7XG4gICAgdmFyIGtleUNvZGUgPSBldmVudC53aGljaCB8fCBldmVudC5rZXlDb2RlIHx8IGV2ZW50LmNoYXJDb2RlXG4gICAgaWYgKGtleUNvZGUgPT09IG51bGwgfHwga2V5Q29kZSA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiBmYWxzZTsgfVxuICAgIGlmICh0eXBlb2YgbmFtZU9yQ29kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIC8vIGNoZWNrIGNvZGVzXG4gICAgICB2YXIgZm91bmROYW1lZEtleSA9IGNvZGVzW25hbWVPckNvZGUudG9Mb3dlckNhc2UoKV1cbiAgICAgIGlmIChmb3VuZE5hbWVkS2V5KSB7IHJldHVybiBmb3VuZE5hbWVkS2V5ID09PSBrZXlDb2RlOyB9XG4gICAgXG4gICAgICAvLyBjaGVjayBhbGlhc2VzXG4gICAgICB2YXIgZm91bmROYW1lZEtleSA9IGFsaWFzZXNbbmFtZU9yQ29kZS50b0xvd2VyQ2FzZSgpXVxuICAgICAgaWYgKGZvdW5kTmFtZWRLZXkpIHsgcmV0dXJuIGZvdW5kTmFtZWRLZXkgPT09IGtleUNvZGU7IH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBuYW1lT3JDb2RlID09PSAnbnVtYmVyJykge1xuICAgICAgcmV0dXJuIG5hbWVPckNvZGUgPT09IGtleUNvZGU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBrZXlDb2RlO1xuXG4vKipcbiAqIEdldCBieSBuYW1lXG4gKlxuICogICBleHBvcnRzLmNvZGVbJ2VudGVyJ10gLy8gPT4gMTNcbiAqL1xuXG52YXIgY29kZXMgPSBleHBvcnRzLmNvZGUgPSBleHBvcnRzLmNvZGVzID0ge1xuICAnYmFja3NwYWNlJzogOCxcbiAgJ3RhYic6IDksXG4gICdlbnRlcic6IDEzLFxuICAnc2hpZnQnOiAxNixcbiAgJ2N0cmwnOiAxNyxcbiAgJ2FsdCc6IDE4LFxuICAncGF1c2UvYnJlYWsnOiAxOSxcbiAgJ2NhcHMgbG9jayc6IDIwLFxuICAnZXNjJzogMjcsXG4gICdzcGFjZSc6IDMyLFxuICAncGFnZSB1cCc6IDMzLFxuICAncGFnZSBkb3duJzogMzQsXG4gICdlbmQnOiAzNSxcbiAgJ2hvbWUnOiAzNixcbiAgJ2xlZnQnOiAzNyxcbiAgJ3VwJzogMzgsXG4gICdyaWdodCc6IDM5LFxuICAnZG93bic6IDQwLFxuICAnaW5zZXJ0JzogNDUsXG4gICdkZWxldGUnOiA0NixcbiAgJ2NvbW1hbmQnOiA5MSxcbiAgJ2xlZnQgY29tbWFuZCc6IDkxLFxuICAncmlnaHQgY29tbWFuZCc6IDkzLFxuICAnbnVtcGFkIConOiAxMDYsXG4gICdudW1wYWQgKyc6IDEwNyxcbiAgJ251bXBhZCAtJzogMTA5LFxuICAnbnVtcGFkIC4nOiAxMTAsXG4gICdudW1wYWQgLyc6IDExMSxcbiAgJ251bSBsb2NrJzogMTQ0LFxuICAnc2Nyb2xsIGxvY2snOiAxNDUsXG4gICdteSBjb21wdXRlcic6IDE4MixcbiAgJ215IGNhbGN1bGF0b3InOiAxODMsXG4gICc7JzogMTg2LFxuICAnPSc6IDE4NyxcbiAgJywnOiAxODgsXG4gICctJzogMTg5LFxuICAnLic6IDE5MCxcbiAgJy8nOiAxOTEsXG4gICdgJzogMTkyLFxuICAnWyc6IDIxOSxcbiAgJ1xcXFwnOiAyMjAsXG4gICddJzogMjIxLFxuICBcIidcIjogMjIyXG59XG5cbi8vIEhlbHBlciBhbGlhc2VzXG5cbnZhciBhbGlhc2VzID0gZXhwb3J0cy5hbGlhc2VzID0ge1xuICAnd2luZG93cyc6IDkxLFxuICAn4oenJzogMTYsXG4gICfijKUnOiAxOCxcbiAgJ+KMgyc6IDE3LFxuICAn4oyYJzogOTEsXG4gICdjdGwnOiAxNyxcbiAgJ2NvbnRyb2wnOiAxNyxcbiAgJ29wdGlvbic6IDE4LFxuICAncGF1c2UnOiAxOSxcbiAgJ2JyZWFrJzogMTksXG4gICdjYXBzJzogMjAsXG4gICdyZXR1cm4nOiAxMyxcbiAgJ2VzY2FwZSc6IDI3LFxuICAnc3BjJzogMzIsXG4gICdzcGFjZWJhcic6IDMyLFxuICAncGd1cCc6IDMzLFxuICAncGdkbic6IDM0LFxuICAnaW5zJzogNDUsXG4gICdkZWwnOiA0NixcbiAgJ2NtZCc6IDkxXG59XG5cbi8qIVxuICogUHJvZ3JhbWF0aWNhbGx5IGFkZCB0aGUgZm9sbG93aW5nXG4gKi9cblxuLy8gbG93ZXIgY2FzZSBjaGFyc1xuZm9yIChpID0gOTc7IGkgPCAxMjM7IGkrKykgY29kZXNbU3RyaW5nLmZyb21DaGFyQ29kZShpKV0gPSBpIC0gMzJcblxuLy8gbnVtYmVyc1xuZm9yICh2YXIgaSA9IDQ4OyBpIDwgNTg7IGkrKykgY29kZXNbaSAtIDQ4XSA9IGlcblxuLy8gZnVuY3Rpb24ga2V5c1xuZm9yIChpID0gMTsgaSA8IDEzOyBpKyspIGNvZGVzWydmJytpXSA9IGkgKyAxMTFcblxuLy8gbnVtcGFkIGtleXNcbmZvciAoaSA9IDA7IGkgPCAxMDsgaSsrKSBjb2Rlc1snbnVtcGFkICcraV0gPSBpICsgOTZcblxuLyoqXG4gKiBHZXQgYnkgY29kZVxuICpcbiAqICAgZXhwb3J0cy5uYW1lWzEzXSAvLyA9PiAnRW50ZXInXG4gKi9cblxudmFyIG5hbWVzID0gZXhwb3J0cy5uYW1lcyA9IGV4cG9ydHMudGl0bGUgPSB7fSAvLyB0aXRsZSBmb3IgYmFja3dhcmQgY29tcGF0XG5cbi8vIENyZWF0ZSByZXZlcnNlIG1hcHBpbmdcbmZvciAoaSBpbiBjb2RlcykgbmFtZXNbY29kZXNbaV1dID0gaVxuXG4vLyBBZGQgYWxpYXNlc1xuZm9yICh2YXIgYWxpYXMgaW4gYWxpYXNlcykge1xuICBjb2Rlc1thbGlhc10gPSBhbGlhc2VzW2FsaWFzXVxufVxuIl19
