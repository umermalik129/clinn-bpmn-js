import inherits from 'inherits';

import { forEach } from 'min-dash';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import { is } from '../../../util/ModelUtil';

import { getParent } from '../../modeling/util/ModelingUtil';

import { isExpanded } from '../../../util/DiUtil';


export default function ReplaceParticipantBehavior(
    elementRegistry,
    modeling,
    canvas,
    injector
) {
  injector.invoke(CommandInterceptor, this);

  this._elementRegistry = elementRegistry;
  this._modeling = modeling;
  this._canvas = canvas;

  // update message flows on replacing participant
  this.postExecute([ 'shape.replace' ], 1500, function(e) {
    var context = e.context,
        oldShape = context.oldShape,
        newShape = context.newShape,
        elementRegistry = this._elementRegistry,
        modeling = this._modeling,
        canvas = this._canvas;

    if (is(oldShape, 'bpmn:Participant') &&
      is(newShape, 'bpmn:Participant') &&
      !isExpanded(newShape)) {

      var updatingMessageFlows = [];

      forEach(getAllMessageFlows(elementRegistry), function(flow) {
        var source = flow.source,
            target = flow.target;

        if (getParent(source, 'bpmn:Participant') === oldShape) {
          updatingMessageFlows.push({
            source: newShape,
            target: flow.target
          });
        }

        if (getParent(target, 'bpmn:Participant') === oldShape) {
          updatingMessageFlows.push({
            source: flow.source,
            target: newShape
          });
        }
      });

      forEach(updatingMessageFlows, function(definition) {
        var source = definition.source,
            target = definition.target;

        modeling.createConnection(source, target, {
          type: 'bpmn:MessageFlow'
        }, canvas.getRootElement());
      });
    }

  }, this);


}

inherits(ReplaceParticipantBehavior, CommandInterceptor);


ReplaceParticipantBehavior.$inject = [
  'elementRegistry',
  'modeling',
  'canvas',
  'injector'
];


// helper ////////////////

function getAllMessageFlows(elementRegistry) {
  return elementRegistry.filter(function(element) {
    return is(element, 'bpmn:MessageFlow');
  });
}