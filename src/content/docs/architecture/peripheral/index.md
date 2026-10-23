---
title: Peripheral overview
sidebar:
  order: 0
authors:
  - Ayush Thapa
---

The peripheral layer is where we control hardware built into the microcontroller. This includes communication interfaces like SPI, I2C, and UART, along with GPIO, timers, and other support hardware. The code lives in `src/peripheral/`.

Here we configure pins and clocks, work with hardware registers, and check when an operation finishes. Device drivers use these functions to talk to external chips. For example, the I2C driver sends bytes to an address; the device driver decides which bytes its chip needs.

If these concepts are new, start with the Fundamentals pages on [registers](/architecture/peripheral/fundamentals/registers/), [GPIO and electrical signals](/architecture/peripheral/fundamentals/gpio/), [clocks](/architecture/peripheral/fundamentals/clocks/), and [interrupts and polling](/architecture/peripheral/fundamentals/interrupts-and-polling/).

For a look at the code, the [I2C page](/architecture/peripheral/i2c/) walks through initialization and transfers. The [SysTick page](/architecture/peripheral/systick/) covers delays and timeouts. The other driver pages are still TODOs.
