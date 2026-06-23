#include <DHT.h>
#include <Servo.h>

// -------------------- DHT11 --------------------
#define DHTPIN 11
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// -------------------- SERVO --------------------
Servo servo1;

// -------------------- PINS --------------------
const int daqPin = 2;   // DAQ input
const int motorOut = 5; // motor output

const int moisturePin1 = A0; 
const int moisturePin2 = A1;

const int servoPin1 = 6;

const int buzzerDAQ = 10; // DAQ input to the buzzer
const int buzzerOut = 9;  // Buzzer output signal

// -------------------- MOISTURE CALIBRATION --------------------
const int DRY_VALUE = 600;
const int WET_VALUE = 0;

// -------------------- SERVO POSITIONS --------------------
const int LOW_POS = 0;
const int HIGH_POS = 90;

int currentPos = LOW_POS;

// -------------------- TIMING --------------------
unsigned long lastReadTime = 0;
const unsigned long readInterval = 3000;

// -------------------- SETUP --------------------
void setup()
{
    pinMode(daqPin, INPUT);
    pinMode(motorOut, OUTPUT);

    digitalWrite(motorOut, LOW);

    pinMode(moisturePin1, INPUT);
    pinMode(moisturePin2, INPUT);

    pinMode(buzzerDAQ, INPUT);
    pinMode(buzzerOut, OUTPUT);

    servo1.attach(servoPin1);

    Serial.begin(9600);

    dht.begin();

    servo1.write(LOW_POS);
    currentPos = LOW_POS;
}

// -------------------- LOOP --------------------
void loop()
{
    // -------------------- Buzzer ---------------------------
    if (digitalRead(buzzerDAQ) == HIGH){
        digitalWrite(buzzerOut, HIGH);
    }
    if (digitalRead(buzzerDAQ) == LOW) {
        digitalWrite(buzzerOut, LOW);
    }

    // -------------------- SENSOR READINGS --------------------
    if (millis() - lastReadTime >= readInterval)
    {
        lastReadTime = millis();

        int raw1 = analogRead(moisturePin1);
        int raw2 = analogRead(moisturePin2);

        int percent1 = map(raw1, DRY_VALUE, WET_VALUE, 0, 100);
        int percent2 = map(raw2, DRY_VALUE, WET_VALUE, 0, 100);

        percent1 = constrain(percent1, 0, 100);
        percent2 = constrain(percent2, 0, 100);

        float avgMoisture = (percent1 + percent2) / 2;

        float temp = dht.readTemperature();
        float hum = dht.readHumidity();

        if (isnan(temp) || isnan(hum))
        {
            temp = 0.0;
            hum = 0.0;
        }

        Serial.print(avgMoisture, 1);
        Serial.print(",");
        Serial.print(temp, 1);
        Serial.print(",");
        Serial.println(hum, 1);

    }

    // -------------------- CONTROL LOGIC --------------------
    int state = digitalRead(daqPin);

    // HIGH STATE → MOVE UP → AFTER 1s SET PIN 12 HIGH
    if (state == HIGH && currentPos != HIGH_POS)
    {
        //Serial.println("Moving to HIGH position");

        moveSmooth(currentPos, HIGH_POS);
        currentPos = HIGH_POS;

        delay(1000);
        digitalWrite(motorOut, HIGH);
        //Serial.println("Pin 12 = HIGH");
    }

    // LOW STATE → PIN 12 LOW IMMEDIATELY → WAIT → MOVE DOWN
    else if (state == LOW && currentPos != LOW_POS)
    {
        digitalWrite(motorOut, LOW);
        //Serial.println("Pin 12 = LOW");

        delay(1000);

        //Serial.println("Moving to LOW position");

        moveSmooth(currentPos, LOW_POS);
        currentPos = LOW_POS;

        digitalWrite(motorOut, LOW);
    }

    // Safety: if servo is LOW position, output must stay LOW
    if (currentPos == LOW_POS)
    {
        digitalWrite(motorOut, LOW);
    }

    delay(50);
}

// -------------------- SERVO SMOOTH MOVE --------------------
void moveSmooth(int fromPos, int toPos)
{
    if (fromPos < toPos)
    {
        for (int i = fromPos; i <= toPos; i++)
        {
            servo1.write(i);
            delay(20);
        }
    }
    else
    {
        for (int i = fromPos; i >= toPos; i--)
        {
            servo1.write(i);
            delay(20);
        }
    }
}