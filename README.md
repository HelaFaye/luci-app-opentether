# luci-app-opentether

LuCI web interface for [OpenTether](https://github.com/HelaFaye/opentether) — monitor tunnel status, control the service, and configure all hev-socks5-tunnel settings from your browser.

Provides a **Services → OpenTether** page in LuCI with two tabs:

## Status tab

- Live status cards: ADB device, port forward, tunnel process, tunnel interface
- Start / Stop / Restart / Refresh controls
- Connectivity test showing public IPv4 and IPv6 through the tunnel
- Collapsible sections: Network Details, Interface Details, Log
- Auto-refresh every 5 seconds; immediate refresh on tab visibility change

## Configuration tab

- Two-column layout: form on left, live YAML preview on right
- Changed lines highlighted yellow in real-time as you type
- Unsaved changes indicator: yellow dot on the tab label
- Collapsible sections — expand only what you need
- Full hev-socks5-tunnel config: tunnel, SOCKS5, MapDNS, performance & misc
- Save & Apply, Reset to Defaults, Reload from Config
- Input validation before any UCI writes

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

## Package signing

To avoid `--allow-untrusted` / unsigned package warnings, you can host these in your own signed feed. See the [OpenWrt package signing documentation](https://openwrt.org/docs/guide-developer/package-signing).
