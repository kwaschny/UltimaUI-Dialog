/* globals jQuery, UltimaDialog */
(function () {

	'use strict';

	if (!window.UltimaDialog) {

		// BEGIN: check dependencies

			if (jQuery === undefined) {

				throw new Error('jQuery missing for UltimaDialog');
			}

			// feature detection
			if (!jQuery.isPlainObject) {

				throw new Error('jQuery 1.4+ required for UltimaDialog');
			}

		// END: check dependencies

		window.UltimaDialog = function(options) {

			// prevent skipping the constructor
			if (!(this instanceof UltimaDialog)) {

				return new UltimaDialog(options);
			}

			// private scope
			this._ = {};

			// closure reference
			var self = this;

			// cache global selectors
			var jqWindow 	= jQuery(window);
			var jqBody 		= jQuery('body');

			if ((jqWindow.length === 0) || (jqBody.length === 0)) {

				throw new Error('HTML document malformed');
			}

			// BEGIN: public properties

				this.curtain 	= null;
				this.window 	= null;

				// BEGIN: options

					this.options = {};
					this.options.current = {};

					this.options['default'] = {

						animations: {

							curtain: {

								show: {

									// effect used to show the curtain
									effect: 	'fadeIn',

									// duration of the above effect
									duration: 	400

								},

								hide: {

									// effect used to hide the curtain
									// undefined: inherit value from show
									effect: 	undefined,

									// duration of the above effect
									// undefined: inherit value from show
									duration: 	undefined

								},

								// wait for curtain to be fully shown before progressing to the dialog window
								deferProgression: false

							},

							window: {

								show: {

									// effect used to show the dialog window
									effect: 	'fadeIn',

									// duration of the above effect
									duration: 	400

								},

								hide: {

									// effect used to hide the dialog window
									// undefined: inherit value from show
									effect: 	undefined,

									// duration of the above effect
									// undefined: inherit value from show
									duration: 	undefined

								},

								// wait for window to be fully hidden before progressing to the curtain
								deferProgression: false,

								reposition: {

									// animation duration for repositioning the dialog
									duration: 	100

								},

								resize: {

									// animation duration for resizing the dialog content
									duration: 	200,

									// polling rate to watch for resize of the viewport
									rate: 		200

								}

							}

						},

						behavior: {

							ajax: {

								// cache ajax requests
								cache: false

							},

							// click on the curtain will trigger closing of the dialog
							closeOnCurtain: 	true,

							// pressing the ESC key will trigger closing of the dialog
							// this value will override the behavior of already opened dialogs (overrides global handler)
							closeOnEscape: 		true,

							// prepend an element that triggers closing of the dialog
							closeOnWindow: 		true,

							// disable scroll on body
							// auto: disable on overflow only (avoids multiple scrollbars)
							disableScrolling: 	'auto',

							// automatically limit the size of the dialog content to prevent overflow
							preventOverflow: 	true,

							// automatically assign submit handlers to every form element placed into the dialog content
							trackSubmit: 		true,

							// translate plain content automatically to the corresponding media (affects images only)
							translateMedia: 	true,

							// increment zIndex with each (overlapping) dialog
							zIndexInc: true

						},

						css: {

							loading: {

								// class added to the loading notification
								className: 	'',

								// content to be placed within the loading notification
								content: 	undefined,

								// horizontal position of the loading notification, either in px or in %
								x: 			'50%',

								// vertical position of the loading notification, either in px or in %
								y: 			'50%'

							},

							curtain: {

								// CSS3 filter applied to the curtain, e.g. blur(4px), grayscale(100%)
								applyFilter: 	undefined,

								// class added to the curtain element
								className: 		'',

								// draw curtain with a (non-transparent) color
								isVisible: 		true,

								// z-index
								zIndex: 	9003

							},

							window: {

								// class added to the window element
								className: 		'',

								// close control
								close: {

									// class added to the close control element
									className: 	''
								},

								// margin applied to the width of the viewport
								hardMarginX: 0,

								// margin applied to the height of the viewport
								hardMarginY: 0,

								// horizontal position of the window, either in px or in %
								x: 				'50%',

								// vertical position of the window, either in px or in %
								y: 				'50%',

								// z-index
								zIndex: 	9004

							}

						},

						callbacks: {

							// before opening
							onOpening: 			undefined, // (UltimaDialog) 			: return false to interrupt

							// after curtain is fully shown
							onCurtainOpened: 	undefined, // (UltimaDialog)

							// after window is fully shown
							onWindowOpened: 	undefined, // (UltimaDialog)

							// after content is known and ready to be placed
							onContentReady: 	undefined, // (UltimaDialog, content) 	: return false to interrupt

							// after content is fully shown
							onContentVisible: 	undefined, // (UltimaDialog)

							// after asynchronous request returned an expected result
							onAsyncSuccess: 	undefined, // (UltimaDialog, response)

							// after asynchronous request returned an unexpected result
							onAsyncError: 		undefined, // (UltimaDialog, request)

							// before submit within dialog is sent
							onSubmit: 			undefined, // (UltimaDialog, data) 		: return false to interrupt

							// before closing
							onClosing: 			undefined, // (UltimaDialog) 			: return false to interrupt

							// after curtain is fully hidden and removed
							onCurtainClosed: 	undefined, // (UltimaDialog)

							// after window is fully hidden and removed
							onWindowClosed: 	undefined  // (UltimaDialog)

						}

					};

				// END: options

			// END: public properties

			// BEGIN: private properties

				this._.properties = {

					classNames: {
						curtain: 		'UltimaDialog-curtain',
						window: {
							frame: 		'UltimaDialog-window',
							content: 	'UltimaDialog-window-content',
							close: 		'UltimaDialog-window-close'
						}
					},

					// IE 9- doesn't consider border-box on min-width/min-height
					simulateBorderBox: 				(window.atob === undefined),

					// IE 9- doesn't consider a transparent background as layer
					simulateTransparentBackground: 	(window.atob === undefined),

					// CSS3 filter support start at IE 10+
					supportsFilter: 				(window.atob !== undefined),

					supportsMedia: 					(window.atob !== undefined)

				};

			// END: private properties

			// BEGIN: public methods

				this.show = function(content) {

					// callback: on opening
					if (jQuery.isFunction(this.options.current.callbacks.onOpening)) {

						if (this.options.current.callbacks.onOpening(self) === false) {

							return false;
						}
					}

					// build elements
					this.curtain 	= self._.methods.createCurtain();
					this.window 	= self._.methods.createWindow(content);

					// connect elements
					this.curtain._.properties.window = this.window;
					this.window._.properties.curtain = this.curtain;

					// disable scrolling on body
					if (this.options.current.behavior.disableScrolling === true) {

						UltimaDialog._.methods.disableScrolling(jqBody);
					}

					// append elements to DOM
					jqBody
						.append(this.curtain.dom.element)
						.append(this.window.dom.element)
					;

					// initialize size & position
					this.window.relocate();

					// wait for curtain to be fully opened before opening window
					if (this.options.current.animations.curtain.deferProgression === true) {

						// show curtain
						this.curtain.show(function() {

							// callback: on opening
							if (jQuery.isFunction(self.options.current.callbacks.onCurtainOpened)) {

								self.options.current.callbacks.onCurtainOpened(self);
							}

							// show window
							self.window.show(self.window._.properties.isAjax);

							if (self.window.dom.loading) {

								// determine position within dialog
								self.window.dom.loading.css(
									self.window._.methods.calcInnerPosition(self.window.dom.loading)
								);
							}
						});

					// open curtain and window simultaneously
					} else {

						// show curtain
						this.curtain.show(function() {

							if (jQuery.isFunction(self.options.current.callbacks.onCurtainOpened)) {

								self.options.current.callbacks.onCurtainOpened(self);
							}
						});

						// show window
						this.window.show(self.window._.properties.isAjax);

						if (this.window.dom.loading) {

							// determine position within dialog
							this.window.dom.loading.css(
								this.window._.methods.calcInnerPosition(this.window.dom.loading)
							);
						}
					}

					return true;
				};

				this.image = function(image, attr) {

					// dialog
					this.show({
						media: 		'image',
						resource: 	image,
						attributes: attr
					});

					return true;
				};

				this.video = function(url, attr) {

					// dialog
					this.show({
						media: 		'video',
						resource: 	url,
						attributes: attr
					});

					return true;
				};

				this.audio = function(url, attr) {

					// dialog
					this.show({
						media: 		'audio',
						resource: 	url,
						attributes: attr
					});

					return true;
				};

				jQuery.each([ 'get', 'post', 'put', 'delete' ], function(i, type) {

					self[type] = function(url, data, ajaxSettings) {

						// dialog
						this.show({
							method: type.toUpperCase(),
							url: url,
							data: data,
							settings: ajaxSettings
						});

						return true;
					};

				});

				this.iframe = function(url, attr) {

					// dialog
					this.show({
						media: 		'iframe',
						resource: 	url,
						attributes: attr
					});

					return true;
				};

				this.close = function(callback, duration) {
					//       function(callback)
					//       function(duration)

					if (!jQuery.isFunction(callback)) {

						duration = callback;
						callback = undefined;
					}

					// re-enable scrolling on body
					UltimaDialog._.methods.enableScrolling(jqBody);

					// trigger close on window
					if (this.window !== null) {

						this.window.close(callback, duration);
						return true;
					}

					return false;
				};

			// END: public methods

			// BEGIN: private methods

				this._.methods = {

					createCurtain: function() {

						var curtain = {

							// BEGIN: public properties

								dom: {

									element: jQuery('<div></div>').hide()

								},

							// END: public properties

							// BEGIN: public methods

								// close curtain
								close: function(callback, duration) {

									// closure scope
									var that = this;

									if (typeof callback === 'number') {

										duration = callback;
										callback = undefined;
									}

									// remove filter
									this._.methods.filterOff();

									switch (self.options.current.animations.curtain.hide.effect) {

										// case 'fadeIn':
										default:

											// close curtain
											this.dom.element.stop(true, true).fadeOut(
												( duration === undefined ? self.options.current.animations.curtain.hide.duration : duration ),
												function() {

													// completely remove the element from DOM
													that.dom.element.remove();

													// callback: on curtain closed (local)
													if (jQuery.isFunction(callback)) {

														callback(self);
													}

													// callback: on curtain closed (global)
													if (jQuery.isFunction(self.options.current.callbacks.onCurtainClosed)) {

														self.options.current.callbacks.onCurtainClosed(self);
													}
												}
											);

											break;

									}

									return true;
								},

								// show curtain
								show: function(callback) {

									// closure scope
									var that = this;

									switch (self.options.current.animations.curtain.show.effect) {

										// case 'fadeIn':
										default:

											// show curtain
											this.dom.element.fadeIn(
												self.options.current.animations.curtain.show.duration,
												function() {

													// mark curtain as opened (now accepting events)
													that.isOpened = true;

													// callback: on curtain opened
													if (jQuery.isFunction(callback)) {

														callback(self);
													}
												}
											);

											break;
									}

									return true;
								},

							// END: public methods

							_: {

								// BEGIN: private properties

									properties: {

										isOpened: 	false,
										window: undefined

									},

								// END: private properties

								// BEGIN: private methods

									methods: {

										filterOn: function() {

											if (self._.properties.supportsFilter === false) {

												return false;
											}

											var filter = self.options.current.css.curtain.applyFilter;

											if (typeof filter !== 'string') {

												return false;
											}

											var buffer = jqBody.children(':not(script, style)');
											jQuery.each(buffer, function(i, element) {

												var e = jQuery(element);

												if (
													!e.hasClass(self._.properties.classNames.curtain) &&
													!e.hasClass(self._.properties.classNames.window)
												) {

													e.css({
														'-webkit-filter': 	filter,
														'filter': 			filter
													});
												}
											});

											return true;
										},

										filterOff: function() {

											if (self._.properties.supportsFilter === false) {

												return false;
											}

											var filter = self.options.current.css.curtain.applyFilter;

											if (typeof filter !== 'string') {

												return false;
											}

											var buffer = jqBody.children(':not(script, style)');
											jQuery.each(buffer, function(i, element) {

												var e = jQuery(element);

												if (
													!e.hasClass(self._.properties.classNames.curtain) &&
													!e.hasClass(self._.properties.classNames.window)
												) {

													e.css({
														'-webkit-filter': 	'',
														'filter': 			''
													});
												}
											});

											return true;
										}

									}

								// END: private methods

							}

						};

						// BEGIN: build element

							// BEGIN: appearance

								// class
								curtain.dom.element.addClass(self._.properties.classNames.curtain);
								curtain.dom.element.addClass(self.options.current.css.curtain.className);

								// BEGIN: inline CSS

									var cssAttr = {};

									if (!self.options.current.css.curtain.className) {

										cssAttr.backgroundColor = '#000000';
										cssAttr.opacity = 0.67;
									}

									jQuery.extend(true, cssAttr, self.options.current.css.curtain);
									jQuery.extend(true, cssAttr, {
										bottom: 	0,
										height: 	'100%',
										left: 		0,
										position: 	'fixed',
										right: 		0,
										top: 		0,
										width: 		'100%',
										zIndex: 	(self.options.current.css.curtain.zIndex + (self.options.current.behavior.zIndexInc ? UltimaDialog.collection.length : 0 ))
									});

									if (self.options.current.css.curtain.isVisible === false) {

										cssAttr.background = ( self._.properties.simulateTransparentBackground ? 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)' : 'transparent' );
									}

									// style
									curtain.dom.element.css(cssAttr);

								// END: inline CSS

							// END: appearance

							// apply filter
							curtain._.methods.filterOn();

							// BEGIN: events

								// on click
								curtain.dom.element.click(function() {

									// closing on curtain even allowed
									if (self.options.current.behavior.closeOnCurtain !== true) {

										return; // do not consume the event
									}

									// prevent premature close (click on curtain before the curtain is even shown)
									if (!curtain.isOpened) {

										return; // do not consume the event
									}

									// re-enable scrolling on body
									if (self.options.current.behavior.disableScrolling !== false) {

										UltimaDialog._.methods.enableScrolling(jqBody);
									}

									// close curtain
									curtain._.properties.window.close();
								});

							// END: events

						// END: build element

						return curtain;
					},

					createWindow: function(content, shadow) {

						var window = {

							dom: {

								element: 		jQuery('<div></div>').hide(),
								content: 		jQuery('<div></div>').css('opacity', 0.00),

								loading: 		undefined,
								closeButton: 	undefined

							},

							// BEGIN: private methods

								_: {

									properties: {

										curtain: 		undefined,

										isAjax: 		false,
										url: 			undefined
									},

									methods: {

										// attach submit handler on every form found in the current dialog content
										attachSubmitTracking: function() {

											if (shadow) {

												return false;
											}

											var forms = window.dom.content.find('form');

											// add submit handler to all forms
											forms.submit(function(event) {

												event.preventDefault();

												return UltimaDialog._.methods.submit(this);
											});

											return true;
										},

										// returns the position of the dialog window according to the position options and the current browser viewport
										calcPosition: function(width, height) {

											var result = {};

											// width
											if (width === undefined) {

												width = window.dom.element.outerWidth();
											}

											// height
											if (height === undefined) {

												height = window.dom.element.outerHeight();
											}

											// x
											if (/^[0-9]{1,3}%$/.test(self.options.current.css.window.x)) {

												result.left = (((self.options.current.css.window.x.replace('%', '') * jqWindow.width()) / 100) - (width / 2));

											} else {

												result.left = self.options.current.css.window.x;
											}
											if (result.left < 0) {

												result.left = 0;
											}

											// y
											if (/^[0-9]{1,3}%$/.test(self.options.current.css.window.y)) {

												result.top = (((self.options.current.css.window.y.replace('%', '') * jqWindow.height()) / 100) - (height / 2));

											} else {

												result.top = self.options.current.css.window.y;
											}
											if (result.top < 0) {

												result.top = 0;
											}

											return result;
										},

										calcInnerPosition: function(element) {

											var result = {};

											// x
											if (/^[0-9]{1,3}%$/.test(self.options.current.css.loading.x)) {

												result.marginLeft = (((self.options.current.css.loading.x.replace('%', '') * window.dom.content.width()) / 100) - (element.width() / 2));

											} else {

												result.marginLeft = self.options.current.css.loading.x;
											}
											if (result.marginLeft < 0) {

												result.marginLeft = 0;
											}

											// y
											if (/^[0-9]{1,3}%$/.test(self.options.current.css.loading.y)) {

												var vPadding = 0;

												// since height is based on the dialog frame, consider padding
												var outerPadding = window._.methods.getPadding(window.dom.element);
												vPadding += (outerPadding.bottom + outerPadding.top);
												var innerPadding = window._.methods.getPadding(window.dom.content);
												vPadding += (innerPadding.bottom + innerPadding.top);

												result.marginTop = (((self.options.current.css.loading.y.replace('%', '') * (window.dom.element.innerHeight() - vPadding)) / 100) - (element.height() / 2));

											} else {

												result.marginTop = self.options.current.css.loading.y;
											}
											if (result.marginTop < 0) {

												result.marginTop = 0;
											}

											return result;
										},

										calcSize: function(content) {

											var element = self._.methods.createWindow(content, true).dom.element;

											// consider the whole viewport
											element.css({
												display: 	'none',
												left: 		0,
												top: 		0
											});

											jqBody.append(element);

											// BEGIN: determine computed size

												var result = {
													width: 	element.outerWidth(),
													height: element.outerHeight()
												};

												if (self._.properties.simulateBorderBox) {

													var padding = window._.methods.getPadding(element);

													result.width 	-= (padding.left + padding.right);
													result.height 	-= (padding.bottom + padding.top);
												}

											// END: determine computed size

											element.remove();

											// BEGIN: cap result

												var widthCap 	 = jqWindow.width();
													widthCap 	-= self.options.current.css.window.hardMarginX;
												var heightCap 	 = jqWindow.height();
													heightCap 	-= self.options.current.css.window.hardMarginY;

												if (result.width > widthCap) {

													result.width = widthCap;
												}
												if (result.height > heightCap) {

													result.height = heightCap;
												}

											// END: cap result

											return result;
										},

										getPadding: function(element) {

											var result = {
												bottom: parseInt(element.css('padding-bottom'), 10),
												left: 	parseInt(element.css('padding-left'), 10),
												right: 	parseInt(element.css('padding-right'), 10),
												top: 	parseInt(element.css('padding-top'), 10)
											};

											result = {
												bottom: ( isNaN(result.bottom) ? 0 : result.bottom ),
												left: 	( isNaN(result.left)   ? 0 : result.left   ),
												right: 	( isNaN(result.right)  ? 0 : result.right  ),
												top: 	( isNaN(result.top)    ? 0 : result.top    )
											};

											return result;
										},

										rememberSize: function(element) {

											var size = {
												width: 	element.outerWidth(),
												height: element.outerHeight()
											};

											// padding is included unless BorderBox is not supported
											if (self._.properties.simulateBorderBox) {

												var padding = window._.methods.getPadding(element);

												size.width 	-= (padding.left + padding.right);
												size.height -= (padding.bottom + padding.top);
											}

											element.css({
												'min-height': 	size.height,
												'min-width': 	size.width
											});

											return true;
										},

										setLoading: function() {

											if (self.options.current.css.loading.content || self.options.current.css.loading.className) {

												var loading = jQuery('<div></div>');

												// class
												loading.addClass(self.options.current.css.loading.className);

												// BEGIN: inline CSS

													var cssAttr = {};
													jQuery.extend(cssAttr, self.options.current.css.loading);

													// remove content
													delete cssAttr.content;

													// style
													loading.css(cssAttr);

												// END: inline CSS

												// plain
												if (typeof self.options.current.css.loading.content === 'string') {

													loading.html(self.options.current.css.loading.content);

												// element
												} else if (self.options.current.css.loading.content instanceof jQuery) {

													loading.append(
														jQuery(self.options.current.css.loading.content).clone(true).show()
													);
												}

												window.dom.loading = loading;

												// place loading notification
												window.dom.content.append(loading);

												// show loading notification
												window.dom.content.fadeTo(
													self.options.current.animations.window.resize.duration,
													1.00
												);
											}
										}

									}

								},

							// END: private methods

							// BEGIN: public methods

								// closes the dialog window (fade out, remove)
								close: function(callback, duration) {

									// closure scope
									var that = this;

									// callback: on closing window
									if (jQuery.isFunction(self.options.current.callbacks.onClosing)) {

										if (self.options.current.callbacks.onClosing(self) === false) {

											return false;
										}
									}

									// unregister dialog
									for (var i = 0; i < UltimaDialog.collection.length; i++) {

										if (this === UltimaDialog.collection[i].window) {

											UltimaDialog.collection.splice(i, 1);
										}
									}

									switch (self.options.current.animations.window.hide.effect) {

										// case 'fadeIn':
										default:

											// do not wait for window to be closed
											if (self.options.current.animations.window.deferProgression !== true) {

												// close curtain
												this._.properties.curtain.close(
													( duration === undefined ? undefined : 0 )
												);
											}

											// close window
											this.dom.element.stop(true, true).fadeOut(
												( duration === undefined ? self.options.current.animations.window.hide.duration : 0 ),
												function() {

													// completely remove the element from DOM
													that.dom.element.remove();

													// callback: on window closed (local)
													if (jQuery.isFunction(callback)) {

														callback(self);
													}

													// callback: on window closed (global)
													if (jQuery.isFunction(self.options.current.callbacks.onWindowClosed)) {

														self.options.current.callbacks.onWindowClosed(self);
													}

													// waited for window to be closed
													if (self.options.current.animations.window.deferProgression === true) {

														// close curtain
														that._.properties.curtain.close(
															( duration === undefined ? undefined : 0 )
														);
													}
												}
											);

											break;
									}

									return true;
								},

								// positions the dialog window
								reposition: function(duration, callbackBefore, callbackAfter) {
									//      function(duration, callbackAfter)
									//      function(callbackBefore, callbackAfter)
									//      function(callbackAfter)

									if (duration === undefined) {

										duration = 0;

									} else {

										if (jQuery.isFunction(duration)) {

											// callbackBefore, callbackAfter
											if (jQuery.isFunction(callbackBefore)) {

												callbackAfter = callbackBefore;
												callbackBefore = duration;
												duration = 0;

											// callbackAfter
											} else {

												callbackAfter = duration;
												duration = 0;
											}

										} else {

											// duration, callbackAfter
											if (!jQuery.isFunction(callbackAfter)) {

												callbackAfter = callbackBefore;
												callbackBefore = undefined;
											}
										}
									}

									var pos = this._.methods.calcPosition();

									if (duration > 0) {

										// callback: before reposition
										if (jQuery.isFunction(callbackBefore)) {

											if (callbackBefore(this) === false) {

												return false;
											}
										}

										// animate position
										this.dom.element.animate(
											pos,
											duration,
											callbackAfter
										);

									} else {

										// callback: before reposition
										if (jQuery.isFunction(callbackBefore)) {

											if (callbackBefore(this) === false) {

												return false;
											}
										}

										// set position
										this.dom.element.css(pos);

										// callback: after reposition
										if (jQuery.isFunction(callbackAfter)) {

											callbackAfter(this);
										}
									}

									return true;
								},

								// empties the dialog content (fade out, empty)
								resetContent: function(callback, removeSelector) {

									// set empty content
									window.dom.content.fadeTo(
										self.options.current.animations.window.resize.duration,
										0.00,
										function() {

											if (removeSelector !== undefined) {

												window.dom.content.children(removeSelector).remove();

											} else {

												window.dom.content.html('');
											}

											// callback: on content reset
											if (jQuery.isFunction(callback)) {

												callback(self);
											}
										}
									);

									return true;
								},

								// considers the current browser viewport and limits the size of the dialog content to prevent overflow truncation
								resize: function(disableScrolling) {

									if (self.options.current.behavior.preventOverflow !== true) {

										return false;
									}

									var isFixed = ( (self.options.current.css.window.width !== undefined) || (self.options.current.css.window.height !== undefined) );

									// width of dialog window
									var actualWidth = self.options.current.css.window.width;
									if (/^[0-9]{1,3}%$/.test(actualWidth)) {

										actualWidth = ((actualWidth.replace('%', '') * jqWindow.width()) / 100);
									}
									if (isNaN(parseFloat(actualWidth))) {

										actualWidth = this.dom.element.outerWidth();
									}

									// height of dialog window
									var actualHeight = self.options.current.css.window.height;
									if (/^[0-9]{1,3}%$/.test(actualHeight)) {

										actualHeight = ((actualHeight.replace('%', '') * jqWindow.height()) / 100);
									}
									if (isNaN(parseFloat(actualHeight))) {

										actualHeight = this.dom.element.outerHeight();
									}

									// consider padding of dialog window
									var padding 	= this._.methods.getPadding(this.dom.element);
									var paddingH 	= (padding.left + padding.right);
									var paddingV 	= (padding.bottom + padding.top);

									// consider hard margin
									var marginH = self.options.current.css.window.hardMarginX;
									var marginV = self.options.current.css.window.hardMarginY;

									var actualOverflow = false;

									// calculate maximum width of dialog content to fit in browser viewport
									var maxViewportWidth = (jqWindow.width() - paddingH - marginH);
									if (actualWidth >= maxViewportWidth) {

										actualOverflow 	= true;
										actualWidth 	= maxViewportWidth;

										this.dom.element.css({
											minWidth: ''
										});

										this.dom.content.css({
											overflow: 'auto',
											maxWidth: actualWidth
										});

									} else {

										this.dom.content.css('max-width', '');

										if (isFixed) {

											this.dom.content.css('width', actualWidth - paddingH - marginH);

										} else {

											this.dom.content.css('width', '');
										}
									}

									// calculate maximum height of dialog content to fit in browser viewport
									var maxViewportHeight = (jqWindow.height() - paddingV - marginV);
									if (actualHeight >= maxViewportHeight) {

										actualOverflow 	= true;
										actualHeight 	= maxViewportHeight;

										this.dom.element.css({
											minHeight: ''
										});

										this.dom.content.css({
											overflow: 	'auto',
											maxHeight: 	actualHeight
										});

									} else {

										this.dom.content.css('max-height', '');

										if (isFixed) {

											this.dom.content.css('height', actualHeight - paddingV - marginV);

										} else {

											this.dom.content.css('height', '');
										}
									}

									// set/reset overflow
									this.dom.content.css('overflow', ( ( isFixed || actualOverflow ) ? 'auto' : '' ));

									// en/disable scrolling on body
									if (self.options.current.behavior.disableScrolling === 'auto') {

										if ( disableScrolling || isFixed || actualOverflow ) {

											UltimaDialog._.methods.disableScrolling(jqBody);

											// re-calculate actual width/height (add scrollbar width/height)
											this.dom.content.css({
												maxWidth: 	(jqWindow.width() - paddingH - marginH),
												maxHeight: 	(jqWindow.height() - paddingV - marginV)
											});

										} else {

											UltimaDialog._.methods.enableScrolling(jqBody);
										}
									}

									return true;
								},

								// resize and reposition dialog window
								relocate: function(animate) {

									var duration = 0;
									if (animate === true) {

										duration = self.options.current.animations.window.reposition.duration;
									}

									this.resize();
									this.reposition(duration);

									return true;
								},

								// place dialog content
								setContent: function(content, invokeCallback) {

									if (!content) {

										window.resetContent();
										return false;
									}

									window._.properties.isAjax = false;

									// remember url of source
									window._.properties.url = location.href;

									// ajax
									if (/^(GET|POST|PUT|DELETE)$/i.test(content.method)) {

										window._.properties.isAjax = true;

										// set content for pending ajax (loading notification)
										window._.methods.setLoading();

										// merge ajax request arguments
										var ajaxSettings = jQuery.extend(true, content.settings, {

											type: 	content.method,
											url: 	content.url,
											data: 	content.data,
											cache: 	self.options.current.behavior.ajax.cache,

											// request successful
											success: function(response) {

												// callback: on async success
												if (jQuery.isFunction(self.options.current.callbacks.onAsyncSuccess)) {

													if (self.options.current.callbacks.onAsyncSuccess(self, response) === false) {

														return false;
													}
												}

												// fixate size to prevent flickering on upcoming resize
												window._.methods.rememberSize(window.dom.element);

												// predict size to smoothen the resize
												var size 	= window._.methods.calcSize(response);
												var pos 	= window._.methods.calcPosition(size.width, size.height);

												window.resetContent(function() {

													// reset reference to loading notification
													window.dom.loading = undefined;

													window.dom.element.animate(
														{
															'min-height': 	size.height,
															left: 			pos.left,
															top: 			pos.top,
															'min-width': 	size.width
														},
														self.options.current.animations.window.resize.duration,
														function() {

															// callback: on content ready
															if (jQuery.isFunction(self.options.current.callbacks.onContentReady)) {

																if (self.options.current.callbacks.onContentReady(self, response) === false) {

																	return;
																}
															}

															// place content
															window.dom.content.html(response);

															// attach submit tracking
															if (self.options.current.behavior.trackSubmit === true) {

																window._.methods.attachSubmitTracking();
															}

															// resize for dialog content
															window.resize();

															// display content
															window.dom.content.fadeTo(
																self.options.current.animations.window.show.duration,
																1.00,
																function() {

																	// callback: on content visible
																	if (jQuery.isFunction(self.options.current.callbacks.onContentVisible)) {

																		self.options.current.callbacks.onContentVisible(self);
																	}
																}
															);
														}
													);
												});
											},

											// request failed
											error: function(qXHR) {

												var response = (qXHR.status + ': ' + qXHR.statusText);

												// callback: on async error
												if (jQuery.isFunction(self.options.current.callbacks.onAsyncError)) {

													self.options.current.callbacks.onAsyncError(self, qXHR);
												}

												// fixate size to prevent flickering
												window._.methods.rememberSize(window.dom.element);

												// predict size to smoothen the resize
												var size 	= window._.methods.calcSize(response);
												var pos 	= window._.methods.calcPosition(size.width, size.height);

												window.resetContent(function() {

													// reset reference to loading notification
													window.dom.loading = undefined;

													window.dom.element.animate(
														{
															'min-height': 	size.height,
															left: 			pos.left,
															top: 			pos.top,
															'min-width': 	size.width
														},
														self.options.current.animations.window.resize.duration,
														function() {

															// callback: on content ready
															if (jQuery.isFunction(self.options.current.callbacks.onContentReady)) {

																if (self.options.current.callbacks.onContentReady(self, response) === false) {

																	return;
																}
															}

															// place content
															window.dom.content.html(response);

															// resize for dialog content
															window.resize();

															// display content
															window.dom.content.fadeTo(
																self.options.current.animations.window.show.duration,
																1.00,
																function() {

																	// callback: on content visible
																	if (jQuery.isFunction(self.options.current.callbacks.onContentVisible)) {

																		self.options.current.callbacks.onContentVisible(self);
																	}
																}
															);
														}
													);
												});
											}
										});

										// remember url of source
										window._.properties.url = ajaxSettings.url;

										// remember query string (GET only)
										if (content.method === 'GET') {

											window.query = ajaxSettings.data;

										} else {

											window.query = '';
										}

										// send ajax request
										jQuery.ajax(ajaxSettings);

									// iframe
									} else if (content.media === 'iframe') {

										// initialize "invisible" iframe to allow preloading
										var iframe = jQuery('<iframe>').css({
											height: 	0,
											opacity: 	0.00,
											width: 		0
										});

										if (!content.attributes) {

											content.attributes = {};
										}

										// ensure width attribute
										if (typeof content.attributes.width !== 'number') {

											content.attributes.width = 640;
										}

										// ensure height attribute
										if (typeof content.attributes.height !== 'number') {

											content.attributes.height = 360;
										}

										iframe.attr(content.attributes);
										iframe.attr('src', content.resource);

										// place content (to trigger the loading process)
										window.dom.content.html(iframe);

										iframe.on('load', function() {

											// unbind event
											iframe.unbind('load');

											// callback: on async success
											if (jQuery.isFunction(self.options.current.callbacks.onAsyncSuccess)) {

												if (self.options.current.callbacks.onAsyncSuccess(self, content.resource) === false) {

													return false;
												}
											}

											// fixate size to prevent flickering on upcoming resize
											window._.methods.rememberSize(window.dom.element);

											// predict size to smoothen the resize
											var padding = window._.methods.getPadding(window.dom.element);
											var size 	= {
												width: 	( isNaN(parseInt(iframe.attr('width'),  10)) ? 0 : parseInt(iframe.attr('width'),  10) ) + ( self._.properties.simulateBorderBox ? 0 : (padding.left + padding.right)),
												height: ( isNaN(parseInt(iframe.attr('height'), 10)) ? 0 : parseInt(iframe.attr('height'), 10) ) + ( self._.properties.simulateBorderBox ? 0 : (padding.bottom + padding.top) )
											};
											var pos 	= window._.methods.calcPosition(size.width, size.height);

											window.resetContent(function() {

												// reset reference to loading notification
												window.dom.loading = undefined;

												window.dom.element.animate(
													{
														'min-height': 	size.height,
														left: 			pos.left,
														top: 			pos.top,
														'min-width': 	size.width
													},
													self.options.current.animations.window.resize.duration,
													function() {

														iframe.css({

															height: '',
															opacity: 1.00,
															width: ''

														});

														// callback: on content ready
														if (jQuery.isFunction(self.options.current.callbacks.onContentReady)) {

															if (self.options.current.callbacks.onContentReady(self, iframe) === false) {

																return;
															}
														}

														// resize for dialog content
														window.resize();

														// display content
														window.dom.content.fadeTo(
															self.options.current.animations.window.show.duration,
															1.00,
															function() {

																// callback: on content visible
																if (jQuery.isFunction(self.options.current.callbacks.onContentVisible)) {

																	self.options.current.callbacks.onContentVisible(self);
																}
															}
														);
													}
												);

											}, ':not(iframe)');
										});

										// set content for pending iframe load (loading notification)
										window._.methods.setLoading();

									// image
									} else if (content.media === 'image') {

										var preload = jQuery('<img>');

										preload.on('load', function() {

											// callback: on async success
											if (jQuery.isFunction(self.options.current.callbacks.onAsyncSuccess)) {

												if (self.options.current.callbacks.onAsyncSuccess(self, content.resource) === false) {

													return false;
												}
											}

											// fixate size to prevent flickering on upcoming resize
											window._.methods.rememberSize(window.dom.element);

											// predict size to smoothen the resize
											var size 	= window._.methods.calcSize(preload);
											var pos 	= window._.methods.calcPosition(size.width, size.height);

											window.resetContent(function() {

												// reset reference to loading notification
												window.dom.loading = undefined;

												window.dom.element.animate(
													{
														'min-height': 	size.height,
														left: 			pos.left,
														top: 			pos.top,
														'min-width': 	size.width
													},
													self.options.current.animations.window.resize.duration,
													function() {

														// callback: on content ready
														if (jQuery.isFunction(self.options.current.callbacks.onContentReady)) {

															if (self.options.current.callbacks.onContentReady(self, preload) === false) {

																return;
															}
														}

														// place content
														window.dom.content.html(preload);

														// resize for dialog content
														window.resize();

														// display content
														window.dom.content.fadeTo(
															self.options.current.animations.window.show.duration,
															1.00,
															function() {

																// callback: on content visible
																if (jQuery.isFunction(self.options.current.callbacks.onContentVisible)) {

																	self.options.current.callbacks.onContentVisible(self);
																}
															}
														);
													}
												);
											});
										});

										if (!content.attributes) {

											content.attributes = {};
										}

										// transform width
										if (content.attributes.width) {

											preload.css('width', content.attributes.width);
											delete content.attributes.width;

										} else {

											preload.css('width', 'auto');
										}

										// transform height
										if (content.attributes.height) {

											preload.css('height', content.attributes.height);
											delete content.attributes.height;

										} else {

											preload.css('height', 'auto');
										}

										preload.attr(content.attributes);
										preload.attr('src', content.resource);

										// set content for pending image load (loading notification)
										window._.methods.setLoading();

									// video, audio
									} else if ( (content.media === 'video') || (content.media === 'audio') ) {

										// initialize "invisible" media element to allow preloading
										var media = jQuery('<' + content.media + '>')
											.attr('controls', 'controls')
											.css({

												height: 	0,
												opacity: 	0.00,
												width: 		0

											})
										;

										if (!jQuery.isArray(content.resource)) {

											content.resource = [ content.resource ];
										}

										jQuery.each(content.resource, function(i, url) {

											var src = jQuery('<source>').attr('src', url);

											media.append(src);
										});

										media.append(
											jQuery('<a>').attr('href', content.resource[0]).text(content.resource[0])
										);

										var minSize = {

											video: {
												width: 	640,
												height: 360
											},

											audio: {
												width: 	320,
												height: 30
											}

										};

										// Internet Explorer controls
										if ( jqWindow[0].ActiveXObject || ('ActiveXObject' in jqWindow[0]) ) {

											minSize.audio.width 	= 580;
											minSize.audio.height 	= 80;
										}

										if (!content.attributes) {

											content.attributes = {};
										}

										// ensure width attribute
										if (typeof content.attributes.width !== 'number') {

											content.attributes.width = minSize[content.media].width;
										}

										// ensure height attribute
										if (typeof content.attributes.height !== 'number') {

											content.attributes.height = minSize[content.media].height;
										}

										media.attr(content.attributes);
										media.attr('src', content.resource);

										// place content (to trigger the loading process)
										window.dom.content.html(media);

										var mediaLoad = function() {

											// callback: on async success
											if (jQuery.isFunction(self.options.current.callbacks.onAsyncSuccess)) {

												if (self.options.current.callbacks.onAsyncSuccess(self, content.resource) === false) {

													return false;
												}
											}

											// fixate size to prevent flickering on upcoming resize
											window._.methods.rememberSize(window.dom.element);

											// predict size to smoothen the resize
											var padding = window._.methods.getPadding(window.dom.element);
											var size 	= {
												width: 	( isNaN(parseInt(media.attr('width'), 10)) ? 0 : parseInt(media.attr('width'), 10) ) + (padding.left + padding.right),
												height: ( isNaN(parseInt(media.attr('height'), 10)) ? 0 : parseInt(media.attr('height'), 10) ) + (padding.bottom + padding.top)
											};
											var pos 	= window._.methods.calcPosition(size.width, size.height);

											window.resetContent(function() {

												// reset reference to loading notification
												window.dom.loading = undefined;

												window.dom.element.animate(
													{
														'min-height': 	size.height,
														left: 			pos.left,
														top: 			pos.top,
														'min-width': 	size.width
													},
													self.options.current.animations.window.resize.duration,
													function() {

														media.css({

															height: 	'',
															opacity: 	1.00,
															width: 		content.attributes.width

														});

														// callback: on content ready
														if (jQuery.isFunction(self.options.current.callbacks.onContentReady)) {

															if (self.options.current.callbacks.onContentReady(self, media) === false) {

																return;
															}
														}

														// resize for dialog content
														window.resize();

														// display content
														window.dom.content.fadeTo(
															self.options.current.animations.window.show.duration,
															1.00,
															function() {

																// callback: on content visible
																if (jQuery.isFunction(self.options.current.callbacks.onContentVisible)) {

																	self.options.current.callbacks.onContentVisible(self);
																}
															}
														);
													}
												);

											}, ':not(' + content.media + ')');
										};

										if (self._.properties.supportsMedia) {

											media[0].onloadstart = mediaLoad;

										} else {

											// callback: on async error
											if (jQuery.isFunction(self.options.current.callbacks.onAsyncError)) {

												self.options.current.callbacks.onAsyncError(self, 'Browser does not support the required media tag: ' + content.media);
											}

											setTimeout(mediaLoad, 200);
										}

										// set content for pending iframe load (loading notification)
										window._.methods.setLoading();

									// plain
									} else if (typeof content === 'string') {

										if (self.options.current.behavior.translateMedia === true) {

											if (/\.(gif|jpe?g|png)(\?|$)/i.test(content)) {

												return window.setContent({ media: 'image', resource: content });
											}

											if (/\.(mp3)(\?|$)/i.test(content)) {

												return window.setContent({ media: 'audio', resource: content });
											}
										}

										// callback: on content ready
										if ((invokeCallback !== false) && jQuery.isFunction(self.options.current.callbacks.onContentReady)) {

											if (self.options.current.callbacks.onContentReady(self, content) === false) {

												return false;
											}
										}

										// set content
										window.dom.content.html(content);

										// attach submit tracking
										if (self.options.current.behavior.trackSubmit === true) {

											window._.methods.attachSubmitTracking();
										}

									// element
									} else {

										content = jQuery(content).clone(true);

										// remove all "id" attributes in the cloned content
										content
											.removeAttr('id')
											.find('[id]').removeAttr('id')
										;

										// substitute label for/id by converting [data-ultimadialog-id] and [data-ultimadialog-for]
										content.find('[data-ultimadialog-id]').each(function() {

											var e 		= jQuery(this);
											var refID 	= e.attr('data-ultimadialog-id');
											var randID 	= ( refID + Math.floor( Math.random() * 10000 ) );

											e.attr('id', randID);
											content.find('[data-ultimadialog-for="' + refID + '"]').attr('for', randID);
										});

										// callback: on content ready
										if ((invokeCallback !== false) && jQuery.isFunction(self.options.current.callbacks.onContentReady)) {

											if (self.options.current.callbacks.onContentReady(self, content) === false) {

												return false;
											}
										}

										// set content (clone element)
										window.dom.content.html(
											content.show()
										);

										// attach submit tracking
										if (self.options.current.behavior.trackSubmit === true) {

											window._.methods.attachSubmitTracking();
										}
									}

									return true;
								},

								// show window (fade in dialog window, fade in dialog content)
								show: function(isAsync) {

									// closure scope
									var that = this;

									switch (self.options.current.animations.window.show.effect) {

										// case 'fadeIn':
										default:

											// do not wait for curtain to be opened
											if (self.options.current.animations.curtain.deferProgression !== true) {

												this.dom.content.css('opacity', 1.00);
											}

											// show dialog window
											this.dom.element.fadeIn(
												self.options.current.animations.window.show.duration,
												function() {

													// callback: on dialog window opened
													if (jQuery.isFunction(self.options.current.callbacks.onWindowOpened)) {

														self.options.current.callbacks.onWindowOpened(self);
													}

													// wait for curtain to be fully opened
													if (self.options.current.animations.curtain.deferProgression === true) {

														// show dialog content
														that.dom.content.fadeTo(
															self.options.current.animations.window.resize.duration,
															1.00,
															function() {

																// callback: on dialog content visible
																if ((isAsync !== true) && jQuery.isFunction(self.options.current.callbacks.onContentVisible)) {

																	self.options.current.callbacks.onContentVisible(self);
																}
															}
														);

													} else {

														// callback: on dialog content visible
														if ((isAsync !== true) && jQuery.isFunction(self.options.current.callbacks.onContentVisible)) {

															self.options.current.callbacks.onContentVisible(self);
														}
													}
												}
											);

											break;
									}

									return true;
								}

							// END: public methods
						};

						// BEGIN: build element

							// BEGIN: appearance

								// class
								window.dom.element.addClass(self._.properties.classNames.window.frame);
								window.dom.element.addClass(self.options.current.css.window.className);

								// BEGIN: inline CSS

									var cssAttr = {};

									if (!self.options.current.css.window.className) {

										cssAttr.backgroundColor = '#FFFFFF';
										cssAttr.color 			= '#000000';
									}

									jQuery.extend(true, cssAttr, self.options.current.css.window);
									jQuery.extend(true, cssAttr, {
										boxSizing: 	'border-box',
										position: 	'fixed',
										zIndex: 	(self.options.current.css.window.zIndex + UltimaDialog.collection.length)
									});

									// style
									window.dom.element.css(cssAttr);

								// END: inline CSS

							// END: appearance

							// BEGIN: content

								// class
								window.dom.content.addClass(self._.properties.classNames.window.content);

								// append content to window
								window.dom.element.append(window.dom.content);

								// prevent executing script tags when building the shadow
								if ((shadow !== undefined) && (typeof content === 'string')) {

									content = content.replace(/<script/ig, '<scriptdisabled style="display: none !important;"');
									content = content.replace(/<\/script/ig, '</scriptdisabled');
								}

								// apply content
								window.setContent(content, (shadow === undefined));

							// END: content

							// BEGIN: close button

								// closing on window even allowed
								if (self.options.current.behavior.closeOnWindow === true) {

									// BEGIN: build element

										// BEGIN: appearance

											window.dom.closeButton = jQuery('<div></div>');

											// class
											window.dom.closeButton.addClass(self._.properties.classNames.window.close);
											window.dom.closeButton.addClass(self.options.current.css.window.close.className);

											// BEGIN: inline CSS

												// style
												window.dom.closeButton.css(self.options.current.css.window.close);

											// END: inline CSS

										// END: appearance

										// set content
										window.dom.closeButton.html(self.options.current.css.window.close.content);

										// prepend close button to window
										window.dom.element.prepend(window.dom.closeButton);

										// BEGIN: events

											// close on click
											window.dom.closeButton.click(function() {

												self.close();
											});

										// END: events

									// END: build element

								}

							// END: close button

							if (shadow !== true) {

								// BEGIN: events

									// BEGIN: on pressing ESC key

										// unbind global handler
										jQuery(document).unbind('keydown', UltimaDialog._.methods.closeOnEscape);

										if (self.options.current.behavior.closeOnEscape === true) {

											// bind global handler
											jQuery(document).bind('keydown', UltimaDialog._.methods.closeOnEscape);
										}

									// END: on pressing ESC key

									// on resize of browser window by user
									jqWindow.resize(function() {

										UltimaDialog._.methods.resizePolling(self.options.current.animations.window.resize.rate);
									});

								// END: events

							}

						// END: build element

						// register as new dialog
						if (shadow !== true) {

							UltimaDialog.collection.push(self);
						}

						return window;
					},

					mergeOptions: function(options1, options2) {

						self._.methods.translateOptions(options2);

						var result = {};
						jQuery.extend(true, result, options1);
						jQuery.extend(true, result, options2);

						// BEGIN: curtain

							if (result.animations.curtain.hide.effect === undefined) {

								result.animations.curtain.hide.effect = result.animations.curtain.show.effect;
							}

							if (result.animations.curtain.hide.duration === undefined) {

								result.animations.curtain.hide.duration = result.animations.curtain.show.duration;
							}

						// END: curtain

						// BEGIN: window

							if (result.animations.window.hide.effect === undefined) {

								result.animations.window.hide.effect = result.animations.window.show.effect;
							}

							if (result.animations.window.hide.duration === undefined) {

								result.animations.window.hide.duration = result.animations.window.show.duration;
							}

						// END: window

						return result;
					},

					translateOptions: function(options) {

						var buffer, length, i, result, ref;

						for (var key in options) {

							if (!options.hasOwnProperty(key)) {

								continue;
							}

							if (key.indexOf('->') !== 0) {

								continue;
							}

							buffer = key.replace('->', '');
							buffer = buffer.split('.');
							length = buffer.length;

							result = {};
							ref = result;

							for (i = 0; i < (length - 1); i++) {

								ref[buffer[i]] = {};
								ref = ref[buffer[i]];
							}

							ref[buffer[length - 1]] = options[key];

							delete options[key];
							jQuery.extend(true, options, result);
						}

						return options;
					}

				};

			// END: private methods

			// BEGIN: constructor

				// prepare options
				this.options.current = this._.methods.mergeOptions(this.options['default'], UltimaDialog.options);
				this.options.current = this._.methods.mergeOptions(this.options.current, options);

			// END: constructor

		};

		// keep track of the opened dialogs
		UltimaDialog.collection = [];

		UltimaDialog.options = {};

		// BEGIN: static

			// private scope
			UltimaDialog._ = {
				properties: {},
				methods: {}
			};

			// BEGIN: private properties

				UltimaDialog._.properties.resizePollingTimer = null;

			// END: private properties

			// BEGIN: private methods

				// close specific opened dialog
				UltimaDialog._.methods.closeByIndex = function(index, step, animation) {
					//                                function(index, animation)

					if (typeof step === 'boolean') {

						animation = step;
						step = undefined;
					}

					var dialog = UltimaDialog.collection[index];
					if (!dialog) {

						return false;
					}

					if (typeof step !== 'number') {

						step = -1;
					}

					dialog.close(
						function() {

							UltimaDialog._.methods.closeByIndex(index + step, animation);
						},
						animation
					);

					return true;
				};

				// close the last opened dialog (event for pressing the ESC key)
				UltimaDialog._.methods.closeOnEscape = function(event) {

					// consider ESC only
					if (event.which === 27) {

						UltimaDialog.close(false);
					}
				};

				UltimaDialog._.methods.disableScrolling = function(element) {

					element.css({
						'overflow': 					'hidden',
						'-webkit-backface-visibility': 	'hidden'
					});

					return true;
				};

				UltimaDialog._.methods.enableScrolling = function(element) {

					element.css({
						'overflow': 					'',
						'-webkit-backface-visibility': 	''
					});

					return true;
				};

				// returns if the provided data is a dialog options object
				UltimaDialog._.methods.isOptions = function(data) {

					if (!jQuery.isPlainObject(data)) {

						return false;
					}

					if (
						(data.animations && jQuery.isPlainObject(data.animations)) ||
						(data.behavior && jQuery.isPlainObject(data.behavior)) ||
						(data.css && jQuery.isPlainObject(data.css)) ||
						(data.callbacks && jQuery.isPlainObject(data.callbacks))
					) {

						return true;
					}

					for (var key in data) {

						if (!data.hasOwnProperty(key)) {

							continue;
						}

						if (/^->[a-z]+(\.[a-z]+)?/.test(key)) {

							return true;
						}
					}

					return false;
				};

				UltimaDialog._.methods.resizePolling = function(rate) {

					clearTimeout(UltimaDialog._.properties.resizePollingTimer);
					UltimaDialog._.properties.resizePollingTimer = setTimeout(UltimaDialog.relocate, rate);
				};

				// submit a form within the last opened dialog
				UltimaDialog._.methods.submit = function(form, ajaxSettings) {

					// form tag expected
					var jqForm = jQuery(form);
					if (!jqForm.is('form')) {

						return false;
					}

					var len = UltimaDialog.collection.length;
					if (len === 0) { return false; }

					var dialog = UltimaDialog.collection[len - 1];

					// BEGIN: rebuild form action

						var url 		= jqForm.attr('action');
						var endpoint 	= '';

						if (typeof url === 'string') {

							var pos = url.lastIndexOf('?');
							if (pos >= 0) {

								endpoint = url.substring(0, pos);

							} else {

								endpoint = url;
							}
						}

						// fix empty action
						if (endpoint.length === 0) {

							url = dialog.window._.properties.url;

							if (dialog.window.query) {

								if (jQuery.isPlainObject(dialog.window.query)) {

									url += '?' + jQuery.param(dialog.window.query);

								} else if (dialog.window.query.length > 0) {

									url += '?' + dialog.window.query;
								}
							}
						}

						var method = jqForm.attr('method');
						if (!/^(GET|POST|PUT|DELETE)$/i.test(method)) {

							method = 'GET';
						}

					// END: rebuild form action

					// form data
					var data = jqForm.serialize();

					// callback: on submit
					if (jQuery.isFunction(dialog.options.current.callbacks.onSubmit)) {

						if (dialog.options.current.callbacks.onSubmit(dialog, data) === false) {

							return false;
						}
					}

					// reset content
					dialog.window.resetContent(function() {

						// perform submission (send ajax request)
						dialog.window.setContent(
							{
								method: 	method.toUpperCase(),
								url: 		url,
								data: 		data,
								settings: 	ajaxSettings
							},
							false
						);

						if (dialog.window.dom.loading) {

							// determine position within dialog
							dialog.window.dom.loading.css(
								dialog.window._.methods.calcInnerPosition(dialog.window.dom.loading)
							);
						}
					});

					// always return false to interrupt the actual submit
					return false;
				};

			// END: private methods

			// BEGIN: public methods

				// close the last opened dialog
				UltimaDialog.close = function(index, animate) {
					//               function(animate)

					// (animate)
					if (typeof index === 'boolean') {

						animate = index;
						index 	= undefined;
					}

					if (index === undefined) {

						if (UltimaDialog.collection.length > 0) {

							index = (UltimaDialog.collection.length - 1);
						}
					}
					if ((typeof index !== 'number') || isNaN(index)) {

						return false;
					}

					var dialog = UltimaDialog.get(
						( isNaN(parseInt(index)) ? UltimaDialog.collection.length : parseInt(index) )
					);

					if (dialog === null) {

						return false;
					}

					// trigger close on dialog
					dialog.close(
						( (animate === false) ? 0 : undefined )
					);

					return true;
				};

				// close all opened dialogs
				UltimaDialog.closeAll = function(animate, deferProgression) {

					var len = UltimaDialog.collection.length;
					if (len > 0) {

						// close every opened dialog (trigger in sequence)
						if (deferProgression === true) {

							UltimaDialog._.methods.closeByIndex(
								len - 1,
								-1,
								animate
							);

							return true;
						}

						// close every opened dialog (trigger all at once)
						var i = (len - 1);
						for (i; i >= 0; i -= 1) {

							UltimaDialog.collection[i].close(
								( (animate === false) ? 0 : undefined )
							);
						}

						return true;
					}

					return false;
				};

				// returns the last opened dialog
				UltimaDialog.get = function(index) {

					var len = UltimaDialog.collection.length;
					if (len === 0) {

						return null;
					}

					if (index === undefined) {

						index = (len - 1);
					}

					if (typeof index === 'string') {

						index = parseInt(index, 10);
					}
					if ((typeof index !== 'number') || isNaN(index) || (index >= len)) {

						return null;
					}

					return UltimaDialog.collection[index];
				};

				// returns if a dialog is currently opened
				UltimaDialog.isOpened = function(index) {

					return (UltimaDialog.get(index) !== null);
				};

				// relocate the last opened dialog
				UltimaDialog.relocate = function(index) {

					var dialog = UltimaDialog.get(index);

					if (dialog === null) {

						return false;
					}

					dialog.window.relocate(true);

					return true;
				};

				UltimaDialog.setOptions = function(index, options, overwrite) {
					//                    function(index, options)
					//                    function(options, overwrite)
					//                    function(options)

					if (typeof index !== 'number') {

						// (options, overwrite)
						if (typeof options === 'boolean') {

							overwrite = options;
						}

						// (options)
						options = index;
						index 	= undefined;
					}

					var dialog = UltimaDialog.get(index);

					if (dialog === null) {

						return false;
					}

					if (overwrite === true) {

						dialog.options.current = dialog._.methods.mergeOptions({}, options);

					} else {

						dialog.options.current = dialog._.methods.mergeOptions(dialog.options.current, options);
					}

					return true;
				};

			// END: public methods

		// END: static

		// BEGIN: jQuery integration

			// option defaults for all jQuery integrated calls
			jQuery.UltimaDialog = {
				options: {}
			};

			jQuery.UltimaDialog.show = function(message, options) {

				var mergedOptions = {};
				jQuery.extend(true, mergedOptions, jQuery.UltimaDialog.options);
				jQuery.extend(true, mergedOptions, options);

				var dialog = new UltimaDialog(mergedOptions);
				dialog.show(message);

				return dialog;
			};

			jQuery.each([ 'image', 'video', 'audio', 'iframe' ], function(i, type) {

				jQuery.UltimaDialog[type] = function(url, attributes, options) {
					//                      function(url, attributes)
					//                      function(url, options)
					//                      function(url)

					if (url === undefined) {

						return null;
					}

					var len = arguments.length;

					if (len === 2) {

						// url, options
						if (UltimaDialog._.methods.isOptions(attributes)) {

							options 	= attributes;
							attributes 	= undefined;

						}
						// url, attributes
					}

					var mergedOptions = {};
					jQuery.extend(true, mergedOptions, jQuery.UltimaDialog.options);
					jQuery.extend(true, mergedOptions, options);

					var dialog = new UltimaDialog(mergedOptions);
					dialog[type](url, attributes);

					return dialog;
				};
			});

			jQuery.each([ 'get', 'post', 'put', 'delete' ], function(i, type) {

				jQuery.UltimaDialog[type] = function(url, data, callback, options) {
					//                      function(url, data, callback)
					//                      function(url, data, options)
					//                      function(url, data)
					//                      function(url, callback)
					//                      function(url, options)
					//                      function(url)

					if (url === undefined) {

						return null;
					}

					var len = arguments.length;

					if (len === 3) {

						// url, data, options
						if (!jQuery.isFunction(callback)) {

							options 	= callback;
							callback 	= undefined;

						// url, data, callback
						}

					} else if (len === 2) {

						// url, callback
						if (jQuery.isFunction(data)) {

							callback 	= data;
							data 		= undefined;

						// url, options
						} else if (UltimaDialog._.methods.isOptions(data)) {

							options = data;
							data 	= undefined;

						// url, data
						}

					}

					var mergedOptions = {};
					jQuery.extend(true, mergedOptions, jQuery.UltimaDialog.options);
					jQuery.extend(true, mergedOptions, options);

					// translate callback
					if (callback !== undefined) {

						if (!jQuery.isPlainObject(mergedOptions.callbacks)) {

							mergedOptions.callbacks = {};
						}

						mergedOptions.callbacks.onAsyncSuccess 	= callback;
						mergedOptions.callbacks.onAsyncError 	= callback;
					}

					var dialog = new UltimaDialog(mergedOptions);
					dialog[type](url, data);

					return dialog;
				};
			});

			jQuery.fn.UltimaDialog = function(options) {

				var mergedOptions = {};
				jQuery.extend(true, mergedOptions, jQuery.UltimaDialog.options);
				jQuery.extend(true, mergedOptions, options);

				this.each(function() {

					new UltimaDialog(mergedOptions).show(this);
				});

				return this;
			};

		// END: jQuery integration

		UltimaDialog.version = '0.95.3';
	}

}());