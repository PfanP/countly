 /**
 * Default Backbone View template from which all countly views should inherit.
 * A countly view is defined as a page corresponding to a url fragment such 
 * as #/manage/apps. This interface defines common functions or properties 
 * the view object has. A view may override any function or property.
 * @name countlyView
 * @global
 * @namespace countlyView
 * @example <caption>Extending default view and overwriting its methods</caption>
 *  window.DashboardView = countlyView.extend({
 *       renderCommon:function () {
 *           if(countlyGlobal["apps"][countlyCommon.ACTIVE_APP_ID]){
 *               var type = countlyGlobal["apps"][countlyCommon.ACTIVE_APP_ID].type;
 *               type = jQuery.i18n.map["management-applications.types."+type] || type;
 *               $(this.el).html("<div id='no-app-type'><h1>"+jQuery.i18n.map["common.missing-type"]+": "+type+"</h1></div>");
 *           }
 *           else{
 *               $(this.el).html("<div id='no-app-type'><h1>"+jQuery.i18n.map["management-applications.no-app-warning"]+"</h1></div>");
 *           }
 *       }
 *   });
 */
var countlyView = Backbone.View.extend({
    /**
    * Handlebar template
    * @type {object}
    * @instance
    * @memberof countlyView
    */
    template:null, //handlebars template of the view
    /**
    * Data to pass to Handlebar template when building it
    * @type {object}
    * @instance
    * @memberof countlyView
    */
    templateData:{}, //data to be used while rendering the template
    /**
    * Main container which contents to replace by compiled template
    * @type {jquery_object}
    * @instance
    * @memberof countlyView
    */
    el:$('#content'), //jquery element to render view into
    /**
    * Initialize view, overwrite it with at least empty function if you are using some custom remote template
    * @memberof countlyView
    * @instance
    */
    initialize:function () {    //compile view template
        this.template = Handlebars.compile($("#template-analytics-common").html());
    },
    /**
    * This method is called when date is changed, default behavior is to call refresh method of the view
    * @memberof countlyView
    * @instance
    */
    dateChanged:function () {    //called when user changes the date selected
        if (Backbone.history.fragment == "/") {
			this.refresh(true);
		} else {
			this.refresh();
		}
    },
    /**
    * This method is called when app is changed, default behavior is to call render again
    * @memberof countlyView
    * @instance
    */
    appChanged:function () {    //called when user changes selected app from the sidebar
        countlyEvent.reset();

        var self = this;
        $.when(countlyEvent.initialize()).then(function() {
            self.render();
        });
    },
    /**
    * This method is called before calling render, load your data and remote template if needed here
    * @memberof countlyView
    * @instance
    * @example
    *beforeRender: function() {
    *    if(this.template)
	*		return $.when(countlyDeviceDetails.initialize(), countlyTotalUsers.initialize("densities"), countlyDensity.initialize()).then(function () {});
	*	else{
	*		var self = this;
	*		return $.when($.get(countlyGlobal["path"]+'/density/templates/density.html', function(src){
	*			self.template = Handlebars.compile(src);
	*		}), countlyDeviceDetails.initialize(), countlyTotalUsers.initialize("densities"), countlyDensity.initialize()).then(function () {});
	*	}
    *}
    */
    beforeRender: function () {
        return true;
    },
    /**
    * This method is called after calling render method
    * @memberof countlyView
    * @instance
    */
    afterRender: function() {},
    /**
    * Main render method, better not to over write it, but use {@link countlyView.renderCommon} instead
    * @memberof countlyView
    * @instance
    */
    render:function () {    //backbone.js view render function
        $("#content-top").html("");
        this.el.html('');

        if (countlyCommon.ACTIVE_APP_ID) {
            var self = this;
            $.when(this.beforeRender(), initializeOnce()).then(function() {
                self.renderCommon();
                self.afterRender();
                app.pageScript();
            });
        } else {
            this.renderCommon();
            this.afterRender();
            app.pageScript();
        }

        return this;
    },
    /**
    * Do all your rendering in this method
    * @param {boolean} isRefresh - render is called from refresh method, so do not need to do initialization
    * @memberof countlyView
    * @instance
    * @example
    *renderCommon:function (isRefresh) {
    *    //set initial data for template
    *    this.templateData = {
    *        "page-title":jQuery.i18n.map["density.title"],
    *        "logo-class":"densities",
    *        "chartHTML": chartHTML,
    *    };
    *
    *    if (!isRefresh) {
    *        //populate template with data and add to html
    *        $(this.el).html(this.template(this.templateData));
    *    }
    *}
    */
    renderCommon:function (isRefresh) {}, // common render function of the view
    /**
    * Called when view is refreshed, you can reload data here or call {@link countlyView.renderCommon} with parameter true for code reusability
    * @memberof countlyView
    * @instance
    * @example
    * refresh:function () {
    *    var self = this;
    *    //reload data from beforeRender method
    *    $.when(this.beforeRender()).then(function () {
    *        if (app.activeView != self) {
    *            return false;
    *        }
    *        //re render data again
    *        self.renderCommon(true);
    *        
    *        //replace some parts manually from templateData
    *        var newPage = $("<div>" + self.template(self.templateData) + "</div>");
    *        $(self.el).find(".widget-content").replaceWith(newPage.find(".widget-content"));
    *        $(self.el).find(".dashboard-summary").replaceWith(newPage.find(".dashboard-summary"));
    *        $(self.el).find(".density-widget").replaceWith(newPage.find(".density-widget"));
    *    });
    *}
    */
    refresh:function () {    // resfresh function for the view called every 10 seconds by default
        return true;
    },
    /**
    * This method is called when user is active after idle period
    * @memberof countlyView
    * @instance
    */
    restart:function () { // triggered when user is active after idle period
        this.refresh();
    },
    /**
    * This method is called when view is destroyed (user entered inactive state or switched to other view) you can clean up here if there is anything to be cleaned
    * @memberof countlyView
    * @instance
    */
    destroy:function () {}
});

var initializeOnce = _.once(function() {
    return $.when(countlyEvent.initialize()).then(function() {});
});

var Template = function () {
    this.cached = {};
};
var T = new Template();

$.extend(Template.prototype, {
    render:function (name, callback) {
        if (T.isCached(name)) {
            callback(T.cached[name]);
        } else {
            $.get(T.urlFor(name), function (raw) {
                T.store(name, raw);
                T.render(name, callback);
            });
        }
    },
    renderSync:function (name, callback) {
        if (!T.isCached(name)) {
            T.fetch(name);
        }
        T.render(name, callback);
    },
    prefetch:function (name) {
        $.get(T.urlFor(name), function (raw) {
            T.store(name, raw);
        });
    },
    fetch:function (name) {
        // synchronous, for those times when you need it.
        if (!T.isCached(name)) {
            var raw = $.ajax({'url':T.urlFor(name), 'async':false}).responseText;
            T.store(name, raw);
        }
    },
    isCached:function (name) {
        return !!T.cached[name];
    },
    store:function (name, raw) {
        T.cached[name] = Handlebars.compile(raw);
    },
    urlFor:function (name) {
        //return "/resources/templates/"+ name + ".handlebars";
        return name + ".html";
    }
});

$.expr[":"].contains = $.expr.createPseudo(function(arg) {
    return function( elem ) {
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});

/**
 * Main app instance of Backbone AppRouter used to control views and view change flow
 * @name app
 * @global
 * @instance
 * @namespace app
 */
var AppRouter = Backbone.Router.extend({
    routes:{
        "/":"dashboard",
        "*path":"main"
    },
    /**
    * View that is currently being displayed
    * @type {countlyView}
    * @instance
    * @memberof app
    */
    activeView:null, //current view
    dateToSelected:null, //date to selected from the date picker
    dateFromSelected:null, //date from selected from the date picker
    activeAppName:'',
    activeAppKey:'',
    refreshActiveView:0, //refresh interval function reference
    /**
    * Navigate to another view programmatically. If you need to change the view without user clicking anything, like redirect. You can do this using this method. This method is not define by countly but is direct method of AppRouter object in Backbone js
    * @name app#navigate
    * @function
    * @instance
    * @param {string} fragment - url path (hash part) where to redirect user
    * @param {boolean=} triggerRoute - to trigger route call, like initialize new view, etc. Default is false, so you may want to use false when redirecting to URL for your own same view where you are already, so no need to reload it
    * @memberof app
    * @example <caption>Redirect to url of the same view</caption>
    * //you are at #/manage/systemlogs
    * app.navigate("#/manage/systemlogs/query/{}");
    *
    * @example <caption>Redirect to url of other view</caption>
    * //you are at #/manage/systemlogs
    * app.navigate("#/crashes", true);
    */
    main:function (forced) {
        var change = true,
            redirect = false;
        if(location.hash != "#/" && countlyGlobal["apps"][countlyCommon.ACTIVE_APP_ID]){
            $("#"+countlyGlobal["apps"][countlyCommon.ACTIVE_APP_ID].type+"-type a").each(function(){
                if(this.hash != "#/" && this.hash != ""){
                    if(location.hash == this.hash && $(this).css('display') != 'none' ){
                        change = false;
                        return false;
                    }
                    else if(location.hash.indexOf(this.hash) == 0 && $(this).css('display') != 'none'){
                        redirect = this.hash;
                        return false;
                    }
                }
            });
        }
        if(redirect){
            app.navigate(redirect, true);
        }
        else if(change){
            this.navigate("/", true);
            if(forced && this.activeView != this.appTypes[countlyGlobal["apps"][countlyCommon.ACTIVE_APP_ID].type]){
                this.dashboard();
            }
        }
    },
    dashboard:function () {
        if(_.isEmpty(countlyGlobal['apps']))
            this.renderWhenReady(this.manageAppsView);
        else if(typeof this.appTypes[countlyGlobal["apps"][countlyCommon.ACTIVE_APP_ID].type] != "undefined")
            this.renderWhenReady(this.appTypes[countlyGlobal["apps"][countlyCommon.ACTIVE_APP_ID].type]);
        else
            this.renderWhenReady(this.dashboardView);
    },
    runRefreshScripts: function() {
        if(this.refreshScripts[Backbone.history.fragment])
            for(var i = 0, l = this.refreshScripts[Backbone.history.fragment].length; i < l; i++)
                this.refreshScripts[Backbone.history.fragment][i]();
        for(var k in this.refreshScripts) 
            if (k !== '#' && k.indexOf('#') !== -1 && Backbone.history.fragment.match(k.replace(/#/g, '.*')))
                for(var i = 0, l = this.refreshScripts[k].length; i < l; i++)
                    this.refreshScripts[k][i]();
        if(this.refreshScripts["#"])
            for(var i = 0, l = this.refreshScripts["#"].length; i < l; i++)
                this.refreshScripts["#"][i]();

    },
    performRefresh: function (self) {
        //refresh only if we are on current period
        if(countlyCommon.periodObj.periodContainsToday){
            self.activeView.refresh();
            self.runRefreshScripts();
        }
    },
    renderWhenReady:function (viewName) { //all view renders end up here

        // If there is an active view call its destroy function to perform cleanups before a new view renders
        if (this.activeView) {
            this.activeView.destroy();
        }

        if (window.components && window.components.slider && window.components.slider.instance) {
            window.components.slider.instance.close();
        }

        this.activeView = viewName;
        clearInterval(this.refreshActiveView);
        if(typeof countlyGlobal["member"].password_changed === "undefined"){
            countlyGlobal["member"].password_changed = Math.round(new Date().getTime()/1000);
        }

        if (_.isEmpty(countlyGlobal['apps'])) {
            if (Backbone.history.fragment != "/manage/apps") {
                this.navigate("/manage/apps", true);
            } else {
                viewName.render();
            }
            return false;
        }
        else if(countlyGlobal["security"].password_expiration > 0 && countlyGlobal["member"].password_changed + countlyGlobal["security"].password_expiration*24*60*60 < new Date().getTime()/1000){
            if(Backbone.history.fragment != "/manage/user-settings/reset")
                this.navigate("/manage/user-settings/reset", true);
            else
                viewName.render();
            return false;
        }

        viewName.render();

        var self = this;
        this.refreshActiveView = setInterval(function(){self.performRefresh(self);}, countlyCommon.DASHBOARD_REFRESH_MS);
        
        if(countlyGlobal && countlyGlobal["message"]){
            CountlyHelpers.parseAndShowMsg(countlyGlobal["message"]);
        }

        // Init sidebar based on the current url
        self.sidebar.init();
    },
    sidebar: {
        init: function() {
            setTimeout(function() {
                $("#sidebar-menu").find(".item").removeClass("active menu-active");
                var selectedMenu = $($("#sidebar-menu").find("a[href='#" + Backbone.history.fragment + "']"));
               
                if(!selectedMenu.length){
                    var parts = Backbone.history.fragment.split("/");
                    selectedMenu = $($("#sidebar-menu").find("a[href='#/" + (parts[1] || "") + "']"));
                    if(!selectedMenu.length){
                        selectedMenu = $($("#sidebar-menu").find("a[href='#/" + (parts[1]+"/"+parts[2] || "") + "']"));
                    }
                }
                
                var selectedSubmenu = selectedMenu.parents(".sidebar-submenu");

                if (selectedSubmenu.length) {
                    selectedMenu.addClass("active");
                    selectedSubmenu.prev().addClass("active menu-active");
                    app.sidebar.submenu.toggle(selectedSubmenu);
                } else {
                    selectedMenu.addClass("active");
                    app.sidebar.submenu.toggle();
                }
            }, 1000);
        },
        submenu: {
            toggle: function(el) {
                $(".sidebar-submenu").removeClass("half-visible");

                if (!el) {
                    $(".sidebar-submenu:visible").animate({"right":"-170px"}, {duration:300, easing:'easeOutExpo', complete: function() {
                        $(this).hide();
                    }});
                    return true;
                }

                if (el.is(":visible")) {

                } else if ($(".sidebar-submenu").is(":visible")) {
                    $(".sidebar-submenu").hide();
                    el.css({"right":"-110px"}).show().animate({"right":"0"}, {duration:300, easing:'easeOutExpo'});
                    addText();
                } else {
                    el.css({"right":"-170px"}).show().animate({"right":"0"}, {duration:300, easing:'easeOutExpo'});
                    addText();
                }

                function addText() {
                    var mainMenuText = $(el.prev()[0]).find(".text").text();

                    $(".menu-title").remove();
                    var menuTitle = $("<div class='menu-title'></div>").text(mainMenuText).prepend("<i class='submenu-close ion-close'></i>");
                    el.prepend(menuTitle);

                    // Try setting submenu title once again if it was empty
                    // during previous try
                    if (!mainMenuText) {
                        setTimeout(function() {
                            $(".menu-title").text($(el.prev()[0]).find(".text").text());
                            $(".menu-title").prepend("<i class='submenu-close ion-close'></i>")
                        }, 1000);
                    }
                }
            }
        }
    },
    initialize:function () { //initialize the dashboard, register helpers etc.
		this.appTypes = {};
		this.pageScripts = {};
        this.dataExports = {};
        this.appSwitchCallbacks = [];
        this.appManagementSwitchCallbacks = [];
        this.appObjectModificators = [];
        this.appAddTypeCallbacks = [];
        this.userEditCallbacks = [];
		this.refreshScripts = {};

        Handlebars.registerPartial("date-selector", $("#template-date-selector").html());
        Handlebars.registerPartial("timezones", $("#template-timezones").html());
        Handlebars.registerPartial("app-categories", $("#template-app-categories").html());
        Handlebars.registerHelper('eachOfObject', function (context, options) {
            var ret = "";
            for (var prop in context) {
                ret = ret + options.fn({property:prop, value:context[prop]});
            }
            return ret;
        });
        Handlebars.registerHelper('eachOfObjectValue', function (context, options) {
            var ret = "";
            for (var prop in context) {
                ret = ret + options.fn(context[prop]);
            }
            return ret;
        });
        Handlebars.registerHelper('eachOfArray', function (context, options) {
            var ret = "";
            for (var i = 0; i < context.length; i++) {
                ret = ret + options.fn({index:i, value:context[i]});
            }
            return ret;
        });
		Handlebars.registerHelper('prettyJSON', function (context, options) {
            return JSON.stringify(context, undefined, 4);
        });
        Handlebars.registerHelper('getShortNumber', function (context, options) {
            return countlyCommon.getShortNumber(context);
        });
        Handlebars.registerHelper('getFormattedNumber', function (context, options) {
            if (isNaN(context)) {
                return context;
            }

            ret = parseFloat((parseFloat(context).toFixed(2)).toString()).toString();
            return ret.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
        });
        Handlebars.registerHelper('toUpperCase', function (context, options) {
            return context.toUpperCase();
        });
        Handlebars.registerHelper('appIdsToNames', function (context, options) {
            return CountlyHelpers.appIdsToNames(context);
        });
        Handlebars.registerHelper('forNumberOfTimes', function (context, options) {
            var ret = "";
            for (var i = 0; i < context; i++) {
                ret = ret + options.fn({count:i + 1});
            }
            return ret;
        });
        Handlebars.registerHelper('include', function (templatename, options) {
            var partial = Handlebars.partials[templatename];
            var context = $.extend({}, this, options.hash);
            return partial(context);
        });
		Handlebars.registerHelper('for', function(from, to, incr, block) {
			var accum = '';
			for(var i = from; i < to; i += incr)
				accum += block.fn(i);
			return accum;
		});
		Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
			switch (operator) {
				case '==':
					return (v1 == v2) ? options.fn(this) : options.inverse(this);
                case '!=':
					return (v1 != v2) ? options.fn(this) : options.inverse(this);
				case '===':
					return (v1 === v2) ? options.fn(this) : options.inverse(this);
				case '<':
					return (v1 < v2) ? options.fn(this) : options.inverse(this);
				case '<=':
					return (v1 <= v2) ? options.fn(this) : options.inverse(this);
				case '>':
					return (v1 > v2) ? options.fn(this) : options.inverse(this);
				case '>=':
					return (v1 >= v2) ? options.fn(this) : options.inverse(this);
				case '&&':
					return (v1 && v2) ? options.fn(this) : options.inverse(this);
				case '||':
					return (v1 || v2) ? options.fn(this) : options.inverse(this);
				default:
					return options.inverse(this);
			}
		});
        Handlebars.registerHelper('formatTimeAgo', function (context, options) {
            return countlyCommon.formatTimeAgo(parseInt(context)/1000);
        });
        Handlebars.registerHelper('withItem', function(object, options) {
            return options.fn(object[options.hash.key]);
        });

        var self = this;
        jQuery.i18n.properties({
            name:'locale',
            cache:true,
            language:countlyCommon.BROWSER_LANG_SHORT,
            path:[countlyGlobal["cdn"]+'localization/min/'],
            mode:'map',
            callback:function () {
                self.origLang = JSON.stringify(jQuery.i18n.map);
            }
        });

        $(document).ready(function ()  {

            CountlyHelpers.initializeSelect();
            CountlyHelpers.initializeTextSelect();
            CountlyHelpers.initializeMultiSelect();
			
			if(parseInt(countlyGlobal.config["session_timeout"])){
				var minTimeout, tenSecondTimeout, logoutTimeout, actionTimeout;
				var shouldRecordAction = false;
				var extendSession = function(){
					$.ajax({
						url:countlyGlobal["path"]+"/session",
						success:function (result) {
							if(result == "logout"){
								$("#user-logout").click();
								window.location = "/logout";
							}
							else if(result == "success"){
								shouldRecordAction = false;
								setTimeout(function(){
									shouldRecordAction = true;
								}, Math.round(countlyGlobal.config["session_timeout"]/2));
								resetSessionTimeouts(countlyGlobal.config["session_timeout"]);
							}
						}
					});
				}
				var resetSessionTimeouts = function(timeout){
					var minute = timeout - 60*1000;
					if(minTimeout){
						clearTimeout(minTimeout);
						minTimeout = null;
					}
					if(minute > 0){
						minTimeout = setTimeout(function(){
							CountlyHelpers.notify({title:jQuery.i18n.map["common.session-expiration"], message:jQuery.i18n.map["common.expire-minute"], info:jQuery.i18n.map["common.click-to-login"]})
						}, minute);
					}
					var tenSeconds = timeout - 10*1000;
					if(tenSecondTimeout){
						clearTimeout(tenSecondTimeout);
						tenSecondTimeout = null;
					}
					if(tenSeconds > 0){
						tenSecondTimeout = setTimeout(function(){
							CountlyHelpers.notify({title:jQuery.i18n.map["common.session-expiration"], message:jQuery.i18n.map["common.expire-seconds"], info:jQuery.i18n.map["common.click-to-login"]})
						}, tenSeconds);
					}
					if(logoutTimeout){
						clearTimeout(logoutTimeout);
						logoutTimeout = null;
					}
					logoutTimeout = setTimeout(function(){
						extendSession();
					}, timeout+1000);
				}
				resetSessionTimeouts(countlyGlobal.config["session_timeout"]);
				$(document).click(function (event) {
					if(shouldRecordAction)
						extendSession();
				});
				extendSession();
			}

            // If date range is selected initialize the calendar with these
            var periodObj = countlyCommon.getPeriod();
            if (Object.prototype.toString.call(periodObj) === '[object Array]' && periodObj.length == 2) {
                self.dateFromSelected = countlyCommon.getPeriod()[0];
                self.dateToSelected = countlyCommon.getPeriod()[1];
            }

            // Initialize localization related stuff

            // Localization test
            /*
             $.each(jQuery.i18n.map, function (key, value) {
             jQuery.i18n.map[key] = key;
             });
             */

            try {
                moment.locale(countlyCommon.BROWSER_LANG_SHORT);
            } catch(e) {
                moment.locale("en");
            }

            $(".reveal-language-menu").text(countlyCommon.BROWSER_LANG_SHORT.toUpperCase());

            $(".apps-scrollable").sortable({
                items:".app-container.app-navigate",
                revert:true,
                forcePlaceholderSize:true,
                handle:".drag",
                containment:"parent",
                tolerance:"pointer",
                stop:function () {
                    var orderArr = $(".apps-scrollable").sortable( "toArray", {attribute:"data-id"} );

                    $.ajax({
                        type:"POST",
                        url:countlyGlobal["path"]+"/dashboard/settings",
                        data:{
                            "app_sort_list":orderArr,
                            _csrf:countlyGlobal['csrf_token']
                        },
                        success:function (result) {
                        }
                    });
                }
            });

            $("#sort-app-button").click(function () {
                $(".app-container.app-navigate .drag").fadeToggle();
            });

            $(".app-navigate").live("click", function () {
                var appKey = $(this).data("key"),
                    appId = $(this).data("id"),
                    appName = $(this).find(".name").text(),
                    appImage = $(this).find(".logo").css("background-image"),
                    sidebarApp = $("#sidebar-app-select");

                if (self.activeAppKey == appKey) {
                    sidebarApp.removeClass("active");
                    $("#app-nav").animate({left:'31px'}, {duration:500, easing:'easeInBack'});
                    sidebarApp.find(".text").text(appName);
                    sidebarApp.find(".logo").css("background-image", appImage);
                    return false;
                }

                self.activeAppName = appName;
                self.activeAppKey = appKey;
                
                $("#app-nav").animate({left:'31px'}, {duration:500, easing:'easeInBack', complete:function () {
                    countlyCommon.setActiveApp(appId);
                    sidebarApp.find(".text").text(appName);
                    sidebarApp.find(".logo").css("background-image", appImage);
                    sidebarApp.removeClass("active");
                    app.onAppSwitch(appId);
                    self.activeView.appChanged();
                }});
            });
            
            $(document).on("mouseenter", ".app-container", function(){
                if(!$(this).find(".drag").is(":visible")){
                    var elem = $(this);
                    var name = elem.find(".name");

                    if(name[0].scrollWidth >  name.innerWidth()) {
                        elem.attr("title", name.text());
                    }
                }
            });

            $("#sidebar-events").click(function (e) {
                $.when(countlyEvent.refreshEvents()).then(function () {
                    if (countlyEvent.getEvents().length == 0) {
                        CountlyHelpers.alert(jQuery.i18n.map["events.no-event"], "black");
                        e.stopImmediatePropagation();
                        e.preventDefault();
                    }
                });
            });

            // SIDEBAR
            $("#sidebar-menu").on("click", ".submenu-close", function () {
                $(this).parents(".sidebar-submenu").animate({"right":"-170px"}, {duration:200, easing:'easeInExpo', complete: function() {
                    $(".sidebar-submenu").hide();
                    $("#sidebar-menu>.sidebar-menu>.item").removeClass("menu-active");
                }});
            });

            $("#sidebar-menu").on("click", ".item", function () {
                if ($(this).hasClass("menu-active")) {
                    return true;
                }

                $("#sidebar-menu>.sidebar-menu>.item").removeClass("menu-active");

                var elNext = $(this).next();

                if (elNext.hasClass("sidebar-submenu")) {
                    $(this).addClass("menu-active");
                    self.sidebar.submenu.toggle(elNext);
                } else {
                    $("#sidebar-menu").find(".item").removeClass("active");
                    $(this).addClass("active");

                    var mainMenuItem = $(this).parent(".sidebar-submenu").prev(".item");

                    if (mainMenuItem.length) {
                        mainMenuItem.addClass("active menu-active");
                    } else {
                        self.sidebar.submenu.toggle();
                    }

                    if ($("#app-nav").offset().left == 201) {
                        $("#app-nav").animate({left:'31px'}, {duration:500, easing:'easeInBack'});
                        $("#sidebar-app-select").removeClass("active");
                    }
                }
            });

            $("#sidebar-menu").hoverIntent({
                over: function() {
                    var visibleSubmenu = $(".sidebar-submenu:visible");

                    if (!$(this).hasClass("menu-active") && $(".sidebar-submenu").is(":visible") && !visibleSubmenu.hasClass("half-visible")) {
                        visibleSubmenu.addClass("half-visible");
                        visibleSubmenu.animate({"right":"-110px"}, {duration:300, easing:'easeOutExpo'});
                    }
                },
                out: function() { },
                selector: ".sidebar-menu>.item"
            });

            $("#sidebar-menu").hoverIntent({
                over: function() {},
                out: function() {
                    var visibleSubmenu = $(".sidebar-submenu:visible");

                    if ($(".sidebar-submenu").is(":visible") && visibleSubmenu.hasClass("half-visible")) {
                        visibleSubmenu.removeClass("half-visible");
                        visibleSubmenu.animate({"right":"0"}, {duration:300, easing:'easeOutExpo'});
                    }
                },
                selector: ""
            });

            $("#sidebar-menu").hoverIntent({
                over: function() {
                    var visibleSubmenu = $(".sidebar-submenu:visible");

                    if (visibleSubmenu.hasClass("half-visible")) {
                        visibleSubmenu.removeClass("half-visible");
                        visibleSubmenu.animate({"right":"0"}, {duration:300, easing:'easeOutExpo'});
                    }
                },
                out: function() {},
                selector: ".sidebar-submenu:visible"
            });

			$('#sidebar-menu').slimScroll({
				height: ($(window).height()-123-96+28)+'px',
				railVisible: true,
				railColor : '#4CC04F',
				railOpacity : .2,
				color: '#4CC04F'
			});

			$( window ).resize(function() {
				$('#sidebar-menu').slimScroll({
					height: ($(window).height()-123-96+28)+'px'
				});
			});

            $(".sidebar-submenu").on("click", ".item", function () {

                if ($(this).hasClass("disabled")) {
                    return true;
                }

                if ($("#app-nav").offset().left == 201) {
                    $("#app-nav").animate({left:'31px'}, {duration:500, easing:'easeInBack'});
                    $("#sidebar-app-select").removeClass("active");
                }

                $(".sidebar-submenu .item").removeClass("active");
                $(this).addClass("active");
                $(this).parent().prev(".item").addClass("active");
            });

            $("#sidebar-app-select").click(function () {

                if ($(this).hasClass("disabled")) {
                    return true;
                }

                if ($(this).hasClass("active")) {
                    $(this).removeClass("active");
                } else {
                    $(this).addClass("active");
                }

                $("#app-nav").show();
                var left = $("#app-nav").offset().left;

                if (left == 201) {
                    $("#app-nav").animate({left:'31px'}, {duration:500, easing:'easeInBack'});
                } else {
                    $("#app-nav").animate({left:'201px'}, {duration:500, easing:'easeOutBack'});
                }

            });

            $("#sidebar-bottom-container .reveal-menu").click(function () {
                $("#language-menu").hide();
                $("#sidebar-bottom-container .menu").toggle();
            });

            $("#sidebar-bottom-container .reveal-language-menu").click(function () {
                $("#sidebar-bottom-container .menu").hide();
                $("#language-menu").toggle();
            });

            $("#sidebar-bottom-container .item").click(function () {
                $("#sidebar-bottom-container .menu").hide();
                $("#language-menu").hide();
            });

            $("#language-menu .item").click(function () {
                var langCode = $(this).data("language-code"),
                    langCodeUpper = langCode.toUpperCase();

                store.set("countly_lang", langCode);
                $(".reveal-language-menu").text(langCodeUpper);

                countlyCommon.BROWSER_LANG_SHORT = langCode;
                countlyCommon.BROWSER_LANG = langCode;

                try {
                    moment.locale(countlyCommon.BROWSER_LANG_SHORT);
                } catch(e) {
                    moment.locale("en");
                }
                
                countlyCommon.getMonths(true);

                $("#date-to").datepicker("option", $.datepicker.regional[countlyCommon.BROWSER_LANG]);
                $("#date-from").datepicker("option", $.datepicker.regional[countlyCommon.BROWSER_LANG]);
                
                $.ajax({
                    type:"POST",
                    url:countlyGlobal["path"]+"/user/settings/lang",
                    data:{
                        "username":countlyGlobal["member"].username,
                        "lang":countlyCommon.BROWSER_LANG_SHORT,
                        _csrf:countlyGlobal['csrf_token']
                    },
                    success:function (result) {}
                });

                jQuery.i18n.properties({
                    name:'locale',
                    cache:true,
                    language:countlyCommon.BROWSER_LANG_SHORT,
                    path:[countlyGlobal["cdn"]+'localization/min/'],
                    mode:'map',
                    callback:function () {
                        self.origLang = JSON.stringify(jQuery.i18n.map);
                        $.when(countlyLocation.changeLanguage()).then(function () {
                            self.activeView.render();
                        });
                    }
                });
            });

            /*$("#account-settings").click(function () {
                CountlyHelpers.popup("#edit-account-details");
                $(".dialog #username").val($("#menu-username").text());
                $(".dialog #api-key").val($("#user-api-key").val());
            });*/

            $("#save-account-details:not(.disabled)").live('click', function () {
                var username = $(".dialog #username").val(),
                    old_pwd = $(".dialog #old_pwd").val(),
                    new_pwd = $(".dialog #new_pwd").val(),
                    re_new_pwd = $(".dialog #re_new_pwd").val(),
                    api_key = $(".dialog #api-key").val();

                if (new_pwd != re_new_pwd) {
                    $(".dialog #settings-save-result").addClass("red").text(jQuery.i18n.map["user-settings.password-match"]);
                    return true;
                }

                $(this).addClass("disabled");

                $.ajax({
                    type:"POST",
                    url:countlyGlobal["path"]+"/user/settings",
                    data:{
                        "username":username,
                        "old_pwd":old_pwd,
                        "new_pwd":new_pwd,
                        "api_key":api_key,
                        _csrf:countlyGlobal['csrf_token']
                    },
                    success:function (result) {
                        var saveResult = $(".dialog #settings-save-result");

                        if (result == "username-exists") {
                            saveResult.removeClass("green").addClass("red").text(jQuery.i18n.map["management-users.username.exists"]);
                        } else if (!result) {
                            saveResult.removeClass("green").addClass("red").text(jQuery.i18n.map["user-settings.alert"]);
                        } else {
                            saveResult.removeClass("red").addClass("green").text(jQuery.i18n.map["user-settings.success"]);
                            $(".dialog #old_pwd").val("");
                            $(".dialog #new_pwd").val("");
                            $(".dialog #re_new_pwd").val("");
                            $("#menu-username").text(username);
                            $("#user-api-key").val(api_key);
                            countlyGlobal["member"].username = username;
                            countlyGlobal["member"].api_key = api_key;
                        }

                        $(".dialog #save-account-details").removeClass("disabled");
                    }
                });
            });

            $('.apps-scrollable').slimScroll({
                height:'100%',
                start:'top',
                wheelStep:10,
                position:'right',
                disableFadeOut:true
            });

            var help = _.once(function () {
                CountlyHelpers.alert(jQuery.i18n.map["help.help-mode-welcome"], "black");
            });
            $(".help-toggle, #help-toggle").click(function (e) {

                e.stopPropagation();
                $(".help-toggle #help-toggle").toggleClass("active");

                app.tipsify($(".help-toggle #help-toggle").hasClass("active"));

                if ($(".help-toggle #help-toggle").hasClass("active")) {
                    help();
                    $.idleTimer('destroy');
                    clearInterval(self.refreshActiveView);
                } else {
                    self.refreshActiveView = setInterval(function(){self.performRefresh(self);}, countlyCommon.DASHBOARD_REFRESH_MS);
                    $.idleTimer(countlyCommon.DASHBOARD_IDLE_MS);
                }
            });

            $("#user-logout").click(function () {
                store.remove('countly_active_app');
                store.remove('countly_date');
                store.remove('countly_location_city');
            });
	    
            $(".beta-button").click(function () {
                CountlyHelpers.alert("This feature is currently in beta so the data you see in this view might change or disappear into thin air.<br/><br/>If you find any bugs or have suggestions please let us know!<br/><br/><a style='font-weight:500;'>Captain Obvious:</a> You can use the message box that appears when you click the question mark on the bottom right corner of this page.", "black");
            });

            $("#content").on("click", "#graph-note", function () {
                CountlyHelpers.popup("#graph-note-popup");

                $(".note-date:visible").datepicker({
                    numberOfMonths:1,
                    showOtherMonths:true,
                    onSelect:function () {
                        dateText();
                    }
                });

                $.datepicker.setDefaults($.datepicker.regional[""]);
                $(".note-date:visible").datepicker("option", $.datepicker.regional[countlyCommon.BROWSER_LANG]);

                $('.note-popup:visible .time-picker, .note-popup:visible .note-list').slimScroll({
                    height:'100%',
                    start:'top',
                    wheelStep:10,
                    position:'right',
                    disableFadeOut:true
                });

                $(".note-popup:visible .time-picker span").on("click", function() {
                    $(".note-popup:visible .time-picker span").removeClass("selected");
                    $(this).addClass("selected");
                    dateText();
                });


                $(".note-popup:visible .manage-notes-button").on("click", function() {
                    $(".note-popup:visible .note-create").hide();
                    $(".note-popup:visible .note-manage").show();
                    $(".note-popup:visible .create-note-button").show();
                    $(this).hide();
                    $(".note-popup:visible .create-note").hide();
                });

                $(".note-popup:visible .create-note-button").on("click", function() {
                    $(".note-popup:visible .note-create").show();
                    $(".note-popup:visible .note-manage").hide();
                    $(".note-popup:visible .manage-notes-button").show();
                    $(this).hide();
                    $(".note-popup:visible .create-note").show();
                });

                dateText();

                function dateText() {
                    var selectedDate = $(".note-date:visible").val(),
                        instance = $(".note-date:visible").data("datepicker"),
                        date = $.datepicker.parseDate(instance.settings.dateFormat || $.datepicker._defaults.dateFormat, selectedDate, instance.settings);

                    $(".selected-date:visible").text(moment(date).format("D MMM YYYY") + ", " + $(".time-picker:visible span.selected").text());
                }

                if (countlyGlobal.apps[countlyCommon.ACTIVE_APP_ID] && countlyGlobal.apps[countlyCommon.ACTIVE_APP_ID].notes) {
                    var noteDateIds = _.sortBy(_.keys(countlyGlobal.apps[countlyCommon.ACTIVE_APP_ID].notes), function(el) { return -parseInt(el); });

                    for (var i = 0; i < noteDateIds.length; i++) {
                        var currNotes = countlyGlobal.apps[countlyCommon.ACTIVE_APP_ID].notes[noteDateIds[i]];

                        for (var j = 0; j < currNotes.length; j++) {
                            $(".note-popup:visible .note-list").append(
                                '<div class="note">' +
                                    '<div class="date" data-dateid="' + noteDateIds[i] + '">' + moment(noteDateIds[i], "YYYYMMDDHH").format("D MMM YYYY, HH:mm") + '</div>' +
                                    '<div class="content">' + currNotes[j] + '</div>' +
                                    '<div class="delete-note"><i class="fa fa-trash"></i></div>' +
                                '</div>'
                            );
                        }
                    }
                }

                if (!$(".note-popup:visible .note").length) {
                    $(".note-popup:visible .manage-notes-button").hide();
                }

                $('.note-popup:visible .note-content').textcounter({
                    max: 50,
                    countDown: true,
                    countDownText: "remaining "
                });

                $(".note-popup:visible .note .delete-note").on("click", function() {
                    var dateId = $(this).siblings(".date").data("dateid"),
                        note = $(this).siblings(".content").text();

                    $(this).parents(".note").fadeOut().remove();

                    $.ajax({
                        type:"POST",
                        url:countlyGlobal["path"]+'/graphnotes/delete',
                        data:{
                            "app_id":countlyCommon.ACTIVE_APP_ID,
                            "date_id":dateId,
                            "note":note,
                            _csrf:countlyGlobal['csrf_token']
                        },
                        success:function (result) {
                            if (result == false) {
                                return false;
                            } else {
                                updateGlobalNotes({date_id: dateId, note:note}, "delete");
                                app.activeView.refresh();
                            }
                        }
                    });

                    if (!$(".note-popup:visible .note").length) {
                        $(".note-popup:visible .create-note-button").trigger("click");
                        $(".note-popup:visible .manage-notes-button").hide();
                    }
                });

                $(".note-popup:visible .create-note").on("click", function() {
                    if ($(this).hasClass("disabled")) {
                        return true;
                    }

                    $(this).addClass("disabled");

                    var selectedDate = $(".note-date:visible").val(),
                        instance = $(".note-date:visible").data("datepicker"),
                        date = $.datepicker.parseDate(instance.settings.dateFormat || $.datepicker._defaults.dateFormat, selectedDate, instance.settings),
                        dateId = moment(moment(date).format("D MMM YYYY") + ", " + $(".time-picker:visible span.selected").text(), "D MMM YYYY, HH:mm").format("YYYYMMDDHH"),
                        note = $(".note-popup:visible .note-content").val();

                    if (!note.length) {
                        $(".note-popup:visible .note-content").addClass("required-border");
                        $(this).removeClass("disabled");
                        return true;
                    } else {
                        $(".note-popup:visible .note-content").removeClass("required-border");
                    }

                    $.ajax({
                        type:"POST",
                        url:countlyGlobal["path"]+'/graphnotes/create',
                        data:{
                            "app_id":countlyCommon.ACTIVE_APP_ID,
                            "date_id":dateId,
                            "note":note,
                            _csrf:countlyGlobal['csrf_token']
                        },
                        success:function (result) {
                            if (result == false) {
                                return false;
                            } else {
                                updateGlobalNotes({date_id: dateId, note:result}, "create");
                                app.activeView.refresh();
                            }
                        }
                    });

                    $("#overlay").trigger("click");
                });

                function updateGlobalNotes(noteObj, operation) {
                    var globalNotes = countlyGlobal.apps[countlyCommon.ACTIVE_APP_ID].notes;

                    if (operation == "create") {
                        if (globalNotes) {
                            if (globalNotes[noteObj.date_id]) {
                                countlyCommon.arrayAddUniq(globalNotes[noteObj.date_id], noteObj.note);
                            } else {
                                globalNotes[noteObj.date_id] = [noteObj.note];
                            }
                        } else {
                            var tmpNote = {};
                            tmpNote[noteObj.date_id] = [noteObj.note];

                            countlyGlobal.apps[countlyCommon.ACTIVE_APP_ID].notes = tmpNote;
                        }
                    } else if (operation == "delete") {
                        if (globalNotes) {
                            if (globalNotes[noteObj.date_id]) {
                                globalNotes[noteObj.date_id] = _.without(globalNotes[noteObj.date_id], noteObj.note);
                            }
                        }
                    }
                }
            });
        });

        if (!_.isEmpty(countlyGlobal['apps'])) {
            if (!countlyCommon.ACTIVE_APP_ID) {
                countlyCommon.setActiveApp(countlyGlobal["defaultApp"]._id);
                self.activeAppName = countlyGlobal["defaultApp"].name;
            } else {
                $("#sidebar-app-select").find(".logo").css("background-image", "url('"+countlyGlobal["cdn"]+"appimages/" + countlyCommon.ACTIVE_APP_ID + ".png')");
                $("#sidebar-app-select .text").text(countlyGlobal['apps'][countlyCommon.ACTIVE_APP_ID].name);
                self.activeAppName = countlyGlobal['apps'][countlyCommon.ACTIVE_APP_ID].name;
            }
        } else {
            $("#new-install-overlay").show();
        }

        $.idleTimer(countlyCommon.DASHBOARD_IDLE_MS);

        $(document).bind("idle.idleTimer", function () {
            clearInterval(self.refreshActiveView);
        });

        $(document).bind("active.idleTimer", function () {
            self.activeView.restart();
            self.refreshActiveView = setInterval(function(){self.performRefresh(self);}, countlyCommon.DASHBOARD_REFRESH_MS);
        });

        $.fn.dataTableExt.oPagination.four_button = {
            "fnInit": function ( oSettings, nPaging, fnCallbackDraw )
            {
                nFirst = document.createElement( 'span' );
                nPrevious = document.createElement( 'span' );
                nNext = document.createElement( 'span' );
                nLast = document.createElement( 'span' );

                nFirst.innerHTML = "<i class='fa fa-angle-double-left'></i>";
                nPrevious.innerHTML = "<i class='fa fa-angle-left'></i>";
                nNext.innerHTML = "<i class='fa fa-angle-right'></i>";
                nLast.innerHTML = "<i class='fa fa-angle-double-right'></i>";

                nFirst.className = "paginate_button first";
                nPrevious.className = "paginate_button previous";
                nNext.className="paginate_button next";
                nLast.className = "paginate_button last";

                nPaging.appendChild( nFirst );
                nPaging.appendChild( nPrevious );
                nPaging.appendChild( nNext );
                nPaging.appendChild( nLast );

                $(nFirst).click( function () {
                    oSettings.oApi._fnPageChange( oSettings, "first" );
                    fnCallbackDraw( oSettings );
                } );

                $(nPrevious).click( function() {
                    oSettings.oApi._fnPageChange( oSettings, "previous" );
                    fnCallbackDraw( oSettings );
                } );

                $(nNext).click( function() {
                    oSettings.oApi._fnPageChange( oSettings, "next" );
                    fnCallbackDraw( oSettings );
                } );

                $(nLast).click( function() {
                    oSettings.oApi._fnPageChange( oSettings, "last" );
                    fnCallbackDraw( oSettings );
                } );

                $(nFirst).bind( 'selectstart', function () { return false; } );
                $(nPrevious).bind( 'selectstart', function () { return false; } );
                $(nNext).bind( 'selectstart', function () { return false; } );
                $(nLast).bind( 'selectstart', function () { return false; } );
            },

            "fnUpdate": function ( oSettings, fnCallbackDraw )
            {
                if ( !oSettings.aanFeatures.p )
                {
                    return;
                }

                var an = oSettings.aanFeatures.p;
                for ( var i=0, iLen=an.length ; i<iLen ; i++ )
                {
                    var buttons = an[i].getElementsByTagName('span');
                    if ( oSettings._iDisplayStart === 0 )
                    {
                        buttons[0].className = "paginate_disabled_previous";
                        buttons[1].className = "paginate_disabled_previous";
                    }
                    else
                    {
                        buttons[0].className = "paginate_enabled_previous";
                        buttons[1].className = "paginate_enabled_previous";
                    }

                    if ( oSettings.fnDisplayEnd() == oSettings.fnRecordsDisplay() )
                    {
                        buttons[2].className = "paginate_disabled_next";
                        buttons[3].className = "paginate_disabled_next";
                    }
                    else
                    {
                        buttons[2].className = "paginate_enabled_next";
                        buttons[3].className = "paginate_enabled_next";
                    }
                }
            }
        };

        $.fn.dataTableExt.oApi.fnStandingRedraw = function(oSettings) {
            if(oSettings.oFeatures.bServerSide === false){
                var before = oSettings._iDisplayStart;

                oSettings.oApi._fnReDraw(oSettings);

                // iDisplayStart has been reset to zero - so lets change it back
                oSettings._iDisplayStart = before;
                oSettings.oApi._fnCalculateEnd(oSettings);
            }

            // draw the 'current' page
            oSettings.oApi._fnDraw(oSettings);
        };

        function getCustomDateInt(s) {
            if (s.indexOf(":") != -1) {
                if (s.indexOf(",") != -1) {
                    s = s.replace(/,|:/g,"");
                    var dateParts = s.split(" ");

                    return  parseInt((countlyCommon.getMonths().indexOf(dateParts[1]) + 1) * 1000000) +
                        parseInt(dateParts[0]) * 10000 +
                        parseInt(dateParts[2]);
                } else {
                    return parseInt(s.replace(':', ''));
                }
            } else if (s.length == 3) {
                return countlyCommon.getMonths().indexOf(s);
            } else if (s.indexOf("W") == 0) {
                s = s.replace(",","");
                s = s.replace("W","");
                var dateParts = s.split(" ");
                return (parseInt(dateParts[0]))+parseInt(dateParts.pop()*10000);
            } else {
                s = s.replace(",","");
                var dateParts = s.split(" ");

                if (dateParts.length == 3) {
                    return (parseInt(dateParts[2]) * 10000) + parseInt(countlyCommon.getMonths().indexOf(dateParts[1]) * 100) + parseInt(dateParts[0]);
                } else {
                    if(dateParts[0].length == 3)
                        return parseInt(countlyCommon.getMonths().indexOf(dateParts[0]) * 100) + parseInt(dateParts[1]*10000);
                    else    
                        return parseInt(countlyCommon.getMonths().indexOf(dateParts[1]) * 100) + parseInt(dateParts[0]);
                }
            }
        }

        jQuery.fn.dataTableExt.oSort['customDate-asc']  = function(x, y) {
            x = getCustomDateInt(x);
            y = getCustomDateInt(y);

            return ((x < y) ? -1 : ((x > y) ?  1 : 0));
        };

        jQuery.fn.dataTableExt.oSort['customDate-desc'] = function(x, y) {
            x = getCustomDateInt(x);
            y = getCustomDateInt(y);

            return ((x < y) ?  1 : ((x > y) ? -1 : 0));
        };

        function getDateRangeInt(s) {
            s = s.split("-")[0];
            var mEnglish = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            if (s.indexOf(":") != -1) {
                var mName = (s.split(" ")[1]).split(",")[0];

                return s.replace(mName, parseInt(mEnglish.indexOf(mName))).replace(/[:, ]/g, "");
            } else {
                var parts = s.split(" ");
                if (parts.length > 1) {
                    return parseInt(mEnglish.indexOf(parts[1]) * 100) + parseInt(parts[0]);
                } else {
                    return parts[0].replace(/[><]/g, "");
                }
            }
        }

        jQuery.fn.dataTableExt.oSort['dateRange-asc']  = function(x, y) {
            x = getDateRangeInt(x);
            y = getDateRangeInt(y);

            return ((x < y) ? -1 : ((x > y) ?  1 : 0));
        };

        jQuery.fn.dataTableExt.oSort['dateRange-desc'] = function(x, y) {
            x = getDateRangeInt(x);
            y = getDateRangeInt(y);

            return ((x < y) ?  1 : ((x > y) ? -1 : 0));
        };

        jQuery.fn.dataTableExt.oSort['percent-asc']  = function(x, y) {
            x = parseFloat($("<a></a>").html(x).text().replace("%",""));
            y = parseFloat($("<a></a>").html(y).text().replace("%",""));

            return ((x < y) ? -1 : ((x > y) ?  1 : 0));
        };

        jQuery.fn.dataTableExt.oSort['percent-desc']  = function(x, y) {
            x = parseFloat($("<a></a>").html(x).text().replace("%",""));
            y = parseFloat($("<a></a>").html(y).text().replace("%",""));

            return ((x < y) ?  1 : ((x > y) ? -1 : 0));
        };

        jQuery.fn.dataTableExt.oSort['formatted-num-asc'] = function (x, y) {
            'use strict';

            // Define vars
            var a = [], b = [];

            // Match any character except: digits (0-9), dash (-), period (.), or backslash (/) and replace those characters with empty string.
            x = x.replace(/[^\d\-\.\/]/g, '');
            y = y.replace(/[^\d\-\.\/]/g, '');

            // Handle simple fractions
            if (x.indexOf('/') >= 0) {
                a = x.split("/");
                x = parseInt(a[0], 10) / parseInt(a[1], 10);
            }
            if (y.indexOf('/') >= 0) {
                b = y.split("/");
                y = parseInt(b[0], 10) / parseInt(b[1], 10);
            }

            return x - y;
        };

        jQuery.fn.dataTableExt.oSort['formatted-num-desc'] = function (x, y) {
            'use strict';

            // Define vars
            var a = [], b = [];

            // Match any character except: digits (0-9), dash (-), period (.), or backslash (/) and replace those characters with empty string.
            x = x.replace(/[^\d\-\.\/]/g, '');
            y = y.replace(/[^\d\-\.\/]/g, '');

            // Handle simple fractions
            if (x.indexOf('/') >= 0) {
                a = x.split("/");
                x = parseInt(a[0], 10) / parseInt(a[1], 10);
            }
            if (y.indexOf('/') >= 0) {
                b = y.split("/");
                y = parseInt(b[0], 10) / parseInt(b[1], 10);
            }

            return y - x;
        };

        jQuery.fn.dataTableExt.oSort['loyalty-asc']  = function(x, y) {
            x = countlyUser.getLoyaltyIndex(x);
            y = countlyUser.getLoyaltyIndex(y);

            return ((x < y) ? -1 : ((x > y) ?  1 : 0));
        };

        jQuery.fn.dataTableExt.oSort['loyalty-desc']  = function(x, y) {
            x = countlyUser.getLoyaltyIndex(x);
            y = countlyUser.getLoyaltyIndex(y);

            return ((x < y) ?  1 : ((x > y) ? -1 : 0));
        };

        jQuery.fn.dataTableExt.oSort['frequency-asc']  = function(x, y) {
            x = countlyUser.getFrequencyIndex(x);
            y = countlyUser.getFrequencyIndex(y);

            return ((x < y) ? -1 : ((x > y) ?  1 : 0));
        };

        jQuery.fn.dataTableExt.oSort['frequency-desc']  = function(x, y) {
            x = countlyUser.getFrequencyIndex(x);
            y = countlyUser.getFrequencyIndex(y);

            return ((x < y) ?  1 : ((x > y) ? -1 : 0));
        };

        jQuery.fn.dataTableExt.oSort['session-duration-asc']  = function(x, y) {
            x = countlySession.getDurationIndex(x);
            y = countlySession.getDurationIndex(y);

            return ((x < y) ? -1 : ((x > y) ?  1 : 0));
        };

        jQuery.fn.dataTableExt.oSort['session-duration-desc']  = function(x, y) {
            x = countlySession.getDurationIndex(x);
            y = countlySession.getDurationIndex(y);

            return ((x < y) ?  1 : ((x > y) ? -1 : 0));
        };
        
        jQuery.fn.dataTableExt.oSort['format-ago-asc']  = function(x, y) {
            return x-y;
        };

        jQuery.fn.dataTableExt.oSort['format-ago-desc']  = function(x, y) {
            return y-x;
        };
        
        function getFileName(ext){
            var name = "countly";
            if($(".widget-header .title").length)
                name = $(".widget-header .title").first().text();
            return (name.charAt(0).toUpperCase() + name.slice(1).toLowerCase())+"-"+moment().format("DD-MMM-YYYY")+"."+ext;
        }

        $.extend(true, $.fn.dataTable.defaults, {
            "sDom": '<"dataTable-top"lfpT>t<"dataTable-bottom"i>',
            "bAutoWidth": false,
            "bLengthChange":true,
            "bPaginate":true,
            "sPaginationType": "four_button",
            "iDisplayLength": 50,//(store.get("iDisplayLength")) ? parseInt(store.get("iDisplayLength")) : 50,
            "bDestroy": true,
            "bDeferRender": true,
            "oLanguage": {
				"sZeroRecords": jQuery.i18n.map["common.table.no-data"],
				"sInfoEmpty": jQuery.i18n.map["common.table.no-data"],
				"sEmptyTable": jQuery.i18n.map["common.table.no-data"],
				"sInfo": jQuery.i18n.map["common.showing"],
				"sInfoFiltered": jQuery.i18n.map["common.filtered"],
				"sSearch": jQuery.i18n.map["common.search"],
                "sLengthMenu": jQuery.i18n.map["common.show-items"]+"<input type='number' id='dataTables_length_input'/>"
			},
            "oTableTools": {
                "sSwfPath": countlyGlobal["cdn"]+"javascripts/dom/dataTables/swf/copy_csv_xls.swf",
                "aButtons": [
                    {
                        "sExtends": "csv",
                        "sButtonText": jQuery.i18n.map["common.save-to-csv"],
                        "fnClick": function (nButton, oConfig, flash) {
                            var tableCols = $(nButton).parents(".dataTables_wrapper").find(".dataTable").dataTable().fnSettings().aoColumns,
                                tableData = this.fnGetTableData(oConfig).split(/\r\n|\r|\n/g).join('","').split('","'),
                                retStr = "";
                                
                            //check if exported data needs to be processed by some other lib    
                            if(tableCols[0].sExport && app.dataExports[tableCols[0].sExport]){
                                
                                //get data to export
                                var data = app.dataExports[tableCols[0].sExport]();
                                
                                //get all columns
                                var cols = [];
                                for(var i = 0; i < data.length; i++){
                                    for(var col in data[i]){
                                         if(cols.indexOf(col) === -1)
                                             cols.push(col);
                                        
                                     }
                                }
                                
                                //generate data in the needed format
                                var tdata = JSON.parse(JSON.stringify(cols));
                                for(var i = 0; i < data.length; i++){
                                    for(var j = 0; j < cols.length; j++){
                                        tdata.push('"'+(data[i][cols[j]] || ""));
                                    }
                                }
                                
                                tableCols = cols;
                                tableData = tdata;
                            }

                            for (var i = 0;  i < tableData.length; i++) {
                                tableData[i] = tableData[i].replace(/^"/, "");

                                if (i >= tableCols.length) {
                                    var colIndex = i % tableCols.length;
                                     
                                    if (tableCols[colIndex].sType == "formatted-num") {
                                        tableData[i] = tableData[i].replace(/,/g, "");
                                    } else if (tableCols[colIndex].sType == "percent") {
                                        tableData[i] = tableData[i].replace("%", "");
                                    } else if (tableCols[colIndex].sType == "format-ago" || tableCols[colIndex].sType == "event-timeline") {
                                        tableData[i] = tableData[i].split("|").pop();
                                    }
                                }

                                if ((i + 1) % tableCols.length == 0) {
                                    retStr += "\"" + tableData[i] + "\"\r\n";
                                } else {
                                    retStr += "\"" + tableData[i] + "\", ";
                                }
                            }
                            flash.setFileName( getFileName("csv") );
                            this.fnSetText(flash, retStr);
                        }
                    },
                    {
                        "sExtends": "xls",
                        "sButtonText": jQuery.i18n.map["common.save-to-excel"],
                        "fnClick": function (nButton, oConfig, flash) {
                            var tableCols = $(nButton).parents(".dataTables_wrapper").find(".dataTable").dataTable().fnSettings().aoColumns,
                                tableData = this.fnGetTableData(oConfig).split(/\r\n|\r|\n/g).join('\t').split('\t'),
                                retStr = "";
                                
                            //check if exported data needs to be processed by some other lib    
                            if(tableCols[0].sExport && app.dataExports[tableCols[0].sExport]){
                                
                                //get data to export
                                var data = app.dataExports[tableCols[0].sExport]();
                                
                                //get all columns
                                var cols = [];
                                for(var i = 0; i < data.length; i++){
                                    for(var col in data[i]){
                                         if(cols.indexOf(col) === -1)
                                             cols.push(col);
                                        
                                     }
                                }
                                
                                //generate data in the needed format
                                var tdata = JSON.parse(JSON.stringify(cols));
                                for(var i = 0; i < data.length; i++){
                                    for(var j = 0; j < cols.length; j++){
                                        tdata.push(data[i][cols[j]] || "");
                                    }
                                }
                                
                                tableCols = cols;
                                tableData = tdata;
                            }

                            for (var i = 0;  i < tableData.length; i++) {
                                if (i >= tableCols.length) {
                                    var colIndex = i % tableCols.length;

                                    if (tableCols[colIndex].sType == "formatted-num") {
                                        tableData[i] = parseFloat(tableData[i].replace(/,/g, "")).toLocaleString();
                                    } else if (tableCols[colIndex].sType == "percent") {
                                        tableData[i] = parseFloat(tableData[i].replace("%", "")).toLocaleString();
                                    } else if (tableCols[colIndex].sType == "numeric") {
                                        tableData[i] = parseFloat(tableData[i]).toLocaleString();
                                    } else if (tableCols[colIndex].sType == "format-ago" || tableCols[colIndex].sType == "event-timeline") {
                                        tableData[i] = tableData[i].split("|").pop();
                                    }
                                }

                                if ((i + 1) % tableCols.length == 0) {
                                    retStr += tableData[i] + "\r\n";
                                } else {
                                    retStr += tableData[i] + "\t";
                                }
                            }
                            flash.setFileName( getFileName("xls") );
                            this.fnSetText(flash, retStr);
                        }
                    }
                ]
            },
            "fnInitComplete": function(oSettings, json) {
                var saveHTML = "<div class='save-table-data' data-help='help.datatables-export'><i class='fa fa-download'></i></div>",
                    searchHTML = "<div class='search-table-data'><i class='fa fa-search'></i></div>",
                    tableWrapper = $("#" + oSettings.sTableId + "_wrapper");

                $(saveHTML).insertBefore(tableWrapper.find(".DTTT_container"));
                $(searchHTML).insertBefore(tableWrapper.find(".dataTables_filter"));
                tableWrapper.find(".dataTables_filter").html(tableWrapper.find(".dataTables_filter").find("input").attr("Placeholder",jQuery.i18n.map["common.search"]).clone(true));

                tableWrapper.find(".save-table-data").on("click", function() {
                    if ($(this).next(".DTTT_container").css('visibility') == 'hidden') {
                        $(this).next(".DTTT_container").css("visibility", 'visible');
                    } else {
                        $(this).next(".DTTT_container").css("visibility", 'hidden');
                    }
                });

                tableWrapper.find(".search-table-data").on("click", function() {
                    $(this).next(".dataTables_filter").toggle();
                    $(this).next(".dataTables_filter").find("input").focus();
                });
                
                if(oSettings.oFeatures.bServerSide){
                    tableWrapper.find(".save-table-data").tipsy({gravity:$.fn.tipsy.autoNS, title:function () {
                        return ($(this).data("help")) ? jQuery.i18n.map[$(this).data("help")] : "";
                    }, fade:true, offset:5, cssClass:'yellow', opacity:1, html:true});
                    tableWrapper.find(".dataTables_length").show();
                    tableWrapper.find('#dataTables_length_input').bind( 'change.DT', function(e) {
                        //store.set("iDisplayLength", $(this).val());
                    });
                }
                else{
                    tableWrapper.find(".dataTables_length").hide();
                }

                //tableWrapper.css({"min-height": tableWrapper.height()});
            },
            fnPreDrawCallback: function(oSettings, json) {
                var tableWrapper = $("#" + oSettings.sTableId + "_wrapper");

                if (tableWrapper.find(".table-placeholder").length == 0) {
                    var $placeholder = $('<div class="table-placeholder"><div class="top"></div><div class="header"></div></div>');
                    tableWrapper.append($placeholder);
                }

                if (tableWrapper.find(".table-loader").length == 0) {
                    tableWrapper.append("<div class='table-loader'></div>");
                }
            },
            fnDrawCallback: function(oSettings) {
                var tableWrapper = $("#" + oSettings.sTableId + "_wrapper");
                tableWrapper.find(".dataTable-bottom").show();
                tableWrapper.find(".table-placeholder").remove();
                tableWrapper.find(".table-loader").remove();
            }
        });

        $.fn.dataTableExt.sErrMode = 'throw';
        $(document).ready(function () {
            setTimeout(function(){
                self.onAppSwitch(countlyCommon.ACTIVE_APP_ID, true);
            },1)
        });
    },
    /**
    * Localize all found html elements with data-localize and data-help-localize attributes
    * @param {jquery_object} el - jquery reference to parent element which contents to localize, by default all document is localized if not provided
    * @memberof app
    */
    localize:function (el) {
        var helpers = {
            onlyFirstUpper:function (str) {
                return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
            },
            upper:function (str) {
                return str.toUpperCase();
            }
        };

        // translate help module
        (el ? el.find('[data-help-localize]') : $("[data-help-localize]")).each(function () {
            var elem = $(this);
            if (elem.data("help-localize") != undefined) {
                elem.data("help", jQuery.i18n.map[elem.data("help-localize")]);
            }
        });

        // translate dashboard
        (el ? el.find('[data-localize]') : $("[data-localize]")).each(function () {
            var elem = $(this),
                toLocal = elem.data("localize").split("!"),
                localizedValue = "";

            if (toLocal.length == 2) {
                if (helpers[toLocal[0]]) {
                    localizedValue = helpers[toLocal[0]](jQuery.i18n.map[toLocal[1]]);
                } else {
                    localizedValue = jQuery.i18n.prop(toLocal[0], (toLocal[1])? jQuery.i18n.map[toLocal[1]] : "");
                }
            } else {
                localizedValue = jQuery.i18n.map[elem.data("localize")];
            }

            if (elem.is("input[type=text]") || elem.is("input[type=password]") || elem.is("textarea")) {
                elem.attr("placeholder", localizedValue);
            } else if (elem.is("input[type=button]") || elem.is("input[type=submit]")) {
                elem.attr("value", localizedValue);
            } else {
                elem.html(localizedValue);
            }
        });
    },
    /**
    * Toggle showing tooltips, which are usually used in help mode for all elements containing css class help-zone-vs or help-zone-vb and having data-help attributes (which are generated automatically from data-help-localize attributes upon localization)
    * @param {boolean} enable - if true tooltips will be shown on hover, if false tooltips will be disabled
    * @param {jquery_object} el - jquery reference to parent element which contents to check for tooltips, by default all document is checked if not provided
    * @memberof app
    * @instance
    */
    tipsify: function(enable, el){
        var vs = el ? el.find('.help-zone-vs') : $('.help-zone-vs'),
            vb = el ? el.find('.help-zone-vb') : $('.help-zone-vb'),
            both = el ? el.find('.help-zone-vs, .help-zone-vb') : $(".help-zone-vs, .help-zone-vb");

        vb.tipsy({gravity:$.fn.tipsy.autoNS, trigger:'manual', title:function () {
            return $(this).data("help") || "";
        }, fade:true, offset:5, cssClass:'yellow', opacity:1, html:true});
        vs.tipsy({gravity:$.fn.tipsy.autoNS, trigger:'manual', title:function () {
            return $(this).data("help") || "";
        }, fade:true, offset:5, cssClass:'yellow narrow', opacity:1, html:true});

        if (enable) {
            both.off('mouseenter mouseleave')
                .on('mouseenter', function () {
                    $(this).tipsy("show");
                })
                .on('mouseleave', function () {
                    $(this).tipsy("hide");
                });
        } else {
           both.off('mouseenter mouseleave');
        }
    },
    /**
    * Register new app type as mobile, web, desktop, etc. You can create new plugin to add new app type with its own dashboard
    * @param {string} name - name of the app type as mobile, web, desktop etc
    * @param {countlyView} view - instance of the countlyView to show as main dashboard for provided app type
    * @memberof app
    * @instance
    * @example
    * app.addAppType("mobile", MobileDashboardView);
    */
    addAppType:function(name, view){
        this.appTypes[name] = new view();
        var menu = $("#default-type").clone();
        menu.attr("id",name+"-type");
        $("#sidebar-menu").append(menu);
    },
    /**
    * Add callback to be called when user changes app in dashboard, which can be used globally, outside of the view
    * @param {function} callback - function receives app_id param which is app id of the new app to which user switched
    * @memberof app
    * @instance
    * @example
    * app.addAppSwitchCallback(function(appId){
    *    countlyCrashes.loadList(appId);
    * });
    */
    addAppSwitchCallback:function(callback){
        this.appSwitchCallbacks.push(callback);
    },
    /**
    * Add callback to be called when user changes app in Managment -> Applications section, useful when providing custom input additions to app editing for different app types
    * @param {function} callback - function receives app_id param which is app id and type which is app type
    * @memberof app
    * @instance
    * @example
    * app.addAppManagementSwitchCallback(function(appId, type){
    *   if (type == "mobile") {
    *       addPushHTMLIfNeeded(type);
    *       $("#view-app .appmng-push").show();
    *   } else {
    *       $("#view-app .appmng-push").hide();
    *   }
    * });
    */
    addAppManagementSwitchCallback:function(callback){
        this.appManagementSwitchCallbacks.push(callback);
    },
    addAppObjectModificator:function(callback){
        this.appObjectModificators.push(callback);
    },
    /**
    * Add callback to be called when user changes app type in UI in Managment -> Applications section (even without saving app type, just chaning in UI), useful when providing custom input additions to app editing for different app types
    * @param {function} callback - function receives type which is app type
    * @memberof app
    * @instance
    * @example
    * app.addAppAddTypeCallback(function(type){
    *   if (type == "mobile") {
    *       $("#view-app .appmng-push").show();
    *   } else {
    *       $("#view-app .appmng-push").hide();
    *   }
    * });
    */
    addAppAddTypeCallback:function(callback){
        this.appAddTypeCallbacks.push(callback);
    },
    /**
    * Add callback to be called when user open user edit UI in Managment -> Users section (even without saving, just opening), useful when providing custom input additions to user editing
    * @param {function} callback - function receives user object and paramm which can be true if saving data, false if opening data, string to modify data
    * @memberof app
    * @instance
    */
    addUserEditCallback:function(callback){
        this.userEditCallbacks.push(callback);
    },
    /**
    * Add custom data export handler from datatables to csv/xls exporter. Provide exporter name and callback function. 
    * Then add the same name as sExport attribute to the first datatables column. 
    * Then when user will want to export data from this table, your callback function will be called to get the data. 
    * You must perpare array of objects all with the same keys, where keys are columns and value are table data and return it from callback
    * to be processed by exporter.
    * @param {string} name - name of the export to expect in datatables sExport attribute
    * @param {function} callback - callback to call when getting data
    * @memberof app
    * @instance
    * @example
    * app.addDataExport("userinfo", function(){
    *    var ret = [];
    *    var elem;
    *    for(var i = 0; i < tableData.length; i++){
    *        //use same keys for each array element with different user data
    *        elem ={
    *            "fullname": tableData[i].firstname + " " + tableData[i].lastname,
    *            "job": tableData[i].company + ", " + tableData[i].jobtitle,
    *            "email": tableData[i].email
    *        };
    *        ret.push(elem);
    *    }
    *    //return array
    *    return ret;
    * });
    */
    addDataExport:function(name, callback){
        this.dataExports[name] = callback;
    },
    /**
    * Add callback to be called everytime new view/page is loaded, so you can modify view with javascript after it has been loaded
    * @param {string} view - view url/hash or with possible # as wildcard or simply providing # for any view
    * @param {function} callback - function to be called when view loaded
    * @memberof app
    * @instance
    * @example <caption>Adding to single specific view with specific url</caption>
    * //this will work only for view bind to #/analytics/events
    * app.addPageScript("/analytics/events", function(){
    *   $("#event-nav-head").after(
    *       "<a href='#/analytics/events/compare'>" +
    *           "<div id='compare-events' class='event-container'>" +
    *               "<div class='icon'></div>" +
    *               "<div class='name'>" + jQuery.i18n.map["compare.button"] + "</div>" +
    *           "</div>" +
    *       "</a>"
    *   );
    * });
    
    * @example <caption>Add to all view subpages</caption>
    * //this will work /users/ and users/1 and users/abs etc
    * app.addPageScript("/users#", modifyUserDetailsForPush);
    
    * @example <caption>Adding script to any view</caption>
    * //this will work for any view
    * app.addPageScript("#", function(){
    *   alert("I am an annoying popup appearing on each view");
    * });
    */
	addPageScript:function(view, callback){
		if(!this.pageScripts[view])
			this.pageScripts[view] = [];
		this.pageScripts[view].push(callback);
	},
    /**
    * Add callback to be called everytime view is refreshed, because view may reset some html, and we may want to remodify it again. By default this happens every 10 seconds, so not cpu intensive tasks
    * @param {string} view - view url/hash or with possible # as wildcard or simply providing # for any view
    * @param {function} callback - function to be called when view refreshed
    * @memberof app
    * @instance
    * @example <caption>Adding to single specific view with specific url</caption>
    * //this will work only for view bind to #/analytics/events
    * app.addPageScript("/analytics/events", function(){
    *   $("#event-nav-head").after(
    *       "<a href='#/analytics/events/compare'>" +
    *           "<div id='compare-events' class='event-container'>" +
    *               "<div class='icon'></div>" +
    *               "<div class='name'>" + jQuery.i18n.map["compare.button"] + "</div>" +
    *           "</div>" +
    *       "</a>"
    *   );
    * });
    
    * @example <caption>Add to all view subpage refreshed</caption>
    * //this will work /users/ and users/1 and users/abs etc
    * app.addRefreshScript("/users#", modifyUserDetailsForPush);
    
    * @example <caption>Adding script to any view</caption>
    * //this will work for any view
    * app.addRefreshScript("#", function(){
    *   alert("I am an annoying popup appearing on each refresh of any view");
    * });
    */
	addRefreshScript:function(view, callback){
		if(!this.refreshScripts[view])
			this.refreshScripts[view] = [];
		this.refreshScripts[view].push(callback);
	},
    onAppSwitch:function(appId, refresh){
        if(appId != 0){
            jQuery.i18n.map = JSON.parse(app.origLang);
            if(!refresh){
                app.main(true);
                if (window.components && window.components.slider && window.components.slider.instance) {
                    window.components.slider.instance.close();
                }
            }
            $("#sidebar-menu .sidebar-menu").hide();
            var type = countlyGlobal["apps"][appId].type;
            if($("#sidebar-menu #"+type+"-type").length)
                $("#sidebar-menu #"+type+"-type").show();
            else
                $("#sidebar-menu #default-type").show();
            for(var i = 0; i < this.appSwitchCallbacks.length; i++){
                this.appSwitchCallbacks[i](appId);
            }
        }
    },
    onAppManagementSwitch:function(appId, type){
        for(var i = 0; i < this.appManagementSwitchCallbacks.length; i++){
            this.appManagementSwitchCallbacks[i](appId, type || countlyGlobal["apps"][appId].type);
        }
        if($("#app-add-name").length){
            var newAppName = $("#app-add-name").val();
            $("#app-container-new .name").text(newAppName);
            $(".new-app-name").text(newAppName);
        }
    },
    onAppAddTypeSwitch: function(type) {
        for(var i = 0; i < this.appAddTypeCallbacks.length; i++){
            this.appAddTypeCallbacks[i](type);
        }
    },
    onUserEdit: function(user, param) {
        for (var i = 0; i < this.userEditCallbacks.length; i++){
            param = this.userEditCallbacks[i](user, param);
        }
        return param;
    },
    pageScript:function () { //scripts to be executed on each view change
        $("#month").text(moment().year());
        $("#day").text(moment().format("MMM"));
        $("#yesterday").text(moment().subtract(1, "days").format("Do"));

        var self = this;
        $(document).ready(function () {

            var selectedDateID = countlyCommon.getPeriod();

            if (Object.prototype.toString.call(selectedDateID) !== '[object Array]') {
                $("#" + selectedDateID).addClass("active");
            }
			
			if (Backbone.history.fragment == "/manage/apps") {
                $("#sidebar-app-select").addClass("disabled");
                $("#sidebar-app-select").removeClass("active");
            } else {
                $("#sidebar-app-select").removeClass("disabled");
            }
			
			if(self.pageScripts[Backbone.history.fragment])
				for(var i = 0, l = self.pageScripts[Backbone.history.fragment].length; i < l; i++)
					self.pageScripts[Backbone.history.fragment][i]();
            for(var k in self.pageScripts) 
                if (k !== '#' && k.indexOf('#') !== -1 && Backbone.history.fragment.match(k.replace(/#/g, '.*')))
                    for(var i = 0, l = self.pageScripts[k].length; i < l; i++)
                        self.pageScripts[k][i]();
			if(self.pageScripts["#"])
				for(var i = 0, l = self.pageScripts["#"].length; i < l; i++)
					self.pageScripts["#"][i]();

            // Translate all elements with a data-help-localize or data-localize attribute
            self.localize();

            if ($("#help-toggle").hasClass("active")) {
                $('.help-zone-vb').tipsy({gravity:$.fn.tipsy.autoNS, trigger:'manual', title:function () {
                    return ($(this).data("help")) ? $(this).data("help") : "";
                }, fade:true, offset:5, cssClass:'yellow', opacity:1, html:true});
                $('.help-zone-vs').tipsy({gravity:$.fn.tipsy.autoNS, trigger:'manual', title:function () {
                    return ($(this).data("help")) ? $(this).data("help") : "";
                }, fade:true, offset:5, cssClass:'yellow narrow', opacity:1, html:true});

                $.idleTimer('destroy');
                clearInterval(self.refreshActiveView);
                $(".help-zone-vs, .help-zone-vb").hover(
                    function () {
                        $(this).tipsy("show");
                    },
                    function () {
                        $(this).tipsy("hide");
                    }
                );
            }

            $(".usparkline").peity("bar", { width:"100%", height:"30", colour:"#6BB96E", strokeColour:"#6BB96E", strokeWidth:2 });
            $(".dsparkline").peity("bar", { width:"100%", height:"30", colour:"#C94C4C", strokeColour:"#C94C4C", strokeWidth:2 });

            CountlyHelpers.setUpDateSelectors(self.activeView); 

            $(window).click(function () {
                $("#date-picker").hide();
                $(".cly-select").removeClass("active");
            });

            $("#date-picker").click(function (e) {
                e.stopPropagation();
            });

            $("#date-picker-button").click(function (e) {
                $("#date-picker").toggle();

                if (self.dateToSelected) {
                    dateTo.datepicker("setDate", moment(self.dateToSelected).toDate());
                    dateFrom.datepicker("option", "maxDate", moment(self.dateToSelected).toDate());
                } else {
                    self.dateToSelected = moment().toDate().getTime();
                    dateTo.datepicker("setDate",moment().toDate());
                    dateFrom.datepicker("option", "maxDate", moment(self.dateToSelected).toDate());
                }

                if (self.dateFromSelected) {
                    dateFrom.datepicker("setDate", moment(self.dateFromSelected).toDate());
                    dateTo.datepicker("option", "minDate", moment(self.dateFromSelected).toDate());
                } else {
                    extendDate = moment(dateTo.datepicker("getDate")).subtract(30, 'days').toDate();
                    dateFrom.datepicker("setDate", extendDate);
                    self.dateFromSelected = moment(dateTo.datepicker("getDate")).subtract(30, 'days').toDate().getTime();
                    dateTo.datepicker("option", "minDate", moment(self.dateFromSelected).toDate());
                }

                setSelectedDate();
                e.stopPropagation();
            });

            var dateTo = $("#date-to").datepicker({
                numberOfMonths:1,
                showOtherMonths:true,
                maxDate:moment().toDate(),
                onSelect:function (selectedDate) {
                    var instance = $(this).data("datepicker"),
                        date = $.datepicker.parseDate(instance.settings.dateFormat || $.datepicker._defaults.dateFormat, selectedDate, instance.settings);

                    if (date.getTime() < self.dateFromSelected) {
                        self.dateFromSelected = date.getTime();
                    }

                    dateFrom.datepicker("option", "maxDate", date);
                    self.dateToSelected = date.getTime();

                    setSelectedDate();
                }
            });

            var dateFrom = $("#date-from").datepicker({
                numberOfMonths:1,
                showOtherMonths:true,
                maxDate:moment().subtract(1, 'days').toDate(),
                onSelect:function (selectedDate) {
                    var instance = $(this).data("datepicker"),
                        date = $.datepicker.parseDate(instance.settings.dateFormat || $.datepicker._defaults.dateFormat, selectedDate, instance.settings);

                    if (date.getTime() > self.dateToSelected) {
                        self.dateToSelected = date.getTime();
                    }

                    dateTo.datepicker("option", "minDate", date);
                    self.dateFromSelected = date.getTime();

                    setSelectedDate();
                }
            });

            function setSelectedDate() {
                var from = moment(dateFrom.datepicker("getDate")).format("D MMM, YYYY"),
                    to = moment(dateTo.datepicker("getDate")).format("D MMM, YYYY");

                $("#selected-date").text(from + " - " + to);
            }

            $.datepicker.setDefaults($.datepicker.regional[""]);
            $("#date-to").datepicker("option", $.datepicker.regional[countlyCommon.BROWSER_LANG]);
            $("#date-from").datepicker("option", $.datepicker.regional[countlyCommon.BROWSER_LANG]);

            $("#date-submit").click(function () {
                if (!self.dateFromSelected && !self.dateToSelected) {
                    return false;
                }

                var tzCorr = countlyCommon.getOffsetCorrectionForTimestamp(self.dateFromSelected);
                countlyCommon.setPeriod([self.dateFromSelected - tzCorr, self.dateToSelected - tzCorr]);

                self.activeView.dateChanged();

                $(".date-selector").removeClass("selected").removeClass("active");
            });

            $('.scrollable').slimScroll({
                height:'100%',
                start:'top',
                wheelStep:10,
                position:'right',
                disableFadeOut:true
            });

            $(".checkbox").on('click', function () {
                $(this).toggleClass("checked");
            });

            $(".resource-link").on('click', function() {
                if ($(this).data("link")) {
                    CountlyHelpers.openResource($(this).data("link"));
                }
            });

            $("#sidebar-menu").find(".item").each(function(i) {
                if ($(this).next().hasClass("sidebar-submenu") && $(this).find(".ion-chevron-right").length == 0) {
                    $(this).append("<span class='ion-chevron-right'></span>");
                }
            });

            $('.nav-search').on('input', "input", function(e){
                var searchText = new RegExp($(this).val().toLowerCase()),
                    searchInside = $(this).parent().next().find(".searchable");

                searchInside.filter(function () {
                    return !(searchText.test($(this).text().toLowerCase()));
                }).css('display','none');

                searchInside.filter(function () {
                    return searchText.test($(this).text().toLowerCase());
                }).css('display','block');
            });

            $(document).on('input', "#listof-apps .search input", function(e) {
                var searchText = new RegExp($(this).val().toLowerCase()),
                    searchInside = $(this).parent().next().find(".searchable");

                searchInside.filter(function () {
                    return !(searchText.test($(this).text().toLowerCase()));
                }).css('display','none');

                searchInside.filter(function () {
                    return searchText.test($(this).text().toLowerCase());
                }).css('display','block');
            });

            $(document).on('mouseenter', ".bar-inner", function(e) {
                var number = $(this).parent().next();

                number.text($(this).data("item"));
                number.css({"color":$(this).css("background-color")});
            });

            $(document).on('mouseleave', ".bar-inner", function(e) {
                var number = $(this).parent().next();

                number.text(number.data("item"));
                number.css({"color":$(this).parent().find(".bar-inner:first-child").css("background-color")});
            });
        });
    }
});

var app = new AppRouter();