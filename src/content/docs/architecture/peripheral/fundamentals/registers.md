---
title: Registers
sidebar:
  order: 1
authors:
  - Ayush Thapa
---

We use registers to configure hardware and read its status. A register holds bits, but the hardware gives those bits a specific meaning: enable a peripheral, choose a mode, report an error, or hold a byte of data.

## Memory-mapped registers

Inside the microcontroller, we access peripheral registers through memory addresses. Reading or writing one looks like a memory access in C, but it interacts with hardware. Titan’s register addresses and field definitions live in `src/internal/mmio.h` and `src/internal/mmio.c`.

A *field* is one bit or a group of bits within a register. For example, an enable field may need one bit, while a clock divider needs several. Titan uses helpers such as `READ_FIELD`, `WRITE_FIELD`, `SET_FIELD`, and `CLR_FIELD` to work with them.

Check the reference manual before changing a register. Some fields are read-only. Some status flags need a particular sequence to clear them, or a write to a separate register. Writing zero isn't a universal way to clear a flag.

## Device registers

External chips have registers too, but we usually access them through a bus such as SPI or I2C. A device driver sends the command or register address specified by that chip’s datasheet, then transfers the data.

The device decides the register width, byte order, and read/write sequence. A register address inside a sensor isn't a memory address the CPU can access directly. See the [I2C example](/architecture/peripheral/i2c/#quick-start) for a write to an INA233 register.
