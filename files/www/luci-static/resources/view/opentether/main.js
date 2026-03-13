'use strict';
'require view';
'require fs';
'require ui';
'require uci';

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
		.ot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .75rem; }
		.ot-card { background: var(--ot-surface); border: 1px solid var(--ot-border); border-radius: 6px; padding: .875rem 1rem; }
		.ot-card-label { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--ot-muted); margin-bottom: .375rem; }
		.ot-card-value { font-size: .9rem; display: flex; align-items: center; gap: .5rem; font-family: var(--ot-mono); }
		.ot-dot { font-size: .65rem; }
		.ot-dot.ok { color: var(--ot-ok); } .ot-dot.err { color: var(--ot-err); }
		.ot-badge { display: inline-block; font-size: .7rem; font-weight: 600; padding: .15rem .5rem; border-radius: 2em; font-family: var(--ot-mono); }
		.ot-badge.ok  { background: rgba(63,185,80,.15);  color: var(--ot-ok);  border: 1px solid rgba(63,185,80,.3); }
		.ot-badge.err { background: rgba(248,81,73,.12);  color: var(--ot-err); border: 1px solid rgba(248,81,73,.3); }
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
		.ot-top-row { display: grid; grid-template-columns: 1fr auto; gap: 1rem; margin-bottom: 1.25rem; align-items: start; }
		.ot-controls { display: flex; flex-direction: column; gap: .4rem; align-items: stretch; min-width: 90px; }
		.ot-controls .ot-btn { text-align: center; }
		.ot-test-pre { font-family: var(--ot-mono); font-size: .75rem; color: var(--ot-text); background: var(--ot-surface); border: 1px solid var(--ot-border); border-radius: 6px; padding: .4rem .75rem; margin-top: .4rem; white-space: pre-wrap; line-height: 1.5; }
		.ot-collapsible-btn { background: none; border: none; color: var(--ot-muted); cursor: pointer; font-size: .75rem; font-family: inherit; padding: 0; display: flex; align-items: center; gap: .3rem; }
		.ot-collapsible-btn:hover { color: var(--ot-text); }
		.ot-collapsible-content { overflow: hidden; transition: max-height .2s ease; }
		.ot-collapsible-content.collapsed { max-height: 0 !important; }
		.ot-status-section { border: 1px solid var(--ot-border); border-radius: 6px; overflow: hidden; margin-bottom: .75rem; }
		.ot-status-sec-hdr { display: flex; align-items: center; gap: .35rem; padding: .45rem .75rem; cursor: pointer; user-select: none; background: var(--ot-surface); }
		.ot-status-sec-hdr:hover { filter: brightness(1.1); }
		.ot-status-sec-arrow { font-size: .65rem; color: var(--ot-muted); }
		.ot-status-sec-title { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--ot-muted); }
		.ot-status-sec-body { padding: .6rem .75rem; }
		.ot-status-sec-body.collapsed { display: none; }
		@media (max-width: 640px) { .ot-cols { grid-template-columns: 1fr; } #ot { padding: 1rem; } .ot-top-row { grid-template-columns: 1fr; } }
	`,

	_loaded: null,

	loadStatus: function() {
		let name    = (this._loaded && this._loaded.tun_name) ? this._loaded.tun_name : 's5tun0';
		let port    = (this._loaded && this._loaded.s5_port)  ? this._loaded.s5_port  : '1088';
		let logFile = (this._loaded && this._loaded.ms_logfile) ? this._loaded.ms_logfile : '';
		let logPromise;
		if (!logFile || logFile === 'stdout' || logFile === 'stderr') {
			logPromise = fs.exec('logread', ['-e', 'opentether']).then(r => {
				let lines = (r.stdout || '').split('\n').filter(Boolean);
				return lines.slice(-40).join('\n');
			}).catch(() => '');
		} else {
			logPromise = fs.read(logFile).then(content => {
				return (content || '').split('\n').filter(Boolean)
					.filter(l => l.includes('opentether')).slice(-40).join('\n');
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
						return (content || '').split('\n').filter(Boolean)
							.filter(l => l.includes('opentether')).slice(-40).join('\n');
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
			}).catch(() => Object.assign({ _log: '' }, {
				tun_name: 's5tun0', tun_mtu: '1440', tun_ipv4: '198.18.0.1', tun_ipv6: 'fc00::1', tun_mq: '0',
				tun_post_up: '', tun_pre_dn: '',
				s5_port: '1088', s5_addr: '127.0.0.1', s5_udp: 'tcp', s5_udp_addr: '', s5_pipeline: '0',
				s5_user: '', s5_pass: '', s5_mark: '0',
				md_addr: '127.0.0.1', md_port: '1088', md_network: '100.64.0.0', md_netmask: '255.192.0.0', md_cache: '10000',
				ms_stack: '86016', ms_buf: '65536', ms_udp_buf: '524288', ms_udp_copy: '', ms_sess: '',
				ms_ctout: '', ms_trwtout: '', ms_urwtout: '', ms_logfile: '', ms_loglevel: 'warn',
				ms_pidfile: '', ms_nofile: '',
				net_ipaddr: '198.18.0.1', net_metric: '10', net_dns: '1.1.1.1\n2606:4700:4700::1111'
			})),
			fs.exec('apk', ['info', 'opentether']).then(r => {
				let m = (r.stdout || '').match(/opentether-([^\s]+)/);
				return m ? m[1] : '';
			}).catch(() => '')
		]);
	},

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

	statusSection: function(title, content, collapsed) {
		let body = E('div', { class: 'ot-status-sec-body' + (collapsed ? ' collapsed' : '') });
		if (typeof content === 'string') body.appendChild(document.createTextNode(content));
		else body.appendChild(content);
		let arrowNode = document.createTextNode(collapsed ? '▶' : '▼');
		let hdr = E('div', { class: 'ot-status-sec-hdr', click: function() {
			let isCollapsed = body.classList.toggle('collapsed');
			arrowNode.textContent = isCollapsed ? '▶' : '▼';
		}}, [
			E('span', { class: 'ot-status-sec-arrow' }, [arrowNode]),
			E('span', { class: 'ot-status-sec-title' }, title)
		]);
		return E('div', { class: 'ot-status-section' }, [hdr, body]);
	},

	updateStatus: function(data) {
		let [adb, fwd, pid, iface, route4, route6, resolv, logObj, cfg] = data;
		let log = logObj && logObj._log !== undefined ? logObj._log : (cfg ? cfg._log : '');
		let c   = cfg || this._loaded || {};
		let port = c.s5_port  || '1088';
		let name = c.tun_name || 's5tun0';
		let authorized = (adb.stdout||'').match(/device$/m) != null;
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
		return E('div', { class: 'ot-grid', id: 'ot-status-grid' }, [
			this.card('ADB Device',            authorized, 'Authorized',             'Not connected'),
			this.card('Port Forward',          forwarded,  'tcp:' + (port||'1088') + ' active', 'Not forwarded'),
			this.card('Tunnel',                tunnel_up,  'Running · ' + tunnel_pid,'Stopped'),
			this.card('Interface ' + (name||'s5tun0'), iface_up, 'Up', 'Down')
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

	render: function(data) {
		if (!data) return this.load().then(d => this.render(d));
		let [adb, fwd, pid, iface, route4, route6, resolv, cfg, version] = data;
		let c = cfg || {};
		this._loaded = Object.assign({}, c);
		let port = (c.s5_port)  || '1088';
		let name = (c.tun_name) || 's5tun0';
		let authorized = (adb.stdout||'').match(/device$/m) != null;
		let forwarded  = (fwd.stdout||'').includes(port);
		let tunnel_up  = (pid.stdout||'').trim() !== '';
		let iface_up   = (iface.stdout||'').trim() !== '';
		let tunnel_pid = (pid.stdout||'').trim();

		if (!document.getElementById('ot-styles')) {
			let st = document.createElement('style'); st.id = 'ot-styles';
			st.textContent = this.css; document.head.appendChild(st);
		}
		let self = this;

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

			// ── Status panel ─────────────────────────────────────────────────
			E('div', { class: 'ot-panel active', id: 'ot-panel-status' }, [
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
				this.statusSection('Network Details', E('div', {}, [
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
				this.statusSection('Interface Details',
					E('pre', { class: 'ot-pre', id: 'ot-iface' }, (iface.stdout||'').trim()||'s5tun0 not found'), true),
				this.statusSection('Log',
					E('pre', { class: 'ot-pre log', id: 'ot-log' }, (c._log||'').trim()||'(no log entries)'), false),
			]),

			// ── Config panel (placeholder — populated in next commit) ─────────
			E('div', { class: 'ot-panel', id: 'ot-panel-config' },
				E('p', { style: 'color:var(--ot-muted);padding:1rem' }, 'Configuration coming soon.')
			)
		]);

		setTimeout(() => this.startPolling(), 100);
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
