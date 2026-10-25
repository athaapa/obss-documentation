---
title: GPIO
authors:
  - Ayush Thapa
---

GPIO means *general-purpose input/output*. We use these pins to read a high or low voltage, or to drive a signal high or low. An input could tell us whether a device is ready. An output could control a chip's enable signal. We can also hand a pin over to a peripheral, like I2C or SPI, using [alternate function mode](/architecture/peripheral/fundamentals/gpio/#alternate-functions).

The code is in `src/peripheral/gpio.c` and `src/peripheral/gpio.h`. The functions use the `tal_` prefix. They take a package pin number: PB0 is `49` in Titan's mapping, and PB6 is `133`. The number after the port letter isn't the number you pass to the driver.

## Quick start

```c
#include <stdbool.h>
#include "peripheral/gpio.h"

bool output_init(void) {
    const int pin = 49; // PB0 in Titan's mapping.

    if (!tal_enable_clock(pin)) {
        return false;
    }

    tal_set_pin(pin, 0);   // Preload the output latch low.
    tal_set_drain(pin, 0); // Push-pull.
    tal_set_speed(pin, 0); // Low output speed.
    tal_pull_pin(pin, 0);  // No internal pull.
    tal_set_mode(pin, 1);  // Enable general-purpose output mode.
    return true;
}
```

After configuration, `tal_set_pin(49, 1)` drives the output high and `tal_set_pin(49, 0)` drives it low. High doesn't necessarily mean a connected device is “on”; that depends on the circuit’s polarity.

Set the intended initial output value before switching into output mode. Choose the mode, drain, speed, and pull settings for the circuit you are controlling.

## Usage

### Pin selection

These functions take a **package pin number**, not a GPIO index. For example, PB6 is pin `133` in Titan’s lookup table. Passing `6` does not select PB6.

Use the table in `gpio.h` and the [Altium pin guide](/how-to/find-pins-altium/) to find the number. Check the board revision and what connects to the pin before configuring it. The examples below use known entries in Titan’s mapping; they don't assign those pins to a new board function.

### Pin settings

| Function | Values and result |
| --- | --- |
| `tal_set_mode(pin, mode)` | `0`: input, `1`: output, `2`: alternate function, `3`: analog. |
| `tal_set_drain(pin, drain)` | `0`: push-pull, `1`: open-drain. |
| `tal_set_speed(pin, speed)` | `0`: low, `1`: medium, `2`: fast, `3`: high, as named in `gpio.h`. |
| `tal_pull_pin(pin, pull)` | `-1`: pull-down, `0`: no pull, `1`: pull-up. |
| `tal_set_pin(pin, value)` | `0`: low, `1`: high output latch value. |
| `tal_alternate_mode(pin, value)` | AF number from `0` through `15`. |
| `tal_read_pin(pin)` | `true` if the input level is high; `false` if low. |
| `tal_enable_clock(pin)` | Enable the pin’s port clock; returns a boolean. |
| `tal_disable_clock(pin)` | Disable the pin’s port clock; returns a boolean. |

The speed setting controls output edge behavior, not how often the pin toggles. It doesn't set a UART baud rate, SPI clock, or PWM frequency.

### Input reads

```c
#include <stdbool.h>
#include "peripheral/gpio.h"

bool input_init(void) {
    const int pin = 9; // PC13 in Titan's mapping.
    if (!tal_enable_clock(pin)) {
        return false;
    }

    tal_pull_pin(pin, 0); // This example assumes the board sets the idle level.
    tal_set_mode(pin, 0);
    return true;
}

bool input_is_high(void) {
    return tal_read_pin(9);
}
```

`tal_read_pin()` reads the input data register and returns `true` for a high level. It doesn't debounce a button or interpret whether that level means pressed, ready, or active. If the circuit needs an internal pull, select it with `tal_pull_pin()`.

### Alternate functions

For a peripheral signal, configure both the GPIO mode and its AF selection. This is the GPIO portion of an I2C1 SCL setup on PB6:

```c
#include <stdbool.h>
#include "peripheral/gpio.h"

bool scl_pin_init(void) {
    const int scl = 133; // PB6.
    if (!tal_enable_clock(scl)) {
        return false;
    }

    tal_alternate_mode(scl, 4); // AF4: I2C1 SCL on PB6.
    tal_set_drain(scl, 1);      // Open-drain.
    tal_pull_pin(scl, 0);       // Use the bus's external pull-up.
    tal_set_mode(scl, 2);       // Alternate function mode.
    return true;
}
```

This only configures the pin. It doesn't initialize I2C1 or configure SDA. Use [the I2C driver](/architecture/peripheral/i2c/) for a complete transfer setup. In alternate function mode, the selected peripheral controls the signal.

## Implementation

The driver looks up the package pin number in a table in `gpio.c`. Each entry contains a port and an index within that port. For example, pin `133` maps to port B, index 6. The driver uses those two values to select the [register and field](/architecture/peripheral/fundamentals/registers/) to change.

`tal_set_mode()` writes the pin's mode field in `MODER`. The drain, speed, and pull functions configure `OTYPER`, `OSPEEDR`, and `PUPDR`. For an alternate function, `tal_alternate_mode()` writes `AFRL` for pin indices 0–7 or `AFRH` for indices 8–15.

`tal_set_pin()` writes the output value to `ODR`. `tal_read_pin()` reads the level from `IDR`. The output value is what we ask the pin to drive; the input value is what the hardware reads at the pin.

### Port clocks

Enable the port clock before configuring or accessing its pins. Clock control applies to the **whole port**, not just the pin passed to the function. Disabling the clock for PB6 also affects other GPIO pins on port B. The driver doesn't track how many callers use that port, so don't disable a shared clock while another driver needs it.

## Troubleshooting

If an output doesn't change, check the package pin number, port clock, and mode first. A pin in input mode won't drive the value you wrote to the output register. In alternate function mode, the peripheral controls the signal, so check its setup too.

If an input changes when nothing is driving it, check how the circuit sets its idle level. You may need an [internal pull resistor](/architecture/peripheral/fundamentals/gpio/#open-drain-and-pull-ups) or one on the board. Use the schematic to choose the right setting.

A high level doesn't always mean a device is active. Some signals are active-low, so check the device's datasheet before interpreting the result.

## Known issues

The implementation indexes a 140-entry pin table without checking the bounds first. Negative pin numbers and values of `140` or more can access memory outside the table. An in-range number can also map to an unsupported pin.

Most functions return early for an unsupported entry, and `tal_read_pin()` returns `false`, which looks the same as a low input. The clock functions don't perform that unsupported-entry check: an entry of `-1` divides to zero and can select port A. A successful clock call therefore doesn't prove the pin is valid. Use a verified mapping rather than treating the return value as validation.

The configuration functions return no error code. Some invalid setting values are ignored; others are masked into a field. Use the values listed above.

`tal_set_pin()` changes the output register through a read-modify-write operation. It doesn't use the atomic bit set/reset register. If another writer changes the same port’s outputs at the same time, one update can overwrite the other. See [MMIO shared access](/internals/mmio/#array-indices-and-shared-access).
