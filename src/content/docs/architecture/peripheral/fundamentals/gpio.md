---
title: GPIO and electrical signals
sidebar:
  order: 2
authors:
  - Ayush Thapa
---

GPIO means *general-purpose input/output*. We use it to configure the microcontroller’s pins and read or change their logic levels.

## Ports and pin names

The STM32 groups GPIO pins into ports named A, B, C, and so on, with pin numbers from 0 through 15. `PB6` means port B, pin 6. That name is different from the physical package pin number that Titan’s GPIO functions take.

See [Find pins in Altium](/how-to/find-pins-altium/) to trace a board signal to its GPIO name and Titan pin number.

## Alternate functions

A pin can often do several jobs. In GPIO mode, software controls it as an input or output. In *alternate function* mode, we connect it to a peripheral, such as UART or SPI.

The alternate function (AF) number selects that connection. Check the datasheet’s alternate-function table for the exact pin and peripheral instance; the same AF number doesn't mean the same function on every pin.

## Open-drain and pull-ups

A *push-pull* output can drive a signal high or low. An *open-drain* output can pull it low, but releases the line instead of driving it high.

A *pull-up resistor* connects the line to its logic supply, so it goes high when nothing pulls it down. This lets multiple open-drain outputs share a line: any one can pull it low without another actively driving it high. I2C uses this arrangement for SCL and SDA.

A *pull-down resistor* does the reverse: it brings an otherwise undriven line low. 

## Noise filters

Electrical noise can cause short pulses that look like real signal changes. Some peripherals provide input filters to reject these glitches.

Filtering also affects timing. A filter must reject unwanted pulses without hiding valid ones, so its settings depend on the peripheral and signal speed. Keep the actual configuration in the driver documentation; see [I2C initialization](/architecture/peripheral/i2c/#what-i2c_init-does) for an example.
