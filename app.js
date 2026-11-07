(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const storageKey = 'zhoumoji-demo-v1';
  const categoryInfo = {
    餐饮: ['coffee', 'rose'],
    零售: ['shop', 'lilac'],
    活动: ['sparkles', 'mint'],
    家教: ['book', 'amber'],
    其他: ['grid', 'blue'],
  };
  const campuses = {
    'xia-sha': '下沙大学城',
    'zhejiang-gongshang': '浙江工商大学',
    'hangzhou-dianzi': '杭州电子科技大学',
    'zhejiang-ligong': '浙江理工大学',
  };
  const statusLabels = { pending: '待商家确认', approved: '已录用', declined: '未录用', cancelled: '已撤回' };
  const validViews = ['jobs', 'applications', 'favorites', 'merchant'];
  const isActiveApplication = ({ status }) => status === 'pending' || status === 'approved';
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#icon-${name}"/></svg>`;
  const pad = (value) => String(value).padStart(2, '0');
  const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const viewDate = (date) => `${date.getMonth() + 1}.${pad(date.getDate())}`;

  function nextWeekend() {
    const saturday = new Date();
    let offset = (6 - saturday.getDay() + 7) % 7;
    if (!offset && saturday.getHours() >= 8) offset = 7;
    saturday.setDate(saturday.getDate() + offset);
    saturday.setHours(0, 0, 0, 0);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    return { sat: saturday, sun: sunday };
  }

  const weekend = nextWeekend();
  const shift = (day, start, end, headcount) => ({ date: dateKey(weekend[day]), start, end, headcount });
  const seedJobs = [
    { id: 'qinghe', title: '周末咖啡店店员', merchant: '青禾咖啡 · 下沙店', category: '餐饮', campus: 'hangzhou-dianzi', address: '下沙学源街 88 号', distance: 0.8, pay: 26, settlement: '日结', tags: ['零经验可', '提供工作餐'], shifts: [shift('sat', '10:00', '16:00', 3), shift('sun', '10:00', '16:00', 2)], description: '协助点单、出餐和整理桌面。到岗后由值班店长带教，穿深色长裤和平底鞋即可。每个班次设 30 分钟轮流用餐时间，按完整班次结算。' },
    { id: 'shiye', title: '周末书店理货员', merchant: '拾页书房 · 文泽路店', category: '零售', campus: 'zhejiang-ligong', address: '文泽路地铁站 A 口旁', distance: 1.2, pay: 24, settlement: '周结', tags: ['室内工作', '零经验可'], owned: true, shifts: [shift('sat', '13:00', '18:00', 2)], description: '根据书架标识整理新书和归位图书，协助顾客查找书目。需短距离搬运少量书箱，可两人配合。下周二统一结算。' },
    { id: 'yunji', title: '周末市集活动协助', merchant: '云集周末市集', category: '活动', campus: 'zhejiang-gongshang', address: '金沙湖商业街东广场', distance: 1.6, pay: 32, settlement: '日结', tags: ['团队协作', '提供饮水'], shifts: [shift('sun', '14:00', '19:00', 4)], description: '协助摊主签到，引导访客并整理公共休息区。活动在户外开展，请自备舒适鞋服。到岗前有 15 分钟简短培训，计入班次。' },
    { id: 'xingya', title: '小学作业辅导', merchant: '星芽成长中心', category: '家教', campus: 'zhejiang-gongshang', address: '学林街社区活动中心二楼', distance: 2.2, pay: 48, settlement: '周结', tags: ['有辅导经验优先', '小班辅导'], shifts: [shift('sun', '09:00', '12:00', 2)], description: '在主带老师协助下陪伴四至六年级学生完成作业，讲解基础数学题。岗前由老师介绍学生情况和当天任务。' },
    { id: 'bantang', title: '烘焙店打包员', merchant: '半糖烘焙 · 高沙店', category: '餐饮', campus: 'hangzhou-dianzi', address: '高沙商业街 26 号', distance: 0.6, pay: 25, settlement: '日结', tags: ['零经验可', '两天可选'], shifts: [shift('sat', '09:00', '13:00', 2), shift('sun', '09:00', '13:00', 2)], description: '按订单清单打包装袋，粘贴口味标识并补充前台包材。店内提供围裙和一次性手套，工作内容以非烹饪环节为主。' },
    { id: 'xiaozhua', title: '宠物店照看助理', merchant: '一只小爪宠物店', category: '其他', campus: 'zhejiang-ligong', address: '学源街邻里中心一楼', distance: 1.4, pay: 28, settlement: '日结', tags: ['喜欢小动物', '店员带教'], shifts: [shift('sun', '12:00', '17:00', 1)], description: '协助员工补充饮水、清洁活动区和整理用品。经验不限，需能在有猫狗的环境中工作。由员工负责喂药、美容及其他专业操作。' },
  ];
  const sampleCandidate = {
    id: 'sample-candidate', applicant: '林同学', jobId: 'shiye', shift: seedJobs[1].shifts[0], status: 'pending',
  };

  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved) {
        if (saved.candidate.shift.date !== sampleCandidate.shift.date) saved.candidate = { ...sampleCandidate };
        return saved;
      }
    } catch {
      // Storage may be unavailable in restricted browsers.
    }
    return { favorites: [], applications: [], published: [], closed: [], candidate: { ...sampleCandidate } };
  }

  const state = readState();
  let category = 'all';
  let currentView = 'jobs';
  let openDetail = null;
  let dialogTrigger = null;
  let toastTimer;

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // The demo remains usable for the current page session.
    }
  }

  function notify(message) {
    const toast = $('toast');
    window.clearTimeout(toastTimer);
    toast.hidden = false;
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.textContent = '';
      toast.hidden = true;
    }, 3500);
  }

  const allJobs = () => [...state.published, ...seedJobs];
  const getJob = (id) => allJobs().find((job) => job.id === id);
  const isClosed = (id) => state.closed.includes(id);
  const shiftKey = (item) => `${item.date}/${item.start}/${item.end}`;
  const shiftDay = (item) => new Date(`${item.date}T12:00:00`).getDay() === 6 ? 'sat' : 'sun';
  const dayName = (item) => shiftDay(item) === 'sat' ? '周六' : '周日';
  const shiftDate = (item) => `${dayName(item)} ${viewDate(new Date(`${item.date}T12:00:00`))}`;
  const hours = (time) => Number(time.slice(0, 2)) + Number(time.slice(3, 5)) / 60;
  const earnings = (job, item) => Math.round(job.pay * (hours(item.end) - hours(item.start)) * 100) / 100;
  const money = (value) => value.toLocaleString('zh-CN');
  const isPast = (item) => new Date(`${item.date}T${item.start}:00`) <= new Date();

  function applicationsFor(jobId) {
    const records = state.applications.filter((item) => item.jobId === jobId);
    if (state.candidate.jobId === jobId) records.unshift(state.candidate);
    return records;
  }

  function remaining(job, item) {
    const hired = applicationsFor(job.id).filter((record) => record.status === 'approved' && shiftKey(record.shift) === shiftKey(item)).length;
    return Math.max(0, item.headcount - hired);
  }

  function card(job) {
    const [categoryIcon, tone] = categoryInfo[job.category];
    const saved = state.favorites.includes(job.id);
    const dates = [...new Set(job.shifts.map(dayName))].join(' / ');
    const slots = job.shifts.reduce((total, item) => total + (isPast(item) ? 0 : remaining(job, item)), 0);
    const distance = job.distance === null ? campuses[job.campus] : `${job.distance.toFixed(1)} km · ${campuses[job.campus]}`;
    return `<article class="job-card">
      <div class="job-card-top">
        <div class="job-identity">
          <span class="job-icon tone-${tone}">${icon(categoryIcon)}</span>
          <div class="job-company"><strong>${esc(job.merchant)}</strong><span class="job-category">${esc(job.category)}</span></div>
        </div>
        <button type="button" class="icon-button save-button${saved ? ' is-active' : ''}" data-action="favorite" data-id="${esc(job.id)}" aria-pressed="${saved}" aria-label="${saved ? '取消收藏' : '收藏'} ${esc(job.title)}" title="${saved ? '取消收藏' : '收藏岗位'}">${icon('heart')}</button>
      </div>
      <div class="job-card-heading"><h3>${esc(job.title)}</h3><span class="job-pay"><strong>¥${money(job.pay)}</strong><small>/ 小时</small></span></div>
      <div class="job-meta"><span>${icon('map')}${esc(distance)}</span><span>${icon('calendar')}${dates}</span></div>
      <div class="job-tags"><span class="job-tag settlement-tag">${esc(job.settlement)}</span>${job.tags.map((tag) => `<span class="job-tag">${esc(tag)}</span>`).join('')}</div>
      <div class="job-card-footer"><span class="job-slots">${isClosed(job.id) ? '已停止招募' : slots ? `还招 ${slots} 人` : '暂无可报班次'}</span><button type="button" class="button button-small" data-action="detail" data-id="${esc(job.id)}">查看岗位 ${icon('arrow')}</button></div>
    </article>`;
  }

  function emptyState(symbol, title, text, button = '') {
    return `<div class="empty-state"><span class="empty-icon">${icon(symbol)}</span><h3>${title}</h3><p>${text}</p>${button}</div>`;
  }

  const browseButton = '<button type="button" class="button button-primary" data-view-target="jobs">看看附近兼职</button>';

  function renderJobs() {
    const campus = $('campus').value;
    const day = $('day').value;
    const settlement = $('settlement').value;
    const sort = $('sort').value;
    const keywords = $('search').value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    const results = allJobs().filter((job) => {
      const query = [job.title, job.merchant, job.category, job.address, campuses[job.campus], ...job.tags].join(' ').toLocaleLowerCase();
      return !isClosed(job.id)
        && (campus === 'xia-sha' || campus === job.campus)
        && (category === 'all' || category === job.category)
        && job.shifts.some((item) => !isPast(item) && (day === 'all' || shiftDay(item) === day))
        && (settlement === 'all' || settlement === job.settlement)
        && keywords.every((word) => query.includes(word));
    });
    if (sort === 'pay') results.sort((a, b) => b.pay - a.pay);
    if (sort === 'distance') results.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    $('job-count').textContent = `找到 ${results.length} 个岗位`;
    $('job-list').innerHTML = results.map(card).join('') || emptyState('search', '这组条件下暂时没有岗位', '试试换个关键词、扩大校区范围，或清除筛选。', '<button type="button" class="button button-primary" data-action="reset-filters">清除筛选</button>');
    for (const button of document.querySelectorAll('[data-category]')) {
      const active = button.dataset.category === category;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active);
    }
  }

  function renderFavorites() {
    const savedJobs = state.favorites.map(getJob).filter(Boolean);
    $('favorite-list').innerHTML = savedJobs.map(card).join('') || emptyState('heart', '还没有收藏岗位', '点击岗位卡片的爱心，感兴趣的兼职就会出现在这里。', browseButton);
  }

  function statusChip(status) {
    return `<span class="status-chip status-${status}">${statusLabels[status]}</span>`;
  }

  function renderApplications() {
    $('application-list').innerHTML = state.applications.map((record) => `
      <article class="record-card">
        <div class="record-main"><div class="record-heading"><h3>${esc(record.title)}</h3>${statusChip(record.status)}</div>
          <p>${esc(record.merchant)}</p>
          <div class="job-meta"><span>${icon('calendar')}${shiftDate(record.shift)} · ${esc(record.shift.start)}–${esc(record.shift.end)}</span><span>${icon('wallet')}预计 ¥${money(record.earnings)} · ${esc(record.settlement)}</span></div>
        </div>
        <div class="record-actions"><button type="button" class="button button-small" data-action="detail" data-id="${esc(record.jobId)}">岗位详情</button>
          ${isActiveApplication(record) ? `<button type="button" class="button button-small button-secondary" data-action="cancel" data-id="${esc(record.id)}">撤回报名</button>` : ''}</div>
      </article>`).join('') || emptyState('bag', '还没有报名记录', '选择合适的周末班次报名，商家的确认结果会显示在这里。', browseButton);
  }

  function renderMerchant() {
    $('merchant-list').innerHTML = allJobs().filter((job) => job.owned).map((job) => {
      const records = applicationsFor(job.id);
      const currentRecords = records.filter((record) => job.shifts.some((item) => shiftKey(item) === shiftKey(record.shift)));
      const pending = currentRecords.filter((record) => record.status === 'pending').length;
      const approved = currentRecords.filter((record) => record.status === 'approved').length;
      const capacity = job.shifts.reduce((total, item) => total + item.headcount, 0);
      const closed = isClosed(job.id);
      const expired = job.shifts.every(isPast);
      return `<article class="record-card"><div class="record-main">
        <div class="record-heading"><h3>${esc(job.title)}</h3><span class="status-chip ${closed || expired ? 'status-cancelled' : 'status-approved'}">${closed ? '已关闭' : expired ? '班次已开始' : '招募中'}</span></div>
        <p>${esc(job.merchant)} · ${esc(campuses[job.campus])}</p>
        <div class="job-meta"><span>${icon('user')}待确认 ${pending} 人</span><span>${icon('check')}已录用 ${approved} / ${capacity} 人</span></div>
      </div><div class="record-actions">
        <button type="button" class="button button-small" data-action="manage" data-id="${esc(job.id)}">管理报名</button>
        ${expired ? '' : `<button type="button" class="button button-small button-secondary" data-action="toggle-job" data-id="${esc(job.id)}">${closed ? '恢复招募' : '关闭招募'}</button>`}
      </div></article>`;
    }).join('');
  }

  function renderAll() {
    renderJobs();
    renderFavorites();
    renderApplications();
    renderMerchant();
  }

  function showView(view, { focus = false } = {}) {
    currentView = validViews.includes(view) ? view : 'jobs';
    for (const section of document.querySelectorAll('[data-view]')) section.hidden = section.dataset.view !== currentView;
    for (const button of document.querySelectorAll('[data-view-target]')) {
      if (!button.closest('nav')) continue;
      const active = button.dataset.viewTarget === currentView;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
    if (focus) {
      const heading = document.querySelector(`[data-view="${currentView}"] h1, [data-view="${currentView}"] h2`);
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  function navigate(view) {
    if (!validViews.includes(view)) return;
    if (location.hash !== `#${view}`) history.pushState(null, '', `#${view}`);
    showView(view, { focus: true });
  }

  function dialogHeader(label, title) {
    return `<div class="dialog-header"><div><p class="dialog-eyebrow">${esc(label)}</p><h2 id="dialog-title">${esc(title)}</h2></div><button type="button" class="icon-button dialog-close" data-close aria-label="关闭弹窗">${icon('close')}</button></div>`;
  }

  function displayJobDialog(content, trigger) {
    const dialog = $('job-dialog');
    $('job-dialog-content').innerHTML = content;
    if (!dialog.open) {
      dialogTrigger = trigger;
      dialog.showModal();
    }
  }

  function showDetail(job, trigger) {
    openDetail = job.id;
    const shiftOptions = job.shifts.map((item) => {
      const existing = state.applications.some((record) => record.jobId === job.id && shiftKey(record.shift) === shiftKey(item) && isActiveApplication(record));
      const seats = remaining(job, item);
      const reason = existing ? '已报名' : isClosed(job.id) ? '已停止招募' : isPast(item) ? '班次已开始' : !seats ? '已招满' : '';
      return `<label class="shift-choice${reason ? ' is-disabled' : ''}"><input type="radio" name="shift" value="${shiftKey(item)}" required ${reason ? 'disabled' : ''}>
        <span><strong>${shiftDate(item)} · ${esc(item.start)}–${esc(item.end)}</strong><small>预计 ¥${money(earnings(job, item))} · ${reason || `剩余 ${seats} 个名额`}</small></span>
      </label>`;
    }).join('');
    const canApply = !isClosed(job.id) && job.shifts.some((item) => !isPast(item) && remaining(job, item) && !state.applications.some((record) => record.jobId === job.id && shiftKey(record.shift) === shiftKey(item) && isActiveApplication(record)));
    displayJobDialog(`${dialogHeader(`${job.category} / ${job.merchant}`, job.title)}
      <form id="apply-form" data-job-id="${esc(job.id)}">
        <div class="dialog-body">
          <div class="detail-facts"><span>${icon('map')}${esc(job.address)}</span><span>${icon('wallet')}¥${money(job.pay)}/小时 · ${esc(job.settlement)}</span></div>
          <h3>工作内容</h3><p class="job-description">${esc(job.description)}</p>
          <fieldset class="shift-list"><legend>选择班次</legend>${shiftOptions}</fieldset>
          <p class="dialog-note">${icon('shield')}演示岗位。实际兼职前请确认工作内容和结算方式，拒绝预缴费用。</p>
          <p id="apply-error" class="form-error" role="alert" hidden></p>
        </div>
        <div class="dialog-footer"><button type="button" class="button button-secondary" data-close>返回</button><button type="submit" class="button button-primary" ${canApply ? '' : 'disabled'}>确认报名 ${icon('arrow')}</button></div>
      </form>`, trigger);
    const firstShift = $('apply-form').querySelector('input:not(:disabled)');
    if (firstShift) firstShift.checked = true;
  }

  function showManage(job, trigger) {
    openDetail = null;
    const applicants = applicationsFor(job.id).map((record) => `<article class="record-row">
      <div><div class="record-heading"><strong>${esc(record.applicant || '当前演示学生')}</strong>${statusChip(record.status)}</div><p>${shiftDate(record.shift)} · ${esc(record.shift.start)}–${esc(record.shift.end)}</p></div>
      ${record.status === 'pending' ? `<div class="record-actions"><button type="button" class="button button-small button-secondary" data-action="review" data-result="declined" data-id="${esc(record.id)}" data-job-id="${esc(job.id)}">婉拒</button><button type="button" class="button button-primary button-small" data-action="review" data-result="approved" data-id="${esc(record.id)}" data-job-id="${esc(job.id)}">录用</button></div>` : ''}
    </article>`).join('');
    displayJobDialog(`${dialogHeader('商家工作台 / 报名管理', job.title)}
      <div class="dialog-body"><p class="dialog-note">录用结果会即时出现在同一浏览器的学生报名页。</p><p id="review-error" class="form-error" role="alert" hidden></p>
        ${applicants || emptyState('user', '还没有学生报名', '岗位发布后可以在学生视图体验报名。')}
      </div><div class="dialog-footer"><button type="button" class="button button-secondary" data-close>关闭</button></div>`, trigger);
  }

  function showFormError(id, text) {
    const error = $(id);
    error.textContent = text;
    error.hidden = false;
  }

  function apply(form) {
    const job = getJob(form.dataset.jobId);
    const key = new FormData(form).get('shift');
    const item = job?.shifts.find((choice) => shiftKey(choice) === key);
    if (!item) return;
    if (isClosed(job.id) || isPast(item) || !remaining(job, item)) {
      showFormError('apply-error', '该班次暂时无法报名，请选择其他班次。');
      return;
    }
    const conflict = state.applications.find((record) => isActiveApplication(record)
      && record.shift.date === item.date && item.start < record.shift.end && item.end > record.shift.start);
    if (conflict) {
      showFormError('apply-error', `与已报名的「${conflict.title}」时间重叠。可在「我的报名」撤回原班次，或选择其他班次。`);
      return;
    }
    state.applications.unshift({ id: uniqueId(), jobId: job.id, title: job.title, merchant: job.merchant, shift: item, earnings: earnings(job, item), settlement: job.settlement, status: 'pending' });
    persist();
    $('job-dialog').close();
    renderAll();
    navigate('applications');
    notify('报名已提交，可在这里查看确认进度。');
  }

  function uniqueId() {
    return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function publish(form) {
    const values = Object.fromEntries(new FormData(form));
    const title = values.title.trim();
    const merchant = values.merchant.trim();
    const address = values.address.trim();
    const description = values.description.trim();
    if (!title || !merchant || !address || !description) {
      notify('请填写岗位、商家、地点和工作说明。');
      const blank = ['title', 'merchant', 'address', 'description'].find((name) => !values[name].trim());
      form.elements.namedItem(blank).focus();
      return;
    }
    if (values.end <= values.start) {
      const end = form.elements.namedItem('end');
      end.setCustomValidity('结束时间必须晚于开始时间。');
      end.reportValidity();
      return;
    }
    const item = shift(values.day, values.start, values.end, Number(values.headcount));
    if (isPast(item)) {
      const start = form.elements.namedItem('start');
      start.setCustomValidity('请选择尚未开始的班次。');
      start.reportValidity();
      return;
    }
    state.published.unshift({
      id: uniqueId(), title, merchant, address, description, pay: Number(values.pay), category: values.category, campus: values.campus,
      distance: null, settlement: values.settlement, tags: ['商家新发布'], shifts: [item], owned: true,
    });
    persist();
    $('publish-dialog').close();
    form.reset();
    renderAll();
    navigate('merchant');
    notify('岗位已发布，切换到找兼职可查看。');
  }

  function review(button) {
    const job = getJob(button.dataset.jobId);
    const record = job && applicationsFor(job.id).find((item) => item.id === button.dataset.id);
    if (!record || record.status !== 'pending') return;
    const result = button.dataset.result;
    if (result === 'approved') {
      const item = job.shifts.find((option) => shiftKey(option) === shiftKey(record.shift));
      if (isClosed(job.id)) {
        showFormError('review-error', '请先恢复招募，再录用学生。');
        return;
      }
      if (!item || isPast(item) || !remaining(job, item)) {
        showFormError('review-error', '这个班次已满、已开始或已过期。');
        return;
      }
    }
    record.status = result;
    persist();
    renderAll();
    showManage(job);
    $('job-dialog').querySelector('[data-close]').focus();
    notify(result === 'approved' ? '已录用，学生报名状态已更新。' : '已处理，学生报名状态已更新。');
  }

  function resetFilters() {
    category = 'all';
    $('search').value = '';
    $('campus').value = 'xia-sha';
    $('day').value = 'all';
    $('settlement').value = 'all';
    $('sort').value = 'recommended';
    renderJobs();
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('a.skip-link')) {
      event.preventDefault();
      $('main-content').focus();
      return;
    }
    const button = event.target.closest('button');
    if (!button) return;
    if ('close' in button.dataset) {
      button.closest('dialog')?.close();
      return;
    }
    if (button.dataset.viewTarget) {
      navigate(button.dataset.viewTarget);
      return;
    }
    if (button.dataset.category) {
      category = button.dataset.category;
      renderJobs();
      return;
    }
    const { action, id } = button.dataset;
    switch (action) {
      case 'detail': {
        const job = getJob(id);
        if (job) showDetail(job, button);
        break;
      }
      case 'favorite': {
        const saved = state.favorites.includes(id);
        state.favorites = saved ? state.favorites.filter((item) => item !== id) : [id, ...state.favorites];
        persist();
        renderJobs();
        renderFavorites();
        const replacement = document.querySelector(`[data-view="${currentView}"] [data-action="favorite"][data-id="${CSS.escape(id)}"]`);
        replacement?.focus({ preventScroll: true });
        notify(saved ? '已取消收藏' : '已收藏岗位');
        break;
      }
      case 'cancel': {
        const record = state.applications.find((item) => item.id === id);
        if (!record || !isActiveApplication(record)) break;
        record.status = 'cancelled';
        persist();
        renderAll();
        document.querySelector(`[data-view="applications"] [data-action="detail"][data-id="${CSS.escape(record.jobId)}"]`)?.focus({ preventScroll: true });
        notify('报名已撤回');
        break;
      }
      case 'publish':
        $('publish-dialog').showModal();
        break;
      case 'manage': {
        const job = getJob(id);
        if (job?.owned) showManage(job, button);
        break;
      }
      case 'review':
        review(button);
        break;
      case 'toggle-job': {
        const job = getJob(id);
        if (!job?.owned) break;
        const closed = isClosed(id);
        state.closed = closed ? state.closed.filter((item) => item !== id) : [...state.closed, id];
        persist();
        renderAll();
        $('merchant-list').querySelector(`[data-action="toggle-job"][data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
        notify(closed ? '已恢复招募' : '已关闭招募');
        break;
      }
      case 'reset-filters':
        resetFilters();
        $('search').focus({ preventScroll: true });
        break;
      default:
        break;
    }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.id === 'search-form') {
      event.preventDefault();
      renderJobs();
    }
    if (form.id === 'apply-form') {
      event.preventDefault();
      apply(form);
    }
    if (form.id === 'publish-form') {
      event.preventDefault();
      publish(form);
    }
  });

  $('publish-form').addEventListener('input', () => {
    $('publish-form').elements.namedItem('end').setCustomValidity('');
    $('publish-form').elements.namedItem('start').setCustomValidity('');
  });
  $('search').addEventListener('input', renderJobs);
  for (const id of ['campus', 'day', 'settlement', 'sort']) $(id).addEventListener('change', renderJobs);
  for (const dialog of [$('job-dialog'), $('publish-dialog')]) {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  }
  $('job-dialog').addEventListener('close', () => {
    if (dialogTrigger?.isConnected) dialogTrigger.focus({ preventScroll: true });
    dialogTrigger = null;
    openDetail = null;
  });
  window.addEventListener('popstate', () => showView(location.hash.slice(1)));
  window.addEventListener('hashchange', () => showView(location.hash.slice(1)));
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    Object.assign(state, readState());
    renderAll();
    if (openDetail && $('job-dialog').open) {
      const job = getJob(openDetail);
      if (job) showDetail(job);
      else $('job-dialog').close();
    }
  });

  $('weekend-dates').textContent = `${viewDate(weekend.sat)} – ${viewDate(weekend.sun)}`;
  for (const option of $('publish-form').elements.namedItem('day').options) {
    option.textContent = `${option.value === 'sat' ? '周六' : '周日'} ${viewDate(weekend[option.value])}`;
  }
  renderAll();
  showView(location.hash.slice(1));
})();
