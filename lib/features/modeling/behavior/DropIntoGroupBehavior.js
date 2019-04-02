import inherits from 'inherits';

import {
  is
} from '../../../util/ModelUtil';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

export default function DropIntoGroupBehavior(eventBus) {

  CommandInterceptor.call(this, eventBus);

  this.preExecute('elements.move', function(context) {

    var newParent = context.newParent;

    // if the new parent is a group,
    // change it to the new parent's parent
    if (newParent && isGroup(newParent)) {
      context.newParent = newParent.parent;
    }

  }, true);

  this.preExecute('shape.create', function(context) {

    var parent = context.parent;

    // if the parent is a group,
    // change it to the parent's parent
    if (parent && isGroup(parent)) {
      context.parent = parent.parent;
    }

  }, true);

  eventBus.on('create.move', 1001, function(event) {
    var context = event.context,
        target = context.target;

    if (target && isGroup(target)) {
      context.hover = context.target = target.parent;
    }
  });


  eventBus.on('shape.move.move', 500, function(event) {
    var context = event.context,
        target = context.target;

    if (target && isGroup(target)) {
      context.target = target.parent;
    }
  });

}

inherits(DropIntoGroupBehavior, CommandInterceptor);

DropIntoGroupBehavior.$inject = [
  'eventBus'
];


// helpers /////////////////////

function isGroup(element) {
  return is(element, 'bpmn:Group');
}

