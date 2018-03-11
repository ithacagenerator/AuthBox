#include <stdlib.h>
#include <stdint.h>
#include <string.h>

// Slight adapatation of Wiegand demo code 
// referenced / linked at http://wiki.seeed.cc/Grove-125KHz_RFID_Reader/
//
// wiring instructions
// RED = 5V from Arduino
// BLACK = GND from Arduino
// WHITE = DIG2 on Arduino
// YELLOW = DIG3 on Arduino
//
// outputs the laser etched code from the RFID reader (sans leading zeroes)
// as an ASCII string, one character at a tim// 
// separated by \r\n 

byte RFIDcardNum[4];
byte evenBit = 0;
byte oddBit = 0;
byte isData0Low = 0;
byte isData1Low = 0;
int recvBitCount = 0;
byte isCardReadOver = 0;

void handleCommands(char c);
uint16_t crc16_update(uint16_t crc, uint8_t a);
uint16_t crc16(char * str, uint8_t len);
uint8_t check_crc16(char * str);
void handleAuthorizeCommand(void);
void handleLockoutCommand(void);
void handleBuzzerOnCommand(void);
void handleBuzzerOffCommand(void);
void enableCounter(void);
void disableCounter(void);

int LOCKOUT_PIN = 13; // Relay control output
int BUZZER_HIGH_PIN = 10;
int BUZZER_LOW_PIN = 9;
boolean buzzer_enabled = false;
boolean buzzer_on = false;
uint32_t previousBuzzerMillis = 0;
const int32_t buzzerInterval = 500; // sets the buzzer beeping frequency

void setup(){
  Serial.begin(9600);
  attachInterrupt(0, ISRreceiveData0, FALLING );  //data0/tx is connected to pin 2, which results in INT 0
  attachInterrupt(1, ISRreceiveData1, FALLING );  //data1/rx is connected to pin 3, which results in INT 1
  
  pinMode(BUZZER_HIGH_PIN, OUTPUT);
  pinMode(BUZZER_LOW_PIN, OUTPUT);
  digitalWrite(BUZZER_HIGH_PIN, 0); 
  digitalWrite(BUZZER_LOW_PIN, 0);
}

void loop(){
  unsigned long currentMillis = millis();
  if (currentMillis - previousBuzzerMillis >= buzzerInterval) {
    previousBuzzerMillis = currentMillis;

    if(buzzer_enabled){
      if(buzzer_on){
        buzzer_on = false;
        disableCounter();
      }
      else{
        buzzer_on = true;
        enableCounter();        
      }
    }
    else {
      disableCounter();
    }
  }
  
  //read card number bit
  if(isData0Low||isData1Low){
    if(1 == recvBitCount){//even bit
      evenBit = (1-isData0Low)&isData1Low;
    }
    else if( recvBitCount >= 26){//odd bit
      oddBit = (1-isData0Low)&isData1Low;
      isCardReadOver = 1;
      delay(10);
    }
    else{
      //only if isData1Low = 1, card bit could be 1
      RFIDcardNum[2-(recvBitCount-2)/8] |= (isData1Low << (7-(recvBitCount-2)%8));
    }
    //reset data0 and data1
    isData0Low = 0;
    isData1Low = 0;
  }

  if(isCardReadOver){
    if(checkParity()){
      // convert the number to a string
      uint32_t number = *((uint32_t *)RFIDcardNum);
      char tmp[16] = {0};
      sprintf(tmp, "%lu", number);
      uint8_t len = strlen(tmp);
      for(uint8_t ii = 0; ii < len; ii++){
        Serial.println(tmp[ii]);
      }
      Serial.println('#'); // append the 'enter' key
    }
    resetData();
  }

  while (Serial.available()){
      handleCommands(Serial.read());
  }  

}

byte checkParity(){
  int i = 0;
  int evenCount = 0;
  int oddCount = 0;
  for(i = 0; i < 8; i++){
    if(RFIDcardNum[2]&(0x80>>i)){
      evenCount++;
    }
  }
  for(i = 0; i < 4; i++){
    if(RFIDcardNum[1]&(0x80>>i)){
      evenCount++;
    }
  }
  for(i = 4; i < 8; i++){
    if(RFIDcardNum[1]&(0x80>>i)){
      oddCount++;
    }
  }
  for(i = 0; i < 8; i++){
    if(RFIDcardNum[0]&(0x80>>i)){
      oddCount++;
    }
  }
  
  if(evenCount%2 == evenBit && oddCount%2 != oddBit){
    return 1;
  }
  else{
    return 0;
  }
}
void resetData(){
  RFIDcardNum[0] = 0;
  RFIDcardNum[1] = 0;
  RFIDcardNum[2] = 0;
  RFIDcardNum[3] = 0;
  evenBit = 0;
  oddBit = 0;
  recvBitCount = 0;
  isData0Low = 0;
  isData1Low = 0;
  isCardReadOver = 0;
}
// handle interrupt0
void ISRreceiveData0(){
  recvBitCount++;
  isData0Low = 1;
}

// handle interrupt1
void ISRreceiveData1(){
  recvBitCount++;
  isData1Low = 1;
}

uint16_t crc16_update(uint16_t crc, uint8_t a){
    crc ^= a;
    for (uint8_t i = 0; i < 8; ++i){
        if (crc & 1)
            crc = (crc >> 1) ^ 0xA001;
        else
            crc = (crc >> 1);
    }

    return crc;
}

uint16_t crc16(char * str, uint8_t len){
    uint16_t crc = 0;
    for(uint16_t ii = 0; ii < len; ii++){
        crc = crc16_update(crc, str[ii]);
    }
    return crc;
}

uint8_t check_crc16(char * str){
    uint8_t ret = 0;
    uint8_t len = strlen(str);
    if(len >= 5){
        uint16_t calculated_crc16 = crc16(str, len - 4);
        char * temp;        
        uint16_t expected_crc16 = strtol(str + strlen(str) - 4, &temp, 16); // base 16
        if (*temp == NULL){
            if(calculated_crc16 == expected_crc16){
                ret = 1; // success!
            }
        }
    }
    return ret;
}

// state machine for handline incoming characters from the Raspberry Pi
// commands are always terminated by XXXX\n, 
// where XXXX is a CRC16 of the bytes in the command as a HEX-string and \n is a newline character
// CRC16 is computed on the byte values in the line up to the checksum
// CRC16 implementation is explicitly included as a function below
// taking the algorithm from http://www.nongnu.org/avr-libc/user-manual/group__util__crc.html
// this should make it pretty difficult to "accidentally" send an authorization command
// though it's admittedly kind of overkill when the commands are not parametric
// should be relatively easy to extend this command processing logic to support more commands
//
// valid commands are:
//   authorize40A2\n
//   lockoutDF6B\n
//   sirenF012
//   quiet6C9D
void handleCommands(char c){
    static char lineBuffer[64] = {0}; // allow up to 63 characters in a command (plus null terminator)
    static uint8_t idx = 0;
    if(c == '\n' || c == '\r'){
        // newline triggers processing of the command, but only if the checksum is sound
        // remember the last four characters in the buffer are expected to be a hex value string
        if(check_crc16(lineBuffer)){
            lineBuffer[strlen(lineBuffer) - 4] = '\0'; // don't need the checksum anymore
            if(0 == strcmp_P(lineBuffer, PSTR("authorize"))){
                handleAuthorizeCommand();
            }
            else if(0 == strcmp_P(lineBuffer, PSTR("lockout"))){
                handleLockoutCommand();
            }
            else if(0 == strcmp_P(lineBuffer, PSTR("siren"))){
                handleBuzzerOnCommand();
            }
            else if(0 == strcmp_P(lineBuffer, PSTR("quiet"))){
                handleBuzzerOffCommand(); 
            }            
            else {
              Serial.print(F("Unknown Command: \"")); Serial.print(lineBuffer); Serial.print(F("\""));Serial.println();              
            }
        }
        else{
            Serial.print(F("Invalid CRC16: \"")); Serial.print(lineBuffer); Serial.print(F("\""));Serial.println();
        }

        idx = 0; // get ready for next line
        memset(lineBuffer, 0, sizeof(lineBuffer));        
    }
    else{
        // buffer the character
        lineBuffer[idx] = c;

        // advance the write index, the highest value idx should ever hold is
        // 62 for a 64 byte buffer, because 63 must always hold a null terminator
        // if you would overflow, just keep overwriting the last possible buffer entry
        if(idx < (sizeof(lineBuffer) - 1)){
            idx++;
        }
    }
}

void handleAuthorizeCommand(void){    
    Serial.println("authorize");
    digitalWrite(LOCKOUT_PIN, HIGH);
}

void handleLockoutCommand(void){    
    Serial.println("lockout");    
    digitalWrite(LOCKOUT_PIN, LOW);
}

void handleBuzzerOnCommand(void){
  Serial.println("siren");     
  // set for Phase + Frequency Correct PWM Mode
  // WGM3:0 = 1000
  // IRC1 = TOP   -- determines output frequency = CLK / ( 2 * Prescale * TOP)
  //                 CLK = 16000000 Hz
  //                 Prescale = 1, 8, 64, 256, or 1024
  //                 pick TOP so that output frequency ~ 4000
  // a perfect match is PRESCALER = 8, TOP = 250 ... 16MHz / (2 * 8 * 250) = 1000kHz / 250 = 4kHz
  //
  // COM1A1:0 = 10 set/clear
  // COM1B1:0 = 11 clear/set
  // Set ORC1A = ORCR1B to 1/2 IRCR = 125

  OCR1A  = 125;
  OCR1B  = 125;
  ICR1   = 250;
  TCCR1A = _BV(COM1A1) | _BV(COM1B1) | _BV(COM1B0); 
  TCCR1B = _BV(WGM13);    
  buzzer_enabled = true;  
}

void handleBuzzerOffCommand(void){
  Serial.println("quiet");  
  TCCR1A = 0x00;
  TCCR1B = 0x00;
  TCCR1C = 0x00;    
  buzzer_enabled = false;
}

void enableCounter(){
  TCCR1B |= _BV(CS11);
}

void disableCounter(){
  TCCR1B &= ~_BV(CS11);
}


