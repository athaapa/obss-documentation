---
title: MMIO
authors:
  - Ayush Thapa
---

MMIO means *memory-mapped input/output*. We control the microcontroller's hardware by reading and writing values at specific memory addresses. Each address refers to a [register](/architecture/peripheral/fundamentals/registers/#memory-mapped-registers), and each register has bits that control a setting or report what the hardware is doing. For example, setting one bit can turn on the clock for a GPIO port.

We use named register pointers and helper macros so we don't have to repeat addresses and bit shifts in each driver. The declarations and macros are in `src/internal/mmio.h`. The register addresses and field definitions are in `src/internal/mmio.c`.

## Quick start

```c
#include "internal/mmio.h"

void example(void) {
    // Enable the GPIO port B clock before accessing its registers.
    SET_FIELD(RCC_AHB4ENR, RCC_AHB4ENR_GPIOBEN);

    // Set PB6 to alternate function mode: port B = 1, pin index = 6.
    WRITE_FIELD(GPIOx_MODER[1], GPIOx_MODER_MODEx[6], 2U);

    // Read the mode back. It should be 2.
    uint32_t mode = READ_FIELD(GPIOx_MODER[1], GPIOx_MODER_MODEx[6]);
    (void)mode;
}
```

This example changes PB6's mode field, which occupies bits 13:12 of port B's `MODER` register. Pass `2U`; `WRITE_FIELD` puts it in the right position. This only selects alternate function mode; configuring a peripheral signal also needs an AF selection and the right electrical settings. Use the [GPIO driver](/architecture/peripheral/gpio/) for that setup.

## Usage

A register name such as `RCC_AHB4ENR` is already a pointer. Pass it directly to the helpers. A field name such as `RCC_AHB4ENR_GPIOBEN` describes which bits to access in that register.

The types tell you the register’s width and whether the pointer allows writes. For example, `rw_reg32_t` is a pointer to a volatile 32-bit value, while `ro_reg32_t` points to a const volatile value. `volatile` keeps the compiler from treating hardware accesses like ordinary cached values. It doesn't make an operation atomic or provide a lock.

A `field32_t` has two members:

- `msk`: a mask with ones at the field’s bit positions.
- `pos`: the position of the field’s lowest bit.

| Helper | What it does |
| --- | --- |
| `READ_FIELD(reg, field)` | Read the field and shift it down to bit zero. |
| `WRITE_FIELD(reg, field, value)` | Read the register, replace the field, and write the result back. |
| `SET_FIELD(reg, field)` | Set every bit in the field to one. |
| `CLR_FIELD(reg, field)` | Set every bit in the field to zero. |
| `TOGL_FIELD(reg, field)` | Flip every bit in the field. |
| `IS_FIELD_SET(reg, field)` | Check whether **all** bits in the field are one. |
| `IS_FIELD_CLR(reg, field)` | Check whether all bits in the field are zero. |

`SET_FIELD` on a multi-bit field selects its all-ones value. To select a particular mode or divider, use `WRITE_FIELD`.

### Field validation and construction

`WRITE_FIELD` masks the value; it doesn't report an out-of-range argument. Check with `IN_RANGE_FIELD` when a value comes from a caller.

This example uses a local variable, so it doesn't access hardware:

```c
#include "internal/mmio.h"

void field_example(void) {
    volatile uint32_t value = 0;
    field32_t mode = { .msk = 0x30U, .pos = 4 }; // Bits 5:4.

    if (IN_RANGE_FIELD(mode, 2U)) {
        WRITE_FIELD(&value, mode, 2U);
    }

    // value is 0x20; reading the field gives 2.
    uint32_t selected = READ_FIELD(&value, mode);
    (void)selected;
}
```

`TO_FIELD(value, field)` shifts and masks a value without reading or writing a register. It can help assemble a complete register value when the reference manual calls for a single write.

## Read-modify-write operations

First, `WRITE_FIELD` reads the register's current value. It clears the bits covered by the field's mask, shifts the value you supplied into place, and combines it with the bits outside the field. Then it writes the result back to the register. We call this a *read-modify-write* operation.

For PB6's mode, the mask is `0x3000` and the position is `12`. Writing `2U` places `0x2000` in those bits. The macro preserves the other bits from the value it read.

`READ_FIELD` works in the other direction: it reads the register, masks off the other bits, and shifts the field down to bit zero. Reading that mode gives `2`, rather than `0x2000`.

## Write-only registers and flag clearing

The ordinary write, set, clear, and toggle helpers all **read the register before writing it**. That isn't appropriate for every hardware register.

| Helper | What it writes without reading first |
| --- | --- |
| `WRITE_WO_FIELD(reg, field, value)` | The shifted, masked value; zeros outside that field. |
| `SET_WO_FIELD(reg, field)` | The field mask; zeros outside that field. |

Some flags clear when we write **one** to a clear bit. For example, to acknowledge I2C1’s STOP flag:

```c
SET_WO_FIELD(I2Cx_ICR[1], I2Cx_ICR_STOPCF);
```

Don't use `CLR_FIELD` just because you want to “clear” a flag. Follow the register’s documented access rules. The `_WO_` helpers overwrite the whole register value, so they also aren't substitutes for preserving unrelated configuration fields.

## Troubleshooting

If a setting reads back as zero, check that you enabled the peripheral's clock and used the right register and field. If you passed a value that was already shifted, `WRITE_FIELD` shifts it again and may mask it away. Pass the value as it appears in the reference manual's field table.

The helpers don't return an error code. Check caller-supplied values with `IN_RANGE_FIELD`, and follow the reference manual's rules about when you can change a setting. Some peripherals require you to disable them before changing their configuration.

### Array indices and shared access

Check each array’s definition in `mmio.c` before indexing it. The conventions differ: `I2Cx_CR1[1]` means I2C1, while `GPIOx_MODER[0]` means port A and `[1]` means port B. An array slot can be unpopulated even when the index is within its declared size.

A read-modify-write operation can overwrite another writer’s change between its read and write. Coordinate access if interrupts or another core can modify the same register. These macros don't handle that coordination, enable peripheral clocks, or check whether hardware allows a setting to change while enabled.
