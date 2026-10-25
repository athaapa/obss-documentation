// Keys match the Fundamentals page paths and section anchors.
export const fundamentalDefinitions: Record<string, string> = {
  'registers/': 'Hardware storage locations used to configure a device, read its status, or transfer data.',
  'registers/#device-registers': 'Registers inside an external chip, accessed using commands over a bus such as I2C or SPI.',
  'registers/#memory-mapped-registers': 'Hardware registers accessed through memory addresses. Reading or writing them interacts with the microcontroller’s hardware.',
  'gpio/': 'General-purpose input/output: the hardware used to configure pins and read or change their logic levels.',
  'gpio/#ports-and-pin-names': 'GPIO pins are grouped into ports. PB6 means port B, pin 6, not physical package pin 6.',
  'gpio/#alternate-functions': 'A pin mode that connects a pin to a peripheral. The AF number selects which peripheral signal uses the pin.',
  'gpio/#open-drain-and-pull-ups': 'An open-drain output pulls a line low or releases it. A pull-up resistor brings the released line high.',
  'gpio/#noise-filters': 'Input filters reject short electrical glitches so the peripheral does not mistake them for valid signals.',
  'clocks/': 'Repeating timing signals that drive the CPU and peripherals. Different hardware blocks can use different sources and dividers.',
  'clocks/#peripheral-clock-enables': 'Enable a hardware block’s clock before configuring it. A GPIO clock serves the whole port.',
  'clocks/#clock-sources-and-dividers': 'A clock source supplies a timing signal; dividers reduce its frequency for a particular use.',
  'clocks/#peripheral-clocks-and-bus-clocks': 'Internal bus clocks let the CPU access hardware. A peripheral’s kernel clock times its work; an external signal such as I2C SCL has its own rate.',
  'interrupts-and-polling/': 'Two ways to respond to hardware: repeatedly check its status, or run a handler when an interrupt occurs.',
  'interrupts-and-polling/#status-flags': 'Bits in a status register that report hardware conditions, such as data ready or an error.',
  'interrupts-and-polling/#polling': 'Repeatedly checking a hardware status flag until a condition is met. A blocking wait should also check for errors and a timeout.',
  'interrupts-and-polling/#interrupts': 'An event that pauses normal execution so the CPU can run a handler, then return to the interrupted code.',
};
