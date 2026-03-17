# luci-app-opentether

LuCI web interface for [OpenTether](https://github.com/HelaFaye/opentether) — monitor tunnel status, manage multiple Android devices, and configure all hev-socks5-tunnel settings from your browser.

Provides a **Services → OpenTether** page in LuCI with two tabs:

## Status tab

The status tab gives a live overview of all registered devices and their tunnel state.

- Per-device status rows showing ADB connection, port forward, tunnel process, and interface state at a glance
- Selecting a device row expands a detail panel showing current IPv4/IPv6 routes and interface address
- Connectivity test runs a curl through the tunnel and reports the public IP for both IPv4 and IPv6
- Start / Stop / Restart controls operate on the selected device only, leaving other active tunnels untouched
- Reverse-chronological log showing recent opentether events for all devices
- Auto-refreshes every 5 seconds; immediately refreshes when the tab becomes visible

## Configuration tab

The configuration tab provides a full per-device configuration interface.

- Each registered device has its own collapsible form section with all settings
- Two-column layout: the form is on the left, a live YAML preview is on the right that updates in real-time as you change values
- Changed lines are highlighted yellow in the YAML preview so you can see exactly what will be written to disk
- Unsaved changes are indicated by a yellow dot on the device label and on the tab
- Collapsible sections — Tunnel Interface, SOCKS5 Proxy, Mapped DNS, Performance & Misc — so you only expand what you need
- **Save & Apply** writes values to UCI, commits, regenerates the YAML config, and restarts the tunnel instance for that device only
- **Reset** discards unsaved form changes and restores the last saved values
- **Reload from Config** imports the on-disk YAML back into UCI, then regenerates and reloads the form — useful if you have manually edited the YAML file
- Input validation runs before any UCI writes

### Add Device

The Add Device section at the bottom of the Configuration tab lets you register new devices without restarting LuCI.

- **Rescan** queries ADB for connected devices and filters out any already registered
- Each found device is listed by serial and model name with a **Register** button
- Registering a device creates the UCI section, generates the YAML, sets up the network interface and firewall zone, and injects the device's config form inline — no page reload required

### Remove Device

Each device form has a **Remove Device** button with a confirmation dialog. Removing a device stops its tunnel, cleans up the network interface, firewall zone, and UCI section, and removes its form from the page immediately.

## Android setup

Install a SOCKS5 proxy app on your Android device like [Socks5](https://github.com/heiher/socks5), a lightweight, fast proxy from the same author as hev-socks5-tunnel. Configure it to listen on port 1088 (or whatever port you set in OpenTether).

Enable USB debugging in Developer Options, plug into the router, and approve the debug prompt.

## Dependencies

- [`opentether`](https://github.com/HelaFaye/opentether) — the CLI package this UI wraps
- `luci-base` — LuCI JavaScript framework

## Building

```sh
cp -r luci-app-opentether /path/to/openwrt/package/
cd /path/to/openwrt
make menuconfig   # LuCI → Applications → luci-app-opentether
make package/luci-app-opentether/compile V=s
```

## Installing

**apk (OpenWrt 24+ snapshot builds):**
```sh
scp bin/packages/<arch>/base/luci-app-opentether-*.apk root@192.168.1.1:/tmp/
ssh root@192.168.1.1 "apk add --allow-untrusted /tmp/luci-app-opentether-*.apk"
```

**opkg (OpenWrt stable releases):**
```sh
scp bin/packages/<arch>/base/luci-app-opentether-*.ipk root@192.168.1.1:/tmp/
ssh root@192.168.1.1 "opkg install /tmp/luci-app-opentether-*.ipk"
```

Replace `<arch>` with your router's CPU architecture. If you're not sure, run `uname -m` on the router to check.
