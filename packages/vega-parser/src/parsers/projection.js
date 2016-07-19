import {extend} from 'vega-util';

export default function(proj, scope) {
  var params = extend({}, proj);
  delete params.name;
  params.type = proj.type || 'mercator';
  scope.addProjection(proj.name, params);
}
