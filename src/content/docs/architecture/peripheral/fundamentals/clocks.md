---
title: Clocks
sidebar:
  order: 3
---

A clock is a signal that repeats at a steady rate. We call each repetition a *cycle*, or tick. Hardware uses these ticks to time its work. A timer counts them to measure a delay, and a communication peripheral uses them to decide when to send the next bit.

## Frequency

A clock's *frequency* is how many times it ticks per second. We measure it in hertz (Hz). A 1 Hz clock ticks once per second. A 1 MHz clock ticks one million times per second.

For example, a 64 MHz clock ticks 64 million times per second. There are 1,000 milliseconds in a second, so it takes 64,000 ticks to measure one millisecond. Counting 640,000 ticks would give us ten milliseconds.

One tick is a full cycle, including the signal going high and low. An operation can take several cycles, so a 64 MHz clock doesn't mean we send 64 million bits or finish 64 million instructions each second.

## Clock sources and dividers

A *clock source* supplies the repeating signal. An *oscillator* is the circuit that produces it. The microcontroller has internal oscillators and can also use a clock from outside the chip.

| Name | What it means |
| --- | --- |
| HSI | An internal source. The STM32H745's HSI oscillator runs at about 64 MHz. |
| HSE | An external source. Its frequency depends on the hardware connected to the chip. |
| PLL | A circuit that uses an existing source to produce other frequencies, with multiplication and division settings. |

A *divider* slows a clock down. Dividing 64 MHz by 16 gives 4 MHz: one output tick for every 16 input ticks. At 4 MHz, each tick takes 0.25 microseconds. A microsecond is one thousandth of a millisecond.

A clock selector chooses which source to use. Before selecting a source, we turn it on and wait for the hardware to report that it is ready. Selecting HSI and turning HSI on are separate settings.

## The clock tree

The CPU and peripherals can use different sources and dividers. The reference manual calls these connected clock paths the *clock tree*.

## Enabling a peripheral clock

The chip can stop supplying clocks to hardware we aren't using to save power. A *clock enable* lets the clock reach that hardware. We set these enables through RCC, short for *reset and clock control*. Its [registers](/architecture/peripheral/fundamentals/registers/#memory-mapped-registers) control the clock sources and their connections.

Clock enable and peripheral enable are separate settings. We can supply a peripheral's clock while keeping the peripheral disabled to configure it. Once the settings are ready, we enable the peripheral. Starting a transfer takes another step.

A GPIO clock serves the whole port. Turning off port B's clock can affect other pins on that port, even if we only meant to stop using PB6.

## Peripheral clocks and bus clocks

Inside the microcontroller, buses such as AHB and APB connect the CPU to hardware registers. They need clocks for those connections to work. A peripheral can also have a separate *kernel clock*, which it uses to time its main operation. Check the reference manual for both the register-access clock and the kernel clock.

An external bus clock is different again. I2C's SCL wire carries a signal that tells connected devices when to read data. The I2C hardware generates SCL by counting ticks from its kernel clock, so SCL can run much slower than that clock.

For example, Titan's I2C driver uses these settings:

| Stage | Result |
| --- | --- |
| Select HSI | 64 MHz input clock |
| Divide by 16 | 4 MHz timing clock, or 0.25 microseconds per tick |
| Count 20 ticks with SCL low | 5 microseconds low |
| Count 20 ticks with SCL high | 5 microseconds high |

Five microseconds low plus five high gives a ten-microsecond cycle. That is 100,000 cycles per second, or 100 kHz. The real rate is a little slower because the signal and filters add delays.

Some timing fields store one less than the count. Here, `PRESC = 15` means divide by 16, and `SCLL = 19` means count 20 ticks. Check the field's formula before choosing its value.

## When things go wrong

If a peripheral doesn't respond, check that its source is ready and its required clocks are enabled. If it runs at the wrong speed, check the selected source, dividers, and timing fields.

Changing a clock means checking any calculations that depend on it. A timer counting 64,000 ticks waits one millisecond at 64 MHz, but two milliseconds at 32 MHz. Keep the assumed frequency next to the timing settings in the driver so the next person knows what to recalculate.

## References

- [STM32H745 reference manual](https://www.st.com/resource/en/reference_manual/rm0399-stm32h745755-and-stm32h747757-advanced-armbased-32bit-mcus-stmicroelectronics.pdf): the RCC chapter and clock-tree diagrams show the available paths. Each peripheral's chapter explains its timing settings.
- [I2C bus speed](/architecture/peripheral/i2c/#bus-speed): the timing values used in Titan and how we calculate them.
- [SysTick](/architecture/peripheral/systick/): counting processor-clock cycles to track milliseconds.
