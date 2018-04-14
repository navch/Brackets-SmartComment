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


    var AppInit              = brackets.getModule("utils/AppInit"),
//		RefactoringUtils	 = require("RefactoringUtils"),
		EditorManager		 = brackets.getModule("editor/EditorManager"),
		AcornLoose    		 = brackets.getModule("thirdparty/acorn/dist/acorn_loose"),
        DocCommentHints		 = require("./DocCommentHints"),
        SmartComment         = require("DocCommentHints");

//	var RefactoringSession   = RefactoringUtils.RefactoringSession;

    AppInit.appReady(function () {

		function _handleKeydownEvent(jqEvent, editor, event) {
			//keyDownEditor = editor;
			
			
			if (!(event.ctrlKey || event.altKey || event.metaKey) &&
					(event.keyCode === 14 ||
					 event.keyCode === 13)) {
				var prevCursorLine = editor.getSelection().start.line - 1;
                if(prevCursorLine >= 0 && editor.document.getLine(prevCursorLine)) {
                
                    var tokenType = editor._codeMirror.getTokenTypeAt({line: prevCursorLine, ch: editor.document.getLine(prevCursorLine).length - 1});
                    if (tokenType === "m-javascript comment") {
                        //var lastChar = String.fromCharCode(event.keyCode);
//                        var xyz =  new RefactoringSession(editor);
                        AcornLoose.parse_dammit(editor.document.getText(), {onComment: function (block, text, start, end){
                            if (block === true && text[0] === "*" && editor.indexFromPos(editor.getSelection().start) > start &&
                               editor.indexFromPos(editor.getSelection().end) < end) {
                                editor.document.replaceRange("* ", editor.getSelection().start);
                            }
                        }});
                    }
                }
			}
		}

		function activeEditorChangeHandler(event, current, previous) {
            if (current) {
                current.on("keyup", _handleKeydownEvent);
            }

            if (previous) {
                //Removing all old Handlers
                previous.off("keyup", _handleKeydownEvent);
            }
		}
		EditorManager.on("activeEditorChange", activeEditorChangeHandler);
        
        DocCommentHints.registerDocHints();
    });
});
