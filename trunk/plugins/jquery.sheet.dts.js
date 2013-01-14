/**
 * @project jQuery.sheet() The Web Based Spreadsheet - http://code.google.com/p/jquerysheet/
 * @author RobertLeePlummerJr@gmail.com
 * $Id$
 * Licensed under MIT
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

(function($) {
	/**
	 * @namespace
	 * @name dts
	 * @type {Object}
	 * @memberOf jQuery.sheet
	 */
	jQuery.sheet.dts = {
		/**
		 * @memberOf jQuery.sheet.dts
		 * @name toTables
		 * @namespace
		 */
		toTables: {

			/**
			 * Create a table from json
			 * @param {Array} json array of spreadsheets - schema:
			 * [{ // sheet 1, can repeat
			 *  "title": "Title of spreadsheet",
			 *  "metadata": {
			 *      "widths": [
			 *          "120px", //widths for each column, required
			 *          "80px"
			 *      ]
			 *  },
			 *  "rows": [
			 *      { // row 1, repeats for each column of the spreadsheet
			 *          "height": "18px", //optional
			 *          "columns": [
			 *              { //column A
			 *                  "class": "css classes", //optional
			 *                  "formula": "=cell formula", //optional
			 *                  "value": "value", //optional
			 *                  "style": "css cell style" //optional
			 *              },
			 *              {} //column B
			 *          ]
			 *      },
			 *      { // row 2
			 *          "height": "18px", //optional
			 *          "columns": [
			 *              { // column A
			 *                  "class": "css classes", //optional
			 *                  "formula": "=cell formula", //optional
			 *                  "value": "value", //optional
			 *                  "style": "css cell style" //optional
			 *              },
			 *              {} // column B
			 *          ]
			 *      }
			 *  ]
			 * }]
			 * @returns {*|jQuery|HTMLElement} a simple html table
			 * @methodOf jQuery.sheet.dts.toTables
			 * @name json
			 */
			json: function(json) {

				var tables = $([]);

				$.each(json, function() {
					var table = $('<table />').attr('title', this.title || '');

					tables = tables.add(table);

					$.each(this.rows, function() {
						var tr = $('<tr />')
							.attr('height', this.height)
							.css('height', this.height)
							.appendTo(table);
						$.each(this.columns, function() {
							var td = $('<td />')
								.attr('class', this.class || '')
								.attr('style', this.style || '')
								.attr('formula', this.formula || '')
								.html(this.value || '')
								.appendTo(tr);
						});
					});

					if (!this.metadata) return;
					if (!this.metadata.width) return;

					var colgroup = $('<colgroup />');
					$.each(this.metadata.widths, function() {
						var col = $('<col />')
							.attr('width', this.width)
							.css('width', this.width);
					});
				});

				return tables;
			},

			/**
			 *
			 * @param {String|jQuery|HTMLElement} xml - schema:
			 * &lt;spreadsheets&gt;
			 *     &lt;spreadsheet title="spreadsheet title"&gt;
			 *         &lt;metadata&gt;
			 *             &lt;widths&gt;
			 *                 &lt;width&gt;120px&lt;/width&gt;
			 *                 &lt;width&gt;80px&lt;/width&gt;
			 *             &lt;/widths&gt;
			 *         &lt;/metadata&gt;
			 *         &lt;rows&gt;
			 *             &lt;row height="15px"&gt;
			 *                  &lt;columns&gt;
			 *                      &lt;column&gt;
			 *                          &lt;formula&gt;=cell formula&lt;/formula&gt;
			 *                          &lt;value&gt;cell value&lt;/value&gt;
			 *                          &lt;style&gt;cells style&lt;/style&gt;
			 *                          &lt;class&gt;cells class&lt;/class&gt;
			 *                      &lt;/column&gt;
			 *                      &lt;column&gt;&lt;/column&gt;
			 *                  &lt;/columns&gt;
			 *              &lt;/row&gt;
			 *             &lt;row height="15px"&gt;
			 *                  &lt;columns&gt;
			 *                      &lt;column&gt;
			 *                          &lt;formula&gt;=cell formula&lt;/formula&gt;
			 *                          &lt;value&gt;cell value&lt;/value&gt;
			 *                          &lt;style&gt;cells style&lt;/style&gt;
			 *                          &lt;class&gt;cells class&lt;/class&gt;
			 *                      &lt;/column&gt;
			 *                      &lt;column&gt;&lt;/column&gt;
			 *                  &lt;/columns&gt;
			 *              &lt;/row&gt;
			 *         &lt;/rows&gt;
			 *     &lt;/spreadsheet&gt;
			 * &lt;/spreadsheets&gt;
			 * @returns {*|jQuery|HTMLElement} a simple html table
			 * @name xml
			 * @methodOf jQuery.sheet.dts.toTables
			 */
			xml: function(xml) {
				xml = $(xml);

				var tables = $([]);

				xml.each(function(spreadsheet) { //spreadsheets
					$(this).children().each(function() { //spreadsheet
						var table = $('<table />').attr('title', $(this).attr('title') || ''),
							colgroup = $('<colgroup/>').appendTo(table),
							tbody = $('<tbody />').appendTo(table);

						tables = tables.add(table);
						$(this).children().each(function(){ //rows
							switch (this.nodeName.toLowerCase()) {
								case 'rows':
									$(this).children().each(function() { //row
										switch (this.nodeName.toLowerCase()) {
											case 'row':
												var tr = $('<tr/>').appendTo(tbody);
												tr
													.css('height', $(this).attr('height'))
													.attr('height', $(this).attr('height'));
												$(this).children().each(function() {
													switch (this.nodeName.toLowerCase()) {
														case 'columns':
															$(this).children().each(function() {
																switch (this.nodeName.toLowerCase()) {
																	case 'column':
																		//console.log(this.nodeName.toLowerCase());
																		var td = $('<td />').appendTo(tr);
																		$(this).children().each(function() { //formula or value or style
																			switch (this.nodeName.toLowerCase()) {
																				case 'formula':
																					td.attr('formula', $(this).html());
																					break
																				case 'value':
																					td.html($(this).html());
																					break;
																				case 'style':
																					td.attr('style', $(this).html());
																					break;
																				case 'class':
																					td.attr('class', $(this).html());
																			}
																		});
																		break;
																}
															});
													}
												});

												break;

										}
									});
									break;
								case 'metadata':
									$(this).children().each(function() {
										switch (this.nodeName.toLowerCase()) {
											case 'widths':
												$(this).children().each(function() {
													switch (this.nodeName.toLowerCase()) {
														case 'width':
															$('<col/>')
																.attr('width', $(this).text())
																.css('width', $(this).text())
																.appendTo(colgroup);
															break;
													}
												});
												break;
										}
									});
									break;
							}
						});
					});
				});

				return tables;
			}
		},

		/**
		 * @namespace
		 * @name fromTables
		 * @memberOf jQuery.sheet.dts
		 */
		fromTables: {
			/**
			 * Create a table from json
			 * @param {Object} jS, required, the jQuery.sheet instance
			 * @returns {Array}  - schema:
			 * [{ // sheet 1, can repeat
			 *  "title": "Title of spreadsheet",
			 *  "metadata": {
			 *      "widths": [
			 *          "120px", //widths for each column, required
			 *          "80px"
			 *      ]
			 *  },
			 *  "rows": [
			 *      { // row 1, repeats for each column of the spreadsheet
			 *          "height": "18px", //optional
			 *          "columns": [
			 *              { //column A
			 *                  "class": "css classes", //optional
			 *                  "formula": "=cell formula", //optional
			 *                  "value": "value", //optional
			 *                  "style": "css cell style" //optional
			 *              },
			 *              {} //column B
			 *          ]
			 *      },
			 *      { // row 2
			 *          "height": "18px", //optional
			 *          "columns": [
			 *              { // column A
			 *                  "class": "css classes", //optional
			 *                  "formula": "=cell formula", //optional
			 *                  "value": "value", //optional
			 *                  "style": "css cell style" //optional
			 *              },
			 *              {} // column B
			 *          ]
			 *      }
			 *  ]
			 * }]
			 * @methodOf jQuery.sheet.dts.fromTables
			 * @name json
			 */
			json: function(jS) {
				var output = [], i = 1 * jS.i;

				$.each(jS.spreadsheets, function(sheet) {
					jS.i = sheet;
					var metadata = [];
					var spreadsheet = {
						"title": (jS.obj.sheet().attr('title') || ''),
						"rows": [],
						"metadata": {
							"widths": []
						}
					};
					output.push(spreadsheet);

					$.each(jS.spreadsheets[sheet], function (row) {
						if (row == 0) return;
						var Row = {
							"height": (jS.spreadsheets[sheet][row][1].td.parent().attr('height') || jS.s.colMargin + 'px'),
							"columns": []
						};
						spreadsheet.rows.push(Row);

						$.each(jS.spreadsheets[sheet][row], function(column) {
							if (column == 0) return;
							var Column = {};
							Row.columns.push(Column);

							if (this.formula) Column.formula = '=' + this.formula;
							if (this.value) Column.value = this.value;
							if (this.td.attr('style')) Column.style = this.td.attr('style');
							if (this.td.attr('class')) Column.class = this.td.attr('class');

							if (row * 1 == 1) {
								spreadsheet.metadata.widths.push($(jS.col(null, column)).css('width'));
							}
						});
					});
				});
				jS.i = i;

				return output;
			},

			/**
			 * Create a table from xml
			 * @param {Object} jS, required, the jQuery.sheet instance
			 * @returns {String} - schema:
			 * &lt;spreadsheets&gt;
			 *     &lt;spreadsheet title="spreadsheet title"&gt;
			 *         &lt;metadata&gt;
			 *             &lt;widths&gt;
			 *                 &lt;width&gt;120px&lt;/width&gt;
			 *                 &lt;width&gt;80px&lt;/width&gt;
			 *             &lt;/widths&gt;
			 *         &lt;/metadata&gt;
			 *         &lt;rows&gt;
			 *             &lt;row height="15px"&gt;
			 *                  &lt;columns&gt;
			 *                      &lt;column&gt;
			 *                          &lt;formula&gt;=cell formula&lt;/formula&gt;
			 *                          &lt;value&gt;cell value&lt;/value&gt;
			 *                          &lt;style&gt;cells style&lt;/style&gt;
			 *                          &lt;class&gt;cells class&lt;/class&gt;
			 *                      &lt;/column&gt;
			 *                      &lt;column&gt;&lt;/column&gt;
			 *                  &lt;/columns&gt;
			 *              &lt;/row&gt;
			 *             &lt;row height="15px"&gt;
			 *                  &lt;columns&gt;
			 *                      &lt;column&gt;
			 *                          &lt;formula&gt;=cell formula&lt;/formula&gt;
			 *                          &lt;value&gt;cell value&lt;/value&gt;
			 *                          &lt;style&gt;cells style&lt;/style&gt;
			 *                          &lt;class&gt;cells class&lt;/class&gt;
			 *                      &lt;/column&gt;
			 *                      &lt;column&gt;&lt;/column&gt;
			 *                  &lt;/columns&gt;
			 *              &lt;/row&gt;
			 *         &lt;/rows&gt;
			 *     &lt;/spreadsheet&gt;
			 * &lt;/spreadsheets&gt;
			 * @methodOf jQuery.sheet.dts.fromTables
			 * @name xml
			 */
			xml: function(jS) {
				var output = '<spreadsheets>', i = 1 * jS.i;

				$.each(jS.spreadsheets, function(sheet) {
					jS.i = sheet;
					var widths = [];
					output += '<spreadsheet title="' + (jS.obj.sheet().attr('title') || '') + '">';

					output += '<rows>';
					$.each(jS.spreadsheets[sheet], function (row) {
						if (row == 0) return;

						output += '<row height="' + (jS.spreadsheets[sheet][row][1].td.parent().attr('height') || jS.s.colMargin + 'px') + '">';
						output += '<columns>';
						$.each(jS.spreadsheets[sheet][row], function(column) {
							if (column == 0) return;

							output += '<column>';

							if (this.formula) output += '<formula>=' + this.formula + '</formula>';
							if (this.value) output += '<value>' + this.value + '</value>';
							if (this.td.attr('style')) output += '<style>' + this.td.attr('style') + '</style>';
							if (this.td.attr('class')) output += '<class>' + this.td.attr('class') + '</class>';
							output += '</column>';

							if (row * 1 == 1) {
								widths[column] = '<width>' + $(jS.col(null, column)).css('width') + '</width>';
							}
						});
						output += '</columns>';
						output += '</row>';
					});
					output += '</rows>';

					output += '<metadata><widths>' + widths.join('') + '</widths></metadata>';

					output += '</spreadsheet>';
				});

				output += '</spreadsheets>';

				jS.i = i;
				return output;
			}
		}
	};
})(jQuery);