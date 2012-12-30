/**
 * @project jQuery.sheet() The Web Based Spreadsheet - http://code.google.com/p/jquerysheet/
 * @author RobertLeePlummerJr@gmail.com
 * $Id$
 * Copyright (c) 2012 Robert Plummer, RobertLeePlummerJr@gmail.com
 * Licensed under MIT
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @namespace
 */
var jQueryPlugins = {
	/**
	 * The jQuery.sheet plugin
	 * @memberOf jQueryPlugins
	 */
	sheet: function(settings) {
		jQuery(this).each(function() {
			var parent = jQuery(this);
			var set = jQuery.extend({
				urlGet: 			"sheets/enduser.documentation.html", //local url, if you want to get a sheet from a url
				urlSave: 			"save.html", 					//local url, for use only with the default save for sheet
				editable: 			true, 							//bool, Makes the jSheetControls_formula & jSheetControls_fx appear
				editableTabs:		true,							//bool, If sheet is editable, this allows users to change the tabs by second click
				barMenus:			true,							//bool, if sheet is editable, this will show the mini menu in barTop and barLeft for sheet manipulation
				freezableCells:		true,							//bool, if sheet is editable, this will show the barHandles and allow user to drag them to freeze cells, not yet working.
				allowToggleState: 	true,							//allows the function that changes the spreadsheet's state from static to editable and back
				urlMenu: 			"menu.html", 					//local url, for the menu to the left of title
				menu:			'',							//menu AS STRING!, overrides urlMenu
				newColumnWidth: 	120, 							//int, the width of new columns or columns that have no width assigned
				title: 				null, 							//html, general title of the sheet group
				inlineMenu:			null, 							//html, menu for editing sheet
				buildSheet: 		false,							//bool, string, or object
																		//bool true - build sheet inside of parent
																		//bool false - use urlGet from local url
																		//string  - '{number_of_cols}x{number_of_rows} (5x100)
																		//object - table
				calcOff: 			false, 							//bool, turns calculationEngine off (no spreadsheet, just grid)
				log: 				false, 							//bool, turns some debugging logs on (jS.log('msg'))
				lockFormulas: 		false, 							//bool, turns the ability to edit any formula off
				parent: 			parent, 					//object, sheet's parent, DON'T CHANGE
				colMargin: 			18, 							//int, the height and the width of all bar items, and new rows
				fnSave: 			function() { parent.getSheet().saveSheet(); }, //fn, default save function, more of a proof of concept
				fnOpen: 			function() { 					//fn, by default allows you to paste table html into a javascript prompt for you to see what it looks likes if you where to use sheet
										var t = prompt('Paste your table html here');
										if (t) {
											parent.getSheet().openSheet(t);
										}
				},
				fnClose: 			function() {}, 					//fn, default clase function, more of a proof of concept
				
				boxModelCorrection: 2, 								//int, attempts to correct the differences found in heights and widths of different browsers, if you mess with this, get ready for the must upsetting and delacate js ever
				formulaFunctions:		{},							//object, used to extend the standard functions that come with sheet
				formulaVariables:       {},
				cellSelectModel: 	'excel',						//string, 'excel' || 'oo' || 'gdocs' Excel sets the first cell onmousedown active, openoffice sets the last, now you can choose how you want it to be ;)
				autoAddCells:		true,							//bool, when user presses enter on the last row/col, this will allow them to add more cells, thus improving performance and optimizing modification speed
				resizable: 			true,							//bool, makes the $(obj).sheet(); object resizeable, also adds a resizable formula textarea at top of sheet
				autoFiller: 		false,							//bool, the little guy that hangs out to the bottom right of a selected cell, users can click and drag the value to other cells
				minSize: 			{rows: 15, cols: 5},			//object - {rows: int, cols: int}, Makes the sheet stay at a certain size when loaded in edit mode, to make modification more productive
				forceColWidthsOnStartup:true,						//bool, makes cell widths load from pre-made colgroup/col objects, use this if you plan on making the col items, makes widths more stable on startup
				alertFormulaErrors:	false,
				error:              function(e) { return e.error; },
				encode:             function(val) {
					switch( typeof val ) {
						case 'object':
						case 'number': return val;
					}
					return val
						.replace(/&/gi, '&amp;')
						.replace(/>/gi, '&gt;')
						.replace(/</gi, '&lt;')
						.replace(/\n/g, '\n<br>');
				},
				allowCellsLineBreaks: true,
				frozenAt: {
					row: 0,
					col: 0
				}
			}, settings);
			
			var jS = parent.getSheet();
			if (jS) {
				parent.html(jS.obj.sheetAll()); //degrade to just sheets in parent
				jS.obj.tabContainer().remove();
				delete jS;
			}
			
			if (jQuery.sheet.instance.length) {
				parent.sheetInstance = jQuery.sheet.createInstance(jQuery, set, jQuery.sheet.instance.length, parent);
				jQuery.sheet.instance.push(parent.sheetInstance);
			} else {
				parent.sheetInstance = jQuery.sheet.createInstance(jQuery, set, 0, parent);
				jQuery.sheet.instance = [parent.sheetInstance];
			}
			parent.attr('sheetInstance', jQuery.sheet.instance.length - 1);
		});
		return this;
	},

	/**
	 * @memberOf jQueryPlugins
	 * @returns {*}
	 */
	disableSelectionSpecial : function() { 
			this.each(function() { 
					this.onselectstart = function() { return false; }; 
					this.unselectable = "on"; 
					jQuery(this).css('-moz-user-select', 'none'); 
			});
			return this;
	},

	/**
	 * @memberOf jQueryPlugins
	 * @returns {*}
	 */
	getSheet: function() {
		var I = parseInt(jQuery(this).attr('sheetInstance'));
		if (!isNaN(I)) {
			return jQuery.sheet.instance[I];
		}
		return false;
	},

	/**
	 * Get cell value
	 * @memberOf jQueryPlugins
	 * @param row
	 * @param col
	 * @param sheet
	 * @returns {*}
	 */
	getCellValue: function(row, col, sheet) {
		var jS = $(this).getSheet();
		sheet = (sheet ? sheet : 0);
		try {
			return jS.updateCellValue(sheet, row, col);
		} catch(e) {
			return "";
		}
	},

	/**
	 * Set cell value
	 * @memberOf jQueryPlugins
	 * @param value
	 * @param row
	 * @param col
	 * @param sheet
	 */
	setCellValue: function(value, row, col, sheet) {
		var jS = $(this).getSheet();
		sheet = (sheet ? sheet : 0);
		try {
			jS.spreadsheets[sheet][row][col].value = value;
		} catch(e) {}
	},

	/**
	 * Set cell formula
	 * @memberOf jQueryPlugins
	 * @param formula
	 * @param row
	 * @param col
	 * @param sheet
	 */
	setCellFormula: function(formula, row, col, sheet) {
		var jS = $(this).getSheet();
		sheet = (sheet ? sheet : 0);
		try {
			jS.spreadsheets[sheet][row][col].formula = formula;
		} catch(e) {}
	},

	/**
	 * Set cell html
	 * @memberOf jQueryPlugins
	 * @param html
	 * @param row
	 * @param col
	 * @param sheet
	 */
	setCellHtml: function(html, row, col, sheet) {
		var jS = $(this).getSheet();
		sheet = (sheet ? sheet : 0);
		try {
			jS.spreadsheets[sheet][row][col].html = html;
		} catch(e) {}
	}
};

jQuery.fn.extend(jQueryPlugins);

/**
 * @namespace
 * @type {Object}
 */
jQuery.sheet = {
	/**
	 * Array of instances of jQuery.sheet, generally short-handed to jS
	 * @namespace
	 * @memberOf jQuery.sheet
	 */
	instance: [],

	/**
	 * The instance creator of jQuery.sheet
	 * @methodOf jQuery.sheet
	 * @param $ {Object} jQuery
	 * @param s {Object} settings from jQuery.fn.sheet
	 * @param I {Integer} the index of the instance
	 * @param origParent {jQuery|HTMLElement} the caller
	 * @returns jS {Object} jQuery sheet instance
	 */
	createInstance: function($, s, I, origParent) {

		/**
		 * A single instance of a spreadsheet, shorthand, also accessible from jQuery.sheet.instance[index]
		 * @name jS
		 * @namespace
		 * @type {Object}
		 */
		var jS = {
			/**
			 * Current version of jQuery.sheet
			 * @memberOf jS
			 * @name version
			 * @type {String}
			 */
			version: 'trunk',

			/**
			 * The active sheet index within the a set of sheets
			 * @memberOf jS
			 * @name i
			 * @type {Integer}
			 */
			i: 0,

			/**
			 * The instance index
			 * @memberOf jS
			 * @name I
			 * @type {Integer}
			 */
			I: I,

			/**
			 * The current count of sheet's within the instance
			 * @memberOf jS
			 * @name sheetCount
			 * @type {Integer}
			 */
			sheetCount: 0,

			/**
			 * The internal storage array of the spreadsheets for an instance, constructed as array 3 levels deep, spreadsheet, rows, cells, can easily be used for custom exporting/saving
			 * @memberOf jS
			 * @name spreadsheets
			 * @type {Array}
			 */
			spreadsheets: [],

			/**
			 * Object selectors for interacting with a spreadsheet, dynamically id'd from both sheet index and instance index
			 * @memberOf jS
			 * @name obj
			 * @type {Object}
			 */
			obj: {
				autoFiller:			function() { return $('#' + jS.id.autoFiller + jS.i); },
				barCorner:			function() { return $('#' + jS.id.barCorner + jS.i); },
				barCornerAll:		function() { return s.parent.find('div.' + jS.cl.barCorner); },
				barCornerParent:	function() { return $('#' + jS.id.barCornerParent + jS.i); },
				barCornerParentAll: function() { return s.parent.find('td.' + jS.cl.barCornerParent); },
				barHelper:			function() { return $('div.' + jS.cl.barHelper); },
				barLeft: 			function(i) { return $('#' + jS.id.barLeft + i + '_' + jS.i); },
				barLeftAll:			function() { return s.parent.find('td.' + jS.cl.barLeft + '_' + jS.i); },
				barLeftParent: 		function() { return $('#' + jS.id.barLeftParent + jS.i); },
				barLeftParentAll:	function() { return s.parent.find('div.' + jS.cl.barLeftParent); },
				barHandleFreezeLeft:function() { return $('#' + jS.id.barHandleFreezeLeft + jS.i); },
				barMenuLeft:		function() { return $('#' + jS.id.barMenuLeft); },
				barTop: 			function(i) { return $('#' + jS.id.barTop + i + '_' + jS.i); },
				barTopAll:			function() { return s.parent.find('td.' + jS.cl.barTop + '_' + jS.i); },
				barTopParent: 		function() { return $('#' + jS.id.barTopParent + jS.i); },
				barTopParentAll:	function() { return s.parent.find('div.' + jS.cl.barTopParent); },
				barHandleFreezeTop: function() { return $('#' + jS.id.barHandleFreezeTop + jS.i); },
				barMenuParentTop:	function() { return $('#' + jS.id.barMenuParentTop); },
				barMenuTop:			function() { return $('#' + jS.id.barMenuTop); },
				cellActive:			function() { return $(jS.cellLast.td); },
				cellMenu:			function() { return $('#' + jS.id.cellMenu); },
				cellHighlighted:	function() { return $(jS.highlightedLast.td); },
				chart:				function() { return $('div.' + jS.cl.chart); },
				formula: 			function() { return $('#' + jS.id.formula); },
				fullScreen:			function() { return $('div.' + jS.cl.fullScreen); },
				header: 			function() { return $('#' + jS.id.header); },
				inlineMenu:			function() { return $('#' + jS.id.inlineMenu); },
				inPlaceEdit:		function() { return $('#' + jS.id.inPlaceEdit); },
				label: 				function() { return $('#' + jS.id.label); },
				menu:				function() { return $('#' + jS.id.menu); },
				pane: 				function() { return $('#' + jS.id.pane + jS.i); },
				paneAll:			function() { return s.parent.find('div.' + jS.cl.pane); },
				parent: 			function() { return s.parent; },
				scrollStyleX:       function() { return $('#' + jS.id.scrollStyleX + jS.i); },
				scrollStyleY:       function() { return $('#' + jS.id.scrollStyleY + jS.i); },
				scroll:		        function() { return $('#' + jS.id.scroll + jS.i); },
				sheet: 				function() { return $('#' + jS.id.sheet + jS.i); },
				sheetPaneTd:		function() { return $('#' + jS.id.sheetPaneTd + jS.i); },
				sheetAll: 			function() { return s.parent.find('table.' + jS.cl.sheet); },
				tab:				function() { return $('#' + jS.id.tab + jS.i); },
				tabAll:				function() { return this.tabContainer().find('a.' + jS.cl.tab); },
				tabContainer:		function() { return $('#' + jS.id.tabContainer); },
				tableBody: 			function() { return document.getElementById(jS.id.sheet + jS.i); },
				tableControl:		function() { return $('#' + jS.id.tableControl + jS.i); },
				tableControlAll:	function() { return s.parent.find('table.' + jS.cl.tableControl); },
				title:				function() { return $('#' + jS.id.title); },
				ui:					function() { return $('#' + jS.id.ui); },
				uiActive:			function() { return s.parent.find('div.' + jS.cl.uiActive); }
			},

			/**
			 * Internal id's of objects, dynamically id'd from both sheet index and instance index
			 * @memberOf jS
			 * @name id
			 * @type {Object}
			 */
			id: {
				/*
					id = id's references
					Note that these are all dynamically set
				*/
				autoFiller:			'jSheetAutoFiller_' + I + '_',
				barCorner:			'jSheetBarCorner_' + I + '_',
				barCornerParent:	'jSheetBarCornerParent_' + I + '_',
				barLeft: 			'jSheetBarLeft_' + I + '_',
				barHandleFreezeLeft:'jSheetBarHandleFreezeLeft_' + I + '_',
				barMenuLeft:		'jSheetBarMenuLeft_' + I,
				barTop: 			'jSheetBarTop_' + I + '_',
				barTopParent: 		'jSheetBarTopParent_' + I + '_',
				barHandleFreezeTop:	'jSheetBarHandleFreezeTop_' + I + '_',
				barMenuTop:			'jSheetBarMenuTop_' + I,
				barMenuParentTop:	'jSheetBarMenuParentTop_' + I,
				cellMenu:			'jSheetCellMenu_' + I,
				formula: 			'jSheetFormula_' + I,
				header: 			'jSheetHeader_' + I,
				inlineMenu:			'jSheetInlineMenu_' + I,
				inPlaceEdit:		'jSheetInPlaceEdit_' + I,
				label: 				'jSheetLoc_' + I,
				menu:				'jSheetMenu_' + I,
				pane: 				'jSheetEditPane_' + I + '_',
				scrollStyleX:       'jSheetScrollStyleX_' + I + '_',
				scrollStyleY:       'jSheetScrollStyleY_' + I + '_',
				scroll:		        'jSheetScroll_' + I + '_',
				sheet: 				'jSheet_' + I + '_',
				sheetPaneTd: 		'jSheetEditSheetPaneTd_' + I + '_',
				tableControl:		'tableControl_' + I + '_',
				tab:				'jSheetTab_' + I + '_',
				tabContainer:		'jSheetTabContainer_' + I,
				title:				'jSheetTitle_' + I,
				ui:					'jSheetUI_' + I
			},

			/**
			 * Internal css classes of objects
			 * @memberOf jS
			 * @name cl
			 * @type {Object}
			 */
			cl: {
				/*
					cl = class references
				*/
				autoFiller:				'jSheetAutoFiller',
				autoFillerHandle:		'jSheetAutoFillerHandle',
				autoFillerConver:		'jSheetAutoFillerCover',
				barCorner:				'jSheetBarCorner',
				barCornerParent:		'jSheetBarCornerParent',
				barHelper:				'jSheetBarHelper',
				barLeftTd:				'jSheetBarLeftTd',
				barLeft: 				'jSheetBarLeft',
				barHandleFreezeLeft:    'jSheetBarHandleFreezeLeft',
				barLeftParent: 			'jSheetBarLeftParent',
				barTop: 				'jSheetBarTop',
				barHandleFreezeTop: 	'jSheetBarHandleFreezeTop',
				barTopParent: 			'jSheetBarTopParent',
				barTopTd:				'jSheetBarTopTd',
				bodyHandlesHide:        'bodyHandlesHide',
				cellActive:				'jSheetCellActive',
				cellHighlighted: 		'jSheetCellHighighted',
				chart:					'jSheetChart',
				error:					'jSheetError',
				formula: 				'jSheetFormula',
				formulaParent:			'jSheetFormulaParent',
				header:                 'jSheetHeader',
				inlineMenu:				'jSheetInlineMenu',
				fullScreen:				'jSheetFullScreen',
				inPlaceEdit:			'jSheetInPlaceEdit',
				menu:					'jSheetMenu',
				parent:					'jSheetParent',
				scroll:			        'jSheetScroll',
				sheet: 					'jSheet',
				sheetPaneTd:			'sheetPane',
				label: 					'jSheetLoc',
				pane: 					'jSheetEditPane',
				tab:					'jSheetTab',
				tabContainer:			'jSheetTabContainer',
				tabContainerFullScreen: 'jSheetFullScreenTabContainer',
				tableControl:			'tableControl',
				title:					'jSheetTitle',
				toggle:					'cellStyleToggle',
				ui:						'jSheetUI',
				uiAutoFiller:			'ui-state-active',
				uiActive:				'ui-state-active',
				uiBar: 					'ui-widget-header',
				uiBarHighlight: 		'ui-state-active',
				uiBarHandleFreezeLeft:  'ui-state-default',
				uiBarMenuLeft:			'ui-state-default ui-corner-top',
				uiBarHandleFreezeTop:	'ui-state-default',
				uiBarMenuTop:			'ui-state-default',
				uiCellActive:			'ui-state-active',
				uiCellHighlighted: 		'ui-state-highlight',
				uiControl: 				'ui-widget-header ui-corner-top',
				uiControlTextBox:		'ui-widget-content',
				uiError:				'ui-state-error',
				uiFullScreen:			'ui-widget-content ui-corner-all',
				uiInPlaceEdit:			'ui-state-highlight',
				uiMenu:					'ui-widget-header',
				uiMenuUl: 				'ui-widget-header',
				uiMenuLi: 				'ui-widget-header',
				uiMenuHighlighted: 		'ui-state-highlight',
				uiPane: 				'ui-widget-content',
				uiParent: 				'ui-widget-content ui-corner-all',
				uiSheet:				'ui-widget-content',
				uiTab:					'ui-widget-header',
				uiTabActive:			'ui-state-highlight'
			},

			/**
			 * Messages for user interface
			 * @memberOf jS
			 * @name msg
			 * @type {Object}
			 */
			msg: { /*msg = messages used throught sheet, for easy access to change them for other languages*/
				addRowMulti: 			"How many rows would you like to add?",
				addColumnMulti: 		"How many columns would you like to add?",
				dragToFreezeCol:        "Drag to freeze column",
				dragToFreezeRow:        "Drag to freeze row",
				newSheet: 				"What size would you like to make your spreadsheet? Example: '5x10' creates a sheet that is 5 columns by 10 rows.",
				openSheet: 				"Are you sure you want to open a different sheet?  All unsaved changes will be lost.",
				cellFind: 				"No results found.",
				toggleHideRow:			"No row selected.",
				toggleHideColumn: 		"Now column selected.",
				loopDetected:           "Loop Detected",
				menuFreezeColumnToHere: "Toggle freeze columns to here",
				menuFreezeRowToHere:    "Toggle freeze rows to here",
				menuInsertColumnAfter: 	"Insert column after",
				menuInsertColumnBefore: "Insert column before",
				menuAddColumnEnd:		"Add column to end",
				menuDeleteColumn:		"Delete this column",
				menuInsertRowAfter: 	"Insert row after",
				menuInsertRowBefore:	"Insert row before",
				menuAddRowEnd:			"Add row to end",
				menuDeleteRow:			"Delete this row",
				menuAddSheet:			"Add spreadsheet",
				menuDeleteSheet:		"Delete spreadsheet",
				notFoundColumn:         "Column not found",
				notFoundRow:            "Row not found",
				notFoundSheet:          "Sheet not found"
			},

			/**
			 * Deletes a jQuery sheet instance
			 * @methodOf jS
			 * @name kill
			 */
			kill: function() {
				jS.obj.tabContainer().remove();
				jS.obj.fullScreen().remove();
				jS.obj.inPlaceEdit().remove();
				origParent
					.removeClass(jS.cl.uiParent)
					.html('')
					.removeAttr('sheetInstance');
				jSE = s = $.sheet.instance[I] = jS = null;
				delete jSE;
				delete s;
				delete $.sheet.instance[I];
				delete jS;
			},

			/**
			 * Event trigger for jQuery sheet, wraps jQuery's trigger event to always return jS
			 * @param eventType {String} event type
			 * @param extraParameters {Array} optional
			 * @methodOf jS
			 * @name trigger
			 */
			trigger: function(eventType, extraParameters) {
				//wrapper for $ trigger of origParent, in case of further mods in the future
				extraParameters = extraParameters || [];
				origParent.trigger(eventType, [jS].concat(extraParameters));
			},

			/**
			 * Returns all spreadsheets within an instance as an array, builds it if it doesn't exist
			 * @param forceRebuild
			 * @returns {Array|spreadsheets}
			 * @methodOf jS
			 * @name spreadsheetsToArray
			 */
			spreadsheetsToArray: function(forceRebuild) {
				if (forceRebuild || jS.spreadsheets.length == 0) {
					jS.cycleCellsAll(function(sheet, row, col) {
						var td = $(this);
						jS.createCell(sheet, row, col, td.text(), td.attr('formula'));
					});
				}
				return jS.spreadsheets;
			},

			/**
			 * Returns singe spreadsheet from a set of spreadsheets within as instance, builds if it doesn't exist
			 * @param forceRebuild {Boolean} Enforces the spreadsheet to be rebuilt
			 * @param i {Integer} Spreadsheet index
			 * @methodOf jS
			 * @name spreadsheetToArray
			 */
			spreadsheetToArray: function(forceRebuild, i) {
				i = (i ? i : jS.i);
				if (forceRebuild || !jS.spreadsheets[i]) {
					jS.cycleCells(function(sheet, row, col) {
						var td = $(this);
						jS.createCell(sheet, row, col, td.text(), td.attr('formula'));
					});
				}
			},

			/**
			 * Creates a single cell within
			 * @param sheet {Integer}
			 * @param row {Integer}
			 * @param col {Integer}
			 * @param value {String}
			 * @param formula {String}
			 * @param calcCount {Integer}
			 * @param calcLast {Date}
			 * @returns {Object} cell
			 * @methodOf jS
			 * @name createCell
			 */
			createCell: function(sheet, row, col, value, formula, calcCount, calcLast) {
				if (!jS.spreadsheets[sheet]) jS.spreadsheets[sheet] = [];
				if (!jS.spreadsheets[sheet][row]) jS.spreadsheets[sheet][row] = [];
				

				jS.spreadsheets[sheet][row][col] = {
					formula: formula,
					value: value,
					calcCount: (calcCount ? calcCount : 0),
					calcLast: (calcLast ? calcLast : -1),
					html: []
				};
				
				return jS.spreadsheets[sheet][row][col];
			},

			/**
			 * Tracks which spreadsheet is active to intercept keystrokes for navigation
			 * @type {Boolean}
			 * @memberOf jS
			 * @name nav
			 */
			nav: false,

			/**
			 * Turns off all intercept keystroke navigation instances, with exception of supplied instance index
			 * @param nav {Integer} Instance index
			 * @methodOf jS
			 * @name setNav
			 */
			setNav: function(nav) {
				$($.sheet.instance).each(function() {
					this.nav = false;
				});
			
				jS.nav = nav;
			},

			/**
			 * Creates the different objects required by sheets
			 * @memberOf jS
			 * @name controlFactory
			 * @type {Object}
			 * @namespace
			 */
			controlFactory: {
				/**
				 * Creates multi rows
				 * @param qty {Integer} the number of cells you'd like to add, if not specified, a dialog will ask
				 * @param isBefore {Boolean} places cells before the selected cell if set to true, otherwise they will go after, or at end
				 * @param skipFormulaReparse {Boolean} re-parses formulas if needed
				 * @methodOf jS.controlFactory
				 * @name addRowMulti
				 */
				addRowMulti: function(qty, isBefore, skipFormulaReparse) {
					if (!qty) {
						qty = prompt(jS.msg.addRowMulti);
					}
					if (qty) {
						if (!isNaN(qty))
							jS.controlFactory.addCells(null, isBefore, parseInt(qty), 'row', skipFormulaReparse);
					}
				},

				/**
				 * Creates multi columns
				 * @param qty {Integer} the number of cells you'd like to add, if not specified, a dialog will ask
				 * @param isBefore {Boolean} places cells before the selected cell if set to true, otherwise they will go after, or at end
				 * @param skipFormulaReparse {Boolean} re-parses formulas if needed
				 * @methodOf jS.controlFactory
				 * @name addColumnMulti
				 */
				addColumnMulti: function(qty, isBefore, skipFormulaReparse) {
					if (!qty) {
						qty = prompt(jS.msg.addColumnMulti);
					}
					if (qty) {
						if (!isNaN(qty))
							jS.controlFactory.addCells(null, isBefore, parseInt(qty), 'col', skipFormulaReparse);
					}
				},

				/**
				 * Creates cells for sheet and the bars that go along with them
				 * @param eq {Integer} optional, position where cells should be added, if null, cells go to end
				 * @param isBefore {Boolean} places cells before the selected cell if set to true, otherwise they will go after, or at end;
				 * @param qty {Integer} how many rows/columsn to add
				 * @param type {String} "row" or "col", default "col"
				 * @param skipFormulaReparse {Boolean} re-parses formulas if needed
				 * @methodOf jS.controlFactory
				 * @name addCells
				 */
				addCells: function(eq, isBefore, qty, type, skipFormulaReparse) {
					//hide the autoFiller, it can get confused
					jS.autoFillerHide();
					
					jS.setDirty(true);
					jS.obj.barHelper().remove();
					
					var sheet = jS.obj.sheet(),
						sheetWidth = sheet.width();
						isLast = false;
					
					//jS.evt.cellEditAbandon();
					
					qty = qty || 1;
					type = type || 'col';
					
					//var barLast = (type == 'row' ? jS.rowLast : jS.colLast);
					var cellLastBar = (type == 'row' ? jS.cellLast.row : jS.cellLast.col);
					
					if (eq === undefined) {
						if (cellLastBar != 0) {
							eq = cellLastBar;
							isLast = true;
						}
					}

					var o;
					switch (type) {
						case "row":
							o = {
								cells: function() {
									//table / tbody / tr / td
									var cells = jS.rowCells(sheet, eq);
									return cells[0].parentNode;
								},
								col: function() { return ''; },
								size: function() {
									var cells = o.cells();
									return cells.children.length - 1;
								},
								loc: function() {
									var cells = o.cells();
									return jS.getTdLocation(cells.children[0]);
								},
								newCells: function() {
									var j = o.size();
									var newCells = '';

									for (var i = 0; i <= j; i++) {
										if (i == 0) {
											newCells += '<td class="' + jS.cl.barLeft + '_' + jS.i + '" />';
										} else {
											newCells += '<td />';
										}
									}
									
									return '<tr style="height: ' + s.colMargin + 'px;">' + newCells + '</tr>';
								},
								newCol: '',
								dimensions: function(cell, col) {},
								offset: {row: qty,col: 0},
								start: function() {
									return {row: (isBefore ? eq : eq + qty)};
								}
							};
							break;
						case "col":
							o = {
								cells: function() {
									var cellStart = jS.rowCells(sheet, 0)[eq];
									var lastRow = jS.rowCells(sheet);
									var cellEnd = lastRow[lastRow.length - 1];

									var loc1 = jS.getTdLocation(cellStart);
									var loc2 = jS.getTdLocation(cellEnd);
									
									//we get the first cell then get all the other cells directly... faster ;)
									var cells = jS.obj.barTop(loc1.col);
									for (var i = 1; i <= loc2.row; i++) {
										cells.push(jS.getTd(jS.i, i, loc1.col));
									}
									
									return cells;
								},
								col: function() {
									return jS.col(sheet, eq);
								},
								newCol: '<col />',
								loc: function(cells) {
									cells = (cells ? cells : o.cells());
									return jS.getTdLocation(cells.first());
								},
								newCells: function() {
									return '<td />';
								},
								dimensions: function(cell, col) {								
									var w = s.newColumnWidth;
									col
										.data('width', w)
										.css('width', w + 'px')
										.attr('width', w + 'px')
										.width(w);
									
									sheet.width(sheetWidth + (w * qty));
								},
								offset: {row: 0, col: qty},
								start: function() {
									return {col: (isBefore ? eq : eq + qty)};
								}
							};
							break;
					}
					
					//make undoable
					jS.cellUndoable.add(sheet);
					
					var cells = $(o.cells());
					var loc = o.loc(cells);	
					var col = o.col();
					
					var newCell = o.newCells();
					var newCol = o.newCol;
					
					var newCols = '';
					var newCells = '';
					
					for (var i = 0; i < qty; i++) { //by keeping these variables strings temporarily, we cut down on using system resources
						newCols += newCol;
						newCells += newCell;
					}
					
					newCols = $(newCols);
					newCells = $(newCells);
					
					if (isBefore) {
						cells.before(newCells);
						$(col).before(newCols);
					} else {
						cells.after(newCells);
						$(col).after(newCols);
					}


					jS.setTdIds(sheet, jS.i, o.start());
					
					o.dimensions(newCells, newCols);
					
					if (!skipFormulaReparse && isLast != true) {
						//offset formulas
						jS.offsetFormulas(loc, o.offset, isBefore);
					}
					
					//Let's make it redoable
					jS.cellUndoable.add(sheet);

					jS.obj.pane().trigger('resizeScroll');
				},

				/**
				 * creates single row
				 * @param atRow {Integer} Index of row
				 * @param isBefore {Boolean} places cells before the selected cell if set to true, otherwise they will go after, or at end
				 * @methodOf jS.controlFactory
				 * @name addRow
				 */
				addRow: function(atRow, isBefore) {
					jS.controlFactory.addCells(atRow, isBefore, 1, 'row');
					jS.trigger('addRow', [atRow, isBefore, 1]);
				},

				/**
				 * creates single column
				 * @param atColumn {Integer} Index of row
				 * @param isBefore {Boolean} places cells before the selected cell if set to true, otherwise they will go after, or at end
				 * @methodOf jS.controlFactory
				 * @name addColumn
				 */
				addColumn: function(atColumn, isBefore) {
					jS.controlFactory.addCells(atColumn, isBefore, 1, 'col');
					jS.trigger('addColumn', [atColumn, isBefore, 1]);
				},

				/**
				 * Creates all the bars to the left of the spreadsheet, if they exist, they are first removed
				 * @param sheet {jQuery|HTMLElement} Table of spreadsheet
				 * @methodOf jS.controlFactory
				 * @name barLeft
				 */
				barLeft: function(sheet) {
					jS.obj.barLeftAll().remove();

					sheet.find('tr').each(function(i) {
						if (i > 0) {//top loads first, then we load barleft, the first cell is corner
							$(this).prepend('<td  />');
						}
					});
				},

				/**
				 * Creates all the bars to the top of the spreadsheet on colgroup col elements, if they exist, they are first removed
				 * @param sheet {jQuery|HTMLElement} Table of spreadsheet
				 * @methodOf jS.controlFactory
				 * @name barTop
				 */
				barTop: function(sheet) {
					var colgroup = sheet.find('colgroup');
					var col = $('<col />')
						.attr('width', s.colMargin)
						.css('width', s.colMargin + 'px')
						.prependTo(colgroup);
					
					jS.obj.barTopAll().remove();
					var barTopParent = $('<tr class="' + jS.cl.barTopParent + '" />');
					
					var parent = sheet.find('tr:first');
					
					//corner
					barTopParent.append('<td />'); 
					
					parent.find('td').each(function(i) {
						var v = jSE.columnLabelString(i);
						
						barTopParent.append('<td />');
					});
					
					barTopParent.insertBefore(parent);
				},

				/**
				 * Creates the draggable objects for freezing cells
				 * @type {Object}
				 * @memberOf jS.controlFactory
				 * @name barHandleFreeze
				 * @namespace
				 */
				barHandleFreeze: {

					/**
					 * @param pane {jQuery|HTMLElement}
					 * @returns {Boolean}
					 * @methodOf jS.controlFactory.barHandleFreeze
					 * @name top
					 */
					top: function(pane) {
						if (jS.busy) return false;

						jS.obj.barHelper().remove();
						
						var bar = jS.obj.barTop(jS.s.frozenAt.col + 1),
							pos = bar.position(),
							handle = $('<div id="' + jS.id.barHandleFreezeTop + jS.i + '" class="' + jS.cl.uiBarHandleFreezeTop + ' ' + jS.cl.barHelper + ' ' + jS.cl.barHandleFreezeTop + '" />')
								.height(s.colMargin + s.boxModelCorrection)
								.css('top', pos.top + 'px')
								.css('left', pos.left + 'px')
								.attr('title', jS.msg.dragToFreezeCol)
								.prependTo(pane);
						
						jS.draggable(handle, {
							axis: 'x',
							start: function() {
								jS.busy = true;
							},
							stop: function(e, ui) {
								$body.addClass(jS.cl.bodyHandlesHide);
								jS.busy = false;
								jS.obj.barHelper().remove();
								console.log([e, ui]);
								var target = document.elementFromPoint(ui.offset.left, ui.offset.top + 5);
								jS.s.frozenAt.col = jS.getTdLocation(target).col - 1;
								jS.evt.scroll.start('x', pane);
								$body.removeClass(jS.cl.bodyHandlesHide);
							},
							containment: 'parent'
						});
					},

					/**
					 *
					 * @param pane {jQuery|HTMLElement}
					 * @returns {Boolean}
					 * @methodOf jS.controlFactory.barHandleFreeze
					 * @name left
					 */
					left: function(pane) {
						if (jS.busy) return false;

						jS.obj.barHelper().remove();
						
						var bar = jS.obj.barLeft(jS.s.frozenAt.row + 1),
							pos = bar.position(),
							handle = $('<div id="' + jS.id.barHandleFreezeLeft + jS.i + '" class="' + jS.cl.uiBarHandleFreezeLeft + ' ' + jS.cl.barHelper + ' ' + jS.cl.barHandleFreezeLeft + '" />')
								.width(s.colMargin)
								.css('top', pos.top + 'px')
								.css('left', pos.left + 'px')
								.attr('title', jS.msg.dragToFreezeRow)
								.prependTo(pane);
						
						jS.draggable(handle, {
							axis: 'y',
							start: function() {
								jS.busy = true;
							},
							stop: function(e, ui) {
								$body.addClass(jS.cl.bodyHandlesHide);
								jS.busy = false;
								jS.obj.barHelper().remove();
								console.log([e, ui]);
								var target = document.elementFromPoint(ui.offset.left + 5, ui.offset.top);
								console.log(jS.getTdLocation(target), target);
								jS.s.frozenAt.row = jS.getTdLocation(target).row - 1;
								jS.evt.scroll.start('y', pane);
								$body.removeClass(jS.cl.bodyHandlesHide);
							},
							containment: 'parent'
						});
					},

					/**
					 * @methodOf jS.controlFactory.barHandleFreeze
					 * @name corner
					 */
					corner: function() {}
				},

				/**
				 *
				 * Creates menus for contextual menus and top bar button
				 * @param bar
				 * @param menuItems
				 * @returns {jQuery|HTMLElement}
				 * @memberOf jS.controlFactory
				 * @name makeMenu
				 */
				makeMenu: function(bar, menuItems) {
					var menu;
					function addLink(msg, fn) {
						switch (msg) {
							case "line":
								$('<hr />').appendTo(menu);
								break;
							default:
								$('<div>' + msg + '</div>').click(function() {
									fn();
									return false;
								}).appendTo(menu);
						}
							
					}
					
					switch (bar) {
						case "top":
							menu = $('<div id="' + jS.id.barMenuTop + '" class="' + jS.cl.uiMenu + ' ' + jS.cl.menu + '" />');
							break;
						case "left":
							menu = $('<div id="' + jS.id.barMenuLeft + '" class="' + jS.cl.uiMenu + ' ' + jS.cl.menu + '" />');
							break;
						case "cell":
							menu = $('<div id="' + jS.id.cellMenu + '" class="' + jS.cl.uiMenu + ' ' + jS.cl.menu + '" />');
							break;
					}
					
					menu
						.mouseleave(function() {
							menu.hide();
						})
						.appendTo($body)
						.hide();
					
					$(menuItems).each(function() {
						addLink(this.msg, this.fn);
					});
					
					return menu;
				},

				/**
				 * Creates items within menus using jQuery.sheet.instance.msg
				 * @memberOf jS.controlFactory
				 * @namespace
				 * @name barMenu
				 */
				barMenu: {

					/**
					 * @param e {Object} jQuery event
					 * @param i {Integer} column
					 * @param target {jQuery|HTMLElement}
					 * @returns {*}
					 * @methodOf jS.controlFactory.barMenu
					 * @name top
					 */
					top: function(e, i, target) {
						if (jS.busy) return false;
						var menu = jS.obj.barMenuTop().hide();
						
						if (!menu.length) {
							menu = jS.controlFactory.makeMenu('top', [{
								msg: jS.msg.menuFreezeColumnToHere,
								fn: function() {
									var col = jS.getTdLocation(jS.obj.cellActive()).col;
									jS.s.frozenAt.col = (jS.s.frozenAt.col == col ? 0 : col);
								}
							},{
								msg: jS.msg.menuInsertColumnAfter,
								fn: function(){
									jS.controlFactory.addColumn(jS.colLast);
									return false;
								}
							}, {
								msg: jS.msg.menuInsertColumnBefore,
								fn: function(){
									jS.controlFactory.addColumn(jS.colLast, true);
									return false;
								}
							}, {
								msg: jS.msg.menuAddColumnEnd,
								fn: function(){
									jS.controlFactory.addColumn();
									return false;
								}
							}, {
								msg: jS.msg.menuDeleteColumn,
								fn: function(){
									jS.deleteColumn();
									return false;
								}
							}]);
						}
						
						if (!target) {
							menu
								.css('left', (e.pageX - 5) + 'px')
								.css('top', (e.pageY - 5) + 'px')
								.show();
							return menu;
						}
	
						var barMenuParentTop = jS.obj.barMenuParentTop().hide();
						
						if (!barMenuParentTop.length) {
						
							barMenuParentTop = $('<div id="' + jS.id.barMenuParentTop + '" class="' + jS.cl.uiBarMenuTop + ' ' + jS.cl.barHelper + '">' +
									'<span class="ui-icon ui-icon-triangle-1-s" /></span>' +
								'</div>')
								.click(function(e) {
									barMenuParentTop.parent()
										.mousedown()
										.mouseup();
									
									var offset = barMenuParentTop.offset();
									
									menu
										.css('left', (e.pageX - 5) + 'px')
										.css('top', (e.pageY - 5) + 'px')
										.show();
								})
								.blur(function() {
									if (menu) menu.hide();
								})
								.css('padding-left', target.position().left + target.width() - s.colMargin)
						}
						
						barMenuParentTop
							.prependTo(target)
							.show();
					},

					/**
					 *
					 * @param e
					 * @param i
					 * @returns {Boolean}
					 * @methodOf jS.controlFactory.barMenu
					 * @name left
					 */
					left: function(e, i) {
						if (jS.busy) return false;
						jS.obj.barMenuLeft().hide();
						
						if (i) jS.obj.barHandleLeft().remove();
						var menu;
						
						menu = jS.obj.barMenuLeft();
						
						if (!menu.length) {
							menu = jS.controlFactory.makeMenu('left', [{
									msg: jS.msg.menuFreezeRowToHere,
									fn: function() {
										var row = jS.getTdLocation(jS.obj.cellActive()).row;
										jS.s.frozenAt.row = (jS.s.frozenAt.row == row ? 0 : row);
									}
								}, {
									msg: jS.msg.menuInsertRowAfter,
									fn: function(){
										jS.controlFactory.addRow(jS.rowLast);
										return false;
									}
								}, {
									msg: jS.msg.menuInsertRowBefore,
									fn: function(){
										jS.controlFactory.addRow(jS.rowLast, true);
										return false;
									}
								}, {
									msg: jS.msg.menuAddRowEnd,
									fn: function(){
										jS.controlFactory.addRow();
										return false;
									}
								}, {
									msg: jS.msg.menuDeleteRow,
									fn: function(){
										jS.deleteRow();
										return false;
									}
								}]);
						}
						
						menu
							.css('left', (e.pageX - 5) + 'px')
							.css('top', (e.pageY - 5) + 'px')
							.show();

						return true;
					},

					/**
					 * @methodOf jS.controlFactory.barMenu
					 * @name corner
					 */
					corner: function() {}
				},

				/**
				 * Creates contextual menus for cells (a right click menu)
				 * @param e {Object} jQuery event
				 * @returns {Boolean}
				 * @methodOf jS.controlFactory
				 * @name cellMenu
				 */
				cellMenu: function(e) {
					if (jS.busy) return false;
					jS.obj.cellMenu().hide();
					
					var menu = jS.obj.cellMenu();
					
					if (!menu.length) {
						menu = jS.controlFactory.makeMenu('cell', [{
								msg: jS.msg.menuInsertColumnAfter,
								fn: function(){
									jS.controlFactory.addColumn();
									return false;
								}
							}, {
								msg: jS.msg.menuInsertColumnBefore,
								fn: function(){
									jS.controlFactory.addColumn(null, true);
									return false;
								}
							}, {
								msg: jS.msg.menuAddColumnEnd,
								fn: function(){
									jS.controlFactory.addColumn();
									return false;
								}
							}, {
								msg: jS.msg.menuDeleteColumn,
								fn: function(){
									jS.deleteColumn();
									return false;
								}
							}, {
								msg: "line"
							},{
								msg: jS.msg.menuInsertRowAfter,
								fn: function(){
									jS.controlFactory.addRow();
									return false;
								}
							}, {
								msg: jS.msg.menuInsertRowBefore,
								fn: function(){
									jS.controlFactory.addRow(null, true);
									return false;
								}
							}, {
								msg: jS.msg.menuAddRowEnd,
								fn: function(){
									jS.controlFactory.addRow();
									return false;
								}
							}, {
								msg: jS.msg.menuDeleteRow,
								fn: function(){
									jS.deleteRow();
									return false;
								}
							}, {
								msg: 'line'
							}, {
								msg: jS.msg.menuAddSheet,
								fn: function() {
									jS.addSheet('5x10');
								}
							}, {
								msg: jS.msg.menuDeleteSheet,
								fn: function() {
									jS.deleteSheet();
								}
							}]);
					}
					
					menu
						.css('left', (e.pageX - 5) + 'px')
						.css('top', (e.pageY - 5) + 'px')
						.show();
				},

				/**
				 * Creates the control/container for everything above the spreadsheet, removes them if they already exist
				 * @methodOf jS.controlFactory
				 * @name header
				 */
				header: function() {
					jS.obj.header().remove();
					jS.obj.tabContainer().remove();
					
					var header = $('<div id="' + jS.id.header + '" class="' + jS.cl.header + '"></div>'),
						firstRow = $('<table><tr /></table>').prependTo(header),
						firstRowTr = $('<tr />');
					
					if (s.title) {
						var title;
						if ($.isFunction(s.title)) {
							title = jS.title(jS);
						} else {
							title = s.title;
						}
						firstRowTr.append($('<td id="' + jS.id.title + '" class="' + jS.cl.title + '" />').html(title));
					}
					
					if (s.inlineMenu && jS.isSheetEditable()) {
						var inlineMenu;
						if ($.isFunction(s.inlineMenu)) {
							inlineMenu = s.inlineMenu(jS);
						} else {
							inlineMenu = s.inlineMenu;
						}
						firstRowTr.append($('<td id="' + jS.id.inlineMenu + '" class="' + jS.cl.inlineMenu + '" />').html(inlineMenu));
					}
					
					if (jS.isSheetEditable()) {
						//Sheet Menu Control
						function makeMenu(ulMenu) {
							var menu = $('<td id="' + jS.id.menu + '" class="' + jS.cl.menu + '" />')
								.html(
									ulMenu
										.replace(/sheetInstance/g, "jQuery.sheet.instance[" + I + "]")
										.replace(/menuInstance/g, I));
										
								menu
									.prependTo(firstRowTr)
									.find("ul").hide()
									.addClass(jS.cl.uiMenuUl)
									.first().show();
								
								menu
									.find("li")
										.addClass(jS.cl.uiMenuLi)
										.hover(function(){
											$(this).find('ul:first')
												.hide()
												.show();
										},function(){
											$(this).find('ul:first')
												.hide();
										});
							return menu;
						}
						
						if (s.menu) {
							makeMenu(s.menu);
						} else {
							$('<div />').load(s.urlMenu, function() {
								makeMenu($(this).html());
								jS.sheetSyncSize();
							});
						}
						
						//Edit box menu
						var secondRow = $('<table cellpadding="0" cellspacing="0" border="0">' +
								'<tr>' +
									'<td id="' + jS.id.label + '" class="' + jS.cl.label + '"></td>' +
									'<td class="' + jS.cl.formulaParent + '">' +
										'<textarea id="' + jS.id.formula + '" class="' + jS.cl.formula + '"></textarea>' +
									'</td>' +
								'</tr>' +
							'</table>')
							.appendTo(header)
							.find('textarea')
								.keydown(jS.evt.keyDownHandler.formulaKeydown)
								.keyup(function() {
									jS.obj.inPlaceEdit().val(jS.obj.formula().val());
								})
								.change(function() {
									jS.obj.inPlaceEdit().val(jS.obj.formula().val());
								})
								.bind('paste', jS.evt.pasteOverCells)
								.focus(function() {
									jS.setNav(false);
								})
								.focusout(function() {
									jS.setNav(true);
								})
								.blur(function() {
									jS.setNav(true);
								});

						// resizable formula area - a bit hard to grab the handle but is there!
						var formulaResizeParent = $('<span />');
						jS.resizable(jS.obj.formula().wrap(formulaResizeParent).parent(), {
							minHeight: jS.obj.formula().height(),
							maxHeight: 78,
							handles: 's',
							resize: function(e, ui) {
								jS.obj.formula().height(ui.size.height);
								jS.sheetSyncSize();
							}
						});
						
						$($.sheet.instance).each(function() {
							this.nav = false;
						});
						
						jS.setNav(true);
						
						$document
							.unbind('keydown')
							.keydown(jS.evt.keyDownHandler.documentKeydown);
					}
					
					firstRowTr.appendTo(firstRow);
					
					var tabParent = $('<div id="' + jS.id.tabContainer + '" class="' + jS.cl.tabContainer + '" />')
						.mousedown(function(e) {
							jS.trigger('switchSpreadsheet', [$(e.target).attr('i') * 1]);
							return false;
						})
						.dblclick(function(e) {
							jS.trigger('renameSpreadsheet', [$(e.target).attr('i') * 1]);
							return 
						});
					
					
					if (jS.isSheetEditable()) {
						var addSheet = $('<span class="' + jS.cl.uiTab + ' ui-corner-bottom" title="Add a spreadsheet" i="-1">+</span>').appendTo(tabParent);
						
						if ($.fn.sortable) {
							var startPosition;
							
							tabParent.sortable({
								placeholder: 'ui-state-highlight',
								axis: 'x',
								forceHelperSize: true,
								forcePlaceholderSize: true,
								opacity: 0.6,
								cancel: 'span[i="-1"]',
								start: function(e, ui) {
									startPosition = ui.item.index();
									jS.trigger('tabSortstart', [e, ui]);
								},
								update: function(e, ui) {
									jS.trigger('tabSortupdate', [e, ui, startPosition]);
								}
							});
						}
					} else {
						$('<span />').appendTo(tabParent);
					}

					s.parent
						.html('')
						.append(header) //add controls header
						.append('<div id="' + jS.id.ui + '" class="' + jS.cl.ui + '">') //add spreadsheet control
						.after(tabParent);

					return header;
				},

				/**
				 * Creates the scrolling system used by each spreadsheet
				 * @param table
				 * @param pane
				 * @param sheet
				 * @methodOf jS.controlFactory
				 * @name scroll
				 */
				scroll: function(table, pane, sheet) { /* makes the bars scroll as the sheet is scrolled
												table: object, the sheet pane's table;
												pane: object, the sheet's pane;
												sheet: object, the current active sheet;
											*/

					var parent = pane.parent(),
						scroll = $('<div id="' + jS.id.scroll + jS.i + '" class="' + jS.cl.scroll + '">' +
								'<div></div>' +
							'</div>')
							.scroll(function() {
								jS.evt.scroll.scrollTo({axis: 'x', pixel: this.scrollLeft}, 0);
								jS.evt.scroll.scrollTo({axis: 'y', pixel: this.scrollTop}, 0);

								jS.autoFillerGoToTd();
							})
							.appendTo(parent)
							.disableSelectionSpecial(),

						scrollChild = scroll.children(),
						scrollStyleX = $('<style type="text/css" id="' + jS.id.scrollStyleX + jS.i + '"></style>')
							.bind('updateStyle', function(e, ids, styleOverride) {
								ids = ids || [];

								var style = [];

								if (this.styleSheet) { //IE compatibility
									for (id in ids) {
										var nthColSelector = 'col:first-child', nthTdSelector = 'tr td:first-child', i = 1;
										while (i < ids[id]) {
											nthColSelector += '+col';
											nthTdSelector += '+td';
											i++;
										}
										style.push('#' + jS.id.sheet + jS.i + ' ' + nthColSelector);
										style.push('#' + jS.id.sheet + jS.i + ' ' + nthTdSelector);
									}
									if (style.length || styleOverride) {
										this.styleSheet.cssText = styleOverride || style.join(',') + '{display: none;}';
									} else {
										this.styleSheet.cssText = '';
									}
								} else {
									for (id in ids) {
										style.push('#' + jS.id.sheet + jS.i + ' col:nth-child(' + ids[id] + ')');
										style.push('#' + jS.id.sheet + jS.i + ' tr td:nth-child(' + ids[id] + ')');
									}
									if (style.length || styleOverride) {
										scrollStyleX.text(styleOverride || style.join(',') + '{display: none;}');
									} else {
										scrollStyleX.text('');
									}
								}
							}),
						scrollStyleY = $('<style type="text/css" id="' + jS.id.scrollStyleY + jS.i + '"></style>')
							.bind('updateStyle', function(e, ids, styleOverride) {
								ids = ids || [];

								var style = [];

								if (this.styleSheet) { //IE compatibility
									for (id in ids) {
										var nthSelector = 'tr:first-child+tr', i = 2;
										while (i < ids[id]) {
											nthSelector += '+tr';
											i++;
										}
										style.push('#' + jS.id.sheet + jS.i + ' ' + nthSelector);
									}
									if (style.length || styleOverride) {
										this.styleSheet.cssText = styleOverride || style.join(',') + '{display: none;}';
									} else {
										this.styleSheet.cssText = '';
									}
								} else {
									for (id in ids) {
										style.push('#' + jS.id.sheet + jS.i + ' tr:nth-child(' + ids[id] + ')');
									}

									if (style.length || styleOverride) {
										scrollStyleY.text(styleOverride || style.join(',') + '{display: none;}');
									} else {
										scrollStyleY.text('');
									}
								}
							});

					pane
						.append(scrollStyleX)
						.append(scrollStyleY)
						.mousewheel(function(e,o) {
							var E = e.originalEvent, e, c;

							var div = function(a, b) {
								return 0 != a % b ? a : a / b;
							};


							if ("mousewheel" == E.type) {
								var scrollNoXY = 1,
								setPixels = div(-E.wheelDelta, scrollNoXY), x,y;

								if (E.wheelDeltaX !== undefined) {
									scroll
										.scrollTop(scroll.scrollTop() + div(-E.wheelDeltaY, scrollNoXY))
										.scrollLeft(scroll.scrollLeft() + div(-E.wheelDeltaX, scrollNoXY))
										.scroll();
								} else {
									scroll
										.scrollTop(scroll.scrollTop() + setPixels)
										.scroll();
								}

							} else {
								e = E.detail, 100 < e ? e = 3 : -100 > e && (e = -3);

								var top = 0, left = 0;
								switch(e) {
									case 1:
									case -1:
										left = e * 100;
										break;
									case 3:
									case -3:
										top = e * 33;
										break;
								}

								scroll
									.scrollTop(scroll.scrollTop() + top)
									.scrollLeft(scroll.scrollLeft() + left)
									.scroll();
							}

							return false;
						});

					var xStyle, yStyle;

					function styleString(o) {
						if (o && o[0] && o[0].styleSheet) return o[0].styleSheet.cssText;
						return o.text();
					}

					pane.bind('resizeScroll', function() {
						xStyle = styleString(scrollStyleX);
						yStyle = styleString(scrollStyleY);

						scrollStyleX.trigger('updateStyle');
						scrollStyleY.trigger('updateStyle');

						scrollChild
							.height(sheet.height())
							.width(sheet.width());

						scroll
							.height(table.height())
							.width(table.width());

						jS.evt.scroll.start('x', pane, sheet);
						jS.evt.scroll.start('y', pane, sheet);

						scrollStyleX.trigger('updateStyle', [null, xStyle]);
						scrollStyleY.trigger('updateStyle', [null, yStyle]);
					});
				},

				/**
				 * Creates the spreadsheet user interface
				 * @param sheet {jQuery|HTMLElement} raw table
				 * @param i {Integer} the new count for spreadsheets in this instance
				 * @param fn {Function} called after the spreadsheet is created and tuned for use
				 * @returns {jQuery|HTMLElement} table
				 * @methodOf jS.controlFactory
				 * @name sheetUI
				 */
				sheetUI: function(sheet, i, fn) {
					if (!i) {
						jS.sheetCount = 0;
						jS.i = 0;
					} else {
						jS.sheetCount = parseInt(i);
						jS.i = jS.sheetCount;
						i = jS.i;
					}
					
					table = jS.tuneTableForSheetUse(sheet);
					
					jS.readOnly[i] = table.hasClass('readonly');

					var table = jS.controlFactory.table().appendTo(jS.obj.ui());
					var pane = jS.obj.pane().html(sheet);

					jS.controlFactory.scroll(table, pane, sheet);

					if (jS.isSheetEditable()) {
						var autoFiller = jS.controlFactory.autoFiller();
						if (autoFiller) {
							pane.append(autoFiller);
						}
					}
								
					jS.sheetDecorate(sheet);
					
					jS.controlFactory.barTop(sheet);
					jS.controlFactory.barLeft(sheet);

					jS.sheetTab(true);
					
					if (jS.isSheetEditable()) {
						var formula = jS.obj.formula();

						pane
							.mousedown(function(e) {
								if (jS.busy) return false;

								if (jS.isTd(e.target)) {
									jS.evt.cellOnMouseDown(e);
									return false;
								}
								
								if (jS.isBar(e.target)){ //possibly a bar
									jS.evt.barInteraction.select(e.target);
									return false;
								}
							})
							.mouseover(function(e) {
								//This manages bar resize, bar menu, and bar selection
								if (jS.busy) return false;

								if (!jS.isBar(e.target)) return;
								var bar = $(e.target);
								var entity = bar.data('entity');
								var i = jS.getBarIndex[entity](e.target);
								if (i == 0) return false;
								
								if (jS.evt.barInteraction.selecting) {
									jS.evt.barInteraction.last = i;
									
									jS.cellSetActiveBar(entity, jS.evt.barInteraction.first, jS.evt.barInteraction.last);
								} else {
									jS.resizeBar[entity](bar, i, pane, sheet);
									
									if (jS.isSheetEditable()) {
										jS.controlFactory.barHandleFreeze[entity](pane);
										
										if (entity == "top") {
											jS.controlFactory.barMenu[entity](e, i, bar);
										}
									}
								}
							})
							.bind('contextmenu', function(e) {
								if (jS.busy) return false;

								if (jS.isBar(e.target)) {
									var o = $(e.target);
									var entity = o.data('entity');
									var i = jS.getBarIndex[entity](e.target);
									if (i == 0) return false;
									
									if (jS.evt.barInteraction.first == jS.evt.barInteraction.last) {
										jS.controlFactory.barMenu[entity](e, i);
									}
								} else {
									jS.controlFactory.cellMenu(e);
								}
								return false;
							})
							.disableSelectionSpecial()
							.dblclick(jS.evt.cellOnDblClick);
					}
					
					jS.themeRoller.start(sheet);

					// resizable container div
					jS.resizable(s.parent, {
						minWidth: s.width * 0.1,
						minHeight: s.height * 0.1,

						start: function() {
							table.hide();
						},
						stop: function() {
							table.show();
							s.width = s.parent.width();
							s.height = s.parent.height();
							pane.trigger('resizeScroll');
						}
					});

					jS.setTdIds(sheet, jS.i);
					
					jS.sheetSize(sheet);
					
					jS.checkMinSize(sheet);
					
					jS.controlFactory.addTab();

					if (fn) {
						fn(table, pane);
					}
					
					//jS.log('Sheet Initialized');
					
					return table;
				},

				/**
				 * Creates the a table which nests: table / pane / sheet.  Needs refactored to simple div
				 * @returns {*|jQuery|HTMLElement}
				 * @methodOf jS.controlFactory
				 * @name table
				 */
				table: function() { /* creates the table control the will contain all the other controls for this instance */
					return $('<table cellpadding="0" cellspacing="0" border="0" id="' + jS.id.tableControl + jS.i + '" class="' + jS.cl.tableControl + '">' +
						'<tbody>' +
							'<tr>' +
								'<td id="' + jS.id.sheetPaneTd + jS.i + '" class="' + jS.cl.sheetPaneTd + '">' + //pane
									'<div id="' + jS.id.pane + jS.i + '" class="' + jS.cl.pane + '"></div>' +
								'</td>' +
							'</tr>' +
						'</tbody>' +
					'</table>');
				},

				/**
				 * Adds a tab for navigation to a spreadsheet
				 * @returns {Node|jQuery}
				 * @methodOf jS.controlFactory
				 * @name addTab
				 */
				addTab: function() {
					return $('<span class="' + jS.cl.uiTab + ' ui-corner-bottom">' +
						'<a class="' + jS.cl.tab + '" id="' + jS.id.tab + jS.i + '" i="' + jS.i + '">' + jS.sheetTab(true) + '</a>' +
					'</span>')
						.insertBefore(
							jS.obj.tabContainer().find('span:last')
						);
				},

				/**
				 * Creates a teaxtarea for a user to put a value in that floats on top of the current selected cell
				 * @param td {jQuery|HTMLElement} the td to be edited
				 * @methodOf jS.controlFactory
				 * @name inPlaceEdit
				 */
				inPlaceEdit: function(td) {
					td = td || jS.obj.cellActive();
					
					jS.obj.inPlaceEdit().remove();
					var formula = jS.obj.formula();					
					var offset = td.offset();
					var style = td.attr('style');
					var w = td.width();
					var h = td.height();
					var textarea = $('<textarea id="' + jS.id.inPlaceEdit + '" class="' + jS.cl.inPlaceEdit + ' ' + jS.cl.uiInPlaceEdit + '" />')
						.css('left', offset.left)
						.css('top', offset.top)
						.width(w)
						.height(h)
						.keydown(jS.evt.inPlaceEditOnKeyDown)
						.keyup(function() {
							formula.val(textarea.val());
						})
						.change(function() {
							formula.val(textarea.val());
						})
						.focus(function() {
							jS.setNav(false);
						})
						.focusout(function() {
							jS.setNav(true);
						})
						.blur(function() {
							jS.setNav(true);
						})
						.bind('paste', jS.evt.pasteOverCells)
						.appendTo($body)
						.val(formula.val())
						.focus()
						.select();
					
					//Make the textarrea resizable automatically
					if ($.fn.elastic) {
						textarea.elastic();
					}
				},

				/**
				 * Created the autofiller object
				 * @returns {*|jQuery|null}
				 * @methodOf jS.controlFactory
				 * @name autoFiller
				 */
				autoFiller: function() {
					if (!s.autoFiller) return null;

					return $('<div id="' + (jS.id.autoFiller + jS.i) + '" class="' + jS.cl.autoFiller + ' ' + jS.cl.uiAutoFiller + '">' +
								'<div class="' + jS.cl.autoFillerHandle + '" />' +
								'<div class="' + jS.cl.autoFillerCover + '" />' +
						'</div>')
							.mousedown(function(e) {
								var td = jS.obj.cellActive();
								if (td) {
									var loc = jS.getTdLocation(td);
									jS.cellSetActive(td, loc, true, jS.autoFillerNotGroup, function() {										
										var hlighted = jS.obj.cellHighlighted();
										var hLoc = jS.getTdLocation(hlighted.first());
										jS.fillUpOrDown(hLoc.row < loc.row || hLoc.col < loc.col);
										jS.autoFillerGoToTd(hlighted.last());
										jS.autoFillerNotGroup = false;
									});
								}
							});
				}
			},

			/**
			 * Allows grouping of cells
			 * @memberOf jS
			 * @name autoFillerNotGroup
			 */
			autoFillerNotGroup: true,


			/**
			 * Sends tab delimited string into cells, usually a paste from external spreadsheet application
			 * @param oldVal what formula should be when this is done working with all the values
			 * @returns {Boolean}
			 * @methodOf jS
			 * @name updateCellsAfterPasteToFormula
			 */
			updateCellsAfterPasteToFormula: function(oldVal) {
				var newValCount = 0;
				var formula = jS.obj.formula();
				
				oldVal = (oldVal ? oldVal : formula.val());
				
				var loc = {row: jS.cellLast.row,col: jS.cellLast.col};								
				var val = formula.val(); //once ctrl+v is hit formula now has the data we need
				var firstValue = val;
		
				if (loc.row == 0 && loc.col == 0) return false; //at this point we need to check if there is even a cell selected, if not, we can't save the information, so clear formula editor
		
				var tdsBefore = $('<div />');
				var tdsAfter = $('<div />');
		
				var row = val.split(/\n/g); //break at rows
		
				for (var i = 0; i < row.length; i++) {
					var col = row[i].split(/\t/g); //break at columns
					for (var j = 0; j < col.length; j++) {
						newValCount++;
						var td = $(jS.getTd(jS.i, i + loc.row, j + loc.col));

						if (td.length) {
							var cell = jS.spreadsheets[jS.i][i + loc.row][j + loc.col];
							tdsBefore.append(td.clone());
				
							if ((col[j] + '').charAt(0) == '=') { //we need to know if it's a formula here
								cell.formula = col[j];
								td.attr('formula', col[j]);
							} else {
								cell.formula = null;
								cell.value = col[j];
					
								td
									.html(col[j])
									.removeAttr('formula');
							}
				
							tdsAfter.append(td.clone());
				
							if (i == 0 && j == 0) { //we have to finish the current edit
								firstValue = col[j];
							}
						}
					}
				}
				
				if (val != firstValue) {
					formula.val(firstValue);
				}
				
				jS.cellUndoable.add(tdsBefore.children());
				jS.fillUpOrDown(false, false, firstValue);
				jS.cellUndoable.add(tdsAfter.children());
		
				jS.setDirty(true);
				jS.evt.cellEditDone(true);
			},

			/**
			 * Event handlers for instance
			 * @memberOf jS
			 * @name evt
			 * @namespace
			 */
			evt: {

				/**
				 * Key down handlers
				 * @memberOf jS.evt
				 * @name keyDownHandler
				 * @namespace
				 */
				keyDownHandler: {

					/**
					 *
					 * @param e {Object} jQuery event
					 * @returns {*}
					 * @methodOf jS.evt.keyDownHandler
					 * @name enterOnInPlaceEdit
					 */
					enterOnInPlaceEdit: function(e) {
						if (!e.shiftKey) {
							return jS.evt.cellSetFocusFromKeyCode(e);
						} else {
							return true;
						}
					},

					/**
					 *
					 * @param e {Object} jQuery event
					 * @returns {*}
					 * @methodOf jS.evt.keyDownHandler
					 * @name enter
					 */
					enter: function(e) {
						if (!jS.cellLast.isEdit && !e.ctrlKey) {
							jS.obj.cellActive().dblclick();
							return false;
						} else {
							return this.enterOnInPlaceEdit(e);
						}
					},

					/**
					 *
					 * @param e {Object} jQuery event
					 * @returns {*}
					 * @methodOf jS.evt.keyDownHandler
					 * @name tab
					 */
					tab: function(e) {
						return jS.evt.cellSetFocusFromKeyCode(e);
					},

					/**
					 *
					 * @param e {Object} jQuery event
					 * @returns {*}
					 * @methodOf jS.evt.keyDownHandler
					 * @name findCell
					 */
					findCell: function(e) {
						if (e.ctrlKey) { 
							jS.cellFind();
							return false;
						}
						return true;
					},

					/**
					 *
					 * @param e {Object} jQuery event
					 * @returns {*}
					 * @methodOf jS.evt.keyDownHandler
					 * @name redo
					 */
					redo: function(e) {
						if (e.ctrlKey && !jS.cellLast.isEdit) { 
							jS.cellUndoable.undoOrRedo();
							return false;
						}
						return true;
					},

					/**
					 *
					 * @param e {Object} jQuery event
					 * @returns {*}
					 * @methodOf jS.evt.keyDownHandler
					 * @name undo
					 */
					undo: function(e) {
						if (e.ctrlKey && !jS.cellLast.isEdit) {
							jS.cellUndoable.undoOrRedo(true);
							return false;
						}
						return true;
					},

					/**
					 * Manages the page up and down buttons
					 * @param reverse {Boolean} Go up or down
					 * @returns {Boolean}
					 * @methodOf jS.evt.keyDownHandler
					 * @name pageUpDown
					 */
					pageUpDown: function(reverse) {
						var size = jS.sheetSize(),
						pane = jS.obj.pane(),
						paneHeight = pane.height(),
						prevRowsHeights = 0,
						thisRowHeight = 0,
						td;
						
						if (reverse) { //go up
							for(var i = jS.cellLast.row; i > 0 && prevRowsHeights < paneHeight; i--) {
								td = $(jS.getTd(jS.i, i, 1));
								if (!td.data('hidden') && td.is(':hidden')) td.show();
								prevRowsHeights += td.parent().height();
							}
						} else { //go down
							for(var i = jS.cellLast.row; i < size.height && prevRowsHeights < paneHeight; i++) {
								td = $(jS.getTd(jS.i, i, 1));
								prevRowsHeights += td.parent().height();
							}
						}
						jS.cellEdit(td);
						
						return false;
					},

					/**
					 *
					 * @param e {Object} jQuery event
					 * @returns {*}
					 * @methodOf jS.evt.keyDownHandler
					 * @name formulaKeydown
					 */
					formulaKeydown: function(e) {
						if (jS.readOnly[jS.i]) return false;
						if (jS.cellLast.row < 0 || jS.cellLast.col < 0) return false;
						
						switch (e.keyCode) {
							case key.ESCAPE: 	jS.evt.cellEditAbandon();
								break;
							case key.ENTER:		jS.evt.cellSetFocusFromKeyCode(e); return false;
								break;							
							default: 			jS.cellLast.isEdit = true;
						}
					},

					/**
					 * Helper for events
					 * @param ifTrue {Boolean}
					 * @param e {Object} jQuery event
					 * @returns {*}
					 * @methodOf jS.evt.keyDownHandler
					 * @name formulaKeydownIf
					 */
					formulaKeydownIf: function(ifTrue, e) {
						if (ifTrue) {
							jS.obj.cellActive().dblclick();
							return true;
						}
						return false;
					},

					/**
					 *
					 * @param e {Object} jQuery event
					 * @returns {*}
					 * @methodOf jS.evt.keyDownHandler
					 * @name documentKeydown
					 */
					documentKeydown: function(e) {
						if (jS.readOnly[jS.i]) return false;
						if (jS.cellLast.row < 0 || jS.cellLast.col < 0) return false;
						
						if (jS.nav) {
							switch (e.keyCode) {
								case key.TAB: 		jS.evt.keyDownHandler.tab(e);
									break;
								case key.ENTER:
								case key.LEFT:
								case key.UP:
								case key.RIGHT:
								case key.DOWN:		(e.shiftKey ? jS.evt.cellSetHighlightFromKeyCode(e) : jS.evt.cellSetFocusFromKeyCode(e));
									break;
								case key.PAGE_UP:	jS.evt.keyDownHandler.pageUpDown(true);
									break;
								case key.PAGE_DOWN:	jS.evt.keyDownHandler.pageUpDown();
									break;
								case key.HOME:
								case key.END:		jS.evt.cellSetFocusFromKeyCode(e);
									break;
								case key.V:		return jS.evt.keyDownHandler.formulaKeydownIf(!jS.evt.pasteOverCells(e), e);
									break;
								case key.Y:		return jS.evt.keyDownHandler.formulaKeydownIf(!jS.evt.keyDownHandler.redo(e), e);
									break;
								case key.Z:		return jS.evt.keyDownHandler.formulaKeydownIf(!jS.evt.keyDownHandler.undo(e), e);
									break;
								case key.ESCAPE: 	jS.evt.cellEditAbandon();
									break;
								case key.F:		return jS.evt.keyDownHandler.formulaKeydownIf(jS.evt.keyDownHandler.findCell(e), e);
									break;
								case key.CONTROL: //we need to filter these to keep cell state
								case key.CAPS_LOCK:
								case key.SHIFT:
								case key.ALT:
												jS.obj.formula().focus().select(); return true;
									break;
								default:		jS.obj.cellActive().dblclick(); return true;
							}
							return false;
						}
					}
				},

				/**
				 * Used for pasting from other spreadsheets
				 * @param e {Object} jQuery event
				 * @returns {Boolean}
				 * @methodOf jS.evt
				 * @name pasteOverCells
				 */
				pasteOverCells: function(e) {
					if (e.ctrlKey || e.type == "paste") {
						var fnAfter = function() {
							jS.updateCellsAfterPasteToFormula();
						};
						
						var doc = $document
							.one('keyup', function() {
								fnAfter();
								fnAfter = function() {};
								doc.mouseup();
							})
							.one('mouseup', function() {
								fnAfter();
								fnAfter = function() {};
								doc.keyup();
							});
						
						jS.setDirty(true);
						return true;
					}
				},

				/**
				 * Edits the textarea that appears over cells for in place edit
				 * @param e {Object} jQuery event
				 * @returns {*}
				 * @methodOf jS.evt
				 * @name inPlaceEditOnKeyDown
				 */
				inPlaceEditOnKeyDown: function(e) {
					switch (e.keyCode) {
						case key.ENTER: 	return jS.evt.keyDownHandler.enterOnInPlaceEdit(e);
							break;
						case key.TAB: 		return jS.evt.keyDownHandler.tab(e);
							break;
						case key.ESCAPE:	jS.evt.cellEditAbandon(); return false;
							break;
					}
				},

				/**
				 * On formula change
				 * @param e {Object} jQuery event
				 * @methodOf jS.evt
				 * @name formulaChange
				 */
				formulaChange: function(e) {
					jS.obj.inPlaceEdit().val(jS.obj.formula().val());
				},

				/**
				 * On in place edit change
				 * @param e {Object} jQuery event
				 * @methodOf jS.evt
				 * @name inPlaceEditChange
				 */
				inPlaceEditChange: function(e) {
					jS.obj.formula().val(jS.obj.inPlaceEdit().val());
				},

				/**
				 * Updates a cell after edit afterward event "afterCellEdit" is called w/ params (td, row, col, spreadsheetIndex, sheetIndex)
				 * @param forceCalc {Boolean} if set to true forces a calculation of the selected sheet
				 * @methodOf jS.evt
				 * @name cellEditDone
				 */
				cellEditDone: function(forceCalc) {
					switch (jS.cellLast.isEdit || forceCalc) {
						case true:
							jS.obj.inPlaceEdit().remove();
							var formula = jS.obj.formula();
							//formula.unbind('keydown'); //remove any lingering events from inPlaceEdit
							var td = jS.obj.cellActive();
							switch(jS.isFormulaEditable(td)) {
								case true:
									//Lets ensure that the cell being edited is actually active
									if (td && jS.cellLast.row > 0 && jS.cellLast.col > 0) {
										//first, let's make it undoable before we edit it
										jS.cellUndoable.add(td);
										
										//This should return either a val from textbox or formula, but if fails it tries once more from formula.
										var v = formula.val();
										var prevVal = td.text();
										var cell = jS.spreadsheets[jS.i][jS.cellLast.row][jS.cellLast.col];
										if (v.charAt(0) == '=') {
											td
												.attr('formula', v)
												.html('');
											cell.value = v;
											cell.formula = v;
										} else {
											td
												.removeAttr('formula')
												.html(s.encode(v));
											cell.value = v;
											cell.formula = null;
										}
										
										//reset the cell's value
										cell.calcCount = 0;
										
										if (v != prevVal || forceCalc) {
											jS.calc();
										}

										//Save the newest version of that cell
										jS.cellUndoable.add(td);
										
										//formula.focus().select();
										jS.cellLast.isEdit = false;
										
										jS.setDirty(true);
										
										//perform final function call
										jS.trigger('afterCellEdit', [{
											td: jS.cellLast.td,
											row: jS.cellLast.row,
											col: jS.cellLast.col,
											spreadsheetIndex: jS.i,
											sheetIndex: I
										}]);
									}
							}
							break;
					}
				},

				/**
				 * Abandons a cell edit
				 * @param skipCalc {Boolean} if set to true will skip sheet calculation;
				 * @methodOf jS.evt
				 * @name cellEditAbandon
				 */
				cellEditAbandon: function(skipCalc) {
					jS.obj.inPlaceEdit().remove();
					jS.themeRoller.cell.clearActive();
					jS.themeRoller.bar.clearActive();
					jS.themeRoller.cell.clearHighlighted();
					
					if (!skipCalc) {
						jS.calc();
					}
					
					jS.cellLast.td = [];
					jS.cellLast.row = 0;
					jS.cellLast.col = 0;
					jS.rowLast = 0;
					jS.colLast = 0;
					
					jS.labelUpdate('', true);
					jS.obj.formula()
						.val('');
					
					jS.autoFillerHide();
					
					return false;
				},

				/**
				 * Sets active cell from a pixel location
				 * @param left {Integer} pixels left
				 * @param top {Integer} pixels top
				 * @returns {Boolean}
				 * @methodOf jS.evt
				 * @name cellSetFocusFromXY
				 */
				cellSetFocusFromXY: function(left, top) {
					var td = jS.getTdFromXY(left, top);
					if (jS.isTd(td)) {
						td = $(td);
						jS.cellEdit(td);
						return false;
					}
					return true;
				},

				/**
				 * Highlights a cell from a key code
				 * @param e {Object} jQuery event
				 * @returns {Boolean}
				 * @methodOf jS.evt
				 * @name cellSetHighlightFromKeyCode
				 */
				cellSetHighlightFromKeyCode: function(e) {
					var c = jS.highlightedLast.colLast;
					var r = jS.highlightedLast.rowLast;
					var size = jS.sheetSize();
					jS.obj.cellActive().mousedown();
					
					switch (e.keyCode) {
						case key.UP: 		r--; break;
						case key.DOWN: 		r++; break;
						case key.LEFT: 		c--; break;
						case key.RIGHT: 	c++; break;
					}
					
					function keepInSize(i, size) {
						if (i < 1) return 1;
						if (i > size) return size;
						return i;
					}
					r = keepInSize(r, size.height);
					c = keepInSize(c, size.width);
					
					td = jS.getTd(jS.i, r, c);
					$(td).mousemove().mouseup();
					
					jS.highlightedLast.rowLast = r;
					jS.highlightedLast.colLast = c;
					return false;
				},


				/**
				 * Activates a cell from a key code
				 * @param e {Object} jQuery event
				 * @returns {Boolean}
				 * @methodOf jS.evt
				 * @name cellSetFocusFromKeyCode
				 */
				cellSetFocusFromKeyCode: function(e) {
					var c = jS.cellLast.col; //we don't set the cellLast.col here so that we never go into indexes that don't exist
					var r = jS.cellLast.row;
					var overrideIsEdit = false;
					switch (e.keyCode) {
						case key.UP: 		r--; break;
						case key.DOWN: 		r++; break;
						case key.LEFT: 		c--; break;
						case key.RIGHT: 	c++; break;
						case key.ENTER:		r++;
							overrideIsEdit = true;
							if (jS.highlightedLast.td.length > 1) {
								var inPlaceEdit = jS.obj.inPlaceEdit();
								var v = inPlaceEdit.val();
								inPlaceEdit.remove();
								jS.updateCellsAfterPasteToFormula(v);
								return true;
							} else if (s.autoAddCells) {
								if (jS.cellLast.row == jS.sheetSize().height) {
									jS.controlFactory.addRow();
								}
							}
							break;
						case key.TAB:
							overrideIsEdit = true;
							if (e.shiftKey) {
								c--;
							} else {
								c++;
							}
							if (s.autoAddCells) {
								if (jS.cellLast.col == jS.sheetSize().width) {
									jS.controlFactory.addColumn();
								}
							}
							break;
						case key.HOME:		c = 1; break;
						case key.END:		c = jS.obj.cellActive().parent().find('td').length - 1; break;
					}
					
					//we check here and make sure all values are above 0, so that we get a selected cell
					c = (c ? c : 1);
					r = (r ? r : 1);
					
					//to get the td could possibly make keystrokes slow, we prevent it here so the user doesn't even know we are listening ;)
					if (!jS.cellLast.isEdit || overrideIsEdit) {
						//get the td that we want to go to
						var td = jS.getTd(jS.i, r, c);
						
						//if the td exists, lets go to it
						if (td) {
							jS.themeRoller.cell.clearHighlighted();
							td = $(td);
							if (td.data('hidden')) {
								function getNext(o, reverse) {
									if (reverse) {
										c++;
										o = o.next()
									}
									else {
										c--;
										o = o.prev();
									}
									
									if (o.data('hidden') && o.length) {
										return getNext(o, reverse);
									}
									return o;
								}
								
								td = getNext(td, c > jS.cellLast.col);
							}
							jS.cellEdit(td);
							return false;
						}
					}
					
					//default, can be overridden above
					return true;
				},

				/**
				 * Cell on mouse down
				 * @param e {Object} jQuery event
				 * @methodOf jS.evt
				 * @name cellOnMouseDown
				 */
				cellOnMouseDown: function(e) {


					jS.obj.formula().blur();
					if (e.shiftKey) {
						jS.getTdRange(e, jS.obj.formula().val());
					} else {
						jS.cellEdit($(e.target), true);
					}			
				},

				/**
				 * Cell on double click
				 * @param e {Object} jQuery event
				 * @methodOf jS.evt
				 * @name cellOnDblClick
				 */
				cellOnDblClick: function(e) {
					jS.cellLast.isEdit = jS.isSheetEdit = true;
					jS.controlFactory.inPlaceEdit();
					//jS.log('click, in place edit activated');
				},

				/**
				 * Handles bar events, used for highlighting and activating
				 * @memberOf jS.evt
				 * @name barInteraction
				 * @namespace
				 */
				barInteraction: {

					/**
					 * The first bar that received the event (mousedown)
					 * @memberOf jS.evt.barInteraction
					 * @name first
					 */
					first: 0,

					/**
					 * The last bar that received the event (mousedown)
					 * @memberOf jS.evt.barInteraction
					 * @name last
					 */
					last: 0,

					/**
					 * Tracks if we are in select mode
					 * @memberOf jS.evt.barInteraction
					 * @name selecting
					 */
					selecting: false,

					/**
					 * Manages the bar selection
					 * @param o {Object} target
					 * @returns {*}
					 * @methodOf jS.evt.barInteraction
					 * @name select
					 */
					select: function(o) {
						if (!o) return;
						if (!jS.isBar(o)) return;
						o = $(o);
						var entity = o.data('entity'); //returns "top" or "left";
						var i = jS.getBarIndex[entity](o);
						if (!i) return false;
						
						jS[entity + 'Last'] = i; //keep track of last column for inserting new columns
						jS.evt.barInteraction.last = jS.evt.barInteraction.first = i;
						
						jS.cellSetActiveBar(entity, jS.evt.barInteraction.first, jS.evt.barInteraction.last);
						jS.evt.barInteraction.first = jS.evt.barInteraction.last = jS[entity + 'Last'] = i;

						jS.evt.barInteraction.selecting = true;
						$document
							.one('mouseup', function() {
								jS.evt.barInteraction.selecting = false;
							});
						
						return false;
					}
				},

				/**
				 * Manages scrolling
				 * @memberOf jS.evt
				 * @name scroll
				 * @namespace
				 */
				scroll: {

					/**
					 * axis cache, x & y
					 * @memberOf jS.evt.scroll
					 * @name axis
					 */
					axis: {x: {}, y:{}},

					/**
					 * tracks the current spreadsheet size
					 * @memberOf jS.evt.scroll
					 * @name size
					 */
					size: {},

					/**
					 * tracks last select cell
					 * @memberOf jS.evt.scroll
					 * @name td
					 */
					td: {},

					/**
					 * prepairs everything needed for a scroll, needs activated every time spreadsheet changes in size
					 * @param axis {String} x or y
					 * @param pane {jQuery|HTMLElement} pane object
					 * @param sheet {jQuery|HTMLElement} sheet object
					 * @methodOf jS.evt.scroll
					 * @name start
					 */
					start: function(axis, pane, sheet) {

						jS.autoFillerHide();

						pane = pane || jS.obj.pane();
						sheet = sheet || jS.obj.sheet();
						var me = jS.evt.scroll;
						me.size = jS.sheetSize(sheet);
						me.td = jS.obj.cellActive();

						me.axis[axis].v = [];
						me.axis[axis].p = [];

						switch (axis || 'x') {
							case 'x':
								var x = me.axis.x;
								x.max = me.size.width;
								x.min = 1 + jS.s.frozenAt.row;
								x.scrollStyle = jS.obj.scrollStyleX().trigger('updateStyle');
								x.area = pane.width();
								x.sheetArea = sheet.width();
								x.scrollUpdate = function() {
									var scroll = jS.obj.scroll();
									scroll.scrollLeft(parseInt((x.value + 1) * (scroll.width() / me.size.width)));
									return;
								}

								break;
							case 'y':
								var y = me.axis.y;
								y.max = me.size.height;
								y.min = 1 + jS.s.frozenAt.col;
								y.scrollStyle = jS.obj.scrollStyleY().trigger('updateStyle');
								y.area = pane.height();
								y.sheetArea = sheet.height() ;
								y.scrollUpdate = function() {
									var scroll = jS.obj.scroll();
									scroll.scrollTop(parseInt((y.value + 1) * (scroll.height() / me.size.height)));
									return;
								}
								break;
						}

						me.axis[axis].gridSize = 100 / (me.axis[axis].max - me.axis[axis].min);

						for(var i = me.axis[axis].min; i <= me.axis[axis].max; i++) {
							me.axis[axis].v[i] = me.axis[axis].gridSize * i;
							me.axis[axis].p[me.axis[axis].gridSize * i] = i + 1;
						}
					},

					/**
					 * Scrolls to a position within the spreadsheet
					 * @param pos {Object} {axis, value, pixel} if value not set, pixel is used
					 * @methodOf jS.evt.scroll
					 * @name scrollTo
					 */
					scrollTo: function(pos) {
						pos = $.extend({
							axis: 'x',
							value:0,
							pixel: 1}, pos);

						if (!jS.evt.scroll.axis) {
							jS.evt.scroll.start(pos.axis);
						}
						var me = jS.evt.scroll.axis[pos.axis];

						if (pos.value == me.value && me.value !== undefined) return;

						if (!pos.value) {
							pos.value = me.p[arrHelpers.getClosestValues(me.v, Math.abs(pos.pixel / (me.sheetArea - me.area)) * 100)];
						}

						if (pos.value > me.max) pos.value = me.max;

						var i = me.min, ids = [];
						while (i <= me.max) {
							if (i < pos.value && i > me.min) {
								ids.push(i);
							}
							i++;
						}

						if (ids.length) {
							me.scrollStyle.trigger('updateStyle', [ids]);
						} else {
							me.scrollStyle.trigger('updateStyle');
						}

						me.value = pos.value;

					},

					/**
					 * Called after scroll is done
					 * @methodOf jS.evt.scroll
					 * @name stop
					 */
					stop: function() {
						this.axis.x.scrollUpdate();
						this.axis.y.scrollUpdate();

						if (jS.evt.scroll.td) {
							jS.evt.scroll.td = null;
							jS.autoFillerGoToTd();
						}
					}
				}
			},

			/**
			 * Refreshed scroll system
			 * @param pos {Object} {row, col} needs at least one
			 * @methodOf jS
			 * @name scrollRefresh
			 */
			scrollRefresh: function(pos) {
				if (!pos) return;
				if (pos.row) {
					jS.evt.scroll.start('x');
					jS.evt.scroll.scrollTo({axis: 'x', value: pos.row});
					jS.evt.scroll.stop();
				}

				if (pos.col) {
					jS.evt.scroll.start('y');
					jS.evt.scroll.scrollTo({axis: 'y', value: pos.col});
					jS.evt.scroll.stop();
				}
			},

			/**
			 * Detects if an object is a td within a spreadsheet's table
			 * @param o {jQuery|HTMLElement} target
			 * @returns {Boolean}
			 * @methodOf jS
			 * @name isTd
			 */
			isTd: function(o) {
				if (!o) return false;

				o = (o[0] ? o[0] : [o]);
				if (o[0]) {
					if (!isNaN(o[0].cellIndex)) {
						if (o[0].cellIndex > 0 && o[0].parentNode.rowIndex > 0) { 
							return true;
						}
					}
				}
				return false;
			},

			/**
			 * Detects if an object is a bar td within a spreadsheet's table
			 * @param o {jQuery|HTMLElement} target
			 * @returns {Boolean}
			 * @methodOf jS
			 * @name isBar
			 */
			isBar: function(o) {
				if (!o) return false;

				o = (o[0] ? o[0] : [o]);
				if (o[0]) {
					if (!isNaN(o[0].cellIndex)) {
						if (o[0].cellIndex == 0 || o[0].parentNode.rowIndex == 0) { 
							return true;
						}
					}
				}
				return false;
			},

			/**
			 * Tracks read state of spreadsheet
			 * @memberOf jS
			 * @name readOnly
			 */
			readOnly: [],

			/**
			 * Detects read state of a spreadsheet
			 * @param i {Integer} index of spreadsheet within instance
			 * @returns {Boolean}
			 * @methodOf jS
			 * @name isSheetEditable
			 */
			isSheetEditable: function(i) {
				i = i || jS.i;
				return (
					s.editable == true && !jS.readOnly[i]
				);
			},

			/**
			 * Detects read state of formula of an object
			 * @param o {jQuery|HTMLElement} target
			 * @returns {Boolean}
			 * @methodOf jS
			 * @name isFormulaEditable
			 */
			isFormulaEditable: function(o) {
				if (s.lockFormulas) {
					if(o.attr('formula') !== undefined) {
						return false;
					}
				}
				return true;
			},

			/**
			 * Toggles full screen mode
			 * @methodOf jS
			 * @name toggleFullScreen
			 */
			toggleFullScreen: function() {
				if (jS.obj.fullScreen().is(':visible')) {
					$body.removeClass('bodyNoScroll');
					s.parent = origParent;
					
					var w = s.parent.width();
					var h = s.parent.height();
					s.width = w;
					s.height = h;
					
					jS.obj.tabContainer()
						.insertAfter(
							s.parent.append(jS.obj.fullScreen().children())
						)
						.removeClass(jS.cl.tabContainerFullScreen);
					
					jS.obj.fullScreen().remove();
					
					jS.sheetSyncSize();

					jS.obj.pane().trigger('resizeScroll');
				} else { //here we make a full screen
					$body.addClass('bodyNoScroll');
					
					var w = $window.width() - 15;
					var h = $window.height() - 35;

					s.width = w;
					s.height = h;
					
					jS.obj.tabContainer()
						.insertAfter(
							$('<div class="' + jS.cl.fullScreen + ' ' + jS.cl.uiFullScreen + '" />')
								.append(s.parent.children())
								.appendTo($body)
						)
						.addClass(jS.cl.tabContainerFullScreen);
					
					s.parent = jS.obj.fullScreen();
					
					jS.sheetSyncSize();

					jS.obj.pane().trigger('resizeScroll');
				}
			},

			/**
			 * Assists in rename of spreadsheet
			 * @methodOf jS
			 * @name renameSpreadsheet
			 */
			renameSpreadsheet: function(i) {
				if (isNaN(i)) return false;
				
				if (i > -1)
					jS.sheetTab();
			},

			/**
			 * Switches spreadsheet
			 * @param i {Integer} index of spreadsheet within instance
			 * @methodOf jS
			 * @name switchSpreadsheet
			 */
			switchSpreadsheet: function(i) {
				if (isNaN(i)) return false;
				
				if (i == -1) {
					jS.addSheet('5x10');
				} else if (i != jS.i) {
					jS.setActiveSheet(i);
					jS.calc(i);
				}
				
				jS.trigger('switchSheet', [i]);
				return false;
			},

			/**
			 * Makes table object usable by sheet
			 * @param o {jQuery|HTMLElement} table
			 * @returns {*}
			 * @methodOf jS
			 * @name tuneTableForSheetUse
			 */
			tuneTableForSheetUse: function(o) {
				o
					.addClass(jS.cl.sheet)
					.attr('id', jS.id.sheet + jS.i)
					.attr('border', '1px')
					.attr('cellpadding', '0')
					.attr('cellspacing', '0');
					
				o.find('td.' + jS.cl.cellActive).removeClass(jS.cl.cellActive);
				
				return o;
			},

			/**
			 * Cycles through all the td in a sheet and sets their id & virtual spreadsheet so it can be quickly referenced later
			 * @param sheet {jQuery|HTMLElement} spreadsheet table
			 * @param i {Integer} spreadsheet index within instance
			 * @param start {Object} {row, col}, index of column and or row to start at, can be null
			 * @methodOf jS
			 * @name setTdIds
			 */
			setTdIds: function(sheet, i, start) {
				if (!sheet) {
					sheet = jS.obj.sheet();
					i = jS.i;
				}

				start = $.extend({row: 0, col: 0}, start);
				
				jS.spreadsheets[i] = []; //reset the sheet's spreadsheet

				var rows = jS.rows(sheet);
				$(rows).each(function(row) {
					$(this).children().each(function(col) {
						var td = $(this);
						
						if (row > 0 && col > 0) {
							td.attr('id', jS.getTdId(i, row, col));
							jS.createCell(i, row, col, td.text(), td.attr('formula'));
						} else {
							if (col == 0 && row > 0) { //barleft
								td
									.data('type', 'bar')
									.data('entity', 'left')
									.text(row)
									.attr('id', jS.id.barLeft + row + '_' + jS.i)
									.attr('class', jS.cl.barLeft + ' ' + jS.cl.barLeft + '_' + jS.i + ' ' + jS.cl.uiBar);
							}
							
							if (row == 0 && col > 0) { //bartop
								td
									.data('type', 'bar')
									.data('entity', 'top')
									.text(jSE.columnLabelString(col))
									.attr('id', jS.id.barTop + col + '_' + jS.i)
									.attr('class', jS.cl.barTop + ' ' + jS.cl.barTop + '_' + jS.i + ' ' + jS.cl.uiBar);
							}
							
							if (row == 0 && col == 0) { //corner
								td
									.data('type', 'bar')
									.data('entity', 'corner')
									.attr('id', jS.id.barCorner + jS.i)
									.attr('class', jS.cl.uiBar + ' ' + ' ' + jS.cl.barCorner);
							}
						}
					});
				});
			},

			/**
			 * Resets the control ids, useful for when adding new sheets/controls between sheets/controls
			 * @methodOf jS
			 * @name setControlIds
			 */
			setControlIds: function() {
				var resetIds = function(o, id) {
					o.each(function(i) {
						$(this).attr('id', id + i);
					});
				};
				
				resetIds(jS.obj.sheetAll().each(function(i) {
					jS.setTdIds($(this), i);
				}), jS.id.sheet);

				resetIds(jS.obj.barTopAll(), jS.id.barTop);
				resetIds(jS.obj.barTopParentAll(), jS.id.barTopParent);
				resetIds(jS.obj.barLeftAll(), jS.id.barLeft);
				resetIds(jS.obj.barLeftParentAll(), jS.id.barLeftParent);
				resetIds(jS.obj.barCornerAll(), jS.id.barCorner);
				resetIds(jS.obj.barCornerParentAll(), jS.id.barCornerParent);
				resetIds(jS.obj.tableControlAll(), jS.id.tableControl);
				resetIds(jS.obj.paneAll(), jS.id.pane);
				resetIds(jS.obj.tabAll().each(function(j) {
					$(this).attr('i', j);
				}), jS.id.tab);
			},

			/**
			 * Toggles cells from being hidden, not yet used needs a bit of work
			 * @memberOf jS
			 * @name toggleHide
			 */
			toggleHide: {
				row: function(i) {
					if (!i) {//If i is empty, lets get the current row
						i = jS.obj.cellActive().parent().attr('rowIndex');
					}
					if (i) {//Make sure that i equals something
						var o = jS.obj.barLeft(i);
						if (o.is(':visible')) {//This hides the current row
							o.hide();
							jS.obj.sheet().find('tr').eq(i).hide();
						} else {//This unhides
							//This unhides the currently selected row
							o.show();
							jS.obj.sheet().find('tr').eq(i).show();
						}
					} else {
						alert(jS.msg.toggleHideRow);
					}
				},
				rowAll: function() {
					jS.obj.sheet().find('tr').show();
					jS.obj.barLeftAll().show();
				},
				column: function(i) {
					if (!i) {
						i = jS.obj.cellActive().attr('cellIndex');
					}
					if (i) {
						//We need to hide both the col and td of the same i
						var o = jS.obj.barTop(i);
						if (o.is(':visible')) {
							jS.obj.sheet().find('tbody tr').each(function() {
								$(this).children().eq(i).hide();
							});
							o.hide();
							jS.obj.sheet().find('colgroup col').eq(i).hide();
						}
					} else {
						alert(jS.msg.toggleHideColumn);
					}
				},
				columnAll: function() {
				
				}
			},

			/**
			 * Merges cells together
			 * @methodOf jS
			 * @name merge
			 */
			merge: function() {
				var cellsValue = [],
					cells = jS.obj.cellHighlighted(),
					cellFirstLoc = jS.getTdLocation(cells.first()),
					cellLastLoc = jS.getTdLocation(cells.last()),
					colI = Math.max(cellFirstLoc.col, cellLastLoc.col) - Math.min(cellFirstLoc.col, cellLastLoc.col);
				
				if (cells.length > 1 && cellFirstLoc.row) {
					for (var i = cellFirstLoc.col; i <= cellLastLoc.col; i++) {
						var td = $(jS.getTd(jS.i, cellFirstLoc.row, i)),
							cell = jS.spreadsheets[jS.i][cellFirstLoc.row][i];
						
						cellsValue.push(cell.formula ? "(" + cell.formula.substring(1) + ")" : cell.value);
						
						if (i != cellFirstLoc.col) {
							cell.formula = null;
							cell.value;
							cell.html = '';

							td
								.attr('formula', '')
								.html('')
								.hide();
						}
					}

					jS.spreadsheets[jS.i][cellFirstLoc.row][cellFirstLoc.row].value = cellsValue.join('');
					var cell = cells.first()
						.show()
						.attr('colspan', colI + 1)
						.html(cellsValue.join(''));
					
					jS.setDirty(true);
					jS.calc();
				}
			},

			/**
			 * Unmerges cells together
			 * @methodOf jS
			 * @name unmerge
			 */
			unmerge: function() {
				var cell = jS.obj.cellHighlighted().first();
				var loc = jS.getTdLocation(cell);
				var formula = cell.attr('formula');
				var v = cell.text();
				v = (formula ? formula : v);
				
				var rowI = cell.attr('rowspan') * 1;
				var colI = cell.attr('colspan') * 1;
				
				//rowI = parseInt(rowI ? rowI : 1); //we have to have a minimum here;
				colI = parseInt(colI ? colI : 1);
				
				var td = '<td />';
				
				var tds = '';
				
				if (colI) {
					for (var i = 0; i <= colI; i++) {
						tds += td;
					}
				}
				
				for (var i = loc.col; i <= colI; i++) {
					$(jS.getTd(jS.i, loc.row, i)).show();
				}
				
				cell.removeAttr('colspan');
				
				jS.setDirty(true);
				jS.calc();
			},

			/**
			 * Fills values down or up to highlighted cells from active cell;
			 * @param goUp {Boolean} default is down, when set to true value are filled from bottom, up;
			 * @param skipOffsetForumals {Boolean} default is formulas will offest, when set to true formulas will stay static;
			 * @param v {String} the value to set cells to, if not set, formula will be used;
			 * @methodOf jS
			 * @name fillUpOrDown
			 */
			fillUpOrDown: function(goUp, skipOffsetForumals, v) {
				var cells = jS.obj.cellHighlighted();
				var cellActive = jS.obj.cellActive();
				//Make it undoable
				jS.cellUndoable.add(cells);
				
				var startFromActiveCell = cellActive.hasClass(jS.cl.uiCellHighlighted);
				var startLoc = jS.getTdLocation(cells.first());
				var endLoc = jS.getTdLocation(cells.last());
				
				v = (v ? v : jS.obj.formula().val()); //allow value to be overridden
				
				var offset = {
					row: 0,
					col: 0
				};
				var td;
				var newV = v;
				var fn;
				if (v.charAt(0) == '=') {
					fn = function(sheet, row, col){
						td = $(this);
						
						if (goUp) {
							offset.row = -endLoc.row + row;
							offset.col = -endLoc.col + col;
						}
						else {
							offset.row = row - startLoc.row;
							offset.col = col - startLoc.col;
						}
						
						newV = jS.reparseFormula(v, offset);
						
						jS.spreadsheets[sheet][row][col].formula = newV;
						
						td.attr('formula', newV).html('');
					};
				} else {
					if (goUp && !isNaN(newV)) {
						newV *= 1;
						newV -= endLoc.row;
						newV -= endLoc.col;
					}
					fn = function(sheet, row, col){
						td = $(this);
						
						jS.spreadsheets[sheet][row][col].formula = null;
						jS.spreadsheets[sheet][row][col].value = newV;
						
						td.removeAttr('formula').html(newV);
						if (!isNaN(newV) && newV != '') newV++;
					};
				}
				
				jS.cycleCells(fn, startLoc, endLoc);
				
				jS.setDirty(true);
				jS.calc();
				
				//Make it redoable
				jS.cellUndoable.add(cells);
			},

			/**
			 * Makes cell formulas increment within a range
			 * @param loc {Object} {row: int, col: int}
			 * @param offset {Object} {row: int,col: int} offsets increment
			 * @param isBefore {Boolean} inserted before location
			 * @methodOf jS
			 * @name offsetFormulas
			 */
			offsetFormulas: function(loc, offset, isBefore) {
				var size = jS.sheetSize();
				//shifted range is the range of cells that are moved
				var shiftedRange = {
					first: loc,
					last: {
						row: size.height,
						col: size.width
					}
				};
				//effected range is the entire spreadsheet
				var affectedRange = {
					first: {
						row: 0,
						col: 0
					},
					last: {
						row: size.height,
						col: size.width
					}
				};
				
				jS.log("offsetFormulas from - Col:" + loc.col + ',Row:' + loc.row);
				jS.log("Is before loc:" + (isBefore ? 'true' : 'false'));
				jS.log("Offset: - Col:" + offset.col + ',Row:' + offset.row);
				
				function isInFormula(thisLoc, rowOrCol) {
					var move = false;
					
					if (isBefore) {
						if (thisLoc >= rowOrCol)
							move = true;
					} else {
						if (thisLoc > rowOrCol) 
							move = true;
					}
					
					return move;
				}

				jS.cycleCells(function (sheet, row, col) {
					var td = $(this);
					var formula = td.attr('formula');

					if (formula && jS.isFormulaEditable(td)) {
						formula = jS.reparseFormula(formula, offset, function(thisLoc){
							return {
								row: isInFormula(thisLoc.row, loc.row),
								col: isInFormula(thisLoc.col, loc.col)
							};
						});
						
						jS.spreadsheets[sheet][row][col].formula = formula;
						td.attr('formula', formula);
					}

				}, affectedRange.first, affectedRange.last);
				
				
				jS.evt.cellEditDone();
				jS.calc();
			},

			/**
			 * Reparses a formula
			 * @param formula
			 * @param offset {Object} {row: int,col: int} offsets increment
			 * @param fn {Function} Sent the current location of what is being reparsed
			 * @returns {String}
			 * @methodOf jS
			 * @name reparseFormula
			 */
			reparseFormula: function(formula, offset, fn) {
				return formula.replace(jSE.regEx.cell, function(ignored, col, row, pos) {
					if (col == "SHEET") return ignored;
					
					var loc = jSE.parseLocation(ignored);
					
					if (fn) {
						var move = fn(loc);
						
						
						if (move.col || move.row) {
							if (move.col) loc.col += offset.col;
							if (move.row) loc.row += offset.row;
							
							return jS.makeFormula(loc);
						}
					} else {
						return jS.makeFormula(loc, offset);
					}
											
					return ignored;
				});
			},

			/**
			 * Reconstructs a formula
			 * @param loc {Object} {row: i, col: i}
			 * @param offset {Object} {row: i, col: i}
			 * @returns {String}
			 * @methodOf jS
			 * @name makeForumla
			 */
			makeFormula: function(loc, offset) {
				offset = $.extend({row: 0, col: 0}, offset);
				
				//set offsets
				loc.col += offset.col;
				loc.row += offset.row;
				
				//0 based now
				if (loc.col < 0) loc.col = 0;
				if (loc.row < 0) loc.row = 0;
				
				return jSE.parseCellName(loc.col, loc.row);
			},

			/**
			 * Cylces through a certain group of td objects in a spreadsheet table and applies a function to them
			 * @param fn {Function} the function to apply to a cell
			 * @param firstLoc {Object} {row: 0, col: 0} the cell to start at
			 * @param lastLoc {Object} {row: 0, col: 0} the cell to end at
			 * @param i {Integer} spreadsheet index within instance
			 * @methodOf jS
			 * @name cycleCells
			 */
			cycleCells: function(fn, firstLoc, lastLoc, i) {
				i = i || jS.i;
				firstLoc = firstLoc || {row: 0, col: 0};
				
				if (!lastLoc) {
					var size = jS.sheetSize($('#' + jS.id.sheet + i));
					lastLoc = {row: size.height, col: size.width};
				}
				
				for (var row = firstLoc.row; row <= lastLoc.row; row++) {
					for (var col = firstLoc.col; col <= lastLoc.col; col++) {
						var td = jS.getTd(i, row, col);
						if (td) {
							fn.apply(td, [i, row, col]);
						}
					}
				}
			},

			/**
			 * Cylces through all td objects in a spreadsheet table and applies a function to them
			 * @param fn
			 * @methodOf jS
			 * @name cycleCellsAll
			 */
			cycleCellsAll: function(fn) {
				for (var i = 0; i <= jS.sheetCount; i++) {
					var size = jS.sheetSize($('#' + jS.id.sheet + i));
					var endLoc = {row: size.height, col: size.width};
					jS.cycleCells(fn, {row: 0, col: 0}, endLoc, i);
				}
			},

			/**
			 * Cylces through a certain group of td objects in a spreadsheet table and applies a function to them, firstLoc can be bigger then lastLoc, this is more dynamic
			 * @param fn {Function} the function to apply to a cell
			 * @param firstLoc {Object} {row: 0, col: 0} the cell to start at
			 * @param lastLoc {Object} {row: 0, col: 0} the cell to end at
			 * @returns {Array} of td objects
			 * @methodOf jS
			 * @name cycleCellsAndMaintainPoint
			 */
			cycleCellsAndMaintainPoint: function(fn, firstLoc, lastLoc) {
				var o = [];
				for (var i = Math.min(firstLoc.row, lastLoc.row) ; i <= Math.max(firstLoc.row, lastLoc.row); i++) {
					for (var j = Math.min(firstLoc.col, lastLoc.col); j <= Math.max(firstLoc.col, lastLoc.col); j++) {
						o.push(jS.getTd(jS.i, i, j));
						fn(o[o.length - 1]);
					}
				}
				return o;
			},

			/**
			 * Prepairs a table for use as a sheet
 			 * @param o {jQuery|HTMLElement} table object
			 * @methodOf jS
			 * @name sheetDecorate
			 */
			sheetDecorate: function(o) {
				jS.formatSheet(o);
				jS.sheetDecorateRemove(false, o);
			},

			/**
			 * Adds tbody, colgroup, heights and widths to different parts of a spreadsheet
			 * @param o {jQuery|HTMLElement} table object
			 * @methodOf jS
			 * @name formatSheet
			 */
			formatSheet: function(o) {
				var w = s.newColumnWidth, h = s.colMargin;

				if (o.find('tbody').length < 1) {
					o.wrapInner('<tbody />');
				}
				
				if (o.find('colgroup').length < 1 || o.find('col').length < 1) {
					o.remove('colgroup');
					var colgroup = $('<colgroup />');
					o.find('tr:first').children().each(function() {
						$('<col />')
							.width(w)
							.css('width', w + 'px')
							.attr('width', w + 'px')
							.appendTo(colgroup);
					});
					o.find('tr').each(function() {
						$(this)
							.height(h)
							.css('height', h + 'px')
							.attr('height', h + 'px');
					});
					colgroup.prependTo(o);
				}
				
				o
					.removeAttr('width')
					.css('width', '');
			},

			/**
			 * Ensure sheet minimums have been met, if not add columns and rows
			 * @param o {jQuery|HTMLElement} table object
			 * @methodOf jS
			 * @name checkMinSize
			 */
			checkMinSize: function(o) {
				var size = jS.sheetSize(),
					addRows = 0,
					addCols = 0;
				
				if ((size.width) < s.minSize.cols) {
					addCols = s.minSize.cols - size.width;
				}
				
				if (addCols) {
					jS.controlFactory.addColumnMulti(addCols, false, true);
				}
				
				if ((size.height) < s.minSize.rows) {
					addRows = s.minSize.rows - size.height;
				}
				
				if (addRows) {
					jS.controlFactory.addRowMulti(addRows, false, true);
				}
			},

			/**
			 * jQuery ui Themeroller integration
			 * @memberOf jS
			 * @name themeRoller
			 * @namespace
			 */
			themeRoller: {

				/**
				 * Starts themeroller integration
				 * @param sheet {jQuery|HTMLElement} spreadsheet table
				 * @methodOf jS.themeRoller
				 * @name start
				 */
				start: function(sheet) {
					s.parent.addClass(jS.cl.uiParent);
					sheet.addClass(jS.cl.uiSheet);
					
					jS.obj.header().addClass(jS.cl.uiControl);
					jS.obj.label().addClass(jS.cl.uiControl);
					jS.obj.formula().addClass(jS.cl.uiControlTextBox);
				},

				/**
				 * Themeroller cell interactions
				 * @memberOf jS.themeRoller
				 * @name cell
				 * @namespace
				 */
				cell: {

					/**
					 * Sets active jS.obj.cellActive() by adding class jS.cl.cellActive
					 * @methodOf jS.themeRoller.cell
					 * @name setActive
					 */
					setActive: function() {
						this.setHighlighted(
							jS.obj.cellActive()
								.addClass(jS.cl.cellActive)
						);
					},

					/**
					 * Highlights td object
					 * @param td {jQuery|HTMLElement} td object
					 * @methodOf jS.themeRoller.cell
					 * @name setHighlighted
					 */
					setHighlighted: function(td) {
						$(td)
							.addClass(jS.cl.cellHighlighted + ' ' + jS.cl.uiCellHighlighted);
					},

					/**
					 * Clears active jS.obj.cellActive();
					 * @methodOf jS.themeRoller.cell
					 * @name clearActive
					 */
					clearActive: function() {
						jS.obj.cellActive()
							.removeClass(jS.cl.cellActive);
					},

					/**
					 * Detects if there is a cell hlighlighted
					 * @returns {Boolean}
					 * @methodOf jS.themeRoller.cell
					 * @name isHighlighted
					 */
					isHighlighted: function() {
						return (jS.highlightedLast.td ? true : false);
					},

					/**
					 * Clears highlighted cells
					 * @methodOf jS.themeRoller.cell
					 * @name clearHighlighted
					 */
					clearHighlighted: function() {
						if (jS.themeRoller.cell.isHighlighted()) {
							jS.obj.cellHighlighted()
								.removeClass(jS.cl.cellHighlighted + ' ' + jS.cl.uiCellHighlighted);
						}
						
						jS.highlightedLast.rowStart = 0;
						jS.highlightedLast.colStart = 0;
						
						jS.highlightedLast.rowEnd = 0;
						jS.highlightedLast.colEnd = 0;
						jS.highlightedLast.td = [];
					}
				},

				/**
				 * Themeroller bar interactions
				 * @memberOf jS.themeRoller
				 * @name bar
				 * @namespace
				 */
				bar: {

					/**
					 * Adds initial style to bar
					 * @param o {jQuery|HTMLElement} bar object
					 * @methodOf jS.themeRoller.bar
					 * @name style
					 */
					style: function(o) {
						$(o).addClass(jS.cl.uiBar);
					},

					/**
					 * Sets a bar to be active
					 * @param direction {String} left or top
					 * @param i {Integer} index of bar
					 * @methodOf jS.themeRoller.bar
					 * @name setActive
					 */
					setActive: function(direction, i) {
						//We don't clear here because we can have multi active bars
						switch(direction) {
							case 'top': jS.obj.barTop(i).addClass(jS.cl.uiBarHighlight);
								break;
							case 'left': jS.obj.barLeft(i).addClass(jS.cl.uiBarHighlight);
								break;
						}
					},

					/**
					 * Clears bars from being active
					 * @methodOf jS.themeRoller.bar
					 * @name clearActive
					 */
					clearActive: function() {
						jS.obj.barTopAll().add(jS.obj.barLeftAll())
							.removeClass(jS.cl.uiBarHighlight);
					}
				},

				/**
				 * Themeroller tab interactions
				 * @memberOf jS.themeRoller
				 * @name tab
				 * @namespace
				 */
				tab: {

					/**
					 * Sets a tab to be active
					 * @param o {jQuery|HTMLElement} tab object
					 * @methodOf jS.themeRoller.tab
					 * @name setActive
					 */
					setActive: function(o) {
						this.clearActive();
						jS.obj.tab().parent().addClass(jS.cl.uiTabActive);
					},

					/**
					 * Clears a tab from being active
					 * @methodOf jS.themeRoller.tab
					 * @name clearActive
					 */
					clearActive: function () {
						jS.obj.tabContainer().find('span.' + jS.cl.uiTabActive)
							.removeClass(jS.cl.uiTabActive);
					}
				}
			},

			/**
			 * jQuery ui resizeable integration
			 * @param o {jQuery|HTMLElement} To set resizable
			 * @param settings {Object} the settings used with jQuery ui resizable
			 * @methodOf jS
			 * @name resizable
			 */
			resizable: function(o, settings) {
				if (!o.data('resizable')) {
					o.resizable(settings);
				}
			},

			/**
			 * instance busy state
			 * @memberOf jS
			 * @name busy
			 */
			busy: false,

			/**
			 * jQuery ui draggable integration
			 * @param o {jQuery|HTMLElement} To set resizable
			 * @param settings {Object} the settings used with jQuery ui resizable
			 * @methodOf jS
			 * @name draggable
			 */
			draggable: function(o, settings) {
				if (!o.data('draggable')) {
					o
						.data('jSdraggable', true)
						.draggable(settings);
				}
			},

			/**
			 * Bar resizing
			 * @memberOf jS
			 * @name resizeBar
			 * @namespace
			 */
			resizeBar: {

				/**
				 * Provides the top bar with ability to resize
				 * @param bar {jQuery|HTMLElement} td bar object
				 * @param i {Integer} index of bar
				 * @param pane {jQuery|HTMLElement} spreadsheet pane
				 * @param sheet {jQuery|HTMLElement} spreadsheet table
				 * @methodOf jS.resizeBar
				 * @name top
				 */
				top: function(bar, i, pane, sheet) {
					bar.find('.barController').remove();
					var barController = $('<div class="barController" />')
						.width(bar.width())
						.height(0)
						.prependTo(bar);
					
					jS.resizable(barController, {
						handles: 'e',
						start: function(e, ui) {
							jS.autoFillerHide();
							jS.busy = true;
							this.col = $(jS.col(sheet, i));
						},
						resize: function(e, ui) {
							this.col
								.width(ui.size.width)
								.attr('width', ui.size.width + 'px')
								.css('width', ui.size.width + 'px');
						},
						stop: function(e, ui) {
							jS.busy = false;
							pane.trigger('resizeScroll');
							jS.followMe();
						}
					});
				},

				/**
				 * Provides the left bar with ability to resize
				 * @param bar {jQuery|HTMLElement} td bar object
				 * @param i {Integer} index of bar
				 * @param pane {jQuery|HTMLElement} spreadsheet pane
				 * @param sheet {jQuery|HTMLElement} spreadsheet table
				 * @methodOf jS.resizeBar
				 * @name left
				 */
				left: function(bar, i, pane, sheet) {
					bar.find('.barController').remove();
					var barController = $('<div class="barController" />')
						.width(0)
						.height(bar.height())
						.prependTo(bar);
					
					var parent = bar.parent().add(bar);
					jS.resizable(barController, {
						handles: 's',
						start: function() {
							jS.autoFillerHide();
							jS.busy = true;
						},
						resize: function(e, ui) {
							parent
								.height(ui.size.height)
								.attr('height', (ui.size.height))
								.css('height', ui.size.height + 'px');
						},
						stop: function(e, ui) {
							jS.busy = false;
							pane.trigger('resizeScroll');
							jS.followMe();
						}
					});
				}
			},

			/**
			 * Removes sheet decorations
			 * @param makeClone {Boolean} creates a clone rather than the actual object
			 * @param sheets {jQuery|HTMLElement} spreadsheet table object to remove decorations from
			 * @returns {jQuery|HTMLElement}
			 * @methodOf jS
			 * @name sheetDecorateRemove
			 */
			sheetDecorateRemove: function(makeClone, sheets) {
				sheets = sheets || jS.obj.sheetAll();
				sheets = (makeClone ? sheets.clone() : sheets);
				
				//Get rid of highlighted cells and active cells
				sheets.find('td.' + jS.cl.cellActive)
					.removeClass(jS.cl.cellActive + ' ' + jS.cl.uiCellActive);

				sheets.find('td.' + jS.cl.cellHighlighted)
					.removeClass(jS.cl.cellHighlighted + ' ' + jS.cl.uiCellHighlighted);
				return sheets;
			},

			/**
			 * Removed bars from spreadsheet table
			 * @param sheet {jQuery|HTMLElement} spreadsheet table object to remove bars from
			 * @return {jQuery|HTMLElement}
			 * @methodOf jS
			 * @name sheetBarsRemove
			 */
			sheetBarsRemove: function(sheet) {
				sheet = $(sheet ? sheet : jS.obj.sheetAll());
				sheet.find('tr.' + jS.cl.barTopParent).remove();
				sheet.find('td.' + jS.cl.barLeft).remove();
				return sheet;
			},

			/**
			 * Updates the label so that the user knows where they are currently positioned
			 * @param v {String|Object} Value to update to, if object {col, row}
			 * @param setDirect {Boolean}
			 * @methodOf jS
			 * @name labelUpdate
			 */
			labelUpdate: function(v, setDirect) {
				if (!setDirect) {
					jS.obj.label().text(jSE.parseCellName(v.col, v.row));
				} else {
					jS.obj.label().text(v);
				}
			},

			/**
			 * Starts td to be edited
			 * @param td {jQuery|HTMLElement}
			 * @param isDrag {Boolean} should be determined by if the user is dragging their mouse around setting cells
			 */
			cellEdit: function(td, isDrag) {
				jS.autoFillerNotGroup = true; //make autoFiller directional again.
				//This finished up the edit of the last cell
				jS.evt.cellEditDone();
				
				jS.followMe(td);
				
				var loc = jS.getTdLocation(td);
				
				//Show where we are to the user
				jS.labelUpdate(loc);
				
				var v = td.attr('formula');
				if (!v) {
					v = td.text();
				}
				
				var formula = jS.obj.formula()
					.val(v)
					.blur();
				
				jS.cellSetActive(td, loc, isDrag);
			},

			/**
			 * sets cell active to sheet, and highlights it for the user, shouldn't be called directly, should use cellEdit
			 * @param td {jQuery|HTMLElement}
			 * @param loc {Object} {col, row}
			 * @param isDrag {Boolean} should be determined by if the user is dragging their mouse around setting cells
			 * @param directional {Boolean} makes highlighting directional, only left/right or only up/down
			 * @param fnDone {Function} called after the cells are set active
			 * @memberOf jS
			 * @name cellSetActive
			 */
			cellSetActive: function(td, loc, isDrag, directional, fnDone) {
				if (typeof(loc.col) != 'undefined') {
					jS.cellLast.td = td; //save the current cell/td
					
					jS.cellLast.row = jS.rowLast = loc.row;
					jS.cellLast.col = jS.colLast = loc.col;
					
					jS.themeRoller.bar.clearActive();
					jS.themeRoller.cell.clearHighlighted();
					
					jS.highlightedLast.td = td;
					
					jS.themeRoller.cell.setActive(); //themeroll the cell and bars
					jS.themeRoller.bar.setActive('left', jS.cellLast.row);
					jS.themeRoller.bar.setActive('top', jS.cellLast.col);
					
					var selectModel;
					var clearHighlightedModel;
					
					jS.highlightedLast.rowStart = loc.row;
					jS.highlightedLast.colStart = loc.col;
					jS.highlightedLast.rowLast = loc.row;
					jS.highlightedLast.colLast = loc.col;
					
					switch (s.cellSelectModel) {
						case 'excel':
						case 'gdocs':
							selectModel = function() {};
							clearHighlightedModel = jS.themeRoller.cell.clearHighlighted;
							break;
						case 'oo':
							selectModel = function(target) {
								var td = $(target);
								if (jS.isTd(td)) {
									jS.cellEdit(td);
								}
							};
							clearHighlightedModel = function() {};
							break;
					}
					
					if (isDrag) {
						var lastLoc = loc; //we keep track of the most recent location because we don't want tons of recursion here
						jS.obj.pane()
							.mousemove(function(e, target) {
								if (jS.busy) return false;

								target = target || e.target;

								var endLoc = jS.getTdLocation([target]);

								if (endLoc.col < 1 || endLoc.row < 1) return false; //bar

								var ok = true;
								
								if (directional) {
									ok = false;
									if (loc.col == endLoc.col || loc.row == endLoc.row) {
										ok = true;
									}
								}
								
								if ((lastLoc.col != endLoc.col || lastLoc.row != endLoc.row) && ok) { //this prevents this method from firing too much
									//clear highlighted cells if needed
									clearHighlightedModel();
									
									//set current bars
									jS.highlightedLast.colEnd = endLoc.col;
									jS.highlightedLast.rowEnd = endLoc.row;
									
									//select active cell if needed
									selectModel(target);
									
									//highlight the cells
									jS.highlightedLast.td = jS.cycleCellsAndMaintainPoint(jS.themeRoller.cell.setHighlighted, loc, endLoc);
								}
								
								lastLoc = endLoc;
							});
						
						$document
							.one('mouseup', function() {
	
								jS.obj.pane()
									.unbind('mousemove')
									.unbind('mouseup');
								
								if ($.isFunction(fnDone)) {
									fnDone();
								}
							});
					}
				}
			},

			/**
			 * the most recent used column
			 * @memberOf jS
			 * @name colLast
			 */
			colLast: 0,

			/**
			 * the most recent used row
			 * @memberOf jS
			 * @name rowLast
			 */
			rowLast: 0,

			/**
			 * the most recent used cell, {td, row, col, isEdit}
			 * @memberOf jS
			 * @type {Object}
			 * @name cellLast
			 */
			cellLast: {
				td: [], //this is a dud td, so that we don't get errors
				row: 0,
				col: 0,
				isEdit: false
			},

			/**
			 * the most recent highlighted cells {td, rowStart, colStart, rowEnd, colEnd}
			 * @memberOf jS
			 * @type {Object}
			 * @name highlightedLast
			 */
			highlightedLast: {
				td: [],
				rowStart: 0,
				colStart: 0,
				rowEnd: 0,
				colEnd: 0
			},

			/**
			 * sets a cells class for styling
			 * @param setClass {String} class(es) to set cells to
			 * @param removeClass {String} class(es) to remove from cell if the setClass would conflict with
			 * @return {Boolean}
			 * @methodOf jS
			 * @name cellStyleToggle
			 */
			cellStyleToggle: function(setClass, removeClass) {
				//Lets check to remove any style classes
				var uiCell = jS.obj.cellHighlighted();
				
				jS.cellUndoable.add(uiCell);
				
				if (removeClass) {
					uiCell.removeClass(removeClass);
				}
				//Now lets add some style
				if (uiCell.hasClass(setClass)) {
					uiCell.removeClass(setClass);
				} else {
					uiCell.addClass(setClass);
				}
				
				jS.cellUndoable.add(uiCell);
				
				//jS.obj.formula()
					//.focus()
					//.select();
				return false;
			},

			/**
			 * Resizes fonts in a cell by 1 pixel
			 * @param direction {String} "up" or "down"
			 * @methodOf jS
			 * @name fontReSize
			 */
			fontReSize: function (direction) {
				var resize=0;
				switch (direction) {
					case 'up':
						resize=1;
						break;
					case 'down':
						resize=-1;
						break;
				}
				
				//Lets check to remove any style classes
				var uiCell = jS.obj.cellHighlighted();
				
				jS.cellUndoable.add(uiCell);
				
				uiCell.each(function(i) {
					cell = $(this);
					var curr_size = (cell.css("font-size") + '').replace("px","")
					var new_size = parseInt(curr_size ? curr_size : 10) + resize;
					cell.css("font-size", new_size + "px");
				});
				
				jS.cellUndoable.add(uiCell);
			},

			/**
			 * Current number of cells being parsed
			 * @type {Integer}
			 * @memberOf jS
			 * @name callStack
			 */
			callStack: 0,

			/**
			 * Ignites calculation with cell, is recursively called if cell uses value from another cell
			 * @param sheet {Integer} sheet index within instance
			 * @param row {Integer} row index
			 * @param col {Integer} col index
			 * @return {*} cell value after calculated
			 * @name updateCellValue
			 * @methodOf jS
			 */
			updateCellValue: function(sheet, row, col) {
				//first detect if the cell exists if not return nothing
				if (!jS.spreadsheets[sheet]) return s.error({error: jS.msg.notFoundSheet});
				if (!jS.spreadsheets[sheet][row]) return s.error({error: jS.msg.notFoundRow});
				if (!jS.spreadsheets[sheet][row][col]) return s.error({error: jS.msg.notFoundColumn});
				
				var cell = jS.spreadsheets[sheet][row][col];
				cell.oldValue = cell.value; //we detect the last value, so that we don't have to update all cell, thus saving resources

				if (cell.result) { //unset the last result if it is set
					delete cell.result;
				}

				if (cell.state) {
					return s.error({error: jS.msg.loopDetected});
				}
				
				cell.state = "red";
				cell.html = [];
				cell.fnCount = 0;
				
				if (cell.calcCount < 1 && cell.calcLast != jS.calcLast) {
					cell.calcLast = jS.calcLast;
					cell.calcCount++;
					if (cell.formula) {
						try {
							if (cell.formula.charAt(0) == '=') {
								cell.formula = cell.formula.substring(1, cell.formula.length);
							}
							
							var Parser;
							if (jS.callStack) { //we prevent parsers from overwriting each other
								if (!cell.parser) { //cut down on un-needed parser creation
									cell.parser = (new jS.parser);
								}
								Parser = cell.parser
							} else {//use the sheet's parser if there aren't many calls in the callStack
								Parser = jS.Parser;
							}
							
							jS.callStack++
							Parser.lexer.obj = {
								type: 'cell',
								sheet: sheet,
								row: row,
								col: col,
								obj: cell,
								s: s,
								editable: s.editable,
								jS: jS,
								error: s.error
							};
							Parser.lexer.handler = jS.cellHandler;
							cell.result = Parser.parse(cell.formula);
						} catch(e) {
							cell.result = e.toString();
							jS.alertFormulaError(cell.value);
						}
						jS.callStack--;
					}

					cell = jS.filterValue(cell, sheet, row, col);
				}
				
				cell.state = null;
				return cell.value;
			},

			/**
			 * Fillters cell's value so correct entity is displayed
			 * @param cell {Object} cell
			 * @param sheet {Integer} sheet index within instance
			 * @param row {Integer} row index
			 * @param col {Integer} col index
			 * @return {Object} cell
			 * @methodOf jS
			 * @name filterValue
			 */
			filterValue: function(cell, sheet, row, col) {
				cell = cell || {};

				if (typeof cell.result != 'undefined') {
					cell.value = cell.result;
					$(jS.getTd(sheet, row, col)).html(cell.html.length > 0 ? cell.html : s.encode(cell.value));
				} else if (cell.html.length > 0) {
					$(jS.getTd(sheet, row, col)).html(cell.html);
				} else {
					$(jS.getTd(sheet, row, col)).html(s.encode(cell.value));
				}
				return cell;
			},

			/**
			 * Object handler for parser
			 * @name cellHandler
			 * @memberOf jS
			 * @namespace
			 */
			cellHandler: {

				/**
				 * Variable handler for parser, arguments are the variable split by '.'.  Expose variables by using jQuery.sheet setting formulaVariables
				 * @return {*}
				 * @methodOf jS.cellHandler
				 * @name variable
				 */
				variable: function() {
					if (arguments.length) {
						var name = arguments[0],
							attr = arguments[1];

						switch(name.toLowerCase()) {
							case 'true': return jFN.TRUE();
							case 'false': return jFN.FALSE();
						}

						if (jS.s.formulaVariables[name] && !attr) {
							return jS.s.formulaVariables[name];
						} else if (jS.s.formulaVariables[name] && attr) {
							return jS.s.formulaVariables[name][attr];
						} else {
							return '';
						}
					}
				},

				/**
				 * time to fraction of day 1 / 0-24
				 * @param time {Time}
				 * @param isAMPM {Boolean}
				 * @return {*}
				 * @methodOf jS.cellHandler
				 * @name time
				 */
				time: function(time, isAMPM) {
					return times.fromString(time, isAMPM);
				},

				/**
				 * Concatenate a string
				 * @return {String}
				 * @methodOf jS.cellHandler
				 * @name concatenate
				 */
				concatenate: function() {
					jS.spreadsheets[this.sheet][this.row][this.col].html = [];
					return jFN.CONCATENATE.apply(this, arguments).value;
				},

				/**
				 * Get cell value
				 * @param id {String} example "A1"
				 * @return {*}
				 * @methodOf jS.cellHandler
				 * @name cellValue
				 */
				cellValue: function(id) { //Example: A1
					var loc = jSE.parseLocation(id);
					return jS.updateCellValue(this.sheet, loc.row, loc.col);
				},

				/**
				 * Get cell values as an array
				 * @param start {String} example "A1"
				 * @param end {String} example "B1"
				 * @return {Array}
				 * @methodOf jS.cellHandler
				 * @name cellRangeValue
				 */
				cellRangeValue: function(start, end) {//Example: A1:B1
					start = jSE.parseLocation(start);
					end = jSE.parseLocation(end);
					var result = [];
					
					for (var i = start.row; i <= end.row; i++) {
						for (var j = start.col; j <= end.col; j++) {
							result.push(jS.updateCellValue(this.sheet, i, j));
						}
					}
					return [result];
				},

				/**
				 * Get cell value
				 * @param id {String} example "$A$1"
				 * @return {*}
				 * @methodOf jS.cellHandler
				 * @name fixedCellValue
				 */
				fixedCellValue: function(id) {
					id = id.replace(/\$/g, '');
					return jS.cellHandler.cellValue.apply(this, [id]);
				},

				/**
				 * Get cell values as an array
				 * @param start {String} example "$A$1"
				 * @param end {String} example "$B$1"
				 * @return {Array}
				 * @methodOf jS.cellHandler
				 * @name fixedCellRangeValue
				 */
				fixedCellRangeValue: function(start, end) {
					start = start.replace(/\$/g, '');
					end = end.replace(/\$/g, '');
					return jS.cellHandler.cellRangeValue.apply(this, [start, end]);
				},

				/**
				 * Get cell value from a different sheet within an instance
				 * @param sheet {String} example "SHEET1"
				 * @param id {String} example "A1"
				 * @return {*}
				 * @methodOf jS.cellHandler
				 * @name remoteCellValue
				 */
				remoteCellValue: function(sheet, id) {//Example: SHEET1:A1
					var loc = jSE.parseLocation(id);
					sheet = jSE.parseSheetLocation(sheet);
					return jS.updateCellValue(sheet, loc.row, loc.col);
				},

				/**
				 * Get cell values as an array from a different sheet within an instance
				 * @param sheet {String} example "SHEET1"
				 * @param start {String} example "A1"
				 * @param end {String} example "B1"
				 * @return {Array}
				 * @methodOf jS.cellHandler
				 * @name remoteCellRangeValue
				 */
				remoteCellRangeValue: function(sheet, start, end) {//Example: SHEET1:A1:B2
					sheet = jSE.parseSheetLocation(sheet);
					start = jSE.parseLocation(start);
					end = jSE.parseLocation(end);
					
					var result = [];
					
					for (var i = start.row; i <= end.row; i++) {
						for (var j = start.col; j <= end.col; j++) {
							result.push(jS.updateCellValue(sheet, i, j));
						}
					}

					return [result];
				},

				/**
				 * Calls a function either from jQuery.sheet.engine or defined in jQuery sheet setting formulaFunctions.  When calling a function the cell being called from is "this".
				 * @param fn {String} function name (Will be converted to upper case)
				 * @param args {Array} arguments needing to be sent to function
				 * @param cell {Object} cell
				 * @return {*}
				 * @methodOf jS.cellHandler
				 * @name callFunction
				 */
				callFunction: function(fn, args, cell) {
					fn = fn.toUpperCase();
					if (!args) {
						args = [''];
					} else if ($.isArray(args)) {
						args = args.reverse();
					} else {
						args = [args];
					}
					
					if ($.sheet.fn[fn]) {
						jS.spreadsheets[cell.sheet][cell.row][cell.col].fnCount++;
						var values = [],
							html = [];

						for(i in args) {
							if (args[i]) {
								if (args[i].value || args[i].html) {
									values.push(args[i].value);
									html.push(args[i].html);
								} else {
									values.push(args[i]);
									html.push(args[i]);
								}
							}
						}

						cell.html = html;
						var result = $.sheet.fn[fn].apply(cell, values);
						if (result != null) {
							if (typeof result.html != 'undefined') {
								jS.spreadsheets[cell.sheet][cell.row][cell.col].html = result.html;
							}
							if (typeof result.value != 'undefined') {
								return result.value;
							}
						}
						return result;
					} else {
						return s.error({error: "Function " + fn + " Not Found"});
					}
				}
			},

			/**
			 * Cell lookup handlers
			 * @name cellLookupHandlers
			 * @memberOf jS
			 * @namespace
			 */
			cellLookupHandlers: {

				/**
				 * @param id {String} example "$A$1"
				 * @return {Array} [sheet, startCell, endCell]
				 * @methodOf jS.cellLookupHandlers
				 * @name fixedCellValue
				 */
				fixedCellValue: function(id) {
					return [jS.sheet, jSE.parseLocation(id), jSE.parseLocation(id)];
				},

				/**
				 * @param sheet {String} example "SHEET1"
				 * @param start {String} example "$A$1"
				 * @param end {String} example "$B$1"
				 * @return {Array} [sheet, startCell, endCell]
				 * @methodOf jS.cellLookupHandlers
				 * @name fixedCellRangeValue
				 */
				fixedCellRangeValue: function(sheet, start, end) {
					return [jSE.parseSheetLocation(sheet), jSE.parseLocation(start), jSE.parseLocation(end)];
				},

				/**
				 * doesn't do anything right now
				 * @param id
				 * @methodOf jS.cellLookupHandlers
				 * @name cellValue
				 */
				cellValue: function(id) {
					
				},

				/**
				 * @param sheet {String} example "SHEET1"
				 * @param start {String} example "A1"
				 * @param end {String} example "B1"
				 * @return {Array} [sheet, startCell, endCell]
				 * @methodOf jS.cellLookupHandlers
				 * @name cellRangeValue
				 */
				cellRangeValue: function(sheet, start, end) {
					return [jS.sheet, jSE.parseLocation(start), jSE.parseLocation(end)];
				},

				/**
				 * @param sheet  {String} example "SHEET1"
				 * @param id {String} example "A1"
				 * @return {Array} [sheet, startCell, endCell]
				 * @methodOf jS.cellLookupHandlers
				 * @name remoteCellValue
				 */
				remoteCellValue: function(sheet, id) {
					return [jS.sheet, jSE.parseLocation(id), jSE.parseLocation(id)];
				},

				/**
				 *
				 * @param sheet {String} example "SHEET1"
				 * @param start {String} example "A1"
				 * @param end {String} example "B1"
				 * @return {Array} [sheet, startCell, endCell]
				 * @methodOf jS.cellLookupHandlers
				 * @name remoteCellRangeValue
				 */
				remoteCellRangeValue: function(sheet, start, end) {
					return [jSE.parseSheetLocation(sheet), jSE.parseLocation(start), jSE.parseLocation(end)];
				},

				/**
				 * @return {*}
				 * @methodOf jS.cellLookupHandlers
				 * @name callFunction
				 */
				callFunction: function() {
					if (arguments[0] == "VLOOKUP" || arguments[0] == "HLOOKUP" && arguments[1]) {
						return arguments[1].reverse()[1];
					}
				}
			},

			/**
			 * Looks up cell using jS.cellLookupHandlers
			 * @return {Array}
			 * @methodOf jS
			 * @name cellLookup
			 */
			cellLookup: function() {
				var parser = (new jS.parser);
				parser.lexer.obj = this.obj;
				parser.lexer.handler = $.extend(parser.lexer.handler, jS.cellLookupHandlers);
				
				var args = parser.parse(this.obj.formula);
				var lookupTable = [];
				
				for(var row = args[1].row; row <= args[2].row; row++) {
					for(var col = args[1].col; col <= args[2].col; col++) {
						lookupTable.push({
							sheet: args[0],
							row: row,
							col: col
						});
					}
				}
				
				return lookupTable;
			},

			/**
			 *
			 * @param msg {String}
			 * @methodOf jS
			 * @name alertFormulaError
			 */
			alertFormulaError: function(msg) {
				alert(
					'cell:' + row + ' ;' + col + '\n' +
					'value: "' + cell.formula + '"\n' + 
					'error: \n' + e
				);
			},

			/**
			 * Date of last calculation
			 * @memberOf jS
			 * @name calcLast
			 */
			calcLast: 0,

			/**
			 * Where jS.spreadsheets are calculated, and returned to their td counterpart
			 * @param tableI {Integer} table index
			 * @methodOf jS
			 * @name calc
			 */
			calc: function(tableI) { /* harnesses formula engine's calculation function
												tableI: int, the current table integer;
												fuel: variable holder, used to prevent memory leaks, and for calculations;
											*/
				tableI = (tableI ? tableI : jS.i);
				if (jS.readOnly[tableI]) return; //readonly is no calc at all
				
				jS.log('Calculation Started');
				jS.calcLast = new Date();
				jSE.calc(tableI, jS.spreadsheetsToArray()[tableI], jS.updateCellValue);
				jS.trigger('calculation');
				jS.isSheetEdit = false;
				jS.log('Calculation Ended');
			},

			/**
			 * adds a spreadsheet table
			 * @param size {String} example "10x100" which means 10 columns by 100 rows
			 * @methodOf jS
			 * @name addSheet
			 */
			addSheet: function(size) {
				size = (size ? size : prompt(jS.msg.newSheet));
				if (size) {
					jS.evt.cellEditAbandon();
					jS.setDirty(true);
					var newSheetControl = jS.controlFactory.sheetUI($.sheet.makeTable.fromSize(size), jS.sheetCount + 1, function(o) {
						jS.setActiveSheet(jS.sheetCount);
					}, true);
					
					jS.trigger('addSheet', [jS.i]);
				}
			},

			/**
			 * deletes a spreadsheet table
			 * @param i {Integer} optional spraedsheet index within instance
			 * @methodOf jS
			 * @name deleteSheet
			 */
			deleteSheet: function(i) { /* removes the currently selected sheet */
				var oldI = i || jS.i;
				
				jS.obj.barHelper().remove();

				jS.obj.tableControl().remove();
				jS.obj.tabContainer().children().eq(jS.i).remove();
				jS.spreadsheets[oldI] = null;
				jS.i = 0;
				jS.sheetCount--;
				
				jS.setControlIds();
				
				jS.setActiveSheet(jS.i);
				jS.setDirty(true);
				
				jS.trigger('deleteSheet', [oldI]);
			},

			/**
			 * removes the currently selected row
			 * @param skipCalc {Boolean}
			 * @methodOf jS
			 * @name deleteRow
			 */
			deleteRow: function(skipCalc) {
				$(jS.getTd(jS.i, jS.rowLast, 1)).parent().remove();

				jS.setTdIds(null, null, {row: jS.rowLast - 1});
				
				jS.offsetFormulas({
					row: jS.rowLast,
					col: 0
				}, {
					row: -1,
					col: 0
				});
				
				jS.setDirty(true);
				
				jS.evt.cellEditAbandon();

				jS.obj.pane().trigger('resizeScroll');
				
				jS.trigger('deleteRow', jS.rowLast);
			},

			/**
			 * removes the currently selected column
			 * @param skipCalc {Boolean}
			 * @methodOf jS
			 * @name deleteColumn
			 */
			deleteColumn: function(skipCalc) {
				console.log(jS.colLast);
				if (jS.colLast < 1) return;
				jS.obj.barHelper().remove();
				var col = jS.obj.sheet().find('colgroup col').eq(jS.colLast);
				var colWidth = col.width();
				var sheet = jS.obj.sheet();
				//var sheetWidth = sheet.width() - colWidth;
				col.remove();
				
				var size = jS.sheetSize();
				jS.obj.barTop(jS.colLast).remove();
				for (var i = 1; i <= size.height; i++) {
					$(jS.getTd(jS.i, i, jS.colLast)).remove();
				}
				
				jS.setTdIds(null, null, {col: jS.colLast});
				
				jS.offsetFormulas({
					row: 0,
					col: jS.colLast
				}, {
					row: 0,
					col: -1
				});
				
				jS.setDirty(true);
				
				jS.evt.cellEditAbandon();

				//sheet.width(sheetWidth);

				jS.obj.pane().trigger('resizeScroll');

				jS.trigger('deleteColumn', jS.colLast);
			},

			/**
			 * manages a tabs inner value
			 * @param get {Bool} makes return the current value of the tab
			 * @return {jQuery|HTMLElement}
			 * @methodOf jS
			 * @name sheetTab
			 */
			sheetTab: function(get) { /*
											get: bool,
										*/
				var sheetTab = '';
				if (get) {
					sheetTab = jS.obj.sheet().attr('title');
					sheetTab = (sheetTab ? sheetTab : 'Spreadsheet ' + (jS.i + 1));
				} else if (jS.isSheetEditable() && s.editableTabs) { //ensure that the sheet is editable, then let them change the sheet's name
					var newTitle = prompt("What would you like the sheet's title to be?", jS.sheetTab(true));
					if (!newTitle) { //The user didn't set the new tab name
						sheetTab = jS.obj.sheet().attr('title');
						newTitle = (sheetTab ? sheetTab : 'Spreadsheet' + (jS.i + 1));
					} else {
						jS.setDirty(true);
						jS.obj.sheet().attr('title', newTitle);
						jS.obj.tab().html(newTitle);
						
						sheetTab = newTitle;
					}
				}
				return $('<div />').text(sheetTab).html();
			},

			/**
			 * prints a value in a new window
			 * @param o {String} anything
			 * @methodOf jS
			 * @name print
			 */
			print: function(o) {
				var w = window.open();
				w.document.write("<html><body><xmp>" + o + "\n</xmp></body></html>");
				w.document.close();
			},

			/**
			 * prints the source of a sheet for a user to see
			 * @param pretty {Boolean} makes html a bit easier for the user to see
			 * @return {Boolean}
			 * @methofOf jS
			 * @name viewSource
			 */
			viewSource: function(pretty) {
				var sheetClone = jS.sheetDecorateRemove(true);
				sheetClone = jS.sheetBarsRemove(sheetClone);
				
				var s = "";
				if (pretty) {
					$(sheetClone).each(function() {
						s += jS.HTMLtoPrettySource(this);
					});
				} else {
					s += $('<div />').html(sheetClone).html();
				}
				
				jS.print(s);
				
				return false;
			},

			/**
			 * saves the sheet, default is post to jQuery sheet setting urlSave with parameter s as the spreadsheet's html
			 * @methodOf jS
			 * @name saveSheet
			 */
			saveSheet: function() { /* saves the sheet */
				var v = jS.sheetDecorateRemove(true);
				v = jS.sheetBarsRemove(v);
				var d = $('<div />').html(v).html();

				$.ajax({
					url: s.urlSave,
					type: 'POST',
					data: 's=' + d,
					dataType: 'html',
					success: function(data) {
						jS.setDirty(false);
						jS.trigger('saveSheet');
					}
				});
			},

			/**
			 * prints html to 1 line
			 * @param node {HTMLElement}
			 * @return {String}
			 * @constructor
			 * @methodOf jS
			 * @name HTMLtoCompactSource
			 */
			HTMLtoCompactSource: function(node) {
				var result = "";
				if (node.nodeType == 1) {
					// ELEMENT_NODE
					result += "<" + node.tagName;
					hasClass = false;
					
					var n = node.attributes.length;
					for (var i = 0, hasClass = false; i < n; i++) {
						var key = node.attributes[i].name;
						var val = node.getAttribute(key);
						if (val) {
							if (key == "contentEditable" && val == "inherit") {
								continue;
								// IE hack.
							}
							if (key == "class") {
								hasClass = true;
							}
							
							if (typeof(val) == "string") {
								result += " " + key + '="' + val.replace(/"/g, "'") + '"';
							} else if (key == "style" && val.cssText) {
								result += ' style="' + val.cssText + '"';
							}
						}
					}

					if (node.tagName == "COL") {
						// IE hack, which doesn't like <COL..></COL>.
						result += '/>';
					} else {
						result += ">";
						var childResult = "";
						$(node.childNodes).each(function() {
							childResult += jS.HTMLtoCompactSource(this);
						});
						result += childResult;
						result += "</" + node.tagName + ">";
					}

				} else if (node.nodeType == 3) {
					// TEXT_NODE
					result += node.data.replace(/^\s*(.*)\s*$/g, "$1");
				}
				return result;
			},

			/**
			 *  prints html to many lines, formatted for easy viewing
			 * @param node {HTMLElement}
			 * @param prefix {String}
			 * @return {String}
			 * @constructor
			 * @methodOf jS
			 * @name HTMLtoPrettySource
			 */
			HTMLtoPrettySource: function(node, prefix) {
				if (!prefix) {
					prefix = "";
				}
				var result = "";
				if (node.nodeType == 1) {
					// ELEMENT_NODE
					result += "\n" + prefix + "<" + node.tagName;
					var n = node.attributes.length;
					for (var i = 0; i < n; i++) {
						var key = node.attributes[i].name;
						var val = node.getAttribute(key);
						if (val) {
							if (key == "contentEditable" && val == "inherit") {
								continue; // IE hack.
							}
							if (typeof(val) == "string") {
								result += " " + key + '="' + val.replace(/"/g, "'") + '"';
							} else if (key == "style" && val.cssText) {
								result += ' style="' + val.cssText + '"';
							}
						}
					}
					if (node.childNodes.length <= 0) {
						result += "/>";
					} else {
						result += ">";
						var childResult = "";
						var n = node.childNodes.length;
						for (var i = 0; i < n; i++) {
							childResult += jS.HTMLtoPrettySource(node.childNodes[i], prefix + "  ");
						}
						result += childResult;
						if (childResult.indexOf('\n') >= 0) {
							result += "\n" + prefix;
						}
						result += "</" + node.tagName + ">";
					}
				} else if (node.nodeType == 3) {
					// TEXT_NODE
					result += node.data.replace(/^\s*(.*)\s*$/g, "$1");
				}
				return result;
			},

			/**
			 * scrolls the sheet to the selected cell
			 * @param td {jQuery|HTMLElement}
			 * @methodOf jS
			 * @name followMe
			 */
			followMe: function(td) {
				td = td || jS.obj.cellActive();
				if (!td.length) return;

				var pane = jS.obj.pane(),
					cols = jS.cols(),
					paneOffset = pane.offset(),
					paneWidth = pane.width(),
					paneHeight = pane.height(),
					tdLoc = jS.getTdLocation(td),
					tdWidth = td.width(),
					tdHeight = td.height(),
					visibleFold = {
						top: parseInt(paneOffset.top),
						bottom: parseInt(paneOffset.top + paneHeight),
						left: parseInt(paneOffset.left),
						right: parseInt(paneOffset.left + paneWidth)
					},
					move = true,
					rowHidden,
					colHidden,
					i = 0,
					x = 0,
					y = 0,
					max = 3,
					tdPos,
					tdLocation,
					directions;

				while (move == true && i < max) {
					rowHidden = td.is(':hidden');
					colHidden = $(cols[tdLoc.col]).is(':hidden');

					move = false;
					tdPos = td.offset();
					tdLocation = {
						top: parseInt(tdPos.top),
						bottom: parseInt(tdPos.top + tdHeight),
						left: parseInt(tdPos.left),
						right: parseInt(tdPos.left + tdWidth)
					};
					directions = {
						up: tdLocation.top < visibleFold.top || rowHidden,
						down: tdLocation.bottom > visibleFold.bottom,
						left: tdLocation.left < visibleFold.left && colHidden,
						right: tdLocation.right > visibleFold.right
					};

					console.log(directions);

					if (directions.left) {
						jS.evt.scroll.scrollTo({axis: 'x', value: tdLoc.col + -x});
						move = true;
						x++;
					} else if (directions.right) {
						jS.evt.scroll.scrollTo({axis: 'x', value: tdLoc.col + x});
						move = true;
						x++;
					}

					if (directions.up) {
						jS.evt.scroll.scrollTo({axis: 'y', value: tdLoc.row + -y});
						move = true;
						y++;
					} else if (directions.down) {
						jS.evt.scroll.scrollTo({axis: 'y', value: tdLoc.row + y});
						move = true;
						y++;
					}

					if (move) {
						jS.evt.scroll.stop();
					}

					i++;
				}

				jS.autoFillerGoToTd(td, tdHeight, tdWidth);
			},

			/**
			 * moves autoFiller to a selected cell
			 * @param td {jQuery|HTMLElement}
			 * @param tdHeight {Integer} optional, height of a td object
			 * @param tdWidth {Integer} optional, width of a td object
			 * @methodOf jS
			 * @name autoFillerGoToTd
			 */
			autoFillerGoToTd: function(td, tdHeight, tdWidth) {
				if (!s.autoFiller) return;

				td = td || jS.obj.cellActive();
				tdHeight = tdHeight || td.height();
				tdWidth = tdWidth || td.width();

				if (jS.isTd(td[0]) && td.is(':visible')) { //ensure that it is a usable cell
					var tdPos = td.position();
					jS.obj.autoFiller()
						.show()
						.css('top', ((tdPos.top + (tdHeight || td.height()) - 3) + 'px'))
						.css('left', ((tdPos.left + (tdWidth || td.width()) - 3) + 'px'));
				} else {
					jS.autoFillerHide();
				}
			},

			/**
			 * hides the auto filler
			 * @methodOf jS
			 * @name autoFillerHide
			 */
			autoFillerHide: function() {
				if (!s.autoFiller) return;

				jS.obj.autoFiller().hide();
			},

			/**
			 * sets active a spreadsheet inside of a sheet instance
			 * @param i {Integer} a sheet integer desired to show
			 * @methodOf jS
			 * @name setActiveSheet
			 */
			setActiveSheet: function(i) {
				i = (i ? i : 0);
				
				if (jS.cellLast.row > 0 || jS.cellLast.col > 0) {
					jS.evt.cellEditDone();
					jS.obj.formula().val('');
				}
				
				jS.obj.tableControlAll()
					.hide()
					.eq(i).show();

				jS.i = i;			
				
				jS.themeRoller.tab.setActive();
				
				jS.readOnly[i] = jS.obj.sheet().hasClass('readonly');
				
				jS.sheetSyncSize();
				jS.obj.pane().trigger('resizeScroll');
			},

			/**
			 * requests a table object from a url, then opens it
			 * @param url {String}
			 * @return {Boolean}
			 * @methodOf jS
			 * @name openSheetURL
			 */
			openSheetURL: function ( url ) {
				s.urlGet = url;
				return jS.openSheet();
			},

			/**
			 * opens a spreadsheet into the active sheet instance
			 * @param o {jQuery|HTMLElement} a table objec
			 * @param reloadBarsOverride {Boolean}
			 * @return {Boolean} if set to true, foces bars on left and top not be reloaded
			 * @methodOf jS
			 * @name openSheet
			 */
			openSheet: function(o, reloadBarsOverride) {
				if (!jS.isDirty ? true : confirm(jS.msg.openSheet)) {
					jS.controlFactory.header();
					
					var fnAfter = function(i, l) {
						if (i == l) {
							jS.i = 0;
							jS.setActiveSheet();
							//jS.themeRoller.resize();

							jS.trigger('sheetOpened', [i]);

							for (var i = 0; i <= jS.sheetCount; i++) {
								jS.calc(i);
							}
						}
					};
					
					if (!o) {
						$('<div />').load(s.urlGet, function() {
							var sheets = $(this).children('table');
							sheets.each(function(i) {
								jS.controlFactory.sheetUI($(this), i, function() {
									fnAfter(i, sheets.length - 1);
								}, true);
							});
						});
					} else {
						var sheets = $('<div />').html(o).children('table');
						sheets.show().each(function(i) {
							jS.controlFactory.sheetUI($(this), i,  function() {
								fnAfter(i, sheets.length);
							}, (reloadBarsOverride ? true : false));
						});
					}
					
					jS.setDirty(false);
					
					return true;
				} else {
					return false;
				}
			},

			/**
			 * creates a new sheet from size from prompt
			 * @methodOf jS
			 * @name newSheet
			 */
			newSheet: function() {
				var size = prompt(jS.msg.newSheet);
				if (size) {
					jS.openSheet($.sheet.makeTable.fromSize(size));
				}
			},

			/**
			 * creates a new row and then applies an array's values to each of it's new values, not currently working
			 * @param rowArray {Array} values to import
			 * @methodOf jS
			 * @name importRow
			 */
			importRow: function(rowArray) {
				jS.controlFactory.addRow(null, null, null);

				var error = "";
				jS.obj.sheet().find('tr:last td').each(function(i) {
					$(this).removeAttr('formula');
					try {
						//To test this, we need to first make sure it's a string, so converting is done by adding an empty character.
						if ((rowArray[i] + '').charAt(0) == "=") {
							$(this).attr('formula', rowArray[i]);
						} else {
							$(this).html(rowArray[i]);
						}
					} catch(e) {
						//We want to make sure that is something bad happens, we let the user know
						error += e + ';\n';
					}
				});
				
				if (error) {//Show them the errors
					alert(error);
				}
				//Let's recalculate the sheet just in case
				jS.setTdIds();
				jS.calc();
			},

			/**
			 * creates a new column and then applies an array's values to each of it's new values
			 * @param columnArray {Array} values to import
			 * @methodOf jS
			 * @name ImportColumn
			 */
			importColumn: function(columnArray) {
				jS.controlFactory.addColumn();

				var error = "";
				jS.obj.sheet().find('tr').each(function(i) {
					var o = $(this).find('td:last');
					try {
						//To test this, we need to first make sure it's a string, so converting is done by adding an empty character.
						if ((columnArray[i] + '').charAt(0) == "=") {
							o.attr('formula', columnArray[i]);					
						} else {
							o.html(columnArray[i]);
						}
					} catch(e) {
						//We want to make sure that is something bad happens, we let the user know
						error += e + ';\n';
					}
				});
				
				if (error) {//Show them the errors
					alert(error);
				}
				//Let's recalculate the sheet just in case
				jS.setTdIds();
				jS.calc();
			},

			/**
			 * Sheet export
			 * @namespace
			 * @name exportSheet
			 * @memberOf jS
			 */
			exportSheet: { /* exports sheets into xml, json, or html formats */
				xml: function (skipCData) {
					var sheetClone = jS.sheetDecorateRemove(true);
					sheetClone = jS.sheetBarsRemove(sheetClone);
							
					var document = "";
					
					var cdata = ['<![CDATA[',']]>'];
					
					if (skipCData) {
						cdata = ['',''];
					}

					$(sheetClone).each(function() {
						var row = '';
						var table = $(this);
						var colCount = 0;
						var col_widths = '';

						table.find('colgroup').children().each(function (i) {
							col_widths += '<c' + i + '>' + ($(this).attr('width') + '').replace('px', '') + '</c' + i + '>';
						});
						
						var trs = table.find('tr');
						var rowCount = trs.length;
						
						trs.each(function(i){
							var col = '';
							
							var tr = $(this);
							var h = tr.attr('height');
							var height = (h ? h : s.colMargin);
							var tds = tr.find('td');
							colCount = tds.length;
							
							tds.each(function(j){
								var td = $(this);
								var colSpan = td.attr('colspan');
								colSpan = (colSpan > 1 ? colSpan : '');
								
								var formula = td.attr('formula');
								var text = (formula ? formula : td.text());
								var cl = td.attr('class');
								var style = td.attr('style');
									
								//Add to current row
								col += '<c' + j +
									(style ? ' style=\"' + style + '\"' : '') + 
									(cl ? ' class=\"' + cl + '\"' : '') + 
									(colSpan ? ' colspan=\"' + colSpan + '\"' : '') +
								'>' + text + '</c' + j + '>';
							});
							
							row += '<r' + i + ' h=\"' + height + '\">' + col + '</r' + i + '>';
						});

						document += '<document title="' + table.attr('title') + '">' +
									'<metadata>' +
										'<columns>' + colCount + '</columns>' +  //length is 1 based, index is 0 based
										'<rows>' + rowCount + '</rows>' +  //length is 1 based, index is 0 based
										'<col_widths>' + col_widths + '</col_widths>' +
									'</metadata>' +
									'<data>' + row + '</data>' +
								'</document>';
					});

					return '<documents>' + document + '</documents>';
				},
				json: function() {
					var sheetClone = jS.sheetDecorateRemove(true);
					sheetClone = jS.sheetBarsRemove(sheetClone);
					var documents = []; //documents
					
					$(sheetClone).each(function() {
						var document = {}; //document
						document['metadata'] = {};
						document['data'] = {};
						
						var table = $(this);
						
						var trs = table.find('tr');
						var rowCount = trs.length;
						var colCount = 0;
						var col_widths = '';
						
						trs.each(function(i) {
							var tr = $(this);
							var tds = tr.find('td');
							colCount = tds.length;
							
							document['data']['r' + i] = {};
							document['data']['r' + i]['h'] = tr.attr('height');
							
							tds.each(function(j) {
								var td = $(this);
								var colSpan = td.attr('colspan');
								colSpan = (colSpan > 1 ? colSpan : null);
								var formula = td.attr('formula');

								document['data']['r' + i]['c' + j] = {
									'value': (formula ? formula : td.text()),
									'style': td.attr('style'),
									'colspan': colSpan,
									'cl': td.attr('class')
								};
							});
						});
						document['metadata'] = {
							'columns': colCount, //length is 1 based, index is 0 based
							'rows': rowCount, //length is 1 based, index is 0 based
							'title': table.attr('title'),
							'col_widths': {}
						};
						
						table.find('colgroup').children().each(function(i) {
							document['metadata']['col_widths']['c' + i] = ($(this).attr('width') + '').replace('px', '');
						});
						
						documents.push(document); //append to documents
					});
					return documents;
				},
				html: function() {
					var sheetClone = jS.sheetDecorateRemove(true);
					sheetClone = jS.sheetBarsRemove(sheetClone);
					return sheetClone;
				}
			},
			/**
			 * Sync's the called parent's controls so that they fit inside
			 * @function sheetSyncSize
			 */
			sheetSyncSize: function() {
				var h = s.height;
				if (!h) {
					h = 400; //Height really needs to be set by the parent
				} else if (h < 200) {
					h = 200;
				}
				s.parent
					.height(h)
					.width(s.width);
					
				var w = s.width - jS.obj.barLeftParent().outerWidth() - s.boxModelCorrection;
				
				h = h - jS.obj.header().outerHeight() - jS.obj.barTopParent().outerHeight() - s.boxModelCorrection;
				
				jS.obj.pane()
					.height(h - window.scrollBarSize.height - s.boxModelCorrection)
					.width(w - window.scrollBarSize.width)
					.parent()
						.width(w);
				
				jS.obj.sheetPaneTd()
					.height(h)
					.width(w);
					
				jS.obj.ui()
					.width(w + jS.obj.barLeftParent().outerWidth());
						
				jS.obj.barLeftParent()
					.height(h);
				
				jS.obj.barTopParent()
					.width(w)
					.parent()
						.width(w);
			},
			cellChangeStyle: function(style, value) { /* changes a cell's style and makes it undoable/redoable
														style: string, css style name;
														value: string, css setting;
													*/
				jS.cellUndoable.add(jS.obj.cellHighlighted()); //save state, make it undoable
				jS.obj.cellHighlighted().css(style, value);
				jS.cellUndoable.add(jS.obj.cellHighlighted()); //save state, make it redoable

			},
			cellFind: function(v) { /* finds a cell in a sheet from a value
										v: string, value in a cell to find;
									*/
				if(!v) {
					v = prompt("What are you looking for in this spreadsheet?");
				}
				if (v) {//We just do a simple uppercase/lowercase search.
					var o = jS.obj.sheet().find('td:contains("' + v + '")');
					
					if (o.length < 1) {
						o = jS.obj.sheet().find('td:contains("' + v.toLowerCase() + '")');
					}
					
					if (o.length < 1) {
						o = jS.obj.sheet().find('td:contains("' + v.toUpperCase() + '")');
					}
					
					o = o.eq(0);
					if (o.length > 0) {
						jS.cellEdit(o);
					} else {
						alert(jS.msg.cellFind);
					}
				}
			},
			cellSetActiveBar: function(type, start, end) { /* sets a bar active
																type: string, "col" || "row" || "all";
																start: int, int to start highlighting from;
																start: int, int to end highlighting to;
															*/
				var size = jS.sheetSize();
				var first = (start < end ? start : end);
				var last = (start < end ? end : start);
				
				var setActive = function(td, rowStart, colStart, rowFollow, colFollow) {
					switch (s.cellSelectModel) {
						case 'oo': //follow cursor behavior
							jS.cellEdit($(jS.getTd(jS.i, rowFollow, colFollow)));
							break;
						default: //stay at initial cell
							jS.cellEdit($(jS.getTd(jS.i, rowStart, colStart)));
							break;
					}
					
					setActive = function(td) { //save resources
						return td;
					};
					
					return td;
				};

				var cycleFn;

				var td = [];
				
				switch (type) {
					case 'top':
						cycleFn = function() {
							for (var i = 1; i <= size.height; i++) { //rows
								for (var j = first; j <= last; j++) { //cols
									td.push(jS.getTd(jS.i, i, j));
									jS.themeRoller.cell.setHighlighted(setActive(td[td.length - 1], 1, start, 1, end));
								}
							}
						};
						break;
					case 'left':
						cycleFn = function() {
							for (var i = first; i <= last; i++) { //rows
								for (var j = 1; j <= size.width; j++) { //cols
									td.push(jS.getTd(jS.i, i, j));
									jS.themeRoller.cell.setHighlighted(setActive(td[td.length - 1], start, 1, end, 1));
								}
							}
						};
						break;
					case 'corner': //all
						cycleFn = function() {
							setActive = function(td) {
								jS.cellEdit($(td));
								setActive = function() {};
							};
							for (var i = 1; i <= size.height; i++) {
								for (var j = 1; j <= size.width; j++) {
									td.push(jS.getTd(jS.i, i, j));
									setActive(td[td.length - 1]);
									jS.themeRoller.cell.setHighlighted(td[td.length - 1]);
								}
							}
							first = {row: 1,col: 1};
							last = {
								row: size.height,
								col: size.width
							}
						};
						break;
				}
				
				cycleFn();
				
				jS.highlightedLast.td = td;
				jS.highlightedLast.rowStart = first.row;
				jS.highlightedLast.colStart = first.col;
				jS.highlightedLast.rowEnd = last.row;
				jS.highlightedLast.colEnd = last.col;
			},
			getTdRange: function(e, v, newFn, notSetFormula) { /* gets a range of selected cells, then returns it */
				jS.cellLast.isEdit = true;
				
				var range = function(loc) {
					if (loc.first.col > loc.last.col ||
						loc.first.row > loc.last.row
					) {
						return {
							first: jSE.parseCellName(loc.last.col, loc.last.row),
							last: jSE.parseCellName(loc.first.col, loc.first.row)
						};
					} else {
						return {
							first: jSE.parseCellName(loc.first.col, loc.first.row),
							last: jSE.parseCellName(loc.last.col, loc.last.row)
						};
					}
				};
				var label = function(loc) {
					var rangeLabel = range(loc);
					var v2 = v + '';
					v2 = (v2.match(/=/) ? v2 : '=' + v2); //make sure we can use this value as a formula
					
					if (newFn || v2.charAt(v2.length - 1) != '(') { //if a function is being sent, make sure it can be called by wrapping it in ()
						v2 = v2 + (newFn ? newFn : '') + '(';
					}
					
					var formula;
					var lastChar = '';
					if (rangeLabel.first != rangeLabel.last) {
						formula = rangeLabel.first + ':' + rangeLabel.last;
					} else {
						formula = rangeLabel.first;
					}
					
					if (v2.charAt(v2.length - 1) == '(') {
						lastChar = ')';
					}
					
					return v2 + formula + lastChar;
				};
				var newVal = '';
				
				if (e) { //if from an event, we use mousemove method
					var loc = {
						first: jS.getTdLocation([e.target])
					};
					
					var sheet = jS.obj.sheet().mousemove(function(e) {
						loc.last = jS.getTdLocation([e.target]);
						
						newVal = label(loc);
						
						if (!notSetFormula) {
							jS.obj.formula().val(newVal);
							jS.obj.inPlaceEdit().val(newVal);
						}
					});
					
					$document.one('mouseup', function() {
						sheet.unbind('mousemove');
						return newVal;
					});
				} else {
					var cells = jS.obj.cellHighlighted().not(jS.obj.cellActive());
					
					if (cells.length) {
						var loc = { //tr/td column and row index
							first: jS.getTdLocation(cells.first()),
							last: jS.getTdLocation(cells.last())
						};
						
						newVal = label(loc);
						
						if (!notSetFormula) {
							jS.obj.formula().val(newVal);
							jS.obj.inPlaceEdit().val(newVal);
						}
						
						return newVal;
					} else {
						return '';
					}
				}
			},
			getTdId: function(tableI, row, col) { /* makes a td if from values given
													tableI: int, table integer;
													row: int, row integer;
													col: int, col integer;
												*/
				return I + '_table' + tableI + '_cell_c' + col + '_r' + row;
			},
			getTd: function(tableI, row, col) { /* gets a td
													tableI: int, table integer;
													row: int, row integer;
													col: int, col integer;
												*/
				return document.getElementById(jS.getTdId(tableI, row, col));
			},
			getTdLocation: function(td) { /* gets td column and row int
												td: object, td object;
											*/
				var result = {col: 0, row: 0};
				if (!td && !td[0]) return result;

				if (td[0]) {
					return {
						col: parseInt(td[0].cellIndex),
						row: parseInt(td[0].parentNode.rowIndex)
					};
				} else {
					if (!td.cellIndex && !td.parentNode && !td.parentNode.rowIndex) return result;
					return {
						col: parseInt(td.cellIndex),
						row: parseInt(td.parentNode.rowIndex)
					};
				}
			},
			getTdFromXY: function(left, top) { /* gets cell from point
																left: int, pixels left;
																top: int, pixels top;
															*/
				var pane = jS.obj.pane();
				var paneOffset = pane.offset();
				
				top += paneOffset.top;
				left += paneOffset.left;
				
				//here we double check that the coordinates are inside that of the pane, if so then we can continue
				if (
						(
							top >= paneOffset.top && 
							top <= paneOffset.top + pane.height()
						)
							&&
						(
							left >= paneOffset.left && 
							left <= paneOffset.left + pane.width()
						)
				) {
					var td = document.elementFromPoint(left, top);
					
					//I use this snippet to help me know where the point was positioned
					/*jQuery('<div class="ui-widget-content" style="position: absolute;">TESTING TESTING</div>')
						.css('top', top + 'px')
						.css('left', left + 'px')
						.appendTo('body');
					*/
					
					if (jS.isTd(td)) {
						return td;
					}
					return false;
				}
			},
			getBarIndex: {
				left: function(o) {/* get's index from object */
					var i = $.trim($(o).text());
					if (isNaN(i)) {
						return 0;
					} else {
						return i;
					}
				},
				top: function(o) {/* get's index from object */
					var v = $.trim($(o).text());
					if (!v) return 0;
					
					var i = jSE.columnLabelIndex(v);
					i = parseInt(i);
					
					if (isNaN(i)) {
						return 0;
					} else {
						return i;
					}
				},
				corner: function() {
					return 0;
				}
			},
			EMPTY_VALUE: {},
			time: { /* time loggin used with jS.log, useful for finding out if new methods are faster */
				now: new Date(),
				last: new Date(),
				diff: function() {
					return Math.abs(Math.ceil(this.last.getTime() - this.now.getTime()) / 1000).toFixed(5);
				},
				set: function() {
					this.last = this.now;
					this.now = new Date();
				},
				get: function() {
					return this.now.getHours() + ':' + this.now.getMinutes() + ':' + this.now.getSeconds();
				}
			},
			log: function(msg) {  //The log prints: {Current Time}, {Seconds from last log};{msg}
				jS.time.set();
				console.log(jS.time.get() + ', ' + jS.time.diff() + '; ' + msg);
			},
			isDirty:  false,
			setDirty: function(dirty) { jS.isDirty = dirty; },
			appendToFormula: function(v, o) {
				var formula = jS.obj.formula();
				
				var fV = formula.val();
				
				if (fV.charAt(0) != '=') {
					fV = '=' + fV;
				}
				
				formula.val(fV + v);
			},
			cellUndoable: { /* makes cell editing undoable and redoable
								there should always be 2 cellUndoable.add()'s every time used, one to save the current state, the second to save the new
							*/
				undoOrRedo: function(undo) {
					//hide the autoFiller, it can get confused
					jS.autoFillerHide();
					
					if (undo && this.i > 0) {
						this.i--;
						this.i--;
					} else if (!undo && this.i < this.stack.length) {
						this.i++;
						this.i++;
					}
					
					this.get().clone().each(function() {
						var o = $(this);
						var id = o.attr('undoable');
						if (id) {
							$('#' + id).replaceWith(
								o
									.removeAttr('undoable')
									.attr('id', id)
							);
						} else {
							jS.log('Not available.');
						}
					});
					
					jS.themeRoller.cell.clearActive();
					jS.themeRoller.bar.clearActive();
					jS.themeRoller.cell.clearHighlighted();
					
					jS.calc();
				},
				get: function() { //gets the current cell
					return $(this.stack[this.i]);
				},
				add: function(tds) {
					var oldTds = tds.clone().each(function() {
						var o = $(this);
						var id = o.attr('id');
						if (!id) return;
						o
							.removeAttr('id') //id can only exist in one location, on the sheet, so here we use the id as the attr 'undoable'
							.attr('undoable', id)
							.removeClass(jS.cl.cellHighlighted + ' ' + jS.cl.uiCellHighlighted);
					});
					
					this.stack[this.i++] = oldTds;
						
					if (this.stack.length > this.i) {
						for (var i = this.stack.length; i > this.i; i--) {
							this.stack.pop();
						}
					}
					
					
					if (this.stack.length > 20) { //undoable count, we want to be careful of too much memory consumption
						this.stack.shift(); //drop the first value
					}
						
				},
				i: 0,
				stack: []
			},
			cols: function(o) {
				o = o || jS.obj.sheet();

				//table / colgroup / col
				if (!o[0]) return [];
				if (!o[0].children) return [];
				if (!o[0].children[0]) return [];
				if (!o[0].children[0].children) return [];

				return o[0].children[0].children
			},
			col: function(o, eq) {
				o = o || jS.obj.sheet();

				var cols = jS.cols(o);

				if (eq === undefined) {
					eq = cols.length - 1;
				}

				return cols[eq];
			},
			rowCells: function(o, row) {
				o = o || jS.obj.sheet();

				var rows = jS.rows(o);

				if (row == undefined) {
					row = rows.length - 1;
				}


				if (!rows[row]) return {}; //tr
				if (!rows[row].children) return {}; //td

				return rows[row].children;
			},
			rows: function(o) {
				o = o || jS.obj.sheet();
				if (!o[0]) return {}; //table
				if (!o[0].children) return {}; //table
				if (!o[0].children[1]) return {}; //tbody
				if (!o[0].children[1].children) return {}; //tr

				return o[0].children[1].children;
			},
			sheetSize: function(o) {
				o = o || jS.obj.sheet();
				//table / tbody / tr / td
				var result = {
					width: 0,
					height: 0
				};


				var lastRow = jS.rowCells(o);
				var loc = jS.getTdLocation(lastRow[lastRow.length - 1]);
				return {
					width: loc.col,
					height: loc.row
				};
			},
			toggleState:  function(replacementSheets) {
				if (s.allowToggleState) {
					if (s.editable) {
						jS.evt.cellEditAbandon();
						jS.saveSheet();
					}
					jS.setDirty(false);
					s.editable = !s.editable;
					jS.obj.tabContainer().remove();
					var sheets = (replacementSheets ? replacementSheets : jS.obj.sheetAll().clone());
					origParent.children().remove();
					jS.openSheet(sheets, true);
				}
			},
			setCellRef: function(ref) {
				var td = jS.obj.cellActive();
				loc = jS.getTdLocation(td);
				
				cellRef = (ref ? ref : prompt('Enter the name you would like to reference the cell by.'));
				
				if (cellRef) {
					jS.spreadsheets[cellRef] = jS.spreadsheets[jS.i][loc.row][loc.col];
				}
				
				jS.calc();
			},
			buildSheet: function() {
				if (jS.s.buildSheet) {//override urlGet, this has some effect on how the topbar is sized
					if (typeof(jS.s.buildSheet) == 'object') {
						return jS.s.buildSheet;
					} else if (jS.s.buildSheet == true || jS.s.buildSheet == 'true') {
						return $(jS.s.origHtml);
					} else if (jS.s.buildSheet.match(/x/i)) {
						return $.sheet.makeTable.fromSize(jS.s.buildSheet);
					}
				}
			}
		};
		
		if (!window.scrollBarSize) {
			window.scrollBarSize = $.sheet.getScrollBarSize();
		}

		var $window = $(window),
			$document = $(document),
			$body = $('body'),
			emptyFN = function() {};
		
		//ready the sheet's parser
		jS.lexer = function() {};
		jS.lexer.prototype = parser.lexer;
		jS.parser = function() {
			this.lexer = new jS.lexer();
			this.yy = {};
		};
		jS.parser.prototype = parser;
		
		jS.Parser = new jS.parser;
		
		//We need to take the sheet out of the parent in order to get an accurate reading of it's height and width
		//$(this).html(s.loading);
		s.origParent = origParent;
		s.origHtml = origParent.html();
		s.parent
			.html('')
			.addClass(jS.cl.parent);
		
		origParent
			.unbind('switchSpreadsheet')
			.bind('switchSpreadsheet', function(e, js, i){
				jS.switchSpreadsheet(i);
			})
			.unbind('renameSpreadsheet')
			.bind('renameSpreadsheet', function(e, js, i){
				jS.renameSpreadsheet(i);
			});
		
		//Use the setting height/width if they are there, otherwise use parent's
		s.width = (s.width ? s.width : s.parent.width());
		s.height = (s.height ? s.height : s.parent.height());
		
		
		// Drop functions if they are not needed & save time in recursion
		if (!s.log) {
			jS.log = emptyFN;
		}
		
		if (!$.ui || !s.resizable) {
			jS.resizable = jS.draggable = emptyFN;
		}
		
		if (!$.support.boxModel) {
			s.boxModelCorrection = 0;
		}
		
		if (!s.barMenus) {
			jS.controlFactory.barMenuTop = jS.controlFactory.barMenuLeft = emptyFN;
		}
		
		if (!s.freezableCells) {
			jS.controlFactory.barHandleFreeze.top = jS.controlFactory.barHandleFreeze.left = emptyFN;
		}
		
		if (s.calcOff) {
			jS.calc = emptyFN;
		}
		
		if (!window.Raphael) {
			jSE.chart = emptyFN;
		}
		
		//jS.log('Startup');
		
		$window
			.resize(function() {
				if (jS && !jS.busy) { //We check because jS might have been killed
					s.width = s.parent.width();
					s.height = s.parent.height();
					jS.sheetSyncSize();
				}
			});
		
		
		if ($.sheet.fn) { //If the new calculations engine is alive, fill it too, we will remove above when no longer needed.
			//Extend the calculation engine plugins
			$.sheet.fn = $.extend($.sheet.fn, s.formulaFunctions);
		
			//Extend the calculation engine with advanced functions
			if ($.sheet.advancedfn) {
				$.sheet.fn = $.extend($.sheet.fn, $.sheet.advancedfn);
			}
		
			//Extend the calculation engine with finance functions
			if ($.sheet.financefn) {
				$.sheet.fn = $.extend($.sheet.fn, $.sheet.financefn);
			}
		}
		
		if (!s.alertFormulaErrors) {
			jS.alertFormulaError = emptyFN;
		}

		if (!s.allowCellsLineBreaks) {
			origParent.addClass('noBreak');
		}
		
		jS.s = s;
		jS.openSheet(jS.buildSheet(), s.forceColWidthsOnStartup);
		
		return jS;
	},
	makeTable : {
		xml: function (data) { /* creates a table from xml, note: will not accept CDATA tags
								data: object, xml object;
								*/
			var tables = jQuery('<div />');
		
			jQuery(data).find('document').each(function(i) { //document
				var table = jQuery('<table />');
				var tableWidth = 0;
				var colgroup = jQuery('<colgroup />').appendTo(table);
				var tbody = jQuery('<tbody />');
			
				var metaData = jQuery(this).find('metadata');
				var columnCount = metaData.find('columns').text();
				var rowCount = metaData.find('rows').text();
				var title = jQuery(this).attr('title');
				var data = jQuery(this).find('data');
				var col_widths = metaData.find('col_widths').children();
				
				//go ahead and make the cols for colgroup
				for (var i = 0; i < parseInt(jQuery.trim(columnCount)); i++) {
					var w = parseInt(col_widths.eq(i).text().replace('px', ''));
					w = (w ? w : 120); //if width doesn't exist, grab default
					tableWidth += w;
					colgroup.append('<col width="' + w + 'px" style="width: ' + w + 'px;" />');
				}
				
				table
					.width(tableWidth)
					.attr('title', title);
				
				for (var i = 0; i < rowCount; i++) { //rows
					var tds = data.find('r' + i);
					var height = (data.attr('h') + '').replace('px', '');
					height = parseInt(height);
					
					var thisRow = jQuery('<tr height="' + (height ? height : 18) + 'px" />');
					
					for (var j = 0; j < columnCount; j++) { //cols, they need to be counted because we don't send them all on export
						var newTd = '<td />'; //we give td a default empty td
						var td = tds.find('c' + j);
						
						if (td) {
							var text = td.text() + '';
							var cl = td.attr('class');
							var style = td.attr('style');
							var colSpan = td.attr('colspan');

							
							var formula = '';
							if (text.charAt(0) == '=') {
								formula = ' formula="' + text + '"';
							}
							
							newTd = '<td' + formula + 
								(style ? ' style=\"' + style + '\"' : '') + 
								(cl ? ' class=\"' + cl + '\"' : '') +
								(colSpan ? ' colspan=\"' + colSpan + '\"' : '') +
								(height ? ' height=\"' + height + 'px\"' : '') +
							'>' + text + '</td>';
						}
						thisRow.append(newTd);
					}	
					tbody.append(thisRow);
				}
				table
					.append(tbody)
					.appendTo(tables);
			});
			
			return tables.children();
		},
		json: function(data, makeEval) { /* creates a sheet from json data, for format see top
											data: json;
											makeEval: bool, if true evals json;
										*/
			sheet = (makeEval == true ? eval('(' + data + ')') : data);
			
			var tables = jQuery('<div />');
			
			sheet = (jQuery.isArray(sheet) ? sheet : [sheet]);
			
			for (var i = 0; i < sheet.length; i++) {
				var colCount = parseInt(sheet[i].metadata.columns);
				var rowCount = parseInt(sheet[i].metadata.rows);
				title = sheet[i].metadata.title;
				title = (title ? title : "Spreadsheet " + i);
			
				var table = jQuery("<table />");
				var tableWidth = 0;
				var colgroup = jQuery('<colgroup />').appendTo(table);
				var tbody = jQuery('<tbody />');
				
				//go ahead and make the cols for colgroup
				if (sheet[i]['metadata']['col_widths']) {
					for (var x = 0; x < colCount; x++) {
						var w = 120;
						if (sheet[i]['metadata']['col_widths']['c' + x]) {
							var newW = parseInt(sheet[i]['metadata']['col_widths']['c' + x].replace('px', ''));
							w = (newW ? newW : 120); //if width doesn't exist, grab default
							tableWidth += w;
						}
						colgroup.append('<col width="' + w + 'px" style="width: ' + w + 'px;" />');
					}
				}
				
				table
					.attr('title', title)
					.width(tableWidth);
				
				for (var x = 0; x < rowCount; x++) { //tr
					var tr = jQuery('<tr />').appendTo(table);
					tr.attr('height', (sheet[i]['data']['r' + x].h ? sheet[i]['data']['r' + x].h : 18));
					
					for (var y = 0; y < colCount; y++) { //td
						var cell = sheet[i]['data']['r' + x]['c' + y];
						var cur_val;
						var colSpan;
						var style;
						var cl;
						
						if (cell) {
							cur_val = cell.value + '';
							colSpan = cell.colSpan + '';
							style = cell.style + '';
							cl = cell.cl + '';
						}

						var cur_td = jQuery('<td' + 
								(style ? ' style=\"' + style + '\"' : '' ) + 
								(cl ? ' class=\"' + cl + '\"' : '' ) + 
								(colSpan ? ' colspan=\"' + colSpan + '\"' : '' ) + 
							' />');
						try {
							if(typeof(cur_val) == "number") {
								cur_td.html(cur_val);
							} else {
								if (cur_val.charAt(0) == '=') {
									cur_td.attr("formula", cur_val);
								} else {
									cur_td.html(cur_val);
								}
							}
						} catch (e) {}
					
						tr.append(cur_td);

					}
				}
				
				tables.append(table);
			}
			return tables.children();
		},
		fromSize: function(size, h, w) { /* creates a spreadsheet object from a size given 
											size: string, example "10x100" which means 10 columns by 100 rows;
											h: int, height for each new row;
											w: int, width of each new column;
										*/
			if (!size) {
				size = "5x10";
			}
			size = size.toLowerCase().split('x');

			var columnsCount = parseInt(size[0]);
			var rowsCount = parseInt(size[1]);
			
			//Create elements before loop to make it faster.
			var newSheet = jQuery('<table />');
			var standardTd = '<td></td>';
			var tds = '';
			
			//Using -- is many times faster than ++
			for (var i = columnsCount; i >= 1; i--) {
				tds += standardTd;
			}

			var standardTr = '<tr' + (h ? ' height="' + h + 'px" style="height: ' + h + 'px;"' : '') + '>' + tds + '</tr>';
			var trs = '';
			for (var i = rowsCount; i >= 1; i--) {
				trs += standardTr;
			}
			
			newSheet.html('<tbody>' + trs + '</tbody>');
			
			if (w) {
				newSheet.width(columnsCount * w);
			}
			
			return newSheet;
		}
	},
	killAll: function() { /* removes all sheets */
		if (jQuery.sheet) {
			if (jQuery.sheet.instance) {
				for (var i = 0; i < jQuery.sheet.instance.length; i++) {
					if (jQuery.sheet.instance[i]) {
						if (jQuery.sheet.instance[i].kill) {
							jQuery.sheet.instance[i].kill();
						}
					}
				}
			}
		}
	},
	paneScrollLocker: function(e, jS) { //This can be used with setting fnPaneScroll to lock all loaded sheets together when scrolling, useful in history viewing
		var pane = jS.obj.pane();
		
		jQuery(jQuery.sheet.instance).each(function(i) {
			if (jS.I == i) return;
			
			this.obj.pane()
				.scrollLeft(pane.scrollLeft())
				.scrollTop(pane.scrollTop());
		});
	},
	switchSheetLocker: function(e, jS) { //This can be used with event switchSheet to locks sheets together when switching, useful in history viewing
		jQuery(jQuery.sheet.instance).each(function(i) {
			if (jS.I == i) return;
			
			this.setActiveSheet(jS.i);
		});
	},
	I: function() {
		var I = 0;
		if ( this.instance ) {
			I = (this.instance.length === 0 ? 0 : this.instance.length - 1); //we use length here because we havent yet created sheet, it will append 1 to this number thus making this the effective instance number
		} else {
			this.instance = [];
		}
		return I;
	},
	getScrollBarSize: function() {
		var inner = $('<p></p>').css({
			width:'100%',
			height:'100%'
		});
		var outer = $('<div></div>').css({
			position:'absolute',
			width:'100px',
			height:'100px',
			top:'0',
			left:'0',
			visibility:'hidden',
			overflow:'hidden'
		}).append(inner);

		jQuery(document.body).append(outer);

		var w1 = inner.width(),
			h1 = inner.height();
		
		outer.css('overflow','scroll');
		
		var w2 = inner.width(),
			h2 = inner.height();
			
		if (w1 == w2 && outer[0].clientWidth) {
			w2 = outer[0].clientWidth;
		}
		if (h1 == h2 && outer[0].clientHeight) {
			h2 = outer[0].clientHeight;
		}

		outer.detach();

		return {
			width: w1 - w2,
			height: h1 - h2
		};
	}
};

var jSE = jQuery.sheet.engine = { //Formula Engine
	calc: function(tableI, spreadsheets, ignite, freshCalc) { //spreadsheets are array, [spreadsheet][row][cell], like A1 = o[0][0][0];
		for (var j = 1; j < spreadsheets.length; j++) {
			for (var k = 1; k < spreadsheets[j].length; k++) {
				spreadsheets[j][k].calcCount = 0;
			}
		}
		
		for (var j = 1; j < spreadsheets.length; j++) {
			for (var k = 1; k < spreadsheets[j].length; k++) {
				ignite(tableI, j, k);
			}
		}
	},
	parseLocation: function(locStr) { // With input of "A1", "B4", "F20", will return {row: 0,col: 0}, {row: 3,col: 1}, {row: 19,col: 5}.
		for (var firstNum = 0; firstNum < locStr.length; firstNum++) {
			if (locStr.charCodeAt(firstNum) <= 57) {// 57 == '9'
				break;
			}
		}
		return {
			row: parseInt(locStr.substring(firstNum)), 
			col: jSE.columnLabelIndex(locStr.substring(0, firstNum))
		};
	},
	parseSheetLocation: function(locStr) {
		return ((locStr + '').replace('SHEET','') * 1) - 1;
	},
	parseCellName: function(col, row){
		return jSE.columnLabelString(col) + (row);
	},
	labels: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	columnLabelIndex: function(str) {
		// Converts A to 1, B to 2, Z to 26, AA to 27

		var num = 0,
			str = str.toUpperCase();

		for (var i = 0; i < str.length; i++) {
			var digit = this.labels.indexOf(str[i]);
			num = (num * 26) + digit;
		}
		return (num >= 0 ? num : 0) + 1;
	},
	indexes: [],
	columnLabelString: function(index) {//1 = A, 2 = B
		if (!this.indexes.length) { //cache the indexes to save on processing
			var s = '', i, j, k, l;
			i = j = k = -1;
			for (l = 1; l < 16385; ++l) {
				s = '';
				++k;
				if (k == 26) {
					k = 0;
					++j;
					if (j == 26) {
						j = 0;
						++i;
					}
				}
				if (i >= 0) s += this.labels[i];
				if (j >= 0) s += this.labels[j];
				if (k >= 0) s += this.labels[k];
				this.indexes[l] = s;
			}
		}

		return this.indexes[index];
	},
	regEx: {
		n: 			/[\$,\s]/g,
		cell: 			/\$?([a-zA-Z]+)\$?([0-9]+)/gi, //a1
		range: 			/\$?([a-zA-Z]+)\$?([0-9]+):\$?([a-zA-Z]+)\$?([0-9]+)/gi, //a1:a4
		remoteCell:		/\$?(SHEET+)\$?([0-9]+)[:!]\$?([a-zA-Z]+)\$?([0-9]+)/gi, //sheet1:a1
		remoteCellRange: 	/\$?(SHEET+)\$?([0-9]+)[:!]\$?([a-zA-Z]+)\$?([0-9]+):\$?([a-zA-Z]+)\$?([0-9]+)/gi, //sheet1:a1:b4
		sheet:			/SHEET/i,
		amp: 			/&/g,
		gt: 			/</g,
		lt: 			/>/g,
		nbsp: 			/&nbsp;/g
	},
	chart: function(o) { /* creates a chart for use inside of a cell
													piggybacks RaphealJS
							options:
								type

								data
								legend
								title
								x {data, legend}

								y {data, legend}
								owner
												*/
		var jS = this.jS,
			owner = this;
		
		function sanitize(v, toNum) {
			if (!v) {
				if (toNum) {
					v = 0;
				} else {
					v = "";
				}
			} else {
				if (toNum) {
					v = arrHelpers.toNumbers(v);
				} else {
					v = arrHelpers.flatten(v);
				}
			}
			return v;
		}

		o = jQuery.extend({
			x: { legend: "", data: [0]},
			y: { legend: "", data: [0]},
			title: "",
			data: [0],
			legend: "",
			cell: jQuery(jS.getTd(this.sheet, this.row, this.col)),
			chart: jQuery('<div class="' + jS.cl.chart + '" />')
				.mousedown(function() {
					o.cell.mousedown();
				}),
			gR: {}
		}, o);
	
		o.data = sanitize(o.data, true);
		o.x.data = sanitize(o.x.data, true);
		o.y.data = sanitize(o.y.data, true);
		o.legend = sanitize(o.legend);
		o.x.legend = sanitize(o.x.legend);
		o.y.legend = sanitize(o.y.legend);
	
		o.legend = (o.legend ? o.legend : o.data);

		this.s.origParent.one('calculation', function() {
			var width = o.chart.width();
			var height = o.chart.height();
			var r = Raphael(o.chart[0]);			
			if (o.title) r.text(width / 2, 10, o.title).attr({"font-size": 20});
			switch (o.type) {
			case "bar":
				o.gR = r.barchart(width / 8, height / 8, width * 0.8, height * 0.8, o.data, o.legend)
					.hover(function () {
						this.flag = r.popup(
							this.bar.x,
							this.bar.y,
							this.bar.value || "0"
						).insertBefore(this);
					},function () {
						this.flag.animate({
							opacity: 0
							},300, 

							function () {
								this.remove();
								}
							);
					});
				break;
			case "hbar":
				o.gR = r.hbarchart(width / 8, height / 8, width * 0.8, height * 0.8, o.data, o.legend)
					.hover(function () {
						this.flag = r.popup(this.bar.x, this.bar.y, this.bar.value || "0").insertBefore(this);
					},function () {
						this.flag.animate({
							opacity: 0
							},300, 
							function () {
								this.remove();
								}
							);
					});
				break;
			case "line":
				o.gR = r.linechart(width / 8, height / 8, width * 0.8, height * 0.8, o.x.data, o.y.data, {
					nostroke: false, 
					axis: "0 0 1 1", 
					symbol: "circle", 
					smooth: true
				})
				.hoverColumn(function () {
					this.tags = r.set();
					if (this.symbols.length) {
						for (var i = 0, ii = this.y.length; i < ii; i++) {
							this.tags.push(
								r
									.tag(this.x, this.y[i], this.values[i], 160, 10)
									.insertBefore(this)
									.attr([{ fill: "#fff" }, { fill: this.symbols[i].attr("fill") }])
							);
						}
					}
				}, function () {
					this.tags && this.tags.remove();
				});

				break;
			case "pie":
				o.gR = r.piechart(width / 2, height / 2, (width < height ? width : height) / 2, o.data, {legend: o.legend})
					.hover(function () {
						this.sector.stop();
						this.sector.scale(1.1, 1.1, this.cx, this.cy);

						if (this.label) {
							this.label[0].stop();
							this.label[0].attr({ r: 7.5 });
							this.label[1].attr({ "font-weight": 800 });
						}
					}, function () {
						this.sector.animate({ transform: 's1 1 ' + this.cx + ' ' + this.cy }, 500, "bounce");

						if (this.label) {
							this.label[0].animate({ r: 5 }, 500, "bounce");
							this.label[1].attr({ "font-weight": 400 });
						}
					});
				break;
			case "dot":
				o.gR = r.dotchart(width / 8, height / 8, width * 0.8, height * 0.8, o.x.data, o.y.data, o.data, {
					symbol: "o",
					max: 10,
					heat: true,
					axis: "0 0 1 1",
					axisxstep: o.x.data.length - 1,
					axisystep: o.y.data.length - 1,
					axisxlabels: (o.x.legend ? o.x.legend : o.x.data),
					axisylabels: (o.y.legend ? o.y.legend : o.y.data),
					axisxtype: " ",
					axisytype: " "
				})
					.hover(function () {
						this.marker = this.marker || r.tag(this.x, this.y, this.value, 0, this.r + 2).insertBefore(this);
						this.marker.show();
					}, function () {
						this.marker && this.marker.hide();
					});

				break;
			}

			o.gR
				.mousedown(function() {
					o.cell.mousedown().mouseup();
				});

			o.chart.mousemove(function() {
				o.cell.mousemove();
				return false;
			});

		});
		
		return o.chart;
	}
};

var jFN = jQuery.sheet.fn = {//fn = standard functions used in cells
	//information functions
	ISNUMBER: function(v) {
		if (!isNaN(v)) {
			return jFN.TRUE();
		}
		return jFN.FALSE();
	},
	N: function(v) {
		if (v == null) {return 0;}
		if (v instanceof Date) {return v.getTime();}
		if (typeof(v) == 'object') {v = v.toString();}
		if (typeof(v) == 'string') {v = parseFloat(v.replace(jSE.regEx.n, ''));}
		if (isNaN(v)) {return 0;}
		if (typeof(v) == 'number') {return v;}
		if (v == true) {return 1;}
		return 0;
	},
	VERSION: function() {
		return this.jS.version;
	},
	//math functions
	ABS: function(v) {
		return Math.abs(jFN.N(v));
	},
	CEILING: 	function(value, significance) {
		significance = significance || 1;
		return (parseInt(value / significance) * significance) + significance;
	},
	EVEN: function(v) {
		v = Math.round(v);
		var even = (v % 2 == 0);
		if (!even) {
			if (v > 0) {
				v++;
			} else {
				v--;
			}
		}
		return v;
	},
	EXP: function(v) {
		return Math.exp(v);
	},
	FLOOR: function(value, significance) {
		significance = significance || 1;
		if (
			(value < 0 && significance > 0 ) ||
			(value > 0 && significance < 0 )) {
			return {
				value: 0,
				html: "#NUM"
			};
		}
		if (value >= 0) {
			return Math.floor(value / significance) * significance;
		} else {
			return Math.ceil(value / significance) * significance;
		}
	},
	INT: 		function(v) { return Math.floor(jFN.N(v)); },
	LN: function(v) {
		return Math.log(v);
	},
	LOG: function(v,n) {
		n = n || 10;
		return Math.log(v) / Math.log(n);
	},
	LOG10: function(v) {
		return jFN.LOG(v);
	},
	MOD: function(x, y) {
		var modulus = x % y;
		if (y < 0) {
			modulus *= -1;
		}
		return modulus;
	},
	ODD: function(v) {
		var gTZ = false;
		if (v > 0) {
			v = Math.floor(Math.round(v));
			gTZ = true;
		} else {
			v = Math.ceil(v);
		}

		var vTemp = Math.abs(v);
		if ((vTemp % 2) == 0) { //even
			vTemp++;
		}

		if (gTZ) {
			return vTemp;
		} else {
			return -vTemp;
		}
	},
	PI: function() { return Math.PI; },
	POWER: function(x, y) {
		return Math.pow(x, y);
	},
	SQRT: function(v) {
		return Math.sqrt(v);
	},
	RAND: 		function() { return Math.random(); },
	RND: 		function() { return Math.random(); },
	ROUND: 		function(v, decimals) {
		return jFN.FIXED(v, (decimals ? decimals : 0), false);
	},
	ROUNDDOWN: function(v, decimals) {
		var neg = (v < 0);
		v = Math.abs(v);
		decimals = decimals || 0;
		v = Math.floor(v * Math.pow(10, decimals)) / Math.pow(10, decimals);
		return (neg ? -v : v);
	},
	ROUNDUP: function(v, decimals) {
		var neg = (v < 0);
		v = Math.abs(v);
		decimals = decimals || 0;
		v = Math.ceil(v * Math.pow(10, decimals)) / Math.pow(10, decimals);
		return (neg ? -v : v);
	},
	SUM: 		function() {
		var sum = 0;
		var v = arrHelpers.toNumbers(arguments);

		for(i in v) {
			sum += v[i] * 1;
		}
		return sum;
	},
	TRUNC: function(number, digits) {
		digits = digits || 0;
		number = number + '';

		if (digits == 0) {
			return number.split('.').shift();
		}

		if (number.match('.')) {
			if (digits == 1) {
				number = number.substr(0,number.length - 1);
			} else if (digits == -1) {
				number = number.split('.').shift();
				number = number.substr(0,number.length - 1) + '0';
			}
		}

		return number;
	},
	//statistical functions
	AVERAGE:	function(v) {
		return jFN.SUM(arguments) / jFN.COUNT(arguments);
	},
	AVG: 		function(v) {
		return jFN.AVERAGE(v);
	},
	COUNT: 		function() {
		var count = 0;
		var v = arrHelpers.toNumbers(arguments);

		for (i in v) {
			if (v[i] != null) count++;
		}

		return count;
	},
	COUNTA:		function() {
		var count = 0;
		var v = arrHelpers.flatten(arguments);

		for (i in v) {
			if (v[i]) {
				count++;
			}
		}

		return count;
	},
	MAX: 		function() {
		var v = arrHelpers.toNumbers(arguments);
		var max = v[0];

		for(i in v) {
			max = (v[i] > max ? v[i]: max);
		}
		return max;
	},
	MIN: 		function() {
		var v = arrHelpers.toNumbers(arguments);
		var min = v[0];

		for(i in v) {
			min = (v[i] < min ? v[i]: min);
		}
		return min;
	},
	//string functions
	ASC: function(v) {
		return v.charCodeAt(0);
	},
	CHAR: function(v) {
		return String.fromCharCode(v);
	},
	CLEAN: function(v) {
		var exp = new RegExp("[\cG\x1B\cL\cJ\cM\cI\cK\x07\x1B\f\n\r\t\v]","g");
		return v.replace(exp, '');
	},
	CODE: function(v) {
		return jFN.ASC(v);
	},
	CONCATENATE: function() {
		var arr = arrHelpers.flatten(arguments),
			result = '';
		jQuery.each(arr, function (i) {
			result += arr[i];
		});
		return {
			value: result,
			html: result
		};
	},
	DOLLAR: function(v, decimals, symbol) {
		if (decimals == null) {
			decimals = 2;
		}

		if (symbol == null) {
			symbol = '$';
		}

		var r = jFN.FIXED(v, decimals, false),
			html;
		if (v >= 0) {
			html = symbol + r;
		} else {
			html = '-' + symbol + r.slice(1);
		}
		return {
			value: v,
			html: html
		};
	},
	FIXED: function(v, decimals, noCommas) {
		if (decimals == null) {
			decimals = 2;
		}
		var x = Math.pow(10, decimals),
			n = String(Math.round(jFN.N(v) * x) / x),
			p = n.indexOf('.'),
			commaPreDecimal = (noCommas ? '' : ''),
			commaPostDecimal = (noCommas ? '' : ',');

		if (p < 0) {
			p = n.length;
			n += '.';
		}
		for (var i = n.length - p - 1; i < decimals; i++) {
			n += '0';
		}

		var arr	= n.replace('-', '').split('.');
		var result = [];
		var first  = true;
		while (arr[0].length > 0) { // LHS of decimal point.
			if (!first) {
				result.unshift(commaPostDecimal);
			}
			result.unshift(arr[0].slice(-3));
			arr[0] = arr[0].slice(0, -3);
			first = false;
		}
		if (decimals > 0) {
			result.push('.');
			var first = true;
			while (arr[1].length > 0) { // RHS of decimal point.
				if (!first) {
					result.push(commaPreDecimal);
				}
				result.push(arr[1].slice(0, 3));
				arr[1] = arr[1].slice(3);
				first = false;
			}
		}
		if (v < 0) {
			return '-' + result.join('');
		}
		return result.join('');
	},
	LEFT: function(v, numberOfChars) {
		numberOfChars = numberOfChars || 1;
		return v.substring(0, numberOfChars);
	},
	LEN: function(v) {
		if (!v) {
			return 0;
		}
		return v.length;
	},
	LOWER: function(v) {
		return v.toLowerCase();
	},
	MID: function(v, start, end) {
		if (!v || !start || !end) {
			return this.error({error: 'ERROR'});
		}
		return v.substring(start - 1, end + start - 1);
	},
	REPLACE: function(oldText, start, numberOfChars, newText) {
		if (!oldText || !start || !numberOfChars || !newText) {
			return this.error({error: 'ERROR'});
		}
		var result = oldText.split('');
		result.splice(start - 1, numberOfChars);
		result.splice(start - 1, 0, newText);
		return result.join('');
	},
	REPT: function(v, times) {
		var result = '';
		for(var i = 0;i < times; i++) {
			result += v;
		}
		return result;
	},
	RIGHT: function(v, numberOfChars) {
		numberOfChars = numberOfChars || 1;
		return v.substring(v.length - numberOfChars, v.length);
	},
	SEARCH: function(find, body, start) {
		start = start || 0;
		if (start) {
			body = body.split('');
			body.splice(0, start - 1);
			body = body.join('');
		}
		var i = body.search(find);

		if (i < 0) {
			return this.error({error: '#VALUE!'});
		}

		return start + (start ? 0 : 1) + i;
	},
	SUBSTITUTE: function(text, oldText, newText, nthAppearance) {
		nthAppearance = nthAppearance || 0;
		oldText = new RegExp(oldText, 'g');
		var i = 1;
		text = text.replace(oldText, function(match, contents, offset, s) {
			var result = match;
			if (nthAppearance) {
				if (i >= nthAppearance) {
					result = newText;
				}
			} else {
				result = newText;
			}

			i++;
			return result;
		});
		return text;
	},
	TEXT: function() {
		return this.error({error: 'Not Yet Implemented'});
	},
	UPPER: function(v) {
		return v.toUpperCase();
	},
	VALUE: function(v) {
		if (jQuery.isNumeric(v)) {
			return v *= 1;
		} else {
			return this.error({error: "#VALUE!"})
		}
	},
	//date/time functions
	NOW: 		function() {
		var today = new Date();
		return {
			value: today,
			html: dates.toString(today)
		};
	},
	TODAY: 		function() {
		var today = new Date();
		return {
			value: dates.toCentury(today) - 1,
			html: dates.toString(today, 'd')
		};
	},
	WEEKENDING: function(weeksBack) {
		var date = new Date();
		date = new Date( 
			date.getFullYear(), 
			date.getMonth(), 
			date.getDate() + 5 - date.getDay() - ((weeksBack || 0) * 7)
		);
		
		return {
			value: date,
			html: dates.toString(date, 'd')
		};
	},
	WEEKDAY: 	function(date, returnValue) {
		date = dates.get(date);
		var day = date.getDay();
		
		returnValue = (returnValue ? returnValue : 1);
		switch (returnValue) {
			case 3:
				switch (day) {
					case 0:return 7;
					case 1:return 1;
					case 2:return 2;
					case 3:return 3;
					case 4:return 4;
					case 5:return 5;
					case 6:return 6;
				}
				break;
			case 2:
				switch (day) {
					case 0:return 6;
					case 1:return 0;
					case 2:return 1;
					case 3:return 2;
					case 4:return 3;
					case 5:return 4;
					case 6:return 5;
				}
				break;
			case 1:
				day++;
				break;
		}
		
		return day;
	},
	WEEKNUM: function(date) {//TODO: implement week starting
		date = dates.get(date);
		return dates.week(date) + 1;
	},
	YEAR: function(date) {
		date = dates.get(date);
		return date.getFullYear();
	},
	DAYSFROM: 	function(year, month, day) { 
		return Math.floor( (new Date() - new Date (year, (month - 1), day)) / dates.dayDiv);
	},
	DAYS: function(v1, v2) {
		var date1 = dates.get(v1);
		var date2 = dates.get(v2);
		var ONE_DAY = 1000 * 60 * 60 * 24;
		return Math.round(Math.abs(date1.getTime() - date2.getTime()) / ONE_DAY);
	},
	DAY: function(date) {
		date = dates.get(date);
		return date.getDate();
	},
	DAYS360: function(date1, date2, method) {
		date1 = dates.get(date1);
		date2 = dates.get(date2);

		var startDate = date1.getDate(),
			endDate = date2.getDate(),
			startIsLastDay = dates.isLastDayOfMonth(date1),
			endIsLastDay = dates.isLastDayOfMonth(date2),
			monthCount = dates.diffMonths(date1, date2);

		if (method) {//Euro method
			startDate = Math.min(startDate, 30);
			endDate = Math.min(endDate, 30);
		} else { //Standard
			if (startIsLastDay) {
				startDate = 30;
			}
			if (endIsLastDay) {
				if (startDate < 30) {
					monthCount++;
					endDate = 1;
				} else {
					endDate = 30;
				}
			}
		}

		return (monthCount * 30) + (endDate - startDate);
	},
	DATE: function(year, month, day) {
		var date = new Date(year, month - 1, day);
		return {
			html: dates.toString(date, 'd'),
			value: dates.toCentury(date)
		};
	},
	DATEVALUE: function(date) {
		date = dates.get(date);
		return {
			html: dates.toString(date, 'd'),
			value: dates.toCentury(date)
		}
	},
	EDATE: function(date, months) {
		date = dates.get(date),
		date.setMonth(date.getMonth() + months);
		return {
			html: dates.toString(date, 'd'),
			value: dates.toCentury(date)
		};
	},
	EOMONTH: function(date, months) {
		date = dates.get(date),
		date.setMonth(date.getMonth() + months + 1);
		date = new Date(date.getFullYear(), date.getMonth(), 0);
		return {
			html: dates.toString(date, 'd'),
			value: dates.toCentury(date)
		};
	},
	HOUR: function(time) {
		return times.fromMath(time).hour;
	},
	MINUTE: function(time) {
		return times.fromMath(time).minute;
	},
	MONTH: function(date) {
		date = dates.get(date);
		return date.getMonth() + 1;
	},
	SECOND: function(time) {
		return times.fromMath(time).second;
	},
	TIME: function(hour, minute, second) {
		var date = new Date();
			second = (second ? second : 0),
			minute = (minute ? minute : 0),
			hour = (hour ? hour : 0);

		if (second && second > 60) {
			var minuteFromSecond = (((second / 60) + '').split('.')[0]) * 1;
			second = second - (minuteFromSecond * 60);
			minute += minuteFromSecond;
		}

		if (minute && minute > 60) {
			var hourFromMinute = (((minute / 60) + '').split('.')[0]) * 1;
			minute = minute - (hourFromMinute * 60);
			hour += hourFromMinute;
		}

		var millisecond = (hour * 60 * 60 * 1000) + (minute * 60 * 1000) + (second * 1000);

		return millisecond / dates.dayDiv;
	},
	TIMEVALUE: function (time) {
		if (!isNaN(time)) {
			return time;
		}
		if (/([0]?[1-9]|1[0-2])[:][0-5][0-9]([:][0-5][0-9])?[ ]?(AM|am|aM|Am|PM|pm|pM|Pm)/.test(time)) {
			return times.fromString(time, true);
		} else if (/([0]?[0-9]|1[0-9]|2[0-3])[:][0-5][0-9]([:][0-5][0-9])?/.test(time)) {
			return times.fromString(time);
		}
		return 0;
	},
	WORKDAY: function(startDate, days, holidays) {
		var workDays = {1:true, 2:true, 3:true, 4:true, 5:true},
			startDate = dates.get(startDate),
			days = (days && !isNaN(days) ? days : 0),
			dayCounter = 0,
			daysSoFar = 0,
			workingDate = new Date();

		workingDate = startDate;

		if (holidays) {
			if (!jQuery.isArray(holidays)) {
				holidays = [holidays];
			}
			holidays = arrHelpers.flatten(holidays);
			var holidaysTemp = {};
			jQuery.each(holidays, function(i) {
				if (holidays[i]) {
					holidaysTemp[dates.toString(dates.get(holidays[i]), 'd')] = true;
				}
			});
			holidays = holidaysTemp;
		} else {
			holidays = {};
		}

		while( daysSoFar < days ){
			workingDate = new Date(workingDate.setDate(workingDate.getDate() + 1));
			if( workDays[workingDate.getDay()] ){
				if (!holidays[dates.toString(workingDate, 'd')]) {
					daysSoFar++;
				}
			}
			dayCounter++;
		}

		return {
			html: dates.toString(workingDate, 'd'),
			value: dates.toCentury(workingDate)
		};
	},
	YEARFRAC: function(startDate, endDate, basis) {
		startDate = dates.get(startDate);
		endDate = dates.get(endDate);

		if (!startDate || !endDate) {
			return this.error({error: '#VALUE!'});
		}

		basis = (basis ? basis : 0);

		var numerator = dates.diff( startDate , endDate , basis );
		var denom = dates.calcAnnualBasis( startDate , endDate , basis );
		return numerator / denom;
	},
	//logical functions
	AND: function() {
		var args = arguments,
			res;
		jQuery.each(args, function(i) {
			if (args[i] !== true && res == undefined) {
				res = jFN.FALSE();
			}
		});
		if (!res) {
			res = jFN.TRUE();
		}
		return res;
	},
	FALSE: 		function() {
		return {
			value: false,
			html: 'FALSE'
		};
	},
	IF: function(expression, resultTrue, resultFalse){
		var value, html;
		if (expression) {
			value = resultTrue;
			html = this.html[1];
		} else {
			value = resultFalse;
			html = this.html[2];
		}

		return {
			value: value,
			html: html
		};
	},
	NOT: function(v) {
		if (v) {
			return jFN.FALSE();
		}
		return jFN.TRUE();
	},
	OR: function() {
		var args = arguments,
			or;
		jQuery.each(args, function(i) {
			if (args[i] === true && or == undefined) {
				or = jFN.TRUE();
			}
		});
		if (!or) {
			or = jFN.FALSE();
		}
		return or;
	},
	TRUE: 		function() {
		return {
			value: true,
			html: 'TRUE'
		};
	},
	//html function
	IMG: function(v) {
		return jQuery('<img />')
			.attr('src', v);
	},
	GETHTML: function() {
		return this.html[0];
	},
	TRIM: function(v) { 
		if (typeof(v) == 'string') {
			v = jQuery.trim(v);
		}
		return v;
	},
	HYPERLINK: function(link, name) {
		name = (name ? name : 'LINK');
		return jQuery('<a href="' + link + '" target="_new">' + name + '</a>');
	},
	DROPDOWN: function() {
		var cell = this.obj,
			jS = this.jS,
			v = arrHelpers.flatten(arguments),
			html;
		v = arrHelpers.unique(v);
		
		if (this.s.editable) {
			
			var id = "dropdown" + this.sheet + "_" + this.row + "_" + this.col + '_' + this.jS.I;
			html = jQuery('<select style="width: 100%;" name="' + id + '" id="' + id + '" />')
				.mousedown(function() {
					jS.cellEdit(jQuery(this).parent(), null, true);
				});
		
			for (var i = 0; i < (v.length <= 50 ? v.length : 50); i++) {
				if (v[i]) {
					html.append('<option value="' + v[i] + '">' + v[i] + '</option>');
				}
			}
			
			//here we find out if it is on initial calc, if it is, the value we an use to set the dropdown
			if (jQuery(jS.getTd(this.sheet, this.row, this.col)).find('#' + id).length == 0) {
				cell.value = jS.spreadsheets[this.sheet][this.row][this.col].value;
			}
			
			jS.s.origParent.one('calculation', function() {
				jQuery('#' + id)
					.change(function() {
						cell.value = jQuery(this).val();
						jS.calc();
					});
			});
					
			html.val(cell.value);
		}
		return {value: cell.value, html: html};
	},
	RADIO: function() {
		var cell = this.obj,
			jS = this.jS,
			v = arrHelpers.flatten(arguments),
			html;
		v = arrHelpers.unique(v);
		

		if (this.s.editable) {
			var id = "radio" + this.sheet + "_" + this.row + "_" + this.col + '_' + this.jS.I;
			
			html = jQuery('<span />')
				.mousedown(function() {
					jS.cellEdit(jQuery(this).parent());
				});
			
			for (var i = 0; i < (v.length <= 25 ? v.length : 25); i++) {
				if (v[i]) {
					var input = jQuery('<input type="radio" name="' + id + '" class="' + id + '" />')
						.val(v[i]);
					
					if (v[i] == cell.value) {
						input.attr('checked', 'true');
					}
					
					html
						.append(input)
						.append('<span>' + v[i] + '</span>')
						.append('<br />');
					
					jS.s.origParent.one('calculation', function() {
						jQuery('.' + id)
							.change(function() {
								cell.value = jQuery(this).val();
								jS.calc();
							});
					});
				}
			}

			//here we find out if it is on initial calc, if it is, the value we an use to set the radio
			if (jQuery(jS.getTd(this.sheet, this.row, this.col)).find('.' + id).length == 0) {
				cell.value = jS.spreadsheets[this.sheet][this.row][this.col].value;
			}
		}
		return {value: cell.value, html: html};
	},
	CHECKBOX: function(v) {
		if (jQuery.isArray(v)) v = v[0];
		
		var cell = this.obj,
			jS = this.jS,
			html;
		
		if (this.s.editable) {
			
			var id = "checkbox" + this.sheet + "_" + this.row + "_" + this.col + '_' + this.jS.I,
				checkbox = jQuery('<input type="checkbox" name="' + id + '" class="' + id + '" />')
					.val(v);

			html = jQuery('<span />')
				.append(checkbox)
				.append('<span>' + v + '</span><br />')
				.mousedown(function() {
					jS.cellEdit(jQuery(this).parent());
				});
			
			if (v == cell.value) {
				checkbox.attr('checked', true);
			}
			
			var td = jQuery(jS.getTd(this.sheet, this.row, this.col));
			if (!td.children().length) {
				if (td.html() == cell.value) {
					checkbox.attr('checked', true);
				}
			}
			
			jS.s.origParent.one('calculation', function() {
				jQuery('.' + id)
					.change(function() {
						cell.value = (jQuery(this).is(':checked') ? jQuery(this).val() : '');
						jS.calc();
					});
			});
			
			//here we find out if it is on initial calc, if it is, the value we an use to set the checkbox
			if (jQuery(jS.getTd(this.sheet, this.row, this.col)).find('.' + id).length == 0) {
				var checked = jS.spreadsheets[this.sheet][this.row][this.col].value;
				cell.value = (checked == 'true' || checked == true ? v : '');
			}
		}
		return {value: cell.value, html: html};
	},
	BARCHART:	function(values, legend, title) {
		return {
			value: '',
			html: jSE.chart.apply(this, [{
				type: 'bar',
				data: values,
				legend: legend,
				title: title
			}])
		};
	},
	HBARCHART:	function(values, legend, title) {
		return {
			value: '',
			html:jSE.chart.apply(this, [{
				type: 'hbar',
				data: values,
				legend: legend,
				title: title
			}])
		};
	},
	LINECHART:	function(valuesX, valuesY) {
		return {
			value: '',
			html:jSE.chart.apply(this, [{
				type: 'line',
				x: {
					data: valuesX
				},
				y: {
					data: valuesY
				},
				title: ""
			}])
		};
	},
	PIECHART:	function(values, legend, title) {
		return {
			value: '',
			html: jSE.chart.apply(this, [{
				type: 'pie',
				data: values,
				legend: legend,
				title: title
			}])
		};
	},
	DOTCHART:	function(valuesX, valuesY, values, legendX, legendY, title) {
		return {
			value: '',
			html: jSE.chart.apply(this, [{
				type: 'dot',
				data: (values ? values : valuesX),
				x: {
					data: valuesX,
					legend: legendX
				},
				y: {
					data: (valuesY ? valuesY : valuesX),
					legend: (legendY ? legendY : legendX)
				},
				title: title
			}])
		};
	},
	CELLREF: function(v) {
		return (this.jS.spreadsheets[v] ? this.jS.spreadsheets[v] : 'Cell Reference Not Found');
	},
	CALCTIME: function() {
		var owner = this;
		this.s.origParent.one('calculation', function() {
			jQuery(owner.jS.getTd(owner.sheet, owner.row, owner.col))
				.text(owner.jS.time.diff());
		});
		return "";
	},
	//cell functions
	HLOOKUP: function ( value, tableArray, indexNumber, notExactMatch ) {
		var lookupTable = this.jS.cellLookup.apply(this);
		
		for(var i = 0; i < tableArray[0].length; i++) {
			if (tableArray[0][i] == value) {
				return this.jS.updateCellValue(lookupTable[i].sheet, indexNumber - 1, lookupTable[i].col);
			}
		}
		
		return notExactMatch;
	},
	VLOOKUP: function ( value, tableArray, indexNumber, notExactMatch ) {
		var lookupTable = this.jS.cellLookup.apply(this);
		
		for(var i = 0; i < tableArray[0].length; i++) {
			if (tableArray[0][i] == value) {
				return this.jS.updateCellValue(lookupTable[i].sheet, lookupTable[i].row, indexNumber);
			}
		}
		
		return notExactMatch;
	},
	THISROWCELL: function(col) {
		if (isNaN(col)) {
			col = jSE.columnLabelIndex(col);
		}
		return this.jS.updateCellValue(this.sheet, this.row, col);
	},
	THISCOLCELL: function(row) {
		return this.jS.updateCellValue(this.sheet, row, this.col);
	}
};

var key = { /* key objects, makes it easier to develop */
	BACKSPACE: 			8,
	CAPS_LOCK: 			20,
	COMMA: 				188,
	CONTROL: 			17,
	ALT:				18,
	DELETE: 			46,
	DOWN: 				40,
	END: 				35,
	ENTER: 				13,
	ESCAPE: 			27,
	HOME: 				36,
	INSERT: 			45,
	LEFT: 				37,
	NUMPAD_ADD: 		107,
	NUMPAD_DECIMAL: 	110,
	NUMPAD_DIVIDE: 		111,
	NUMPAD_ENTER: 		108,
	NUMPAD_MULTIPLY: 	106,
	NUMPAD_SUBTRACT: 	109,
	PAGE_DOWN: 			34,
	PAGE_UP: 			33,
	PERIOD: 			190,
	RIGHT: 				39,
	SHIFT: 				16,
	SPACE: 				32,
	TAB: 				9,
	UP: 				38,
	F:					70,
	V:					86,
	Y:					89,
	Z:					90
};

var arrHelpers = {
	foldPrepare: function(firstArg, theArguments, unique) { // Computes the best array-like arguments for calling fold().
		var result;
		if (firstArg != null &&
			firstArg instanceof Object &&
			firstArg["length"] != null) {
			result = firstArg;
		} else {
			result = theArguments;
		}
		
		if (unique) {
			result = this.unique(result);
		}
		
		return result;
	},
	fold: function(arr, funcOfTwoArgs, result, castToN, N) {
		for (var i = 0; i < arr.length; i++) {
			result = funcOfTwoArgs(result, (castToN == true ? N(arr[i]): arr[i]));
		}
		return result;
	},
	toNumbers: function(arr) {
		arr = this.flatten(arr);
		
		for (i in arr) {
			if (arr[i]) {
				arr[i] = jQuery.trim(arr[i]);
				if (isNaN(arr[i])) {
					arr[i] = 0;
				} else {
					arr[i] = arr[i] * 1;
				}
			} else {
				arr[i] = 0;
			}
		}
		
		return arr;
	},
	unique: function(arr) {
		var a = [];
		var l = arr.length;
		for (var i=0; i<l; i++) {
			for(var j=i+1; j<l; j++) {
				// If this[i] is found later in the array
				if (arr[i] === arr[j])
					j = ++i;
			}
			a.push(arr[i]);
		}
		return a;
	},
	flatten: function(arr) {
		var flat = [];
		for (var i = 0, l = arr.length; i < l; i++){
			var type = Object.prototype.toString.call(arr[i]).split(' ').pop().split(']').shift().toLowerCase();
			if (type) {
				flat = flat.concat(/^(array|collection|arguments|object)$/.test(type) ? this.flatten(arr[i]) : arr[i]);
			}
		}
		return flat;
	},
	insertAt: function(arr, val, index){
		jQuery(val).each(function(){
			if (index > -1 && index <= arr.length) {
				arr.splice(index, 0, this);
			}
		});
		return arr;
	},
	getClosestValues: function(a, x) {
		var closest = null;
		a = a || [];
		x = x || 0;
		for (var i = 0; i < a.length;i++) {
			if (closest == null || Math.abs(a[i] - x) < Math.abs(closest - x)) {
				closest = a[i];
			}
		}
		
		return closest;
	}
};

var dates = {
	dayDiv: 86400000,
	toCentury: function(date) {
		return Math.round(Math.abs((new Date(1900,0,-1)) - date) / this.dayDiv);
	},
	get: function(date) {
		if (date.getMonth) {
			return date;
		} else if (isNaN(date)) {
			return new Date(Globalize.parseDate( date ));
		} else {
			date *= this.dayDiv;
			//date = new Date(date);
			var newDate = (new Date(1900,0,-1)) * 1;
			date += newDate;
			date = new Date(date);
			return date;
		}
	},
	week: function(date) {
		var onejan = new Date(date.getFullYear(),0,1);
		return Math.ceil((((date - onejan) / this.dayDiv) + onejan.getDay()+1)/7);
	},
	toString: function(date, pattern) {
		if (!pattern) {
			return Globalize.format(date);
		}
		return Globalize.format(date, Globalize.culture().calendar.patterns[pattern]);
	},
	diff: function(start, end, basis) {
		switch (basis) {
			case 0: return this.days360Nasd(start, end, 0, true);
			case 1:
			case 2:
			case 3:
				var result = Math.abs(end - start) / this.dayDiv;
				return result;
			case 4: return this.days360Euro(start, end);
		}
	},
	diffMonths: function(start, end) {
		var months;
		months = (end.getFullYear() - start.getFullYear()) * 12;
		months -= start.getMonth() + 1;
		months += end.getMonth() + 1;
		return months;
	},
	days360: function(startYear, endYear, startMonth, endMonth, startDate, endDate) {
		return ((endYear - startYear) * 360) + ((endMonth - startMonth) * 30) + (endDate - startDate)
	},
	days360Nasd: function(start, end, method, useEom) {
		var startDate = start.getDate(),
			startMonth = start.getMonth(),
			startYear = start.getFullYear(),
			endDate = end.getDate(),
			endMonth = end.getMonth(),
			endYear = end.getFullYear();

		if (
			(endMonth==2 && this.isEndOfMonth(endDate, endMonth, endYear)) &&
			(
				(startMonth==2 && this.isEndOfMonth(startDate, startMonth, startYear)) ||
				method==3
			)
		) {
			endDate = 30;
		}

		if (endDate==31 && (startDate >= 30 || method==3)) {
			endDate = 30;
		}

		if (startDate==31) {
			startDate = 30;
		}

		if (useEom && startMonth==2 && this.isEndOfMonth(startDate, startMonth, startYear)) {
			startDate = 30;
		}

		return this.days360(startYear, endYear, startMonth, endMonth, startDate, endDate);
	},
	days360Euro: function(start, end) {
		var startDate = start.getDate(),
			startMonth = start.getMonth(),
			startYear = start.getFullYear(),
			endDate = end.getDate(),
			endMonth = end.getMonth(),
			endYear = end.getFullYear();

		if (startDate==31) startDate = 30;
		if (endDate==31) endDate = 30;

		return this.days360(startYear, endYear, startMonth, endMonth, startDate, endDate);
	},
	isEndOfMonth: function(day, month, year) {
		return day == (new Date(year, month + 1, 0, 23, 59, 59)).getDate();
	},
	isLeapYear: function(year) {
		return new Date(year, 1, 29).getMonth() == 1;
	},
	calcAnnualBasis: function(start, end, basis) {
		switch (basis) {
			case 0:
			case 2:
			case 4: return 360;
			case 3: return 365;
			case 1:
				var startDate = start.getDate(),
					startMonth = start.getMonth(),
					startYear = start.getFullYear(),
					endDate = end.getDate(),
					endMonth = end.getMonth(),
					endYear = end.getFullYear(),
					result;

				if (startYear == endYear) {
					if (this.isLeapYear(startYear)) {
						result = 366;
					} else {
						result = 365;
					}
				} else if (((endYear-1) == startYear) && ((startMonth>endMonth) || ((startMonth==endMonth) && startDate>=endDate))) {
					if (this.isLeapYear(startYear)) {
						if (startMonth<2 || (startMonth==2 && startDate<=29)) {
							result = 366;
						} else {
							result = 365;
						}
					} else if (this.isLeapYear(endYear)) {
						if (endMonth>2 || (endMonth==2 && endDate==29)) {
							result = 366;
						} else {
							result = 365;
						}
					} else {
						result = 365;
					}
				} else {
					for(var iYear = startYear; iYear <= endYear; iYear++) {
						if (this.isLeapYear(iYear)) {
							result += 366;
						} else {
							result += 365;
						}
					}
					result = result / (endYear - startYear + 1);
				}
				return result;
		}
	},
	lastDayOfMonth: function(date) {
		date.setDate(0);
		return date.getDate();
	},
	isLastDayOfMonth: function(date) {
		return (date.getDate() == this.lastDayOfMonth(date));
	}
};

var times = {
	fromMath: function(time) {
		var result = {};

		result.hour = ((time * 24) + '').split('.')[0];

		result.minute = function(time) {
			time = Math.round(time * 24 * 100)/100;
			time = (time + '').split('.');
			var minute = 0;
			if (time[1]) {
				if (time[1].length < 2) {
					time[1] += '0';
				}
				minute = time[1] * 0.6;
			}
			return Math.round(minute);
		}(time);

		result.second = function(time) {
			time = Math.round(time * 24 * 10000)/10000;
			time = (time + '').split('.');
			var second = 0;
			if (time[1]) {
				for(var i = 0; i < 4; i++) {
					if (!time[1].charAt(i)) {
						time[1] += '0';
					}
				}
				var secondDecimal = ((time[1] * 0.006) + '').split('.');
				if (secondDecimal[1]) {
					if (secondDecimal[1] && secondDecimal[1].length > 2) {
						secondDecimal[1] = secondDecimal[1].substr(0,2);
					}

					return Math.round(secondDecimal[1] * 0.6);
				}
			}
			return second;
		}(time);

		return result;
	},
	fromString: function(time, isAMPM) {
		var date = new Date(), timeParts = time, timeValue, hour, minute, second, meridiem;
		if (isAMPM) {
			meridiem = timeParts.substr(-2).toLowerCase(); //get ampm;
			timeParts = timeParts.replace(/(am|pm)/i,'');
		}

		timeParts = timeParts.split(':');
		hour = timeParts[0] * 1;
		minute = timeParts[1] * 1;
		second = (timeParts[2] ? timeParts[2] : 0) * 1;

		if (isAMPM && meridiem == 'pm') {
			hour += 12;
		}

		return jFN.TIME(hour, minute, second);
	}
};

var math = {
	log10: function (arg) {
		// http://kevin.vanzonneveld.net
		// +   original by: Philip Peterson
		// +   improved by: Onno Marsman
		// +   improved by: Tod Gentille
		// +   improved by: Brett Zamir (http://brett-zamir.me)
		// *	 example 1: log10(10);
		// *	 returns 1: 1
		// *	 example 2: log10(1);
		// *	 returns 2: 0
		return Math.log(arg) / 2.302585092994046; // Math.LN10
	},
	signum: function(x) {
		return (x/Math.abs(x))||x;
	}
};