'use strict';
'require view';
'require fs';
'require ui';
'require uci';

var DEFAULTS = {
    tun_name: 's5tun0', tun_mtu: '1440', tun_ipv4: '198.18.0.1', tun_ipv6: 'fc00::1', tun_mq: '0',
    tun_post_up: '', tun_pre_dn: '',
    s5_port: '1088', s5_addr: '127.0.0.1', s5_udp: 'tcp', s5_udp_addr: '', s5_pipeline: '0',
    s5_user: '', s5_pass: '', s5_mark: '0',
    md_addr: '127.0.0.1', md_port: '1088', md_network: '100.64.0.0', md_netmask: '255.192.0.0', md_cache: '10000',
    ms_stack: '86016', ms_buf: '65536', ms_udp_buf: '524288', ms_udp_copy: '', ms_sess: '',
    ms_ctout: '', ms_trwtout: '', ms_urwtout: '', ms_logfile: '', ms_loglevel: 'warn',
    ms_pidfile: '', ms_nofile: '',
    net_ipaddr: '198.18.0.1', net_metric: '10', net_dns: '1.1.1.1\n2606:4700:4700::1111'
};

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
		#ot { background: var(--ot-bg); color: var(--ot-text); padding: 1.5rem 2rem 3rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
		#ot * { box-sizing: border-box; }
		.ot-header { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--ot-border); }
		.ot-header h2 { font-size: 1.25rem; font-weight: 600; color: var(--ot-text); margin: 0; }
		.ot-version { font-size: .75rem; color: var(--ot-muted); font-family: var(--ot-mono); }
		.ot-tabs { display: flex; margin-bottom: 1.5rem; border-bottom: 1px solid var(--ot-border); }
		.ot-tab { font-family: inherit; font-size: .85rem; font-weight: 500; padding: .5rem 1.25rem; border: none; border-bottom: 2px solid transparent; background: none; color: var(--ot-muted); cursor: pointer; margin-bottom: -1px; transition: color .12s, border-color .12s; display: flex; align-items: center; gap: .4rem; }
		.ot-tab:hover { color: var(--ot-text); }
		.ot-tab.active { color: var(--ot-accent); border-bottom-color: var(--ot-accent); }
		.ot-tab-dirty { width: 7px; height: 7px; border-radius: 50%; background: var(--ot-warn); display: none; flex-shrink: 0; }
		.ot-tab-dirty.visible { display: inline-block; }
		.ot-panel { display: none; }
		.ot-panel.active { display: block; }
		.ot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .75rem; margin-bottom: 1.75rem; }
		.ot-card { background: var(--ot-surface); border: 1px solid var(--ot-border); border-radius: 6px; padding: .875rem 1rem; }
		.ot-card-label { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--ot-muted); margin-bottom: .375rem; }
		.ot-card-value { font-size: .9rem; display: flex; align-items: center; gap: .5rem; font-family: var(--ot-mono); }
		.ot-dot { font-size: .65rem; }
		.ot-dot.ok { color: var(--ot-ok); } .ot-dot.err { color: var(--ot-err); }
		.ot-badge { display: inline-block; font-size: .7rem; font-weight: 600; padding: .15rem .5rem; border-radius: 2em; font-family: var(--ot-mono); }
		.ot-badge.ok  { background: rgba(63,185,80,.15);  color: var(--ot-ok);  border: 1px solid rgba(63,185,80,.3); }
		.ot-badge.err { background: rgba(248,81,73,.12);  color: var(--ot-err); border: 1px solid rgba(248,81,73,.3); }
		.ot-top-row { display: grid; grid-template-columns: 1fr auto; gap: 1rem; margin-bottom: 1.25rem; align-items: start; }
		.ot-controls { display: flex; flex-direction: column; gap: .4rem; align-items: stretch; min-width: 90px; }
		.ot-controls .ot-btn { text-align: center; }
		.ot-test-pre { font-family: var(--ot-mono); font-size: .75rem; color: var(--ot-text); background: var(--ot-surface); border: 1px solid var(--ot-border); border-radius: 6px; padding: .4rem .75rem; margin-top: .4rem; white-space: pre-wrap; line-height: 1.5; }
		.ot-btn { font-family: inherit; font-size: .8rem; font-weight: 500; padding: .4rem 1rem; border-radius: 6px; border: 1px solid var(--ot-border); background: var(--ot-surface); color: var(--ot-text); cursor: pointer; transition: border-color .12s, color .12s; }
		.ot-btn:hover           { border-color: var(--ot-accent); color: var(--ot-accent); }
		.ot-btn.stop:hover      { border-color: var(--ot-err);    color: var(--ot-err); }
		.ot-btn.start:hover     { border-color: var(--ot-ok);     color: var(--ot-ok); }
		.ot-btn.warn-btn:hover  { border-color: var(--ot-warn);   color: var(--ot-warn); }
		.ot-btn:disabled        { opacity: .4; cursor: not-allowed; }
		.ot-spinner { display: none; width: 14px; height: 14px; border: 2px solid var(--ot-border); border-top-color: var(--ot-accent); border-radius: 50%; animation: ot-spin .6s linear infinite; }
		.ot-spinner.active { display: inline-block; }
		@keyframes ot-spin { to { transform: rotate(360deg); } }
		.ot-section { margin-bottom: 1.25rem; }
		.ot-section-title { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--ot-muted); margin-bottom: .375rem; }
		.ot-pre { background: var(--ot-surface); border: 1px solid var(--ot-border); border-radius: 6px; padding: .75rem 1rem; font-family: var(--ot-mono); font-size: .75rem; color: var(--ot-text); white-space: pre-wrap; word-break: break-all; line-height: 1.65; max-height: 200px; overflow-y: auto; margin: 0; }
		.ot-pre.log { max-height: 280px; color: #8b949e; }
		.ot-cols { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
		/* Config layout: form left, YAML preview right */
		.ot-config-layout { display: grid; grid-template-columns: 1fr 340px; gap: 1.25rem; align-items: start; }
		.ot-yaml-panel { position: sticky; top: 1rem; }
		.ot-yaml-panel h4 { font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--ot-muted); margin: 0 0 .5rem; }
		.ot-yaml-pre { background: var(--ot-surface); border: 1px solid var(--ot-border); border-radius: 6px; padding: .75rem 1rem; font-family: var(--ot-mono); font-size: .72rem; color: var(--ot-text); white-space: pre; overflow-x: auto; overflow-y: auto; max-height: calc(100vh - 200px); line-height: 1.6; margin: 0; }
		.ot-yaml-line-changed { background: rgba(210,153,34,.18); color: var(--ot-warn); display: block; margin: 0 -1rem; padding: 0 1rem; border-left: 2px solid var(--ot-warn); }
		.ot-form { background: var(--ot-surface); border: 1px solid var(--ot-border); border-radius: 6px; margin-bottom: 1rem; overflow: hidden; }
		.ot-form h3 { font-size: .85rem; font-weight: 600; color: var(--ot-text); margin: 0; padding: .875rem 1.25rem; display: flex; align-items: center; gap: .5rem; justify-content: space-between; }
		.ot-form-body { padding: 0 1.25rem 1.25rem; }
		.ot-form h3 + .ot-form-grid, .ot-form h3 + .ot-collapsible-content { border-top: 1px solid var(--ot-border); }
		.ot-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem 1.25rem; }
		.ot-field { }
		.ot-field.full { grid-column: 1 / -1; }
		.ot-label { display: block; font-size: .75rem; font-weight: 600; color: var(--ot-muted); margin-bottom: .3rem; text-transform: uppercase; letter-spacing: .06em; }
		.ot-input, .ot-select { width: 100%; font-family: var(--ot-mono); font-size: .85rem; padding: .4rem .75rem; background: var(--ot-bg); border: 1px solid var(--ot-border); border-radius: 6px; color: var(--ot-text); transition: border-color .12s; }
		.ot-input:focus, .ot-select:focus { outline: none; border-color: var(--ot-accent); }
		.ot-input:disabled, .ot-select:disabled { opacity: .5; }
		.ot-pw-wrap { position: relative; }
		.ot-pw-wrap .ot-input { padding-right: 2.2rem; }
		.ot-pw-toggle { position: absolute; right: .5rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--ot-muted); cursor: pointer; font-size: .8rem; padding: 0; line-height: 1; }
		.ot-pw-toggle:hover { color: var(--ot-text); }
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
		@media (max-width: 900px) { .ot-config-layout { grid-template-columns: 1fr; } .ot-yaml-panel { position: static; } }
		@media (max-width: 640px) { .ot-cols { grid-template-columns: 1fr; } .ot-form-grid { grid-template-columns: 1fr; } #ot { padding: 1rem; } }
	`,

	// ── Loaded values snapshot for dirty tracking and YAML diff ──────────────
	_loaded: null,

	// ── loadStatus: lightweight poll — no UCI, just process/interface state ─────
	loadStatus: function() {
		let name = (this._loaded && this._loaded.tun_name) ? this._loaded.tun_name : 's5tun0';
		let port = (this._loaded && this._loaded.s5_port)  ? this._loaded.s5_port  : '1088';
		let logFile = (this._loaded && this._loaded.ms_logfile) ? this._loaded.ms_logfile : '';

		let logPromise;
		if (!logFile || logFile === 'stdout' || logFile === 'stderr') {
			logPromise = fs.exec('logread', ['-e', 'opentether']).then(r => {
				let lines = (r.stdout || '').split('\n').filter(Boolean);
				return lines.slice(-40).join('\n');
			}).catch(() => '');
		} else {
			logPromise = fs.read(logFile).then(content => {
				let lines = (content || '').split('\n').filter(Boolean)
					.filter(l => l.includes('opentether'));
				return lines.slice(-40).join('\n');
			}).catch(() => '(log file not found: ' + logFile + ')');
		}

		return Promise.all([
			fs.exec('adb', ['devices']).catch(() => ({ stdout: '' })),
			fs.exec('adb', ['forward', '--list']).catch(() => ({ stdout: '' })),
			fs.exec('pgrep', ['-f', 'hev-socks5-tunnel']).catch(() => ({ stdout: '' })),
			fs.exec('ip', ['addr', 'show', 'dev', name]).catch(() => ({ stdout: '' })),
			fs.exec('ip', ['route', 'show', 'dev', name]).catch(() => ({ stdout: '' })),
			fs.exec('ip', ['-6', 'route', 'show', 'dev', name]).catch(() => ({ stdout: '' })),
			fs.read('/etc/resolv.conf').catch(() => ''),
			logPromise.then(t => ({ _log: t }))
		]);
	},

	// ── load: full load including UCI config — called at render time only ─────
	load: function() {
		return Promise.all([
			fs.exec('adb', ['devices']).catch(() => ({ stdout: '' })),
			fs.exec('adb', ['forward', '--list']).catch(() => ({ stdout: '' })),
			fs.exec('pgrep', ['-f', 'hev-socks5-tunnel']).catch(() => ({ stdout: '' })),
			fs.exec('ip', ['addr', 'show', 'dev', 's5tun0']).catch(() => ({ stdout: '' })),
			fs.exec('ip', ['route', 'show', 'dev', 's5tun0']).catch(() => ({ stdout: '' })),
			fs.exec('ip', ['-6', 'route', 'show', 'dev', 's5tun0']).catch(() => ({ stdout: '' })),
			fs.read('/etc/resolv.conf').catch(() => ''),
			Promise.all([uci.load('network'), uci.load('opentether')]).then(() => {
				let g = (s, k) => uci.get('opentether', s, k) || '';
				let logFile = g('misc', 'log_file');
				let logPromise;
				if (!logFile || logFile === 'stdout' || logFile === 'stderr') {
					logPromise = fs.exec('logread', ['-e', 'opentether']).then(r => {
						let lines = (r.stdout || '').split('\n').filter(Boolean);
						return lines.slice(-40).join('\n');
					}).catch(() => '');
				} else {
					logPromise = fs.read(logFile).then(content => {
						let lines = (content || '').split('\n').filter(Boolean)
							.filter(l => l.includes('opentether'));
						return lines.slice(-40).join('\n');
					}).catch(() => '(log file not found: ' + logFile + ')');
				}
				let dns = uci.get('network', 'opentether', 'dns') || ['1.1.1.1', '2606:4700:4700::1111'];
				return logPromise.then(logText => ({
					_log: logText,
					tun_name:    g('tunnel','name')          || 's5tun0',
					tun_mtu:     g('tunnel','mtu')           || '1440',
					tun_ipv4:    g('tunnel','ipv4')          || '198.18.0.1',
					tun_ipv6:    g('tunnel','ipv6')          || 'fc00::1',
					tun_mq:      g('tunnel','multi_queue')   || '0',
					tun_post_up: g('tunnel','post_up_script'),
					tun_pre_dn:  g('tunnel','pre_down_script'),
					s5_port:     g('socks5','port')          || '1088',
					s5_addr:     g('socks5','address')       || '127.0.0.1',
					s5_udp:      g('socks5','udp')           || 'tcp',
					s5_udp_addr: g('socks5','udp_address'),
					s5_pipeline: g('socks5','pipeline')      || '0',
					s5_user:     g('socks5','username'),
					s5_pass:     g('socks5','password'),
					s5_mark:     g('socks5','mark')          || '0',
					md_addr:     g('mapdns','address')       || '127.0.0.1',
					md_port:     g('mapdns','port')          || '1088',
					md_network:  g('mapdns','network')       || '100.64.0.0',
					md_netmask:  g('mapdns','netmask')       || '255.192.0.0',
					md_cache:    g('mapdns','cache_size')    || '10000',
					ms_stack:    g('misc','task_stack_size') || '86016',
					ms_buf:      g('misc','tcp_buffer_size') || '65536',
					ms_udp_buf:  g('misc','udp_recv_buffer_size') || '524288',
					ms_udp_copy: g('misc','udp_copy_buffer_nums'),
					ms_sess:     g('misc','max_session_count'),
					ms_ctout:    g('misc','connect_timeout'),
					ms_trwtout:  g('misc','tcp_rw_timeout'),
					ms_urwtout:  g('misc','udp_rw_timeout'),
					ms_logfile:  g('misc','log_file'),
					ms_loglevel: g('misc','log_level') || 'warn',
					ms_pidfile:  g('misc','pid_file'),
					ms_nofile:   g('misc','limit_nofile'),
					net_ipaddr:  uci.get('network','opentether','ipaddr') || '198.18.0.1',
					net_metric:  uci.get('network','opentether','metric') || '10',
					net_dns:     Array.isArray(dns) ? dns.join('\n') : dns
				}));
			}).catch(() => Object.assign({ _log: '' }, DEFAULTS)),
			fs.exec('apk', ['info', 'opentether']).then(r => {
				let m = (r.stdout || '').match(/opentether-([^\s]+)/);
				return m ? m[1] : '';
			}).catch(() => '')
		]);
	},

	// ── YAML generation (mirrors setup.sh generate_yaml) ─────────────────────
	// IMPORTANT: Keep this in sync with generate_yaml() in setup.sh.
	// If you add or change a field here, update setup.sh too.
	buildYaml: function(v) {
		let lines = [];
		let push = (s) => lines.push(s);
		let opt  = (key, val) => { if (val && val !== '0') push('  ' + key + ': ' + val); };
		let optq = (key, val) => { if (val) push("  " + key + ": '" + val + "'"); };

		push('tunnel:');
		push('  name: ' + (v.tun_name || 's5tun0'));
		push('  mtu: ' + (v.tun_mtu || '1440'));
		push('  multi-queue: ' + (v.tun_mq === '1' ? 'true' : 'false'));
		push('  ipv4: ' + (v.tun_ipv4 || '198.18.0.1'));
		push("  ipv6: '" + (v.tun_ipv6 || 'fc00::1') + "'");
		optq('post-up-script',  v.tun_post_up);
		optq('pre-down-script', v.tun_pre_dn);
		push('');
		push('socks5:');
		push('  port: ' + (v.s5_port || '1088'));
		push('  address: ' + (v.s5_addr || '127.0.0.1'));
		push("  udp: '" + (v.s5_udp || 'tcp') + "'");
		optq('udp-address', v.s5_udp_addr);
		if (v.s5_pipeline === '1') push('  pipeline: true');
		optq('username', v.s5_user);
		optq('password', v.s5_pass);
		opt( 'mark',     v.s5_mark);
		push('');
		push('mapdns:');
		push('  address: ' + (v.md_addr    || '127.0.0.1'));
		push('  port: '    + (v.md_port    || '1088'));
		push('  network: ' + (v.md_network || '100.64.0.0'));
		push('  netmask: ' + (v.md_netmask || '255.192.0.0'));
		push('  cache-size: ' + (v.md_cache || '10000'));
		push('');
		push('misc:');
		push('  task-stack-size: '    + (v.ms_stack   || '86016'));
		push('  tcp-buffer-size: '    + (v.ms_buf     || '65536'));
		push('  udp-recv-buffer-size: '+ (v.ms_udp_buf || '524288'));
		opt( 'udp-copy-buffer-nums',   v.ms_udp_copy);
		opt( 'max-session-count',      v.ms_sess);
		opt( 'connect-timeout',        v.ms_ctout);
		opt( 'tcp-read-write-timeout', v.ms_trwtout);
		opt( 'udp-read-write-timeout', v.ms_urwtout);
		optq('log-file',               v.ms_logfile);
		if (v.ms_loglevel && v.ms_loglevel !== 'warn') optq('log-level', v.ms_loglevel);
		optq('pid-file',               v.ms_pidfile);
		opt( 'limit-nofile',           v.ms_nofile);

		return lines;
	},

	// ── Read current form values ──────────────────────────────────────────────
	readForm: function() {
		let get = id => { let el = document.getElementById(id); return el ? el.value.trim() : ''; };
		let chk = id => { let el = document.getElementById(id); return !!(el && el.checked); };
		return {
			tun_name: get('ot-cfg-tun-name'), tun_mtu: get('ot-cfg-tun-mtu'),
			tun_ipv4: get('ot-cfg-tun-ipv4'), tun_ipv6: get('ot-cfg-tun-ipv6'),
			tun_mq:   chk('ot-cfg-tun-mq') ? '1' : '0',
			tun_post_up: get('ot-cfg-tun-post-up'), tun_pre_dn: get('ot-cfg-tun-pre-dn'),
			s5_port: get('ot-cfg-s5-port'), s5_addr: get('ot-cfg-s5-addr'),
			s5_udp: get('ot-cfg-s5-udp'), s5_udp_addr: get('ot-cfg-s5-udp-addr'),
			s5_pipeline: chk('ot-cfg-s5-pipeline') ? '1' : '0',
			s5_user: get('ot-cfg-s5-user'), s5_pass: get('ot-cfg-s5-pass'),
			s5_mark: get('ot-cfg-s5-mark'),
			md_addr: get('ot-cfg-md-addr'), md_port: get('ot-cfg-md-port'),
			md_network: get('ot-cfg-md-network'), md_netmask: get('ot-cfg-md-netmask'),
			md_cache: get('ot-cfg-md-cache'),
			ms_stack: get('ot-cfg-ms-stack'), ms_buf: get('ot-cfg-ms-buf'),
			ms_udp_buf: get('ot-cfg-ms-udp-buf'), ms_udp_copy: get('ot-cfg-ms-udp-copy'),
			ms_sess: get('ot-cfg-ms-sess'), ms_ctout: get('ot-cfg-ms-ctout'),
			ms_trwtout: get('ot-cfg-ms-trwtout'), ms_urwtout: get('ot-cfg-ms-urwtout'),
			ms_logfile: get('ot-cfg-ms-logfile'), ms_loglevel: get('ot-cfg-ms-loglevel'),
			ms_pidfile: get('ot-cfg-ms-pidfile'), ms_nofile: get('ot-cfg-ms-nofile'),
			net_ipaddr: get('ot-cfg-net-ipaddr'), net_metric: get('ot-cfg-net-metric'),
			net_dns: get('ot-cfg-net-dns')
		};
	},

	// ── Update YAML preview and dirty indicator ───────────────────────────────
	updatePreview: function() {
		let current = this.readForm();
		let loaded  = this._loaded || {};

		// Auto-sync blank IP fields
		if (!current.net_ipaddr && current.tun_ipv4) current.net_ipaddr = current.tun_ipv4;
		if (!current.tun_ipv4  && current.net_ipaddr) current.tun_ipv4 = current.net_ipaddr;

		let currentLines = this.buildYaml(current);
		let loadedLines  = this.buildYaml(loaded);

		// Build preview with highlighted changed lines
		let preview = document.getElementById('ot-yaml-preview');
		if (preview) {
			preview.innerHTML = '';
			currentLines.forEach((line, i) => {
				let span = document.createElement('span');
				let changed = line !== loadedLines[i];
				if (changed) span.className = 'ot-yaml-line-changed';
				span.textContent = line + '\n';
				preview.appendChild(span);
			});
		}

		// Dirty indicator — show if any line differs from loaded
		let dirty = currentLines.some((l, i) => l !== loadedLines[i]);
		let dot = document.getElementById('ot-config-dirty');
		if (dot) dot.classList.toggle('visible', dirty);
	},

	// ── Actions ───────────────────────────────────────────────────────────────
	handleServiceAction: function(action) {
		let spinner = document.querySelector('.ot-spinner');
		let btns = document.querySelectorAll('.ot-btn[data-action]');
		if (spinner) spinner.classList.add('active');
		btns.forEach(b => b.disabled = true);
		return fs.exec('/etc/init.d/opentether', [action])
			.then(() => new Promise(r => setTimeout(r, 1500)))
			.then(() => this.loadStatus()).then(d => this.updateStatus(d))
			.catch(e => ui.addNotification(null, E('p', e.message), 'error'))
			.finally(() => {
				if (spinner) spinner.classList.remove('active');
				btns.forEach(b => b.disabled = false);
			});
	},

	handleConnectivityTest: function() {
		let el = document.getElementById('ot-connectivity');
		if (!el) return;
		el.textContent = 'Testing...';
		Promise.all([
			fs.exec('curl', ['-4', '-s', '--max-time', '5', 'https://ifconfig.co']).catch(() => ({ stdout: '' })),
			fs.exec('curl', ['-6', '-s', '--max-time', '5', 'https://ifconfig.co']).catch(() => ({ stdout: '' }))
		]).then(([v4, v6]) => {
			el.textContent =
				'IPv4: ' + ((v4.stdout||'').trim() || 'FAILED') + '\n' +
				'IPv6: ' + ((v6.stdout||'').trim() || 'NOT AVAILABLE');
		});
	},

	handleResetDefaults: function() {
		let set = (id, val) => {
			let el = document.getElementById(id);
			if (!el) return;
			if (el.type === 'checkbox') el.checked = (val === '1' || val === true);
			else el.value = (val !== null && val !== undefined) ? val : '';
		};
		Object.entries(DEFAULTS).forEach(([k, v]) => set('ot-cfg-' + k.replace(/_/g,'-'), v));
		this.updatePreview();
	},

	handleReloadConfig: function() {
		let self = this;
		this.load().then(data => {
			let [,,,,,,,cfg] = data;
			if (!cfg) return;
			self._loaded = Object.assign({}, cfg);
			let set = (id, val) => {
				let el = document.getElementById(id);
				if (!el) return;
				if (el.type === 'checkbox') el.checked = (val === '1' || val === true);
				else el.value = (val !== null && val !== undefined) ? val : '';
			};
			Object.keys(DEFAULTS).forEach(k => set('ot-cfg-' + k.replace(/_/g,'-'), cfg[k] !== undefined ? cfg[k] : ''));
			self.updatePreview();
		});
	},

	handleSaveConfig: function() {
		let status  = document.getElementById('ot-save-status');
		let inputs  = document.querySelectorAll('#ot-panel-config .ot-input, #ot-panel-config .ot-select');
		let saveBtn = document.querySelector('#ot-panel-config .ot-btn.start');
		let v       = this.readForm();

		// Auto-sync blank IP fields
		if (!v.net_ipaddr && v.tun_ipv4) v.net_ipaddr = v.tun_ipv4;
		if (!v.tun_ipv4  && v.net_ipaddr) v.tun_ipv4 = v.net_ipaddr;

		let errors = [];
		if (!v.tun_name.match(/^[a-zA-Z0-9_-]+$/))            errors.push('Tunnel name must be alphanumeric');
		if (isNaN(parseInt(v.tun_mtu)) || +v.tun_mtu < 576 || +v.tun_mtu > 9000) errors.push('MTU must be 576–9000');
		if (!v.tun_ipv4.match(/^\d{1,3}(\.\d{1,3}){3}$/))    errors.push('Tunnel IPv4 must be a valid address');
		if (isNaN(parseInt(v.s5_port)) || +v.s5_port < 1 || +v.s5_port > 65535) errors.push('SOCKS5 port must be 1–65535');
		if (!v.net_ipaddr.match(/^\d{1,3}(\.\d{1,3}){3}$/))   errors.push('Network IP must be a valid IPv4 address');
		if (!v.net_metric.match(/^\d+$/))                      errors.push('Route metric must be a positive integer');
		if (!v.net_dns.trim())                                 errors.push('At least one DNS server is required');
		if (isNaN(+v.ms_stack) || +v.ms_stack < 8192)         errors.push('Task stack must be ≥ 8192');
		if (isNaN(+v.ms_buf)   || +v.ms_buf   < 1024)         errors.push('TCP buffer must be ≥ 1024');
		if (isNaN(+v.ms_udp_buf) || +v.ms_udp_buf < 1024)     errors.push('UDP recv buffer must be ≥ 1024');

		if (errors.length > 0) { if (status) status.textContent = errors[0]; return; }

		inputs.forEach(i => i.disabled = true);
		if (saveBtn) saveBtn.disabled = true;
		if (status) status.textContent = 'Saving...';

		let dns = v.net_dns.split('\n').map(s => s.trim()).filter(Boolean);

		Promise.all([uci.load('network'), uci.load('opentether')]).then(() => {
			let s = (sec, k, val) => uci.set('opentether', sec, k, val);
			s('tunnel','name',              v.tun_name);
			s('tunnel','mtu',               v.tun_mtu);
			s('tunnel','ipv4',              v.tun_ipv4);
			s('tunnel','ipv6',              v.tun_ipv6);
			s('tunnel','multi_queue',       v.tun_mq);
			s('tunnel','post_up_script',    v.tun_post_up);
			s('tunnel','pre_down_script',   v.tun_pre_dn);
			s('socks5','port',              v.s5_port);
			s('socks5','address',           v.s5_addr);
			s('socks5','udp',               v.s5_udp);
			s('socks5','udp_address',       v.s5_udp_addr);
			s('socks5','pipeline',          v.s5_pipeline);
			s('socks5','username',          v.s5_user);
			s('socks5','password',          v.s5_pass);
			s('socks5','mark',              v.s5_mark);
			s('mapdns','address',           v.md_addr);
			s('mapdns','port',              v.md_port);
			s('mapdns','network',           v.md_network);
			s('mapdns','netmask',           v.md_netmask);
			s('mapdns','cache_size',        v.md_cache);
			s('misc','task_stack_size',     v.ms_stack);
			s('misc','tcp_buffer_size',     v.ms_buf);
			s('misc','udp_recv_buffer_size',v.ms_udp_buf);
			s('misc','udp_copy_buffer_nums',v.ms_udp_copy);
			s('misc','max_session_count',   v.ms_sess);
			s('misc','connect_timeout',     v.ms_ctout);
			s('misc','tcp_rw_timeout',      v.ms_trwtout);
			s('misc','udp_rw_timeout',      v.ms_urwtout);
			s('misc','log_file',            v.ms_logfile);
			s('misc','log_level',           v.ms_loglevel);
			s('misc','pid_file',            v.ms_pidfile);
			s('misc','limit_nofile',        v.ms_nofile);
			uci.set('network','opentether','ipaddr',  v.net_ipaddr);
			uci.set('network','opentether','metric',  v.net_metric);
			uci.set('network','opentether','device',  v.tun_name);
			uci.unset('network','opentether','dns');
			uci.set('network','opentether','dns', dns);
			return uci.save();
		}).then(() => uci.apply())
		.then(() => { if (status) status.textContent = 'Saved — applying...'; })
		.then(() => fs.exec('/usr/lib/opentether/setup.sh', ['apply']))
		.then(() => {
			this._loaded = Object.assign({}, v);
			this.updatePreview();
			if (status) status.textContent = 'Saved successfully';
			setTimeout(() => { if (status) status.textContent = ''; }, 3000);
		}).catch(e => {
			if (status) status.textContent = 'Error: ' + e.message;
		}).finally(() => {
			inputs.forEach(i => i.disabled = false);
			if (saveBtn) saveBtn.disabled = false;
		});
	},

	// ── DOM helpers ───────────────────────────────────────────────────────────
	dot:  function(ok) { return E('span', { class: 'ot-dot ' + (ok ? 'ok' : 'err') }, '●'); },
	badge: function(ok, yes, no) { return E('span', { class: 'ot-badge ' + (ok ? 'ok' : 'err') }, ok ? yes : no); },
	card: function(label, ok, yes, no) {
		return E('div', { class: 'ot-card' }, [
			E('div', { class: 'ot-card-label' }, label),
			E('div', { class: 'ot-card-value' }, [this.dot(ok), this.badge(ok, yes, no)])
		]);
	},
	section: function(title, content) {
		return E('div', { class: 'ot-section' }, [E('div', { class: 'ot-section-title' }, title), content]);
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
	pwInp: function(id, val) {
		let self = this;
		let input = E('input', { class: 'ot-input', id, type: 'password', value: val||'', input: () => self.updatePreview() });
		let toggle = E('button', {
			class: 'ot-pw-toggle', type: 'button',
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
	fld: function(label, id, input, hint, full) {
		let ch = [E('label', { class: 'ot-label', for: id }, label), input];
		if (hint) ch.push(E('div', { class: 'ot-hint' }, hint));
		return E('div', { class: 'ot-field' + (full ? ' full' : '') }, ch);
	},
	collapsibleStatus: function(title, content, collapsed) {
		let inner = E('div', { class: 'ot-collapsible-content' + (collapsed ? ' collapsed' : '') });
		if (collapsed) inner.style.maxHeight = '0';
		else inner.style.maxHeight = '9999px';
		inner.appendChild(content);
		let arrow = collapsed ? '▶' : '▼';
		let arrowSpan = E('span', {}, arrow + ' ');
		let header = E('div', {
			class: 'ot-section-title',
			style: 'cursor:pointer; user-select:none; display:flex; align-items:center; gap:.3rem; margin-bottom:.375rem',
			click: function() {
				let isCollapsed = inner.classList.contains('collapsed');
				inner.classList.toggle('collapsed', !isCollapsed);
				inner.style.maxHeight = isCollapsed ? '9999px' : '0';
				arrowSpan.textContent = isCollapsed ? '▼ ' : '▶ ';
			}
		}, [arrowSpan, title]);
		return E('div', { class: 'ot-section' }, [header, inner]);
	},

	collapsibleSection: function(title, content, collapsed) {
		let inner = E('div', { class: 'ot-collapsible-content' + (collapsed ? ' collapsed' : '') });
		if (collapsed) inner.style.maxHeight = '0';
		else inner.style.maxHeight = '9999px';
		let body = E('div', { class: 'ot-form-body' });
		content.forEach(el => body.appendChild(el));
		inner.appendChild(body);
		let arrow = collapsed ? '▶' : '▼';
		let arrowSpan = E('span', {}, arrow + ' ');
		let h3 = E('h3', { style: 'cursor:pointer; user-select:none', click: function() {
			let isCollapsed = inner.classList.contains('collapsed');
			inner.classList.toggle('collapsed', !isCollapsed);
			inner.style.maxHeight = isCollapsed ? '9999px' : '0';
			arrowSpan.textContent = isCollapsed ? '▼ ' : '▶ ';
		}}, [arrowSpan, title]);
		return E('div', { class: 'ot-form' }, [h3, inner]);
	},

	collapsible: function(label, content, collapsed) {
		let inner = E('div', { class: 'ot-collapsible-content' + (collapsed ? ' collapsed' : '') });
		inner.style.maxHeight = collapsed ? '0' : '9999px';
		content.forEach(el => inner.appendChild(el));
		let arrowNode = document.createTextNode(collapsed ? '▶' : '▼');
		let btn = E('button', {
			class: 'ot-collapsible-btn',
			click: function() {
				let isCollapsed = inner.classList.contains('collapsed');
				inner.classList.toggle('collapsed', !isCollapsed);
				inner.style.maxHeight = isCollapsed ? '9999px' : '0';
				arrowNode.textContent = isCollapsed ? '▼' : '▶';
			}
		});
		btn.appendChild(arrowNode);
		btn.appendChild(document.createTextNode(' ' + label));
		return [btn, inner];
	},

	updateStatus: function(data) {
		let [adb, fwd, pid, iface, route4, route6, resolv, logObj, cfg] = data;
		// loadStatus returns logObj = {_log: text}; load() returns cfg with ._log
		let log = logObj && logObj._log !== undefined ? logObj._log : (cfg ? cfg._log : '');
		let c = cfg || this._loaded || {};
		let authorized = (adb.stdout||'').match(/device$/m) != null;
		let port       = c.s5_port  || '1088';
		let name       = c.tun_name || 's5tun0';
		let forwarded  = (fwd.stdout||'').includes(port);
		let tunnel_up  = (pid.stdout||'').trim() !== '';
		let iface_up   = (iface.stdout||'').trim() !== '';
		let tunnel_pid = (pid.stdout||'').trim();
		let grid = document.getElementById('ot-status-grid');
		if (grid) grid.replaceWith(this.renderGrid(authorized, forwarded, tunnel_up, iface_up, tunnel_pid, port, name));
		[['ot-route4',(route4.stdout||'').trim()],['ot-route6',(route6.stdout||'').trim()],
		 ['ot-adb',(adb.stdout||'').replace(/^List of devices attached\s*/,'').trim()],
		 ['ot-resolv',(resolv||'').trim()],
		 ['ot-iface',(iface.stdout||'').trim()],['ot-log', log || '']
		].forEach(([id,val]) => { let el = document.getElementById(id); if (el) el.textContent = val||'(none)'; });
	},

	renderGrid: function(authorized, forwarded, tunnel_up, iface_up, tunnel_pid, port, name) {
		let fwdLabel = 'tcp:' + (port || '1088') + ' active';
		let ifaceLabel = name || 's5tun0';
		return E('div', { class: 'ot-grid', id: 'ot-status-grid' }, [
			this.card('ADB Device',            authorized, 'Authorized',       'Not connected'),
			this.card('Port Forward',          forwarded,  fwdLabel,           'Not forwarded'),
			this.card('Tunnel',                tunnel_up,  'Running · ' + tunnel_pid, 'Stopped'),
			this.card('Interface ' + ifaceLabel, iface_up, 'Up',              'Down')
		]);
	},

	pollInterval: null,
	startPolling: function() {
		let self = this;
		this.pollInterval = setInterval(() => self.loadStatus().then(d => self.updateStatus(d)), 5000);
		document.addEventListener('visibilitychange', () => {
			if (!document.hidden) self.loadStatus().then(d => self.updateStatus(d));
		});
	},

	// ── Render ────────────────────────────────────────────────────────────────
	render: function(data) {
		if (!data) return this.load().then(d => this.render(d));
		let [adb, fwd, pid, iface, route4, route6, resolv, cfg, version] = data;

		let authorized = (adb.stdout||'').match(/device$/m) != null;
		let port       = (cfg && cfg.s5_port) ? cfg.s5_port : '1088';
		let name       = (cfg && cfg.tun_name) ? cfg.tun_name : 's5tun0';
		let forwarded  = (fwd.stdout||'').includes(port);
		let tunnel_up  = (pid.stdout||'').trim() !== '';
		let iface_up   = (iface.stdout||'').trim() !== '';
		let tunnel_pid = (pid.stdout||'').trim();
		let c = cfg || {};
		this._loaded = Object.assign({}, c);

		if (!document.getElementById('ot-styles')) {
			let st = document.createElement('style'); st.id = 'ot-styles';
			st.textContent = this.css; document.head.appendChild(st);
		}

		let self = this;
		let up = () => self.updatePreview();

		// ── Config form sections ──────────────────────────────────────────────
		let formLeft = E('div', {}, [

			// Tunnel — expanded by default
			this.collapsibleSection('Tunnel Interface', [
				E('div', { class: 'ot-form-grid' }, [
					this.fld('Interface Name', 'ot-cfg-tun-name',    this.inp('ot-cfg-tun-name','text',  c.tun_name,'',up), 'TUN device name'),
					this.fld('MTU',            'ot-cfg-tun-mtu',     this.inp('ot-cfg-tun-mtu', 'number',c.tun_mtu, '',up), '1440 recommended for ADB-TCP'),
					this.fld('IPv4 Address',   'ot-cfg-tun-ipv4',    this.inp('ot-cfg-tun-ipv4','text',  c.tun_ipv4,'',up)),
					this.fld('IPv6 Address',   'ot-cfg-tun-ipv6',    this.inp('ot-cfg-tun-ipv6','text',  c.tun_ipv6,'',up)),
					E('div', { class: 'ot-field full' }, this.chkrow('ot-cfg-tun-mq','Multi-queue (improves throughput on multi-core routers)', c.tun_mq==='1', up)),
				]),
				...this.collapsible('Advanced', [
					E('div', { class: 'ot-form-grid', style: 'margin-top:.75rem' }, [
						this.fld('Post-up Script',  'ot-cfg-tun-post-up', this.inp('ot-cfg-tun-post-up','text',c.tun_post_up,'(optional)',up), 'Script to run after tunnel comes up'),
						this.fld('Pre-down Script', 'ot-cfg-tun-pre-dn',  this.inp('ot-cfg-tun-pre-dn', 'text',c.tun_pre_dn, '(optional)',up), 'Script to run before tunnel goes down'),
					])
				], true)
			], true),

			// SOCKS5 — expanded by default
			this.collapsibleSection('SOCKS5 Proxy', [
				E('div', { class: 'ot-form-grid' }, [
					this.fld('Address', 'ot-cfg-s5-addr', this.inp('ot-cfg-s5-addr','text',   c.s5_addr,'',up), '127.0.0.1 for ADB forward'),
					this.fld('Port',    'ot-cfg-s5-port', this.inp('ot-cfg-s5-port','number', c.s5_port,'',up), "Must match phone's proxy port"),
					this.fld('UDP Mode','ot-cfg-s5-udp',
						this.sel('ot-cfg-s5-udp', [['tcp','tcp — relay UDP over TCP'],['udp','udp — native UDP']], c.s5_udp, up),
						'tcp required when phone is the upstream'),
				]),
				...this.collapsible('Advanced', [
					E('div', { class: 'ot-form-grid', style: 'margin-top:.75rem' }, [
						this.fld('UDP Address Override','ot-cfg-s5-udp-addr', this.inp('ot-cfg-s5-udp-addr','text',    c.s5_udp_addr,'(optional)',up), 'Override UDP address from SOCKS5 server'),
						this.fld('Username',            'ot-cfg-s5-user',     this.inp('ot-cfg-s5-user',    'text',    c.s5_user,    '(optional)',up)),
						this.fld('Password',            'ot-cfg-s5-pass',     this.pwInp('ot-cfg-s5-pass',  c.s5_pass)),
						this.fld('Socket Mark',         'ot-cfg-s5-mark',     this.inp('ot-cfg-s5-mark',    'number',  c.s5_mark,    '',up), 'Fwmark for bypass routing (0 = disabled)'),
						E('div', { class: 'ot-field full' }, this.chkrow('ot-cfg-s5-pipeline','Pipeline mode (batch SOCKS5 handshakes for lower latency)', c.s5_pipeline==='1', up)),
					])
				], true)
			], true),

			// Mapped DNS — collapsed by default
			this.collapsibleSection('Mapped DNS', [
				E('div', { class: 'ot-form-grid' }, [
					this.fld('Address',    'ot-cfg-md-addr',    this.inp('ot-cfg-md-addr',   'text',  c.md_addr,  '',up), 'DNS server address inside the tunnel'),
					this.fld('Port',       'ot-cfg-md-port',    this.inp('ot-cfg-md-port',   'number',c.md_port,  '',up), 'DNS server port'),
					this.fld('Network',    'ot-cfg-md-network', this.inp('ot-cfg-md-network','text',  c.md_network,'',up),'Mapped IP network base'),
					this.fld('Netmask',    'ot-cfg-md-netmask', this.inp('ot-cfg-md-netmask','text',  c.md_netmask,'',up),'Mapped IP network mask'),
					this.fld('Cache Size', 'ot-cfg-md-cache',   this.inp('ot-cfg-md-cache',  'number',c.md_cache, '',up), 'Number of DNS entries to cache'),
				])
			], true),

			// Network / Routing — collapsed by default
			this.collapsibleSection('Network / Routing', [
				E('div', { class: 'ot-form-grid' }, [
					this.fld('Tunnel IP (UCI)','ot-cfg-net-ipaddr', this.inp('ot-cfg-net-ipaddr','text',  c.net_ipaddr,'',up), 'Leave blank to sync with Tunnel IPv4'),
					this.fld('Route Metric',   'ot-cfg-net-metric', this.inp('ot-cfg-net-metric','number',c.net_metric,'',up), 'Lower = higher priority. 10 beats default WAN.'),
					this.fld('DNS Servers', 'ot-cfg-net-dns',
						E('textarea', { class: 'ot-input', id: 'ot-cfg-net-dns', rows: '3', style: 'resize:vertical', input: up },
							Array.isArray(c.net_dns) ? c.net_dns.join('\n') : (c.net_dns||'1.1.1.1')),
						'One per line', true)
				])
			], true),

			// Performance & Misc — collapsed by default
			this.collapsibleSection('Performance & Misc', [
				E('div', { class: 'ot-form-grid' }, [
					this.fld('Task Stack (bytes)',      'ot-cfg-ms-stack',   this.inp('ot-cfg-ms-stack',   'number',c.ms_stack,  '',up),'Default 86016. Min 8192.'),
					this.fld('TCP Buffer (bytes)',      'ot-cfg-ms-buf',     this.inp('ot-cfg-ms-buf',     'number',c.ms_buf,    '',up),'Default 65536.'),
					this.fld('UDP Recv Buffer (bytes)', 'ot-cfg-ms-udp-buf', this.inp('ot-cfg-ms-udp-buf', 'number',c.ms_udp_buf,'',up),'Default 524288 (SO_RCVBUF).'),
					this.fld('UDP Copy Buffers',        'ot-cfg-ms-udp-copy',this.inp('ot-cfg-ms-udp-copy','number',c.ms_udp_copy,'(optional)',up),'1500 bytes each'),
					this.fld('Max Sessions',            'ot-cfg-ms-sess',    this.inp('ot-cfg-ms-sess',    'number',c.ms_sess,   '0 = unlimited',up)),
					this.fld('Connect Timeout (ms)',    'ot-cfg-ms-ctout',   this.inp('ot-cfg-ms-ctout',   'number',c.ms_ctout,  '(optional)',up)),
					this.fld('TCP R/W Timeout (ms)',    'ot-cfg-ms-trwtout', this.inp('ot-cfg-ms-trwtout', 'number',c.ms_trwtout,'(optional)',up)),
					this.fld('UDP R/W Timeout (ms)',    'ot-cfg-ms-urwtout', this.inp('ot-cfg-ms-urwtout', 'number',c.ms_urwtout,'(optional)',up)),
					this.fld('Log Level', 'ot-cfg-ms-loglevel',
						this.sel('ot-cfg-ms-loglevel',[['debug','debug'],['info','info'],['warn','warn'],['error','error']], c.ms_loglevel||'warn', up)),
					this.fld('Log File',     'ot-cfg-ms-logfile', this.inp('ot-cfg-ms-logfile','text',  c.ms_logfile, 'stdout, stderr, or path',up)),
					this.fld('PID File',     'ot-cfg-ms-pidfile', this.inp('ot-cfg-ms-pidfile','text',  c.ms_pidfile, '(optional)',up),'Run as daemon'),
					this.fld('Limit nofile', 'ot-cfg-ms-nofile',  this.inp('ot-cfg-ms-nofile', 'number',c.ms_nofile,  '(optional)',up),'rlimit for open file descriptors'),
				])
			], true),

			E('div', { class: 'ot-save' }, [
				E('button', { class: 'ot-btn start', click: () => self.handleSaveConfig() }, 'Save & Apply'),
				E('button', { class: 'ot-btn warn-btn', click: () => self.handleResetDefaults() }, 'Reset to Defaults'),
				E('button', { class: 'ot-btn', click: () => self.handleReloadConfig() }, 'Reload from Config'),
				E('span', { class: 'ot-save-status', id: 'ot-save-status' }, '')
			])
		]);

		// ── YAML preview ──────────────────────────────────────────────────────
		let yamlPanel = E('div', { class: 'ot-yaml-panel' }, [
			E('h4', {}, 'YAML Preview'),
			E('pre', { class: 'ot-yaml-pre', id: 'ot-yaml-preview' })
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

			E('div', { class: 'ot-panel active', id: 'ot-panel-status' }, [

				// Top row: [cards + test | controls]
				E('div', { class: 'ot-top-row' }, [
					E('div', {}, [
						this.renderGrid(authorized, forwarded, tunnel_up, iface_up, tunnel_pid, port, name),
						E('div', { style: 'display:flex; align-items:flex-start; gap:.5rem; margin-top:.75rem' }, [
							E('button', { class: 'ot-btn', style: 'flex-shrink:0', click: () => self.handleConnectivityTest() }, 'Run Test'),
							E('div', { class: 'ot-test-pre', id: 'ot-connectivity', style: 'flex:1' }, '—'),
						]),
					]),
					E('div', { class: 'ot-controls' }, [
						E('button', { class: 'ot-btn start', 'data-action': 'start',   click: () => self.handleServiceAction('start')   }, 'Start'),
						E('button', { class: 'ot-btn stop',  'data-action': 'stop',    click: () => self.handleServiceAction('stop')    }, 'Stop'),
						E('button', { class: 'ot-btn',       'data-action': 'restart', click: () => self.handleServiceAction('restart') }, 'Restart'),
						E('div', { class: 'ot-spinner', style: 'margin: .2rem auto' }),
						E('button', { class: 'ot-btn', click: () => self.loadStatus().then(d => self.updateStatus(d)) }, '↻ Refresh'),
					]),
				]),

				// Network Details — routes, ADB, DNS in one collapsible
				this.collapsibleStatus('Network Details', E('div', {}, [
					E('div', { class: 'ot-cols' }, [
						this.section('IPv4 Route',  E('pre', { class: 'ot-pre', id: 'ot-route4' }, (route4.stdout||'').trim()||'(none)')),
						this.section('IPv6 Route',  E('pre', { class: 'ot-pre', id: 'ot-route6' }, (route6.stdout||'').trim()||'(none)')),
					]),
					E('div', { class: 'ot-cols', style: 'margin-top:.75rem' }, [
						this.section('ADB Devices', E('pre', { class: 'ot-pre', id: 'ot-adb' },
							(adb.stdout||'').replace(/^List of devices attached\s*/,'').trim()||'(none)')),
						this.section('DNS Resolver', E('pre', { class: 'ot-pre', id: 'ot-resolv' }, (resolv||'').trim()||'(none)')),
					]),
				]), true),

				// Interface — collapsed by default
				E('div', { style: 'margin-top:.75rem' },
					this.collapsibleStatus('Interface Details',
						E('pre', { class: 'ot-pre', id: 'ot-iface' }, (iface.stdout||'').trim()||'s5tun0 not found'), true)
				),

				// Log
				E('div', { style: 'margin-top:.75rem' },
					this.collapsibleStatus('Log',
						E('pre', { class: 'ot-pre log', id: 'ot-log' }, (c._log||'').trim()||'(no log entries)'), false)
				)
			]),

			E('div', { class: 'ot-panel', id: 'ot-panel-config', autocomplete: 'off' }, [
				E('div', { class: 'ot-config-layout' }, [formLeft, yamlPanel])
			])
		]);

		setTimeout(() => { this.updatePreview(); this.startPolling(); }, 100);
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
	handleSave: null,
	handleReset: null
});
