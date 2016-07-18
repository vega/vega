export default function(name, scope, params) {
  var signalName = '!' + name;
  if (!params.hasOwnProperty(signalName)) {
    params[signalName] = scope.signalRef(name);
  }
  return '_[\'' + signalName + '\']';
}
