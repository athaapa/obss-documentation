---
title: Interrupts and polling
sidebar:
  order: 4
authors:
  - Ayush Thapa
---

Hardware doesn't finish work at the same speed as the CPU. A driver needs a way to find out when a transfer finishes, data arrives, or an error occurs.

## Status flags

A *flag* is a bit in a [status register](/architecture/peripheral/fundamentals/registers/) that reports a hardware condition. A driver might check one flag before writing the next byte and another before ending the transfer.

The reference manual explains what sets each flag and how to clear it. Some flags clear after reading data; others require an explicit write.

## Polling

With *polling*, the driver reads a flag until the condition it needs is true. This is simple, but a tight polling loop keeps the CPU busy and blocks the caller.

Use a timeout to limit how long a loop waits for hardware. Save a starting time, check for errors while waiting, and return a timeout if the operation takes too long. See [SysTick timeouts](/architecture/peripheral/systick/#timeouts) for an example.

The [I2C driver](/architecture/peripheral/i2c/#transfer-sequence) polls status flags while sending and receiving bytes.

## Interrupts

With an *interrupt*, the CPU pauses normal execution to run a handler when an enabled hardware event occurs. The handler can record the event or service the peripheral, then return to the interrupted code.

Keep handlers short, and check which interrupts can run while a handler is active. In particular, a SysTick-based timeout won't advance if the code waiting on it blocks the SysTick interrupt.

Polling and interrupts can work together. Titan polls I2C flags, but uses the SysTick interrupt to advance the counter behind those polling timeouts.
