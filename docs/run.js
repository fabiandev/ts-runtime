tsp.spread = tsp.spread || function spread(arg, start) {
  var args = arg || [];
  var spread = [];

  for (var i = start || 0; i < args.length; i++) {
    spread.push(args[i]);
  }

  return spread;
}

tsp.getElement = tsp.getElement || function getElement() {
  return document.getElementById('console-content');
}

tsp.clearConsole = tsp.clearConsole || function clearConsole() {
  tsp.getElement().innerHTML = '';
}

tsp.wrapConsoleText = tsp.wrapConsoleText || function wrapConsoleText(type, text) {
  return '<span class="log-' + type + '"><span class="icon-' + type + '"></span>' + text + '</span>';
}

tsp.updateConsole = tsp.updateConsole || function updateConsole(type, message) {
  var optionalParams = tsp.spread(arguments, 2);

  var text = tsp.logToText(message);

  for (var param of optionalParams) {
    text += '\n   ' + tsp.logToText(param);
  }

  text = tsp.wrapConsoleText(type, text);

  tsp.getElement().innerHTML += text + '\n';
}

tsp.logToText = tsp.logToText || function logToText(message) {
  if (typeof message === 'object' && message !== null) {
    return JSON.stringify(message);
  }

  return tsp.escape(message);
}

tsp.escape = tsp.escape || function escape(text) {
  var div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

tsp.log = tsp.log || function log(data) {
  var message = data.data.message;
  var type = data.type;
  var optionalParams = data.data.optionalParams;
  var params = optionalParams;
  params.unshift(message);
  if (data.log)
    data.log.apply(this, params);
  params.unshift(type);
  tsp.updateConsole.apply(this, params);
}

tsp.fadeOut = tsp.fadeOut || function fadeOut(target) {
  target.style.opacity = '1';

  var fadeEffect = setInterval(() => {
    if (parseFloat(target.style.opacity) < 0.05) {
      clearInterval(fadeEffect);
      target.style.opacity = '0';
      target.style.display = 'none';
    } else {
      target.style.opacity = (parseFloat(target.style.opacity) - 0.02) + '';
    }
  }, 5);
}

tsp.originalLog = tsp.originalLog || console.log;
console.log = function log(message) {
  var optionalParams = tsp.spread(arguments, 1);

  tsp.log({
    name: 'log',
    type: 'log',
    log: tsp.originalLog,
    data: {
      message,
      optionalParams
    }
  });
}

tsp.originalInfo = tsp.originalInfo || console.info;
console.info = function info(message) {
  var optionalParams = tsp.spread(arguments, 1);

  tsp.log({
    name: 'log',
    type: 'info',
    log: tsp.originalInfo,
    data: {
      message,
      optionalParams
    }
  });
}

tsp.originalWarn = tsp.originalWarn || console.warn;
console.warn = function warn(message) {
  var optionalParams = tsp.spread(arguments, 1);

  tsp.log({
    name: 'log',
    type: 'warn',
    log: tsp.originalWarn,
    data: {
      message,
      optionalParams
    }
  });
}

tsp.originalError = tsp.originalError || console.error;
console.error = function error(message) {
  var optionalParams = tsp.spread(arguments, 1);

  tsp.log({
    name: 'log',
    type: 'error',
    log: tsp.originalError,
    data: {
      message,
      optionalParams
    }
  });
}

window.onerror = function(message, url, lineNumber) {
  tsp.log({
    name: 'error', type: 'error',
    // log: __originalError,
    data: {
      message,
      optionalParams: []
    }
  });
}
