;(function ( $, window, document, undefined ) {

             
    var pluginName = "filterList",
        defaults = {
            form: '',
            list: '',
            resetButton: '.reset',
            loadMoreButton: '',
            apiUrl: '',
            apiDataObj: {},
            beforeListItemsRetrieved: null,
            afterListItemsRetrieved: null,
            afterListItemsAdded: null,
            renderEmptyMessage: null,
            renderLoadingMessage: null,
            loadMoreEmptyMessage: 'No more results to show.',
            filterEmptyMessage: 'No results were found.'
        };

    // The actual plugin constructor
    function FilterList ( element, options ) {
        this.element = element;                        
        this.settings = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    FilterList.prototype = {
        init: function () {
            this.container = $(this.element);
                                 
            this.form = this.container.find(this.settings.form);
            this.list = this.container.find(this.settings.list);
            this.resetButton = this.container.find(this.settings.resetButton);
            this.loadMoreButton = this.container.find(this.settings.loadMoreButton);

            this.form.on("submit", $.proxy(this.onFormSubmit, this));
            this.resetButton.on("click", $.proxy(this.onResetButtonClick, this));
            this.loadMoreButton.on("click", $.proxy(this.onLoadMoreButtonClick, this));
                         
            if(window.addEventListener)
                window.addEventListener('popstate', $.proxy(this.onPageStateChanged, this));

            this.setInitialPageState();              
        },

        onFormSubmit: function() {
            this.getListItems(0, false, true);

            return false;
        },

        onResetButtonClick: function() {
            this.form.find("select").val('');
            this.getListItems(0, false, true);
            return false;
        },

        onLoadMoreButtonClick: function() {
            var offset = this.list.children().length;

            this.getListItems(offset, true, false);

            return false;
        },

        getListItems: function(offset, append, updatePageState) {
            if(this.settings.beforeListItemsRetrieved)
                this.settings.beforeListItemsRetrieved();

            var data = $.extend({}, this.settings.apiDataObj);

            if(this.settings.offset)
                data[this.settings.offset] = offset;

            var formData = this.getFormData();

            if(updatePageState)
                this.updatePageState(formData);

            data = $.extend( data, formData );

            this.setLoadingState(true);

            $.ajax({
                type : "post",
                dataType : "json",
                url : this.settings.apiUrl,
                data: data,
                success: $.proxy(this.onListItemsRetrieved, this, append),
                error: function(response) {
                    alert('error:' + response);
                }
            });
        },

        onListItemsRetrieved: function(append, response) {
            this.setLoadingState(false);
            this.container.find(".no-results-message").remove();
            if(this.settings.afterListItemsRetrieved) {
                var items = this.settings.afterListItemsRetrieved(response);
                
                if(items) {
                    if(append)
                        this.list.append(items);
                    else
                        this.list.html(items);
                } else {
                    if(!append)
                        this.list.empty();
                    var message = append ? this.settings.loadMoreEmptyMessage : this.settings.filterEmptyMessage;                    
                    if(this.settings.renderEmptyMessage)
                        this.settings.renderEmptyMessage(message);
                    else
                        this.list.after('<div class="no-results-message">' + message + '</div>');
                }

                if(this.settings.afterListItemsAdded)
                    this.settings.afterListItemsAdded(items, append);     
            }
        },

        onError: function() {
            this.setLoadingState(false);
        },

        setLoadingState: function(isLoading) {
            if(isLoading) {
                this.form.find(":input").attr("disabled", "disabled");
                this.resetButton.addClass("disabled");
                this.container.addClass("loading");
                if(this.settings.renderLoadingMessage)
                    this.settings.renderLoadingMessage();
                else
                    this.list.before('<div class="loading-message">Loading</div>');
            } else {
                this.form.find(":input").removeAttr("disabled");
                this.resetButton.removeClass("disabled");
                this.container.removeClass("loading");
                this.container.find(".loading-message").remove();
            }
        },

        setInitialPageState: function() {
            if(window.history.replaceState) { 
                var data = this.getFormData();   
                window.history.replaceState(data, document.title, document.location.href);
            }
        },

        onPageStateChanged: function(e) {
            if(e.state == null) 
                return;        

            for(var key in e.state) {               
                var formField = this.form.find("#" + key);
                if(formField.length) {
                    formField.val(e.state[key].replace('+', ' '));                    
                }               
            }

            this.getListItems(0, false, false);

        },

        updatePageState: function(data) {
            if(window.history.pushState) {
                var url = "?" + $.param(data);
                window.history.pushState(data, '', url);
            }
        },

        getFormData: function() {
            var data = {};
            $.each(this.form.serializeArray(), function() {
                if(this.value != '')
                    data[this.name] = this.value;
            });
            return data;
        },

        destroy: function() { 
        }

    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function ( options ) {
        return this.each(function() {
                var instance = $.data( this, "plugin_" + pluginName );
                if(instance) {
                    if (typeof options == "string")
                        instance[options].apply(instance);  
                } else
                    $.data( this, "plugin_" + pluginName, new FilterList( this, options ) );
                
        });
    };

})( jQuery, window, document );
