/* jshint esversion:6 */
/* jshint node: true */

const util = require('./util');
let LCDPLATE, lcd = { // stub out some functions for development without a pi
  backlight: function() { },
  colors: { }, 
  clear: function(){ }, 
  message: function(text) { }
};
try {
  LCDPLATE = require('adafruit-i2c-lcd').plate;
  lcd = new LCDPLATE(1, 0x20); // 1 => /dev/i2c-1, 0x20 => i2c address 0x20
} catch (err) {
  console.error(err);
}

module.exports = (function(){
  console.log('Initialized LCD');
  let lastRendered = '';
  let lines = [ 
    '                ',
    '                ' 
  ];  

  // initialize the backlight color to RED
  setBacklightColor('red');

  function centerJustify(str, length, char = ' ') {
    let i = 0;	  
	  let toggle = true;
    while (str.length < length ) {      
	    if(toggle) str = str + char;
	    else str = char + str;
      toggle = !toggle;
    }
    return str;
  }

  function setBacklightColor(str){
    return new Promise(function(resolve, reject){
      let rejected = false;
      switch(str.toUpperCase()){
        case 'OFF': lcd.backlight(lcd.colors.OFF); break;
        case 'ON': lcd.backlight(lcd.colors.ON); break;
        case 'RED': lcd.backlight(lcd.colors.RED); break;
        case 'GREEN': lcd.backlight(lcd.colors.GREEN); break;
        case 'BLUE': lcd.backlight(lcd.colors.BLUE); break;
        case 'YELLOW': lcd.backlight(lcd.colors.YELLOW); break;
        case 'TEAL': lcd.backlight(lcd.colors.TEAL); break;
        case 'VIOLET': lcd.backlight(lcd.colors.VIOLET); break;
        case 'WHITE': lcd.backlight(lcd.colors.WHITE); break;
        default: rejected = true; reject(); break;
      }

      if(!rejected){
        resolve();
      }
    });
  }

  function render(){
    return new Promise(function(resolve, reject){
      try{
        const two_lines_combined = `${lines[0].slice(0,16)}\n${lines[1].slice(0,16)}`;
        if(lastRendered != two_lines_combined){
          lcd.clear();
          lcd.message(two_lines_combined);
          lastRendered = two_lines_combined;
        }        
        resolve();        
      } catch (err) {
        reject(err);
      }
    });
  }

  function centerText(text, lineNumber) {
    if(lineNumber >= 0 && lineNumber < 2){
      lines[lineNumber] = centerJustify(text.slice(0,16), 16);
    } else {
      console.error(`centerText called with invalid lineNumber ${lineNumber}`);
    }
    return render();
  }

  function authorize() {
    lines[0] = centerJustify('AUTHORIZED', 16);
    lines[1] = centerJustify('', 16);
    return setBacklightColor('green').then(render);
  }

  function deauthorize() {
    lines[0] = centerJustify('ENTER CODE:', 16);    
    lines[1] = centerJustify('', 16);
    return setBacklightColor('red').then(render);
  }

  function unauthorized() {
    lines[0] = centerJustify('NOT AUTHORIZED', 16);    
    lines[1] = centerJustify('', 16);
    return setBacklightColor('yellow').then(render);
  }

  return {
    centerText,
    authorize,
    deauthorize,
    unauthorized,
    setBacklightColor
  };
})();