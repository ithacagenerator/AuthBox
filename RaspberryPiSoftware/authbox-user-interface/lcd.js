/* jshint esversion:6 */
/* jshint node: true */
module.exports = (function(){
  console.log('Initialized LCD');
  let lines = [ 
    '                ',
    '                ' 
  ];

  function centerJustify(str, length, char = ' ') {
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

  function centerText(text, lineNumber) {
    lines[lineNumber] = centerJustify(text.slice(0,16), 16);
    // TODO: put it on the display
    // Mock for now
    return new Promise(function(resolve, reject) {
      resolve();
    });
  }

  function authorize() {
    lines[lineNumber] = centerJustify('AUTHORIZED', 16);
    // TODO: put it on the display
  }

  function deauthorize() {
    lines[lineNumber] = centerJustify('ENTER CODE', 16);
    // TODO: put it on the display
  }

  function unauthorized() {
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