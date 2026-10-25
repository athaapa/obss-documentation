---
title: Write a peripheral driver
sidebar:
  order: 6
authors:
  - Ayush Thapa
---

A peripheral driver controls hardware built into the microcontroller, like I2C, SPI, UART, or a timer. We use it to configure that hardware and give the rest of the software functions for using it. For example, `i2c_write()` sends bytes to an address. The device driver that calls it decides what those bytes mean to the sensor.

We put peripheral drivers in `src/peripheral/`, with declarations in `<name>.h` and the implementation in `<name>.c`.

## Reference manual
TODO
