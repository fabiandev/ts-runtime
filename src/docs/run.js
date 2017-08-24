if (!tsp.initialized) {
  tsp.getElement = function getElement() {
    return document.getElementById('console-content');
  }

  tsp.clearConsole = function clearConsole() {
    tsp.getElement().innerHTML = '';
  }

  tsp.wrapConsoleText = function wrapConsoleText(type, text) {
    return `<span class="log-${type}"><span class="icon-${type}"></span>${text}</span>`;
  }

  tsp.updateConsole = function updateConsole(type, message, ...optionalParams) {
    let text = tsp.logToText(message);

    for (let param of optionalParams) {
      text += `\n${tsp.logToText(param)}`;
    }

    text = tsp.wrapConsoleText(type, text);

    tsp.getElement().innerHTML += `${text}\n`;
  }

  tsp.logToText = function logToText(message) {
    if (typeof message === 'object' && message !== null) {
      return JSON.stringify(message);
    }

    return tsp.escape(message);
  }

  tsp.escape = function escape(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }

  tsp.log = function log(data) {
    const message = data.data.message;
    const type = data.type;
    const optionalParams = data.data.optionalParams;
    const params = optionalParams;
    params.unshift(message);
    if (data.log) {
      data.log.apply(this, params);
    }
    params.unshift(type);
    tsp.updateConsole.apply(this, params);
  }

  tsp.fadeOut = function fadeOut(target) {
    target.style.opacity = '1';

    const fadeEffect = setInterval(() => {
      if (parseFloat(target.style.opacity) < 0.05) {
        clearInterval(fadeEffect);
        target.style.opacity = '0';
        target.style.display = 'none';
      } else {
        target.style.opacity = (parseFloat(target.style.opacity) - 0.02) + '';
      }
    }, 5);
  }

  tsp.originalLog = console.log;
  console.log = function log(message, ...optionalParams) {
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

  tsp.originalInfo = console.info;
  console.info = function info(message, ...optionalParams) {
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

  tsp.originalWarn = console.warn;
  console.warn = function warn(message, ...optionalParams) {
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

  tsp.originalError = console.error;
  console.error = function error(message, ...optionalParams) {
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

  tsp.initialized = true;
}

window.onerror = function(message, url, lineNumber) {
  tsp.log({
    name: 'error',
    type: 'error',
    // log: __originalError,
    data: {
      message,
      optionalParams: []
    }
  });
}
