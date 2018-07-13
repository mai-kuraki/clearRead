(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by zhengliuyang on 2018/7/13.
 */
var Readability = function Readability(doc) {
    _classCallCheck(this, Readability);

    if (!doc) {
        throw new Error("argument to Readability constructor should be a dom object.");
    }
    this._doc = doc;
    this._articleTitle = null;
};

exports.default = Readability;


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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXZTcmMvUmVhZGFiaWxpdHkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OztBQ0FBOzs7SUFHcUIsVyxHQUNqQixxQkFBWSxHQUFaLEVBQWlCO0FBQUE7O0FBQ2IsUUFBRyxDQUFDLEdBQUosRUFBUztBQUNMLGNBQU0sSUFBSSxLQUFKLENBQVUsNkRBQVYsQ0FBTjtBQUNIO0FBQ0QsU0FBSyxJQUFMLEdBQVksR0FBWjtBQUNBLFNBQUssYUFBTCxHQUFxQixJQUFyQjtBQUNILEM7O2tCQVBnQixXOzs7QUFVckIsWUFBWSxTQUFaLEdBQXdCO0FBQ3BCLDBCQUFzQixHQURGO0FBRXBCLHlCQUFxQixHQUZEO0FBR3BCLDhCQUEwQixHQUhOOztBQUtwQjtBQUNBLGtCQUFjLENBTk07QUFPcEIsZUFBVyxDQVBTOztBQVNwQjtBQUNBLGdDQUE0QixDQVZSOztBQVlwQjtBQUNBO0FBQ0EsOEJBQTBCLENBZE47O0FBZ0JwQjtBQUNBLDJCQUF1QixrQ0FBa0MsV0FBbEMsR0FBZ0QsS0FBaEQsQ0FBc0QsR0FBdEQsQ0FqQkg7O0FBbUJwQjtBQUNBLDRCQUF3QixHQXBCSjs7QUFzQnBCO0FBQ0E7QUFDQSxhQUFTO0FBQ0wsNEJBQW9CLHlPQURmO0FBRUwsOEJBQXNCLHNDQUZqQjtBQUdMLGtCQUFVLHNGQUhMO0FBSUwsa0JBQVUsOE1BSkw7QUFLTCxvQkFBWSxxRkFMUDtBQU1MLGdCQUFRLDRDQU5IO0FBT0wsc0JBQWMsb0JBUFQ7QUFRTCxtQkFBVyxTQVJOO0FBU0wsZ0JBQVEsd0VBVEg7QUFVTCxrQkFBVSwrQ0FWTDtBQVdMLGtCQUFVLDBCQVhMO0FBWUwsb0JBQVksT0FaUDtBQWFMLG9CQUFZO0FBYlAsS0F4Qlc7O0FBd0NwQixvQkFBZ0IsQ0FBRSxHQUFGLEVBQU8sWUFBUCxFQUFxQixJQUFyQixFQUEyQixLQUEzQixFQUFrQyxLQUFsQyxFQUF5QyxJQUF6QyxFQUEr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O0FBQ0o7O0FBRUQsWUFBSSxjQUFjLGVBQWUsV0FBakM7QUFDQSxlQUFPO0FBQ0gsbUJBQU8sS0FBSyxhQURUO0FBRUgsb0JBQVEsU0FBUyxNQUFULElBQW1CLEtBQUssY0FGN0I7QUFHSCxpQkFBSyxLQUFLLFdBSFA7QUFJSCxxQkFBUyxlQUFlLFNBSnJCO0FBS0gseUJBQWEsV0FMVjtBQU1ILG9CQUFRLFlBQVksTUFOakI7QUFPSCxxQkFBUyxTQUFTO0FBUGYsU0FBUDtBQVNIO0FBeHJEbUIsQ0FBeEIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKipcbiAqIENyZWF0ZWQgYnkgemhlbmdsaXV5YW5nIG9uIDIwMTgvNy8xMy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVhZGFiaWxpdHkge1xuICAgIGNvbnN0cnVjdG9yKGRvYykge1xuICAgICAgICBpZighZG9jKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJhcmd1bWVudCB0byBSZWFkYWJpbGl0eSBjb25zdHJ1Y3RvciBzaG91bGQgYmUgYSBkb20gb2JqZWN0LlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kb2MgPSBkb2M7XG4gICAgICAgIHRoaXMuX2FydGljbGVUaXRsZSA9IG51bGw7XG4gICAgfVxufVxuXG5SZWFkYWJpbGl0eS5wcm90b3R5cGUgPSB7XG4gICAgRkxBR19TVFJJUF9VTkxJS0VMWVM6IDB4MSxcbiAgICBGTEFHX1dFSUdIVF9DTEFTU0VTOiAweDIsXG4gICAgRkxBR19DTEVBTl9DT05ESVRJT05BTExZOiAweDQsXG5cbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZS9ub2RlVHlwZVxuICAgIEVMRU1FTlRfTk9ERTogMSxcbiAgICBURVhUX05PREU6IDMsXG5cbiAgICAvLyBNYXggbnVtYmVyIG9mIG5vZGVzIHN1cHBvcnRlZCBieSB0aGlzIHBhcnNlci4gRGVmYXVsdDogMCAobm8gbGltaXQpXG4gICAgREVGQVVMVF9NQVhfRUxFTVNfVE9fUEFSU0U6IDAsXG5cbiAgICAvLyBUaGUgbnVtYmVyIG9mIHRvcCBjYW5kaWRhdGVzIHRvIGNvbnNpZGVyIHdoZW4gYW5hbHlzaW5nIGhvd1xuICAgIC8vIHRpZ2h0IHRoZSBjb21wZXRpdGlvbiBpcyBhbW9uZyBjYW5kaWRhdGVzLlxuICAgIERFRkFVTFRfTl9UT1BfQ0FORElEQVRFUzogNSxcblxuICAgIC8vIEVsZW1lbnQgdGFncyB0byBzY29yZSBieSBkZWZhdWx0LlxuICAgIERFRkFVTFRfVEFHU19UT19TQ09SRTogXCJzZWN0aW9uLGgyLGgzLGg0LGg1LGg2LHAsdGQscHJlXCIudG9VcHBlckNhc2UoKS5zcGxpdChcIixcIiksXG5cbiAgICAvLyBUaGUgZGVmYXVsdCBudW1iZXIgb2YgY2hhcnMgYW4gYXJ0aWNsZSBtdXN0IGhhdmUgaW4gb3JkZXIgdG8gcmV0dXJuIGEgcmVzdWx0XG4gICAgREVGQVVMVF9DSEFSX1RIUkVTSE9MRDogNTAwLFxuXG4gICAgLy8gQWxsIG9mIHRoZSByZWd1bGFyIGV4cHJlc3Npb25zIGluIHVzZSB3aXRoaW4gcmVhZGFiaWxpdHkuXG4gICAgLy8gRGVmaW5lZCB1cCBoZXJlIHNvIHdlIGRvbid0IGluc3RhbnRpYXRlIHRoZW0gcmVwZWF0ZWRseSBpbiBsb29wcy5cbiAgICBSRUdFWFBTOiB7XG4gICAgICAgIHVubGlrZWx5Q2FuZGlkYXRlczogLy1hZC18YmFubmVyfGJyZWFkY3J1bWJzfGNvbWJ4fGNvbW1lbnR8Y29tbXVuaXR5fGNvdmVyLXdyYXB8ZGlzcXVzfGV4dHJhfGZvb3R8aGVhZGVyfGxlZ2VuZHN8bWVudXxyZWxhdGVkfHJlbWFya3xyZXBsaWVzfHJzc3xzaG91dGJveHxzaWRlYmFyfHNreXNjcmFwZXJ8c29jaWFsfHNwb25zb3J8c3VwcGxlbWVudGFsfGFkLWJyZWFrfGFnZWdhdGV8cGFnaW5hdGlvbnxwYWdlcnxwb3B1cHx5b20tcmVtb3RlL2ksXG4gICAgICAgIG9rTWF5YmVJdHNBQ2FuZGlkYXRlOiAvYW5kfGFydGljbGV8Ym9keXxjb2x1bW58bWFpbnxzaGFkb3cvaSxcbiAgICAgICAgcG9zaXRpdmU6IC9hcnRpY2xlfGJvZHl8Y29udGVudHxlbnRyeXxoZW50cnl8aC1lbnRyeXxtYWlufHBhZ2V8cGFnaW5hdGlvbnxwb3N0fHRleHR8YmxvZ3xzdG9yeS9pLFxuICAgICAgICBuZWdhdGl2ZTogL2hpZGRlbnxeaGlkJHwgaGlkJHwgaGlkIHxeaGlkIHxiYW5uZXJ8Y29tYnh8Y29tbWVudHxjb20tfGNvbnRhY3R8Zm9vdHxmb290ZXJ8Zm9vdG5vdGV8bWFzdGhlYWR8bWVkaWF8bWV0YXxvdXRicmFpbnxwcm9tb3xyZWxhdGVkfHNjcm9sbHxzaGFyZXxzaG91dGJveHxzaWRlYmFyfHNreXNjcmFwZXJ8c3BvbnNvcnxzaG9wcGluZ3x0YWdzfHRvb2x8d2lkZ2V0L2ksXG4gICAgICAgIGV4dHJhbmVvdXM6IC9wcmludHxhcmNoaXZlfGNvbW1lbnR8ZGlzY3Vzc3xlW1xcLV0/bWFpbHxzaGFyZXxyZXBseXxhbGx8bG9naW58c2lnbnxzaW5nbGV8dXRpbGl0eS9pLFxuICAgICAgICBieWxpbmU6IC9ieWxpbmV8YXV0aG9yfGRhdGVsaW5lfHdyaXR0ZW5ieXxwLWF1dGhvci9pLFxuICAgICAgICByZXBsYWNlRm9udHM6IC88KFxcLz8pZm9udFtePl0qPi9naSxcbiAgICAgICAgbm9ybWFsaXplOiAvXFxzezIsfS9nLFxuICAgICAgICB2aWRlb3M6IC9cXC9cXC8od3d3XFwuKT8oZGFpbHltb3Rpb258eW91dHViZXx5b3V0dWJlLW5vY29va2llfHBsYXllclxcLnZpbWVvKVxcLmNvbS9pLFxuICAgICAgICBuZXh0TGluazogLyhuZXh0fHdlaXRlcnxjb250aW51ZXw+KFteXFx8XXwkKXzCuyhbXlxcfF18JCkpL2ksXG4gICAgICAgIHByZXZMaW5rOiAvKHByZXZ8ZWFybHxvbGR8bmV3fDx8wqspL2ksXG4gICAgICAgIHdoaXRlc3BhY2U6IC9eXFxzKiQvLFxuICAgICAgICBoYXNDb250ZW50OiAvXFxTJC8sXG4gICAgfSxcblxuICAgIERJVl9UT19QX0VMRU1TOiBbIFwiQVwiLCBcIkJMT0NLUVVPVEVcIiwgXCJETFwiLCBcIkRJVlwiLCBcIklNR1wiLCBcIk9MXCIsIFwiUFwiLCBcIlBSRVwiLCBcIlRBQkxFXCIsIFwiVUxcIiwgXCJTRUxFQ1RcIiBdLFxuXG4gICAgQUxURVJfVE9fRElWX0VYQ0VQVElPTlM6IFtcIkRJVlwiLCBcIkFSVElDTEVcIiwgXCJTRUNUSU9OXCIsIFwiUFwiXSxcblxuICAgIFBSRVNFTlRBVElPTkFMX0FUVFJJQlVURVM6IFsgXCJhbGlnblwiLCBcImJhY2tncm91bmRcIiwgXCJiZ2NvbG9yXCIsIFwiYm9yZGVyXCIsIFwiY2VsbHBhZGRpbmdcIiwgXCJjZWxsc3BhY2luZ1wiLCBcImZyYW1lXCIsIFwiaHNwYWNlXCIsIFwicnVsZXNcIiwgXCJzdHlsZVwiLCBcInZhbGlnblwiLCBcInZzcGFjZVwiIF0sXG5cbiAgICBERVBSRUNBVEVEX1NJWkVfQVRUUklCVVRFX0VMRU1TOiBbIFwiVEFCTEVcIiwgXCJUSFwiLCBcIlREXCIsIFwiSFJcIiwgXCJQUkVcIiBdLFxuXG4gICAgLy8gVGhlIGNvbW1lbnRlZCBvdXQgZWxlbWVudHMgcXVhbGlmeSBhcyBwaHJhc2luZyBjb250ZW50IGJ1dCB0ZW5kIHRvIGJlXG4gICAgLy8gcmVtb3ZlZCBieSByZWFkYWJpbGl0eSB3aGVuIHB1dCBpbnRvIHBhcmFncmFwaHMsIHNvIHdlIGlnbm9yZSB0aGVtIGhlcmUuXG4gICAgUEhSQVNJTkdfRUxFTVM6IFtcbiAgICAgICAgLy8gXCJDQU5WQVNcIiwgXCJJRlJBTUVcIiwgXCJTVkdcIiwgXCJWSURFT1wiLFxuICAgICAgICBcIkFCQlJcIiwgXCJBVURJT1wiLCBcIkJcIiwgXCJCRE9cIiwgXCJCUlwiLCBcIkJVVFRPTlwiLCBcIkNJVEVcIiwgXCJDT0RFXCIsIFwiREFUQVwiLFxuICAgICAgICBcIkRBVEFMSVNUXCIsIFwiREZOXCIsIFwiRU1cIiwgXCJFTUJFRFwiLCBcIklcIiwgXCJJTUdcIiwgXCJJTlBVVFwiLCBcIktCRFwiLCBcIkxBQkVMXCIsXG4gICAgICAgIFwiTUFSS1wiLCBcIk1BVEhcIiwgXCJNRVRFUlwiLCBcIk5PU0NSSVBUXCIsIFwiT0JKRUNUXCIsIFwiT1VUUFVUXCIsIFwiUFJPR1JFU1NcIiwgXCJRXCIsXG4gICAgICAgIFwiUlVCWVwiLCBcIlNBTVBcIiwgXCJTQ1JJUFRcIiwgXCJTRUxFQ1RcIiwgXCJTTUFMTFwiLCBcIlNQQU5cIiwgXCJTVFJPTkdcIiwgXCJTVUJcIixcbiAgICAgICAgXCJTVVBcIiwgXCJURVhUQVJFQVwiLCBcIlRJTUVcIiwgXCJWQVJcIiwgXCJXQlJcIlxuICAgIF0sXG5cbiAgICAvLyBUaGVzZSBhcmUgdGhlIGNsYXNzZXMgdGhhdCByZWFkYWJpbGl0eSBzZXRzIGl0c2VsZi5cbiAgICBDTEFTU0VTX1RPX1BSRVNFUlZFOiBbIFwicGFnZVwiIF0sXG5cbiAgICAvKipcbiAgICAgKiBSdW4gYW55IHBvc3QtcHJvY2VzcyBtb2RpZmljYXRpb25zIHRvIGFydGljbGUgY29udGVudCBhcyBuZWNlc3NhcnkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gRWxlbWVudFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqKi9cbiAgICBfcG9zdFByb2Nlc3NDb250ZW50OiBmdW5jdGlvbihhcnRpY2xlQ29udGVudCkge1xuICAgICAgICAvLyBSZWFkYWJpbGl0eSBjYW5ub3Qgb3BlbiByZWxhdGl2ZSB1cmlzIHNvIHdlIGNvbnZlcnQgdGhlbSB0byBhYnNvbHV0ZSB1cmlzLlxuICAgICAgICB0aGlzLl9maXhSZWxhdGl2ZVVyaXMoYXJ0aWNsZUNvbnRlbnQpO1xuXG4gICAgICAgIC8vIFJlbW92ZSBjbGFzc2VzLlxuICAgICAgICB0aGlzLl9jbGVhbkNsYXNzZXMoYXJ0aWNsZUNvbnRlbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlcyBvdmVyIGEgTm9kZUxpc3QsIGNhbGxzIGBmaWx0ZXJGbmAgZm9yIGVhY2ggbm9kZSBhbmQgcmVtb3ZlcyBub2RlXG4gICAgICogaWYgZnVuY3Rpb24gcmV0dXJuZWQgYHRydWVgLlxuICAgICAqXG4gICAgICogSWYgZnVuY3Rpb24gaXMgbm90IHBhc3NlZCwgcmVtb3ZlcyBhbGwgdGhlIG5vZGVzIGluIG5vZGUgbGlzdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBOb2RlTGlzdCBub2RlTGlzdCBUaGUgbm9kZXMgdG8gb3BlcmF0ZSBvblxuICAgICAqIEBwYXJhbSBGdW5jdGlvbiBmaWx0ZXJGbiB0aGUgZnVuY3Rpb24gdG8gdXNlIGFzIGEgZmlsdGVyXG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICovXG4gICAgX3JlbW92ZU5vZGVzOiBmdW5jdGlvbihub2RlTGlzdCwgZmlsdGVyRm4pIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IG5vZGVMaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IG5vZGVMaXN0W2ldO1xuICAgICAgICAgICAgdmFyIHBhcmVudE5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICAgICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgIGlmICghZmlsdGVyRm4gfHwgZmlsdGVyRm4uY2FsbCh0aGlzLCBub2RlLCBpLCBub2RlTGlzdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSXRlcmF0ZXMgb3ZlciBhIE5vZGVMaXN0LCBhbmQgY2FsbHMgX3NldE5vZGVUYWcgZm9yIGVhY2ggbm9kZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBOb2RlTGlzdCBub2RlTGlzdCBUaGUgbm9kZXMgdG8gb3BlcmF0ZSBvblxuICAgICAqIEBwYXJhbSBTdHJpbmcgbmV3VGFnTmFtZSB0aGUgbmV3IHRhZyBuYW1lIHRvIHVzZVxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqL1xuICAgIF9yZXBsYWNlTm9kZVRhZ3M6IGZ1bmN0aW9uKG5vZGVMaXN0LCBuZXdUYWdOYW1lKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBub2RlTGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSBub2RlTGlzdFtpXTtcbiAgICAgICAgICAgIHRoaXMuX3NldE5vZGVUYWcobm9kZSwgbmV3VGFnTmFtZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSXRlcmF0ZSBvdmVyIGEgTm9kZUxpc3QsIHdoaWNoIGRvZXNuJ3QgbmF0aXZlbHkgZnVsbHkgaW1wbGVtZW50IHRoZSBBcnJheVxuICAgICAqIGludGVyZmFjZS5cbiAgICAgKlxuICAgICAqIEZvciBjb252ZW5pZW5jZSwgdGhlIGN1cnJlbnQgb2JqZWN0IGNvbnRleHQgaXMgYXBwbGllZCB0byB0aGUgcHJvdmlkZWRcbiAgICAgKiBpdGVyYXRlIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtICBOb2RlTGlzdCBub2RlTGlzdCBUaGUgTm9kZUxpc3QuXG4gICAgICogQHBhcmFtICBGdW5jdGlvbiBmbiAgICAgICBUaGUgaXRlcmF0ZSBmdW5jdGlvbi5cbiAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgKi9cbiAgICBfZm9yRWFjaE5vZGU6IGZ1bmN0aW9uKG5vZGVMaXN0LCBmbikge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKG5vZGVMaXN0LCBmbiwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEl0ZXJhdGUgb3ZlciBhIE5vZGVMaXN0LCByZXR1cm4gdHJ1ZSBpZiBhbnkgb2YgdGhlIHByb3ZpZGVkIGl0ZXJhdGVcbiAgICAgKiBmdW5jdGlvbiBjYWxscyByZXR1cm5zIHRydWUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEZvciBjb252ZW5pZW5jZSwgdGhlIGN1cnJlbnQgb2JqZWN0IGNvbnRleHQgaXMgYXBwbGllZCB0byB0aGVcbiAgICAgKiBwcm92aWRlZCBpdGVyYXRlIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtICBOb2RlTGlzdCBub2RlTGlzdCBUaGUgTm9kZUxpc3QuXG4gICAgICogQHBhcmFtICBGdW5jdGlvbiBmbiAgICAgICBUaGUgaXRlcmF0ZSBmdW5jdGlvbi5cbiAgICAgKiBAcmV0dXJuIEJvb2xlYW5cbiAgICAgKi9cbiAgICBfc29tZU5vZGU6IGZ1bmN0aW9uKG5vZGVMaXN0LCBmbikge1xuICAgICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNvbWUuY2FsbChub2RlTGlzdCwgZm4sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlIG92ZXIgYSBOb2RlTGlzdCwgcmV0dXJuIHRydWUgaWYgYWxsIG9mIHRoZSBwcm92aWRlZCBpdGVyYXRlXG4gICAgICogZnVuY3Rpb24gY2FsbHMgcmV0dXJuIHRydWUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEZvciBjb252ZW5pZW5jZSwgdGhlIGN1cnJlbnQgb2JqZWN0IGNvbnRleHQgaXMgYXBwbGllZCB0byB0aGVcbiAgICAgKiBwcm92aWRlZCBpdGVyYXRlIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtICBOb2RlTGlzdCBub2RlTGlzdCBUaGUgTm9kZUxpc3QuXG4gICAgICogQHBhcmFtICBGdW5jdGlvbiBmbiAgICAgICBUaGUgaXRlcmF0ZSBmdW5jdGlvbi5cbiAgICAgKiBAcmV0dXJuIEJvb2xlYW5cbiAgICAgKi9cbiAgICBfZXZlcnlOb2RlOiBmdW5jdGlvbihub2RlTGlzdCwgZm4pIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5ldmVyeS5jYWxsKG5vZGVMaXN0LCBmbiwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENvbmNhdCBhbGwgbm9kZWxpc3RzIHBhc3NlZCBhcyBhcmd1bWVudHMuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIC4uLk5vZGVMaXN0XG4gICAgICogQHJldHVybiBBcnJheVxuICAgICAqL1xuICAgIF9jb25jYXROb2RlTGlzdHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG4gICAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICB2YXIgbm9kZUxpc3RzID0gYXJncy5tYXAoZnVuY3Rpb24obGlzdCkge1xuICAgICAgICAgICAgcmV0dXJuIHNsaWNlLmNhbGwobGlzdCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSwgbm9kZUxpc3RzKTtcbiAgICB9LFxuXG4gICAgX2dldEFsbE5vZGVzV2l0aFRhZzogZnVuY3Rpb24obm9kZSwgdGFnTmFtZXMpIHtcbiAgICAgICAgaWYgKG5vZGUucXVlcnlTZWxlY3RvckFsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUucXVlcnlTZWxlY3RvckFsbCh0YWdOYW1lcy5qb2luKCcsJykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbXS5jb25jYXQuYXBwbHkoW10sIHRhZ05hbWVzLm1hcChmdW5jdGlvbih0YWcpIHtcbiAgICAgICAgICAgIHZhciBjb2xsZWN0aW9uID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWcpO1xuICAgICAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoY29sbGVjdGlvbikgPyBjb2xsZWN0aW9uIDogQXJyYXkuZnJvbShjb2xsZWN0aW9uKTtcbiAgICAgICAgfSkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIHRoZSBjbGFzcz1cIlwiIGF0dHJpYnV0ZSBmcm9tIGV2ZXJ5IGVsZW1lbnQgaW4gdGhlIGdpdmVuXG4gICAgICogc3VidHJlZSwgZXhjZXB0IHRob3NlIHRoYXQgbWF0Y2ggQ0xBU1NFU19UT19QUkVTRVJWRSBhbmRcbiAgICAgKiB0aGUgY2xhc3Nlc1RvUHJlc2VydmUgYXJyYXkgZnJvbSB0aGUgb3B0aW9ucyBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gRWxlbWVudFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqL1xuICAgIF9jbGVhbkNsYXNzZXM6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIGNsYXNzZXNUb1ByZXNlcnZlID0gdGhpcy5fY2xhc3Nlc1RvUHJlc2VydmU7XG4gICAgICAgIHZhciBjbGFzc05hbWUgPSAobm9kZS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKSB8fCBcIlwiKVxuICAgICAgICAgICAgLnNwbGl0KC9cXHMrLylcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oY2xzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNsYXNzZXNUb1ByZXNlcnZlLmluZGV4T2YoY2xzKSAhPSAtMTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuam9pbihcIiBcIik7XG5cbiAgICAgICAgaWYgKGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBjbGFzc05hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoXCJjbGFzc1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobm9kZSA9IG5vZGUuZmlyc3RFbGVtZW50Q2hpbGQ7IG5vZGU7IG5vZGUgPSBub2RlLm5leHRFbGVtZW50U2libGluZykge1xuICAgICAgICAgICAgdGhpcy5fY2xlYW5DbGFzc2VzKG5vZGUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIGVhY2ggPGE+IGFuZCA8aW1nPiB1cmkgaW4gdGhlIGdpdmVuIGVsZW1lbnQgdG8gYW4gYWJzb2x1dGUgVVJJLFxuICAgICAqIGlnbm9yaW5nICNyZWYgVVJJcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBFbGVtZW50XG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICovXG4gICAgX2ZpeFJlbGF0aXZlVXJpczogZnVuY3Rpb24oYXJ0aWNsZUNvbnRlbnQpIHtcbiAgICAgICAgdmFyIGJhc2VVUkkgPSB0aGlzLl9kb2MuYmFzZVVSSTtcbiAgICAgICAgdmFyIGRvY3VtZW50VVJJID0gdGhpcy5fZG9jLmRvY3VtZW50VVJJO1xuICAgICAgICBmdW5jdGlvbiB0b0Fic29sdXRlVVJJKHVyaSkge1xuICAgICAgICAgICAgLy8gTGVhdmUgaGFzaCBsaW5rcyBhbG9uZSBpZiB0aGUgYmFzZSBVUkkgbWF0Y2hlcyB0aGUgZG9jdW1lbnQgVVJJOlxuICAgICAgICAgICAgaWYgKGJhc2VVUkkgPT0gZG9jdW1lbnRVUkkgJiYgdXJpLmNoYXJBdCgwKSA9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiB1cmk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBPdGhlcndpc2UsIHJlc29sdmUgYWdhaW5zdCBiYXNlIFVSSTpcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBVUkwodXJpLCBiYXNlVVJJKS5ocmVmO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAvLyBTb21ldGhpbmcgd2VudCB3cm9uZywganVzdCByZXR1cm4gdGhlIG9yaWdpbmFsOlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVyaTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsaW5rcyA9IGFydGljbGVDb250ZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYVwiKTtcbiAgICAgICAgdGhpcy5fZm9yRWFjaE5vZGUobGlua3MsIGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgICAgICAgIHZhciBocmVmID0gbGluay5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpO1xuICAgICAgICAgICAgaWYgKGhyZWYpIHtcbiAgICAgICAgICAgICAgICAvLyBSZXBsYWNlIGxpbmtzIHdpdGggamF2YXNjcmlwdDogVVJJcyB3aXRoIHRleHQgY29udGVudCwgc2luY2VcbiAgICAgICAgICAgICAgICAvLyB0aGV5IHdvbid0IHdvcmsgYWZ0ZXIgc2NyaXB0cyBoYXZlIGJlZW4gcmVtb3ZlZCBmcm9tIHRoZSBwYWdlLlxuICAgICAgICAgICAgICAgIGlmIChocmVmLmluZGV4T2YoXCJqYXZhc2NyaXB0OlwiKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IHRoaXMuX2RvYy5jcmVhdGVUZXh0Tm9kZShsaW5rLnRleHRDb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgbGluay5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZCh0ZXh0LCBsaW5rKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsaW5rLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgdG9BYnNvbHV0ZVVSSShocmVmKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgaW1ncyA9IGFydGljbGVDb250ZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW1nXCIpO1xuICAgICAgICB0aGlzLl9mb3JFYWNoTm9kZShpbWdzLCBmdW5jdGlvbihpbWcpIHtcbiAgICAgICAgICAgIHZhciBzcmMgPSBpbWcuZ2V0QXR0cmlidXRlKFwic3JjXCIpO1xuICAgICAgICAgICAgaWYgKHNyYykge1xuICAgICAgICAgICAgICAgIGltZy5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgdG9BYnNvbHV0ZVVSSShzcmMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgYXJ0aWNsZSB0aXRsZSBhcyBhbiBIMS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqKi9cbiAgICBfZ2V0QXJ0aWNsZVRpdGxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRvYyA9IHRoaXMuX2RvYztcbiAgICAgICAgdmFyIGN1clRpdGxlID0gXCJcIjtcbiAgICAgICAgdmFyIG9yaWdUaXRsZSA9IFwiXCI7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGN1clRpdGxlID0gb3JpZ1RpdGxlID0gZG9jLnRpdGxlLnRyaW0oKTtcblxuICAgICAgICAgICAgLy8gSWYgdGhleSBoYWQgYW4gZWxlbWVudCB3aXRoIGlkIFwidGl0bGVcIiBpbiB0aGVpciBIVE1MXG4gICAgICAgICAgICBpZiAodHlwZW9mIGN1clRpdGxlICE9PSBcInN0cmluZ1wiKVxuICAgICAgICAgICAgICAgIGN1clRpdGxlID0gb3JpZ1RpdGxlID0gdGhpcy5fZ2V0SW5uZXJUZXh0KGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgndGl0bGUnKVswXSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHsvKiBpZ25vcmUgZXhjZXB0aW9ucyBzZXR0aW5nIHRoZSB0aXRsZS4gKi99XG5cbiAgICAgICAgdmFyIHRpdGxlSGFkSGllcmFyY2hpY2FsU2VwYXJhdG9ycyA9IGZhbHNlO1xuICAgICAgICBmdW5jdGlvbiB3b3JkQ291bnQoc3RyKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyLnNwbGl0KC9cXHMrLykubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlcmUncyBhIHNlcGFyYXRvciBpbiB0aGUgdGl0bGUsIGZpcnN0IHJlbW92ZSB0aGUgZmluYWwgcGFydFxuICAgICAgICBpZiAoKC8gW1xcfFxcLVxcXFxcXC8+wrtdIC8pLnRlc3QoY3VyVGl0bGUpKSB7XG4gICAgICAgICAgICB0aXRsZUhhZEhpZXJhcmNoaWNhbFNlcGFyYXRvcnMgPSAvIFtcXFxcXFwvPsK7XSAvLnRlc3QoY3VyVGl0bGUpO1xuICAgICAgICAgICAgY3VyVGl0bGUgPSBvcmlnVGl0bGUucmVwbGFjZSgvKC4qKVtcXHxcXC1cXFxcXFwvPsK7XSAuKi9naSwgJyQxJyk7XG5cbiAgICAgICAgICAgIC8vIElmIHRoZSByZXN1bHRpbmcgdGl0bGUgaXMgdG9vIHNob3J0ICgzIHdvcmRzIG9yIGZld2VyKSwgcmVtb3ZlXG4gICAgICAgICAgICAvLyB0aGUgZmlyc3QgcGFydCBpbnN0ZWFkOlxuICAgICAgICAgICAgaWYgKHdvcmRDb3VudChjdXJUaXRsZSkgPCAzKVxuICAgICAgICAgICAgICAgIGN1clRpdGxlID0gb3JpZ1RpdGxlLnJlcGxhY2UoL1teXFx8XFwtXFxcXFxcLz7Cu10qW1xcfFxcLVxcXFxcXC8+wrtdKC4qKS9naSwgJyQxJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY3VyVGl0bGUuaW5kZXhPZignOiAnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHdlIGhhdmUgYW4gaGVhZGluZyBjb250YWluaW5nIHRoaXMgZXhhY3Qgc3RyaW5nLCBzbyB3ZVxuICAgICAgICAgICAgLy8gY291bGQgYXNzdW1lIGl0J3MgdGhlIGZ1bGwgdGl0bGUuXG4gICAgICAgICAgICB2YXIgaGVhZGluZ3MgPSB0aGlzLl9jb25jYXROb2RlTGlzdHMoXG4gICAgICAgICAgICAgICAgZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoMScpLFxuICAgICAgICAgICAgICAgIGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaDInKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHZhciB0cmltbWVkVGl0bGUgPSBjdXJUaXRsZS50cmltKCk7XG4gICAgICAgICAgICB2YXIgbWF0Y2ggPSB0aGlzLl9zb21lTm9kZShoZWFkaW5ncywgZnVuY3Rpb24oaGVhZGluZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBoZWFkaW5nLnRleHRDb250ZW50LnRyaW0oKSA9PT0gdHJpbW1lZFRpdGxlO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIElmIHdlIGRvbid0LCBsZXQncyBleHRyYWN0IHRoZSB0aXRsZSBvdXQgb2YgdGhlIG9yaWdpbmFsIHRpdGxlIHN0cmluZy5cbiAgICAgICAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBjdXJUaXRsZSA9IG9yaWdUaXRsZS5zdWJzdHJpbmcob3JpZ1RpdGxlLmxhc3RJbmRleE9mKCc6JykgKyAxKTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSB0aXRsZSBpcyBub3cgdG9vIHNob3J0LCB0cnkgdGhlIGZpcnN0IGNvbG9uIGluc3RlYWQ6XG4gICAgICAgICAgICAgICAgaWYgKHdvcmRDb3VudChjdXJUaXRsZSkgPCAzKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1clRpdGxlID0gb3JpZ1RpdGxlLnN1YnN0cmluZyhvcmlnVGl0bGUuaW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIEJ1dCBpZiB3ZSBoYXZlIHRvbyBtYW55IHdvcmRzIGJlZm9yZSB0aGUgY29sb24gdGhlcmUncyBzb21ldGhpbmcgd2VpcmRcbiAgICAgICAgICAgICAgICAgICAgLy8gd2l0aCB0aGUgdGl0bGVzIGFuZCB0aGUgSCB0YWdzIHNvIGxldCdzIGp1c3QgdXNlIHRoZSBvcmlnaW5hbCB0aXRsZSBpbnN0ZWFkXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh3b3JkQ291bnQob3JpZ1RpdGxlLnN1YnN0cigwLCBvcmlnVGl0bGUuaW5kZXhPZignOicpKSkgPiA1KSB7XG4gICAgICAgICAgICAgICAgICAgIGN1clRpdGxlID0gb3JpZ1RpdGxlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChjdXJUaXRsZS5sZW5ndGggPiAxNTAgfHwgY3VyVGl0bGUubGVuZ3RoIDwgMTUpIHtcbiAgICAgICAgICAgIHZhciBoT25lcyA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaDEnKTtcblxuICAgICAgICAgICAgaWYgKGhPbmVzLmxlbmd0aCA9PT0gMSlcbiAgICAgICAgICAgICAgICBjdXJUaXRsZSA9IHRoaXMuX2dldElubmVyVGV4dChoT25lc1swXSk7XG4gICAgICAgIH1cblxuICAgICAgICBjdXJUaXRsZSA9IGN1clRpdGxlLnRyaW0oKTtcbiAgICAgICAgLy8gSWYgd2Ugbm93IGhhdmUgNCB3b3JkcyBvciBmZXdlciBhcyBvdXIgdGl0bGUsIGFuZCBlaXRoZXIgbm9cbiAgICAgICAgLy8gJ2hpZXJhcmNoaWNhbCcgc2VwYXJhdG9ycyAoXFwsIC8sID4gb3IgwrspIHdlcmUgZm91bmQgaW4gdGhlIG9yaWdpbmFsXG4gICAgICAgIC8vIHRpdGxlIG9yIHdlIGRlY3JlYXNlZCB0aGUgbnVtYmVyIG9mIHdvcmRzIGJ5IG1vcmUgdGhhbiAxIHdvcmQsIHVzZVxuICAgICAgICAvLyB0aGUgb3JpZ2luYWwgdGl0bGUuXG4gICAgICAgIHZhciBjdXJUaXRsZVdvcmRDb3VudCA9IHdvcmRDb3VudChjdXJUaXRsZSk7XG4gICAgICAgIGlmIChjdXJUaXRsZVdvcmRDb3VudCA8PSA0ICYmXG4gICAgICAgICAgICAoIXRpdGxlSGFkSGllcmFyY2hpY2FsU2VwYXJhdG9ycyB8fFxuICAgICAgICAgICAgY3VyVGl0bGVXb3JkQ291bnQgIT0gd29yZENvdW50KG9yaWdUaXRsZS5yZXBsYWNlKC9bXFx8XFwtXFxcXFxcLz7Cu10rL2csIFwiXCIpKSAtIDEpKSB7XG4gICAgICAgICAgICBjdXJUaXRsZSA9IG9yaWdUaXRsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJUaXRsZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcGFyZSB0aGUgSFRNTCBkb2N1bWVudCBmb3IgcmVhZGFiaWxpdHkgdG8gc2NyYXBlIGl0LlxuICAgICAqIFRoaXMgaW5jbHVkZXMgdGhpbmdzIGxpa2Ugc3RyaXBwaW5nIGphdmFzY3JpcHQsIENTUywgYW5kIGhhbmRsaW5nIHRlcnJpYmxlIG1hcmt1cC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqKi9cbiAgICBfcHJlcERvY3VtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRvYyA9IHRoaXMuX2RvYztcblxuICAgICAgICAvLyBSZW1vdmUgYWxsIHN0eWxlIHRhZ3MgaW4gaGVhZFxuICAgICAgICB0aGlzLl9yZW1vdmVOb2Rlcyhkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdHlsZVwiKSk7XG5cbiAgICAgICAgaWYgKGRvYy5ib2R5KSB7XG4gICAgICAgICAgICB0aGlzLl9yZXBsYWNlQnJzKGRvYy5ib2R5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3JlcGxhY2VOb2RlVGFncyhkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJmb250XCIpLCBcIlNQQU5cIik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpbmRzIHRoZSBuZXh0IGVsZW1lbnQsIHN0YXJ0aW5nIGZyb20gdGhlIGdpdmVuIG5vZGUsIGFuZCBpZ25vcmluZ1xuICAgICAqIHdoaXRlc3BhY2UgaW4gYmV0d2Vlbi4gSWYgdGhlIGdpdmVuIG5vZGUgaXMgYW4gZWxlbWVudCwgdGhlIHNhbWUgbm9kZSBpc1xuICAgICAqIHJldHVybmVkLlxuICAgICAqL1xuICAgIF9uZXh0RWxlbWVudDogZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgdmFyIG5leHQgPSBub2RlO1xuICAgICAgICB3aGlsZSAobmV4dFxuICAgICAgICAmJiAobmV4dC5ub2RlVHlwZSAhPSB0aGlzLkVMRU1FTlRfTk9ERSlcbiAgICAgICAgJiYgdGhpcy5SRUdFWFBTLndoaXRlc3BhY2UudGVzdChuZXh0LnRleHRDb250ZW50KSkge1xuICAgICAgICAgICAgbmV4dCA9IG5leHQubmV4dFNpYmxpbmc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlcGxhY2VzIDIgb3IgbW9yZSBzdWNjZXNzaXZlIDxicj4gZWxlbWVudHMgd2l0aCBhIHNpbmdsZSA8cD4uXG4gICAgICogV2hpdGVzcGFjZSBiZXR3ZWVuIDxicj4gZWxlbWVudHMgYXJlIGlnbm9yZWQuIEZvciBleGFtcGxlOlxuICAgICAqICAgPGRpdj5mb288YnI+YmFyPGJyPiA8YnI+PGJyPmFiYzwvZGl2PlxuICAgICAqIHdpbGwgYmVjb21lOlxuICAgICAqICAgPGRpdj5mb288YnI+YmFyPHA+YWJjPC9wPjwvZGl2PlxuICAgICAqL1xuICAgIF9yZXBsYWNlQnJzOiBmdW5jdGlvbiAoZWxlbSkge1xuICAgICAgICB0aGlzLl9mb3JFYWNoTm9kZSh0aGlzLl9nZXRBbGxOb2Rlc1dpdGhUYWcoZWxlbSwgW1wiYnJcIl0pLCBmdW5jdGlvbihicikge1xuICAgICAgICAgICAgdmFyIG5leHQgPSBici5uZXh0U2libGluZztcblxuICAgICAgICAgICAgLy8gV2hldGhlciAyIG9yIG1vcmUgPGJyPiBlbGVtZW50cyBoYXZlIGJlZW4gZm91bmQgYW5kIHJlcGxhY2VkIHdpdGggYVxuICAgICAgICAgICAgLy8gPHA+IGJsb2NrLlxuICAgICAgICAgICAgdmFyIHJlcGxhY2VkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIElmIHdlIGZpbmQgYSA8YnI+IGNoYWluLCByZW1vdmUgdGhlIDxicj5zIHVudGlsIHdlIGhpdCBhbm90aGVyIGVsZW1lbnRcbiAgICAgICAgICAgIC8vIG9yIG5vbi13aGl0ZXNwYWNlLiBUaGlzIGxlYXZlcyBiZWhpbmQgdGhlIGZpcnN0IDxicj4gaW4gdGhlIGNoYWluXG4gICAgICAgICAgICAvLyAod2hpY2ggd2lsbCBiZSByZXBsYWNlZCB3aXRoIGEgPHA+IGxhdGVyKS5cbiAgICAgICAgICAgIHdoaWxlICgobmV4dCA9IHRoaXMuX25leHRFbGVtZW50KG5leHQpKSAmJiAobmV4dC50YWdOYW1lID09IFwiQlJcIikpIHtcbiAgICAgICAgICAgICAgICByZXBsYWNlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdmFyIGJyU2libGluZyA9IG5leHQubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgbmV4dC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5leHQpO1xuICAgICAgICAgICAgICAgIG5leHQgPSBiclNpYmxpbmc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHdlIHJlbW92ZWQgYSA8YnI+IGNoYWluLCByZXBsYWNlIHRoZSByZW1haW5pbmcgPGJyPiB3aXRoIGEgPHA+LiBBZGRcbiAgICAgICAgICAgIC8vIGFsbCBzaWJsaW5nIG5vZGVzIGFzIGNoaWxkcmVuIG9mIHRoZSA8cD4gdW50aWwgd2UgaGl0IGFub3RoZXIgPGJyPlxuICAgICAgICAgICAgLy8gY2hhaW4uXG4gICAgICAgICAgICBpZiAocmVwbGFjZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IHRoaXMuX2RvYy5jcmVhdGVFbGVtZW50KFwicFwiKTtcbiAgICAgICAgICAgICAgICBici5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChwLCBicik7XG5cbiAgICAgICAgICAgICAgICBuZXh0ID0gcC5uZXh0U2libGluZztcbiAgICAgICAgICAgICAgICB3aGlsZSAobmV4dCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSd2ZSBoaXQgYW5vdGhlciA8YnI+PGJyPiwgd2UncmUgZG9uZSBhZGRpbmcgY2hpbGRyZW4gdG8gdGhpcyA8cD4uXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0LnRhZ05hbWUgPT0gXCJCUlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dEVsZW0gPSB0aGlzLl9uZXh0RWxlbWVudChuZXh0Lm5leHRTaWJsaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXh0RWxlbSAmJiBuZXh0RWxlbS50YWdOYW1lID09IFwiQlJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5faXNQaHJhc2luZ0NvbnRlbnQobmV4dCkpIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIE90aGVyd2lzZSwgbWFrZSB0aGlzIG5vZGUgYSBjaGlsZCBvZiB0aGUgbmV3IDxwPi5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNpYmxpbmcgPSBuZXh0Lm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICBwLmFwcGVuZENoaWxkKG5leHQpO1xuICAgICAgICAgICAgICAgICAgICBuZXh0ID0gc2libGluZztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAocC5sYXN0Q2hpbGQgJiYgdGhpcy5faXNXaGl0ZXNwYWNlKHAubGFzdENoaWxkKSkgcC5yZW1vdmVDaGlsZChwLmxhc3RDaGlsZCk7XG5cbiAgICAgICAgICAgICAgICBpZiAocC5wYXJlbnROb2RlLnRhZ05hbWUgPT09IFwiUFwiKSB0aGlzLl9zZXROb2RlVGFnKHAucGFyZW50Tm9kZSwgXCJESVZcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfc2V0Tm9kZVRhZzogZnVuY3Rpb24gKG5vZGUsIHRhZykge1xuICAgICAgICB0aGlzLmxvZyhcIl9zZXROb2RlVGFnXCIsIG5vZGUsIHRhZyk7XG4gICAgICAgIGlmIChub2RlLl9fSlNET01QYXJzZXJfXykge1xuICAgICAgICAgICAgbm9kZS5sb2NhbE5hbWUgPSB0YWcudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIG5vZGUudGFnTmFtZSA9IHRhZy50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVwbGFjZW1lbnQgPSBub2RlLm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgICAgICB3aGlsZSAobm9kZS5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICByZXBsYWNlbWVudC5hcHBlbmRDaGlsZChub2RlLmZpcnN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQocmVwbGFjZW1lbnQsIG5vZGUpO1xuICAgICAgICBpZiAobm9kZS5yZWFkYWJpbGl0eSlcbiAgICAgICAgICAgIHJlcGxhY2VtZW50LnJlYWRhYmlsaXR5ID0gbm9kZS5yZWFkYWJpbGl0eTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcmVwbGFjZW1lbnQuc2V0QXR0cmlidXRlKG5vZGUuYXR0cmlidXRlc1tpXS5uYW1lLCBub2RlLmF0dHJpYnV0ZXNbaV0udmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXBsYWNlbWVudDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcGFyZSB0aGUgYXJ0aWNsZSBub2RlIGZvciBkaXNwbGF5LiBDbGVhbiBvdXQgYW55IGlubGluZSBzdHlsZXMsXG4gICAgICogaWZyYW1lcywgZm9ybXMsIHN0cmlwIGV4dHJhbmVvdXMgPHA+IHRhZ3MsIGV0Yy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBFbGVtZW50XG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICoqL1xuICAgIF9wcmVwQXJ0aWNsZTogZnVuY3Rpb24oYXJ0aWNsZUNvbnRlbnQpIHtcbiAgICAgICAgdGhpcy5fY2xlYW5TdHlsZXMoYXJ0aWNsZUNvbnRlbnQpO1xuXG4gICAgICAgIC8vIENoZWNrIGZvciBkYXRhIHRhYmxlcyBiZWZvcmUgd2UgY29udGludWUsIHRvIGF2b2lkIHJlbW92aW5nIGl0ZW1zIGluXG4gICAgICAgIC8vIHRob3NlIHRhYmxlcywgd2hpY2ggd2lsbCBvZnRlbiBiZSBpc29sYXRlZCBldmVuIHRob3VnaCB0aGV5J3JlXG4gICAgICAgIC8vIHZpc3VhbGx5IGxpbmtlZCB0byBvdGhlciBjb250ZW50LWZ1bCBlbGVtZW50cyAodGV4dCwgaW1hZ2VzLCBldGMuKS5cbiAgICAgICAgdGhpcy5fbWFya0RhdGFUYWJsZXMoYXJ0aWNsZUNvbnRlbnQpO1xuXG4gICAgICAgIC8vIENsZWFuIG91dCBqdW5rIGZyb20gdGhlIGFydGljbGUgY29udGVudFxuICAgICAgICB0aGlzLl9jbGVhbkNvbmRpdGlvbmFsbHkoYXJ0aWNsZUNvbnRlbnQsIFwiZm9ybVwiKTtcbiAgICAgICAgdGhpcy5fY2xlYW5Db25kaXRpb25hbGx5KGFydGljbGVDb250ZW50LCBcImZpZWxkc2V0XCIpO1xuICAgICAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJvYmplY3RcIik7XG4gICAgICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcImVtYmVkXCIpO1xuICAgICAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJoMVwiKTtcbiAgICAgICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwiZm9vdGVyXCIpO1xuICAgICAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJsaW5rXCIpO1xuICAgICAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJhc2lkZVwiKTtcblxuICAgICAgICAvLyBDbGVhbiBvdXQgZWxlbWVudHMgaGF2ZSBcInNoYXJlXCIgaW4gdGhlaXIgaWQvY2xhc3MgY29tYmluYXRpb25zIGZyb20gZmluYWwgdG9wIGNhbmRpZGF0ZXMsXG4gICAgICAgIC8vIHdoaWNoIG1lYW5zIHdlIGRvbid0IHJlbW92ZSB0aGUgdG9wIGNhbmRpZGF0ZXMgZXZlbiB0aGV5IGhhdmUgXCJzaGFyZVwiLlxuICAgICAgICB0aGlzLl9mb3JFYWNoTm9kZShhcnRpY2xlQ29udGVudC5jaGlsZHJlbiwgZnVuY3Rpb24odG9wQ2FuZGlkYXRlKSB7XG4gICAgICAgICAgICB0aGlzLl9jbGVhbk1hdGNoZWROb2Rlcyh0b3BDYW5kaWRhdGUsIC9zaGFyZS8pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBJZiB0aGVyZSBpcyBvbmx5IG9uZSBoMiBhbmQgaXRzIHRleHQgY29udGVudCBzdWJzdGFudGlhbGx5IGVxdWFscyBhcnRpY2xlIHRpdGxlLFxuICAgICAgICAvLyB0aGV5IGFyZSBwcm9iYWJseSB1c2luZyBpdCBhcyBhIGhlYWRlciBhbmQgbm90IGEgc3ViaGVhZGVyLFxuICAgICAgICAvLyBzbyByZW1vdmUgaXQgc2luY2Ugd2UgYWxyZWFkeSBleHRyYWN0IHRoZSB0aXRsZSBzZXBhcmF0ZWx5LlxuICAgICAgICB2YXIgaDIgPSBhcnRpY2xlQ29udGVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaDInKTtcbiAgICAgICAgaWYgKGgyLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdmFyIGxlbmd0aFNpbWlsYXJSYXRlID0gKGgyWzBdLnRleHRDb250ZW50Lmxlbmd0aCAtIHRoaXMuX2FydGljbGVUaXRsZS5sZW5ndGgpIC8gdGhpcy5fYXJ0aWNsZVRpdGxlLmxlbmd0aDtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhsZW5ndGhTaW1pbGFyUmF0ZSkgPCAwLjUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGl0bGVzTWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAobGVuZ3RoU2ltaWxhclJhdGUgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlc01hdGNoID0gaDJbMF0udGV4dENvbnRlbnQuaW5jbHVkZXModGhpcy5fYXJ0aWNsZVRpdGxlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZXNNYXRjaCA9IHRoaXMuX2FydGljbGVUaXRsZS5pbmNsdWRlcyhoMlswXS50ZXh0Q29udGVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aXRsZXNNYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJoMlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJpZnJhbWVcIik7XG4gICAgICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcImlucHV0XCIpO1xuICAgICAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJ0ZXh0YXJlYVwiKTtcbiAgICAgICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwic2VsZWN0XCIpO1xuICAgICAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJidXR0b25cIik7XG4gICAgICAgIHRoaXMuX2NsZWFuSGVhZGVycyhhcnRpY2xlQ29udGVudCk7XG5cbiAgICAgICAgLy8gRG8gdGhlc2UgbGFzdCBhcyB0aGUgcHJldmlvdXMgc3R1ZmYgbWF5IGhhdmUgcmVtb3ZlZCBqdW5rXG4gICAgICAgIC8vIHRoYXQgd2lsbCBhZmZlY3QgdGhlc2VcbiAgICAgICAgdGhpcy5fY2xlYW5Db25kaXRpb25hbGx5KGFydGljbGVDb250ZW50LCBcInRhYmxlXCIpO1xuICAgICAgICB0aGlzLl9jbGVhbkNvbmRpdGlvbmFsbHkoYXJ0aWNsZUNvbnRlbnQsIFwidWxcIik7XG4gICAgICAgIHRoaXMuX2NsZWFuQ29uZGl0aW9uYWxseShhcnRpY2xlQ29udGVudCwgXCJkaXZcIik7XG5cbiAgICAgICAgLy8gUmVtb3ZlIGV4dHJhIHBhcmFncmFwaHNcbiAgICAgICAgdGhpcy5fcmVtb3ZlTm9kZXMoYXJ0aWNsZUNvbnRlbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3AnKSwgZnVuY3Rpb24gKHBhcmFncmFwaCkge1xuICAgICAgICAgICAgdmFyIGltZ0NvdW50ID0gcGFyYWdyYXBoLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWcnKS5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgZW1iZWRDb3VudCA9IHBhcmFncmFwaC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnZW1iZWQnKS5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgb2JqZWN0Q291bnQgPSBwYXJhZ3JhcGguZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ29iamVjdCcpLmxlbmd0aDtcbiAgICAgICAgICAgIC8vIEF0IHRoaXMgcG9pbnQsIG5hc3R5IGlmcmFtZXMgaGF2ZSBiZWVuIHJlbW92ZWQsIG9ubHkgcmVtYWluIGVtYmVkZGVkIHZpZGVvIG9uZXMuXG4gICAgICAgICAgICB2YXIgaWZyYW1lQ291bnQgPSBwYXJhZ3JhcGguZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciB0b3RhbENvdW50ID0gaW1nQ291bnQgKyBlbWJlZENvdW50ICsgb2JqZWN0Q291bnQgKyBpZnJhbWVDb3VudDtcblxuICAgICAgICAgICAgcmV0dXJuIHRvdGFsQ291bnQgPT09IDAgJiYgIXRoaXMuX2dldElubmVyVGV4dChwYXJhZ3JhcGgsIGZhbHNlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5fZm9yRWFjaE5vZGUodGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKGFydGljbGVDb250ZW50LCBbXCJiclwiXSksIGZ1bmN0aW9uKGJyKSB7XG4gICAgICAgICAgICB2YXIgbmV4dCA9IHRoaXMuX25leHRFbGVtZW50KGJyLm5leHRTaWJsaW5nKTtcbiAgICAgICAgICAgIGlmIChuZXh0ICYmIG5leHQudGFnTmFtZSA9PSBcIlBcIilcbiAgICAgICAgICAgICAgICBici5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGJyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIHNpbmdsZS1jZWxsIHRhYmxlc1xuICAgICAgICB0aGlzLl9mb3JFYWNoTm9kZSh0aGlzLl9nZXRBbGxOb2Rlc1dpdGhUYWcoYXJ0aWNsZUNvbnRlbnQsIFtcInRhYmxlXCJdKSwgZnVuY3Rpb24odGFibGUpIHtcbiAgICAgICAgICAgIHZhciB0Ym9keSA9IHRoaXMuX2hhc1NpbmdsZVRhZ0luc2lkZUVsZW1lbnQodGFibGUsIFwiVEJPRFlcIikgPyB0YWJsZS5maXJzdEVsZW1lbnRDaGlsZCA6IHRhYmxlO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2hhc1NpbmdsZVRhZ0luc2lkZUVsZW1lbnQodGJvZHksIFwiVFJcIikpIHtcbiAgICAgICAgICAgICAgICB2YXIgcm93ID0gdGJvZHkuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2hhc1NpbmdsZVRhZ0luc2lkZUVsZW1lbnQocm93LCBcIlREXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjZWxsID0gcm93LmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgICAgICBjZWxsID0gdGhpcy5fc2V0Tm9kZVRhZyhjZWxsLCB0aGlzLl9ldmVyeU5vZGUoY2VsbC5jaGlsZE5vZGVzLCB0aGlzLl9pc1BocmFzaW5nQ29udGVudCkgPyBcIlBcIiA6IFwiRElWXCIpO1xuICAgICAgICAgICAgICAgICAgICB0YWJsZS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChjZWxsLCB0YWJsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBhIG5vZGUgd2l0aCB0aGUgcmVhZGFiaWxpdHkgb2JqZWN0LiBBbHNvIGNoZWNrcyB0aGVcbiAgICAgKiBjbGFzc05hbWUvaWQgZm9yIHNwZWNpYWwgbmFtZXMgdG8gYWRkIHRvIGl0cyBzY29yZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBFbGVtZW50XG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICoqL1xuICAgIF9pbml0aWFsaXplTm9kZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICBub2RlLnJlYWRhYmlsaXR5ID0ge1wiY29udGVudFNjb3JlXCI6IDB9O1xuXG4gICAgICAgIHN3aXRjaCAobm9kZS50YWdOYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdESVYnOlxuICAgICAgICAgICAgICAgIG5vZGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlICs9IDU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ1BSRSc6XG4gICAgICAgICAgICBjYXNlICdURCc6XG4gICAgICAgICAgICBjYXNlICdCTE9DS1FVT1RFJzpcbiAgICAgICAgICAgICAgICBub2RlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSArPSAzO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdBRERSRVNTJzpcbiAgICAgICAgICAgIGNhc2UgJ09MJzpcbiAgICAgICAgICAgIGNhc2UgJ1VMJzpcbiAgICAgICAgICAgIGNhc2UgJ0RMJzpcbiAgICAgICAgICAgIGNhc2UgJ0REJzpcbiAgICAgICAgICAgIGNhc2UgJ0RUJzpcbiAgICAgICAgICAgIGNhc2UgJ0xJJzpcbiAgICAgICAgICAgIGNhc2UgJ0ZPUk0nOlxuICAgICAgICAgICAgICAgIG5vZGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlIC09IDM7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0gxJzpcbiAgICAgICAgICAgIGNhc2UgJ0gyJzpcbiAgICAgICAgICAgIGNhc2UgJ0gzJzpcbiAgICAgICAgICAgIGNhc2UgJ0g0JzpcbiAgICAgICAgICAgIGNhc2UgJ0g1JzpcbiAgICAgICAgICAgIGNhc2UgJ0g2JzpcbiAgICAgICAgICAgIGNhc2UgJ1RIJzpcbiAgICAgICAgICAgICAgICBub2RlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSAtPSA1O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgKz0gdGhpcy5fZ2V0Q2xhc3NXZWlnaHQobm9kZSk7XG4gICAgfSxcblxuICAgIF9yZW1vdmVBbmRHZXROZXh0OiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBuZXh0Tm9kZSA9IHRoaXMuX2dldE5leHROb2RlKG5vZGUsIHRydWUpO1xuICAgICAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgICAgIHJldHVybiBuZXh0Tm9kZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVHJhdmVyc2UgdGhlIERPTSBmcm9tIG5vZGUgdG8gbm9kZSwgc3RhcnRpbmcgYXQgdGhlIG5vZGUgcGFzc2VkIGluLlxuICAgICAqIFBhc3MgdHJ1ZSBmb3IgdGhlIHNlY29uZCBwYXJhbWV0ZXIgdG8gaW5kaWNhdGUgdGhpcyBub2RlIGl0c2VsZlxuICAgICAqIChhbmQgaXRzIGtpZHMpIGFyZSBnb2luZyBhd2F5LCBhbmQgd2Ugd2FudCB0aGUgbmV4dCBub2RlIG92ZXIuXG4gICAgICpcbiAgICAgKiBDYWxsaW5nIHRoaXMgaW4gYSBsb29wIHdpbGwgdHJhdmVyc2UgdGhlIERPTSBkZXB0aC1maXJzdC5cbiAgICAgKi9cbiAgICBfZ2V0TmV4dE5vZGU6IGZ1bmN0aW9uKG5vZGUsIGlnbm9yZVNlbGZBbmRLaWRzKSB7XG4gICAgICAgIC8vIEZpcnN0IGNoZWNrIGZvciBraWRzIGlmIHRob3NlIGFyZW4ndCBiZWluZyBpZ25vcmVkXG4gICAgICAgIGlmICghaWdub3JlU2VsZkFuZEtpZHMgJiYgbm9kZS5maXJzdEVsZW1lbnRDaGlsZCkge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlbiBmb3Igc2libGluZ3MuLi5cbiAgICAgICAgaWYgKG5vZGUubmV4dEVsZW1lbnRTaWJsaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZS5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQW5kIGZpbmFsbHksIG1vdmUgdXAgdGhlIHBhcmVudCBjaGFpbiAqYW5kKiBmaW5kIGEgc2libGluZ1xuICAgICAgICAvLyAoYmVjYXVzZSB0aGlzIGlzIGRlcHRoLWZpcnN0IHRyYXZlcnNhbCwgd2Ugd2lsbCBoYXZlIGFscmVhZHlcbiAgICAgICAgLy8gc2VlbiB0aGUgcGFyZW50IG5vZGVzIHRoZW1zZWx2ZXMpLlxuICAgICAgICBkbyB7XG4gICAgICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICB9IHdoaWxlIChub2RlICYmICFub2RlLm5leHRFbGVtZW50U2libGluZyk7XG4gICAgICAgIHJldHVybiBub2RlICYmIG5vZGUubmV4dEVsZW1lbnRTaWJsaW5nO1xuICAgIH0sXG5cbiAgICBfY2hlY2tCeWxpbmU6IGZ1bmN0aW9uKG5vZGUsIG1hdGNoU3RyaW5nKSB7XG4gICAgICAgIGlmICh0aGlzLl9hcnRpY2xlQnlsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9kZS5nZXRBdHRyaWJ1dGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmFyIHJlbCA9IG5vZGUuZ2V0QXR0cmlidXRlKFwicmVsXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKChyZWwgPT09IFwiYXV0aG9yXCIgfHwgdGhpcy5SRUdFWFBTLmJ5bGluZS50ZXN0KG1hdGNoU3RyaW5nKSkgJiYgdGhpcy5faXNWYWxpZEJ5bGluZShub2RlLnRleHRDb250ZW50KSkge1xuICAgICAgICAgICAgdGhpcy5fYXJ0aWNsZUJ5bGluZSA9IG5vZGUudGV4dENvbnRlbnQudHJpbSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIF9nZXROb2RlQW5jZXN0b3JzOiBmdW5jdGlvbihub2RlLCBtYXhEZXB0aCkge1xuICAgICAgICBtYXhEZXB0aCA9IG1heERlcHRoIHx8IDA7XG4gICAgICAgIHZhciBpID0gMCwgYW5jZXN0b3JzID0gW107XG4gICAgICAgIHdoaWxlIChub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIGFuY2VzdG9ycy5wdXNoKG5vZGUucGFyZW50Tm9kZSk7XG4gICAgICAgICAgICBpZiAobWF4RGVwdGggJiYgKytpID09PSBtYXhEZXB0aClcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFuY2VzdG9ycztcbiAgICB9LFxuXG4gICAgLyoqKlxuICAgICAqIGdyYWJBcnRpY2xlIC0gVXNpbmcgYSB2YXJpZXR5IG9mIG1ldHJpY3MgKGNvbnRlbnQgc2NvcmUsIGNsYXNzbmFtZSwgZWxlbWVudCB0eXBlcyksIGZpbmQgdGhlIGNvbnRlbnQgdGhhdCBpc1xuICAgICAqICAgICAgICAgbW9zdCBsaWtlbHkgdG8gYmUgdGhlIHN0dWZmIGEgdXNlciB3YW50cyB0byByZWFkLiBUaGVuIHJldHVybiBpdCB3cmFwcGVkIHVwIGluIGEgZGl2LlxuICAgICAqXG4gICAgICogQHBhcmFtIHBhZ2UgYSBkb2N1bWVudCB0byBydW4gdXBvbi4gTmVlZHMgdG8gYmUgYSBmdWxsIGRvY3VtZW50LCBjb21wbGV0ZSB3aXRoIGJvZHkuXG4gICAgICogQHJldHVybiBFbGVtZW50XG4gICAgICoqL1xuICAgIF9ncmFiQXJ0aWNsZTogZnVuY3Rpb24gKHBhZ2UpIHtcbiAgICAgICAgdGhpcy5sb2coXCIqKioqIGdyYWJBcnRpY2xlICoqKipcIik7XG4gICAgICAgIHZhciBkb2MgPSB0aGlzLl9kb2M7XG4gICAgICAgIHZhciBpc1BhZ2luZyA9IChwYWdlICE9PSBudWxsID8gdHJ1ZTogZmFsc2UpO1xuICAgICAgICBwYWdlID0gcGFnZSA/IHBhZ2UgOiB0aGlzLl9kb2MuYm9keTtcblxuICAgICAgICAvLyBXZSBjYW4ndCBncmFiIGFuIGFydGljbGUgaWYgd2UgZG9uJ3QgaGF2ZSBhIHBhZ2UhXG4gICAgICAgIGlmICghcGFnZSkge1xuICAgICAgICAgICAgdGhpcy5sb2coXCJObyBib2R5IGZvdW5kIGluIGRvY3VtZW50LiBBYm9ydC5cIik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwYWdlQ2FjaGVIdG1sID0gcGFnZS5pbm5lckhUTUw7XG5cbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIHZhciBzdHJpcFVubGlrZWx5Q2FuZGlkYXRlcyA9IHRoaXMuX2ZsYWdJc0FjdGl2ZSh0aGlzLkZMQUdfU1RSSVBfVU5MSUtFTFlTKTtcblxuICAgICAgICAgICAgLy8gRmlyc3QsIG5vZGUgcHJlcHBpbmcuIFRyYXNoIG5vZGVzIHRoYXQgbG9vayBjcnVkZHkgKGxpa2Ugb25lcyB3aXRoIHRoZVxuICAgICAgICAgICAgLy8gY2xhc3MgbmFtZSBcImNvbW1lbnRcIiwgZXRjKSwgYW5kIHR1cm4gZGl2cyBpbnRvIFAgdGFncyB3aGVyZSB0aGV5IGhhdmUgYmVlblxuICAgICAgICAgICAgLy8gdXNlZCBpbmFwcHJvcHJpYXRlbHkgKGFzIGluLCB3aGVyZSB0aGV5IGNvbnRhaW4gbm8gb3RoZXIgYmxvY2sgbGV2ZWwgZWxlbWVudHMuKVxuICAgICAgICAgICAgdmFyIGVsZW1lbnRzVG9TY29yZSA9IFtdO1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLl9kb2MuZG9jdW1lbnRFbGVtZW50O1xuXG4gICAgICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaFN0cmluZyA9IG5vZGUuY2xhc3NOYW1lICsgXCIgXCIgKyBub2RlLmlkO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9pc1Byb2JhYmx5VmlzaWJsZShub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZyhcIlJlbW92aW5nIGhpZGRlbiBub2RlIC0gXCIgKyBtYXRjaFN0cmluZyk7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLl9yZW1vdmVBbmRHZXROZXh0KG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhpcyBub2RlIGlzIGEgYnlsaW5lLCBhbmQgcmVtb3ZlIGl0IGlmIGl0IGlzLlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jaGVja0J5bGluZShub2RlLCBtYXRjaFN0cmluZykpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IHRoaXMuX3JlbW92ZUFuZEdldE5leHQobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB1bmxpa2VseSBjYW5kaWRhdGVzXG4gICAgICAgICAgICAgICAgaWYgKHN0cmlwVW5saWtlbHlDYW5kaWRhdGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLlJFR0VYUFMudW5saWtlbHlDYW5kaWRhdGVzLnRlc3QobWF0Y2hTdHJpbmcpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAhdGhpcy5SRUdFWFBTLm9rTWF5YmVJdHNBQ2FuZGlkYXRlLnRlc3QobWF0Y2hTdHJpbmcpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnRhZ05hbWUgIT09IFwiQk9EWVwiICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnRhZ05hbWUgIT09IFwiQVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZyhcIlJlbW92aW5nIHVubGlrZWx5IGNhbmRpZGF0ZSAtIFwiICsgbWF0Y2hTdHJpbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZSA9IHRoaXMuX3JlbW92ZUFuZEdldE5leHQobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBESVYsIFNFQ1RJT04sIGFuZCBIRUFERVIgbm9kZXMgd2l0aG91dCBhbnkgY29udGVudChlLmcuIHRleHQsIGltYWdlLCB2aWRlbywgb3IgaWZyYW1lKS5cbiAgICAgICAgICAgICAgICBpZiAoKG5vZGUudGFnTmFtZSA9PT0gXCJESVZcIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiU0VDVElPTlwiIHx8IG5vZGUudGFnTmFtZSA9PT0gXCJIRUFERVJcIiB8fFxuICAgICAgICAgICAgICAgICAgICBub2RlLnRhZ05hbWUgPT09IFwiSDFcIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiSDJcIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiSDNcIiB8fFxuICAgICAgICAgICAgICAgICAgICBub2RlLnRhZ05hbWUgPT09IFwiSDRcIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiSDVcIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiSDZcIikgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faXNFbGVtZW50V2l0aG91dENvbnRlbnQobm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IHRoaXMuX3JlbW92ZUFuZEdldE5leHQobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLkRFRkFVTFRfVEFHU19UT19TQ09SRS5pbmRleE9mKG5vZGUudGFnTmFtZSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRzVG9TY29yZS5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFR1cm4gYWxsIGRpdnMgdGhhdCBkb24ndCBoYXZlIGNoaWxkcmVuIGJsb2NrIGxldmVsIGVsZW1lbnRzIGludG8gcCdzXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUudGFnTmFtZSA9PT0gXCJESVZcIikge1xuICAgICAgICAgICAgICAgICAgICAvLyBQdXQgcGhyYXNpbmcgY29udGVudCBpbnRvIHBhcmFncmFwaHMuXG4gICAgICAgICAgICAgICAgICAgIHZhciBwID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkTm9kZSA9IG5vZGUuZmlyc3RDaGlsZDtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGNoaWxkTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRTaWJsaW5nID0gY2hpbGROb2RlLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2lzUGhyYXNpbmdDb250ZW50KGNoaWxkTm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLmFwcGVuZENoaWxkKGNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghdGhpcy5faXNXaGl0ZXNwYWNlKGNoaWxkTm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcCA9IGRvYy5jcmVhdGVFbGVtZW50KCdwJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUucmVwbGFjZUNoaWxkKHAsIGNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAuYXBwZW5kQ2hpbGQoY2hpbGROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHAgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAocC5sYXN0Q2hpbGQgJiYgdGhpcy5faXNXaGl0ZXNwYWNlKHAubGFzdENoaWxkKSkgcC5yZW1vdmVDaGlsZChwLmxhc3RDaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZE5vZGUgPSBuZXh0U2libGluZztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIFNpdGVzIGxpa2UgaHR0cDovL21vYmlsZS5zbGF0ZS5jb20gZW5jbG9zZXMgZWFjaCBwYXJhZ3JhcGggd2l0aCBhIERJVlxuICAgICAgICAgICAgICAgICAgICAvLyBlbGVtZW50LiBESVZzIHdpdGggb25seSBhIFAgZWxlbWVudCBpbnNpZGUgYW5kIG5vIHRleHQgY29udGVudCBjYW4gYmVcbiAgICAgICAgICAgICAgICAgICAgLy8gc2FmZWx5IGNvbnZlcnRlZCBpbnRvIHBsYWluIFAgZWxlbWVudHMgdG8gYXZvaWQgY29uZnVzaW5nIHRoZSBzY29yaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIGFsZ29yaXRobSB3aXRoIERJVnMgd2l0aCBhcmUsIGluIHByYWN0aWNlLCBwYXJhZ3JhcGhzLlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5faGFzU2luZ2xlVGFnSW5zaWRlRWxlbWVudChub2RlLCBcIlBcIikgJiYgdGhpcy5fZ2V0TGlua0RlbnNpdHkobm9kZSkgPCAwLjI1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3Tm9kZSA9IG5vZGUuY2hpbGRyZW5bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld05vZGUsIG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZSA9IG5ld05vZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50c1RvU2NvcmUucHVzaChub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghdGhpcy5faGFzQ2hpbGRCbG9ja0VsZW1lbnQobm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLl9zZXROb2RlVGFnKG5vZGUsIFwiUFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRzVG9TY29yZS5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLl9nZXROZXh0Tm9kZShub2RlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBMb29wIHRocm91Z2ggYWxsIHBhcmFncmFwaHMsIGFuZCBhc3NpZ24gYSBzY29yZSB0byB0aGVtIGJhc2VkIG9uIGhvdyBjb250ZW50LXkgdGhleSBsb29rLlxuICAgICAgICAgICAgICogVGhlbiBhZGQgdGhlaXIgc2NvcmUgdG8gdGhlaXIgcGFyZW50IG5vZGUuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQSBzY29yZSBpcyBkZXRlcm1pbmVkIGJ5IHRoaW5ncyBsaWtlIG51bWJlciBvZiBjb21tYXMsIGNsYXNzIG5hbWVzLCBldGMuIE1heWJlIGV2ZW50dWFsbHkgbGluayBkZW5zaXR5LlxuICAgICAgICAgICAgICoqL1xuICAgICAgICAgICAgdmFyIGNhbmRpZGF0ZXMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX2ZvckVhY2hOb2RlKGVsZW1lbnRzVG9TY29yZSwgZnVuY3Rpb24oZWxlbWVudFRvU2NvcmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWVsZW1lbnRUb1Njb3JlLnBhcmVudE5vZGUgfHwgdHlwZW9mKGVsZW1lbnRUb1Njb3JlLnBhcmVudE5vZGUudGFnTmFtZSkgPT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIHBhcmFncmFwaCBpcyBsZXNzIHRoYW4gMjUgY2hhcmFjdGVycywgZG9uJ3QgZXZlbiBjb3VudCBpdC5cbiAgICAgICAgICAgICAgICB2YXIgaW5uZXJUZXh0ID0gdGhpcy5fZ2V0SW5uZXJUZXh0KGVsZW1lbnRUb1Njb3JlKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5uZXJUZXh0Lmxlbmd0aCA8IDI1KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAvLyBFeGNsdWRlIG5vZGVzIHdpdGggbm8gYW5jZXN0b3IuXG4gICAgICAgICAgICAgICAgdmFyIGFuY2VzdG9ycyA9IHRoaXMuX2dldE5vZGVBbmNlc3RvcnMoZWxlbWVudFRvU2NvcmUsIDMpO1xuICAgICAgICAgICAgICAgIGlmIChhbmNlc3RvcnMubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgICAgICB2YXIgY29udGVudFNjb3JlID0gMDtcblxuICAgICAgICAgICAgICAgIC8vIEFkZCBhIHBvaW50IGZvciB0aGUgcGFyYWdyYXBoIGl0c2VsZiBhcyBhIGJhc2UuXG4gICAgICAgICAgICAgICAgY29udGVudFNjb3JlICs9IDE7XG5cbiAgICAgICAgICAgICAgICAvLyBBZGQgcG9pbnRzIGZvciBhbnkgY29tbWFzIHdpdGhpbiB0aGlzIHBhcmFncmFwaC5cbiAgICAgICAgICAgICAgICBjb250ZW50U2NvcmUgKz0gaW5uZXJUZXh0LnNwbGl0KCcsJykubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgLy8gRm9yIGV2ZXJ5IDEwMCBjaGFyYWN0ZXJzIGluIHRoaXMgcGFyYWdyYXBoLCBhZGQgYW5vdGhlciBwb2ludC4gVXAgdG8gMyBwb2ludHMuXG4gICAgICAgICAgICAgICAgY29udGVudFNjb3JlICs9IE1hdGgubWluKE1hdGguZmxvb3IoaW5uZXJUZXh0Lmxlbmd0aCAvIDEwMCksIDMpO1xuXG4gICAgICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBhbmQgc2NvcmUgYW5jZXN0b3JzLlxuICAgICAgICAgICAgICAgIHRoaXMuX2ZvckVhY2hOb2RlKGFuY2VzdG9ycywgZnVuY3Rpb24oYW5jZXN0b3IsIGxldmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghYW5jZXN0b3IudGFnTmFtZSB8fCAhYW5jZXN0b3IucGFyZW50Tm9kZSB8fCB0eXBlb2YoYW5jZXN0b3IucGFyZW50Tm9kZS50YWdOYW1lKSA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZihhbmNlc3Rvci5yZWFkYWJpbGl0eSkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbml0aWFsaXplTm9kZShhbmNlc3Rvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVzLnB1c2goYW5jZXN0b3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gTm9kZSBzY29yZSBkaXZpZGVyOlxuICAgICAgICAgICAgICAgICAgICAvLyAtIHBhcmVudDogICAgICAgICAgICAgMSAobm8gZGl2aXNpb24pXG4gICAgICAgICAgICAgICAgICAgIC8vIC0gZ3JhbmRwYXJlbnQ6ICAgICAgICAyXG4gICAgICAgICAgICAgICAgICAgIC8vIC0gZ3JlYXQgZ3JhbmRwYXJlbnQrOiBhbmNlc3RvciBsZXZlbCAqIDNcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxldmVsID09PSAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNjb3JlRGl2aWRlciA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGxldmVsID09PSAxKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcmVEaXZpZGVyID0gMjtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcmVEaXZpZGVyID0gbGV2ZWwgKiAzO1xuICAgICAgICAgICAgICAgICAgICBhbmNlc3Rvci5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgKz0gY29udGVudFNjb3JlIC8gc2NvcmVEaXZpZGVyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIEFmdGVyIHdlJ3ZlIGNhbGN1bGF0ZWQgc2NvcmVzLCBsb29wIHRocm91Z2ggYWxsIG9mIHRoZSBwb3NzaWJsZVxuICAgICAgICAgICAgLy8gY2FuZGlkYXRlIG5vZGVzIHdlIGZvdW5kIGFuZCBmaW5kIHRoZSBvbmUgd2l0aCB0aGUgaGlnaGVzdCBzY29yZS5cbiAgICAgICAgICAgIHZhciB0b3BDYW5kaWRhdGVzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBjID0gMCwgY2wgPSBjYW5kaWRhdGVzLmxlbmd0aDsgYyA8IGNsOyBjICs9IDEpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FuZGlkYXRlID0gY2FuZGlkYXRlc1tjXTtcblxuICAgICAgICAgICAgICAgIC8vIFNjYWxlIHRoZSBmaW5hbCBjYW5kaWRhdGVzIHNjb3JlIGJhc2VkIG9uIGxpbmsgZGVuc2l0eS4gR29vZCBjb250ZW50XG4gICAgICAgICAgICAgICAgLy8gc2hvdWxkIGhhdmUgYSByZWxhdGl2ZWx5IHNtYWxsIGxpbmsgZGVuc2l0eSAoNSUgb3IgbGVzcykgYW5kIGJlIG1vc3RseVxuICAgICAgICAgICAgICAgIC8vIHVuYWZmZWN0ZWQgYnkgdGhpcyBvcGVyYXRpb24uXG4gICAgICAgICAgICAgICAgdmFyIGNhbmRpZGF0ZVNjb3JlID0gY2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSAqICgxIC0gdGhpcy5fZ2V0TGlua0RlbnNpdHkoY2FuZGlkYXRlKSk7XG4gICAgICAgICAgICAgICAgY2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSA9IGNhbmRpZGF0ZVNjb3JlO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5sb2coJ0NhbmRpZGF0ZTonLCBjYW5kaWRhdGUsIFwid2l0aCBzY29yZSBcIiArIGNhbmRpZGF0ZVNjb3JlKTtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIHQgPSAwOyB0IDwgdGhpcy5fbmJUb3BDYW5kaWRhdGVzOyB0KyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFUb3BDYW5kaWRhdGUgPSB0b3BDYW5kaWRhdGVzW3RdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghYVRvcENhbmRpZGF0ZSB8fCBjYW5kaWRhdGVTY29yZSA+IGFUb3BDYW5kaWRhdGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3BDYW5kaWRhdGVzLnNwbGljZSh0LCAwLCBjYW5kaWRhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRvcENhbmRpZGF0ZXMubGVuZ3RoID4gdGhpcy5fbmJUb3BDYW5kaWRhdGVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcENhbmRpZGF0ZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHRvcENhbmRpZGF0ZSA9IHRvcENhbmRpZGF0ZXNbMF0gfHwgbnVsbDtcbiAgICAgICAgICAgIHZhciBuZWVkZWRUb0NyZWF0ZVRvcENhbmRpZGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIHBhcmVudE9mVG9wQ2FuZGlkYXRlO1xuXG4gICAgICAgICAgICAvLyBJZiB3ZSBzdGlsbCBoYXZlIG5vIHRvcCBjYW5kaWRhdGUsIGp1c3QgdXNlIHRoZSBib2R5IGFzIGEgbGFzdCByZXNvcnQuXG4gICAgICAgICAgICAvLyBXZSBhbHNvIGhhdmUgdG8gY29weSB0aGUgYm9keSBub2RlIHNvIGl0IGlzIHNvbWV0aGluZyB3ZSBjYW4gbW9kaWZ5LlxuICAgICAgICAgICAgaWYgKHRvcENhbmRpZGF0ZSA9PT0gbnVsbCB8fCB0b3BDYW5kaWRhdGUudGFnTmFtZSA9PT0gXCJCT0RZXCIpIHtcbiAgICAgICAgICAgICAgICAvLyBNb3ZlIGFsbCBvZiB0aGUgcGFnZSdzIGNoaWxkcmVuIGludG8gdG9wQ2FuZGlkYXRlXG4gICAgICAgICAgICAgICAgdG9wQ2FuZGlkYXRlID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XG4gICAgICAgICAgICAgICAgbmVlZGVkVG9DcmVhdGVUb3BDYW5kaWRhdGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIE1vdmUgZXZlcnl0aGluZyAobm90IGp1c3QgZWxlbWVudHMsIGFsc28gdGV4dCBub2RlcyBldGMuKSBpbnRvIHRoZSBjb250YWluZXJcbiAgICAgICAgICAgICAgICAvLyBzbyB3ZSBldmVuIGluY2x1ZGUgdGV4dCBkaXJlY3RseSBpbiB0aGUgYm9keTpcbiAgICAgICAgICAgICAgICB2YXIga2lkcyA9IHBhZ2UuY2hpbGROb2RlcztcbiAgICAgICAgICAgICAgICB3aGlsZSAoa2lkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2coXCJNb3ZpbmcgY2hpbGQgb3V0OlwiLCBraWRzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgdG9wQ2FuZGlkYXRlLmFwcGVuZENoaWxkKGtpZHNbMF0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHBhZ2UuYXBwZW5kQ2hpbGQodG9wQ2FuZGlkYXRlKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2luaXRpYWxpemVOb2RlKHRvcENhbmRpZGF0ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRvcENhbmRpZGF0ZSkge1xuICAgICAgICAgICAgICAgIC8vIEZpbmQgYSBiZXR0ZXIgdG9wIGNhbmRpZGF0ZSBub2RlIGlmIGl0IGNvbnRhaW5zIChhdCBsZWFzdCB0aHJlZSkgbm9kZXMgd2hpY2ggYmVsb25nIHRvIGB0b3BDYW5kaWRhdGVzYCBhcnJheVxuICAgICAgICAgICAgICAgIC8vIGFuZCB3aG9zZSBzY29yZXMgYXJlIHF1aXRlIGNsb3NlZCB3aXRoIGN1cnJlbnQgYHRvcENhbmRpZGF0ZWAgbm9kZS5cbiAgICAgICAgICAgICAgICB2YXIgYWx0ZXJuYXRpdmVDYW5kaWRhdGVBbmNlc3RvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRvcENhbmRpZGF0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvcENhbmRpZGF0ZXNbaV0ucmVhZGFiaWxpdHkuY29udGVudFNjb3JlIC8gdG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSA+PSAwLjc1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbHRlcm5hdGl2ZUNhbmRpZGF0ZUFuY2VzdG9ycy5wdXNoKHRoaXMuX2dldE5vZGVBbmNlc3RvcnModG9wQ2FuZGlkYXRlc1tpXSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBNSU5JTVVNX1RPUENBTkRJREFURVMgPSAzO1xuICAgICAgICAgICAgICAgIGlmIChhbHRlcm5hdGl2ZUNhbmRpZGF0ZUFuY2VzdG9ycy5sZW5ndGggPj0gTUlOSU1VTV9UT1BDQU5ESURBVEVTKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudE9mVG9wQ2FuZGlkYXRlID0gdG9wQ2FuZGlkYXRlLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChwYXJlbnRPZlRvcENhbmRpZGF0ZS50YWdOYW1lICE9PSBcIkJPRFlcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxpc3RzQ29udGFpbmluZ1RoaXNBbmNlc3RvciA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBhbmNlc3RvckluZGV4ID0gMDsgYW5jZXN0b3JJbmRleCA8IGFsdGVybmF0aXZlQ2FuZGlkYXRlQW5jZXN0b3JzLmxlbmd0aCAmJiBsaXN0c0NvbnRhaW5pbmdUaGlzQW5jZXN0b3IgPCBNSU5JTVVNX1RPUENBTkRJREFURVM7IGFuY2VzdG9ySW5kZXgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RzQ29udGFpbmluZ1RoaXNBbmNlc3RvciArPSBOdW1iZXIoYWx0ZXJuYXRpdmVDYW5kaWRhdGVBbmNlc3RvcnNbYW5jZXN0b3JJbmRleF0uaW5jbHVkZXMocGFyZW50T2ZUb3BDYW5kaWRhdGUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsaXN0c0NvbnRhaW5pbmdUaGlzQW5jZXN0b3IgPj0gTUlOSU1VTV9UT1BDQU5ESURBVEVTKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wQ2FuZGlkYXRlID0gcGFyZW50T2ZUb3BDYW5kaWRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRPZlRvcENhbmRpZGF0ZSA9IHBhcmVudE9mVG9wQ2FuZGlkYXRlLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF0b3BDYW5kaWRhdGUucmVhZGFiaWxpdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5pdGlhbGl6ZU5vZGUodG9wQ2FuZGlkYXRlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBCZWNhdXNlIG9mIG91ciBib251cyBzeXN0ZW0sIHBhcmVudHMgb2YgY2FuZGlkYXRlcyBtaWdodCBoYXZlIHNjb3Jlc1xuICAgICAgICAgICAgICAgIC8vIHRoZW1zZWx2ZXMuIFRoZXkgZ2V0IGhhbGYgb2YgdGhlIG5vZGUuIFRoZXJlIHdvbid0IGJlIG5vZGVzIHdpdGggaGlnaGVyXG4gICAgICAgICAgICAgICAgLy8gc2NvcmVzIHRoYW4gb3VyIHRvcENhbmRpZGF0ZSwgYnV0IGlmIHdlIHNlZSB0aGUgc2NvcmUgZ29pbmcgKnVwKiBpbiB0aGUgZmlyc3RcbiAgICAgICAgICAgICAgICAvLyBmZXcgc3RlcHMgdXAgdGhlIHRyZWUsIHRoYXQncyBhIGRlY2VudCBzaWduIHRoYXQgdGhlcmUgbWlnaHQgYmUgbW9yZSBjb250ZW50XG4gICAgICAgICAgICAgICAgLy8gbHVya2luZyBpbiBvdGhlciBwbGFjZXMgdGhhdCB3ZSB3YW50IHRvIHVuaWZ5IGluLiBUaGUgc2libGluZyBzdHVmZlxuICAgICAgICAgICAgICAgIC8vIGJlbG93IGRvZXMgc29tZSBvZiB0aGF0IC0gYnV0IG9ubHkgaWYgd2UndmUgbG9va2VkIGhpZ2ggZW5vdWdoIHVwIHRoZSBET01cbiAgICAgICAgICAgICAgICAvLyB0cmVlLlxuICAgICAgICAgICAgICAgIHBhcmVudE9mVG9wQ2FuZGlkYXRlID0gdG9wQ2FuZGlkYXRlLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgdmFyIGxhc3RTY29yZSA9IHRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmU7XG4gICAgICAgICAgICAgICAgLy8gVGhlIHNjb3JlcyBzaG91bGRuJ3QgZ2V0IHRvbyBsb3cuXG4gICAgICAgICAgICAgICAgdmFyIHNjb3JlVGhyZXNob2xkID0gbGFzdFNjb3JlIC8gMztcbiAgICAgICAgICAgICAgICB3aGlsZSAocGFyZW50T2ZUb3BDYW5kaWRhdGUudGFnTmFtZSAhPT0gXCJCT0RZXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJlbnRPZlRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudFNjb3JlID0gcGFyZW50T2ZUb3BDYW5kaWRhdGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50U2NvcmUgPCBzY29yZVRocmVzaG9sZClcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50U2NvcmUgPiBsYXN0U2NvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFscmlnaHQhIFdlIGZvdW5kIGEgYmV0dGVyIHBhcmVudCB0byB1c2UuXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3BDYW5kaWRhdGUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxhc3RTY29yZSA9IHBhcmVudE9mVG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZTtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSB0b3AgY2FuZGlkYXRlIGlzIHRoZSBvbmx5IGNoaWxkLCB1c2UgcGFyZW50IGluc3RlYWQuIFRoaXMgd2lsbCBoZWxwIHNpYmxpbmdcbiAgICAgICAgICAgICAgICAvLyBqb2luaW5nIGxvZ2ljIHdoZW4gYWRqYWNlbnQgY29udGVudCBpcyBhY3R1YWxseSBsb2NhdGVkIGluIHBhcmVudCdzIHNpYmxpbmcgbm9kZS5cbiAgICAgICAgICAgICAgICBwYXJlbnRPZlRvcENhbmRpZGF0ZSA9IHRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgIHdoaWxlIChwYXJlbnRPZlRvcENhbmRpZGF0ZS50YWdOYW1lICE9IFwiQk9EWVwiICYmIHBhcmVudE9mVG9wQ2FuZGlkYXRlLmNoaWxkcmVuLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvcENhbmRpZGF0ZSA9IHBhcmVudE9mVG9wQ2FuZGlkYXRlO1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRPZlRvcENhbmRpZGF0ZSA9IHRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbml0aWFsaXplTm9kZSh0b3BDYW5kaWRhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSB0aGUgdG9wIGNhbmRpZGF0ZSwgbG9vayB0aHJvdWdoIGl0cyBzaWJsaW5ncyBmb3IgY29udGVudFxuICAgICAgICAgICAgLy8gdGhhdCBtaWdodCBhbHNvIGJlIHJlbGF0ZWQuIFRoaW5ncyBsaWtlIHByZWFtYmxlcywgY29udGVudCBzcGxpdCBieSBhZHNcbiAgICAgICAgICAgIC8vIHRoYXQgd2UgcmVtb3ZlZCwgZXRjLlxuICAgICAgICAgICAgdmFyIGFydGljbGVDb250ZW50ID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XG4gICAgICAgICAgICBpZiAoaXNQYWdpbmcpXG4gICAgICAgICAgICAgICAgYXJ0aWNsZUNvbnRlbnQuaWQgPSBcInJlYWRhYmlsaXR5LWNvbnRlbnRcIjtcblxuICAgICAgICAgICAgdmFyIHNpYmxpbmdTY29yZVRocmVzaG9sZCA9IE1hdGgubWF4KDEwLCB0b3BDYW5kaWRhdGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlICogMC4yKTtcbiAgICAgICAgICAgIC8vIEtlZXAgcG90ZW50aWFsIHRvcCBjYW5kaWRhdGUncyBwYXJlbnQgbm9kZSB0byB0cnkgdG8gZ2V0IHRleHQgZGlyZWN0aW9uIG9mIGl0IGxhdGVyLlxuICAgICAgICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSB0b3BDYW5kaWRhdGUucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIHZhciBzaWJsaW5ncyA9IHBhcmVudE9mVG9wQ2FuZGlkYXRlLmNoaWxkcmVuO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBzID0gMCwgc2wgPSBzaWJsaW5ncy5sZW5ndGg7IHMgPCBzbDsgcysrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNpYmxpbmcgPSBzaWJsaW5nc1tzXTtcbiAgICAgICAgICAgICAgICB2YXIgYXBwZW5kID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmxvZyhcIkxvb2tpbmcgYXQgc2libGluZyBub2RlOlwiLCBzaWJsaW5nLCBzaWJsaW5nLnJlYWRhYmlsaXR5ID8gKFwid2l0aCBzY29yZSBcIiArIHNpYmxpbmcucmVhZGFiaWxpdHkuY29udGVudFNjb3JlKSA6ICcnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZyhcIlNpYmxpbmcgaGFzIHNjb3JlXCIsIHNpYmxpbmcucmVhZGFiaWxpdHkgPyBzaWJsaW5nLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSA6ICdVbmtub3duJyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2libGluZyA9PT0gdG9wQ2FuZGlkYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRCb251cyA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gR2l2ZSBhIGJvbnVzIGlmIHNpYmxpbmcgbm9kZXMgYW5kIHRvcCBjYW5kaWRhdGVzIGhhdmUgdGhlIGV4YW1wbGUgc2FtZSBjbGFzc25hbWVcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNpYmxpbmcuY2xhc3NOYW1lID09PSB0b3BDYW5kaWRhdGUuY2xhc3NOYW1lICYmIHRvcENhbmRpZGF0ZS5jbGFzc05hbWUgIT09IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50Qm9udXMgKz0gdG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSAqIDAuMjtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2libGluZy5yZWFkYWJpbGl0eSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKChzaWJsaW5nLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSArIGNvbnRlbnRCb251cykgPj0gc2libGluZ1Njb3JlVGhyZXNob2xkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaWJsaW5nLm5vZGVOYW1lID09PSBcIlBcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmtEZW5zaXR5ID0gdGhpcy5fZ2V0TGlua0RlbnNpdHkoc2libGluZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZUNvbnRlbnQgPSB0aGlzLl9nZXRJbm5lclRleHQoc2libGluZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZUxlbmd0aCA9IG5vZGVDb250ZW50Lmxlbmd0aDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGVMZW5ndGggPiA4MCAmJiBsaW5rRGVuc2l0eSA8IDAuMjUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChub2RlTGVuZ3RoIDwgODAgJiYgbm9kZUxlbmd0aCA+IDAgJiYgbGlua0RlbnNpdHkgPT09IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlQ29udGVudC5zZWFyY2goL1xcLiggfCQpLykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXBwZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChhcHBlbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2coXCJBcHBlbmRpbmcgbm9kZTpcIiwgc2libGluZyk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuQUxURVJfVE9fRElWX0VYQ0VQVElPTlMuaW5kZXhPZihzaWJsaW5nLm5vZGVOYW1lKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIGhhdmUgYSBub2RlIHRoYXQgaXNuJ3QgYSBjb21tb24gYmxvY2sgbGV2ZWwgZWxlbWVudCwgbGlrZSBhIGZvcm0gb3IgdGQgdGFnLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHVybiBpdCBpbnRvIGEgZGl2IHNvIGl0IGRvZXNuJ3QgZ2V0IGZpbHRlcmVkIG91dCBsYXRlciBieSBhY2NpZGVudC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nKFwiQWx0ZXJpbmcgc2libGluZzpcIiwgc2libGluZywgJ3RvIGRpdi4nKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2libGluZyA9IHRoaXMuX3NldE5vZGVUYWcoc2libGluZywgXCJESVZcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBhcnRpY2xlQ29udGVudC5hcHBlbmRDaGlsZChzaWJsaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2libGluZ3MgaXMgYSByZWZlcmVuY2UgdG8gdGhlIGNoaWxkcmVuIGFycmF5LCBhbmRcbiAgICAgICAgICAgICAgICAgICAgLy8gc2libGluZyBpcyByZW1vdmVkIGZyb20gdGhlIGFycmF5IHdoZW4gd2UgY2FsbCBhcHBlbmRDaGlsZCgpLlxuICAgICAgICAgICAgICAgICAgICAvLyBBcyBhIHJlc3VsdCwgd2UgbXVzdCByZXZpc2l0IHRoaXMgaW5kZXggc2luY2UgdGhlIG5vZGVzXG4gICAgICAgICAgICAgICAgICAgIC8vIGhhdmUgYmVlbiBzaGlmdGVkLlxuICAgICAgICAgICAgICAgICAgICBzIC09IDE7XG4gICAgICAgICAgICAgICAgICAgIHNsIC09IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5fZGVidWcpXG4gICAgICAgICAgICAgICAgdGhpcy5sb2coXCJBcnRpY2xlIGNvbnRlbnQgcHJlLXByZXA6IFwiICsgYXJ0aWNsZUNvbnRlbnQuaW5uZXJIVE1MKTtcbiAgICAgICAgICAgIC8vIFNvIHdlIGhhdmUgYWxsIG9mIHRoZSBjb250ZW50IHRoYXQgd2UgbmVlZC4gTm93IHdlIGNsZWFuIGl0IHVwIGZvciBwcmVzZW50YXRpb24uXG4gICAgICAgICAgICB0aGlzLl9wcmVwQXJ0aWNsZShhcnRpY2xlQ29udGVudCk7XG4gICAgICAgICAgICBpZiAodGhpcy5fZGVidWcpXG4gICAgICAgICAgICAgICAgdGhpcy5sb2coXCJBcnRpY2xlIGNvbnRlbnQgcG9zdC1wcmVwOiBcIiArIGFydGljbGVDb250ZW50LmlubmVySFRNTCk7XG5cbiAgICAgICAgICAgIGlmIChuZWVkZWRUb0NyZWF0ZVRvcENhbmRpZGF0ZSkge1xuICAgICAgICAgICAgICAgIC8vIFdlIGFscmVhZHkgY3JlYXRlZCBhIGZha2UgZGl2IHRoaW5nLCBhbmQgdGhlcmUgd291bGRuJ3QgaGF2ZSBiZWVuIGFueSBzaWJsaW5ncyBsZWZ0XG4gICAgICAgICAgICAgICAgLy8gZm9yIHRoZSBwcmV2aW91cyBsb29wLCBzbyB0aGVyZSdzIG5vIHBvaW50IHRyeWluZyB0byBjcmVhdGUgYSBuZXcgZGl2LCBhbmQgdGhlblxuICAgICAgICAgICAgICAgIC8vIG1vdmUgYWxsIHRoZSBjaGlsZHJlbiBvdmVyLiBKdXN0IGFzc2lnbiBJRHMgYW5kIGNsYXNzIG5hbWVzIGhlcmUuIE5vIG5lZWQgdG8gYXBwZW5kXG4gICAgICAgICAgICAgICAgLy8gYmVjYXVzZSB0aGF0IGFscmVhZHkgaGFwcGVuZWQgYW55d2F5LlxuICAgICAgICAgICAgICAgIHRvcENhbmRpZGF0ZS5pZCA9IFwicmVhZGFiaWxpdHktcGFnZS0xXCI7XG4gICAgICAgICAgICAgICAgdG9wQ2FuZGlkYXRlLmNsYXNzTmFtZSA9IFwicGFnZVwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgZGl2ID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XG4gICAgICAgICAgICAgICAgZGl2LmlkID0gXCJyZWFkYWJpbGl0eS1wYWdlLTFcIjtcbiAgICAgICAgICAgICAgICBkaXYuY2xhc3NOYW1lID0gXCJwYWdlXCI7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gYXJ0aWNsZUNvbnRlbnQuY2hpbGROb2RlcztcbiAgICAgICAgICAgICAgICB3aGlsZSAoY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGRpdi5hcHBlbmRDaGlsZChjaGlsZHJlblswXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFydGljbGVDb250ZW50LmFwcGVuZENoaWxkKGRpdik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9kZWJ1ZylcbiAgICAgICAgICAgICAgICB0aGlzLmxvZyhcIkFydGljbGUgY29udGVudCBhZnRlciBwYWdpbmc6IFwiICsgYXJ0aWNsZUNvbnRlbnQuaW5uZXJIVE1MKTtcblxuICAgICAgICAgICAgdmFyIHBhcnNlU3VjY2Vzc2Z1bCA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIE5vdyB0aGF0IHdlJ3ZlIGdvbmUgdGhyb3VnaCB0aGUgZnVsbCBhbGdvcml0aG0sIGNoZWNrIHRvIHNlZSBpZlxuICAgICAgICAgICAgLy8gd2UgZ290IGFueSBtZWFuaW5nZnVsIGNvbnRlbnQuIElmIHdlIGRpZG4ndCwgd2UgbWF5IG5lZWQgdG8gcmUtcnVuXG4gICAgICAgICAgICAvLyBncmFiQXJ0aWNsZSB3aXRoIGRpZmZlcmVudCBmbGFncyBzZXQuIFRoaXMgZ2l2ZXMgdXMgYSBoaWdoZXIgbGlrZWxpaG9vZCBvZlxuICAgICAgICAgICAgLy8gZmluZGluZyB0aGUgY29udGVudCwgYW5kIHRoZSBzaWV2ZSBhcHByb2FjaCBnaXZlcyB1cyBhIGhpZ2hlciBsaWtlbGlob29kIG9mXG4gICAgICAgICAgICAvLyBmaW5kaW5nIHRoZSAtcmlnaHQtIGNvbnRlbnQuXG4gICAgICAgICAgICB2YXIgdGV4dExlbmd0aCA9IHRoaXMuX2dldElubmVyVGV4dChhcnRpY2xlQ29udGVudCwgdHJ1ZSkubGVuZ3RoO1xuICAgICAgICAgICAgaWYgKHRleHRMZW5ndGggPCB0aGlzLl9jaGFyVGhyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VTdWNjZXNzZnVsID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcGFnZS5pbm5lckhUTUwgPSBwYWdlQ2FjaGVIdG1sO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2ZsYWdJc0FjdGl2ZSh0aGlzLkZMQUdfU1RSSVBfVU5MSUtFTFlTKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVGbGFnKHRoaXMuRkxBR19TVFJJUF9VTkxJS0VMWVMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hdHRlbXB0cy5wdXNoKHthcnRpY2xlQ29udGVudDogYXJ0aWNsZUNvbnRlbnQsIHRleHRMZW5ndGg6IHRleHRMZW5ndGh9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2ZsYWdJc0FjdGl2ZSh0aGlzLkZMQUdfV0VJR0hUX0NMQVNTRVMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlbW92ZUZsYWcodGhpcy5GTEFHX1dFSUdIVF9DTEFTU0VTKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXR0ZW1wdHMucHVzaCh7YXJ0aWNsZUNvbnRlbnQ6IGFydGljbGVDb250ZW50LCB0ZXh0TGVuZ3RoOiB0ZXh0TGVuZ3RofSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9mbGFnSXNBY3RpdmUodGhpcy5GTEFHX0NMRUFOX0NPTkRJVElPTkFMTFkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlbW92ZUZsYWcodGhpcy5GTEFHX0NMRUFOX0NPTkRJVElPTkFMTFkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hdHRlbXB0cy5wdXNoKHthcnRpY2xlQ29udGVudDogYXJ0aWNsZUNvbnRlbnQsIHRleHRMZW5ndGg6IHRleHRMZW5ndGh9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hdHRlbXB0cy5wdXNoKHthcnRpY2xlQ29udGVudDogYXJ0aWNsZUNvbnRlbnQsIHRleHRMZW5ndGg6IHRleHRMZW5ndGh9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gTm8gbHVjayBhZnRlciByZW1vdmluZyBmbGFncywganVzdCByZXR1cm4gdGhlIGxvbmdlc3QgdGV4dCB3ZSBmb3VuZCBkdXJpbmcgdGhlIGRpZmZlcmVudCBsb29wc1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hdHRlbXB0cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS50ZXh0TGVuZ3RoIDwgYi50ZXh0TGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBCdXQgZmlyc3QgY2hlY2sgaWYgd2UgYWN0dWFsbHkgaGF2ZSBzb21ldGhpbmdcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9hdHRlbXB0c1swXS50ZXh0TGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGFydGljbGVDb250ZW50ID0gdGhpcy5fYXR0ZW1wdHNbMF0uYXJ0aWNsZUNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU3VjY2Vzc2Z1bCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocGFyc2VTdWNjZXNzZnVsKSB7XG4gICAgICAgICAgICAgICAgLy8gRmluZCBvdXQgdGV4dCBkaXJlY3Rpb24gZnJvbSBhbmNlc3RvcnMgb2YgZmluYWwgdG9wIGNhbmRpZGF0ZS5cbiAgICAgICAgICAgICAgICB2YXIgYW5jZXN0b3JzID0gW3BhcmVudE9mVG9wQ2FuZGlkYXRlLCB0b3BDYW5kaWRhdGVdLmNvbmNhdCh0aGlzLl9nZXROb2RlQW5jZXN0b3JzKHBhcmVudE9mVG9wQ2FuZGlkYXRlKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc29tZU5vZGUoYW5jZXN0b3JzLCBmdW5jdGlvbihhbmNlc3Rvcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWFuY2VzdG9yLnRhZ05hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcnRpY2xlRGlyID0gYW5jZXN0b3IuZ2V0QXR0cmlidXRlKFwiZGlyXCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXJ0aWNsZURpcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXJ0aWNsZURpciA9IGFydGljbGVEaXI7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFydGljbGVDb250ZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHdoZXRoZXIgdGhlIGlucHV0IHN0cmluZyBjb3VsZCBiZSBhIGJ5bGluZS5cbiAgICAgKiBUaGlzIHZlcmlmaWVzIHRoYXQgdGhlIGlucHV0IGlzIGEgc3RyaW5nLCBhbmQgdGhhdCB0aGUgbGVuZ3RoXG4gICAgICogaXMgbGVzcyB0aGFuIDEwMCBjaGFycy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwb3NzaWJsZUJ5bGluZSB7c3RyaW5nfSAtIGEgc3RyaW5nIHRvIGNoZWNrIHdoZXRoZXIgaXRzIGEgYnlsaW5lLlxuICAgICAqIEByZXR1cm4gQm9vbGVhbiAtIHdoZXRoZXIgdGhlIGlucHV0IHN0cmluZyBpcyBhIGJ5bGluZS5cbiAgICAgKi9cbiAgICBfaXNWYWxpZEJ5bGluZTogZnVuY3Rpb24oYnlsaW5lKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYnlsaW5lID09ICdzdHJpbmcnIHx8IGJ5bGluZSBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgICAgICAgYnlsaW5lID0gYnlsaW5lLnRyaW0oKTtcbiAgICAgICAgICAgIHJldHVybiAoYnlsaW5lLmxlbmd0aCA+IDApICYmIChieWxpbmUubGVuZ3RoIDwgMTAwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEF0dGVtcHRzIHRvIGdldCBleGNlcnB0IGFuZCBieWxpbmUgbWV0YWRhdGEgZm9yIHRoZSBhcnRpY2xlLlxuICAgICAqXG4gICAgICogQHJldHVybiBPYmplY3Qgd2l0aCBvcHRpb25hbCBcImV4Y2VycHRcIiBhbmQgXCJieWxpbmVcIiBwcm9wZXJ0aWVzXG4gICAgICovXG4gICAgX2dldEFydGljbGVNZXRhZGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtZXRhZGF0YSA9IHt9O1xuICAgICAgICB2YXIgdmFsdWVzID0ge307XG4gICAgICAgIHZhciBtZXRhRWxlbWVudHMgPSB0aGlzLl9kb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJtZXRhXCIpO1xuXG4gICAgICAgIC8vIE1hdGNoIFwiZGVzY3JpcHRpb25cIiwgb3IgVHdpdHRlcidzIFwidHdpdHRlcjpkZXNjcmlwdGlvblwiIChDYXJkcylcbiAgICAgICAgLy8gaW4gbmFtZSBhdHRyaWJ1dGUuXG4gICAgICAgIHZhciBuYW1lUGF0dGVybiA9IC9eXFxzKigodHdpdHRlcilcXHMqOlxccyopPyhkZXNjcmlwdGlvbnx0aXRsZSlcXHMqJC9naTtcblxuICAgICAgICAvLyBNYXRjaCBGYWNlYm9vaydzIE9wZW4gR3JhcGggdGl0bGUgJiBkZXNjcmlwdGlvbiBwcm9wZXJ0aWVzLlxuICAgICAgICB2YXIgcHJvcGVydHlQYXR0ZXJuID0gL15cXHMqb2dcXHMqOlxccyooZGVzY3JpcHRpb258dGl0bGUpXFxzKiQvZ2k7XG5cbiAgICAgICAgLy8gRmluZCBkZXNjcmlwdGlvbiB0YWdzLlxuICAgICAgICB0aGlzLl9mb3JFYWNoTm9kZShtZXRhRWxlbWVudHMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50TmFtZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwibmFtZVwiKTtcbiAgICAgICAgICAgIHZhciBlbGVtZW50UHJvcGVydHkgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShcInByb3BlcnR5XCIpO1xuXG4gICAgICAgICAgICBpZiAoW2VsZW1lbnROYW1lLCBlbGVtZW50UHJvcGVydHldLmluZGV4T2YoXCJhdXRob3JcIikgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgbWV0YWRhdGEuYnlsaW5lID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJjb250ZW50XCIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG5hbWUgPSBudWxsO1xuICAgICAgICAgICAgaWYgKG5hbWVQYXR0ZXJuLnRlc3QoZWxlbWVudE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IGVsZW1lbnROYW1lO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eVBhdHRlcm4udGVzdChlbGVtZW50UHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IGVsZW1lbnRQcm9wZXJ0eTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiY29udGVudFwiKTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGVudCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBDb252ZXJ0IHRvIGxvd2VyY2FzZSBhbmQgcmVtb3ZlIGFueSB3aGl0ZXNwYWNlXG4gICAgICAgICAgICAgICAgICAgIC8vIHNvIHdlIGNhbiBtYXRjaCBiZWxvdy5cbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMvZywgJycpO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZXNbbmFtZV0gPSBjb250ZW50LnRyaW0oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChcImRlc2NyaXB0aW9uXCIgaW4gdmFsdWVzKSB7XG4gICAgICAgICAgICBtZXRhZGF0YS5leGNlcnB0ID0gdmFsdWVzW1wiZGVzY3JpcHRpb25cIl07XG4gICAgICAgIH0gZWxzZSBpZiAoXCJvZzpkZXNjcmlwdGlvblwiIGluIHZhbHVlcykge1xuICAgICAgICAgICAgLy8gVXNlIGZhY2Vib29rIG9wZW4gZ3JhcGggZGVzY3JpcHRpb24uXG4gICAgICAgICAgICBtZXRhZGF0YS5leGNlcnB0ID0gdmFsdWVzW1wib2c6ZGVzY3JpcHRpb25cIl07XG4gICAgICAgIH0gZWxzZSBpZiAoXCJ0d2l0dGVyOmRlc2NyaXB0aW9uXCIgaW4gdmFsdWVzKSB7XG4gICAgICAgICAgICAvLyBVc2UgdHdpdHRlciBjYXJkcyBkZXNjcmlwdGlvbi5cbiAgICAgICAgICAgIG1ldGFkYXRhLmV4Y2VycHQgPSB2YWx1ZXNbXCJ0d2l0dGVyOmRlc2NyaXB0aW9uXCJdO1xuICAgICAgICB9XG5cbiAgICAgICAgbWV0YWRhdGEudGl0bGUgPSB0aGlzLl9nZXRBcnRpY2xlVGl0bGUoKTtcbiAgICAgICAgaWYgKCFtZXRhZGF0YS50aXRsZSkge1xuICAgICAgICAgICAgaWYgKFwib2c6dGl0bGVcIiBpbiB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgZmFjZWJvb2sgb3BlbiBncmFwaCB0aXRsZS5cbiAgICAgICAgICAgICAgICBtZXRhZGF0YS50aXRsZSA9IHZhbHVlc1tcIm9nOnRpdGxlXCJdO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcInR3aXR0ZXI6dGl0bGVcIiBpbiB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgdHdpdHRlciBjYXJkcyB0aXRsZS5cbiAgICAgICAgICAgICAgICBtZXRhZGF0YS50aXRsZSA9IHZhbHVlc1tcInR3aXR0ZXI6dGl0bGVcIl07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWV0YWRhdGE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgc2NyaXB0IHRhZ3MgZnJvbSB0aGUgZG9jdW1lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gRWxlbWVudFxuICAgICAqKi9cbiAgICBfcmVtb3ZlU2NyaXB0czogZnVuY3Rpb24oZG9jKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZU5vZGVzKGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JyksIGZ1bmN0aW9uKHNjcmlwdE5vZGUpIHtcbiAgICAgICAgICAgIHNjcmlwdE5vZGUubm9kZVZhbHVlID0gXCJcIjtcbiAgICAgICAgICAgIHNjcmlwdE5vZGUucmVtb3ZlQXR0cmlidXRlKCdzcmMnKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fcmVtb3ZlTm9kZXMoZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdub3NjcmlwdCcpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhpcyBub2RlIGhhcyBvbmx5IHdoaXRlc3BhY2UgYW5kIGEgc2luZ2xlIGVsZW1lbnQgd2l0aCBnaXZlbiB0YWdcbiAgICAgKiBSZXR1cm5zIGZhbHNlIGlmIHRoZSBESVYgbm9kZSBjb250YWlucyBub24tZW1wdHkgdGV4dCBub2Rlc1xuICAgICAqIG9yIGlmIGl0IGNvbnRhaW5zIG5vIGVsZW1lbnQgd2l0aCBnaXZlbiB0YWcgb3IgbW9yZSB0aGFuIDEgZWxlbWVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBFbGVtZW50XG4gICAgICogQHBhcmFtIHN0cmluZyB0YWcgb2YgY2hpbGQgZWxlbWVudFxuICAgICAqKi9cbiAgICBfaGFzU2luZ2xlVGFnSW5zaWRlRWxlbWVudDogZnVuY3Rpb24oZWxlbWVudCwgdGFnKSB7XG4gICAgICAgIC8vIFRoZXJlIHNob3VsZCBiZSBleGFjdGx5IDEgZWxlbWVudCBjaGlsZCB3aXRoIGdpdmVuIHRhZ1xuICAgICAgICBpZiAoZWxlbWVudC5jaGlsZHJlbi5sZW5ndGggIT0gMSB8fCBlbGVtZW50LmNoaWxkcmVuWzBdLnRhZ05hbWUgIT09IHRhZykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQW5kIHRoZXJlIHNob3VsZCBiZSBubyB0ZXh0IG5vZGVzIHdpdGggcmVhbCBjb250ZW50XG4gICAgICAgIHJldHVybiAhdGhpcy5fc29tZU5vZGUoZWxlbWVudC5jaGlsZE5vZGVzLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gdGhpcy5URVhUX05PREUgJiZcbiAgICAgICAgICAgICAgICB0aGlzLlJFR0VYUFMuaGFzQ29udGVudC50ZXN0KG5vZGUudGV4dENvbnRlbnQpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX2lzRWxlbWVudFdpdGhvdXRDb250ZW50OiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSB0aGlzLkVMRU1FTlRfTk9ERSAmJlxuICAgICAgICAgICAgbm9kZS50ZXh0Q29udGVudC50cmltKCkubGVuZ3RoID09IDAgJiZcbiAgICAgICAgICAgIChub2RlLmNoaWxkcmVuLmxlbmd0aCA9PSAwIHx8XG4gICAgICAgICAgICBub2RlLmNoaWxkcmVuLmxlbmd0aCA9PSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnJcIikubGVuZ3RoICsgbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhyXCIpLmxlbmd0aCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERldGVybWluZSB3aGV0aGVyIGVsZW1lbnQgaGFzIGFueSBjaGlsZHJlbiBibG9jayBsZXZlbCBlbGVtZW50cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBFbGVtZW50XG4gICAgICovXG4gICAgX2hhc0NoaWxkQmxvY2tFbGVtZW50OiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc29tZU5vZGUoZWxlbWVudC5jaGlsZE5vZGVzLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ESVZfVE9fUF9FTEVNUy5pbmRleE9mKG5vZGUudGFnTmFtZSkgIT09IC0xIHx8XG4gICAgICAgICAgICAgICAgdGhpcy5faGFzQ2hpbGRCbG9ja0VsZW1lbnQobm9kZSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKioqXG4gICAgICogRGV0ZXJtaW5lIGlmIGEgbm9kZSBxdWFsaWZpZXMgYXMgcGhyYXNpbmcgY29udGVudC5cbiAgICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9HdWlkZS9IVE1ML0NvbnRlbnRfY2F0ZWdvcmllcyNQaHJhc2luZ19jb250ZW50XG4gICAgICoqL1xuICAgIF9pc1BocmFzaW5nQ29udGVudDogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gdGhpcy5URVhUX05PREUgfHwgdGhpcy5QSFJBU0lOR19FTEVNUy5pbmRleE9mKG5vZGUudGFnTmFtZSkgIT09IC0xIHx8XG4gICAgICAgICAgICAoKG5vZGUudGFnTmFtZSA9PT0gXCJBXCIgfHwgbm9kZS50YWdOYW1lID09PSBcIkRFTFwiIHx8IG5vZGUudGFnTmFtZSA9PT0gXCJJTlNcIikgJiZcbiAgICAgICAgICAgIHRoaXMuX2V2ZXJ5Tm9kZShub2RlLmNoaWxkTm9kZXMsIHRoaXMuX2lzUGhyYXNpbmdDb250ZW50KSk7XG4gICAgfSxcblxuICAgIF9pc1doaXRlc3BhY2U6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIChub2RlLm5vZGVUeXBlID09PSB0aGlzLlRFWFRfTk9ERSAmJiBub2RlLnRleHRDb250ZW50LnRyaW0oKS5sZW5ndGggPT09IDApIHx8XG4gICAgICAgICAgICAobm9kZS5ub2RlVHlwZSA9PT0gdGhpcy5FTEVNRU5UX05PREUgJiYgbm9kZS50YWdOYW1lID09PSBcIkJSXCIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGlubmVyIHRleHQgb2YgYSBub2RlIC0gY3Jvc3MgYnJvd3NlciBjb21wYXRpYmx5LlxuICAgICAqIFRoaXMgYWxzbyBzdHJpcHMgb3V0IGFueSBleGNlc3Mgd2hpdGVzcGFjZSB0byBiZSBmb3VuZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBFbGVtZW50XG4gICAgICogQHBhcmFtIEJvb2xlYW4gbm9ybWFsaXplU3BhY2VzIChkZWZhdWx0OiB0cnVlKVxuICAgICAqIEByZXR1cm4gc3RyaW5nXG4gICAgICoqL1xuICAgIF9nZXRJbm5lclRleHQ6IGZ1bmN0aW9uKGUsIG5vcm1hbGl6ZVNwYWNlcykge1xuICAgICAgICBub3JtYWxpemVTcGFjZXMgPSAodHlwZW9mIG5vcm1hbGl6ZVNwYWNlcyA9PT0gJ3VuZGVmaW5lZCcpID8gdHJ1ZSA6IG5vcm1hbGl6ZVNwYWNlcztcbiAgICAgICAgdmFyIHRleHRDb250ZW50ID0gZS50ZXh0Q29udGVudC50cmltKCk7XG5cbiAgICAgICAgaWYgKG5vcm1hbGl6ZVNwYWNlcykge1xuICAgICAgICAgICAgcmV0dXJuIHRleHRDb250ZW50LnJlcGxhY2UodGhpcy5SRUdFWFBTLm5vcm1hbGl6ZSwgXCIgXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0ZXh0Q29udGVudDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBudW1iZXIgb2YgdGltZXMgYSBzdHJpbmcgcyBhcHBlYXJzIGluIHRoZSBub2RlIGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gRWxlbWVudFxuICAgICAqIEBwYXJhbSBzdHJpbmcgLSB3aGF0IHRvIHNwbGl0IG9uLiBEZWZhdWx0IGlzIFwiLFwiXG4gICAgICogQHJldHVybiBudW1iZXIgKGludGVnZXIpXG4gICAgICoqL1xuICAgIF9nZXRDaGFyQ291bnQ6IGZ1bmN0aW9uKGUsIHMpIHtcbiAgICAgICAgcyA9IHMgfHwgXCIsXCI7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRJbm5lclRleHQoZSkuc3BsaXQocykubGVuZ3RoIC0gMTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHRoZSBzdHlsZSBhdHRyaWJ1dGUgb24gZXZlcnkgZSBhbmQgdW5kZXIuXG4gICAgICogVE9ETzogVGVzdCBpZiBnZXRFbGVtZW50c0J5VGFnTmFtZSgqKSBpcyBmYXN0ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gRWxlbWVudFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqKi9cbiAgICBfY2xlYW5TdHlsZXM6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKCFlIHx8IGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnc3ZnJylcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAvLyBSZW1vdmUgYHN0eWxlYCBhbmQgZGVwcmVjYXRlZCBwcmVzZW50YXRpb25hbCBhdHRyaWJ1dGVzXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5QUkVTRU5UQVRJT05BTF9BVFRSSUJVVEVTLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBlLnJlbW92ZUF0dHJpYnV0ZSh0aGlzLlBSRVNFTlRBVElPTkFMX0FUVFJJQlVURVNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuREVQUkVDQVRFRF9TSVpFX0FUVFJJQlVURV9FTEVNUy5pbmRleE9mKGUudGFnTmFtZSkgIT09IC0xKSB7XG4gICAgICAgICAgICBlLnJlbW92ZUF0dHJpYnV0ZSgnd2lkdGgnKTtcbiAgICAgICAgICAgIGUucmVtb3ZlQXR0cmlidXRlKCdoZWlnaHQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjdXIgPSBlLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICB3aGlsZSAoY3VyICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9jbGVhblN0eWxlcyhjdXIpO1xuICAgICAgICAgICAgY3VyID0gY3VyLm5leHRFbGVtZW50U2libGluZztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGRlbnNpdHkgb2YgbGlua3MgYXMgYSBwZXJjZW50YWdlIG9mIHRoZSBjb250ZW50XG4gICAgICogVGhpcyBpcyB0aGUgYW1vdW50IG9mIHRleHQgdGhhdCBpcyBpbnNpZGUgYSBsaW5rIGRpdmlkZWQgYnkgdGhlIHRvdGFsIHRleHQgaW4gdGhlIG5vZGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gRWxlbWVudFxuICAgICAqIEByZXR1cm4gbnVtYmVyIChmbG9hdClcbiAgICAgKiovXG4gICAgX2dldExpbmtEZW5zaXR5OiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgIHZhciB0ZXh0TGVuZ3RoID0gdGhpcy5fZ2V0SW5uZXJUZXh0KGVsZW1lbnQpLmxlbmd0aDtcbiAgICAgICAgaWYgKHRleHRMZW5ndGggPT09IDApXG4gICAgICAgICAgICByZXR1cm4gMDtcblxuICAgICAgICB2YXIgbGlua0xlbmd0aCA9IDA7XG5cbiAgICAgICAgLy8gWFhYIGltcGxlbWVudCBfcmVkdWNlTm9kZUxpc3Q/XG4gICAgICAgIHRoaXMuX2ZvckVhY2hOb2RlKGVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJhXCIpLCBmdW5jdGlvbihsaW5rTm9kZSkge1xuICAgICAgICAgICAgbGlua0xlbmd0aCArPSB0aGlzLl9nZXRJbm5lclRleHQobGlua05vZGUpLmxlbmd0aDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGxpbmtMZW5ndGggLyB0ZXh0TGVuZ3RoO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYW4gZWxlbWVudHMgY2xhc3MvaWQgd2VpZ2h0LiBVc2VzIHJlZ3VsYXIgZXhwcmVzc2lvbnMgdG8gdGVsbCBpZiB0aGlzXG4gICAgICogZWxlbWVudCBsb29rcyBnb29kIG9yIGJhZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBFbGVtZW50XG4gICAgICogQHJldHVybiBudW1iZXIgKEludGVnZXIpXG4gICAgICoqL1xuICAgIF9nZXRDbGFzc1dlaWdodDogZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoIXRoaXMuX2ZsYWdJc0FjdGl2ZSh0aGlzLkZMQUdfV0VJR0hUX0NMQVNTRVMpKVxuICAgICAgICAgICAgcmV0dXJuIDA7XG5cbiAgICAgICAgdmFyIHdlaWdodCA9IDA7XG5cbiAgICAgICAgLy8gTG9vayBmb3IgYSBzcGVjaWFsIGNsYXNzbmFtZVxuICAgICAgICBpZiAodHlwZW9mKGUuY2xhc3NOYW1lKSA9PT0gJ3N0cmluZycgJiYgZS5jbGFzc05hbWUgIT09ICcnKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5SRUdFWFBTLm5lZ2F0aXZlLnRlc3QoZS5jbGFzc05hbWUpKVxuICAgICAgICAgICAgICAgIHdlaWdodCAtPSAyNTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuUkVHRVhQUy5wb3NpdGl2ZS50ZXN0KGUuY2xhc3NOYW1lKSlcbiAgICAgICAgICAgICAgICB3ZWlnaHQgKz0gMjU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBMb29rIGZvciBhIHNwZWNpYWwgSURcbiAgICAgICAgaWYgKHR5cGVvZihlLmlkKSA9PT0gJ3N0cmluZycgJiYgZS5pZCAhPT0gJycpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLlJFR0VYUFMubmVnYXRpdmUudGVzdChlLmlkKSlcbiAgICAgICAgICAgICAgICB3ZWlnaHQgLT0gMjU7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLlJFR0VYUFMucG9zaXRpdmUudGVzdChlLmlkKSlcbiAgICAgICAgICAgICAgICB3ZWlnaHQgKz0gMjU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gd2VpZ2h0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbGVhbiBhIG5vZGUgb2YgYWxsIGVsZW1lbnRzIG9mIHR5cGUgXCJ0YWdcIi5cbiAgICAgKiAoVW5sZXNzIGl0J3MgYSB5b3V0dWJlL3ZpbWVvIHZpZGVvLiBQZW9wbGUgbG92ZSBtb3ZpZXMuKVxuICAgICAqXG4gICAgICogQHBhcmFtIEVsZW1lbnRcbiAgICAgKiBAcGFyYW0gc3RyaW5nIHRhZyB0byBjbGVhblxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqKi9cbiAgICBfY2xlYW46IGZ1bmN0aW9uKGUsIHRhZykge1xuICAgICAgICB2YXIgaXNFbWJlZCA9IFtcIm9iamVjdFwiLCBcImVtYmVkXCIsIFwiaWZyYW1lXCJdLmluZGV4T2YodGFnKSAhPT0gLTE7XG5cbiAgICAgICAgdGhpcy5fcmVtb3ZlTm9kZXMoZS5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWcpLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgICAgICAvLyBBbGxvdyB5b3V0dWJlIGFuZCB2aW1lbyB2aWRlb3MgdGhyb3VnaCBhcyBwZW9wbGUgdXN1YWxseSB3YW50IHRvIHNlZSB0aG9zZS5cbiAgICAgICAgICAgIGlmIChpc0VtYmVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF0dHJpYnV0ZVZhbHVlcyA9IFtdLm1hcC5jYWxsKGVsZW1lbnQuYXR0cmlidXRlcywgZnVuY3Rpb24oYXR0cikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXR0ci52YWx1ZTtcbiAgICAgICAgICAgICAgICB9KS5qb2luKFwifFwiKTtcblxuICAgICAgICAgICAgICAgIC8vIEZpcnN0LCBjaGVjayB0aGUgZWxlbWVudHMgYXR0cmlidXRlcyB0byBzZWUgaWYgYW55IG9mIHRoZW0gY29udGFpbiB5b3V0dWJlIG9yIHZpbWVvXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuUkVHRVhQUy52aWRlb3MudGVzdChhdHRyaWJ1dGVWYWx1ZXMpKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAvLyBUaGVuIGNoZWNrIHRoZSBlbGVtZW50cyBpbnNpZGUgdGhpcyBlbGVtZW50IGZvciB0aGUgc2FtZS5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5SRUdFWFBTLnZpZGVvcy50ZXN0KGVsZW1lbnQuaW5uZXJIVE1MKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIGEgZ2l2ZW4gbm9kZSBoYXMgb25lIG9mIGl0cyBhbmNlc3RvciB0YWcgbmFtZSBtYXRjaGluZyB0aGVcbiAgICAgKiBwcm92aWRlZCBvbmUuXG4gICAgICogQHBhcmFtICBIVE1MRWxlbWVudCBub2RlXG4gICAgICogQHBhcmFtICBTdHJpbmcgICAgICB0YWdOYW1lXG4gICAgICogQHBhcmFtICBOdW1iZXIgICAgICBtYXhEZXB0aFxuICAgICAqIEBwYXJhbSAgRnVuY3Rpb24gICAgZmlsdGVyRm4gYSBmaWx0ZXIgdG8gaW52b2tlIHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMgbm9kZSAnY291bnRzJ1xuICAgICAqIEByZXR1cm4gQm9vbGVhblxuICAgICAqL1xuICAgIF9oYXNBbmNlc3RvclRhZzogZnVuY3Rpb24obm9kZSwgdGFnTmFtZSwgbWF4RGVwdGgsIGZpbHRlckZuKSB7XG4gICAgICAgIG1heERlcHRoID0gbWF4RGVwdGggfHwgMztcbiAgICAgICAgdGFnTmFtZSA9IHRhZ05hbWUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgdmFyIGRlcHRoID0gMDtcbiAgICAgICAgd2hpbGUgKG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgaWYgKG1heERlcHRoID4gMCAmJiBkZXB0aCA+IG1heERlcHRoKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmIChub2RlLnBhcmVudE5vZGUudGFnTmFtZSA9PT0gdGFnTmFtZSAmJiAoIWZpbHRlckZuIHx8IGZpbHRlckZuKG5vZGUucGFyZW50Tm9kZSkpKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIGRlcHRoKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gYW4gb2JqZWN0IGluZGljYXRpbmcgaG93IG1hbnkgcm93cyBhbmQgY29sdW1ucyB0aGlzIHRhYmxlIGhhcy5cbiAgICAgKi9cbiAgICBfZ2V0Um93QW5kQ29sdW1uQ291bnQ6IGZ1bmN0aW9uKHRhYmxlKSB7XG4gICAgICAgIHZhciByb3dzID0gMDtcbiAgICAgICAgdmFyIGNvbHVtbnMgPSAwO1xuICAgICAgICB2YXIgdHJzID0gdGFibGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ0clwiKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByb3dzcGFuID0gdHJzW2ldLmdldEF0dHJpYnV0ZShcInJvd3NwYW5cIikgfHwgMDtcbiAgICAgICAgICAgIGlmIChyb3dzcGFuKSB7XG4gICAgICAgICAgICAgICAgcm93c3BhbiA9IHBhcnNlSW50KHJvd3NwYW4sIDEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJvd3MgKz0gKHJvd3NwYW4gfHwgMSk7XG5cbiAgICAgICAgICAgIC8vIE5vdyBsb29rIGZvciBjb2x1bW4tcmVsYXRlZCBpbmZvXG4gICAgICAgICAgICB2YXIgY29sdW1uc0luVGhpc1JvdyA9IDA7XG4gICAgICAgICAgICB2YXIgY2VsbHMgPSB0cnNbaV0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ0ZFwiKTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2VsbHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY29sc3BhbiA9IGNlbGxzW2pdLmdldEF0dHJpYnV0ZShcImNvbHNwYW5cIikgfHwgMDtcbiAgICAgICAgICAgICAgICBpZiAoY29sc3Bhbikge1xuICAgICAgICAgICAgICAgICAgICBjb2xzcGFuID0gcGFyc2VJbnQoY29sc3BhbiwgMTApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb2x1bW5zSW5UaGlzUm93ICs9IChjb2xzcGFuIHx8IDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29sdW1ucyA9IE1hdGgubWF4KGNvbHVtbnMsIGNvbHVtbnNJblRoaXNSb3cpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7cm93czogcm93cywgY29sdW1uczogY29sdW1uc307XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIExvb2sgZm9yICdkYXRhJyAoYXMgb3Bwb3NlZCB0byAnbGF5b3V0JykgdGFibGVzLCBmb3Igd2hpY2ggd2UgdXNlXG4gICAgICogc2ltaWxhciBjaGVja3MgYXNcbiAgICAgKiBodHRwczovL2R4ci5tb3ppbGxhLm9yZy9tb3ppbGxhLWNlbnRyYWwvcmV2LzcxMjI0MDQ5YzBiNTJhYjE5MDU2NGQzZWEwZWFiMDg5YTE1OWE0Y2YvYWNjZXNzaWJsZS9odG1sL0hUTUxUYWJsZUFjY2Vzc2libGUuY3BwIzkyMFxuICAgICAqL1xuICAgIF9tYXJrRGF0YVRhYmxlczogZnVuY3Rpb24ocm9vdCkge1xuICAgICAgICB2YXIgdGFibGVzID0gcm9vdC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRhYmxlXCIpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhYmxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRhYmxlID0gdGFibGVzW2ldO1xuICAgICAgICAgICAgdmFyIHJvbGUgPSB0YWJsZS5nZXRBdHRyaWJ1dGUoXCJyb2xlXCIpO1xuICAgICAgICAgICAgaWYgKHJvbGUgPT0gXCJwcmVzZW50YXRpb25cIikge1xuICAgICAgICAgICAgICAgIHRhYmxlLl9yZWFkYWJpbGl0eURhdGFUYWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGRhdGF0YWJsZSA9IHRhYmxlLmdldEF0dHJpYnV0ZShcImRhdGF0YWJsZVwiKTtcbiAgICAgICAgICAgIGlmIChkYXRhdGFibGUgPT0gXCIwXCIpIHtcbiAgICAgICAgICAgICAgICB0YWJsZS5fcmVhZGFiaWxpdHlEYXRhVGFibGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBzdW1tYXJ5ID0gdGFibGUuZ2V0QXR0cmlidXRlKFwic3VtbWFyeVwiKTtcbiAgICAgICAgICAgIGlmIChzdW1tYXJ5KSB7XG4gICAgICAgICAgICAgICAgdGFibGUuX3JlYWRhYmlsaXR5RGF0YVRhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGNhcHRpb24gPSB0YWJsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhcHRpb25cIilbMF07XG4gICAgICAgICAgICBpZiAoY2FwdGlvbiAmJiBjYXB0aW9uLmNoaWxkTm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRhYmxlLl9yZWFkYWJpbGl0eURhdGFUYWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHRoZSB0YWJsZSBoYXMgYSBkZXNjZW5kYW50IHdpdGggYW55IG9mIHRoZXNlIHRhZ3MsIGNvbnNpZGVyIGEgZGF0YSB0YWJsZTpcbiAgICAgICAgICAgIHZhciBkYXRhVGFibGVEZXNjZW5kYW50cyA9IFtcImNvbFwiLCBcImNvbGdyb3VwXCIsIFwidGZvb3RcIiwgXCJ0aGVhZFwiLCBcInRoXCJdO1xuICAgICAgICAgICAgdmFyIGRlc2NlbmRhbnRFeGlzdHMgPSBmdW5jdGlvbih0YWcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gISF0YWJsZS5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWcpWzBdO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChkYXRhVGFibGVEZXNjZW5kYW50cy5zb21lKGRlc2NlbmRhbnRFeGlzdHMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2coXCJEYXRhIHRhYmxlIGJlY2F1c2UgZm91bmQgZGF0YS15IGRlc2NlbmRhbnRcIik7XG4gICAgICAgICAgICAgICAgdGFibGUuX3JlYWRhYmlsaXR5RGF0YVRhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTmVzdGVkIHRhYmxlcyBpbmRpY2F0ZSBhIGxheW91dCB0YWJsZTpcbiAgICAgICAgICAgIGlmICh0YWJsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRhYmxlXCIpWzBdKSB7XG4gICAgICAgICAgICAgICAgdGFibGUuX3JlYWRhYmlsaXR5RGF0YVRhYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBzaXplSW5mbyA9IHRoaXMuX2dldFJvd0FuZENvbHVtbkNvdW50KHRhYmxlKTtcbiAgICAgICAgICAgIGlmIChzaXplSW5mby5yb3dzID49IDEwIHx8IHNpemVJbmZvLmNvbHVtbnMgPiA0KSB7XG4gICAgICAgICAgICAgICAgdGFibGUuX3JlYWRhYmlsaXR5RGF0YVRhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE5vdyBqdXN0IGdvIGJ5IHNpemUgZW50aXJlbHk6XG4gICAgICAgICAgICB0YWJsZS5fcmVhZGFiaWxpdHlEYXRhVGFibGUgPSBzaXplSW5mby5yb3dzICogc2l6ZUluZm8uY29sdW1ucyA+IDEwO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFuIGFuIGVsZW1lbnQgb2YgYWxsIHRhZ3Mgb2YgdHlwZSBcInRhZ1wiIGlmIHRoZXkgbG9vayBmaXNoeS5cbiAgICAgKiBcIkZpc2h5XCIgaXMgYW4gYWxnb3JpdGhtIGJhc2VkIG9uIGNvbnRlbnQgbGVuZ3RoLCBjbGFzc25hbWVzLCBsaW5rIGRlbnNpdHksIG51bWJlciBvZiBpbWFnZXMgJiBlbWJlZHMsIGV0Yy5cbiAgICAgKlxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqKi9cbiAgICBfY2xlYW5Db25kaXRpb25hbGx5OiBmdW5jdGlvbihlLCB0YWcpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9mbGFnSXNBY3RpdmUodGhpcy5GTEFHX0NMRUFOX0NPTkRJVElPTkFMTFkpKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHZhciBpc0xpc3QgPSB0YWcgPT09IFwidWxcIiB8fCB0YWcgPT09IFwib2xcIjtcblxuICAgICAgICAvLyBHYXRoZXIgY291bnRzIGZvciBvdGhlciB0eXBpY2FsIGVsZW1lbnRzIGVtYmVkZGVkIHdpdGhpbi5cbiAgICAgICAgLy8gVHJhdmVyc2UgYmFja3dhcmRzIHNvIHdlIGNhbiByZW1vdmUgbm9kZXMgYXQgdGhlIHNhbWUgdGltZVxuICAgICAgICAvLyB3aXRob3V0IGVmZmVjdGluZyB0aGUgdHJhdmVyc2FsLlxuICAgICAgICAvL1xuICAgICAgICAvLyBUT0RPOiBDb25zaWRlciB0YWtpbmcgaW50byBhY2NvdW50IG9yaWdpbmFsIGNvbnRlbnRTY29yZSBoZXJlLlxuICAgICAgICB0aGlzLl9yZW1vdmVOb2RlcyhlLmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZyksIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIC8vIEZpcnN0IGNoZWNrIGlmIHdlJ3JlIGluIGEgZGF0YSB0YWJsZSwgaW4gd2hpY2ggY2FzZSBkb24ndCByZW1vdmUgdXMuXG4gICAgICAgICAgICB2YXIgaXNEYXRhVGFibGUgPSBmdW5jdGlvbih0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHQuX3JlYWRhYmlsaXR5RGF0YVRhYmxlO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX2hhc0FuY2VzdG9yVGFnKG5vZGUsIFwidGFibGVcIiwgLTEsIGlzRGF0YVRhYmxlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHdlaWdodCA9IHRoaXMuX2dldENsYXNzV2VpZ2h0KG5vZGUpO1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRTY29yZSA9IDA7XG5cbiAgICAgICAgICAgIHRoaXMubG9nKFwiQ2xlYW5pbmcgQ29uZGl0aW9uYWxseVwiLCBub2RlKTtcblxuICAgICAgICAgICAgaWYgKHdlaWdodCArIGNvbnRlbnRTY29yZSA8IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuX2dldENoYXJDb3VudChub2RlLCAnLCcpIDwgMTApIHtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm90IHZlcnkgbWFueSBjb21tYXMsIGFuZCB0aGUgbnVtYmVyIG9mXG4gICAgICAgICAgICAgICAgLy8gbm9uLXBhcmFncmFwaCBlbGVtZW50cyBpcyBtb3JlIHRoYW4gcGFyYWdyYXBocyBvciBvdGhlclxuICAgICAgICAgICAgICAgIC8vIG9taW5vdXMgc2lnbnMsIHJlbW92ZSB0aGUgZWxlbWVudC5cbiAgICAgICAgICAgICAgICB2YXIgcCA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJwXCIpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB2YXIgaW1nID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImltZ1wiKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdmFyIGxpID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImxpXCIpLmxlbmd0aCAtIDEwMDtcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW5wdXRcIikubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgdmFyIGVtYmVkQ291bnQgPSAwO1xuICAgICAgICAgICAgICAgIHZhciBlbWJlZHMgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZW1iZWRcIik7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgZWkgPSAwLCBpbCA9IGVtYmVkcy5sZW5ndGg7IGVpIDwgaWw7IGVpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLlJFR0VYUFMudmlkZW9zLnRlc3QoZW1iZWRzW2VpXS5zcmMpKVxuICAgICAgICAgICAgICAgICAgICAgICAgZW1iZWRDb3VudCArPSAxO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBsaW5rRGVuc2l0eSA9IHRoaXMuX2dldExpbmtEZW5zaXR5KG5vZGUpO1xuICAgICAgICAgICAgICAgIHZhciBjb250ZW50TGVuZ3RoID0gdGhpcy5fZ2V0SW5uZXJUZXh0KG5vZGUpLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgIHZhciBoYXZlVG9SZW1vdmUgPVxuICAgICAgICAgICAgICAgICAgICAoaW1nID4gMSAmJiBwIC8gaW1nIDwgMC41ICYmICF0aGlzLl9oYXNBbmNlc3RvclRhZyhub2RlLCBcImZpZ3VyZVwiKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgKCFpc0xpc3QgJiYgbGkgPiBwKSB8fFxuICAgICAgICAgICAgICAgICAgICAoaW5wdXQgPiBNYXRoLmZsb29yKHAvMykpIHx8XG4gICAgICAgICAgICAgICAgICAgICghaXNMaXN0ICYmIGNvbnRlbnRMZW5ndGggPCAyNSAmJiAoaW1nID09PSAwIHx8IGltZyA+IDIpICYmICF0aGlzLl9oYXNBbmNlc3RvclRhZyhub2RlLCBcImZpZ3VyZVwiKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgKCFpc0xpc3QgJiYgd2VpZ2h0IDwgMjUgJiYgbGlua0RlbnNpdHkgPiAwLjIpIHx8XG4gICAgICAgICAgICAgICAgICAgICh3ZWlnaHQgPj0gMjUgJiYgbGlua0RlbnNpdHkgPiAwLjUpIHx8XG4gICAgICAgICAgICAgICAgICAgICgoZW1iZWRDb3VudCA9PT0gMSAmJiBjb250ZW50TGVuZ3RoIDwgNzUpIHx8IGVtYmVkQ291bnQgPiAxKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaGF2ZVRvUmVtb3ZlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYW4gb3V0IGVsZW1lbnRzIHdob3NlIGlkL2NsYXNzIGNvbWJpbmF0aW9ucyBtYXRjaCBzcGVjaWZpYyBzdHJpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gRWxlbWVudFxuICAgICAqIEBwYXJhbSBSZWdFeHAgbWF0Y2ggaWQvY2xhc3MgY29tYmluYXRpb24uXG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICoqL1xuICAgIF9jbGVhbk1hdGNoZWROb2RlczogZnVuY3Rpb24oZSwgcmVnZXgpIHtcbiAgICAgICAgdmFyIGVuZE9mU2VhcmNoTWFya2VyTm9kZSA9IHRoaXMuX2dldE5leHROb2RlKGUsIHRydWUpO1xuICAgICAgICB2YXIgbmV4dCA9IHRoaXMuX2dldE5leHROb2RlKGUpO1xuICAgICAgICB3aGlsZSAobmV4dCAmJiBuZXh0ICE9IGVuZE9mU2VhcmNoTWFya2VyTm9kZSkge1xuICAgICAgICAgICAgaWYgKHJlZ2V4LnRlc3QobmV4dC5jbGFzc05hbWUgKyBcIiBcIiArIG5leHQuaWQpKSB7XG4gICAgICAgICAgICAgICAgbmV4dCA9IHRoaXMuX3JlbW92ZUFuZEdldE5leHQobmV4dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5leHQgPSB0aGlzLl9nZXROZXh0Tm9kZShuZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbGVhbiBvdXQgc3B1cmlvdXMgaGVhZGVycyBmcm9tIGFuIEVsZW1lbnQuIENoZWNrcyB0aGluZ3MgbGlrZSBjbGFzc25hbWVzIGFuZCBsaW5rIGRlbnNpdHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gRWxlbWVudFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqKi9cbiAgICBfY2xlYW5IZWFkZXJzOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGZvciAodmFyIGhlYWRlckluZGV4ID0gMTsgaGVhZGVySW5kZXggPCAzOyBoZWFkZXJJbmRleCArPSAxKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVOb2RlcyhlLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoJyArIGhlYWRlckluZGV4KSwgZnVuY3Rpb24gKGhlYWRlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9nZXRDbGFzc1dlaWdodChoZWFkZXIpIDwgMDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9mbGFnSXNBY3RpdmU6IGZ1bmN0aW9uKGZsYWcpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLl9mbGFncyAmIGZsYWcpID4gMDtcbiAgICB9LFxuXG4gICAgX3JlbW92ZUZsYWc6IGZ1bmN0aW9uKGZsYWcpIHtcbiAgICAgICAgdGhpcy5fZmxhZ3MgPSB0aGlzLl9mbGFncyAmIH5mbGFnO1xuICAgIH0sXG5cbiAgICBfaXNQcm9iYWJseVZpc2libGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUuc3R5bGUuZGlzcGxheSAhPSBcIm5vbmVcIiAmJiAhbm9kZS5oYXNBdHRyaWJ1dGUoXCJoaWRkZW5cIik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERlY2lkZXMgd2hldGhlciBvciBub3QgdGhlIGRvY3VtZW50IGlzIHJlYWRlci1hYmxlIHdpdGhvdXQgcGFyc2luZyB0aGUgd2hvbGUgdGhpbmcuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIGJvb2xlYW4gV2hldGhlciBvciBub3Qgd2Ugc3VzcGVjdCBwYXJzZSgpIHdpbGwgc3VjZWVlZCBhdCByZXR1cm5pbmcgYW4gYXJ0aWNsZSBvYmplY3QuXG4gICAgICovXG4gICAgaXNQcm9iYWJseVJlYWRlcmFibGU6IGZ1bmN0aW9uKGhlbHBlcklzVmlzaWJsZSkge1xuICAgICAgICB2YXIgbm9kZXMgPSB0aGlzLl9nZXRBbGxOb2Rlc1dpdGhUYWcodGhpcy5fZG9jLCBbXCJwXCIsIFwicHJlXCJdKTtcblxuICAgICAgICAvLyBHZXQgPGRpdj4gbm9kZXMgd2hpY2ggaGF2ZSA8YnI+IG5vZGUocykgYW5kIGFwcGVuZCB0aGVtIGludG8gdGhlIGBub2Rlc2AgdmFyaWFibGUuXG4gICAgICAgIC8vIFNvbWUgYXJ0aWNsZXMnIERPTSBzdHJ1Y3R1cmVzIG1pZ2h0IGxvb2sgbGlrZVxuICAgICAgICAvLyA8ZGl2PlxuICAgICAgICAvLyAgIFNlbnRlbmNlczxicj5cbiAgICAgICAgLy8gICA8YnI+XG4gICAgICAgIC8vICAgU2VudGVuY2VzPGJyPlxuICAgICAgICAvLyA8L2Rpdj5cbiAgICAgICAgdmFyIGJyTm9kZXMgPSB0aGlzLl9nZXRBbGxOb2Rlc1dpdGhUYWcodGhpcy5fZG9jLCBbXCJkaXYgPiBiclwiXSk7XG4gICAgICAgIGlmIChick5vZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIHNldCA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgIFtdLmZvckVhY2guY2FsbChick5vZGVzLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAgICAgc2V0LmFkZChub2RlLnBhcmVudE5vZGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBub2RlcyA9IFtdLmNvbmNhdC5hcHBseShBcnJheS5mcm9tKHNldCksIG5vZGVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaGVscGVySXNWaXNpYmxlKSB7XG4gICAgICAgICAgICBoZWxwZXJJc1Zpc2libGUgPSB0aGlzLl9pc1Byb2JhYmx5VmlzaWJsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzY29yZSA9IDA7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBsaXR0bGUgY2hlZWt5LCB3ZSB1c2UgdGhlIGFjY3VtdWxhdG9yICdzY29yZScgdG8gZGVjaWRlIHdoYXQgdG8gcmV0dXJuIGZyb21cbiAgICAgICAgLy8gdGhpcyBjYWxsYmFjazpcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NvbWVOb2RlKG5vZGVzLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICBpZiAoaGVscGVySXNWaXNpYmxlICYmICFoZWxwZXJJc1Zpc2libGUobm9kZSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgdmFyIG1hdGNoU3RyaW5nID0gbm9kZS5jbGFzc05hbWUgKyBcIiBcIiArIG5vZGUuaWQ7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLlJFR0VYUFMudW5saWtlbHlDYW5kaWRhdGVzLnRlc3QobWF0Y2hTdHJpbmcpICYmXG4gICAgICAgICAgICAgICAgIXRoaXMuUkVHRVhQUy5va01heWJlSXRzQUNhbmRpZGF0ZS50ZXN0KG1hdGNoU3RyaW5nKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG5vZGUubWF0Y2hlcyAmJiBub2RlLm1hdGNoZXMoXCJsaSBwXCIpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdGV4dENvbnRlbnRMZW5ndGggPSBub2RlLnRleHRDb250ZW50LnRyaW0oKS5sZW5ndGg7XG4gICAgICAgICAgICBpZiAodGV4dENvbnRlbnRMZW5ndGggPCAxNDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNjb3JlICs9IE1hdGguc3FydCh0ZXh0Q29udGVudExlbmd0aCAtIDE0MCk7XG5cbiAgICAgICAgICAgIGlmIChzY29yZSA+IDIwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSdW5zIHJlYWRhYmlsaXR5LlxuICAgICAqXG4gICAgICogV29ya2Zsb3c6XG4gICAgICogIDEuIFByZXAgdGhlIGRvY3VtZW50IGJ5IHJlbW92aW5nIHNjcmlwdCB0YWdzLCBjc3MsIGV0Yy5cbiAgICAgKiAgMi4gQnVpbGQgcmVhZGFiaWxpdHkncyBET00gdHJlZS5cbiAgICAgKiAgMy4gR3JhYiB0aGUgYXJ0aWNsZSBjb250ZW50IGZyb20gdGhlIGN1cnJlbnQgZG9tIHRyZWUuXG4gICAgICogIDQuIFJlcGxhY2UgdGhlIGN1cnJlbnQgRE9NIHRyZWUgd2l0aCB0aGUgbmV3IG9uZS5cbiAgICAgKiAgNS4gUmVhZCBwZWFjZWZ1bGx5LlxuICAgICAqXG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICoqL1xuICAgIHBhcnNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIEF2b2lkIHBhcnNpbmcgdG9vIGxhcmdlIGRvY3VtZW50cywgYXMgcGVyIGNvbmZpZ3VyYXRpb24gb3B0aW9uXG4gICAgICAgIGlmICh0aGlzLl9tYXhFbGVtc1RvUGFyc2UgPiAwKSB7XG4gICAgICAgICAgICB2YXIgbnVtVGFncyA9IHRoaXMuX2RvYy5nZXRFbGVtZW50c0J5VGFnTmFtZShcIipcIikubGVuZ3RoO1xuICAgICAgICAgICAgaWYgKG51bVRhZ3MgPiB0aGlzLl9tYXhFbGVtc1RvUGFyc2UpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBYm9ydGluZyBwYXJzaW5nIGRvY3VtZW50OyBcIiArIG51bVRhZ3MgKyBcIiBlbGVtZW50cyBmb3VuZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSBzY3JpcHQgdGFncyBmcm9tIHRoZSBkb2N1bWVudC5cbiAgICAgICAgdGhpcy5fcmVtb3ZlU2NyaXB0cyh0aGlzLl9kb2MpO1xuXG4gICAgICAgIHRoaXMuX3ByZXBEb2N1bWVudCgpO1xuXG4gICAgICAgIHZhciBtZXRhZGF0YSA9IHRoaXMuX2dldEFydGljbGVNZXRhZGF0YSgpO1xuICAgICAgICB0aGlzLl9hcnRpY2xlVGl0bGUgPSBtZXRhZGF0YS50aXRsZTtcblxuICAgICAgICB2YXIgYXJ0aWNsZUNvbnRlbnQgPSB0aGlzLl9ncmFiQXJ0aWNsZSgpO1xuICAgICAgICBpZiAoIWFydGljbGVDb250ZW50KVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgdGhpcy5sb2coXCJHcmFiYmVkOiBcIiArIGFydGljbGVDb250ZW50LmlubmVySFRNTCk7XG5cbiAgICAgICAgdGhpcy5fcG9zdFByb2Nlc3NDb250ZW50KGFydGljbGVDb250ZW50KTtcblxuICAgICAgICAvLyBJZiB3ZSBoYXZlbid0IGZvdW5kIGFuIGV4Y2VycHQgaW4gdGhlIGFydGljbGUncyBtZXRhZGF0YSwgdXNlIHRoZSBhcnRpY2xlJ3NcbiAgICAgICAgLy8gZmlyc3QgcGFyYWdyYXBoIGFzIHRoZSBleGNlcnB0LiBUaGlzIGlzIHVzZWQgZm9yIGRpc3BsYXlpbmcgYSBwcmV2aWV3IG9mXG4gICAgICAgIC8vIHRoZSBhcnRpY2xlJ3MgY29udGVudC5cbiAgICAgICAgaWYgKCFtZXRhZGF0YS5leGNlcnB0KSB7XG4gICAgICAgICAgICB2YXIgcGFyYWdyYXBocyA9IGFydGljbGVDb250ZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicFwiKTtcbiAgICAgICAgICAgIGlmIChwYXJhZ3JhcGhzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBtZXRhZGF0YS5leGNlcnB0ID0gcGFyYWdyYXBoc1swXS50ZXh0Q29udGVudC50cmltKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGV4dENvbnRlbnQgPSBhcnRpY2xlQ29udGVudC50ZXh0Q29udGVudDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRpdGxlOiB0aGlzLl9hcnRpY2xlVGl0bGUsXG4gICAgICAgICAgICBieWxpbmU6IG1ldGFkYXRhLmJ5bGluZSB8fCB0aGlzLl9hcnRpY2xlQnlsaW5lLFxuICAgICAgICAgICAgZGlyOiB0aGlzLl9hcnRpY2xlRGlyLFxuICAgICAgICAgICAgY29udGVudDogYXJ0aWNsZUNvbnRlbnQuaW5uZXJIVE1MLFxuICAgICAgICAgICAgdGV4dENvbnRlbnQ6IHRleHRDb250ZW50LFxuICAgICAgICAgICAgbGVuZ3RoOiB0ZXh0Q29udGVudC5sZW5ndGgsXG4gICAgICAgICAgICBleGNlcnB0OiBtZXRhZGF0YS5leGNlcnB0LFxuICAgICAgICB9O1xuICAgIH1cbn07Il19
