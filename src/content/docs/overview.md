---
title: Titan
authors:
  - Ayush Thapa
---

Titan is the current flight computer for SARP, the rocket team at the University of Washington. We write its onboard software to read sensors, communicate with other systems, and control hardware on the rocket.

## How the software fits together

We organize the code into three main layers:

- **[Application](/architecture/application/):** What the flight computer should do, including the state machine and handling sensor data, packets, and valves.
- **[Device](/architecture/device/):** How to use each chip on the board, like a sensor or radio. This is where we handle its commands and registers.
- **[Peripheral](/architecture/peripheral/):** How to use the microcontroller’s hardware, like SPI, I2C, UART, and GPIO, to talk to those chips.

Start with the [architecture overview](/architecture/) for a closer look at the layers and where their code lives. From there, each layer has pages for its individual parts. Many pages are still TODOs as we fill in the docs.

## Working on the board

The [how-to guides](/how-to/) cover tasks like finding pins in Altium, building and flashing the firmware, testing, and debugging.
