---
id: laptop-charging-issues
title: 'Laptop: Not charging or defective charger'
constellation: hardware-endpoints
tags: [laptop, charging, battery, charger, power]
summary: How to determine whether a laptop charging problem is caused by the charger, cable, port, battery, power source, or system firmware.
stub: false
related: [display-docking-issues]
---

## Summary

A laptop that will not charge may have a defective charger or cable, a damaged charging port, an incompatible or underpowered adapter, a worn battery, or a software or firmware problem. Start by testing compatible chargers and ports, then check the charging indicator, BIOS or UEFI, and battery status before requesting hardware service. If the symptom appears only with a dock or external display, use **External display and docking issues** for that separate USB-C and power-delivery path.

## Diagnostic Steps

1. **Try another compatible charger first.** Use a known-good charger with the correct connector and sufficient wattage. If possible, test the suspect charger with another compatible laptop and test the known-good charger with the affected laptop. For USB-C chargers, remember that the connector alone does not guarantee adequate charging power.
2. **Try another power source and charging port.** Test a different wall outlet and every supported charging port on the laptop. If one port works while another does not, the problem may be limited to the port. If no port works with a known-good charger, suspect the charger, battery, or system hardware.
3. **Inspect the charger and port.** Look for frayed cables, bent connectors, looseness, debris, discoloration, unusual heat, or a burning smell. Do not insert metal tools into the port or continue using visibly damaged equipment.
4. **Check the charging light.** Record whether the light is off, solid, or blinking, and note its color and blink pattern. Charging-light codes vary by manufacturer, so compare the behavior with the laptop’s documentation.
5. **Check BIOS or UEFI.** With the charger connected, open the firmware setup or built-in hardware diagnostics and look for the detected AC adapter, adapter wattage, battery health, and charging status. If the firmware does not recognize the adapter, the problem is more likely hardware-related than an operating-system setting.
6. **Perform a hard reset.** Shut down the laptop, unplug the charger, disconnect peripherals, and hold the power button for approximately 15–30 seconds. Reconnect the charger and start the laptop again. If the manufacturer documents an emergency-reset button or pinhole, use it only according to the model’s instructions.

## Resolution Steps

1. Replace a defective charger or cable with a manufacturer-approved or properly rated compatible model. Match the connector, voltage, wattage, and charging standard—not just the plug shape.
2. If another supported port works, use it temporarily and request service for the failed port. Do not repeatedly bend or wiggle the connector to maintain charging.
3. If the charger and ports are recognized but the battery will not charge, run the manufacturer’s battery and power diagnostics. Follow the device’s battery-replacement or repair process if the battery health is poor.
4. After stable power has been restored, install relevant operating-system, power-management, firmware, or BIOS updates if the manufacturer identifies them as charging-related. Do not begin a firmware update while the laptop has an unreliable power connection.
5. If the issue remains, provide support with the charger model and wattage, tested ports, charging-light behavior, BIOS or UEFI detection, battery status, and hard-reset result.

## Notes / Edge Cases

- Some laptops intentionally stop charging near full capacity because of battery-protection or optimized-charging settings.
- A USB-C port may support data, display, or charging differently from another USB-C port. A USB-C cable may also be charge-only or unable to carry the required power.
- A charger that fits physically may still be incompatible or underpowered.
- Stop using the laptop and charger if the battery is swollen, unusually hot, leaking, smoking, or producing a burning smell. Disconnect power when it is safe to do so and request hardware service.
- If the laptop was exposed to liquid, shut it down, disconnect power, and do not continue charging tests.
- A laptop that charges normally with a direct charger but not through a dock should be diagnosed as a possible dock or power-delivery issue; see **External display and docking issues**.
