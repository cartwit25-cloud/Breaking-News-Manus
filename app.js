/**
 * Breaking News - Frontend Application
 * 
 * Architecture:
 * - On page load: fetch from GAS (which reads Google Sheet cache)
 * - Quick Refresh: call GAS with ?action=refresh_quick (adds up to 5 new items)
 * - Full Refresh: call GAS with ?action=refresh_full (re-fetches all 20)
 * - Settings: store GAS URL in localStorage
 */

// ============================================================
// STATE
// ============================================================
const STATE = {
  gasUrl: '',
  allNews: [],
  currentTab: 'all',
  lastUpdated: null,
  lastSync: null,
  isLoading: false
};

// ============================================================
// DEMO DATA (shown when no GAS URL is configured, for preview)
// ============================================================
const DEMO_NEWS = [
  {
    title: "US-China Trade Tensions Escalate as New Tariffs Take Effect",
    summary: "The United States has imposed sweeping new tariffs on Chinese goods, prompting Beijing to announce retaliatory measures. Markets reacted sharply as investors weighed the potential impact on global supply chains and economic growth.",
    whyItMatters: "可能引發全球貿易秩序重組，影響通膨與供應鏈穩定",
    impact: "🔴",
    source: "Reuters",
    link: "https://reuters.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 2 * 3600000)),
    category: "💰 Economy / 金融市場"
  },
  {
    title: "Israel-Gaza Ceasefire Talks Resume in Cairo with New Proposal",
    summary: "Mediators from Egypt and Qatar have presented a revised ceasefire framework to both Israeli and Hamas negotiators. The proposal includes a phased hostage release and a temporary halt to military operations in Gaza.",
    whyItMatters: "地緣政治風險升溫，可能牽動能源市場與區域穩定",
    impact: "🔴",
    source: "BBC",
    link: "https://bbc.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 4 * 3600000)),
    category: "⚔️ Conflict / 戰爭衝突"
  },
  {
    title: "Federal Reserve Signals Possible Rate Cut in Q3 Amid Cooling Inflation",
    summary: "Fed Chair Jerome Powell indicated that the central bank may begin reducing interest rates as early as the third quarter, citing easing inflation pressures and a resilient labor market. Markets rallied on the news.",
    whyItMatters: "降息預期將影響全球資本流向與新興市場匯率",
    impact: "🔴",
    source: "Bloomberg",
    link: "https://bloomberg.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 6 * 3600000)),
    category: "💰 Economy / 金融市場"
  },
  {
    title: "OpenAI Launches GPT-5 with Multimodal Reasoning Capabilities",
    summary: "OpenAI has unveiled GPT-5, its most advanced language model to date, featuring enhanced multimodal reasoning and real-time web access. The release intensifies competition with Google Gemini and Anthropic Claude.",
    whyItMatters: "AI競爭格局可能重洗，推動企業加速採用AI技術",
    impact: "🟡",
    source: "The Guardian",
    link: "https://theguardian.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 8 * 3600000)),
    category: "🧠 Tech / AI / 科技"
  },
  {
    title: "Ukraine Receives New Western Military Aid Package Worth $3.5 Billion",
    summary: "A coalition of Western nations has approved a fresh military assistance package for Ukraine, including advanced air defense systems and artillery ammunition. The announcement comes ahead of a planned NATO summit.",
    whyItMatters: "俄烏戰爭持續升溫，歐洲安全格局面臨長期考驗",
    impact: "🔴",
    source: "AP",
    link: "https://apnews.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 10 * 3600000)),
    category: "⚔️ Conflict / 戰爭衝突"
  },
  {
    title: "EU Reaches Agreement on New Carbon Border Adjustment Mechanism",
    summary: "European Union member states have finalized the implementation rules for the Carbon Border Adjustment Mechanism (CBAM), which will impose carbon costs on imports from countries with weaker climate policies.",
    whyItMatters: "歐盟碳關稅將改變全球貿易規則，影響出口導向經濟體",
    impact: "🟡",
    source: "Financial Times",
    link: "https://ft.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 12 * 3600000)),
    category: "📊 Macro / 全球趨勢"
  },
  {
    title: "India Surpasses China as World's Most Populous Nation, UN Reports",
    summary: "The United Nations has confirmed that India has officially surpassed China as the world's most populous country, with a population exceeding 1.44 billion. Analysts say this demographic shift will reshape global economic dynamics.",
    whyItMatters: "人口結構轉變將重塑亞洲地緣政治與全球勞動力市場",
    impact: "🟡",
    source: "NYT",
    link: "https://nytimes.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 14 * 3600000)),
    category: "📊 Macro / 全球趨勢"
  },
  {
    title: "TSMC Announces $40 Billion Expansion in Arizona Amid Chip Demand Surge",
    summary: "Taiwan Semiconductor Manufacturing Company has announced a major expansion of its Arizona facilities, investing $40 billion to build additional fabrication plants. The move is part of a broader effort to diversify semiconductor production.",
    whyItMatters: "半導體供應鏈重組加速，美中科技脫鉤趨勢持續",
    impact: "🟡",
    source: "WSJ",
    link: "https://wsj.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 16 * 3600000)),
    category: "🧠 Tech / AI / 科技"
  },
  {
    title: "Global Debt Hits Record $313 Trillion, IMF Warns of Systemic Risks",
    summary: "The International Monetary Fund has warned that global debt has reached a record $313 trillion, raising concerns about financial stability. Emerging markets are particularly vulnerable as borrowing costs remain elevated.",
    whyItMatters: "全球債務風險可能引發金融市場動盪，新興市場首當其衝",
    impact: "🔴",
    source: "The Economist",
    link: "https://economist.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 18 * 3600000)),
    category: "💰 Economy / 金融市場"
  },
  {
    title: "North Korea Conducts Largest-Ever ICBM Test, Raising Regional Tensions",
    summary: "North Korea has launched an intercontinental ballistic missile that flew for over 70 minutes before landing in the Sea of Japan. The test, condemned by South Korea, Japan, and the US, marks a significant escalation.",
    whyItMatters: "東北亞安全局勢惡化，美日韓同盟面臨新壓力測試",
    impact: "🔴",
    source: "Washington Post",
    link: "https://washingtonpost.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 20 * 3600000)),
    category: "⚔️ Conflict / 戰爭衝突"
  },
  {
    title: "WHO Declares New Mpox Strain a Public Health Emergency of International Concern",
    summary: "The World Health Organization has declared a new, more transmissible strain of mpox a public health emergency of international concern. Cases have been reported in over 30 countries, prompting calls for accelerated vaccine distribution.",
    whyItMatters: "新型病毒威脅全球公衛體系，可能影響旅遊與供應鏈",
    impact: "🔴",
    source: "CNN",
    link: "https://cnn.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 22 * 3600000)),
    category: "📊 Macro / 全球趨勢"
  },
  {
    title: "UK General Election: Labour Wins Landslide Victory, Ending 14 Years of Tory Rule",
    summary: "The Labour Party has won a decisive majority in the UK general election, with Keir Starmer set to become Prime Minister. The result marks the most significant political shift in Britain in over a decade.",
    whyItMatters: "英國政治轉向將影響歐英關係與財政政策走向",
    impact: "🟡",
    source: "BBC",
    link: "https://bbc.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 24 * 3600000)),
    category: "🌍 Geo / 國際政治"
  },
  {
    title: "Microsoft Acquires AI Startup for $2.5 Billion to Boost Copilot Capabilities",
    summary: "Microsoft has announced the acquisition of an AI startup specializing in enterprise automation for $2.5 billion. The deal is expected to significantly enhance Microsoft Copilot's capabilities for business users.",
    whyItMatters: "企業AI競爭白熱化，科技巨頭加速整合AI能力",
    impact: "🟡",
    source: "Bloomberg",
    link: "https://bloomberg.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 26 * 3600000)),
    category: "🧠 Tech / AI / 科技"
  },
  {
    title: "Saudi Arabia and Iran Restore Full Diplomatic Relations in Beijing-Brokered Deal",
    summary: "Saudi Arabia and Iran have formally restored full diplomatic relations following months of Chinese-mediated negotiations. Ambassadors have been exchanged and embassies reopened, marking a historic shift in Middle East geopolitics.",
    whyItMatters: "中東外交格局重塑，中國影響力擴大，美國主導地位受挑戰",
    impact: "🔴",
    source: "Reuters",
    link: "https://reuters.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 28 * 3600000)),
    category: "🌍 Geo / 國際政治"
  },
  {
    title: "Amazon Announces 18,000 Job Cuts in Alexa and Cloud Divisions",
    summary: "Amazon has announced plans to lay off approximately 18,000 employees across its Alexa voice assistant and cloud computing divisions. The cuts reflect a broader industry trend of cost optimization amid slowing growth.",
    whyItMatters: "科技業裁員潮持續，反映AI轉型對傳統職位的衝擊",
    impact: "🟡",
    source: "WSJ",
    link: "https://wsj.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 30 * 3600000)),
    category: "🧠 Tech / AI / 科技"
  },
  {
    title: "G7 Nations Agree on New Framework to Regulate AI Development",
    summary: "Leaders of the G7 nations have endorsed a new international framework for artificial intelligence governance, focusing on transparency, safety testing, and preventing misuse. The agreement is seen as a stepping stone toward binding global AI regulations.",
    whyItMatters: "AI監管框架成形，將影響全球科技公司的開發策略",
    impact: "🟡",
    source: "Deutsche Welle",
    link: "https://dw.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 32 * 3600000)),
    category: "🌍 Geo / 國際政治"
  },
  {
    title: "Oil Prices Surge 8% as OPEC+ Announces Surprise Production Cuts",
    summary: "Crude oil prices jumped sharply after OPEC+ announced unexpected production cuts of 1.5 million barrels per day. The decision caught markets off guard and raised concerns about inflationary pressures globally.",
    whyItMatters: "油價飆升將推升通膨，影響各國央行貨幣政策決策",
    impact: "🔴",
    source: "Financial Times",
    link: "https://ft.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 34 * 3600000)),
    category: "💰 Economy / 金融市場"
  },
  {
    title: "Climate Summit Reaches Historic Agreement on Fossil Fuel Phase-Out",
    summary: "Nations at the UN Climate Summit have agreed to a historic deal calling for a transition away from fossil fuels. The agreement, while non-binding, represents the first time a global climate accord has explicitly addressed fossil fuel phase-out.",
    whyItMatters: "能源轉型加速，化石燃料產業面臨長期結構性挑戰",
    impact: "🟡",
    source: "The Guardian",
    link: "https://theguardian.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 36 * 3600000)),
    category: "📊 Macro / 全球趨勢"
  },
  {
    title: "Japan's Nikkei Hits 40,000 for First Time in 34 Years",
    summary: "Japan's Nikkei 225 index surpassed the 40,000 mark for the first time since 1990, driven by strong corporate earnings, a weak yen, and renewed foreign investor interest. The milestone marks a symbolic recovery for Japan's equity market.",
    whyItMatters: "日本股市創歷史新高，反映日本經濟結構性改革成效",
    impact: "🟡",
    source: "Bloomberg",
    link: "https://bloomberg.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 38 * 3600000)),
    category: "💰 Economy / 金融市場"
  },
  {
    title: "SpaceX Starship Completes First Successful Orbital Test Flight",
    summary: "SpaceX's Starship rocket has successfully completed its first full orbital test flight, with both the Super Heavy booster and the Starship upper stage performing as planned. The milestone brings humanity closer to Mars missions.",
    whyItMatters: "太空探索新里程碑，商業太空競賽進入新階段",
    impact: "⚪",
    source: "NYT",
    link: "https://nytimes.com",
    pubDate: formatRelativeTime(new Date(Date.now() - 40 * 3600000)),
    category: "🧠 Tech / AI / 科技"
  }
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function formatRelativeTime(date) {
  if (!date || isNaN(date)) return '—';
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '剛剛';
  if (minutes < 60) return `${minutes} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

function formatDateTime(date) {
  if (!date || isNaN(date)) return '—';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

function getImpactClass(impact) {
  if (impact === '🔴') return 'high';
  if (impact === '🟡') return 'mid';
  return 'low';
}

function getImpactLabel(impact) {
  if (impact === '🔴') return '🔴 高影響';
  if (impact === '🟡') return '🟡 中影響';
  return '⚪ 低影響';
}

// ============================================================
// SETTINGS
// ============================================================
function openSettings() {
  const modal = document.getElementById('settings-modal');
  const input = document.getElementById('gas-url-input');
  input.value = STATE.gasUrl || '';
  modal.classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
}

function saveGasUrl() {
  const input = document.getElementById('gas-url-input');
  const url = input.value.trim();
  if (!url) {
    showToast('請輸入有效的 GAS 網址', 'error');
    return;
  }
  if (!url.startsWith('https://script.google.com')) {
    showToast('網址格式不正確，請確認是 GAS 部署網址', 'error');
    return;
  }
  STATE.gasUrl = url;
  localStorage.setItem('gasUrl', url);
  closeSettings();
  showToast('✅ 設定已儲存，正在載入新聞...', 'success');
  loadNews();
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================
// DATA LOADING
// ============================================================
async function loadNews() {
  if (!STATE.gasUrl) {
    // Show demo data if no GAS URL configured
    showNoConfig();
    return;
  }

  showLoading();

  try {
    // Fetch from GAS (reads Google Sheet cache, no action = just read)
    const url = `${STATE.gasUrl}?action=read&t=${Date.now()}`;
    const response = await fetchWithCors(url);
    
    if (response && response.status === 'success' && response.data && response.data.length > 0) {
      STATE.allNews = response.data;
      STATE.lastSync = new Date(response.lastUpdated || Date.now());
      STATE.lastUpdated = new Date();
      updateTimestamps();
      renderAll();
      showMain();
    } else {
      // No data in sheet yet, trigger a full refresh
      showToast('📡 首次載入，正在抓取新聞...', 'info');
      await doRefresh('full');
    }
  } catch (err) {
    console.error('Load error:', err);
    // Fall back to demo data
    showToast('⚠️ 無法連接後端，顯示示範資料', 'error');
    STATE.allNews = DEMO_NEWS;
    STATE.lastSync = new Date();
    STATE.lastUpdated = new Date();
    updateTimestamps();
    renderAll();
    showMain();
  }
}

async function fetchWithCors(url) {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow'
  });
  const text = await response.text();
  return JSON.parse(text);
}

// ============================================================
// REFRESH
// ============================================================
async function doRefresh(mode) {
  if (STATE.isLoading) return;

  if (!STATE.gasUrl) {
    openSettings();
    return;
  }

  STATE.isLoading = true;
  const btnId = mode === 'quick' ? 'btn-quick' : 'btn-full';
  const btn = document.getElementById(btnId);
  btn.disabled = true;
  btn.classList.add('loading');

  const action = mode === 'quick' ? 'refresh_quick' : 'refresh_full';
  const label = mode === 'quick' ? 'Quick Refresh' : 'Full Refresh';
  showToast(`🔄 ${label} 進行中...`, 'info');

  try {
    const url = `${STATE.gasUrl}?action=${action}&t=${Date.now()}`;
    const response = await fetchWithCors(url);

    if (response && response.status === 'success' && response.data) {
      const prevCount = STATE.allNews.length;
      STATE.allNews = response.data;
      STATE.lastSync = new Date(response.lastUpdated || Date.now());
      STATE.lastUpdated = new Date();
      updateTimestamps();
      renderAll();
      showMain();

      const newCount = STATE.allNews.length - prevCount;
      if (mode === 'quick') {
        showToast(`✅ Quick Refresh 完成，新增 ${Math.max(0, newCount)} 則新聞`, 'success');
      } else {
        showToast(`✅ Full Refresh 完成，共 ${STATE.allNews.length} 則新聞`, 'success');
      }
    } else {
      showToast('⚠️ 更新失敗，請稍後再試', 'error');
    }
  } catch (err) {
    console.error('Refresh error:', err);
    showToast('❌ 連線錯誤，請檢查 GAS 網址設定', 'error');
  } finally {
    STATE.isLoading = false;
    btn.disabled = false;
    btn.classList.remove('loading');
  }
}

// ============================================================
// RENDER
// ============================================================
function renderAll() {
  renderTopHeadlines();
  renderTrending();
  renderNewsGrid(STATE.currentTab);
}

function renderTopHeadlines() {
  const container = document.getElementById('top-headlines');
  
  // Pick top 3: prioritize high impact
  const highImpact = STATE.allNews.filter(n => n.impact === '🔴');
  const others = STATE.allNews.filter(n => n.impact !== '🔴');
  const top3 = [...highImpact, ...others].slice(0, 3);

  container.innerHTML = top3.map((news, i) => {
    const impactClass = getImpactClass(news.impact);
    const rankClass = `rank-${i + 1}`;
    const isFeatured = i === 0;
    return `
      <div class="top-card impact-${impactClass} ${isFeatured ? 'featured' : ''}">
        <div class="top-card-rank ${rankClass}">${i + 1}</div>
        <div class="card-meta" style="margin-bottom:10px">
          <div class="card-meta-left">
            <span class="impact-badge ${impactClass}">${getImpactLabel(news.impact)}</span>
            <span class="cat-badge">${news.category}</span>
          </div>
          <span class="card-time">${news.pubDate || '—'}</span>
        </div>
        <h3 class="card-title" style="font-size:${isFeatured ? '17px' : '15px'};margin-bottom:10px">${escHtml(news.title)}</h3>
        <p class="card-summary" style="margin-bottom:10px">${escHtml(news.summary)}</p>
        <div class="card-why" style="${isFeatured ? 'background:rgba(255,255,255,0.1);border-left-color:rgba(255,255,255,0.5)' : ''}">
          <span class="why-label">Why it matters</span>
          <span class="why-text">${escHtml(news.whyItMatters)}</span>
        </div>
        <div class="card-footer" style="margin-top:12px;${isFeatured ? 'border-top-color:rgba(255,255,255,0.15)' : ''}">
          <span class="card-source"><span class="source-dot"></span>${escHtml(news.source)}</span>
          <a href="${escHtml(news.link)}" target="_blank" rel="noopener" class="btn-source">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            Source
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function renderTrending() {
  const tagsContainer = document.getElementById('trend-tags');
  const itemsContainer = document.getElementById('trend-items');

  // Generate topic tags from categories
  const catCounts = {};
  STATE.allNews.forEach(n => {
    catCounts[n.category] = (catCounts[n.category] || 0) + 1;
  });

  // Define tag styles
  const tagStyles = {
    '⚔️ Conflict / 戰爭衝突': { class: 'tag-war', emoji: '⚔️', label: '戰爭衝突' },
    '💰 Economy / 金融市場': { class: 'tag-economy', emoji: '💰', label: '金融市場' },
    '🧠 Tech / AI / 科技': { class: 'tag-tech', emoji: '🧠', label: 'AI / 科技' },
    '🌍 Geo / 國際政治': { class: 'tag-politics', emoji: '🌍', label: '國際政治' },
    '📊 Macro / 全球趨勢': { class: 'tag-climate', emoji: '📊', label: '全球趨勢' }
  };

  tagsContainer.innerHTML = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => {
      const style = tagStyles[cat] || { class: 'tag-politics', emoji: '📌', label: cat };
      return `<span class="trend-tag ${style.class}" onclick="switchTabByName('${cat}')">${style.emoji} ${style.label} <strong>${count}</strong></span>`;
    }).join('');

  // Generate 7-day trend items based on high-impact news
  const highImpactNews = STATE.allNews.filter(n => n.impact === '🔴').slice(0, 4);
  const trendTexts = [
    ...highImpactNews.map(n => ({ arrow: '📈', text: `持續追蹤：${n.title.substring(0, 50)}...` })),
    { arrow: '🔥', text: '全球市場對地緣政治風險保持高度警覺' },
    { arrow: '📊', text: 'AI技術競賽持續加速，各大科技公司加碼投入' }
  ].slice(0, 4);

  itemsContainer.innerHTML = trendTexts.map(t => `
    <div class="trend-item">
      <span class="trend-arrow">${t.arrow}</span>
      <span class="trend-text">${escHtml(t.text)}</span>
    </div>
  `).join('');
}

function renderNewsGrid(tab) {
  const container = document.getElementById('news-grid');
  
  let filtered = STATE.allNews;
  if (tab !== 'all') {
    filtered = STATE.allNews.filter(n => n.category === tab);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p class="empty-state-text">此分類目前沒有新聞</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(news => {
    const impactClass = getImpactClass(news.impact);
    return `
      <div class="news-card impact-${impactClass}">
        <div class="card-meta">
          <div class="card-meta-left">
            <span class="impact-badge ${impactClass}">${getImpactLabel(news.impact)}</span>
            <span class="cat-badge">${news.category}</span>
          </div>
          <span class="card-time">${news.pubDate || '—'}</span>
        </div>
        <h3 class="card-title">${escHtml(news.title)}</h3>
        <p class="card-summary">${escHtml(news.summary)}</p>
        <div class="card-why">
          <span class="why-label">Why it matters</span>
          <span class="why-text">${escHtml(news.whyItMatters)}</span>
        </div>
        <div class="card-footer">
          <span class="card-source"><span class="source-dot"></span>${escHtml(news.source)}</span>
          <a href="${escHtml(news.link)}" target="_blank" rel="noopener" class="btn-source">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            Source
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// TABS
// ============================================================
function switchTab(btn, cat) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  STATE.currentTab = cat;
  renderNewsGrid(cat);
}

function switchTabByName(cat) {
  const btn = document.querySelector(`.tab-btn[data-cat="${cat}"]`);
  if (btn) {
    switchTab(btn, cat);
    document.querySelector('.news-section').scrollIntoView({ behavior: 'smooth' });
  }
}

// ============================================================
// SCREEN MANAGEMENT
// ============================================================
function showLoading() {
  document.getElementById('loading-screen').classList.remove('hidden');
  document.getElementById('no-config-screen').classList.add('hidden');
  document.getElementById('main-content').classList.add('hidden');
}

function showNoConfig() {
  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('no-config-screen').classList.remove('hidden');
  document.getElementById('main-content').classList.add('hidden');
}

function showMain() {
  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('no-config-screen').classList.add('hidden');
  document.getElementById('main-content').classList.remove('hidden');
}

// ============================================================
// TIMESTAMPS
// ============================================================
function updateTimestamps() {
  const updEl = document.getElementById('last-updated');
  const syncEl = document.getElementById('last-sync');
  
  if (STATE.lastUpdated) {
    updEl.textContent = formatDateTime(STATE.lastUpdated);
  }
  if (STATE.lastSync) {
    syncEl.textContent = formatDateTime(STATE.lastSync);
  }
}

// ============================================================
// INIT
// ============================================================
function init() {
  // Load saved GAS URL
  STATE.gasUrl = localStorage.getItem('gasUrl') || '';
  
  // Close modal on overlay click
  document.getElementById('settings-modal').addEventListener('click', function(e) {
    if (e.target === this) closeSettings();
  });

  // Load news on startup
  if (STATE.gasUrl) {
    loadNews();
  } else {
    // Show demo data immediately so user can see the UI
    STATE.allNews = DEMO_NEWS;
    STATE.lastSync = new Date();
    STATE.lastUpdated = new Date();
    updateTimestamps();
    renderAll();
    showMain();
    // Show a hint to configure
    setTimeout(() => {
      showToast('💡 點擊右上角 ⚙️ 設定 GAS 網址以載入即時新聞（目前顯示示範資料）', 'info');
    }, 1000);
  }
}

document.addEventListener('DOMContentLoaded', init);
