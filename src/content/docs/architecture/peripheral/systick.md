---
title: SysTick
authors:
  - Ayush Thapa
---

SysTick is a timer built into the CPU core. We use it to count time, wait between operations, and stop drivers from waiting forever when hardware doesn't answer. The code is in `src/peripheral/systick.c` and `src/peripheral/systick.h`.

The timer counts down, then starts again. Each time it finishes a countdown, it requests an *interrupt*: a short pause in normal execution to run a handler. Our handler adds one to a counter called `elapsed_ms`. With the expected clock setup, each countdown takes one millisecond.

For example, with a 64 MHz SysTick clock, 64,000 clock cycles take 1 ms. Set the reload value to 63,999 because the count includes zero:

```text
63999 → 63998 → ... → 1 → 0 → 63999 → ...
                         ↑
                  interrupt requested
```

When the count reaches zero, SysTick requests an interrupt. On the next clock cycle, it reloads 63,999 and starts counting down again. The handler increments `elapsed_ms` once per interrupt, giving us a running millisecond count.

This is an example at 64 MHz. Titan’s current setup assumes a 480 MHz processor clock and uses a reload value of 479,999 for the same 1 ms interval.

## Quick start

```c
#include "peripheral/systick.h"

void example(void) {
    // Initialize once before using delays or driver timeouts.
    systick_init();

    uint32_t start_ms = systick_now_ms();
    systick_delay(10);
    uint32_t elapsed_ms = systick_now_ms() - start_ms;

    // elapsed_ms is the number of ticks counted during the wait.
    (void)elapsed_ms;
}
```

Call `systick_init()` during startup, before code that needs timing. The [I2C driver](/architecture/peripheral/i2c/), for example, uses this counter for its timeouts.

## Usage

```c
void systick_init();
void systick_delay(uint32_t delay);
uint32_t systick_now_ms(void);
```

`systick_init()` configures and enables the timer.

`systick_now_ms()` returns the current count. Read it before an operation, then subtract that starting value from a later reading to find how much time has passed.

`systick_delay()` waits in an empty loop until enough ticks have passed. This is a *busy wait*: the CPU keeps checking the counter instead of returning to the caller. Interrupts can still run. Passing `0` returns immediately.

## Timeouts

A timeout puts a limit on how long we wait for something. Save the count before starting the wait, then use `systick_now_ms() - start_ms` to check how much time has passed. If the hardware still isn't ready after the limit, stop waiting and report an error.

```c
#include <stdbool.h>
#include "peripheral/systick.h"

// Replace this with the hardware status check for your driver.
bool device_ready(void);

bool wait_for_device(void) {
    const uint32_t timeout_ms = 100;
    const uint32_t start_ms = systick_now_ms();

    while (!device_ready()) {
        if (systick_now_ms() - start_ms >= timeout_ms) {
            return false; // Timed out.
        }
    }

    return true; // Ready.
}
```

Call `systick_init()` before using this function. Save `start_ms` once, outside the loop. Updating it inside the loop would restart the timeout on each check.

Unlike `systick_delay()`, this loop returns as soon as the device is ready. It still blocks the caller while waiting. To keep doing other work, save the starting count when you begin an operation and check the same subtraction on each pass through your main loop or state machine.

Use `>=` so the timeout triggers once the elapsed count reaches the limit, even if you miss the exact tick. SysTick interrupts must keep running for this check to work.

## Initialization

`systick_init()` writes three registers:

| Register | What we configure |
| --- | --- |
| `STK_RVR` | The reload value: `0x752FF`, or 479,999. |
| `STK_CVR` | Clear the current countdown value. |
| `STK_CSR` | Enable the timer, select the processor clock, and enable its interrupt. |

The countdown takes 480,000 processor clock cycles. At 480 MHz, that gives one tick per millisecond:

```text
480,000 cycles / 480,000,000 cycles per second = 0.001 seconds
```

The reload value is hard-coded. Although the file also defines `CLOCK_FREQ`, the code doesn't use it to calculate the reload value. Changing that constant alone won't change the timing.

## Tick counting

The Cortex-M7 vector table in `src/internal/vtable.c` connects SysTick to `cm7_systick_exc_handler()`. The handler increments `elapsed_ms`, a `volatile uint32_t`. The `volatile` qualifier tells the compiler to read the counter again when we check it, because an interrupt can change it between reads.

The counter wraps back to zero after about 49.7 days at one tick per millisecond. Use unsigned subtraction for elapsed time, as in the example above, rather than comparing against `start_ms + delay`. Subtraction works across a wrap as long as the measured interval is less than a full counter cycle.

## Limitations and troubleshooting

:::caution[SysTick must keep running]
Don't call `systick_delay()` or use a SysTick-based timeout while blocking the SysTick interrupt. The counter won't advance, so the wait can hang. This also applies inside an interrupt handler that SysTick can't interrupt.
:::

Currently, the timing assumes a 480 MHz processor clock. Check the clock setup before treating a tick as a millisecond; a slower clock makes each tick take longer.

The delay loop currently checks `elapsed <= delay_ms`, so it returns only after the count exceeds the requested delay. For example, `systick_delay(10)` waits for 11 counter increments. The wall-clock delay also depends on where the call falls between ticks and when interrupts run. Don't use it for precise signal timing.

If the count stays at zero, check that you've called `systick_init()`, enabled interrupts, and linked the SysTick handler into the active vector table. If time runs slowly or unevenly, check the processor clock and whether other code blocks interrupts.
