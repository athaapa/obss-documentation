---
title: Write documentation
sidebar:
  order: 7
authors:
  - Ayush Thapa
---

Write documentation so another team member can use, change, or debug the code without asking its original author. Explain design decisions that aren't obvious from the code, especially when someone will need that context after you leave the team.

## Quick start

1. Decide what the reader should understand or be able to do after reading the page.
2. Start with a short explanation and the information they need most. For a driver, this is usually a working example and any required setup.
3. Split the details into sections with clear headings.
4. Check the examples against the code, preview the page, and ask someone else to read it.

## Choose the page’s purpose

Decide what the reader needs before choosing a structure. [Diátaxis](https://diataxis.fr/) describes four types of documentation:

| Type | Purpose | Titan example |
| --- | --- | --- |
| Tutorial | Teach through a guided exercise, with steps and expected results. | A first firmware change, from building to checking it on the board. |
| How-to guide | Help someone complete a specific task. | Find pins in Altium. |
| Reference | Provide exact details someone can look up while working. | I2C parameters, error codes, and limitations. |
| Explanation | Explain how something works or why we chose an approach. | Clocks, registers, or the software layers. |

A tutorial guides a newcomer through learning a skill. A how-to guide assumes some familiarity and focuses on the task. Choose a main purpose for the page, and link to other pages when the reader needs more background or detail.

## Use simple language

Use familiar words and short sentences. Write “use” instead of “utilize” and “before” instead of “prior to.” Give instructions directly: “Call `systick_init()` before using timeouts.”

Use technical terms when they help, but explain them the first time they appear. Assume the reader knows some C but may be new to embedded systems. Link to a Fundamentals page for shared concepts such as [registers](/architecture/peripheral/fundamentals/registers/) instead of repeating the full explanation in each driver page.

Keep the tone conversational. “We” is useful for team decisions, such as why we chose a particular interface. Use “you” or an instruction when explaining what the reader should do.

## Put the useful information first

Think about why someone opened the page. Someone using a driver will usually need its setup and API before its implementation details.

For example, a driver page might use this order:

- A short introduction explaining what the driver does.
- Quick start: required setup and a small example.
- Usage: parameters, units, return values, and errors the caller must handle.
- Implementation: how the driver works and why we made certain choices.
- Troubleshooting, known issues, and references.

Use only the sections the topic needs. An explanation might start with a concept or diagram; a how-to guide might start with prerequisites and steps. Put a requirement next to the step or example it affects. For example, mention that SysTick must be initialized before an example that uses timeouts.

## Make the page easy to scan

Keep each paragraph focused on one idea. Use headings that describe the content, such as “Initialization” or “Error handling.” Use sentence case for headings, and start sections at `##`; Starlight adds the page title for you.

Use numbered steps for tasks where order matters. Use bullets for related items and tables when readers need to compare values. Keep bold text sparse. Put code identifiers and filenames in backticks, such as `i2c_init()` and `i2c.c`.

## Show an example

Use a small example that demonstrates one task. Include the setup it depends on, check errors, and explain the expected result. State which pins, device, or clock settings it assumes. Label pseudocode so readers don't mistake it for code they can compile.

A diagram can help explain how components connect. A screenshot can help someone find a control in Altium. Include a visual when it explains something more clearly than the text, and keep its labels readable.

Analogies can help introduce unfamiliar ideas. Follow the analogy with the actual behavior, and explain any limitation that matters. For example, describing a clock as a steady beat can help, but one beat doesn't necessarily mean one completed instruction.

## Keep it short

Remove repeated explanations and sentences that don't help the reader complete the task or understand the system. Link to related pages for details outside the page's purpose.

Keep the information needed to use the code correctly: units, prerequisites, error handling, and limitations. Explain why we made a choice when that reason isn't clear from the code. A useful paragraph about a constraint can save someone hours of debugging.

## Check before sharing

- Compare function names, parameters, and behavior with the current firmware. Say when an example hasn't been tested on hardware.
- Check links and preview the page with `npm run dev`. Run `npm run build` to catch build errors.
- Ask a teammate to follow the instructions. Add any missing context they needed to ask you for.
- Add your name to `authors` in the frontmatter so readers know who to ask about the page.

The [Google developer documentation style guide](https://developers.google.com/style) is an optional reference for questions this page doesn't cover.
