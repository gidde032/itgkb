---
id: laptop-overheating-fan-issues
title: 'Laptop: Overheating or fan running constantly'
constellation: hardware-endpoints
tags: [laptop, overheating, fan, performance, thermal]
summary: How to diagnose a laptop that overheats, runs loudly, or has a fan that stays on because of workload, airflow, power settings, firmware, or hardware problems.
stub: false
related: [slow-computer-triage]
---

## Summary

A loud fan is normal during sustained CPU or GPU activity, but overheating at idle, sudden slowdowns, thermal throttling, or unexpected shutdowns indicate a problem worth investigating. Start by checking CPU activity and airflow, then review power settings, BIOS or UEFI fan controls, and available updates. Use **Slow computer triage** for detailed process and background-load triage.

## Diagnostic Steps

1. **Reproduce the problem.** Note whether the laptop overheats while idle, during a specific application, while charging, when connected to a dock, or only under sustained workload. Also note whether performance drops, the fan pulses, or the laptop shuts down.
2. **Check CPU and GPU activity.** Use Activity Monitor on macOS or Task Manager on Windows to determine whether a process is keeping the system busy. For the full CPU, memory, disk, startup, and background-load workflow, see **Slow computer triage** rather than repeating that investigation here.
3. **Check airflow and the environment.** Place the laptop on a hard, flat surface and make sure vents are not blocked by fabric, dust, a case, or nearby objects. Check whether the room is unusually warm and whether the fan exhaust is actually moving air.
4. **Review power and performance settings.** Check the current power mode or manufacturer performance profile. A high-performance profile can increase CPU speed and heat, while a quiet or battery-saving profile may reduce fan noise at the cost of performance.
5. **Check BIOS or UEFI fan settings.** Look for thermal-management, fan-profile, or cooling settings such as quiet, balanced, or performance. Check for fan-detection warnings and do not disable thermal protections.
6. **Check for updates.** Review operating-system, BIOS or UEFI, chipset, graphics, and manufacturer power-management updates. A firmware or driver update may correct fan-control or thermal-management problems.
7. **Test without external equipment.** Disconnect docks, monitors, external drives, and other peripherals temporarily. If the laptop only overheats while docked or charging, test the laptop and dock separately.
8. **Run hardware diagnostics if available.** Use the manufacturer’s built-in diagnostics to check the fan, thermal sensors, battery, and other hardware. A fan that is not spinning, makes grinding noises, or never changes speed may need service.

## Resolution Steps

1. If Activity Monitor or Task Manager identifies a high-load process, use **Slow computer triage** to address it. Return to this article after confirming whether the heat and fan behavior improve.
2. Improve airflow by using a hard surface, clearing the vents, reducing nearby heat, and cleaning dust according to the manufacturer’s instructions. Do not open the device or remove internal components unless authorized.
3. When performance is the priority, set the power mode to **Best performance** or the equivalent manufacturer performance profile. Adjust visual-effects settings for best performance and limit unnecessary background activity, using **Slow computer triage** to identify which processes or startup items should be changed. Monitor temperature and fan behavior; return to a balanced profile if the higher-performance setting causes excessive heat.
4. In BIOS or UEFI, choose a balanced or cooling-oriented fan profile if the current setting is too quiet, or a performance profile if the laptop is overheating because the fan is not responding aggressively enough. Do not disable fan controls or thermal safeguards.
5. Install relevant operating-system, BIOS or UEFI, chipset, graphics, and manufacturer utility updates after confirming that the laptop has stable power.
6. If the fan, thermal sensor, battery, or cooling system appears defective, request hardware service. Include the workload that triggered the issue, activity-monitor results, fan behavior, BIOS or UEFI settings, update history, and diagnostic results.

## Notes / Edge Cases

- High fan activity under sustained work can be normal. Fan noise while the laptop is idle, asleep, or performing only light tasks is more suspicious.
- A short CPU spike after login, an update, or a restart may be normal. Look for activity that remains high after the task should have finished.
- **Best performance** improves responsiveness but may increase power use and heat. It is not itself a cooling solution.
- Stop using the laptop and request service if it shuts down repeatedly, smells burnt, becomes too hot to handle, has a swollen battery, or has a fan that does not spin.
- Do not block vents or use unapproved cleaning methods. Follow the manufacturer’s instructions for dust removal and internal service.
