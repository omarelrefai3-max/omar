(() => {
  const questions = window.ZAIN_QUESTIONS || [];
  const STORAGE_KEY = 'zain-teacher-review-20-v1';
  const clean = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const byId = id => document.getElementById(id);
  const labels = {accept:'صالح كما هو',revise:'يحتاج تعديلًا',reject:'استبعاد',easy:'سهل',medium:'متوسط',hard:'صعب',indirect:'غير مباشر'};
  let state;
  try { state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { state = {}; }
  if (!state || typeof state !== 'object') state = {};
  state.answers ||= {};
  state.meeting ||= {};
  let selected = questions.find(q => location.hash === `#q${q.id}`)?.id || '01';
  let filter = 'all';
  let query = '';
  let revealed = false;

  const record = id => (state.answers[id] ||= {});
  function persist() {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      byId('saveIndicator').textContent = `محفوظ على هذا المتصفح · ${new Date().toLocaleTimeString('ar-EG',{hour:'numeric',minute:'2-digit'})}`;
    } catch {
      byId('saveIndicator').textContent = 'تعذّر الحفظ هنا — نزّل ملف الأحكام الآن';
    }
  }
  function question() { return questions.find(q => q.id === selected) || questions[0]; }
  function radio(name, choices, value) {
    return `<div class="radio-grid">${choices.map(([v,t]) => `<label><input type="radio" name="${name}" value="${v}" ${value === v ? 'checked' : ''}>${t}</label>`).join('')}</div>`;
  }
  function textarea(name, value, placeholder='') {
    return `<textarea name="${name}" placeholder="${clean(placeholder)}">${clean(value)}</textarea>`;
  }
  function select(name, choices, value) {
    return `<select name="${name}"><option value="">لم يُحكم بعد</option>${choices.map(([v,t])=>`<option value="${v}" ${value===v?'selected':''}>${t}</option>`).join('')}</select>`;
  }
  function field(title, body, note='') { return `<div class="field"><span>${title}</span>${body}${note?`<small>${note}</small>`:''}</div>`; }

  function renderList() {
    const visible = questions.filter(q => {
      const r = state.answers[q.id] || {};
      const text = `${q.id} ${q.stem} ${q.aim} ${q.evidenceId}`.toLowerCase();
      if (query && !text.includes(query)) return false;
      if (filter === 'pending' && r.status) return false;
      if (filter === 'issue' && !['revise','reject'].includes(r.status)) return false;
      if (filter === 'done' && !r.status) return false;
      return true;
    });
    byId('queueCount').textContent = `${visible.length}`;
    byId('questionList').innerHTML = visible.map(q => {
      const r = state.answers[q.id] || {};
      const status = r.status ? labels[r.status] : 'لم يُراجع';
      const statusClass = ['revise','reject'].includes(r.status) ? 'issue' : r.status ? 'done' : '';
      return `<button type="button" class="q-item ${q.id===selected?'active':''}" data-q="${q.id}" aria-current="${q.id===selected?'true':'false'}"><div class="q-item-head"><span>س ${Number(q.id).toLocaleString('ar-EG')}</span><span class="status ${statusClass}">${status}</span></div><p>${clean(q.stem || 'حالة نقص الدليل — لا يوجد سؤال مولّد')}</p></button>`;
    }).join('') || '<p class="aim">لا توجد أسئلة مطابقة للبحث.</p>';
  }
  function renderCounters() {
    const all = questions.slice(0,19).map(q => state.answers[q.id] || {});
    const done = all.filter(r => r.status).length;
    byId('progressNum').textContent = `${done.toLocaleString('ar-EG')}/١٩`;
    byId('progressRing').style.background = `conic-gradient(var(--mint) ${done/19*100}%, var(--panel) 0)`;
    byId('easyCount').textContent = all.filter(r => r.teacherLabel==='easy').length.toLocaleString('ar-EG');
    byId('mediumCount').textContent = all.filter(r => r.teacherLabel==='medium').length.toLocaleString('ar-EG');
    byId('hardCount').textContent = all.filter(r => r.teacherLabel==='hard').length.toLocaleString('ar-EG');
    byId('indirectCount').textContent = all.filter(r => r.teacherLabel==='indirect' || r.indirect==='yes').length.toLocaleString('ar-EG');
    byId('issueCount').textContent = all.filter(r => ['revise','reject'].includes(r.status)).length.toLocaleString('ar-EG');
  }
  function renderQuestion() {
    const q=question();
    byId('questionIndex').textContent=`سؤال ${Number(q.id).toLocaleString('ar-EG')}`;
    byId('evidenceId').textContent=q.evidenceId;
    byId('requestedLevel').textContent=`المطلوب: ${q.requested || 'غير محدد'}`;
    byId('questionAim').textContent=q.aim;
    if (q.stem) {
      byId('questionContent').innerHTML=`<h2 id="questionTitle">${clean(q.stem)}</h2><div class="option-list">${q.options.map(o=>`<div class="option"><b>${o.code}</b><span>${clean(o.text)}</span></div>`).join('')}</div><div class="evidence"><h3>المقتطف الذي وصل إلى أسترا</h3><p>${clean(q.evidence)}</p></div><div class="answer-toggle"><button id="revealBtn" class="button quiet" type="button">${revealed?'إخفاء المفتاح والتفسير':'إظهار مفتاح أسترا وتفسيره بعد الحكم'}</button></div>${revealed?`<div class="answer-box"><strong>مفتاح أسترا المقترح: ${clean(q.key)} · تصنيفه: ${clean(q.astraLevel)}</strong><p>هذه اقتراحات الموديل، وليست تصحيحًا رسميًا.</p><ul>${q.options.map(o=>`<li><b>${o.code}</b> — ${clean(q.explanations[o.code] || 'لا يوجد تفسير')}</li>`).join('')}</ul></div>`:''}`;
    } else {
      byId('questionContent').innerHTML=`<h2 id="questionTitle">لم يُنشأ سؤال في المهمة ٢٠</h2><p class="aim">طلبنا تمييز النشاط العسكري عن وسائل مدنية، لكن المقتطف المرسل لم يذكر نشاطًا عسكريًا. هذه حالة لتقييم قرار الامتناع وتصميم التكليف، لا سؤالًا يُصنَّف سهلًا أو صعبًا.</p><div class="evidence"><h3>المقتطف الذي وصل إلى أسترا</h3><p>${clean(q.evidence)}</p></div><div class="answer-toggle"><button id="revealBtn" class="button quiet" type="button">${revealed?'إخفاء رد أسترا':'إظهار سبب امتناع أسترا'}</button></div>${revealed?`<div class="answer-box"><p>${clean(q.refusal)}</p></div>`:''}`;
    }
    const idx=questions.findIndex(x=>x.id===selected);
    byId('prevBtn').disabled=idx===0;
    byId('nextBtn').disabled=idx===questions.length-1;
  }
  function renderForm() {
    const q=question(), r=record(q.id);
    const common=field('الحكم النهائي على الحالة',radio('status',[['accept',q.stem?'صالح كما هو':'الامتناع مبرر'],['revise','يحتاج تعديلًا'],['reject','استبعاد']],r.status),'لا نعتمد جودة السؤال قبل التأكد من المفتاح والدليل.');
    if (!q.stem) {
      byId('reviewForm').innerHTML=common+field('هل كان الدليل كافيًا لبناء السؤال المطلوب؟',radio('sourceEnough',[['yes','نعم'],['no','لا'],['unsure','غير واضح']],r.sourceEnough))+field('ما الذي ينبغي تغييره في التكليف أو الدليل؟',textarea('editText',r.editText,'اكتب الدليل أو المهمة البديلة المطلوبة'))+field('نصّ توضيح المدرّس',textarea('teacherQuote',r.teacherQuote,'سجّل التفسير كما قاله'));
      return;
    }
    const quick=`${common}
      ${field('تصنيف المدرّس الأصلي',select('teacherLabel',[['easy','سهل'],['medium','متوسط'],['hard','صعب'],['indirect','غير مباشر']],r.teacherLabel),'نسجّل الأربع درجات كما استخدمها المدرّس، ثم نفصل الصعوبة عن طريقة عرض السؤال أدناه.')}
      ${field('الصعوبة الفعلية',radio('difficulty',[['easy','سهل'],['medium','متوسط'],['hard','صعب']],r.difficulty))}
      ${field('هل السؤال غير مباشر؟',radio('indirect',[['yes','نعم'],['no','لا'],['unsure','غير واضح']],r.indirect))}
      ${field('ليه المستوى ده؟',textarea('difficultyWhy',r.difficultyWhy,'إيه المعرفة أو الخطوة الذهنية المطلوبة من الطالب؟'))}
      ${field('هل المفتاح المقترح هو الإجابة الأدق الوحيدة؟',radio('keyVerdict',[['single','نعم، إجابة واحدة'],['alternative','في إجابة ثانية مقبولة'],['wrong','المفتاح خطأ'],['unknown','يحتاج توثيقًا']],r.keyVerdict))}
      ${field('هل طالب غير مذاكر يقدر يحله بالفهلوة؟',radio('leak',[['yes','نعم'],['no','لا'],['unsure','غير واضح']],r.leak))}
      ${field('تقدير المدرّس: كم طالبًا قد يجيب صح؟',select('estimatedCorrect',[['over80','أكثر من ٨٠٪'],['50to80','من ٥٠٪ إلى ٨٠٪'],['under50','أقل من ٥٠٪'],['unsure','لا أستطيع التقدير']],r.estimatedCorrect),'توقع تقريبي من خبرة المدرّس مع طلاب المستوى المعتاد، وليس نسبة مقاسة من إجابات طلاب.')}
      ${field('هل يشبه أسئلة الوزارة؟',radio('ministrySimilarity',[['yes','نعم'],['close','قريب'],['no','لا'],['unsure','غير واضح']],r.ministrySimilarity))}
      ${field('لماذا يشبه أسئلة الوزارة أو يختلف عنها؟',textarea('ministryWhy',r.ministryWhy,'مثال: طول الجذع، طريقة السؤال، قوة البدائل، أو المهارة المطلوبة'))}
      ${field('طول السؤال والبدائل',radio('lengthVerdict',[['short','قصير'],['appropriate','مناسب'],['long','طويل']],r.lengthVerdict),'انطباع أولي؛ سنضبط معيار الطول لاحقًا بعد تحليل تدريبات الوزارة.')}
      ${field('ثقة المدرّس في حكمه',radio('confidence',[['confident','واثق'],['uncertain','متردد']],r.confidence),'لو متردد، وضّح سبب التردد في خانة الحكم أو المتابعة.')}
      ${field('سبب الحكم أو أهم تعديل مطلوب',textarea('decisionWhy',r.decisionWhy,'اشرح لماذا اعتمدته أو ما الذي منع اعتماده'))}`;
    const leakTypes=[['echo','صدى لفظي'],['outlier','فئة أو اتجاه مختلف'],['length','المفتاح الأطول / الأشمل'],['implausible','مشتتات مستبعدة'],['duplicate','بديلان بنفس المعنى'],['other','سبب آخر']];
    const deep=`<details class="review-details" ${r.status==='revise'||r.status==='reject'?'open':''}><summary>تشخيص البدائل والتعديل المقترح</summary>
      ${field('نوع التسريب إن وجد',`<div class="check-grid">${leakTypes.map(([v,t])=>`<label><input type="checkbox" name="leakTypes" value="${v}" ${(r.leakTypes||[]).includes(v)?'checked':''}>${t}</label>`).join('')}</div>`)}
      ${field('ما المفتاح الذي يرجّحه المدرّس؟',select('teacherKey',[['A','أ'],['B','ب'],['C','ج'],['D','د']],r.teacherKey),'اختيار المدرّس مستقل عن مفتاح أسترا المخفي.')}
      ${field('هل الدليل الذي وصل للموديل كافٍ وصحيح؟',radio('evidenceVerdict',[['yes','نعم'],['partial','جزئيًا'],['no','لا']],r.evidenceVerdict))}
      ${q.options.map(o=>{const d=(r.options||{})[o.code]||{};return `<div class="option-review"><b>البديل ${o.code}</b><small>${clean(o.text)}</small>${select(`option-${o.code}-rating`,[['strong','مشتت معقول'],['weak','ضعيف / مكشوف'],['second','إجابة ثانية ممكنة'],['key','الإجابة الصحيحة']],d.rating)}${textarea(`option-${o.code}-why`,d.why,'ليه الطالب يختاره؟ وليه يقبله أو يستبعده المدرّس؟')}</div>`}).join('')}
      ${field('الصياغة المعدّلة حرفيًا',textarea('editText',r.editText,'اكتب الجذع والبدائل بعد التصحيح، أو فكرة التعديل لو الوقت ضيق'))}
      ${field('نسخة المدرّس المعدّلة كاملة — اختاروا ٢–٣ أسئلة فقط',textarea('teacherRewrite',r.teacherRewrite,'اكتب السؤال المعدّل، البدائل الأربعة، المفتاح، ولماذا صار أفضل'),'اتركها فارغة في بقية الأسئلة. هذه صياغة المدرّس وليست مجرد فكرة تعديل.')}
      ${field('جملة مفيدة من شرح المدرّس',textarea('teacherQuote',r.teacherQuote,'سجّل سببًا يمكن أن يتحول لقاعدة أو مثال تدريب'))}
      ${field('متابعة أو مصدر مطلوب',textarea('followUp',r.followUp,'صفحة منهج، سؤال وزارة مماثل، أو نقطة محتاجة تحقق'))}
    </details>`;
    byId('reviewForm').innerHTML=quick+deep;
  }
  function render() { renderCounters(); renderList(); renderQuestion(); renderForm(); }
  function navigate(id) { if (!questions.some(q=>q.id===id)) return; selected=id; revealed=false; history.replaceState(null,'',`#q${id}`); render(); window.scrollTo({top:0,behavior:'smooth'}); }

  byId('questionList').addEventListener('click',e=>{const b=e.target.closest('[data-q]');if(b)navigate(b.dataset.q)});
  byId('filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;for(const x of byId('filters').querySelectorAll('button'))x.classList.toggle('active',x===b);renderList()});
  byId('searchInput').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();renderList()});
  byId('questionContent').addEventListener('click',e=>{if(e.target.id==='revealBtn'){revealed=!revealed;renderQuestion()}});
  byId('prevBtn').addEventListener('click',()=>navigate(questions[questions.findIndex(q=>q.id===selected)-1]?.id));
  byId('nextBtn').addEventListener('click',()=>navigate(questions[questions.findIndex(q=>q.id===selected)+1]?.id));
  function formChanged(e){const t=e.target;if(!t.name)return;const r=record(selected);if(t.name==='leakTypes'){r.leakTypes=[...byId('reviewForm').querySelectorAll('[name=leakTypes]:checked')].map(x=>x.value)}else if(t.name.startsWith('option-')){const [,code,field]=t.name.split('-');r.options||={};r.options[code]||={};r.options[code][field]=t.value}else{r[t.name]=t.value}persist();renderCounters();renderList()}
  byId('reviewForm').addEventListener('input',formChanged);
  byId('reviewForm').addEventListener('change',formChanged);

  function exportData(){const payload={format:'zain-teacher-review-20',version:1,exportedAt:new Date().toISOString(),source:'astra-replication-20x10-01',answers:state.answers,meeting:state.meeting};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`zain-teacher-review-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  byId('exportBtn').addEventListener('click',exportData);byId('exportAgain').addEventListener('click',exportData);
  byId('importBtn').addEventListener('click',()=>byId('importFile').click());
  byId('importFile').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());if(data.format!=='zain-teacher-review-20'||!data.answers||typeof data.answers!=='object')throw Error('صيغة الملف مختلفة');if(!confirm('استيراد الأحكام سيستبدل ملاحظات هذا المتصفح. هل نزّلت نسخة منها؟'))return;state={answers:data.answers,meeting:data.meeting||{}};persist();render();alert('تم استيراد الأحكام بنجاح.')}catch(err){alert(`تعذّر الاستيراد: ${err.message}`)}e.target.value=''});

  const meetingFields=[
    ['layerDefinitions','تعريف سهل / متوسط / صعب / غير مباشر، وعلامة كل طبقة'],
    ['hardExample','مثالان رسميان من الوزارة على السؤال الصعب، مع المصدر وسبب التصنيف'],
    ['indirectExample','مثالان رسميان من الوزارة على السؤال غير المباشر، مع المصدر وسبب التصنيف'],
    ['layerMix','النسبة التقريبية لكل طبقة في الامتحان الفعلي؛ ولو غير معروف اكتب غير معروف'],
    ['layerOrder','هل الطبقات موزعة بالتساوي أم بنمط أو ترتيب معين؟ وما ملاحظتك؟'],
    ['teacherRules','قاعدة أو معيار عام قاله المدرّس'],
    ['meetingNext','ما الذي نعدّله في نظام توليد الأسئلة بعد الجلسة؟']
  ];
  function renderSummary(){byId('meetingFields').innerHTML=meetingFields.map(([name,title])=>field(title,textarea(`meeting-${name}`,state.meeting[name]||''))).join('');byId('summaryList').innerHTML=questions.map(q=>{const r=state.answers[q.id]||{};return `<div class="summary-item"><strong>س ${Number(q.id).toLocaleString('ar-EG')}</strong> · ${clean(labels[r.status]||'لم يُراجع')} · ${clean(labels[r.teacherLabel]||'بلا مستوى')}<br>${clean(r.decisionWhy||'')}</div>`}).join('')}
  byId('meetingFields').addEventListener('input',e=>{if(e.target.name?.startsWith('meeting-')){state.meeting[e.target.name.slice(8)]=e.target.value;persist()}});
  byId('summaryBtn').addEventListener('click',()=>{renderSummary();byId('summaryDialog').showModal()});
  byId('closeSummary').addEventListener('click',()=>byId('summaryDialog').close());
  render();
})();
