import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, 
  Clock, 
  BrainCircuit, 
  FileCheck, 
  Settings2, 
  Copy, 
  Trash2, 
  Sparkles, 
  Play,
  Settings,
  ChevronDown,
  RefreshCw,
  UploadCloud
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const TABS = [
  { id: 'decode', label: '岗位解码', icon: <Briefcase size={18} /> },
  { id: 'day', label: '典型一天', icon: <Clock size={18} /> },
  { id: 'skills', label: '技能拆解', icon: <BrainCircuit size={18} /> },
  { id: 'match', label: '简历匹配', icon: <FileCheck size={18} /> },
  { id: 'assess', label: '综合评估', icon: <Settings2 size={18} /> },
];

const DEFAULT_PROMPTS = {
  decode: `你是一位资深求职顾问。请根据以下 JD（岗位描述）原文，用大白话帮用户快速看懂这个岗位。

输出必须严格包含以下5个板块，不可遗漏、不可调换顺序：

【一句话看懂】
用一句不超过30字的大白话总结这个岗位的核心定位。

【要你做的3件事】
提炼出这个岗位最核心的3项工作职责，每项用一句话描述，标号 1) 2) 3)。

【硬门槛 / 可培养 / 加分项】
把 JD 中的要求分为三类：
- 硬门槛：必须具备，不具备直接淘汰
- 可培养：入职后可以学习掌握
- 加分项：有则更好，没有不影响

【黑话翻译 + 例子】
找出 JD 中的行业黑话/缩写/模糊表述，逐条翻译成大白话，并给出实际工作中的例子。

【面试反问3个问题】
基于 JD 内容，推荐3个在面试中可以反问面试官的有深度的问题。

禁忌：
- 不许编造 JD 中没有的信息
- 不许使用鸡汤/空话
- 如果 JD 信息不足以判断某项，请标注【信息不足】`,
  day: `你是一位资深职场顾问。请根据以下 JD（岗位描述）原文，模拟该岗位入职后的"典型一天"和工作节奏。

输出必须严格包含以下6个板块，不可遗漏、不可调换顺序：

【岗位定位】
用2-3句话描述这个岗位在团队/公司中的角色定位。

【一天时间表】
模拟一个典型工作日的时间安排（从上班到下班），格式如：
09:30 → 做什么 → 产出什么
10:30 → 做什么 → 产出什么
...

【一周节奏】
描述一周中不同日子的工作侧重点（如周一对齐、周三评审等）。

【高频任务清单】
按以下5个维度列出高频任务：
- 对齐类：与谁对齐什么
- 分析类：分析什么数据/信息
- 产出类：产出什么文档/方案
- 推进类：推进什么项目/流程
- 复盘类：复盘什么结果/数据

【协作对象与配合方式】
列出该岗位需要日常配合的角色，以及具体配合方式。

【一个月交付样例（5个）】
给出入职第一个月可能需要交付的5个具体成果物。

禁忌：
- 不许编造 JD 中没有的信息
- 模拟内容需合理推断，标注【推测】
- 不许使用鸡汤/空话`,
  skills: `你是一位资深大厂产品专家（PM Leader），擅长从 JD（岗位描述）中嗅出面试官的隐形考核点。请根据用户提供的 JD 和简历，进行深度的“岗位匹配诊断”。
诊断目标
1. 拆解 JD：分析该岗位的底层胜任力模型。
2. 差距诊断：对比简历，明确指出用户的“硬伤”与“薄弱项”。
3. 补齐路径：提供即时可用的补救方案。
输出板块
【第一部分：岗位灵魂拆解】
1. 必备硬技能：列出该岗位必须上手的工具、方法论或行业背景。
2. 核心软素质：分析 JD 背后隐藏的性格/思维偏好（如：抗压能力、架构思维、商业洞察力）。
3. 加分项/护城河：识别出那些能让候选人脱颖而出的差异化亮点。
【第二部分：匹配度红黑榜】
1. 优势对标：简历中哪些经历已经完美 Cover 了 JD 要求？（请列出对标证据）
2. 缺失警示：简历中完全没提到、但 JD 极度看重的模块。
3. 薄弱环节：简历里提到了但描述不深、数据不足、颗粒度太粗的地方。
【第三部分：学习与补齐建议】
1. 简历即时补救：如果用户其实有相关经历但没写好，建议如何挖掘这些素材？
2. 面试话术建议：面对缺失的技能，面试时如何通过“通用能力”或“学习迁移能力”进行侧面化解？
3. 短期突击清单：针对缺失的知识点，推荐具体的学习方向、书籍或实操练习。`,
  match: `你是一位顶级 AI 产品经理专家级别的简历优化顾问。请基于用户提供的 JD 和简历原文，完成一次“针对性重构”。
你的目标：在不捏造事实的前提下，将简历的语言体系转换成 JD 所需的语言体系，并量化成果。
约束条件（优先级最高）
1. 严禁捏造：禁止虚构项目、数据、公司或技能。
2. 纯文本输出：除 {{替换}} 和 {{新增}} 标记外，禁止使用 Markdown 符号（如 #, *, -, __）。
3. 槽位思维：若简历缺乏 JD 要求的关键经历，必须使用 【此处需补充：具体维度】 占位，严禁盲目填充。
4. 语言对齐：深度提取 JD 中的高频词（如“全生命周期”、“增长模型”、“B端架构”）并融入简历。
工作流程
第一步：深度解析 JD，提取 3 个核心胜任力要求。
第二步：重写简历。将用户平铺直叙的描述转化为“动作+对象+工具+结果”的 PM 标准模型。
第三步：按以下格式输出。
===最终可投递版本（含高亮标记）===
输出完整简历。改动部分必须严格遵循以下语法：
• 替换：{{替换|原文：原始文字|理由：对齐JD中XX要求}}优化后的文字{{/替换}}
• 新增：{{新增|理由：补充JD要求的XX能力}}新增的文字{{/新增}}
• 保持未改动部分的原始文本衔接。
===改动汇总===
1. 类型：[替换/新增/删除]
2. 改动内容：简述
3. 对齐JD：对应 JD 中的哪条具体描述
4. 修改逻辑：解释为何该表述更能打动面试官
5. 【建议补充槽位】：若有更高阶的数据或案例，提示用户在此处替换`,
  assess: `你是一位毒舌但专业的资深猎头，请对比 JD 和简历，进行投递ROI（投资回报率）分析。不要说场面话，直接指出该机会的真实价值。
评估要求
1. 批判性视角：重点挖掘简历与 JD 之间的“排异反应”。
2. 决策导向：最终必须给出一个果断的投递决策（投/不投/备选）。
输出板块（言简意赅）
【投递价值评级】
1-5星（基于：薪资溢价可能性、简历匹配度、职业赛道价值）。
【核心亮点】
仅列出 3 点。简历中哪些“杀手锏”能让 HR 眼前一亮？
【潜在风险】
1. 硬伤：如行业跨度、工作年限、关键技能缺失等。
2. 面试雷点：面试官可能会抓着不放的简历漏洞或逻辑断层。
【综合结论】
• 明确建议：[ 立即重仓投递 / 修改后试投 / 放弃（不浪费时间） ]
• 一句话点破：用一句话说明建议的底层逻辑。`
};


const JSON_SCHEMAS = {
  decode: `
{
  "summary": "一句话核心定位",
  "top3": ["第1项职责", "第2项职责", "第3项职责"],
  "requirements": {
    "hard": ["硬门槛1", "硬门槛2"],
    "trainable": ["可培养1"],
    "bonus": ["加分项1"]
  },
  "jargon": [
    { "word": "黑话词", "translation": "大白话翻译", "example": "实际工作例子" }
  ],
  "questions": ["问题1", "问题2", "问题3"]
}`,
  day: `
{
  "role": "2-3句话岗位角色定位",
  "schedule": [
    { "time": "09:30", "task": "具体做什么", "output": "产出什么" }
  ],
  "weekly": ["周一：...", "周三：..."],
  "tasks": [
    { "type": "对齐类", "desc": "与谁对齐什么" },
    { "type": "分析类", "desc": "分析什么" },
    { "type": "产出类", "desc": "产出什么" },
    { "type": "推进类", "desc": "推进什么" },
    { "type": "复盘类", "desc": "复盘什么" }
  ],
  "collaboration": ["角色A：配合方式", "角色B：配合方式"],
  "deliverables": ["成果1", "成果2"]
}`,
  skills: `
{
  "soul": {
    "hard": ["硬技能1", "硬技能2"],
    "soft": "核心软素质描述",
    "bonus": "加分项/护城河描述"
  },
  "redBlack": {
    "advantages": [
      { "title": "优势点", "evidence": "对标证据" }
    ],
    "missing": ["缺失警示1", "缺失警示2"],
    "weak": ["薄弱环节1", "薄弱环节2"]
  },
  "action": {
    "resumeFix": "简历即时补救建议",
    "interviewTalk": "面试侧面化解话术",
    "studyList": ["突击清单1", "突击清单2"]
  }
}`,
  match: `
{
  "finalResume": "包含 {{替换|原文：xxx|理由：yyy}}优化文字{{/替换}} 和 {{新增|理由：yyy}}文字{{/新增}} 和 【此处需补充：xxx】 的完整简历文本",
  "changes": [
    { 
      "type": "替换", 
      "summary": "简述", 
      "alignment": "对应JD哪条描述", 
      "logic": "为何这样写更能打动", 
      "slot": "如果有更高阶的数据，建议在这里补充什么" 
    }
  ]
}`,
  assess: `
{
  "rating": 4,
  "highlights": ["亮点1", "亮点2", "亮点3"],
  "risks": {
    "hardFlaws": "硬伤描述",
    "landmines": "面试雷点描述"
  },
  "conclusion": {
    "decision": "立即重仓投递 / 修改后试投 / 放弃（不浪费时间）",
    "logic": "一句话底层逻辑"
  }
}`
};

function parseMatchResume(text) {
  const finalResume = [];
  const regex = /\{\{(替换|新增)\|(.*?)\}\}(.*?)\{\{\/(?:替换|新增)\}\}|【此处需补充：(.*?)】/g;
  let lastIndex = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      finalResume.push({ type: 'text', content: text.slice(lastIndex, m.index) });
    }
    if (m[0].startsWith('【')) {
      finalResume.push({ type: 'slot', text: m[0] });
    } else {
      const type = m[1] === '替换' ? 'replace' : 'add';
      const attrsStr = m[2]; 
      const content = m[3];
      let old = '', reason = '';
      attrsStr.split('|').forEach(attr => {
        if (attr.startsWith('原文：')) old = attr.replace('原文：', '');
        else if (attr.startsWith('理由：')) reason = attr.replace('理由：', '');
      });
      if (!reason && attrsStr && type === 'add') reason = attrsStr.replace('理由：', ''); 
      finalResume.push({ type, old, reason, new: content });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    finalResume.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return finalResume;
}

function App() {
  const [jdText, setJdText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [activeTab, setActiveTab] = useState('decode');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState({});

  const contentRef = useRef(null);

  // 切换 Tab 时自动滚动到顶部
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Prompt Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [activePromptTab, setActivePromptTab] = useState('decode');
  const [prompts, setPrompts] = useState(() => {
    const saved = localStorage.getItem('jdLensPrompts');
    return saved ? JSON.parse(saved) : DEFAULT_PROMPTS;
  });
  const [editingPrompts, setEditingPrompts] = useState(prompts);

  // LLM API State
  const [apiConfig, setApiConfig] = useState(() => {
    const saved = localStorage.getItem('jdLensApiConfig_v2');
    return saved ? JSON.parse(saved) : {
      baseUrl: 'https://api.aihubmix.com/v1',
      model: 'gpt-4o',
      apiKey: 'sk-F5BvxB4a2K6tkqJ7F8Ae977c22E546F58082Fd648dEd2b8a'
    };
  });
  const [editingApiConfig, setEditingApiConfig] = useState(apiConfig);


  const openModal = () => {
    setEditingPrompts(prompts);
    setActivePromptTab('decode');
    setIsModalOpen(true);
  };

  
  const handleSavePrompts = () => {
    setPrompts(editingPrompts);
    localStorage.setItem('jdLensPrompts', JSON.stringify(editingPrompts));
    setIsModalOpen(false);
  };

  const handleSaveApiConfig = () => {
    setApiConfig(editingApiConfig);
    localStorage.setItem('jdLensApiConfig_v2', JSON.stringify(editingApiConfig));
    setIsApiModalOpen(false);
  };


  const handleResetPrompt = () => {
    if (window.confirm('确定要将当前 Tab 的 Prompt 恢复为系统默认吗？')) {
      setEditingPrompts(prev => ({
        ...prev,
        [activePromptTab]: DEFAULT_PROMPTS[activePromptTab]
      }));
    }
  };

  const handleClear = (type) => {
    if (type === 'jd') setJdText('');
    if (type === 'resume') setResumeText('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsGenerating(true);
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }
        setResumeText(fullText);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.name.endsWith('.docx')
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setResumeText(result.value);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        setResumeText(text);
      } else {
        alert('暂不支持该文件格式，请上传 PDF、Word(docx) 或 TXT 文件。');
      }
    } catch (err) {
      console.error(err);
      alert('解析文件失败，请检查文件格式是否正确或是否已损坏。');
    } finally {
      setIsGenerating(false);
      e.target.value = ''; // Reset input
    }
  };

  
  const handleGenerate = async (type = 'all') => {
    if (!jdText.trim()) return alert('请先粘贴 JD 原文');
    if (activeTab === 'match' && !resumeText.trim()) return alert('请先提供简历进行匹配');

    setIsGenerating(true);

    const tabsToGenerate = type === 'all' ? TABS.map(t => t.id) : [activeTab];
    
    try {
      const newResults = { ...results };
      
      for (const tabId of tabsToGenerate) {
        const systemPrompt = prompts[tabId] + `

【重要系统指令：强制 JSON 输出】
请忽略上述提示词中关于“输出格式（如Markdown等）”的要求。你必须按照上述要求的逻辑进行分析，但最终的输出结果必须是一个严格合法的 JSON 对象，不要包含任何多余文字或 \`\`\`json 代码块。
JSON 数据结构必须严格匹配以下形式：
` + JSON_SCHEMAS[tabId];
        
        const userPrompt = `【JD 原文】
${jdText}

【简历原文】
${resumeText || '（未提供）'}`;
        
        const res = await fetch(`${apiConfig.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.apiKey}`
          },
          body: JSON.stringify({
            model: apiConfig.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
          })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || '请求失败');
        
        const contentStr = data.choices[0].message.content.trim();
        let parsedData;
        try {
          parsedData = JSON.parse(contentStr);
        } catch(e) {
          throw new Error('模型未返回合法的 JSON 格式。返回内容：' + contentStr.slice(0, 100));
        }
        
        if (tabId === 'match') {
          if (typeof parsedData.finalResume === 'string') {
            parsedData.finalResume = parseMatchResume(parsedData.finalResume);
          }
        }
        
        newResults[tabId] = parsedData;
      }
      
      setResults(newResults);
    } catch (err) {
      console.error(err);
      alert(`调用大模型失败：\n${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderContent = () => {
    if (isGenerating) {
      return (
        <div className="empty-state">
          <div className="loading-spinner"></div>
          <p>正在深度解析岗位信息...</p>
        </div>
      );
    }

    const data = results[activeTab];
    if (!data) {
      return (
        <div className="empty-state">
          <Briefcase size={48} opacity={0.2} />
          <p>点击左侧"生成全部"或"仅生成当前Tab"开始解析</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'decode':
        return (
          <div>
            <div className="content-section">
              <h3>一句话看懂</h3>
              <p>{data.summary}</p>
            </div>
            <div className="content-section">
              <h3>要你做的3件事</h3>
              <ul style={{ paddingLeft: 20 }}>
                {data.top3.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div className="content-section">
              <h3>要求拆解</h3>
              <div style={{ marginBottom: 8 }}><strong>硬门槛：</strong><br/> <span style={{color: 'var(--text-muted)'}}>{data.requirements.hard.join(" / ")}</span></div>
              <div style={{ marginBottom: 8 }}><strong>可培养：</strong><br/> <span style={{color: 'var(--text-muted)'}}>{data.requirements.trainable.join(" / ")}</span></div>
              <div><strong>加分项：</strong><br/> <span style={{color: 'var(--text-muted)'}}>{data.requirements.bonus.join(" / ")}</span></div>
            </div>
            <div className="content-section">
              <h3>黑话翻译</h3>
              {data.jargon.map((item, i) => (
                <div key={i} style={{ background: '#fafafa', padding: '12px', borderRadius: 8, marginBottom: 8, borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{item.word}</span> 
                    <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>→</span>
                    <span style={{ fontWeight: 500 }}>{item.translation}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>🌰 例子：{item.example}</div>
                </div>
              ))}
            </div>
            <div className="content-section">
              <h3>面试反问3个问题</h3>
              <ol style={{ paddingLeft: 20 }}>
                {data.questions.map((q, i) => <li key={i}>{q}</li>)}
              </ol>
            </div>
          </div>
        );
      case 'day':
        return (
          <div>
            <div className="content-section">
              <h3>岗位定位</h3>
              <p>{data.role}</p>
            </div>
            <div className="content-section">
              <h3>典型一天时间表</h3>
              {data.schedule.map((item, i) => (
                <div key={i} className="timeline-item">
                  <div className="time">{item.time}</div>
                  <div className="task-content">
                    <strong>{item.task}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>产出：{item.output}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="content-section">
              <h3>一周节奏</h3>
              <ul style={{ paddingLeft: 20 }}>
                {data.weekly.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
            <div className="content-section">
              <h3>高频任务清单</h3>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                {data.tasks.map((t, i) => (
                  <li key={i}>
                    <span style={{ fontWeight: 600 }}>{t.type}：</span>
                    {t.desc}
                  </li>
                ))}
              </ul>
            </div>
            <div className="content-section">
              <h3>协作对象与配合方式</h3>
              <ul style={{ paddingLeft: 20 }}>
                {data.collaboration.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
            <div className="content-section">
              <h3>一个月交付样例（5个）</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {data.deliverables.map((d, i) => (
                  <div key={i} style={{ background: '#f8f9fc', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'skills':
        return (
          <div>
            <div className="content-section">
              <h3>一、岗位灵魂拆解</h3>
              <div style={{ marginBottom: 12 }}>
                <strong>🛠 必备硬技能：</strong>
                <div className="tags-container" style={{ marginTop: 4 }}>
                  {data.soul.hard.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>🧠 核心软素质：</strong>
                <p style={{ marginTop: 4 }}>{data.soul.soft}</p>
              </div>
              <div>
                <strong>🚀 加分项/护城河：</strong>
                <p style={{ marginTop: 4 }}>{data.soul.bonus}</p>
              </div>
            </div>

            <div className="content-section">
              <h3>二、匹配度红黑榜</h3>
              <div style={{ marginBottom: 16 }}>
                <strong style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#15803d' }}></div> 优势对标 (红榜)</strong>
                <ul style={{ paddingLeft: 20, marginTop: 6, lineHeight: 1.6 }}>
                  {data.redBlack.advantages.map((adv, i) => (
                    <li key={i}><strong>{adv.title}</strong>：<span style={{ color: 'var(--text-muted)'}}>{adv.evidence}</span></li>
                  ))}
                </ul>
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#b91c1c' }}></div> 缺失警示 (黑榜)</strong>
                <ul style={{ paddingLeft: 20, marginTop: 6, lineHeight: 1.6 }}>
                  {data.redBlack.missing.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
              <div>
                <strong style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#b45309' }}></div> 薄弱环节 (待强化)</strong>
                <ul style={{ paddingLeft: 20, marginTop: 6, lineHeight: 1.6 }}>
                  {data.redBlack.weak.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>

            <div className="content-section">
              <h3>三、学习与补齐建议</h3>
              <div style={{ background: '#fafafa', padding: 20, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ marginBottom: 16 }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: 4 }}>📝 简历即时补救：</strong>
                  <p>{data.action.resumeFix}</p>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: 4 }}>💬 面试侧面化解话术：</strong>
                  <p style={{ fontStyle: 'italic', color: '#0369a1', background: '#e0f2fe', padding: '12px 16px', borderRadius: 6, borderLeft: '4px solid #0284c7' }}>
                    "{data.action.interviewTalk}"
                  </p>
                </div>
                <div>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: 4 }}>🎯 短期突击清单：</strong>
                  <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                    {data.action.studyList.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      case 'match':
        return (
          <div>
            <div className="content-section">
              <h3>最终可投递版本（智能重构）</h3>
              <div style={{ background: '#fafafa', padding: '20px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {data.finalResume.map((part, i) => {
                  if (part.type === 'replace') {
                    return (
                      <span key={i} className="custom-tooltip-wrapper">
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: 4, margin: '0 2px', borderBottom: '2px dashed #0284c7' }}>
                          {part.new}
                        </span>
                        <div className="custom-tooltip">
                          <div className="tooltip-badge blue">替换</div>
                          <div className="tooltip-text"><span className="tooltip-label">原文：</span>{part.old.replace('原始文字：', '')}</div>
                          <div className="tooltip-text"><span className="tooltip-label">理由：</span>{part.reason}</div>
                        </div>
                      </span>
                    );
                  }
                  if (part.type === 'add') {
                    return (
                      <span key={i} className="custom-tooltip-wrapper">
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: 4, margin: '0 2px', borderBottom: '2px dashed #166534' }}>
                          {part.new}
                        </span>
                        <div className="custom-tooltip">
                          <div className="tooltip-badge green">新增</div>
                          <div className="tooltip-text"><span className="tooltip-label">理由：</span>{part.reason}</div>
                        </div>
                      </span>
                    );
                  }
                  if (part.type === 'slot') {
                    return (
                      <span key={i} style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: 4, margin: '0 2px', fontWeight: 'bold' }}>
                        {part.text}
                      </span>
                    );
                  }
                  return <span key={i}>{part.content}</span>;
                })}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                * 💡 交互提示：鼠标悬浮在<span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0 4px', borderRadius: 2 }}>蓝色(替换)</span>或<span style={{ background: '#dcfce7', color: '#15803d', padding: '0 4px', borderRadius: 2 }}>绿色(新增)</span>虚线文字上，可查看修改理由与原文。
              </p>
            </div>
            
            <div className="content-section">
              <h3>改动汇总</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.changes.map((c, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ 
                        background: c.type === '替换' ? '#e0f2fe' : '#dcfce7', 
                        color: c.type === '替换' ? '#0369a1' : '#15803d', 
                        padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold' 
                      }}>
                        {c.type}
                      </span>
                      <strong style={{ fontSize: 15 }}>{c.summary}</strong>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 500 }}>🎯 对齐JD：</span>{c.alignment}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>💡 修改逻辑：</span>{c.logic}
                    </div>
                    <div style={{ fontSize: 13, color: '#b91c1c', background: '#fef2f2', padding: '6px 10px', borderRadius: 6, marginTop: 12 }}>
                      <strong>📝 建议补充槽位：</strong>{c.slot}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'assess':
        return (
          <div>
            <div className="content-section" style={{ textAlign: 'center', marginBottom: 32 }}>
              <h3 style={{ justifyContent: 'center', marginBottom: 16 }}>投递价值评级 (ROI)</h3>
              <div className="rating-stars" style={{ fontSize: 40, letterSpacing: 8 }}>
                {'★'.repeat(data.rating)}{'☆'.repeat(5 - data.rating)}
              </div>
            </div>
            <div className="content-section">
              <h3 style={{ color: '#15803d' }}>✨ 核心亮点 (杀手锏)</h3>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                {data.highlights.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
            <div className="content-section">
              <h3 style={{ color: '#b91c1c' }}>⚠️ 潜在风险 (毒舌猎头诊断)</h3>
              <div style={{ background: '#fef2f2', padding: 16, borderRadius: 8, border: '1px solid #fecaca' }}>
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: '#b91c1c' }}>⛔️ 硬伤：</strong>
                  <p style={{ marginTop: 4 }}>{data.risks.hardFlaws}</p>
                </div>
                <div>
                  <strong style={{ color: '#b91c1c' }}>💣 面试雷点：</strong>
                  <p style={{ marginTop: 4 }}>{data.risks.landmines}</p>
                </div>
              </div>
            </div>
            <div className="content-section">
              <h3 style={{ color: 'var(--primary)' }}>⚖️ 综合结论</h3>
              <div style={{ background: '#f3f0ff', padding: 20, borderRadius: 8, border: '1px solid #ddd6fe', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--primary)', marginBottom: 12 }}>
                  {data.conclusion.decision}
                </div>
                <div style={{ fontSize: 15, color: 'var(--text-main)', fontStyle: 'italic' }}>
                  "{data.conclusion.logic}"
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <Briefcase size={24} color="var(--primary)" />
          JD Lens
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-icon" style={{ fontSize: 14 }} onClick={() => {
            setEditingApiConfig(apiConfig);
            setIsApiModalOpen(true);
          }}>
            <Sparkles size={16} /> LLM 设置
          </button>
          <button className="btn-icon" style={{ fontSize: 14 }} onClick={openModal}>
            <Settings size={16} /> Prompt 配置
          </button>
        </div>
      </header>

      <main className="main-layout">
        {/* Left Panel */}
        <aside className="left-panel">
          <div className="input-section">
            <div className="input-label">
              <span>JD 原文 (必填)</span>
              <button className="btn-icon" onClick={() => handleClear('jd')}><Trash2 size={14}/> 清空</button>
            </div>
            <textarea 
              className="text-area"
              placeholder="在此粘贴招聘 JD 原文..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />
          </div>

          <div className="input-section">
            <div className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>简历原文 (仅匹配需要)</span>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="upload-btn-wrapper">
                  <button className="btn-icon">
                    <UploadCloud size={14}/> 导入文件
                  </button>
                  <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} />
                </div>
                <button className="btn-icon" onClick={() => handleClear('resume')}><Trash2 size={14}/> 清空</button>
              </div>
            </div>
            <textarea 
              className="text-area small"
              placeholder="在此粘贴简历文本，或点击上方导入 PDF/Word..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>

          <div className="action-buttons">
            <button 
              className="btn-primary" 
              onClick={() => handleGenerate('all')}
              disabled={isGenerating}
            >
              <Sparkles size={18} /> 生成全部
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => handleGenerate('current')}
              disabled={isGenerating}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Play size={18} /> 仅生成当前 Tab
            </button>
          </div>
        </aside>

        {/* Right Panel */}
        <section className="right-panel">
          <div className="tabs">
            {TABS.map(tab => (
              <button 
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="tab-content" ref={contentRef}>
            {renderContent()}
          </div>

          {results[activeTab] && !isGenerating && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 16, background: '#fafafa' }}>
              <button className="btn-icon" style={{ fontSize: 14 }}>
                <Copy size={16} /> 复制输出
              </button>
              <button className="btn-icon" style={{ fontSize: 14 }} onClick={() => handleGenerate('current')}>
                <RefreshCw size={16} /> 重新生成
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Prompt Config Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2><Settings size={20} /> Prompt 配置</h2>
                <p>修改后点保存，下一次生成立即使用最新 Prompt</p>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="modal-tabs">
                {TABS.map(tab => (
                  <button 
                    key={tab.id}
                    className={`modal-tab ${activePromptTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActivePromptTab(tab.id)}
                  >
                    {tab.label} Prompt
                  </button>
                ))}
              </div>
              <textarea 
                className="prompt-textarea"
                value={editingPrompts[activePromptTab]}
                onChange={(e) => setEditingPrompts(prev => ({ ...prev, [activePromptTab]: e.target.value }))}
                placeholder="在这里输入你的自定义 Prompt..."
              />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" style={{ width: 'auto' }} onClick={handleResetPrompt}>
                <RefreshCw size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> 恢复默认
              </button>
              <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={handleSavePrompts}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Config Modal */}
      {isApiModalOpen && (
        <div className="modal-overlay" onClick={() => setIsApiModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2><Sparkles size={20} /> LLM 接口设置</h2>
                <p>配置连接的 AI 模型底层参数</p>
              </div>
              <button className="modal-close" onClick={() => setIsApiModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>API Base URL (接口地址)</label>
                <input className="text-area" style={{ height: 40 }} value={editingApiConfig.baseUrl} onChange={e => setEditingApiConfig({...editingApiConfig, baseUrl: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>模型名称 (Model)</label>
                <input className="text-area" style={{ height: 40 }} value={editingApiConfig.model} onChange={e => setEditingApiConfig({...editingApiConfig, model: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>API Key (密钥)</label>
                <input className="text-area" type="password" style={{ height: 40 }} value={editingApiConfig.apiKey} onChange={e => setEditingApiConfig({...editingApiConfig, apiKey: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
              <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={handleSaveApiConfig}>
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
