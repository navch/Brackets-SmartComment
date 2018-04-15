/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

define(function (require, exports, module) {
    "use strict";

    var CodeHintManager      = brackets.getModule("editor/CodeHintManager"),
        EditorManager        = brackets.getModule("editor/EditorManager"),
        AppInit              = brackets.getModule("utils/AppInit"),
        HintUtils            = brackets.getModule("JSUtils/HintUtils"),
        _                    = brackets.getModule("thirdparty/lodash"),
        TokenUtils           = brackets.getModule("utils/TokenUtils"),
        ASTWalker            = brackets.getModule("thirdparty/acorn/dist/walk"),
        AcornLoose           = brackets.getModule("thirdparty/acorn/dist/acorn_loose"),
        KeyEvent             = brackets.getModule('utils/KeyEvent'),
        Session              = brackets.getModule("JSUtils/Session"),
        StringMatch          = brackets.getModule("utils/StringMatch");

    var templates = JSON.parse(require("text!templates/Templates.json")),
        jsDocTags = JSON.parse(require("text!JSDocTags.json")),
        editor = EditorManager.getActiveEditor(),
        hintsType;
    
/**
 * 
 * @    
 * @param {{type}} editor [[Description]]
 * @return {{type}} [[Description]]
 */
    function findNextASTNode(editor) {
        var start = editor.indexFromPos(editor.getSelection().start),
            doc = editor.document;
            
        return ASTWalker.findNodeAfter(AcornLoose.parse_dammit(doc.getText()), start);
    }

    /**
     * @
     * @param {{type}} template -
     * @param {{type}} params -
     * @param {{type}} isReturnSt -
     * @return {{type}} -
     */
    function _modifyDocTemplate(template, params, isReturnSt) {
        var templateText = templates[template],
            str;
        if (params) {
            var paramLen = params.length;
            for(var i = 0; i < paramLen; i++) {
                str = templates["parameterJSDoc"];
                var compiled = _.template(str);
                str = compiled({paramName: params[i]});
                templateText = templateText + str;
            }
        }
        if (isReturnSt) {
            str = templates["returnJSDoc"];
            templateText = templateText + str;
        }
        return templateText + "*/";
    }

    function _insertHintFromTemplate(template, args = {}, rangeToReplace) {
        var templateText;
        if (args instanceof Object && (Object.getOwnPropertyNames(args).length > 0) && args.params) {
            templateText = _modifyDocTemplate(template, args.params, args.returnStatement);
        } else {
            templateText = templates[template];
        }

        var compiled = _.template(templateText),
            formattedText = compiled(args);

        if (!rangeToReplace) {
            rangeToReplace = EditorManager.getActiveEditor().getSelection();
        }

        EditorManager.getActiveEditor().document.replaceRange(formattedText, rangeToReplace.start, rangeToReplace.end);

        var startLine = rangeToReplace.start.line,
            endLine = startLine + formattedText.split("\n").length;

        for (var i = startLine + 2; i < endLine; i++) {
            EditorManager.getActiveEditor()._codeMirror.indentLine(i, "prev", true);
        }
    }

    function _insertDocForNextFunctionNode() {

    }

    function _getFunctionDetailsFromNode(node) {
        var params = [],
            returnStatement = false,
            isCtor = false;
        if (node.params && node.params.length > 0) {
            node.params.forEach(function (item) {
                if (item.name) {
                    params.push(item.name);
                } else if (item.left && item.left.name) {
                    params.push(item.left.name + "=" + item.right.raw);
                }
            });
        }
        // TODO - the way we are trying to find return statement
        if (node.body && node.body.body.length > 0 && node.body.body[node.body.body.length-1].type === "ReturnStatement") {
            returnStatement = true;
        }

        if (node.id &&node.id.name[0] === node.id.name[0].toUpperCase() && node.id.name[0] !== node.id.name[0].toLowerCase()) {
            isCtor = true;
        }

        return {
            params: params,
            returmStatement: returnStatement,
            isCtor: isCtor
        };
    }

    function _checkForNextfunctionNodes(node) {
        var funcDetails = null;

        // Check for function declaration
        if (node.type === "FunctionDeclaration" && node.id) {
            funcDetails = _getFunctionDetailsFromNode(node);
        } else if (node.type === "VariableDeclaration" && node.declarations.length === 1 &&
        node.declarations[0].type === "VariableDeclarator" &&
        node.declarations[0].init.type === "FunctionExpression") {
            //For Variable declation i.e. var xyz = function () {}
            funcDetails = _getFunctionDetailsFromNode(node.declarations[0].init);
        } else if (node.type === "ExpressionStatement" && node.expression.type === "AssignmentExpression" &&
        node.expression.left.type === "MemberExpression" && node.expression.right.type === "FunctionExpression"){
            //For Expression statement i.e. this.some = function () {}
            funcDetails = _getFunctionDetailsFromNode(node.expression.right);
        } else if (node.type === "Property" && node.value.type === "FunctionExpression") {
            // For properties like : var x = {sum: function(a, b) {return a+b}}
            funcDetails = _getFunctionDetailsFromNode(node);
        } else if (node.type === "LabeledStatement" && node.body.type === "FunctionDeclaration") {
            // For properties like : var x = {sum: function(a, b) {return a+b}}
            funcDetails = _getFunctionDetailsFromNode(node.body);
        }
        if (funcDetails) {
            _insertHintFromTemplate(funcDetails.isCtor === true ? "constructorFunction" : "functionJSDoc",
            {params: funcDetails.params, returnStatement: funcDetails.returmStatement});
            return true;
        }
        return false;
    }

    function _checkForNextDeclNodes(node) {
        if (node.type === "VariableDeclaration" && node.kind) {
            node.kind === "const" ? _insertHintFromTemplate("constantJSDoc") : _insertHintFromTemplate("varDeclJSDoc");
            return true;
        } else if (node.type === "ExpressionStatement" && node.expression.type === "AssignmentExpression" &&
        node.expression.right.type === "Identifier") {
            _insertHintFromTemplate("varDeclJSDoc");
            return true;
        }
        return false;
    }

    function _checkForNameSpaceNode(node) {
        //if (node.type === "Program" && )
    }

    function _checkForNextClassNode(node) {
        if (node.type === "ClassDeclaration") {
            if (node.superClass) {
                _insertHintFromTemplate("classDeclWithExtends", {superClass: node.superClass.name});
            } else {
                _insertHintFromTemplate("classDeclWithClassSyntx");

            }
            return true;
        }
        return false;
    }

    function _checkForClassMember(node) {

    }
    
    function _checkForMemberNodes(node) {
        if (node.type === "Property" && node.kind === "init") {
            _insertHintFromTemplate("memberJSDoc");
        }
    }

    function _insideDocComment(editor, startPos, endPos) {
        var tokenType = editor._codeMirror.getTokenTypeAt(startPos);
        var commentPos = null;
        if (tokenType === "m-javascript comment" || tokenType === "comment") {
            AcornLoose.parse_dammit(editor.document.getText(), {onComment: function (block, text, start, end){
                if (block === true && text[0] === "*" && editor.indexFromPos(startPos) > start &&
                   editor.indexFromPos(endPos) < end) {
                    commentPos = {
                        text: text,
                        start: start,
                        end: end
                    };
                }
            }});
        }
        return commentPos;
    }
/**
 * 
 * 
 * @param {{type}} hints [[Description]]
 * @param {{type}} query [[Description]]
 * @return {{type}} [[Description]]
 */
    function formatHints(hints, query) {
        return hints.map(function (token) {
            var $hintObj = $("<span>").addClass("brackets-js-hints");
            if (token instanceof Object) {
                $hintObj.text(token.value);
            } else {
                $hintObj.text(token);
            }
            $('<span>' + "JSDoc comment" + '</span>').appendTo($hintObj).addClass("brackets-js-hints-type-details");
            $hintObj.data("token", token);
            return $hintObj;
//            return filterWithQueryAndMatcher($hintObj, getStringMatcher(), query)
//            return $hintObj;
        });
    }

    function docCommentHint(editor, query) {
        var hints = ["\/** *\/"];
        var token = TokenUtils.getTokenAt(editor._codeMirror,
                {line: editor.getSelection().start.line, ch: editor.getSelection().start.ch});

        if (token.type === "comment" && token.string !== "/**") {
            hints.length = 0;
        }

        return {
            hints: formatHints(hints, query),
            match: null,
            selectInitial: true,
            handleWideResults: false
        };
    }
    /**
 * @
 * @param {{type|}} query [[Description]]
 * @return {{type}} [[Description]]
 */
    function getTagHints(query) {
        var hints = jsDocTags.tags;
        
        hints = filterWithQueryAndMatcher(hints, getStringMatcher(), query);
                
        return {
            hints: formatHints(hints, query),
            match: null,
            selectInitial: true,
            handleWideResults: false
        };
    }
    
    function getDataTypeHints(query) {
        var hints = jsDocTags.types;
        hints = filterWithQueryAndMatcher(hints, getStringMatcher(), query);
        return {
            hints: formatHints(hints, query),
            match: null,
            selectInitial: true,
            handleWideResults: false
        };
    }

    function getCurrentDocTags(commentText) {
        var tagsFinderRegex = /\[\[.*?\]\]/,
            nextTag = tagsFinderRegex.exec(commentText);
        return nextTag;
    }

    /**
     * Handle the key Event jump to handleEnter,handleTab (inside a doc block)
     *  or generate a docblock if the currentLine is /** or do nothing
     * @access    [[Access<private|protected|public>]]
     * @@aug    ments [[Link]]  
     * @param {Object} event key event
     */
    function handleTabInsidejsDocComment(event) {
        var editor = EditorManager.getCurrentFullEditor();
        var selection = editor.getSelection();
        if (event.type === 'keydown' && event.keyCode === KeyEvent.DOM_VK_TAB) {
            var docBlockPos = _insideDocComment(editor, selection.start, selection.end);
            if (docBlockPos && event.keyCode === KeyEvent.DOM_VK_TAB) {
                var document  = editor.document;
                // get current doc block
                var commentDetails = _insideDocComment(editor, selection.start, selection.end),
                    cursonPos = editor.getCursorPos(),
                    cursorIndex = editor.indexFromPos(cursonPos);
                    
                
                var nextTag = getCurrentDocTags(document.getRange(editor.getCursorPos(), editor.posFromIndex(commentDetails.end))),
                    nextTagIndex;
                if (!nextTag) {
                    nextTag = getCurrentDocTags(document.getRange(editor.posFromIndex(commentDetails.start), editor.getCursorPos()));
                    if (nextTag && nextTag.length > 0) {
                        nextTagIndex = commentDetails.start + nextTag.index;
                    }
                } else {
                    nextTagIndex = cursorIndex + nextTag.index;
                }
                if (nextTag) {
                    editor.setSelection(editor.posFromIndex(nextTagIndex), editor.posFromIndex(nextTagIndex + nextTag[0].length));
                    event.preventDefault();
                }
            }
        }
    }
    
    
    /**
     * Is the token's class hintable? (A very conservative test.)
     * @ver
     * @param {string|object|RegExp|} token - the token to test for hintability
     * @return {boolean} - could the token be hintable?
     */
    
    function hintable(token) {

        if (token.string.length <= 0) {
            return false;
        }
        hintsType = null;
        if ((token.string.indexOf("{") >= 0) || (token.string.indexOf("|") >= 0)) {
            hintsType = "jsDocDataTypes";
        } else if (token.string.indexOf("@") >= 0){
            hintsType = "jsDocTags";
        }
        var lastChar = token.string.substr(token.string.length - 1);
        if (lastChar === "*") {
            lastChar = token.string.substr(token.string.length - 3);
        }
        if (hintsType) {
            return true;
        }
        switch (lastChar) {
        case "/**":
            hintsType = "jsDocTemplate";
            break;
        case "@":
            hintsType = "jsDocTags";
            break;
        case "{":
        case "}":
        case "|":
            hintsType = "jsDocDataTypes";
            break;
        default:
            hintsType = null;
        }
        if (hintsType) {
            return true;
        }
    }
    /**
    * @constructor
    */
    function JSDocHints() {
    }
    
    /**
     * Determine whether hints are available for a given editor context
     * @alias [[Link]]
     * {}
     * @@augments [[Link]]  
     * @param {Editor} editor - the current editor context
     * @param {string} key - charCode of the last pressed key
     * @return {boolean} - can the provider provide hints for this session?
     */
    JSDocHints.prototype.hasHints = function (editor, key) {
        var startPos = editor.getSelection().start,
            endPos = editor.getSelection().end;

        var token = TokenUtils.getTokenAt(editor._codeMirror,
                    {line: editor.getSelection().start.line, ch: editor.getSelection().start.ch});
        if (token.type !== "comment") {
            return false;
        }
        hintsType = null;
        if (key === "*" || key === "@" || key === "{" || key === "|") {
            if (hintable(token)) {
                return true;
            }
        } else if (key === null) {
            var insideDocPos = _insideDocComment(editor, startPos, endPos);
            if (insideDocPos && hintable(token)) {
                return true;
            }
        }
        return false;
    };

    /*
    /**
     *  Create a new StringMatcher instance, if needed.
     *
     * @return {StringMatcher} - a StringMatcher instance.
     */
    function getStringMatcher() {
        var matcher = new StringMatch.StringMatcher({
                preferPrefixMatches: true
            });

        return matcher;
    }
    
    
        /**
         *  Filter an array hints using a given query and matcher.
         *  The hints are returned in the format of the matcher.
         *  The matcher returns the value in the "label" property,
         *  the match score in "matchGoodness" property.
         *
         * @param {Array} hints - array of hints
         * @param {StringMatcher|arArray} matcher
         * @return {Array} - array of matching hints.
         */
        function filterWithQueryAndMatcher(hints, matcher, query) {
            var matchResults = $.map(hints, function (hint) {
                var searchResult = matcher.match(hint.value, query);
                if (searchResult) {
                    searchResult.value = hint.value;
                }

                return searchResult;
            });

            return matchResults;
        }
    
    function maybeIdentifier(char) {
        if (char === "*" || char === "@" || char === "{" || char === "|") {
            return false;
        }
        return true;
    }
    /**
      * Return a list of hints, possibly deferred, for the current editor
      * context
      * @vers
      * @@access [[Access<private|protected|public>]]
      * @param {string} key - charCode of the last pressed key
      * @return {Object + jQuery.Deferred} - hint response (immediate or
      *     deferred) as defined by the CodeHintManager API
      */
    
    
    JSDocHints.prototype.getHints = function (key) {
        var editor = EditorManager.getActiveEditor(),
            hints;
        var cursor  = editor._codeMirror.getCursor(),
            token   = TokenUtils.getTokenAt(editor._codeMirror, cursor),
            query   = "",
            start   = cursor.ch,
            end     = start;

        if (token) {
            var line = editor.document.getLine(cursor.line);
            
             while (start > 0) {
                    if (maybeIdentifier(line[start - 1])) {
                    start--;
                } else {
                    break;
                }
            }
            query = line.substring(start, end);
        }

        if (hintsType === "jsDocTemplate") {
            hints = docCommentHint(editor);
        } else if (hintsType ===  "jsDocTags") {
            hints = getTagHints(query);
        } else if (hintsType === "jsDocDataTypes") {
            hints = getDataTypeHints(query);
        }

        return hints;
    };

    /**
    function insertJSDocTemplate($hintObj) {
        var editor = EditorManager.getActiveEditor();
        var doc = editor.document;

        var pos = editor.getSelection();
        var startPos = {
                line: pos.start.line,
                ch: pos.end.ch - 3
            },
            endPos = pos.start;

        var replaceRange = {
            start: startPos,
            end: endPos
        };
        
        var templateInserted = false;

        //First remove that comment stuff
        //If we will not do so then it gonna mad it will understand next node is comment :P

        doc.replaceRange("", replaceRange.start, replaceRange.end);

        var nextNode = findNextASTNode(editor).node;
        
        // When we on first line of editor it provides next node as complete Program or root node
        
        if (nextNode.type === "Program" && nextNode.body.length > 0) {
            nextNode = nextNode.body[0];
        }

        //Check if next node is function declaration
        if (_checkForNextfunctionNodes(nextNode)) {
            templateInserted = true;
        } else if (_checkForNextDeclNodes(nextNode)) { // Variable Declaration
            templateInserted = true;
        } else if (_checkForNextClassNode(nextNode)) {
            templateInserted = true;
        } else if (_checkForClassMember(nextNode)) {
            templateInserted = true;
        } else if (_checkForMemberNodes(nextNode)) {
            templateInserted = true;
        } else {
            _insertHintFromTemplate("blankJSDoc", {});
        }
    }
    /**
 * @access [[Access<private|protected|public>]]
 * @param {{type}} $hintObj [[Description]]
 */
    function insertJSDocTags($hintObj) {
        var editor = EditorManager.getActiveEditor();
        var doc = editor.document;
        var pos = editor.getSelection();
        var startPos = pos.start;

        var replaceRange = getReplaceRangeToInsertHint(editor);
        
        var completion        = $hintObj.data("token").value
        
        editor._codeMirror.replaceRange(completion, {ch: replaceRange.start.ch - 1, line: replaceRange.start.line}, replaceRange.end);
    }
    
    function getReplaceRangeToInsertHint(editor) {
        
        var cursor  = editor._codeMirror.getCursor(),
            token   = TokenUtils.getTokenAt(editor._codeMirror, cursor),
            query   = "",
            start   = cursor.ch,
            end     = start;

        if (token) {
            var line = editor.document.getLine(cursor.line);
            
             while (start > 0) {
                    if (maybeIdentifier(line[start - 1])) {
                    start--;
                } else {
                    break;
                }
            }
        }
        return {
            start: {ch: start, line: cursor.line},
            end: cursor
        }
    }
    
    function insertJSDocDataTypes($hintObj) {
        var editor = EditorManager.getActiveEditor();
        var doc = editor.document;
        var pos = editor.getSelection();
        var startPos = pos.start;

        var replaceRange = getReplaceRangeToInsertHint(editor);
        
        var completion        = $hintObj.data("token").value;
        
        editor._codeMirror.replaceRange(completion, replaceRange.start, replaceRange.end);
    }
    
    /**
     * Inserts the hint selected by the user into the current editor.
     * 
     * @ac@access [[Access<private|protected|public>]]
     * @param {jQuery.Object} $hintObj - hint object to insert into current editor
     * @return {boolean} - should a new hinting session be requested
     *      immediately after insertion?
     */
    JSDocHints.prototype.insertHint = function ($hintObj) {

        if (hintsType === "jsDocTemplate") {
            insertJSDocTemplate($hintObj);
        } else if (hintsType === "jsDocTags") {
            insertJSDocTags($hintObj);
        } else if (hintsType === "jsDocDataTypes") {
            insertJSDocDataTypes($hintObj);
        }

        hintsType = null;
        return false;
    };

    AppInit.appReady(function () {

        var editorHolder = $("#editor-holder")[0];
        if (editorHolder) {
            editorHolder.addEventListener("keydown", handleTabInsidejsDocComment, true);
//            editorHolder.addEventListener("dblclick", handleClick, true)
        }

        function registerDocHints() {
            var jsDocHints = new JSDocHints();
            CodeHintManager.registerHintProvider(jsDocHints, HintUtils.SUPPORTED_LANGUAGES, -1);
        }
        exports.registerDocHints = registerDocHints;
    });
});
