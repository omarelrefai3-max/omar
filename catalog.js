(() => {
  const subjects=[
    {id:'history',name:'التاريخ',batches:[{id:'01',title:'الدفعة الأولى',source:'astra-replication-20x10-01',storage:'zain-teacher-review-20-v1',questions:window.ZAIN_QUESTIONS}]},
    {id:'english',name:'الإنجليزي',batches:[{id:'01',title:'الدفعة الأولى',source:'english-pilot-05-flex-run-01',storage:'zain-review:english:01',questions:window.ZAIN_ENGLISH_01}]}
  ];
  const params=new URLSearchParams(location.search),subject=subjects.find(s=>s.id===params.get('subject'))||subjects[0],batch=subject.batches.find(b=>b.id===params.get('batch'))||subject.batches[0];
  const url=(s,b)=>'?subject='+encodeURIComponent(s)+'&batch='+encodeURIComponent(b);
  window.ZAIN_ACTIVE={...batch,subject:subject.id,name:subject.name,english:subject.id==='english'};
  const nav=document.getElementById('subjects');nav.innerHTML='<strong>مكتبة المراجعة</strong>'+subjects.map(s=>'<a '+(s===subject?'aria-current="page"':'')+' href="'+url(s.id,s.batches[0].id)+'">'+s.name+'<small>دفعات الأسئلة</small></a>').join('')+'<label for="batch">اختر الدفعة</label><select id="batch">'+subject.batches.map(b=>'<option value="'+b.id+'" '+(b===batch?'selected':'')+'>'+b.title+'</option>').join('')+'</select>';
  document.getElementById('batch').onchange=e=>location.assign(url(subject.id,e.target.value));
  document.title='زين | '+subject.name+' · '+batch.title;
  document.querySelector('.brand small').textContent='مراجعة الأسئلة حسب المادة';
  document.querySelector('.intro>.eyebrow').textContent=subject.name+' · '+batch.title;
  document.querySelector('.guide-card').open=false;
  if(window.ZAIN_ACTIVE.english){
    document.body.classList.add('english-mode');
    document.querySelector('.intro-row h1').textContent='الإنجليزي | أسئلة الدفعة الأولى';
    document.querySelector('.intro-row p').textContent='٢٠ سؤالًا بنسخة الطالب الأصلية. اقرأ السؤال، وسجّل رأيك قبل فتح المفتاح المقترح.';
    document.querySelector('.form-intro').textContent='ابدأ بانطباعك وسببه. تفاصيل المراجعة اختيارية.';
    document.querySelector('#summaryDialog>p').textContent='سجّل ملاحظات الجلسة، ثم نزّل نسخة الأحكام لحفظها أو نقلها إلى جهاز آخر.';
    document.querySelector('#searchInput').placeholder='ابحث برقم السؤال أو نصه…';
  }
})();
