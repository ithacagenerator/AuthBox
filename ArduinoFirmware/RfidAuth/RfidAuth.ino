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

void setup()
{
  Serial.begin(115200);
  attachInterrupt(0, ISRreceiveData0, FALLING );  //data0/tx is connected to pin 2, which results in INT 0
  attachInterrupt(1, ISRreceiveData1, FALLING );  //data1/rx is connected to pin 3, which results in INT 1
}

void loop()
{
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
    }
    resetData();
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


