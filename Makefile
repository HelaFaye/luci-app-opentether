include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-opentether
PKG_VERSION:=1.1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=Alisha Faye <helafaye@users.noreply.github.com>
PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-opentether
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=LuCI support for OpenTether
  DEPENDS:=+opentether +luci-base
endef

define Package/luci-app-opentether/description
  Provides a LuCI web interface for OpenTether. Shows tunnel status,
  ADB device state, routes, and logs. Allows starting, stopping, and
  restarting the tunnel, and reconfiguring all settings from the browser.
endef

define Build/Prepare
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/luci-app-opentether/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/opentether
	$(INSTALL_DATA) ./files/www/luci-static/resources/view/opentether/main.js \
		$(1)/www/luci-static/resources/view/opentether/main.js

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./files/usr/share/luci/menu.d/opentether.json \
		$(1)/usr/share/luci/menu.d/opentether.json

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./files/usr/share/rpcd/acl.d/opentether.json \
		$(1)/usr/share/rpcd/acl.d/opentether.json
endef

define Package/luci-app-opentether/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] && exit 0
rm -rf /tmp/luci-* 2>/dev/null  # clear all LuCI caches
/etc/init.d/rpcd restart 2>/dev/null
exit 0
endef

define Package/luci-app-opentether/prerm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] && exit 0
rm -rf /tmp/luci-* 2>/dev/null
exit 0
endef

$(eval $(call BuildPackage,luci-app-opentether))
