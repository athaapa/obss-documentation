---
title: I2C
authors:
  - Ayush Thapa
---

The I2C driver lets the flight computer talk to small chips, like sensors, over two shared wires. SCL carries the clock and SDA carries the data. Our microcontroller is the *controller*: it runs the clock and starts every conversation. The chips it talks to are *targets*. Older docs call these "master" and "slave." Each target on the bus has its own 7-bit *address*, like `0x40`, so the controller can pick which one it's talking to.

Every conversation follows the same pattern. The controller sends a *START* signal to claim the bus. Then it sends the target's address, plus one extra bit that says whether it wants to read or write. The target answers with an *ACK* ("I'm here, go ahead") or a *NACK* ("no"). If nobody has that address, the controller also sees a NACK. Next, data goes back and forth one byte at a time, and whoever receives each byte answers with an ACK. Finally, the controller sends a *STOP* to end the conversation and free the bus.

The code is in `src/peripheral/i2c.c` and `src/peripheral/i2c.h`. The chip has four copies of the I2C hardware, called *instances* (I2C1 through I2C4), and each one has its own pair of wires. This driver only supports I2C1. Our only I2C device right now is the INA233 current sensor, so one instance is enough, and it keeps the code simple.

## Quick start

```c
#include "peripheral/i2c.h"
#include "peripheral/systick.h"

void example(void) {
    enum ti_errc_t err;

    // The driver uses SysTick for timeouts, so start it first.
    systick_init();

    i2c_init(1, &err);
    if (err != TI_ERRC_NONE) {
        return;
    }

    // Write 3 bytes to the device at address 0x40.
    uint8_t out[] = {0xD0, 0x27, 0x41};
    i2c_write(1, 0x40, out, sizeof(out), &err);
    if (err != TI_ERRC_NONE) {
        return;
    }

    // Read 2 bytes back from the same device.
    uint8_t in[2];
    i2c_read(1, 0x40, in, sizeof(in), &err);
    if (err != TI_ERRC_NONE) {
        return;
    }
}
```

This example writes `0x4127` to the INA233's `MFR_ADC_CONFIG` [register](/architecture/peripheral/fundamentals/registers/#device-registers), which is number `0xD0`. The INA233 expects the low byte first, so the bytes go out as `0xD0`, `0x27`, and then `0x41`. Address `0x40` assumes both of its address pins connect to ground.

## Using the driver

```c
void i2c_init(uint8_t inst, enum ti_errc_t *errc);
void i2c_write(uint8_t inst, uint32_t addr, void *buf, uint8_t size, enum ti_errc_t *errc);
void i2c_read(uint8_t inst, uint32_t addr, void *buf, uint8_t size, enum ti_errc_t *errc);
```

Call `i2c_init()` once at startup, after `systick_init()`. The driver uses [SysTick for timeouts](/architecture/peripheral/systick/#using-it-for-timeouts).

Pass `1` for `inst` and the target's 7-bit address for `addr`.

For a write, `buf` holds the bytes to send. For a read, the driver fills it with the bytes it receives. It needs room for at least `size` bytes, and `size` can be 1 to 255. Check `errc` after every call. `TI_ERRC_NONE` means the transfer was successful.

### Reading a register

To read a register, you first write the register number, then read its value. With this driver, that takes two calls: `i2c_write()` with the register number, then `i2c_read()`.

The hardware sends a STOP at the end of every call, so each call is self-contained.

## What `i2c_init()` does

After checking that `inst` is `1`, the driver enables the [clock for GPIO port B](/architecture/peripheral/fundamentals/clocks/#enabling-a-peripheral-clock).

It configures PB6 (SCL) and PB7 (SDA) in [alternate function mode](/architecture/peripheral/fundamentals/gpio/#alternate-functions), selecting AF4 for I2C1. Both pins use [open-drain outputs with pull-up resistors](/architecture/peripheral/fundamentals/gpio/#open-drain-and-pull-ups) on the bus lines.

The driver enables HSI and selects it as I2C1’s [clock source](/architecture/peripheral/fundamentals/clocks/#clock-sources-and-dividers), then enables I2C1’s peripheral clock. Its timing values assume a 64 MHz HSI source.

With I2C1 disabled, the driver configures its [registers](/architecture/peripheral/fundamentals/registers/#memory-mapped-registers): it enables the analog [noise filter](/architecture/peripheral/fundamentals/gpio/#noise-filters) by clearing `ANFOFF`, disables digital filtering by setting `DNF` to zero, and writes the bus timing values below. Then it enables I2C1. Chapter 50 of the [STM32 reference manual](https://www.st.com/resource/en/reference_manual/dm00176879-stm32h745-755-and-stm32h747-757-advanced-arm-based-32-bit-mcus-stmicroelectronics.pdf) documents the registers.

### Where the pin settings come from

In `i2c.c`, the pins show up as `INST1_SCL_PIN` (133) and `INST1_SDA_PIN` (134), not as PB6 and PB7. Those numbers and the AF4 setting come from three places: the board schematic, the datasheet, and `gpio.h`. Adding an I2C instance or moving to different pins means going through the same steps. A new instance also needs its own clock settings.

See [Find pins in Altium](/how-to/find-pins-altium/) for more information.

### Bus speed

The `TIMINGR` register divides the 64 MHz HSI clock to set how fast SCL ticks. We use 100 kHz because it's the standard I2C speed and every I2C device supports it.

| Field | Value | What it does |
| --- | ---: | --- |
| `PRESC` | 15 | Divides 64 MHz by 16, so each timing step is 0.25 µs |
| `SCLL` | 19 | Holds SCL low for 20 steps (5 µs) |
| `SCLH` | 19 | Holds SCL high for 20 steps (5 µs) |
| `SCLDEL` | 4 | Waits after changing SDA before raising SCL |
| `SDADEL` | 2 | Waits after SCL falls before changing SDA |

5 µs low plus 5 µs high is a 10 µs period, or 100 kHz. The real speed is a little slower because the noise filter adds delay and the wires take time to rise.

The two delays exist because devices read SDA while SCL is high. SDA has to settle before SCL rises, and it can't change again until SCL falls. Changing the clock source means recalculating all of these values. Chapter 50 of the reference manual has example tables, and STM32CubeMX can calculate them.

## What happens during a transfer

The I2C hardware drives the wires and follows the conversation pattern from the top of this page. The driver tells it what to do, then gives it bytes or collects them.

First, the driver waits for the bus to be free, in case another transfer is still running or a wire is stuck low. Then it gives the hardware the address, direction, and byte count, and starts the transfer. The hardware sends START and the address, then waits for the target's ACK or NACK.

The driver [polls status flags](/architecture/peripheral/fundamentals/interrupts-and-polling/#polling) before transferring each byte. For a write, it waits for `TXIS` ("ready for the next byte") and then hands over a byte. For a read, it waits for `RXNE` ("a byte arrived") and copies it out. After the last byte, the hardware sends STOP. The driver waits for `STOPF` ("STOP sent") and clears it so the next transfer starts clean.

The driver checks for errors at every wait. Reaching STOP doesn't mean the transfer worked, because the target may have sent a NACK along the way. Every wait also has a timeout. If a target stops answering, the driver gives up after about 100 ms and returns an error.

## When things go wrong

| Error | What it means |
| --- | --- |
| `TI_ERRC_INVALID_ARG` | The driver can't use an argument: the wrong `inst`, a `size` of 0, a `NULL` buffer, or an address over `0x7F`. Nothing was sent. |
| `TI_ERRC_DEVICE` | The target sent a NACK. Usually nothing answered at that address. |
| `TI_ERRC_BUS` | The hardware lost control of the bus mid-transfer, called "arbitration lost." I2C allows more than one controller on a bus. Ours only has one, so this usually points to noise or a wiring problem. |
| `TI_ERRC_TIMEOUT` | A wait took too long. The bus never went idle, a byte never arrived, or the clock never started. |

After a NACK or timeout, the driver cleans up and resets the I2C hardware if needed, so the next call starts fresh. A failed read may leave the buffer partly filled. A failed write may have already changed some of the target's data.

A `TI_ERRC_DEVICE` on the first write usually means the address is wrong, the sensor has no power, or SCL and SDA are swapped. A timeout while waiting for the bus usually means the pull-up resistors are missing or a wire is shorted to ground. A target can also get stuck holding SDA low. Resetting our side won't free it, so power-cycle the target. If the data looks scrambled, check the byte order in the device's datasheet. Many devices send the low byte first.

:::caution[SysTick must keep running]
Call `systick_init()` before `i2c_init()`. Don't call I2C functions from code that blocks the SysTick interrupt. If SysTick can't run, the timeouts never fire and a call can hang forever.
:::

## Known issues

The driver has no lock, so only one part of the code should use I2C1 at a time.

The STM32H745 has two known I2C bugs, in sections 2.19.2 and 2.19.6 of the errata sheet. The driver works around the first by ignoring false bus errors. It doesn't handle the second, a rare stall on the first byte with certain clock settings.

## References

- [STM32H745 datasheet (DS12923)](https://www.st.com/resource/en/datasheet/stm32h745zi.pdf): pin numbers in Table 8 and alternate functions in Table 9.
- [STM32 reference manual (RM0399)](https://www.st.com/resource/en/reference_manual/dm00176879-stm32h745-755-and-stm32h747-757-advanced-arm-based-32-bit-mcus-stmicroelectronics.pdf): I2C in chapter 50. The flowcharts for controller transmit and receive are the most useful pages.
- [STM32H745 errata (ES0445)](https://www.st.com/resource/en/errata_sheet/dm00530531.pdf): known chip bugs, including sections 2.19.2 and 2.19.6.
- [Cortex-M7 programming manual (PM0253)](https://www.st.com/resource/en/programming_manual/DM00237416.pdf): SysTick in section 4.4.
- [INA233 datasheet](https://www.ti.com/lit/ds/symlink/ina233.pdf): the current sensor.
