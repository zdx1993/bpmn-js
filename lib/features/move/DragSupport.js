'use strict';

var Draggable = require('./Draggable');


/**
 * Adds drag support to elements, firing <shape.drag.*> events.
 *
 * Fired drag events: start, cancel, move, hover, out.
 *
 * @param {EventBus} eventBus
 * @param {ElementRegistry} elementRegistry
 */
function DragSupport(eventBus, elementRegistry) {

  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;

  this._draggables = {};
  this._activeDragContext = null;

  var self = this;

  function cancelOnEscape(event) {

    // ESC
    if (event.which === 27) {
      var ctx = self._activeDragContext;

      if (ctx) {
        self.get(ctx.element).cancelDrag();
      }
    }
  }

  eventBus.on('canvas.viewbox.changed', function(e) {
    self._viewbox = e.viewbox;
  });

  eventBus.on('shape.drag.start', function(event) {
    self._activeDragContext = event.dragContext;

    document.addEventListener('keydown', cancelOnEscape);
  });

  eventBus.on([ 'shape.drag.cancel', 'shape.drag.end', 'diagram.destroy' ], function() {
    self._activeDragContext = null;

    document.removeEventListener('keydown', cancelOnEscape);
  });

  eventBus.on('element.hover', function(e) {
    var ctx = self._activeDragContext;
    if (ctx) {
      self._fire('hover', e);

      if (!e.defaultPrevented) {
        ctx.hoverElement = e.element;
        ctx.hoverGfx = e.gfx;
      }
    }
  });

  eventBus.on('element.out', function(e) {
    var ctx = self._activeDragContext;
    if (ctx) {
      self._fire('out', e);

      if (!e.defaultPrevented) {
        delete ctx.hoverElement;
        delete ctx.hoverGfx;
      }
    }
  });

  eventBus.on('diagram.destroy', function() {
    _.forEach(self._draggables, function(d) {
      d.remove();
    });
  });
}

DragSupport.$inject = [ 'eventBus', 'elementRegistry' ];

module.exports = DragSupport;


DragSupport.prototype.add = function(element) {
  var draggable = this.get(element);

  if (!draggable) {
    this._draggables[element.id] = draggable = this._createDraggable(element);
  }

  return draggable;
};

DragSupport.prototype.get = function(element) {
  return this._draggables[element.id];
};

DragSupport.prototype.remove = function(element) {
  var draggable = this.get(element);

  if (draggable) {
    draggable.destroy();
  }

  delete this._draggables[element.id];
};

DragSupport.prototype.getDragContext = function() {
  return this._activeDragContext;
};

//////// internal helpers //////////////////////////////

DragSupport.prototype._fire = function(event, e) {

  if (!e.dragContext) {
    e.dragContext = this._activeDragContext;
  }

  return this._eventBus.fire('shape.drag.' + event, e);
};

DragSupport.prototype._fixScale = function(event) {

  // fix fix move delta according to current
  // viewport scale
  var delta = event.dragContext && event.dragContext.delta,
      scale = this._viewbox && this._viewbox.scale;

  if (delta && scale) {
    delta.x /= scale;
    delta.y /= scale;
  }

  return event;
};

DragSupport.prototype._createDraggable = function(element) {
  var gfx = this._elementRegistry.getGraphics(element);

  var self = this;

  return new Draggable(element, gfx, {
    start: function(e) {
      return self._fire('start', e);
    },
    move: function(e) {
      return self._fire('move', self._fixScale(e));
    },
    end: function(e) {
      return self._fire('end', e);
    },
    cancel: function(e) {
      return self._fire('cancel', e);
    }
  });
};