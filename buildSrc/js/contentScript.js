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
        this.addEvents();
    }

    _createClass(ClearRead, [{
        key: 'addReadPage',
        value: function addReadPage() {
            if (!this.tpl) {
                var article = new _Readability2.default(document).parse();
                this.tpl = '<div class="center-area" id="clearReadCenterArea">\n                            <div class="article">\n                                <h1 class="title">' + article.title + '</h1>\n                                <div class="content">' + article.content + '</div>\n                            </div>\n                        </div>';
            }
            var div = document.createElement('div');
            div.id = 'clearRead';
            div.setAttribute('class', 'clearread-mode');
            div.innerHTML = this.tpl;
            document.body.appendChild(div);
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

            var clearRead = document.getElementById('clearRead');
            var clearReadCenterArea = document.getElementById('clearReadCenterArea');
            clearReadCenterArea.setAttribute('class', 'center-area');
            setTimeout(function () {
                clearRead.setAttribute('class', 'clearread-mode');
                setTimeout(function () {
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
                if (e.shiftKey && e.keyCode == 13) {
                    console.log(_this2.active);
                    if (!_this2.active) {
                        _this2.addReadPage();
                    }
                } else if (e.keyCode == 27) {
                    console.log(_this2.active);
                    if (_this2.active) {
                        _this2.removeReadPage();
                    }
                }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXZTcmMvY29udGVudFNjcmlwdC5qcyIsImRldlNyYy9saWIvUmVhZGFiaWxpdHkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FDQUE7Ozs7Ozs7O0lBQ00sUztBQUNGLHlCQUFjO0FBQUE7O0FBQ1YsYUFBSyxHQUFMLEdBQVcsSUFBWDtBQUNBLGFBQUssTUFBTCxHQUFjLEtBQWQ7QUFDQSxhQUFLLFNBQUw7QUFDSDs7OztzQ0FFYTtBQUNWLGdCQUFHLENBQUMsS0FBSyxHQUFULEVBQWM7QUFDVixvQkFBSSxVQUFVLElBQUkscUJBQUosQ0FBZ0IsUUFBaEIsRUFBMEIsS0FBMUIsRUFBZDtBQUNBLHFCQUFLLEdBQUwsaUtBRXdDLFFBQVEsS0FGaEQsb0VBRzJDLFFBQVEsT0FIbkQ7QUFNSDtBQUNELGdCQUFJLE1BQU0sU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQVY7QUFDQSxnQkFBSSxFQUFKLEdBQVMsV0FBVDtBQUNBLGdCQUFJLFlBQUosQ0FBaUIsT0FBakIsRUFBMEIsZ0JBQTFCO0FBQ0EsZ0JBQUksU0FBSixHQUFnQixLQUFLLEdBQXJCO0FBQ0EscUJBQVMsSUFBVCxDQUFjLFdBQWQsQ0FBMEIsR0FBMUI7QUFDQSxnQkFBSSxPQUFPLElBQUksb0JBQUosQ0FBeUIsS0FBekIsQ0FBWDtBQUNBLGdCQUFJLFlBQVksU0FBUyxjQUFULENBQXdCLHFCQUF4QixFQUErQyxXQUEvRDtBQUNBLGlCQUFJLElBQUksSUFBSSxDQUFaLEVBQWUsSUFBSSxLQUFLLE1BQXhCLEVBQWdDLEdBQWhDLEVBQXFDO0FBQ2pDLG9CQUFJLFFBQVEsS0FBSyxDQUFMLEVBQVEsWUFBcEI7QUFDQSxvQkFBRyxLQUFILEVBQVU7QUFDTix3QkFBSSxrQkFBa0IsU0FBdEI7QUFDQSx3QkFBRyxRQUFTLGtCQUFrQixHQUE5QixFQUFvQztBQUNoQyw2QkFBSyxDQUFMLEVBQVEsWUFBUixDQUFx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QUwsQ0FBb0IsS0FBSyxLQUF6Qjs7QUFFQSxTQUFLLGFBQUw7O0FBRUEsUUFBSSxXQUFXLEtBQUssbUJBQUwsRUFBZjtBQUNBLFNBQUssYUFBTCxHQUFxQixTQUFTLEtBQTlCOztBQUVBLFFBQUksaUJBQWlCLEtBQUssWUFBTCxFQUFyQjtBQUNBLFFBQUksQ0FBQyxjQUFMLEVBQ0UsT0FBTyxJQUFQOztBQUVGLFNBQUssR0FBTCxDQUFTLGNBQWMsZUFBZSxTQUF0Qzs7QUFFQSxTQUFLLG1CQUFMLENBQXlCLGNBQXpCOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFFBQUksQ0FBQyxTQUFTLE9BQWQsRUFBdUI7QUFDckIsVUFBSSxhQUFhLGVBQWUsb0JBQWYsQ0FBb0MsR0FBcEMsQ0FBakI7QUFDQSxVQUFJLFdBQVcsTUFBWCxHQUFvQixDQUF4QixFQUEyQjtBQUN6QixpQkFBUyxPQUFULEdBQW1CLFdBQVcsQ0FBWCxFQUFjLFdBQWQsQ0FBMEIsSUFBMUIsRUFBbkI7QUFDRDtBQUNGOztBQUVELFFBQUksY0FBYyxlQUFlLFdBQWpDO0FBQ0EsV0FBTztBQUNMLGFBQU8sS0FBSyxhQURQO0FBRUwsY0FBUSxTQUFTLE1BQVQsSUFBbUIsS0FBSyxjQUYzQjtBQUdMLFdBQUssS0FBSyxXQUhMO0FBSUwsZUFBUyxlQUFlLFNBSm5CO0FBS0wsbUJBQWEsV0FMUjtBQU1MLGNBQVEsWUFBWSxNQU5mO0FBT0wsZUFBUyxTQUFTO0FBUGIsS0FBUDtBQVNEO0FBeHJEcUIsQ0FBeEI7O0FBMnJEQSxJQUFJLFFBQU8sTUFBUCx5Q0FBTyxNQUFQLE9BQWtCLFFBQXRCLEVBQWdDO0FBQzlCLFNBQU8sT0FBUCxHQUFpQixXQUFqQjtBQUNEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IFJlYWRhYmlsaXR5IGZyb20gJy4vbGliL1JlYWRhYmlsaXR5JztcbmNsYXNzIENsZWFyUmVhZCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMudHBsID0gbnVsbDtcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5hZGRFdmVudHMoKTtcbiAgICB9XG5cbiAgICBhZGRSZWFkUGFnZSgpIHtcbiAgICAgICAgaWYoIXRoaXMudHBsKSB7XG4gICAgICAgICAgICBsZXQgYXJ0aWNsZSA9IG5ldyBSZWFkYWJpbGl0eShkb2N1bWVudCkucGFyc2UoKTtcbiAgICAgICAgICAgIHRoaXMudHBsID0gYDxkaXYgY2xhc3M9XCJjZW50ZXItYXJlYVwiIGlkPVwiY2xlYXJSZWFkQ2VudGVyQXJlYVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpY2xlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoMSBjbGFzcz1cInRpdGxlXCI+JHthcnRpY2xlLnRpdGxlfTwvaDE+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250ZW50XCI+JHthcnRpY2xlLmNvbnRlbnR9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5gO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgZGl2LmlkID0gJ2NsZWFyUmVhZCc7XG4gICAgICAgIGRpdi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2NsZWFycmVhZC1tb2RlJyk7XG4gICAgICAgIGRpdi5pbm5lckhUTUwgPSB0aGlzLnRwbDtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkaXYpO1xuICAgICAgICBsZXQgaW1ncyA9IGRpdi5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJyk7XG4gICAgICAgIGxldCBhcmVhV2lkdGggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2xlYXJSZWFkQ2VudGVyQXJlYScpLmNsaWVudFdpZHRoO1xuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgaW1ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IHdpZHRoID0gaW1nc1tpXS5uYXR1cmFsV2lkdGg7XG4gICAgICAgICAgICBpZih3aWR0aCkge1xuICAgICAgICAgICAgICAgIGxldCBjZW50ZXJBcmVhV2lkdGggPSBhcmVhV2lkdGg7XG4gICAgICAgICAgICAgICAgaWYod2lkdGggPCAoY2VudGVyQXJlYVdpZHRoIC0gMTQwKSkge1xuICAgICAgICAgICAgICAgICAgICBpbWdzW2ldLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnaW1nLWMnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGltZ3NbaV0ub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGxldCB3aWR0aCA9IHRoaXMubmF0dXJhbFdpZHRoO1xuICAgICAgICAgICAgICAgIGxldCBjZW50ZXJBcmVhV2lkdGggPSBhcmVhV2lkdGg7XG4gICAgICAgICAgICAgICAgaWYod2lkdGggPCAoY2VudGVyQXJlYVdpZHRoIC0gMTQwKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnaW1nLWMnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgZGl2LnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnY2xlYXJyZWFkLW1vZGUgY2xlYXJyZWFkLW1vZGUtc2hvdycpO1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NsZWFyUmVhZENlbnRlckFyZWEnKS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2NlbnRlci1hcmVhIGNlbnRlci1hcmVhLXNob3cnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVtb3ZlUmVhZFBhZ2UoKSB7XG4gICAgICAgIGxldCBjbGVhclJlYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2xlYXJSZWFkJyk7XG4gICAgICAgIGxldCBjbGVhclJlYWRDZW50ZXJBcmVhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NsZWFyUmVhZENlbnRlckFyZWEnKTtcbiAgICAgICAgY2xlYXJSZWFkQ2VudGVyQXJlYS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2NlbnRlci1hcmVhJyk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgY2xlYXJSZWFkLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnY2xlYXJyZWFkLW1vZGUnKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBwYXJlbnROb2RlID0gY2xlYXJSZWFkLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjbGVhclJlYWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICB9LCAyNTApO1xuICAgICAgICB9LCAxMDApO1xuICAgIH1cblxuICAgIGFkZEV2ZW50cygpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlKSA9PiB7XG4gICAgICAgICAgICBpZiAoZS5zaGlmdEtleSAmJiBlLmtleUNvZGUgPT0gMTMpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmFjdGl2ZSk7XG4gICAgICAgICAgICAgICAgaWYoIXRoaXMuYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkUmVhZFBhZ2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9ZWxzZSBpZihlLmtleUNvZGUgPT0gMjcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmFjdGl2ZSk7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5hY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVSZWFkUGFnZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuY29uc3QgY2xlYXJSZWFkID0gbmV3IENsZWFyUmVhZCgpOyIsIi8qZXNsaW50LWVudiBlczY6ZmFsc2UqL1xuLypcbiAqIENvcHlyaWdodCAoYykgMjAxMCBBcmM5MCBJbmNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLypcbiAqIFRoaXMgY29kZSBpcyBoZWF2aWx5IGJhc2VkIG9uIEFyYzkwJ3MgcmVhZGFiaWxpdHkuanMgKDEuNy4xKSBzY3JpcHRcbiAqIGF2YWlsYWJsZSBhdDogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2FyYzkwbGFicy1yZWFkYWJpbGl0eVxuICovXG5cbi8qKlxuICogUHVibGljIGNvbnN0cnVjdG9yLlxuICogQHBhcmFtIHtIVE1MRG9jdW1lbnR9IGRvYyAgICAgVGhlIGRvY3VtZW50IHRvIHBhcnNlLlxuICogQHBhcmFtIHtPYmplY3R9ICAgICAgIG9wdGlvbnMgVGhlIG9wdGlvbnMgb2JqZWN0LlxuICovXG5mdW5jdGlvbiBSZWFkYWJpbGl0eShkb2MsIG9wdGlvbnMpIHtcbiAgLy8gSW4gc29tZSBvbGRlciB2ZXJzaW9ucywgcGVvcGxlIHBhc3NlZCBhIFVSSSBhcyB0aGUgZmlyc3QgYXJndW1lbnQuIENvcGU6XG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMuZG9jdW1lbnRFbGVtZW50KSB7XG4gICAgZG9jID0gb3B0aW9ucztcbiAgICBvcHRpb25zID0gYXJndW1lbnRzWzJdO1xuICB9IGVsc2UgaWYgKCFkb2MgfHwgIWRvYy5kb2N1bWVudEVsZW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBhcmd1bWVudCB0byBSZWFkYWJpbGl0eSBjb25zdHJ1Y3RvciBzaG91bGQgYmUgYSBkb2N1bWVudCBvYmplY3QuXCIpO1xuICB9XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHRoaXMuX2RvYyA9IGRvYztcbiAgdGhpcy5fYm9keSA9IGRvYy5ib2R5LmNsb25lTm9kZSh0cnVlKTtcbiAgdGhpcy5fYXJ0aWNsZVRpdGxlID0gbnVsbDtcbiAgdGhpcy5fYXJ0aWNsZUJ5bGluZSA9IG51bGw7XG4gIHRoaXMuX2FydGljbGVEaXIgPSBudWxsO1xuICB0aGlzLl9hdHRlbXB0cyA9IFtdO1xuXG4gIC8vIENvbmZpZ3VyYWJsZSBvcHRpb25zXG4gIHRoaXMuX2RlYnVnID0gISFvcHRpb25zLmRlYnVnO1xuICB0aGlzLl9tYXhFbGVtc1RvUGFyc2UgPSBvcHRpb25zLm1heEVsZW1zVG9QYXJzZSB8fCB0aGlzLkRFRkFVTFRfTUFYX0VMRU1TX1RPX1BBUlNFO1xuICB0aGlzLl9uYlRvcENhbmRpZGF0ZXMgPSBvcHRpb25zLm5iVG9wQ2FuZGlkYXRlcyB8fCB0aGlzLkRFRkFVTFRfTl9UT1BfQ0FORElEQVRFUztcbiAgdGhpcy5fY2hhclRocmVzaG9sZCA9IG9wdGlvbnMuY2hhclRocmVzaG9sZCB8fCB0aGlzLkRFRkFVTFRfQ0hBUl9USFJFU0hPTEQ7XG4gIHRoaXMuX2NsYXNzZXNUb1ByZXNlcnZlID0gdGhpcy5DTEFTU0VTX1RPX1BSRVNFUlZFLmNvbmNhdChvcHRpb25zLmNsYXNzZXNUb1ByZXNlcnZlIHx8IFtdKTtcblxuICAvLyBTdGFydCB3aXRoIGFsbCBmbGFncyBzZXRcbiAgdGhpcy5fZmxhZ3MgPSB0aGlzLkZMQUdfU1RSSVBfVU5MSUtFTFlTIHxcbiAgICAgIHRoaXMuRkxBR19XRUlHSFRfQ0xBU1NFUyB8XG4gICAgICB0aGlzLkZMQUdfQ0xFQU5fQ09ORElUSU9OQUxMWTtcblxuICB2YXIgbG9nRWw7XG5cbiAgLy8gQ29udHJvbCB3aGV0aGVyIGxvZyBtZXNzYWdlcyBhcmUgc2VudCB0byB0aGUgY29uc29sZVxuICBpZiAodGhpcy5fZGVidWcpIHtcbiAgICBsb2dFbCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBydiA9IGUubm9kZU5hbWUgKyBcIiBcIjtcbiAgICAgIGlmIChlLm5vZGVUeXBlID09IGUuVEVYVF9OT0RFKSB7XG4gICAgICAgIHJldHVybiBydiArICcoXCInICsgZS50ZXh0Q29udGVudCArICdcIiknO1xuICAgICAgfVxuICAgICAgdmFyIGNsYXNzRGVzYyA9IGUuY2xhc3NOYW1lICYmIChcIi5cIiArIGUuY2xhc3NOYW1lLnJlcGxhY2UoLyAvZywgXCIuXCIpKTtcbiAgICAgIHZhciBlbERlc2MgPSBcIlwiO1xuICAgICAgaWYgKGUuaWQpXG4gICAgICAgIGVsRGVzYyA9IFwiKCNcIiArIGUuaWQgKyBjbGFzc0Rlc2MgKyBcIilcIjtcbiAgICAgIGVsc2UgaWYgKGNsYXNzRGVzYylcbiAgICAgICAgZWxEZXNjID0gXCIoXCIgKyBjbGFzc0Rlc2MgKyBcIilcIjtcbiAgICAgIHJldHVybiBydiArIGVsRGVzYztcbiAgICB9O1xuICAgIHRoaXMubG9nID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHR5cGVvZiBkdW1wICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHZhciBtc2cgPSBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwoYXJndW1lbnRzLCBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgcmV0dXJuICh4ICYmIHgubm9kZU5hbWUpID8gbG9nRWwoeCkgOiB4O1xuICAgICAgICB9KS5qb2luKFwiIFwiKTtcbiAgICAgICAgZHVtcChcIlJlYWRlcjogKFJlYWRhYmlsaXR5KSBcIiArIG1zZyArIFwiXFxuXCIpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB2YXIgYXJncyA9IFtcIlJlYWRlcjogKFJlYWRhYmlsaXR5KSBcIl0uY29uY2F0KGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xuICAgICAgfVxuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5sb2cgPSBmdW5jdGlvbiAoKSB7fTtcbiAgfVxufVxuXG5SZWFkYWJpbGl0eS5wcm90b3R5cGUgPSB7XG4gIEZMQUdfU1RSSVBfVU5MSUtFTFlTOiAweDEsXG4gIEZMQUdfV0VJR0hUX0NMQVNTRVM6IDB4MixcbiAgRkxBR19DTEVBTl9DT05ESVRJT05BTExZOiAweDQsXG5cbiAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL05vZGUvbm9kZVR5cGVcbiAgRUxFTUVOVF9OT0RFOiAxLFxuICBURVhUX05PREU6IDMsXG5cbiAgLy8gTWF4IG51bWJlciBvZiBub2RlcyBzdXBwb3J0ZWQgYnkgdGhpcyBwYXJzZXIuIERlZmF1bHQ6IDAgKG5vIGxpbWl0KVxuICBERUZBVUxUX01BWF9FTEVNU19UT19QQVJTRTogMCxcblxuICAvLyBUaGUgbnVtYmVyIG9mIHRvcCBjYW5kaWRhdGVzIHRvIGNvbnNpZGVyIHdoZW4gYW5hbHlzaW5nIGhvd1xuICAvLyB0aWdodCB0aGUgY29tcGV0aXRpb24gaXMgYW1vbmcgY2FuZGlkYXRlcy5cbiAgREVGQVVMVF9OX1RPUF9DQU5ESURBVEVTOiA1LFxuXG4gIC8vIEVsZW1lbnQgdGFncyB0byBzY29yZSBieSBkZWZhdWx0LlxuICBERUZBVUxUX1RBR1NfVE9fU0NPUkU6IFwic2VjdGlvbixoMixoMyxoNCxoNSxoNixwLHRkLHByZVwiLnRvVXBwZXJDYXNlKCkuc3BsaXQoXCIsXCIpLFxuXG4gIC8vIFRoZSBkZWZhdWx0IG51bWJlciBvZiBjaGFycyBhbiBhcnRpY2xlIG11c3QgaGF2ZSBpbiBvcmRlciB0byByZXR1cm4gYSByZXN1bHRcbiAgREVGQVVMVF9DSEFSX1RIUkVTSE9MRDogNTAwLFxuXG4gIC8vIEFsbCBvZiB0aGUgcmVndWxhciBleHByZXNzaW9ucyBpbiB1c2Ugd2l0aGluIHJlYWRhYmlsaXR5LlxuICAvLyBEZWZpbmVkIHVwIGhlcmUgc28gd2UgZG9uJ3QgaW5zdGFudGlhdGUgdGhlbSByZXBlYXRlZGx5IGluIGxvb3BzLlxuICBSRUdFWFBTOiB7XG4gICAgdW5saWtlbHlDYW5kaWRhdGVzOiAvLWFkLXxiYW5uZXJ8YnJlYWRjcnVtYnN8Y29tYnh8Y29tbWVudHxjb21tdW5pdHl8Y292ZXItd3JhcHxkaXNxdXN8ZXh0cmF8Zm9vdHxoZWFkZXJ8bGVnZW5kc3xtZW51fHJlbGF0ZWR8cmVtYXJrfHJlcGxpZXN8cnNzfHNob3V0Ym94fHNpZGViYXJ8c2t5c2NyYXBlcnxzb2NpYWx8c3BvbnNvcnxzdXBwbGVtZW50YWx8YWQtYnJlYWt8YWdlZ2F0ZXxwYWdpbmF0aW9ufHBhZ2VyfHBvcHVwfHlvbS1yZW1vdGUvaSxcbiAgICBva01heWJlSXRzQUNhbmRpZGF0ZTogL2FuZHxhcnRpY2xlfGJvZHl8Y29sdW1ufG1haW58c2hhZG93L2ksXG4gICAgcG9zaXRpdmU6IC9hcnRpY2xlfGJvZHl8Y29udGVudHxlbnRyeXxoZW50cnl8aC1lbnRyeXxtYWlufHBhZ2V8cGFnaW5hdGlvbnxwb3N0fHRleHR8YmxvZ3xzdG9yeS9pLFxuICAgIG5lZ2F0aXZlOiAvaGlkZGVufF5oaWQkfCBoaWQkfCBoaWQgfF5oaWQgfGJhbm5lcnxjb21ieHxjb21tZW50fGNvbS18Y29udGFjdHxmb290fGZvb3Rlcnxmb290bm90ZXxtYXN0aGVhZHxtZWRpYXxtZXRhfG91dGJyYWlufHByb21vfHJlbGF0ZWR8c2Nyb2xsfHNoYXJlfHNob3V0Ym94fHNpZGViYXJ8c2t5c2NyYXBlcnxzcG9uc29yfHNob3BwaW5nfHRhZ3N8dG9vbHx3aWRnZXQvaSxcbiAgICBleHRyYW5lb3VzOiAvcHJpbnR8YXJjaGl2ZXxjb21tZW50fGRpc2N1c3N8ZVtcXC1dP21haWx8c2hhcmV8cmVwbHl8YWxsfGxvZ2lufHNpZ258c2luZ2xlfHV0aWxpdHkvaSxcbiAgICBieWxpbmU6IC9ieWxpbmV8YXV0aG9yfGRhdGVsaW5lfHdyaXR0ZW5ieXxwLWF1dGhvci9pLFxuICAgIHJlcGxhY2VGb250czogLzwoXFwvPylmb250W14+XSo+L2dpLFxuICAgIG5vcm1hbGl6ZTogL1xcc3syLH0vZyxcbiAgICB2aWRlb3M6IC9cXC9cXC8od3d3XFwuKT8oZGFpbHltb3Rpb258eW91dHViZXx5b3V0dWJlLW5vY29va2llfHBsYXllclxcLnZpbWVvKVxcLmNvbS9pLFxuICAgIG5leHRMaW5rOiAvKG5leHR8d2VpdGVyfGNvbnRpbnVlfD4oW15cXHxdfCQpfMK7KFteXFx8XXwkKSkvaSxcbiAgICBwcmV2TGluazogLyhwcmV2fGVhcmx8b2xkfG5ld3w8fMKrKS9pLFxuICAgIHdoaXRlc3BhY2U6IC9eXFxzKiQvLFxuICAgIGhhc0NvbnRlbnQ6IC9cXFMkLyxcbiAgfSxcblxuICBESVZfVE9fUF9FTEVNUzogWyBcIkFcIiwgXCJCTE9DS1FVT1RFXCIsIFwiRExcIiwgXCJESVZcIiwgXCJJTUdcIiwgXCJPTFwiLCBcIlBcIiwgXCJQUkVcIiwgXCJUQUJMRVwiLCBcIlVMXCIsIFwiU0VMRUNUXCIgXSxcblxuICBBTFRFUl9UT19ESVZfRVhDRVBUSU9OUzogW1wiRElWXCIsIFwiQVJUSUNMRVwiLCBcIlNFQ1RJT05cIiwgXCJQXCJdLFxuXG4gIFBSRVNFTlRBVElPTkFMX0FUVFJJQlVURVM6IFsgXCJhbGlnblwiLCBcImJhY2tncm91bmRcIiwgXCJiZ2NvbG9yXCIsIFwiYm9yZGVyXCIsIFwiY2VsbHBhZGRpbmdcIiwgXCJjZWxsc3BhY2luZ1wiLCBcImZyYW1lXCIsIFwiaHNwYWNlXCIsIFwicnVsZXNcIiwgXCJzdHlsZVwiLCBcInZhbGlnblwiLCBcInZzcGFjZVwiIF0sXG5cbiAgREVQUkVDQVRFRF9TSVpFX0FUVFJJQlVURV9FTEVNUzogWyBcIlRBQkxFXCIsIFwiVEhcIiwgXCJURFwiLCBcIkhSXCIsIFwiUFJFXCIgXSxcblxuICAvLyBUaGUgY29tbWVudGVkIG91dCBlbGVtZW50cyBxdWFsaWZ5IGFzIHBocmFzaW5nIGNvbnRlbnQgYnV0IHRlbmQgdG8gYmVcbiAgLy8gcmVtb3ZlZCBieSByZWFkYWJpbGl0eSB3aGVuIHB1dCBpbnRvIHBhcmFncmFwaHMsIHNvIHdlIGlnbm9yZSB0aGVtIGhlcmUuXG4gIFBIUkFTSU5HX0VMRU1TOiBbXG4gICAgLy8gXCJDQU5WQVNcIiwgXCJJRlJBTUVcIiwgXCJTVkdcIiwgXCJWSURFT1wiLFxuICAgIFwiQUJCUlwiLCBcIkFVRElPXCIsIFwiQlwiLCBcIkJET1wiLCBcIkJSXCIsIFwiQlVUVE9OXCIsIFwiQ0lURVwiLCBcIkNPREVcIiwgXCJEQVRBXCIsXG4gICAgXCJEQVRBTElTVFwiLCBcIkRGTlwiLCBcIkVNXCIsIFwiRU1CRURcIiwgXCJJXCIsIFwiSU1HXCIsIFwiSU5QVVRcIiwgXCJLQkRcIiwgXCJMQUJFTFwiLFxuICAgIFwiTUFSS1wiLCBcIk1BVEhcIiwgXCJNRVRFUlwiLCBcIk5PU0NSSVBUXCIsIFwiT0JKRUNUXCIsIFwiT1VUUFVUXCIsIFwiUFJPR1JFU1NcIiwgXCJRXCIsXG4gICAgXCJSVUJZXCIsIFwiU0FNUFwiLCBcIlNDUklQVFwiLCBcIlNFTEVDVFwiLCBcIlNNQUxMXCIsIFwiU1BBTlwiLCBcIlNUUk9OR1wiLCBcIlNVQlwiLFxuICAgIFwiU1VQXCIsIFwiVEVYVEFSRUFcIiwgXCJUSU1FXCIsIFwiVkFSXCIsIFwiV0JSXCJcbiAgXSxcblxuICAvLyBUaGVzZSBhcmUgdGhlIGNsYXNzZXMgdGhhdCByZWFkYWJpbGl0eSBzZXRzIGl0c2VsZi5cbiAgQ0xBU1NFU19UT19QUkVTRVJWRTogWyBcInBhZ2VcIiBdLFxuXG4gIC8qKlxuICAgKiBSdW4gYW55IHBvc3QtcHJvY2VzcyBtb2RpZmljYXRpb25zIHRvIGFydGljbGUgY29udGVudCBhcyBuZWNlc3NhcnkuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEByZXR1cm4gdm9pZFxuICAgKiovXG4gIF9wb3N0UHJvY2Vzc0NvbnRlbnQ6IGZ1bmN0aW9uKGFydGljbGVDb250ZW50KSB7XG4gICAgLy8gUmVhZGFiaWxpdHkgY2Fubm90IG9wZW4gcmVsYXRpdmUgdXJpcyBzbyB3ZSBjb252ZXJ0IHRoZW0gdG8gYWJzb2x1dGUgdXJpcy5cbiAgICB0aGlzLl9maXhSZWxhdGl2ZVVyaXMoYXJ0aWNsZUNvbnRlbnQpO1xuXG4gICAgLy8gUmVtb3ZlIGNsYXNzZXMuXG4gICAgdGhpcy5fY2xlYW5DbGFzc2VzKGFydGljbGVDb250ZW50KTtcbiAgfSxcblxuICAvKipcbiAgICogSXRlcmF0ZXMgb3ZlciBhIE5vZGVMaXN0LCBjYWxscyBgZmlsdGVyRm5gIGZvciBlYWNoIG5vZGUgYW5kIHJlbW92ZXMgbm9kZVxuICAgKiBpZiBmdW5jdGlvbiByZXR1cm5lZCBgdHJ1ZWAuXG4gICAqXG4gICAqIElmIGZ1bmN0aW9uIGlzIG5vdCBwYXNzZWQsIHJlbW92ZXMgYWxsIHRoZSBub2RlcyBpbiBub2RlIGxpc3QuXG4gICAqXG4gICAqIEBwYXJhbSBOb2RlTGlzdCBub2RlTGlzdCBUaGUgbm9kZXMgdG8gb3BlcmF0ZSBvblxuICAgKiBAcGFyYW0gRnVuY3Rpb24gZmlsdGVyRm4gdGhlIGZ1bmN0aW9uIHRvIHVzZSBhcyBhIGZpbHRlclxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICovXG4gIF9yZW1vdmVOb2RlczogZnVuY3Rpb24obm9kZUxpc3QsIGZpbHRlckZuKSB7XG4gICAgZm9yICh2YXIgaSA9IG5vZGVMaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB2YXIgbm9kZSA9IG5vZGVMaXN0W2ldO1xuICAgICAgdmFyIHBhcmVudE5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICBpZiAoIWZpbHRlckZuIHx8IGZpbHRlckZuLmNhbGwodGhpcywgbm9kZSwgaSwgbm9kZUxpc3QpKSB7XG4gICAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogSXRlcmF0ZXMgb3ZlciBhIE5vZGVMaXN0LCBhbmQgY2FsbHMgX3NldE5vZGVUYWcgZm9yIGVhY2ggbm9kZS5cbiAgICpcbiAgICogQHBhcmFtIE5vZGVMaXN0IG5vZGVMaXN0IFRoZSBub2RlcyB0byBvcGVyYXRlIG9uXG4gICAqIEBwYXJhbSBTdHJpbmcgbmV3VGFnTmFtZSB0aGUgbmV3IHRhZyBuYW1lIHRvIHVzZVxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICovXG4gIF9yZXBsYWNlTm9kZVRhZ3M6IGZ1bmN0aW9uKG5vZGVMaXN0LCBuZXdUYWdOYW1lKSB7XG4gICAgZm9yICh2YXIgaSA9IG5vZGVMaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB2YXIgbm9kZSA9IG5vZGVMaXN0W2ldO1xuICAgICAgdGhpcy5fc2V0Tm9kZVRhZyhub2RlLCBuZXdUYWdOYW1lKTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBhIE5vZGVMaXN0LCB3aGljaCBkb2Vzbid0IG5hdGl2ZWx5IGZ1bGx5IGltcGxlbWVudCB0aGUgQXJyYXlcbiAgICogaW50ZXJmYWNlLlxuICAgKlxuICAgKiBGb3IgY29udmVuaWVuY2UsIHRoZSBjdXJyZW50IG9iamVjdCBjb250ZXh0IGlzIGFwcGxpZWQgdG8gdGhlIHByb3ZpZGVkXG4gICAqIGl0ZXJhdGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSAgTm9kZUxpc3Qgbm9kZUxpc3QgVGhlIE5vZGVMaXN0LlxuICAgKiBAcGFyYW0gIEZ1bmN0aW9uIGZuICAgICAgIFRoZSBpdGVyYXRlIGZ1bmN0aW9uLlxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICovXG4gIF9mb3JFYWNoTm9kZTogZnVuY3Rpb24obm9kZUxpc3QsIGZuKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChub2RlTGlzdCwgZm4sIHRoaXMpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgYSBOb2RlTGlzdCwgcmV0dXJuIHRydWUgaWYgYW55IG9mIHRoZSBwcm92aWRlZCBpdGVyYXRlXG4gICAqIGZ1bmN0aW9uIGNhbGxzIHJldHVybnMgdHJ1ZSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKlxuICAgKiBGb3IgY29udmVuaWVuY2UsIHRoZSBjdXJyZW50IG9iamVjdCBjb250ZXh0IGlzIGFwcGxpZWQgdG8gdGhlXG4gICAqIHByb3ZpZGVkIGl0ZXJhdGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSAgTm9kZUxpc3Qgbm9kZUxpc3QgVGhlIE5vZGVMaXN0LlxuICAgKiBAcGFyYW0gIEZ1bmN0aW9uIGZuICAgICAgIFRoZSBpdGVyYXRlIGZ1bmN0aW9uLlxuICAgKiBAcmV0dXJuIEJvb2xlYW5cbiAgICovXG4gIF9zb21lTm9kZTogZnVuY3Rpb24obm9kZUxpc3QsIGZuKSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zb21lLmNhbGwobm9kZUxpc3QsIGZuLCB0aGlzKTtcbiAgfSxcblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGEgTm9kZUxpc3QsIHJldHVybiB0cnVlIGlmIGFsbCBvZiB0aGUgcHJvdmlkZWQgaXRlcmF0ZVxuICAgKiBmdW5jdGlvbiBjYWxscyByZXR1cm4gdHJ1ZSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKlxuICAgKiBGb3IgY29udmVuaWVuY2UsIHRoZSBjdXJyZW50IG9iamVjdCBjb250ZXh0IGlzIGFwcGxpZWQgdG8gdGhlXG4gICAqIHByb3ZpZGVkIGl0ZXJhdGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSAgTm9kZUxpc3Qgbm9kZUxpc3QgVGhlIE5vZGVMaXN0LlxuICAgKiBAcGFyYW0gIEZ1bmN0aW9uIGZuICAgICAgIFRoZSBpdGVyYXRlIGZ1bmN0aW9uLlxuICAgKiBAcmV0dXJuIEJvb2xlYW5cbiAgICovXG4gIF9ldmVyeU5vZGU6IGZ1bmN0aW9uKG5vZGVMaXN0LCBmbikge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuZXZlcnkuY2FsbChub2RlTGlzdCwgZm4sIHRoaXMpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDb25jYXQgYWxsIG5vZGVsaXN0cyBwYXNzZWQgYXMgYXJndW1lbnRzLlxuICAgKlxuICAgKiBAcmV0dXJuIC4uLk5vZGVMaXN0XG4gICAqIEByZXR1cm4gQXJyYXlcbiAgICovXG4gIF9jb25jYXROb2RlTGlzdHM6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICB2YXIgbm9kZUxpc3RzID0gYXJncy5tYXAoZnVuY3Rpb24obGlzdCkge1xuICAgICAgcmV0dXJuIHNsaWNlLmNhbGwobGlzdCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIG5vZGVMaXN0cyk7XG4gIH0sXG5cbiAgX2dldEFsbE5vZGVzV2l0aFRhZzogZnVuY3Rpb24obm9kZSwgdGFnTmFtZXMpIHtcbiAgICBpZiAobm9kZS5xdWVyeVNlbGVjdG9yQWxsKSB7XG4gICAgICByZXR1cm4gbm9kZS5xdWVyeVNlbGVjdG9yQWxsKHRhZ05hbWVzLmpvaW4oJywnKSk7XG4gICAgfVxuICAgIHJldHVybiBbXS5jb25jYXQuYXBwbHkoW10sIHRhZ05hbWVzLm1hcChmdW5jdGlvbih0YWcpIHtcbiAgICAgIHZhciBjb2xsZWN0aW9uID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWcpO1xuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoY29sbGVjdGlvbikgPyBjb2xsZWN0aW9uIDogQXJyYXkuZnJvbShjb2xsZWN0aW9uKTtcbiAgICB9KSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIGNsYXNzPVwiXCIgYXR0cmlidXRlIGZyb20gZXZlcnkgZWxlbWVudCBpbiB0aGUgZ2l2ZW5cbiAgICogc3VidHJlZSwgZXhjZXB0IHRob3NlIHRoYXQgbWF0Y2ggQ0xBU1NFU19UT19QUkVTRVJWRSBhbmRcbiAgICogdGhlIGNsYXNzZXNUb1ByZXNlcnZlIGFycmF5IGZyb20gdGhlIG9wdGlvbnMgb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICovXG4gIF9jbGVhbkNsYXNzZXM6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICB2YXIgY2xhc3Nlc1RvUHJlc2VydmUgPSB0aGlzLl9jbGFzc2VzVG9QcmVzZXJ2ZTtcbiAgICB2YXIgY2xhc3NOYW1lID0gKG5vZGUuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikgfHwgXCJcIilcbiAgICAgICAgLnNwbGl0KC9cXHMrLylcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbihjbHMpIHtcbiAgICAgICAgICByZXR1cm4gY2xhc3Nlc1RvUHJlc2VydmUuaW5kZXhPZihjbHMpICE9IC0xO1xuICAgICAgICB9KVxuICAgICAgICAuam9pbihcIiBcIik7XG5cbiAgICBpZiAoY2xhc3NOYW1lKSB7XG4gICAgICBub2RlLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGNsYXNzTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKFwiY2xhc3NcIik7XG4gICAgfVxuXG4gICAgZm9yIChub2RlID0gbm9kZS5maXJzdEVsZW1lbnRDaGlsZDsgbm9kZTsgbm9kZSA9IG5vZGUubmV4dEVsZW1lbnRTaWJsaW5nKSB7XG4gICAgICB0aGlzLl9jbGVhbkNsYXNzZXMobm9kZSk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBlYWNoIDxhPiBhbmQgPGltZz4gdXJpIGluIHRoZSBnaXZlbiBlbGVtZW50IHRvIGFuIGFic29sdXRlIFVSSSxcbiAgICogaWdub3JpbmcgI3JlZiBVUklzLlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICovXG4gIF9maXhSZWxhdGl2ZVVyaXM6IGZ1bmN0aW9uKGFydGljbGVDb250ZW50KSB7XG4gICAgdmFyIGJhc2VVUkkgPSB0aGlzLl9kb2MuYmFzZVVSSTtcbiAgICB2YXIgZG9jdW1lbnRVUkkgPSB0aGlzLl9kb2MuZG9jdW1lbnRVUkk7XG4gICAgZnVuY3Rpb24gdG9BYnNvbHV0ZVVSSSh1cmkpIHtcbiAgICAgIC8vIExlYXZlIGhhc2ggbGlua3MgYWxvbmUgaWYgdGhlIGJhc2UgVVJJIG1hdGNoZXMgdGhlIGRvY3VtZW50IFVSSTpcbiAgICAgIGlmIChiYXNlVVJJID09IGRvY3VtZW50VVJJICYmIHVyaS5jaGFyQXQoMCkgPT0gXCIjXCIpIHtcbiAgICAgICAgcmV0dXJuIHVyaTtcbiAgICAgIH1cbiAgICAgIC8vIE90aGVyd2lzZSwgcmVzb2x2ZSBhZ2FpbnN0IGJhc2UgVVJJOlxuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIG5ldyBVUkwodXJpLCBiYXNlVVJJKS5ocmVmO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgLy8gU29tZXRoaW5nIHdlbnQgd3JvbmcsIGp1c3QgcmV0dXJuIHRoZSBvcmlnaW5hbDpcbiAgICAgIH1cbiAgICAgIHJldHVybiB1cmk7XG4gICAgfVxuXG4gICAgdmFyIGxpbmtzID0gYXJ0aWNsZUNvbnRlbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJhXCIpO1xuICAgIHRoaXMuX2ZvckVhY2hOb2RlKGxpbmtzLCBmdW5jdGlvbihsaW5rKSB7XG4gICAgICB2YXIgaHJlZiA9IGxpbmsuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKTtcbiAgICAgIGlmIChocmVmKSB7XG4gICAgICAgIC8vIFJlcGxhY2UgbGlua3Mgd2l0aCBqYXZhc2NyaXB0OiBVUklzIHdpdGggdGV4dCBjb250ZW50LCBzaW5jZVxuICAgICAgICAvLyB0aGV5IHdvbid0IHdvcmsgYWZ0ZXIgc2NyaXB0cyBoYXZlIGJlZW4gcmVtb3ZlZCBmcm9tIHRoZSBwYWdlLlxuICAgICAgICBpZiAoaHJlZi5pbmRleE9mKFwiamF2YXNjcmlwdDpcIikgPT09IDApIHtcbiAgICAgICAgICB2YXIgdGV4dCA9IHRoaXMuX2RvYy5jcmVhdGVUZXh0Tm9kZShsaW5rLnRleHRDb250ZW50KTtcbiAgICAgICAgICBsaW5rLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKHRleHQsIGxpbmspO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpbmsuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCB0b0Fic29sdXRlVVJJKGhyZWYpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGltZ3MgPSBhcnRpY2xlQ29udGVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImltZ1wiKTtcbiAgICB0aGlzLl9mb3JFYWNoTm9kZShpbWdzLCBmdW5jdGlvbihpbWcpIHtcbiAgICAgIHZhciBzcmMgPSBpbWcuZ2V0QXR0cmlidXRlKFwic3JjXCIpO1xuICAgICAgaWYgKHNyYykge1xuICAgICAgICBpbWcuc2V0QXR0cmlidXRlKFwic3JjXCIsIHRvQWJzb2x1dGVVUkkoc3JjKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgYXJ0aWNsZSB0aXRsZSBhcyBhbiBIMS5cbiAgICpcbiAgICogQHJldHVybiB2b2lkXG4gICAqKi9cbiAgX2dldEFydGljbGVUaXRsZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRvYyA9IHRoaXMuX2RvYztcbiAgICB2YXIgY3VyVGl0bGUgPSBcIlwiO1xuICAgIHZhciBvcmlnVGl0bGUgPSBcIlwiO1xuXG4gICAgdHJ5IHtcbiAgICAgIGN1clRpdGxlID0gb3JpZ1RpdGxlID0gZG9jLnRpdGxlLnRyaW0oKTtcblxuICAgICAgLy8gSWYgdGhleSBoYWQgYW4gZWxlbWVudCB3aXRoIGlkIFwidGl0bGVcIiBpbiB0aGVpciBIVE1MXG4gICAgICBpZiAodHlwZW9mIGN1clRpdGxlICE9PSBcInN0cmluZ1wiKVxuICAgICAgICBjdXJUaXRsZSA9IG9yaWdUaXRsZSA9IHRoaXMuX2dldElubmVyVGV4dChkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3RpdGxlJylbMF0pO1xuICAgIH0gY2F0Y2ggKGUpIHsvKiBpZ25vcmUgZXhjZXB0aW9ucyBzZXR0aW5nIHRoZSB0aXRsZS4gKi99XG5cbiAgICB2YXIgdGl0bGVIYWRIaWVyYXJjaGljYWxTZXBhcmF0b3JzID0gZmFsc2U7XG4gICAgZnVuY3Rpb24gd29yZENvdW50KHN0cikge1xuICAgICAgcmV0dXJuIHN0ci5zcGxpdCgvXFxzKy8pLmxlbmd0aDtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSdzIGEgc2VwYXJhdG9yIGluIHRoZSB0aXRsZSwgZmlyc3QgcmVtb3ZlIHRoZSBmaW5hbCBwYXJ0XG4gICAgaWYgKCgvIFtcXHxcXC1cXFxcXFwvPsK7XSAvKS50ZXN0KGN1clRpdGxlKSkge1xuICAgICAgdGl0bGVIYWRIaWVyYXJjaGljYWxTZXBhcmF0b3JzID0gLyBbXFxcXFxcLz7Cu10gLy50ZXN0KGN1clRpdGxlKTtcbiAgICAgIGN1clRpdGxlID0gb3JpZ1RpdGxlLnJlcGxhY2UoLyguKilbXFx8XFwtXFxcXFxcLz7Cu10gLiovZ2ksICckMScpO1xuXG4gICAgICAvLyBJZiB0aGUgcmVzdWx0aW5nIHRpdGxlIGlzIHRvbyBzaG9ydCAoMyB3b3JkcyBvciBmZXdlciksIHJlbW92ZVxuICAgICAgLy8gdGhlIGZpcnN0IHBhcnQgaW5zdGVhZDpcbiAgICAgIGlmICh3b3JkQ291bnQoY3VyVGl0bGUpIDwgMylcbiAgICAgICAgY3VyVGl0bGUgPSBvcmlnVGl0bGUucmVwbGFjZSgvW15cXHxcXC1cXFxcXFwvPsK7XSpbXFx8XFwtXFxcXFxcLz7Cu10oLiopL2dpLCAnJDEnKTtcbiAgICB9IGVsc2UgaWYgKGN1clRpdGxlLmluZGV4T2YoJzogJykgIT09IC0xKSB7XG4gICAgICAvLyBDaGVjayBpZiB3ZSBoYXZlIGFuIGhlYWRpbmcgY29udGFpbmluZyB0aGlzIGV4YWN0IHN0cmluZywgc28gd2VcbiAgICAgIC8vIGNvdWxkIGFzc3VtZSBpdCdzIHRoZSBmdWxsIHRpdGxlLlxuICAgICAgdmFyIGhlYWRpbmdzID0gdGhpcy5fY29uY2F0Tm9kZUxpc3RzKFxuICAgICAgICAgIGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaDEnKSxcbiAgICAgICAgICBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2gyJylcbiAgICAgICk7XG4gICAgICB2YXIgdHJpbW1lZFRpdGxlID0gY3VyVGl0bGUudHJpbSgpO1xuICAgICAgdmFyIG1hdGNoID0gdGhpcy5fc29tZU5vZGUoaGVhZGluZ3MsIGZ1bmN0aW9uKGhlYWRpbmcpIHtcbiAgICAgICAgcmV0dXJuIGhlYWRpbmcudGV4dENvbnRlbnQudHJpbSgpID09PSB0cmltbWVkVGl0bGU7XG4gICAgICB9KTtcblxuICAgICAgLy8gSWYgd2UgZG9uJ3QsIGxldCdzIGV4dHJhY3QgdGhlIHRpdGxlIG91dCBvZiB0aGUgb3JpZ2luYWwgdGl0bGUgc3RyaW5nLlxuICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICBjdXJUaXRsZSA9IG9yaWdUaXRsZS5zdWJzdHJpbmcob3JpZ1RpdGxlLmxhc3RJbmRleE9mKCc6JykgKyAxKTtcblxuICAgICAgICAvLyBJZiB0aGUgdGl0bGUgaXMgbm93IHRvbyBzaG9ydCwgdHJ5IHRoZSBmaXJzdCBjb2xvbiBpbnN0ZWFkOlxuICAgICAgICBpZiAod29yZENvdW50KGN1clRpdGxlKSA8IDMpIHtcbiAgICAgICAgICBjdXJUaXRsZSA9IG9yaWdUaXRsZS5zdWJzdHJpbmcob3JpZ1RpdGxlLmluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgIC8vIEJ1dCBpZiB3ZSBoYXZlIHRvbyBtYW55IHdvcmRzIGJlZm9yZSB0aGUgY29sb24gdGhlcmUncyBzb21ldGhpbmcgd2VpcmRcbiAgICAgICAgICAvLyB3aXRoIHRoZSB0aXRsZXMgYW5kIHRoZSBIIHRhZ3Mgc28gbGV0J3MganVzdCB1c2UgdGhlIG9yaWdpbmFsIHRpdGxlIGluc3RlYWRcbiAgICAgICAgfSBlbHNlIGlmICh3b3JkQ291bnQob3JpZ1RpdGxlLnN1YnN0cigwLCBvcmlnVGl0bGUuaW5kZXhPZignOicpKSkgPiA1KSB7XG4gICAgICAgICAgY3VyVGl0bGUgPSBvcmlnVGl0bGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGN1clRpdGxlLmxlbmd0aCA+IDE1MCB8fCBjdXJUaXRsZS5sZW5ndGggPCAxNSkge1xuICAgICAgdmFyIGhPbmVzID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoMScpO1xuXG4gICAgICBpZiAoaE9uZXMubGVuZ3RoID09PSAxKVxuICAgICAgICBjdXJUaXRsZSA9IHRoaXMuX2dldElubmVyVGV4dChoT25lc1swXSk7XG4gICAgfVxuXG4gICAgY3VyVGl0bGUgPSBjdXJUaXRsZS50cmltKCk7XG4gICAgLy8gSWYgd2Ugbm93IGhhdmUgNCB3b3JkcyBvciBmZXdlciBhcyBvdXIgdGl0bGUsIGFuZCBlaXRoZXIgbm9cbiAgICAvLyAnaGllcmFyY2hpY2FsJyBzZXBhcmF0b3JzIChcXCwgLywgPiBvciDCuykgd2VyZSBmb3VuZCBpbiB0aGUgb3JpZ2luYWxcbiAgICAvLyB0aXRsZSBvciB3ZSBkZWNyZWFzZWQgdGhlIG51bWJlciBvZiB3b3JkcyBieSBtb3JlIHRoYW4gMSB3b3JkLCB1c2VcbiAgICAvLyB0aGUgb3JpZ2luYWwgdGl0bGUuXG4gICAgdmFyIGN1clRpdGxlV29yZENvdW50ID0gd29yZENvdW50KGN1clRpdGxlKTtcbiAgICBpZiAoY3VyVGl0bGVXb3JkQ291bnQgPD0gNCAmJlxuICAgICAgICAoIXRpdGxlSGFkSGllcmFyY2hpY2FsU2VwYXJhdG9ycyB8fFxuICAgICAgICBjdXJUaXRsZVdvcmRDb3VudCAhPSB3b3JkQ291bnQob3JpZ1RpdGxlLnJlcGxhY2UoL1tcXHxcXC1cXFxcXFwvPsK7XSsvZywgXCJcIikpIC0gMSkpIHtcbiAgICAgIGN1clRpdGxlID0gb3JpZ1RpdGxlO1xuICAgIH1cblxuICAgIHJldHVybiBjdXJUaXRsZTtcbiAgfSxcblxuICAvKipcbiAgICogUHJlcGFyZSB0aGUgSFRNTCBkb2N1bWVudCBmb3IgcmVhZGFiaWxpdHkgdG8gc2NyYXBlIGl0LlxuICAgKiBUaGlzIGluY2x1ZGVzIHRoaW5ncyBsaWtlIHN0cmlwcGluZyBqYXZhc2NyaXB0LCBDU1MsIGFuZCBoYW5kbGluZyB0ZXJyaWJsZSBtYXJrdXAuXG4gICAqXG4gICAqIEByZXR1cm4gdm9pZFxuICAgKiovXG4gIF9wcmVwRG9jdW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkb2MgPSB0aGlzLl9kb2M7XG5cbiAgICAvLyBSZW1vdmUgYWxsIHN0eWxlIHRhZ3MgaW4gaGVhZFxuICAgIHRoaXMuX3JlbW92ZU5vZGVzKHRoaXMuX2JvZHkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdHlsZVwiKSk7XG5cbiAgICBpZiAodGhpcy5ib2R5KSB7XG4gICAgICB0aGlzLl9yZXBsYWNlQnJzKHRoaXMuX2JvZHkpO1xuICAgIH1cblxuICAgIHRoaXMuX3JlcGxhY2VOb2RlVGFncyh0aGlzLl9ib2R5LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZm9udFwiKSwgXCJTUEFOXCIpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBGaW5kcyB0aGUgbmV4dCBlbGVtZW50LCBzdGFydGluZyBmcm9tIHRoZSBnaXZlbiBub2RlLCBhbmQgaWdub3JpbmdcbiAgICogd2hpdGVzcGFjZSBpbiBiZXR3ZWVuLiBJZiB0aGUgZ2l2ZW4gbm9kZSBpcyBhbiBlbGVtZW50LCB0aGUgc2FtZSBub2RlIGlzXG4gICAqIHJldHVybmVkLlxuICAgKi9cbiAgX25leHRFbGVtZW50OiBmdW5jdGlvbiAobm9kZSkge1xuICAgIHZhciBuZXh0ID0gbm9kZTtcbiAgICB3aGlsZSAobmV4dFxuICAgICYmIChuZXh0Lm5vZGVUeXBlICE9IHRoaXMuRUxFTUVOVF9OT0RFKVxuICAgICYmIHRoaXMuUkVHRVhQUy53aGl0ZXNwYWNlLnRlc3QobmV4dC50ZXh0Q29udGVudCkpIHtcbiAgICAgIG5leHQgPSBuZXh0Lm5leHRTaWJsaW5nO1xuICAgIH1cbiAgICByZXR1cm4gbmV4dDtcbiAgfSxcblxuICAvKipcbiAgICogUmVwbGFjZXMgMiBvciBtb3JlIHN1Y2Nlc3NpdmUgPGJyPiBlbGVtZW50cyB3aXRoIGEgc2luZ2xlIDxwPi5cbiAgICogV2hpdGVzcGFjZSBiZXR3ZWVuIDxicj4gZWxlbWVudHMgYXJlIGlnbm9yZWQuIEZvciBleGFtcGxlOlxuICAgKiAgIDxkaXY+Zm9vPGJyPmJhcjxicj4gPGJyPjxicj5hYmM8L2Rpdj5cbiAgICogd2lsbCBiZWNvbWU6XG4gICAqICAgPGRpdj5mb288YnI+YmFyPHA+YWJjPC9wPjwvZGl2PlxuICAgKi9cbiAgX3JlcGxhY2VCcnM6IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgdGhpcy5fZm9yRWFjaE5vZGUodGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKGVsZW0sIFtcImJyXCJdKSwgZnVuY3Rpb24oYnIpIHtcbiAgICAgIHZhciBuZXh0ID0gYnIubmV4dFNpYmxpbmc7XG5cbiAgICAgIC8vIFdoZXRoZXIgMiBvciBtb3JlIDxicj4gZWxlbWVudHMgaGF2ZSBiZWVuIGZvdW5kIGFuZCByZXBsYWNlZCB3aXRoIGFcbiAgICAgIC8vIDxwPiBibG9jay5cbiAgICAgIHZhciByZXBsYWNlZCA9IGZhbHNlO1xuXG4gICAgICAvLyBJZiB3ZSBmaW5kIGEgPGJyPiBjaGFpbiwgcmVtb3ZlIHRoZSA8YnI+cyB1bnRpbCB3ZSBoaXQgYW5vdGhlciBlbGVtZW50XG4gICAgICAvLyBvciBub24td2hpdGVzcGFjZS4gVGhpcyBsZWF2ZXMgYmVoaW5kIHRoZSBmaXJzdCA8YnI+IGluIHRoZSBjaGFpblxuICAgICAgLy8gKHdoaWNoIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCBhIDxwPiBsYXRlcikuXG4gICAgICB3aGlsZSAoKG5leHQgPSB0aGlzLl9uZXh0RWxlbWVudChuZXh0KSkgJiYgKG5leHQudGFnTmFtZSA9PSBcIkJSXCIpKSB7XG4gICAgICAgIHJlcGxhY2VkID0gdHJ1ZTtcbiAgICAgICAgdmFyIGJyU2libGluZyA9IG5leHQubmV4dFNpYmxpbmc7XG4gICAgICAgIG5leHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChuZXh0KTtcbiAgICAgICAgbmV4dCA9IGJyU2libGluZztcbiAgICAgIH1cblxuICAgICAgLy8gSWYgd2UgcmVtb3ZlZCBhIDxicj4gY2hhaW4sIHJlcGxhY2UgdGhlIHJlbWFpbmluZyA8YnI+IHdpdGggYSA8cD4uIEFkZFxuICAgICAgLy8gYWxsIHNpYmxpbmcgbm9kZXMgYXMgY2hpbGRyZW4gb2YgdGhlIDxwPiB1bnRpbCB3ZSBoaXQgYW5vdGhlciA8YnI+XG4gICAgICAvLyBjaGFpbi5cbiAgICAgIGlmIChyZXBsYWNlZCkge1xuICAgICAgICB2YXIgcCA9IHRoaXMuX2RvYy5jcmVhdGVFbGVtZW50KFwicFwiKTtcbiAgICAgICAgYnIucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQocCwgYnIpO1xuXG4gICAgICAgIG5leHQgPSBwLm5leHRTaWJsaW5nO1xuICAgICAgICB3aGlsZSAobmV4dCkge1xuICAgICAgICAgIC8vIElmIHdlJ3ZlIGhpdCBhbm90aGVyIDxicj48YnI+LCB3ZSdyZSBkb25lIGFkZGluZyBjaGlsZHJlbiB0byB0aGlzIDxwPi5cbiAgICAgICAgICBpZiAobmV4dC50YWdOYW1lID09IFwiQlJcIikge1xuICAgICAgICAgICAgdmFyIG5leHRFbGVtID0gdGhpcy5fbmV4dEVsZW1lbnQobmV4dC5uZXh0U2libGluZyk7XG4gICAgICAgICAgICBpZiAobmV4dEVsZW0gJiYgbmV4dEVsZW0udGFnTmFtZSA9PSBcIkJSXCIpXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghdGhpcy5faXNQaHJhc2luZ0NvbnRlbnQobmV4dCkpIGJyZWFrO1xuXG4gICAgICAgICAgLy8gT3RoZXJ3aXNlLCBtYWtlIHRoaXMgbm9kZSBhIGNoaWxkIG9mIHRoZSBuZXcgPHA+LlxuICAgICAgICAgIHZhciBzaWJsaW5nID0gbmV4dC5uZXh0U2libGluZztcbiAgICAgICAgICBwLmFwcGVuZENoaWxkKG5leHQpO1xuICAgICAgICAgIG5leHQgPSBzaWJsaW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKHAubGFzdENoaWxkICYmIHRoaXMuX2lzV2hpdGVzcGFjZShwLmxhc3RDaGlsZCkpIHAucmVtb3ZlQ2hpbGQocC5sYXN0Q2hpbGQpO1xuXG4gICAgICAgIGlmIChwLnBhcmVudE5vZGUudGFnTmFtZSA9PT0gXCJQXCIpIHRoaXMuX3NldE5vZGVUYWcocC5wYXJlbnROb2RlLCBcIkRJVlwiKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICBfc2V0Tm9kZVRhZzogZnVuY3Rpb24gKG5vZGUsIHRhZykge1xuICAgIHRoaXMubG9nKFwiX3NldE5vZGVUYWdcIiwgbm9kZSwgdGFnKTtcbiAgICBpZiAobm9kZS5fX0pTRE9NUGFyc2VyX18pIHtcbiAgICAgIG5vZGUubG9jYWxOYW1lID0gdGFnLnRvTG93ZXJDYXNlKCk7XG4gICAgICBub2RlLnRhZ05hbWUgPSB0YWcudG9VcHBlckNhc2UoKTtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIHZhciByZXBsYWNlbWVudCA9IG5vZGUub3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgd2hpbGUgKG5vZGUuZmlyc3RDaGlsZCkge1xuICAgICAgcmVwbGFjZW1lbnQuYXBwZW5kQ2hpbGQobm9kZS5maXJzdENoaWxkKTtcbiAgICB9XG4gICAgbm9kZS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChyZXBsYWNlbWVudCwgbm9kZSk7XG4gICAgaWYgKG5vZGUucmVhZGFiaWxpdHkpXG4gICAgICByZXBsYWNlbWVudC5yZWFkYWJpbGl0eSA9IG5vZGUucmVhZGFiaWxpdHk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgcmVwbGFjZW1lbnQuc2V0QXR0cmlidXRlKG5vZGUuYXR0cmlidXRlc1tpXS5uYW1lLCBub2RlLmF0dHJpYnV0ZXNbaV0udmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gcmVwbGFjZW1lbnQ7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFByZXBhcmUgdGhlIGFydGljbGUgbm9kZSBmb3IgZGlzcGxheS4gQ2xlYW4gb3V0IGFueSBpbmxpbmUgc3R5bGVzLFxuICAgKiBpZnJhbWVzLCBmb3Jtcywgc3RyaXAgZXh0cmFuZW91cyA8cD4gdGFncywgZXRjLlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICoqL1xuICBfcHJlcEFydGljbGU6IGZ1bmN0aW9uKGFydGljbGVDb250ZW50KSB7XG4gICAgdGhpcy5fY2xlYW5TdHlsZXMoYXJ0aWNsZUNvbnRlbnQpO1xuXG4gICAgLy8gQ2hlY2sgZm9yIGRhdGEgdGFibGVzIGJlZm9yZSB3ZSBjb250aW51ZSwgdG8gYXZvaWQgcmVtb3ZpbmcgaXRlbXMgaW5cbiAgICAvLyB0aG9zZSB0YWJsZXMsIHdoaWNoIHdpbGwgb2Z0ZW4gYmUgaXNvbGF0ZWQgZXZlbiB0aG91Z2ggdGhleSdyZVxuICAgIC8vIHZpc3VhbGx5IGxpbmtlZCB0byBvdGhlciBjb250ZW50LWZ1bCBlbGVtZW50cyAodGV4dCwgaW1hZ2VzLCBldGMuKS5cbiAgICB0aGlzLl9tYXJrRGF0YVRhYmxlcyhhcnRpY2xlQ29udGVudCk7XG5cbiAgICAvLyBDbGVhbiBvdXQganVuayBmcm9tIHRoZSBhcnRpY2xlIGNvbnRlbnRcbiAgICB0aGlzLl9jbGVhbkNvbmRpdGlvbmFsbHkoYXJ0aWNsZUNvbnRlbnQsIFwiZm9ybVwiKTtcbiAgICB0aGlzLl9jbGVhbkNvbmRpdGlvbmFsbHkoYXJ0aWNsZUNvbnRlbnQsIFwiZmllbGRzZXRcIik7XG4gICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwib2JqZWN0XCIpO1xuICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcImVtYmVkXCIpO1xuICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcImgxXCIpO1xuICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcImZvb3RlclwiKTtcbiAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJsaW5rXCIpO1xuICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcImFzaWRlXCIpO1xuXG4gICAgLy8gQ2xlYW4gb3V0IGVsZW1lbnRzIGhhdmUgXCJzaGFyZVwiIGluIHRoZWlyIGlkL2NsYXNzIGNvbWJpbmF0aW9ucyBmcm9tIGZpbmFsIHRvcCBjYW5kaWRhdGVzLFxuICAgIC8vIHdoaWNoIG1lYW5zIHdlIGRvbid0IHJlbW92ZSB0aGUgdG9wIGNhbmRpZGF0ZXMgZXZlbiB0aGV5IGhhdmUgXCJzaGFyZVwiLlxuICAgIHRoaXMuX2ZvckVhY2hOb2RlKGFydGljbGVDb250ZW50LmNoaWxkcmVuLCBmdW5jdGlvbih0b3BDYW5kaWRhdGUpIHtcbiAgICAgIHRoaXMuX2NsZWFuTWF0Y2hlZE5vZGVzKHRvcENhbmRpZGF0ZSwgL3NoYXJlLyk7XG4gICAgfSk7XG5cbiAgICAvLyBJZiB0aGVyZSBpcyBvbmx5IG9uZSBoMiBhbmQgaXRzIHRleHQgY29udGVudCBzdWJzdGFudGlhbGx5IGVxdWFscyBhcnRpY2xlIHRpdGxlLFxuICAgIC8vIHRoZXkgYXJlIHByb2JhYmx5IHVzaW5nIGl0IGFzIGEgaGVhZGVyIGFuZCBub3QgYSBzdWJoZWFkZXIsXG4gICAgLy8gc28gcmVtb3ZlIGl0IHNpbmNlIHdlIGFscmVhZHkgZXh0cmFjdCB0aGUgdGl0bGUgc2VwYXJhdGVseS5cbiAgICB2YXIgaDIgPSBhcnRpY2xlQ29udGVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaDInKTtcbiAgICBpZiAoaDIubGVuZ3RoID09PSAxKSB7XG4gICAgICB2YXIgbGVuZ3RoU2ltaWxhclJhdGUgPSAoaDJbMF0udGV4dENvbnRlbnQubGVuZ3RoIC0gdGhpcy5fYXJ0aWNsZVRpdGxlLmxlbmd0aCkgLyB0aGlzLl9hcnRpY2xlVGl0bGUubGVuZ3RoO1xuICAgICAgaWYgKE1hdGguYWJzKGxlbmd0aFNpbWlsYXJSYXRlKSA8IDAuNSkge1xuICAgICAgICB2YXIgdGl0bGVzTWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgaWYgKGxlbmd0aFNpbWlsYXJSYXRlID4gMCkge1xuICAgICAgICAgIHRpdGxlc01hdGNoID0gaDJbMF0udGV4dENvbnRlbnQuaW5jbHVkZXModGhpcy5fYXJ0aWNsZVRpdGxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aXRsZXNNYXRjaCA9IHRoaXMuX2FydGljbGVUaXRsZS5pbmNsdWRlcyhoMlswXS50ZXh0Q29udGVudCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRpdGxlc01hdGNoKSB7XG4gICAgICAgICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwiaDJcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJpZnJhbWVcIik7XG4gICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwiaW5wdXRcIik7XG4gICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwidGV4dGFyZWFcIik7XG4gICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwic2VsZWN0XCIpO1xuICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcImJ1dHRvblwiKTtcbiAgICB0aGlzLl9jbGVhbkhlYWRlcnMoYXJ0aWNsZUNvbnRlbnQpO1xuXG4gICAgLy8gRG8gdGhlc2UgbGFzdCBhcyB0aGUgcHJldmlvdXMgc3R1ZmYgbWF5IGhhdmUgcmVtb3ZlZCBqdW5rXG4gICAgLy8gdGhhdCB3aWxsIGFmZmVjdCB0aGVzZVxuICAgIHRoaXMuX2NsZWFuQ29uZGl0aW9uYWxseShhcnRpY2xlQ29udGVudCwgXCJ0YWJsZVwiKTtcbiAgICB0aGlzLl9jbGVhbkNvbmRpdGlvbmFsbHkoYXJ0aWNsZUNvbnRlbnQsIFwidWxcIik7XG4gICAgdGhpcy5fY2xlYW5Db25kaXRpb25hbGx5KGFydGljbGVDb250ZW50LCBcImRpdlwiKTtcblxuICAgIC8vIFJlbW92ZSBleHRyYSBwYXJhZ3JhcGhzXG4gICAgdGhpcy5fcmVtb3ZlTm9kZXMoYXJ0aWNsZUNvbnRlbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3AnKSwgZnVuY3Rpb24gKHBhcmFncmFwaCkge1xuICAgICAgdmFyIGltZ0NvdW50ID0gcGFyYWdyYXBoLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWcnKS5sZW5ndGg7XG4gICAgICB2YXIgZW1iZWRDb3VudCA9IHBhcmFncmFwaC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnZW1iZWQnKS5sZW5ndGg7XG4gICAgICB2YXIgb2JqZWN0Q291bnQgPSBwYXJhZ3JhcGguZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ29iamVjdCcpLmxlbmd0aDtcbiAgICAgIC8vIEF0IHRoaXMgcG9pbnQsIG5hc3R5IGlmcmFtZXMgaGF2ZSBiZWVuIHJlbW92ZWQsIG9ubHkgcmVtYWluIGVtYmVkZGVkIHZpZGVvIG9uZXMuXG4gICAgICB2YXIgaWZyYW1lQ291bnQgPSBwYXJhZ3JhcGguZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpLmxlbmd0aDtcbiAgICAgIHZhciB0b3RhbENvdW50ID0gaW1nQ291bnQgKyBlbWJlZENvdW50ICsgb2JqZWN0Q291bnQgKyBpZnJhbWVDb3VudDtcblxuICAgICAgcmV0dXJuIHRvdGFsQ291bnQgPT09IDAgJiYgIXRoaXMuX2dldElubmVyVGV4dChwYXJhZ3JhcGgsIGZhbHNlKTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2ZvckVhY2hOb2RlKHRoaXMuX2dldEFsbE5vZGVzV2l0aFRhZyhhcnRpY2xlQ29udGVudCwgW1wiYnJcIl0pLCBmdW5jdGlvbihicikge1xuICAgICAgdmFyIG5leHQgPSB0aGlzLl9uZXh0RWxlbWVudChici5uZXh0U2libGluZyk7XG4gICAgICBpZiAobmV4dCAmJiBuZXh0LnRhZ05hbWUgPT0gXCJQXCIpXG4gICAgICAgIGJyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoYnIpO1xuICAgIH0pO1xuXG4gICAgLy8gUmVtb3ZlIHNpbmdsZS1jZWxsIHRhYmxlc1xuICAgIHRoaXMuX2ZvckVhY2hOb2RlKHRoaXMuX2dldEFsbE5vZGVzV2l0aFRhZyhhcnRpY2xlQ29udGVudCwgW1widGFibGVcIl0pLCBmdW5jdGlvbih0YWJsZSkge1xuICAgICAgdmFyIHRib2R5ID0gdGhpcy5faGFzU2luZ2xlVGFnSW5zaWRlRWxlbWVudCh0YWJsZSwgXCJUQk9EWVwiKSA/IHRhYmxlLmZpcnN0RWxlbWVudENoaWxkIDogdGFibGU7XG4gICAgICBpZiAodGhpcy5faGFzU2luZ2xlVGFnSW5zaWRlRWxlbWVudCh0Ym9keSwgXCJUUlwiKSkge1xuICAgICAgICB2YXIgcm93ID0gdGJvZHkuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgIGlmICh0aGlzLl9oYXNTaW5nbGVUYWdJbnNpZGVFbGVtZW50KHJvdywgXCJURFwiKSkge1xuICAgICAgICAgIHZhciBjZWxsID0gcm93LmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgIGNlbGwgPSB0aGlzLl9zZXROb2RlVGFnKGNlbGwsIHRoaXMuX2V2ZXJ5Tm9kZShjZWxsLmNoaWxkTm9kZXMsIHRoaXMuX2lzUGhyYXNpbmdDb250ZW50KSA/IFwiUFwiIDogXCJESVZcIik7XG4gICAgICAgICAgdGFibGUucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoY2VsbCwgdGFibGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYSBub2RlIHdpdGggdGhlIHJlYWRhYmlsaXR5IG9iamVjdC4gQWxzbyBjaGVja3MgdGhlXG4gICAqIGNsYXNzTmFtZS9pZCBmb3Igc3BlY2lhbCBuYW1lcyB0byBhZGQgdG8gaXRzIHNjb3JlLlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICoqL1xuICBfaW5pdGlhbGl6ZU5vZGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICBub2RlLnJlYWRhYmlsaXR5ID0ge1wiY29udGVudFNjb3JlXCI6IDB9O1xuXG4gICAgc3dpdGNoIChub2RlLnRhZ05hbWUpIHtcbiAgICAgIGNhc2UgJ0RJVic6XG4gICAgICAgIG5vZGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlICs9IDU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdQUkUnOlxuICAgICAgY2FzZSAnVEQnOlxuICAgICAgY2FzZSAnQkxPQ0tRVU9URSc6XG4gICAgICAgIG5vZGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlICs9IDM7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdBRERSRVNTJzpcbiAgICAgIGNhc2UgJ09MJzpcbiAgICAgIGNhc2UgJ1VMJzpcbiAgICAgIGNhc2UgJ0RMJzpcbiAgICAgIGNhc2UgJ0REJzpcbiAgICAgIGNhc2UgJ0RUJzpcbiAgICAgIGNhc2UgJ0xJJzpcbiAgICAgIGNhc2UgJ0ZPUk0nOlxuICAgICAgICBub2RlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSAtPSAzO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnSDEnOlxuICAgICAgY2FzZSAnSDInOlxuICAgICAgY2FzZSAnSDMnOlxuICAgICAgY2FzZSAnSDQnOlxuICAgICAgY2FzZSAnSDUnOlxuICAgICAgY2FzZSAnSDYnOlxuICAgICAgY2FzZSAnVEgnOlxuICAgICAgICBub2RlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSAtPSA1O1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBub2RlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSArPSB0aGlzLl9nZXRDbGFzc1dlaWdodChub2RlKTtcbiAgfSxcblxuICBfcmVtb3ZlQW5kR2V0TmV4dDogZnVuY3Rpb24obm9kZSkge1xuICAgIHZhciBuZXh0Tm9kZSA9IHRoaXMuX2dldE5leHROb2RlKG5vZGUsIHRydWUpO1xuICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICByZXR1cm4gbmV4dE5vZGU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFRyYXZlcnNlIHRoZSBET00gZnJvbSBub2RlIHRvIG5vZGUsIHN0YXJ0aW5nIGF0IHRoZSBub2RlIHBhc3NlZCBpbi5cbiAgICogUGFzcyB0cnVlIGZvciB0aGUgc2Vjb25kIHBhcmFtZXRlciB0byBpbmRpY2F0ZSB0aGlzIG5vZGUgaXRzZWxmXG4gICAqIChhbmQgaXRzIGtpZHMpIGFyZSBnb2luZyBhd2F5LCBhbmQgd2Ugd2FudCB0aGUgbmV4dCBub2RlIG92ZXIuXG4gICAqXG4gICAqIENhbGxpbmcgdGhpcyBpbiBhIGxvb3Agd2lsbCB0cmF2ZXJzZSB0aGUgRE9NIGRlcHRoLWZpcnN0LlxuICAgKi9cbiAgX2dldE5leHROb2RlOiBmdW5jdGlvbihub2RlLCBpZ25vcmVTZWxmQW5kS2lkcykge1xuICAgIC8vIEZpcnN0IGNoZWNrIGZvciBraWRzIGlmIHRob3NlIGFyZW4ndCBiZWluZyBpZ25vcmVkXG4gICAgaWYgKCFpZ25vcmVTZWxmQW5kS2lkcyAmJiBub2RlLmZpcnN0RWxlbWVudENoaWxkKSB7XG4gICAgICByZXR1cm4gbm9kZS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICB9XG4gICAgLy8gVGhlbiBmb3Igc2libGluZ3MuLi5cbiAgICBpZiAobm9kZS5uZXh0RWxlbWVudFNpYmxpbmcpIHtcbiAgICAgIHJldHVybiBub2RlLm5leHRFbGVtZW50U2libGluZztcbiAgICB9XG4gICAgLy8gQW5kIGZpbmFsbHksIG1vdmUgdXAgdGhlIHBhcmVudCBjaGFpbiAqYW5kKiBmaW5kIGEgc2libGluZ1xuICAgIC8vIChiZWNhdXNlIHRoaXMgaXMgZGVwdGgtZmlyc3QgdHJhdmVyc2FsLCB3ZSB3aWxsIGhhdmUgYWxyZWFkeVxuICAgIC8vIHNlZW4gdGhlIHBhcmVudCBub2RlcyB0aGVtc2VsdmVzKS5cbiAgICBkbyB7XG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIH0gd2hpbGUgKG5vZGUgJiYgIW5vZGUubmV4dEVsZW1lbnRTaWJsaW5nKTtcbiAgICByZXR1cm4gbm9kZSAmJiBub2RlLm5leHRFbGVtZW50U2libGluZztcbiAgfSxcblxuICBfY2hlY2tCeWxpbmU6IGZ1bmN0aW9uKG5vZGUsIG1hdGNoU3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuX2FydGljbGVCeWxpbmUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAobm9kZS5nZXRBdHRyaWJ1dGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdmFyIHJlbCA9IG5vZGUuZ2V0QXR0cmlidXRlKFwicmVsXCIpO1xuICAgIH1cblxuICAgIGlmICgocmVsID09PSBcImF1dGhvclwiIHx8IHRoaXMuUkVHRVhQUy5ieWxpbmUudGVzdChtYXRjaFN0cmluZykpICYmIHRoaXMuX2lzVmFsaWRCeWxpbmUobm9kZS50ZXh0Q29udGVudCkpIHtcbiAgICAgIHRoaXMuX2FydGljbGVCeWxpbmUgPSBub2RlLnRleHRDb250ZW50LnRyaW0oKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICBfZ2V0Tm9kZUFuY2VzdG9yczogZnVuY3Rpb24obm9kZSwgbWF4RGVwdGgpIHtcbiAgICBtYXhEZXB0aCA9IG1heERlcHRoIHx8IDA7XG4gICAgdmFyIGkgPSAwLCBhbmNlc3RvcnMgPSBbXTtcbiAgICB3aGlsZSAobm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICBhbmNlc3RvcnMucHVzaChub2RlLnBhcmVudE5vZGUpO1xuICAgICAgaWYgKG1heERlcHRoICYmICsraSA9PT0gbWF4RGVwdGgpXG4gICAgICAgIGJyZWFrO1xuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGFuY2VzdG9ycztcbiAgfSxcblxuICAvKioqXG4gICAqIGdyYWJBcnRpY2xlIC0gVXNpbmcgYSB2YXJpZXR5IG9mIG1ldHJpY3MgKGNvbnRlbnQgc2NvcmUsIGNsYXNzbmFtZSwgZWxlbWVudCB0eXBlcyksIGZpbmQgdGhlIGNvbnRlbnQgdGhhdCBpc1xuICAgKiAgICAgICAgIG1vc3QgbGlrZWx5IHRvIGJlIHRoZSBzdHVmZiBhIHVzZXIgd2FudHMgdG8gcmVhZC4gVGhlbiByZXR1cm4gaXQgd3JhcHBlZCB1cCBpbiBhIGRpdi5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgYSBkb2N1bWVudCB0byBydW4gdXBvbi4gTmVlZHMgdG8gYmUgYSBmdWxsIGRvY3VtZW50LCBjb21wbGV0ZSB3aXRoIGJvZHkuXG4gICAqIEByZXR1cm4gRWxlbWVudFxuICAgKiovXG4gIF9ncmFiQXJ0aWNsZTogZnVuY3Rpb24gKHBhZ2UpIHtcbiAgICB0aGlzLmxvZyhcIioqKiogZ3JhYkFydGljbGUgKioqKlwiKTtcbiAgICB2YXIgZG9jID0gdGhpcy5fZG9jO1xuICAgIHZhciBpc1BhZ2luZyA9IChwYWdlICE9PSBudWxsID8gdHJ1ZTogZmFsc2UpO1xuICAgIHBhZ2UgPSBwYWdlID8gcGFnZSA6IHRoaXMuX2JvZHk7XG5cbiAgICAvLyBXZSBjYW4ndCBncmFiIGFuIGFydGljbGUgaWYgd2UgZG9uJ3QgaGF2ZSBhIHBhZ2UhXG4gICAgaWYgKCFwYWdlKSB7XG4gICAgICB0aGlzLmxvZyhcIk5vIGJvZHkgZm91bmQgaW4gZG9jdW1lbnQuIEFib3J0LlwiKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciBwYWdlQ2FjaGVIdG1sID0gcGFnZS5pbm5lckhUTUw7XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgdmFyIHN0cmlwVW5saWtlbHlDYW5kaWRhdGVzID0gdGhpcy5fZmxhZ0lzQWN0aXZlKHRoaXMuRkxBR19TVFJJUF9VTkxJS0VMWVMpO1xuXG4gICAgICAvLyBGaXJzdCwgbm9kZSBwcmVwcGluZy4gVHJhc2ggbm9kZXMgdGhhdCBsb29rIGNydWRkeSAobGlrZSBvbmVzIHdpdGggdGhlXG4gICAgICAvLyBjbGFzcyBuYW1lIFwiY29tbWVudFwiLCBldGMpLCBhbmQgdHVybiBkaXZzIGludG8gUCB0YWdzIHdoZXJlIHRoZXkgaGF2ZSBiZWVuXG4gICAgICAvLyB1c2VkIGluYXBwcm9wcmlhdGVseSAoYXMgaW4sIHdoZXJlIHRoZXkgY29udGFpbiBubyBvdGhlciBibG9jayBsZXZlbCBlbGVtZW50cy4pXG4gICAgICB2YXIgZWxlbWVudHNUb1Njb3JlID0gW107XG4gICAgICB2YXIgbm9kZSA9IHRoaXMuX2JvZHk7XG5cbiAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIHZhciBtYXRjaFN0cmluZyA9IG5vZGUuY2xhc3NOYW1lICsgXCIgXCIgKyBub2RlLmlkO1xuXG4gICAgICAgIGlmICghdGhpcy5faXNQcm9iYWJseVZpc2libGUobm9kZSkpIHtcbiAgICAgICAgICB0aGlzLmxvZyhcIlJlbW92aW5nIGhpZGRlbiBub2RlIC0gXCIgKyBtYXRjaFN0cmluZyk7XG4gICAgICAgICAgbm9kZSA9IHRoaXMuX3JlbW92ZUFuZEdldE5leHQobm9kZSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhpcyBub2RlIGlzIGEgYnlsaW5lLCBhbmQgcmVtb3ZlIGl0IGlmIGl0IGlzLlxuICAgICAgICBpZiAodGhpcy5fY2hlY2tCeWxpbmUobm9kZSwgbWF0Y2hTdHJpbmcpKSB7XG4gICAgICAgICAgbm9kZSA9IHRoaXMuX3JlbW92ZUFuZEdldE5leHQobm9kZSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgdW5saWtlbHkgY2FuZGlkYXRlc1xuICAgICAgICBpZiAoc3RyaXBVbmxpa2VseUNhbmRpZGF0ZXMpIHtcbiAgICAgICAgICBpZiAodGhpcy5SRUdFWFBTLnVubGlrZWx5Q2FuZGlkYXRlcy50ZXN0KG1hdGNoU3RyaW5nKSAmJlxuICAgICAgICAgICAgICAhdGhpcy5SRUdFWFBTLm9rTWF5YmVJdHNBQ2FuZGlkYXRlLnRlc3QobWF0Y2hTdHJpbmcpICYmXG4gICAgICAgICAgICAgIG5vZGUudGFnTmFtZSAhPT0gXCJCT0RZXCIgJiZcbiAgICAgICAgICAgICAgbm9kZS50YWdOYW1lICE9PSBcIkFcIikge1xuICAgICAgICAgICAgdGhpcy5sb2coXCJSZW1vdmluZyB1bmxpa2VseSBjYW5kaWRhdGUgLSBcIiArIG1hdGNoU3RyaW5nKTtcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLl9yZW1vdmVBbmRHZXROZXh0KG5vZGUpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIERJViwgU0VDVElPTiwgYW5kIEhFQURFUiBub2RlcyB3aXRob3V0IGFueSBjb250ZW50KGUuZy4gdGV4dCwgaW1hZ2UsIHZpZGVvLCBvciBpZnJhbWUpLlxuICAgICAgICBpZiAoKG5vZGUudGFnTmFtZSA9PT0gXCJESVZcIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiU0VDVElPTlwiIHx8IG5vZGUudGFnTmFtZSA9PT0gXCJIRUFERVJcIiB8fFxuICAgICAgICAgICAgbm9kZS50YWdOYW1lID09PSBcIkgxXCIgfHwgbm9kZS50YWdOYW1lID09PSBcIkgyXCIgfHwgbm9kZS50YWdOYW1lID09PSBcIkgzXCIgfHxcbiAgICAgICAgICAgIG5vZGUudGFnTmFtZSA9PT0gXCJINFwiIHx8IG5vZGUudGFnTmFtZSA9PT0gXCJINVwiIHx8IG5vZGUudGFnTmFtZSA9PT0gXCJINlwiKSAmJlxuICAgICAgICAgICAgdGhpcy5faXNFbGVtZW50V2l0aG91dENvbnRlbnQobm9kZSkpIHtcbiAgICAgICAgICBub2RlID0gdGhpcy5fcmVtb3ZlQW5kR2V0TmV4dChub2RlKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLkRFRkFVTFRfVEFHU19UT19TQ09SRS5pbmRleE9mKG5vZGUudGFnTmFtZSkgIT09IC0xKSB7XG4gICAgICAgICAgZWxlbWVudHNUb1Njb3JlLnB1c2gobm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUdXJuIGFsbCBkaXZzIHRoYXQgZG9uJ3QgaGF2ZSBjaGlsZHJlbiBibG9jayBsZXZlbCBlbGVtZW50cyBpbnRvIHAnc1xuICAgICAgICBpZiAobm9kZS50YWdOYW1lID09PSBcIkRJVlwiKSB7XG4gICAgICAgICAgLy8gUHV0IHBocmFzaW5nIGNvbnRlbnQgaW50byBwYXJhZ3JhcGhzLlxuICAgICAgICAgIHZhciBwID0gbnVsbDtcbiAgICAgICAgICB2YXIgY2hpbGROb2RlID0gbm9kZS5maXJzdENoaWxkO1xuICAgICAgICAgIHdoaWxlIChjaGlsZE5vZGUpIHtcbiAgICAgICAgICAgIHZhciBuZXh0U2libGluZyA9IGNoaWxkTm9kZS5uZXh0U2libGluZztcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc1BocmFzaW5nQ29udGVudChjaGlsZE5vZGUpKSB7XG4gICAgICAgICAgICAgIGlmIChwICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcC5hcHBlbmRDaGlsZChjaGlsZE5vZGUpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLl9pc1doaXRlc3BhY2UoY2hpbGROb2RlKSkge1xuICAgICAgICAgICAgICAgIHAgPSBkb2MuY3JlYXRlRWxlbWVudCgncCcpO1xuICAgICAgICAgICAgICAgIG5vZGUucmVwbGFjZUNoaWxkKHAsIGNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgICAgcC5hcHBlbmRDaGlsZChjaGlsZE5vZGUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHAgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgd2hpbGUgKHAubGFzdENoaWxkICYmIHRoaXMuX2lzV2hpdGVzcGFjZShwLmxhc3RDaGlsZCkpIHAucmVtb3ZlQ2hpbGQocC5sYXN0Q2hpbGQpO1xuICAgICAgICAgICAgICBwID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNoaWxkTm9kZSA9IG5leHRTaWJsaW5nO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFNpdGVzIGxpa2UgaHR0cDovL21vYmlsZS5zbGF0ZS5jb20gZW5jbG9zZXMgZWFjaCBwYXJhZ3JhcGggd2l0aCBhIERJVlxuICAgICAgICAgIC8vIGVsZW1lbnQuIERJVnMgd2l0aCBvbmx5IGEgUCBlbGVtZW50IGluc2lkZSBhbmQgbm8gdGV4dCBjb250ZW50IGNhbiBiZVxuICAgICAgICAgIC8vIHNhZmVseSBjb252ZXJ0ZWQgaW50byBwbGFpbiBQIGVsZW1lbnRzIHRvIGF2b2lkIGNvbmZ1c2luZyB0aGUgc2NvcmluZ1xuICAgICAgICAgIC8vIGFsZ29yaXRobSB3aXRoIERJVnMgd2l0aCBhcmUsIGluIHByYWN0aWNlLCBwYXJhZ3JhcGhzLlxuICAgICAgICAgIGlmICh0aGlzLl9oYXNTaW5nbGVUYWdJbnNpZGVFbGVtZW50KG5vZGUsIFwiUFwiKSAmJiB0aGlzLl9nZXRMaW5rRGVuc2l0eShub2RlKSA8IDAuMjUpIHtcbiAgICAgICAgICAgIHZhciBuZXdOb2RlID0gbm9kZS5jaGlsZHJlblswXTtcbiAgICAgICAgICAgIG5vZGUucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Tm9kZSwgbm9kZSk7XG4gICAgICAgICAgICBub2RlID0gbmV3Tm9kZTtcbiAgICAgICAgICAgIGVsZW1lbnRzVG9TY29yZS5wdXNoKG5vZGUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuX2hhc0NoaWxkQmxvY2tFbGVtZW50KG5vZGUpKSB7XG4gICAgICAgICAgICBub2RlID0gdGhpcy5fc2V0Tm9kZVRhZyhub2RlLCBcIlBcIik7XG4gICAgICAgICAgICBlbGVtZW50c1RvU2NvcmUucHVzaChub2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IHRoaXMuX2dldE5leHROb2RlKG5vZGUpO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIExvb3AgdGhyb3VnaCBhbGwgcGFyYWdyYXBocywgYW5kIGFzc2lnbiBhIHNjb3JlIHRvIHRoZW0gYmFzZWQgb24gaG93IGNvbnRlbnQteSB0aGV5IGxvb2suXG4gICAgICAgKiBUaGVuIGFkZCB0aGVpciBzY29yZSB0byB0aGVpciBwYXJlbnQgbm9kZS5cbiAgICAgICAqXG4gICAgICAgKiBBIHNjb3JlIGlzIGRldGVybWluZWQgYnkgdGhpbmdzIGxpa2UgbnVtYmVyIG9mIGNvbW1hcywgY2xhc3MgbmFtZXMsIGV0Yy4gTWF5YmUgZXZlbnR1YWxseSBsaW5rIGRlbnNpdHkuXG4gICAgICAgKiovXG4gICAgICB2YXIgY2FuZGlkYXRlcyA9IFtdO1xuICAgICAgdGhpcy5fZm9yRWFjaE5vZGUoZWxlbWVudHNUb1Njb3JlLCBmdW5jdGlvbihlbGVtZW50VG9TY29yZSkge1xuICAgICAgICBpZiAoIWVsZW1lbnRUb1Njb3JlLnBhcmVudE5vZGUgfHwgdHlwZW9mKGVsZW1lbnRUb1Njb3JlLnBhcmVudE5vZGUudGFnTmFtZSkgPT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAvLyBJZiB0aGlzIHBhcmFncmFwaCBpcyBsZXNzIHRoYW4gMjUgY2hhcmFjdGVycywgZG9uJ3QgZXZlbiBjb3VudCBpdC5cbiAgICAgICAgdmFyIGlubmVyVGV4dCA9IHRoaXMuX2dldElubmVyVGV4dChlbGVtZW50VG9TY29yZSk7XG4gICAgICAgIGlmIChpbm5lclRleHQubGVuZ3RoIDwgMjUpXG4gICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIC8vIEV4Y2x1ZGUgbm9kZXMgd2l0aCBubyBhbmNlc3Rvci5cbiAgICAgICAgdmFyIGFuY2VzdG9ycyA9IHRoaXMuX2dldE5vZGVBbmNlc3RvcnMoZWxlbWVudFRvU2NvcmUsIDMpO1xuICAgICAgICBpZiAoYW5jZXN0b3JzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdmFyIGNvbnRlbnRTY29yZSA9IDA7XG5cbiAgICAgICAgLy8gQWRkIGEgcG9pbnQgZm9yIHRoZSBwYXJhZ3JhcGggaXRzZWxmIGFzIGEgYmFzZS5cbiAgICAgICAgY29udGVudFNjb3JlICs9IDE7XG5cbiAgICAgICAgLy8gQWRkIHBvaW50cyBmb3IgYW55IGNvbW1hcyB3aXRoaW4gdGhpcyBwYXJhZ3JhcGguXG4gICAgICAgIGNvbnRlbnRTY29yZSArPSBpbm5lclRleHQuc3BsaXQoJywnKS5sZW5ndGg7XG5cbiAgICAgICAgLy8gRm9yIGV2ZXJ5IDEwMCBjaGFyYWN0ZXJzIGluIHRoaXMgcGFyYWdyYXBoLCBhZGQgYW5vdGhlciBwb2ludC4gVXAgdG8gMyBwb2ludHMuXG4gICAgICAgIGNvbnRlbnRTY29yZSArPSBNYXRoLm1pbihNYXRoLmZsb29yKGlubmVyVGV4dC5sZW5ndGggLyAxMDApLCAzKTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIGFuZCBzY29yZSBhbmNlc3RvcnMuXG4gICAgICAgIHRoaXMuX2ZvckVhY2hOb2RlKGFuY2VzdG9ycywgZnVuY3Rpb24oYW5jZXN0b3IsIGxldmVsKSB7XG4gICAgICAgICAgaWYgKCFhbmNlc3Rvci50YWdOYW1lIHx8ICFhbmNlc3Rvci5wYXJlbnROb2RlIHx8IHR5cGVvZihhbmNlc3Rvci5wYXJlbnROb2RlLnRhZ05hbWUpID09PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgIGlmICh0eXBlb2YoYW5jZXN0b3IucmVhZGFiaWxpdHkpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5faW5pdGlhbGl6ZU5vZGUoYW5jZXN0b3IpO1xuICAgICAgICAgICAgY2FuZGlkYXRlcy5wdXNoKGFuY2VzdG9yKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBOb2RlIHNjb3JlIGRpdmlkZXI6XG4gICAgICAgICAgLy8gLSBwYXJlbnQ6ICAgICAgICAgICAgIDEgKG5vIGRpdmlzaW9uKVxuICAgICAgICAgIC8vIC0gZ3JhbmRwYXJlbnQ6ICAgICAgICAyXG4gICAgICAgICAgLy8gLSBncmVhdCBncmFuZHBhcmVudCs6IGFuY2VzdG9yIGxldmVsICogM1xuICAgICAgICAgIGlmIChsZXZlbCA9PT0gMClcbiAgICAgICAgICAgIHZhciBzY29yZURpdmlkZXIgPSAxO1xuICAgICAgICAgIGVsc2UgaWYgKGxldmVsID09PSAxKVxuICAgICAgICAgICAgc2NvcmVEaXZpZGVyID0gMjtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBzY29yZURpdmlkZXIgPSBsZXZlbCAqIDM7XG4gICAgICAgICAgYW5jZXN0b3IucmVhZGFiaWxpdHkuY29udGVudFNjb3JlICs9IGNvbnRlbnRTY29yZSAvIHNjb3JlRGl2aWRlcjtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gQWZ0ZXIgd2UndmUgY2FsY3VsYXRlZCBzY29yZXMsIGxvb3AgdGhyb3VnaCBhbGwgb2YgdGhlIHBvc3NpYmxlXG4gICAgICAvLyBjYW5kaWRhdGUgbm9kZXMgd2UgZm91bmQgYW5kIGZpbmQgdGhlIG9uZSB3aXRoIHRoZSBoaWdoZXN0IHNjb3JlLlxuICAgICAgdmFyIHRvcENhbmRpZGF0ZXMgPSBbXTtcbiAgICAgIGZvciAodmFyIGMgPSAwLCBjbCA9IGNhbmRpZGF0ZXMubGVuZ3RoOyBjIDwgY2w7IGMgKz0gMSkge1xuICAgICAgICB2YXIgY2FuZGlkYXRlID0gY2FuZGlkYXRlc1tjXTtcblxuICAgICAgICAvLyBTY2FsZSB0aGUgZmluYWwgY2FuZGlkYXRlcyBzY29yZSBiYXNlZCBvbiBsaW5rIGRlbnNpdHkuIEdvb2QgY29udGVudFxuICAgICAgICAvLyBzaG91bGQgaGF2ZSBhIHJlbGF0aXZlbHkgc21hbGwgbGluayBkZW5zaXR5ICg1JSBvciBsZXNzKSBhbmQgYmUgbW9zdGx5XG4gICAgICAgIC8vIHVuYWZmZWN0ZWQgYnkgdGhpcyBvcGVyYXRpb24uXG4gICAgICAgIHZhciBjYW5kaWRhdGVTY29yZSA9IGNhbmRpZGF0ZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgKiAoMSAtIHRoaXMuX2dldExpbmtEZW5zaXR5KGNhbmRpZGF0ZSkpO1xuICAgICAgICBjYW5kaWRhdGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlID0gY2FuZGlkYXRlU2NvcmU7XG5cbiAgICAgICAgdGhpcy5sb2coJ0NhbmRpZGF0ZTonLCBjYW5kaWRhdGUsIFwid2l0aCBzY29yZSBcIiArIGNhbmRpZGF0ZVNjb3JlKTtcblxuICAgICAgICBmb3IgKHZhciB0ID0gMDsgdCA8IHRoaXMuX25iVG9wQ2FuZGlkYXRlczsgdCsrKSB7XG4gICAgICAgICAgdmFyIGFUb3BDYW5kaWRhdGUgPSB0b3BDYW5kaWRhdGVzW3RdO1xuXG4gICAgICAgICAgaWYgKCFhVG9wQ2FuZGlkYXRlIHx8IGNhbmRpZGF0ZVNjb3JlID4gYVRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUpIHtcbiAgICAgICAgICAgIHRvcENhbmRpZGF0ZXMuc3BsaWNlKHQsIDAsIGNhbmRpZGF0ZSk7XG4gICAgICAgICAgICBpZiAodG9wQ2FuZGlkYXRlcy5sZW5ndGggPiB0aGlzLl9uYlRvcENhbmRpZGF0ZXMpXG4gICAgICAgICAgICAgIHRvcENhbmRpZGF0ZXMucG9wKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIHRvcENhbmRpZGF0ZSA9IHRvcENhbmRpZGF0ZXNbMF0gfHwgbnVsbDtcbiAgICAgIHZhciBuZWVkZWRUb0NyZWF0ZVRvcENhbmRpZGF0ZSA9IGZhbHNlO1xuICAgICAgdmFyIHBhcmVudE9mVG9wQ2FuZGlkYXRlO1xuXG4gICAgICAvLyBJZiB3ZSBzdGlsbCBoYXZlIG5vIHRvcCBjYW5kaWRhdGUsIGp1c3QgdXNlIHRoZSBib2R5IGFzIGEgbGFzdCByZXNvcnQuXG4gICAgICAvLyBXZSBhbHNvIGhhdmUgdG8gY29weSB0aGUgYm9keSBub2RlIHNvIGl0IGlzIHNvbWV0aGluZyB3ZSBjYW4gbW9kaWZ5LlxuICAgICAgaWYgKHRvcENhbmRpZGF0ZSA9PT0gbnVsbCB8fCB0b3BDYW5kaWRhdGUudGFnTmFtZSA9PT0gXCJCT0RZXCIpIHtcbiAgICAgICAgLy8gTW92ZSBhbGwgb2YgdGhlIHBhZ2UncyBjaGlsZHJlbiBpbnRvIHRvcENhbmRpZGF0ZVxuICAgICAgICB0b3BDYW5kaWRhdGUgPSBkb2MuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcbiAgICAgICAgbmVlZGVkVG9DcmVhdGVUb3BDYW5kaWRhdGUgPSB0cnVlO1xuICAgICAgICAvLyBNb3ZlIGV2ZXJ5dGhpbmcgKG5vdCBqdXN0IGVsZW1lbnRzLCBhbHNvIHRleHQgbm9kZXMgZXRjLikgaW50byB0aGUgY29udGFpbmVyXG4gICAgICAgIC8vIHNvIHdlIGV2ZW4gaW5jbHVkZSB0ZXh0IGRpcmVjdGx5IGluIHRoZSBib2R5OlxuICAgICAgICB2YXIga2lkcyA9IHBhZ2UuY2hpbGROb2RlcztcbiAgICAgICAgd2hpbGUgKGtpZHMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5sb2coXCJNb3ZpbmcgY2hpbGQgb3V0OlwiLCBraWRzWzBdKTtcbiAgICAgICAgICB0b3BDYW5kaWRhdGUuYXBwZW5kQ2hpbGQoa2lkc1swXSk7XG4gICAgICAgIH1cblxuICAgICAgICBwYWdlLmFwcGVuZENoaWxkKHRvcENhbmRpZGF0ZSk7XG5cbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZU5vZGUodG9wQ2FuZGlkYXRlKTtcbiAgICAgIH0gZWxzZSBpZiAodG9wQ2FuZGlkYXRlKSB7XG4gICAgICAgIC8vIEZpbmQgYSBiZXR0ZXIgdG9wIGNhbmRpZGF0ZSBub2RlIGlmIGl0IGNvbnRhaW5zIChhdCBsZWFzdCB0aHJlZSkgbm9kZXMgd2hpY2ggYmVsb25nIHRvIGB0b3BDYW5kaWRhdGVzYCBhcnJheVxuICAgICAgICAvLyBhbmQgd2hvc2Ugc2NvcmVzIGFyZSBxdWl0ZSBjbG9zZWQgd2l0aCBjdXJyZW50IGB0b3BDYW5kaWRhdGVgIG5vZGUuXG4gICAgICAgIHZhciBhbHRlcm5hdGl2ZUNhbmRpZGF0ZUFuY2VzdG9ycyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRvcENhbmRpZGF0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAodG9wQ2FuZGlkYXRlc1tpXS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgLyB0b3BDYW5kaWRhdGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlID49IDAuNzUpIHtcbiAgICAgICAgICAgIGFsdGVybmF0aXZlQ2FuZGlkYXRlQW5jZXN0b3JzLnB1c2godGhpcy5fZ2V0Tm9kZUFuY2VzdG9ycyh0b3BDYW5kaWRhdGVzW2ldKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBNSU5JTVVNX1RPUENBTkRJREFURVMgPSAzO1xuICAgICAgICBpZiAoYWx0ZXJuYXRpdmVDYW5kaWRhdGVBbmNlc3RvcnMubGVuZ3RoID49IE1JTklNVU1fVE9QQ0FORElEQVRFUykge1xuICAgICAgICAgIHBhcmVudE9mVG9wQ2FuZGlkYXRlID0gdG9wQ2FuZGlkYXRlLnBhcmVudE5vZGU7XG4gICAgICAgICAgd2hpbGUgKHBhcmVudE9mVG9wQ2FuZGlkYXRlLnRhZ05hbWUgIT09IFwiQk9EWVwiKSB7XG4gICAgICAgICAgICB2YXIgbGlzdHNDb250YWluaW5nVGhpc0FuY2VzdG9yID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIGFuY2VzdG9ySW5kZXggPSAwOyBhbmNlc3RvckluZGV4IDwgYWx0ZXJuYXRpdmVDYW5kaWRhdGVBbmNlc3RvcnMubGVuZ3RoICYmIGxpc3RzQ29udGFpbmluZ1RoaXNBbmNlc3RvciA8IE1JTklNVU1fVE9QQ0FORElEQVRFUzsgYW5jZXN0b3JJbmRleCsrKSB7XG4gICAgICAgICAgICAgIGxpc3RzQ29udGFpbmluZ1RoaXNBbmNlc3RvciArPSBOdW1iZXIoYWx0ZXJuYXRpdmVDYW5kaWRhdGVBbmNlc3RvcnNbYW5jZXN0b3JJbmRleF0uaW5jbHVkZXMocGFyZW50T2ZUb3BDYW5kaWRhdGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChsaXN0c0NvbnRhaW5pbmdUaGlzQW5jZXN0b3IgPj0gTUlOSU1VTV9UT1BDQU5ESURBVEVTKSB7XG4gICAgICAgICAgICAgIHRvcENhbmRpZGF0ZSA9IHBhcmVudE9mVG9wQ2FuZGlkYXRlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhcmVudE9mVG9wQ2FuZGlkYXRlID0gcGFyZW50T2ZUb3BDYW5kaWRhdGUucGFyZW50Tm9kZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0b3BDYW5kaWRhdGUucmVhZGFiaWxpdHkpIHtcbiAgICAgICAgICB0aGlzLl9pbml0aWFsaXplTm9kZSh0b3BDYW5kaWRhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQmVjYXVzZSBvZiBvdXIgYm9udXMgc3lzdGVtLCBwYXJlbnRzIG9mIGNhbmRpZGF0ZXMgbWlnaHQgaGF2ZSBzY29yZXNcbiAgICAgICAgLy8gdGhlbXNlbHZlcy4gVGhleSBnZXQgaGFsZiBvZiB0aGUgbm9kZS4gVGhlcmUgd29uJ3QgYmUgbm9kZXMgd2l0aCBoaWdoZXJcbiAgICAgICAgLy8gc2NvcmVzIHRoYW4gb3VyIHRvcENhbmRpZGF0ZSwgYnV0IGlmIHdlIHNlZSB0aGUgc2NvcmUgZ29pbmcgKnVwKiBpbiB0aGUgZmlyc3RcbiAgICAgICAgLy8gZmV3IHN0ZXBzIHVwIHRoZSB0cmVlLCB0aGF0J3MgYSBkZWNlbnQgc2lnbiB0aGF0IHRoZXJlIG1pZ2h0IGJlIG1vcmUgY29udGVudFxuICAgICAgICAvLyBsdXJraW5nIGluIG90aGVyIHBsYWNlcyB0aGF0IHdlIHdhbnQgdG8gdW5pZnkgaW4uIFRoZSBzaWJsaW5nIHN0dWZmXG4gICAgICAgIC8vIGJlbG93IGRvZXMgc29tZSBvZiB0aGF0IC0gYnV0IG9ubHkgaWYgd2UndmUgbG9va2VkIGhpZ2ggZW5vdWdoIHVwIHRoZSBET01cbiAgICAgICAgLy8gdHJlZS5cbiAgICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSB0b3BDYW5kaWRhdGUucGFyZW50Tm9kZTtcbiAgICAgICAgdmFyIGxhc3RTY29yZSA9IHRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmU7XG4gICAgICAgIC8vIFRoZSBzY29yZXMgc2hvdWxkbid0IGdldCB0b28gbG93LlxuICAgICAgICB2YXIgc2NvcmVUaHJlc2hvbGQgPSBsYXN0U2NvcmUgLyAzO1xuICAgICAgICB3aGlsZSAocGFyZW50T2ZUb3BDYW5kaWRhdGUudGFnTmFtZSAhPT0gXCJCT0RZXCIpIHtcbiAgICAgICAgICBpZiAoIXBhcmVudE9mVG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5KSB7XG4gICAgICAgICAgICBwYXJlbnRPZlRvcENhbmRpZGF0ZSA9IHBhcmVudE9mVG9wQ2FuZGlkYXRlLnBhcmVudE5vZGU7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHBhcmVudFNjb3JlID0gcGFyZW50T2ZUb3BDYW5kaWRhdGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlO1xuICAgICAgICAgIGlmIChwYXJlbnRTY29yZSA8IHNjb3JlVGhyZXNob2xkKVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgaWYgKHBhcmVudFNjb3JlID4gbGFzdFNjb3JlKSB7XG4gICAgICAgICAgICAvLyBBbHJpZ2h0ISBXZSBmb3VuZCBhIGJldHRlciBwYXJlbnQgdG8gdXNlLlxuICAgICAgICAgICAgdG9wQ2FuZGlkYXRlID0gcGFyZW50T2ZUb3BDYW5kaWRhdGU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgbGFzdFNjb3JlID0gcGFyZW50T2ZUb3BDYW5kaWRhdGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlO1xuICAgICAgICAgIHBhcmVudE9mVG9wQ2FuZGlkYXRlID0gcGFyZW50T2ZUb3BDYW5kaWRhdGUucGFyZW50Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSB0b3AgY2FuZGlkYXRlIGlzIHRoZSBvbmx5IGNoaWxkLCB1c2UgcGFyZW50IGluc3RlYWQuIFRoaXMgd2lsbCBoZWxwIHNpYmxpbmdcbiAgICAgICAgLy8gam9pbmluZyBsb2dpYyB3aGVuIGFkamFjZW50IGNvbnRlbnQgaXMgYWN0dWFsbHkgbG9jYXRlZCBpbiBwYXJlbnQncyBzaWJsaW5nIG5vZGUuXG4gICAgICAgIHBhcmVudE9mVG9wQ2FuZGlkYXRlID0gdG9wQ2FuZGlkYXRlLnBhcmVudE5vZGU7XG4gICAgICAgIHdoaWxlIChwYXJlbnRPZlRvcENhbmRpZGF0ZS50YWdOYW1lICE9IFwiQk9EWVwiICYmIHBhcmVudE9mVG9wQ2FuZGlkYXRlLmNoaWxkcmVuLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgdG9wQ2FuZGlkYXRlID0gcGFyZW50T2ZUb3BDYW5kaWRhdGU7XG4gICAgICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSB0b3BDYW5kaWRhdGUucGFyZW50Tm9kZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eSkge1xuICAgICAgICAgIHRoaXMuX2luaXRpYWxpemVOb2RlKHRvcENhbmRpZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSB0aGUgdG9wIGNhbmRpZGF0ZSwgbG9vayB0aHJvdWdoIGl0cyBzaWJsaW5ncyBmb3IgY29udGVudFxuICAgICAgLy8gdGhhdCBtaWdodCBhbHNvIGJlIHJlbGF0ZWQuIFRoaW5ncyBsaWtlIHByZWFtYmxlcywgY29udGVudCBzcGxpdCBieSBhZHNcbiAgICAgIC8vIHRoYXQgd2UgcmVtb3ZlZCwgZXRjLlxuICAgICAgdmFyIGFydGljbGVDb250ZW50ID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XG4gICAgICBpZiAoaXNQYWdpbmcpXG4gICAgICAgIGFydGljbGVDb250ZW50LmlkID0gXCJyZWFkYWJpbGl0eS1jb250ZW50XCI7XG5cbiAgICAgIHZhciBzaWJsaW5nU2NvcmVUaHJlc2hvbGQgPSBNYXRoLm1heCgxMCwgdG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSAqIDAuMik7XG4gICAgICAvLyBLZWVwIHBvdGVudGlhbCB0b3AgY2FuZGlkYXRlJ3MgcGFyZW50IG5vZGUgdG8gdHJ5IHRvIGdldCB0ZXh0IGRpcmVjdGlvbiBvZiBpdCBsYXRlci5cbiAgICAgIHBhcmVudE9mVG9wQ2FuZGlkYXRlID0gdG9wQ2FuZGlkYXRlLnBhcmVudE5vZGU7XG4gICAgICB2YXIgc2libGluZ3MgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZS5jaGlsZHJlbjtcblxuICAgICAgZm9yICh2YXIgcyA9IDAsIHNsID0gc2libGluZ3MubGVuZ3RoOyBzIDwgc2w7IHMrKykge1xuICAgICAgICB2YXIgc2libGluZyA9IHNpYmxpbmdzW3NdO1xuICAgICAgICB2YXIgYXBwZW5kID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5sb2coXCJMb29raW5nIGF0IHNpYmxpbmcgbm9kZTpcIiwgc2libGluZywgc2libGluZy5yZWFkYWJpbGl0eSA/IChcIndpdGggc2NvcmUgXCIgKyBzaWJsaW5nLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSkgOiAnJyk7XG4gICAgICAgIHRoaXMubG9nKFwiU2libGluZyBoYXMgc2NvcmVcIiwgc2libGluZy5yZWFkYWJpbGl0eSA/IHNpYmxpbmcucmVhZGFiaWxpdHkuY29udGVudFNjb3JlIDogJ1Vua25vd24nKTtcblxuICAgICAgICBpZiAoc2libGluZyA9PT0gdG9wQ2FuZGlkYXRlKSB7XG4gICAgICAgICAgYXBwZW5kID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgY29udGVudEJvbnVzID0gMDtcblxuICAgICAgICAgIC8vIEdpdmUgYSBib251cyBpZiBzaWJsaW5nIG5vZGVzIGFuZCB0b3AgY2FuZGlkYXRlcyBoYXZlIHRoZSBleGFtcGxlIHNhbWUgY2xhc3NuYW1lXG4gICAgICAgICAgaWYgKHNpYmxpbmcuY2xhc3NOYW1lID09PSB0b3BDYW5kaWRhdGUuY2xhc3NOYW1lICYmIHRvcENhbmRpZGF0ZS5jbGFzc05hbWUgIT09IFwiXCIpXG4gICAgICAgICAgICBjb250ZW50Qm9udXMgKz0gdG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSAqIDAuMjtcblxuICAgICAgICAgIGlmIChzaWJsaW5nLnJlYWRhYmlsaXR5ICYmXG4gICAgICAgICAgICAgICgoc2libGluZy5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgKyBjb250ZW50Qm9udXMpID49IHNpYmxpbmdTY29yZVRocmVzaG9sZCkpIHtcbiAgICAgICAgICAgIGFwcGVuZCA9IHRydWU7XG4gICAgICAgICAgfSBlbHNlIGlmIChzaWJsaW5nLm5vZGVOYW1lID09PSBcIlBcIikge1xuICAgICAgICAgICAgdmFyIGxpbmtEZW5zaXR5ID0gdGhpcy5fZ2V0TGlua0RlbnNpdHkoc2libGluZyk7XG4gICAgICAgICAgICB2YXIgbm9kZUNvbnRlbnQgPSB0aGlzLl9nZXRJbm5lclRleHQoc2libGluZyk7XG4gICAgICAgICAgICB2YXIgbm9kZUxlbmd0aCA9IG5vZGVDb250ZW50Lmxlbmd0aDtcblxuICAgICAgICAgICAgaWYgKG5vZGVMZW5ndGggPiA4MCAmJiBsaW5rRGVuc2l0eSA8IDAuMjUpIHtcbiAgICAgICAgICAgICAgYXBwZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobm9kZUxlbmd0aCA8IDgwICYmIG5vZGVMZW5ndGggPiAwICYmIGxpbmtEZW5zaXR5ID09PSAwICYmXG4gICAgICAgICAgICAgICAgbm9kZUNvbnRlbnQuc2VhcmNoKC9cXC4oIHwkKS8pICE9PSAtMSkge1xuICAgICAgICAgICAgICBhcHBlbmQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhcHBlbmQpIHtcbiAgICAgICAgICB0aGlzLmxvZyhcIkFwcGVuZGluZyBub2RlOlwiLCBzaWJsaW5nKTtcblxuICAgICAgICAgIGlmICh0aGlzLkFMVEVSX1RPX0RJVl9FWENFUFRJT05TLmluZGV4T2Yoc2libGluZy5ub2RlTmFtZSkgPT09IC0xKSB7XG4gICAgICAgICAgICAvLyBXZSBoYXZlIGEgbm9kZSB0aGF0IGlzbid0IGEgY29tbW9uIGJsb2NrIGxldmVsIGVsZW1lbnQsIGxpa2UgYSBmb3JtIG9yIHRkIHRhZy5cbiAgICAgICAgICAgIC8vIFR1cm4gaXQgaW50byBhIGRpdiBzbyBpdCBkb2Vzbid0IGdldCBmaWx0ZXJlZCBvdXQgbGF0ZXIgYnkgYWNjaWRlbnQuXG4gICAgICAgICAgICB0aGlzLmxvZyhcIkFsdGVyaW5nIHNpYmxpbmc6XCIsIHNpYmxpbmcsICd0byBkaXYuJyk7XG5cbiAgICAgICAgICAgIHNpYmxpbmcgPSB0aGlzLl9zZXROb2RlVGFnKHNpYmxpbmcsIFwiRElWXCIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGFydGljbGVDb250ZW50LmFwcGVuZENoaWxkKHNpYmxpbmcpO1xuICAgICAgICAgIC8vIHNpYmxpbmdzIGlzIGEgcmVmZXJlbmNlIHRvIHRoZSBjaGlsZHJlbiBhcnJheSwgYW5kXG4gICAgICAgICAgLy8gc2libGluZyBpcyByZW1vdmVkIGZyb20gdGhlIGFycmF5IHdoZW4gd2UgY2FsbCBhcHBlbmRDaGlsZCgpLlxuICAgICAgICAgIC8vIEFzIGEgcmVzdWx0LCB3ZSBtdXN0IHJldmlzaXQgdGhpcyBpbmRleCBzaW5jZSB0aGUgbm9kZXNcbiAgICAgICAgICAvLyBoYXZlIGJlZW4gc2hpZnRlZC5cbiAgICAgICAgICBzIC09IDE7XG4gICAgICAgICAgc2wgLT0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fZGVidWcpXG4gICAgICAgIHRoaXMubG9nKFwiQXJ0aWNsZSBjb250ZW50IHByZS1wcmVwOiBcIiArIGFydGljbGVDb250ZW50LmlubmVySFRNTCk7XG4gICAgICAvLyBTbyB3ZSBoYXZlIGFsbCBvZiB0aGUgY29udGVudCB0aGF0IHdlIG5lZWQuIE5vdyB3ZSBjbGVhbiBpdCB1cCBmb3IgcHJlc2VudGF0aW9uLlxuICAgICAgdGhpcy5fcHJlcEFydGljbGUoYXJ0aWNsZUNvbnRlbnQpO1xuICAgICAgaWYgKHRoaXMuX2RlYnVnKVxuICAgICAgICB0aGlzLmxvZyhcIkFydGljbGUgY29udGVudCBwb3N0LXByZXA6IFwiICsgYXJ0aWNsZUNvbnRlbnQuaW5uZXJIVE1MKTtcblxuICAgICAgaWYgKG5lZWRlZFRvQ3JlYXRlVG9wQ2FuZGlkYXRlKSB7XG4gICAgICAgIC8vIFdlIGFscmVhZHkgY3JlYXRlZCBhIGZha2UgZGl2IHRoaW5nLCBhbmQgdGhlcmUgd291bGRuJ3QgaGF2ZSBiZWVuIGFueSBzaWJsaW5ncyBsZWZ0XG4gICAgICAgIC8vIGZvciB0aGUgcHJldmlvdXMgbG9vcCwgc28gdGhlcmUncyBubyBwb2ludCB0cnlpbmcgdG8gY3JlYXRlIGEgbmV3IGRpdiwgYW5kIHRoZW5cbiAgICAgICAgLy8gbW92ZSBhbGwgdGhlIGNoaWxkcmVuIG92ZXIuIEp1c3QgYXNzaWduIElEcyBhbmQgY2xhc3MgbmFtZXMgaGVyZS4gTm8gbmVlZCB0byBhcHBlbmRcbiAgICAgICAgLy8gYmVjYXVzZSB0aGF0IGFscmVhZHkgaGFwcGVuZWQgYW55d2F5LlxuICAgICAgICB0b3BDYW5kaWRhdGUuaWQgPSBcInJlYWRhYmlsaXR5LXBhZ2UtMVwiO1xuICAgICAgICB0b3BDYW5kaWRhdGUuY2xhc3NOYW1lID0gXCJwYWdlXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZGl2ID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XG4gICAgICAgIGRpdi5pZCA9IFwicmVhZGFiaWxpdHktcGFnZS0xXCI7XG4gICAgICAgIGRpdi5jbGFzc05hbWUgPSBcInBhZ2VcIjtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gYXJ0aWNsZUNvbnRlbnQuY2hpbGROb2RlcztcbiAgICAgICAgd2hpbGUgKGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgIGRpdi5hcHBlbmRDaGlsZChjaGlsZHJlblswXSk7XG4gICAgICAgIH1cbiAgICAgICAgYXJ0aWNsZUNvbnRlbnQuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX2RlYnVnKVxuICAgICAgICB0aGlzLmxvZyhcIkFydGljbGUgY29udGVudCBhZnRlciBwYWdpbmc6IFwiICsgYXJ0aWNsZUNvbnRlbnQuaW5uZXJIVE1MKTtcblxuICAgICAgdmFyIHBhcnNlU3VjY2Vzc2Z1bCA9IHRydWU7XG5cbiAgICAgIC8vIE5vdyB0aGF0IHdlJ3ZlIGdvbmUgdGhyb3VnaCB0aGUgZnVsbCBhbGdvcml0aG0sIGNoZWNrIHRvIHNlZSBpZlxuICAgICAgLy8gd2UgZ290IGFueSBtZWFuaW5nZnVsIGNvbnRlbnQuIElmIHdlIGRpZG4ndCwgd2UgbWF5IG5lZWQgdG8gcmUtcnVuXG4gICAgICAvLyBncmFiQXJ0aWNsZSB3aXRoIGRpZmZlcmVudCBmbGFncyBzZXQuIFRoaXMgZ2l2ZXMgdXMgYSBoaWdoZXIgbGlrZWxpaG9vZCBvZlxuICAgICAgLy8gZmluZGluZyB0aGUgY29udGVudCwgYW5kIHRoZSBzaWV2ZSBhcHByb2FjaCBnaXZlcyB1cyBhIGhpZ2hlciBsaWtlbGlob29kIG9mXG4gICAgICAvLyBmaW5kaW5nIHRoZSAtcmlnaHQtIGNvbnRlbnQuXG4gICAgICB2YXIgdGV4dExlbmd0aCA9IHRoaXMuX2dldElubmVyVGV4dChhcnRpY2xlQ29udGVudCwgdHJ1ZSkubGVuZ3RoO1xuICAgICAgaWYgKHRleHRMZW5ndGggPCB0aGlzLl9jaGFyVGhyZXNob2xkKSB7XG4gICAgICAgIHBhcnNlU3VjY2Vzc2Z1bCA9IGZhbHNlO1xuICAgICAgICBwYWdlLmlubmVySFRNTCA9IHBhZ2VDYWNoZUh0bWw7XG5cbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdJc0FjdGl2ZSh0aGlzLkZMQUdfU1RSSVBfVU5MSUtFTFlTKSkge1xuICAgICAgICAgIHRoaXMuX3JlbW92ZUZsYWcodGhpcy5GTEFHX1NUUklQX1VOTElLRUxZUyk7XG4gICAgICAgICAgdGhpcy5fYXR0ZW1wdHMucHVzaCh7YXJ0aWNsZUNvbnRlbnQ6IGFydGljbGVDb250ZW50LCB0ZXh0TGVuZ3RoOiB0ZXh0TGVuZ3RofSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fZmxhZ0lzQWN0aXZlKHRoaXMuRkxBR19XRUlHSFRfQ0xBU1NFUykpIHtcbiAgICAgICAgICB0aGlzLl9yZW1vdmVGbGFnKHRoaXMuRkxBR19XRUlHSFRfQ0xBU1NFUyk7XG4gICAgICAgICAgdGhpcy5fYXR0ZW1wdHMucHVzaCh7YXJ0aWNsZUNvbnRlbnQ6IGFydGljbGVDb250ZW50LCB0ZXh0TGVuZ3RoOiB0ZXh0TGVuZ3RofSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fZmxhZ0lzQWN0aXZlKHRoaXMuRkxBR19DTEVBTl9DT05ESVRJT05BTExZKSkge1xuICAgICAgICAgIHRoaXMuX3JlbW92ZUZsYWcodGhpcy5GTEFHX0NMRUFOX0NPTkRJVElPTkFMTFkpO1xuICAgICAgICAgIHRoaXMuX2F0dGVtcHRzLnB1c2goe2FydGljbGVDb250ZW50OiBhcnRpY2xlQ29udGVudCwgdGV4dExlbmd0aDogdGV4dExlbmd0aH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX2F0dGVtcHRzLnB1c2goe2FydGljbGVDb250ZW50OiBhcnRpY2xlQ29udGVudCwgdGV4dExlbmd0aDogdGV4dExlbmd0aH0pO1xuICAgICAgICAgIC8vIE5vIGx1Y2sgYWZ0ZXIgcmVtb3ZpbmcgZmxhZ3MsIGp1c3QgcmV0dXJuIHRoZSBsb25nZXN0IHRleHQgd2UgZm91bmQgZHVyaW5nIHRoZSBkaWZmZXJlbnQgbG9vcHNcbiAgICAgICAgICB0aGlzLl9hdHRlbXB0cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYS50ZXh0TGVuZ3RoIDwgYi50ZXh0TGVuZ3RoO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gQnV0IGZpcnN0IGNoZWNrIGlmIHdlIGFjdHVhbGx5IGhhdmUgc29tZXRoaW5nXG4gICAgICAgICAgaWYgKCF0aGlzLl9hdHRlbXB0c1swXS50ZXh0TGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhcnRpY2xlQ29udGVudCA9IHRoaXMuX2F0dGVtcHRzWzBdLmFydGljbGVDb250ZW50O1xuICAgICAgICAgIHBhcnNlU3VjY2Vzc2Z1bCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHBhcnNlU3VjY2Vzc2Z1bCkge1xuICAgICAgICAvLyBGaW5kIG91dCB0ZXh0IGRpcmVjdGlvbiBmcm9tIGFuY2VzdG9ycyBvZiBmaW5hbCB0b3AgY2FuZGlkYXRlLlxuICAgICAgICB2YXIgYW5jZXN0b3JzID0gW3BhcmVudE9mVG9wQ2FuZGlkYXRlLCB0b3BDYW5kaWRhdGVdLmNvbmNhdCh0aGlzLl9nZXROb2RlQW5jZXN0b3JzKHBhcmVudE9mVG9wQ2FuZGlkYXRlKSk7XG4gICAgICAgIHRoaXMuX3NvbWVOb2RlKGFuY2VzdG9ycywgZnVuY3Rpb24oYW5jZXN0b3IpIHtcbiAgICAgICAgICBpZiAoIWFuY2VzdG9yLnRhZ05hbWUpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgdmFyIGFydGljbGVEaXIgPSBhbmNlc3Rvci5nZXRBdHRyaWJ1dGUoXCJkaXJcIik7XG4gICAgICAgICAgaWYgKGFydGljbGVEaXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2FydGljbGVEaXIgPSBhcnRpY2xlRGlyO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBhcnRpY2xlQ29udGVudDtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhlIGlucHV0IHN0cmluZyBjb3VsZCBiZSBhIGJ5bGluZS5cbiAgICogVGhpcyB2ZXJpZmllcyB0aGF0IHRoZSBpbnB1dCBpcyBhIHN0cmluZywgYW5kIHRoYXQgdGhlIGxlbmd0aFxuICAgKiBpcyBsZXNzIHRoYW4gMTAwIGNoYXJzLlxuICAgKlxuICAgKiBAcGFyYW0gcG9zc2libGVCeWxpbmUge3N0cmluZ30gLSBhIHN0cmluZyB0byBjaGVjayB3aGV0aGVyIGl0cyBhIGJ5bGluZS5cbiAgICogQHJldHVybiBCb29sZWFuIC0gd2hldGhlciB0aGUgaW5wdXQgc3RyaW5nIGlzIGEgYnlsaW5lLlxuICAgKi9cbiAgX2lzVmFsaWRCeWxpbmU6IGZ1bmN0aW9uKGJ5bGluZSkge1xuICAgIGlmICh0eXBlb2YgYnlsaW5lID09ICdzdHJpbmcnIHx8IGJ5bGluZSBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgYnlsaW5lID0gYnlsaW5lLnRyaW0oKTtcbiAgICAgIHJldHVybiAoYnlsaW5lLmxlbmd0aCA+IDApICYmIChieWxpbmUubGVuZ3RoIDwgMTAwKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byBnZXQgZXhjZXJwdCBhbmQgYnlsaW5lIG1ldGFkYXRhIGZvciB0aGUgYXJ0aWNsZS5cbiAgICpcbiAgICogQHJldHVybiBPYmplY3Qgd2l0aCBvcHRpb25hbCBcImV4Y2VycHRcIiBhbmQgXCJieWxpbmVcIiBwcm9wZXJ0aWVzXG4gICAqL1xuICBfZ2V0QXJ0aWNsZU1ldGFkYXRhOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWV0YWRhdGEgPSB7fTtcbiAgICB2YXIgdmFsdWVzID0ge307XG4gICAgdmFyIG1ldGFFbGVtZW50cyA9IHRoaXMuX2RvYy5nZXRFbGVtZW50c0J5VGFnTmFtZShcIm1ldGFcIik7XG5cbiAgICAvLyBNYXRjaCBcImRlc2NyaXB0aW9uXCIsIG9yIFR3aXR0ZXIncyBcInR3aXR0ZXI6ZGVzY3JpcHRpb25cIiAoQ2FyZHMpXG4gICAgLy8gaW4gbmFtZSBhdHRyaWJ1dGUuXG4gICAgdmFyIG5hbWVQYXR0ZXJuID0gL15cXHMqKCh0d2l0dGVyKVxccyo6XFxzKik/KGRlc2NyaXB0aW9ufHRpdGxlKVxccyokL2dpO1xuXG4gICAgLy8gTWF0Y2ggRmFjZWJvb2sncyBPcGVuIEdyYXBoIHRpdGxlICYgZGVzY3JpcHRpb24gcHJvcGVydGllcy5cbiAgICB2YXIgcHJvcGVydHlQYXR0ZXJuID0gL15cXHMqb2dcXHMqOlxccyooZGVzY3JpcHRpb258dGl0bGUpXFxzKiQvZ2k7XG5cbiAgICAvLyBGaW5kIGRlc2NyaXB0aW9uIHRhZ3MuXG4gICAgdGhpcy5fZm9yRWFjaE5vZGUobWV0YUVsZW1lbnRzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICB2YXIgZWxlbWVudE5hbWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShcIm5hbWVcIik7XG4gICAgICB2YXIgZWxlbWVudFByb3BlcnR5ID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJwcm9wZXJ0eVwiKTtcblxuICAgICAgaWYgKFtlbGVtZW50TmFtZSwgZWxlbWVudFByb3BlcnR5XS5pbmRleE9mKFwiYXV0aG9yXCIpICE9PSAtMSkge1xuICAgICAgICBtZXRhZGF0YS5ieWxpbmUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShcImNvbnRlbnRcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIG5hbWUgPSBudWxsO1xuICAgICAgaWYgKG5hbWVQYXR0ZXJuLnRlc3QoZWxlbWVudE5hbWUpKSB7XG4gICAgICAgIG5hbWUgPSBlbGVtZW50TmFtZTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcGVydHlQYXR0ZXJuLnRlc3QoZWxlbWVudFByb3BlcnR5KSkge1xuICAgICAgICBuYW1lID0gZWxlbWVudFByb3BlcnR5O1xuICAgICAgfVxuXG4gICAgICBpZiAobmFtZSkge1xuICAgICAgICB2YXIgY29udGVudCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiY29udGVudFwiKTtcbiAgICAgICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgICAvLyBDb252ZXJ0IHRvIGxvd2VyY2FzZSBhbmQgcmVtb3ZlIGFueSB3aGl0ZXNwYWNlXG4gICAgICAgICAgLy8gc28gd2UgY2FuIG1hdGNoIGJlbG93LlxuICAgICAgICAgIG5hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzL2csICcnKTtcbiAgICAgICAgICB2YWx1ZXNbbmFtZV0gPSBjb250ZW50LnRyaW0oKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKFwiZGVzY3JpcHRpb25cIiBpbiB2YWx1ZXMpIHtcbiAgICAgIG1ldGFkYXRhLmV4Y2VycHQgPSB2YWx1ZXNbXCJkZXNjcmlwdGlvblwiXTtcbiAgICB9IGVsc2UgaWYgKFwib2c6ZGVzY3JpcHRpb25cIiBpbiB2YWx1ZXMpIHtcbiAgICAgIC8vIFVzZSBmYWNlYm9vayBvcGVuIGdyYXBoIGRlc2NyaXB0aW9uLlxuICAgICAgbWV0YWRhdGEuZXhjZXJwdCA9IHZhbHVlc1tcIm9nOmRlc2NyaXB0aW9uXCJdO1xuICAgIH0gZWxzZSBpZiAoXCJ0d2l0dGVyOmRlc2NyaXB0aW9uXCIgaW4gdmFsdWVzKSB7XG4gICAgICAvLyBVc2UgdHdpdHRlciBjYXJkcyBkZXNjcmlwdGlvbi5cbiAgICAgIG1ldGFkYXRhLmV4Y2VycHQgPSB2YWx1ZXNbXCJ0d2l0dGVyOmRlc2NyaXB0aW9uXCJdO1xuICAgIH1cblxuICAgIG1ldGFkYXRhLnRpdGxlID0gdGhpcy5fZ2V0QXJ0aWNsZVRpdGxlKCk7XG4gICAgaWYgKCFtZXRhZGF0YS50aXRsZSkge1xuICAgICAgaWYgKFwib2c6dGl0bGVcIiBpbiB2YWx1ZXMpIHtcbiAgICAgICAgLy8gVXNlIGZhY2Vib29rIG9wZW4gZ3JhcGggdGl0bGUuXG4gICAgICAgIG1ldGFkYXRhLnRpdGxlID0gdmFsdWVzW1wib2c6dGl0bGVcIl07XG4gICAgICB9IGVsc2UgaWYgKFwidHdpdHRlcjp0aXRsZVwiIGluIHZhbHVlcykge1xuICAgICAgICAvLyBVc2UgdHdpdHRlciBjYXJkcyB0aXRsZS5cbiAgICAgICAgbWV0YWRhdGEudGl0bGUgPSB2YWx1ZXNbXCJ0d2l0dGVyOnRpdGxlXCJdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBtZXRhZGF0YTtcbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlcyBzY3JpcHQgdGFncyBmcm9tIHRoZSBkb2N1bWVudC5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICoqL1xuICBfcmVtb3ZlU2NyaXB0czogZnVuY3Rpb24oZG9jKSB7XG4gICAgdGhpcy5fcmVtb3ZlTm9kZXMoZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKSwgZnVuY3Rpb24oc2NyaXB0Tm9kZSkge1xuICAgICAgc2NyaXB0Tm9kZS5ub2RlVmFsdWUgPSBcIlwiO1xuICAgICAgc2NyaXB0Tm9kZS5yZW1vdmVBdHRyaWJ1dGUoJ3NyYycpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgdGhpcy5fcmVtb3ZlTm9kZXMoZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdub3NjcmlwdCcpKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhpcyBub2RlIGhhcyBvbmx5IHdoaXRlc3BhY2UgYW5kIGEgc2luZ2xlIGVsZW1lbnQgd2l0aCBnaXZlbiB0YWdcbiAgICogUmV0dXJucyBmYWxzZSBpZiB0aGUgRElWIG5vZGUgY29udGFpbnMgbm9uLWVtcHR5IHRleHQgbm9kZXNcbiAgICogb3IgaWYgaXQgY29udGFpbnMgbm8gZWxlbWVudCB3aXRoIGdpdmVuIHRhZyBvciBtb3JlIHRoYW4gMSBlbGVtZW50LlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcGFyYW0gc3RyaW5nIHRhZyBvZiBjaGlsZCBlbGVtZW50XG4gICAqKi9cbiAgX2hhc1NpbmdsZVRhZ0luc2lkZUVsZW1lbnQ6IGZ1bmN0aW9uKGVsZW1lbnQsIHRhZykge1xuICAgIC8vIFRoZXJlIHNob3VsZCBiZSBleGFjdGx5IDEgZWxlbWVudCBjaGlsZCB3aXRoIGdpdmVuIHRhZ1xuICAgIGlmIChlbGVtZW50LmNoaWxkcmVuLmxlbmd0aCAhPSAxIHx8IGVsZW1lbnQuY2hpbGRyZW5bMF0udGFnTmFtZSAhPT0gdGFnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gQW5kIHRoZXJlIHNob3VsZCBiZSBubyB0ZXh0IG5vZGVzIHdpdGggcmVhbCBjb250ZW50XG4gICAgcmV0dXJuICF0aGlzLl9zb21lTm9kZShlbGVtZW50LmNoaWxkTm9kZXMsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSB0aGlzLlRFWFRfTk9ERSAmJlxuICAgICAgICAgIHRoaXMuUkVHRVhQUy5oYXNDb250ZW50LnRlc3Qobm9kZS50ZXh0Q29udGVudCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgX2lzRWxlbWVudFdpdGhvdXRDb250ZW50OiBmdW5jdGlvbihub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IHRoaXMuRUxFTUVOVF9OT0RFICYmXG4gICAgICAgIG5vZGUudGV4dENvbnRlbnQudHJpbSgpLmxlbmd0aCA9PSAwICYmXG4gICAgICAgIChub2RlLmNoaWxkcmVuLmxlbmd0aCA9PSAwIHx8XG4gICAgICAgIG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJiclwiKS5sZW5ndGggKyBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaHJcIikubGVuZ3RoKTtcbiAgfSxcblxuICAvKipcbiAgICogRGV0ZXJtaW5lIHdoZXRoZXIgZWxlbWVudCBoYXMgYW55IGNoaWxkcmVuIGJsb2NrIGxldmVsIGVsZW1lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKi9cbiAgX2hhc0NoaWxkQmxvY2tFbGVtZW50OiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgIHJldHVybiB0aGlzLl9zb21lTm9kZShlbGVtZW50LmNoaWxkTm9kZXMsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHJldHVybiB0aGlzLkRJVl9UT19QX0VMRU1TLmluZGV4T2Yobm9kZS50YWdOYW1lKSAhPT0gLTEgfHxcbiAgICAgICAgICB0aGlzLl9oYXNDaGlsZEJsb2NrRWxlbWVudChub2RlKTtcbiAgICB9KTtcbiAgfSxcblxuICAvKioqXG4gICAqIERldGVybWluZSBpZiBhIG5vZGUgcXVhbGlmaWVzIGFzIHBocmFzaW5nIGNvbnRlbnQuXG4gICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0d1aWRlL0hUTUwvQ29udGVudF9jYXRlZ29yaWVzI1BocmFzaW5nX2NvbnRlbnRcbiAgICoqL1xuICBfaXNQaHJhc2luZ0NvbnRlbnQ6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gdGhpcy5URVhUX05PREUgfHwgdGhpcy5QSFJBU0lOR19FTEVNUy5pbmRleE9mKG5vZGUudGFnTmFtZSkgIT09IC0xIHx8XG4gICAgICAgICgobm9kZS50YWdOYW1lID09PSBcIkFcIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiREVMXCIgfHwgbm9kZS50YWdOYW1lID09PSBcIklOU1wiKSAmJlxuICAgICAgICB0aGlzLl9ldmVyeU5vZGUobm9kZS5jaGlsZE5vZGVzLCB0aGlzLl9pc1BocmFzaW5nQ29udGVudCkpO1xuICB9LFxuXG4gIF9pc1doaXRlc3BhY2U6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICByZXR1cm4gKG5vZGUubm9kZVR5cGUgPT09IHRoaXMuVEVYVF9OT0RFICYmIG5vZGUudGV4dENvbnRlbnQudHJpbSgpLmxlbmd0aCA9PT0gMCkgfHxcbiAgICAgICAgKG5vZGUubm9kZVR5cGUgPT09IHRoaXMuRUxFTUVOVF9OT0RFICYmIG5vZGUudGFnTmFtZSA9PT0gXCJCUlwiKTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IHRoZSBpbm5lciB0ZXh0IG9mIGEgbm9kZSAtIGNyb3NzIGJyb3dzZXIgY29tcGF0aWJseS5cbiAgICogVGhpcyBhbHNvIHN0cmlwcyBvdXQgYW55IGV4Y2VzcyB3aGl0ZXNwYWNlIHRvIGJlIGZvdW5kLlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcGFyYW0gQm9vbGVhbiBub3JtYWxpemVTcGFjZXMgKGRlZmF1bHQ6IHRydWUpXG4gICAqIEByZXR1cm4gc3RyaW5nXG4gICAqKi9cbiAgX2dldElubmVyVGV4dDogZnVuY3Rpb24oZSwgbm9ybWFsaXplU3BhY2VzKSB7XG4gICAgbm9ybWFsaXplU3BhY2VzID0gKHR5cGVvZiBub3JtYWxpemVTcGFjZXMgPT09ICd1bmRlZmluZWQnKSA/IHRydWUgOiBub3JtYWxpemVTcGFjZXM7XG4gICAgdmFyIHRleHRDb250ZW50ID0gZS50ZXh0Q29udGVudC50cmltKCk7XG5cbiAgICBpZiAobm9ybWFsaXplU3BhY2VzKSB7XG4gICAgICByZXR1cm4gdGV4dENvbnRlbnQucmVwbGFjZSh0aGlzLlJFR0VYUFMubm9ybWFsaXplLCBcIiBcIik7XG4gICAgfVxuICAgIHJldHVybiB0ZXh0Q29udGVudDtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IHRoZSBudW1iZXIgb2YgdGltZXMgYSBzdHJpbmcgcyBhcHBlYXJzIGluIHRoZSBub2RlIGUuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEBwYXJhbSBzdHJpbmcgLSB3aGF0IHRvIHNwbGl0IG9uLiBEZWZhdWx0IGlzIFwiLFwiXG4gICAqIEByZXR1cm4gbnVtYmVyIChpbnRlZ2VyKVxuICAgKiovXG4gIF9nZXRDaGFyQ291bnQ6IGZ1bmN0aW9uKGUsIHMpIHtcbiAgICBzID0gcyB8fCBcIixcIjtcbiAgICByZXR1cm4gdGhpcy5fZ2V0SW5uZXJUZXh0KGUpLnNwbGl0KHMpLmxlbmd0aCAtIDE7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbW92ZSB0aGUgc3R5bGUgYXR0cmlidXRlIG9uIGV2ZXJ5IGUgYW5kIHVuZGVyLlxuICAgKiBUT0RPOiBUZXN0IGlmIGdldEVsZW1lbnRzQnlUYWdOYW1lKCopIGlzIGZhc3Rlci5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHJldHVybiB2b2lkXG4gICAqKi9cbiAgX2NsZWFuU3R5bGVzOiBmdW5jdGlvbihlKSB7XG4gICAgaWYgKCFlIHx8IGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnc3ZnJylcbiAgICAgIHJldHVybjtcblxuICAgIC8vIFJlbW92ZSBgc3R5bGVgIGFuZCBkZXByZWNhdGVkIHByZXNlbnRhdGlvbmFsIGF0dHJpYnV0ZXNcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuUFJFU0VOVEFUSU9OQUxfQVRUUklCVVRFUy5sZW5ndGg7IGkrKykge1xuICAgICAgZS5yZW1vdmVBdHRyaWJ1dGUodGhpcy5QUkVTRU5UQVRJT05BTF9BVFRSSUJVVEVTW2ldKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5ERVBSRUNBVEVEX1NJWkVfQVRUUklCVVRFX0VMRU1TLmluZGV4T2YoZS50YWdOYW1lKSAhPT0gLTEpIHtcbiAgICAgIGUucmVtb3ZlQXR0cmlidXRlKCd3aWR0aCcpO1xuICAgICAgZS5yZW1vdmVBdHRyaWJ1dGUoJ2hlaWdodCcpO1xuICAgIH1cblxuICAgIHZhciBjdXIgPSBlLmZpcnN0RWxlbWVudENoaWxkO1xuICAgIHdoaWxlIChjdXIgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuX2NsZWFuU3R5bGVzKGN1cik7XG4gICAgICBjdXIgPSBjdXIubmV4dEVsZW1lbnRTaWJsaW5nO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogR2V0IHRoZSBkZW5zaXR5IG9mIGxpbmtzIGFzIGEgcGVyY2VudGFnZSBvZiB0aGUgY29udGVudFxuICAgKiBUaGlzIGlzIHRoZSBhbW91bnQgb2YgdGV4dCB0aGF0IGlzIGluc2lkZSBhIGxpbmsgZGl2aWRlZCBieSB0aGUgdG90YWwgdGV4dCBpbiB0aGUgbm9kZS5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHJldHVybiBudW1iZXIgKGZsb2F0KVxuICAgKiovXG4gIF9nZXRMaW5rRGVuc2l0eTogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIHZhciB0ZXh0TGVuZ3RoID0gdGhpcy5fZ2V0SW5uZXJUZXh0KGVsZW1lbnQpLmxlbmd0aDtcbiAgICBpZiAodGV4dExlbmd0aCA9PT0gMClcbiAgICAgIHJldHVybiAwO1xuXG4gICAgdmFyIGxpbmtMZW5ndGggPSAwO1xuXG4gICAgLy8gWFhYIGltcGxlbWVudCBfcmVkdWNlTm9kZUxpc3Q/XG4gICAgdGhpcy5fZm9yRWFjaE5vZGUoZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImFcIiksIGZ1bmN0aW9uKGxpbmtOb2RlKSB7XG4gICAgICBsaW5rTGVuZ3RoICs9IHRoaXMuX2dldElubmVyVGV4dChsaW5rTm9kZSkubGVuZ3RoO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxpbmtMZW5ndGggLyB0ZXh0TGVuZ3RoO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgYW4gZWxlbWVudHMgY2xhc3MvaWQgd2VpZ2h0LiBVc2VzIHJlZ3VsYXIgZXhwcmVzc2lvbnMgdG8gdGVsbCBpZiB0aGlzXG4gICAqIGVsZW1lbnQgbG9va3MgZ29vZCBvciBiYWQuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEByZXR1cm4gbnVtYmVyIChJbnRlZ2VyKVxuICAgKiovXG4gIF9nZXRDbGFzc1dlaWdodDogZnVuY3Rpb24oZSkge1xuICAgIGlmICghdGhpcy5fZmxhZ0lzQWN0aXZlKHRoaXMuRkxBR19XRUlHSFRfQ0xBU1NFUykpXG4gICAgICByZXR1cm4gMDtcblxuICAgIHZhciB3ZWlnaHQgPSAwO1xuXG4gICAgLy8gTG9vayBmb3IgYSBzcGVjaWFsIGNsYXNzbmFtZVxuICAgIGlmICh0eXBlb2YoZS5jbGFzc05hbWUpID09PSAnc3RyaW5nJyAmJiBlLmNsYXNzTmFtZSAhPT0gJycpIHtcbiAgICAgIGlmICh0aGlzLlJFR0VYUFMubmVnYXRpdmUudGVzdChlLmNsYXNzTmFtZSkpXG4gICAgICAgIHdlaWdodCAtPSAyNTtcblxuICAgICAgaWYgKHRoaXMuUkVHRVhQUy5wb3NpdGl2ZS50ZXN0KGUuY2xhc3NOYW1lKSlcbiAgICAgICAgd2VpZ2h0ICs9IDI1O1xuICAgIH1cblxuICAgIC8vIExvb2sgZm9yIGEgc3BlY2lhbCBJRFxuICAgIGlmICh0eXBlb2YoZS5pZCkgPT09ICdzdHJpbmcnICYmIGUuaWQgIT09ICcnKSB7XG4gICAgICBpZiAodGhpcy5SRUdFWFBTLm5lZ2F0aXZlLnRlc3QoZS5pZCkpXG4gICAgICAgIHdlaWdodCAtPSAyNTtcblxuICAgICAgaWYgKHRoaXMuUkVHRVhQUy5wb3NpdGl2ZS50ZXN0KGUuaWQpKVxuICAgICAgICB3ZWlnaHQgKz0gMjU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHdlaWdodDtcbiAgfSxcblxuICAvKipcbiAgICogQ2xlYW4gYSBub2RlIG9mIGFsbCBlbGVtZW50cyBvZiB0eXBlIFwidGFnXCIuXG4gICAqIChVbmxlc3MgaXQncyBhIHlvdXR1YmUvdmltZW8gdmlkZW8uIFBlb3BsZSBsb3ZlIG1vdmllcy4pXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEBwYXJhbSBzdHJpbmcgdGFnIHRvIGNsZWFuXG4gICAqIEByZXR1cm4gdm9pZFxuICAgKiovXG4gIF9jbGVhbjogZnVuY3Rpb24oZSwgdGFnKSB7XG4gICAgdmFyIGlzRW1iZWQgPSBbXCJvYmplY3RcIiwgXCJlbWJlZFwiLCBcImlmcmFtZVwiXS5pbmRleE9mKHRhZykgIT09IC0xO1xuXG4gICAgdGhpcy5fcmVtb3ZlTm9kZXMoZS5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWcpLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAvLyBBbGxvdyB5b3V0dWJlIGFuZCB2aW1lbyB2aWRlb3MgdGhyb3VnaCBhcyBwZW9wbGUgdXN1YWxseSB3YW50IHRvIHNlZSB0aG9zZS5cbiAgICAgIGlmIChpc0VtYmVkKSB7XG4gICAgICAgIHZhciBhdHRyaWJ1dGVWYWx1ZXMgPSBbXS5tYXAuY2FsbChlbGVtZW50LmF0dHJpYnV0ZXMsIGZ1bmN0aW9uKGF0dHIpIHtcbiAgICAgICAgICByZXR1cm4gYXR0ci52YWx1ZTtcbiAgICAgICAgfSkuam9pbihcInxcIik7XG5cbiAgICAgICAgLy8gRmlyc3QsIGNoZWNrIHRoZSBlbGVtZW50cyBhdHRyaWJ1dGVzIHRvIHNlZSBpZiBhbnkgb2YgdGhlbSBjb250YWluIHlvdXR1YmUgb3IgdmltZW9cbiAgICAgICAgaWYgKHRoaXMuUkVHRVhQUy52aWRlb3MudGVzdChhdHRyaWJ1dGVWYWx1ZXMpKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICAvLyBUaGVuIGNoZWNrIHRoZSBlbGVtZW50cyBpbnNpZGUgdGhpcyBlbGVtZW50IGZvciB0aGUgc2FtZS5cbiAgICAgICAgaWYgKHRoaXMuUkVHRVhQUy52aWRlb3MudGVzdChlbGVtZW50LmlubmVySFRNTCkpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBnaXZlbiBub2RlIGhhcyBvbmUgb2YgaXRzIGFuY2VzdG9yIHRhZyBuYW1lIG1hdGNoaW5nIHRoZVxuICAgKiBwcm92aWRlZCBvbmUuXG4gICAqIEBwYXJhbSAgSFRNTEVsZW1lbnQgbm9kZVxuICAgKiBAcGFyYW0gIFN0cmluZyAgICAgIHRhZ05hbWVcbiAgICogQHBhcmFtICBOdW1iZXIgICAgICBtYXhEZXB0aFxuICAgKiBAcGFyYW0gIEZ1bmN0aW9uICAgIGZpbHRlckZuIGEgZmlsdGVyIHRvIGludm9rZSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIG5vZGUgJ2NvdW50cydcbiAgICogQHJldHVybiBCb29sZWFuXG4gICAqL1xuICBfaGFzQW5jZXN0b3JUYWc6IGZ1bmN0aW9uKG5vZGUsIHRhZ05hbWUsIG1heERlcHRoLCBmaWx0ZXJGbikge1xuICAgIG1heERlcHRoID0gbWF4RGVwdGggfHwgMztcbiAgICB0YWdOYW1lID0gdGFnTmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgIHZhciBkZXB0aCA9IDA7XG4gICAgd2hpbGUgKG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgaWYgKG1heERlcHRoID4gMCAmJiBkZXB0aCA+IG1heERlcHRoKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAobm9kZS5wYXJlbnROb2RlLnRhZ05hbWUgPT09IHRhZ05hbWUgJiYgKCFmaWx0ZXJGbiB8fCBmaWx0ZXJGbihub2RlLnBhcmVudE5vZGUpKSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgZGVwdGgrKztcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYW4gb2JqZWN0IGluZGljYXRpbmcgaG93IG1hbnkgcm93cyBhbmQgY29sdW1ucyB0aGlzIHRhYmxlIGhhcy5cbiAgICovXG4gIF9nZXRSb3dBbmRDb2x1bW5Db3VudDogZnVuY3Rpb24odGFibGUpIHtcbiAgICB2YXIgcm93cyA9IDA7XG4gICAgdmFyIGNvbHVtbnMgPSAwO1xuICAgIHZhciB0cnMgPSB0YWJsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRyXCIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcm93c3BhbiA9IHRyc1tpXS5nZXRBdHRyaWJ1dGUoXCJyb3dzcGFuXCIpIHx8IDA7XG4gICAgICBpZiAocm93c3Bhbikge1xuICAgICAgICByb3dzcGFuID0gcGFyc2VJbnQocm93c3BhbiwgMTApO1xuICAgICAgfVxuICAgICAgcm93cyArPSAocm93c3BhbiB8fCAxKTtcblxuICAgICAgLy8gTm93IGxvb2sgZm9yIGNvbHVtbi1yZWxhdGVkIGluZm9cbiAgICAgIHZhciBjb2x1bW5zSW5UaGlzUm93ID0gMDtcbiAgICAgIHZhciBjZWxscyA9IHRyc1tpXS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRkXCIpO1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjZWxscy5sZW5ndGg7IGorKykge1xuICAgICAgICB2YXIgY29sc3BhbiA9IGNlbGxzW2pdLmdldEF0dHJpYnV0ZShcImNvbHNwYW5cIikgfHwgMDtcbiAgICAgICAgaWYgKGNvbHNwYW4pIHtcbiAgICAgICAgICBjb2xzcGFuID0gcGFyc2VJbnQoY29sc3BhbiwgMTApO1xuICAgICAgICB9XG4gICAgICAgIGNvbHVtbnNJblRoaXNSb3cgKz0gKGNvbHNwYW4gfHwgMSk7XG4gICAgICB9XG4gICAgICBjb2x1bW5zID0gTWF0aC5tYXgoY29sdW1ucywgY29sdW1uc0luVGhpc1Jvdyk7XG4gICAgfVxuICAgIHJldHVybiB7cm93czogcm93cywgY29sdW1uczogY29sdW1uc307XG4gIH0sXG5cbiAgLyoqXG4gICAqIExvb2sgZm9yICdkYXRhJyAoYXMgb3Bwb3NlZCB0byAnbGF5b3V0JykgdGFibGVzLCBmb3Igd2hpY2ggd2UgdXNlXG4gICAqIHNpbWlsYXIgY2hlY2tzIGFzXG4gICAqIGh0dHBzOi8vZHhyLm1vemlsbGEub3JnL21vemlsbGEtY2VudHJhbC9yZXYvNzEyMjQwNDljMGI1MmFiMTkwNTY0ZDNlYTBlYWIwODlhMTU5YTRjZi9hY2Nlc3NpYmxlL2h0bWwvSFRNTFRhYmxlQWNjZXNzaWJsZS5jcHAjOTIwXG4gICAqL1xuICBfbWFya0RhdGFUYWJsZXM6IGZ1bmN0aW9uKHJvb3QpIHtcbiAgICB2YXIgdGFibGVzID0gcm9vdC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRhYmxlXCIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFibGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgdGFibGUgPSB0YWJsZXNbaV07XG4gICAgICB2YXIgcm9sZSA9IHRhYmxlLmdldEF0dHJpYnV0ZShcInJvbGVcIik7XG4gICAgICBpZiAocm9sZSA9PSBcInByZXNlbnRhdGlvblwiKSB7XG4gICAgICAgIHRhYmxlLl9yZWFkYWJpbGl0eURhdGFUYWJsZSA9IGZhbHNlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHZhciBkYXRhdGFibGUgPSB0YWJsZS5nZXRBdHRyaWJ1dGUoXCJkYXRhdGFibGVcIik7XG4gICAgICBpZiAoZGF0YXRhYmxlID09IFwiMFwiKSB7XG4gICAgICAgIHRhYmxlLl9yZWFkYWJpbGl0eURhdGFUYWJsZSA9IGZhbHNlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHZhciBzdW1tYXJ5ID0gdGFibGUuZ2V0QXR0cmlidXRlKFwic3VtbWFyeVwiKTtcbiAgICAgIGlmIChzdW1tYXJ5KSB7XG4gICAgICAgIHRhYmxlLl9yZWFkYWJpbGl0eURhdGFUYWJsZSA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgY2FwdGlvbiA9IHRhYmxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2FwdGlvblwiKVswXTtcbiAgICAgIGlmIChjYXB0aW9uICYmIGNhcHRpb24uY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRhYmxlLl9yZWFkYWJpbGl0eURhdGFUYWJsZSA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgdGFibGUgaGFzIGEgZGVzY2VuZGFudCB3aXRoIGFueSBvZiB0aGVzZSB0YWdzLCBjb25zaWRlciBhIGRhdGEgdGFibGU6XG4gICAgICB2YXIgZGF0YVRhYmxlRGVzY2VuZGFudHMgPSBbXCJjb2xcIiwgXCJjb2xncm91cFwiLCBcInRmb290XCIsIFwidGhlYWRcIiwgXCJ0aFwiXTtcbiAgICAgIHZhciBkZXNjZW5kYW50RXhpc3RzID0gZnVuY3Rpb24odGFnKSB7XG4gICAgICAgIHJldHVybiAhIXRhYmxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZylbMF07XG4gICAgICB9O1xuICAgICAgaWYgKGRhdGFUYWJsZURlc2NlbmRhbnRzLnNvbWUoZGVzY2VuZGFudEV4aXN0cykpIHtcbiAgICAgICAgdGhpcy5sb2coXCJEYXRhIHRhYmxlIGJlY2F1c2UgZm91bmQgZGF0YS15IGRlc2NlbmRhbnRcIik7XG4gICAgICAgIHRhYmxlLl9yZWFkYWJpbGl0eURhdGFUYWJsZSA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBOZXN0ZWQgdGFibGVzIGluZGljYXRlIGEgbGF5b3V0IHRhYmxlOlxuICAgICAgaWYgKHRhYmxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidGFibGVcIilbMF0pIHtcbiAgICAgICAgdGFibGUuX3JlYWRhYmlsaXR5RGF0YVRhYmxlID0gZmFsc2U7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2l6ZUluZm8gPSB0aGlzLl9nZXRSb3dBbmRDb2x1bW5Db3VudCh0YWJsZSk7XG4gICAgICBpZiAoc2l6ZUluZm8ucm93cyA+PSAxMCB8fCBzaXplSW5mby5jb2x1bW5zID4gNCkge1xuICAgICAgICB0YWJsZS5fcmVhZGFiaWxpdHlEYXRhVGFibGUgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8vIE5vdyBqdXN0IGdvIGJ5IHNpemUgZW50aXJlbHk6XG4gICAgICB0YWJsZS5fcmVhZGFiaWxpdHlEYXRhVGFibGUgPSBzaXplSW5mby5yb3dzICogc2l6ZUluZm8uY29sdW1ucyA+IDEwO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQ2xlYW4gYW4gZWxlbWVudCBvZiBhbGwgdGFncyBvZiB0eXBlIFwidGFnXCIgaWYgdGhleSBsb29rIGZpc2h5LlxuICAgKiBcIkZpc2h5XCIgaXMgYW4gYWxnb3JpdGhtIGJhc2VkIG9uIGNvbnRlbnQgbGVuZ3RoLCBjbGFzc25hbWVzLCBsaW5rIGRlbnNpdHksIG51bWJlciBvZiBpbWFnZXMgJiBlbWJlZHMsIGV0Yy5cbiAgICpcbiAgICogQHJldHVybiB2b2lkXG4gICAqKi9cbiAgX2NsZWFuQ29uZGl0aW9uYWxseTogZnVuY3Rpb24oZSwgdGFnKSB7XG4gICAgaWYgKCF0aGlzLl9mbGFnSXNBY3RpdmUodGhpcy5GTEFHX0NMRUFOX0NPTkRJVElPTkFMTFkpKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIGlzTGlzdCA9IHRhZyA9PT0gXCJ1bFwiIHx8IHRhZyA9PT0gXCJvbFwiO1xuXG4gICAgLy8gR2F0aGVyIGNvdW50cyBmb3Igb3RoZXIgdHlwaWNhbCBlbGVtZW50cyBlbWJlZGRlZCB3aXRoaW4uXG4gICAgLy8gVHJhdmVyc2UgYmFja3dhcmRzIHNvIHdlIGNhbiByZW1vdmUgbm9kZXMgYXQgdGhlIHNhbWUgdGltZVxuICAgIC8vIHdpdGhvdXQgZWZmZWN0aW5nIHRoZSB0cmF2ZXJzYWwuXG4gICAgLy9cbiAgICAvLyBUT0RPOiBDb25zaWRlciB0YWtpbmcgaW50byBhY2NvdW50IG9yaWdpbmFsIGNvbnRlbnRTY29yZSBoZXJlLlxuICAgIHRoaXMuX3JlbW92ZU5vZGVzKGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnKSwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgLy8gRmlyc3QgY2hlY2sgaWYgd2UncmUgaW4gYSBkYXRhIHRhYmxlLCBpbiB3aGljaCBjYXNlIGRvbid0IHJlbW92ZSB1cy5cbiAgICAgIHZhciBpc0RhdGFUYWJsZSA9IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIHQuX3JlYWRhYmlsaXR5RGF0YVRhYmxlO1xuICAgICAgfTtcblxuICAgICAgaWYgKHRoaXMuX2hhc0FuY2VzdG9yVGFnKG5vZGUsIFwidGFibGVcIiwgLTEsIGlzRGF0YVRhYmxlKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHZhciB3ZWlnaHQgPSB0aGlzLl9nZXRDbGFzc1dlaWdodChub2RlKTtcbiAgICAgIHZhciBjb250ZW50U2NvcmUgPSAwO1xuXG4gICAgICB0aGlzLmxvZyhcIkNsZWFuaW5nIENvbmRpdGlvbmFsbHlcIiwgbm9kZSk7XG5cbiAgICAgIGlmICh3ZWlnaHQgKyBjb250ZW50U2NvcmUgPCAwKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fZ2V0Q2hhckNvdW50KG5vZGUsICcsJykgPCAxMCkge1xuICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm90IHZlcnkgbWFueSBjb21tYXMsIGFuZCB0aGUgbnVtYmVyIG9mXG4gICAgICAgIC8vIG5vbi1wYXJhZ3JhcGggZWxlbWVudHMgaXMgbW9yZSB0aGFuIHBhcmFncmFwaHMgb3Igb3RoZXJcbiAgICAgICAgLy8gb21pbm91cyBzaWducywgcmVtb3ZlIHRoZSBlbGVtZW50LlxuICAgICAgICB2YXIgcCA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJwXCIpLmxlbmd0aDtcbiAgICAgICAgdmFyIGltZyA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbWdcIikubGVuZ3RoO1xuICAgICAgICB2YXIgbGkgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwibGlcIikubGVuZ3RoIC0gMTAwO1xuICAgICAgICB2YXIgaW5wdXQgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW5wdXRcIikubGVuZ3RoO1xuXG4gICAgICAgIHZhciBlbWJlZENvdW50ID0gMDtcbiAgICAgICAgdmFyIGVtYmVkcyA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJlbWJlZFwiKTtcbiAgICAgICAgZm9yICh2YXIgZWkgPSAwLCBpbCA9IGVtYmVkcy5sZW5ndGg7IGVpIDwgaWw7IGVpICs9IDEpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuUkVHRVhQUy52aWRlb3MudGVzdChlbWJlZHNbZWldLnNyYykpXG4gICAgICAgICAgICBlbWJlZENvdW50ICs9IDE7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGlua0RlbnNpdHkgPSB0aGlzLl9nZXRMaW5rRGVuc2l0eShub2RlKTtcbiAgICAgICAgdmFyIGNvbnRlbnRMZW5ndGggPSB0aGlzLl9nZXRJbm5lclRleHQobm9kZSkubGVuZ3RoO1xuXG4gICAgICAgIHZhciBoYXZlVG9SZW1vdmUgPVxuICAgICAgICAgICAgKGltZyA+IDEgJiYgcCAvIGltZyA8IDAuNSAmJiAhdGhpcy5faGFzQW5jZXN0b3JUYWcobm9kZSwgXCJmaWd1cmVcIikpIHx8XG4gICAgICAgICAgICAoIWlzTGlzdCAmJiBsaSA+IHApIHx8XG4gICAgICAgICAgICAoaW5wdXQgPiBNYXRoLmZsb29yKHAvMykpIHx8XG4gICAgICAgICAgICAoIWlzTGlzdCAmJiBjb250ZW50TGVuZ3RoIDwgMjUgJiYgKGltZyA9PT0gMCB8fCBpbWcgPiAyKSAmJiAhdGhpcy5faGFzQW5jZXN0b3JUYWcobm9kZSwgXCJmaWd1cmVcIikpIHx8XG4gICAgICAgICAgICAoIWlzTGlzdCAmJiB3ZWlnaHQgPCAyNSAmJiBsaW5rRGVuc2l0eSA+IDAuMikgfHxcbiAgICAgICAgICAgICh3ZWlnaHQgPj0gMjUgJiYgbGlua0RlbnNpdHkgPiAwLjUpIHx8XG4gICAgICAgICAgICAoKGVtYmVkQ291bnQgPT09IDEgJiYgY29udGVudExlbmd0aCA8IDc1KSB8fCBlbWJlZENvdW50ID4gMSk7XG4gICAgICAgIHJldHVybiBoYXZlVG9SZW1vdmU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENsZWFuIG91dCBlbGVtZW50cyB3aG9zZSBpZC9jbGFzcyBjb21iaW5hdGlvbnMgbWF0Y2ggc3BlY2lmaWMgc3RyaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcGFyYW0gUmVnRXhwIG1hdGNoIGlkL2NsYXNzIGNvbWJpbmF0aW9uLlxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICoqL1xuICBfY2xlYW5NYXRjaGVkTm9kZXM6IGZ1bmN0aW9uKGUsIHJlZ2V4KSB7XG4gICAgdmFyIGVuZE9mU2VhcmNoTWFya2VyTm9kZSA9IHRoaXMuX2dldE5leHROb2RlKGUsIHRydWUpO1xuICAgIHZhciBuZXh0ID0gdGhpcy5fZ2V0TmV4dE5vZGUoZSk7XG4gICAgd2hpbGUgKG5leHQgJiYgbmV4dCAhPSBlbmRPZlNlYXJjaE1hcmtlck5vZGUpIHtcbiAgICAgIGlmIChyZWdleC50ZXN0KG5leHQuY2xhc3NOYW1lICsgXCIgXCIgKyBuZXh0LmlkKSkge1xuICAgICAgICBuZXh0ID0gdGhpcy5fcmVtb3ZlQW5kR2V0TmV4dChuZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5leHQgPSB0aGlzLl9nZXROZXh0Tm9kZShuZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIENsZWFuIG91dCBzcHVyaW91cyBoZWFkZXJzIGZyb20gYW4gRWxlbWVudC4gQ2hlY2tzIHRoaW5ncyBsaWtlIGNsYXNzbmFtZXMgYW5kIGxpbmsgZGVuc2l0eS5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHJldHVybiB2b2lkXG4gICAqKi9cbiAgX2NsZWFuSGVhZGVyczogZnVuY3Rpb24oZSkge1xuICAgIGZvciAodmFyIGhlYWRlckluZGV4ID0gMTsgaGVhZGVySW5kZXggPCAzOyBoZWFkZXJJbmRleCArPSAxKSB7XG4gICAgICB0aGlzLl9yZW1vdmVOb2RlcyhlLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoJyArIGhlYWRlckluZGV4KSwgZnVuY3Rpb24gKGhlYWRlcikge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0Q2xhc3NXZWlnaHQoaGVhZGVyKSA8IDA7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgX2ZsYWdJc0FjdGl2ZTogZnVuY3Rpb24oZmxhZykge1xuICAgIHJldHVybiAodGhpcy5fZmxhZ3MgJiBmbGFnKSA+IDA7XG4gIH0sXG5cbiAgX3JlbW92ZUZsYWc6IGZ1bmN0aW9uKGZsYWcpIHtcbiAgICB0aGlzLl9mbGFncyA9IHRoaXMuX2ZsYWdzICYgfmZsYWc7XG4gIH0sXG5cbiAgX2lzUHJvYmFibHlWaXNpYmxlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUuc3R5bGUuZGlzcGxheSAhPSBcIm5vbmVcIiAmJiAhbm9kZS5oYXNBdHRyaWJ1dGUoXCJoaWRkZW5cIik7XG4gIH0sXG5cbiAgLyoqXG4gICAqIERlY2lkZXMgd2hldGhlciBvciBub3QgdGhlIGRvY3VtZW50IGlzIHJlYWRlci1hYmxlIHdpdGhvdXQgcGFyc2luZyB0aGUgd2hvbGUgdGhpbmcuXG4gICAqXG4gICAqIEByZXR1cm4gYm9vbGVhbiBXaGV0aGVyIG9yIG5vdCB3ZSBzdXNwZWN0IHBhcnNlKCkgd2lsbCBzdWNlZWVkIGF0IHJldHVybmluZyBhbiBhcnRpY2xlIG9iamVjdC5cbiAgICovXG4gIGlzUHJvYmFibHlSZWFkZXJhYmxlOiBmdW5jdGlvbihoZWxwZXJJc1Zpc2libGUpIHtcbiAgICB2YXIgbm9kZXMgPSB0aGlzLl9nZXRBbGxOb2Rlc1dpdGhUYWcodGhpcy5fZG9jLCBbXCJwXCIsIFwicHJlXCJdKTtcblxuICAgIC8vIEdldCA8ZGl2PiBub2RlcyB3aGljaCBoYXZlIDxicj4gbm9kZShzKSBhbmQgYXBwZW5kIHRoZW0gaW50byB0aGUgYG5vZGVzYCB2YXJpYWJsZS5cbiAgICAvLyBTb21lIGFydGljbGVzJyBET00gc3RydWN0dXJlcyBtaWdodCBsb29rIGxpa2VcbiAgICAvLyA8ZGl2PlxuICAgIC8vICAgU2VudGVuY2VzPGJyPlxuICAgIC8vICAgPGJyPlxuICAgIC8vICAgU2VudGVuY2VzPGJyPlxuICAgIC8vIDwvZGl2PlxuICAgIHZhciBick5vZGVzID0gdGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKHRoaXMuX2RvYywgW1wiZGl2ID4gYnJcIl0pO1xuICAgIGlmIChick5vZGVzLmxlbmd0aCkge1xuICAgICAgdmFyIHNldCA9IG5ldyBTZXQoKTtcbiAgICAgIFtdLmZvckVhY2guY2FsbChick5vZGVzLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHNldC5hZGQobm9kZS5wYXJlbnROb2RlKTtcbiAgICAgIH0pO1xuICAgICAgbm9kZXMgPSBbXS5jb25jYXQuYXBwbHkoQXJyYXkuZnJvbShzZXQpLCBub2Rlcyk7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJJc1Zpc2libGUpIHtcbiAgICAgIGhlbHBlcklzVmlzaWJsZSA9IHRoaXMuX2lzUHJvYmFibHlWaXNpYmxlO1xuICAgIH1cblxuICAgIHZhciBzY29yZSA9IDA7XG4gICAgLy8gVGhpcyBpcyBhIGxpdHRsZSBjaGVla3ksIHdlIHVzZSB0aGUgYWNjdW11bGF0b3IgJ3Njb3JlJyB0byBkZWNpZGUgd2hhdCB0byByZXR1cm4gZnJvbVxuICAgIC8vIHRoaXMgY2FsbGJhY2s6XG4gICAgcmV0dXJuIHRoaXMuX3NvbWVOb2RlKG5vZGVzLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICBpZiAoaGVscGVySXNWaXNpYmxlICYmICFoZWxwZXJJc1Zpc2libGUobm9kZSkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHZhciBtYXRjaFN0cmluZyA9IG5vZGUuY2xhc3NOYW1lICsgXCIgXCIgKyBub2RlLmlkO1xuXG4gICAgICBpZiAodGhpcy5SRUdFWFBTLnVubGlrZWx5Q2FuZGlkYXRlcy50ZXN0KG1hdGNoU3RyaW5nKSAmJlxuICAgICAgICAgICF0aGlzLlJFR0VYUFMub2tNYXliZUl0c0FDYW5kaWRhdGUudGVzdChtYXRjaFN0cmluZykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAobm9kZS5tYXRjaGVzICYmIG5vZGUubWF0Y2hlcyhcImxpIHBcIikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICB2YXIgdGV4dENvbnRlbnRMZW5ndGggPSBub2RlLnRleHRDb250ZW50LnRyaW0oKS5sZW5ndGg7XG4gICAgICBpZiAodGV4dENvbnRlbnRMZW5ndGggPCAxNDApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBzY29yZSArPSBNYXRoLnNxcnQodGV4dENvbnRlbnRMZW5ndGggLSAxNDApO1xuXG4gICAgICBpZiAoc2NvcmUgPiAyMCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogUnVucyByZWFkYWJpbGl0eS5cbiAgICpcbiAgICogV29ya2Zsb3c6XG4gICAqICAxLiBQcmVwIHRoZSBkb2N1bWVudCBieSByZW1vdmluZyBzY3JpcHQgdGFncywgY3NzLCBldGMuXG4gICAqICAyLiBCdWlsZCByZWFkYWJpbGl0eSdzIERPTSB0cmVlLlxuICAgKiAgMy4gR3JhYiB0aGUgYXJ0aWNsZSBjb250ZW50IGZyb20gdGhlIGN1cnJlbnQgZG9tIHRyZWUuXG4gICAqICA0LiBSZXBsYWNlIHRoZSBjdXJyZW50IERPTSB0cmVlIHdpdGggdGhlIG5ldyBvbmUuXG4gICAqICA1LiBSZWFkIHBlYWNlZnVsbHkuXG4gICAqXG4gICAqIEByZXR1cm4gdm9pZFxuICAgKiovXG4gIHBhcnNlOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gQXZvaWQgcGFyc2luZyB0b28gbGFyZ2UgZG9jdW1lbnRzLCBhcyBwZXIgY29uZmlndXJhdGlvbiBvcHRpb25cbiAgICBpZiAodGhpcy5fbWF4RWxlbXNUb1BhcnNlID4gMCkge1xuICAgICAgdmFyIG51bVRhZ3MgPSB0aGlzLl9kb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCIqXCIpLmxlbmd0aDtcbiAgICAgIGlmIChudW1UYWdzID4gdGhpcy5fbWF4RWxlbXNUb1BhcnNlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkFib3J0aW5nIHBhcnNpbmcgZG9jdW1lbnQ7IFwiICsgbnVtVGFncyArIFwiIGVsZW1lbnRzIGZvdW5kXCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlbW92ZSBzY3JpcHQgdGFncyBmcm9tIHRoZSBkb2N1bWVudC5cbiAgICB0aGlzLl9yZW1vdmVTY3JpcHRzKHRoaXMuX2JvZHkpO1xuXG4gICAgdGhpcy5fcHJlcERvY3VtZW50KCk7XG5cbiAgICB2YXIgbWV0YWRhdGEgPSB0aGlzLl9nZXRBcnRpY2xlTWV0YWRhdGEoKTtcbiAgICB0aGlzLl9hcnRpY2xlVGl0bGUgPSBtZXRhZGF0YS50aXRsZTtcblxuICAgIHZhciBhcnRpY2xlQ29udGVudCA9IHRoaXMuX2dyYWJBcnRpY2xlKCk7XG4gICAgaWYgKCFhcnRpY2xlQ29udGVudClcbiAgICAgIHJldHVybiBudWxsO1xuXG4gICAgdGhpcy5sb2coXCJHcmFiYmVkOiBcIiArIGFydGljbGVDb250ZW50LmlubmVySFRNTCk7XG5cbiAgICB0aGlzLl9wb3N0UHJvY2Vzc0NvbnRlbnQoYXJ0aWNsZUNvbnRlbnQpO1xuXG4gICAgLy8gSWYgd2UgaGF2ZW4ndCBmb3VuZCBhbiBleGNlcnB0IGluIHRoZSBhcnRpY2xlJ3MgbWV0YWRhdGEsIHVzZSB0aGUgYXJ0aWNsZSdzXG4gICAgLy8gZmlyc3QgcGFyYWdyYXBoIGFzIHRoZSBleGNlcnB0LiBUaGlzIGlzIHVzZWQgZm9yIGRpc3BsYXlpbmcgYSBwcmV2aWV3IG9mXG4gICAgLy8gdGhlIGFydGljbGUncyBjb250ZW50LlxuICAgIGlmICghbWV0YWRhdGEuZXhjZXJwdCkge1xuICAgICAgdmFyIHBhcmFncmFwaHMgPSBhcnRpY2xlQ29udGVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInBcIik7XG4gICAgICBpZiAocGFyYWdyYXBocy5sZW5ndGggPiAwKSB7XG4gICAgICAgIG1ldGFkYXRhLmV4Y2VycHQgPSBwYXJhZ3JhcGhzWzBdLnRleHRDb250ZW50LnRyaW0oKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgdGV4dENvbnRlbnQgPSBhcnRpY2xlQ29udGVudC50ZXh0Q29udGVudDtcbiAgICByZXR1cm4ge1xuICAgICAgdGl0bGU6IHRoaXMuX2FydGljbGVUaXRsZSxcbiAgICAgIGJ5bGluZTogbWV0YWRhdGEuYnlsaW5lIHx8IHRoaXMuX2FydGljbGVCeWxpbmUsXG4gICAgICBkaXI6IHRoaXMuX2FydGljbGVEaXIsXG4gICAgICBjb250ZW50OiBhcnRpY2xlQ29udGVudC5pbm5lckhUTUwsXG4gICAgICB0ZXh0Q29udGVudDogdGV4dENvbnRlbnQsXG4gICAgICBsZW5ndGg6IHRleHRDb250ZW50Lmxlbmd0aCxcbiAgICAgIGV4Y2VycHQ6IG1ldGFkYXRhLmV4Y2VycHQsXG4gICAgfTtcbiAgfVxufTtcblxuaWYgKHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBSZWFkYWJpbGl0eTtcbn1cbiJdfQ==
