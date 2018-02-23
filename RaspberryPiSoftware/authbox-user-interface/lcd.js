module.exports = (function(){
  console.log('Initialized LCD');
  let lines = [ 
    '                ',
    '                ' 
  ];

  const centerJustify = (str, length, char = ' ') => {
    let i = 0;	  
	  let toggle = true;
    while ( i + this.length < length ) {
      i++;
	    if(toggle) str = str + char;
	    else str = char + str;
      toggle = !toggle;
    }
    return str;
  }

  const centerText = (text, lineNumber) => {
    lines[lineNumber] = centerJustify(text.slice(0,16), 16);
    // TODO: put it on the display
    // Mock for now
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  const authorize = () => {
    lines[lineNumber] = centerJustify('AUTHORIZED', 16);
    // TODO: put it on the display
  }

  const deauthorize = () => {
    lines[lineNumber] = centerJustify('ENTER CODE', 16);
    // TODO: put it on the display
  }

  const unauthorized = () => {
    lines[lineNumber] = centerJustify('NOT AUTHORIZED', 16);
    // TODO: put it on the display
  }

  return {
    centerText,
    authorize,
    deauthorize,
    unauthorized
  };
})();