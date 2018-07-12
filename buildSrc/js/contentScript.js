(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var _Readability = require('./lib/Readability');

var _Readability2 = _interopRequireDefault(_Readability);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var addEvents = function addEvents() {
    document.addEventListener('keydown', function (e) {
        if (e.shiftKey && e.keyCode == 13) {
            console.log('asdsda');
            var doc = document;
            var body = doc.body.cloneNode(true);
            var article = new _Readability2.default(doc).parse();
            console.log(article);
            doc.body = body;
        }
    });
};

window.onload = function () {
    addEvents();
};

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
    this._removeNodes(doc.getElementsByTagName("style"));

    if (doc.body) {
      this._replaceBrs(doc.body);
    }

    this._replaceNodeTags(doc.getElementsByTagName("font"), "SPAN");
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
    page = page ? page : this._doc.body;

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
      var node = this._doc.documentElement;

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
    this._removeScripts(this._doc);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXZTcmMvY29udGVudFNjcmlwdC5qcyIsImRldlNyYy9saWIvUmVhZGFiaWxpdHkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBOzs7Ozs7QUFDQSxJQUFNLFlBQVksU0FBWixTQUFZLEdBQU07QUFDcEIsYUFBUyxnQkFBVCxDQUEwQixTQUExQixFQUFxQyxVQUFDLENBQUQsRUFBTztBQUN4QyxZQUFHLEVBQUUsUUFBRixJQUFjLEVBQUUsT0FBRixJQUFhLEVBQTlCLEVBQWtDO0FBQzlCLG9CQUFRLEdBQVIsQ0FBWSxRQUFaO0FBQ0EsZ0JBQUksTUFBTSxRQUFWO0FBQ0EsZ0JBQUksT0FBTyxJQUFJLElBQUosQ0FBUyxTQUFULENBQW1CLElBQW5CLENBQVg7QUFDQSxnQkFBSSxVQUFVLElBQUkscUJBQUosQ0FBZ0IsR0FBaEIsRUFBcUIsS0FBckIsRUFBZDtBQUNBLG9CQUFRLEdBQVIsQ0FBWSxPQUFaO0FBQ0EsZ0JBQUksSUFBSixHQUFXLElBQVg7QUFDSDtBQUNKLEtBVEQ7QUFVSCxDQVhEOztBQWFBLE9BQU8sTUFBUCxHQUFnQixZQUFNO0FBQ2xCO0FBQ0gsQ0FGRDs7Ozs7OztBQ2RBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7Ozs7O0FBS0E7Ozs7O0FBS0EsU0FBUyxXQUFULENBQXFCLEdBQXJCLEVBQTBCLE9BQTFCLEVBQW1DO0FBQ2pDO0FBQ0EsTUFBSSxXQUFXLFFBQVEsZUFBdkIsRUFBd0M7QUFDdEMsVUFBTSxPQUFOO0FBQ0EsY0FBVSxVQUFVLENBQVYsQ0FBVjtBQUNELEdBSEQsTUFHTyxJQUFJLENBQUMsR0FBRCxJQUFRLENBQUMsSUFBSSxlQUFqQixFQUFrQztBQUN2QyxVQUFNLElBQUksS0FBSixDQUFVLHdFQUFWLENBQU47QUFDRDtBQUNELFlBQVUsV0FBVyxFQUFyQjs7QUFFQSxPQUFLLElBQUwsR0FBWSxHQUFaO0FBQ0EsT0FBSyxh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ZjtBQU9MLGVBQVMsU0FBUztBQVBiLEtBQVA7QUFTRDtBQXhyRHFCLENBQXhCOztBQTJyREEsSUFBSSxRQUFPLE1BQVAseUNBQU8sTUFBUCxPQUFrQixRQUF0QixFQUFnQztBQUM5QixTQUFPLE9BQVAsR0FBaUIsV0FBakI7QUFDRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCBSZWFkYWJpbGl0eSBmcm9tICcuL2xpYi9SZWFkYWJpbGl0eSc7XG5jb25zdCBhZGRFdmVudHMgPSAoKSA9PiB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlKSA9PiB7XG4gICAgICAgIGlmKGUuc2hpZnRLZXkgJiYgZS5rZXlDb2RlID09IDEzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYXNkc2RhJylcbiAgICAgICAgICAgIGxldCBkb2MgPSBkb2N1bWVudDtcbiAgICAgICAgICAgIGxldCBib2R5ID0gZG9jLmJvZHkuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgbGV0IGFydGljbGUgPSBuZXcgUmVhZGFiaWxpdHkoZG9jKS5wYXJzZSgpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXJ0aWNsZSlcbiAgICAgICAgICAgIGRvYy5ib2R5ID0gYm9keTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxud2luZG93Lm9ubG9hZCA9ICgpID0+IHtcbiAgICBhZGRFdmVudHMoKTtcbn07IiwiLyplc2xpbnQtZW52IGVzNjpmYWxzZSovXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDEwIEFyYzkwIEluY1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKlxuICogVGhpcyBjb2RlIGlzIGhlYXZpbHkgYmFzZWQgb24gQXJjOTAncyByZWFkYWJpbGl0eS5qcyAoMS43LjEpIHNjcmlwdFxuICogYXZhaWxhYmxlIGF0OiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvYXJjOTBsYWJzLXJlYWRhYmlsaXR5XG4gKi9cblxuLyoqXG4gKiBQdWJsaWMgY29uc3RydWN0b3IuXG4gKiBAcGFyYW0ge0hUTUxEb2N1bWVudH0gZG9jICAgICBUaGUgZG9jdW1lbnQgdG8gcGFyc2UuXG4gKiBAcGFyYW0ge09iamVjdH0gICAgICAgb3B0aW9ucyBUaGUgb3B0aW9ucyBvYmplY3QuXG4gKi9cbmZ1bmN0aW9uIFJlYWRhYmlsaXR5KGRvYywgb3B0aW9ucykge1xuICAvLyBJbiBzb21lIG9sZGVyIHZlcnNpb25zLCBwZW9wbGUgcGFzc2VkIGEgVVJJIGFzIHRoZSBmaXJzdCBhcmd1bWVudC4gQ29wZTpcbiAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5kb2N1bWVudEVsZW1lbnQpIHtcbiAgICBkb2MgPSBvcHRpb25zO1xuICAgIG9wdGlvbnMgPSBhcmd1bWVudHNbMl07XG4gIH0gZWxzZSBpZiAoIWRvYyB8fCAhZG9jLmRvY3VtZW50RWxlbWVudCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IGFyZ3VtZW50IHRvIFJlYWRhYmlsaXR5IGNvbnN0cnVjdG9yIHNob3VsZCBiZSBhIGRvY3VtZW50IG9iamVjdC5cIik7XG4gIH1cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgdGhpcy5fZG9jID0gZG9jO1xuICB0aGlzLl9hcnRpY2xlVGl0bGUgPSBudWxsO1xuICB0aGlzLl9hcnRpY2xlQnlsaW5lID0gbnVsbDtcbiAgdGhpcy5fYXJ0aWNsZURpciA9IG51bGw7XG4gIHRoaXMuX2F0dGVtcHRzID0gW107XG5cbiAgLy8gQ29uZmlndXJhYmxlIG9wdGlvbnNcbiAgdGhpcy5fZGVidWcgPSAhIW9wdGlvbnMuZGVidWc7XG4gIHRoaXMuX21heEVsZW1zVG9QYXJzZSA9IG9wdGlvbnMubWF4RWxlbXNUb1BhcnNlIHx8IHRoaXMuREVGQVVMVF9NQVhfRUxFTVNfVE9fUEFSU0U7XG4gIHRoaXMuX25iVG9wQ2FuZGlkYXRlcyA9IG9wdGlvbnMubmJUb3BDYW5kaWRhdGVzIHx8IHRoaXMuREVGQVVMVF9OX1RPUF9DQU5ESURBVEVTO1xuICB0aGlzLl9jaGFyVGhyZXNob2xkID0gb3B0aW9ucy5jaGFyVGhyZXNob2xkIHx8IHRoaXMuREVGQVVMVF9DSEFSX1RIUkVTSE9MRDtcbiAgdGhpcy5fY2xhc3Nlc1RvUHJlc2VydmUgPSB0aGlzLkNMQVNTRVNfVE9fUFJFU0VSVkUuY29uY2F0KG9wdGlvbnMuY2xhc3Nlc1RvUHJlc2VydmUgfHwgW10pO1xuXG4gIC8vIFN0YXJ0IHdpdGggYWxsIGZsYWdzIHNldFxuICB0aGlzLl9mbGFncyA9IHRoaXMuRkxBR19TVFJJUF9VTkxJS0VMWVMgfFxuICAgICAgICAgICAgICAgIHRoaXMuRkxBR19XRUlHSFRfQ0xBU1NFUyB8XG4gICAgICAgICAgICAgICAgdGhpcy5GTEFHX0NMRUFOX0NPTkRJVElPTkFMTFk7XG5cbiAgdmFyIGxvZ0VsO1xuXG4gIC8vIENvbnRyb2wgd2hldGhlciBsb2cgbWVzc2FnZXMgYXJlIHNlbnQgdG8gdGhlIGNvbnNvbGVcbiAgaWYgKHRoaXMuX2RlYnVnKSB7XG4gICAgbG9nRWwgPSBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgcnYgPSBlLm5vZGVOYW1lICsgXCIgXCI7XG4gICAgICBpZiAoZS5ub2RlVHlwZSA9PSBlLlRFWFRfTk9ERSkge1xuICAgICAgICByZXR1cm4gcnYgKyAnKFwiJyArIGUudGV4dENvbnRlbnQgKyAnXCIpJztcbiAgICAgIH1cbiAgICAgIHZhciBjbGFzc0Rlc2MgPSBlLmNsYXNzTmFtZSAmJiAoXCIuXCIgKyBlLmNsYXNzTmFtZS5yZXBsYWNlKC8gL2csIFwiLlwiKSk7XG4gICAgICB2YXIgZWxEZXNjID0gXCJcIjtcbiAgICAgIGlmIChlLmlkKVxuICAgICAgICBlbERlc2MgPSBcIigjXCIgKyBlLmlkICsgY2xhc3NEZXNjICsgXCIpXCI7XG4gICAgICBlbHNlIGlmIChjbGFzc0Rlc2MpXG4gICAgICAgIGVsRGVzYyA9IFwiKFwiICsgY2xhc3NEZXNjICsgXCIpXCI7XG4gICAgICByZXR1cm4gcnYgKyBlbERlc2M7XG4gICAgfTtcbiAgICB0aGlzLmxvZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0eXBlb2YgZHVtcCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB2YXIgbXNnID0gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKGFyZ3VtZW50cywgZnVuY3Rpb24oeCkge1xuICAgICAgICAgIHJldHVybiAoeCAmJiB4Lm5vZGVOYW1lKSA/IGxvZ0VsKHgpIDogeDtcbiAgICAgICAgfSkuam9pbihcIiBcIik7XG4gICAgICAgIGR1bXAoXCJSZWFkZXI6IChSZWFkYWJpbGl0eSkgXCIgKyBtc2cgKyBcIlxcblwiKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXCJSZWFkZXI6IChSZWFkYWJpbGl0eSkgXCJdLmNvbmNhdChhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmdzKTtcbiAgICAgIH1cbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIHRoaXMubG9nID0gZnVuY3Rpb24gKCkge307XG4gIH1cbn1cblxuUmVhZGFiaWxpdHkucHJvdG90eXBlID0ge1xuICBGTEFHX1NUUklQX1VOTElLRUxZUzogMHgxLFxuICBGTEFHX1dFSUdIVF9DTEFTU0VTOiAweDIsXG4gIEZMQUdfQ0xFQU5fQ09ORElUSU9OQUxMWTogMHg0LFxuXG4gIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlL25vZGVUeXBlXG4gIEVMRU1FTlRfTk9ERTogMSxcbiAgVEVYVF9OT0RFOiAzLFxuXG4gIC8vIE1heCBudW1iZXIgb2Ygbm9kZXMgc3VwcG9ydGVkIGJ5IHRoaXMgcGFyc2VyLiBEZWZhdWx0OiAwIChubyBsaW1pdClcbiAgREVGQVVMVF9NQVhfRUxFTVNfVE9fUEFSU0U6IDAsXG5cbiAgLy8gVGhlIG51bWJlciBvZiB0b3AgY2FuZGlkYXRlcyB0byBjb25zaWRlciB3aGVuIGFuYWx5c2luZyBob3dcbiAgLy8gdGlnaHQgdGhlIGNvbXBldGl0aW9uIGlzIGFtb25nIGNhbmRpZGF0ZXMuXG4gIERFRkFVTFRfTl9UT1BfQ0FORElEQVRFUzogNSxcblxuICAvLyBFbGVtZW50IHRhZ3MgdG8gc2NvcmUgYnkgZGVmYXVsdC5cbiAgREVGQVVMVF9UQUdTX1RPX1NDT1JFOiBcInNlY3Rpb24saDIsaDMsaDQsaDUsaDYscCx0ZCxwcmVcIi50b1VwcGVyQ2FzZSgpLnNwbGl0KFwiLFwiKSxcblxuICAvLyBUaGUgZGVmYXVsdCBudW1iZXIgb2YgY2hhcnMgYW4gYXJ0aWNsZSBtdXN0IGhhdmUgaW4gb3JkZXIgdG8gcmV0dXJuIGEgcmVzdWx0XG4gIERFRkFVTFRfQ0hBUl9USFJFU0hPTEQ6IDUwMCxcblxuICAvLyBBbGwgb2YgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbnMgaW4gdXNlIHdpdGhpbiByZWFkYWJpbGl0eS5cbiAgLy8gRGVmaW5lZCB1cCBoZXJlIHNvIHdlIGRvbid0IGluc3RhbnRpYXRlIHRoZW0gcmVwZWF0ZWRseSBpbiBsb29wcy5cbiAgUkVHRVhQUzoge1xuICAgIHVubGlrZWx5Q2FuZGlkYXRlczogLy1hZC18YmFubmVyfGJyZWFkY3J1bWJzfGNvbWJ4fGNvbW1lbnR8Y29tbXVuaXR5fGNvdmVyLXdyYXB8ZGlzcXVzfGV4dHJhfGZvb3R8aGVhZGVyfGxlZ2VuZHN8bWVudXxyZWxhdGVkfHJlbWFya3xyZXBsaWVzfHJzc3xzaG91dGJveHxzaWRlYmFyfHNreXNjcmFwZXJ8c29jaWFsfHNwb25zb3J8c3VwcGxlbWVudGFsfGFkLWJyZWFrfGFnZWdhdGV8cGFnaW5hdGlvbnxwYWdlcnxwb3B1cHx5b20tcmVtb3RlL2ksXG4gICAgb2tNYXliZUl0c0FDYW5kaWRhdGU6IC9hbmR8YXJ0aWNsZXxib2R5fGNvbHVtbnxtYWlufHNoYWRvdy9pLFxuICAgIHBvc2l0aXZlOiAvYXJ0aWNsZXxib2R5fGNvbnRlbnR8ZW50cnl8aGVudHJ5fGgtZW50cnl8bWFpbnxwYWdlfHBhZ2luYXRpb258cG9zdHx0ZXh0fGJsb2d8c3RvcnkvaSxcbiAgICBuZWdhdGl2ZTogL2hpZGRlbnxeaGlkJHwgaGlkJHwgaGlkIHxeaGlkIHxiYW5uZXJ8Y29tYnh8Y29tbWVudHxjb20tfGNvbnRhY3R8Zm9vdHxmb290ZXJ8Zm9vdG5vdGV8bWFzdGhlYWR8bWVkaWF8bWV0YXxvdXRicmFpbnxwcm9tb3xyZWxhdGVkfHNjcm9sbHxzaGFyZXxzaG91dGJveHxzaWRlYmFyfHNreXNjcmFwZXJ8c3BvbnNvcnxzaG9wcGluZ3x0YWdzfHRvb2x8d2lkZ2V0L2ksXG4gICAgZXh0cmFuZW91czogL3ByaW50fGFyY2hpdmV8Y29tbWVudHxkaXNjdXNzfGVbXFwtXT9tYWlsfHNoYXJlfHJlcGx5fGFsbHxsb2dpbnxzaWdufHNpbmdsZXx1dGlsaXR5L2ksXG4gICAgYnlsaW5lOiAvYnlsaW5lfGF1dGhvcnxkYXRlbGluZXx3cml0dGVuYnl8cC1hdXRob3IvaSxcbiAgICByZXBsYWNlRm9udHM6IC88KFxcLz8pZm9udFtePl0qPi9naSxcbiAgICBub3JtYWxpemU6IC9cXHN7Mix9L2csXG4gICAgdmlkZW9zOiAvXFwvXFwvKHd3d1xcLik/KGRhaWx5bW90aW9ufHlvdXR1YmV8eW91dHViZS1ub2Nvb2tpZXxwbGF5ZXJcXC52aW1lbylcXC5jb20vaSxcbiAgICBuZXh0TGluazogLyhuZXh0fHdlaXRlcnxjb250aW51ZXw+KFteXFx8XXwkKXzCuyhbXlxcfF18JCkpL2ksXG4gICAgcHJldkxpbms6IC8ocHJldnxlYXJsfG9sZHxuZXd8PHzCqykvaSxcbiAgICB3aGl0ZXNwYWNlOiAvXlxccyokLyxcbiAgICBoYXNDb250ZW50OiAvXFxTJC8sXG4gIH0sXG5cbiAgRElWX1RPX1BfRUxFTVM6IFsgXCJBXCIsIFwiQkxPQ0tRVU9URVwiLCBcIkRMXCIsIFwiRElWXCIsIFwiSU1HXCIsIFwiT0xcIiwgXCJQXCIsIFwiUFJFXCIsIFwiVEFCTEVcIiwgXCJVTFwiLCBcIlNFTEVDVFwiIF0sXG5cbiAgQUxURVJfVE9fRElWX0VYQ0VQVElPTlM6IFtcIkRJVlwiLCBcIkFSVElDTEVcIiwgXCJTRUNUSU9OXCIsIFwiUFwiXSxcblxuICBQUkVTRU5UQVRJT05BTF9BVFRSSUJVVEVTOiBbIFwiYWxpZ25cIiwgXCJiYWNrZ3JvdW5kXCIsIFwiYmdjb2xvclwiLCBcImJvcmRlclwiLCBcImNlbGxwYWRkaW5nXCIsIFwiY2VsbHNwYWNpbmdcIiwgXCJmcmFtZVwiLCBcImhzcGFjZVwiLCBcInJ1bGVzXCIsIFwic3R5bGVcIiwgXCJ2YWxpZ25cIiwgXCJ2c3BhY2VcIiBdLFxuXG4gIERFUFJFQ0FURURfU0laRV9BVFRSSUJVVEVfRUxFTVM6IFsgXCJUQUJMRVwiLCBcIlRIXCIsIFwiVERcIiwgXCJIUlwiLCBcIlBSRVwiIF0sXG5cbiAgLy8gVGhlIGNvbW1lbnRlZCBvdXQgZWxlbWVudHMgcXVhbGlmeSBhcyBwaHJhc2luZyBjb250ZW50IGJ1dCB0ZW5kIHRvIGJlXG4gIC8vIHJlbW92ZWQgYnkgcmVhZGFiaWxpdHkgd2hlbiBwdXQgaW50byBwYXJhZ3JhcGhzLCBzbyB3ZSBpZ25vcmUgdGhlbSBoZXJlLlxuICBQSFJBU0lOR19FTEVNUzogW1xuICAgIC8vIFwiQ0FOVkFTXCIsIFwiSUZSQU1FXCIsIFwiU1ZHXCIsIFwiVklERU9cIixcbiAgICBcIkFCQlJcIiwgXCJBVURJT1wiLCBcIkJcIiwgXCJCRE9cIiwgXCJCUlwiLCBcIkJVVFRPTlwiLCBcIkNJVEVcIiwgXCJDT0RFXCIsIFwiREFUQVwiLFxuICAgIFwiREFUQUxJU1RcIiwgXCJERk5cIiwgXCJFTVwiLCBcIkVNQkVEXCIsIFwiSVwiLCBcIklNR1wiLCBcIklOUFVUXCIsIFwiS0JEXCIsIFwiTEFCRUxcIixcbiAgICBcIk1BUktcIiwgXCJNQVRIXCIsIFwiTUVURVJcIiwgXCJOT1NDUklQVFwiLCBcIk9CSkVDVFwiLCBcIk9VVFBVVFwiLCBcIlBST0dSRVNTXCIsIFwiUVwiLFxuICAgIFwiUlVCWVwiLCBcIlNBTVBcIiwgXCJTQ1JJUFRcIiwgXCJTRUxFQ1RcIiwgXCJTTUFMTFwiLCBcIlNQQU5cIiwgXCJTVFJPTkdcIiwgXCJTVUJcIixcbiAgICBcIlNVUFwiLCBcIlRFWFRBUkVBXCIsIFwiVElNRVwiLCBcIlZBUlwiLCBcIldCUlwiXG4gIF0sXG5cbiAgLy8gVGhlc2UgYXJlIHRoZSBjbGFzc2VzIHRoYXQgcmVhZGFiaWxpdHkgc2V0cyBpdHNlbGYuXG4gIENMQVNTRVNfVE9fUFJFU0VSVkU6IFsgXCJwYWdlXCIgXSxcblxuICAvKipcbiAgICogUnVuIGFueSBwb3N0LXByb2Nlc3MgbW9kaWZpY2F0aW9ucyB0byBhcnRpY2xlIGNvbnRlbnQgYXMgbmVjZXNzYXJ5LlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcmV0dXJuIHZvaWRcbiAgKiovXG4gIF9wb3N0UHJvY2Vzc0NvbnRlbnQ6IGZ1bmN0aW9uKGFydGljbGVDb250ZW50KSB7XG4gICAgLy8gUmVhZGFiaWxpdHkgY2Fubm90IG9wZW4gcmVsYXRpdmUgdXJpcyBzbyB3ZSBjb252ZXJ0IHRoZW0gdG8gYWJzb2x1dGUgdXJpcy5cbiAgICB0aGlzLl9maXhSZWxhdGl2ZVVyaXMoYXJ0aWNsZUNvbnRlbnQpO1xuXG4gICAgLy8gUmVtb3ZlIGNsYXNzZXMuXG4gICAgdGhpcy5fY2xlYW5DbGFzc2VzKGFydGljbGVDb250ZW50KTtcbiAgfSxcblxuICAvKipcbiAgICogSXRlcmF0ZXMgb3ZlciBhIE5vZGVMaXN0LCBjYWxscyBgZmlsdGVyRm5gIGZvciBlYWNoIG5vZGUgYW5kIHJlbW92ZXMgbm9kZVxuICAgKiBpZiBmdW5jdGlvbiByZXR1cm5lZCBgdHJ1ZWAuXG4gICAqXG4gICAqIElmIGZ1bmN0aW9uIGlzIG5vdCBwYXNzZWQsIHJlbW92ZXMgYWxsIHRoZSBub2RlcyBpbiBub2RlIGxpc3QuXG4gICAqXG4gICAqIEBwYXJhbSBOb2RlTGlzdCBub2RlTGlzdCBUaGUgbm9kZXMgdG8gb3BlcmF0ZSBvblxuICAgKiBAcGFyYW0gRnVuY3Rpb24gZmlsdGVyRm4gdGhlIGZ1bmN0aW9uIHRvIHVzZSBhcyBhIGZpbHRlclxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICovXG4gIF9yZW1vdmVOb2RlczogZnVuY3Rpb24obm9kZUxpc3QsIGZpbHRlckZuKSB7XG4gICAgZm9yICh2YXIgaSA9IG5vZGVMaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB2YXIgbm9kZSA9IG5vZGVMaXN0W2ldO1xuICAgICAgdmFyIHBhcmVudE5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICBpZiAoIWZpbHRlckZuIHx8IGZpbHRlckZuLmNhbGwodGhpcywgbm9kZSwgaSwgbm9kZUxpc3QpKSB7XG4gICAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogSXRlcmF0ZXMgb3ZlciBhIE5vZGVMaXN0LCBhbmQgY2FsbHMgX3NldE5vZGVUYWcgZm9yIGVhY2ggbm9kZS5cbiAgICpcbiAgICogQHBhcmFtIE5vZGVMaXN0IG5vZGVMaXN0IFRoZSBub2RlcyB0byBvcGVyYXRlIG9uXG4gICAqIEBwYXJhbSBTdHJpbmcgbmV3VGFnTmFtZSB0aGUgbmV3IHRhZyBuYW1lIHRvIHVzZVxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICovXG4gIF9yZXBsYWNlTm9kZVRhZ3M6IGZ1bmN0aW9uKG5vZGVMaXN0LCBuZXdUYWdOYW1lKSB7XG4gICAgZm9yICh2YXIgaSA9IG5vZGVMaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB2YXIgbm9kZSA9IG5vZGVMaXN0W2ldO1xuICAgICAgdGhpcy5fc2V0Tm9kZVRhZyhub2RlLCBuZXdUYWdOYW1lKTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBhIE5vZGVMaXN0LCB3aGljaCBkb2Vzbid0IG5hdGl2ZWx5IGZ1bGx5IGltcGxlbWVudCB0aGUgQXJyYXlcbiAgICogaW50ZXJmYWNlLlxuICAgKlxuICAgKiBGb3IgY29udmVuaWVuY2UsIHRoZSBjdXJyZW50IG9iamVjdCBjb250ZXh0IGlzIGFwcGxpZWQgdG8gdGhlIHByb3ZpZGVkXG4gICAqIGl0ZXJhdGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSAgTm9kZUxpc3Qgbm9kZUxpc3QgVGhlIE5vZGVMaXN0LlxuICAgKiBAcGFyYW0gIEZ1bmN0aW9uIGZuICAgICAgIFRoZSBpdGVyYXRlIGZ1bmN0aW9uLlxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICovXG4gIF9mb3JFYWNoTm9kZTogZnVuY3Rpb24obm9kZUxpc3QsIGZuKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChub2RlTGlzdCwgZm4sIHRoaXMpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgYSBOb2RlTGlzdCwgcmV0dXJuIHRydWUgaWYgYW55IG9mIHRoZSBwcm92aWRlZCBpdGVyYXRlXG4gICAqIGZ1bmN0aW9uIGNhbGxzIHJldHVybnMgdHJ1ZSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKlxuICAgKiBGb3IgY29udmVuaWVuY2UsIHRoZSBjdXJyZW50IG9iamVjdCBjb250ZXh0IGlzIGFwcGxpZWQgdG8gdGhlXG4gICAqIHByb3ZpZGVkIGl0ZXJhdGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSAgTm9kZUxpc3Qgbm9kZUxpc3QgVGhlIE5vZGVMaXN0LlxuICAgKiBAcGFyYW0gIEZ1bmN0aW9uIGZuICAgICAgIFRoZSBpdGVyYXRlIGZ1bmN0aW9uLlxuICAgKiBAcmV0dXJuIEJvb2xlYW5cbiAgICovXG4gIF9zb21lTm9kZTogZnVuY3Rpb24obm9kZUxpc3QsIGZuKSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zb21lLmNhbGwobm9kZUxpc3QsIGZuLCB0aGlzKTtcbiAgfSxcblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGEgTm9kZUxpc3QsIHJldHVybiB0cnVlIGlmIGFsbCBvZiB0aGUgcHJvdmlkZWQgaXRlcmF0ZVxuICAgKiBmdW5jdGlvbiBjYWxscyByZXR1cm4gdHJ1ZSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKlxuICAgKiBGb3IgY29udmVuaWVuY2UsIHRoZSBjdXJyZW50IG9iamVjdCBjb250ZXh0IGlzIGFwcGxpZWQgdG8gdGhlXG4gICAqIHByb3ZpZGVkIGl0ZXJhdGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSAgTm9kZUxpc3Qgbm9kZUxpc3QgVGhlIE5vZGVMaXN0LlxuICAgKiBAcGFyYW0gIEZ1bmN0aW9uIGZuICAgICAgIFRoZSBpdGVyYXRlIGZ1bmN0aW9uLlxuICAgKiBAcmV0dXJuIEJvb2xlYW5cbiAgICovXG4gIF9ldmVyeU5vZGU6IGZ1bmN0aW9uKG5vZGVMaXN0LCBmbikge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuZXZlcnkuY2FsbChub2RlTGlzdCwgZm4sIHRoaXMpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDb25jYXQgYWxsIG5vZGVsaXN0cyBwYXNzZWQgYXMgYXJndW1lbnRzLlxuICAgKlxuICAgKiBAcmV0dXJuIC4uLk5vZGVMaXN0XG4gICAqIEByZXR1cm4gQXJyYXlcbiAgICovXG4gIF9jb25jYXROb2RlTGlzdHM6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICB2YXIgbm9kZUxpc3RzID0gYXJncy5tYXAoZnVuY3Rpb24obGlzdCkge1xuICAgICAgcmV0dXJuIHNsaWNlLmNhbGwobGlzdCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIG5vZGVMaXN0cyk7XG4gIH0sXG5cbiAgX2dldEFsbE5vZGVzV2l0aFRhZzogZnVuY3Rpb24obm9kZSwgdGFnTmFtZXMpIHtcbiAgICBpZiAobm9kZS5xdWVyeVNlbGVjdG9yQWxsKSB7XG4gICAgICByZXR1cm4gbm9kZS5xdWVyeVNlbGVjdG9yQWxsKHRhZ05hbWVzLmpvaW4oJywnKSk7XG4gICAgfVxuICAgIHJldHVybiBbXS5jb25jYXQuYXBwbHkoW10sIHRhZ05hbWVzLm1hcChmdW5jdGlvbih0YWcpIHtcbiAgICAgIHZhciBjb2xsZWN0aW9uID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWcpO1xuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoY29sbGVjdGlvbikgPyBjb2xsZWN0aW9uIDogQXJyYXkuZnJvbShjb2xsZWN0aW9uKTtcbiAgICB9KSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIGNsYXNzPVwiXCIgYXR0cmlidXRlIGZyb20gZXZlcnkgZWxlbWVudCBpbiB0aGUgZ2l2ZW5cbiAgICogc3VidHJlZSwgZXhjZXB0IHRob3NlIHRoYXQgbWF0Y2ggQ0xBU1NFU19UT19QUkVTRVJWRSBhbmRcbiAgICogdGhlIGNsYXNzZXNUb1ByZXNlcnZlIGFycmF5IGZyb20gdGhlIG9wdGlvbnMgb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICovXG4gIF9jbGVhbkNsYXNzZXM6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICB2YXIgY2xhc3Nlc1RvUHJlc2VydmUgPSB0aGlzLl9jbGFzc2VzVG9QcmVzZXJ2ZTtcbiAgICB2YXIgY2xhc3NOYW1lID0gKG5vZGUuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikgfHwgXCJcIilcbiAgICAgIC5zcGxpdCgvXFxzKy8pXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uKGNscykge1xuICAgICAgICByZXR1cm4gY2xhc3Nlc1RvUHJlc2VydmUuaW5kZXhPZihjbHMpICE9IC0xO1xuICAgICAgfSlcbiAgICAgIC5qb2luKFwiIFwiKTtcblxuICAgIGlmIChjbGFzc05hbWUpIHtcbiAgICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgY2xhc3NOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoXCJjbGFzc1wiKTtcbiAgICB9XG5cbiAgICBmb3IgKG5vZGUgPSBub2RlLmZpcnN0RWxlbWVudENoaWxkOyBub2RlOyBub2RlID0gbm9kZS5uZXh0RWxlbWVudFNpYmxpbmcpIHtcbiAgICAgIHRoaXMuX2NsZWFuQ2xhc3Nlcyhub2RlKTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGVhY2ggPGE+IGFuZCA8aW1nPiB1cmkgaW4gdGhlIGdpdmVuIGVsZW1lbnQgdG8gYW4gYWJzb2x1dGUgVVJJLFxuICAgKiBpZ25vcmluZyAjcmVmIFVSSXMuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEByZXR1cm4gdm9pZFxuICAgKi9cbiAgX2ZpeFJlbGF0aXZlVXJpczogZnVuY3Rpb24oYXJ0aWNsZUNvbnRlbnQpIHtcbiAgICB2YXIgYmFzZVVSSSA9IHRoaXMuX2RvYy5iYXNlVVJJO1xuICAgIHZhciBkb2N1bWVudFVSSSA9IHRoaXMuX2RvYy5kb2N1bWVudFVSSTtcbiAgICBmdW5jdGlvbiB0b0Fic29sdXRlVVJJKHVyaSkge1xuICAgICAgLy8gTGVhdmUgaGFzaCBsaW5rcyBhbG9uZSBpZiB0aGUgYmFzZSBVUkkgbWF0Y2hlcyB0aGUgZG9jdW1lbnQgVVJJOlxuICAgICAgaWYgKGJhc2VVUkkgPT0gZG9jdW1lbnRVUkkgJiYgdXJpLmNoYXJBdCgwKSA9PSBcIiNcIikge1xuICAgICAgICByZXR1cm4gdXJpO1xuICAgICAgfVxuICAgICAgLy8gT3RoZXJ3aXNlLCByZXNvbHZlIGFnYWluc3QgYmFzZSBVUkk6XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gbmV3IFVSTCh1cmksIGJhc2VVUkkpLmhyZWY7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAvLyBTb21ldGhpbmcgd2VudCB3cm9uZywganVzdCByZXR1cm4gdGhlIG9yaWdpbmFsOlxuICAgICAgfVxuICAgICAgcmV0dXJuIHVyaTtcbiAgICB9XG5cbiAgICB2YXIgbGlua3MgPSBhcnRpY2xlQ29udGVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImFcIik7XG4gICAgdGhpcy5fZm9yRWFjaE5vZGUobGlua3MsIGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgIHZhciBocmVmID0gbGluay5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpO1xuICAgICAgaWYgKGhyZWYpIHtcbiAgICAgICAgLy8gUmVwbGFjZSBsaW5rcyB3aXRoIGphdmFzY3JpcHQ6IFVSSXMgd2l0aCB0ZXh0IGNvbnRlbnQsIHNpbmNlXG4gICAgICAgIC8vIHRoZXkgd29uJ3Qgd29yayBhZnRlciBzY3JpcHRzIGhhdmUgYmVlbiByZW1vdmVkIGZyb20gdGhlIHBhZ2UuXG4gICAgICAgIGlmIChocmVmLmluZGV4T2YoXCJqYXZhc2NyaXB0OlwiKSA9PT0gMCkge1xuICAgICAgICAgIHZhciB0ZXh0ID0gdGhpcy5fZG9jLmNyZWF0ZVRleHROb2RlKGxpbmsudGV4dENvbnRlbnQpO1xuICAgICAgICAgIGxpbmsucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQodGV4dCwgbGluayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGluay5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIHRvQWJzb2x1dGVVUkkoaHJlZikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgaW1ncyA9IGFydGljbGVDb250ZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW1nXCIpO1xuICAgIHRoaXMuX2ZvckVhY2hOb2RlKGltZ3MsIGZ1bmN0aW9uKGltZykge1xuICAgICAgdmFyIHNyYyA9IGltZy5nZXRBdHRyaWJ1dGUoXCJzcmNcIik7XG4gICAgICBpZiAoc3JjKSB7XG4gICAgICAgIGltZy5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgdG9BYnNvbHV0ZVVSSShzcmMpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IHRoZSBhcnRpY2xlIHRpdGxlIGFzIGFuIEgxLlxuICAgKlxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICoqL1xuICBfZ2V0QXJ0aWNsZVRpdGxlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgZG9jID0gdGhpcy5fZG9jO1xuICAgIHZhciBjdXJUaXRsZSA9IFwiXCI7XG4gICAgdmFyIG9yaWdUaXRsZSA9IFwiXCI7XG5cbiAgICB0cnkge1xuICAgICAgY3VyVGl0bGUgPSBvcmlnVGl0bGUgPSBkb2MudGl0bGUudHJpbSgpO1xuXG4gICAgICAvLyBJZiB0aGV5IGhhZCBhbiBlbGVtZW50IHdpdGggaWQgXCJ0aXRsZVwiIGluIHRoZWlyIEhUTUxcbiAgICAgIGlmICh0eXBlb2YgY3VyVGl0bGUgIT09IFwic3RyaW5nXCIpXG4gICAgICAgIGN1clRpdGxlID0gb3JpZ1RpdGxlID0gdGhpcy5fZ2V0SW5uZXJUZXh0KGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgndGl0bGUnKVswXSk7XG4gICAgfSBjYXRjaCAoZSkgey8qIGlnbm9yZSBleGNlcHRpb25zIHNldHRpbmcgdGhlIHRpdGxlLiAqL31cblxuICAgIHZhciB0aXRsZUhhZEhpZXJhcmNoaWNhbFNlcGFyYXRvcnMgPSBmYWxzZTtcbiAgICBmdW5jdGlvbiB3b3JkQ291bnQoc3RyKSB7XG4gICAgICByZXR1cm4gc3RyLnNwbGl0KC9cXHMrLykubGVuZ3RoO1xuICAgIH1cblxuICAgIC8vIElmIHRoZXJlJ3MgYSBzZXBhcmF0b3IgaW4gdGhlIHRpdGxlLCBmaXJzdCByZW1vdmUgdGhlIGZpbmFsIHBhcnRcbiAgICBpZiAoKC8gW1xcfFxcLVxcXFxcXC8+wrtdIC8pLnRlc3QoY3VyVGl0bGUpKSB7XG4gICAgICB0aXRsZUhhZEhpZXJhcmNoaWNhbFNlcGFyYXRvcnMgPSAvIFtcXFxcXFwvPsK7XSAvLnRlc3QoY3VyVGl0bGUpO1xuICAgICAgY3VyVGl0bGUgPSBvcmlnVGl0bGUucmVwbGFjZSgvKC4qKVtcXHxcXC1cXFxcXFwvPsK7XSAuKi9naSwgJyQxJyk7XG5cbiAgICAgIC8vIElmIHRoZSByZXN1bHRpbmcgdGl0bGUgaXMgdG9vIHNob3J0ICgzIHdvcmRzIG9yIGZld2VyKSwgcmVtb3ZlXG4gICAgICAvLyB0aGUgZmlyc3QgcGFydCBpbnN0ZWFkOlxuICAgICAgaWYgKHdvcmRDb3VudChjdXJUaXRsZSkgPCAzKVxuICAgICAgICBjdXJUaXRsZSA9IG9yaWdUaXRsZS5yZXBsYWNlKC9bXlxcfFxcLVxcXFxcXC8+wrtdKltcXHxcXC1cXFxcXFwvPsK7XSguKikvZ2ksICckMScpO1xuICAgIH0gZWxzZSBpZiAoY3VyVGl0bGUuaW5kZXhPZignOiAnKSAhPT0gLTEpIHtcbiAgICAgIC8vIENoZWNrIGlmIHdlIGhhdmUgYW4gaGVhZGluZyBjb250YWluaW5nIHRoaXMgZXhhY3Qgc3RyaW5nLCBzbyB3ZVxuICAgICAgLy8gY291bGQgYXNzdW1lIGl0J3MgdGhlIGZ1bGwgdGl0bGUuXG4gICAgICB2YXIgaGVhZGluZ3MgPSB0aGlzLl9jb25jYXROb2RlTGlzdHMoXG4gICAgICAgIGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaDEnKSxcbiAgICAgICAgZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoMicpXG4gICAgICApO1xuICAgICAgdmFyIHRyaW1tZWRUaXRsZSA9IGN1clRpdGxlLnRyaW0oKTtcbiAgICAgIHZhciBtYXRjaCA9IHRoaXMuX3NvbWVOb2RlKGhlYWRpbmdzLCBmdW5jdGlvbihoZWFkaW5nKSB7XG4gICAgICAgIHJldHVybiBoZWFkaW5nLnRleHRDb250ZW50LnRyaW0oKSA9PT0gdHJpbW1lZFRpdGxlO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIElmIHdlIGRvbid0LCBsZXQncyBleHRyYWN0IHRoZSB0aXRsZSBvdXQgb2YgdGhlIG9yaWdpbmFsIHRpdGxlIHN0cmluZy5cbiAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgY3VyVGl0bGUgPSBvcmlnVGl0bGUuc3Vic3RyaW5nKG9yaWdUaXRsZS5sYXN0SW5kZXhPZignOicpICsgMSk7XG5cbiAgICAgICAgLy8gSWYgdGhlIHRpdGxlIGlzIG5vdyB0b28gc2hvcnQsIHRyeSB0aGUgZmlyc3QgY29sb24gaW5zdGVhZDpcbiAgICAgICAgaWYgKHdvcmRDb3VudChjdXJUaXRsZSkgPCAzKSB7XG4gICAgICAgICAgY3VyVGl0bGUgPSBvcmlnVGl0bGUuc3Vic3RyaW5nKG9yaWdUaXRsZS5pbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICAvLyBCdXQgaWYgd2UgaGF2ZSB0b28gbWFueSB3b3JkcyBiZWZvcmUgdGhlIGNvbG9uIHRoZXJlJ3Mgc29tZXRoaW5nIHdlaXJkXG4gICAgICAgICAgLy8gd2l0aCB0aGUgdGl0bGVzIGFuZCB0aGUgSCB0YWdzIHNvIGxldCdzIGp1c3QgdXNlIHRoZSBvcmlnaW5hbCB0aXRsZSBpbnN0ZWFkXG4gICAgICAgIH0gZWxzZSBpZiAod29yZENvdW50KG9yaWdUaXRsZS5zdWJzdHIoMCwgb3JpZ1RpdGxlLmluZGV4T2YoJzonKSkpID4gNSkge1xuICAgICAgICAgIGN1clRpdGxlID0gb3JpZ1RpdGxlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjdXJUaXRsZS5sZW5ndGggPiAxNTAgfHwgY3VyVGl0bGUubGVuZ3RoIDwgMTUpIHtcbiAgICAgIHZhciBoT25lcyA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaDEnKTtcblxuICAgICAgaWYgKGhPbmVzLmxlbmd0aCA9PT0gMSlcbiAgICAgICAgY3VyVGl0bGUgPSB0aGlzLl9nZXRJbm5lclRleHQoaE9uZXNbMF0pO1xuICAgIH1cblxuICAgIGN1clRpdGxlID0gY3VyVGl0bGUudHJpbSgpO1xuICAgIC8vIElmIHdlIG5vdyBoYXZlIDQgd29yZHMgb3IgZmV3ZXIgYXMgb3VyIHRpdGxlLCBhbmQgZWl0aGVyIG5vXG4gICAgLy8gJ2hpZXJhcmNoaWNhbCcgc2VwYXJhdG9ycyAoXFwsIC8sID4gb3IgwrspIHdlcmUgZm91bmQgaW4gdGhlIG9yaWdpbmFsXG4gICAgLy8gdGl0bGUgb3Igd2UgZGVjcmVhc2VkIHRoZSBudW1iZXIgb2Ygd29yZHMgYnkgbW9yZSB0aGFuIDEgd29yZCwgdXNlXG4gICAgLy8gdGhlIG9yaWdpbmFsIHRpdGxlLlxuICAgIHZhciBjdXJUaXRsZVdvcmRDb3VudCA9IHdvcmRDb3VudChjdXJUaXRsZSk7XG4gICAgaWYgKGN1clRpdGxlV29yZENvdW50IDw9IDQgJiZcbiAgICAgICAgKCF0aXRsZUhhZEhpZXJhcmNoaWNhbFNlcGFyYXRvcnMgfHxcbiAgICAgICAgIGN1clRpdGxlV29yZENvdW50ICE9IHdvcmRDb3VudChvcmlnVGl0bGUucmVwbGFjZSgvW1xcfFxcLVxcXFxcXC8+wrtdKy9nLCBcIlwiKSkgLSAxKSkge1xuICAgICAgY3VyVGl0bGUgPSBvcmlnVGl0bGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGN1clRpdGxlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBQcmVwYXJlIHRoZSBIVE1MIGRvY3VtZW50IGZvciByZWFkYWJpbGl0eSB0byBzY3JhcGUgaXQuXG4gICAqIFRoaXMgaW5jbHVkZXMgdGhpbmdzIGxpa2Ugc3RyaXBwaW5nIGphdmFzY3JpcHQsIENTUywgYW5kIGhhbmRsaW5nIHRlcnJpYmxlIG1hcmt1cC5cbiAgICpcbiAgICogQHJldHVybiB2b2lkXG4gICAqKi9cbiAgX3ByZXBEb2N1bWVudDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRvYyA9IHRoaXMuX2RvYztcblxuICAgIC8vIFJlbW92ZSBhbGwgc3R5bGUgdGFncyBpbiBoZWFkXG4gICAgdGhpcy5fcmVtb3ZlTm9kZXMoZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3R5bGVcIikpO1xuXG4gICAgaWYgKGRvYy5ib2R5KSB7XG4gICAgICB0aGlzLl9yZXBsYWNlQnJzKGRvYy5ib2R5KTtcbiAgICB9XG5cbiAgICB0aGlzLl9yZXBsYWNlTm9kZVRhZ3MoZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZm9udFwiKSwgXCJTUEFOXCIpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBGaW5kcyB0aGUgbmV4dCBlbGVtZW50LCBzdGFydGluZyBmcm9tIHRoZSBnaXZlbiBub2RlLCBhbmQgaWdub3JpbmdcbiAgICogd2hpdGVzcGFjZSBpbiBiZXR3ZWVuLiBJZiB0aGUgZ2l2ZW4gbm9kZSBpcyBhbiBlbGVtZW50LCB0aGUgc2FtZSBub2RlIGlzXG4gICAqIHJldHVybmVkLlxuICAgKi9cbiAgX25leHRFbGVtZW50OiBmdW5jdGlvbiAobm9kZSkge1xuICAgIHZhciBuZXh0ID0gbm9kZTtcbiAgICB3aGlsZSAobmV4dFxuICAgICAgICAmJiAobmV4dC5ub2RlVHlwZSAhPSB0aGlzLkVMRU1FTlRfTk9ERSlcbiAgICAgICAgJiYgdGhpcy5SRUdFWFBTLndoaXRlc3BhY2UudGVzdChuZXh0LnRleHRDb250ZW50KSkge1xuICAgICAgbmV4dCA9IG5leHQubmV4dFNpYmxpbmc7XG4gICAgfVxuICAgIHJldHVybiBuZXh0O1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXBsYWNlcyAyIG9yIG1vcmUgc3VjY2Vzc2l2ZSA8YnI+IGVsZW1lbnRzIHdpdGggYSBzaW5nbGUgPHA+LlxuICAgKiBXaGl0ZXNwYWNlIGJldHdlZW4gPGJyPiBlbGVtZW50cyBhcmUgaWdub3JlZC4gRm9yIGV4YW1wbGU6XG4gICAqICAgPGRpdj5mb288YnI+YmFyPGJyPiA8YnI+PGJyPmFiYzwvZGl2PlxuICAgKiB3aWxsIGJlY29tZTpcbiAgICogICA8ZGl2PmZvbzxicj5iYXI8cD5hYmM8L3A+PC9kaXY+XG4gICAqL1xuICBfcmVwbGFjZUJyczogZnVuY3Rpb24gKGVsZW0pIHtcbiAgICB0aGlzLl9mb3JFYWNoTm9kZSh0aGlzLl9nZXRBbGxOb2Rlc1dpdGhUYWcoZWxlbSwgW1wiYnJcIl0pLCBmdW5jdGlvbihicikge1xuICAgICAgdmFyIG5leHQgPSBici5uZXh0U2libGluZztcblxuICAgICAgLy8gV2hldGhlciAyIG9yIG1vcmUgPGJyPiBlbGVtZW50cyBoYXZlIGJlZW4gZm91bmQgYW5kIHJlcGxhY2VkIHdpdGggYVxuICAgICAgLy8gPHA+IGJsb2NrLlxuICAgICAgdmFyIHJlcGxhY2VkID0gZmFsc2U7XG5cbiAgICAgIC8vIElmIHdlIGZpbmQgYSA8YnI+IGNoYWluLCByZW1vdmUgdGhlIDxicj5zIHVudGlsIHdlIGhpdCBhbm90aGVyIGVsZW1lbnRcbiAgICAgIC8vIG9yIG5vbi13aGl0ZXNwYWNlLiBUaGlzIGxlYXZlcyBiZWhpbmQgdGhlIGZpcnN0IDxicj4gaW4gdGhlIGNoYWluXG4gICAgICAvLyAod2hpY2ggd2lsbCBiZSByZXBsYWNlZCB3aXRoIGEgPHA+IGxhdGVyKS5cbiAgICAgIHdoaWxlICgobmV4dCA9IHRoaXMuX25leHRFbGVtZW50KG5leHQpKSAmJiAobmV4dC50YWdOYW1lID09IFwiQlJcIikpIHtcbiAgICAgICAgcmVwbGFjZWQgPSB0cnVlO1xuICAgICAgICB2YXIgYnJTaWJsaW5nID0gbmV4dC5uZXh0U2libGluZztcbiAgICAgICAgbmV4dC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5leHQpO1xuICAgICAgICBuZXh0ID0gYnJTaWJsaW5nO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB3ZSByZW1vdmVkIGEgPGJyPiBjaGFpbiwgcmVwbGFjZSB0aGUgcmVtYWluaW5nIDxicj4gd2l0aCBhIDxwPi4gQWRkXG4gICAgICAvLyBhbGwgc2libGluZyBub2RlcyBhcyBjaGlsZHJlbiBvZiB0aGUgPHA+IHVudGlsIHdlIGhpdCBhbm90aGVyIDxicj5cbiAgICAgIC8vIGNoYWluLlxuICAgICAgaWYgKHJlcGxhY2VkKSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5fZG9jLmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xuICAgICAgICBici5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChwLCBicik7XG5cbiAgICAgICAgbmV4dCA9IHAubmV4dFNpYmxpbmc7XG4gICAgICAgIHdoaWxlIChuZXh0KSB7XG4gICAgICAgICAgLy8gSWYgd2UndmUgaGl0IGFub3RoZXIgPGJyPjxicj4sIHdlJ3JlIGRvbmUgYWRkaW5nIGNoaWxkcmVuIHRvIHRoaXMgPHA+LlxuICAgICAgICAgIGlmIChuZXh0LnRhZ05hbWUgPT0gXCJCUlwiKSB7XG4gICAgICAgICAgICB2YXIgbmV4dEVsZW0gPSB0aGlzLl9uZXh0RWxlbWVudChuZXh0Lm5leHRTaWJsaW5nKTtcbiAgICAgICAgICAgIGlmIChuZXh0RWxlbSAmJiBuZXh0RWxlbS50YWdOYW1lID09IFwiQlJcIilcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCF0aGlzLl9pc1BocmFzaW5nQ29udGVudChuZXh0KSkgYnJlYWs7XG5cbiAgICAgICAgICAvLyBPdGhlcndpc2UsIG1ha2UgdGhpcyBub2RlIGEgY2hpbGQgb2YgdGhlIG5ldyA8cD4uXG4gICAgICAgICAgdmFyIHNpYmxpbmcgPSBuZXh0Lm5leHRTaWJsaW5nO1xuICAgICAgICAgIHAuYXBwZW5kQ2hpbGQobmV4dCk7XG4gICAgICAgICAgbmV4dCA9IHNpYmxpbmc7XG4gICAgICAgIH1cblxuICAgICAgICB3aGlsZSAocC5sYXN0Q2hpbGQgJiYgdGhpcy5faXNXaGl0ZXNwYWNlKHAubGFzdENoaWxkKSkgcC5yZW1vdmVDaGlsZChwLmxhc3RDaGlsZCk7XG5cbiAgICAgICAgaWYgKHAucGFyZW50Tm9kZS50YWdOYW1lID09PSBcIlBcIikgdGhpcy5fc2V0Tm9kZVRhZyhwLnBhcmVudE5vZGUsIFwiRElWXCIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIF9zZXROb2RlVGFnOiBmdW5jdGlvbiAobm9kZSwgdGFnKSB7XG4gICAgdGhpcy5sb2coXCJfc2V0Tm9kZVRhZ1wiLCBub2RlLCB0YWcpO1xuICAgIGlmIChub2RlLl9fSlNET01QYXJzZXJfXykge1xuICAgICAgbm9kZS5sb2NhbE5hbWUgPSB0YWcudG9Mb3dlckNhc2UoKTtcbiAgICAgIG5vZGUudGFnTmFtZSA9IHRhZy50b1VwcGVyQ2FzZSgpO1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgdmFyIHJlcGxhY2VtZW50ID0gbm9kZS5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgICB3aGlsZSAobm9kZS5maXJzdENoaWxkKSB7XG4gICAgICByZXBsYWNlbWVudC5hcHBlbmRDaGlsZChub2RlLmZpcnN0Q2hpbGQpO1xuICAgIH1cbiAgICBub2RlLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKHJlcGxhY2VtZW50LCBub2RlKTtcbiAgICBpZiAobm9kZS5yZWFkYWJpbGl0eSlcbiAgICAgIHJlcGxhY2VtZW50LnJlYWRhYmlsaXR5ID0gbm9kZS5yZWFkYWJpbGl0eTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXBsYWNlbWVudC5zZXRBdHRyaWJ1dGUobm9kZS5hdHRyaWJ1dGVzW2ldLm5hbWUsIG5vZGUuYXR0cmlidXRlc1tpXS52YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiByZXBsYWNlbWVudDtcbiAgfSxcblxuICAvKipcbiAgICogUHJlcGFyZSB0aGUgYXJ0aWNsZSBub2RlIGZvciBkaXNwbGF5LiBDbGVhbiBvdXQgYW55IGlubGluZSBzdHlsZXMsXG4gICAqIGlmcmFtZXMsIGZvcm1zLCBzdHJpcCBleHRyYW5lb3VzIDxwPiB0YWdzLCBldGMuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEByZXR1cm4gdm9pZFxuICAgKiovXG4gIF9wcmVwQXJ0aWNsZTogZnVuY3Rpb24oYXJ0aWNsZUNvbnRlbnQpIHtcbiAgICB0aGlzLl9jbGVhblN0eWxlcyhhcnRpY2xlQ29udGVudCk7XG5cbiAgICAvLyBDaGVjayBmb3IgZGF0YSB0YWJsZXMgYmVmb3JlIHdlIGNvbnRpbnVlLCB0byBhdm9pZCByZW1vdmluZyBpdGVtcyBpblxuICAgIC8vIHRob3NlIHRhYmxlcywgd2hpY2ggd2lsbCBvZnRlbiBiZSBpc29sYXRlZCBldmVuIHRob3VnaCB0aGV5J3JlXG4gICAgLy8gdmlzdWFsbHkgbGlua2VkIHRvIG90aGVyIGNvbnRlbnQtZnVsIGVsZW1lbnRzICh0ZXh0LCBpbWFnZXMsIGV0Yy4pLlxuICAgIHRoaXMuX21hcmtEYXRhVGFibGVzKGFydGljbGVDb250ZW50KTtcblxuICAgIC8vIENsZWFuIG91dCBqdW5rIGZyb20gdGhlIGFydGljbGUgY29udGVudFxuICAgIHRoaXMuX2NsZWFuQ29uZGl0aW9uYWxseShhcnRpY2xlQ29udGVudCwgXCJmb3JtXCIpO1xuICAgIHRoaXMuX2NsZWFuQ29uZGl0aW9uYWxseShhcnRpY2xlQ29udGVudCwgXCJmaWVsZHNldFwiKTtcbiAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJvYmplY3RcIik7XG4gICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwiZW1iZWRcIik7XG4gICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwiaDFcIik7XG4gICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwiZm9vdGVyXCIpO1xuICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcImxpbmtcIik7XG4gICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwiYXNpZGVcIik7XG5cbiAgICAvLyBDbGVhbiBvdXQgZWxlbWVudHMgaGF2ZSBcInNoYXJlXCIgaW4gdGhlaXIgaWQvY2xhc3MgY29tYmluYXRpb25zIGZyb20gZmluYWwgdG9wIGNhbmRpZGF0ZXMsXG4gICAgLy8gd2hpY2ggbWVhbnMgd2UgZG9uJ3QgcmVtb3ZlIHRoZSB0b3AgY2FuZGlkYXRlcyBldmVuIHRoZXkgaGF2ZSBcInNoYXJlXCIuXG4gICAgdGhpcy5fZm9yRWFjaE5vZGUoYXJ0aWNsZUNvbnRlbnQuY2hpbGRyZW4sIGZ1bmN0aW9uKHRvcENhbmRpZGF0ZSkge1xuICAgICAgdGhpcy5fY2xlYW5NYXRjaGVkTm9kZXModG9wQ2FuZGlkYXRlLCAvc2hhcmUvKTtcbiAgICB9KTtcblxuICAgIC8vIElmIHRoZXJlIGlzIG9ubHkgb25lIGgyIGFuZCBpdHMgdGV4dCBjb250ZW50IHN1YnN0YW50aWFsbHkgZXF1YWxzIGFydGljbGUgdGl0bGUsXG4gICAgLy8gdGhleSBhcmUgcHJvYmFibHkgdXNpbmcgaXQgYXMgYSBoZWFkZXIgYW5kIG5vdCBhIHN1YmhlYWRlcixcbiAgICAvLyBzbyByZW1vdmUgaXQgc2luY2Ugd2UgYWxyZWFkeSBleHRyYWN0IHRoZSB0aXRsZSBzZXBhcmF0ZWx5LlxuICAgIHZhciBoMiA9IGFydGljbGVDb250ZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoMicpO1xuICAgIGlmIChoMi5sZW5ndGggPT09IDEpIHtcbiAgICAgIHZhciBsZW5ndGhTaW1pbGFyUmF0ZSA9IChoMlswXS50ZXh0Q29udGVudC5sZW5ndGggLSB0aGlzLl9hcnRpY2xlVGl0bGUubGVuZ3RoKSAvIHRoaXMuX2FydGljbGVUaXRsZS5sZW5ndGg7XG4gICAgICBpZiAoTWF0aC5hYnMobGVuZ3RoU2ltaWxhclJhdGUpIDwgMC41KSB7XG4gICAgICAgIHZhciB0aXRsZXNNYXRjaCA9IGZhbHNlO1xuICAgICAgICBpZiAobGVuZ3RoU2ltaWxhclJhdGUgPiAwKSB7XG4gICAgICAgICAgdGl0bGVzTWF0Y2ggPSBoMlswXS50ZXh0Q29udGVudC5pbmNsdWRlcyh0aGlzLl9hcnRpY2xlVGl0bGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRpdGxlc01hdGNoID0gdGhpcy5fYXJ0aWNsZVRpdGxlLmluY2x1ZGVzKGgyWzBdLnRleHRDb250ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGl0bGVzTWF0Y2gpIHtcbiAgICAgICAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJoMlwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcImlmcmFtZVwiKTtcbiAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJpbnB1dFwiKTtcbiAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJ0ZXh0YXJlYVwiKTtcbiAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJzZWxlY3RcIik7XG4gICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwiYnV0dG9uXCIpO1xuICAgIHRoaXMuX2NsZWFuSGVhZGVycyhhcnRpY2xlQ29udGVudCk7XG5cbiAgICAvLyBEbyB0aGVzZSBsYXN0IGFzIHRoZSBwcmV2aW91cyBzdHVmZiBtYXkgaGF2ZSByZW1vdmVkIGp1bmtcbiAgICAvLyB0aGF0IHdpbGwgYWZmZWN0IHRoZXNlXG4gICAgdGhpcy5fY2xlYW5Db25kaXRpb25hbGx5KGFydGljbGVDb250ZW50LCBcInRhYmxlXCIpO1xuICAgIHRoaXMuX2NsZWFuQ29uZGl0aW9uYWxseShhcnRpY2xlQ29udGVudCwgXCJ1bFwiKTtcbiAgICB0aGlzLl9jbGVhbkNvbmRpdGlvbmFsbHkoYXJ0aWNsZUNvbnRlbnQsIFwiZGl2XCIpO1xuXG4gICAgLy8gUmVtb3ZlIGV4dHJhIHBhcmFncmFwaHNcbiAgICB0aGlzLl9yZW1vdmVOb2RlcyhhcnRpY2xlQ29udGVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgncCcpLCBmdW5jdGlvbiAocGFyYWdyYXBoKSB7XG4gICAgICB2YXIgaW1nQ291bnQgPSBwYXJhZ3JhcGguZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltZycpLmxlbmd0aDtcbiAgICAgIHZhciBlbWJlZENvdW50ID0gcGFyYWdyYXBoLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdlbWJlZCcpLmxlbmd0aDtcbiAgICAgIHZhciBvYmplY3RDb3VudCA9IHBhcmFncmFwaC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnb2JqZWN0JykubGVuZ3RoO1xuICAgICAgLy8gQXQgdGhpcyBwb2ludCwgbmFzdHkgaWZyYW1lcyBoYXZlIGJlZW4gcmVtb3ZlZCwgb25seSByZW1haW4gZW1iZWRkZWQgdmlkZW8gb25lcy5cbiAgICAgIHZhciBpZnJhbWVDb3VudCA9IHBhcmFncmFwaC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJykubGVuZ3RoO1xuICAgICAgdmFyIHRvdGFsQ291bnQgPSBpbWdDb3VudCArIGVtYmVkQ291bnQgKyBvYmplY3RDb3VudCArIGlmcmFtZUNvdW50O1xuXG4gICAgICByZXR1cm4gdG90YWxDb3VudCA9PT0gMCAmJiAhdGhpcy5fZ2V0SW5uZXJUZXh0KHBhcmFncmFwaCwgZmFsc2UpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fZm9yRWFjaE5vZGUodGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKGFydGljbGVDb250ZW50LCBbXCJiclwiXSksIGZ1bmN0aW9uKGJyKSB7XG4gICAgICB2YXIgbmV4dCA9IHRoaXMuX25leHRFbGVtZW50KGJyLm5leHRTaWJsaW5nKTtcbiAgICAgIGlmIChuZXh0ICYmIG5leHQudGFnTmFtZSA9PSBcIlBcIilcbiAgICAgICAgYnIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChicik7XG4gICAgfSk7XG5cbiAgICAvLyBSZW1vdmUgc2luZ2xlLWNlbGwgdGFibGVzXG4gICAgdGhpcy5fZm9yRWFjaE5vZGUodGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKGFydGljbGVDb250ZW50LCBbXCJ0YWJsZVwiXSksIGZ1bmN0aW9uKHRhYmxlKSB7XG4gICAgICB2YXIgdGJvZHkgPSB0aGlzLl9oYXNTaW5nbGVUYWdJbnNpZGVFbGVtZW50KHRhYmxlLCBcIlRCT0RZXCIpID8gdGFibGUuZmlyc3RFbGVtZW50Q2hpbGQgOiB0YWJsZTtcbiAgICAgIGlmICh0aGlzLl9oYXNTaW5nbGVUYWdJbnNpZGVFbGVtZW50KHRib2R5LCBcIlRSXCIpKSB7XG4gICAgICAgIHZhciByb3cgPSB0Ym9keS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgaWYgKHRoaXMuX2hhc1NpbmdsZVRhZ0luc2lkZUVsZW1lbnQocm93LCBcIlREXCIpKSB7XG4gICAgICAgICAgdmFyIGNlbGwgPSByb3cuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgY2VsbCA9IHRoaXMuX3NldE5vZGVUYWcoY2VsbCwgdGhpcy5fZXZlcnlOb2RlKGNlbGwuY2hpbGROb2RlcywgdGhpcy5faXNQaHJhc2luZ0NvbnRlbnQpID8gXCJQXCIgOiBcIkRJVlwiKTtcbiAgICAgICAgICB0YWJsZS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChjZWxsLCB0YWJsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBhIG5vZGUgd2l0aCB0aGUgcmVhZGFiaWxpdHkgb2JqZWN0LiBBbHNvIGNoZWNrcyB0aGVcbiAgICogY2xhc3NOYW1lL2lkIGZvciBzcGVjaWFsIG5hbWVzIHRvIGFkZCB0byBpdHMgc2NvcmUuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEByZXR1cm4gdm9pZFxuICAqKi9cbiAgX2luaXRpYWxpemVOb2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgbm9kZS5yZWFkYWJpbGl0eSA9IHtcImNvbnRlbnRTY29yZVwiOiAwfTtcblxuICAgIHN3aXRjaCAobm9kZS50YWdOYW1lKSB7XG4gICAgICBjYXNlICdESVYnOlxuICAgICAgICBub2RlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSArPSA1O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnUFJFJzpcbiAgICAgIGNhc2UgJ1REJzpcbiAgICAgIGNhc2UgJ0JMT0NLUVVPVEUnOlxuICAgICAgICBub2RlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSArPSAzO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnQUREUkVTUyc6XG4gICAgICBjYXNlICdPTCc6XG4gICAgICBjYXNlICdVTCc6XG4gICAgICBjYXNlICdETCc6XG4gICAgICBjYXNlICdERCc6XG4gICAgICBjYXNlICdEVCc6XG4gICAgICBjYXNlICdMSSc6XG4gICAgICBjYXNlICdGT1JNJzpcbiAgICAgICAgbm9kZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgLT0gMztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ0gxJzpcbiAgICAgIGNhc2UgJ0gyJzpcbiAgICAgIGNhc2UgJ0gzJzpcbiAgICAgIGNhc2UgJ0g0JzpcbiAgICAgIGNhc2UgJ0g1JzpcbiAgICAgIGNhc2UgJ0g2JzpcbiAgICAgIGNhc2UgJ1RIJzpcbiAgICAgICAgbm9kZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgLT0gNTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgbm9kZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgKz0gdGhpcy5fZ2V0Q2xhc3NXZWlnaHQobm9kZSk7XG4gIH0sXG5cbiAgX3JlbW92ZUFuZEdldE5leHQ6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICB2YXIgbmV4dE5vZGUgPSB0aGlzLl9nZXROZXh0Tm9kZShub2RlLCB0cnVlKTtcbiAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgcmV0dXJuIG5leHROb2RlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBUcmF2ZXJzZSB0aGUgRE9NIGZyb20gbm9kZSB0byBub2RlLCBzdGFydGluZyBhdCB0aGUgbm9kZSBwYXNzZWQgaW4uXG4gICAqIFBhc3MgdHJ1ZSBmb3IgdGhlIHNlY29uZCBwYXJhbWV0ZXIgdG8gaW5kaWNhdGUgdGhpcyBub2RlIGl0c2VsZlxuICAgKiAoYW5kIGl0cyBraWRzKSBhcmUgZ29pbmcgYXdheSwgYW5kIHdlIHdhbnQgdGhlIG5leHQgbm9kZSBvdmVyLlxuICAgKlxuICAgKiBDYWxsaW5nIHRoaXMgaW4gYSBsb29wIHdpbGwgdHJhdmVyc2UgdGhlIERPTSBkZXB0aC1maXJzdC5cbiAgICovXG4gIF9nZXROZXh0Tm9kZTogZnVuY3Rpb24obm9kZSwgaWdub3JlU2VsZkFuZEtpZHMpIHtcbiAgICAvLyBGaXJzdCBjaGVjayBmb3Iga2lkcyBpZiB0aG9zZSBhcmVuJ3QgYmVpbmcgaWdub3JlZFxuICAgIGlmICghaWdub3JlU2VsZkFuZEtpZHMgJiYgbm9kZS5maXJzdEVsZW1lbnRDaGlsZCkge1xuICAgICAgcmV0dXJuIG5vZGUuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgfVxuICAgIC8vIFRoZW4gZm9yIHNpYmxpbmdzLi4uXG4gICAgaWYgKG5vZGUubmV4dEVsZW1lbnRTaWJsaW5nKSB7XG4gICAgICByZXR1cm4gbm9kZS5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgfVxuICAgIC8vIEFuZCBmaW5hbGx5LCBtb3ZlIHVwIHRoZSBwYXJlbnQgY2hhaW4gKmFuZCogZmluZCBhIHNpYmxpbmdcbiAgICAvLyAoYmVjYXVzZSB0aGlzIGlzIGRlcHRoLWZpcnN0IHRyYXZlcnNhbCwgd2Ugd2lsbCBoYXZlIGFscmVhZHlcbiAgICAvLyBzZWVuIHRoZSBwYXJlbnQgbm9kZXMgdGhlbXNlbHZlcykuXG4gICAgZG8ge1xuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICB9IHdoaWxlIChub2RlICYmICFub2RlLm5leHRFbGVtZW50U2libGluZyk7XG4gICAgcmV0dXJuIG5vZGUgJiYgbm9kZS5uZXh0RWxlbWVudFNpYmxpbmc7XG4gIH0sXG5cbiAgX2NoZWNrQnlsaW5lOiBmdW5jdGlvbihub2RlLCBtYXRjaFN0cmluZykge1xuICAgIGlmICh0aGlzLl9hcnRpY2xlQnlsaW5lKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKG5vZGUuZ2V0QXR0cmlidXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHZhciByZWwgPSBub2RlLmdldEF0dHJpYnV0ZShcInJlbFwiKTtcbiAgICB9XG5cbiAgICBpZiAoKHJlbCA9PT0gXCJhdXRob3JcIiB8fCB0aGlzLlJFR0VYUFMuYnlsaW5lLnRlc3QobWF0Y2hTdHJpbmcpKSAmJiB0aGlzLl9pc1ZhbGlkQnlsaW5lKG5vZGUudGV4dENvbnRlbnQpKSB7XG4gICAgICB0aGlzLl9hcnRpY2xlQnlsaW5lID0gbm9kZS50ZXh0Q29udGVudC50cmltKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgX2dldE5vZGVBbmNlc3RvcnM6IGZ1bmN0aW9uKG5vZGUsIG1heERlcHRoKSB7XG4gICAgbWF4RGVwdGggPSBtYXhEZXB0aCB8fCAwO1xuICAgIHZhciBpID0gMCwgYW5jZXN0b3JzID0gW107XG4gICAgd2hpbGUgKG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgYW5jZXN0b3JzLnB1c2gobm9kZS5wYXJlbnROb2RlKTtcbiAgICAgIGlmIChtYXhEZXB0aCAmJiArK2kgPT09IG1heERlcHRoKVxuICAgICAgICBicmVhaztcbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgfVxuICAgIHJldHVybiBhbmNlc3RvcnM7XG4gIH0sXG5cbiAgLyoqKlxuICAgKiBncmFiQXJ0aWNsZSAtIFVzaW5nIGEgdmFyaWV0eSBvZiBtZXRyaWNzIChjb250ZW50IHNjb3JlLCBjbGFzc25hbWUsIGVsZW1lbnQgdHlwZXMpLCBmaW5kIHRoZSBjb250ZW50IHRoYXQgaXNcbiAgICogICAgICAgICBtb3N0IGxpa2VseSB0byBiZSB0aGUgc3R1ZmYgYSB1c2VyIHdhbnRzIHRvIHJlYWQuIFRoZW4gcmV0dXJuIGl0IHdyYXBwZWQgdXAgaW4gYSBkaXYuXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIGEgZG9jdW1lbnQgdG8gcnVuIHVwb24uIE5lZWRzIHRvIGJlIGEgZnVsbCBkb2N1bWVudCwgY29tcGxldGUgd2l0aCBib2R5LlxuICAgKiBAcmV0dXJuIEVsZW1lbnRcbiAgKiovXG4gIF9ncmFiQXJ0aWNsZTogZnVuY3Rpb24gKHBhZ2UpIHtcbiAgICB0aGlzLmxvZyhcIioqKiogZ3JhYkFydGljbGUgKioqKlwiKTtcbiAgICB2YXIgZG9jID0gdGhpcy5fZG9jO1xuICAgIHZhciBpc1BhZ2luZyA9IChwYWdlICE9PSBudWxsID8gdHJ1ZTogZmFsc2UpO1xuICAgIHBhZ2UgPSBwYWdlID8gcGFnZSA6IHRoaXMuX2RvYy5ib2R5O1xuXG4gICAgLy8gV2UgY2FuJ3QgZ3JhYiBhbiBhcnRpY2xlIGlmIHdlIGRvbid0IGhhdmUgYSBwYWdlIVxuICAgIGlmICghcGFnZSkge1xuICAgICAgdGhpcy5sb2coXCJObyBib2R5IGZvdW5kIGluIGRvY3VtZW50LiBBYm9ydC5cIik7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgcGFnZUNhY2hlSHRtbCA9IHBhZ2UuaW5uZXJIVE1MO1xuXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIHZhciBzdHJpcFVubGlrZWx5Q2FuZGlkYXRlcyA9IHRoaXMuX2ZsYWdJc0FjdGl2ZSh0aGlzLkZMQUdfU1RSSVBfVU5MSUtFTFlTKTtcblxuICAgICAgLy8gRmlyc3QsIG5vZGUgcHJlcHBpbmcuIFRyYXNoIG5vZGVzIHRoYXQgbG9vayBjcnVkZHkgKGxpa2Ugb25lcyB3aXRoIHRoZVxuICAgICAgLy8gY2xhc3MgbmFtZSBcImNvbW1lbnRcIiwgZXRjKSwgYW5kIHR1cm4gZGl2cyBpbnRvIFAgdGFncyB3aGVyZSB0aGV5IGhhdmUgYmVlblxuICAgICAgLy8gdXNlZCBpbmFwcHJvcHJpYXRlbHkgKGFzIGluLCB3aGVyZSB0aGV5IGNvbnRhaW4gbm8gb3RoZXIgYmxvY2sgbGV2ZWwgZWxlbWVudHMuKVxuICAgICAgdmFyIGVsZW1lbnRzVG9TY29yZSA9IFtdO1xuICAgICAgdmFyIG5vZGUgPSB0aGlzLl9kb2MuZG9jdW1lbnRFbGVtZW50O1xuXG4gICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICB2YXIgbWF0Y2hTdHJpbmcgPSBub2RlLmNsYXNzTmFtZSArIFwiIFwiICsgbm9kZS5pZDtcblxuICAgICAgICBpZiAoIXRoaXMuX2lzUHJvYmFibHlWaXNpYmxlKG5vZGUpKSB7XG4gICAgICAgICAgdGhpcy5sb2coXCJSZW1vdmluZyBoaWRkZW4gbm9kZSAtIFwiICsgbWF0Y2hTdHJpbmcpO1xuICAgICAgICAgIG5vZGUgPSB0aGlzLl9yZW1vdmVBbmRHZXROZXh0KG5vZGUpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoaXMgbm9kZSBpcyBhIGJ5bGluZSwgYW5kIHJlbW92ZSBpdCBpZiBpdCBpcy5cbiAgICAgICAgaWYgKHRoaXMuX2NoZWNrQnlsaW5lKG5vZGUsIG1hdGNoU3RyaW5nKSkge1xuICAgICAgICAgIG5vZGUgPSB0aGlzLl9yZW1vdmVBbmRHZXROZXh0KG5vZGUpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHVubGlrZWx5IGNhbmRpZGF0ZXNcbiAgICAgICAgaWYgKHN0cmlwVW5saWtlbHlDYW5kaWRhdGVzKSB7XG4gICAgICAgICAgaWYgKHRoaXMuUkVHRVhQUy51bmxpa2VseUNhbmRpZGF0ZXMudGVzdChtYXRjaFN0cmluZykgJiZcbiAgICAgICAgICAgICAgIXRoaXMuUkVHRVhQUy5va01heWJlSXRzQUNhbmRpZGF0ZS50ZXN0KG1hdGNoU3RyaW5nKSAmJlxuICAgICAgICAgICAgICBub2RlLnRhZ05hbWUgIT09IFwiQk9EWVwiICYmXG4gICAgICAgICAgICAgIG5vZGUudGFnTmFtZSAhPT0gXCJBXCIpIHtcbiAgICAgICAgICAgIHRoaXMubG9nKFwiUmVtb3ZpbmcgdW5saWtlbHkgY2FuZGlkYXRlIC0gXCIgKyBtYXRjaFN0cmluZyk7XG4gICAgICAgICAgICBub2RlID0gdGhpcy5fcmVtb3ZlQW5kR2V0TmV4dChub2RlKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSBESVYsIFNFQ1RJT04sIGFuZCBIRUFERVIgbm9kZXMgd2l0aG91dCBhbnkgY29udGVudChlLmcuIHRleHQsIGltYWdlLCB2aWRlbywgb3IgaWZyYW1lKS5cbiAgICAgICAgaWYgKChub2RlLnRhZ05hbWUgPT09IFwiRElWXCIgfHwgbm9kZS50YWdOYW1lID09PSBcIlNFQ1RJT05cIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiSEVBREVSXCIgfHxcbiAgICAgICAgICAgICBub2RlLnRhZ05hbWUgPT09IFwiSDFcIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiSDJcIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiSDNcIiB8fFxuICAgICAgICAgICAgIG5vZGUudGFnTmFtZSA9PT0gXCJINFwiIHx8IG5vZGUudGFnTmFtZSA9PT0gXCJINVwiIHx8IG5vZGUudGFnTmFtZSA9PT0gXCJINlwiKSAmJlxuICAgICAgICAgICAgdGhpcy5faXNFbGVtZW50V2l0aG91dENvbnRlbnQobm9kZSkpIHtcbiAgICAgICAgICBub2RlID0gdGhpcy5fcmVtb3ZlQW5kR2V0TmV4dChub2RlKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLkRFRkFVTFRfVEFHU19UT19TQ09SRS5pbmRleE9mKG5vZGUudGFnTmFtZSkgIT09IC0xKSB7XG4gICAgICAgICAgZWxlbWVudHNUb1Njb3JlLnB1c2gobm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUdXJuIGFsbCBkaXZzIHRoYXQgZG9uJ3QgaGF2ZSBjaGlsZHJlbiBibG9jayBsZXZlbCBlbGVtZW50cyBpbnRvIHAnc1xuICAgICAgICBpZiAobm9kZS50YWdOYW1lID09PSBcIkRJVlwiKSB7XG4gICAgICAgICAgLy8gUHV0IHBocmFzaW5nIGNvbnRlbnQgaW50byBwYXJhZ3JhcGhzLlxuICAgICAgICAgIHZhciBwID0gbnVsbDtcbiAgICAgICAgICB2YXIgY2hpbGROb2RlID0gbm9kZS5maXJzdENoaWxkO1xuICAgICAgICAgIHdoaWxlIChjaGlsZE5vZGUpIHtcbiAgICAgICAgICAgIHZhciBuZXh0U2libGluZyA9IGNoaWxkTm9kZS5uZXh0U2libGluZztcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc1BocmFzaW5nQ29udGVudChjaGlsZE5vZGUpKSB7XG4gICAgICAgICAgICAgIGlmIChwICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcC5hcHBlbmRDaGlsZChjaGlsZE5vZGUpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLl9pc1doaXRlc3BhY2UoY2hpbGROb2RlKSkge1xuICAgICAgICAgICAgICAgIHAgPSBkb2MuY3JlYXRlRWxlbWVudCgncCcpO1xuICAgICAgICAgICAgICAgIG5vZGUucmVwbGFjZUNoaWxkKHAsIGNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgICAgcC5hcHBlbmRDaGlsZChjaGlsZE5vZGUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHAgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgd2hpbGUgKHAubGFzdENoaWxkICYmIHRoaXMuX2lzV2hpdGVzcGFjZShwLmxhc3RDaGlsZCkpIHAucmVtb3ZlQ2hpbGQocC5sYXN0Q2hpbGQpO1xuICAgICAgICAgICAgICBwID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNoaWxkTm9kZSA9IG5leHRTaWJsaW5nO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFNpdGVzIGxpa2UgaHR0cDovL21vYmlsZS5zbGF0ZS5jb20gZW5jbG9zZXMgZWFjaCBwYXJhZ3JhcGggd2l0aCBhIERJVlxuICAgICAgICAgIC8vIGVsZW1lbnQuIERJVnMgd2l0aCBvbmx5IGEgUCBlbGVtZW50IGluc2lkZSBhbmQgbm8gdGV4dCBjb250ZW50IGNhbiBiZVxuICAgICAgICAgIC8vIHNhZmVseSBjb252ZXJ0ZWQgaW50byBwbGFpbiBQIGVsZW1lbnRzIHRvIGF2b2lkIGNvbmZ1c2luZyB0aGUgc2NvcmluZ1xuICAgICAgICAgIC8vIGFsZ29yaXRobSB3aXRoIERJVnMgd2l0aCBhcmUsIGluIHByYWN0aWNlLCBwYXJhZ3JhcGhzLlxuICAgICAgICAgIGlmICh0aGlzLl9oYXNTaW5nbGVUYWdJbnNpZGVFbGVtZW50KG5vZGUsIFwiUFwiKSAmJiB0aGlzLl9nZXRMaW5rRGVuc2l0eShub2RlKSA8IDAuMjUpIHtcbiAgICAgICAgICAgIHZhciBuZXdOb2RlID0gbm9kZS5jaGlsZHJlblswXTtcbiAgICAgICAgICAgIG5vZGUucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Tm9kZSwgbm9kZSk7XG4gICAgICAgICAgICBub2RlID0gbmV3Tm9kZTtcbiAgICAgICAgICAgIGVsZW1lbnRzVG9TY29yZS5wdXNoKG5vZGUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuX2hhc0NoaWxkQmxvY2tFbGVtZW50KG5vZGUpKSB7XG4gICAgICAgICAgICBub2RlID0gdGhpcy5fc2V0Tm9kZVRhZyhub2RlLCBcIlBcIik7XG4gICAgICAgICAgICBlbGVtZW50c1RvU2NvcmUucHVzaChub2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IHRoaXMuX2dldE5leHROb2RlKG5vZGUpO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIExvb3AgdGhyb3VnaCBhbGwgcGFyYWdyYXBocywgYW5kIGFzc2lnbiBhIHNjb3JlIHRvIHRoZW0gYmFzZWQgb24gaG93IGNvbnRlbnQteSB0aGV5IGxvb2suXG4gICAgICAgKiBUaGVuIGFkZCB0aGVpciBzY29yZSB0byB0aGVpciBwYXJlbnQgbm9kZS5cbiAgICAgICAqXG4gICAgICAgKiBBIHNjb3JlIGlzIGRldGVybWluZWQgYnkgdGhpbmdzIGxpa2UgbnVtYmVyIG9mIGNvbW1hcywgY2xhc3MgbmFtZXMsIGV0Yy4gTWF5YmUgZXZlbnR1YWxseSBsaW5rIGRlbnNpdHkuXG4gICAgICAqKi9cbiAgICAgIHZhciBjYW5kaWRhdGVzID0gW107XG4gICAgICB0aGlzLl9mb3JFYWNoTm9kZShlbGVtZW50c1RvU2NvcmUsIGZ1bmN0aW9uKGVsZW1lbnRUb1Njb3JlKSB7XG4gICAgICAgIGlmICghZWxlbWVudFRvU2NvcmUucGFyZW50Tm9kZSB8fCB0eXBlb2YoZWxlbWVudFRvU2NvcmUucGFyZW50Tm9kZS50YWdOYW1lKSA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIC8vIElmIHRoaXMgcGFyYWdyYXBoIGlzIGxlc3MgdGhhbiAyNSBjaGFyYWN0ZXJzLCBkb24ndCBldmVuIGNvdW50IGl0LlxuICAgICAgICB2YXIgaW5uZXJUZXh0ID0gdGhpcy5fZ2V0SW5uZXJUZXh0KGVsZW1lbnRUb1Njb3JlKTtcbiAgICAgICAgaWYgKGlubmVyVGV4dC5sZW5ndGggPCAyNSlcbiAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgLy8gRXhjbHVkZSBub2RlcyB3aXRoIG5vIGFuY2VzdG9yLlxuICAgICAgICB2YXIgYW5jZXN0b3JzID0gdGhpcy5fZ2V0Tm9kZUFuY2VzdG9ycyhlbGVtZW50VG9TY29yZSwgMyk7XG4gICAgICAgIGlmIChhbmNlc3RvcnMubGVuZ3RoID09PSAwKVxuICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB2YXIgY29udGVudFNjb3JlID0gMDtcblxuICAgICAgICAvLyBBZGQgYSBwb2ludCBmb3IgdGhlIHBhcmFncmFwaCBpdHNlbGYgYXMgYSBiYXNlLlxuICAgICAgICBjb250ZW50U2NvcmUgKz0gMTtcblxuICAgICAgICAvLyBBZGQgcG9pbnRzIGZvciBhbnkgY29tbWFzIHdpdGhpbiB0aGlzIHBhcmFncmFwaC5cbiAgICAgICAgY29udGVudFNjb3JlICs9IGlubmVyVGV4dC5zcGxpdCgnLCcpLmxlbmd0aDtcblxuICAgICAgICAvLyBGb3IgZXZlcnkgMTAwIGNoYXJhY3RlcnMgaW4gdGhpcyBwYXJhZ3JhcGgsIGFkZCBhbm90aGVyIHBvaW50LiBVcCB0byAzIHBvaW50cy5cbiAgICAgICAgY29udGVudFNjb3JlICs9IE1hdGgubWluKE1hdGguZmxvb3IoaW5uZXJUZXh0Lmxlbmd0aCAvIDEwMCksIDMpO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgYW5kIHNjb3JlIGFuY2VzdG9ycy5cbiAgICAgICAgdGhpcy5fZm9yRWFjaE5vZGUoYW5jZXN0b3JzLCBmdW5jdGlvbihhbmNlc3RvciwgbGV2ZWwpIHtcbiAgICAgICAgICBpZiAoIWFuY2VzdG9yLnRhZ05hbWUgfHwgIWFuY2VzdG9yLnBhcmVudE5vZGUgfHwgdHlwZW9mKGFuY2VzdG9yLnBhcmVudE5vZGUudGFnTmFtZSkgPT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgaWYgKHR5cGVvZihhbmNlc3Rvci5yZWFkYWJpbGl0eSkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLl9pbml0aWFsaXplTm9kZShhbmNlc3Rvcik7XG4gICAgICAgICAgICBjYW5kaWRhdGVzLnB1c2goYW5jZXN0b3IpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIE5vZGUgc2NvcmUgZGl2aWRlcjpcbiAgICAgICAgICAvLyAtIHBhcmVudDogICAgICAgICAgICAgMSAobm8gZGl2aXNpb24pXG4gICAgICAgICAgLy8gLSBncmFuZHBhcmVudDogICAgICAgIDJcbiAgICAgICAgICAvLyAtIGdyZWF0IGdyYW5kcGFyZW50KzogYW5jZXN0b3IgbGV2ZWwgKiAzXG4gICAgICAgICAgaWYgKGxldmVsID09PSAwKVxuICAgICAgICAgICAgdmFyIHNjb3JlRGl2aWRlciA9IDE7XG4gICAgICAgICAgZWxzZSBpZiAobGV2ZWwgPT09IDEpXG4gICAgICAgICAgICBzY29yZURpdmlkZXIgPSAyO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNjb3JlRGl2aWRlciA9IGxldmVsICogMztcbiAgICAgICAgICBhbmNlc3Rvci5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgKz0gY29udGVudFNjb3JlIC8gc2NvcmVEaXZpZGVyO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBBZnRlciB3ZSd2ZSBjYWxjdWxhdGVkIHNjb3JlcywgbG9vcCB0aHJvdWdoIGFsbCBvZiB0aGUgcG9zc2libGVcbiAgICAgIC8vIGNhbmRpZGF0ZSBub2RlcyB3ZSBmb3VuZCBhbmQgZmluZCB0aGUgb25lIHdpdGggdGhlIGhpZ2hlc3Qgc2NvcmUuXG4gICAgICB2YXIgdG9wQ2FuZGlkYXRlcyA9IFtdO1xuICAgICAgZm9yICh2YXIgYyA9IDAsIGNsID0gY2FuZGlkYXRlcy5sZW5ndGg7IGMgPCBjbDsgYyArPSAxKSB7XG4gICAgICAgIHZhciBjYW5kaWRhdGUgPSBjYW5kaWRhdGVzW2NdO1xuXG4gICAgICAgIC8vIFNjYWxlIHRoZSBmaW5hbCBjYW5kaWRhdGVzIHNjb3JlIGJhc2VkIG9uIGxpbmsgZGVuc2l0eS4gR29vZCBjb250ZW50XG4gICAgICAgIC8vIHNob3VsZCBoYXZlIGEgcmVsYXRpdmVseSBzbWFsbCBsaW5rIGRlbnNpdHkgKDUlIG9yIGxlc3MpIGFuZCBiZSBtb3N0bHlcbiAgICAgICAgLy8gdW5hZmZlY3RlZCBieSB0aGlzIG9wZXJhdGlvbi5cbiAgICAgICAgdmFyIGNhbmRpZGF0ZVNjb3JlID0gY2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSAqICgxIC0gdGhpcy5fZ2V0TGlua0RlbnNpdHkoY2FuZGlkYXRlKSk7XG4gICAgICAgIGNhbmRpZGF0ZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgPSBjYW5kaWRhdGVTY29yZTtcblxuICAgICAgICB0aGlzLmxvZygnQ2FuZGlkYXRlOicsIGNhbmRpZGF0ZSwgXCJ3aXRoIHNjb3JlIFwiICsgY2FuZGlkYXRlU2NvcmUpO1xuXG4gICAgICAgIGZvciAodmFyIHQgPSAwOyB0IDwgdGhpcy5fbmJUb3BDYW5kaWRhdGVzOyB0KyspIHtcbiAgICAgICAgICB2YXIgYVRvcENhbmRpZGF0ZSA9IHRvcENhbmRpZGF0ZXNbdF07XG5cbiAgICAgICAgICBpZiAoIWFUb3BDYW5kaWRhdGUgfHwgY2FuZGlkYXRlU2NvcmUgPiBhVG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSkge1xuICAgICAgICAgICAgdG9wQ2FuZGlkYXRlcy5zcGxpY2UodCwgMCwgY2FuZGlkYXRlKTtcbiAgICAgICAgICAgIGlmICh0b3BDYW5kaWRhdGVzLmxlbmd0aCA+IHRoaXMuX25iVG9wQ2FuZGlkYXRlcylcbiAgICAgICAgICAgICAgdG9wQ2FuZGlkYXRlcy5wb3AoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgdG9wQ2FuZGlkYXRlID0gdG9wQ2FuZGlkYXRlc1swXSB8fCBudWxsO1xuICAgICAgdmFyIG5lZWRlZFRvQ3JlYXRlVG9wQ2FuZGlkYXRlID0gZmFsc2U7XG4gICAgICB2YXIgcGFyZW50T2ZUb3BDYW5kaWRhdGU7XG5cbiAgICAgIC8vIElmIHdlIHN0aWxsIGhhdmUgbm8gdG9wIGNhbmRpZGF0ZSwganVzdCB1c2UgdGhlIGJvZHkgYXMgYSBsYXN0IHJlc29ydC5cbiAgICAgIC8vIFdlIGFsc28gaGF2ZSB0byBjb3B5IHRoZSBib2R5IG5vZGUgc28gaXQgaXMgc29tZXRoaW5nIHdlIGNhbiBtb2RpZnkuXG4gICAgICBpZiAodG9wQ2FuZGlkYXRlID09PSBudWxsIHx8IHRvcENhbmRpZGF0ZS50YWdOYW1lID09PSBcIkJPRFlcIikge1xuICAgICAgICAvLyBNb3ZlIGFsbCBvZiB0aGUgcGFnZSdzIGNoaWxkcmVuIGludG8gdG9wQ2FuZGlkYXRlXG4gICAgICAgIHRvcENhbmRpZGF0ZSA9IGRvYy5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xuICAgICAgICBuZWVkZWRUb0NyZWF0ZVRvcENhbmRpZGF0ZSA9IHRydWU7XG4gICAgICAgIC8vIE1vdmUgZXZlcnl0aGluZyAobm90IGp1c3QgZWxlbWVudHMsIGFsc28gdGV4dCBub2RlcyBldGMuKSBpbnRvIHRoZSBjb250YWluZXJcbiAgICAgICAgLy8gc28gd2UgZXZlbiBpbmNsdWRlIHRleHQgZGlyZWN0bHkgaW4gdGhlIGJvZHk6XG4gICAgICAgIHZhciBraWRzID0gcGFnZS5jaGlsZE5vZGVzO1xuICAgICAgICB3aGlsZSAoa2lkcy5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLmxvZyhcIk1vdmluZyBjaGlsZCBvdXQ6XCIsIGtpZHNbMF0pO1xuICAgICAgICAgIHRvcENhbmRpZGF0ZS5hcHBlbmRDaGlsZChraWRzWzBdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhZ2UuYXBwZW5kQ2hpbGQodG9wQ2FuZGlkYXRlKTtcblxuICAgICAgICB0aGlzLl9pbml0aWFsaXplTm9kZSh0b3BDYW5kaWRhdGUpO1xuICAgICAgfSBlbHNlIGlmICh0b3BDYW5kaWRhdGUpIHtcbiAgICAgICAgLy8gRmluZCBhIGJldHRlciB0b3AgY2FuZGlkYXRlIG5vZGUgaWYgaXQgY29udGFpbnMgKGF0IGxlYXN0IHRocmVlKSBub2RlcyB3aGljaCBiZWxvbmcgdG8gYHRvcENhbmRpZGF0ZXNgIGFycmF5XG4gICAgICAgIC8vIGFuZCB3aG9zZSBzY29yZXMgYXJlIHF1aXRlIGNsb3NlZCB3aXRoIGN1cnJlbnQgYHRvcENhbmRpZGF0ZWAgbm9kZS5cbiAgICAgICAgdmFyIGFsdGVybmF0aXZlQ2FuZGlkYXRlQW5jZXN0b3JzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdG9wQ2FuZGlkYXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh0b3BDYW5kaWRhdGVzW2ldLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSAvIHRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgPj0gMC43NSkge1xuICAgICAgICAgICAgYWx0ZXJuYXRpdmVDYW5kaWRhdGVBbmNlc3RvcnMucHVzaCh0aGlzLl9nZXROb2RlQW5jZXN0b3JzKHRvcENhbmRpZGF0ZXNbaV0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIE1JTklNVU1fVE9QQ0FORElEQVRFUyA9IDM7XG4gICAgICAgIGlmIChhbHRlcm5hdGl2ZUNhbmRpZGF0ZUFuY2VzdG9ycy5sZW5ndGggPj0gTUlOSU1VTV9UT1BDQU5ESURBVEVTKSB7XG4gICAgICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSB0b3BDYW5kaWRhdGUucGFyZW50Tm9kZTtcbiAgICAgICAgICB3aGlsZSAocGFyZW50T2ZUb3BDYW5kaWRhdGUudGFnTmFtZSAhPT0gXCJCT0RZXCIpIHtcbiAgICAgICAgICAgIHZhciBsaXN0c0NvbnRhaW5pbmdUaGlzQW5jZXN0b3IgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgYW5jZXN0b3JJbmRleCA9IDA7IGFuY2VzdG9ySW5kZXggPCBhbHRlcm5hdGl2ZUNhbmRpZGF0ZUFuY2VzdG9ycy5sZW5ndGggJiYgbGlzdHNDb250YWluaW5nVGhpc0FuY2VzdG9yIDwgTUlOSU1VTV9UT1BDQU5ESURBVEVTOyBhbmNlc3RvckluZGV4KyspIHtcbiAgICAgICAgICAgICAgbGlzdHNDb250YWluaW5nVGhpc0FuY2VzdG9yICs9IE51bWJlcihhbHRlcm5hdGl2ZUNhbmRpZGF0ZUFuY2VzdG9yc1thbmNlc3RvckluZGV4XS5pbmNsdWRlcyhwYXJlbnRPZlRvcENhbmRpZGF0ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxpc3RzQ29udGFpbmluZ1RoaXNBbmNlc3RvciA+PSBNSU5JTVVNX1RPUENBTkRJREFURVMpIHtcbiAgICAgICAgICAgICAgdG9wQ2FuZGlkYXRlID0gcGFyZW50T2ZUb3BDYW5kaWRhdGU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eSkge1xuICAgICAgICAgIHRoaXMuX2luaXRpYWxpemVOb2RlKHRvcENhbmRpZGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCZWNhdXNlIG9mIG91ciBib251cyBzeXN0ZW0sIHBhcmVudHMgb2YgY2FuZGlkYXRlcyBtaWdodCBoYXZlIHNjb3Jlc1xuICAgICAgICAvLyB0aGVtc2VsdmVzLiBUaGV5IGdldCBoYWxmIG9mIHRoZSBub2RlLiBUaGVyZSB3b24ndCBiZSBub2RlcyB3aXRoIGhpZ2hlclxuICAgICAgICAvLyBzY29yZXMgdGhhbiBvdXIgdG9wQ2FuZGlkYXRlLCBidXQgaWYgd2Ugc2VlIHRoZSBzY29yZSBnb2luZyAqdXAqIGluIHRoZSBmaXJzdFxuICAgICAgICAvLyBmZXcgc3RlcHMgdXAgdGhlIHRyZWUsIHRoYXQncyBhIGRlY2VudCBzaWduIHRoYXQgdGhlcmUgbWlnaHQgYmUgbW9yZSBjb250ZW50XG4gICAgICAgIC8vIGx1cmtpbmcgaW4gb3RoZXIgcGxhY2VzIHRoYXQgd2Ugd2FudCB0byB1bmlmeSBpbi4gVGhlIHNpYmxpbmcgc3R1ZmZcbiAgICAgICAgLy8gYmVsb3cgZG9lcyBzb21lIG9mIHRoYXQgLSBidXQgb25seSBpZiB3ZSd2ZSBsb29rZWQgaGlnaCBlbm91Z2ggdXAgdGhlIERPTVxuICAgICAgICAvLyB0cmVlLlxuICAgICAgICBwYXJlbnRPZlRvcENhbmRpZGF0ZSA9IHRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgICB2YXIgbGFzdFNjb3JlID0gdG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZTtcbiAgICAgICAgLy8gVGhlIHNjb3JlcyBzaG91bGRuJ3QgZ2V0IHRvbyBsb3cuXG4gICAgICAgIHZhciBzY29yZVRocmVzaG9sZCA9IGxhc3RTY29yZSAvIDM7XG4gICAgICAgIHdoaWxlIChwYXJlbnRPZlRvcENhbmRpZGF0ZS50YWdOYW1lICE9PSBcIkJPRFlcIikge1xuICAgICAgICAgIGlmICghcGFyZW50T2ZUb3BDYW5kaWRhdGUucmVhZGFiaWxpdHkpIHtcbiAgICAgICAgICAgIHBhcmVudE9mVG9wQ2FuZGlkYXRlID0gcGFyZW50T2ZUb3BDYW5kaWRhdGUucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcGFyZW50U2NvcmUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmU7XG4gICAgICAgICAgaWYgKHBhcmVudFNjb3JlIDwgc2NvcmVUaHJlc2hvbGQpXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBpZiAocGFyZW50U2NvcmUgPiBsYXN0U2NvcmUpIHtcbiAgICAgICAgICAgIC8vIEFscmlnaHQhIFdlIGZvdW5kIGEgYmV0dGVyIHBhcmVudCB0byB1c2UuXG4gICAgICAgICAgICB0b3BDYW5kaWRhdGUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsYXN0U2NvcmUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmU7XG4gICAgICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIHRvcCBjYW5kaWRhdGUgaXMgdGhlIG9ubHkgY2hpbGQsIHVzZSBwYXJlbnQgaW5zdGVhZC4gVGhpcyB3aWxsIGhlbHAgc2libGluZ1xuICAgICAgICAvLyBqb2luaW5nIGxvZ2ljIHdoZW4gYWRqYWNlbnQgY29udGVudCBpcyBhY3R1YWxseSBsb2NhdGVkIGluIHBhcmVudCdzIHNpYmxpbmcgbm9kZS5cbiAgICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSB0b3BDYW5kaWRhdGUucGFyZW50Tm9kZTtcbiAgICAgICAgd2hpbGUgKHBhcmVudE9mVG9wQ2FuZGlkYXRlLnRhZ05hbWUgIT0gXCJCT0RZXCIgJiYgcGFyZW50T2ZUb3BDYW5kaWRhdGUuY2hpbGRyZW4ubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICB0b3BDYW5kaWRhdGUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZTtcbiAgICAgICAgICBwYXJlbnRPZlRvcENhbmRpZGF0ZSA9IHRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5KSB7XG4gICAgICAgICAgdGhpcy5faW5pdGlhbGl6ZU5vZGUodG9wQ2FuZGlkYXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIHRoZSB0b3AgY2FuZGlkYXRlLCBsb29rIHRocm91Z2ggaXRzIHNpYmxpbmdzIGZvciBjb250ZW50XG4gICAgICAvLyB0aGF0IG1pZ2h0IGFsc28gYmUgcmVsYXRlZC4gVGhpbmdzIGxpa2UgcHJlYW1ibGVzLCBjb250ZW50IHNwbGl0IGJ5IGFkc1xuICAgICAgLy8gdGhhdCB3ZSByZW1vdmVkLCBldGMuXG4gICAgICB2YXIgYXJ0aWNsZUNvbnRlbnQgPSBkb2MuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcbiAgICAgIGlmIChpc1BhZ2luZylcbiAgICAgICAgYXJ0aWNsZUNvbnRlbnQuaWQgPSBcInJlYWRhYmlsaXR5LWNvbnRlbnRcIjtcblxuICAgICAgdmFyIHNpYmxpbmdTY29yZVRocmVzaG9sZCA9IE1hdGgubWF4KDEwLCB0b3BDYW5kaWRhdGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlICogMC4yKTtcbiAgICAgIC8vIEtlZXAgcG90ZW50aWFsIHRvcCBjYW5kaWRhdGUncyBwYXJlbnQgbm9kZSB0byB0cnkgdG8gZ2V0IHRleHQgZGlyZWN0aW9uIG9mIGl0IGxhdGVyLlxuICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSB0b3BDYW5kaWRhdGUucGFyZW50Tm9kZTtcbiAgICAgIHZhciBzaWJsaW5ncyA9IHBhcmVudE9mVG9wQ2FuZGlkYXRlLmNoaWxkcmVuO1xuXG4gICAgICBmb3IgKHZhciBzID0gMCwgc2wgPSBzaWJsaW5ncy5sZW5ndGg7IHMgPCBzbDsgcysrKSB7XG4gICAgICAgIHZhciBzaWJsaW5nID0gc2libGluZ3Nbc107XG4gICAgICAgIHZhciBhcHBlbmQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmxvZyhcIkxvb2tpbmcgYXQgc2libGluZyBub2RlOlwiLCBzaWJsaW5nLCBzaWJsaW5nLnJlYWRhYmlsaXR5ID8gKFwid2l0aCBzY29yZSBcIiArIHNpYmxpbmcucmVhZGFiaWxpdHkuY29udGVudFNjb3JlKSA6ICcnKTtcbiAgICAgICAgdGhpcy5sb2coXCJTaWJsaW5nIGhhcyBzY29yZVwiLCBzaWJsaW5nLnJlYWRhYmlsaXR5ID8gc2libGluZy5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgOiAnVW5rbm93bicpO1xuXG4gICAgICAgIGlmIChzaWJsaW5nID09PSB0b3BDYW5kaWRhdGUpIHtcbiAgICAgICAgICBhcHBlbmQgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBjb250ZW50Qm9udXMgPSAwO1xuXG4gICAgICAgICAgLy8gR2l2ZSBhIGJvbnVzIGlmIHNpYmxpbmcgbm9kZXMgYW5kIHRvcCBjYW5kaWRhdGVzIGhhdmUgdGhlIGV4YW1wbGUgc2FtZSBjbGFzc25hbWVcbiAgICAgICAgICBpZiAoc2libGluZy5jbGFzc05hbWUgPT09IHRvcENhbmRpZGF0ZS5jbGFzc05hbWUgJiYgdG9wQ2FuZGlkYXRlLmNsYXNzTmFtZSAhPT0gXCJcIilcbiAgICAgICAgICAgIGNvbnRlbnRCb251cyArPSB0b3BDYW5kaWRhdGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlICogMC4yO1xuXG4gICAgICAgICAgaWYgKHNpYmxpbmcucmVhZGFiaWxpdHkgJiZcbiAgICAgICAgICAgICAgKChzaWJsaW5nLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSArIGNvbnRlbnRCb251cykgPj0gc2libGluZ1Njb3JlVGhyZXNob2xkKSkge1xuICAgICAgICAgICAgYXBwZW5kID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNpYmxpbmcubm9kZU5hbWUgPT09IFwiUFwiKSB7XG4gICAgICAgICAgICB2YXIgbGlua0RlbnNpdHkgPSB0aGlzLl9nZXRMaW5rRGVuc2l0eShzaWJsaW5nKTtcbiAgICAgICAgICAgIHZhciBub2RlQ29udGVudCA9IHRoaXMuX2dldElubmVyVGV4dChzaWJsaW5nKTtcbiAgICAgICAgICAgIHZhciBub2RlTGVuZ3RoID0gbm9kZUNvbnRlbnQubGVuZ3RoO1xuXG4gICAgICAgICAgICBpZiAobm9kZUxlbmd0aCA+IDgwICYmIGxpbmtEZW5zaXR5IDwgMC4yNSkge1xuICAgICAgICAgICAgICBhcHBlbmQgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChub2RlTGVuZ3RoIDwgODAgJiYgbm9kZUxlbmd0aCA+IDAgJiYgbGlua0RlbnNpdHkgPT09IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgbm9kZUNvbnRlbnQuc2VhcmNoKC9cXC4oIHwkKS8pICE9PSAtMSkge1xuICAgICAgICAgICAgICBhcHBlbmQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhcHBlbmQpIHtcbiAgICAgICAgICB0aGlzLmxvZyhcIkFwcGVuZGluZyBub2RlOlwiLCBzaWJsaW5nKTtcblxuICAgICAgICAgIGlmICh0aGlzLkFMVEVSX1RPX0RJVl9FWENFUFRJT05TLmluZGV4T2Yoc2libGluZy5ub2RlTmFtZSkgPT09IC0xKSB7XG4gICAgICAgICAgICAvLyBXZSBoYXZlIGEgbm9kZSB0aGF0IGlzbid0IGEgY29tbW9uIGJsb2NrIGxldmVsIGVsZW1lbnQsIGxpa2UgYSBmb3JtIG9yIHRkIHRhZy5cbiAgICAgICAgICAgIC8vIFR1cm4gaXQgaW50byBhIGRpdiBzbyBpdCBkb2Vzbid0IGdldCBmaWx0ZXJlZCBvdXQgbGF0ZXIgYnkgYWNjaWRlbnQuXG4gICAgICAgICAgICB0aGlzLmxvZyhcIkFsdGVyaW5nIHNpYmxpbmc6XCIsIHNpYmxpbmcsICd0byBkaXYuJyk7XG5cbiAgICAgICAgICAgIHNpYmxpbmcgPSB0aGlzLl9zZXROb2RlVGFnKHNpYmxpbmcsIFwiRElWXCIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGFydGljbGVDb250ZW50LmFwcGVuZENoaWxkKHNpYmxpbmcpO1xuICAgICAgICAgIC8vIHNpYmxpbmdzIGlzIGEgcmVmZXJlbmNlIHRvIHRoZSBjaGlsZHJlbiBhcnJheSwgYW5kXG4gICAgICAgICAgLy8gc2libGluZyBpcyByZW1vdmVkIGZyb20gdGhlIGFycmF5IHdoZW4gd2UgY2FsbCBhcHBlbmRDaGlsZCgpLlxuICAgICAgICAgIC8vIEFzIGEgcmVzdWx0LCB3ZSBtdXN0IHJldmlzaXQgdGhpcyBpbmRleCBzaW5jZSB0aGUgbm9kZXNcbiAgICAgICAgICAvLyBoYXZlIGJlZW4gc2hpZnRlZC5cbiAgICAgICAgICBzIC09IDE7XG4gICAgICAgICAgc2wgLT0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fZGVidWcpXG4gICAgICAgIHRoaXMubG9nKFwiQXJ0aWNsZSBjb250ZW50IHByZS1wcmVwOiBcIiArIGFydGljbGVDb250ZW50LmlubmVySFRNTCk7XG4gICAgICAvLyBTbyB3ZSBoYXZlIGFsbCBvZiB0aGUgY29udGVudCB0aGF0IHdlIG5lZWQuIE5vdyB3ZSBjbGVhbiBpdCB1cCBmb3IgcHJlc2VudGF0aW9uLlxuICAgICAgdGhpcy5fcHJlcEFydGljbGUoYXJ0aWNsZUNvbnRlbnQpO1xuICAgICAgaWYgKHRoaXMuX2RlYnVnKVxuICAgICAgICB0aGlzLmxvZyhcIkFydGljbGUgY29udGVudCBwb3N0LXByZXA6IFwiICsgYXJ0aWNsZUNvbnRlbnQuaW5uZXJIVE1MKTtcblxuICAgICAgaWYgKG5lZWRlZFRvQ3JlYXRlVG9wQ2FuZGlkYXRlKSB7XG4gICAgICAgIC8vIFdlIGFscmVhZHkgY3JlYXRlZCBhIGZha2UgZGl2IHRoaW5nLCBhbmQgdGhlcmUgd291bGRuJ3QgaGF2ZSBiZWVuIGFueSBzaWJsaW5ncyBsZWZ0XG4gICAgICAgIC8vIGZvciB0aGUgcHJldmlvdXMgbG9vcCwgc28gdGhlcmUncyBubyBwb2ludCB0cnlpbmcgdG8gY3JlYXRlIGEgbmV3IGRpdiwgYW5kIHRoZW5cbiAgICAgICAgLy8gbW92ZSBhbGwgdGhlIGNoaWxkcmVuIG92ZXIuIEp1c3QgYXNzaWduIElEcyBhbmQgY2xhc3MgbmFtZXMgaGVyZS4gTm8gbmVlZCB0byBhcHBlbmRcbiAgICAgICAgLy8gYmVjYXVzZSB0aGF0IGFscmVhZHkgaGFwcGVuZWQgYW55d2F5LlxuICAgICAgICB0b3BDYW5kaWRhdGUuaWQgPSBcInJlYWRhYmlsaXR5LXBhZ2UtMVwiO1xuICAgICAgICB0b3BDYW5kaWRhdGUuY2xhc3NOYW1lID0gXCJwYWdlXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZGl2ID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XG4gICAgICAgIGRpdi5pZCA9IFwicmVhZGFiaWxpdHktcGFnZS0xXCI7XG4gICAgICAgIGRpdi5jbGFzc05hbWUgPSBcInBhZ2VcIjtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gYXJ0aWNsZUNvbnRlbnQuY2hpbGROb2RlcztcbiAgICAgICAgd2hpbGUgKGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgIGRpdi5hcHBlbmRDaGlsZChjaGlsZHJlblswXSk7XG4gICAgICAgIH1cbiAgICAgICAgYXJ0aWNsZUNvbnRlbnQuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX2RlYnVnKVxuICAgICAgICB0aGlzLmxvZyhcIkFydGljbGUgY29udGVudCBhZnRlciBwYWdpbmc6IFwiICsgYXJ0aWNsZUNvbnRlbnQuaW5uZXJIVE1MKTtcblxuICAgICAgdmFyIHBhcnNlU3VjY2Vzc2Z1bCA9IHRydWU7XG5cbiAgICAgIC8vIE5vdyB0aGF0IHdlJ3ZlIGdvbmUgdGhyb3VnaCB0aGUgZnVsbCBhbGdvcml0aG0sIGNoZWNrIHRvIHNlZSBpZlxuICAgICAgLy8gd2UgZ290IGFueSBtZWFuaW5nZnVsIGNvbnRlbnQuIElmIHdlIGRpZG4ndCwgd2UgbWF5IG5lZWQgdG8gcmUtcnVuXG4gICAgICAvLyBncmFiQXJ0aWNsZSB3aXRoIGRpZmZlcmVudCBmbGFncyBzZXQuIFRoaXMgZ2l2ZXMgdXMgYSBoaWdoZXIgbGlrZWxpaG9vZCBvZlxuICAgICAgLy8gZmluZGluZyB0aGUgY29udGVudCwgYW5kIHRoZSBzaWV2ZSBhcHByb2FjaCBnaXZlcyB1cyBhIGhpZ2hlciBsaWtlbGlob29kIG9mXG4gICAgICAvLyBmaW5kaW5nIHRoZSAtcmlnaHQtIGNvbnRlbnQuXG4gICAgICB2YXIgdGV4dExlbmd0aCA9IHRoaXMuX2dldElubmVyVGV4dChhcnRpY2xlQ29udGVudCwgdHJ1ZSkubGVuZ3RoO1xuICAgICAgaWYgKHRleHRMZW5ndGggPCB0aGlzLl9jaGFyVGhyZXNob2xkKSB7XG4gICAgICAgIHBhcnNlU3VjY2Vzc2Z1bCA9IGZhbHNlO1xuICAgICAgICBwYWdlLmlubmVySFRNTCA9IHBhZ2VDYWNoZUh0bWw7XG5cbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdJc0FjdGl2ZSh0aGlzLkZMQUdfU1RSSVBfVU5MSUtFTFlTKSkge1xuICAgICAgICAgIHRoaXMuX3JlbW92ZUZsYWcodGhpcy5GTEFHX1NUUklQX1VOTElLRUxZUyk7XG4gICAgICAgICAgdGhpcy5fYXR0ZW1wdHMucHVzaCh7YXJ0aWNsZUNvbnRlbnQ6IGFydGljbGVDb250ZW50LCB0ZXh0TGVuZ3RoOiB0ZXh0TGVuZ3RofSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fZmxhZ0lzQWN0aXZlKHRoaXMuRkxBR19XRUlHSFRfQ0xBU1NFUykpIHtcbiAgICAgICAgICB0aGlzLl9yZW1vdmVGbGFnKHRoaXMuRkxBR19XRUlHSFRfQ0xBU1NFUyk7XG4gICAgICAgICAgdGhpcy5fYXR0ZW1wdHMucHVzaCh7YXJ0aWNsZUNvbnRlbnQ6IGFydGljbGVDb250ZW50LCB0ZXh0TGVuZ3RoOiB0ZXh0TGVuZ3RofSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fZmxhZ0lzQWN0aXZlKHRoaXMuRkxBR19DTEVBTl9DT05ESVRJT05BTExZKSkge1xuICAgICAgICAgIHRoaXMuX3JlbW92ZUZsYWcodGhpcy5GTEFHX0NMRUFOX0NPTkRJVElPTkFMTFkpO1xuICAgICAgICAgIHRoaXMuX2F0dGVtcHRzLnB1c2goe2FydGljbGVDb250ZW50OiBhcnRpY2xlQ29udGVudCwgdGV4dExlbmd0aDogdGV4dExlbmd0aH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX2F0dGVtcHRzLnB1c2goe2FydGljbGVDb250ZW50OiBhcnRpY2xlQ29udGVudCwgdGV4dExlbmd0aDogdGV4dExlbmd0aH0pO1xuICAgICAgICAgIC8vIE5vIGx1Y2sgYWZ0ZXIgcmVtb3ZpbmcgZmxhZ3MsIGp1c3QgcmV0dXJuIHRoZSBsb25nZXN0IHRleHQgd2UgZm91bmQgZHVyaW5nIHRoZSBkaWZmZXJlbnQgbG9vcHNcbiAgICAgICAgICB0aGlzLl9hdHRlbXB0cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYS50ZXh0TGVuZ3RoIDwgYi50ZXh0TGVuZ3RoO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gQnV0IGZpcnN0IGNoZWNrIGlmIHdlIGFjdHVhbGx5IGhhdmUgc29tZXRoaW5nXG4gICAgICAgICAgaWYgKCF0aGlzLl9hdHRlbXB0c1swXS50ZXh0TGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhcnRpY2xlQ29udGVudCA9IHRoaXMuX2F0dGVtcHRzWzBdLmFydGljbGVDb250ZW50O1xuICAgICAgICAgIHBhcnNlU3VjY2Vzc2Z1bCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHBhcnNlU3VjY2Vzc2Z1bCkge1xuICAgICAgICAvLyBGaW5kIG91dCB0ZXh0IGRpcmVjdGlvbiBmcm9tIGFuY2VzdG9ycyBvZiBmaW5hbCB0b3AgY2FuZGlkYXRlLlxuICAgICAgICB2YXIgYW5jZXN0b3JzID0gW3BhcmVudE9mVG9wQ2FuZGlkYXRlLCB0b3BDYW5kaWRhdGVdLmNvbmNhdCh0aGlzLl9nZXROb2RlQW5jZXN0b3JzKHBhcmVudE9mVG9wQ2FuZGlkYXRlKSk7XG4gICAgICAgIHRoaXMuX3NvbWVOb2RlKGFuY2VzdG9ycywgZnVuY3Rpb24oYW5jZXN0b3IpIHtcbiAgICAgICAgICBpZiAoIWFuY2VzdG9yLnRhZ05hbWUpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgdmFyIGFydGljbGVEaXIgPSBhbmNlc3Rvci5nZXRBdHRyaWJ1dGUoXCJkaXJcIik7XG4gICAgICAgICAgaWYgKGFydGljbGVEaXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2FydGljbGVEaXIgPSBhcnRpY2xlRGlyO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBhcnRpY2xlQ29udGVudDtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhlIGlucHV0IHN0cmluZyBjb3VsZCBiZSBhIGJ5bGluZS5cbiAgICogVGhpcyB2ZXJpZmllcyB0aGF0IHRoZSBpbnB1dCBpcyBhIHN0cmluZywgYW5kIHRoYXQgdGhlIGxlbmd0aFxuICAgKiBpcyBsZXNzIHRoYW4gMTAwIGNoYXJzLlxuICAgKlxuICAgKiBAcGFyYW0gcG9zc2libGVCeWxpbmUge3N0cmluZ30gLSBhIHN0cmluZyB0byBjaGVjayB3aGV0aGVyIGl0cyBhIGJ5bGluZS5cbiAgICogQHJldHVybiBCb29sZWFuIC0gd2hldGhlciB0aGUgaW5wdXQgc3RyaW5nIGlzIGEgYnlsaW5lLlxuICAgKi9cbiAgX2lzVmFsaWRCeWxpbmU6IGZ1bmN0aW9uKGJ5bGluZSkge1xuICAgIGlmICh0eXBlb2YgYnlsaW5lID09ICdzdHJpbmcnIHx8IGJ5bGluZSBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgYnlsaW5lID0gYnlsaW5lLnRyaW0oKTtcbiAgICAgIHJldHVybiAoYnlsaW5lLmxlbmd0aCA+IDApICYmIChieWxpbmUubGVuZ3RoIDwgMTAwKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byBnZXQgZXhjZXJwdCBhbmQgYnlsaW5lIG1ldGFkYXRhIGZvciB0aGUgYXJ0aWNsZS5cbiAgICpcbiAgICogQHJldHVybiBPYmplY3Qgd2l0aCBvcHRpb25hbCBcImV4Y2VycHRcIiBhbmQgXCJieWxpbmVcIiBwcm9wZXJ0aWVzXG4gICAqL1xuICBfZ2V0QXJ0aWNsZU1ldGFkYXRhOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWV0YWRhdGEgPSB7fTtcbiAgICB2YXIgdmFsdWVzID0ge307XG4gICAgdmFyIG1ldGFFbGVtZW50cyA9IHRoaXMuX2RvYy5nZXRFbGVtZW50c0J5VGFnTmFtZShcIm1ldGFcIik7XG5cbiAgICAvLyBNYXRjaCBcImRlc2NyaXB0aW9uXCIsIG9yIFR3aXR0ZXIncyBcInR3aXR0ZXI6ZGVzY3JpcHRpb25cIiAoQ2FyZHMpXG4gICAgLy8gaW4gbmFtZSBhdHRyaWJ1dGUuXG4gICAgdmFyIG5hbWVQYXR0ZXJuID0gL15cXHMqKCh0d2l0dGVyKVxccyo6XFxzKik/KGRlc2NyaXB0aW9ufHRpdGxlKVxccyokL2dpO1xuXG4gICAgLy8gTWF0Y2ggRmFjZWJvb2sncyBPcGVuIEdyYXBoIHRpdGxlICYgZGVzY3JpcHRpb24gcHJvcGVydGllcy5cbiAgICB2YXIgcHJvcGVydHlQYXR0ZXJuID0gL15cXHMqb2dcXHMqOlxccyooZGVzY3JpcHRpb258dGl0bGUpXFxzKiQvZ2k7XG5cbiAgICAvLyBGaW5kIGRlc2NyaXB0aW9uIHRhZ3MuXG4gICAgdGhpcy5fZm9yRWFjaE5vZGUobWV0YUVsZW1lbnRzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICB2YXIgZWxlbWVudE5hbWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShcIm5hbWVcIik7XG4gICAgICB2YXIgZWxlbWVudFByb3BlcnR5ID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJwcm9wZXJ0eVwiKTtcblxuICAgICAgaWYgKFtlbGVtZW50TmFtZSwgZWxlbWVudFByb3BlcnR5XS5pbmRleE9mKFwiYXV0aG9yXCIpICE9PSAtMSkge1xuICAgICAgICBtZXRhZGF0YS5ieWxpbmUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShcImNvbnRlbnRcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIG5hbWUgPSBudWxsO1xuICAgICAgaWYgKG5hbWVQYXR0ZXJuLnRlc3QoZWxlbWVudE5hbWUpKSB7XG4gICAgICAgIG5hbWUgPSBlbGVtZW50TmFtZTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcGVydHlQYXR0ZXJuLnRlc3QoZWxlbWVudFByb3BlcnR5KSkge1xuICAgICAgICBuYW1lID0gZWxlbWVudFByb3BlcnR5O1xuICAgICAgfVxuXG4gICAgICBpZiAobmFtZSkge1xuICAgICAgICB2YXIgY29udGVudCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiY29udGVudFwiKTtcbiAgICAgICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgICAvLyBDb252ZXJ0IHRvIGxvd2VyY2FzZSBhbmQgcmVtb3ZlIGFueSB3aGl0ZXNwYWNlXG4gICAgICAgICAgLy8gc28gd2UgY2FuIG1hdGNoIGJlbG93LlxuICAgICAgICAgIG5hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzL2csICcnKTtcbiAgICAgICAgICB2YWx1ZXNbbmFtZV0gPSBjb250ZW50LnRyaW0oKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKFwiZGVzY3JpcHRpb25cIiBpbiB2YWx1ZXMpIHtcbiAgICAgIG1ldGFkYXRhLmV4Y2VycHQgPSB2YWx1ZXNbXCJkZXNjcmlwdGlvblwiXTtcbiAgICB9IGVsc2UgaWYgKFwib2c6ZGVzY3JpcHRpb25cIiBpbiB2YWx1ZXMpIHtcbiAgICAgIC8vIFVzZSBmYWNlYm9vayBvcGVuIGdyYXBoIGRlc2NyaXB0aW9uLlxuICAgICAgbWV0YWRhdGEuZXhjZXJwdCA9IHZhbHVlc1tcIm9nOmRlc2NyaXB0aW9uXCJdO1xuICAgIH0gZWxzZSBpZiAoXCJ0d2l0dGVyOmRlc2NyaXB0aW9uXCIgaW4gdmFsdWVzKSB7XG4gICAgICAvLyBVc2UgdHdpdHRlciBjYXJkcyBkZXNjcmlwdGlvbi5cbiAgICAgIG1ldGFkYXRhLmV4Y2VycHQgPSB2YWx1ZXNbXCJ0d2l0dGVyOmRlc2NyaXB0aW9uXCJdO1xuICAgIH1cblxuICAgIG1ldGFkYXRhLnRpdGxlID0gdGhpcy5fZ2V0QXJ0aWNsZVRpdGxlKCk7XG4gICAgaWYgKCFtZXRhZGF0YS50aXRsZSkge1xuICAgICAgaWYgKFwib2c6dGl0bGVcIiBpbiB2YWx1ZXMpIHtcbiAgICAgICAgLy8gVXNlIGZhY2Vib29rIG9wZW4gZ3JhcGggdGl0bGUuXG4gICAgICAgIG1ldGFkYXRhLnRpdGxlID0gdmFsdWVzW1wib2c6dGl0bGVcIl07XG4gICAgICB9IGVsc2UgaWYgKFwidHdpdHRlcjp0aXRsZVwiIGluIHZhbHVlcykge1xuICAgICAgICAvLyBVc2UgdHdpdHRlciBjYXJkcyB0aXRsZS5cbiAgICAgICAgbWV0YWRhdGEudGl0bGUgPSB2YWx1ZXNbXCJ0d2l0dGVyOnRpdGxlXCJdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBtZXRhZGF0YTtcbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlcyBzY3JpcHQgdGFncyBmcm9tIHRoZSBkb2N1bWVudC5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgKiovXG4gIF9yZW1vdmVTY3JpcHRzOiBmdW5jdGlvbihkb2MpIHtcbiAgICB0aGlzLl9yZW1vdmVOb2Rlcyhkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpLCBmdW5jdGlvbihzY3JpcHROb2RlKSB7XG4gICAgICBzY3JpcHROb2RlLm5vZGVWYWx1ZSA9IFwiXCI7XG4gICAgICBzY3JpcHROb2RlLnJlbW92ZUF0dHJpYnV0ZSgnc3JjJyk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICB0aGlzLl9yZW1vdmVOb2Rlcyhkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ25vc2NyaXB0JykpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGlzIG5vZGUgaGFzIG9ubHkgd2hpdGVzcGFjZSBhbmQgYSBzaW5nbGUgZWxlbWVudCB3aXRoIGdpdmVuIHRhZ1xuICAgKiBSZXR1cm5zIGZhbHNlIGlmIHRoZSBESVYgbm9kZSBjb250YWlucyBub24tZW1wdHkgdGV4dCBub2Rlc1xuICAgKiBvciBpZiBpdCBjb250YWlucyBubyBlbGVtZW50IHdpdGggZ2l2ZW4gdGFnIG9yIG1vcmUgdGhhbiAxIGVsZW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEBwYXJhbSBzdHJpbmcgdGFnIG9mIGNoaWxkIGVsZW1lbnRcbiAgKiovXG4gIF9oYXNTaW5nbGVUYWdJbnNpZGVFbGVtZW50OiBmdW5jdGlvbihlbGVtZW50LCB0YWcpIHtcbiAgICAvLyBUaGVyZSBzaG91bGQgYmUgZXhhY3RseSAxIGVsZW1lbnQgY2hpbGQgd2l0aCBnaXZlbiB0YWdcbiAgICBpZiAoZWxlbWVudC5jaGlsZHJlbi5sZW5ndGggIT0gMSB8fCBlbGVtZW50LmNoaWxkcmVuWzBdLnRhZ05hbWUgIT09IHRhZykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIEFuZCB0aGVyZSBzaG91bGQgYmUgbm8gdGV4dCBub2RlcyB3aXRoIHJlYWwgY29udGVudFxuICAgIHJldHVybiAhdGhpcy5fc29tZU5vZGUoZWxlbWVudC5jaGlsZE5vZGVzLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gdGhpcy5URVhUX05PREUgJiZcbiAgICAgICAgICAgICB0aGlzLlJFR0VYUFMuaGFzQ29udGVudC50ZXN0KG5vZGUudGV4dENvbnRlbnQpO1xuICAgIH0pO1xuICB9LFxuXG4gIF9pc0VsZW1lbnRXaXRob3V0Q29udGVudDogZnVuY3Rpb24obm9kZSkge1xuICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSB0aGlzLkVMRU1FTlRfTk9ERSAmJlxuICAgICAgbm9kZS50ZXh0Q29udGVudC50cmltKCkubGVuZ3RoID09IDAgJiZcbiAgICAgIChub2RlLmNoaWxkcmVuLmxlbmd0aCA9PSAwIHx8XG4gICAgICAgbm9kZS5jaGlsZHJlbi5sZW5ndGggPT0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJyXCIpLmxlbmd0aCArIG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJoclwiKS5sZW5ndGgpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgd2hldGhlciBlbGVtZW50IGhhcyBhbnkgY2hpbGRyZW4gYmxvY2sgbGV2ZWwgZWxlbWVudHMuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqL1xuICBfaGFzQ2hpbGRCbG9ja0VsZW1lbnQ6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgcmV0dXJuIHRoaXMuX3NvbWVOb2RlKGVsZW1lbnQuY2hpbGROb2RlcywgZnVuY3Rpb24obm9kZSkge1xuICAgICAgcmV0dXJuIHRoaXMuRElWX1RPX1BfRUxFTVMuaW5kZXhPZihub2RlLnRhZ05hbWUpICE9PSAtMSB8fFxuICAgICAgICAgICAgIHRoaXMuX2hhc0NoaWxkQmxvY2tFbGVtZW50KG5vZGUpO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKipcbiAgICogRGV0ZXJtaW5lIGlmIGEgbm9kZSBxdWFsaWZpZXMgYXMgcGhyYXNpbmcgY29udGVudC5cbiAgICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvR3VpZGUvSFRNTC9Db250ZW50X2NhdGVnb3JpZXMjUGhyYXNpbmdfY29udGVudFxuICAqKi9cbiAgX2lzUGhyYXNpbmdDb250ZW50OiBmdW5jdGlvbihub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IHRoaXMuVEVYVF9OT0RFIHx8IHRoaXMuUEhSQVNJTkdfRUxFTVMuaW5kZXhPZihub2RlLnRhZ05hbWUpICE9PSAtMSB8fFxuICAgICAgKChub2RlLnRhZ05hbWUgPT09IFwiQVwiIHx8IG5vZGUudGFnTmFtZSA9PT0gXCJERUxcIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiSU5TXCIpICYmXG4gICAgICAgIHRoaXMuX2V2ZXJ5Tm9kZShub2RlLmNoaWxkTm9kZXMsIHRoaXMuX2lzUGhyYXNpbmdDb250ZW50KSk7XG4gIH0sXG5cbiAgX2lzV2hpdGVzcGFjZTogZnVuY3Rpb24obm9kZSkge1xuICAgIHJldHVybiAobm9kZS5ub2RlVHlwZSA9PT0gdGhpcy5URVhUX05PREUgJiYgbm9kZS50ZXh0Q29udGVudC50cmltKCkubGVuZ3RoID09PSAwKSB8fFxuICAgICAgICAgICAobm9kZS5ub2RlVHlwZSA9PT0gdGhpcy5FTEVNRU5UX05PREUgJiYgbm9kZS50YWdOYW1lID09PSBcIkJSXCIpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGlubmVyIHRleHQgb2YgYSBub2RlIC0gY3Jvc3MgYnJvd3NlciBjb21wYXRpYmx5LlxuICAgKiBUaGlzIGFsc28gc3RyaXBzIG91dCBhbnkgZXhjZXNzIHdoaXRlc3BhY2UgdG8gYmUgZm91bmQuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEBwYXJhbSBCb29sZWFuIG5vcm1hbGl6ZVNwYWNlcyAoZGVmYXVsdDogdHJ1ZSlcbiAgICogQHJldHVybiBzdHJpbmdcbiAgKiovXG4gIF9nZXRJbm5lclRleHQ6IGZ1bmN0aW9uKGUsIG5vcm1hbGl6ZVNwYWNlcykge1xuICAgIG5vcm1hbGl6ZVNwYWNlcyA9ICh0eXBlb2Ygbm9ybWFsaXplU3BhY2VzID09PSAndW5kZWZpbmVkJykgPyB0cnVlIDogbm9ybWFsaXplU3BhY2VzO1xuICAgIHZhciB0ZXh0Q29udGVudCA9IGUudGV4dENvbnRlbnQudHJpbSgpO1xuXG4gICAgaWYgKG5vcm1hbGl6ZVNwYWNlcykge1xuICAgICAgcmV0dXJuIHRleHRDb250ZW50LnJlcGxhY2UodGhpcy5SRUdFWFBTLm5vcm1hbGl6ZSwgXCIgXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dENvbnRlbnQ7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbnVtYmVyIG9mIHRpbWVzIGEgc3RyaW5nIHMgYXBwZWFycyBpbiB0aGUgbm9kZSBlLlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcGFyYW0gc3RyaW5nIC0gd2hhdCB0byBzcGxpdCBvbi4gRGVmYXVsdCBpcyBcIixcIlxuICAgKiBAcmV0dXJuIG51bWJlciAoaW50ZWdlcilcbiAgKiovXG4gIF9nZXRDaGFyQ291bnQ6IGZ1bmN0aW9uKGUsIHMpIHtcbiAgICBzID0gcyB8fCBcIixcIjtcbiAgICByZXR1cm4gdGhpcy5fZ2V0SW5uZXJUZXh0KGUpLnNwbGl0KHMpLmxlbmd0aCAtIDE7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbW92ZSB0aGUgc3R5bGUgYXR0cmlidXRlIG9uIGV2ZXJ5IGUgYW5kIHVuZGVyLlxuICAgKiBUT0RPOiBUZXN0IGlmIGdldEVsZW1lbnRzQnlUYWdOYW1lKCopIGlzIGZhc3Rlci5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHJldHVybiB2b2lkXG4gICoqL1xuICBfY2xlYW5TdHlsZXM6IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoIWUgfHwgZS50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdzdmcnKVxuICAgICAgcmV0dXJuO1xuXG4gICAgLy8gUmVtb3ZlIGBzdHlsZWAgYW5kIGRlcHJlY2F0ZWQgcHJlc2VudGF0aW9uYWwgYXR0cmlidXRlc1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5QUkVTRU5UQVRJT05BTF9BVFRSSUJVVEVTLmxlbmd0aDsgaSsrKSB7XG4gICAgICBlLnJlbW92ZUF0dHJpYnV0ZSh0aGlzLlBSRVNFTlRBVElPTkFMX0FUVFJJQlVURVNbaV0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLkRFUFJFQ0FURURfU0laRV9BVFRSSUJVVEVfRUxFTVMuaW5kZXhPZihlLnRhZ05hbWUpICE9PSAtMSkge1xuICAgICAgZS5yZW1vdmVBdHRyaWJ1dGUoJ3dpZHRoJyk7XG4gICAgICBlLnJlbW92ZUF0dHJpYnV0ZSgnaGVpZ2h0Jyk7XG4gICAgfVxuXG4gICAgdmFyIGN1ciA9IGUuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgd2hpbGUgKGN1ciAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5fY2xlYW5TdHlsZXMoY3VyKTtcbiAgICAgIGN1ciA9IGN1ci5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGRlbnNpdHkgb2YgbGlua3MgYXMgYSBwZXJjZW50YWdlIG9mIHRoZSBjb250ZW50XG4gICAqIFRoaXMgaXMgdGhlIGFtb3VudCBvZiB0ZXh0IHRoYXQgaXMgaW5zaWRlIGEgbGluayBkaXZpZGVkIGJ5IHRoZSB0b3RhbCB0ZXh0IGluIHRoZSBub2RlLlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcmV0dXJuIG51bWJlciAoZmxvYXQpXG4gICoqL1xuICBfZ2V0TGlua0RlbnNpdHk6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICB2YXIgdGV4dExlbmd0aCA9IHRoaXMuX2dldElubmVyVGV4dChlbGVtZW50KS5sZW5ndGg7XG4gICAgaWYgKHRleHRMZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gMDtcblxuICAgIHZhciBsaW5rTGVuZ3RoID0gMDtcblxuICAgIC8vIFhYWCBpbXBsZW1lbnQgX3JlZHVjZU5vZGVMaXN0P1xuICAgIHRoaXMuX2ZvckVhY2hOb2RlKGVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJhXCIpLCBmdW5jdGlvbihsaW5rTm9kZSkge1xuICAgICAgbGlua0xlbmd0aCArPSB0aGlzLl9nZXRJbm5lclRleHQobGlua05vZGUpLmxlbmd0aDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsaW5rTGVuZ3RoIC8gdGV4dExlbmd0aDtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGFuIGVsZW1lbnRzIGNsYXNzL2lkIHdlaWdodC4gVXNlcyByZWd1bGFyIGV4cHJlc3Npb25zIHRvIHRlbGwgaWYgdGhpc1xuICAgKiBlbGVtZW50IGxvb2tzIGdvb2Qgb3IgYmFkLlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcmV0dXJuIG51bWJlciAoSW50ZWdlcilcbiAgKiovXG4gIF9nZXRDbGFzc1dlaWdodDogZnVuY3Rpb24oZSkge1xuICAgIGlmICghdGhpcy5fZmxhZ0lzQWN0aXZlKHRoaXMuRkxBR19XRUlHSFRfQ0xBU1NFUykpXG4gICAgICByZXR1cm4gMDtcblxuICAgIHZhciB3ZWlnaHQgPSAwO1xuXG4gICAgLy8gTG9vayBmb3IgYSBzcGVjaWFsIGNsYXNzbmFtZVxuICAgIGlmICh0eXBlb2YoZS5jbGFzc05hbWUpID09PSAnc3RyaW5nJyAmJiBlLmNsYXNzTmFtZSAhPT0gJycpIHtcbiAgICAgIGlmICh0aGlzLlJFR0VYUFMubmVnYXRpdmUudGVzdChlLmNsYXNzTmFtZSkpXG4gICAgICAgIHdlaWdodCAtPSAyNTtcblxuICAgICAgaWYgKHRoaXMuUkVHRVhQUy5wb3NpdGl2ZS50ZXN0KGUuY2xhc3NOYW1lKSlcbiAgICAgICAgd2VpZ2h0ICs9IDI1O1xuICAgIH1cblxuICAgIC8vIExvb2sgZm9yIGEgc3BlY2lhbCBJRFxuICAgIGlmICh0eXBlb2YoZS5pZCkgPT09ICdzdHJpbmcnICYmIGUuaWQgIT09ICcnKSB7XG4gICAgICBpZiAodGhpcy5SRUdFWFBTLm5lZ2F0aXZlLnRlc3QoZS5pZCkpXG4gICAgICAgIHdlaWdodCAtPSAyNTtcblxuICAgICAgaWYgKHRoaXMuUkVHRVhQUy5wb3NpdGl2ZS50ZXN0KGUuaWQpKVxuICAgICAgICB3ZWlnaHQgKz0gMjU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHdlaWdodDtcbiAgfSxcblxuICAvKipcbiAgICogQ2xlYW4gYSBub2RlIG9mIGFsbCBlbGVtZW50cyBvZiB0eXBlIFwidGFnXCIuXG4gICAqIChVbmxlc3MgaXQncyBhIHlvdXR1YmUvdmltZW8gdmlkZW8uIFBlb3BsZSBsb3ZlIG1vdmllcy4pXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEBwYXJhbSBzdHJpbmcgdGFnIHRvIGNsZWFuXG4gICAqIEByZXR1cm4gdm9pZFxuICAgKiovXG4gIF9jbGVhbjogZnVuY3Rpb24oZSwgdGFnKSB7XG4gICAgdmFyIGlzRW1iZWQgPSBbXCJvYmplY3RcIiwgXCJlbWJlZFwiLCBcImlmcmFtZVwiXS5pbmRleE9mKHRhZykgIT09IC0xO1xuXG4gICAgdGhpcy5fcmVtb3ZlTm9kZXMoZS5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWcpLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAvLyBBbGxvdyB5b3V0dWJlIGFuZCB2aW1lbyB2aWRlb3MgdGhyb3VnaCBhcyBwZW9wbGUgdXN1YWxseSB3YW50IHRvIHNlZSB0aG9zZS5cbiAgICAgIGlmIChpc0VtYmVkKSB7XG4gICAgICAgIHZhciBhdHRyaWJ1dGVWYWx1ZXMgPSBbXS5tYXAuY2FsbChlbGVtZW50LmF0dHJpYnV0ZXMsIGZ1bmN0aW9uKGF0dHIpIHtcbiAgICAgICAgICByZXR1cm4gYXR0ci52YWx1ZTtcbiAgICAgICAgfSkuam9pbihcInxcIik7XG5cbiAgICAgICAgLy8gRmlyc3QsIGNoZWNrIHRoZSBlbGVtZW50cyBhdHRyaWJ1dGVzIHRvIHNlZSBpZiBhbnkgb2YgdGhlbSBjb250YWluIHlvdXR1YmUgb3IgdmltZW9cbiAgICAgICAgaWYgKHRoaXMuUkVHRVhQUy52aWRlb3MudGVzdChhdHRyaWJ1dGVWYWx1ZXMpKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICAvLyBUaGVuIGNoZWNrIHRoZSBlbGVtZW50cyBpbnNpZGUgdGhpcyBlbGVtZW50IGZvciB0aGUgc2FtZS5cbiAgICAgICAgaWYgKHRoaXMuUkVHRVhQUy52aWRlb3MudGVzdChlbGVtZW50LmlubmVySFRNTCkpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBnaXZlbiBub2RlIGhhcyBvbmUgb2YgaXRzIGFuY2VzdG9yIHRhZyBuYW1lIG1hdGNoaW5nIHRoZVxuICAgKiBwcm92aWRlZCBvbmUuXG4gICAqIEBwYXJhbSAgSFRNTEVsZW1lbnQgbm9kZVxuICAgKiBAcGFyYW0gIFN0cmluZyAgICAgIHRhZ05hbWVcbiAgICogQHBhcmFtICBOdW1iZXIgICAgICBtYXhEZXB0aFxuICAgKiBAcGFyYW0gIEZ1bmN0aW9uICAgIGZpbHRlckZuIGEgZmlsdGVyIHRvIGludm9rZSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIG5vZGUgJ2NvdW50cydcbiAgICogQHJldHVybiBCb29sZWFuXG4gICAqL1xuICBfaGFzQW5jZXN0b3JUYWc6IGZ1bmN0aW9uKG5vZGUsIHRhZ05hbWUsIG1heERlcHRoLCBmaWx0ZXJGbikge1xuICAgIG1heERlcHRoID0gbWF4RGVwdGggfHwgMztcbiAgICB0YWdOYW1lID0gdGFnTmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgIHZhciBkZXB0aCA9IDA7XG4gICAgd2hpbGUgKG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgaWYgKG1heERlcHRoID4gMCAmJiBkZXB0aCA+IG1heERlcHRoKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAobm9kZS5wYXJlbnROb2RlLnRhZ05hbWUgPT09IHRhZ05hbWUgJiYgKCFmaWx0ZXJGbiB8fCBmaWx0ZXJGbihub2RlLnBhcmVudE5vZGUpKSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgZGVwdGgrKztcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYW4gb2JqZWN0IGluZGljYXRpbmcgaG93IG1hbnkgcm93cyBhbmQgY29sdW1ucyB0aGlzIHRhYmxlIGhhcy5cbiAgICovXG4gIF9nZXRSb3dBbmRDb2x1bW5Db3VudDogZnVuY3Rpb24odGFibGUpIHtcbiAgICB2YXIgcm93cyA9IDA7XG4gICAgdmFyIGNvbHVtbnMgPSAwO1xuICAgIHZhciB0cnMgPSB0YWJsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRyXCIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcm93c3BhbiA9IHRyc1tpXS5nZXRBdHRyaWJ1dGUoXCJyb3dzcGFuXCIpIHx8IDA7XG4gICAgICBpZiAocm93c3Bhbikge1xuICAgICAgICByb3dzcGFuID0gcGFyc2VJbnQocm93c3BhbiwgMTApO1xuICAgICAgfVxuICAgICAgcm93cyArPSAocm93c3BhbiB8fCAxKTtcblxuICAgICAgLy8gTm93IGxvb2sgZm9yIGNvbHVtbi1yZWxhdGVkIGluZm9cbiAgICAgIHZhciBjb2x1bW5zSW5UaGlzUm93ID0gMDtcbiAgICAgIHZhciBjZWxscyA9IHRyc1tpXS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRkXCIpO1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjZWxscy5sZW5ndGg7IGorKykge1xuICAgICAgICB2YXIgY29sc3BhbiA9IGNlbGxzW2pdLmdldEF0dHJpYnV0ZShcImNvbHNwYW5cIikgfHwgMDtcbiAgICAgICAgaWYgKGNvbHNwYW4pIHtcbiAgICAgICAgICBjb2xzcGFuID0gcGFyc2VJbnQoY29sc3BhbiwgMTApO1xuICAgICAgICB9XG4gICAgICAgIGNvbHVtbnNJblRoaXNSb3cgKz0gKGNvbHNwYW4gfHwgMSk7XG4gICAgICB9XG4gICAgICBjb2x1bW5zID0gTWF0aC5tYXgoY29sdW1ucywgY29sdW1uc0luVGhpc1Jvdyk7XG4gICAgfVxuICAgIHJldHVybiB7cm93czogcm93cywgY29sdW1uczogY29sdW1uc307XG4gIH0sXG5cbiAgLyoqXG4gICAqIExvb2sgZm9yICdkYXRhJyAoYXMgb3Bwb3NlZCB0byAnbGF5b3V0JykgdGFibGVzLCBmb3Igd2hpY2ggd2UgdXNlXG4gICAqIHNpbWlsYXIgY2hlY2tzIGFzXG4gICAqIGh0dHBzOi8vZHhyLm1vemlsbGEub3JnL21vemlsbGEtY2VudHJhbC9yZXYvNzEyMjQwNDljMGI1MmFiMTkwNTY0ZDNlYTBlYWIwODlhMTU5YTRjZi9hY2Nlc3NpYmxlL2h0bWwvSFRNTFRhYmxlQWNjZXNzaWJsZS5jcHAjOTIwXG4gICAqL1xuICBfbWFya0RhdGFUYWJsZXM6IGZ1bmN0aW9uKHJvb3QpIHtcbiAgICB2YXIgdGFibGVzID0gcm9vdC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRhYmxlXCIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFibGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgdGFibGUgPSB0YWJsZXNbaV07XG4gICAgICB2YXIgcm9sZSA9IHRhYmxlLmdldEF0dHJpYnV0ZShcInJvbGVcIik7XG4gICAgICBpZiAocm9sZSA9PSBcInByZXNlbnRhdGlvblwiKSB7XG4gICAgICAgIHRhYmxlLl9yZWFkYWJpbGl0eURhdGFUYWJsZSA9IGZhbHNlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHZhciBkYXRhdGFibGUgPSB0YWJsZS5nZXRBdHRyaWJ1dGUoXCJkYXRhdGFibGVcIik7XG4gICAgICBpZiAoZGF0YXRhYmxlID09IFwiMFwiKSB7XG4gICAgICAgIHRhYmxlLl9yZWFkYWJpbGl0eURhdGFUYWJsZSA9IGZhbHNlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHZhciBzdW1tYXJ5ID0gdGFibGUuZ2V0QXR0cmlidXRlKFwic3VtbWFyeVwiKTtcbiAgICAgIGlmIChzdW1tYXJ5KSB7XG4gICAgICAgIHRhYmxlLl9yZWFkYWJpbGl0eURhdGFUYWJsZSA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgY2FwdGlvbiA9IHRhYmxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2FwdGlvblwiKVswXTtcbiAgICAgIGlmIChjYXB0aW9uICYmIGNhcHRpb24uY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRhYmxlLl9yZWFkYWJpbGl0eURhdGFUYWJsZSA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgdGFibGUgaGFzIGEgZGVzY2VuZGFudCB3aXRoIGFueSBvZiB0aGVzZSB0YWdzLCBjb25zaWRlciBhIGRhdGEgdGFibGU6XG4gICAgICB2YXIgZGF0YVRhYmxlRGVzY2VuZGFudHMgPSBbXCJjb2xcIiwgXCJjb2xncm91cFwiLCBcInRmb290XCIsIFwidGhlYWRcIiwgXCJ0aFwiXTtcbiAgICAgIHZhciBkZXNjZW5kYW50RXhpc3RzID0gZnVuY3Rpb24odGFnKSB7XG4gICAgICAgIHJldHVybiAhIXRhYmxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZylbMF07XG4gICAgICB9O1xuICAgICAgaWYgKGRhdGFUYWJsZURlc2NlbmRhbnRzLnNvbWUoZGVzY2VuZGFudEV4aXN0cykpIHtcbiAgICAgICAgdGhpcy5sb2coXCJEYXRhIHRhYmxlIGJlY2F1c2UgZm91bmQgZGF0YS15IGRlc2NlbmRhbnRcIik7XG4gICAgICAgIHRhYmxlLl9yZWFkYWJpbGl0eURhdGFUYWJsZSA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBOZXN0ZWQgdGFibGVzIGluZGljYXRlIGEgbGF5b3V0IHRhYmxlOlxuICAgICAgaWYgKHRhYmxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidGFibGVcIilbMF0pIHtcbiAgICAgICAgdGFibGUuX3JlYWRhYmlsaXR5RGF0YVRhYmxlID0gZmFsc2U7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2l6ZUluZm8gPSB0aGlzLl9nZXRSb3dBbmRDb2x1bW5Db3VudCh0YWJsZSk7XG4gICAgICBpZiAoc2l6ZUluZm8ucm93cyA+PSAxMCB8fCBzaXplSW5mby5jb2x1bW5zID4gNCkge1xuICAgICAgICB0YWJsZS5fcmVhZGFiaWxpdHlEYXRhVGFibGUgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8vIE5vdyBqdXN0IGdvIGJ5IHNpemUgZW50aXJlbHk6XG4gICAgICB0YWJsZS5fcmVhZGFiaWxpdHlEYXRhVGFibGUgPSBzaXplSW5mby5yb3dzICogc2l6ZUluZm8uY29sdW1ucyA+IDEwO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQ2xlYW4gYW4gZWxlbWVudCBvZiBhbGwgdGFncyBvZiB0eXBlIFwidGFnXCIgaWYgdGhleSBsb29rIGZpc2h5LlxuICAgKiBcIkZpc2h5XCIgaXMgYW4gYWxnb3JpdGhtIGJhc2VkIG9uIGNvbnRlbnQgbGVuZ3RoLCBjbGFzc25hbWVzLCBsaW5rIGRlbnNpdHksIG51bWJlciBvZiBpbWFnZXMgJiBlbWJlZHMsIGV0Yy5cbiAgICpcbiAgICogQHJldHVybiB2b2lkXG4gICAqKi9cbiAgX2NsZWFuQ29uZGl0aW9uYWxseTogZnVuY3Rpb24oZSwgdGFnKSB7XG4gICAgaWYgKCF0aGlzLl9mbGFnSXNBY3RpdmUodGhpcy5GTEFHX0NMRUFOX0NPTkRJVElPTkFMTFkpKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIGlzTGlzdCA9IHRhZyA9PT0gXCJ1bFwiIHx8IHRhZyA9PT0gXCJvbFwiO1xuXG4gICAgLy8gR2F0aGVyIGNvdW50cyBmb3Igb3RoZXIgdHlwaWNhbCBlbGVtZW50cyBlbWJlZGRlZCB3aXRoaW4uXG4gICAgLy8gVHJhdmVyc2UgYmFja3dhcmRzIHNvIHdlIGNhbiByZW1vdmUgbm9kZXMgYXQgdGhlIHNhbWUgdGltZVxuICAgIC8vIHdpdGhvdXQgZWZmZWN0aW5nIHRoZSB0cmF2ZXJzYWwuXG4gICAgLy9cbiAgICAvLyBUT0RPOiBDb25zaWRlciB0YWtpbmcgaW50byBhY2NvdW50IG9yaWdpbmFsIGNvbnRlbnRTY29yZSBoZXJlLlxuICAgIHRoaXMuX3JlbW92ZU5vZGVzKGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnKSwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgLy8gRmlyc3QgY2hlY2sgaWYgd2UncmUgaW4gYSBkYXRhIHRhYmxlLCBpbiB3aGljaCBjYXNlIGRvbid0IHJlbW92ZSB1cy5cbiAgICAgIHZhciBpc0RhdGFUYWJsZSA9IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIHQuX3JlYWRhYmlsaXR5RGF0YVRhYmxlO1xuICAgICAgfTtcblxuICAgICAgaWYgKHRoaXMuX2hhc0FuY2VzdG9yVGFnKG5vZGUsIFwidGFibGVcIiwgLTEsIGlzRGF0YVRhYmxlKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHZhciB3ZWlnaHQgPSB0aGlzLl9nZXRDbGFzc1dlaWdodChub2RlKTtcbiAgICAgIHZhciBjb250ZW50U2NvcmUgPSAwO1xuXG4gICAgICB0aGlzLmxvZyhcIkNsZWFuaW5nIENvbmRpdGlvbmFsbHlcIiwgbm9kZSk7XG5cbiAgICAgIGlmICh3ZWlnaHQgKyBjb250ZW50U2NvcmUgPCAwKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fZ2V0Q2hhckNvdW50KG5vZGUsICcsJykgPCAxMCkge1xuICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm90IHZlcnkgbWFueSBjb21tYXMsIGFuZCB0aGUgbnVtYmVyIG9mXG4gICAgICAgIC8vIG5vbi1wYXJhZ3JhcGggZWxlbWVudHMgaXMgbW9yZSB0aGFuIHBhcmFncmFwaHMgb3Igb3RoZXJcbiAgICAgICAgLy8gb21pbm91cyBzaWducywgcmVtb3ZlIHRoZSBlbGVtZW50LlxuICAgICAgICB2YXIgcCA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJwXCIpLmxlbmd0aDtcbiAgICAgICAgdmFyIGltZyA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbWdcIikubGVuZ3RoO1xuICAgICAgICB2YXIgbGkgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwibGlcIikubGVuZ3RoIC0gMTAwO1xuICAgICAgICB2YXIgaW5wdXQgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW5wdXRcIikubGVuZ3RoO1xuXG4gICAgICAgIHZhciBlbWJlZENvdW50ID0gMDtcbiAgICAgICAgdmFyIGVtYmVkcyA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJlbWJlZFwiKTtcbiAgICAgICAgZm9yICh2YXIgZWkgPSAwLCBpbCA9IGVtYmVkcy5sZW5ndGg7IGVpIDwgaWw7IGVpICs9IDEpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuUkVHRVhQUy52aWRlb3MudGVzdChlbWJlZHNbZWldLnNyYykpXG4gICAgICAgICAgICBlbWJlZENvdW50ICs9IDE7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGlua0RlbnNpdHkgPSB0aGlzLl9nZXRMaW5rRGVuc2l0eShub2RlKTtcbiAgICAgICAgdmFyIGNvbnRlbnRMZW5ndGggPSB0aGlzLl9nZXRJbm5lclRleHQobm9kZSkubGVuZ3RoO1xuXG4gICAgICAgIHZhciBoYXZlVG9SZW1vdmUgPVxuICAgICAgICAgIChpbWcgPiAxICYmIHAgLyBpbWcgPCAwLjUgJiYgIXRoaXMuX2hhc0FuY2VzdG9yVGFnKG5vZGUsIFwiZmlndXJlXCIpKSB8fFxuICAgICAgICAgICghaXNMaXN0ICYmIGxpID4gcCkgfHxcbiAgICAgICAgICAoaW5wdXQgPiBNYXRoLmZsb29yKHAvMykpIHx8XG4gICAgICAgICAgKCFpc0xpc3QgJiYgY29udGVudExlbmd0aCA8IDI1ICYmIChpbWcgPT09IDAgfHwgaW1nID4gMikgJiYgIXRoaXMuX2hhc0FuY2VzdG9yVGFnKG5vZGUsIFwiZmlndXJlXCIpKSB8fFxuICAgICAgICAgICghaXNMaXN0ICYmIHdlaWdodCA8IDI1ICYmIGxpbmtEZW5zaXR5ID4gMC4yKSB8fFxuICAgICAgICAgICh3ZWlnaHQgPj0gMjUgJiYgbGlua0RlbnNpdHkgPiAwLjUpIHx8XG4gICAgICAgICAgKChlbWJlZENvdW50ID09PSAxICYmIGNvbnRlbnRMZW5ndGggPCA3NSkgfHwgZW1iZWRDb3VudCA+IDEpO1xuICAgICAgICByZXR1cm4gaGF2ZVRvUmVtb3ZlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDbGVhbiBvdXQgZWxlbWVudHMgd2hvc2UgaWQvY2xhc3MgY29tYmluYXRpb25zIG1hdGNoIHNwZWNpZmljIHN0cmluZy5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHBhcmFtIFJlZ0V4cCBtYXRjaCBpZC9jbGFzcyBjb21iaW5hdGlvbi5cbiAgICogQHJldHVybiB2b2lkXG4gICAqKi9cbiAgX2NsZWFuTWF0Y2hlZE5vZGVzOiBmdW5jdGlvbihlLCByZWdleCkge1xuICAgIHZhciBlbmRPZlNlYXJjaE1hcmtlck5vZGUgPSB0aGlzLl9nZXROZXh0Tm9kZShlLCB0cnVlKTtcbiAgICB2YXIgbmV4dCA9IHRoaXMuX2dldE5leHROb2RlKGUpO1xuICAgIHdoaWxlIChuZXh0ICYmIG5leHQgIT0gZW5kT2ZTZWFyY2hNYXJrZXJOb2RlKSB7XG4gICAgICBpZiAocmVnZXgudGVzdChuZXh0LmNsYXNzTmFtZSArIFwiIFwiICsgbmV4dC5pZCkpIHtcbiAgICAgICAgbmV4dCA9IHRoaXMuX3JlbW92ZUFuZEdldE5leHQobmV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXh0ID0gdGhpcy5fZ2V0TmV4dE5vZGUobmV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBDbGVhbiBvdXQgc3B1cmlvdXMgaGVhZGVycyBmcm9tIGFuIEVsZW1lbnQuIENoZWNrcyB0aGluZ3MgbGlrZSBjbGFzc25hbWVzIGFuZCBsaW5rIGRlbnNpdHkuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEByZXR1cm4gdm9pZFxuICAqKi9cbiAgX2NsZWFuSGVhZGVyczogZnVuY3Rpb24oZSkge1xuICAgIGZvciAodmFyIGhlYWRlckluZGV4ID0gMTsgaGVhZGVySW5kZXggPCAzOyBoZWFkZXJJbmRleCArPSAxKSB7XG4gICAgICB0aGlzLl9yZW1vdmVOb2RlcyhlLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoJyArIGhlYWRlckluZGV4KSwgZnVuY3Rpb24gKGhlYWRlcikge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0Q2xhc3NXZWlnaHQoaGVhZGVyKSA8IDA7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgX2ZsYWdJc0FjdGl2ZTogZnVuY3Rpb24oZmxhZykge1xuICAgIHJldHVybiAodGhpcy5fZmxhZ3MgJiBmbGFnKSA+IDA7XG4gIH0sXG5cbiAgX3JlbW92ZUZsYWc6IGZ1bmN0aW9uKGZsYWcpIHtcbiAgICB0aGlzLl9mbGFncyA9IHRoaXMuX2ZsYWdzICYgfmZsYWc7XG4gIH0sXG5cbiAgX2lzUHJvYmFibHlWaXNpYmxlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUuc3R5bGUuZGlzcGxheSAhPSBcIm5vbmVcIiAmJiAhbm9kZS5oYXNBdHRyaWJ1dGUoXCJoaWRkZW5cIik7XG4gIH0sXG5cbiAgLyoqXG4gICAqIERlY2lkZXMgd2hldGhlciBvciBub3QgdGhlIGRvY3VtZW50IGlzIHJlYWRlci1hYmxlIHdpdGhvdXQgcGFyc2luZyB0aGUgd2hvbGUgdGhpbmcuXG4gICAqXG4gICAqIEByZXR1cm4gYm9vbGVhbiBXaGV0aGVyIG9yIG5vdCB3ZSBzdXNwZWN0IHBhcnNlKCkgd2lsbCBzdWNlZWVkIGF0IHJldHVybmluZyBhbiBhcnRpY2xlIG9iamVjdC5cbiAgICovXG4gIGlzUHJvYmFibHlSZWFkZXJhYmxlOiBmdW5jdGlvbihoZWxwZXJJc1Zpc2libGUpIHtcbiAgICB2YXIgbm9kZXMgPSB0aGlzLl9nZXRBbGxOb2Rlc1dpdGhUYWcodGhpcy5fZG9jLCBbXCJwXCIsIFwicHJlXCJdKTtcblxuICAgIC8vIEdldCA8ZGl2PiBub2RlcyB3aGljaCBoYXZlIDxicj4gbm9kZShzKSBhbmQgYXBwZW5kIHRoZW0gaW50byB0aGUgYG5vZGVzYCB2YXJpYWJsZS5cbiAgICAvLyBTb21lIGFydGljbGVzJyBET00gc3RydWN0dXJlcyBtaWdodCBsb29rIGxpa2VcbiAgICAvLyA8ZGl2PlxuICAgIC8vICAgU2VudGVuY2VzPGJyPlxuICAgIC8vICAgPGJyPlxuICAgIC8vICAgU2VudGVuY2VzPGJyPlxuICAgIC8vIDwvZGl2PlxuICAgIHZhciBick5vZGVzID0gdGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKHRoaXMuX2RvYywgW1wiZGl2ID4gYnJcIl0pO1xuICAgIGlmIChick5vZGVzLmxlbmd0aCkge1xuICAgICAgdmFyIHNldCA9IG5ldyBTZXQoKTtcbiAgICAgIFtdLmZvckVhY2guY2FsbChick5vZGVzLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHNldC5hZGQobm9kZS5wYXJlbnROb2RlKTtcbiAgICAgIH0pO1xuICAgICAgbm9kZXMgPSBbXS5jb25jYXQuYXBwbHkoQXJyYXkuZnJvbShzZXQpLCBub2Rlcyk7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJJc1Zpc2libGUpIHtcbiAgICAgIGhlbHBlcklzVmlzaWJsZSA9IHRoaXMuX2lzUHJvYmFibHlWaXNpYmxlO1xuICAgIH1cblxuICAgIHZhciBzY29yZSA9IDA7XG4gICAgLy8gVGhpcyBpcyBhIGxpdHRsZSBjaGVla3ksIHdlIHVzZSB0aGUgYWNjdW11bGF0b3IgJ3Njb3JlJyB0byBkZWNpZGUgd2hhdCB0byByZXR1cm4gZnJvbVxuICAgIC8vIHRoaXMgY2FsbGJhY2s6XG4gICAgcmV0dXJuIHRoaXMuX3NvbWVOb2RlKG5vZGVzLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICBpZiAoaGVscGVySXNWaXNpYmxlICYmICFoZWxwZXJJc1Zpc2libGUobm9kZSkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHZhciBtYXRjaFN0cmluZyA9IG5vZGUuY2xhc3NOYW1lICsgXCIgXCIgKyBub2RlLmlkO1xuXG4gICAgICBpZiAodGhpcy5SRUdFWFBTLnVubGlrZWx5Q2FuZGlkYXRlcy50ZXN0KG1hdGNoU3RyaW5nKSAmJlxuICAgICAgICAgICF0aGlzLlJFR0VYUFMub2tNYXliZUl0c0FDYW5kaWRhdGUudGVzdChtYXRjaFN0cmluZykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAobm9kZS5tYXRjaGVzICYmIG5vZGUubWF0Y2hlcyhcImxpIHBcIikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICB2YXIgdGV4dENvbnRlbnRMZW5ndGggPSBub2RlLnRleHRDb250ZW50LnRyaW0oKS5sZW5ndGg7XG4gICAgICBpZiAodGV4dENvbnRlbnRMZW5ndGggPCAxNDApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBzY29yZSArPSBNYXRoLnNxcnQodGV4dENvbnRlbnRMZW5ndGggLSAxNDApO1xuXG4gICAgICBpZiAoc2NvcmUgPiAyMCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogUnVucyByZWFkYWJpbGl0eS5cbiAgICpcbiAgICogV29ya2Zsb3c6XG4gICAqICAxLiBQcmVwIHRoZSBkb2N1bWVudCBieSByZW1vdmluZyBzY3JpcHQgdGFncywgY3NzLCBldGMuXG4gICAqICAyLiBCdWlsZCByZWFkYWJpbGl0eSdzIERPTSB0cmVlLlxuICAgKiAgMy4gR3JhYiB0aGUgYXJ0aWNsZSBjb250ZW50IGZyb20gdGhlIGN1cnJlbnQgZG9tIHRyZWUuXG4gICAqICA0LiBSZXBsYWNlIHRoZSBjdXJyZW50IERPTSB0cmVlIHdpdGggdGhlIG5ldyBvbmUuXG4gICAqICA1LiBSZWFkIHBlYWNlZnVsbHkuXG4gICAqXG4gICAqIEByZXR1cm4gdm9pZFxuICAgKiovXG4gIHBhcnNlOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gQXZvaWQgcGFyc2luZyB0b28gbGFyZ2UgZG9jdW1lbnRzLCBhcyBwZXIgY29uZmlndXJhdGlvbiBvcHRpb25cbiAgICBpZiAodGhpcy5fbWF4RWxlbXNUb1BhcnNlID4gMCkge1xuICAgICAgdmFyIG51bVRhZ3MgPSB0aGlzLl9kb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCIqXCIpLmxlbmd0aDtcbiAgICAgIGlmIChudW1UYWdzID4gdGhpcy5fbWF4RWxlbXNUb1BhcnNlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkFib3J0aW5nIHBhcnNpbmcgZG9jdW1lbnQ7IFwiICsgbnVtVGFncyArIFwiIGVsZW1lbnRzIGZvdW5kXCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlbW92ZSBzY3JpcHQgdGFncyBmcm9tIHRoZSBkb2N1bWVudC5cbiAgICB0aGlzLl9yZW1vdmVTY3JpcHRzKHRoaXMuX2RvYyk7XG5cbiAgICB0aGlzLl9wcmVwRG9jdW1lbnQoKTtcblxuICAgIHZhciBtZXRhZGF0YSA9IHRoaXMuX2dldEFydGljbGVNZXRhZGF0YSgpO1xuICAgIHRoaXMuX2FydGljbGVUaXRsZSA9IG1ldGFkYXRhLnRpdGxlO1xuXG4gICAgdmFyIGFydGljbGVDb250ZW50ID0gdGhpcy5fZ3JhYkFydGljbGUoKTtcbiAgICBpZiAoIWFydGljbGVDb250ZW50KVxuICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICB0aGlzLmxvZyhcIkdyYWJiZWQ6IFwiICsgYXJ0aWNsZUNvbnRlbnQuaW5uZXJIVE1MKTtcblxuICAgIHRoaXMuX3Bvc3RQcm9jZXNzQ29udGVudChhcnRpY2xlQ29udGVudCk7XG5cbiAgICAvLyBJZiB3ZSBoYXZlbid0IGZvdW5kIGFuIGV4Y2VycHQgaW4gdGhlIGFydGljbGUncyBtZXRhZGF0YSwgdXNlIHRoZSBhcnRpY2xlJ3NcbiAgICAvLyBmaXJzdCBwYXJhZ3JhcGggYXMgdGhlIGV4Y2VycHQuIFRoaXMgaXMgdXNlZCBmb3IgZGlzcGxheWluZyBhIHByZXZpZXcgb2ZcbiAgICAvLyB0aGUgYXJ0aWNsZSdzIGNvbnRlbnQuXG4gICAgaWYgKCFtZXRhZGF0YS5leGNlcnB0KSB7XG4gICAgICB2YXIgcGFyYWdyYXBocyA9IGFydGljbGVDb250ZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicFwiKTtcbiAgICAgIGlmIChwYXJhZ3JhcGhzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbWV0YWRhdGEuZXhjZXJwdCA9IHBhcmFncmFwaHNbMF0udGV4dENvbnRlbnQudHJpbSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciB0ZXh0Q29udGVudCA9IGFydGljbGVDb250ZW50LnRleHRDb250ZW50O1xuICAgIHJldHVybiB7XG4gICAgICB0aXRsZTogdGhpcy5fYXJ0aWNsZVRpdGxlLFxuICAgICAgYnlsaW5lOiBtZXRhZGF0YS5ieWxpbmUgfHwgdGhpcy5fYXJ0aWNsZUJ5bGluZSxcbiAgICAgIGRpcjogdGhpcy5fYXJ0aWNsZURpcixcbiAgICAgIGNvbnRlbnQ6IGFydGljbGVDb250ZW50LmlubmVySFRNTCxcbiAgICAgIHRleHRDb250ZW50OiB0ZXh0Q29udGVudCxcbiAgICAgIGxlbmd0aDogdGV4dENvbnRlbnQubGVuZ3RoLFxuICAgICAgZXhjZXJwdDogbWV0YWRhdGEuZXhjZXJwdCxcbiAgICB9O1xuICB9XG59O1xuXG5pZiAodHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIikge1xuICBtb2R1bGUuZXhwb3J0cyA9IFJlYWRhYmlsaXR5O1xufVxuIl19
