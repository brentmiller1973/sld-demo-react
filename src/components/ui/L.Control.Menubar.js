import * as L from 'leaflet/src/Leaflet';

const MenuBar = {
  initMenuBar: () => {
    L.Control.Menubar = L.Control.extend({
      includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,

      options: {
        autopan: false,
        closeButton: true,
        container: null,
        position: 'left'
      },

      initialize(options, deprecatedOptions) {
        if (typeof options === 'string') {
          // console.warn('this syntax is deprecated. please use L.control.menubar({ container }) now');
          options = { container: options };
        }

        if (typeof options === 'object' && options.id) {
          console.warn('this syntax is deprecated. please use L.control.menubar({ container }) now');
          options.container = options.id;
        }

        this._tabitems = [];
        this._panes = [];
        this._closeButtons = [];

        L.setOptions(this, options);
        L.setOptions(this, deprecatedOptions);
        return this;
      },

      onAdd(map) {
        // tslint:disable-next-line:one-variable-per-declaration
        let i, child, tabContainers, newContainer, container;

        // use container from previous onAdd()
        container = this._container;

        // use the container given via options.
        if (!container) {
          container = this._container || typeof this.options.container === 'string'
              ? L.DomUtil.get(this.options.container)
              : this.options.container;
        }

        // if no container was specified or not found, create it and apply an ID
        if (!container) {
          container = L.DomUtil.create('div', 'leaflet-menubar collapsed');
          if (typeof this.options.container === 'string') {
            container.id = this.options.container;
          }
        }

        // Find paneContainer in DOM & store reference
        this._paneContainer = container.querySelector('div.leaflet-menubar-content');

        // If none is found, create it
        if (this._paneContainer === null) {
          this._paneContainer = L.DomUtil.create('div', 'leaflet-menubar-content', container);
        }

        // Find tabContainerTop & tabContainerBottom in DOM & store reference
        tabContainers = container.querySelectorAll('ul.leaflet-menubar-tabs, div.leaflet-menubar-tabs > ul');
        this._tabContainerTop    = tabContainers[0] || null;
        this._tabContainerBottom = tabContainers[1] || null;

        // If no container was found, create it
        if (this._tabContainerTop === null) {
          newContainer = L.DomUtil.create('div', 'leaflet-menubar-tabs', container);
          newContainer.setAttribute('role', 'tablist');
          this._tabContainerTop = L.DomUtil.create('ul', '', newContainer);
        }
        if (this._tabContainerBottom === null) {
          newContainer = this._tabContainerTop.parentNode;
          this._tabContainerBottom = L.DomUtil.create('ul', '', newContainer);
        }

        // Store Tabs in Collection for easier iteration
        for (i = 0; i < this._tabContainerTop.children.length; i++) {
          child = this._tabContainerTop.children[i];
          child._menubar = this;
          child._id = child.querySelector('a').hash.slice(1); // FIXME: this could break for links!
          this._tabitems.push(child);
        }
        for (i = 0; i < this._tabContainerBottom.children.length; i++) {
          child = this._tabContainerBottom.children[i];
          child._menubar = this;
          child._id = child.querySelector('a').hash.slice(1); // FIXME: this could break for links!
          this._tabitems.push(child);
        }

        // Store Panes in Collection for easier iteration
        for (i = 0; i < this._paneContainer.children.length; i++) {
          child = this._paneContainer.children[i];
          if (child.tagName === 'DIV' &&
              L.DomUtil.hasClass(child, 'leaflet-menubar-pane')) {
            this._panes.push(child);

            // Save references to close buttons
            const closeButtons = child.querySelectorAll('.leaflet-menubar-close');
            if (closeButtons.length) {
              this._closeButtons.push(closeButtons[closeButtons.length - 1]);
              this._closeClick(closeButtons[closeButtons.length - 1], 'on');
            }
          }
        }

        // set click listeners for tab & close buttons
        for (i = 0; i < this._tabitems.length; i++) {
          this._tabClick(this._tabitems[i], 'on');
        }

        // leaflet moves the returned container to the right place in the DOM
        return container;
      },
      onRemove(map) {
        // Remove click listeners for tab & close buttons
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < this._tabitems.length; i++) {
          this._tabClick(this._tabitems[i], 'off');
        }
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < this._closeButtons.length; i++) {
          this._closeClick(this._closeButtons[i], 'off');
        }

        this._tabitems = [];
        this._panes = [];
        this._closeButtons = [];

        return this;
      },

      /**
       * @method addTo(map: Map): this
       * Adds the control to the given map. Overrides the implementation of L.Control,
       * changing the DOM mount target from map._controlContainer.topleft to map._container
       */
      addTo(map) {
        this.onRemove();
        this._map = map;

        this._container = this.onAdd(map);

        L.DomUtil.addClass(this._container, 'leaflet-control');
        L.DomUtil.addClass(this._container, 'leaflet-menubar-' + this.getPosition());
        if (L.Browser.touch) {
          L.DomUtil.addClass(this._container, 'leaflet-touch');
        }

        // when adding to the map container, we should stop event propagation
        L.DomEvent.disableScrollPropagation(this._container);
        L.DomEvent.disableClickPropagation(this._container);
        L.DomEvent.on(this._container, 'contextmenu', L.DomEvent.stopPropagation);

        // insert as first child of map container (important for css)
        map._container.insertBefore(this._container, map._container.firstChild);

        return this;
      },


      removeFrom(map) {
        console.warn('removeFrom() has been deprecated, please use remove() instead as support for this function will be ending soon.');
        this._map._container.removeChild(this._container);
        this.onRemove(map);

        return this;
      },

      open(id) {
        let i;
        let child;
        let tab;

        // If panel is disabled, stop right here
        tab = this._getTab(id);
        if (L.DomUtil.hasClass(tab, 'disabled')) {
          return this;
        }

        // Hide old active contents and show new content
        for (i = 0; i < this._panes.length; i++) {
          child = this._panes[i];
          if (child.id === id) {
            L.DomUtil.addClass(child, 'active');
          } else if (L.DomUtil.hasClass(child, 'active')) {
            L.DomUtil.removeClass(child, 'active');
          }
        }

        // Remove old active highlights and set new highlight
        for (i = 0; i < this._tabitems.length; i++) {
          child = this._tabitems[i];
          if (child.querySelector('a').hash === '#' + id) {
            L.DomUtil.addClass(child, 'active');
          } else if (L.DomUtil.hasClass(child, 'active')) {
            L.DomUtil.removeClass(child, 'active');
          }
        }

        this.fire('content', { id });

        // Open menubar if it's closed
        if (L.DomUtil.hasClass(this._container, 'collapsed')) {
          this.fire('opening');
          L.DomUtil.removeClass(this._container, 'collapsed');
          if (this.options.autopan) { this._panMap('open'); }
        }

        return this;
      },

      close() {
        let i;

        // Remove old active highlights
        for (i = 0; i < this._tabitems.length; i++) {
          const child = this._tabitems[i];
          if (L.DomUtil.hasClass(child, 'active')) {
            L.DomUtil.removeClass(child, 'active');
          }
        }

        // close menubar, if it's opened
        if (!L.DomUtil.hasClass(this._container, 'collapsed')) {
          this.fire('closing');
          L.DomUtil.addClass(this._container, 'collapsed');
          if (this.options.autopan) { this._panMap('close'); }
        }

        return this;
      },

      addPanel(data) {
        let pane;
        let tab;
        let tabHref;
        let closeButtons;
        let content;

        // Create tab node
        tab = L.DomUtil.create('li', data.disabled ? 'disabled' : '');
        tabHref = L.DomUtil.create('a', '', tab);
        tabHref.href = '#' + data.id;
        tabHref.setAttribute('role', 'tab');
        tabHref.innerHTML = data.tab;
        tab._menubar = this;
        tab._id = data.id;
        tab._button = data.button; // to allow links to be disabled, the href cannot be used
        if (data.title && data.title[0] !== '<') { tab.title = data.title; }

        // append it to the DOM and store JS references
        if (data.position === 'bottom') {
          this._tabContainerBottom.appendChild(tab);
        } else {
          this._tabContainerTop.appendChild(tab);
        }

        this._tabitems.push(tab);

        // Create pane node
        if (data.pane) {
          if (typeof data.pane === 'string') {
            // pane is given as HTML string
            pane = L.DomUtil.create('DIV', 'leaflet-menubar-pane', this._paneContainer);
            content = '';
            if (data.title) {
              content += '<h1 class="leaflet-menubar-header">' + data.title;
            }
            if (this.options.closeButton) {
              content += '<span class="leaflet-menubar-close"><i class="fa fa-caret-' + this.options.position + '"></i></span>';
            }
            if (data.title) {
              content += '</h1>';
            }
            pane.innerHTML = content + data.pane;
          } else {
            // pane is given as DOM object
            pane = data.pane;
            this._paneContainer.appendChild(pane);
          }
          pane.id = data.id;

          this._panes.push(pane);

          // Save references to close button & register click listener
          closeButtons = pane.querySelectorAll('.leaflet-menubar-close');
          if (closeButtons.length) {
            // select last button, because thats rendered on top
            this._closeButtons.push(closeButtons[closeButtons.length - 1]);
            this._closeClick(closeButtons[closeButtons.length - 1], 'on');
          }
        }

        // Register click listeners, if the menubar is on the map
        this._tabClick(tab, 'on');

        return this;
      },

      removePanel(id) {
        let pane;
        let tab;
        let i;
        let closeButtons;
        let j;

        // find the tab & panel by ID, remove them, and clean up
        for (i = 0; i < this._tabitems.length; i++) {
          if (this._tabitems[i]._id === id) {
            tab = this._tabitems[i];

            // Remove click listeners
            this._tabClick(tab, 'off');

            tab.remove();
            this._tabitems.splice(i, 1);
            break;
          }
        }

        for (i = 0; i < this._panes.length; i++) {
          if (this._panes[i].id === id) {
            pane = this._panes[i];
            closeButtons = pane.querySelectorAll('.leaflet-menubar-close');
            for (j = 0; j < closeButtons.length; j++) {
              this._closeClick(closeButtons[j], 'off');
            }

            pane.remove();
            this._panes.splice(i, 1);

            break;
          }
        }

        return this;
      },

      enablePanel(id) {
        const tab = this._getTab(id);
        L.DomUtil.removeClass(tab, 'disabled');

        return this;
      },

      disablePanel(id) {
        const tab = this._getTab(id);
        L.DomUtil.addClass(tab, 'disabled');

        return this;
      },

      onTabClick(e, elm) {
        if (L.DomUtil.hasClass(elm, 'active')) {
          elm._menubar.close();
        } else if (!L.DomUtil.hasClass(elm, 'disabled')) {
          if (typeof this._button === 'string') { // an url
            window.location.href = elm._button;
          } else if (typeof elm._button === 'function') { // a clickhandler
            elm._button(e);
          } else { // a normal pane
            elm._menubar.open(elm.querySelector('a').hash.slice(1));
          }
        }
      },

      _tabClick(tab, on) {
        const self = this;
        const link = tab.querySelector('a');
        if (!link.hasAttribute('href') || link.getAttribute('href')[0] !== '#') {
          return;
        }

        if (on === 'on') {

          tab.querySelector('a').addEventListener('click', event => {
            event.preventDefault();
            self.onTabClick(event, tab);
          });

          // L.DomEvent
          //     .on(tab.querySelector('a'), 'click', L.DomEvent.preventDefault, tab)
          //     .on(tab.querySelector('a'), 'click', this.onTabClick, tab);
        } else {
          L.DomEvent.off(tab.querySelector('a'), 'click', this.onTabClick, tab);
        }
      },

      onCloseClick() {
        this.close();
      },

      _closeClick(closeButton, on) {
        if (on === 'on') {
          L.DomEvent.on(closeButton, 'click', this.onCloseClick, this);
        } else {
          L.DomEvent.off(closeButton, 'click', this.onCloseClick);
        }
      },

      _getTab(id) {
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < this._tabitems.length; i++) {
          if (this._tabitems[i]._id === id) {
            return this._tabitems[i];
          }
        }

        throw Error('tab "' + id + '" not found');
      },

      _panMap(openClose) {
        // tslint:disable-next-line:radix
        let panWidth = Number.parseInt(L.DomUtil.getStyle(this._container, 'max-width')) / 2;
        if (
            openClose === 'open' && this.options.position === 'left' ||
            openClose === 'close' && this.options.position === 'right'
        ) { panWidth *= -1; }
        this._map.panBy([panWidth, 0], { duration: 0.5 });
      }
    });
    L.control.menubar = (options, deprecated) => {
      return new L.Control.Menubar(options, deprecated);
    };
  }
};

export default MenuBar;

