(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Readability = require('./lib/Readability');

var _Readability2 = _interopRequireDefault(_Readability);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ClearRead = function () {
    function ClearRead() {
        _classCallCheck(this, ClearRead);

        this.tpl = null;
        this.active = false;
        this.hotkeys = [];
        this.addEvents();
    }

    _createClass(ClearRead, [{
        key: 'addReadPage',
        value: function addReadPage() {
            if (this.active) return;
            if (!this.tpl) {
                var article = new _Readability2.default(document).parse();
                this.tpl = '<div class="center-area" id="clearReadCenterArea">\n                            <div class="article">\n                                <h1 class="title">' + article.title + '</h1>\n                                <div class="content">' + article.content + '</div>\n                            </div>\n                        </div>';
            }
            var div = document.createElement('div');
            div.id = 'clearRead';
            div.setAttribute('class', 'clearread-mode');
            div.innerHTML = this.tpl;
            document.body.appendChild(div);
            document.body.style.overflow = 'hidden';
            var imgs = div.getElementsByTagName('img');
            var areaWidth = document.getElementById('clearReadCenterArea').clientWidth;
            for (var i = 0; i < imgs.length; i++) {
                var width = imgs[i].naturalWidth;
                if (width) {
                    var centerAreaWidth = areaWidth;
                    if (width < centerAreaWidth - 140) {
                        imgs[i].setAttribute('class', 'img-c');
                    }
                }
                imgs[i].onload = function () {
                    var width = this.naturalWidth;
                    var centerAreaWidth = areaWidth;
                    if (width < centerAreaWidth - 140) {
                        this.setAttribute('class', 'img-c');
                    }
                };
            }
            this.active = true;
            setTimeout(function () {
                div.setAttribute('class', 'clearread-mode clearread-mode-show');
                document.getElementById('clearReadCenterArea').setAttribute('class', 'center-area center-area-show');
            });
        }
    }, {
        key: 'removeReadPage',
        value: function removeReadPage() {
            var _this = this;

            if (!this.active) return;
            var clearRead = document.getElementById('clearRead');
            var clearReadCenterArea = document.getElementById('clearReadCenterArea');
            clearReadCenterArea.setAttribute('class', 'center-area');
            setTimeout(function () {
                clearRead.setAttribute('class', 'clearread-mode');
                setTimeout(function () {
                    document.body.style.overflow = '';
                    var parentNode = clearRead.parentNode;
                    parentNode.removeChild(clearRead);
                    _this.active = false;
                }, 250);
            }, 100);
        }
    }, {
        key: 'addEvents',
        value: function addEvents() {
            var _this2 = this;

            document.addEventListener('keydown', function (e) {
                var code = e.keyCode;
                if (_this2.hotkeys.indexOf(code) == -1) {
                    _this2.hotkeys.push(code);
                }
            });
            document.addEventListener('keyup', function (e) {
                chrome.storage.sync.get(function (data) {
                    if (data.hasOwnProperty('state') && data.state == 'close') return;
                    if (data.hasOwnProperty('open')) {
                        var openkeys = data.open;
                        if (JSON.stringify(_this2.hotkeys) == JSON.stringify(openkeys)) {
                            _this2.addReadPage();
                        }
                    } else {
                        if (e.shiftKey && e.keyCode == 13) {
                            _this2.addReadPage();
                        }
                    }
                    if (data.hasOwnProperty('close')) {
                        var closekeys = data.close;
                        if (JSON.stringify(_this2.hotkeys) == JSON.stringify(closekeys)) {
                            _this2.removeReadPage();
                        }
                    } else {
                        if (e.keyCode == 27) {
                            _this2.removeReadPage();
                        }
                    }
                    _this2.hotkeys = [];
                });
            });
        }
    }]);

    return ClearRead;
}();

var clearRead = new ClearRead();

},{"./lib/Readability":2}],2:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*eslint-env es6:false*/
/*
 * Copyright (c) 2010 Arc90 Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * This code is heavily based on Arc90's readability.js (1.7.1) script
 * available at: http://code.google.com/p/arc90labs-readability
 */

/**
 * Public constructor.
 * @param {HTMLDocument} doc     The document to parse.
 * @param {Object}       options The options object.
 */
function Readability(doc, options) {
  // In some older versions, people passed a URI as the first argument. Cope:
  if (options && options.documentElement) {
    doc = options;
    options = arguments[2];
  } else if (!doc || !doc.documentElement) {
    throw new Error("First argument to Readability constructor should be a document object.");
  }
  options = options || {};

  this._doc = doc;
  this._body = doc.body.cloneNode(true);
  this._articleTitle = null;
  this._articleByline = null;
  this._articleDir = null;
  this._attempts = [];

  // Configurable options
  this._debug = !!options.debug;
  this._maxElemsToParse = options.maxElemsToParse || this.DEFAULT_MAX_ELEMS_TO_PARSE;
  this._nbTopCandidates = options.nbTopCandidates || this.DEFAULT_N_TOP_CANDIDATES;
  this._charThreshold = options.charThreshold || this.DEFAULT_CHAR_THRESHOLD;
  this._classesToPreserve = this.CLASSES_TO_PRESERVE.concat(options.classesToPreserve || []);

  // Start with all flags set
  this._flags = this.FLAG_STRIP_UNLIKELYS | this.FLAG_WEIGHT_CLASSES | this.FLAG_CLEAN_CONDITIONALLY;

  var logEl;

  // Control whether log messages are sent to the console
  if (this._debug) {
    logEl = function logEl(e) {
      var rv = e.nodeName + " ";
      if (e.nodeType == e.TEXT_NODE) {
        return rv + '("' + e.textContent + '")';
      }
      var classDesc = e.className && "." + e.className.replace(/ /g, ".");
      var elDesc = "";
      if (e.id) elDesc = "(#" + e.id + classDesc + ")";else if (classDesc) elDesc = "(" + classDesc + ")";
      return rv + elDesc;
    };
    this.log = function () {
      if (typeof dump !== "undefined") {
        var msg = Array.prototype.map.call(arguments, function (x) {
          return x && x.nodeName ? logEl(x) : x;
        }).join(" ");
        dump("Reader: (Readability) " + msg + "\n");
      } else if (typeof console !== "undefined") {
        var args = ["Reader: (Readability) "].concat(arguments);
        console.log.apply(console, args);
      }
    };
  } else {
    this.log = function () {};
  }
}

Readability.prototype = {
  FLAG_STRIP_UNLIKELYS: 0x1,
  FLAG_WEIGHT_CLASSES: 0x2,
  FLAG_CLEAN_CONDITIONALLY: 0x4,

  // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
  ELEMENT_NODE: 1,
  TEXT_NODE: 3,

  // Max number of nodes supported by this parser. Default: 0 (no limit)
  DEFAULT_MAX_ELEMS_TO_PARSE: 0,

  // The number of top candidates to consider when analysing how
  // tight the competition is among candidates.
  DEFAULT_N_TOP_CANDIDATES: 5,

  // Element tags to score by default.
  DEFAULT_TAGS_TO_SCORE: "section,h2,h3,h4,h5,h6,p,td,pre".toUpperCase().split(","),

  // The default number of chars an article must have in order to return a result
  DEFAULT_CHAR_THRESHOLD: 500,

  // All of the regular expressions in use within readability.
  // Defined up here so we don't instantiate them repeatedly in loops.
  REGEXPS: {
    unlikelyCandidates: /-ad-|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|foot|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,
    okMaybeItsACandidate: /and|article|body|column|main|shadow/i,
    positive: /article|body|content|entry|hentry|h-entry|main|page|pagination|post|text|blog|story/i,
    negative: /hidden|^hid$| hid$| hid |^hid |banner|combx|comment|com-|contact|foot|footer|footnote|masthead|media|meta|outbrain|promo|related|scroll|share|shoutbox|sidebar|skyscraper|sponsor|shopping|tags|tool|widget/i,
    extraneous: /print|archive|comment|discuss|e[\-]?mail|share|reply|all|login|sign|single|utility/i,
    byline: /byline|author|dateline|writtenby|p-author/i,
    replaceFonts: /<(\/?)font[^>]*>/gi,
    normalize: /\s{2,}/g,
    videos: /\/\/(www\.)?(dailymotion|youtube|youtube-nocookie|player\.vimeo)\.com/i,
    nextLink: /(next|weiter|continue|>([^\|]|$)|»([^\|]|$))/i,
    prevLink: /(prev|earl|old|new|<|«)/i,
    whitespace: /^\s*$/,
    hasContent: /\S$/
  },

  DIV_TO_P_ELEMS: ["A", "BLOCKQUOTE", "DL", "DIV", "IMG", "OL", "P", "PRE", "TABLE", "UL", "SELECT"],

  ALTER_TO_DIV_EXCEPTIONS: ["DIV", "ARTICLE", "SECTION", "P"],

  PRESENTATIONAL_ATTRIBUTES: ["align", "background", "bgcolor", "border", "cellpadding", "cellspacing", "frame", "hspace", "rules", "style", "valign", "vspace"],

  DEPRECATED_SIZE_ATTRIBUTE_ELEMS: ["TABLE", "TH", "TD", "HR", "PRE"],

  // The commented out elements qualify as phrasing content but tend to be
  // removed by readability when put into paragraphs, so we ignore them here.
  PHRASING_ELEMS: [
  // "CANVAS", "IFRAME", "SVG", "VIDEO",
  "ABBR", "AUDIO", "B", "BDO", "BR", "BUTTON", "CITE", "CODE", "DATA", "DATALIST", "DFN", "EM", "EMBED", "I", "IMG", "INPUT", "KBD", "LABEL", "MARK", "MATH", "METER", "NOSCRIPT", "OBJECT", "OUTPUT", "PROGRESS", "Q", "RUBY", "SAMP", "SCRIPT", "SELECT", "SMALL", "SPAN", "STRONG", "SUB", "SUP", "TEXTAREA", "TIME", "VAR", "WBR"],

  // These are the classes that readability sets itself.
  CLASSES_TO_PRESERVE: ["page"],

  /**
   * Run any post-process modifications to article content as necessary.
   *
   * @param Element
   * @return void
   **/
  _postProcessContent: function _postProcessContent(articleContent) {
    // Readability cannot open relative uris so we convert them to absolute uris.
    this._fixRelativeUris(articleContent);

    // Remove classes.
    this._cleanClasses(articleContent);
  },

  /**
   * Iterates over a NodeList, calls `filterFn` for each node and removes node
   * if function returned `true`.
   *
   * If function is not passed, removes all the nodes in node list.
   *
   * @param NodeList nodeList The nodes to operate on
   * @param Function filterFn the function to use as a filter
   * @return void
   */
  _removeNodes: function _removeNodes(nodeList, filterFn) {
    for (var i = nodeList.length - 1; i >= 0; i--) {
      var node = nodeList[i];
      var parentNode = node.parentNode;
      if (parentNode) {
        if (!filterFn || filterFn.call(this, node, i, nodeList)) {
          parentNode.removeChild(node);
        }
      }
    }
  },

  /**
   * Iterates over a NodeList, and calls _setNodeTag for each node.
   *
   * @param NodeList nodeList The nodes to operate on
   * @param String newTagName the new tag name to use
   * @return void
   */
  _replaceNodeTags: function _replaceNodeTags(nodeList, newTagName) {
    for (var i = nodeList.length - 1; i >= 0; i--) {
      var node = nodeList[i];
      this._setNodeTag(node, newTagName);
    }
  },

  /**
   * Iterate over a NodeList, which doesn't natively fully implement the Array
   * interface.
   *
   * For convenience, the current object context is applied to the provided
   * iterate function.
   *
   * @param  NodeList nodeList The NodeList.
   * @param  Function fn       The iterate function.
   * @return void
   */
  _forEachNode: function _forEachNode(nodeList, fn) {
    Array.prototype.forEach.call(nodeList, fn, this);
  },

  /**
   * Iterate over a NodeList, return true if any of the provided iterate
   * function calls returns true, false otherwise.
   *
   * For convenience, the current object context is applied to the
   * provided iterate function.
   *
   * @param  NodeList nodeList The NodeList.
   * @param  Function fn       The iterate function.
   * @return Boolean
   */
  _someNode: function _someNode(nodeList, fn) {
    return Array.prototype.some.call(nodeList, fn, this);
  },

  /**
   * Iterate over a NodeList, return true if all of the provided iterate
   * function calls return true, false otherwise.
   *
   * For convenience, the current object context is applied to the
   * provided iterate function.
   *
   * @param  NodeList nodeList The NodeList.
   * @param  Function fn       The iterate function.
   * @return Boolean
   */
  _everyNode: function _everyNode(nodeList, fn) {
    return Array.prototype.every.call(nodeList, fn, this);
  },

  /**
   * Concat all nodelists passed as arguments.
   *
   * @return ...NodeList
   * @return Array
   */
  _concatNodeLists: function _concatNodeLists() {
    var slice = Array.prototype.slice;
    var args = slice.call(arguments);
    var nodeLists = args.map(function (list) {
      return slice.call(list);
    });
    return Array.prototype.concat.apply([], nodeLists);
  },

  _getAllNodesWithTag: function _getAllNodesWithTag(node, tagNames) {
    if (node.querySelectorAll) {
      return node.querySelectorAll(tagNames.join(','));
    }
    return [].concat.apply([], tagNames.map(function (tag) {
      var collection = node.getElementsByTagName(tag);
      return Array.isArray(collection) ? collection : Array.from(collection);
    }));
  },

  /**
   * Removes the class="" attribute from every element in the given
   * subtree, except those that match CLASSES_TO_PRESERVE and
   * the classesToPreserve array from the options object.
   *
   * @param Element
   * @return void
   */
  _cleanClasses: function _cleanClasses(node) {
    var classesToPreserve = this._classesToPreserve;
    var className = (node.getAttribute("class") || "").split(/\s+/).filter(function (cls) {
      return classesToPreserve.indexOf(cls) != -1;
    }).join(" ");

    if (className) {
      node.setAttribute("class", className);
    } else {
      node.removeAttribute("class");
    }

    for (node = node.firstElementChild; node; node = node.nextElementSibling) {
      this._cleanClasses(node);
    }
  },

  /**
   * Converts each <a> and <img> uri in the given element to an absolute URI,
   * ignoring #ref URIs.
   *
   * @param Element
   * @return void
   */
  _fixRelativeUris: function _fixRelativeUris(articleContent) {
    var baseURI = this._doc.baseURI;
    var documentURI = this._doc.documentURI;
    function toAbsoluteURI(uri) {
      // Leave hash links alone if the base URI matches the document URI:
      if (baseURI == documentURI && uri.charAt(0) == "#") {
        return uri;
      }
      // Otherwise, resolve against base URI:
      try {
        return new URL(uri, baseURI).href;
      } catch (ex) {
        // Something went wrong, just return the original:
      }
      return uri;
    }

    var links = articleContent.getElementsByTagName("a");
    this._forEachNode(links, function (link) {
      var href = link.getAttribute("href");
      if (href) {
        // Replace links with javascript: URIs with text content, since
        // they won't work after scripts have been removed from the page.
        if (href.indexOf("javascript:") === 0) {
          var text = this._doc.createTextNode(link.textContent);
          link.parentNode.replaceChild(text, link);
        } else {
          link.setAttribute("href", toAbsoluteURI(href));
        }
      }
    });

    var imgs = articleContent.getElementsByTagName("img");
    this._forEachNode(imgs, function (img) {
      var src = img.getAttribute("src");
      if (src) {
        img.setAttribute("src", toAbsoluteURI(src));
      }
    });
  },

  /**
   * Get the article title as an H1.
   *
   * @return void
   **/
  _getArticleTitle: function _getArticleTitle() {
    var doc = this._doc;
    var curTitle = "";
    var origTitle = "";

    try {
      curTitle = origTitle = doc.title.trim();

      // If they had an element with id "title" in their HTML
      if (typeof curTitle !== "string") curTitle = origTitle = this._getInnerText(doc.getElementsByTagName('title')[0]);
    } catch (e) {/* ignore exceptions setting the title. */}

    var titleHadHierarchicalSeparators = false;
    function wordCount(str) {
      return str.split(/\s+/).length;
    }

    // If there's a separator in the title, first remove the final part
    if (/ [\|\-\\\/>»] /.test(curTitle)) {
      titleHadHierarchicalSeparators = / [\\\/>»] /.test(curTitle);
      curTitle = origTitle.replace(/(.*)[\|\-\\\/>»] .*/gi, '$1');

      // If the resulting title is too short (3 words or fewer), remove
      // the first part instead:
      if (wordCount(curTitle) < 3) curTitle = origTitle.replace(/[^\|\-\\\/>»]*[\|\-\\\/>»](.*)/gi, '$1');
    } else if (curTitle.indexOf(': ') !== -1) {
      // Check if we have an heading containing this exact string, so we
      // could assume it's the full title.
      var headings = this._concatNodeLists(doc.getElementsByTagName('h1'), doc.getElementsByTagName('h2'));
      var trimmedTitle = curTitle.trim();
      var match = this._someNode(headings, function (heading) {
        return heading.textContent.trim() === trimmedTitle;
      });

      // If we don't, let's extract the title out of the original title string.
      if (!match) {
        curTitle = origTitle.substring(origTitle.lastIndexOf(':') + 1);

        // If the title is now too short, try the first colon instead:
        if (wordCount(curTitle) < 3) {
          curTitle = origTitle.substring(origTitle.indexOf(':') + 1);
          // But if we have too many words before the colon there's something weird
          // with the titles and the H tags so let's just use the original title instead
        } else if (wordCount(origTitle.substr(0, origTitle.indexOf(':'))) > 5) {
          curTitle = origTitle;
        }
      }
    } else if (curTitle.length > 150 || curTitle.length < 15) {
      var hOnes = doc.getElementsByTagName('h1');

      if (hOnes.length === 1) curTitle = this._getInnerText(hOnes[0]);
    }

    curTitle = curTitle.trim();
    // If we now have 4 words or fewer as our title, and either no
    // 'hierarchical' separators (\, /, > or ») were found in the original
    // title or we decreased the number of words by more than 1 word, use
    // the original title.
    var curTitleWordCount = wordCount(curTitle);
    if (curTitleWordCount <= 4 && (!titleHadHierarchicalSeparators || curTitleWordCount != wordCount(origTitle.replace(/[\|\-\\\/>»]+/g, "")) - 1)) {
      curTitle = origTitle;
    }

    return curTitle;
  },

  /**
   * Prepare the HTML document for readability to scrape it.
   * This includes things like stripping javascript, CSS, and handling terrible markup.
   *
   * @return void
   **/
  _prepDocument: function _prepDocument() {
    var doc = this._doc;

    // Remove all style tags in head
    this._removeNodes(this._body.getElementsByTagName("style"));

    if (this.body) {
      this._replaceBrs(this._body);
    }

    this._replaceNodeTags(this._body.getElementsByTagName("font"), "SPAN");
  },

  /**
   * Finds the next element, starting from the given node, and ignoring
   * whitespace in between. If the given node is an element, the same node is
   * returned.
   */
  _nextElement: function _nextElement(node) {
    var next = node;
    while (next && next.nodeType != this.ELEMENT_NODE && this.REGEXPS.whitespace.test(next.textContent)) {
      next = next.nextSibling;
    }
    return next;
  },

  /**
   * Replaces 2 or more successive <br> elements with a single <p>.
   * Whitespace between <br> elements are ignored. For example:
   *   <div>foo<br>bar<br> <br><br>abc</div>
   * will become:
   *   <div>foo<br>bar<p>abc</p></div>
   */
  _replaceBrs: function _replaceBrs(elem) {
    this._forEachNode(this._getAllNodesWithTag(elem, ["br"]), function (br) {
      var next = br.nextSibling;

      // Whether 2 or more <br> elements have been found and replaced with a
      // <p> block.
      var replaced = false;

      // If we find a <br> chain, remove the <br>s until we hit another element
      // or non-whitespace. This leaves behind the first <br> in the chain
      // (which will be replaced with a <p> later).
      while ((next = this._nextElement(next)) && next.tagName == "BR") {
        replaced = true;
        var brSibling = next.nextSibling;
        next.parentNode.removeChild(next);
        next = brSibling;
      }

      // If we removed a <br> chain, replace the remaining <br> with a <p>. Add
      // all sibling nodes as children of the <p> until we hit another <br>
      // chain.
      if (replaced) {
        var p = this._doc.createElement("p");
        br.parentNode.replaceChild(p, br);

        next = p.nextSibling;
        while (next) {
          // If we've hit another <br><br>, we're done adding children to this <p>.
          if (next.tagName == "BR") {
            var nextElem = this._nextElement(next.nextSibling);
            if (nextElem && nextElem.tagName == "BR") break;
          }

          if (!this._isPhrasingContent(next)) break;

          // Otherwise, make this node a child of the new <p>.
          var sibling = next.nextSibling;
          p.appendChild(next);
          next = sibling;
        }

        while (p.lastChild && this._isWhitespace(p.lastChild)) {
          p.removeChild(p.lastChild);
        }if (p.parentNode.tagName === "P") this._setNodeTag(p.parentNode, "DIV");
      }
    });
  },

  _setNodeTag: function _setNodeTag(node, tag) {
    this.log("_setNodeTag", node, tag);
    if (node.__JSDOMParser__) {
      node.localName = tag.toLowerCase();
      node.tagName = tag.toUpperCase();
      return node;
    }

    var replacement = node.ownerDocument.createElement(tag);
    while (node.firstChild) {
      replacement.appendChild(node.firstChild);
    }
    node.parentNode.replaceChild(replacement, node);
    if (node.readability) replacement.readability = node.readability;

    for (var i = 0; i < node.attributes.length; i++) {
      replacement.setAttribute(node.attributes[i].name, node.attributes[i].value);
    }
    return replacement;
  },

  /**
   * Prepare the article node for display. Clean out any inline styles,
   * iframes, forms, strip extraneous <p> tags, etc.
   *
   * @param Element
   * @return void
   **/
  _prepArticle: function _prepArticle(articleContent) {
    this._cleanStyles(articleContent);

    // Check for data tables before we continue, to avoid removing items in
    // those tables, which will often be isolated even though they're
    // visually linked to other content-ful elements (text, images, etc.).
    this._markDataTables(articleContent);

    // Clean out junk from the article content
    this._cleanConditionally(articleContent, "form");
    this._cleanConditionally(articleContent, "fieldset");
    this._clean(articleContent, "object");
    this._clean(articleContent, "embed");
    this._clean(articleContent, "h1");
    this._clean(articleContent, "footer");
    this._clean(articleContent, "link");
    this._clean(articleContent, "aside");

    // Clean out elements have "share" in their id/class combinations from final top candidates,
    // which means we don't remove the top candidates even they have "share".
    this._forEachNode(articleContent.children, function (topCandidate) {
      this._cleanMatchedNodes(topCandidate, /share/);
    });

    // If there is only one h2 and its text content substantially equals article title,
    // they are probably using it as a header and not a subheader,
    // so remove it since we already extract the title separately.
    var h2 = articleContent.getElementsByTagName('h2');
    if (h2.length === 1) {
      var lengthSimilarRate = (h2[0].textContent.length - this._articleTitle.length) / this._articleTitle.length;
      if (Math.abs(lengthSimilarRate) < 0.5) {
        var titlesMatch = false;
        if (lengthSimilarRate > 0) {
          titlesMatch = h2[0].textContent.includes(this._articleTitle);
        } else {
          titlesMatch = this._articleTitle.includes(h2[0].textContent);
        }
        if (titlesMatch) {
          this._clean(articleContent, "h2");
        }
      }
    }

    this._clean(articleContent, "iframe");
    this._clean(articleContent, "input");
    this._clean(articleContent, "textarea");
    this._clean(articleContent, "select");
    this._clean(articleContent, "button");
    this._cleanHeaders(articleContent);

    // Do these last as the previous stuff may have removed junk
    // that will affect these
    this._cleanConditionally(articleContent, "table");
    this._cleanConditionally(articleContent, "ul");
    this._cleanConditionally(articleContent, "div");

    // Remove extra paragraphs
    this._removeNodes(articleContent.getElementsByTagName('p'), function (paragraph) {
      var imgCount = paragraph.getElementsByTagName('img').length;
      var embedCount = paragraph.getElementsByTagName('embed').length;
      var objectCount = paragraph.getElementsByTagName('object').length;
      // At this point, nasty iframes have been removed, only remain embedded video ones.
      var iframeCount = paragraph.getElementsByTagName('iframe').length;
      var totalCount = imgCount + embedCount + objectCount + iframeCount;

      return totalCount === 0 && !this._getInnerText(paragraph, false);
    });

    this._forEachNode(this._getAllNodesWithTag(articleContent, ["br"]), function (br) {
      var next = this._nextElement(br.nextSibling);
      if (next && next.tagName == "P") br.parentNode.removeChild(br);
    });

    // Remove single-cell tables
    this._forEachNode(this._getAllNodesWithTag(articleContent, ["table"]), function (table) {
      var tbody = this._hasSingleTagInsideElement(table, "TBODY") ? table.firstElementChild : table;
      if (this._hasSingleTagInsideElement(tbody, "TR")) {
        var row = tbody.firstElementChild;
        if (this._hasSingleTagInsideElement(row, "TD")) {
          var cell = row.firstElementChild;
          cell = this._setNodeTag(cell, this._everyNode(cell.childNodes, this._isPhrasingContent) ? "P" : "DIV");
          table.parentNode.replaceChild(cell, table);
        }
      }
    });
  },

  /**
   * Initialize a node with the readability object. Also checks the
   * className/id for special names to add to its score.
   *
   * @param Element
   * @return void
   **/
  _initializeNode: function _initializeNode(node) {
    node.readability = { "contentScore": 0 };

    switch (node.tagName) {
      case 'DIV':
        node.readability.contentScore += 5;
        break;

      case 'PRE':
      case 'TD':
      case 'BLOCKQUOTE':
        node.readability.contentScore += 3;
        break;

      case 'ADDRESS':
      case 'OL':
      case 'UL':
      case 'DL':
      case 'DD':
      case 'DT':
      case 'LI':
      case 'FORM':
        node.readability.contentScore -= 3;
        break;

      case 'H1':
      case 'H2':
      case 'H3':
      case 'H4':
      case 'H5':
      case 'H6':
      case 'TH':
        node.readability.contentScore -= 5;
        break;
    }

    node.readability.contentScore += this._getClassWeight(node);
  },

  _removeAndGetNext: function _removeAndGetNext(node) {
    var nextNode = this._getNextNode(node, true);
    node.parentNode.removeChild(node);
    return nextNode;
  },

  /**
   * Traverse the DOM from node to node, starting at the node passed in.
   * Pass true for the second parameter to indicate this node itself
   * (and its kids) are going away, and we want the next node over.
   *
   * Calling this in a loop will traverse the DOM depth-first.
   */
  _getNextNode: function _getNextNode(node, ignoreSelfAndKids) {
    // First check for kids if those aren't being ignored
    if (!ignoreSelfAndKids && node.firstElementChild) {
      return node.firstElementChild;
    }
    // Then for siblings...
    if (node.nextElementSibling) {
      return node.nextElementSibling;
    }
    // And finally, move up the parent chain *and* find a sibling
    // (because this is depth-first traversal, we will have already
    // seen the parent nodes themselves).
    do {
      node = node.parentNode;
    } while (node && !node.nextElementSibling);
    return node && node.nextElementSibling;
  },

  _checkByline: function _checkByline(node, matchString) {
    if (this._articleByline) {
      return false;
    }

    if (node.getAttribute !== undefined) {
      var rel = node.getAttribute("rel");
    }

    if ((rel === "author" || this.REGEXPS.byline.test(matchString)) && this._isValidByline(node.textContent)) {
      this._articleByline = node.textContent.trim();
      return true;
    }

    return false;
  },

  _getNodeAncestors: function _getNodeAncestors(node, maxDepth) {
    maxDepth = maxDepth || 0;
    var i = 0,
        ancestors = [];
    while (node.parentNode) {
      ancestors.push(node.parentNode);
      if (maxDepth && ++i === maxDepth) break;
      node = node.parentNode;
    }
    return ancestors;
  },

  /***
   * grabArticle - Using a variety of metrics (content score, classname, element types), find the content that is
   *         most likely to be the stuff a user wants to read. Then return it wrapped up in a div.
   *
   * @param page a document to run upon. Needs to be a full document, complete with body.
   * @return Element
   **/
  _grabArticle: function _grabArticle(page) {
    this.log("**** grabArticle ****");
    var doc = this._doc;
    var isPaging = page !== null ? true : false;
    page = page ? page : this._body;

    // We can't grab an article if we don't have a page!
    if (!page) {
      this.log("No body found in document. Abort.");
      return null;
    }

    var pageCacheHtml = page.innerHTML;

    while (true) {
      var stripUnlikelyCandidates = this._flagIsActive(this.FLAG_STRIP_UNLIKELYS);

      // First, node prepping. Trash nodes that look cruddy (like ones with the
      // class name "comment", etc), and turn divs into P tags where they have been
      // used inappropriately (as in, where they contain no other block level elements.)
      var elementsToScore = [];
      var node = this._body;

      while (node) {
        var matchString = node.className + " " + node.id;

        if (!this._isProbablyVisible(node)) {
          this.log("Removing hidden node - " + matchString);
          node = this._removeAndGetNext(node);
          continue;
        }

        // Check to see if this node is a byline, and remove it if it is.
        if (this._checkByline(node, matchString)) {
          node = this._removeAndGetNext(node);
          continue;
        }

        // Remove unlikely candidates
        if (stripUnlikelyCandidates) {
          if (this.REGEXPS.unlikelyCandidates.test(matchString) && !this.REGEXPS.okMaybeItsACandidate.test(matchString) && node.tagName !== "BODY" && node.tagName !== "A") {
            this.log("Removing unlikely candidate - " + matchString);
            node = this._removeAndGetNext(node);
            continue;
          }
        }

        // Remove DIV, SECTION, and HEADER nodes without any content(e.g. text, image, video, or iframe).
        if ((node.tagName === "DIV" || node.tagName === "SECTION" || node.tagName === "HEADER" || node.tagName === "H1" || node.tagName === "H2" || node.tagName === "H3" || node.tagName === "H4" || node.tagName === "H5" || node.tagName === "H6") && this._isElementWithoutContent(node)) {
          node = this._removeAndGetNext(node);
          continue;
        }

        if (this.DEFAULT_TAGS_TO_SCORE.indexOf(node.tagName) !== -1) {
          elementsToScore.push(node);
        }

        // Turn all divs that don't have children block level elements into p's
        if (node.tagName === "DIV") {
          // Put phrasing content into paragraphs.
          var p = null;
          var childNode = node.firstChild;
          while (childNode) {
            var nextSibling = childNode.nextSibling;
            if (this._isPhrasingContent(childNode)) {
              if (p !== null) {
                p.appendChild(childNode);
              } else if (!this._isWhitespace(childNode)) {
                p = doc.createElement('p');
                node.replaceChild(p, childNode);
                p.appendChild(childNode);
              }
            } else if (p !== null) {
              while (p.lastChild && this._isWhitespace(p.lastChild)) {
                p.removeChild(p.lastChild);
              }p = null;
            }
            childNode = nextSibling;
          }

          // Sites like http://mobile.slate.com encloses each paragraph with a DIV
          // element. DIVs with only a P element inside and no text content can be
          // safely converted into plain P elements to avoid confusing the scoring
          // algorithm with DIVs with are, in practice, paragraphs.
          if (this._hasSingleTagInsideElement(node, "P") && this._getLinkDensity(node) < 0.25) {
            var newNode = node.children[0];
            node.parentNode.replaceChild(newNode, node);
            node = newNode;
            elementsToScore.push(node);
          } else if (!this._hasChildBlockElement(node)) {
            node = this._setNodeTag(node, "P");
            elementsToScore.push(node);
          }
        }
        node = this._getNextNode(node);
      }

      /**
       * Loop through all paragraphs, and assign a score to them based on how content-y they look.
       * Then add their score to their parent node.
       *
       * A score is determined by things like number of commas, class names, etc. Maybe eventually link density.
       **/
      var candidates = [];
      this._forEachNode(elementsToScore, function (elementToScore) {
        if (!elementToScore.parentNode || typeof elementToScore.parentNode.tagName === 'undefined') return;

        // If this paragraph is less than 25 characters, don't even count it.
        var innerText = this._getInnerText(elementToScore);
        if (innerText.length < 25) return;

        // Exclude nodes with no ancestor.
        var ancestors = this._getNodeAncestors(elementToScore, 3);
        if (ancestors.length === 0) return;

        var contentScore = 0;

        // Add a point for the paragraph itself as a base.
        contentScore += 1;

        // Add points for any commas within this paragraph.
        contentScore += innerText.split(',').length;

        // For every 100 characters in this paragraph, add another point. Up to 3 points.
        contentScore += Math.min(Math.floor(innerText.length / 100), 3);

        // Initialize and score ancestors.
        this._forEachNode(ancestors, function (ancestor, level) {
          if (!ancestor.tagName || !ancestor.parentNode || typeof ancestor.parentNode.tagName === 'undefined') return;

          if (typeof ancestor.readability === 'undefined') {
            this._initializeNode(ancestor);
            candidates.push(ancestor);
          }

          // Node score divider:
          // - parent:             1 (no division)
          // - grandparent:        2
          // - great grandparent+: ancestor level * 3
          if (level === 0) var scoreDivider = 1;else if (level === 1) scoreDivider = 2;else scoreDivider = level * 3;
          ancestor.readability.contentScore += contentScore / scoreDivider;
        });
      });

      // After we've calculated scores, loop through all of the possible
      // candidate nodes we found and find the one with the highest score.
      var topCandidates = [];
      for (var c = 0, cl = candidates.length; c < cl; c += 1) {
        var candidate = candidates[c];

        // Scale the final candidates score based on link density. Good content
        // should have a relatively small link density (5% or less) and be mostly
        // unaffected by this operation.
        var candidateScore = candidate.readability.contentScore * (1 - this._getLinkDensity(candidate));
        candidate.readability.contentScore = candidateScore;

        this.log('Candidate:', candidate, "with score " + candidateScore);

        for (var t = 0; t < this._nbTopCandidates; t++) {
          var aTopCandidate = topCandidates[t];

          if (!aTopCandidate || candidateScore > aTopCandidate.readability.contentScore) {
            topCandidates.splice(t, 0, candidate);
            if (topCandidates.length > this._nbTopCandidates) topCandidates.pop();
            break;
          }
        }
      }

      var topCandidate = topCandidates[0] || null;
      var neededToCreateTopCandidate = false;
      var parentOfTopCandidate;

      // If we still have no top candidate, just use the body as a last resort.
      // We also have to copy the body node so it is something we can modify.
      if (topCandidate === null || topCandidate.tagName === "BODY") {
        // Move all of the page's children into topCandidate
        topCandidate = doc.createElement("DIV");
        neededToCreateTopCandidate = true;
        // Move everything (not just elements, also text nodes etc.) into the container
        // so we even include text directly in the body:
        var kids = page.childNodes;
        while (kids.length) {
          this.log("Moving child out:", kids[0]);
          topCandidate.appendChild(kids[0]);
        }

        page.appendChild(topCandidate);

        this._initializeNode(topCandidate);
      } else if (topCandidate) {
        // Find a better top candidate node if it contains (at least three) nodes which belong to `topCandidates` array
        // and whose scores are quite closed with current `topCandidate` node.
        var alternativeCandidateAncestors = [];
        for (var i = 1; i < topCandidates.length; i++) {
          if (topCandidates[i].readability.contentScore / topCandidate.readability.contentScore >= 0.75) {
            alternativeCandidateAncestors.push(this._getNodeAncestors(topCandidates[i]));
          }
        }
        var MINIMUM_TOPCANDIDATES = 3;
        if (alternativeCandidateAncestors.length >= MINIMUM_TOPCANDIDATES) {
          parentOfTopCandidate = topCandidate.parentNode;
          while (parentOfTopCandidate.tagName !== "BODY") {
            var listsContainingThisAncestor = 0;
            for (var ancestorIndex = 0; ancestorIndex < alternativeCandidateAncestors.length && listsContainingThisAncestor < MINIMUM_TOPCANDIDATES; ancestorIndex++) {
              listsContainingThisAncestor += Number(alternativeCandidateAncestors[ancestorIndex].includes(parentOfTopCandidate));
            }
            if (listsContainingThisAncestor >= MINIMUM_TOPCANDIDATES) {
              topCandidate = parentOfTopCandidate;
              break;
            }
            parentOfTopCandidate = parentOfTopCandidate.parentNode;
          }
        }
        if (!topCandidate.readability) {
          this._initializeNode(topCandidate);
        }

        // Because of our bonus system, parents of candidates might have scores
        // themselves. They get half of the node. There won't be nodes with higher
        // scores than our topCandidate, but if we see the score going *up* in the first
        // few steps up the tree, that's a decent sign that there might be more content
        // lurking in other places that we want to unify in. The sibling stuff
        // below does some of that - but only if we've looked high enough up the DOM
        // tree.
        parentOfTopCandidate = topCandidate.parentNode;
        var lastScore = topCandidate.readability.contentScore;
        // The scores shouldn't get too low.
        var scoreThreshold = lastScore / 3;
        while (parentOfTopCandidate.tagName !== "BODY") {
          if (!parentOfTopCandidate.readability) {
            parentOfTopCandidate = parentOfTopCandidate.parentNode;
            continue;
          }
          var parentScore = parentOfTopCandidate.readability.contentScore;
          if (parentScore < scoreThreshold) break;
          if (parentScore > lastScore) {
            // Alright! We found a better parent to use.
            topCandidate = parentOfTopCandidate;
            break;
          }
          lastScore = parentOfTopCandidate.readability.contentScore;
          parentOfTopCandidate = parentOfTopCandidate.parentNode;
        }

        // If the top candidate is the only child, use parent instead. This will help sibling
        // joining logic when adjacent content is actually located in parent's sibling node.
        parentOfTopCandidate = topCandidate.parentNode;
        while (parentOfTopCandidate.tagName != "BODY" && parentOfTopCandidate.children.length == 1) {
          topCandidate = parentOfTopCandidate;
          parentOfTopCandidate = topCandidate.parentNode;
        }
        if (!topCandidate.readability) {
          this._initializeNode(topCandidate);
        }
      }

      // Now that we have the top candidate, look through its siblings for content
      // that might also be related. Things like preambles, content split by ads
      // that we removed, etc.
      var articleContent = doc.createElement("DIV");
      if (isPaging) articleContent.id = "readability-content";

      var siblingScoreThreshold = Math.max(10, topCandidate.readability.contentScore * 0.2);
      // Keep potential top candidate's parent node to try to get text direction of it later.
      parentOfTopCandidate = topCandidate.parentNode;
      var siblings = parentOfTopCandidate.children;

      for (var s = 0, sl = siblings.length; s < sl; s++) {
        var sibling = siblings[s];
        var append = false;

        this.log("Looking at sibling node:", sibling, sibling.readability ? "with score " + sibling.readability.contentScore : '');
        this.log("Sibling has score", sibling.readability ? sibling.readability.contentScore : 'Unknown');

        if (sibling === topCandidate) {
          append = true;
        } else {
          var contentBonus = 0;

          // Give a bonus if sibling nodes and top candidates have the example same classname
          if (sibling.className === topCandidate.className && topCandidate.className !== "") contentBonus += topCandidate.readability.contentScore * 0.2;

          if (sibling.readability && sibling.readability.contentScore + contentBonus >= siblingScoreThreshold) {
            append = true;
          } else if (sibling.nodeName === "P") {
            var linkDensity = this._getLinkDensity(sibling);
            var nodeContent = this._getInnerText(sibling);
            var nodeLength = nodeContent.length;

            if (nodeLength > 80 && linkDensity < 0.25) {
              append = true;
            } else if (nodeLength < 80 && nodeLength > 0 && linkDensity === 0 && nodeContent.search(/\.( |$)/) !== -1) {
              append = true;
            }
          }
        }

        if (append) {
          this.log("Appending node:", sibling);

          if (this.ALTER_TO_DIV_EXCEPTIONS.indexOf(sibling.nodeName) === -1) {
            // We have a node that isn't a common block level element, like a form or td tag.
            // Turn it into a div so it doesn't get filtered out later by accident.
            this.log("Altering sibling:", sibling, 'to div.');

            sibling = this._setNodeTag(sibling, "DIV");
          }

          articleContent.appendChild(sibling);
          // siblings is a reference to the children array, and
          // sibling is removed from the array when we call appendChild().
          // As a result, we must revisit this index since the nodes
          // have been shifted.
          s -= 1;
          sl -= 1;
        }
      }

      if (this._debug) this.log("Article content pre-prep: " + articleContent.innerHTML);
      // So we have all of the content that we need. Now we clean it up for presentation.
      this._prepArticle(articleContent);
      if (this._debug) this.log("Article content post-prep: " + articleContent.innerHTML);

      if (neededToCreateTopCandidate) {
        // We already created a fake div thing, and there wouldn't have been any siblings left
        // for the previous loop, so there's no point trying to create a new div, and then
        // move all the children over. Just assign IDs and class names here. No need to append
        // because that already happened anyway.
        topCandidate.id = "readability-page-1";
        topCandidate.className = "page";
      } else {
        var div = doc.createElement("DIV");
        div.id = "readability-page-1";
        div.className = "page";
        var children = articleContent.childNodes;
        while (children.length) {
          div.appendChild(children[0]);
        }
        articleContent.appendChild(div);
      }

      if (this._debug) this.log("Article content after paging: " + articleContent.innerHTML);

      var parseSuccessful = true;

      // Now that we've gone through the full algorithm, check to see if
      // we got any meaningful content. If we didn't, we may need to re-run
      // grabArticle with different flags set. This gives us a higher likelihood of
      // finding the content, and the sieve approach gives us a higher likelihood of
      // finding the -right- content.
      var textLength = this._getInnerText(articleContent, true).length;
      if (textLength < this._charThreshold) {
        parseSuccessful = false;
        page.innerHTML = pageCacheHtml;

        if (this._flagIsActive(this.FLAG_STRIP_UNLIKELYS)) {
          this._removeFlag(this.FLAG_STRIP_UNLIKELYS);
          this._attempts.push({ articleContent: articleContent, textLength: textLength });
        } else if (this._flagIsActive(this.FLAG_WEIGHT_CLASSES)) {
          this._removeFlag(this.FLAG_WEIGHT_CLASSES);
          this._attempts.push({ articleContent: articleContent, textLength: textLength });
        } else if (this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY)) {
          this._removeFlag(this.FLAG_CLEAN_CONDITIONALLY);
          this._attempts.push({ articleContent: articleContent, textLength: textLength });
        } else {
          this._attempts.push({ articleContent: articleContent, textLength: textLength });
          // No luck after removing flags, just return the longest text we found during the different loops
          this._attempts.sort(function (a, b) {
            return a.textLength < b.textLength;
          });

          // But first check if we actually have something
          if (!this._attempts[0].textLength) {
            return null;
          }

          articleContent = this._attempts[0].articleContent;
          parseSuccessful = true;
        }
      }

      if (parseSuccessful) {
        // Find out text direction from ancestors of final top candidate.
        var ancestors = [parentOfTopCandidate, topCandidate].concat(this._getNodeAncestors(parentOfTopCandidate));
        this._someNode(ancestors, function (ancestor) {
          if (!ancestor.tagName) return false;
          var articleDir = ancestor.getAttribute("dir");
          if (articleDir) {
            this._articleDir = articleDir;
            return true;
          }
          return false;
        });
        return articleContent;
      }
    }
  },

  /**
   * Check whether the input string could be a byline.
   * This verifies that the input is a string, and that the length
   * is less than 100 chars.
   *
   * @param possibleByline {string} - a string to check whether its a byline.
   * @return Boolean - whether the input string is a byline.
   */
  _isValidByline: function _isValidByline(byline) {
    if (typeof byline == 'string' || byline instanceof String) {
      byline = byline.trim();
      return byline.length > 0 && byline.length < 100;
    }
    return false;
  },

  /**
   * Attempts to get excerpt and byline metadata for the article.
   *
   * @return Object with optional "excerpt" and "byline" properties
   */
  _getArticleMetadata: function _getArticleMetadata() {
    var metadata = {};
    var values = {};
    var metaElements = this._doc.getElementsByTagName("meta");

    // Match "description", or Twitter's "twitter:description" (Cards)
    // in name attribute.
    var namePattern = /^\s*((twitter)\s*:\s*)?(description|title)\s*$/gi;

    // Match Facebook's Open Graph title & description properties.
    var propertyPattern = /^\s*og\s*:\s*(description|title)\s*$/gi;

    // Find description tags.
    this._forEachNode(metaElements, function (element) {
      var elementName = element.getAttribute("name");
      var elementProperty = element.getAttribute("property");

      if ([elementName, elementProperty].indexOf("author") !== -1) {
        metadata.byline = element.getAttribute("content");
        return;
      }

      var name = null;
      if (namePattern.test(elementName)) {
        name = elementName;
      } else if (propertyPattern.test(elementProperty)) {
        name = elementProperty;
      }

      if (name) {
        var content = element.getAttribute("content");
        if (content) {
          // Convert to lowercase and remove any whitespace
          // so we can match below.
          name = name.toLowerCase().replace(/\s/g, '');
          values[name] = content.trim();
        }
      }
    });

    if ("description" in values) {
      metadata.excerpt = values["description"];
    } else if ("og:description" in values) {
      // Use facebook open graph description.
      metadata.excerpt = values["og:description"];
    } else if ("twitter:description" in values) {
      // Use twitter cards description.
      metadata.excerpt = values["twitter:description"];
    }

    metadata.title = this._getArticleTitle();
    if (!metadata.title) {
      if ("og:title" in values) {
        // Use facebook open graph title.
        metadata.title = values["og:title"];
      } else if ("twitter:title" in values) {
        // Use twitter cards title.
        metadata.title = values["twitter:title"];
      }
    }

    return metadata;
  },

  /**
   * Removes script tags from the document.
   *
   * @param Element
   **/
  _removeScripts: function _removeScripts(doc) {
    this._removeNodes(doc.getElementsByTagName('script'), function (scriptNode) {
      scriptNode.nodeValue = "";
      scriptNode.removeAttribute('src');
      return true;
    });
    this._removeNodes(doc.getElementsByTagName('noscript'));
  },

  /**
   * Check if this node has only whitespace and a single element with given tag
   * Returns false if the DIV node contains non-empty text nodes
   * or if it contains no element with given tag or more than 1 element.
   *
   * @param Element
   * @param string tag of child element
   **/
  _hasSingleTagInsideElement: function _hasSingleTagInsideElement(element, tag) {
    // There should be exactly 1 element child with given tag
    if (element.children.length != 1 || element.children[0].tagName !== tag) {
      return false;
    }

    // And there should be no text nodes with real content
    return !this._someNode(element.childNodes, function (node) {
      return node.nodeType === this.TEXT_NODE && this.REGEXPS.hasContent.test(node.textContent);
    });
  },

  _isElementWithoutContent: function _isElementWithoutContent(node) {
    return node.nodeType === this.ELEMENT_NODE && node.textContent.trim().length == 0 && (node.children.length == 0 || node.children.length == node.getElementsByTagName("br").length + node.getElementsByTagName("hr").length);
  },

  /**
   * Determine whether element has any children block level elements.
   *
   * @param Element
   */
  _hasChildBlockElement: function _hasChildBlockElement(element) {
    return this._someNode(element.childNodes, function (node) {
      return this.DIV_TO_P_ELEMS.indexOf(node.tagName) !== -1 || this._hasChildBlockElement(node);
    });
  },

  /***
   * Determine if a node qualifies as phrasing content.
   * https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Phrasing_content
   **/
  _isPhrasingContent: function _isPhrasingContent(node) {
    return node.nodeType === this.TEXT_NODE || this.PHRASING_ELEMS.indexOf(node.tagName) !== -1 || (node.tagName === "A" || node.tagName === "DEL" || node.tagName === "INS") && this._everyNode(node.childNodes, this._isPhrasingContent);
  },

  _isWhitespace: function _isWhitespace(node) {
    return node.nodeType === this.TEXT_NODE && node.textContent.trim().length === 0 || node.nodeType === this.ELEMENT_NODE && node.tagName === "BR";
  },

  /**
   * Get the inner text of a node - cross browser compatibly.
   * This also strips out any excess whitespace to be found.
   *
   * @param Element
   * @param Boolean normalizeSpaces (default: true)
   * @return string
   **/
  _getInnerText: function _getInnerText(e, normalizeSpaces) {
    normalizeSpaces = typeof normalizeSpaces === 'undefined' ? true : normalizeSpaces;
    var textContent = e.textContent.trim();

    if (normalizeSpaces) {
      return textContent.replace(this.REGEXPS.normalize, " ");
    }
    return textContent;
  },

  /**
   * Get the number of times a string s appears in the node e.
   *
   * @param Element
   * @param string - what to split on. Default is ","
   * @return number (integer)
   **/
  _getCharCount: function _getCharCount(e, s) {
    s = s || ",";
    return this._getInnerText(e).split(s).length - 1;
  },

  /**
   * Remove the style attribute on every e and under.
   * TODO: Test if getElementsByTagName(*) is faster.
   *
   * @param Element
   * @return void
   **/
  _cleanStyles: function _cleanStyles(e) {
    if (!e || e.tagName.toLowerCase() === 'svg') return;

    // Remove `style` and deprecated presentational attributes
    for (var i = 0; i < this.PRESENTATIONAL_ATTRIBUTES.length; i++) {
      e.removeAttribute(this.PRESENTATIONAL_ATTRIBUTES[i]);
    }

    if (this.DEPRECATED_SIZE_ATTRIBUTE_ELEMS.indexOf(e.tagName) !== -1) {
      e.removeAttribute('width');
      e.removeAttribute('height');
    }

    var cur = e.firstElementChild;
    while (cur !== null) {
      this._cleanStyles(cur);
      cur = cur.nextElementSibling;
    }
  },

  /**
   * Get the density of links as a percentage of the content
   * This is the amount of text that is inside a link divided by the total text in the node.
   *
   * @param Element
   * @return number (float)
   **/
  _getLinkDensity: function _getLinkDensity(element) {
    var textLength = this._getInnerText(element).length;
    if (textLength === 0) return 0;

    var linkLength = 0;

    // XXX implement _reduceNodeList?
    this._forEachNode(element.getElementsByTagName("a"), function (linkNode) {
      linkLength += this._getInnerText(linkNode).length;
    });

    return linkLength / textLength;
  },

  /**
   * Get an elements class/id weight. Uses regular expressions to tell if this
   * element looks good or bad.
   *
   * @param Element
   * @return number (Integer)
   **/
  _getClassWeight: function _getClassWeight(e) {
    if (!this._flagIsActive(this.FLAG_WEIGHT_CLASSES)) return 0;

    var weight = 0;

    // Look for a special classname
    if (typeof e.className === 'string' && e.className !== '') {
      if (this.REGEXPS.negative.test(e.className)) weight -= 25;

      if (this.REGEXPS.positive.test(e.className)) weight += 25;
    }

    // Look for a special ID
    if (typeof e.id === 'string' && e.id !== '') {
      if (this.REGEXPS.negative.test(e.id)) weight -= 25;

      if (this.REGEXPS.positive.test(e.id)) weight += 25;
    }

    return weight;
  },

  /**
   * Clean a node of all elements of type "tag".
   * (Unless it's a youtube/vimeo video. People love movies.)
   *
   * @param Element
   * @param string tag to clean
   * @return void
   **/
  _clean: function _clean(e, tag) {
    var isEmbed = ["object", "embed", "iframe"].indexOf(tag) !== -1;

    this._removeNodes(e.getElementsByTagName(tag), function (element) {
      // Allow youtube and vimeo videos through as people usually want to see those.
      if (isEmbed) {
        var attributeValues = [].map.call(element.attributes, function (attr) {
          return attr.value;
        }).join("|");

        // First, check the elements attributes to see if any of them contain youtube or vimeo
        if (this.REGEXPS.videos.test(attributeValues)) return false;

        // Then check the elements inside this element for the same.
        if (this.REGEXPS.videos.test(element.innerHTML)) return false;
      }

      return true;
    });
  },

  /**
   * Check if a given node has one of its ancestor tag name matching the
   * provided one.
   * @param  HTMLElement node
   * @param  String      tagName
   * @param  Number      maxDepth
   * @param  Function    filterFn a filter to invoke to determine whether this node 'counts'
   * @return Boolean
   */
  _hasAncestorTag: function _hasAncestorTag(node, tagName, maxDepth, filterFn) {
    maxDepth = maxDepth || 3;
    tagName = tagName.toUpperCase();
    var depth = 0;
    while (node.parentNode) {
      if (maxDepth > 0 && depth > maxDepth) return false;
      if (node.parentNode.tagName === tagName && (!filterFn || filterFn(node.parentNode))) return true;
      node = node.parentNode;
      depth++;
    }
    return false;
  },

  /**
   * Return an object indicating how many rows and columns this table has.
   */
  _getRowAndColumnCount: function _getRowAndColumnCount(table) {
    var rows = 0;
    var columns = 0;
    var trs = table.getElementsByTagName("tr");
    for (var i = 0; i < trs.length; i++) {
      var rowspan = trs[i].getAttribute("rowspan") || 0;
      if (rowspan) {
        rowspan = parseInt(rowspan, 10);
      }
      rows += rowspan || 1;

      // Now look for column-related info
      var columnsInThisRow = 0;
      var cells = trs[i].getElementsByTagName("td");
      for (var j = 0; j < cells.length; j++) {
        var colspan = cells[j].getAttribute("colspan") || 0;
        if (colspan) {
          colspan = parseInt(colspan, 10);
        }
        columnsInThisRow += colspan || 1;
      }
      columns = Math.max(columns, columnsInThisRow);
    }
    return { rows: rows, columns: columns };
  },

  /**
   * Look for 'data' (as opposed to 'layout') tables, for which we use
   * similar checks as
   * https://dxr.mozilla.org/mozilla-central/rev/71224049c0b52ab190564d3ea0eab089a159a4cf/accessible/html/HTMLTableAccessible.cpp#920
   */
  _markDataTables: function _markDataTables(root) {
    var tables = root.getElementsByTagName("table");
    for (var i = 0; i < tables.length; i++) {
      var table = tables[i];
      var role = table.getAttribute("role");
      if (role == "presentation") {
        table._readabilityDataTable = false;
        continue;
      }
      var datatable = table.getAttribute("datatable");
      if (datatable == "0") {
        table._readabilityDataTable = false;
        continue;
      }
      var summary = table.getAttribute("summary");
      if (summary) {
        table._readabilityDataTable = true;
        continue;
      }

      var caption = table.getElementsByTagName("caption")[0];
      if (caption && caption.childNodes.length > 0) {
        table._readabilityDataTable = true;
        continue;
      }

      // If the table has a descendant with any of these tags, consider a data table:
      var dataTableDescendants = ["col", "colgroup", "tfoot", "thead", "th"];
      var descendantExists = function descendantExists(tag) {
        return !!table.getElementsByTagName(tag)[0];
      };
      if (dataTableDescendants.some(descendantExists)) {
        this.log("Data table because found data-y descendant");
        table._readabilityDataTable = true;
        continue;
      }

      // Nested tables indicate a layout table:
      if (table.getElementsByTagName("table")[0]) {
        table._readabilityDataTable = false;
        continue;
      }

      var sizeInfo = this._getRowAndColumnCount(table);
      if (sizeInfo.rows >= 10 || sizeInfo.columns > 4) {
        table._readabilityDataTable = true;
        continue;
      }
      // Now just go by size entirely:
      table._readabilityDataTable = sizeInfo.rows * sizeInfo.columns > 10;
    }
  },

  /**
   * Clean an element of all tags of type "tag" if they look fishy.
   * "Fishy" is an algorithm based on content length, classnames, link density, number of images & embeds, etc.
   *
   * @return void
   **/
  _cleanConditionally: function _cleanConditionally(e, tag) {
    if (!this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY)) return;

    var isList = tag === "ul" || tag === "ol";

    // Gather counts for other typical elements embedded within.
    // Traverse backwards so we can remove nodes at the same time
    // without effecting the traversal.
    //
    // TODO: Consider taking into account original contentScore here.
    this._removeNodes(e.getElementsByTagName(tag), function (node) {
      // First check if we're in a data table, in which case don't remove us.
      var isDataTable = function isDataTable(t) {
        return t._readabilityDataTable;
      };

      if (this._hasAncestorTag(node, "table", -1, isDataTable)) {
        return false;
      }

      var weight = this._getClassWeight(node);
      var contentScore = 0;

      this.log("Cleaning Conditionally", node);

      if (weight + contentScore < 0) {
        return true;
      }

      if (this._getCharCount(node, ',') < 10) {
        // If there are not very many commas, and the number of
        // non-paragraph elements is more than paragraphs or other
        // ominous signs, remove the element.
        var p = node.getElementsByTagName("p").length;
        var img = node.getElementsByTagName("img").length;
        var li = node.getElementsByTagName("li").length - 100;
        var input = node.getElementsByTagName("input").length;

        var embedCount = 0;
        var embeds = node.getElementsByTagName("embed");
        for (var ei = 0, il = embeds.length; ei < il; ei += 1) {
          if (!this.REGEXPS.videos.test(embeds[ei].src)) embedCount += 1;
        }

        var linkDensity = this._getLinkDensity(node);
        var contentLength = this._getInnerText(node).length;

        var haveToRemove = img > 1 && p / img < 0.5 && !this._hasAncestorTag(node, "figure") || !isList && li > p || input > Math.floor(p / 3) || !isList && contentLength < 25 && (img === 0 || img > 2) && !this._hasAncestorTag(node, "figure") || !isList && weight < 25 && linkDensity > 0.2 || weight >= 25 && linkDensity > 0.5 || embedCount === 1 && contentLength < 75 || embedCount > 1;
        return haveToRemove;
      }
      return false;
    });
  },

  /**
   * Clean out elements whose id/class combinations match specific string.
   *
   * @param Element
   * @param RegExp match id/class combination.
   * @return void
   **/
  _cleanMatchedNodes: function _cleanMatchedNodes(e, regex) {
    var endOfSearchMarkerNode = this._getNextNode(e, true);
    var next = this._getNextNode(e);
    while (next && next != endOfSearchMarkerNode) {
      if (regex.test(next.className + " " + next.id)) {
        next = this._removeAndGetNext(next);
      } else {
        next = this._getNextNode(next);
      }
    }
  },

  /**
   * Clean out spurious headers from an Element. Checks things like classnames and link density.
   *
   * @param Element
   * @return void
   **/
  _cleanHeaders: function _cleanHeaders(e) {
    for (var headerIndex = 1; headerIndex < 3; headerIndex += 1) {
      this._removeNodes(e.getElementsByTagName('h' + headerIndex), function (header) {
        return this._getClassWeight(header) < 0;
      });
    }
  },

  _flagIsActive: function _flagIsActive(flag) {
    return (this._flags & flag) > 0;
  },

  _removeFlag: function _removeFlag(flag) {
    this._flags = this._flags & ~flag;
  },

  _isProbablyVisible: function _isProbablyVisible(node) {
    return node.style.display != "none" && !node.hasAttribute("hidden");
  },

  /**
   * Decides whether or not the document is reader-able without parsing the whole thing.
   *
   * @return boolean Whether or not we suspect parse() will suceeed at returning an article object.
   */
  isProbablyReaderable: function isProbablyReaderable(helperIsVisible) {
    var nodes = this._getAllNodesWithTag(this._doc, ["p", "pre"]);

    // Get <div> nodes which have <br> node(s) and append them into the `nodes` variable.
    // Some articles' DOM structures might look like
    // <div>
    //   Sentences<br>
    //   <br>
    //   Sentences<br>
    // </div>
    var brNodes = this._getAllNodesWithTag(this._doc, ["div > br"]);
    if (brNodes.length) {
      var set = new Set();
      [].forEach.call(brNodes, function (node) {
        set.add(node.parentNode);
      });
      nodes = [].concat.apply(Array.from(set), nodes);
    }

    if (!helperIsVisible) {
      helperIsVisible = this._isProbablyVisible;
    }

    var score = 0;
    // This is a little cheeky, we use the accumulator 'score' to decide what to return from
    // this callback:
    return this._someNode(nodes, function (node) {
      if (helperIsVisible && !helperIsVisible(node)) return false;
      var matchString = node.className + " " + node.id;

      if (this.REGEXPS.unlikelyCandidates.test(matchString) && !this.REGEXPS.okMaybeItsACandidate.test(matchString)) {
        return false;
      }

      if (node.matches && node.matches("li p")) {
        return false;
      }

      var textContentLength = node.textContent.trim().length;
      if (textContentLength < 140) {
        return false;
      }

      score += Math.sqrt(textContentLength - 140);

      if (score > 20) {
        return true;
      }
      return false;
    });
  },

  /**
   * Runs readability.
   *
   * Workflow:
   *  1. Prep the document by removing script tags, css, etc.
   *  2. Build readability's DOM tree.
   *  3. Grab the article content from the current dom tree.
   *  4. Replace the current DOM tree with the new one.
   *  5. Read peacefully.
   *
   * @return void
   **/
  parse: function parse() {
    // Avoid parsing too large documents, as per configuration option
    if (this._maxElemsToParse > 0) {
      var numTags = this._doc.getElementsByTagName("*").length;
      if (numTags > this._maxElemsToParse) {
        throw new Error("Aborting parsing document; " + numTags + " elements found");
      }
    }

    // Remove script tags from the document.
    this._removeScripts(this._body);

    this._prepDocument();

    var metadata = this._getArticleMetadata();
    this._articleTitle = metadata.title;

    var articleContent = this._grabArticle();
    if (!articleContent) return null;

    this.log("Grabbed: " + articleContent.innerHTML);

    this._postProcessContent(articleContent);

    // If we haven't found an excerpt in the article's metadata, use the article's
    // first paragraph as the excerpt. This is used for displaying a preview of
    // the article's content.
    if (!metadata.excerpt) {
      var paragraphs = articleContent.getElementsByTagName("p");
      if (paragraphs.length > 0) {
        metadata.excerpt = paragraphs[0].textContent.trim();
      }
    }

    var textContent = articleContent.textContent;
    return {
      title: this._articleTitle,
      byline: metadata.byline || this._articleByline,
      dir: this._articleDir,
      content: articleContent.innerHTML,
      textContent: textContent,
      length: textContent.length,
      excerpt: metadata.excerpt
    };
  }
};

if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object") {
  module.exports = Readability;
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXZTcmMvY29udGVudFNjcmlwdC5qcyIsImRldlNyYy9saWIvUmVhZGFiaWxpdHkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FDQUE7Ozs7Ozs7O0lBQ00sUztBQUNGLHlCQUFjO0FBQUE7O0FBQ1YsYUFBSyxHQUFMLEdBQVcsSUFBWDtBQUNBLGFBQUssTUFBTCxHQUFjLEtBQWQ7QUFDQSxhQUFLLE9BQUwsR0FBZSxFQUFmO0FBQ0EsYUFBSyxTQUFMO0FBQ0g7Ozs7c0NBRWE7QUFDVixnQkFBRyxLQUFLLE1BQVIsRUFBZ0I7QUFDaEIsZ0JBQUcsQ0FBQyxLQUFLLEdBQVQsRUFBYztBQUNWLG9CQUFJLFVBQVUsSUFBSSxxQkFBSixDQUFnQixRQUFoQixFQUEwQixLQUExQixFQUFkO0FBQ0EscUJBQUssR0FBTCxpS0FFd0MsUUFBUSxLQUZoRCxvRUFHMkMsUUFBUSxPQUhuRDtBQU1IO0FBQ0QsZ0JBQUksTUFBTSxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBVjtBQUNBLGdCQUFJLEVBQUosR0FBUyxXQUFUO0FBQ0EsZ0JBQUksWUFBSixDQUFpQixPQUFqQixFQUEwQixnQkFBMUI7QUFDQSxnQkFBSSxTQUFKLEdBQWdCLEtBQUssR0FBckI7QUFDQSxxQkFBUyxJQUFULENBQWMsV0FBZCxDQUEwQixHQUExQjtBQUNBLHFCQUFTLElBQVQsQ0FBYyxLQUFkLENBQW9CLFFBQXBCLEdBQStCLFFBQS9CO0FBQ0EsZ0JBQUksT0FBTyxJQUFJLG9CQUFKLENBQXlCLEtBQXpCLENBQVg7QUFDQSxnQkFBSSxZQUFZLFNBQVMsY0FBVCxDQUF3QixxQkFBeEIsRUFBK0MsV0FBL0Q7QUFDQSxpQkFBSSxJQUFJLElBQUksQ0FBWixFQUFlLElBQUksS0FBSyxNQUF4QixFQUFnQyxHQUFoQyxFQUFxQztBQUNqQyxvQkFBSSxRQUFRLEtBQUssQ0FBTCxFQUFRLFlBQXBCO0FBQ0Esb0JB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QUFJLGlCQUFpQixLQUFLLFlBQUwsRUFBckI7QUFDQSxRQUFJLENBQUMsY0FBTCxFQUNFLE9BQU8sSUFBUDs7QUFFRixTQUFLLEdBQUwsQ0FBUyxjQUFjLGVBQWUsU0FBdEM7O0FBRUEsU0FBSyxtQkFBTCxDQUF5QixjQUF6Qjs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxRQUFJLENBQUMsU0FBUyxPQUFkLEVBQXVCO0FBQ3JCLFVBQUksYUFBYSxlQUFlLG9CQUFmLENBQW9DLEdBQXBDLENBQWpCO0FBQ0EsVUFBSSxXQUFXLE1BQVgsR0FBb0IsQ0FBeEIsRUFBMkI7QUFDekIsaUJBQVMsT0FBVCxHQUFtQixXQUFXLENBQVgsRUFBYyxXQUFkLENBQTBCLElBQTFCLEVBQW5CO0FBQ0Q7QUFDRjs7QUFFRCxRQUFJLGNBQWMsZUFBZSxXQUFqQztBQUNBLFdBQU87QUFDTCxhQUFPLEtBQUssYUFEUDtBQUVMLGNBQVEsU0FBUyxNQUFULElBQW1CLEtBQUssY0FGM0I7QUFHTCxXQUFLLEtBQUssV0FITDtBQUlMLGVBQVMsZUFBZSxTQUpuQjtBQUtMLG1CQUFhLFdBTFI7QUFNTCxjQUFRLFlBQVksTUFOZjtBQU9MLGVBQVMsU0FBUztBQVBiLEtBQVA7QUFTRDtBQXhyRHFCLENBQXhCOztBQTJyREEsSUFBSSxRQUFPLE1BQVAseUNBQU8sTUFBUCxPQUFrQixRQUF0QixFQUFnQztBQUM5QixTQUFPLE9BQVAsR0FBaUIsV0FBakI7QUFDRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCBSZWFkYWJpbGl0eSBmcm9tICcuL2xpYi9SZWFkYWJpbGl0eSc7XG5jbGFzcyBDbGVhclJlYWQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnRwbCA9IG51bGw7XG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaG90a2V5cyA9IFtdO1xuICAgICAgICB0aGlzLmFkZEV2ZW50cygpO1xuICAgIH1cblxuICAgIGFkZFJlYWRQYWdlKCkge1xuICAgICAgICBpZih0aGlzLmFjdGl2ZSkgcmV0dXJuO1xuICAgICAgICBpZighdGhpcy50cGwpIHtcbiAgICAgICAgICAgIGxldCBhcnRpY2xlID0gbmV3IFJlYWRhYmlsaXR5KGRvY3VtZW50KS5wYXJzZSgpO1xuICAgICAgICAgICAgdGhpcy50cGwgPSBgPGRpdiBjbGFzcz1cImNlbnRlci1hcmVhXCIgaWQ9XCJjbGVhclJlYWRDZW50ZXJBcmVhXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGljbGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGgxIGNsYXNzPVwidGl0bGVcIj4ke2FydGljbGUudGl0bGV9PC9oMT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRlbnRcIj4ke2FydGljbGUuY29udGVudH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PmA7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBkaXYuaWQgPSAnY2xlYXJSZWFkJztcbiAgICAgICAgZGl2LnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnY2xlYXJyZWFkLW1vZGUnKTtcbiAgICAgICAgZGl2LmlubmVySFRNTCA9IHRoaXMudHBsO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRpdik7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICAgICAgbGV0IGltZ3MgPSBkaXYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltZycpO1xuICAgICAgICBsZXQgYXJlYVdpZHRoID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NsZWFyUmVhZENlbnRlckFyZWEnKS5jbGllbnRXaWR0aDtcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IGltZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCB3aWR0aCA9IGltZ3NbaV0ubmF0dXJhbFdpZHRoO1xuICAgICAgICAgICAgaWYod2lkdGgpIHtcbiAgICAgICAgICAgICAgICBsZXQgY2VudGVyQXJlYVdpZHRoID0gYXJlYVdpZHRoO1xuICAgICAgICAgICAgICAgIGlmKHdpZHRoIDwgKGNlbnRlckFyZWFXaWR0aCAtIDE0MCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaW1nc1tpXS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2ltZy1jJylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbWdzW2ldLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBsZXQgd2lkdGggPSB0aGlzLm5hdHVyYWxXaWR0aDtcbiAgICAgICAgICAgICAgICBsZXQgY2VudGVyQXJlYVdpZHRoID0gYXJlYVdpZHRoO1xuICAgICAgICAgICAgICAgIGlmKHdpZHRoIDwgKGNlbnRlckFyZWFXaWR0aCAtIDE0MCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2ltZy1jJylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGRpdi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2NsZWFycmVhZC1tb2RlIGNsZWFycmVhZC1tb2RlLXNob3cnKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjbGVhclJlYWRDZW50ZXJBcmVhJykuc2V0QXR0cmlidXRlKCdjbGFzcycsICdjZW50ZXItYXJlYSBjZW50ZXItYXJlYS1zaG93Jyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlbW92ZVJlYWRQYWdlKCkge1xuICAgICAgICBpZighdGhpcy5hY3RpdmUpIHJldHVybjtcbiAgICAgICAgbGV0IGNsZWFyUmVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjbGVhclJlYWQnKTtcbiAgICAgICAgbGV0IGNsZWFyUmVhZENlbnRlckFyZWEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2xlYXJSZWFkQ2VudGVyQXJlYScpO1xuICAgICAgICBjbGVhclJlYWRDZW50ZXJBcmVhLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnY2VudGVyLWFyZWEnKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBjbGVhclJlYWQuc2V0QXR0cmlidXRlKCdjbGFzcycsICdjbGVhcnJlYWQtbW9kZScpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICcnO1xuICAgICAgICAgICAgICAgIGxldCBwYXJlbnROb2RlID0gY2xlYXJSZWFkLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjbGVhclJlYWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICB9LCAyNTApO1xuICAgICAgICB9LCAxMDApO1xuICAgIH1cblxuICAgIGFkZEV2ZW50cygpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlKSA9PiB7XG4gICAgICAgICAgICBsZXQgY29kZSA9IGUua2V5Q29kZTtcbiAgICAgICAgICAgIGlmKHRoaXMuaG90a2V5cy5pbmRleE9mKGNvZGUpID09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ob3RrZXlzLnB1c2goY29kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIChlKSA9PiB7XG4gICAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLmdldCgoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKGRhdGEuaGFzT3duUHJvcGVydHkoJ3N0YXRlJykgJiYgZGF0YS5zdGF0ZSA9PSAnY2xvc2UnKSByZXR1cm47XG4gICAgICAgICAgICAgICAgaWYoZGF0YS5oYXNPd25Qcm9wZXJ0eSgnb3BlbicpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBvcGVua2V5cyA9IGRhdGEub3BlbjtcbiAgICAgICAgICAgICAgICAgICAgaWYoSlNPTi5zdHJpbmdpZnkodGhpcy5ob3RrZXlzKSA9PSBKU09OLnN0cmluZ2lmeShvcGVua2V5cykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkUmVhZFBhZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1lbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUuc2hpZnRLZXkgJiYgZS5rZXlDb2RlID09IDEzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZFJlYWRQYWdlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoZGF0YS5oYXNPd25Qcm9wZXJ0eSgnY2xvc2UnKSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgY2xvc2VrZXlzID0gZGF0YS5jbG9zZTtcbiAgICAgICAgICAgICAgICAgICAgaWYoSlNPTi5zdHJpbmdpZnkodGhpcy5ob3RrZXlzKSA9PSBKU09OLnN0cmluZ2lmeShjbG9zZWtleXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZVJlYWRQYWdlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGUua2V5Q29kZSA9PSAyNykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVSZWFkUGFnZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuaG90a2V5cyA9IFtdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmNvbnN0IGNsZWFyUmVhZCA9IG5ldyBDbGVhclJlYWQoKTsiLCIvKmVzbGludC1lbnYgZXM2OmZhbHNlKi9cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAgQXJjOTAgSW5jXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qXG4gKiBUaGlzIGNvZGUgaXMgaGVhdmlseSBiYXNlZCBvbiBBcmM5MCdzIHJlYWRhYmlsaXR5LmpzICgxLjcuMSkgc2NyaXB0XG4gKiBhdmFpbGFibGUgYXQ6IGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9hcmM5MGxhYnMtcmVhZGFiaWxpdHlcbiAqL1xuXG4vKipcbiAqIFB1YmxpYyBjb25zdHJ1Y3Rvci5cbiAqIEBwYXJhbSB7SFRNTERvY3VtZW50fSBkb2MgICAgIFRoZSBkb2N1bWVudCB0byBwYXJzZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICBvcHRpb25zIFRoZSBvcHRpb25zIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gUmVhZGFiaWxpdHkoZG9jLCBvcHRpb25zKSB7XG4gIC8vIEluIHNvbWUgb2xkZXIgdmVyc2lvbnMsIHBlb3BsZSBwYXNzZWQgYSBVUkkgYXMgdGhlIGZpcnN0IGFyZ3VtZW50LiBDb3BlOlxuICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmRvY3VtZW50RWxlbWVudCkge1xuICAgIGRvYyA9IG9wdGlvbnM7XG4gICAgb3B0aW9ucyA9IGFyZ3VtZW50c1syXTtcbiAgfSBlbHNlIGlmICghZG9jIHx8ICFkb2MuZG9jdW1lbnRFbGVtZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgYXJndW1lbnQgdG8gUmVhZGFiaWxpdHkgY29uc3RydWN0b3Igc2hvdWxkIGJlIGEgZG9jdW1lbnQgb2JqZWN0LlwiKTtcbiAgfVxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB0aGlzLl9kb2MgPSBkb2M7XG4gIHRoaXMuX2JvZHkgPSBkb2MuYm9keS5jbG9uZU5vZGUodHJ1ZSk7XG4gIHRoaXMuX2FydGljbGVUaXRsZSA9IG51bGw7XG4gIHRoaXMuX2FydGljbGVCeWxpbmUgPSBudWxsO1xuICB0aGlzLl9hcnRpY2xlRGlyID0gbnVsbDtcbiAgdGhpcy5fYXR0ZW1wdHMgPSBbXTtcblxuICAvLyBDb25maWd1cmFibGUgb3B0aW9uc1xuICB0aGlzLl9kZWJ1ZyA9ICEhb3B0aW9ucy5kZWJ1ZztcbiAgdGhpcy5fbWF4RWxlbXNUb1BhcnNlID0gb3B0aW9ucy5tYXhFbGVtc1RvUGFyc2UgfHwgdGhpcy5ERUZBVUxUX01BWF9FTEVNU19UT19QQVJTRTtcbiAgdGhpcy5fbmJUb3BDYW5kaWRhdGVzID0gb3B0aW9ucy5uYlRvcENhbmRpZGF0ZXMgfHwgdGhpcy5ERUZBVUxUX05fVE9QX0NBTkRJREFURVM7XG4gIHRoaXMuX2NoYXJUaHJlc2hvbGQgPSBvcHRpb25zLmNoYXJUaHJlc2hvbGQgfHwgdGhpcy5ERUZBVUxUX0NIQVJfVEhSRVNIT0xEO1xuICB0aGlzLl9jbGFzc2VzVG9QcmVzZXJ2ZSA9IHRoaXMuQ0xBU1NFU19UT19QUkVTRVJWRS5jb25jYXQob3B0aW9ucy5jbGFzc2VzVG9QcmVzZXJ2ZSB8fCBbXSk7XG5cbiAgLy8gU3RhcnQgd2l0aCBhbGwgZmxhZ3Mgc2V0XG4gIHRoaXMuX2ZsYWdzID0gdGhpcy5GTEFHX1NUUklQX1VOTElLRUxZUyB8XG4gICAgICB0aGlzLkZMQUdfV0VJR0hUX0NMQVNTRVMgfFxuICAgICAgdGhpcy5GTEFHX0NMRUFOX0NPTkRJVElPTkFMTFk7XG5cbiAgdmFyIGxvZ0VsO1xuXG4gIC8vIENvbnRyb2wgd2hldGhlciBsb2cgbWVzc2FnZXMgYXJlIHNlbnQgdG8gdGhlIGNvbnNvbGVcbiAgaWYgKHRoaXMuX2RlYnVnKSB7XG4gICAgbG9nRWwgPSBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgcnYgPSBlLm5vZGVOYW1lICsgXCIgXCI7XG4gICAgICBpZiAoZS5ub2RlVHlwZSA9PSBlLlRFWFRfTk9ERSkge1xuICAgICAgICByZXR1cm4gcnYgKyAnKFwiJyArIGUudGV4dENvbnRlbnQgKyAnXCIpJztcbiAgICAgIH1cbiAgICAgIHZhciBjbGFzc0Rlc2MgPSBlLmNsYXNzTmFtZSAmJiAoXCIuXCIgKyBlLmNsYXNzTmFtZS5yZXBsYWNlKC8gL2csIFwiLlwiKSk7XG4gICAgICB2YXIgZWxEZXNjID0gXCJcIjtcbiAgICAgIGlmIChlLmlkKVxuICAgICAgICBlbERlc2MgPSBcIigjXCIgKyBlLmlkICsgY2xhc3NEZXNjICsgXCIpXCI7XG4gICAgICBlbHNlIGlmIChjbGFzc0Rlc2MpXG4gICAgICAgIGVsRGVzYyA9IFwiKFwiICsgY2xhc3NEZXNjICsgXCIpXCI7XG4gICAgICByZXR1cm4gcnYgKyBlbERlc2M7XG4gICAgfTtcbiAgICB0aGlzLmxvZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0eXBlb2YgZHVtcCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB2YXIgbXNnID0gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKGFyZ3VtZW50cywgZnVuY3Rpb24oeCkge1xuICAgICAgICAgIHJldHVybiAoeCAmJiB4Lm5vZGVOYW1lKSA/IGxvZ0VsKHgpIDogeDtcbiAgICAgICAgfSkuam9pbihcIiBcIik7XG4gICAgICAgIGR1bXAoXCJSZWFkZXI6IChSZWFkYWJpbGl0eSkgXCIgKyBtc2cgKyBcIlxcblwiKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXCJSZWFkZXI6IChSZWFkYWJpbGl0eSkgXCJdLmNvbmNhdChhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmdzKTtcbiAgICAgIH1cbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIHRoaXMubG9nID0gZnVuY3Rpb24gKCkge307XG4gIH1cbn1cblxuUmVhZGFiaWxpdHkucHJvdG90eXBlID0ge1xuICBGTEFHX1NUUklQX1VOTElLRUxZUzogMHgxLFxuICBGTEFHX1dFSUdIVF9DTEFTU0VTOiAweDIsXG4gIEZMQUdfQ0xFQU5fQ09ORElUSU9OQUxMWTogMHg0LFxuXG4gIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlL25vZGVUeXBlXG4gIEVMRU1FTlRfTk9ERTogMSxcbiAgVEVYVF9OT0RFOiAzLFxuXG4gIC8vIE1heCBudW1iZXIgb2Ygbm9kZXMgc3VwcG9ydGVkIGJ5IHRoaXMgcGFyc2VyLiBEZWZhdWx0OiAwIChubyBsaW1pdClcbiAgREVGQVVMVF9NQVhfRUxFTVNfVE9fUEFSU0U6IDAsXG5cbiAgLy8gVGhlIG51bWJlciBvZiB0b3AgY2FuZGlkYXRlcyB0byBjb25zaWRlciB3aGVuIGFuYWx5c2luZyBob3dcbiAgLy8gdGlnaHQgdGhlIGNvbXBldGl0aW9uIGlzIGFtb25nIGNhbmRpZGF0ZXMuXG4gIERFRkFVTFRfTl9UT1BfQ0FORElEQVRFUzogNSxcblxuICAvLyBFbGVtZW50IHRhZ3MgdG8gc2NvcmUgYnkgZGVmYXVsdC5cbiAgREVGQVVMVF9UQUdTX1RPX1NDT1JFOiBcInNlY3Rpb24saDIsaDMsaDQsaDUsaDYscCx0ZCxwcmVcIi50b1VwcGVyQ2FzZSgpLnNwbGl0KFwiLFwiKSxcblxuICAvLyBUaGUgZGVmYXVsdCBudW1iZXIgb2YgY2hhcnMgYW4gYXJ0aWNsZSBtdXN0IGhhdmUgaW4gb3JkZXIgdG8gcmV0dXJuIGEgcmVzdWx0XG4gIERFRkFVTFRfQ0hBUl9USFJFU0hPTEQ6IDUwMCxcblxuICAvLyBBbGwgb2YgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbnMgaW4gdXNlIHdpdGhpbiByZWFkYWJpbGl0eS5cbiAgLy8gRGVmaW5lZCB1cCBoZXJlIHNvIHdlIGRvbid0IGluc3RhbnRpYXRlIHRoZW0gcmVwZWF0ZWRseSBpbiBsb29wcy5cbiAgUkVHRVhQUzoge1xuICAgIHVubGlrZWx5Q2FuZGlkYXRlczogLy1hZC18YmFubmVyfGJyZWFkY3J1bWJzfGNvbWJ4fGNvbW1lbnR8Y29tbXVuaXR5fGNvdmVyLXdyYXB8ZGlzcXVzfGV4dHJhfGZvb3R8aGVhZGVyfGxlZ2VuZHN8bWVudXxyZWxhdGVkfHJlbWFya3xyZXBsaWVzfHJzc3xzaG91dGJveHxzaWRlYmFyfHNreXNjcmFwZXJ8c29jaWFsfHNwb25zb3J8c3VwcGxlbWVudGFsfGFkLWJyZWFrfGFnZWdhdGV8cGFnaW5hdGlvbnxwYWdlcnxwb3B1cHx5b20tcmVtb3RlL2ksXG4gICAgb2tNYXliZUl0c0FDYW5kaWRhdGU6IC9hbmR8YXJ0aWNsZXxib2R5fGNvbHVtbnxtYWlufHNoYWRvdy9pLFxuICAgIHBvc2l0aXZlOiAvYXJ0aWNsZXxib2R5fGNvbnRlbnR8ZW50cnl8aGVudHJ5fGgtZW50cnl8bWFpbnxwYWdlfHBhZ2luYXRpb258cG9zdHx0ZXh0fGJsb2d8c3RvcnkvaSxcbiAgICBuZWdhdGl2ZTogL2hpZGRlbnxeaGlkJHwgaGlkJHwgaGlkIHxeaGlkIHxiYW5uZXJ8Y29tYnh8Y29tbWVudHxjb20tfGNvbnRhY3R8Zm9vdHxmb290ZXJ8Zm9vdG5vdGV8bWFzdGhlYWR8bWVkaWF8bWV0YXxvdXRicmFpbnxwcm9tb3xyZWxhdGVkfHNjcm9sbHxzaGFyZXxzaG91dGJveHxzaWRlYmFyfHNreXNjcmFwZXJ8c3BvbnNvcnxzaG9wcGluZ3x0YWdzfHRvb2x8d2lkZ2V0L2ksXG4gICAgZXh0cmFuZW91czogL3ByaW50fGFyY2hpdmV8Y29tbWVudHxkaXNjdXNzfGVbXFwtXT9tYWlsfHNoYXJlfHJlcGx5fGFsbHxsb2dpbnxzaWdufHNpbmdsZXx1dGlsaXR5L2ksXG4gICAgYnlsaW5lOiAvYnlsaW5lfGF1dGhvcnxkYXRlbGluZXx3cml0dGVuYnl8cC1hdXRob3IvaSxcbiAgICByZXBsYWNlRm9udHM6IC88KFxcLz8pZm9udFtePl0qPi9naSxcbiAgICBub3JtYWxpemU6IC9cXHN7Mix9L2csXG4gICAgdmlkZW9zOiAvXFwvXFwvKHd3d1xcLik/KGRhaWx5bW90aW9ufHlvdXR1YmV8eW91dHViZS1ub2Nvb2tpZXxwbGF5ZXJcXC52aW1lbylcXC5jb20vaSxcbiAgICBuZXh0TGluazogLyhuZXh0fHdlaXRlcnxjb250aW51ZXw+KFteXFx8XXwkKXzCuyhbXlxcfF18JCkpL2ksXG4gICAgcHJldkxpbms6IC8ocHJldnxlYXJsfG9sZHxuZXd8PHzCqykvaSxcbiAgICB3aGl0ZXNwYWNlOiAvXlxccyokLyxcbiAgICBoYXNDb250ZW50OiAvXFxTJC8sXG4gIH0sXG5cbiAgRElWX1RPX1BfRUxFTVM6IFsgXCJBXCIsIFwiQkxPQ0tRVU9URVwiLCBcIkRMXCIsIFwiRElWXCIsIFwiSU1HXCIsIFwiT0xcIiwgXCJQXCIsIFwiUFJFXCIsIFwiVEFCTEVcIiwgXCJVTFwiLCBcIlNFTEVDVFwiIF0sXG5cbiAgQUxURVJfVE9fRElWX0VYQ0VQVElPTlM6IFtcIkRJVlwiLCBcIkFSVElDTEVcIiwgXCJTRUNUSU9OXCIsIFwiUFwiXSxcblxuICBQUkVTRU5UQVRJT05BTF9BVFRSSUJVVEVTOiBbIFwiYWxpZ25cIiwgXCJiYWNrZ3JvdW5kXCIsIFwiYmdjb2xvclwiLCBcImJvcmRlclwiLCBcImNlbGxwYWRkaW5nXCIsIFwiY2VsbHNwYWNpbmdcIiwgXCJmcmFtZVwiLCBcImhzcGFjZVwiLCBcInJ1bGVzXCIsIFwic3R5bGVcIiwgXCJ2YWxpZ25cIiwgXCJ2c3BhY2VcIiBdLFxuXG4gIERFUFJFQ0FURURfU0laRV9BVFRSSUJVVEVfRUxFTVM6IFsgXCJUQUJMRVwiLCBcIlRIXCIsIFwiVERcIiwgXCJIUlwiLCBcIlBSRVwiIF0sXG5cbiAgLy8gVGhlIGNvbW1lbnRlZCBvdXQgZWxlbWVudHMgcXVhbGlmeSBhcyBwaHJhc2luZyBjb250ZW50IGJ1dCB0ZW5kIHRvIGJlXG4gIC8vIHJlbW92ZWQgYnkgcmVhZGFiaWxpdHkgd2hlbiBwdXQgaW50byBwYXJhZ3JhcGhzLCBzbyB3ZSBpZ25vcmUgdGhlbSBoZXJlLlxuICBQSFJBU0lOR19FTEVNUzogW1xuICAgIC8vIFwiQ0FOVkFTXCIsIFwiSUZSQU1FXCIsIFwiU1ZHXCIsIFwiVklERU9cIixcbiAgICBcIkFCQlJcIiwgXCJBVURJT1wiLCBcIkJcIiwgXCJCRE9cIiwgXCJCUlwiLCBcIkJVVFRPTlwiLCBcIkNJVEVcIiwgXCJDT0RFXCIsIFwiREFUQVwiLFxuICAgIFwiREFUQUxJU1RcIiwgXCJERk5cIiwgXCJFTVwiLCBcIkVNQkVEXCIsIFwiSVwiLCBcIklNR1wiLCBcIklOUFVUXCIsIFwiS0JEXCIsIFwiTEFCRUxcIixcbiAgICBcIk1BUktcIiwgXCJNQVRIXCIsIFwiTUVURVJcIiwgXCJOT1NDUklQVFwiLCBcIk9CSkVDVFwiLCBcIk9VVFBVVFwiLCBcIlBST0dSRVNTXCIsIFwiUVwiLFxuICAgIFwiUlVCWVwiLCBcIlNBTVBcIiwgXCJTQ1JJUFRcIiwgXCJTRUxFQ1RcIiwgXCJTTUFMTFwiLCBcIlNQQU5cIiwgXCJTVFJPTkdcIiwgXCJTVUJcIixcbiAgICBcIlNVUFwiLCBcIlRFWFRBUkVBXCIsIFwiVElNRVwiLCBcIlZBUlwiLCBcIldCUlwiXG4gIF0sXG5cbiAgLy8gVGhlc2UgYXJlIHRoZSBjbGFzc2VzIHRoYXQgcmVhZGFiaWxpdHkgc2V0cyBpdHNlbGYuXG4gIENMQVNTRVNfVE9fUFJFU0VSVkU6IFsgXCJwYWdlXCIgXSxcblxuICAvKipcbiAgICogUnVuIGFueSBwb3N0LXByb2Nlc3MgbW9kaWZpY2F0aW9ucyB0byBhcnRpY2xlIGNvbnRlbnQgYXMgbmVjZXNzYXJ5LlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICoqL1xuICBfcG9zdFByb2Nlc3NDb250ZW50OiBmdW5jdGlvbihhcnRpY2xlQ29udGVudCkge1xuICAgIC8vIFJlYWRhYmlsaXR5IGNhbm5vdCBvcGVuIHJlbGF0aXZlIHVyaXMgc28gd2UgY29udmVydCB0aGVtIHRvIGFic29sdXRlIHVyaXMuXG4gICAgdGhpcy5fZml4UmVsYXRpdmVVcmlzKGFydGljbGVDb250ZW50KTtcblxuICAgIC8vIFJlbW92ZSBjbGFzc2VzLlxuICAgIHRoaXMuX2NsZWFuQ2xhc3NlcyhhcnRpY2xlQ29udGVudCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEl0ZXJhdGVzIG92ZXIgYSBOb2RlTGlzdCwgY2FsbHMgYGZpbHRlckZuYCBmb3IgZWFjaCBub2RlIGFuZCByZW1vdmVzIG5vZGVcbiAgICogaWYgZnVuY3Rpb24gcmV0dXJuZWQgYHRydWVgLlxuICAgKlxuICAgKiBJZiBmdW5jdGlvbiBpcyBub3QgcGFzc2VkLCByZW1vdmVzIGFsbCB0aGUgbm9kZXMgaW4gbm9kZSBsaXN0LlxuICAgKlxuICAgKiBAcGFyYW0gTm9kZUxpc3Qgbm9kZUxpc3QgVGhlIG5vZGVzIHRvIG9wZXJhdGUgb25cbiAgICogQHBhcmFtIEZ1bmN0aW9uIGZpbHRlckZuIHRoZSBmdW5jdGlvbiB0byB1c2UgYXMgYSBmaWx0ZXJcbiAgICogQHJldHVybiB2b2lkXG4gICAqL1xuICBfcmVtb3ZlTm9kZXM6IGZ1bmN0aW9uKG5vZGVMaXN0LCBmaWx0ZXJGbikge1xuICAgIGZvciAodmFyIGkgPSBub2RlTGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgdmFyIG5vZGUgPSBub2RlTGlzdFtpXTtcbiAgICAgIHZhciBwYXJlbnROb2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgaWYgKCFmaWx0ZXJGbiB8fCBmaWx0ZXJGbi5jYWxsKHRoaXMsIG5vZGUsIGksIG5vZGVMaXN0KSkge1xuICAgICAgICAgIHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEl0ZXJhdGVzIG92ZXIgYSBOb2RlTGlzdCwgYW5kIGNhbGxzIF9zZXROb2RlVGFnIGZvciBlYWNoIG5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSBOb2RlTGlzdCBub2RlTGlzdCBUaGUgbm9kZXMgdG8gb3BlcmF0ZSBvblxuICAgKiBAcGFyYW0gU3RyaW5nIG5ld1RhZ05hbWUgdGhlIG5ldyB0YWcgbmFtZSB0byB1c2VcbiAgICogQHJldHVybiB2b2lkXG4gICAqL1xuICBfcmVwbGFjZU5vZGVUYWdzOiBmdW5jdGlvbihub2RlTGlzdCwgbmV3VGFnTmFtZSkge1xuICAgIGZvciAodmFyIGkgPSBub2RlTGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgdmFyIG5vZGUgPSBub2RlTGlzdFtpXTtcbiAgICAgIHRoaXMuX3NldE5vZGVUYWcobm9kZSwgbmV3VGFnTmFtZSk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgYSBOb2RlTGlzdCwgd2hpY2ggZG9lc24ndCBuYXRpdmVseSBmdWxseSBpbXBsZW1lbnQgdGhlIEFycmF5XG4gICAqIGludGVyZmFjZS5cbiAgICpcbiAgICogRm9yIGNvbnZlbmllbmNlLCB0aGUgY3VycmVudCBvYmplY3QgY29udGV4dCBpcyBhcHBsaWVkIHRvIHRoZSBwcm92aWRlZFxuICAgKiBpdGVyYXRlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gIE5vZGVMaXN0IG5vZGVMaXN0IFRoZSBOb2RlTGlzdC5cbiAgICogQHBhcmFtICBGdW5jdGlvbiBmbiAgICAgICBUaGUgaXRlcmF0ZSBmdW5jdGlvbi5cbiAgICogQHJldHVybiB2b2lkXG4gICAqL1xuICBfZm9yRWFjaE5vZGU6IGZ1bmN0aW9uKG5vZGVMaXN0LCBmbikge1xuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwobm9kZUxpc3QsIGZuLCB0aGlzKTtcbiAgfSxcblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGEgTm9kZUxpc3QsIHJldHVybiB0cnVlIGlmIGFueSBvZiB0aGUgcHJvdmlkZWQgaXRlcmF0ZVxuICAgKiBmdW5jdGlvbiBjYWxscyByZXR1cm5zIHRydWUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICpcbiAgICogRm9yIGNvbnZlbmllbmNlLCB0aGUgY3VycmVudCBvYmplY3QgY29udGV4dCBpcyBhcHBsaWVkIHRvIHRoZVxuICAgKiBwcm92aWRlZCBpdGVyYXRlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gIE5vZGVMaXN0IG5vZGVMaXN0IFRoZSBOb2RlTGlzdC5cbiAgICogQHBhcmFtICBGdW5jdGlvbiBmbiAgICAgICBUaGUgaXRlcmF0ZSBmdW5jdGlvbi5cbiAgICogQHJldHVybiBCb29sZWFuXG4gICAqL1xuICBfc29tZU5vZGU6IGZ1bmN0aW9uKG5vZGVMaXN0LCBmbikge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc29tZS5jYWxsKG5vZGVMaXN0LCBmbiwgdGhpcyk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBhIE5vZGVMaXN0LCByZXR1cm4gdHJ1ZSBpZiBhbGwgb2YgdGhlIHByb3ZpZGVkIGl0ZXJhdGVcbiAgICogZnVuY3Rpb24gY2FsbHMgcmV0dXJuIHRydWUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICpcbiAgICogRm9yIGNvbnZlbmllbmNlLCB0aGUgY3VycmVudCBvYmplY3QgY29udGV4dCBpcyBhcHBsaWVkIHRvIHRoZVxuICAgKiBwcm92aWRlZCBpdGVyYXRlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gIE5vZGVMaXN0IG5vZGVMaXN0IFRoZSBOb2RlTGlzdC5cbiAgICogQHBhcmFtICBGdW5jdGlvbiBmbiAgICAgICBUaGUgaXRlcmF0ZSBmdW5jdGlvbi5cbiAgICogQHJldHVybiBCb29sZWFuXG4gICAqL1xuICBfZXZlcnlOb2RlOiBmdW5jdGlvbihub2RlTGlzdCwgZm4pIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmV2ZXJ5LmNhbGwobm9kZUxpc3QsIGZuLCB0aGlzKTtcbiAgfSxcblxuICAvKipcbiAgICogQ29uY2F0IGFsbCBub2RlbGlzdHMgcGFzc2VkIGFzIGFyZ3VtZW50cy5cbiAgICpcbiAgICogQHJldHVybiAuLi5Ob2RlTGlzdFxuICAgKiBAcmV0dXJuIEFycmF5XG4gICAqL1xuICBfY29uY2F0Tm9kZUxpc3RzOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgdmFyIG5vZGVMaXN0cyA9IGFyZ3MubWFwKGZ1bmN0aW9uKGxpc3QpIHtcbiAgICAgIHJldHVybiBzbGljZS5jYWxsKGxpc3QpO1xuICAgIH0pO1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBub2RlTGlzdHMpO1xuICB9LFxuXG4gIF9nZXRBbGxOb2Rlc1dpdGhUYWc6IGZ1bmN0aW9uKG5vZGUsIHRhZ05hbWVzKSB7XG4gICAgaWYgKG5vZGUucXVlcnlTZWxlY3RvckFsbCkge1xuICAgICAgcmV0dXJuIG5vZGUucXVlcnlTZWxlY3RvckFsbCh0YWdOYW1lcy5qb2luKCcsJykpO1xuICAgIH1cbiAgICByZXR1cm4gW10uY29uY2F0LmFwcGx5KFtdLCB0YWdOYW1lcy5tYXAoZnVuY3Rpb24odGFnKSB7XG4gICAgICB2YXIgY29sbGVjdGlvbiA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnKTtcbiAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KGNvbGxlY3Rpb24pID8gY29sbGVjdGlvbiA6IEFycmF5LmZyb20oY29sbGVjdGlvbik7XG4gICAgfSkpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSBjbGFzcz1cIlwiIGF0dHJpYnV0ZSBmcm9tIGV2ZXJ5IGVsZW1lbnQgaW4gdGhlIGdpdmVuXG4gICAqIHN1YnRyZWUsIGV4Y2VwdCB0aG9zZSB0aGF0IG1hdGNoIENMQVNTRVNfVE9fUFJFU0VSVkUgYW5kXG4gICAqIHRoZSBjbGFzc2VzVG9QcmVzZXJ2ZSBhcnJheSBmcm9tIHRoZSBvcHRpb25zIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHJldHVybiB2b2lkXG4gICAqL1xuICBfY2xlYW5DbGFzc2VzOiBmdW5jdGlvbihub2RlKSB7XG4gICAgdmFyIGNsYXNzZXNUb1ByZXNlcnZlID0gdGhpcy5fY2xhc3Nlc1RvUHJlc2VydmU7XG4gICAgdmFyIGNsYXNzTmFtZSA9IChub2RlLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpIHx8IFwiXCIpXG4gICAgICAgIC5zcGxpdCgvXFxzKy8pXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oY2xzKSB7XG4gICAgICAgICAgcmV0dXJuIGNsYXNzZXNUb1ByZXNlcnZlLmluZGV4T2YoY2xzKSAhPSAtMTtcbiAgICAgICAgfSlcbiAgICAgICAgLmpvaW4oXCIgXCIpO1xuXG4gICAgaWYgKGNsYXNzTmFtZSkge1xuICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBjbGFzc05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShcImNsYXNzXCIpO1xuICAgIH1cblxuICAgIGZvciAobm9kZSA9IG5vZGUuZmlyc3RFbGVtZW50Q2hpbGQ7IG5vZGU7IG5vZGUgPSBub2RlLm5leHRFbGVtZW50U2libGluZykge1xuICAgICAgdGhpcy5fY2xlYW5DbGFzc2VzKG5vZGUpO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQ29udmVydHMgZWFjaCA8YT4gYW5kIDxpbWc+IHVyaSBpbiB0aGUgZ2l2ZW4gZWxlbWVudCB0byBhbiBhYnNvbHV0ZSBVUkksXG4gICAqIGlnbm9yaW5nICNyZWYgVVJJcy5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHJldHVybiB2b2lkXG4gICAqL1xuICBfZml4UmVsYXRpdmVVcmlzOiBmdW5jdGlvbihhcnRpY2xlQ29udGVudCkge1xuICAgIHZhciBiYXNlVVJJID0gdGhpcy5fZG9jLmJhc2VVUkk7XG4gICAgdmFyIGRvY3VtZW50VVJJID0gdGhpcy5fZG9jLmRvY3VtZW50VVJJO1xuICAgIGZ1bmN0aW9uIHRvQWJzb2x1dGVVUkkodXJpKSB7XG4gICAgICAvLyBMZWF2ZSBoYXNoIGxpbmtzIGFsb25lIGlmIHRoZSBiYXNlIFVSSSBtYXRjaGVzIHRoZSBkb2N1bWVudCBVUkk6XG4gICAgICBpZiAoYmFzZVVSSSA9PSBkb2N1bWVudFVSSSAmJiB1cmkuY2hhckF0KDApID09IFwiI1wiKSB7XG4gICAgICAgIHJldHVybiB1cmk7XG4gICAgICB9XG4gICAgICAvLyBPdGhlcndpc2UsIHJlc29sdmUgYWdhaW5zdCBiYXNlIFVSSTpcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBuZXcgVVJMKHVyaSwgYmFzZVVSSSkuaHJlZjtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIC8vIFNvbWV0aGluZyB3ZW50IHdyb25nLCBqdXN0IHJldHVybiB0aGUgb3JpZ2luYWw6XG4gICAgICB9XG4gICAgICByZXR1cm4gdXJpO1xuICAgIH1cblxuICAgIHZhciBsaW5rcyA9IGFydGljbGVDb250ZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYVwiKTtcbiAgICB0aGlzLl9mb3JFYWNoTm9kZShsaW5rcywgZnVuY3Rpb24obGluaykge1xuICAgICAgdmFyIGhyZWYgPSBsaW5rLmdldEF0dHJpYnV0ZShcImhyZWZcIik7XG4gICAgICBpZiAoaHJlZikge1xuICAgICAgICAvLyBSZXBsYWNlIGxpbmtzIHdpdGggamF2YXNjcmlwdDogVVJJcyB3aXRoIHRleHQgY29udGVudCwgc2luY2VcbiAgICAgICAgLy8gdGhleSB3b24ndCB3b3JrIGFmdGVyIHNjcmlwdHMgaGF2ZSBiZWVuIHJlbW92ZWQgZnJvbSB0aGUgcGFnZS5cbiAgICAgICAgaWYgKGhyZWYuaW5kZXhPZihcImphdmFzY3JpcHQ6XCIpID09PSAwKSB7XG4gICAgICAgICAgdmFyIHRleHQgPSB0aGlzLl9kb2MuY3JlYXRlVGV4dE5vZGUobGluay50ZXh0Q29udGVudCk7XG4gICAgICAgICAgbGluay5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZCh0ZXh0LCBsaW5rKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaW5rLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgdG9BYnNvbHV0ZVVSSShocmVmKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBpbWdzID0gYXJ0aWNsZUNvbnRlbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbWdcIik7XG4gICAgdGhpcy5fZm9yRWFjaE5vZGUoaW1ncywgZnVuY3Rpb24oaW1nKSB7XG4gICAgICB2YXIgc3JjID0gaW1nLmdldEF0dHJpYnV0ZShcInNyY1wiKTtcbiAgICAgIGlmIChzcmMpIHtcbiAgICAgICAgaW1nLnNldEF0dHJpYnV0ZShcInNyY1wiLCB0b0Fic29sdXRlVVJJKHNyYykpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFydGljbGUgdGl0bGUgYXMgYW4gSDEuXG4gICAqXG4gICAqIEByZXR1cm4gdm9pZFxuICAgKiovXG4gIF9nZXRBcnRpY2xlVGl0bGU6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkb2MgPSB0aGlzLl9kb2M7XG4gICAgdmFyIGN1clRpdGxlID0gXCJcIjtcbiAgICB2YXIgb3JpZ1RpdGxlID0gXCJcIjtcblxuICAgIHRyeSB7XG4gICAgICBjdXJUaXRsZSA9IG9yaWdUaXRsZSA9IGRvYy50aXRsZS50cmltKCk7XG5cbiAgICAgIC8vIElmIHRoZXkgaGFkIGFuIGVsZW1lbnQgd2l0aCBpZCBcInRpdGxlXCIgaW4gdGhlaXIgSFRNTFxuICAgICAgaWYgKHR5cGVvZiBjdXJUaXRsZSAhPT0gXCJzdHJpbmdcIilcbiAgICAgICAgY3VyVGl0bGUgPSBvcmlnVGl0bGUgPSB0aGlzLl9nZXRJbm5lclRleHQoZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCd0aXRsZScpWzBdKTtcbiAgICB9IGNhdGNoIChlKSB7LyogaWdub3JlIGV4Y2VwdGlvbnMgc2V0dGluZyB0aGUgdGl0bGUuICovfVxuXG4gICAgdmFyIHRpdGxlSGFkSGllcmFyY2hpY2FsU2VwYXJhdG9ycyA9IGZhbHNlO1xuICAgIGZ1bmN0aW9uIHdvcmRDb3VudChzdHIpIHtcbiAgICAgIHJldHVybiBzdHIuc3BsaXQoL1xccysvKS5sZW5ndGg7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUncyBhIHNlcGFyYXRvciBpbiB0aGUgdGl0bGUsIGZpcnN0IHJlbW92ZSB0aGUgZmluYWwgcGFydFxuICAgIGlmICgoLyBbXFx8XFwtXFxcXFxcLz7Cu10gLykudGVzdChjdXJUaXRsZSkpIHtcbiAgICAgIHRpdGxlSGFkSGllcmFyY2hpY2FsU2VwYXJhdG9ycyA9IC8gW1xcXFxcXC8+wrtdIC8udGVzdChjdXJUaXRsZSk7XG4gICAgICBjdXJUaXRsZSA9IG9yaWdUaXRsZS5yZXBsYWNlKC8oLiopW1xcfFxcLVxcXFxcXC8+wrtdIC4qL2dpLCAnJDEnKTtcblxuICAgICAgLy8gSWYgdGhlIHJlc3VsdGluZyB0aXRsZSBpcyB0b28gc2hvcnQgKDMgd29yZHMgb3IgZmV3ZXIpLCByZW1vdmVcbiAgICAgIC8vIHRoZSBmaXJzdCBwYXJ0IGluc3RlYWQ6XG4gICAgICBpZiAod29yZENvdW50KGN1clRpdGxlKSA8IDMpXG4gICAgICAgIGN1clRpdGxlID0gb3JpZ1RpdGxlLnJlcGxhY2UoL1teXFx8XFwtXFxcXFxcLz7Cu10qW1xcfFxcLVxcXFxcXC8+wrtdKC4qKS9naSwgJyQxJyk7XG4gICAgfSBlbHNlIGlmIChjdXJUaXRsZS5pbmRleE9mKCc6ICcpICE9PSAtMSkge1xuICAgICAgLy8gQ2hlY2sgaWYgd2UgaGF2ZSBhbiBoZWFkaW5nIGNvbnRhaW5pbmcgdGhpcyBleGFjdCBzdHJpbmcsIHNvIHdlXG4gICAgICAvLyBjb3VsZCBhc3N1bWUgaXQncyB0aGUgZnVsbCB0aXRsZS5cbiAgICAgIHZhciBoZWFkaW5ncyA9IHRoaXMuX2NvbmNhdE5vZGVMaXN0cyhcbiAgICAgICAgICBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2gxJyksXG4gICAgICAgICAgZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoMicpXG4gICAgICApO1xuICAgICAgdmFyIHRyaW1tZWRUaXRsZSA9IGN1clRpdGxlLnRyaW0oKTtcbiAgICAgIHZhciBtYXRjaCA9IHRoaXMuX3NvbWVOb2RlKGhlYWRpbmdzLCBmdW5jdGlvbihoZWFkaW5nKSB7XG4gICAgICAgIHJldHVybiBoZWFkaW5nLnRleHRDb250ZW50LnRyaW0oKSA9PT0gdHJpbW1lZFRpdGxlO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIElmIHdlIGRvbid0LCBsZXQncyBleHRyYWN0IHRoZSB0aXRsZSBvdXQgb2YgdGhlIG9yaWdpbmFsIHRpdGxlIHN0cmluZy5cbiAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgY3VyVGl0bGUgPSBvcmlnVGl0bGUuc3Vic3RyaW5nKG9yaWdUaXRsZS5sYXN0SW5kZXhPZignOicpICsgMSk7XG5cbiAgICAgICAgLy8gSWYgdGhlIHRpdGxlIGlzIG5vdyB0b28gc2hvcnQsIHRyeSB0aGUgZmlyc3QgY29sb24gaW5zdGVhZDpcbiAgICAgICAgaWYgKHdvcmRDb3VudChjdXJUaXRsZSkgPCAzKSB7XG4gICAgICAgICAgY3VyVGl0bGUgPSBvcmlnVGl0bGUuc3Vic3RyaW5nKG9yaWdUaXRsZS5pbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICAvLyBCdXQgaWYgd2UgaGF2ZSB0b28gbWFueSB3b3JkcyBiZWZvcmUgdGhlIGNvbG9uIHRoZXJlJ3Mgc29tZXRoaW5nIHdlaXJkXG4gICAgICAgICAgLy8gd2l0aCB0aGUgdGl0bGVzIGFuZCB0aGUgSCB0YWdzIHNvIGxldCdzIGp1c3QgdXNlIHRoZSBvcmlnaW5hbCB0aXRsZSBpbnN0ZWFkXG4gICAgICAgIH0gZWxzZSBpZiAod29yZENvdW50KG9yaWdUaXRsZS5zdWJzdHIoMCwgb3JpZ1RpdGxlLmluZGV4T2YoJzonKSkpID4gNSkge1xuICAgICAgICAgIGN1clRpdGxlID0gb3JpZ1RpdGxlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjdXJUaXRsZS5sZW5ndGggPiAxNTAgfHwgY3VyVGl0bGUubGVuZ3RoIDwgMTUpIHtcbiAgICAgIHZhciBoT25lcyA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaDEnKTtcblxuICAgICAgaWYgKGhPbmVzLmxlbmd0aCA9PT0gMSlcbiAgICAgICAgY3VyVGl0bGUgPSB0aGlzLl9nZXRJbm5lclRleHQoaE9uZXNbMF0pO1xuICAgIH1cblxuICAgIGN1clRpdGxlID0gY3VyVGl0bGUudHJpbSgpO1xuICAgIC8vIElmIHdlIG5vdyBoYXZlIDQgd29yZHMgb3IgZmV3ZXIgYXMgb3VyIHRpdGxlLCBhbmQgZWl0aGVyIG5vXG4gICAgLy8gJ2hpZXJhcmNoaWNhbCcgc2VwYXJhdG9ycyAoXFwsIC8sID4gb3IgwrspIHdlcmUgZm91bmQgaW4gdGhlIG9yaWdpbmFsXG4gICAgLy8gdGl0bGUgb3Igd2UgZGVjcmVhc2VkIHRoZSBudW1iZXIgb2Ygd29yZHMgYnkgbW9yZSB0aGFuIDEgd29yZCwgdXNlXG4gICAgLy8gdGhlIG9yaWdpbmFsIHRpdGxlLlxuICAgIHZhciBjdXJUaXRsZVdvcmRDb3VudCA9IHdvcmRDb3VudChjdXJUaXRsZSk7XG4gICAgaWYgKGN1clRpdGxlV29yZENvdW50IDw9IDQgJiZcbiAgICAgICAgKCF0aXRsZUhhZEhpZXJhcmNoaWNhbFNlcGFyYXRvcnMgfHxcbiAgICAgICAgY3VyVGl0bGVXb3JkQ291bnQgIT0gd29yZENvdW50KG9yaWdUaXRsZS5yZXBsYWNlKC9bXFx8XFwtXFxcXFxcLz7Cu10rL2csIFwiXCIpKSAtIDEpKSB7XG4gICAgICBjdXJUaXRsZSA9IG9yaWdUaXRsZTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3VyVGl0bGU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFByZXBhcmUgdGhlIEhUTUwgZG9jdW1lbnQgZm9yIHJlYWRhYmlsaXR5IHRvIHNjcmFwZSBpdC5cbiAgICogVGhpcyBpbmNsdWRlcyB0aGluZ3MgbGlrZSBzdHJpcHBpbmcgamF2YXNjcmlwdCwgQ1NTLCBhbmQgaGFuZGxpbmcgdGVycmlibGUgbWFya3VwLlxuICAgKlxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICoqL1xuICBfcHJlcERvY3VtZW50OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgZG9jID0gdGhpcy5fZG9jO1xuXG4gICAgLy8gUmVtb3ZlIGFsbCBzdHlsZSB0YWdzIGluIGhlYWRcbiAgICB0aGlzLl9yZW1vdmVOb2Rlcyh0aGlzLl9ib2R5LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3R5bGVcIikpO1xuXG4gICAgaWYgKHRoaXMuYm9keSkge1xuICAgICAgdGhpcy5fcmVwbGFjZUJycyh0aGlzLl9ib2R5KTtcbiAgICB9XG5cbiAgICB0aGlzLl9yZXBsYWNlTm9kZVRhZ3ModGhpcy5fYm9keS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImZvbnRcIiksIFwiU1BBTlwiKTtcbiAgfSxcblxuICAvKipcbiAgICogRmluZHMgdGhlIG5leHQgZWxlbWVudCwgc3RhcnRpbmcgZnJvbSB0aGUgZ2l2ZW4gbm9kZSwgYW5kIGlnbm9yaW5nXG4gICAqIHdoaXRlc3BhY2UgaW4gYmV0d2Vlbi4gSWYgdGhlIGdpdmVuIG5vZGUgaXMgYW4gZWxlbWVudCwgdGhlIHNhbWUgbm9kZSBpc1xuICAgKiByZXR1cm5lZC5cbiAgICovXG4gIF9uZXh0RWxlbWVudDogZnVuY3Rpb24gKG5vZGUpIHtcbiAgICB2YXIgbmV4dCA9IG5vZGU7XG4gICAgd2hpbGUgKG5leHRcbiAgICAmJiAobmV4dC5ub2RlVHlwZSAhPSB0aGlzLkVMRU1FTlRfTk9ERSlcbiAgICAmJiB0aGlzLlJFR0VYUFMud2hpdGVzcGFjZS50ZXN0KG5leHQudGV4dENvbnRlbnQpKSB7XG4gICAgICBuZXh0ID0gbmV4dC5uZXh0U2libGluZztcbiAgICB9XG4gICAgcmV0dXJuIG5leHQ7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlcGxhY2VzIDIgb3IgbW9yZSBzdWNjZXNzaXZlIDxicj4gZWxlbWVudHMgd2l0aCBhIHNpbmdsZSA8cD4uXG4gICAqIFdoaXRlc3BhY2UgYmV0d2VlbiA8YnI+IGVsZW1lbnRzIGFyZSBpZ25vcmVkLiBGb3IgZXhhbXBsZTpcbiAgICogICA8ZGl2PmZvbzxicj5iYXI8YnI+IDxicj48YnI+YWJjPC9kaXY+XG4gICAqIHdpbGwgYmVjb21lOlxuICAgKiAgIDxkaXY+Zm9vPGJyPmJhcjxwPmFiYzwvcD48L2Rpdj5cbiAgICovXG4gIF9yZXBsYWNlQnJzOiBmdW5jdGlvbiAoZWxlbSkge1xuICAgIHRoaXMuX2ZvckVhY2hOb2RlKHRoaXMuX2dldEFsbE5vZGVzV2l0aFRhZyhlbGVtLCBbXCJiclwiXSksIGZ1bmN0aW9uKGJyKSB7XG4gICAgICB2YXIgbmV4dCA9IGJyLm5leHRTaWJsaW5nO1xuXG4gICAgICAvLyBXaGV0aGVyIDIgb3IgbW9yZSA8YnI+IGVsZW1lbnRzIGhhdmUgYmVlbiBmb3VuZCBhbmQgcmVwbGFjZWQgd2l0aCBhXG4gICAgICAvLyA8cD4gYmxvY2suXG4gICAgICB2YXIgcmVwbGFjZWQgPSBmYWxzZTtcblxuICAgICAgLy8gSWYgd2UgZmluZCBhIDxicj4gY2hhaW4sIHJlbW92ZSB0aGUgPGJyPnMgdW50aWwgd2UgaGl0IGFub3RoZXIgZWxlbWVudFxuICAgICAgLy8gb3Igbm9uLXdoaXRlc3BhY2UuIFRoaXMgbGVhdmVzIGJlaGluZCB0aGUgZmlyc3QgPGJyPiBpbiB0aGUgY2hhaW5cbiAgICAgIC8vICh3aGljaCB3aWxsIGJlIHJlcGxhY2VkIHdpdGggYSA8cD4gbGF0ZXIpLlxuICAgICAgd2hpbGUgKChuZXh0ID0gdGhpcy5fbmV4dEVsZW1lbnQobmV4dCkpICYmIChuZXh0LnRhZ05hbWUgPT0gXCJCUlwiKSkge1xuICAgICAgICByZXBsYWNlZCA9IHRydWU7XG4gICAgICAgIHZhciBiclNpYmxpbmcgPSBuZXh0Lm5leHRTaWJsaW5nO1xuICAgICAgICBuZXh0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobmV4dCk7XG4gICAgICAgIG5leHQgPSBiclNpYmxpbmc7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHdlIHJlbW92ZWQgYSA8YnI+IGNoYWluLCByZXBsYWNlIHRoZSByZW1haW5pbmcgPGJyPiB3aXRoIGEgPHA+LiBBZGRcbiAgICAgIC8vIGFsbCBzaWJsaW5nIG5vZGVzIGFzIGNoaWxkcmVuIG9mIHRoZSA8cD4gdW50aWwgd2UgaGl0IGFub3RoZXIgPGJyPlxuICAgICAgLy8gY2hhaW4uXG4gICAgICBpZiAocmVwbGFjZWQpIHtcbiAgICAgICAgdmFyIHAgPSB0aGlzLl9kb2MuY3JlYXRlRWxlbWVudChcInBcIik7XG4gICAgICAgIGJyLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKHAsIGJyKTtcblxuICAgICAgICBuZXh0ID0gcC5uZXh0U2libGluZztcbiAgICAgICAgd2hpbGUgKG5leHQpIHtcbiAgICAgICAgICAvLyBJZiB3ZSd2ZSBoaXQgYW5vdGhlciA8YnI+PGJyPiwgd2UncmUgZG9uZSBhZGRpbmcgY2hpbGRyZW4gdG8gdGhpcyA8cD4uXG4gICAgICAgICAgaWYgKG5leHQudGFnTmFtZSA9PSBcIkJSXCIpIHtcbiAgICAgICAgICAgIHZhciBuZXh0RWxlbSA9IHRoaXMuX25leHRFbGVtZW50KG5leHQubmV4dFNpYmxpbmcpO1xuICAgICAgICAgICAgaWYgKG5leHRFbGVtICYmIG5leHRFbGVtLnRhZ05hbWUgPT0gXCJCUlwiKVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIXRoaXMuX2lzUGhyYXNpbmdDb250ZW50KG5leHQpKSBicmVhaztcblxuICAgICAgICAgIC8vIE90aGVyd2lzZSwgbWFrZSB0aGlzIG5vZGUgYSBjaGlsZCBvZiB0aGUgbmV3IDxwPi5cbiAgICAgICAgICB2YXIgc2libGluZyA9IG5leHQubmV4dFNpYmxpbmc7XG4gICAgICAgICAgcC5hcHBlbmRDaGlsZChuZXh0KTtcbiAgICAgICAgICBuZXh0ID0gc2libGluZztcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChwLmxhc3RDaGlsZCAmJiB0aGlzLl9pc1doaXRlc3BhY2UocC5sYXN0Q2hpbGQpKSBwLnJlbW92ZUNoaWxkKHAubGFzdENoaWxkKTtcblxuICAgICAgICBpZiAocC5wYXJlbnROb2RlLnRhZ05hbWUgPT09IFwiUFwiKSB0aGlzLl9zZXROb2RlVGFnKHAucGFyZW50Tm9kZSwgXCJESVZcIik7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgX3NldE5vZGVUYWc6IGZ1bmN0aW9uIChub2RlLCB0YWcpIHtcbiAgICB0aGlzLmxvZyhcIl9zZXROb2RlVGFnXCIsIG5vZGUsIHRhZyk7XG4gICAgaWYgKG5vZGUuX19KU0RPTVBhcnNlcl9fKSB7XG4gICAgICBub2RlLmxvY2FsTmFtZSA9IHRhZy50b0xvd2VyQ2FzZSgpO1xuICAgICAgbm9kZS50YWdOYW1lID0gdGFnLnRvVXBwZXJDYXNlKCk7XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICB2YXIgcmVwbGFjZW1lbnQgPSBub2RlLm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgIHdoaWxlIChub2RlLmZpcnN0Q2hpbGQpIHtcbiAgICAgIHJlcGxhY2VtZW50LmFwcGVuZENoaWxkKG5vZGUuZmlyc3RDaGlsZCk7XG4gICAgfVxuICAgIG5vZGUucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQocmVwbGFjZW1lbnQsIG5vZGUpO1xuICAgIGlmIChub2RlLnJlYWRhYmlsaXR5KVxuICAgICAgcmVwbGFjZW1lbnQucmVhZGFiaWxpdHkgPSBub2RlLnJlYWRhYmlsaXR5O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlcGxhY2VtZW50LnNldEF0dHJpYnV0ZShub2RlLmF0dHJpYnV0ZXNbaV0ubmFtZSwgbm9kZS5hdHRyaWJ1dGVzW2ldLnZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcGxhY2VtZW50O1xuICB9LFxuXG4gIC8qKlxuICAgKiBQcmVwYXJlIHRoZSBhcnRpY2xlIG5vZGUgZm9yIGRpc3BsYXkuIENsZWFuIG91dCBhbnkgaW5saW5lIHN0eWxlcyxcbiAgICogaWZyYW1lcywgZm9ybXMsIHN0cmlwIGV4dHJhbmVvdXMgPHA+IHRhZ3MsIGV0Yy5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHJldHVybiB2b2lkXG4gICAqKi9cbiAgX3ByZXBBcnRpY2xlOiBmdW5jdGlvbihhcnRpY2xlQ29udGVudCkge1xuICAgIHRoaXMuX2NsZWFuU3R5bGVzKGFydGljbGVDb250ZW50KTtcblxuICAgIC8vIENoZWNrIGZvciBkYXRhIHRhYmxlcyBiZWZvcmUgd2UgY29udGludWUsIHRvIGF2b2lkIHJlbW92aW5nIGl0ZW1zIGluXG4gICAgLy8gdGhvc2UgdGFibGVzLCB3aGljaCB3aWxsIG9mdGVuIGJlIGlzb2xhdGVkIGV2ZW4gdGhvdWdoIHRoZXkncmVcbiAgICAvLyB2aXN1YWxseSBsaW5rZWQgdG8gb3RoZXIgY29udGVudC1mdWwgZWxlbWVudHMgKHRleHQsIGltYWdlcywgZXRjLikuXG4gICAgdGhpcy5fbWFya0RhdGFUYWJsZXMoYXJ0aWNsZUNvbnRlbnQpO1xuXG4gICAgLy8gQ2xlYW4gb3V0IGp1bmsgZnJvbSB0aGUgYXJ0aWNsZSBjb250ZW50XG4gICAgdGhpcy5fY2xlYW5Db25kaXRpb25hbGx5KGFydGljbGVDb250ZW50LCBcImZvcm1cIik7XG4gICAgdGhpcy5fY2xlYW5Db25kaXRpb25hbGx5KGFydGljbGVDb250ZW50LCBcImZpZWxkc2V0XCIpO1xuICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcIm9iamVjdFwiKTtcbiAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJlbWJlZFwiKTtcbiAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJoMVwiKTtcbiAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJmb290ZXJcIik7XG4gICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwibGlua1wiKTtcbiAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJhc2lkZVwiKTtcblxuICAgIC8vIENsZWFuIG91dCBlbGVtZW50cyBoYXZlIFwic2hhcmVcIiBpbiB0aGVpciBpZC9jbGFzcyBjb21iaW5hdGlvbnMgZnJvbSBmaW5hbCB0b3AgY2FuZGlkYXRlcyxcbiAgICAvLyB3aGljaCBtZWFucyB3ZSBkb24ndCByZW1vdmUgdGhlIHRvcCBjYW5kaWRhdGVzIGV2ZW4gdGhleSBoYXZlIFwic2hhcmVcIi5cbiAgICB0aGlzLl9mb3JFYWNoTm9kZShhcnRpY2xlQ29udGVudC5jaGlsZHJlbiwgZnVuY3Rpb24odG9wQ2FuZGlkYXRlKSB7XG4gICAgICB0aGlzLl9jbGVhbk1hdGNoZWROb2Rlcyh0b3BDYW5kaWRhdGUsIC9zaGFyZS8pO1xuICAgIH0pO1xuXG4gICAgLy8gSWYgdGhlcmUgaXMgb25seSBvbmUgaDIgYW5kIGl0cyB0ZXh0IGNvbnRlbnQgc3Vic3RhbnRpYWxseSBlcXVhbHMgYXJ0aWNsZSB0aXRsZSxcbiAgICAvLyB0aGV5IGFyZSBwcm9iYWJseSB1c2luZyBpdCBhcyBhIGhlYWRlciBhbmQgbm90IGEgc3ViaGVhZGVyLFxuICAgIC8vIHNvIHJlbW92ZSBpdCBzaW5jZSB3ZSBhbHJlYWR5IGV4dHJhY3QgdGhlIHRpdGxlIHNlcGFyYXRlbHkuXG4gICAgdmFyIGgyID0gYXJ0aWNsZUNvbnRlbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2gyJyk7XG4gICAgaWYgKGgyLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdmFyIGxlbmd0aFNpbWlsYXJSYXRlID0gKGgyWzBdLnRleHRDb250ZW50Lmxlbmd0aCAtIHRoaXMuX2FydGljbGVUaXRsZS5sZW5ndGgpIC8gdGhpcy5fYXJ0aWNsZVRpdGxlLmxlbmd0aDtcbiAgICAgIGlmIChNYXRoLmFicyhsZW5ndGhTaW1pbGFyUmF0ZSkgPCAwLjUpIHtcbiAgICAgICAgdmFyIHRpdGxlc01hdGNoID0gZmFsc2U7XG4gICAgICAgIGlmIChsZW5ndGhTaW1pbGFyUmF0ZSA+IDApIHtcbiAgICAgICAgICB0aXRsZXNNYXRjaCA9IGgyWzBdLnRleHRDb250ZW50LmluY2x1ZGVzKHRoaXMuX2FydGljbGVUaXRsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGl0bGVzTWF0Y2ggPSB0aGlzLl9hcnRpY2xlVGl0bGUuaW5jbHVkZXMoaDJbMF0udGV4dENvbnRlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aXRsZXNNYXRjaCkge1xuICAgICAgICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcImgyXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwiaWZyYW1lXCIpO1xuICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcImlucHV0XCIpO1xuICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcInRleHRhcmVhXCIpO1xuICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcInNlbGVjdFwiKTtcbiAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJidXR0b25cIik7XG4gICAgdGhpcy5fY2xlYW5IZWFkZXJzKGFydGljbGVDb250ZW50KTtcblxuICAgIC8vIERvIHRoZXNlIGxhc3QgYXMgdGhlIHByZXZpb3VzIHN0dWZmIG1heSBoYXZlIHJlbW92ZWQganVua1xuICAgIC8vIHRoYXQgd2lsbCBhZmZlY3QgdGhlc2VcbiAgICB0aGlzLl9jbGVhbkNvbmRpdGlvbmFsbHkoYXJ0aWNsZUNvbnRlbnQsIFwidGFibGVcIik7XG4gICAgdGhpcy5fY2xlYW5Db25kaXRpb25hbGx5KGFydGljbGVDb250ZW50LCBcInVsXCIpO1xuICAgIHRoaXMuX2NsZWFuQ29uZGl0aW9uYWxseShhcnRpY2xlQ29udGVudCwgXCJkaXZcIik7XG5cbiAgICAvLyBSZW1vdmUgZXh0cmEgcGFyYWdyYXBoc1xuICAgIHRoaXMuX3JlbW92ZU5vZGVzKGFydGljbGVDb250ZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdwJyksIGZ1bmN0aW9uIChwYXJhZ3JhcGgpIHtcbiAgICAgIHZhciBpbWdDb3VudCA9IHBhcmFncmFwaC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJykubGVuZ3RoO1xuICAgICAgdmFyIGVtYmVkQ291bnQgPSBwYXJhZ3JhcGguZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2VtYmVkJykubGVuZ3RoO1xuICAgICAgdmFyIG9iamVjdENvdW50ID0gcGFyYWdyYXBoLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdvYmplY3QnKS5sZW5ndGg7XG4gICAgICAvLyBBdCB0aGlzIHBvaW50LCBuYXN0eSBpZnJhbWVzIGhhdmUgYmVlbiByZW1vdmVkLCBvbmx5IHJlbWFpbiBlbWJlZGRlZCB2aWRlbyBvbmVzLlxuICAgICAgdmFyIGlmcmFtZUNvdW50ID0gcGFyYWdyYXBoLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKS5sZW5ndGg7XG4gICAgICB2YXIgdG90YWxDb3VudCA9IGltZ0NvdW50ICsgZW1iZWRDb3VudCArIG9iamVjdENvdW50ICsgaWZyYW1lQ291bnQ7XG5cbiAgICAgIHJldHVybiB0b3RhbENvdW50ID09PSAwICYmICF0aGlzLl9nZXRJbm5lclRleHQocGFyYWdyYXBoLCBmYWxzZSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9mb3JFYWNoTm9kZSh0aGlzLl9nZXRBbGxOb2Rlc1dpdGhUYWcoYXJ0aWNsZUNvbnRlbnQsIFtcImJyXCJdKSwgZnVuY3Rpb24oYnIpIHtcbiAgICAgIHZhciBuZXh0ID0gdGhpcy5fbmV4dEVsZW1lbnQoYnIubmV4dFNpYmxpbmcpO1xuICAgICAgaWYgKG5leHQgJiYgbmV4dC50YWdOYW1lID09IFwiUFwiKVxuICAgICAgICBici5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGJyKTtcbiAgICB9KTtcblxuICAgIC8vIFJlbW92ZSBzaW5nbGUtY2VsbCB0YWJsZXNcbiAgICB0aGlzLl9mb3JFYWNoTm9kZSh0aGlzLl9nZXRBbGxOb2Rlc1dpdGhUYWcoYXJ0aWNsZUNvbnRlbnQsIFtcInRhYmxlXCJdKSwgZnVuY3Rpb24odGFibGUpIHtcbiAgICAgIHZhciB0Ym9keSA9IHRoaXMuX2hhc1NpbmdsZVRhZ0luc2lkZUVsZW1lbnQodGFibGUsIFwiVEJPRFlcIikgPyB0YWJsZS5maXJzdEVsZW1lbnRDaGlsZCA6IHRhYmxlO1xuICAgICAgaWYgKHRoaXMuX2hhc1NpbmdsZVRhZ0luc2lkZUVsZW1lbnQodGJvZHksIFwiVFJcIikpIHtcbiAgICAgICAgdmFyIHJvdyA9IHRib2R5LmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICBpZiAodGhpcy5faGFzU2luZ2xlVGFnSW5zaWRlRWxlbWVudChyb3csIFwiVERcIikpIHtcbiAgICAgICAgICB2YXIgY2VsbCA9IHJvdy5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICBjZWxsID0gdGhpcy5fc2V0Tm9kZVRhZyhjZWxsLCB0aGlzLl9ldmVyeU5vZGUoY2VsbC5jaGlsZE5vZGVzLCB0aGlzLl9pc1BocmFzaW5nQ29udGVudCkgPyBcIlBcIiA6IFwiRElWXCIpO1xuICAgICAgICAgIHRhYmxlLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGNlbGwsIHRhYmxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGEgbm9kZSB3aXRoIHRoZSByZWFkYWJpbGl0eSBvYmplY3QuIEFsc28gY2hlY2tzIHRoZVxuICAgKiBjbGFzc05hbWUvaWQgZm9yIHNwZWNpYWwgbmFtZXMgdG8gYWRkIHRvIGl0cyBzY29yZS5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHJldHVybiB2b2lkXG4gICAqKi9cbiAgX2luaXRpYWxpemVOb2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgbm9kZS5yZWFkYWJpbGl0eSA9IHtcImNvbnRlbnRTY29yZVwiOiAwfTtcblxuICAgIHN3aXRjaCAobm9kZS50YWdOYW1lKSB7XG4gICAgICBjYXNlICdESVYnOlxuICAgICAgICBub2RlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSArPSA1O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnUFJFJzpcbiAgICAgIGNhc2UgJ1REJzpcbiAgICAgIGNhc2UgJ0JMT0NLUVVPVEUnOlxuICAgICAgICBub2RlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSArPSAzO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnQUREUkVTUyc6XG4gICAgICBjYXNlICdPTCc6XG4gICAgICBjYXNlICdVTCc6XG4gICAgICBjYXNlICdETCc6XG4gICAgICBjYXNlICdERCc6XG4gICAgICBjYXNlICdEVCc6XG4gICAgICBjYXNlICdMSSc6XG4gICAgICBjYXNlICdGT1JNJzpcbiAgICAgICAgbm9kZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgLT0gMztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ0gxJzpcbiAgICAgIGNhc2UgJ0gyJzpcbiAgICAgIGNhc2UgJ0gzJzpcbiAgICAgIGNhc2UgJ0g0JzpcbiAgICAgIGNhc2UgJ0g1JzpcbiAgICAgIGNhc2UgJ0g2JzpcbiAgICAgIGNhc2UgJ1RIJzpcbiAgICAgICAgbm9kZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgLT0gNTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgbm9kZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgKz0gdGhpcy5fZ2V0Q2xhc3NXZWlnaHQobm9kZSk7XG4gIH0sXG5cbiAgX3JlbW92ZUFuZEdldE5leHQ6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICB2YXIgbmV4dE5vZGUgPSB0aGlzLl9nZXROZXh0Tm9kZShub2RlLCB0cnVlKTtcbiAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgcmV0dXJuIG5leHROb2RlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBUcmF2ZXJzZSB0aGUgRE9NIGZyb20gbm9kZSB0byBub2RlLCBzdGFydGluZyBhdCB0aGUgbm9kZSBwYXNzZWQgaW4uXG4gICAqIFBhc3MgdHJ1ZSBmb3IgdGhlIHNlY29uZCBwYXJhbWV0ZXIgdG8gaW5kaWNhdGUgdGhpcyBub2RlIGl0c2VsZlxuICAgKiAoYW5kIGl0cyBraWRzKSBhcmUgZ29pbmcgYXdheSwgYW5kIHdlIHdhbnQgdGhlIG5leHQgbm9kZSBvdmVyLlxuICAgKlxuICAgKiBDYWxsaW5nIHRoaXMgaW4gYSBsb29wIHdpbGwgdHJhdmVyc2UgdGhlIERPTSBkZXB0aC1maXJzdC5cbiAgICovXG4gIF9nZXROZXh0Tm9kZTogZnVuY3Rpb24obm9kZSwgaWdub3JlU2VsZkFuZEtpZHMpIHtcbiAgICAvLyBGaXJzdCBjaGVjayBmb3Iga2lkcyBpZiB0aG9zZSBhcmVuJ3QgYmVpbmcgaWdub3JlZFxuICAgIGlmICghaWdub3JlU2VsZkFuZEtpZHMgJiYgbm9kZS5maXJzdEVsZW1lbnRDaGlsZCkge1xuICAgICAgcmV0dXJuIG5vZGUuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgfVxuICAgIC8vIFRoZW4gZm9yIHNpYmxpbmdzLi4uXG4gICAgaWYgKG5vZGUubmV4dEVsZW1lbnRTaWJsaW5nKSB7XG4gICAgICByZXR1cm4gbm9kZS5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgfVxuICAgIC8vIEFuZCBmaW5hbGx5LCBtb3ZlIHVwIHRoZSBwYXJlbnQgY2hhaW4gKmFuZCogZmluZCBhIHNpYmxpbmdcbiAgICAvLyAoYmVjYXVzZSB0aGlzIGlzIGRlcHRoLWZpcnN0IHRyYXZlcnNhbCwgd2Ugd2lsbCBoYXZlIGFscmVhZHlcbiAgICAvLyBzZWVuIHRoZSBwYXJlbnQgbm9kZXMgdGhlbXNlbHZlcykuXG4gICAgZG8ge1xuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICB9IHdoaWxlIChub2RlICYmICFub2RlLm5leHRFbGVtZW50U2libGluZyk7XG4gICAgcmV0dXJuIG5vZGUgJiYgbm9kZS5uZXh0RWxlbWVudFNpYmxpbmc7XG4gIH0sXG5cbiAgX2NoZWNrQnlsaW5lOiBmdW5jdGlvbihub2RlLCBtYXRjaFN0cmluZykge1xuICAgIGlmICh0aGlzLl9hcnRpY2xlQnlsaW5lKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKG5vZGUuZ2V0QXR0cmlidXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHZhciByZWwgPSBub2RlLmdldEF0dHJpYnV0ZShcInJlbFwiKTtcbiAgICB9XG5cbiAgICBpZiAoKHJlbCA9PT0gXCJhdXRob3JcIiB8fCB0aGlzLlJFR0VYUFMuYnlsaW5lLnRlc3QobWF0Y2hTdHJpbmcpKSAmJiB0aGlzLl9pc1ZhbGlkQnlsaW5lKG5vZGUudGV4dENvbnRlbnQpKSB7XG4gICAgICB0aGlzLl9hcnRpY2xlQnlsaW5lID0gbm9kZS50ZXh0Q29udGVudC50cmltKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgX2dldE5vZGVBbmNlc3RvcnM6IGZ1bmN0aW9uKG5vZGUsIG1heERlcHRoKSB7XG4gICAgbWF4RGVwdGggPSBtYXhEZXB0aCB8fCAwO1xuICAgIHZhciBpID0gMCwgYW5jZXN0b3JzID0gW107XG4gICAgd2hpbGUgKG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgYW5jZXN0b3JzLnB1c2gobm9kZS5wYXJlbnROb2RlKTtcbiAgICAgIGlmIChtYXhEZXB0aCAmJiArK2kgPT09IG1heERlcHRoKVxuICAgICAgICBicmVhaztcbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgfVxuICAgIHJldHVybiBhbmNlc3RvcnM7XG4gIH0sXG5cbiAgLyoqKlxuICAgKiBncmFiQXJ0aWNsZSAtIFVzaW5nIGEgdmFyaWV0eSBvZiBtZXRyaWNzIChjb250ZW50IHNjb3JlLCBjbGFzc25hbWUsIGVsZW1lbnQgdHlwZXMpLCBmaW5kIHRoZSBjb250ZW50IHRoYXQgaXNcbiAgICogICAgICAgICBtb3N0IGxpa2VseSB0byBiZSB0aGUgc3R1ZmYgYSB1c2VyIHdhbnRzIHRvIHJlYWQuIFRoZW4gcmV0dXJuIGl0IHdyYXBwZWQgdXAgaW4gYSBkaXYuXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIGEgZG9jdW1lbnQgdG8gcnVuIHVwb24uIE5lZWRzIHRvIGJlIGEgZnVsbCBkb2N1bWVudCwgY29tcGxldGUgd2l0aCBib2R5LlxuICAgKiBAcmV0dXJuIEVsZW1lbnRcbiAgICoqL1xuICBfZ3JhYkFydGljbGU6IGZ1bmN0aW9uIChwYWdlKSB7XG4gICAgdGhpcy5sb2coXCIqKioqIGdyYWJBcnRpY2xlICoqKipcIik7XG4gICAgdmFyIGRvYyA9IHRoaXMuX2RvYztcbiAgICB2YXIgaXNQYWdpbmcgPSAocGFnZSAhPT0gbnVsbCA/IHRydWU6IGZhbHNlKTtcbiAgICBwYWdlID0gcGFnZSA/IHBhZ2UgOiB0aGlzLl9ib2R5O1xuXG4gICAgLy8gV2UgY2FuJ3QgZ3JhYiBhbiBhcnRpY2xlIGlmIHdlIGRvbid0IGhhdmUgYSBwYWdlIVxuICAgIGlmICghcGFnZSkge1xuICAgICAgdGhpcy5sb2coXCJObyBib2R5IGZvdW5kIGluIGRvY3VtZW50LiBBYm9ydC5cIik7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgcGFnZUNhY2hlSHRtbCA9IHBhZ2UuaW5uZXJIVE1MO1xuXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIHZhciBzdHJpcFVubGlrZWx5Q2FuZGlkYXRlcyA9IHRoaXMuX2ZsYWdJc0FjdGl2ZSh0aGlzLkZMQUdfU1RSSVBfVU5MSUtFTFlTKTtcblxuICAgICAgLy8gRmlyc3QsIG5vZGUgcHJlcHBpbmcuIFRyYXNoIG5vZGVzIHRoYXQgbG9vayBjcnVkZHkgKGxpa2Ugb25lcyB3aXRoIHRoZVxuICAgICAgLy8gY2xhc3MgbmFtZSBcImNvbW1lbnRcIiwgZXRjKSwgYW5kIHR1cm4gZGl2cyBpbnRvIFAgdGFncyB3aGVyZSB0aGV5IGhhdmUgYmVlblxuICAgICAgLy8gdXNlZCBpbmFwcHJvcHJpYXRlbHkgKGFzIGluLCB3aGVyZSB0aGV5IGNvbnRhaW4gbm8gb3RoZXIgYmxvY2sgbGV2ZWwgZWxlbWVudHMuKVxuICAgICAgdmFyIGVsZW1lbnRzVG9TY29yZSA9IFtdO1xuICAgICAgdmFyIG5vZGUgPSB0aGlzLl9ib2R5O1xuXG4gICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICB2YXIgbWF0Y2hTdHJpbmcgPSBub2RlLmNsYXNzTmFtZSArIFwiIFwiICsgbm9kZS5pZDtcblxuICAgICAgICBpZiAoIXRoaXMuX2lzUHJvYmFibHlWaXNpYmxlKG5vZGUpKSB7XG4gICAgICAgICAgdGhpcy5sb2coXCJSZW1vdmluZyBoaWRkZW4gbm9kZSAtIFwiICsgbWF0Y2hTdHJpbmcpO1xuICAgICAgICAgIG5vZGUgPSB0aGlzLl9yZW1vdmVBbmRHZXROZXh0KG5vZGUpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoaXMgbm9kZSBpcyBhIGJ5bGluZSwgYW5kIHJlbW92ZSBpdCBpZiBpdCBpcy5cbiAgICAgICAgaWYgKHRoaXMuX2NoZWNrQnlsaW5lKG5vZGUsIG1hdGNoU3RyaW5nKSkge1xuICAgICAgICAgIG5vZGUgPSB0aGlzLl9yZW1vdmVBbmRHZXROZXh0KG5vZGUpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHVubGlrZWx5IGNhbmRpZGF0ZXNcbiAgICAgICAgaWYgKHN0cmlwVW5saWtlbHlDYW5kaWRhdGVzKSB7XG4gICAgICAgICAgaWYgKHRoaXMuUkVHRVhQUy51bmxpa2VseUNhbmRpZGF0ZXMudGVzdChtYXRjaFN0cmluZykgJiZcbiAgICAgICAgICAgICAgIXRoaXMuUkVHRVhQUy5va01heWJlSXRzQUNhbmRpZGF0ZS50ZXN0KG1hdGNoU3RyaW5nKSAmJlxuICAgICAgICAgICAgICBub2RlLnRhZ05hbWUgIT09IFwiQk9EWVwiICYmXG4gICAgICAgICAgICAgIG5vZGUudGFnTmFtZSAhPT0gXCJBXCIpIHtcbiAgICAgICAgICAgIHRoaXMubG9nKFwiUmVtb3ZpbmcgdW5saWtlbHkgY2FuZGlkYXRlIC0gXCIgKyBtYXRjaFN0cmluZyk7XG4gICAgICAgICAgICBub2RlID0gdGhpcy5fcmVtb3ZlQW5kR2V0TmV4dChub2RlKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSBESVYsIFNFQ1RJT04sIGFuZCBIRUFERVIgbm9kZXMgd2l0aG91dCBhbnkgY29udGVudChlLmcuIHRleHQsIGltYWdlLCB2aWRlbywgb3IgaWZyYW1lKS5cbiAgICAgICAgaWYgKChub2RlLnRhZ05hbWUgPT09IFwiRElWXCIgfHwgbm9kZS50YWdOYW1lID09PSBcIlNFQ1RJT05cIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiSEVBREVSXCIgfHxcbiAgICAgICAgICAgIG5vZGUudGFnTmFtZSA9PT0gXCJIMVwiIHx8IG5vZGUudGFnTmFtZSA9PT0gXCJIMlwiIHx8IG5vZGUudGFnTmFtZSA9PT0gXCJIM1wiIHx8XG4gICAgICAgICAgICBub2RlLnRhZ05hbWUgPT09IFwiSDRcIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiSDVcIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiSDZcIikgJiZcbiAgICAgICAgICAgIHRoaXMuX2lzRWxlbWVudFdpdGhvdXRDb250ZW50KG5vZGUpKSB7XG4gICAgICAgICAgbm9kZSA9IHRoaXMuX3JlbW92ZUFuZEdldE5leHQobm9kZSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5ERUZBVUxUX1RBR1NfVE9fU0NPUkUuaW5kZXhPZihub2RlLnRhZ05hbWUpICE9PSAtMSkge1xuICAgICAgICAgIGVsZW1lbnRzVG9TY29yZS5wdXNoKG5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVHVybiBhbGwgZGl2cyB0aGF0IGRvbid0IGhhdmUgY2hpbGRyZW4gYmxvY2sgbGV2ZWwgZWxlbWVudHMgaW50byBwJ3NcbiAgICAgICAgaWYgKG5vZGUudGFnTmFtZSA9PT0gXCJESVZcIikge1xuICAgICAgICAgIC8vIFB1dCBwaHJhc2luZyBjb250ZW50IGludG8gcGFyYWdyYXBocy5cbiAgICAgICAgICB2YXIgcCA9IG51bGw7XG4gICAgICAgICAgdmFyIGNoaWxkTm9kZSA9IG5vZGUuZmlyc3RDaGlsZDtcbiAgICAgICAgICB3aGlsZSAoY2hpbGROb2RlKSB7XG4gICAgICAgICAgICB2YXIgbmV4dFNpYmxpbmcgPSBjaGlsZE5vZGUubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNQaHJhc2luZ0NvbnRlbnQoY2hpbGROb2RlKSkge1xuICAgICAgICAgICAgICBpZiAocCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHAuYXBwZW5kQ2hpbGQoY2hpbGROb2RlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICghdGhpcy5faXNXaGl0ZXNwYWNlKGNoaWxkTm9kZSkpIHtcbiAgICAgICAgICAgICAgICBwID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgICAgICAgICAgICAgICBub2RlLnJlcGxhY2VDaGlsZChwLCBjaGlsZE5vZGUpO1xuICAgICAgICAgICAgICAgIHAuYXBwZW5kQ2hpbGQoY2hpbGROb2RlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChwICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIHdoaWxlIChwLmxhc3RDaGlsZCAmJiB0aGlzLl9pc1doaXRlc3BhY2UocC5sYXN0Q2hpbGQpKSBwLnJlbW92ZUNoaWxkKHAubGFzdENoaWxkKTtcbiAgICAgICAgICAgICAgcCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjaGlsZE5vZGUgPSBuZXh0U2libGluZztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBTaXRlcyBsaWtlIGh0dHA6Ly9tb2JpbGUuc2xhdGUuY29tIGVuY2xvc2VzIGVhY2ggcGFyYWdyYXBoIHdpdGggYSBESVZcbiAgICAgICAgICAvLyBlbGVtZW50LiBESVZzIHdpdGggb25seSBhIFAgZWxlbWVudCBpbnNpZGUgYW5kIG5vIHRleHQgY29udGVudCBjYW4gYmVcbiAgICAgICAgICAvLyBzYWZlbHkgY29udmVydGVkIGludG8gcGxhaW4gUCBlbGVtZW50cyB0byBhdm9pZCBjb25mdXNpbmcgdGhlIHNjb3JpbmdcbiAgICAgICAgICAvLyBhbGdvcml0aG0gd2l0aCBESVZzIHdpdGggYXJlLCBpbiBwcmFjdGljZSwgcGFyYWdyYXBocy5cbiAgICAgICAgICBpZiAodGhpcy5faGFzU2luZ2xlVGFnSW5zaWRlRWxlbWVudChub2RlLCBcIlBcIikgJiYgdGhpcy5fZ2V0TGlua0RlbnNpdHkobm9kZSkgPCAwLjI1KSB7XG4gICAgICAgICAgICB2YXIgbmV3Tm9kZSA9IG5vZGUuY2hpbGRyZW5bMF07XG4gICAgICAgICAgICBub2RlLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld05vZGUsIG5vZGUpO1xuICAgICAgICAgICAgbm9kZSA9IG5ld05vZGU7XG4gICAgICAgICAgICBlbGVtZW50c1RvU2NvcmUucHVzaChub2RlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLl9oYXNDaGlsZEJsb2NrRWxlbWVudChub2RlKSkge1xuICAgICAgICAgICAgbm9kZSA9IHRoaXMuX3NldE5vZGVUYWcobm9kZSwgXCJQXCIpO1xuICAgICAgICAgICAgZWxlbWVudHNUb1Njb3JlLnB1c2gobm9kZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSB0aGlzLl9nZXROZXh0Tm9kZShub2RlKTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBMb29wIHRocm91Z2ggYWxsIHBhcmFncmFwaHMsIGFuZCBhc3NpZ24gYSBzY29yZSB0byB0aGVtIGJhc2VkIG9uIGhvdyBjb250ZW50LXkgdGhleSBsb29rLlxuICAgICAgICogVGhlbiBhZGQgdGhlaXIgc2NvcmUgdG8gdGhlaXIgcGFyZW50IG5vZGUuXG4gICAgICAgKlxuICAgICAgICogQSBzY29yZSBpcyBkZXRlcm1pbmVkIGJ5IHRoaW5ncyBsaWtlIG51bWJlciBvZiBjb21tYXMsIGNsYXNzIG5hbWVzLCBldGMuIE1heWJlIGV2ZW50dWFsbHkgbGluayBkZW5zaXR5LlxuICAgICAgICoqL1xuICAgICAgdmFyIGNhbmRpZGF0ZXMgPSBbXTtcbiAgICAgIHRoaXMuX2ZvckVhY2hOb2RlKGVsZW1lbnRzVG9TY29yZSwgZnVuY3Rpb24oZWxlbWVudFRvU2NvcmUpIHtcbiAgICAgICAgaWYgKCFlbGVtZW50VG9TY29yZS5wYXJlbnROb2RlIHx8IHR5cGVvZihlbGVtZW50VG9TY29yZS5wYXJlbnROb2RlLnRhZ05hbWUpID09PSAndW5kZWZpbmVkJylcbiAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgLy8gSWYgdGhpcyBwYXJhZ3JhcGggaXMgbGVzcyB0aGFuIDI1IGNoYXJhY3RlcnMsIGRvbid0IGV2ZW4gY291bnQgaXQuXG4gICAgICAgIHZhciBpbm5lclRleHQgPSB0aGlzLl9nZXRJbm5lclRleHQoZWxlbWVudFRvU2NvcmUpO1xuICAgICAgICBpZiAoaW5uZXJUZXh0Lmxlbmd0aCA8IDI1KVxuICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAvLyBFeGNsdWRlIG5vZGVzIHdpdGggbm8gYW5jZXN0b3IuXG4gICAgICAgIHZhciBhbmNlc3RvcnMgPSB0aGlzLl9nZXROb2RlQW5jZXN0b3JzKGVsZW1lbnRUb1Njb3JlLCAzKTtcbiAgICAgICAgaWYgKGFuY2VzdG9ycy5sZW5ndGggPT09IDApXG4gICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHZhciBjb250ZW50U2NvcmUgPSAwO1xuXG4gICAgICAgIC8vIEFkZCBhIHBvaW50IGZvciB0aGUgcGFyYWdyYXBoIGl0c2VsZiBhcyBhIGJhc2UuXG4gICAgICAgIGNvbnRlbnRTY29yZSArPSAxO1xuXG4gICAgICAgIC8vIEFkZCBwb2ludHMgZm9yIGFueSBjb21tYXMgd2l0aGluIHRoaXMgcGFyYWdyYXBoLlxuICAgICAgICBjb250ZW50U2NvcmUgKz0gaW5uZXJUZXh0LnNwbGl0KCcsJykubGVuZ3RoO1xuXG4gICAgICAgIC8vIEZvciBldmVyeSAxMDAgY2hhcmFjdGVycyBpbiB0aGlzIHBhcmFncmFwaCwgYWRkIGFub3RoZXIgcG9pbnQuIFVwIHRvIDMgcG9pbnRzLlxuICAgICAgICBjb250ZW50U2NvcmUgKz0gTWF0aC5taW4oTWF0aC5mbG9vcihpbm5lclRleHQubGVuZ3RoIC8gMTAwKSwgMyk7XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBhbmQgc2NvcmUgYW5jZXN0b3JzLlxuICAgICAgICB0aGlzLl9mb3JFYWNoTm9kZShhbmNlc3RvcnMsIGZ1bmN0aW9uKGFuY2VzdG9yLCBsZXZlbCkge1xuICAgICAgICAgIGlmICghYW5jZXN0b3IudGFnTmFtZSB8fCAhYW5jZXN0b3IucGFyZW50Tm9kZSB8fCB0eXBlb2YoYW5jZXN0b3IucGFyZW50Tm9kZS50YWdOYW1lKSA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICBpZiAodHlwZW9mKGFuY2VzdG9yLnJlYWRhYmlsaXR5KSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuX2luaXRpYWxpemVOb2RlKGFuY2VzdG9yKTtcbiAgICAgICAgICAgIGNhbmRpZGF0ZXMucHVzaChhbmNlc3Rvcik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gTm9kZSBzY29yZSBkaXZpZGVyOlxuICAgICAgICAgIC8vIC0gcGFyZW50OiAgICAgICAgICAgICAxIChubyBkaXZpc2lvbilcbiAgICAgICAgICAvLyAtIGdyYW5kcGFyZW50OiAgICAgICAgMlxuICAgICAgICAgIC8vIC0gZ3JlYXQgZ3JhbmRwYXJlbnQrOiBhbmNlc3RvciBsZXZlbCAqIDNcbiAgICAgICAgICBpZiAobGV2ZWwgPT09IDApXG4gICAgICAgICAgICB2YXIgc2NvcmVEaXZpZGVyID0gMTtcbiAgICAgICAgICBlbHNlIGlmIChsZXZlbCA9PT0gMSlcbiAgICAgICAgICAgIHNjb3JlRGl2aWRlciA9IDI7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgc2NvcmVEaXZpZGVyID0gbGV2ZWwgKiAzO1xuICAgICAgICAgIGFuY2VzdG9yLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSArPSBjb250ZW50U2NvcmUgLyBzY29yZURpdmlkZXI7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIEFmdGVyIHdlJ3ZlIGNhbGN1bGF0ZWQgc2NvcmVzLCBsb29wIHRocm91Z2ggYWxsIG9mIHRoZSBwb3NzaWJsZVxuICAgICAgLy8gY2FuZGlkYXRlIG5vZGVzIHdlIGZvdW5kIGFuZCBmaW5kIHRoZSBvbmUgd2l0aCB0aGUgaGlnaGVzdCBzY29yZS5cbiAgICAgIHZhciB0b3BDYW5kaWRhdGVzID0gW107XG4gICAgICBmb3IgKHZhciBjID0gMCwgY2wgPSBjYW5kaWRhdGVzLmxlbmd0aDsgYyA8IGNsOyBjICs9IDEpIHtcbiAgICAgICAgdmFyIGNhbmRpZGF0ZSA9IGNhbmRpZGF0ZXNbY107XG5cbiAgICAgICAgLy8gU2NhbGUgdGhlIGZpbmFsIGNhbmRpZGF0ZXMgc2NvcmUgYmFzZWQgb24gbGluayBkZW5zaXR5LiBHb29kIGNvbnRlbnRcbiAgICAgICAgLy8gc2hvdWxkIGhhdmUgYSByZWxhdGl2ZWx5IHNtYWxsIGxpbmsgZGVuc2l0eSAoNSUgb3IgbGVzcykgYW5kIGJlIG1vc3RseVxuICAgICAgICAvLyB1bmFmZmVjdGVkIGJ5IHRoaXMgb3BlcmF0aW9uLlxuICAgICAgICB2YXIgY2FuZGlkYXRlU2NvcmUgPSBjYW5kaWRhdGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlICogKDEgLSB0aGlzLl9nZXRMaW5rRGVuc2l0eShjYW5kaWRhdGUpKTtcbiAgICAgICAgY2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSA9IGNhbmRpZGF0ZVNjb3JlO1xuXG4gICAgICAgIHRoaXMubG9nKCdDYW5kaWRhdGU6JywgY2FuZGlkYXRlLCBcIndpdGggc2NvcmUgXCIgKyBjYW5kaWRhdGVTY29yZSk7XG5cbiAgICAgICAgZm9yICh2YXIgdCA9IDA7IHQgPCB0aGlzLl9uYlRvcENhbmRpZGF0ZXM7IHQrKykge1xuICAgICAgICAgIHZhciBhVG9wQ2FuZGlkYXRlID0gdG9wQ2FuZGlkYXRlc1t0XTtcblxuICAgICAgICAgIGlmICghYVRvcENhbmRpZGF0ZSB8fCBjYW5kaWRhdGVTY29yZSA+IGFUb3BDYW5kaWRhdGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlKSB7XG4gICAgICAgICAgICB0b3BDYW5kaWRhdGVzLnNwbGljZSh0LCAwLCBjYW5kaWRhdGUpO1xuICAgICAgICAgICAgaWYgKHRvcENhbmRpZGF0ZXMubGVuZ3RoID4gdGhpcy5fbmJUb3BDYW5kaWRhdGVzKVxuICAgICAgICAgICAgICB0b3BDYW5kaWRhdGVzLnBvcCgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciB0b3BDYW5kaWRhdGUgPSB0b3BDYW5kaWRhdGVzWzBdIHx8IG51bGw7XG4gICAgICB2YXIgbmVlZGVkVG9DcmVhdGVUb3BDYW5kaWRhdGUgPSBmYWxzZTtcbiAgICAgIHZhciBwYXJlbnRPZlRvcENhbmRpZGF0ZTtcblxuICAgICAgLy8gSWYgd2Ugc3RpbGwgaGF2ZSBubyB0b3AgY2FuZGlkYXRlLCBqdXN0IHVzZSB0aGUgYm9keSBhcyBhIGxhc3QgcmVzb3J0LlxuICAgICAgLy8gV2UgYWxzbyBoYXZlIHRvIGNvcHkgdGhlIGJvZHkgbm9kZSBzbyBpdCBpcyBzb21ldGhpbmcgd2UgY2FuIG1vZGlmeS5cbiAgICAgIGlmICh0b3BDYW5kaWRhdGUgPT09IG51bGwgfHwgdG9wQ2FuZGlkYXRlLnRhZ05hbWUgPT09IFwiQk9EWVwiKSB7XG4gICAgICAgIC8vIE1vdmUgYWxsIG9mIHRoZSBwYWdlJ3MgY2hpbGRyZW4gaW50byB0b3BDYW5kaWRhdGVcbiAgICAgICAgdG9wQ2FuZGlkYXRlID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XG4gICAgICAgIG5lZWRlZFRvQ3JlYXRlVG9wQ2FuZGlkYXRlID0gdHJ1ZTtcbiAgICAgICAgLy8gTW92ZSBldmVyeXRoaW5nIChub3QganVzdCBlbGVtZW50cywgYWxzbyB0ZXh0IG5vZGVzIGV0Yy4pIGludG8gdGhlIGNvbnRhaW5lclxuICAgICAgICAvLyBzbyB3ZSBldmVuIGluY2x1ZGUgdGV4dCBkaXJlY3RseSBpbiB0aGUgYm9keTpcbiAgICAgICAgdmFyIGtpZHMgPSBwYWdlLmNoaWxkTm9kZXM7XG4gICAgICAgIHdoaWxlIChraWRzLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMubG9nKFwiTW92aW5nIGNoaWxkIG91dDpcIiwga2lkc1swXSk7XG4gICAgICAgICAgdG9wQ2FuZGlkYXRlLmFwcGVuZENoaWxkKGtpZHNbMF0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFnZS5hcHBlbmRDaGlsZCh0b3BDYW5kaWRhdGUpO1xuXG4gICAgICAgIHRoaXMuX2luaXRpYWxpemVOb2RlKHRvcENhbmRpZGF0ZSk7XG4gICAgICB9IGVsc2UgaWYgKHRvcENhbmRpZGF0ZSkge1xuICAgICAgICAvLyBGaW5kIGEgYmV0dGVyIHRvcCBjYW5kaWRhdGUgbm9kZSBpZiBpdCBjb250YWlucyAoYXQgbGVhc3QgdGhyZWUpIG5vZGVzIHdoaWNoIGJlbG9uZyB0byBgdG9wQ2FuZGlkYXRlc2AgYXJyYXlcbiAgICAgICAgLy8gYW5kIHdob3NlIHNjb3JlcyBhcmUgcXVpdGUgY2xvc2VkIHdpdGggY3VycmVudCBgdG9wQ2FuZGlkYXRlYCBub2RlLlxuICAgICAgICB2YXIgYWx0ZXJuYXRpdmVDYW5kaWRhdGVBbmNlc3RvcnMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0b3BDYW5kaWRhdGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHRvcENhbmRpZGF0ZXNbaV0ucmVhZGFiaWxpdHkuY29udGVudFNjb3JlIC8gdG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSA+PSAwLjc1KSB7XG4gICAgICAgICAgICBhbHRlcm5hdGl2ZUNhbmRpZGF0ZUFuY2VzdG9ycy5wdXNoKHRoaXMuX2dldE5vZGVBbmNlc3RvcnModG9wQ2FuZGlkYXRlc1tpXSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgTUlOSU1VTV9UT1BDQU5ESURBVEVTID0gMztcbiAgICAgICAgaWYgKGFsdGVybmF0aXZlQ2FuZGlkYXRlQW5jZXN0b3JzLmxlbmd0aCA+PSBNSU5JTVVNX1RPUENBTkRJREFURVMpIHtcbiAgICAgICAgICBwYXJlbnRPZlRvcENhbmRpZGF0ZSA9IHRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgICAgIHdoaWxlIChwYXJlbnRPZlRvcENhbmRpZGF0ZS50YWdOYW1lICE9PSBcIkJPRFlcIikge1xuICAgICAgICAgICAgdmFyIGxpc3RzQ29udGFpbmluZ1RoaXNBbmNlc3RvciA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBhbmNlc3RvckluZGV4ID0gMDsgYW5jZXN0b3JJbmRleCA8IGFsdGVybmF0aXZlQ2FuZGlkYXRlQW5jZXN0b3JzLmxlbmd0aCAmJiBsaXN0c0NvbnRhaW5pbmdUaGlzQW5jZXN0b3IgPCBNSU5JTVVNX1RPUENBTkRJREFURVM7IGFuY2VzdG9ySW5kZXgrKykge1xuICAgICAgICAgICAgICBsaXN0c0NvbnRhaW5pbmdUaGlzQW5jZXN0b3IgKz0gTnVtYmVyKGFsdGVybmF0aXZlQ2FuZGlkYXRlQW5jZXN0b3JzW2FuY2VzdG9ySW5kZXhdLmluY2x1ZGVzKHBhcmVudE9mVG9wQ2FuZGlkYXRlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobGlzdHNDb250YWluaW5nVGhpc0FuY2VzdG9yID49IE1JTklNVU1fVE9QQ0FORElEQVRFUykge1xuICAgICAgICAgICAgICB0b3BDYW5kaWRhdGUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXJlbnRPZlRvcENhbmRpZGF0ZSA9IHBhcmVudE9mVG9wQ2FuZGlkYXRlLnBhcmVudE5vZGU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghdG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5KSB7XG4gICAgICAgICAgdGhpcy5faW5pdGlhbGl6ZU5vZGUodG9wQ2FuZGlkYXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJlY2F1c2Ugb2Ygb3VyIGJvbnVzIHN5c3RlbSwgcGFyZW50cyBvZiBjYW5kaWRhdGVzIG1pZ2h0IGhhdmUgc2NvcmVzXG4gICAgICAgIC8vIHRoZW1zZWx2ZXMuIFRoZXkgZ2V0IGhhbGYgb2YgdGhlIG5vZGUuIFRoZXJlIHdvbid0IGJlIG5vZGVzIHdpdGggaGlnaGVyXG4gICAgICAgIC8vIHNjb3JlcyB0aGFuIG91ciB0b3BDYW5kaWRhdGUsIGJ1dCBpZiB3ZSBzZWUgdGhlIHNjb3JlIGdvaW5nICp1cCogaW4gdGhlIGZpcnN0XG4gICAgICAgIC8vIGZldyBzdGVwcyB1cCB0aGUgdHJlZSwgdGhhdCdzIGEgZGVjZW50IHNpZ24gdGhhdCB0aGVyZSBtaWdodCBiZSBtb3JlIGNvbnRlbnRcbiAgICAgICAgLy8gbHVya2luZyBpbiBvdGhlciBwbGFjZXMgdGhhdCB3ZSB3YW50IHRvIHVuaWZ5IGluLiBUaGUgc2libGluZyBzdHVmZlxuICAgICAgICAvLyBiZWxvdyBkb2VzIHNvbWUgb2YgdGhhdCAtIGJ1dCBvbmx5IGlmIHdlJ3ZlIGxvb2tlZCBoaWdoIGVub3VnaCB1cCB0aGUgRE9NXG4gICAgICAgIC8vIHRyZWUuXG4gICAgICAgIHBhcmVudE9mVG9wQ2FuZGlkYXRlID0gdG9wQ2FuZGlkYXRlLnBhcmVudE5vZGU7XG4gICAgICAgIHZhciBsYXN0U2NvcmUgPSB0b3BDYW5kaWRhdGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlO1xuICAgICAgICAvLyBUaGUgc2NvcmVzIHNob3VsZG4ndCBnZXQgdG9vIGxvdy5cbiAgICAgICAgdmFyIHNjb3JlVGhyZXNob2xkID0gbGFzdFNjb3JlIC8gMztcbiAgICAgICAgd2hpbGUgKHBhcmVudE9mVG9wQ2FuZGlkYXRlLnRhZ05hbWUgIT09IFwiQk9EWVwiKSB7XG4gICAgICAgICAgaWYgKCFwYXJlbnRPZlRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eSkge1xuICAgICAgICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBwYXJlbnRTY29yZSA9IHBhcmVudE9mVG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZTtcbiAgICAgICAgICBpZiAocGFyZW50U2NvcmUgPCBzY29yZVRocmVzaG9sZClcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGlmIChwYXJlbnRTY29yZSA+IGxhc3RTY29yZSkge1xuICAgICAgICAgICAgLy8gQWxyaWdodCEgV2UgZm91bmQgYSBiZXR0ZXIgcGFyZW50IHRvIHVzZS5cbiAgICAgICAgICAgIHRvcENhbmRpZGF0ZSA9IHBhcmVudE9mVG9wQ2FuZGlkYXRlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxhc3RTY29yZSA9IHBhcmVudE9mVG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZTtcbiAgICAgICAgICBwYXJlbnRPZlRvcENhbmRpZGF0ZSA9IHBhcmVudE9mVG9wQ2FuZGlkYXRlLnBhcmVudE5vZGU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgdG9wIGNhbmRpZGF0ZSBpcyB0aGUgb25seSBjaGlsZCwgdXNlIHBhcmVudCBpbnN0ZWFkLiBUaGlzIHdpbGwgaGVscCBzaWJsaW5nXG4gICAgICAgIC8vIGpvaW5pbmcgbG9naWMgd2hlbiBhZGphY2VudCBjb250ZW50IGlzIGFjdHVhbGx5IGxvY2F0ZWQgaW4gcGFyZW50J3Mgc2libGluZyBub2RlLlxuICAgICAgICBwYXJlbnRPZlRvcENhbmRpZGF0ZSA9IHRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgICB3aGlsZSAocGFyZW50T2ZUb3BDYW5kaWRhdGUudGFnTmFtZSAhPSBcIkJPRFlcIiAmJiBwYXJlbnRPZlRvcENhbmRpZGF0ZS5jaGlsZHJlbi5sZW5ndGggPT0gMSkge1xuICAgICAgICAgIHRvcENhbmRpZGF0ZSA9IHBhcmVudE9mVG9wQ2FuZGlkYXRlO1xuICAgICAgICAgIHBhcmVudE9mVG9wQ2FuZGlkYXRlID0gdG9wQ2FuZGlkYXRlLnBhcmVudE5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0b3BDYW5kaWRhdGUucmVhZGFiaWxpdHkpIHtcbiAgICAgICAgICB0aGlzLl9pbml0aWFsaXplTm9kZSh0b3BDYW5kaWRhdGUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE5vdyB0aGF0IHdlIGhhdmUgdGhlIHRvcCBjYW5kaWRhdGUsIGxvb2sgdGhyb3VnaCBpdHMgc2libGluZ3MgZm9yIGNvbnRlbnRcbiAgICAgIC8vIHRoYXQgbWlnaHQgYWxzbyBiZSByZWxhdGVkLiBUaGluZ3MgbGlrZSBwcmVhbWJsZXMsIGNvbnRlbnQgc3BsaXQgYnkgYWRzXG4gICAgICAvLyB0aGF0IHdlIHJlbW92ZWQsIGV0Yy5cbiAgICAgIHZhciBhcnRpY2xlQ29udGVudCA9IGRvYy5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xuICAgICAgaWYgKGlzUGFnaW5nKVxuICAgICAgICBhcnRpY2xlQ29udGVudC5pZCA9IFwicmVhZGFiaWxpdHktY29udGVudFwiO1xuXG4gICAgICB2YXIgc2libGluZ1Njb3JlVGhyZXNob2xkID0gTWF0aC5tYXgoMTAsIHRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgKiAwLjIpO1xuICAgICAgLy8gS2VlcCBwb3RlbnRpYWwgdG9wIGNhbmRpZGF0ZSdzIHBhcmVudCBub2RlIHRvIHRyeSB0byBnZXQgdGV4dCBkaXJlY3Rpb24gb2YgaXQgbGF0ZXIuXG4gICAgICBwYXJlbnRPZlRvcENhbmRpZGF0ZSA9IHRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgdmFyIHNpYmxpbmdzID0gcGFyZW50T2ZUb3BDYW5kaWRhdGUuY2hpbGRyZW47XG5cbiAgICAgIGZvciAodmFyIHMgPSAwLCBzbCA9IHNpYmxpbmdzLmxlbmd0aDsgcyA8IHNsOyBzKyspIHtcbiAgICAgICAgdmFyIHNpYmxpbmcgPSBzaWJsaW5nc1tzXTtcbiAgICAgICAgdmFyIGFwcGVuZCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMubG9nKFwiTG9va2luZyBhdCBzaWJsaW5nIG5vZGU6XCIsIHNpYmxpbmcsIHNpYmxpbmcucmVhZGFiaWxpdHkgPyAoXCJ3aXRoIHNjb3JlIFwiICsgc2libGluZy5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUpIDogJycpO1xuICAgICAgICB0aGlzLmxvZyhcIlNpYmxpbmcgaGFzIHNjb3JlXCIsIHNpYmxpbmcucmVhZGFiaWxpdHkgPyBzaWJsaW5nLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSA6ICdVbmtub3duJyk7XG5cbiAgICAgICAgaWYgKHNpYmxpbmcgPT09IHRvcENhbmRpZGF0ZSkge1xuICAgICAgICAgIGFwcGVuZCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGNvbnRlbnRCb251cyA9IDA7XG5cbiAgICAgICAgICAvLyBHaXZlIGEgYm9udXMgaWYgc2libGluZyBub2RlcyBhbmQgdG9wIGNhbmRpZGF0ZXMgaGF2ZSB0aGUgZXhhbXBsZSBzYW1lIGNsYXNzbmFtZVxuICAgICAgICAgIGlmIChzaWJsaW5nLmNsYXNzTmFtZSA9PT0gdG9wQ2FuZGlkYXRlLmNsYXNzTmFtZSAmJiB0b3BDYW5kaWRhdGUuY2xhc3NOYW1lICE9PSBcIlwiKVxuICAgICAgICAgICAgY29udGVudEJvbnVzICs9IHRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgKiAwLjI7XG5cbiAgICAgICAgICBpZiAoc2libGluZy5yZWFkYWJpbGl0eSAmJlxuICAgICAgICAgICAgICAoKHNpYmxpbmcucmVhZGFiaWxpdHkuY29udGVudFNjb3JlICsgY29udGVudEJvbnVzKSA+PSBzaWJsaW5nU2NvcmVUaHJlc2hvbGQpKSB7XG4gICAgICAgICAgICBhcHBlbmQgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2libGluZy5ub2RlTmFtZSA9PT0gXCJQXCIpIHtcbiAgICAgICAgICAgIHZhciBsaW5rRGVuc2l0eSA9IHRoaXMuX2dldExpbmtEZW5zaXR5KHNpYmxpbmcpO1xuICAgICAgICAgICAgdmFyIG5vZGVDb250ZW50ID0gdGhpcy5fZ2V0SW5uZXJUZXh0KHNpYmxpbmcpO1xuICAgICAgICAgICAgdmFyIG5vZGVMZW5ndGggPSBub2RlQ29udGVudC5sZW5ndGg7XG5cbiAgICAgICAgICAgIGlmIChub2RlTGVuZ3RoID4gODAgJiYgbGlua0RlbnNpdHkgPCAwLjI1KSB7XG4gICAgICAgICAgICAgIGFwcGVuZCA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5vZGVMZW5ndGggPCA4MCAmJiBub2RlTGVuZ3RoID4gMCAmJiBsaW5rRGVuc2l0eSA9PT0gMCAmJlxuICAgICAgICAgICAgICAgIG5vZGVDb250ZW50LnNlYXJjaCgvXFwuKCB8JCkvKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgYXBwZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXBwZW5kKSB7XG4gICAgICAgICAgdGhpcy5sb2coXCJBcHBlbmRpbmcgbm9kZTpcIiwgc2libGluZyk7XG5cbiAgICAgICAgICBpZiAodGhpcy5BTFRFUl9UT19ESVZfRVhDRVBUSU9OUy5pbmRleE9mKHNpYmxpbmcubm9kZU5hbWUpID09PSAtMSkge1xuICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIG5vZGUgdGhhdCBpc24ndCBhIGNvbW1vbiBibG9jayBsZXZlbCBlbGVtZW50LCBsaWtlIGEgZm9ybSBvciB0ZCB0YWcuXG4gICAgICAgICAgICAvLyBUdXJuIGl0IGludG8gYSBkaXYgc28gaXQgZG9lc24ndCBnZXQgZmlsdGVyZWQgb3V0IGxhdGVyIGJ5IGFjY2lkZW50LlxuICAgICAgICAgICAgdGhpcy5sb2coXCJBbHRlcmluZyBzaWJsaW5nOlwiLCBzaWJsaW5nLCAndG8gZGl2LicpO1xuXG4gICAgICAgICAgICBzaWJsaW5nID0gdGhpcy5fc2V0Tm9kZVRhZyhzaWJsaW5nLCBcIkRJVlwiKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhcnRpY2xlQ29udGVudC5hcHBlbmRDaGlsZChzaWJsaW5nKTtcbiAgICAgICAgICAvLyBzaWJsaW5ncyBpcyBhIHJlZmVyZW5jZSB0byB0aGUgY2hpbGRyZW4gYXJyYXksIGFuZFxuICAgICAgICAgIC8vIHNpYmxpbmcgaXMgcmVtb3ZlZCBmcm9tIHRoZSBhcnJheSB3aGVuIHdlIGNhbGwgYXBwZW5kQ2hpbGQoKS5cbiAgICAgICAgICAvLyBBcyBhIHJlc3VsdCwgd2UgbXVzdCByZXZpc2l0IHRoaXMgaW5kZXggc2luY2UgdGhlIG5vZGVzXG4gICAgICAgICAgLy8gaGF2ZSBiZWVuIHNoaWZ0ZWQuXG4gICAgICAgICAgcyAtPSAxO1xuICAgICAgICAgIHNsIC09IDE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX2RlYnVnKVxuICAgICAgICB0aGlzLmxvZyhcIkFydGljbGUgY29udGVudCBwcmUtcHJlcDogXCIgKyBhcnRpY2xlQ29udGVudC5pbm5lckhUTUwpO1xuICAgICAgLy8gU28gd2UgaGF2ZSBhbGwgb2YgdGhlIGNvbnRlbnQgdGhhdCB3ZSBuZWVkLiBOb3cgd2UgY2xlYW4gaXQgdXAgZm9yIHByZXNlbnRhdGlvbi5cbiAgICAgIHRoaXMuX3ByZXBBcnRpY2xlKGFydGljbGVDb250ZW50KTtcbiAgICAgIGlmICh0aGlzLl9kZWJ1ZylcbiAgICAgICAgdGhpcy5sb2coXCJBcnRpY2xlIGNvbnRlbnQgcG9zdC1wcmVwOiBcIiArIGFydGljbGVDb250ZW50LmlubmVySFRNTCk7XG5cbiAgICAgIGlmIChuZWVkZWRUb0NyZWF0ZVRvcENhbmRpZGF0ZSkge1xuICAgICAgICAvLyBXZSBhbHJlYWR5IGNyZWF0ZWQgYSBmYWtlIGRpdiB0aGluZywgYW5kIHRoZXJlIHdvdWxkbid0IGhhdmUgYmVlbiBhbnkgc2libGluZ3MgbGVmdFxuICAgICAgICAvLyBmb3IgdGhlIHByZXZpb3VzIGxvb3AsIHNvIHRoZXJlJ3Mgbm8gcG9pbnQgdHJ5aW5nIHRvIGNyZWF0ZSBhIG5ldyBkaXYsIGFuZCB0aGVuXG4gICAgICAgIC8vIG1vdmUgYWxsIHRoZSBjaGlsZHJlbiBvdmVyLiBKdXN0IGFzc2lnbiBJRHMgYW5kIGNsYXNzIG5hbWVzIGhlcmUuIE5vIG5lZWQgdG8gYXBwZW5kXG4gICAgICAgIC8vIGJlY2F1c2UgdGhhdCBhbHJlYWR5IGhhcHBlbmVkIGFueXdheS5cbiAgICAgICAgdG9wQ2FuZGlkYXRlLmlkID0gXCJyZWFkYWJpbGl0eS1wYWdlLTFcIjtcbiAgICAgICAgdG9wQ2FuZGlkYXRlLmNsYXNzTmFtZSA9IFwicGFnZVwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGRpdiA9IGRvYy5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xuICAgICAgICBkaXYuaWQgPSBcInJlYWRhYmlsaXR5LXBhZ2UtMVwiO1xuICAgICAgICBkaXYuY2xhc3NOYW1lID0gXCJwYWdlXCI7XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IGFydGljbGVDb250ZW50LmNoaWxkTm9kZXM7XG4gICAgICAgIHdoaWxlIChjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQoY2hpbGRyZW5bMF0pO1xuICAgICAgICB9XG4gICAgICAgIGFydGljbGVDb250ZW50LmFwcGVuZENoaWxkKGRpdik7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9kZWJ1ZylcbiAgICAgICAgdGhpcy5sb2coXCJBcnRpY2xlIGNvbnRlbnQgYWZ0ZXIgcGFnaW5nOiBcIiArIGFydGljbGVDb250ZW50LmlubmVySFRNTCk7XG5cbiAgICAgIHZhciBwYXJzZVN1Y2Nlc3NmdWwgPSB0cnVlO1xuXG4gICAgICAvLyBOb3cgdGhhdCB3ZSd2ZSBnb25lIHRocm91Z2ggdGhlIGZ1bGwgYWxnb3JpdGhtLCBjaGVjayB0byBzZWUgaWZcbiAgICAgIC8vIHdlIGdvdCBhbnkgbWVhbmluZ2Z1bCBjb250ZW50LiBJZiB3ZSBkaWRuJ3QsIHdlIG1heSBuZWVkIHRvIHJlLXJ1blxuICAgICAgLy8gZ3JhYkFydGljbGUgd2l0aCBkaWZmZXJlbnQgZmxhZ3Mgc2V0LiBUaGlzIGdpdmVzIHVzIGEgaGlnaGVyIGxpa2VsaWhvb2Qgb2ZcbiAgICAgIC8vIGZpbmRpbmcgdGhlIGNvbnRlbnQsIGFuZCB0aGUgc2lldmUgYXBwcm9hY2ggZ2l2ZXMgdXMgYSBoaWdoZXIgbGlrZWxpaG9vZCBvZlxuICAgICAgLy8gZmluZGluZyB0aGUgLXJpZ2h0LSBjb250ZW50LlxuICAgICAgdmFyIHRleHRMZW5ndGggPSB0aGlzLl9nZXRJbm5lclRleHQoYXJ0aWNsZUNvbnRlbnQsIHRydWUpLmxlbmd0aDtcbiAgICAgIGlmICh0ZXh0TGVuZ3RoIDwgdGhpcy5fY2hhclRocmVzaG9sZCkge1xuICAgICAgICBwYXJzZVN1Y2Nlc3NmdWwgPSBmYWxzZTtcbiAgICAgICAgcGFnZS5pbm5lckhUTUwgPSBwYWdlQ2FjaGVIdG1sO1xuXG4gICAgICAgIGlmICh0aGlzLl9mbGFnSXNBY3RpdmUodGhpcy5GTEFHX1NUUklQX1VOTElLRUxZUykpIHtcbiAgICAgICAgICB0aGlzLl9yZW1vdmVGbGFnKHRoaXMuRkxBR19TVFJJUF9VTkxJS0VMWVMpO1xuICAgICAgICAgIHRoaXMuX2F0dGVtcHRzLnB1c2goe2FydGljbGVDb250ZW50OiBhcnRpY2xlQ29udGVudCwgdGV4dExlbmd0aDogdGV4dExlbmd0aH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2ZsYWdJc0FjdGl2ZSh0aGlzLkZMQUdfV0VJR0hUX0NMQVNTRVMpKSB7XG4gICAgICAgICAgdGhpcy5fcmVtb3ZlRmxhZyh0aGlzLkZMQUdfV0VJR0hUX0NMQVNTRVMpO1xuICAgICAgICAgIHRoaXMuX2F0dGVtcHRzLnB1c2goe2FydGljbGVDb250ZW50OiBhcnRpY2xlQ29udGVudCwgdGV4dExlbmd0aDogdGV4dExlbmd0aH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2ZsYWdJc0FjdGl2ZSh0aGlzLkZMQUdfQ0xFQU5fQ09ORElUSU9OQUxMWSkpIHtcbiAgICAgICAgICB0aGlzLl9yZW1vdmVGbGFnKHRoaXMuRkxBR19DTEVBTl9DT05ESVRJT05BTExZKTtcbiAgICAgICAgICB0aGlzLl9hdHRlbXB0cy5wdXNoKHthcnRpY2xlQ29udGVudDogYXJ0aWNsZUNvbnRlbnQsIHRleHRMZW5ndGg6IHRleHRMZW5ndGh9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9hdHRlbXB0cy5wdXNoKHthcnRpY2xlQ29udGVudDogYXJ0aWNsZUNvbnRlbnQsIHRleHRMZW5ndGg6IHRleHRMZW5ndGh9KTtcbiAgICAgICAgICAvLyBObyBsdWNrIGFmdGVyIHJlbW92aW5nIGZsYWdzLCBqdXN0IHJldHVybiB0aGUgbG9uZ2VzdCB0ZXh0IHdlIGZvdW5kIGR1cmluZyB0aGUgZGlmZmVyZW50IGxvb3BzXG4gICAgICAgICAgdGhpcy5fYXR0ZW1wdHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEudGV4dExlbmd0aCA8IGIudGV4dExlbmd0aDtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIEJ1dCBmaXJzdCBjaGVjayBpZiB3ZSBhY3R1YWxseSBoYXZlIHNvbWV0aGluZ1xuICAgICAgICAgIGlmICghdGhpcy5fYXR0ZW1wdHNbMF0udGV4dExlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYXJ0aWNsZUNvbnRlbnQgPSB0aGlzLl9hdHRlbXB0c1swXS5hcnRpY2xlQ29udGVudDtcbiAgICAgICAgICBwYXJzZVN1Y2Nlc3NmdWwgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChwYXJzZVN1Y2Nlc3NmdWwpIHtcbiAgICAgICAgLy8gRmluZCBvdXQgdGV4dCBkaXJlY3Rpb24gZnJvbSBhbmNlc3RvcnMgb2YgZmluYWwgdG9wIGNhbmRpZGF0ZS5cbiAgICAgICAgdmFyIGFuY2VzdG9ycyA9IFtwYXJlbnRPZlRvcENhbmRpZGF0ZSwgdG9wQ2FuZGlkYXRlXS5jb25jYXQodGhpcy5fZ2V0Tm9kZUFuY2VzdG9ycyhwYXJlbnRPZlRvcENhbmRpZGF0ZSkpO1xuICAgICAgICB0aGlzLl9zb21lTm9kZShhbmNlc3RvcnMsIGZ1bmN0aW9uKGFuY2VzdG9yKSB7XG4gICAgICAgICAgaWYgKCFhbmNlc3Rvci50YWdOYW1lKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIHZhciBhcnRpY2xlRGlyID0gYW5jZXN0b3IuZ2V0QXR0cmlidXRlKFwiZGlyXCIpO1xuICAgICAgICAgIGlmIChhcnRpY2xlRGlyKSB7XG4gICAgICAgICAgICB0aGlzLl9hcnRpY2xlRGlyID0gYXJ0aWNsZURpcjtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gYXJ0aWNsZUNvbnRlbnQ7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayB3aGV0aGVyIHRoZSBpbnB1dCBzdHJpbmcgY291bGQgYmUgYSBieWxpbmUuXG4gICAqIFRoaXMgdmVyaWZpZXMgdGhhdCB0aGUgaW5wdXQgaXMgYSBzdHJpbmcsIGFuZCB0aGF0IHRoZSBsZW5ndGhcbiAgICogaXMgbGVzcyB0aGFuIDEwMCBjaGFycy5cbiAgICpcbiAgICogQHBhcmFtIHBvc3NpYmxlQnlsaW5lIHtzdHJpbmd9IC0gYSBzdHJpbmcgdG8gY2hlY2sgd2hldGhlciBpdHMgYSBieWxpbmUuXG4gICAqIEByZXR1cm4gQm9vbGVhbiAtIHdoZXRoZXIgdGhlIGlucHV0IHN0cmluZyBpcyBhIGJ5bGluZS5cbiAgICovXG4gIF9pc1ZhbGlkQnlsaW5lOiBmdW5jdGlvbihieWxpbmUpIHtcbiAgICBpZiAodHlwZW9mIGJ5bGluZSA9PSAnc3RyaW5nJyB8fCBieWxpbmUgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgIGJ5bGluZSA9IGJ5bGluZS50cmltKCk7XG4gICAgICByZXR1cm4gKGJ5bGluZS5sZW5ndGggPiAwKSAmJiAoYnlsaW5lLmxlbmd0aCA8IDEwMCk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICAvKipcbiAgICogQXR0ZW1wdHMgdG8gZ2V0IGV4Y2VycHQgYW5kIGJ5bGluZSBtZXRhZGF0YSBmb3IgdGhlIGFydGljbGUuXG4gICAqXG4gICAqIEByZXR1cm4gT2JqZWN0IHdpdGggb3B0aW9uYWwgXCJleGNlcnB0XCIgYW5kIFwiYnlsaW5lXCIgcHJvcGVydGllc1xuICAgKi9cbiAgX2dldEFydGljbGVNZXRhZGF0YTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1ldGFkYXRhID0ge307XG4gICAgdmFyIHZhbHVlcyA9IHt9O1xuICAgIHZhciBtZXRhRWxlbWVudHMgPSB0aGlzLl9kb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJtZXRhXCIpO1xuXG4gICAgLy8gTWF0Y2ggXCJkZXNjcmlwdGlvblwiLCBvciBUd2l0dGVyJ3MgXCJ0d2l0dGVyOmRlc2NyaXB0aW9uXCIgKENhcmRzKVxuICAgIC8vIGluIG5hbWUgYXR0cmlidXRlLlxuICAgIHZhciBuYW1lUGF0dGVybiA9IC9eXFxzKigodHdpdHRlcilcXHMqOlxccyopPyhkZXNjcmlwdGlvbnx0aXRsZSlcXHMqJC9naTtcblxuICAgIC8vIE1hdGNoIEZhY2Vib29rJ3MgT3BlbiBHcmFwaCB0aXRsZSAmIGRlc2NyaXB0aW9uIHByb3BlcnRpZXMuXG4gICAgdmFyIHByb3BlcnR5UGF0dGVybiA9IC9eXFxzKm9nXFxzKjpcXHMqKGRlc2NyaXB0aW9ufHRpdGxlKVxccyokL2dpO1xuXG4gICAgLy8gRmluZCBkZXNjcmlwdGlvbiB0YWdzLlxuICAgIHRoaXMuX2ZvckVhY2hOb2RlKG1ldGFFbGVtZW50cywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgdmFyIGVsZW1lbnROYW1lID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpO1xuICAgICAgdmFyIGVsZW1lbnRQcm9wZXJ0eSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwicHJvcGVydHlcIik7XG5cbiAgICAgIGlmIChbZWxlbWVudE5hbWUsIGVsZW1lbnRQcm9wZXJ0eV0uaW5kZXhPZihcImF1dGhvclwiKSAhPT0gLTEpIHtcbiAgICAgICAgbWV0YWRhdGEuYnlsaW5lID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJjb250ZW50XCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBuYW1lID0gbnVsbDtcbiAgICAgIGlmIChuYW1lUGF0dGVybi50ZXN0KGVsZW1lbnROYW1lKSkge1xuICAgICAgICBuYW1lID0gZWxlbWVudE5hbWU7XG4gICAgICB9IGVsc2UgaWYgKHByb3BlcnR5UGF0dGVybi50ZXN0KGVsZW1lbnRQcm9wZXJ0eSkpIHtcbiAgICAgICAgbmFtZSA9IGVsZW1lbnRQcm9wZXJ0eTtcbiAgICAgIH1cblxuICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgdmFyIGNvbnRlbnQgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShcImNvbnRlbnRcIik7XG4gICAgICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgICAgLy8gQ29udmVydCB0byBsb3dlcmNhc2UgYW5kIHJlbW92ZSBhbnkgd2hpdGVzcGFjZVxuICAgICAgICAgIC8vIHNvIHdlIGNhbiBtYXRjaCBiZWxvdy5cbiAgICAgICAgICBuYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccy9nLCAnJyk7XG4gICAgICAgICAgdmFsdWVzW25hbWVdID0gY29udGVudC50cmltKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChcImRlc2NyaXB0aW9uXCIgaW4gdmFsdWVzKSB7XG4gICAgICBtZXRhZGF0YS5leGNlcnB0ID0gdmFsdWVzW1wiZGVzY3JpcHRpb25cIl07XG4gICAgfSBlbHNlIGlmIChcIm9nOmRlc2NyaXB0aW9uXCIgaW4gdmFsdWVzKSB7XG4gICAgICAvLyBVc2UgZmFjZWJvb2sgb3BlbiBncmFwaCBkZXNjcmlwdGlvbi5cbiAgICAgIG1ldGFkYXRhLmV4Y2VycHQgPSB2YWx1ZXNbXCJvZzpkZXNjcmlwdGlvblwiXTtcbiAgICB9IGVsc2UgaWYgKFwidHdpdHRlcjpkZXNjcmlwdGlvblwiIGluIHZhbHVlcykge1xuICAgICAgLy8gVXNlIHR3aXR0ZXIgY2FyZHMgZGVzY3JpcHRpb24uXG4gICAgICBtZXRhZGF0YS5leGNlcnB0ID0gdmFsdWVzW1widHdpdHRlcjpkZXNjcmlwdGlvblwiXTtcbiAgICB9XG5cbiAgICBtZXRhZGF0YS50aXRsZSA9IHRoaXMuX2dldEFydGljbGVUaXRsZSgpO1xuICAgIGlmICghbWV0YWRhdGEudGl0bGUpIHtcbiAgICAgIGlmIChcIm9nOnRpdGxlXCIgaW4gdmFsdWVzKSB7XG4gICAgICAgIC8vIFVzZSBmYWNlYm9vayBvcGVuIGdyYXBoIHRpdGxlLlxuICAgICAgICBtZXRhZGF0YS50aXRsZSA9IHZhbHVlc1tcIm9nOnRpdGxlXCJdO1xuICAgICAgfSBlbHNlIGlmIChcInR3aXR0ZXI6dGl0bGVcIiBpbiB2YWx1ZXMpIHtcbiAgICAgICAgLy8gVXNlIHR3aXR0ZXIgY2FyZHMgdGl0bGUuXG4gICAgICAgIG1ldGFkYXRhLnRpdGxlID0gdmFsdWVzW1widHdpdHRlcjp0aXRsZVwiXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbWV0YWRhdGE7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgc2NyaXB0IHRhZ3MgZnJvbSB0aGUgZG9jdW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqKi9cbiAgX3JlbW92ZVNjcmlwdHM6IGZ1bmN0aW9uKGRvYykge1xuICAgIHRoaXMuX3JlbW92ZU5vZGVzKGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JyksIGZ1bmN0aW9uKHNjcmlwdE5vZGUpIHtcbiAgICAgIHNjcmlwdE5vZGUubm9kZVZhbHVlID0gXCJcIjtcbiAgICAgIHNjcmlwdE5vZGUucmVtb3ZlQXR0cmlidXRlKCdzcmMnKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIHRoaXMuX3JlbW92ZU5vZGVzKGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnbm9zY3JpcHQnKSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoaXMgbm9kZSBoYXMgb25seSB3aGl0ZXNwYWNlIGFuZCBhIHNpbmdsZSBlbGVtZW50IHdpdGggZ2l2ZW4gdGFnXG4gICAqIFJldHVybnMgZmFsc2UgaWYgdGhlIERJViBub2RlIGNvbnRhaW5zIG5vbi1lbXB0eSB0ZXh0IG5vZGVzXG4gICAqIG9yIGlmIGl0IGNvbnRhaW5zIG5vIGVsZW1lbnQgd2l0aCBnaXZlbiB0YWcgb3IgbW9yZSB0aGFuIDEgZWxlbWVudC5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHBhcmFtIHN0cmluZyB0YWcgb2YgY2hpbGQgZWxlbWVudFxuICAgKiovXG4gIF9oYXNTaW5nbGVUYWdJbnNpZGVFbGVtZW50OiBmdW5jdGlvbihlbGVtZW50LCB0YWcpIHtcbiAgICAvLyBUaGVyZSBzaG91bGQgYmUgZXhhY3RseSAxIGVsZW1lbnQgY2hpbGQgd2l0aCBnaXZlbiB0YWdcbiAgICBpZiAoZWxlbWVudC5jaGlsZHJlbi5sZW5ndGggIT0gMSB8fCBlbGVtZW50LmNoaWxkcmVuWzBdLnRhZ05hbWUgIT09IHRhZykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIEFuZCB0aGVyZSBzaG91bGQgYmUgbm8gdGV4dCBub2RlcyB3aXRoIHJlYWwgY29udGVudFxuICAgIHJldHVybiAhdGhpcy5fc29tZU5vZGUoZWxlbWVudC5jaGlsZE5vZGVzLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gdGhpcy5URVhUX05PREUgJiZcbiAgICAgICAgICB0aGlzLlJFR0VYUFMuaGFzQ29udGVudC50ZXN0KG5vZGUudGV4dENvbnRlbnQpO1xuICAgIH0pO1xuICB9LFxuXG4gIF9pc0VsZW1lbnRXaXRob3V0Q29udGVudDogZnVuY3Rpb24obm9kZSkge1xuICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSB0aGlzLkVMRU1FTlRfTk9ERSAmJlxuICAgICAgICBub2RlLnRleHRDb250ZW50LnRyaW0oKS5sZW5ndGggPT0gMCAmJlxuICAgICAgICAobm9kZS5jaGlsZHJlbi5sZW5ndGggPT0gMCB8fFxuICAgICAgICBub2RlLmNoaWxkcmVuLmxlbmd0aCA9PSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnJcIikubGVuZ3RoICsgbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhyXCIpLmxlbmd0aCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIERldGVybWluZSB3aGV0aGVyIGVsZW1lbnQgaGFzIGFueSBjaGlsZHJlbiBibG9jayBsZXZlbCBlbGVtZW50cy5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICovXG4gIF9oYXNDaGlsZEJsb2NrRWxlbWVudDogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gdGhpcy5fc29tZU5vZGUoZWxlbWVudC5jaGlsZE5vZGVzLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICByZXR1cm4gdGhpcy5ESVZfVE9fUF9FTEVNUy5pbmRleE9mKG5vZGUudGFnTmFtZSkgIT09IC0xIHx8XG4gICAgICAgICAgdGhpcy5faGFzQ2hpbGRCbG9ja0VsZW1lbnQobm9kZSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqKlxuICAgKiBEZXRlcm1pbmUgaWYgYSBub2RlIHF1YWxpZmllcyBhcyBwaHJhc2luZyBjb250ZW50LlxuICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9HdWlkZS9IVE1ML0NvbnRlbnRfY2F0ZWdvcmllcyNQaHJhc2luZ19jb250ZW50XG4gICAqKi9cbiAgX2lzUGhyYXNpbmdDb250ZW50OiBmdW5jdGlvbihub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IHRoaXMuVEVYVF9OT0RFIHx8IHRoaXMuUEhSQVNJTkdfRUxFTVMuaW5kZXhPZihub2RlLnRhZ05hbWUpICE9PSAtMSB8fFxuICAgICAgICAoKG5vZGUudGFnTmFtZSA9PT0gXCJBXCIgfHwgbm9kZS50YWdOYW1lID09PSBcIkRFTFwiIHx8IG5vZGUudGFnTmFtZSA9PT0gXCJJTlNcIikgJiZcbiAgICAgICAgdGhpcy5fZXZlcnlOb2RlKG5vZGUuY2hpbGROb2RlcywgdGhpcy5faXNQaHJhc2luZ0NvbnRlbnQpKTtcbiAgfSxcblxuICBfaXNXaGl0ZXNwYWNlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgcmV0dXJuIChub2RlLm5vZGVUeXBlID09PSB0aGlzLlRFWFRfTk9ERSAmJiBub2RlLnRleHRDb250ZW50LnRyaW0oKS5sZW5ndGggPT09IDApIHx8XG4gICAgICAgIChub2RlLm5vZGVUeXBlID09PSB0aGlzLkVMRU1FTlRfTk9ERSAmJiBub2RlLnRhZ05hbWUgPT09IFwiQlJcIik7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgaW5uZXIgdGV4dCBvZiBhIG5vZGUgLSBjcm9zcyBicm93c2VyIGNvbXBhdGlibHkuXG4gICAqIFRoaXMgYWxzbyBzdHJpcHMgb3V0IGFueSBleGNlc3Mgd2hpdGVzcGFjZSB0byBiZSBmb3VuZC5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHBhcmFtIEJvb2xlYW4gbm9ybWFsaXplU3BhY2VzIChkZWZhdWx0OiB0cnVlKVxuICAgKiBAcmV0dXJuIHN0cmluZ1xuICAgKiovXG4gIF9nZXRJbm5lclRleHQ6IGZ1bmN0aW9uKGUsIG5vcm1hbGl6ZVNwYWNlcykge1xuICAgIG5vcm1hbGl6ZVNwYWNlcyA9ICh0eXBlb2Ygbm9ybWFsaXplU3BhY2VzID09PSAndW5kZWZpbmVkJykgPyB0cnVlIDogbm9ybWFsaXplU3BhY2VzO1xuICAgIHZhciB0ZXh0Q29udGVudCA9IGUudGV4dENvbnRlbnQudHJpbSgpO1xuXG4gICAgaWYgKG5vcm1hbGl6ZVNwYWNlcykge1xuICAgICAgcmV0dXJuIHRleHRDb250ZW50LnJlcGxhY2UodGhpcy5SRUdFWFBTLm5vcm1hbGl6ZSwgXCIgXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dENvbnRlbnQ7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbnVtYmVyIG9mIHRpbWVzIGEgc3RyaW5nIHMgYXBwZWFycyBpbiB0aGUgbm9kZSBlLlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcGFyYW0gc3RyaW5nIC0gd2hhdCB0byBzcGxpdCBvbi4gRGVmYXVsdCBpcyBcIixcIlxuICAgKiBAcmV0dXJuIG51bWJlciAoaW50ZWdlcilcbiAgICoqL1xuICBfZ2V0Q2hhckNvdW50OiBmdW5jdGlvbihlLCBzKSB7XG4gICAgcyA9IHMgfHwgXCIsXCI7XG4gICAgcmV0dXJuIHRoaXMuX2dldElubmVyVGV4dChlKS5zcGxpdChzKS5sZW5ndGggLSAxO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhlIHN0eWxlIGF0dHJpYnV0ZSBvbiBldmVyeSBlIGFuZCB1bmRlci5cbiAgICogVE9ETzogVGVzdCBpZiBnZXRFbGVtZW50c0J5VGFnTmFtZSgqKSBpcyBmYXN0ZXIuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEByZXR1cm4gdm9pZFxuICAgKiovXG4gIF9jbGVhblN0eWxlczogZnVuY3Rpb24oZSkge1xuICAgIGlmICghZSB8fCBlLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3N2ZycpXG4gICAgICByZXR1cm47XG5cbiAgICAvLyBSZW1vdmUgYHN0eWxlYCBhbmQgZGVwcmVjYXRlZCBwcmVzZW50YXRpb25hbCBhdHRyaWJ1dGVzXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLlBSRVNFTlRBVElPTkFMX0FUVFJJQlVURVMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGUucmVtb3ZlQXR0cmlidXRlKHRoaXMuUFJFU0VOVEFUSU9OQUxfQVRUUklCVVRFU1tpXSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuREVQUkVDQVRFRF9TSVpFX0FUVFJJQlVURV9FTEVNUy5pbmRleE9mKGUudGFnTmFtZSkgIT09IC0xKSB7XG4gICAgICBlLnJlbW92ZUF0dHJpYnV0ZSgnd2lkdGgnKTtcbiAgICAgIGUucmVtb3ZlQXR0cmlidXRlKCdoZWlnaHQnKTtcbiAgICB9XG5cbiAgICB2YXIgY3VyID0gZS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICB3aGlsZSAoY3VyICE9PSBudWxsKSB7XG4gICAgICB0aGlzLl9jbGVhblN0eWxlcyhjdXIpO1xuICAgICAgY3VyID0gY3VyLm5leHRFbGVtZW50U2libGluZztcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgZGVuc2l0eSBvZiBsaW5rcyBhcyBhIHBlcmNlbnRhZ2Ugb2YgdGhlIGNvbnRlbnRcbiAgICogVGhpcyBpcyB0aGUgYW1vdW50IG9mIHRleHQgdGhhdCBpcyBpbnNpZGUgYSBsaW5rIGRpdmlkZWQgYnkgdGhlIHRvdGFsIHRleHQgaW4gdGhlIG5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEByZXR1cm4gbnVtYmVyIChmbG9hdClcbiAgICoqL1xuICBfZ2V0TGlua0RlbnNpdHk6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICB2YXIgdGV4dExlbmd0aCA9IHRoaXMuX2dldElubmVyVGV4dChlbGVtZW50KS5sZW5ndGg7XG4gICAgaWYgKHRleHRMZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gMDtcblxuICAgIHZhciBsaW5rTGVuZ3RoID0gMDtcblxuICAgIC8vIFhYWCBpbXBsZW1lbnQgX3JlZHVjZU5vZGVMaXN0P1xuICAgIHRoaXMuX2ZvckVhY2hOb2RlKGVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJhXCIpLCBmdW5jdGlvbihsaW5rTm9kZSkge1xuICAgICAgbGlua0xlbmd0aCArPSB0aGlzLl9nZXRJbm5lclRleHQobGlua05vZGUpLmxlbmd0aDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsaW5rTGVuZ3RoIC8gdGV4dExlbmd0aDtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGFuIGVsZW1lbnRzIGNsYXNzL2lkIHdlaWdodC4gVXNlcyByZWd1bGFyIGV4cHJlc3Npb25zIHRvIHRlbGwgaWYgdGhpc1xuICAgKiBlbGVtZW50IGxvb2tzIGdvb2Qgb3IgYmFkLlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcmV0dXJuIG51bWJlciAoSW50ZWdlcilcbiAgICoqL1xuICBfZ2V0Q2xhc3NXZWlnaHQ6IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoIXRoaXMuX2ZsYWdJc0FjdGl2ZSh0aGlzLkZMQUdfV0VJR0hUX0NMQVNTRVMpKVxuICAgICAgcmV0dXJuIDA7XG5cbiAgICB2YXIgd2VpZ2h0ID0gMDtcblxuICAgIC8vIExvb2sgZm9yIGEgc3BlY2lhbCBjbGFzc25hbWVcbiAgICBpZiAodHlwZW9mKGUuY2xhc3NOYW1lKSA9PT0gJ3N0cmluZycgJiYgZS5jbGFzc05hbWUgIT09ICcnKSB7XG4gICAgICBpZiAodGhpcy5SRUdFWFBTLm5lZ2F0aXZlLnRlc3QoZS5jbGFzc05hbWUpKVxuICAgICAgICB3ZWlnaHQgLT0gMjU7XG5cbiAgICAgIGlmICh0aGlzLlJFR0VYUFMucG9zaXRpdmUudGVzdChlLmNsYXNzTmFtZSkpXG4gICAgICAgIHdlaWdodCArPSAyNTtcbiAgICB9XG5cbiAgICAvLyBMb29rIGZvciBhIHNwZWNpYWwgSURcbiAgICBpZiAodHlwZW9mKGUuaWQpID09PSAnc3RyaW5nJyAmJiBlLmlkICE9PSAnJykge1xuICAgICAgaWYgKHRoaXMuUkVHRVhQUy5uZWdhdGl2ZS50ZXN0KGUuaWQpKVxuICAgICAgICB3ZWlnaHQgLT0gMjU7XG5cbiAgICAgIGlmICh0aGlzLlJFR0VYUFMucG9zaXRpdmUudGVzdChlLmlkKSlcbiAgICAgICAgd2VpZ2h0ICs9IDI1O1xuICAgIH1cblxuICAgIHJldHVybiB3ZWlnaHQ7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENsZWFuIGEgbm9kZSBvZiBhbGwgZWxlbWVudHMgb2YgdHlwZSBcInRhZ1wiLlxuICAgKiAoVW5sZXNzIGl0J3MgYSB5b3V0dWJlL3ZpbWVvIHZpZGVvLiBQZW9wbGUgbG92ZSBtb3ZpZXMuKVxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcGFyYW0gc3RyaW5nIHRhZyB0byBjbGVhblxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICoqL1xuICBfY2xlYW46IGZ1bmN0aW9uKGUsIHRhZykge1xuICAgIHZhciBpc0VtYmVkID0gW1wib2JqZWN0XCIsIFwiZW1iZWRcIiwgXCJpZnJhbWVcIl0uaW5kZXhPZih0YWcpICE9PSAtMTtcblxuICAgIHRoaXMuX3JlbW92ZU5vZGVzKGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnKSwgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgLy8gQWxsb3cgeW91dHViZSBhbmQgdmltZW8gdmlkZW9zIHRocm91Z2ggYXMgcGVvcGxlIHVzdWFsbHkgd2FudCB0byBzZWUgdGhvc2UuXG4gICAgICBpZiAoaXNFbWJlZCkge1xuICAgICAgICB2YXIgYXR0cmlidXRlVmFsdWVzID0gW10ubWFwLmNhbGwoZWxlbWVudC5hdHRyaWJ1dGVzLCBmdW5jdGlvbihhdHRyKSB7XG4gICAgICAgICAgcmV0dXJuIGF0dHIudmFsdWU7XG4gICAgICAgIH0pLmpvaW4oXCJ8XCIpO1xuXG4gICAgICAgIC8vIEZpcnN0LCBjaGVjayB0aGUgZWxlbWVudHMgYXR0cmlidXRlcyB0byBzZWUgaWYgYW55IG9mIHRoZW0gY29udGFpbiB5b3V0dWJlIG9yIHZpbWVvXG4gICAgICAgIGlmICh0aGlzLlJFR0VYUFMudmlkZW9zLnRlc3QoYXR0cmlidXRlVmFsdWVzKSlcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgLy8gVGhlbiBjaGVjayB0aGUgZWxlbWVudHMgaW5zaWRlIHRoaXMgZWxlbWVudCBmb3IgdGhlIHNhbWUuXG4gICAgICAgIGlmICh0aGlzLlJFR0VYUFMudmlkZW9zLnRlc3QoZWxlbWVudC5pbm5lckhUTUwpKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgZ2l2ZW4gbm9kZSBoYXMgb25lIG9mIGl0cyBhbmNlc3RvciB0YWcgbmFtZSBtYXRjaGluZyB0aGVcbiAgICogcHJvdmlkZWQgb25lLlxuICAgKiBAcGFyYW0gIEhUTUxFbGVtZW50IG5vZGVcbiAgICogQHBhcmFtICBTdHJpbmcgICAgICB0YWdOYW1lXG4gICAqIEBwYXJhbSAgTnVtYmVyICAgICAgbWF4RGVwdGhcbiAgICogQHBhcmFtICBGdW5jdGlvbiAgICBmaWx0ZXJGbiBhIGZpbHRlciB0byBpbnZva2UgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyBub2RlICdjb3VudHMnXG4gICAqIEByZXR1cm4gQm9vbGVhblxuICAgKi9cbiAgX2hhc0FuY2VzdG9yVGFnOiBmdW5jdGlvbihub2RlLCB0YWdOYW1lLCBtYXhEZXB0aCwgZmlsdGVyRm4pIHtcbiAgICBtYXhEZXB0aCA9IG1heERlcHRoIHx8IDM7XG4gICAgdGFnTmFtZSA9IHRhZ05hbWUudG9VcHBlckNhc2UoKTtcbiAgICB2YXIgZGVwdGggPSAwO1xuICAgIHdoaWxlIChub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgIGlmIChtYXhEZXB0aCA+IDAgJiYgZGVwdGggPiBtYXhEZXB0aClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKG5vZGUucGFyZW50Tm9kZS50YWdOYW1lID09PSB0YWdOYW1lICYmICghZmlsdGVyRm4gfHwgZmlsdGVyRm4obm9kZS5wYXJlbnROb2RlKSkpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgIGRlcHRoKys7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJuIGFuIG9iamVjdCBpbmRpY2F0aW5nIGhvdyBtYW55IHJvd3MgYW5kIGNvbHVtbnMgdGhpcyB0YWJsZSBoYXMuXG4gICAqL1xuICBfZ2V0Um93QW5kQ29sdW1uQ291bnQ6IGZ1bmN0aW9uKHRhYmxlKSB7XG4gICAgdmFyIHJvd3MgPSAwO1xuICAgIHZhciBjb2x1bW5zID0gMDtcbiAgICB2YXIgdHJzID0gdGFibGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ0clwiKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRycy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHJvd3NwYW4gPSB0cnNbaV0uZ2V0QXR0cmlidXRlKFwicm93c3BhblwiKSB8fCAwO1xuICAgICAgaWYgKHJvd3NwYW4pIHtcbiAgICAgICAgcm93c3BhbiA9IHBhcnNlSW50KHJvd3NwYW4sIDEwKTtcbiAgICAgIH1cbiAgICAgIHJvd3MgKz0gKHJvd3NwYW4gfHwgMSk7XG5cbiAgICAgIC8vIE5vdyBsb29rIGZvciBjb2x1bW4tcmVsYXRlZCBpbmZvXG4gICAgICB2YXIgY29sdW1uc0luVGhpc1JvdyA9IDA7XG4gICAgICB2YXIgY2VsbHMgPSB0cnNbaV0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ0ZFwiKTtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2VsbHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdmFyIGNvbHNwYW4gPSBjZWxsc1tqXS5nZXRBdHRyaWJ1dGUoXCJjb2xzcGFuXCIpIHx8IDA7XG4gICAgICAgIGlmIChjb2xzcGFuKSB7XG4gICAgICAgICAgY29sc3BhbiA9IHBhcnNlSW50KGNvbHNwYW4sIDEwKTtcbiAgICAgICAgfVxuICAgICAgICBjb2x1bW5zSW5UaGlzUm93ICs9IChjb2xzcGFuIHx8IDEpO1xuICAgICAgfVxuICAgICAgY29sdW1ucyA9IE1hdGgubWF4KGNvbHVtbnMsIGNvbHVtbnNJblRoaXNSb3cpO1xuICAgIH1cbiAgICByZXR1cm4ge3Jvd3M6IHJvd3MsIGNvbHVtbnM6IGNvbHVtbnN9O1xuICB9LFxuXG4gIC8qKlxuICAgKiBMb29rIGZvciAnZGF0YScgKGFzIG9wcG9zZWQgdG8gJ2xheW91dCcpIHRhYmxlcywgZm9yIHdoaWNoIHdlIHVzZVxuICAgKiBzaW1pbGFyIGNoZWNrcyBhc1xuICAgKiBodHRwczovL2R4ci5tb3ppbGxhLm9yZy9tb3ppbGxhLWNlbnRyYWwvcmV2LzcxMjI0MDQ5YzBiNTJhYjE5MDU2NGQzZWEwZWFiMDg5YTE1OWE0Y2YvYWNjZXNzaWJsZS9odG1sL0hUTUxUYWJsZUFjY2Vzc2libGUuY3BwIzkyMFxuICAgKi9cbiAgX21hcmtEYXRhVGFibGVzOiBmdW5jdGlvbihyb290KSB7XG4gICAgdmFyIHRhYmxlcyA9IHJvb3QuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ0YWJsZVwiKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhYmxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHRhYmxlID0gdGFibGVzW2ldO1xuICAgICAgdmFyIHJvbGUgPSB0YWJsZS5nZXRBdHRyaWJ1dGUoXCJyb2xlXCIpO1xuICAgICAgaWYgKHJvbGUgPT0gXCJwcmVzZW50YXRpb25cIikge1xuICAgICAgICB0YWJsZS5fcmVhZGFiaWxpdHlEYXRhVGFibGUgPSBmYWxzZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB2YXIgZGF0YXRhYmxlID0gdGFibGUuZ2V0QXR0cmlidXRlKFwiZGF0YXRhYmxlXCIpO1xuICAgICAgaWYgKGRhdGF0YWJsZSA9PSBcIjBcIikge1xuICAgICAgICB0YWJsZS5fcmVhZGFiaWxpdHlEYXRhVGFibGUgPSBmYWxzZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB2YXIgc3VtbWFyeSA9IHRhYmxlLmdldEF0dHJpYnV0ZShcInN1bW1hcnlcIik7XG4gICAgICBpZiAoc3VtbWFyeSkge1xuICAgICAgICB0YWJsZS5fcmVhZGFiaWxpdHlEYXRhVGFibGUgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIGNhcHRpb24gPSB0YWJsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhcHRpb25cIilbMF07XG4gICAgICBpZiAoY2FwdGlvbiAmJiBjYXB0aW9uLmNoaWxkTm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgICB0YWJsZS5fcmVhZGFiaWxpdHlEYXRhVGFibGUgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIHRhYmxlIGhhcyBhIGRlc2NlbmRhbnQgd2l0aCBhbnkgb2YgdGhlc2UgdGFncywgY29uc2lkZXIgYSBkYXRhIHRhYmxlOlxuICAgICAgdmFyIGRhdGFUYWJsZURlc2NlbmRhbnRzID0gW1wiY29sXCIsIFwiY29sZ3JvdXBcIiwgXCJ0Zm9vdFwiLCBcInRoZWFkXCIsIFwidGhcIl07XG4gICAgICB2YXIgZGVzY2VuZGFudEV4aXN0cyA9IGZ1bmN0aW9uKHRhZykge1xuICAgICAgICByZXR1cm4gISF0YWJsZS5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWcpWzBdO1xuICAgICAgfTtcbiAgICAgIGlmIChkYXRhVGFibGVEZXNjZW5kYW50cy5zb21lKGRlc2NlbmRhbnRFeGlzdHMpKSB7XG4gICAgICAgIHRoaXMubG9nKFwiRGF0YSB0YWJsZSBiZWNhdXNlIGZvdW5kIGRhdGEteSBkZXNjZW5kYW50XCIpO1xuICAgICAgICB0YWJsZS5fcmVhZGFiaWxpdHlEYXRhVGFibGUgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gTmVzdGVkIHRhYmxlcyBpbmRpY2F0ZSBhIGxheW91dCB0YWJsZTpcbiAgICAgIGlmICh0YWJsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRhYmxlXCIpWzBdKSB7XG4gICAgICAgIHRhYmxlLl9yZWFkYWJpbGl0eURhdGFUYWJsZSA9IGZhbHNlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIHNpemVJbmZvID0gdGhpcy5fZ2V0Um93QW5kQ29sdW1uQ291bnQodGFibGUpO1xuICAgICAgaWYgKHNpemVJbmZvLnJvd3MgPj0gMTAgfHwgc2l6ZUluZm8uY29sdW1ucyA+IDQpIHtcbiAgICAgICAgdGFibGUuX3JlYWRhYmlsaXR5RGF0YVRhYmxlID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvLyBOb3cganVzdCBnbyBieSBzaXplIGVudGlyZWx5OlxuICAgICAgdGFibGUuX3JlYWRhYmlsaXR5RGF0YVRhYmxlID0gc2l6ZUluZm8ucm93cyAqIHNpemVJbmZvLmNvbHVtbnMgPiAxMDtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIENsZWFuIGFuIGVsZW1lbnQgb2YgYWxsIHRhZ3Mgb2YgdHlwZSBcInRhZ1wiIGlmIHRoZXkgbG9vayBmaXNoeS5cbiAgICogXCJGaXNoeVwiIGlzIGFuIGFsZ29yaXRobSBiYXNlZCBvbiBjb250ZW50IGxlbmd0aCwgY2xhc3NuYW1lcywgbGluayBkZW5zaXR5LCBudW1iZXIgb2YgaW1hZ2VzICYgZW1iZWRzLCBldGMuXG4gICAqXG4gICAqIEByZXR1cm4gdm9pZFxuICAgKiovXG4gIF9jbGVhbkNvbmRpdGlvbmFsbHk6IGZ1bmN0aW9uKGUsIHRhZykge1xuICAgIGlmICghdGhpcy5fZmxhZ0lzQWN0aXZlKHRoaXMuRkxBR19DTEVBTl9DT05ESVRJT05BTExZKSlcbiAgICAgIHJldHVybjtcblxuICAgIHZhciBpc0xpc3QgPSB0YWcgPT09IFwidWxcIiB8fCB0YWcgPT09IFwib2xcIjtcblxuICAgIC8vIEdhdGhlciBjb3VudHMgZm9yIG90aGVyIHR5cGljYWwgZWxlbWVudHMgZW1iZWRkZWQgd2l0aGluLlxuICAgIC8vIFRyYXZlcnNlIGJhY2t3YXJkcyBzbyB3ZSBjYW4gcmVtb3ZlIG5vZGVzIGF0IHRoZSBzYW1lIHRpbWVcbiAgICAvLyB3aXRob3V0IGVmZmVjdGluZyB0aGUgdHJhdmVyc2FsLlxuICAgIC8vXG4gICAgLy8gVE9ETzogQ29uc2lkZXIgdGFraW5nIGludG8gYWNjb3VudCBvcmlnaW5hbCBjb250ZW50U2NvcmUgaGVyZS5cbiAgICB0aGlzLl9yZW1vdmVOb2RlcyhlLmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZyksIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIC8vIEZpcnN0IGNoZWNrIGlmIHdlJ3JlIGluIGEgZGF0YSB0YWJsZSwgaW4gd2hpY2ggY2FzZSBkb24ndCByZW1vdmUgdXMuXG4gICAgICB2YXIgaXNEYXRhVGFibGUgPSBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiB0Ll9yZWFkYWJpbGl0eURhdGFUYWJsZTtcbiAgICAgIH07XG5cbiAgICAgIGlmICh0aGlzLl9oYXNBbmNlc3RvclRhZyhub2RlLCBcInRhYmxlXCIsIC0xLCBpc0RhdGFUYWJsZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICB2YXIgd2VpZ2h0ID0gdGhpcy5fZ2V0Q2xhc3NXZWlnaHQobm9kZSk7XG4gICAgICB2YXIgY29udGVudFNjb3JlID0gMDtcblxuICAgICAgdGhpcy5sb2coXCJDbGVhbmluZyBDb25kaXRpb25hbGx5XCIsIG5vZGUpO1xuXG4gICAgICBpZiAod2VpZ2h0ICsgY29udGVudFNjb3JlIDwgMCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX2dldENoYXJDb3VudChub2RlLCAnLCcpIDwgMTApIHtcbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vdCB2ZXJ5IG1hbnkgY29tbWFzLCBhbmQgdGhlIG51bWJlciBvZlxuICAgICAgICAvLyBub24tcGFyYWdyYXBoIGVsZW1lbnRzIGlzIG1vcmUgdGhhbiBwYXJhZ3JhcGhzIG9yIG90aGVyXG4gICAgICAgIC8vIG9taW5vdXMgc2lnbnMsIHJlbW92ZSB0aGUgZWxlbWVudC5cbiAgICAgICAgdmFyIHAgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicFwiKS5sZW5ndGg7XG4gICAgICAgIHZhciBpbWcgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW1nXCIpLmxlbmd0aDtcbiAgICAgICAgdmFyIGxpID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImxpXCIpLmxlbmd0aCAtIDEwMDtcbiAgICAgICAgdmFyIGlucHV0ID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImlucHV0XCIpLmxlbmd0aDtcblxuICAgICAgICB2YXIgZW1iZWRDb3VudCA9IDA7XG4gICAgICAgIHZhciBlbWJlZHMgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZW1iZWRcIik7XG4gICAgICAgIGZvciAodmFyIGVpID0gMCwgaWwgPSBlbWJlZHMubGVuZ3RoOyBlaSA8IGlsOyBlaSArPSAxKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLlJFR0VYUFMudmlkZW9zLnRlc3QoZW1iZWRzW2VpXS5zcmMpKVxuICAgICAgICAgICAgZW1iZWRDb3VudCArPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxpbmtEZW5zaXR5ID0gdGhpcy5fZ2V0TGlua0RlbnNpdHkobm9kZSk7XG4gICAgICAgIHZhciBjb250ZW50TGVuZ3RoID0gdGhpcy5fZ2V0SW5uZXJUZXh0KG5vZGUpLmxlbmd0aDtcblxuICAgICAgICB2YXIgaGF2ZVRvUmVtb3ZlID1cbiAgICAgICAgICAgIChpbWcgPiAxICYmIHAgLyBpbWcgPCAwLjUgJiYgIXRoaXMuX2hhc0FuY2VzdG9yVGFnKG5vZGUsIFwiZmlndXJlXCIpKSB8fFxuICAgICAgICAgICAgKCFpc0xpc3QgJiYgbGkgPiBwKSB8fFxuICAgICAgICAgICAgKGlucHV0ID4gTWF0aC5mbG9vcihwLzMpKSB8fFxuICAgICAgICAgICAgKCFpc0xpc3QgJiYgY29udGVudExlbmd0aCA8IDI1ICYmIChpbWcgPT09IDAgfHwgaW1nID4gMikgJiYgIXRoaXMuX2hhc0FuY2VzdG9yVGFnKG5vZGUsIFwiZmlndXJlXCIpKSB8fFxuICAgICAgICAgICAgKCFpc0xpc3QgJiYgd2VpZ2h0IDwgMjUgJiYgbGlua0RlbnNpdHkgPiAwLjIpIHx8XG4gICAgICAgICAgICAod2VpZ2h0ID49IDI1ICYmIGxpbmtEZW5zaXR5ID4gMC41KSB8fFxuICAgICAgICAgICAgKChlbWJlZENvdW50ID09PSAxICYmIGNvbnRlbnRMZW5ndGggPCA3NSkgfHwgZW1iZWRDb3VudCA+IDEpO1xuICAgICAgICByZXR1cm4gaGF2ZVRvUmVtb3ZlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDbGVhbiBvdXQgZWxlbWVudHMgd2hvc2UgaWQvY2xhc3MgY29tYmluYXRpb25zIG1hdGNoIHNwZWNpZmljIHN0cmluZy5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHBhcmFtIFJlZ0V4cCBtYXRjaCBpZC9jbGFzcyBjb21iaW5hdGlvbi5cbiAgICogQHJldHVybiB2b2lkXG4gICAqKi9cbiAgX2NsZWFuTWF0Y2hlZE5vZGVzOiBmdW5jdGlvbihlLCByZWdleCkge1xuICAgIHZhciBlbmRPZlNlYXJjaE1hcmtlck5vZGUgPSB0aGlzLl9nZXROZXh0Tm9kZShlLCB0cnVlKTtcbiAgICB2YXIgbmV4dCA9IHRoaXMuX2dldE5leHROb2RlKGUpO1xuICAgIHdoaWxlIChuZXh0ICYmIG5leHQgIT0gZW5kT2ZTZWFyY2hNYXJrZXJOb2RlKSB7XG4gICAgICBpZiAocmVnZXgudGVzdChuZXh0LmNsYXNzTmFtZSArIFwiIFwiICsgbmV4dC5pZCkpIHtcbiAgICAgICAgbmV4dCA9IHRoaXMuX3JlbW92ZUFuZEdldE5leHQobmV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXh0ID0gdGhpcy5fZ2V0TmV4dE5vZGUobmV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBDbGVhbiBvdXQgc3B1cmlvdXMgaGVhZGVycyBmcm9tIGFuIEVsZW1lbnQuIENoZWNrcyB0aGluZ3MgbGlrZSBjbGFzc25hbWVzIGFuZCBsaW5rIGRlbnNpdHkuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEByZXR1cm4gdm9pZFxuICAgKiovXG4gIF9jbGVhbkhlYWRlcnM6IGZ1bmN0aW9uKGUpIHtcbiAgICBmb3IgKHZhciBoZWFkZXJJbmRleCA9IDE7IGhlYWRlckluZGV4IDwgMzsgaGVhZGVySW5kZXggKz0gMSkge1xuICAgICAgdGhpcy5fcmVtb3ZlTm9kZXMoZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaCcgKyBoZWFkZXJJbmRleCksIGZ1bmN0aW9uIChoZWFkZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldENsYXNzV2VpZ2h0KGhlYWRlcikgPCAwO1xuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIF9mbGFnSXNBY3RpdmU6IGZ1bmN0aW9uKGZsYWcpIHtcbiAgICByZXR1cm4gKHRoaXMuX2ZsYWdzICYgZmxhZykgPiAwO1xuICB9LFxuXG4gIF9yZW1vdmVGbGFnOiBmdW5jdGlvbihmbGFnKSB7XG4gICAgdGhpcy5fZmxhZ3MgPSB0aGlzLl9mbGFncyAmIH5mbGFnO1xuICB9LFxuXG4gIF9pc1Byb2JhYmx5VmlzaWJsZTogZnVuY3Rpb24obm9kZSkge1xuICAgIHJldHVybiBub2RlLnN0eWxlLmRpc3BsYXkgIT0gXCJub25lXCIgJiYgIW5vZGUuaGFzQXR0cmlidXRlKFwiaGlkZGVuXCIpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBEZWNpZGVzIHdoZXRoZXIgb3Igbm90IHRoZSBkb2N1bWVudCBpcyByZWFkZXItYWJsZSB3aXRob3V0IHBhcnNpbmcgdGhlIHdob2xlIHRoaW5nLlxuICAgKlxuICAgKiBAcmV0dXJuIGJvb2xlYW4gV2hldGhlciBvciBub3Qgd2Ugc3VzcGVjdCBwYXJzZSgpIHdpbGwgc3VjZWVlZCBhdCByZXR1cm5pbmcgYW4gYXJ0aWNsZSBvYmplY3QuXG4gICAqL1xuICBpc1Byb2JhYmx5UmVhZGVyYWJsZTogZnVuY3Rpb24oaGVscGVySXNWaXNpYmxlKSB7XG4gICAgdmFyIG5vZGVzID0gdGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKHRoaXMuX2RvYywgW1wicFwiLCBcInByZVwiXSk7XG5cbiAgICAvLyBHZXQgPGRpdj4gbm9kZXMgd2hpY2ggaGF2ZSA8YnI+IG5vZGUocykgYW5kIGFwcGVuZCB0aGVtIGludG8gdGhlIGBub2Rlc2AgdmFyaWFibGUuXG4gICAgLy8gU29tZSBhcnRpY2xlcycgRE9NIHN0cnVjdHVyZXMgbWlnaHQgbG9vayBsaWtlXG4gICAgLy8gPGRpdj5cbiAgICAvLyAgIFNlbnRlbmNlczxicj5cbiAgICAvLyAgIDxicj5cbiAgICAvLyAgIFNlbnRlbmNlczxicj5cbiAgICAvLyA8L2Rpdj5cbiAgICB2YXIgYnJOb2RlcyA9IHRoaXMuX2dldEFsbE5vZGVzV2l0aFRhZyh0aGlzLl9kb2MsIFtcImRpdiA+IGJyXCJdKTtcbiAgICBpZiAoYnJOb2Rlcy5sZW5ndGgpIHtcbiAgICAgIHZhciBzZXQgPSBuZXcgU2V0KCk7XG4gICAgICBbXS5mb3JFYWNoLmNhbGwoYnJOb2RlcywgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICBzZXQuYWRkKG5vZGUucGFyZW50Tm9kZSk7XG4gICAgICB9KTtcbiAgICAgIG5vZGVzID0gW10uY29uY2F0LmFwcGx5KEFycmF5LmZyb20oc2V0KSwgbm9kZXMpO1xuICAgIH1cblxuICAgIGlmICghaGVscGVySXNWaXNpYmxlKSB7XG4gICAgICBoZWxwZXJJc1Zpc2libGUgPSB0aGlzLl9pc1Byb2JhYmx5VmlzaWJsZTtcbiAgICB9XG5cbiAgICB2YXIgc2NvcmUgPSAwO1xuICAgIC8vIFRoaXMgaXMgYSBsaXR0bGUgY2hlZWt5LCB3ZSB1c2UgdGhlIGFjY3VtdWxhdG9yICdzY29yZScgdG8gZGVjaWRlIHdoYXQgdG8gcmV0dXJuIGZyb21cbiAgICAvLyB0aGlzIGNhbGxiYWNrOlxuICAgIHJldHVybiB0aGlzLl9zb21lTm9kZShub2RlcywgZnVuY3Rpb24obm9kZSkge1xuICAgICAgaWYgKGhlbHBlcklzVmlzaWJsZSAmJiAhaGVscGVySXNWaXNpYmxlKG5vZGUpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB2YXIgbWF0Y2hTdHJpbmcgPSBub2RlLmNsYXNzTmFtZSArIFwiIFwiICsgbm9kZS5pZDtcblxuICAgICAgaWYgKHRoaXMuUkVHRVhQUy51bmxpa2VseUNhbmRpZGF0ZXMudGVzdChtYXRjaFN0cmluZykgJiZcbiAgICAgICAgICAhdGhpcy5SRUdFWFBTLm9rTWF5YmVJdHNBQ2FuZGlkYXRlLnRlc3QobWF0Y2hTdHJpbmcpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKG5vZGUubWF0Y2hlcyAmJiBub2RlLm1hdGNoZXMoXCJsaSBwXCIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgdmFyIHRleHRDb250ZW50TGVuZ3RoID0gbm9kZS50ZXh0Q29udGVudC50cmltKCkubGVuZ3RoO1xuICAgICAgaWYgKHRleHRDb250ZW50TGVuZ3RoIDwgMTQwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgc2NvcmUgKz0gTWF0aC5zcXJ0KHRleHRDb250ZW50TGVuZ3RoIC0gMTQwKTtcblxuICAgICAgaWYgKHNjb3JlID4gMjApIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJ1bnMgcmVhZGFiaWxpdHkuXG4gICAqXG4gICAqIFdvcmtmbG93OlxuICAgKiAgMS4gUHJlcCB0aGUgZG9jdW1lbnQgYnkgcmVtb3Zpbmcgc2NyaXB0IHRhZ3MsIGNzcywgZXRjLlxuICAgKiAgMi4gQnVpbGQgcmVhZGFiaWxpdHkncyBET00gdHJlZS5cbiAgICogIDMuIEdyYWIgdGhlIGFydGljbGUgY29udGVudCBmcm9tIHRoZSBjdXJyZW50IGRvbSB0cmVlLlxuICAgKiAgNC4gUmVwbGFjZSB0aGUgY3VycmVudCBET00gdHJlZSB3aXRoIHRoZSBuZXcgb25lLlxuICAgKiAgNS4gUmVhZCBwZWFjZWZ1bGx5LlxuICAgKlxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICoqL1xuICBwYXJzZTogZnVuY3Rpb24gKCkge1xuICAgIC8vIEF2b2lkIHBhcnNpbmcgdG9vIGxhcmdlIGRvY3VtZW50cywgYXMgcGVyIGNvbmZpZ3VyYXRpb24gb3B0aW9uXG4gICAgaWYgKHRoaXMuX21heEVsZW1zVG9QYXJzZSA+IDApIHtcbiAgICAgIHZhciBudW1UYWdzID0gdGhpcy5fZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiKlwiKS5sZW5ndGg7XG4gICAgICBpZiAobnVtVGFncyA+IHRoaXMuX21heEVsZW1zVG9QYXJzZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBYm9ydGluZyBwYXJzaW5nIGRvY3VtZW50OyBcIiArIG51bVRhZ3MgKyBcIiBlbGVtZW50cyBmb3VuZFwiKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgc2NyaXB0IHRhZ3MgZnJvbSB0aGUgZG9jdW1lbnQuXG4gICAgdGhpcy5fcmVtb3ZlU2NyaXB0cyh0aGlzLl9ib2R5KTtcblxuICAgIHRoaXMuX3ByZXBEb2N1bWVudCgpO1xuXG4gICAgdmFyIG1ldGFkYXRhID0gdGhpcy5fZ2V0QXJ0aWNsZU1ldGFkYXRhKCk7XG4gICAgdGhpcy5fYXJ0aWNsZVRpdGxlID0gbWV0YWRhdGEudGl0bGU7XG5cbiAgICB2YXIgYXJ0aWNsZUNvbnRlbnQgPSB0aGlzLl9ncmFiQXJ0aWNsZSgpO1xuICAgIGlmICghYXJ0aWNsZUNvbnRlbnQpXG4gICAgICByZXR1cm4gbnVsbDtcblxuICAgIHRoaXMubG9nKFwiR3JhYmJlZDogXCIgKyBhcnRpY2xlQ29udGVudC5pbm5lckhUTUwpO1xuXG4gICAgdGhpcy5fcG9zdFByb2Nlc3NDb250ZW50KGFydGljbGVDb250ZW50KTtcblxuICAgIC8vIElmIHdlIGhhdmVuJ3QgZm91bmQgYW4gZXhjZXJwdCBpbiB0aGUgYXJ0aWNsZSdzIG1ldGFkYXRhLCB1c2UgdGhlIGFydGljbGUnc1xuICAgIC8vIGZpcnN0IHBhcmFncmFwaCBhcyB0aGUgZXhjZXJwdC4gVGhpcyBpcyB1c2VkIGZvciBkaXNwbGF5aW5nIGEgcHJldmlldyBvZlxuICAgIC8vIHRoZSBhcnRpY2xlJ3MgY29udGVudC5cbiAgICBpZiAoIW1ldGFkYXRhLmV4Y2VycHQpIHtcbiAgICAgIHZhciBwYXJhZ3JhcGhzID0gYXJ0aWNsZUNvbnRlbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJwXCIpO1xuICAgICAgaWYgKHBhcmFncmFwaHMubGVuZ3RoID4gMCkge1xuICAgICAgICBtZXRhZGF0YS5leGNlcnB0ID0gcGFyYWdyYXBoc1swXS50ZXh0Q29udGVudC50cmltKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHRleHRDb250ZW50ID0gYXJ0aWNsZUNvbnRlbnQudGV4dENvbnRlbnQ7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRpdGxlOiB0aGlzLl9hcnRpY2xlVGl0bGUsXG4gICAgICBieWxpbmU6IG1ldGFkYXRhLmJ5bGluZSB8fCB0aGlzLl9hcnRpY2xlQnlsaW5lLFxuICAgICAgZGlyOiB0aGlzLl9hcnRpY2xlRGlyLFxuICAgICAgY29udGVudDogYXJ0aWNsZUNvbnRlbnQuaW5uZXJIVE1MLFxuICAgICAgdGV4dENvbnRlbnQ6IHRleHRDb250ZW50LFxuICAgICAgbGVuZ3RoOiB0ZXh0Q29udGVudC5sZW5ndGgsXG4gICAgICBleGNlcnB0OiBtZXRhZGF0YS5leGNlcnB0LFxuICAgIH07XG4gIH1cbn07XG5cbmlmICh0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gUmVhZGFiaWxpdHk7XG59XG4iXX0=
