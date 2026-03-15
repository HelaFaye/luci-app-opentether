'use strict';
'require view';
'require fs';
'require ui';
'require uci';

// Per-device defaults — called with next available port and interface index
function deviceDefaults(port, idx) {
	let p = port || '1088';
	let i = idx || 0;
	return {
		name: '', serial: '', enabled: '0',
		iface: 's5tun' + i, mtu: '1440',
		ipv4: '198.18.' + i + '.1',
		ipv6: 'fc' + (i < 16 ? '0' + i.toString(16) : i.toString(16)) + '::1',
		mq: '0', post_up: '', pre_dn: '',
		s5_port: p, s5_addr: '127.0.0.1', s5_udp: 'tcp',
		s5_udp_addr: '', s5_pipeline: '0',
		s5_user: '', s5_pass: '', s5_mark: '0',
		md_addr: '127.0.0.1', md_port: p,
		md_network: '100.64.0.0', md_netmask: '255.192.0.0', md_cache: '10000',
		ms_stack: '86016', ms_buf: '65536', ms_udp_buf: '524288',
		ms_udp_copy: '', ms_sess: '', ms_ctout: '',
		ms_trwtout: '', ms_urwtout: '', ms_logfile: '',
		ms_loglevel: 'warn', ms_pidfile: '', ms_nofile: '',
		metric: '10', dns: '1.1.1.1\n2606:4700:4700::1111'
	};
}

return view.extend({

	css: `
		:root {
			--ot-bg:      #0d1117;
			--ot-surface: #161b22;
			--ot-border:  #21262d;
			--ot-accent:  #58a6ff;
			--ot-ok:      #3fb950;
			--ot-err:     #f85149;
			--ot-warn:    #d29922;
			--ot-text:    #c9d1d9;
			--ot-muted:   #6e7681;
			--ot-mono:    'SFMono-Regular','Consolas','Liberation Mono',monospace;
		}
		#ot { background: var(--ot-bg); color: var(--ot-text); padding: 1.5rem 2rem 3rem; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
		#ot * { box-sizing: border-box; }
		.ot-header { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--ot-border); }
		.ot-header h2 { font-size: 1.25rem; font-weight: 600; color: var(--ot-text); margin: 0; }
		.ot-version { font-size: .75rem; color: var(--ot-muted); font-family: var(--ot-mono); }
		.ot-tabs { display: flex; margin-bottom: 1.5rem; border-bottom: 1px solid var(--ot-border); }
		.ot-tab { font-family: inherit; font-size: .85rem; font-weight: 500; padding: .5rem 1.25rem; border: none; border-bottom: 2px solid transparent; background: none; color: var(--ot-muted); cursor: pointer; margin-bottom: -1px; transition: color .12s,border-color .12s; display: flex; align-items: center; gap: .4rem; }
		.ot-tab:hover { color: var(--ot-text); }
		.ot-tab.active { color: var(--ot-accent); border-bottom-color: var(--ot-accent); }
		.ot-tab-dirty { width: 7px; height: 7px; border-radius: 50%; background: var(--ot-warn); display: none; flex-shrink: 0; }
		.ot-tab-dirty.visible { display: inline-block; }
		.ot-panel { display: none; }
		.ot-panel.active { display: block; }
		.ot-btn { font-family: inherit; font-size: .8rem; font-weight: 500; padding: .4rem 1rem; border-radius: 6px; border: 1px solid var(--ot-border); background: var(--ot-surface); color: var(--ot-text); cursor: pointer; transition: border-color .12s,color .12s; }
		.ot-btn:hover           { border-color: var(--ot-accent); color: var(--ot-accent); }
		.ot-btn.stop:hover      { border-color: var(--ot-err);    color: var(--ot-err); }
		.ot-btn.start:hover     { border-color: var(--ot-ok);     color: var(--ot-ok); }
		.ot-btn.warn-btn:hover  { border-color: var(--ot-warn);   color: var(--ot-warn); }
		.ot-btn:disabled        { opacity: .4; cursor: not-allowed; }
		.ot-spinner { display: none; width: 14px; height: 14px; border: 2px solid var(--ot-border); border-top-color: var(--ot-accent); border-radius: 50%; animation: ot-spin .6s linear infinite; }
		.ot-spinner.active { display: inline-block; }
		@keyframes ot-spin { to { transform: rotate(360deg); } }
		.ot-dot-sm { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
		.ot-dot-sm.ok   { background: var(--ot-ok); }
		.ot-dot-sm.err  { background: var(--ot-err); }
		.ot-dot-sm.warn { background: var(--ot-warn); }
		.ot-pre { background: var(--ot-surface); border: 1px solid var(--ot-border); border-radius: 6px; padding: .75rem 1rem; font-family: var(--ot-mono); font-size: .75rem; color: var(--ot-text); white-space: pre-wrap; word-break: break-all; line-height: 1.65; max-height: 200px; overflow-y: auto; margin: 0; }
		.ot-pre.log { max-height: 280px; color: #8b949e; }
		.ot-cols { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
		.ot-section { margin-bottom: 1.25rem; }
		.ot-section-title { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--ot-muted); margin-bottom: .375rem; }
		.ot-top-row { display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: start; }
		.ot-controls { display: flex; flex-direction: column; gap: .4rem; align-items: stretch; min-width: 90px; }
		.ot-controls .ot-btn { text-align: center; }
		.ot-test-pre { font-family: var(--ot-mono); font-size: .75rem; color: var(--ot-text); background: var(--ot-surface); border: 1px solid var(--ot-border); border-radius: 6px; padding: .4rem .75rem; white-space: pre-wrap; line-height: 1.5; flex: 1; }
		/* Device list */
		.ot-device-list { background: var(--ot-surface); border: 1px solid var(--ot-border); border-radius: 6px; overflow: hidden; }
		.ot-device-list-hdr { display: grid; grid-template-columns: minmax(0,1.8fr) 10px minmax(0,.8fr) 10px minmax(0,.8fr) 10px minmax(0,.8fr); gap: 6px; padding: 5px 10px; border-bottom: 1px solid var(--ot-border); background: rgba(255,255,255,.02); }
		.ot-device-list-hdr span { font-size: .62rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--ot-muted); text-align: right; }
		.ot-device-list-hdr span:first-child { text-align: left; }
		.ot-device-row { display: grid; grid-template-columns: minmax(0,1.8fr) 10px minmax(0,.8fr) 10px minmax(0,.8fr) 10px minmax(0,.8fr); gap: 6px; padding: 8px 10px; align-items: center; cursor: pointer; border-bottom: 1px solid var(--ot-border); transition: background .1s; user-select: none; }
		.ot-device-row:last-child { border-bottom: none; }
		.ot-device-row:hover { background: rgba(255,255,255,.03); }
		.ot-device-row.selected { background: rgba(88,166,255,.08); border-left: 2px solid var(--ot-accent); padding-left: 8px; }
		.ot-device-name { font-family: var(--ot-mono); font-size: .78rem; color: var(--ot-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.ot-device-name em { font-style: normal; font-size: .68rem; color: var(--ot-muted); margin-left: .35rem; }
		.ot-device-val { font-family: var(--ot-mono); font-size: .72rem; color: var(--ot-muted); text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.ot-dot-col { display: flex; justify-content: center; }
		/* Detail panels */
		.ot-detail-panel { border: 1px solid var(--ot-border); border-radius: 6px; overflow: hidden; margin-top: .6rem; }
		.ot-detail-panel-hdr { padding: .4rem .75rem; background: rgba(255,255,255,.02); border-bottom: 1px solid var(--ot-border); font-size: .72rem; color: var(--ot-muted); display: flex; gap: .4rem; align-items: center; }
		.ot-detail-panel-hdr b { font-family: var(--ot-mono); font-weight: 500; color: var(--ot-text); }
		.ot-detail-cols { display: grid; grid-template-columns: 1fr 1fr; }
		.ot-detail-col { padding: .6rem .75rem; border-right: 1px solid var(--ot-border); }
		.ot-detail-col:last-child { border-right: none; }
		.ot-detail-col-title { font-size: .65rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--ot-muted); margin-bottom: .3rem; }
		/* Config */
		.ot-config-layout { display: grid; grid-template-columns: 1fr 340px; gap: 1.25rem; align-items: start; }
		.ot-yaml-panel { position: sticky; top: 1rem; }
		.ot-yaml-panel h4 { font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--ot-muted); margin: 0 0 .5rem; }
		.ot-yaml-pre { background: var(--ot-surface); border: 1px solid var(--ot-border); border-radius: 6px; padding: .75rem 1rem; font-family: var(--ot-mono); font-size: .72rem; color: var(--ot-text); white-space: pre; overflow-x: auto; overflow-y: auto; max-height: calc(100vh - 200px); line-height: 1.6; margin: 0; }
		.ot-yaml-line-changed { background: rgba(210,153,34,.18); color: var(--ot-warn); display: block; margin: 0 -1rem; padding: 0 1rem; border-left: 2px solid var(--ot-warn); }
		.ot-form { background: var(--ot-surface); border: 1px solid var(--ot-border); border-radius: 6px; margin-bottom: 1rem; overflow: hidden; }
		.ot-form h3 { font-size: .85rem; font-weight: 600; color: var(--ot-text); margin: 0; padding: .875rem 1.25rem; display: flex; align-items: center; gap: .5rem; justify-content: space-between; }
		.ot-form-body { padding: 0 1.25rem 1.25rem; }
		.ot-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem 1.25rem; }
		.ot-field.full { grid-column: 1 / -1; }
		.ot-label { display: block; font-size: .75rem; font-weight: 600; color: var(--ot-muted); margin-bottom: .3rem; text-transform: uppercase; letter-spacing: .06em; }
		.ot-input, .ot-select { width: 100%; font-family: var(--ot-mono); font-size: .85rem; padding: .4rem .75rem; background: var(--ot-bg); border: 1px solid var(--ot-border); border-radius: 6px; color: var(--ot-text); transition: border-color .12s; }
		.ot-input:focus, .ot-select:focus { outline: none; border-color: var(--ot-accent); }
		.ot-pw-wrap { position: relative; }
		.ot-pw-wrap .ot-input { padding-right: 2.2rem; }
		.ot-pw-toggle { position: absolute; right: .5rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--ot-muted); cursor: pointer; font-size: .8rem; padding: 0; }
		.ot-checkbox-row { display: flex; align-items: center; gap: .5rem; padding: .5rem 0; }
		.ot-checkbox-row input { accent-color: var(--ot-accent); width: 14px; height: 14px; }
		.ot-checkbox-row label { font-size: .85rem; color: var(--ot-text); cursor: pointer; }
		.ot-hint { font-size: .7rem; color: var(--ot-muted); margin-top: .2rem; }
		.ot-collapsible-btn { background: none; border: none; color: var(--ot-muted); cursor: pointer; font-size: .75rem; font-family: inherit; padding: 0; display: flex; align-items: center; gap: .3rem; }
		.ot-collapsible-btn:hover { color: var(--ot-text); }
		.ot-collapsible-content { overflow: hidden; transition: max-height .2s ease; }
		.ot-collapsible-content.collapsed { max-height: 0 !important; }
		.ot-save { display: flex; gap: .5rem; margin-top: 1.25rem; align-items: center; flex-wrap: wrap; }
		.ot-save-status { font-size: .8rem; color: var(--ot-muted); }
		.ot-unsaved-badge { font-size: .65rem; font-weight: 600; padding: .1rem .4rem; border-radius: 2em; background: rgba(210,153,34,.2); color: var(--ot-warn); border: 1px solid rgba(210,153,34,.3); margin-left: .5rem; }
		.ot-status-section { border: 1px solid var(--ot-border); border-radius: 6px; overflow: hidden; margin-top: .6rem; }
		.ot-status-sec-hdr { display: flex; align-items: center; gap: .35rem; padding: .45rem .75rem; cursor: pointer; user-select: none; background: var(--ot-surface); }
		.ot-status-sec-hdr:hover { filter: brightness(1.1); }
		.ot-status-sec-body { padding: .6rem .75rem; }
		.ot-status-sec-body.collapsed { display: none; }
		@media (max-width: 900px) { .ot-config-layout { grid-template-columns: 1fr; } .ot-yaml-panel { position: static; } }
		@media (max-width: 640px) { .ot-cols { grid-template-columns: 1fr; } .ot-form-grid { grid-template-columns: 1fr; } #ot { padding: 1rem; } .ot-top-row { grid-template-columns: 1fr; } .ot-detail-cols { grid-template-columns: 1fr; } }
	`,

	_devices: [],  // [{serial, name, cfg, ...fields}] loaded from UCI
	_loaded: null, // single-device compat
	_lastStatus: null, // cached last loadStatus result for detail panel updates

	// ── loadStatus: per-device lightweight poll ────────────────────────────────
	loadStatus: function() {
		let self = this;
		let devices = this._devices.length ? this._devices : [];
		// If no devices loaded yet, fetch them first (once only)
		if (!devices.length) {
			return this.load().then(data => {
				let [devs] = data;
				self._devices = devs || [];
				if (!self._devices.length) return Promise.resolve([[], {stdout:''}, {}, [], '', '']);
				return self.loadStatus();
			}).catch(() => Promise.resolve([[], {stdout:''}, {}, [], '', '']));
		}
		let ifaces = devices.map(d => d.iface || 's5tun0');

		return Promise.all([
			// ADB: all devices with models
			fs.exec('adb', ['devices']).then(r => {
				let lines = (r.stdout||'').replace(/^List of devices attached\s*/,'').trim().split('\n').filter(Boolean);
				let devs = lines.filter(l => /\tdevice$/.test(l)).map(l => l.split('\t')[0]);
				return Promise.all(devs.map(serial =>
					fs.exec('adb', ['-s', serial, 'shell', 'getprop', 'ro.product.model'])
						.then(m => ({ serial, model: (m.stdout||'').trim() }))
						.catch(() => ({ serial, model: '' }))
				));
			}).catch(() => []),
			// All forwards
			fs.exec('adb', ['forward', '--list']).catch(() => ({ stdout: '' })),
			// Tunnel PIDs — read PID file and verify process is alive
			Promise.all(devices.map(d =>
				fs.read('/tmp/opentether-tunnel-' + d.serial + '.pid')
					.then(pid => {
						let p = (pid||'').trim();
						if (!p) return { serial: d.serial, pid: '' };
						// Verify process is alive by checking /proc/<pid>
						return fs.read('/proc/' + p + '/status')
							.then(() => ({ serial: d.serial, pid: p }))
							.catch(() => ({ serial: d.serial, pid: '' }));
					})
					.catch(() => ({ serial: d.serial, pid: '' }))
			)).then(results => {
				let pids = {};
				results.forEach(r => { if (r.pid) pids[r.serial] = r.pid; });
				return pids;
			}),
			// All interface states
			Promise.all(ifaces.map(iface =>
				Promise.all([
					fs.exec('ip', ['addr', 'show', 'dev', iface]).catch(() => ({ stdout: '' })),
					fs.exec('ip', ['route', 'show', 'dev', iface]).catch(() => ({ stdout: '' })),
					fs.exec('ip', ['-6', 'route', 'show', 'dev', iface]).catch(() => ({ stdout: '' }))
				]).then(([addr, r4, r6]) => ({ iface, addr: addr.stdout||'', r4: r4.stdout||'', r6: r6.stdout||'' }))
			)),
			fs.read('/etc/resolv.conf').catch(() => ''),
			// Log — newest first
			fs.exec('/sbin/logread', ['-e', 'opentether']).catch(() =>
				fs.exec('logread', ['-e', 'opentether']).catch(() => ({ stdout: '' }))
			).then(r => (r.stdout||'').split('\n').filter(Boolean).slice(-50).reverse().join('\n'))
		]);
	},

	// ── load: full load including UCI device configs ────────────────────────────
	load: function() {
		return Promise.all([
			uci.load('opentether').then(() => {
				// Read all device sections
				let devices = [];
				uci.sections('opentether', 'device', function(s) {
					let d = {
						cfg:        s['.name'],
						serial:     s.serial      || '',
						name:       s.name        || '',
						enabled:    s.enabled     || '0',
						iface:      s.iface       || 's5tun0',
						mtu:        s.mtu         || '1440',
						ipv4:       s.ipv4        || '198.18.0.1',
						ipv6:       s.ipv6        || 'fc00::1',
						mq:         s.multi_queue || '0',
						post_up:    s.post_up_script || '',
						pre_dn:     s.pre_down_script || '',
						s5_port:    s.port        || '1088',
						s5_addr:    s.s5_address  || '127.0.0.1',
						s5_udp:     s.s5_udp      || 'tcp',
						s5_udp_addr:s.s5_udp_address || '',
						s5_pipeline:s.s5_pipeline || '0',
						s5_user:    s.s5_username || '',
						s5_pass:    s.s5_password || '',
						s5_mark:    s.s5_mark     || '0',
						md_addr:    s.md_address  || '127.0.0.1',
						md_port:    s.md_port     || s.port || '1088',
						md_network: s.md_network  || '100.64.0.0',
						md_netmask: s.md_netmask  || '255.192.0.0',
						md_cache:   s.md_cache_size || '10000',
						ms_stack:   s.task_stack_size || '86016',
						ms_buf:     s.tcp_buffer_size || '65536',
						ms_udp_buf: s.udp_recv_buffer_size || '524288',
						ms_udp_copy:s.udp_copy_buffer_nums || '',
						ms_sess:    s.max_session_count || '',
						ms_ctout:   s.connect_timeout || '',
						ms_trwtout: s.tcp_rw_timeout || '',
						ms_urwtout: s.udp_rw_timeout || '',
						ms_logfile: s.log_file    || '',
						ms_loglevel:s.log_level   || 'warn',
						ms_pidfile: s.pid_file    || '',
						ms_nofile:  s.limit_nofile || '',
						metric:     s.metric      || '10',
					};
					if (d.serial) devices.push(d);
				});
				return devices;
			}).catch(() => []),
			fs.exec('apk', ['info', 'opentether']).then(r => {
				let m = (r.stdout||'').match(/opentether-([^\s]+)/);
				return m ? m[1] : '';
			}).catch(() => '')
		]);
	},

	// ── buildYaml: mirrors generate_yaml() in setup.sh ─────────────────────────
	// IMPORTANT: Keep in sync with generate_yaml() in setup.sh.
	buildYaml: function(d) {
		let lines = [];
		let push = s => lines.push(s);
		let opt  = (k, v) => { if (v && v !== '0') push('  ' + k + ': ' + v); };
		let optq = (k, v) => { if (v) push("  " + k + ": '" + v + "'"); };

		push('tunnel:');
		push('  name: '       + (d.iface    || 's5tun0'));
		push('  mtu: '        + (d.mtu      || '1440'));
		push('  multi-queue: '+ (d.mq === '1' ? 'true' : 'false'));
		push('  ipv4: '       + (d.ipv4     || '198.18.0.1'));
		push("  ipv6: '"      + (d.ipv6     || 'fc00::1') + "'");
		optq('post-up-script',  d.post_up);
		optq('pre-down-script', d.pre_dn);
		push('');
		push('socks5:');
		push('  port: '    + (d.s5_port || '1088'));
		push('  address: ' + (d.s5_addr || '127.0.0.1'));
		push("  udp: '"    + (d.s5_udp  || 'tcp') + "'");
		optq('udp-address', d.s5_udp_addr);
		if (d.s5_pipeline === '1') push('  pipeline: true');
		optq('username', d.s5_user);
		optq('password', d.s5_pass);
		opt( 'mark',     d.s5_mark);
		push('');
		push('mapdns:');
		push('  address: '    + (d.md_addr    || '127.0.0.1'));
		push('  port: '       + (d.md_port    || '1088'));
		push('  network: '    + (d.md_network || '100.64.0.0'));
		push('  netmask: '    + (d.md_netmask || '255.192.0.0'));
		push('  cache-size: ' + (d.md_cache   || '10000'));
		push('');
		push('misc:');
		push('  task-stack-size: '     + (d.ms_stack   || '86016'));
		push('  tcp-buffer-size: '     + (d.ms_buf     || '65536'));
		push('  udp-recv-buffer-size: '+ (d.ms_udp_buf || '524288'));
		opt( 'udp-copy-buffer-nums',   d.ms_udp_copy);
		opt( 'max-session-count',      d.ms_sess);
		opt( 'connect-timeout',        d.ms_ctout);
		opt( 'tcp-read-write-timeout', d.ms_trwtout);
		opt( 'udp-read-write-timeout', d.ms_urwtout);
		optq('log-file',               d.ms_logfile);
		if (d.ms_loglevel && d.ms_loglevel !== 'warn') optq('log-level', d.ms_loglevel);
		optq('pid-file',               d.ms_pidfile);
		opt( 'limit-nofile',           d.ms_nofile);
		return lines;
	},

	// ── readForm: read form values for a specific device serial ────────────────
	readForm: function(serial) {
		let pfx = 'ot-cfg-' + serial + '-';
		let get = id => { let el = document.getElementById(pfx + id); return el ? el.value.trim() : ''; };
		let chk = id => { let el = document.getElementById(pfx + id); return !!(el && el.checked); };
		return {
			serial:     serial,
			name:       get('name'),
			enabled:    chk('enabled') ? '1' : '0',
			iface:      get('iface'),      mtu:        get('mtu'),
			ipv4:       get('ipv4'),       ipv6:       get('ipv6'),
			mq:         chk('mq') ? '1' : '0',
			post_up:    get('post-up'),    pre_dn:     get('pre-dn'),
			s5_port:    get('s5-port'),    s5_addr:    get('s5-addr'),
			s5_udp:     get('s5-udp'),     s5_udp_addr:get('s5-udp-addr'),
			s5_pipeline:chk('s5-pipeline') ? '1' : '0',
			s5_user:    get('s5-user'),    s5_pass:    get('s5-pass'),
			s5_mark:    get('s5-mark'),
			md_addr:    get('md-addr'),    md_port:    get('md-port'),
			md_network: get('md-network'), md_netmask: get('md-netmask'),
			md_cache:   get('md-cache'),
			ms_stack:   get('ms-stack'),   ms_buf:     get('ms-buf'),
			ms_udp_buf: get('ms-udp-buf'), ms_udp_copy:get('ms-udp-copy'),
			ms_sess:    get('ms-sess'),    ms_ctout:   get('ms-ctout'),
			ms_trwtout: get('ms-trwtout'), ms_urwtout: get('ms-urwtout'),
			ms_logfile: get('ms-logfile'), ms_loglevel:get('ms-loglevel'),
			ms_pidfile: get('ms-pidfile'), ms_nofile:  get('ms-nofile'),
			metric:     get('metric'),
		};
	},

	// ── updatePreview: regenerate YAML preview for a device ───────────────────
	updatePreview: function(serial, loaded) {
		let current = this.readForm(serial);
		let currentLines = this.buildYaml(current);
		let loadedLines  = loaded ? this.buildYaml(loaded) : currentLines;

		let preview = document.getElementById('ot-yaml-preview-' + serial);
		if (!preview) return;
		preview.innerHTML = '';
		currentLines.forEach((line, i) => {
			let span = document.createElement('span');
			let changed = loaded && line !== loadedLines[i];
			if (changed) span.className = 'ot-yaml-line-changed';
			span.textContent = line + '\n';
			preview.appendChild(span);
		});

		// Per-device dirty dot
		let dirty = loaded && currentLines.some((l, i) => l !== loadedLines[i]);
		let devDot = document.getElementById('ot-dirty-' + serial);
		if (devDot) devDot.className = 'ot-tab-dirty' + (dirty ? ' visible' : '');
		// Global tab dirty dot — any device dirty
		let anyDirty = dirty || !!document.querySelector('.ot-tab-dirty.visible:not(#ot-config-dirty)');
		let dot = document.getElementById('ot-config-dirty');
		if (dot) dot.className = 'ot-tab-dirty' + (anyDirty ? ' visible' : '');
	},

	// ── handleSaveConfig: save one device's config ────────────────────────────
	handleSaveConfig: function(serial, loadedRef) {
		let self = this;
		let status  = document.getElementById('ot-save-status-' + serial);
		let v = this.readForm(serial);

		let errors = [];
		if (!v.iface.match(/^[a-zA-Z0-9_-]+$/))                    errors.push('Interface name invalid');
		if (isNaN(+v.mtu) || +v.mtu < 576 || +v.mtu > 9000)        errors.push('MTU must be 576–9000');
		if (!v.ipv4.match(/^\d{1,3}(\.\d{1,3}){3}$/))              errors.push('IPv4 must be a valid address');
		if (isNaN(+v.s5_port) || +v.s5_port < 1 || +v.s5_port > 65535) errors.push('Port must be 1–65535');
		if (isNaN(+v.ms_stack) || +v.ms_stack < 8192)               errors.push('Task stack must be ≥ 8192');

		if (errors.length) { if (status) status.textContent = errors[0]; return; }
		if (status) status.textContent = 'Saving...';

		uci.load('opentether').then(() => {
			// Find or create the device section
			let cfg = null;
			uci.sections('opentether', 'device', function(s) {
				if (s.serial === serial) cfg = s['.name'];
			});
			if (!cfg) {
				// New device — call add-device first
				return fs.exec('/usr/lib/opentether/setup.sh', ['add-device', serial, v.name])
					.then(() => uci.load('opentether'))
					.then(() => {
						uci.sections('opentether', 'device', function(s) {
							if (s.serial === serial) cfg = s['.name'];
						});
						return cfg;
					});
			}
			return cfg;
		}).then(cfg => {
			let s = (k, val) => uci.set('opentether', cfg, k, val);
			s('name',                v.name);
			s('enabled',             v.enabled);
			s('iface',               v.iface);
			s('mtu',                 v.mtu);
			s('ipv4',                v.ipv4);
			s('ipv6',                v.ipv6);
			s('multi_queue',         v.mq);
			s('post_up_script',      v.post_up);
			s('pre_down_script',     v.pre_dn);
			s('port',                v.s5_port);
			s('s5_address',          v.s5_addr);
			s('s5_udp',              v.s5_udp);
			s('s5_udp_address',      v.s5_udp_addr);
			s('s5_pipeline',         v.s5_pipeline);
			s('s5_username',         v.s5_user);
			s('s5_password',         v.s5_pass);
			s('s5_mark',             v.s5_mark);
			s('md_address',          v.md_addr);
			s('md_port',             v.md_port);
			s('md_network',          v.md_network);
			s('md_netmask',          v.md_netmask);
			s('md_cache_size',       v.md_cache);
			s('task_stack_size',     v.ms_stack);
			s('tcp_buffer_size',     v.ms_buf);
			s('udp_recv_buffer_size',v.ms_udp_buf);
			s('udp_copy_buffer_nums',v.ms_udp_copy);
			s('max_session_count',   v.ms_sess);
			s('connect_timeout',     v.ms_ctout);
			s('tcp_rw_timeout',      v.ms_trwtout);
			s('udp_rw_timeout',      v.ms_urwtout);
			s('log_file',            v.ms_logfile);
			s('log_level',           v.ms_loglevel);
			s('pid_file',            v.ms_pidfile);
			s('limit_nofile',        v.ms_nofile);
			s('metric',              v.metric);
			return uci.save()
				.then(() => fs.exec('uci', ['commit', 'opentether']))
				.then(() => fs.exec('uci', ['commit', 'network']));
		}).then(() => uci.apply().catch(() => {}))
		.then(() => { if (status) status.textContent = 'Applying...'; })
		.then(() => fs.exec('/usr/lib/opentether/setup.sh', ['apply', serial]))
		.then(() => {
			if (loadedRef) Object.assign(loadedRef, v);
			// Keep _devices in sync so polls don't re-dirty the form
			self._devices = self._devices.map(d => d.serial === serial ? Object.assign({}, d, v) : d);
			self.updatePreview(serial, loadedRef);
			// Remove unsaved badge if present
			let badge = document.getElementById('ot-unsaved-' + serial);
			if (badge) badge.remove();
			if (status) status.textContent = 'Saved';
			setTimeout(() => { if (status) status.textContent = ''; }, 3000);
		}).catch(e => {
			if (status) status.textContent = 'Error: ' + e.message;
		});
	},

	// ── handleServiceAction: start/stop/restart for selected devices ───────────
	handleServiceAction: function(action) {
		let self = this;
		let selected = Array.from(document.querySelectorAll('.ot-device-row.selected'))
			.map(r => r.dataset.serial).filter(Boolean);
		if (!selected.length) return;

		let spinner = document.querySelector('.ot-spinner');
		let btns    = document.querySelectorAll('.ot-btn[data-action]');
		if (spinner) spinner.classList.add('active');
		btns.forEach(b => b.disabled = true);

		Promise.all(selected.map(serial => {
			if (action === 'stop') {
				// Stop specific instance via ubus
				return fs.exec('ubus', ['call', 'service', 'set',
					'{"name":"opentether","instances":{"' + serial + '":{"action":"stop"}}}'])
					.catch(e => e);
			} else if (action === 'start') {
				// Start runs init.d which iterates enabled devices
				return fs.exec('/etc/init.d/opentether', ['start']).catch(e => e);
			} else {
				// Restart: stop specific instance then reload all
				return fs.exec('ubus', ['call', 'service', 'set',
					'{"name":"opentether","instances":{"' + serial + '":{"action":"stop"}}}'])
					.catch(() => {})
					.then(() => fs.exec('/etc/init.d/opentether', ['start']).catch(e => e));
			}
		})).then(() => new Promise(r => setTimeout(r, 1500)))
		.then(() => self.loadStatus()).then(d => self.updateStatus(d))
		.finally(() => {
			if (spinner) spinner.classList.remove('active');
			btns.forEach(b => b.disabled = false);
		});
	},

	// ── handleConnectivityTest: test selected devices ─────────────────────────
	handleConnectivityTest: function() {
		let el = document.getElementById('ot-connectivity');
		if (!el) return;
		let selected = Array.from(document.querySelectorAll('.ot-device-row.selected'))
			.map(r => r.dataset.serial).filter(Boolean);
		if (!selected.length) { el.textContent = '(no device selected)'; return; }
		el.textContent = 'Testing...';
		// Test connectivity — we can't easily bind to a specific interface from rpcd curl,
		// but we test through the default route which should be the tunnel
		Promise.all(selected.map(serial =>
			Promise.all([
				fs.exec('curl', ['-4', '-s', '--max-time', '5', 'https://ifconfig.co']).catch(() => ({ stdout: '' })),
				fs.exec('curl', ['-6', '-s', '--max-time', '5', 'https://ifconfig.co']).catch(() => ({ stdout: '' }))
			]).then(([v4, v6]) => serial + ':\n' +
				'  IPv4: ' + ((v4.stdout||'').trim() || 'FAILED') + '\n' +
				'  IPv6: ' + ((v6.stdout||'').trim() || 'NOT AVAILABLE'))
		)).then(results => { el.textContent = results.join('\n\n'); });
	},

	// ── DOM helpers ───────────────────────────────────────────────────────────
	dotSm: function(state) {
		// state: 'ok' | 'warn' | 'err'
		return E('span', { class: 'ot-dot-sm ' + (state || 'err') });
	},
	section: function(title, content) {
		return E('div', { class: 'ot-section' }, [
			E('div', { class: 'ot-section-title' }, title), content
		]);
	},
	inp: function(id, type, val, ph, onChange) {
		let attrs = { class: 'ot-input', id, type: type||'text', value: val||'', placeholder: ph||'' };
		if (onChange) attrs.input = onChange;
		return E('input', attrs);
	},
	sel: function(id, opts, val, onChange) {
		let attrs = { class: 'ot-select', id };
		if (onChange) attrs.change = onChange;
		let el = E('select', attrs);
		opts.forEach(([v, l]) => { let o = E('option', { value: v }, l); if (v === val) o.selected = true; el.appendChild(o); });
		return el;
	},
	pwInp: function(id, val, onChange) {
		let input  = E('input', { class: 'ot-input', id, type: 'password', value: val||'', input: onChange });
		let toggle = E('button', { class: 'ot-pw-toggle', type: 'button',
			click: () => { input.type = input.type === 'password' ? 'text' : 'password'; toggle.textContent = input.type === 'password' ? '👁' : '🙈'; }
		}, '👁');
		return E('div', { class: 'ot-pw-wrap' }, [input, toggle]);
	},
	chkrow: function(id, label, checked, onChange) {
		let attrs = { type: 'checkbox', id };
		if (checked) attrs.checked = 'checked';
		if (onChange) attrs.change = onChange;
		return E('div', { class: 'ot-checkbox-row' }, [E('input', attrs), E('label', { for: id }, label)]);
	},
	fld: function(label, id, content, hint, full) {
		return E('div', { class: 'ot-field' + (full ? ' full' : '') }, [
			E('label', { class: 'ot-label', for: id }, label),
			content,
			hint ? E('div', { class: 'ot-hint' }, hint) : null
		].filter(Boolean));
	},
	collapsible: function(label, content, collapsed) {
		let inner = E('div', { class: 'ot-collapsible-content' + (collapsed ? ' collapsed' : '') });
		inner.style.maxHeight = collapsed ? '0' : '9999px';
		content.forEach(el => inner.appendChild(el));
		let arrowNode = document.createTextNode(collapsed ? '▶' : '▼');
		let btn = E('button', { class: 'ot-collapsible-btn', click: function() {
			let isCollapsed = inner.classList.contains('collapsed');
			inner.classList.toggle('collapsed', !isCollapsed);
			inner.style.maxHeight = isCollapsed ? '9999px' : '0';
			arrowNode.textContent = isCollapsed ? '▼' : '▶';
		}});
		btn.appendChild(arrowNode);
		btn.appendChild(document.createTextNode(' ' + label));
		return [btn, inner];
	},
	collapsibleSection: function(title, content, collapsed) {
		let inner = E('div', { class: 'ot-collapsible-content' + (collapsed ? ' collapsed' : '') });
		inner.style.maxHeight = collapsed ? '0' : '9999px';
		let body = E('div', { class: 'ot-form-body' });
		content.forEach(el => body.appendChild(el));
		inner.appendChild(body);
		let arrowNode = document.createTextNode(collapsed ? '▶' : '▼');
		let h3 = E('h3', { style: 'cursor:pointer;user-select:none', click: function() {
			let isCollapsed = inner.classList.contains('collapsed');
			inner.classList.toggle('collapsed', !isCollapsed);
			inner.style.maxHeight = isCollapsed ? '9999px' : '0';
			arrowNode.textContent = isCollapsed ? '▼' : '▶';
		}}, [arrowNode, ' ' + title]);
		return E('div', { class: 'ot-form' }, [h3, inner]);
	},
	statusSection: function(title, content, collapsed) {
		let body = E('div', { class: 'ot-status-sec-body' + (collapsed ? ' collapsed' : '') });
		body.appendChild(content);
		let arrowNode = document.createTextNode(collapsed ? '▶' : '▼');
		let hdr = E('div', { class: 'ot-status-sec-hdr', click: function() {
			let isCollapsed = body.classList.toggle('collapsed');
			arrowNode.textContent = isCollapsed ? '▶' : '▼';
		}}, [
			E('span', { style: 'font-size:.65rem;color:var(--ot-muted)' }, [arrowNode]),
			E('span', { style: 'font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--ot-muted);margin-left:.3rem' }, title)
		]);
		return E('div', { class: 'ot-status-section' }, [hdr, body]);
	},

	// ── updateStatus: refresh status page from loadStatus data ────────────────
	updateStatus: function(data) {
		let [adbDevices, fwdRaw, pidFiles, ifaceStates, resolv, log] = data;
		let fwdOut = typeof fwdRaw === 'string' ? fwdRaw : ((fwdRaw && fwdRaw.stdout) ? fwdRaw.stdout : '');
		this._lastStatus = { adbDevices, fwdRaw: fwdOut, pidFiles, ifaceStates, resolv, log };

		// Re-render device list, preserving selection
		let grid = document.getElementById('ot-device-list');
		if (grid) {
			let selectedSerials = Array.from(document.querySelectorAll('.ot-device-row.selected'))
				.map(r => r.dataset.serial);
			let newGrid = this.renderDeviceList(adbDevices, fwdOut, pidFiles, ifaceStates);
			grid.replaceWith(newGrid);
			// Restore selection
			selectedSerials.forEach(serial => {
				let row = document.querySelector('.ot-device-row[data-serial="' + serial + '"]');
				if (row) row.classList.add('selected');
			});
			this.updateDetailPanels(adbDevices, fwdOut, pidFiles, ifaceStates, resolv);
		}

		// Update log
		let logEl = document.getElementById('ot-log');
		if (logEl) logEl.textContent = log || '(no log entries)';
	},

	// ── renderDeviceList ───────────────────────────────────────────────────────
	renderDeviceList: function(adbDevices, fwdOut, pidFiles, ifaceStates) {
		let self = this;
		let devices = this._devices;

		// Build a lookup of ADB-authorized serials
		let authorized = {};
		(adbDevices || []).forEach(d => { authorized[d.serial] = d.model || ''; });

		let rows = devices.map(function(d) {
			let serial    = d.serial;
			let fwdActive = fwdOut.includes(':' + d.s5_port);
			let tunnelPid = '';
			if (pidFiles && pidFiles[serial]) {
				// PID file exists — assume running (procd manages it)
				tunnelPid = '●';
			}
			let tunnelUp  = !!tunnelPid;
			let ifState   = (ifaceStates || []).find(s => s.iface === d.iface);
			let ifaceUp   = ifState ? ifState.addr.trim() !== '' : false;
			let connected = !!authorized[serial];

			// Forward is only truly active if device connected AND forward listed
			let fwdReal    = fwdActive && connected;
			let fwdState   = fwdReal   ? 'ok' : (fwdActive ? 'warn' : (connected ? 'warn' : 'err'));
			// Tunnel is only running if process alive AND device connected
			let tunReal    = tunnelUp && connected;
			let tunState   = tunReal   ? 'ok' : (tunnelUp ? 'warn' : (d.enabled === '1' ? 'err' : 'warn'));
			let ifaceState = ifaceUp   ? 'ok' : (tunnelUp ? 'warn' : 'err');

			let displayName = d.name || authorized[serial] || '';

			let row = E('div', {
				class:           'ot-device-row',
				'data-serial':   serial,
				click: function(e) {
					if (e.ctrlKey || e.metaKey) {
						row.classList.toggle('selected');
					} else if (e.shiftKey) {
						let rows = Array.from(document.querySelectorAll('.ot-device-row'));
						let idx  = rows.indexOf(row);
						let sel  = rows.findIndex(r => r.classList.contains('selected'));
						let lo   = Math.min(idx, sel < 0 ? idx : sel);
						let hi   = Math.max(idx, sel < 0 ? idx : sel);
						rows.forEach((r, i) => { if (i >= lo && i <= hi) r.classList.add('selected'); });
					} else {
						document.querySelectorAll('.ot-device-row').forEach(r => r.classList.remove('selected'));
						row.classList.add('selected');
					}
					self.updateDetailPanels();
				}
			}, [
				E('div', { class: 'ot-device-name' }, [
					serial,
					displayName ? E('em', {}, '— ' + displayName) : null
				].filter(Boolean)),
				E('div', { class: 'ot-dot-col' }, [self.dotSm(fwdState)]),
				E('div', { class: 'ot-device-val' }, fwdReal ? 'tcp:' + d.s5_port : '—'),
				E('div', { class: 'ot-dot-col' }, [self.dotSm(tunState)]),
				E('div', { class: 'ot-device-val' }, tunReal ? 'Running' : (tunnelUp ? 'Stopping' : 'Stopped')),
				E('div', { class: 'ot-dot-col' }, [self.dotSm(ifaceState)]),
				E('div', { class: 'ot-device-val' }, ifaceUp ? d.iface : '—'),
			]);
			return row;
		});

		let list = E('div', { class: 'ot-device-list', id: 'ot-device-list' }, [
			E('div', { class: 'ot-device-list-hdr' }, [
				E('span', {}, 'Device'),
				E('span', {}),
				E('span', {}, 'Forward'),
				E('span', {}),
				E('span', {}, 'Tunnel'),
				E('span', {}),
				E('span', {}, 'Interface'),
			]),
			...rows
		]);
		return list;
	},

	// ── updateDetailPanels: render per-device details for selected rows ────────
	updateDetailPanels: function(adbDevices, fwdOut, pidFiles, ifaceStates, resolv) {
		// Fall back to cached status if called without args (e.g. on row click)
		if (!ifaceStates && this._lastStatus) {
			adbDevices = this._lastStatus.adbDevices;
			fwdOut     = this._lastStatus.fwdRaw;
			pidFiles   = this._lastStatus.pidFiles;
			ifaceStates= this._lastStatus.ifaceStates;
			resolv     = this._lastStatus.resolv;
		}
		let container = document.getElementById('ot-detail-container');
		if (!container) return;

		let selected = Array.from(document.querySelectorAll('.ot-device-row.selected'))
			.map(r => r.dataset.serial).filter(Boolean);

		container.innerHTML = '';

		selected.forEach(serial => {
			let d = this._devices.find(x => x.serial === serial);
			if (!d) return;
			let ifState = (ifaceStates || []).find(s => s.iface === d.iface);

			let panel = E('div', { class: 'ot-detail-panel' }, [
				E('div', { class: 'ot-detail-panel-hdr' }, [
					'Details — ',
					E('b', {}, serial + (d.name ? ' — ' + d.name : ''))
				]),
				E('div', { class: 'ot-detail-cols' }, [
					E('div', { class: 'ot-detail-col' }, [
						E('div', { class: 'ot-detail-col-title' }, 'Network Details'),
						E('pre', { class: 'ot-pre', id: 'ot-net-' + serial },
							[ifState ? ('IPv4:\n' + ifState.r4 + '\nIPv6:\n' + ifState.r6) : '(no routes)',
							 resolv ? '\nDNS:\n' + resolv : ''].join('')
						),
					]),
					E('div', { class: 'ot-detail-col' }, [
						E('div', { class: 'ot-detail-col-title' }, 'Interface Details'),
						E('pre', { class: 'ot-pre', id: 'ot-iface-' + serial },
							ifState ? ifState.addr : '(interface down)'
						),
					]),
				]),
			]);
			container.appendChild(panel);
		});
	},

	// ── renderDeviceConfig: config form for one device ────────────────────────
	renderDeviceConfig: function(d, isNew) {
		let self = this;
		let serial  = d.serial;
		let pfx     = 'ot-cfg-' + serial + '-';
		let loaded  = Object.assign({}, d);
		let up      = () => self.updatePreview(serial, loaded);

		// Populate YAML preview immediately (shows defaults for unsaved devices)
		setTimeout(() => self.updatePreview(serial, loaded), 50);

		let title = serial + (d.name ? ' — ' + d.name : '');
		let dirtyDot = E('span', { class: 'ot-tab-dirty', id: 'ot-dirty-' + serial });
		let header = [title, dirtyDot];
		if (isNew) header.push(E('span', { class: 'ot-unsaved-badge', id: 'ot-unsaved-' + serial }, 'Unsaved'));

		let removeBtn = E('button', { class: 'ot-btn', style: 'margin-left:auto;font-size:.72rem;padding:.2rem .6rem', click: () => {
			if (!confirm('Remove ' + serial + (d.name ? ' (' + d.name + ')' : '') + '? This cannot be undone.')) return;
			// Fire remove — network restart will abort the XHR, that's expected
			// Update UI immediately and reload after a delay
			self._devices = self._devices.filter(x => x.serial !== serial);
			uci.unload('opentether');
			let devSection = removeBtn.closest('div[style*="margin-bottom:1.5rem"]');
			if (devSection) {
				// Also remove any preceding separator
				let prev = devSection.previousElementSibling;
				if (prev && prev.style && prev.style.borderTop) prev.remove();
				devSection.remove();
			}
			// Refresh the Add Device scan list with the now-removed serial excluded
			let addContainer = document.getElementById('ot-add-device-list');
			if (addContainer) {
				addContainer.textContent = 'Scanning...';
				let fresh = self._devices.map(d => d.serial);
				self._scanDevices(addContainer, fresh);
			}
			fs.exec('/usr/lib/opentether/setup.sh', ['remove-device', serial]).catch(() => {});
			// No page reload — DOM already updated above
		}}, 'Remove Device');

		return E('div', { style: 'margin-bottom:1.5rem' }, [
			// Section header with serial + name + remove button
			E('div', { style: 'font-size:.8rem;font-weight:600;color:var(--ot-muted);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem' }, [...header, removeBtn]),

			E('div', { class: 'ot-config-layout' }, [
				// Left: all form sections + save bar
				E('div', {}, [
					// Tunnel Interface
					this.collapsibleSection('Tunnel Interface', [
						E('div', { class: 'ot-form-grid' }, [
							this.fld('Interface Name', pfx+'iface', this.inp(pfx+'iface','text', d.iface,'',up), 'TUN device name'),
							this.fld('MTU',            pfx+'mtu',   this.inp(pfx+'mtu','number', d.mtu,'',up),  '1440 recommended for ADB-TCP'),
							this.fld('IPv4 Address',   pfx+'ipv4',  this.inp(pfx+'ipv4','text', d.ipv4,'',up)),
							this.fld('IPv6 Address',   pfx+'ipv6',  this.inp(pfx+'ipv6','text', d.ipv6,'',up)),
							this.fld('Route Metric',   pfx+'metric',this.inp(pfx+'metric','number', d.metric,'',up), 'Lower = higher priority'),
							E('div', { class: 'ot-field full' }, this.chkrow(pfx+'enabled', 'Enabled (start tunnel on device connect)', d.enabled==='1', up)),
							E('div', { class: 'ot-field full' }, this.chkrow(pfx+'mq', 'Multi-queue (improves throughput on multi-core routers)', d.mq==='1', up)),
						]),
						...this.collapsible('Advanced', [
							E('div', { class: 'ot-form-grid', style: 'margin-top:.75rem' }, [
								this.fld('Friendly Name', pfx+'name', this.inp(pfx+'name','text', d.name,'(optional)',up), 'Shown in device list'),
								this.fld('Post-up Script',  pfx+'post-up', this.inp(pfx+'post-up','text', d.post_up,'(optional)',up)),
								this.fld('Pre-down Script', pfx+'pre-dn',  this.inp(pfx+'pre-dn','text',  d.pre_dn,'(optional)',up)),
							])
						], true)
					], true),

					// SOCKS5
					this.collapsibleSection('SOCKS5 Proxy', [
						E('div', { class: 'ot-form-grid' }, [
							this.fld('Address', pfx+'s5-addr', this.inp(pfx+'s5-addr','text',   d.s5_addr,'',up), '127.0.0.1 for ADB forward'),
							this.fld('Port',    pfx+'s5-port', this.inp(pfx+'s5-port','number', d.s5_port,'',up), "Must match phone's proxy port"),
							this.fld('UDP Mode',pfx+'s5-udp',
								this.sel(pfx+'s5-udp',[['tcp','tcp — relay UDP over TCP'],['udp','udp — native UDP']], d.s5_udp, up),
								'tcp required when phone is the upstream'),
						]),
						...this.collapsible('Advanced', [
							E('div', { class: 'ot-form-grid', style: 'margin-top:.75rem' }, [
								this.fld('UDP Address Override', pfx+'s5-udp-addr', this.inp(pfx+'s5-udp-addr','text', d.s5_udp_addr,'(optional)',up)),
								this.fld('Username',             pfx+'s5-user',     this.inp(pfx+'s5-user','text',     d.s5_user,'(optional)',up)),
								this.fld('Password',             pfx+'s5-pass',     this.pwInp(pfx+'s5-pass', d.s5_pass, up)),
								this.fld('Socket Mark',          pfx+'s5-mark',     this.inp(pfx+'s5-mark','number',   d.s5_mark,'',up), 'Fwmark for bypass routing (0 = disabled)'),
								E('div', { class: 'ot-field full' }, this.chkrow(pfx+'s5-pipeline','Pipeline mode', d.s5_pipeline==='1', up)),
							])
						], true)
					], true),

					// MapDNS
					this.collapsibleSection('Mapped DNS', [
						E('div', { class: 'ot-form-grid' }, [
							this.fld('Address',    pfx+'md-addr',    this.inp(pfx+'md-addr','text',    d.md_addr,'',up)),
							this.fld('Port',       pfx+'md-port',    this.inp(pfx+'md-port','number',  d.md_port,'',up)),
							this.fld('Network',    pfx+'md-network', this.inp(pfx+'md-network','text', d.md_network,'',up)),
							this.fld('Netmask',    pfx+'md-netmask', this.inp(pfx+'md-netmask','text', d.md_netmask,'',up)),
							this.fld('Cache Size', pfx+'md-cache',   this.inp(pfx+'md-cache','number', d.md_cache,'',up)),
						])
					], true),

					// Performance & Misc
					this.collapsibleSection('Performance & Misc', [
						E('div', { class: 'ot-form-grid' }, [
							this.fld('Task Stack (bytes)',      pfx+'ms-stack',   this.inp(pfx+'ms-stack','number',   d.ms_stack,'',up)),
							this.fld('TCP Buffer (bytes)',      pfx+'ms-buf',     this.inp(pfx+'ms-buf','number',     d.ms_buf,'',up)),
							this.fld('UDP Recv Buffer (bytes)', pfx+'ms-udp-buf', this.inp(pfx+'ms-udp-buf','number', d.ms_udp_buf,'',up)),
							this.fld('UDP Copy Buffers',        pfx+'ms-udp-copy',this.inp(pfx+'ms-udp-copy','number',d.ms_udp_copy,'(optional)',up)),
							this.fld('Max Sessions',            pfx+'ms-sess',    this.inp(pfx+'ms-sess','number',    d.ms_sess,'0 = unlimited',up)),
							this.fld('Connect Timeout (ms)',    pfx+'ms-ctout',   this.inp(pfx+'ms-ctout','number',   d.ms_ctout,'(optional)',up)),
							this.fld('TCP R/W Timeout (ms)',    pfx+'ms-trwtout', this.inp(pfx+'ms-trwtout','number', d.ms_trwtout,'(optional)',up)),
							this.fld('UDP R/W Timeout (ms)',    pfx+'ms-urwtout', this.inp(pfx+'ms-urwtout','number', d.ms_urwtout,'(optional)',up)),
							this.fld('Log Level', pfx+'ms-loglevel',
								this.sel(pfx+'ms-loglevel',[['debug','debug'],['info','info'],['warn','warn'],['error','error']], d.ms_loglevel||'warn', up)),
							this.fld('Log File',     pfx+'ms-logfile', this.inp(pfx+'ms-logfile','text',  d.ms_logfile,'stdout, stderr, or path',up)),
							this.fld('PID File',     pfx+'ms-pidfile', this.inp(pfx+'ms-pidfile','text',  d.ms_pidfile,'(optional)',up)),
							this.fld('Limit nofile', pfx+'ms-nofile',  this.inp(pfx+'ms-nofile','number', d.ms_nofile,'(optional)',up)),
						])
					], true),

					// Save bar
					E('div', { class: 'ot-save' }, [
						E('button', { class: 'ot-btn start', click: () => self.handleSaveConfig(serial, loaded) }, 'Save & Apply'),
						E('button', { class: 'ot-btn warn-btn', click: () => {
							Object.keys(d).forEach(k => {
								let el = document.getElementById(pfx + k.replace(/_/g,'-'));
								if (!el) return;
								if (el.type === 'checkbox') el.checked = d[k] === '1';
								else el.value = d[k] || '';
							});
							self.updatePreview(serial, loaded);
						}}, 'Reset'),
						E('button', { class: 'ot-btn', click: () => {
							uci.unload('opentether');
							self.load().then(data => {
								let [devs] = data;
								let fresh = (devs || []).find(x => x.serial === serial);
								if (!fresh) return;
								self._devices = self._devices.map(x => x.serial === serial ? fresh : x);
								Object.assign(loaded, fresh);
								Object.keys(fresh).forEach(k => {
									let el = document.getElementById(pfx + k.replace(/_/g,'-'));
									if (!el) return;
									if (el.type === 'checkbox') el.checked = fresh[k] === '1';
									else el.value = fresh[k] || '';
								});
								self.updatePreview(serial, loaded);
							});
						}}, 'Reload from Config'),
						E('span', { class: 'ot-save-status', id: 'ot-save-status-' + serial }, ''),
					]),
				]),

				// Right: sticky YAML preview
				E('div', { class: 'ot-yaml-panel' }, [
					E('h4', {}, 'YAML Preview'),
					E('pre', { class: 'ot-yaml-pre', id: 'ot-yaml-preview-' + serial })
				]),
			]),
		]);
	},

	// ── pollInterval ──────────────────────────────────────────────────────────
	pollInterval: null,
	startPolling: function() {
		let self = this;
		this.pollInterval = setInterval(() => {
			self.loadStatus().then(d => self.updateStatus(d)).catch(() => {});
		}, 5000);
		document.addEventListener('visibilitychange', () => {
			if (!document.hidden) {
				self.loadStatus().then(d => self.updateStatus(d)).catch(() => {});
			}
		});
	},

	// ── render ────────────────────────────────────────────────────────────────
	render: function(data) {
		if (!data) return this.load().then(d => this.render(d));
		let [devices, version] = data;
		this._devices = devices;

		if (!document.getElementById('ot-styles')) {
			let st = document.createElement('style');
			st.id = 'ot-styles';
			st.textContent = this.css;
			document.head.appendChild(st);
		}

		let self = this;

		// ── Status panel ──────────────────────────────────────────────────────
		let statusPanel = E('div', { class: 'ot-panel active', id: 'ot-panel-status' }, [
			E('div', { class: 'ot-top-row' }, [
				E('div', {}, [
					// Device list
					this.renderDeviceList([], '', {}, []),
					// Connectivity test
					E('div', { style: 'display:flex;align-items:flex-start;gap:.5rem;margin-top:.75rem' }, [
						E('button', { class: 'ot-btn', style: 'flex-shrink:0', click: () => self.handleConnectivityTest() }, 'Run Test'),
						E('div', { class: 'ot-test-pre', id: 'ot-connectivity' }, '—'),
					]),
					// Per-device detail panels (populated on row selection)
					E('div', { id: 'ot-detail-container' }),
				]),
				E('div', { class: 'ot-controls' }, [
					E('button', { class: 'ot-btn start', 'data-action': 'start',   click: () => self.handleServiceAction('start')   }, 'Start'),
					E('button', { class: 'ot-btn stop',  'data-action': 'stop',    click: () => self.handleServiceAction('stop')    }, 'Stop'),
					E('button', { class: 'ot-btn',       'data-action': 'restart', click: () => self.handleServiceAction('restart') }, 'Restart'),
					E('div', { class: 'ot-spinner', style: 'margin:.2rem auto' }),
				]),
			]),
			this.statusSection('Log',
				E('pre', { class: 'ot-pre log', id: 'ot-log' }, '(no log entries)'), false),
		]);

		// ── Config panel ──────────────────────────────────────────────────────
		let configContent;
		if (!devices.length) {
			configContent = E('p', { style: 'color:var(--ot-muted);padding:.75rem 0' },
				'No devices configured. Plug in a phone, approve USB debugging, and use Register below.');
		} else {
			configContent = E('div', {}, devices.reduce((acc, d, i) => {
				if (i > 0) acc.push(E('div', { style: 'border-top:1px solid var(--ot-border);margin:1.5rem 0' }));
				acc.push(this.renderDeviceConfig(d, false));
				return acc;
			}, []));
		}

		let addDeviceSection = E('div', { id: 'ot-add-section', style: 'margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--ot-border)' }, [
			E('div', { style: 'display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem' }, [
				E('div', { style: 'font-size:.75rem;font-weight:600;color:var(--ot-muted);text-transform:uppercase;letter-spacing:.08em' }, 'Add Device'),
				E('button', { class: 'ot-btn', style: 'font-size:.72rem;padding:.2rem .6rem', click: () => {
					let c = document.getElementById('ot-add-device-list');
					if (!c) return; c.textContent = 'Scanning...'; let fresh = self._devices.map(d => d.serial); self._scanDevices(c, fresh);
				}}, '↻ Rescan'),
			]),
			E('div', { id: 'ot-add-device-list', style: 'color:var(--ot-muted);font-size:.8rem' }, 'Scanning for connected ADB devices...'),
		]);

		// Named scan function so rescan button can call it
		let knownSerials = devices.map(d => d.serial);
		self._scanDevices = (container, known) => {
			fs.exec('adb', ['devices']).then(r => {
				let lines = (r.stdout||'').replace(/^List of devices attached\s*/,'').trim().split('\n').filter(Boolean);
				let connected = lines.filter(l => /\tdevice$/.test(l)).map(l => l.split('\t')[0]);
				let unconfigured = connected.filter(s => !known.includes(s));

				if (!unconfigured.length) {
					container.textContent = connected.length
						? 'All connected devices are already configured.'
						: 'No authorized ADB devices detected. Plug in a phone and approve USB debugging.';
					return;
				}

				container.innerHTML = '';
				Promise.all(unconfigured.map(serial =>
					fs.exec('adb', ['-s', serial, 'shell', 'getprop', 'ro.product.model'])
						.then(m => ({ serial, model: (m.stdout||'').trim() }))
						.catch(() => ({ serial, model: '' }))
				)).then(devs => {
					devs.forEach(({ serial, model }) => {
						let row = E('div', { style: 'display:flex;align-items:center;gap:.75rem;padding:.4rem 0;border-bottom:1px solid var(--ot-border)' }, [
							E('span', { style: 'font-family:var(--ot-mono);font-size:.8rem;color:var(--ot-text);flex:1' }, [
								serial,
								model ? E('span', { style: 'color:var(--ot-muted);margin-left:.4rem;font-size:.72rem' }, '— ' + model) : null
							].filter(Boolean)),
							E('button', { class: 'ot-btn', click: function() {
								this.disabled = true;
								this.textContent = 'Registering...';
								let btn = this;
								fs.exec('/usr/lib/opentether/setup.sh', ['add-device', serial, model || ''])
									.then(() => {
										btn.textContent = 'Registered';
										btn.style.color = 'var(--ot-ok)';
										btn.style.borderColor = 'var(--ot-ok)';
										// Flush LuCI UCI cache so new device section is visible
										uci.unload('opentether');
										return self.load().then(data => {
											let [devs] = data;
											self._devices = devs || [];
											let newDev = (devs || []).find(x => x.serial === serial);
											if (!newDev) return;
											let addSec = document.getElementById('ot-add-section');
											let configPanel = document.getElementById('ot-panel-config');
											if (!addSec || !configPanel) return;
											let emptyMsg = configPanel.querySelector('p');
											if (emptyMsg) emptyMsg.remove();
											if (self._devices.length > 1) {
												let sep = document.createElement('div');
												sep.style.cssText = 'border-top:1px solid var(--ot-border);margin:1.5rem 0';
												configPanel.insertBefore(sep, addSec);
											}
											let form = self.renderDeviceConfig(newDev, true);
											configPanel.insertBefore(form, addSec);
											setTimeout(() => self.updatePreview(serial, Object.assign({}, newDev)), 50);
											row.remove();
										});
									})
									.catch(e => {
										btn.textContent = 'Error: ' + e.message;
										btn.disabled = false;
									});
							}}, 'Register'),
						]);
						container.appendChild(row);
					});
				});
			}).catch(() => {
				container.textContent = 'Could not reach ADB. Is adb running?';
			});
		};

		// Populate the add-device list after render
		setTimeout(() => {
			let container = document.getElementById('ot-add-device-list');
			if (!container) return;
			self._scanDevices(container, knownSerials);
		}, 200);

		let configPanel = E('div', { class: 'ot-panel', id: 'ot-panel-config', autocomplete: 'off' }, [
			configContent,
			addDeviceSection,
		]);

		let view = E('div', { id: 'ot' }, [
			E('div', { class: 'ot-header' }, [
				E('h2', {}, 'OpenTether'),
				E('span', { class: 'ot-version' }, version ? 'v' + version : '')
			]),
			E('div', { class: 'ot-tabs' }, [
				E('button', { class: 'ot-tab active', click: e => self.switchTab(e,'status') }, 'Status'),
				E('button', { class: 'ot-tab',        click: e => self.switchTab(e,'config') }, [
					'Configuration',
					E('span', { class: 'ot-tab-dirty', id: 'ot-config-dirty' })
				]),
			]),
			statusPanel,
			configPanel,
		]);

		setTimeout(() => {
			// Initialise YAML previews for all configured devices
			devices.forEach(d => self.updatePreview(d.serial, Object.assign({}, d)));

			self.startPolling();
			// First status fetch — auto-select first row after list is populated
			self.loadStatus().then(d => {
				self.updateStatus(d);
				let firstRow = document.querySelector('.ot-device-row');
				if (firstRow) { firstRow.classList.add('selected'); self.updateDetailPanels(); }
			});
		}, 100);

		return view;
	},

	switchTab: function(e, name) {
		document.querySelectorAll('.ot-tab').forEach(t => t.classList.remove('active'));
		document.querySelectorAll('.ot-panel').forEach(p => p.classList.remove('active'));
		e.currentTarget.classList.add('active');
		let panel = document.getElementById('ot-panel-' + name);
		if (panel) panel.classList.add('active');
	},

	handleSaveApply: null,
	handleSave:      null,
	handleReset:     null
});
