---
title: Error handling (ERRC)
---

We use `enum ti_errc_t` to report what went wrong in a driver. `TI_ERRC_NONE` means success; the other values describe a failure. The definitions are in `src/peripheral/errc.h`. The flash-backed logger is in `src/peripheral/errc.c`.

## Checking an error

Many drivers take an error pointer as their last argument. Give the function somewhere to store the result, then check it before using the output or starting another operation:

```c
#include "peripheral/errc.h"
#include "peripheral/i2c.h"
#include "peripheral/systick.h"

void example(void) {
    enum ti_errc_t err = TI_ERRC_NONE;
    systick_init();

    i2c_init(1, &err);
    if (err != TI_ERRC_NONE) {
        return; // Don't attempt a transfer after failed initialization.
    }

    // I2C1 is ready to use.
}
```

Check each call's result before another call overwrites it. An error doesn't necessarily mean nothing happened: a failed transfer may have sent or received some bytes already. The driver page explains what its errors mean and what cleanup it performs.

## Choosing a code

| Code | Use it for |
| --- | --- |
| `TI_ERRC_INVALID_ARG` | An argument the function can't accept. |
| `TI_ERRC_BUSY` | A resource that's already in use. |
| `TI_ERRC_TIMEOUT` | An operation that didn't finish within its time limit. |
| `TI_ERRC_OVERFLOW` | Exceeding a buffer or resource capacity. |
| `TI_ERRC_NOT_FOUND` | A requested resource or context that doesn't exist. |
| `TI_ERRC_DEVICE` | A failure communicating with, or reported by, a particular device. |
| `TI_ERRC_BUS` | A problem with the communication bus. |
| `TI_ERRC_CHECKSUM` | A failed checksum or CRC check. |
| `TI_ERRC_PROTOCOL` | An unexpected message or protocol violation. |
| `TI_ERRC_INTERNAL` | A bug or unexpected internal state despite valid inputs. |
| `TI_ERRC_UNKNOWN` | An unclassified failure, when no more specific code fits. |

## Reporting an error in a driver

Use `TI_SET_ERRC` to set the caller's error code and submit a log entry:

```c
#include "peripheral/errc.h"

void validate_instance(unsigned int inst, enum ti_errc_t *errc) {
    if (errc) *errc = TI_ERRC_NONE;

    if (inst != 1U) {
        TI_SET_ERRC(errc, TI_ERRC_INVALID_ARG, "Expected instance 1");
        return;
    }
}
```

The macro records the code, message, function name, source filename, and line number. It **doesn't return from the function** or clean up hardware; the driver still has to do that. A null error pointer skips the assignment but still calls the logger. Don't assume every driver accepts a null pointer just because the macro does.

## Error logs

Call `ti_log_init()` before expecting persistent logs. Without initialization, the macro still sets the output error code, but the logger drops the entry.

The current logger uses a 128 KiB internal-flash region starting at `0x081E0000`, with 128-byte entries. It truncates long names and messages, drops entries while busy, and erases the log sector when it wraps. Initialization also erases the sector if it finds no empty slot.

Logging is best-effort: the implementation doesn't report flash write or erase failures to the caller. Check the error code from the driver rather than relying on a log entry being present. Avoid logging repeatedly in a polling loop, since each accepted entry writes to flash.
