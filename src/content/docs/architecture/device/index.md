---
title: Device overview
sidebar:
  order: 0
---

The device layer is where we handle the chips connected to the microcontroller, like the barometer, radio, and temperature sensor. The code lives in `src/devices/`.

Each chip has its own commands, registers, and startup sequence. We put those details in a driver so application code can ask for a reading or change a setting without building the bus transfer itself. The driver uses the [peripheral layer](/architecture/peripheral/) to send and receive data.

For example, a barometer driver handles the sensor’s measurement commands and calibration. The SPI driver handles transferring the bytes. Keeping those jobs separate lets us use the same SPI code for different devices.

The sidebar has a page for each device. Those pages are still TODOs; they'll cover setup, the driver’s API, and anything specific to that chip.
